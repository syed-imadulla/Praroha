import json
import logging
from typing import Any, Dict, List, Optional
import httpx
from pydantic import ValidationError

from backend.app.config import settings
from backend.app.models.dna import SeedDNA
from backend.app.providers.base import AIProvider
from backend.app.providers.mock_provider import MockProvider

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    """Google Gemini AI Provider communicating via REST API with strict JSON schema validation.

    Provides automatic, graceful fallback to MockProvider when GEMINI_API_KEY is not configured
    or when API calls encounter network/validation errors.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model = model if model is not None else settings.GEMINI_MODEL
        self._mock_provider = MockProvider()

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
            mock_res = await self._mock_provider.extract_dna(seed)
            return {
                "raw_seed": seed,
                "seed_dna": mock_res["seed_dna"],
                "model_used": f"{self.model}-mock-fallback",
                "fallback_used": True,
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
            mock_res = await self._mock_provider.extract_dna(seed)
            return {
                "raw_seed": seed,
                "seed_dna": mock_res["seed_dna"],
                "model_used": f"{self.model}-mock-fallback",
                "fallback_used": True,
            }

    async def generate_worlds(self, dna: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Candidate worlds generation (delegates to MockProvider until Phase 3)."""
        return await self._mock_provider.generate_worlds(dna)

    async def unfold_stage(
        self, stage: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Progressive unfolding stages (delegates to MockProvider until Phase 4)."""
        return await self._mock_provider.unfold_stage(stage, context)
