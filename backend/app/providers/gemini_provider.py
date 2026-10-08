import json
import logging
from typing import Any, Dict, List, Optional
import httpx
from pydantic import ValidationError

from backend.app.config import settings
from backend.app.core.errors import AIProviderError
from backend.app.models.dna import SeedDNA
from backend.app.models.world import WorldCandidate
from backend.app.providers.base import AIProvider
from backend.app.providers.mock_provider import CANONICAL_SEED_POTENTIAL, MockProvider

logger = logging.getLogger(__name__)

_UNSET = object()


class GeminiProvider(AIProvider):
    """Google Gemini AI Provider communicating via REST API with strict JSON schema validation,
    dynamic multi-model failover, and strict production error handling (no silent mock masking).
    """

    FALLBACK_WARNING_MESSAGE = (
        "AI Provider Throttled/Unavailable — Gracefully transitioned to deterministic mock fixtures"
    )

    def __init__(
        self,
        api_key: Any = _UNSET,
        model: Optional[str] = None,
        fallback_models: Optional[List[str]] = None,
        allow_mock_fallback: bool = False,
        is_demo: bool = False,
    ):
        self.api_key = settings.GEMINI_API_KEY if api_key is _UNSET else api_key
        self.model = model if model is not None else settings.GEMINI_MODEL
        self.fallback_models = (
            list(fallback_models)
            if fallback_models is not None
            else list(
                getattr(
                    settings,
                    "GEMINI_FALLBACK_MODELS",
                    ["gemini-3.1-flash-lite"],
                )
            )
        )
        self.allow_mock_fallback = (
            allow_mock_fallback
            or is_demo
            or ("demo" in str(self.api_key or "").lower())
        )
        self.is_demo = is_demo or ("demo" in str(self.api_key or "").lower())
        self._mock_provider = MockProvider()
        self.last_fallback_warning: Optional[str] = None

    async def health_check(self) -> Dict[str, Any]:
        """Perform a liveness and authentication status check."""
        if not self.api_key:
            return {
                "status": "degraded" if not self.allow_mock_fallback else "fallback",
                "provider": "gemini",
                "model": f"{self.model} (no-key)",
                "message": "GEMINI_API_KEY is not configured.",
            }
        return {
            "status": "healthy",
            "provider": "gemini",
            "model": self.model,
            "fallback_models": self.fallback_models,
            "message": "Gemini API key configured.",
        }

    async def _call_gemini_with_failover(
        self,
        payload: Dict[str, Any],
        timeout_primary: float = 16.0,
        timeout_fallback: float = 25.0,
    ) -> Dict[str, Any]:
        """Call Gemini generateContent with resilient failover across primary and fallback models.

        Returns dict: {"data": parsed_json, "model_used": model_name, "fallback_used": bool}
        or dict: {"use_mock": True} if allow_mock_fallback is True.
        Raises AIProviderError on unrecoverable failures when allow_mock_fallback is False.
        """
        if not self.api_key:
            if self.allow_mock_fallback:
                return {"use_mock": True, "model_used": f"{self.model}-mock-fallback"}
            raise AIProviderError(
                message="GEMINI_API_KEY is not configured.",
                error_code="AI_API_KEY_MISSING",
                status_code=503,
                retryable=False,
            )

        models_to_try = [self.model] + [m for m in self.fallback_models if m != self.model]
        last_error: Optional[Exception] = None

        for idx, model_name in enumerate(models_to_try):
            timeout = timeout_primary if idx == 0 else timeout_fallback
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
            headers = {
                "x-goog-api-key": str(self.api_key),
                "Content-Type": "application/json",
            }
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(url, headers=headers, json=payload)

                    if response.status_code in (401, 403):
                        logger.error("Gemini API authentication failed (HTTP %s): %s", response.status_code, response.text)
                        if self.allow_mock_fallback:
                            return {"use_mock": True, "model_used": f"{model_name}-mock-fallback"}
                        raise AIProviderError(
                            message=f"Gemini API authentication failed (HTTP {response.status_code}). Invalid or unauthorized key.",
                            error_code="AI_AUTH_FAILED",
                            status_code=502,
                            retryable=False,
                            details={"status_code": response.status_code, "response": response.text[:200]},
                        )

                    if response.status_code == 400:
                        err_text = response.text
                        logger.warning("Gemini model %s returned 400 Bad Request: %s", model_name, err_text)
                        if "not found" in err_text.lower() or "unsupported" in err_text.lower():
                            last_error = ValueError(f"Model {model_name} unsupported")
                            continue
                        if self.allow_mock_fallback:
                            return {"use_mock": True, "model_used": f"{model_name}-mock-fallback"}
                        raise AIProviderError(
                            message=f"Gemini API Bad Request (HTTP 400): {err_text[:200]}",
                            error_code="AI_BAD_REQUEST",
                            status_code=400,
                            retryable=False,
                        )

                    response.raise_for_status()
                    data = response.json()
                    return {
                        "data": data,
                        "model_used": model_name,
                        "fallback_used": idx > 0,
                    }

            except AIProviderError:
                raise
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Gemini model '%s' failed (%s: %s). Attempting next failover model...",
                    model_name,
                    type(exc).__name__,
                    exc,
                )

        if self.allow_mock_fallback:
            logger.warning(
                "All Gemini models exhausted (%s: %s). Falling back gracefully to MockProvider.",
                models_to_try,
                last_error,
            )
            return {"use_mock": True, "model_used": f"{self.model}-mock-fallback"}

        raise AIProviderError(
            message=f"Gemini AI generation failed across all models ({models_to_try}): {last_error}",
            error_code="AI_GENERATION_FAILED",
            status_code=503,
            retryable=True,
            details={"models_attempted": models_to_try, "last_error": str(last_error)},
        )

    async def extract_dna(self, seed: str) -> Dict[str, Any]:
        """Extract structured Seed DNA from raw user seed text using Gemini REST API."""
        payload = {
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            "You are the Seed Understanding engine for Seed Unfold. Analyze the creative "
                            "seed and distill its semantic intent into structured Seed DNA. Extract: "
                            "premise (distilled core premise), themes (3-5 core themes), entities (core figures, "
                            "places, relics, or systems), constraints (key negative boundaries or creative exclusions), "
                            "tone (emotional atmosphere and aesthetic style), and domain_keywords (5-8 semantic tags). "
                            "Do NOT generate world narratives or story continuations yet; strictly distill semantic DNA."
                        )
                    }
                ]
            },
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"Creative Seed:\n{seed}"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "premise": {"type": "STRING"},
                        "themes": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "entities": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "constraints": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "tone": {"type": "STRING"},
                        "domain_keywords": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                    },
                    "required": [
                        "premise",
                        "themes",
                        "entities",
                        "constraints",
                        "tone",
                        "domain_keywords",
                    ],
                },
            },
        }

        call_res = await self._call_gemini_with_failover(payload)
        if call_res.get("use_mock"):
            self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
            mock_res = await self._mock_provider.extract_dna(seed)
            return {
                "raw_seed": seed,
                "seed_dna": mock_res["seed_dna"],
                "model_used": call_res.get("model_used", f"{self.model}-mock-fallback"),
                "fallback_used": True,
                "warning": self.FALLBACK_WARNING_MESSAGE,
            }

        try:
            candidates = call_res["data"].get("candidates", [])
            if not candidates:
                raise ValueError("No candidates returned from Gemini API")

            part_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not part_text:
                raise ValueError("Empty content text in Gemini candidate part")

            parsed_dna_dict = json.loads(part_text)
            validated_dna = SeedDNA.model_validate(parsed_dna_dict)

            return {
                "raw_seed": seed,
                "seed_dna": validated_dna.model_dump(),
                "model_used": call_res.get("model_used", self.model),
                "fallback_used": call_res.get("fallback_used", False),
            }
        except Exception as exc:
            if self.allow_mock_fallback:
                self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
                mock_res = await self._mock_provider.extract_dna(seed)
                return {
                    "raw_seed": seed,
                    "seed_dna": mock_res["seed_dna"],
                    "model_used": f"{self.model}-mock-fallback",
                    "fallback_used": True,
                    "warning": self.FALLBACK_WARNING_MESSAGE,
                }
            raise AIProviderError(
                message=f"Gemini DNA extraction output parsing failed: {exc}",
                error_code="AI_PARSE_FAILED",
                status_code=502,
                retryable=True,
            )

    async def extract_potential(
        self, seed: str, dna: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Extract explicit, inferred, and open possibilities from seed and DNA using Gemini REST API."""
        # Canonical Demo Fixture Determinism
        normalized = seed.strip().lower().rstrip(".")
        if normalized == "a child discovers a forgotten city beneath the ocean" and self.is_demo:
            return [dict(item) for item in CANONICAL_SEED_POTENTIAL]

        payload = {
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            "You are Seed Unfold's Seed Potential Map extraction engine. "
                            "Analyze the creative seed and its distilled Seed DNA. "
                            "Extract 3 categories of items:\n"
                            "1. 'explicit': Elements, entities, or facts directly stated in the seed.\n"
                            "2. 'inferred': Plausible AI-inferred possibilities and deeper narrative/thematic directions suggested by the seed.\n"
                            "3. 'open': Intriguing open creative questions or mysteries about the world that invite exploration.\n"
                            "Return an array of 8 to 12 items. For each item provide label, category ('explicit'|'inferred'|'open'), "
                            "confidence (0.0 to 1.0), and source_evidence (quote or anchor from seed/DNA)."
                        )
                    }
                ]
            },
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"Seed: {seed}\nSeed DNA: {json.dumps(dna)}"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "label": {"type": "STRING"},
                            "category": {"type": "STRING", "enum": ["explicit", "inferred", "open"]},
                            "confidence": {"type": "NUMBER"},
                            "source_evidence": {"type": "STRING"},
                        },
                        "required": ["label", "category", "confidence", "source_evidence"],
                    },
                },
            },
        }

        call_res = await self._call_gemini_with_failover(payload)
        if call_res.get("use_mock"):
            self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
            return await self._mock_provider.extract_potential(seed, dna)

        try:
            candidates = call_res["data"].get("candidates", [])
            if not candidates:
                raise ValueError("No candidates returned from Gemini API")

            part_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not part_text:
                raise ValueError("Empty content text in Gemini candidate part")

            parsed = json.loads(part_text)
            if not isinstance(parsed, list):
                raise ValueError("Expected JSON array of potential items")

            results = []
            for item in parsed:
                cat = str(item.get("category", "inferred")).lower()
                if cat not in ("explicit", "inferred", "open"):
                    cat = "inferred"
                results.append({
                    "label": str(item.get("label", "")),
                    "category": cat,
                    "confidence": float(item.get("confidence", 0.85)),
                    "source_evidence": str(item.get("source_evidence", "")),
                    "user_status": "pending",
                })
            return results

        except Exception as exc:
            if self.allow_mock_fallback:
                self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
                return await self._mock_provider.extract_potential(seed, dna)
            raise AIProviderError(
                message=f"Gemini potential extraction parsing failed: {exc}",
                error_code="AI_PARSE_FAILED",
                status_code=502,
                retryable=True,
            )

    async def generate_worlds(
        self, dna: Dict[str, Any], potential_items: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Generate exactly three high-contrast candidate worlds based on Seed DNA and Seed Potential items."""
        # 1. Canonical Demo Fixture Determinism (strictly evaluate against immutable raw_seed)
        raw_seed = (dna.get("raw_seed") or "").strip().lower().rstrip(".")
        if raw_seed == "a child discovers a forgotten city beneath the ocean" and self.is_demo:
            logger.info("Canonical ocean seed detected; deterministically returning canonical demo fixtures.")
            return await self._mock_provider.generate_worlds(dna, potential_items=potential_items)

        # Filter potential items
        accepted = [item["label"] for item in (potential_items or []) if item.get("user_status") == "accepted"]
        rejected = [item["label"] for item in (potential_items or []) if item.get("user_status") == "rejected"]
        open_dilemmas = [item["label"] for item in (potential_items or []) if item.get("category") == "open"]

        guidance_text = (
            f"Seed DNA Specification:\n{json.dumps(dna, indent=2, default=str)}\n\n"
        )
        if accepted:
            guidance_text += "MANDATORY CREATIVE PILLARS (Creator-Accepted Possibilities - MUST incorporate and highlight):\n" + "\n".join(f"- {a}" for a in accepted) + "\n\n"
        if rejected:
            guidance_text += "STRICT NEGATIVE CONSTRAINTS (Creator-Rejected Concepts - DO NOT include or evoke):\n" + "\n".join(f"- {r}" for r in rejected) + "\n\n"
        if open_dilemmas:
            guidance_text += "CATALYTIC DILEMMAS (Open Mysteries - use to inspire candidate dramatic tensions):\n" + "\n".join(f"- {o}" for o in open_dilemmas) + "\n\n"

        payload = {
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            "You are the Divergent Worlds Engine for Seed Unfold. Given a Seed DNA specification "
                            "and creator potential choices, generate exactly THREE intentional exploration archetypes (Candidate 1, 2, and 3):\n"
                            "1. Candidate 1 (divergence_archetype: 'familiar'): Grounded, intuitive, direct realization of the premise with high seed fidelity (85-95%) and high feasibility (80-90%).\n"
                            "2. Candidate 2 (divergence_archetype: 'radical'): Transformative leap, symbiotic/ecological mutation with high novelty (85-98%) and moderate-high feasibility (60-75%).\n"
                            "3. Candidate 3 (divergence_archetype: 'inverse'): Conceptual subversion/reversal of core assumptions with extreme conceptual distance (80-95%) and high novelty (75-90%).\n\n"
                            "Use simple, clear, evocative Indian English words so that the world ideas are immediately graspable, relatable, and free of overly pompous jargon.\n"
                            "All three worlds must be clearly connected to the same original seed, while showing three distinct creative possibilities.\n"
                            "For each candidate, you must generate:\n"
                            "- id: slug ('world-1', 'world-2', 'world-3')\n"
                            "- index: sequence integer (1, 2, 3)\n"
                            "- title: evocative world title\n"
                            "- archetype: genre tag\n"
                            "- concept: 1-2 sentence high-concept premise logline in clear, relatable language\n"
                            "- aesthetic: visual mood, color palette, lighting, atmosphere\n"
                            "- core_tension: central conflict or systemic crisis\n"
                            "- trade_offs: what this world emphasizes vs sacrifices\n"
                            "- key_visual: signature cinematic image vignette describing the opening visual\n"
                            "- divergence_archetype: 'familiar' | 'radical' | 'inverse'\n"
                            "- exploration_profile: object with seed_fidelity (0-100), novelty (0-100), conceptual_distance (0-100), feasibility (0-100), and summary (1-sentence rationale)\n"
                            "- emphasized_potential_labels: array of strings naming which accepted potential items this candidate incorporates"
                        )
                    }
                ]
            },
            "contents": [
                {
                    "parts": [
                        {
                            "text": guidance_text
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "id": {"type": "STRING"},
                            "index": {"type": "INTEGER"},
                            "title": {"type": "STRING"},
                            "archetype": {"type": "STRING"},
                            "concept": {"type": "STRING"},
                            "aesthetic": {"type": "STRING"},
                            "core_tension": {"type": "STRING"},
                            "trade_offs": {"type": "STRING"},
                            "key_visual": {"type": "STRING"},
                            "divergence_archetype": {
                                "type": "STRING",
                                "enum": ["familiar", "radical", "inverse"],
                            },
                            "exploration_profile": {
                                "type": "OBJECT",
                                "properties": {
                                    "seed_fidelity": {"type": "INTEGER"},
                                    "novelty": {"type": "INTEGER"},
                                    "conceptual_distance": {"type": "INTEGER"},
                                    "feasibility": {"type": "INTEGER"},
                                    "summary": {"type": "STRING"},
                                    },
                                "required": ["seed_fidelity", "novelty", "conceptual_distance", "feasibility", "summary"],
                            },
                            "emphasized_potential_labels": {
                                "type": "ARRAY",
                                "items": {"type": "STRING"},
                            },
                        },
                        "required": [
                            "id",
                            "index",
                            "title",
                            "archetype",
                            "concept",
                            "aesthetic",
                            "core_tension",
                            "trade_offs",
                            "key_visual",
                            "divergence_archetype",
                            "exploration_profile",
                            "emphasized_potential_labels",
                        ],
                    },
                },
            },
        }

        call_res = await self._call_gemini_with_failover(payload, timeout_primary=20.0, timeout_fallback=28.0)
        if call_res.get("use_mock"):
            self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
            return await self._mock_provider.generate_worlds(dna, potential_items=potential_items)

        try:
            candidates = call_res["data"].get("candidates", [])
            if not candidates:
                raise ValueError("No candidates returned from Gemini API")

            part_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not part_text:
                raise ValueError("Empty content text in Gemini candidate part")

            parsed_list = json.loads(part_text)
            if not isinstance(parsed_list, list) or len(parsed_list) != 3:
                raise ValueError(f"Expected array of exactly 3 world candidates, got {len(parsed_list) if isinstance(parsed_list, list) else type(parsed_list)}")

            validated_candidates: List[Dict[str, Any]] = []
            for idx, item in enumerate(parsed_list, start=1):
                item["index"] = idx
                cand = WorldCandidate.model_validate(item)
                validated_candidates.append(cand.model_dump())

            return validated_candidates

        except Exception as exc:
            if self.allow_mock_fallback:
                self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
                return await self._mock_provider.generate_worlds(dna, potential_items=potential_items)
            raise AIProviderError(
                message=f"Gemini world generation parsing failed: {exc}",
                error_code="AI_PARSE_FAILED",
                status_code=502,
                retryable=True,
            )

    async def unfold_stage(
        self, stage: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Progressive unfolding stages (delegates to MockProvider)."""
        return await self._mock_provider.unfold_stage(stage, context)

    async def unfold_universe(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Unfold the entire universe (World Bible, Characters, Relationships, Scenes) for the selected world."""
        # 1. Canonical Demo Fixture Determinism (strictly evaluate against immutable raw_seed)
        raw_seed = (context.get("raw_seed") or context.get("seed") or "").strip().lower().rstrip(".")
        if raw_seed == "a child discovers a forgotten city beneath the ocean" and self.is_demo:
            logger.info("Canonical ocean seed detected; deterministically returning canonical demo fixtures for selected world.")
            return await self._mock_provider.unfold_universe(context)

        system_instruction = (
            "You are an expert world-builder and narrative architect in the Seed Unfold creative engine.\n"
            "Given a Seed DNA, a chosen World Candidate, and creator rationale, expand the world into a 4-layer mini-universe:\n"
            "1. World Bible:\n"
            "   - geography: physical landscape, biomes, horizons.\n"
            "   - physics_rules: natural laws, magical or technological axioms.\n"
            "   - history_timeline: MUST be an array of objects, each with 'era' (e.g. 'Founding Era', 'Great Awakening') and 'event' (1-2 clear descriptive sentences).\n"
            "   - factions: array of objects with 'name', 'role', and 'agenda'.\n"
            "   - canon_facts: MUST be an array of 3 to 5 clear, evocative lore facts or cosmological rules in simple, vivid Indian English.\n"
            "   - key_locations: array of objects with 'name', 'description', and 'visual_prompt'.\n"
            "   - visual_style_prompt: artistic style and rendering directives.\n"
            "2. Characters (2 to 4 core cast members grounded in World Bible rules, with archetypes, motivations, conflicts, visual_prompts).\n"
            "3. Relationships (socio-emotional dynamics, tension/alliance types between characters).\n"
            "4. Scenes (2 to 3 pivotal narrative scenes: array of objects each with 'scene_number' (integer starting from 1), 'title' (a short, evocative 2-5 word name for the scene, e.g. 'The Shattered Seal' or 'Encounter at the Sunken Spire'), 'location_setting' (clear physical place), 'dramatic_question', 'conflict_narrative', 'pivotal_outcome', and 'visual_prompt' describing the scene's exact visual action and environment).\n"
            "Use simple, direct Indian English wordings that feel relatable and natural, avoiding overly pompous jargon.\n"
            "Strictly adhere to the DECISION DNA CREATIVE CONTRACT if present:\n"
            "- Emphasize mandatory creative priorities across all 4 layers.\n"
            "- Strictly avoid negative guardrails and rejected directions.\n"
            "- Ground all character motivations, lore rules, and scene conflicts in the creator rationale.\n"
            "Output strictly a valid JSON object matching the required schema with keys: 'world_bible', 'characters', 'relationships', 'scenes'."
        )

        contract_text = self.format_decision_dna_contract(context)
        user_prompt = (
            f"SEED: {context.get('seed')}\n"
            f"SEED DNA: {json.dumps(context.get('seed_dna', {}), default=str)}\n"
            f"SELECTED WORLD: {json.dumps(context.get('selected_world', {}), default=str)}\n"
            f"CREATOR RATIONALE: {context.get('creator_rationale') or 'Focus on world depth and dynamic tension'}\n"
        )
        if contract_text:
            user_prompt += f"\n{contract_text}\n"

        payload = {
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "responseMimeType": "application/json",
            },
        }

        call_res = await self._call_gemini_with_failover(payload, timeout_primary=22.0, timeout_fallback=30.0)
        if call_res.get("use_mock"):
            self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
            res = await self._mock_provider.unfold_universe(context)
            if isinstance(res, dict):
                res["_warning"] = self.FALLBACK_WARNING_MESSAGE
            return res

        try:
            candidates = call_res["data"].get("candidates", [])
            if not candidates:
                raise ValueError("No candidates returned from Gemini API")

            part_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not part_text:
                raise ValueError("Empty content text in Gemini candidate part")

            parsed = json.loads(part_text)
            if not isinstance(parsed, dict) or "world_bible" not in parsed:
                raise ValueError("Incomplete or malformed universe JSON from Gemini")

            return parsed

        except Exception as exc:
            if self.allow_mock_fallback:
                self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
                res = await self._mock_provider.unfold_universe(context)
                if isinstance(res, dict):
                    res["_warning"] = self.FALLBACK_WARNING_MESSAGE
                return res
            raise AIProviderError(
                message=f"Gemini universe unfolding parsing failed: {exc}",
                error_code="AI_PARSE_FAILED",
                status_code=502,
                retryable=True,
            )

    async def generate_json(self, system_instruction: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        """Generic JSON generation helper for semantic analysis."""
        payload = {
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
        try:
            call_res = await self._call_gemini_with_failover(payload)
            if call_res.get("use_mock"):
                return None
            part_text = call_res["data"].get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if part_text:
                return json.loads(part_text)
        except Exception as exc:
            logger.warning("generate_json helper failed: %s", exc)
        return None

    @staticmethod
    def format_decision_dna_contract(context: Dict[str, Any]) -> str:
        """Format the DECISION DNA CREATIVE CONTRACT into an explicit LLM instruction block."""
        decision_dna = context.get("decision_dna")
        if not decision_dna:
            return ""

        contract_lines = ["=== DECISION DNA CREATIVE CONTRACT ==="]
        priorities = decision_dna.get("creative_priorities") or []
        if priorities:
            contract_lines.append("1. MANDATORY CREATIVE PRIORITIES:")
            for p in priorities:
                contract_lines.append(f"   - {p}")

        rejected = decision_dna.get("rejected_directions") or []
        if rejected:
            contract_lines.append("2. NEGATIVE GUARDRAILS & REJECTED DIRECTIONS:")
            for r in rejected:
                contract_lines.append(f"   - STRICTLY AVOID: {r}")

        rationale = decision_dna.get("user_rationale") or context.get("creator_rationale")
        directives = decision_dna.get("custom_directives")
        if rationale or directives:
            contract_lines.append("3. CREATOR RATIONALE & DIRECTIVES:")
            if rationale:
                contract_lines.append(f"   - Rationale: {rationale}")
            if directives:
                contract_lines.append(f"   - Directives: {directives}")

        hoz = decision_dna.get("human_only_zones")
        if hoz:
            if hasattr(hoz, "model_dump"):
                hoz_dict = hoz.model_dump()
            elif hasattr(hoz, "dict"):
                hoz_dict = hoz.dict()
            elif isinstance(hoz, dict):
                hoz_dict = hoz
            else:
                hoz_dict = {}

            if hoz_dict.get("is_locked", True) and any([
                hoz_dict.get("core_theme"),
                hoz_dict.get("protagonist_motivation"),
                hoz_dict.get("central_conflict"),
            ]):
                contract_lines.append("\n=== IMMUTABLE HUMAN-ONLY ZONES (CREATOR LOCKS) ===")
                contract_lines.append("The following parameters were locked by the human creator and are INVIOLABLE AXIOMS:")
                if hoz_dict.get("core_theme"):
                    contract_lines.append(f"- CORE THEME: {hoz_dict['core_theme']}")
                if hoz_dict.get("protagonist_motivation"):
                    contract_lines.append(f"- PROTAGONIST MOTIVATION: {hoz_dict['protagonist_motivation']}")
                if hoz_dict.get("central_conflict"):
                    contract_lines.append(f"- CENTRAL CONFLICT: {hoz_dict['central_conflict']}")
                contract_lines.append("STRICT ZERO-OVERRIDE RULE: You MUST construct all world bible lore, character motivations, and narrative beats strictly around these exact anchors. Do NOT alter, soften, replace, or reinterpret these locked principles.")
                contract_lines.append("==================================================")

        contract_lines.append("=======================================")
        return "\n".join(contract_lines)
