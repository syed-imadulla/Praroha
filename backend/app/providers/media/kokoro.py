import hashlib
import logging
import os
from typing import Any, Dict, Optional

import httpx

from backend.app.providers.media.base import (
    MediaPayload,
    ProviderUnavailableError,
    VoiceProvider,
)

logger = logging.getLogger(__name__)


class KokoroVoiceProvider(VoiceProvider):
    """Local Kokoro-82M Voice Provider for Tier 2 fallback inference.

    Features:
    - Connects to local Kokoro inference microservice via KOKORO_ENDPOINT environment variable.
    - If KOKORO_ENDPOINT is unset or unreachable, raises ProviderUnavailableError to trigger cascade.
    - Returns consistent metadata payload: voice_id, persona, resolved_provider="kokoro", duration_sec.
    """

    def __init__(self, endpoint: Optional[str] = None, timeout_sec: float = 15.0) -> None:
        self.endpoint = endpoint or os.getenv("KOKORO_ENDPOINT")
        self.timeout_sec = timeout_sec

    async def generate_voice(
        self,
        text: str,
        voice_id: str = "default",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        if not self.endpoint or (context and context.get("simulate_kokoro_unavailable")):
            raise ProviderUnavailableError("KOKORO_ENDPOINT is not configured or simulated unavailable for local Kokoro-82M inference.")

        if not text or not text.strip():
            raise ValueError("Text for voice synthesis cannot be empty.")

        persona = (context or {}).get("persona") or (voice_id if voice_id != "default" else "narrator-deep")
        logger.info(
            "KokoroVoiceProvider dispatching request to %s (voice=%s, persona=%s)...",
            self.endpoint,
            voice_id,
            persona,
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                response = await client.post(
                    self.endpoint,
                    json={
                        "input": text,
                        "voice": voice_id if voice_id != "default" else "am_adam",
                        "response_format": "wav",
                    },
                )
                if response.status_code != 200:
                    raise ProviderUnavailableError(
                        f"Kokoro-82M endpoint returned HTTP {response.status_code}: {response.text[:200]}"
                    )

                audio_bytes = response.content
                if not audio_bytes:
                    raise ProviderUnavailableError("Kokoro-82M returned empty audio content.")

                file_hash = hashlib.md5(f"{text}_{voice_id}".encode("utf-8")).hexdigest()[:10]
                duration_sec = round(max(1.0, len(text) * 0.065), 2)
                mime_type = response.headers.get("content-type", "audio/wav")
                if "mpeg" in mime_type or "mp3" in mime_type:
                    ext = "mp3"
                    mime_type = "audio/mpeg"
                else:
                    ext = "wav"
                    mime_type = "audio/wav"

                logger.info(
                    "Kokoro-82M synthesis succeeded (%d bytes, estimated %.2fs).",
                    len(audio_bytes),
                    duration_sec,
                )

                return MediaPayload(
                    data=audio_bytes,
                    mime_type=mime_type,
                    filename=f"kokoro_{file_hash}.{ext}",
                    metadata={
                        "voice_id": voice_id,
                        "persona": persona,
                        "resolved_provider": "kokoro",
                        "duration_sec": duration_sec,
                        "text_snippet": text[:60],
                    },
                )

        except (httpx.RequestError, httpx.TimeoutException) as exc:
            logger.warning("Kokoro-82M endpoint request failed (%s: %s).", type(exc).__name__, exc)
            raise ProviderUnavailableError(f"Kokoro-82M endpoint connection failed: {exc}") from exc

    async def health_check(self) -> Dict[str, Any]:
        if not self.endpoint:
            return {
                "status": "disabled",
                "provider": "KokoroVoiceProvider",
                "message": "KOKORO_ENDPOINT is not configured",
            }
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(self.endpoint.replace("/audio/speech", "/health"))
                return {
                    "status": "healthy" if res.status_code == 200 else "degraded",
                    "provider": "KokoroVoiceProvider",
                    "endpoint": self.endpoint,
                }
        except Exception as e:
            return {
                "status": "unreachable",
                "provider": "KokoroVoiceProvider",
                "endpoint": self.endpoint,
                "error": str(e),
            }
