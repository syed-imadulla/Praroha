import logging
from typing import Any, Dict, Optional

from backend.app.providers.media.base import (
    ImageProvider,
    MediaPayload,
    ProviderUnavailableError,
)
from backend.app.providers.media.flux import FluxSchnellProvider
from backend.app.providers.media.mock import MockImageProvider
from backend.app.providers.media.pollinations import PollinationsImageProvider

logger = logging.getLogger(__name__)


class CompositeImageProvider(ImageProvider):
    """3-Tier Resilient Composite Image Provider:

    Tier 1 (Cloud): PollinationsImageProvider (keyless, retries + backoff)
    Tier 2 (Local): FluxSchnellProvider (FLUX.1 schnell / ComfyUI)
    Tier 3 (Safe): MockImageProvider (Deterministic SVG)

    Guarantees:
    1. Client never receives an unhandled 500 for provider failure.
    2. Mock is the guaranteed final fallback.
    3. MediaPayload.metadata["resolved_provider"] accurately records which
       tier actually generated the asset.
    """

    def __init__(
        self,
        pollinations: Optional[ImageProvider] = None,
        flux: Optional[ImageProvider] = None,
        mock: Optional[ImageProvider] = None,
    ) -> None:
        self.pollinations = pollinations or PollinationsImageProvider()
        self.flux = flux or FluxSchnellProvider()
        self.mock = mock or MockImageProvider()

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        # --- Tier 1: Pollinations ---
        try:
            logger.info("Attempting Tier 1 (Pollinations) image generation...")
            payload = await self.pollinations.generate_image(
                prompt=prompt,
                aspect_ratio=aspect_ratio,
                context=context,
            )
            payload.metadata["resolved_provider"] = "pollinations"
            return payload
        except (ProviderUnavailableError, Exception) as tier1_err:
            logger.warning(
                "Tier 1 (Pollinations) failed (%s: %s). Cascading to Tier 2 (FLUX)...",
                type(tier1_err).__name__,
                tier1_err,
            )

        # --- Tier 2: Local FLUX ---
        try:
            logger.info("Attempting Tier 2 (FLUX.1 schnell) image generation...")
            payload = await self.flux.generate_image(
                prompt=prompt,
                aspect_ratio=aspect_ratio,
                context=context,
            )
            payload.metadata["resolved_provider"] = "flux"
            return payload
        except (ProviderUnavailableError, Exception) as tier2_err:
            logger.warning(
                "Tier 2 (FLUX) failed (%s: %s). Cascading to Tier 3 (Mock)...",
                type(tier2_err).__name__,
                tier2_err,
            )

        # --- Tier 3: Guaranteed Mock Fallback ---
        logger.info("Delivering Tier 3 (MockImageProvider) deterministic fallback asset.")
        try:
            payload = await self.mock.generate_image(
                prompt=prompt,
                aspect_ratio=aspect_ratio,
                context=context,
            )
            payload.metadata["resolved_provider"] = "mock"
            return payload
        except Exception as mock_err:
            logger.error("Mock provider threw unexpected error: %s", mock_err)
            # Safe emergency inline fallback if even mock object had an issue
            fallback_svg = (
                b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">'
                b'<rect width="800" height="800" fill="#030712"/>'
                b'<text x="400" y="400" fill="#22d3ee" text-anchor="middle" font-family="sans-serif">'
                b'Safe Fallback Asset</text></svg>'
            )
            return MediaPayload(
                data=fallback_svg,
                mime_type="image/svg+xml",
                filename="emergency_fallback.svg",
                metadata={
                    "width": 800,
                    "height": 800,
                    "aspect_ratio": aspect_ratio,
                    "resolved_provider": "mock",
                },
            )

    async def health_check(self) -> Dict[str, Any]:
        p_health = await self.pollinations.health_check()
        f_health = await self.flux.health_check()
        m_health = await self.mock.health_check()
        return {
            "status": "healthy",
            "provider": "CompositeImageProvider",
            "tiers": {
                "tier1_pollinations": p_health,
                "tier2_flux": f_health,
                "tier3_mock": m_health,
            },
        }
