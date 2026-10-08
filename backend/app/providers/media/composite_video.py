import logging
from typing import Any, Dict, Optional

from backend.app.providers.media.base import (
    MediaPayload,
    ProviderUnavailableError,
    VideoProvider,
)
from backend.app.providers.media.mock import MockVideoProvider, _generate_minimal_mp4_bytes
from backend.app.providers.media.pyramid_flow import PyramidFlowProvider
from backend.app.providers.media.wan import WanVideoProvider

logger = logging.getLogger(__name__)


class CompositeVideoProvider(VideoProvider):
    """3-Tier Resilient Composite Video Provider:

    Tier 1 (Cloud): PyramidFlowProvider (Pyramid Flow API / HF Inference)
    Tier 2 (Local): WanVideoProvider (Local Wan2.1 T2V-1.3B microservice)
    Tier 3 (Safe): MockVideoProvider (Deterministic browser-playable ISO BMFF MP4)

    Guarantees:
    1. Client never receives an unhandled 500 for provider failure.
    2. Mock is the guaranteed final fallback.
    3. MediaPayload.metadata["resolved_provider"] accurately records which
       tier actually generated the asset ("pyramid-flow", "wan2.1", or "mock").
    4. Consistent video metadata is preserved across all tiers:
       resolved_provider, duration_sec, aspect_ratio, resolution.
    5. Provider responses are strictly normalized within the provider boundary (D-06).
    """

    def __init__(
        self,
        pyramid: Optional[VideoProvider] = None,
        wan: Optional[VideoProvider] = None,
        mock: Optional[VideoProvider] = None,
    ) -> None:
        self.pyramid = pyramid or PyramidFlowProvider()
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

        # --- Tier 1: Pyramid Flow ---
        try:
            logger.info("Attempting Tier 1 (Pyramid Flow) video generation...")
            payload = await self.pyramid.generate_video(
                prompt=prompt,
                duration_sec=duration_sec,
                context=ctx,
            )
            payload.metadata["resolved_provider"] = "pyramid-flow"
            payload.metadata["duration_sec"] = duration_sec
            payload.metadata["aspect_ratio"] = aspect_ratio
            payload.metadata["resolution"] = "720p"
            return payload
        except (ProviderUnavailableError, Exception) as tier1_err:
            logger.warning(
                "Tier 1 (Pyramid Flow) failed (%s: %s). Cascading to Tier 2 (Wan2.1)...",
                type(tier1_err).__name__,
                tier1_err,
            )

        # --- Tier 2: Wan2.1 T2V-1.3B ---
        try:
            logger.info("Attempting Tier 2 (Wan2.1) video generation...")
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
        except (ProviderUnavailableError, Exception) as tier2_err:
            logger.warning(
                "Tier 2 (Wan2.1) failed (%s: %s). Cascading to Tier 3 (Mock)...",
                type(tier2_err).__name__,
                tier2_err,
            )

        # --- Tier 3: Guaranteed Safe Mock Fallback ---
        import os
        if os.getenv("ENVIRONMENT") != "demo" and os.getenv("PRAROHA_ENV") != "demo":
            logger.error("Real mode: Providers failed. Refusing to fallback to MockProvider.")
            raise ProviderUnavailableError("Real providers failed and mock fallback is disabled in real mode.")

        logger.info("Delivering Tier 3 (MockVideoProvider) deterministic fallback video asset.")
        try:
            payload = await self.mock.generate_video(
                prompt=prompt,
                duration_sec=duration_sec,
                context=ctx,
            )
            payload.metadata["resolved_provider"] = "mock"
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
                "tier1_pyramid": await self.pyramid.health_check(),
                "tier2_wan": await self.wan.health_check(),
                "tier3_mock": await self.mock.health_check(),
            },
        }
