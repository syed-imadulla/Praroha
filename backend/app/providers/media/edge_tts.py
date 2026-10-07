import asyncio
import hashlib
import io
import logging
import os
from typing import Any, Dict, Optional

from backend.app.providers.media.base import (
    MediaPayload,
    ProviderUnavailableError,
    VoiceProvider,
)

logger = logging.getLogger(__name__)

CURATED_VOICE_PERSONAS: Dict[str, Dict[str, str]] = {
    "narrator-deep": {
        "voice": "en-US-ChristopherNeural",
        "name": "Deep Cinematic Narrator",
        "description": "Deep, steady, cinematic authoritative tone",
        "recommended_for": "Scenes & World Lore",
    },
    "protagonist-resolute": {
        "voice": "en-US-GuyNeural",
        "name": "Resolute Protagonist",
        "description": "Determined, grounded, relatable lead",
        "recommended_for": "Heroic & Determined Characters",
    },
    "inquiring-youth": {
        "voice": "en-US-JennyNeural",
        "name": "Inquiring Youth",
        "description": "Expressive, bright, curious explorer",
        "recommended_for": "Scientists & Youthful Explorers",
    },
    "mentor-sage": {
        "voice": "en-GB-RyanNeural",
        "name": "Contemplative Mentor",
        "description": "Wise, contemplative British guide",
        "recommended_for": "Mentors & Philosophical Figures",
    },
    "calm-mystic": {
        "voice": "en-GB-SoniaNeural",
        "name": "Calm Mystic",
        "description": "Ethereal, measured, mysterious cadence",
        "recommended_for": "Mystics & Spiritual Guides",
    },
    "brooding-antagonist": {
        "voice": "en-US-EricNeural",
        "name": "Brooding Antagonist",
        "description": "Intense, sharp, commanding presence",
        "recommended_for": "Antagonists & Stern Leaders",
    },
}

DEFAULT_PERSONA = "narrator-deep"
DEFAULT_VOICE = "en-US-ChristopherNeural"


def resolve_voice_and_persona(voice_input: str) -> tuple[str, str]:
    """Resolve input voice_id (which may be a persona slug or exact voice name)

    to a (voice_name, persona_slug) tuple.
    """
    clean_input = (voice_input or "").strip().lower()
    if clean_input in CURATED_VOICE_PERSONAS:
        return CURATED_VOICE_PERSONAS[clean_input]["voice"], clean_input

    # Check if voice_input matches exact neural voice name (case-insensitive)
    for slug, meta in CURATED_VOICE_PERSONAS.items():
        if meta["voice"].lower() == clean_input:
            return meta["voice"], slug

    # If it's another non-empty string, preserve as direct voice_id
    if voice_input and voice_input.strip() and voice_input != "default":
        return voice_input.strip(), "custom"

    return DEFAULT_VOICE, DEFAULT_PERSONA


class EdgeTTSProvider(VoiceProvider):
    """Primary keyless neural text-to-speech provider using Microsoft Edge TTS.

    Features:
    - Zero API key requirements.
    - Curated persona mapping for 6 dramatic voice archetypes.
    - Resilient network handling with configurable timeout and exponential backoff.
    - Produces high-fidelity MP3 audio (audio/mpeg).
    - Raises ProviderUnavailableError on retry exhaustion to trigger cascade.
    """

    def __init__(
        self,
        timeout_sec: Optional[float] = None,
        max_retries: int = 2,
        backoff_factor: float = 1.0,
    ) -> None:
        env_timeout = os.getenv("EDGETTS_TIMEOUT_SEC")
        self.timeout_sec = (
            float(env_timeout)
            if env_timeout
            else (timeout_sec if timeout_sec is not None else 20.0)
        )
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor

    async def generate_voice(
        self,
        text: str,
        voice_id: str = "default",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        if not text or not text.strip():
            raise ValueError("Text for voice synthesis cannot be empty.")

        if (
            os.getenv("EDGETTS_FORCE_UNAVAILABLE", "").lower() in ("true", "1", "yes")
            or (context and context.get("simulate_edgetts_unavailable"))
        ):
            raise ProviderUnavailableError("Edge TTS service unavailable (simulated outage/configuration).")

        resolved_voice, persona = resolve_voice_and_persona(voice_id)
        if context and context.get("persona") and context["persona"] in CURATED_VOICE_PERSONAS:
            persona = context["persona"]

        logger.info(
            "EdgeTTSProvider synthesizing speech (voice=%s, persona=%s, length=%d chars)...",
            resolved_voice,
            persona,
            len(text),
        )

        try:
            import edge_tts
        except ImportError as e:
            raise ProviderUnavailableError("edge-tts library is not installed.") from e

        last_error: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            try:
                communicate = edge_tts.Communicate(text, voice=resolved_voice)
                stream = io.BytesIO()

                async def _stream_chunks() -> None:
                    async for chunk in communicate.stream():
                        if chunk.get("type") == "audio" and "data" in chunk:
                            stream.write(chunk["data"])

                await asyncio.wait_for(_stream_chunks(), timeout=self.timeout_sec)
                audio_bytes = stream.getvalue()

                if not audio_bytes:
                    raise ProviderUnavailableError("EdgeTTS returned empty audio stream.")

                file_hash = hashlib.md5(f"{text}_{resolved_voice}".encode("utf-8")).hexdigest()[:10]
                # Estimate duration (~150 words per minute / ~15 chars per sec)
                estimated_duration = round(max(1.0, len(text) * 0.065), 2)

                logger.info(
                    "EdgeTTS synthesis succeeded (%d bytes, estimated %.2fs).",
                    len(audio_bytes),
                    estimated_duration,
                )

                return MediaPayload(
                    data=audio_bytes,
                    mime_type="audio/mpeg",
                    filename=f"voice_{file_hash}.mp3",
                    metadata={
                        "voice_id": resolved_voice,
                        "persona": persona,
                        "resolved_provider": "edge-tts",
                        "duration_sec": estimated_duration,
                        "text_snippet": text[:60],
                    },
                )

            except (asyncio.TimeoutError, Exception) as exc:
                last_error = exc
                if attempt < self.max_retries:
                    sleep_time = self.backoff_factor * (2 ** attempt)
                    logger.warning(
                        "EdgeTTS attempt %d failed (%s: %s). Retrying in %.1fs...",
                        attempt + 1,
                        type(exc).__name__,
                        exc,
                        sleep_time,
                    )
                    await asyncio.sleep(sleep_time)
                else:
                    logger.error(
                        "EdgeTTS exhausted all %d retries (%s: %s).",
                        self.max_retries + 1,
                        type(exc).__name__,
                        exc,
                    )

        raise ProviderUnavailableError(
            f"EdgeTTS synthesis failed after {self.max_retries + 1} attempts: {last_error}"
        ) from last_error

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "provider": "EdgeTTSProvider",
            "curated_personas": list(CURATED_VOICE_PERSONAS.keys()),
            "timeout_sec": self.timeout_sec,
        }
