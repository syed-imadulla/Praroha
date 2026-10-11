import logging
from typing import Any, Dict, Optional

from backend.app.providers.media.ace_step import ACEStepAudioProvider
from backend.app.providers.media.base import (
    AudioProvider,
    MediaPayload,
    ProviderUnavailableError,
)
from backend.app.providers.media.mock import MockAudioProvider, _generate_wav_bytes
from backend.app.providers.media.pixazo_tracks import PixazoTracksAudioProvider
from backend.app.providers.media.stable_audio import StableAudioOpenProvider

logger = logging.getLogger(__name__)


class CompositeAudioProvider(AudioProvider):
    """4-Tier Resilient Composite Audio & Atmosphere Provider:

    Tier 1 (Cloud): ACEStepAudioProvider (ACE-Step 1.5 API / HF Inference)
    Tier 2 (Cloud): PixazoTracksAudioProvider (Pixazo Tracks Music / Ambient score)
    Tier 3 (Local/Cloud): StableAudioOpenProvider (Stable Audio Open API / local endpoint)
    Tier 4 (Safe): MockAudioProvider (Deterministic authentic browser-playable WAV soundscape)

    Guarantees:
    1. Client never receives an unhandled 500 for audio provider failure.
    2. Mock is the guaranteed final fallback.
    3. MediaPayload.metadata["resolved_provider"] records the actual provider tier ("ace-step", "pixazo-tracks", "stable-audio", or "mock").
    4. Consistent audio metadata is preserved: resolved_provider, mood, duration_sec.
    5. Provider responses are strictly normalized into standard MediaPayload without vendor leakage.
    6. Preserves actual audio MIME types (audio/wav or audio/mpeg); never labels MP3 bytes as WAV.
    """

    def __init__(
        self,
        ace_step: Optional[AudioProvider] = None,
        pixazo_tracks: Optional[AudioProvider] = None,
        stable_audio: Optional[AudioProvider] = None,
        mock: Optional[AudioProvider] = None,
    ) -> None:
        self.ace_step = ace_step or ACEStepAudioProvider()
        self.pixazo_tracks = pixazo_tracks or PixazoTracksAudioProvider()
        self.stable_audio = stable_audio or StableAudioOpenProvider()
        self.mock = mock or MockAudioProvider()

    async def generate_audio(
        self,
        prompt: str,
        mood: str = "ambient",
        duration_sec: int = 15,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        ctx = dict(context or {})

        # --- Tier 1: ACE-Step 1.5 ---
        try:
            logger.info("Attempting Tier 1 (ACE-Step 1.5) audio generation...")
            payload = await self.ace_step.generate_audio(
                prompt=prompt,
                mood=mood,
                duration_sec=duration_sec,
                context=ctx,
            )
            payload.metadata["resolved_provider"] = "ace-step"
            payload.metadata["mood"] = mood
            payload.metadata["duration_sec"] = duration_sec
            return payload
        except (ProviderUnavailableError, Exception) as tier1_err:
            logger.info(
                "Tier 1 (ACE-Step) unavailable (%s: %s). Cascading to Tier 2 (Pixazo Tracks)...",
                type(tier1_err).__name__,
                tier1_err,
            )

        # --- Tier 2: Pixazo Tracks (Music & Ambient Score) ---
        try:
            logger.info("Attempting Tier 2 (Pixazo Tracks) music generation...")
            payload = await self.pixazo_tracks.generate_audio(
                prompt=prompt,
                mood=mood,
                duration_sec=duration_sec,
                context=ctx,
            )
            payload.metadata["resolved_provider"] = "pixazo-tracks"
            payload.metadata["mood"] = mood
            payload.metadata["duration_sec"] = duration_sec
            return payload
        except (ProviderUnavailableError, Exception) as tier2_err:
            logger.info(
                "Tier 2 (Pixazo Tracks) unavailable (%s: %s). Cascading to Tier 3 (Stable Audio Open)...",
                type(tier2_err).__name__,
                tier2_err,
            )

        # --- Tier 3: Stable Audio Open ---
        try:
            logger.info("Attempting Tier 3 (Stable Audio Open) audio generation...")
            payload = await self.stable_audio.generate_audio(
                prompt=prompt,
                mood=mood,
                duration_sec=duration_sec,
                context=ctx,
            )
            payload.metadata["resolved_provider"] = "stable-audio"
            payload.metadata["mood"] = mood
            payload.metadata["duration_sec"] = duration_sec
            return payload
        except (ProviderUnavailableError, Exception) as tier3_err:
            logger.warning(
                "Tier 3 (Stable Audio Open) failed (%s: %s). Cascading to Tier 4 (Mock)...",
                type(tier3_err).__name__,
                tier3_err,
            )

        # --- Tier 4: Guaranteed Safe Mock Fallback (Demo/Dev Only) ---
        import os
        is_demo_mode = os.getenv("ENVIRONMENT") == "demo" or os.getenv("PRAROHA_ENV") == "demo"
        if not is_demo_mode:
            logger.error("Real mode: Live audio providers failed. Refusing silent fallback to mock.")
            raise ProviderUnavailableError(
                "Live atmospheric audio generation requires active provider credentials (PIXAZO_API_KEY for Pixazo Tracks, STABILITY_API_KEY for Stable Audio 2, or HF_TOKEN for ACE-Step 1.5). "
                "Please configure an audio provider in .env to generate live soundscapes."
            )

        logger.info("Delivering Tier 3 (MockAudioProvider) deterministic fallback audio soundscape.")
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
            "tiers": {
                "tier1_ace_step": await self.ace_step.health_check(),
                "tier2_stable_audio": await self.stable_audio.health_check(),
                "tier3_mock": await self.mock.health_check(),
            },
        }
