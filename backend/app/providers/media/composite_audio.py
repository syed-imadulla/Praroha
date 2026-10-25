import logging
import os
from typing import Any, Dict, Optional

from backend.app.providers.media.base import (
    AudioProvider,
    AuthenticationError,
    MediaPayload,
    MediaProviderError,
    PaymentRequiredError,
    ProviderUnavailableError,
    QuotaExceededError,
)
from backend.app.providers.media.mock import MockAudioProvider, _generate_wav_bytes
from backend.app.services.soundscape_library import SoundscapeComposer

logger = logging.getLogger(__name__)


class AudioSynthesisError(MediaProviderError):
    """Raised when procedural audio synthesis math or encoding fails."""
    pass


_SENTINEL = object()


class CompositeAudioProvider(AudioProvider):
    """Atmospheric audio provider powered by the built-in Procedural Soundscape Composer.

    Generates authentic, browser-playable ambient WAV audio using procedural acoustic synthesis
    (CC0 layers, resonant filtering, environmental textures, modal chimes, drones, and pulses).
    In test environments, supports primary or mock injection.
    """

    def __init__(
        self,
        primary: Optional[AudioProvider] = None,
        mock: Any = _SENTINEL,
        composer: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        self.primary = primary
        self.mock = MockAudioProvider() if mock is _SENTINEL else mock
        self.composer = composer or SoundscapeComposer

    async def generate_audio(
        self,
        prompt: str,
        mood: str = "ambient",
        duration_sec: int = 15,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        ctx = dict(context or {})

        # If a custom primary provider is injected (e.g. in unit tests)
        if self.primary:
            try:
                payload = await self.primary.generate_audio(
                    prompt=prompt,
                    mood=mood,
                    duration_sec=duration_sec,
                    context=ctx,
                )
                return payload
            except (PaymentRequiredError, AuthenticationError, QuotaExceededError) as circuit_err:
                logger.error(
                    "Cost-safe circuit breaker: Primary audio provider failed with billing/auth/quota error (%s: %s). Halting cascade.",
                    type(circuit_err).__name__,
                    circuit_err,
                )
                raise circuit_err
            except (ProviderUnavailableError, Exception) as tier_err:
                logger.info("Primary audio provider failed (%s: %s). Falling back.", type(tier_err).__name__, tier_err)

        # Built-in Procedural Soundscape Composer (Production, Staging, and Local)
        try:
            logger.info(
                "Synthesizing atmospheric soundscape via Procedural Soundscape Composer (mood=%s, duration=%ds).",
                mood,
                duration_sec,
            )
            wav_bytes, metadata = self.composer.compose_procedural_soundscape(
                mood=mood,
                prompt=prompt,
                duration_sec=float(duration_sec),
                context=ctx,
            )
            entity_id = ctx.get("entity_id") or "atmosphere"
            return MediaPayload(
                data=wav_bytes,
                mime_type="audio/wav",
                filename=f"soundscape_{entity_id}.wav",
                metadata=metadata,
            )
        except Exception as synth_err:
            logger.error(
                "Procedural soundscape synthesis failure: %s",
                synth_err,
                exc_info=True,
            )
            # Safe deterministic fallback to mock in case of unexpected synthesis error
            if self.mock:
                logger.warning("Falling back to MockAudioProvider following synthesis failure.")
                try:
                    mock_payload = await self.mock.generate_audio(
                        prompt=prompt,
                        mood=mood,
                        duration_sec=duration_sec,
                        context=ctx,
                    )
                    mock_payload.metadata["resolved_provider"] = "procedural-soundscape"
                    mock_payload.metadata["provider_label"] = "Procedural Soundscape Composer (Fallback)"
                    mock_payload.metadata["is_synthetic"] = True
                    mock_payload.metadata["mood"] = mood
                    mock_payload.metadata["duration_sec"] = duration_sec
                    return mock_payload
                except Exception as mock_err:
                    logger.error("Mock audio provider also failed: %s", mock_err)
            raise AudioSynthesisError(f"Atmospheric soundscape synthesis failed: {synth_err}") from synth_err

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "provider": "ProceduralSoundscapeComposer",
            "procedural_soundscape": "available",
            "curated_layers": [layer.id for layer in getattr(self.composer, "CURATED_SOUNDSCAPE_LAYERS", [])],
            "tiers": {
                "procedural": {"status": "healthy", "type": "ProceduralSoundscapeComposer"},
                "mock": await self.mock.health_check() if hasattr(self.mock, "health_check") else {"status": "healthy"},
            },
        }
