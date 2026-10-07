import base64
import hashlib
import logging
import os
from typing import Any, Dict, Optional

import httpx

from backend.app.providers.media.ace_step import detect_audio_mime_type
from backend.app.providers.media.base import (
    AudioProvider,
    MediaPayload,
    ProviderUnavailableError,
)

logger = logging.getLogger(__name__)


class StableAudioOpenProvider(AudioProvider):
    """Concrete Stable Audio Open Provider (Tier 2 Local/API).

    Connects via STABLE_AUDIO_ENDPOINT or Stability API with STABILITY_API_KEY.
    Features 30s timeout, outage simulation, response isolation, and actual MIME type preservation.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_sec: Optional[float] = None,
    ) -> None:
        self.endpoint = endpoint if endpoint is not None else os.getenv("STABLE_AUDIO_ENDPOINT", "")
        self.api_key = api_key if api_key is not None else os.getenv("STABILITY_API_KEY", "")
        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else float(os.getenv("STABLE_AUDIO_TIMEOUT_SEC", "30.0"))
        )

    async def generate_audio(
        self,
        prompt: str,
        mood: str = "ambient",
        duration_sec: int = 15,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        ctx = context or {}

        # Outage simulation for testing
        if ctx.get("simulate_stableaudio_unavailable") or os.getenv(
            "STABLE_AUDIO_FORCE_UNAVAILABLE", "0"
        ) in ("1", "true", "True"):
            logger.info("StableAudioOpenProvider simulated outage triggered.")
            raise ProviderUnavailableError("Simulated Stable Audio outage")

        # Check configuration
        if not self.endpoint and not self.api_key:
            logger.info("StableAudioOpenProvider unconfigured (no endpoint or API key). Cascading.")
            raise ProviderUnavailableError("Stable Audio endpoint or API key not configured")

        headers: Dict[str, str] = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "prompt": prompt,
            "seconds_total": duration_sec,
            "mood": mood,
        }

        url = self.endpoint or "https://api.stability.ai/v2beta/stable-audio/generate"

        try:
            async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code != 200:
                    raise ProviderUnavailableError(
                        f"Stable Audio API returned HTTP {response.status_code}: {response.text[:200]}"
                    )

                content_type = response.headers.get("content-type", "")
                if "audio" in content_type or "octet-stream" in content_type:
                    raw_bytes = response.content
                else:
                    data = response.json()
                    if isinstance(data, dict) and "audio" in data:
                        raw_bytes = base64.b64decode(data["audio"])
                    elif isinstance(data, dict) and "audio_base64" in data:
                        raw_bytes = base64.b64decode(data["audio_base64"])
                    else:
                        raw_bytes = response.content

                mime_type, ext = detect_audio_mime_type(content_type, raw_bytes)
                file_hash = hashlib.md5(f"{prompt}_{mood}_{duration_sec}".encode("utf-8")).hexdigest()[:10]

                return MediaPayload(
                    data=raw_bytes,
                    mime_type=mime_type,
                    filename=f"stable_audio_{file_hash}{ext}",
                    metadata={
                        "resolved_provider": "stable-audio",
                        "mood": mood,
                        "duration_sec": duration_sec,
                        "prompt": prompt,
                    },
                )
        except (httpx.TimeoutException, httpx.RequestError) as net_err:
            logger.warning("Stable Audio network error: %s (%s). Cascading.", type(net_err).__name__, net_err)
            raise ProviderUnavailableError(f"Stable Audio network error: {net_err}") from net_err
        except ProviderUnavailableError:
            raise
        except Exception as unk_err:
            logger.warning("Stable Audio unexpected error: %s. Cascading.", unk_err)
            raise ProviderUnavailableError(f"Stable Audio error: {unk_err}") from unk_err

    async def health_check(self) -> Dict[str, Any]:
        configured = bool(self.endpoint or self.api_key)
        return {
            "status": "configured" if configured else "unconfigured",
            "provider": "StableAudioOpenProvider",
            "endpoint": self.endpoint or "stability-api",
            "timeout_sec": self.timeout_sec,
        }
