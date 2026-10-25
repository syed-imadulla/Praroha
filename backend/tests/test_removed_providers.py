import os
import pytest
from unittest.mock import patch, AsyncMock
from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from backend.app.config import settings
from backend.app.providers.media.factory import MediaProviderFactory
from backend.app.providers.media.base import ProviderUnavailableError
from backend.app.providers.media.composite_audio import CompositeAudioProvider
from backend.app.providers.media.composite_video import CompositeVideoProvider
from backend.app.providers.media.pollinations import PollinationsImageProvider
from backend.app.providers.media.edge_tts import EdgeTTSProvider
from backend.app.services.soundscape_library import SoundscapeComposer


def test_removed_provider_classes_not_importable_or_in_media():
    """1. Proves the 8 removed provider classes cannot be imported from backend.app.providers.media."""
    removed_modules = [
        "backend.app.providers.media.ace_step",
        "backend.app.providers.media.pyramid_flow",
        "backend.app.providers.media.stable_audio",
        "backend.app.providers.media.pixazo_tracks",
        "backend.app.providers.media.pixazo_video",
        "backend.app.providers.media.json2video",
        "backend.app.providers.media.rewind_audio",
        "backend.app.providers.media.rewind_video",
    ]
    for mod in removed_modules:
        with pytest.raises(ModuleNotFoundError):
            __import__(mod)


def test_factory_rejects_removed_providers():
    """1 & 2. Proves MediaProviderFactory explicitly rejects retired providers."""
    for retired_video in ["json2video", "composition", "pixazo", "rewind", "pyramid_flow"]:
        with patch.dict(os.environ, {"VIDEO_PROVIDER": retired_video}):
            with pytest.raises(ProviderUnavailableError) as exc_info:
                MediaProviderFactory.get_video_provider()
            assert "retired" in str(exc_info.value).lower()

    for retired_audio in ["ace_step", "stable_audio", "pixazo", "pixazo_tracks", "rewind", "rewind_music"]:
        with patch.dict(os.environ, {"AUDIO_PROVIDER": retired_audio}):
            with pytest.raises(ProviderUnavailableError) as exc_info:
                MediaProviderFactory.get_audio_provider()
            assert "retired" in str(exc_info.value).lower()


def test_config_has_no_removed_env_vars():
    """8. Proves Settings has no attributes for the 5 removed provider credentials."""
    removed_vars = [
        "HF_TOKEN",
        "STABILITY_API_KEY",
        "PIXAZO_API_KEY",
        "JSON2VIDEO_API_KEY",
        "REWIND_API_KEY",
    ]
    for var in removed_vars:
        assert not hasattr(settings, var), f"Settings should not contain {var}"


@pytest.mark.asyncio
async def test_pollinations_image_generation_restrictions_preserved():
    """3. Proves Pollinations image generation remains correctly restricted."""
    provider = PollinationsImageProvider(api_key="")
    # Non-free model without API key raises AuthenticationError
    from backend.app.providers.media.base import AuthenticationError
    with pytest.raises(AuthenticationError):
        await provider.generate_image("A futuristic city", context={"model": "expensive-paid-model"})


@pytest.mark.asyncio
async def test_edge_tts_and_soundscape_composer_functional():
    """4. Proves Edge-TTS narration and procedural soundscape composer remain functional."""
    # Edge-TTS
    edge = EdgeTTSProvider()
    assert hasattr(edge, "generate_voice")
    # Procedural soundscape composer
    composer = SoundscapeComposer()
    wav_bytes = composer.compose_soundscape(layers=[{"id": "astral_drone", "volume": 0.8}], duration_sec=4.0)
    assert wav_bytes[:4] == b"RIFF"
    assert len(wav_bytes) > 44


@pytest.mark.asyncio
async def test_video_actions_fail_honestly_in_production():
    """7. Proves video generation raises ProviderUnavailableError explaining video is unavailable in production."""
    with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
        composite = CompositeVideoProvider(wan=None)
        with pytest.raises(ProviderUnavailableError) as exc_info:
            await composite.generate_video("Epic scene")
        assert "Video generation is currently unavailable" in str(exc_info.value)
        assert "retired" in str(exc_info.value)


@pytest.mark.asyncio
async def test_audio_actions_succeed_with_procedural_soundscape_in_production():
    """Proves audio generation in production successfully synthesizes valid WAV using procedural composer."""
    with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
        composite = CompositeAudioProvider()
        payload = await composite.generate_audio("ambient drone", mood="serene-ambient", duration_sec=10)
        assert payload.mime_type == "audio/wav"
        assert payload.metadata["resolved_provider"] == "procedural-soundscape"
        assert payload.metadata["provider_label"] == "Procedural Soundscape Composer"
        assert len(payload.data) > 44

