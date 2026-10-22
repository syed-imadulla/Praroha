import logging
import os
from typing import Any, Dict, Optional

from backend.app.providers.media.base import (
    AuthenticationError,
    MediaPayload,
    PaymentRequiredError,
    ProviderUnavailableError,
    QuotaExceededError,
    VideoProvider,
)
from backend.app.providers.media.mock import MockVideoProvider, _generate_minimal_mp4_bytes
from backend.app.providers.media.wan import WanVideoProvider

logger = logging.getLogger(__name__)


class CompositeVideoProvider(VideoProvider):
    """Video Provider with Wan2.1 microservice support and honest fallbacks.

    Generative video cloud services (Pixazo, Pyramid Flow / HF, JSON2Video, Rewind) have been retired.
    Tier 1 (Optional Local): WanVideoProvider (Local Wan2.1 T2V-1.3B microservice if WAN_ENDPOINT configured)
    Tier 2 (Test/Demo Only): MockVideoProvider (Synthetic preview MP4)

    In real/production mode: If no local Wan endpoint is configured or operational, video generation
    honestly raises ProviderUnavailableError explaining that video generation is currently unavailable.
    """

    def __init__(
        self,
        wan: Optional[VideoProvider] = None,
        mock: Optional[VideoProvider] = None,
        **kwargs: Any,
    ) -> None:
        self.primary = kwargs.get("pixazo") or kwargs.get("pyramid")
        self.wan = wan or WanVideoProvider()
        self.mock = mock or MockVideoProvider()

    async def generate_video(
        self,
        prompt: str,
        duration_sec: int = 5,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        ctx = dict(context or {})
        aspect_ratio = ctx.get("aspect_ratio") or "16:9"

        # If a custom primary provider is injected (e.g. in unit tests)
        if self.primary:
            try:
                payload = await self.primary.generate_video(
                    prompt=prompt,
                    duration_sec=duration_sec,
                    context=ctx,
                )
                return payload
            except (PaymentRequiredError, AuthenticationError, QuotaExceededError) as auth_err:
                logger.error("Primary video billing/auth/quota error: %s. Halting cascade.", auth_err)
                raise
            except (ProviderUnavailableError, Exception) as p_err:
                logger.info("Primary video unavailable (%s). Cascading...", p_err)

        # Tier 1: Local Wan2.1 microservice if configured
        if self.wan and getattr(self.wan, "endpoint", None):
            try:
                logger.info("Attempting Wan2.1 video generation...")
                payload = await self.wan.generate_video(
                    prompt=prompt,
                    duration_sec=duration_sec,
                    context=ctx,
                )
                payload.metadata["resolved_provider"] = "wan2.1"
                payload.metadata["duration_sec"] = duration_sec
                payload.metadata["aspect_ratio"] = aspect_ratio
                payload.metadata["resolution"] = "720p"
                return payload
            except (PaymentRequiredError, AuthenticationError, QuotaExceededError) as auth_err:
                logger.error("Wan2.1 billing/auth/quota error: %s. Halting cascade.", auth_err)
                raise
            except (ProviderUnavailableError, Exception) as wan_err:
                logger.warning("Wan2.1 failed (%s: %s).", type(wan_err).__name__, wan_err)

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
            logger.error("Real mode: Video generation unavailable. Refusing fake mock generation.")
            raise ProviderUnavailableError(
                "Video generation is currently unavailable. Generative video services (JSON2Video, Pixazo, Pyramid Flow, Rewind) "
                "have been retired due to unreliability. Cinematic preview engine will be introduced in an upcoming release."
            )

        logger.info("Delivering MockVideoProvider deterministic fallback video asset.")
        try:
            payload = await self.mock.generate_video(
                prompt=prompt,
                duration_sec=duration_sec,
                context=ctx,
            )
            payload.metadata["resolved_provider"] = "mock"
            payload.metadata["provider_label"] = "Synthetic Preview"
            payload.metadata["is_synthetic"] = True
            payload.metadata["duration_sec"] = duration_sec
            payload.metadata["aspect_ratio"] = aspect_ratio
            payload.metadata["resolution"] = "720p"
            return payload
        except Exception as mock_err:
            logger.error("Mock video provider threw unexpected error: %s", mock_err)
            fallback_mp4 = _generate_minimal_mp4_bytes()
            return MediaPayload(
                data=fallback_mp4,
                mime_type="video/mp4",
                filename="emergency_fallback.mp4",
                metadata={
                    "resolved_provider": "mock",
                    "provider_label": "Synthetic Preview",
                    "is_synthetic": True,
                    "duration_sec": duration_sec,
                    "aspect_ratio": aspect_ratio,
                    "resolution": "720p",
                    "mock": True,
                    "prompt": prompt,
                },
            )

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "provider": "CompositeVideoProvider",
            "tiers": {
                "wan": await self.wan.health_check() if hasattr(self.wan, "health_check") else {"status": "unconfigured"},
                "mock": await self.mock.health_check() if hasattr(self.mock, "health_check") else {"status": "healthy"},
            },
        }
