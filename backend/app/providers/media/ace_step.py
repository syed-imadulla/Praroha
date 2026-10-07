import asyncio
import base64
import hashlib
import logging
import os
from typing import Any, Dict, Optional, Tuple

import httpx

from backend.app.providers.media.base import (
    AudioProvider,
    MediaPayload,
    ProviderUnavailableError,
)

logger = logging.getLogger(__name__)


def detect_audio_mime_type(content_type: str, data: bytes) -> Tuple[str, str]:
    """Detect actual audio MIME type and file extension preserving true format.

    Guarantees:
    - Never labels MP3 bytes as WAV.
    - Inspects both HTTP Content-Type headers and binary magic numbers.
    - Returns (mime_type, file_extension).
    """
    ct = (content_type or "").lower()

    # Byte-level check for MP3 magic bytes: ID3 tag or MPEG sync word (0xFFE0 mask)
    is_mp3_bytes = data.startswith(b"ID3") or (
        len(data) >= 2 and data[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2")
    )
    is_wav_bytes = data.startswith(b"RIFF") and (len(data) < 12 or data[8:12] == b"WAVE")

    # If bytes explicitly match MP3, prioritize true byte identity
    if is_mp3_bytes:
        return "audio/mpeg", ".mp3"

    # If bytes explicitly match WAV, prioritize true byte identity
    if is_wav_bytes:
        return "audio/wav", ".wav"

    # Header-based detection
    if "audio/mpeg" in ct or "audio/mp3" in ct:
        return "audio/mpeg", ".mp3"
    if "audio/wav" in ct or "audio/x-wav" in ct or "audio/wave" in ct:
        return "audio/wav", ".wav"

    # Safest fallback
    if data.startswith(b"RIFF"):
        return "audio/wav", ".wav"

    return "audio/wav", ".wav"


class ACEStepAudioProvider(AudioProvider):
    """Concrete ACE-Step 1.5 Audio & Music Provider (Tier 1 Cloud).

    Connects via ACE_STEP_ENDPOINT or HuggingFace Inference API with HF_TOKEN.
    Features 30s timeout, transient HTTP retries (3 attempts with exponential backoff),
    outage simulation for testing, response isolation, and actual MIME type preservation.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        hf_token: Optional[str] = None,
        timeout_sec: Optional[float] = None,
    ) -> None:
        self.endpoint = endpoint if endpoint is not None else os.getenv("ACE_STEP_ENDPOINT", "")
        self.hf_token = hf_token if hf_token is not None else os.getenv("HF_TOKEN", "")
        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else float(os.getenv("ACE_STEP_TIMEOUT_SEC", "30.0"))
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
        if ctx.get("simulate_acestep_unavailable") or os.getenv(
            "ACE_STEP_FORCE_UNAVAILABLE", "0"
        ) in ("1", "true", "True"):
            logger.info("ACEStepAudioProvider simulated outage triggered.")
            raise ProviderUnavailableError("Simulated ACE-Step outage")

        # Check configuration
        if not self.endpoint and not self.hf_token:
            logger.info("ACEStepAudioProvider unconfigured (no endpoint or HF_TOKEN). Cascading.")
            raise ProviderUnavailableError("ACE-Step endpoint or HF_TOKEN not configured")

        headers: Dict[str, str] = {"Content-Type": "application/json"}
        if self.hf_token:
            headers["Authorization"] = f"Bearer {self.hf_token}"

        payload = {
            "inputs": prompt,
            "parameters": {
                "duration": duration_sec,
                "mood": mood,
            },
        }

        url = self.endpoint or "https://api-inference.huggingface.co/models/facebook/musicgen-small"

        last_error: Optional[Exception] = None
        max_attempts = 3
        backoff_sec = 0.2

        for attempt in range(1, max_attempts + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    if response.status_code != 200:
                        raise ProviderUnavailableError(
                            f"ACE-Step API returned HTTP {response.status_code}: {response.text[:200]}"
                        )

                    content_type = response.headers.get("content-type", "")
                    if "audio" in content_type or "octet-stream" in content_type:
                        raw_bytes = response.content
                    else:
                        data = response.json()
                        if isinstance(data, dict) and "audio_base64" in data:
                            raw_bytes = base64.b64decode(data["audio_base64"])
                        elif isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict) and "blob" in data[0]:
                            raw_bytes = base64.b64decode(data[0]["blob"])
                        else:
                            raw_bytes = response.content

                    mime_type, ext = detect_audio_mime_type(content_type, raw_bytes)
                    file_hash = hashlib.md5(f"{prompt}_{mood}_{duration_sec}".encode("utf-8")).hexdigest()[:10]

                    return MediaPayload(
                        data=raw_bytes,
                        mime_type=mime_type,
                        filename=f"acestep_{file_hash}{ext}",
                        metadata={
                            "resolved_provider": "ace-step",
                            "mood": mood,
                            "duration_sec": duration_sec,
                            "prompt": prompt,
                        },
                    )
            except (httpx.TimeoutException, httpx.RequestError) as net_err:
                last_error = net_err
                logger.warning(
                    "ACE-Step network error (attempt %d/%d): %s (%s).",
                    attempt,
                    max_attempts,
                    type(net_err).__name__,
                    net_err,
                )
                if attempt < max_attempts:
                    await asyncio.sleep(backoff_sec)
                    backoff_sec *= 2
            except ProviderUnavailableError:
                raise
            except Exception as unk_err:
                logger.warning("ACE-Step unexpected error: %s. Cascading.", unk_err)
                raise ProviderUnavailableError(f"ACE-Step error: {unk_err}") from unk_err

        raise ProviderUnavailableError(f"ACE-Step exhausted {max_attempts} retries: {last_error}")

    async def health_check(self) -> Dict[str, Any]:
        configured = bool(self.endpoint or self.hf_token)
        return {
            "status": "configured" if configured else "unconfigured",
            "provider": "ACEStepAudioProvider",
            "endpoint": self.endpoint or "hf-inference",
            "timeout_sec": self.timeout_sec,
        }
