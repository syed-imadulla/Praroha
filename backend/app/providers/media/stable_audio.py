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
    """Concrete Stable Audio Provider (Tier 2 Local/API).

    Connects to official Stability AI Stable Audio 2 endpoint:
    POST https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio
    or custom self-hosted endpoint via STABLE_AUDIO_ENDPOINT.

    Synchronous text-to-audio flow:
    - Sends multipart/form-data with prompt, duration (5-190s), output_format='mp3'
    - Receives direct binary audio payload on HTTP 200.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_sec: Optional[float] = None,
    ) -> None:
        from backend.app.config import settings
        self.endpoint = (
            endpoint
            if endpoint is not None
            else (settings.STABLE_AUDIO_ENDPOINT or os.getenv("STABLE_AUDIO_ENDPOINT", ""))
        )
        self.api_key = (
            api_key
            if api_key is not None
            else (settings.STABILITY_API_KEY or os.getenv("STABILITY_API_KEY", ""))
        )
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

        is_official_api = not self.endpoint or "api.stability.ai" in self.endpoint
        url = self.endpoint or "https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio"

        headers: Dict[str, str] = {
            "Accept": "audio/*",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        # Clamped to documented bounds: 5s to 190s
        clamped_duration = str(min(max(duration_sec, 5), 190))
        form_data = {
            "prompt": prompt,
            "duration": clamped_duration,
            "output_format": "mp3",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                if is_official_api:
                    # Official Stability AI v2beta Stable Audio 2 API uses multipart/form-data
                    response = await client.post(url, data=form_data, headers=headers)
                else:
                    # Self-hosted / custom endpoints may accept JSON
                    response = await client.post(
                        url,
                        json={
                            "prompt": prompt,
                            "duration": int(clamped_duration),
                            "output_format": "mp3",
                            "mood": mood,
                        },
                        headers={"Content-Type": "application/json", **headers},
                    )

                if response.status_code == 401:
                    raise ProviderUnavailableError("Stability AI API Key is invalid or unauthorized (HTTP 401)")
                if response.status_code == 402:
                    raise ProviderUnavailableError("Stability AI account has insufficient credits (HTTP 402)")
                if response.status_code == 429:
                    raise ProviderUnavailableError("Stability AI rate limit exceeded (HTTP 429)")
                if response.status_code != 200:
                    raise ProviderUnavailableError(
                        f"Stable Audio API returned HTTP {response.status_code}: {response.text[:200]}"
                    )

                content_type = response.headers.get("content-type", "")
                content_bytes = response.content

                if not content_bytes:
                    raise ProviderUnavailableError("Stable Audio returned empty response payload")

                raw_bytes: bytes
                if (
                    content_bytes.startswith(b"RIFF")
                    or content_bytes.startswith(b"ID3")
                    or content_bytes.startswith(b"\xff\xfb")
                    or content_bytes.startswith(b"fLaC")
                    or content_bytes.startswith(b"OggS")
                    or "audio" in content_type
                    or "octet-stream" in content_type
                ):
                    raw_bytes = content_bytes
                else:
                    try:
                        data = response.json()
                    except Exception:
                        data = {}

                    if isinstance(data, dict) and "audio" in data:
                        raw_bytes = base64.b64decode(data["audio"])
                    elif isinstance(data, dict) and "audio_base64" in data:
                        raw_bytes = base64.b64decode(data["audio_base64"])
                    else:
                        raw_bytes = content_bytes

                if not raw_bytes or len(raw_bytes) < 4:
                    raise ProviderUnavailableError("Stable Audio returned malformed audio bytes")

                mime_type, ext = detect_audio_mime_type(content_type, raw_bytes)
                file_hash = hashlib.md5(f"{prompt}_{mood}_{duration_sec}".encode("utf-8")).hexdigest()[:10]

                return MediaPayload(
                    data=raw_bytes,
                    mime_type=mime_type,
                    filename=f"stable_audio_{file_hash}{ext}",
                    metadata={
                        "resolved_provider": "stable-audio",
                        "mood": mood,
                        "duration_sec": int(clamped_duration),
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
            "endpoint": self.endpoint or "https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio",
            "timeout_sec": self.timeout_sec,
        }
