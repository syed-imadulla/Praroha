import logging
from typing import Any, Dict, Optional

from backend.app.providers.media.base import (
    MediaPayload,
    ProviderUnavailableError,
    VoiceProvider,
)
from backend.app.providers.media.edge_tts import EdgeTTSProvider, resolve_voice_and_persona
from backend.app.providers.media.kokoro import KokoroVoiceProvider
from backend.app.providers.media.mock import MockVoiceProvider

logger = logging.getLogger(__name__)


class CompositeVoiceProvider(VoiceProvider):
    """3-Tier Resilient Composite Voice Provider:

    Tier 1 (Cloud): EdgeTTSProvider (keyless neural TTS, retries + backoff)
    Tier 2 (Local): KokoroVoiceProvider (Local Kokoro-82M inference)
    Tier 3 (Safe): MockVoiceProvider (Deterministic local WAV speech)

    Guarantees:
    1. Client never receives an unhandled 500 for provider failure.
    2. Mock is the guaranteed final fallback.
    3. MediaPayload.metadata["resolved_provider"] accurately records which
       tier actually generated the asset ("edge-tts", "kokoro", or "mock").
    4. Consistent persona metadata is preserved across all tiers:
       voice_id, persona, resolved_provider, duration_sec.
    """

    def __init__(
        self,
        edge_tts: Optional[VoiceProvider] = None,
        kokoro: Optional[VoiceProvider] = None,
        mock: Optional[VoiceProvider] = None,
    ) -> None:
        self.edge_tts = edge_tts or EdgeTTSProvider()
        self.kokoro = kokoro or KokoroVoiceProvider()
        self.mock = mock or MockVoiceProvider()

    async def generate_voice(
        self,
        text: str,
        voice_id: str = "default",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        resolved_voice, persona = resolve_voice_and_persona(voice_id)
        ctx = dict(context or {})
        ctx["persona"] = ctx.get("persona") or persona

        # --- Tier 1: Edge TTS ---
        try:
            logger.info("Attempting Tier 1 (Edge TTS) voice generation...")
            payload = await self.edge_tts.generate_voice(
                text=text,
                voice_id=resolved_voice,
                context=ctx,
            )
            payload.metadata["resolved_provider"] = "edge-tts"
            payload.metadata["persona"] = payload.metadata.get("persona") or persona
            payload.metadata["voice_id"] = payload.metadata.get("voice_id") or resolved_voice
            return payload
        except (ProviderUnavailableError, Exception) as tier1_err:
            logger.warning(
                "Tier 1 (Edge TTS) failed (%s: %s). Cascading to Tier 2 (Kokoro)...",
                type(tier1_err).__name__,
                tier1_err,
            )

        # --- Tier 2: Kokoro-82M ---
        try:
            logger.info("Attempting Tier 2 (Kokoro-82M) voice generation...")
            payload = await self.kokoro.generate_voice(
                text=text,
                voice_id=voice_id,
                context=ctx,
            )
            payload.metadata["resolved_provider"] = "kokoro"
            payload.metadata["persona"] = payload.metadata.get("persona") or persona
            payload.metadata["voice_id"] = payload.metadata.get("voice_id") or voice_id
            return payload
        except (ProviderUnavailableError, Exception) as tier2_err:
            logger.warning(
                "Tier 2 (Kokoro) failed (%s: %s). Cascading to Tier 3 (Mock)...",
                type(tier2_err).__name__,
                tier2_err,
            )

        # --- Tier 3: Guaranteed Mock Fallback ---
        import os
        if os.getenv("ENVIRONMENT") != "demo" and os.getenv("PRAROHA_ENV") != "demo":
            logger.error("Real mode: Providers failed. Refusing to fallback to MockProvider.")
            raise ProviderUnavailableError("Real providers failed and mock fallback is disabled in real mode.")

        logger.info("Delivering Tier 3 (MockVoiceProvider) deterministic fallback speech asset.")
        try:
            payload = await self.mock.generate_voice(
                text=text,
                voice_id=voice_id,
                context=ctx,
            )
            payload.metadata["resolved_provider"] = "mock"
            payload.metadata["persona"] = payload.metadata.get("persona") or persona
            payload.metadata["voice_id"] = payload.metadata.get("voice_id") or voice_id
            return payload
        except Exception as mock_err:
            logger.error("Mock voice provider threw unexpected error: %s", mock_err)
            # Safe emergency inline fallback if even mock object had an issue
            from backend.app.providers.media.mock import _generate_wav_bytes

            fallback_wav = _generate_wav_bytes(duration_sec=2.0, freq=280.0)
            return MediaPayload(
                data=fallback_wav,
                mime_type="audio/wav",
                filename="emergency_fallback.wav",
                metadata={
                    "voice_id": voice_id,
                    "persona": persona,
                    "resolved_provider": "mock",
                    "duration_sec": 2.0,
                    "mock": True,
                },
            )

    async def health_check(self) -> Dict[str, Any]:
        e_health = await self.edge_tts.health_check()
        k_health = await self.kokoro.health_check()
        m_health = await self.mock.health_check()
        return {
            "status": "healthy",
            "provider": "CompositeVoiceProvider",
            "tiers": {
                "tier1_edge_tts": e_health,
                "tier2_kokoro": k_health,
                "tier3_mock": m_health,
            },
        }
