import logging
import os
from typing import Any, Dict, Optional

from backend.app.providers.media.base import (
    AudioProvider,
    AuthenticationError,
    MediaPayload,
    PaymentRequiredError,
    ProviderUnavailableError,
    QuotaExceededError,
)
from backend.app.providers.media.mock import MockAudioProvider, _generate_wav_bytes

logger = logging.getLogger(__name__)


class CompositeAudioProvider(AudioProvider):
    """Atmospheric audio provider with safe fallbacks and circuit breakers.

    Generative atmospheric audio providers (ACE-Step, Pixazo Tracks, Stable Audio) have been retired.
    Atmospheric soundscapes are natively synthesized via the built-in Procedural Soundscape Composer.
    In test/demo mode, MockAudioProvider provides deterministic audio.
    """

    def __init__(
        self,
        primary: Optional[AudioProvider] = None,
        mock: Optional[AudioProvider] = None,
        **kwargs: Any,
    ) -> None:
        self.primary = (
            primary
            or kwargs.get("ace_step")
            or kwargs.get("pixazo_tracks")
            or kwargs.get("stable_audio")
        )
        self.mock = mock or MockAudioProvider()

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

        # Fallback handling
        env = os.getenv("ENVIRONMENT", "").lower()
        praroha_env = os.getenv("PRAROHA_ENV", "").lower()
        if env == "production" or praroha_env == "production":
            is_demo_mode = False
        else:
            is_demo_mode = (
                env in ("demo", "test")
                or praroha_env in ("demo", "test")
                or os.getenv("PYTEST_CURRENT_TEST") is not None
            )
        if not is_demo_mode:
            logger.error("Real mode: Generative audio services retired.")
            raise ProviderUnavailableError(
                "Generative AI atmospheric audio providers (ACE-Step, Pixazo Tracks, Stable Audio) have been retired. "
                "Please use the built-in Procedural Soundscape Composer for atmospheric audio."
            )

        logger.info("Delivering MockAudioProvider deterministic fallback audio soundscape.")
        try:
            payload = await self.mock.generate_audio(
                prompt=prompt,
                mood=mood,
                duration_sec=duration_sec,
                context=ctx,
            )
            payload.metadata["resolved_provider"] = "mock"
            payload.metadata["provider_label"] = "Synthetic Preview"
            payload.metadata["is_synthetic"] = True
            payload.metadata["mood"] = mood
            payload.metadata["duration_sec"] = duration_sec
            return payload
        except Exception as mock_err:
            logger.error("Mock audio provider threw unexpected error: %s", mock_err)
            fallback_wav = _generate_wav_bytes(duration_sec=3.0, freq=196.0)
            return MediaPayload(
                data=fallback_wav,
                mime_type="audio/wav",
                filename="emergency_fallback.wav",
                metadata={
                    "resolved_provider": "mock",
                    "provider_label": "Synthetic Preview",
                    "is_synthetic": True,
                    "mood": mood,
                    "duration_sec": duration_sec,
                    "mock": True,
                    "prompt": prompt,
                },
            )

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "provider": "CompositeAudioProvider",
            "procedural_soundscape": "available",
            "tiers": {
                "mock": await self.mock.health_check() if hasattr(self.mock, "health_check") else {"status": "healthy"},
            },
        }
