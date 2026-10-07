import json
import logging
from typing import Any, Dict, List, Optional
import httpx
from pydantic import ValidationError

from backend.app.config import settings
from backend.app.models.dna import SeedDNA
from backend.app.models.world import WorldCandidate
from backend.app.providers.base import AIProvider
from backend.app.providers.mock_provider import MockProvider

logger = logging.getLogger(__name__)


_UNSET = object()


class GeminiProvider(AIProvider):
    """Google Gemini AI Provider communicating via REST API with strict JSON schema validation.

    Provides automatic, graceful fallback to MockProvider when GEMINI_API_KEY is not configured
    or when API calls encounter network/validation errors.
    """

    FALLBACK_WARNING_MESSAGE = (
        "AI Provider Throttled/Unavailable — Gracefully transitioned to deterministic mock fixtures"
    )

    def __init__(
        self,
        api_key: Any = _UNSET,
        model: Optional[str] = None,
    ):
        self.api_key = settings.GEMINI_API_KEY if api_key is _UNSET else api_key
        self.model = model if model is not None else settings.GEMINI_MODEL
        self._mock_provider = MockProvider()
        self.last_fallback_warning: Optional[str] = None

    async def health_check(self) -> Dict[str, Any]:
        """Perform a liveness and authentication status check."""
        if not self.api_key:
            return {
                "status": "fallback",
                "provider": "gemini",
                "model": f"{self.model} (mock-fallback)",
                "message": "GEMINI_API_KEY is not configured; running in mock fallback mode.",
            }
        return {
            "status": "healthy",
            "provider": "gemini",
            "model": self.model,
            "message": "Gemini API key configured.",
        }

    async def extract_dna(self, seed: str) -> Dict[str, Any]:
        """Extract structured Seed DNA from raw user seed text using Gemini REST API."""
        if not self.api_key:
            logger.info("No Gemini API key configured. Using MockProvider fallback.")
            self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
            mock_res = await self._mock_provider.extract_dna(seed)
            return {
                "raw_seed": seed,
                "seed_dna": mock_res["seed_dna"],
                "model_used": f"{self.model}-mock-fallback",
                "fallback_used": True,
                "warning": self.FALLBACK_WARNING_MESSAGE,
            }

        endpoint_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent"
        )
        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }

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

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(endpoint_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            candidates = data.get("candidates", [])
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
                "model_used": self.model,
                "fallback_used": False,
            }

        except (httpx.HTTPError, json.JSONDecodeError, ValidationError, ValueError, Exception) as exc:
            logger.warning(
                "Gemini API call failed (%s: %s). Falling back gracefully to MockProvider.",
                type(exc).__name__,
                exc,
            )
            self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
            mock_res = await self._mock_provider.extract_dna(seed)
            return {
                "raw_seed": seed,
                "seed_dna": mock_res["seed_dna"],
                "model_used": f"{self.model}-mock-fallback",
                "fallback_used": True,
                "warning": self.FALLBACK_WARNING_MESSAGE,
            }

    async def extract_potential(
        self, seed: str, dna: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Extract explicit, inferred, and open possibilities from seed and DNA using Gemini REST API."""
        if not self.api_key:
            logger.info("No Gemini API key configured. Using MockProvider potential fallback.")
            self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
            return await self._mock_provider.extract_potential(seed, dna)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "system_instruction": {
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

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()

            candidates = data.get("candidates", [])
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

        except (httpx.HTTPError, json.JSONDecodeError, ValidationError, ValueError, Exception) as exc:
            logger.warning(
                "Gemini extract_potential API call failed (%s: %s). Falling back gracefully to MockProvider.",
                type(exc).__name__,
                exc,
            )
            self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
            return await self._mock_provider.extract_potential(seed, dna)

    async def generate_worlds(
        self, dna: Dict[str, Any], potential_items: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Generate exactly three high-contrast candidate worlds based on Seed DNA and Seed Potential items."""
        # 1. Canonical Demo Fixture Determinism (strictly evaluate against immutable raw_seed)
        raw_seed = (dna.get("raw_seed") or "").strip().lower().rstrip(".")
        if raw_seed == "a child discovers a forgotten city beneath the ocean":
            logger.info("Canonical ocean seed detected; deterministically returning canonical demo fixtures.")
            return await self._mock_provider.generate_worlds(dna, potential_items=potential_items)

        # 2. Check API key
        if not self.api_key:
            logger.info("No Gemini API key configured. Using MockProvider fallback for world generation.")
            return await self._mock_provider.generate_worlds(dna, potential_items=potential_items)

        endpoint_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent"
        )
        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }

        # Filter potential items
        accepted = [item["label"] for item in (potential_items or []) if item.get("user_status") == "accepted"]
        rejected = [item["label"] for item in (potential_items or []) if item.get("user_status") == "rejected"]
        open_dilemmas = [item["label"] for item in (potential_items or []) if item.get("category") == "open"]

        guidance_text = (
            f"Seed DNA Specification:\n{json.dumps(dna, indent=2, default=str)}\n\n"
        )
        if accepted:
            guidance_text += f"MANDATORY CREATIVE PILLARS (Creator-Accepted Possibilities - MUST incorporate and highlight):\n" + "\n".join(f"- {a}" for a in accepted) + "\n\n"
        if rejected:
            guidance_text += f"STRICT NEGATIVE CONSTRAINTS (Creator-Rejected Concepts - DO NOT include or evoke):\n" + "\n".join(f"- {r}" for r in rejected) + "\n\n"
        if open_dilemmas:
            guidance_text += f"CATALYTIC DILEMMAS (Open Mysteries - use to inspire candidate dramatic tensions):\n" + "\n".join(f"- {o}" for o in open_dilemmas) + "\n\n"

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
                            "For each candidate, you must generate:\n"
                            "- id: slug ('world-1', 'world-2', 'world-3')\n"
                            "- index: sequence integer (1, 2, 3)\n"
                            "- title: evocative world title\n"
                            "- archetype: genre tag\n"
                            "- concept: 1-2 sentence high-concept premise logline\n"
                            "- aesthetic: visual mood, color palette, lighting, atmosphere\n"
                            "- core_tension: central conflict or systemic crisis\n"
                            "- trade_offs: what this world emphasizes vs sacrifices\n"
                            "- key_visual: signature cinematic image vignette\n"
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

        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                response = await client.post(endpoint_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            candidates = data.get("candidates", [])
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

        except (httpx.HTTPError, json.JSONDecodeError, ValidationError, ValueError, Exception) as exc:
            logger.warning(
                "Gemini generate_worlds call failed (%s: %s). Falling back gracefully to MockProvider.",
                type(exc).__name__,
                exc,
            )
            self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
            return await self._mock_provider.generate_worlds(dna, potential_items=potential_items)

    async def unfold_stage(
        self, stage: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Progressive unfolding stages (delegates to MockProvider)."""
        return await self._mock_provider.unfold_stage(stage, context)

    async def unfold_universe(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Unfold the entire universe (World Bible, Characters, Relationships, Scenes) for the selected world."""
        # 1. Canonical Demo Fixture Determinism (strictly evaluate against immutable raw_seed)
        raw_seed = (context.get("raw_seed") or context.get("seed") or "").strip().lower().rstrip(".")
        if raw_seed == "a child discovers a forgotten city beneath the ocean":
            logger.info("Canonical ocean seed detected; deterministically returning canonical demo fixtures for selected world.")
            return await self._mock_provider.unfold_universe(context)

        # 2. Check API key
        if not self.api_key:
            logger.info("No Gemini API key configured. Using MockProvider fallback for universe unfolding.")
            return await self._mock_provider.unfold_universe(context)

        # 3. Call Gemini if configured, with graceful fallback to MockProvider
        try:
            endpoint_url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{self.model}:generateContent"
            )
            headers = {
                "x-goog-api-key": self.api_key,
                "Content-Type": "application/json",
            }

            system_instruction = (
                "You are an expert world-builder and narrative architect in the Seed Unfold creative engine.\n"
                "Given a Seed DNA, a chosen World Candidate, and creator rationale, expand the world into a 4-layer mini-universe:\n"
                "1. World Bible (geography, physics rules, history timeline, factions, canon facts, key locations with visual prompts, visual style prompt).\n"
                "2. Characters (2 to 4 core cast members grounded in World Bible rules, with archetypes, motivations, conflicts, visual prompts).\n"
                "3. Relationships (socio-emotional dynamics, tension/alliance types between characters).\n"
                "4. Scenes (2 to 3 pivotal narrative scenes with dramatic questions, conflicts, outcomes, and visual prompts).\n"
                "Output strictly a valid JSON object matching the required schema."
            )

            user_prompt = (
                f"SEED: {context.get('seed')}\n"
                f"SEED DNA: {json.dumps(context.get('seed_dna', {}), default=str)}\n"
                f"SELECTED WORLD: {json.dumps(context.get('selected_world', {}), default=str)}\n"
                f"CREATOR RATIONALE: {context.get('creator_rationale') or 'Focus on world depth and dynamic tension'}\n"
            )

            payload = {
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "responseMimeType": "application/json",
                },
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(endpoint_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            part_text = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
            parsed = json.loads(part_text)
            if not isinstance(parsed, dict) or "world_bible" not in parsed:
                raise ValueError("Incomplete or malformed universe JSON from Gemini")

            return parsed

        except Exception as exc:
            logger.warning(
                "Gemini unfold_universe call failed (%s: %s). Falling back gracefully to MockProvider.",
                type(exc).__name__,
                exc,
            )
            self.last_fallback_warning = self.FALLBACK_WARNING_MESSAGE
            res = await self._mock_provider.unfold_universe(context)
            if isinstance(res, dict):
                res["_warning"] = self.FALLBACK_WARNING_MESSAGE
            return res

