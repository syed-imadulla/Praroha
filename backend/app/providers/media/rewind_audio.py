import hashlib
import logging
import os
from typing import Any, Dict, Optional

import httpx

from backend.app.config import settings
from backend.app.providers.media.base import (
    AudioProvider,
    MediaPayload,
    ProviderUnavailableError,
)
from backend.app.providers.media.mock import _generate_wav_bytes

logger = logging.getLogger(__name__)


class RewindMusicAudioProvider(AudioProvider):
    """Rewind.ai music and atmospheric audio provider using Lyria 3.

    IMPORTANT ARCHITECTURAL DISCLOSURE:
    - This provider generates background ambient music tracks and melodic soundscapes
      (e.g., using google/lyria-3-clip-preview).
    - It does NOT generate raw environmental foley / sound effects (e.g. footsteps,
      isolated wind gusts, or specific mechanical actions).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout_sec: Optional[float] = None,
    ) -> None:
        if api_key is not None:
            self.api_key = api_key
        else:
            self.api_key = settings.REWIND_API_KEY or os.getenv("REWIND_API_KEY", "")

        self.base_url = (
            base_url
            if base_url is not None
            else getattr(settings, "REWIND_BASE_URL", "https://api.rewind.ai")
        ).rstrip("/")

        self.model = (
            model
            if model is not None
            else getattr(settings, "REWIND_MUSIC_MODEL", "google/lyria-3-clip-preview")
        )

        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else float(os.getenv("REWIND_MUSIC_TIMEOUT_SEC", "45.0"))
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
        if ctx.get("simulate_rewind_audio_unavailable") or os.getenv(
            "REWIND_AUDIO_FORCE_UNAVAILABLE", "0"
        ) in ("1", "true", "True"):
            logger.info("RewindMusicAudioProvider simulated outage triggered.")
            raise ProviderUnavailableError("Simulated Rewind.ai music provider outage")

        if not self.api_key:
            logger.warning("RewindMusicAudioProvider missing REWIND_API_KEY; returning fallback audio.")
            return self._build_fallback(prompt, duration_sec, ctx, note="Missing REWIND_API_KEY")

        clamped_duration = max(5, min(int(duration_sec), 30))

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Explicitly frame prompt for ambient background musical soundscapes
        formatted_prompt = f"Ambient atmospheric soundtrack: {prompt}"

        payload = {
            "model": self.model,
            "prompt": formatted_prompt,
        }

        endpoint = f"{self.base_url}/v1/music/generations"

        async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
            try:
                res = await client.post(endpoint, json=payload, headers=headers)

                if res.status_code == 401:
                    raise ProviderUnavailableError("Rewind.ai API key is invalid or unauthorized (HTTP 401)")
                if res.status_code == 403:
                    raise ProviderUnavailableError("Rewind.ai music model access restricted on current plan (HTTP 403)")
                if res.status_code == 429:
                    err_json = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
                    err_msg = err_json.get("error", {}).get("message", "Token quota exceeded")
                    raise ProviderUnavailableError(f"Rewind.ai insufficient token balance: {err_msg} (HTTP 429)")
                if res.status_code != 200:
                    raise ProviderUnavailableError(f"Rewind music generation failed with HTTP {res.status_code}: {res.text[:150]}")

                data = res.json()
                audio_items = data.get("data", [])
                audio_url = None
                if audio_items and isinstance(audio_items, list):
                    audio_url = audio_items[0].get("url")
                elif isinstance(data.get("url"), str):
                    audio_url = data.get("url")

                if not audio_url:
                    raise ProviderUnavailableError(f"Rewind music response missing audio URL: {data}")

                # Download audio file
                dl_res = await client.get(audio_url, headers=headers)
                if dl_res.status_code != 200:
                    raise ProviderUnavailableError(f"Failed to download Rewind music asset from {audio_url} (HTTP {dl_res.status_code})")

                audio_bytes = dl_res.content
                if not audio_bytes:
                    raise ProviderUnavailableError("Rewind returned empty audio data")

                # Detect MIME type
                mime_type = "audio/mpeg"
                if audio_bytes[:4] == b"RIFF":
                    mime_type = "audio/wav"
                elif audio_bytes[:4] == b"OggS":
                    mime_type = "audio/ogg"

                file_hash = hashlib.md5(f"{prompt}_{clamped_duration}".encode()).hexdigest()[:10]
                return MediaPayload(
                    data=audio_bytes,
                    mime_type=mime_type,
                    filename=f"rewind_music_{file_hash}.mp3",
                    metadata={
                        "resolved_provider": "rewind-music",
                        "provider_label": "Rewind.ai Lyria 3 Atmospheric Music",
                        "model": self.model,
                        "duration_sec": clamped_duration,
                        "is_ambient_music": True,
                        "is_environmental_foley": False,
                        "source_url": audio_url,
                    },
                )
            except httpx.RequestError as exc:
                logger.warning("RewindMusicAudioProvider network error (%s), returning fallback audio.", exc)
                return self._build_fallback(prompt, clamped_duration, ctx, note=f"Network error: {exc}")

    def _build_fallback(
        self,
        prompt: str,
        duration_sec: int,
        context: Dict[str, Any],
        note: str = "",
    ) -> MediaPayload:
        file_hash = hashlib.md5(f"{prompt}_{duration_sec}".encode()).hexdigest()[:10]
        return MediaPayload(
            data=_generate_wav_bytes(duration_sec=float(duration_sec), freq=330.0),
            mime_type="audio/wav",
            filename=f"rewind_audio_fallback_{file_hash}.wav",
            metadata={
                "resolved_provider": "rewind-music",
                "provider_label": "Rewind.ai Lyria 3 Music (Fallback)",
                "model": self.model,
                "duration_sec": duration_sec,
                "is_synthetic": True,
                "is_ambient_music": True,
                "fallback_note": note,
            },
        )

    # Backward compatibility alias
    generate_atmosphere = generate_audio
