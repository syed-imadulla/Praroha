import pytest
from unittest.mock import AsyncMock, patch
import httpx

from backend.app.providers.media.base import MediaPayload, ProviderUnavailableError
from backend.app.providers.media.factory import MediaProviderFactory
from backend.app.providers.media.rewind_video import RewindVideoProvider
from backend.app.providers.media.rewind_audio import RewindMusicAudioProvider
from backend.app.providers.media.mock import _generate_minimal_mp4_bytes, _generate_wav_bytes


@pytest.mark.asyncio
async def test_rewind_video_duration_clamping_and_fallback():
    """Validates RewindVideoProvider clamps duration to 4s-12s and provides valid MP4 fallback."""
    provider = RewindVideoProvider(api_key="")
    # Request 2 seconds -> should clamp to 4 seconds
    payload = await provider.generate_video(prompt="Serene forest", duration_sec=2)
    assert isinstance(payload, MediaPayload)
    assert payload.mime_type == "video/mp4"
    assert payload.metadata["duration_sec"] == 4
    assert payload.metadata["resolved_provider"] == "rewind-video"
    assert payload.data[4:8] == b"ftyp"


@pytest.mark.asyncio
async def test_rewind_video_simulated_outage():
    """Validates RewindVideoProvider raises ProviderUnavailableError on simulated outage."""
    provider = RewindVideoProvider(api_key="test-key")
    with pytest.raises(ProviderUnavailableError, match="outage"):
        await provider.generate_video(
            prompt="Temple mist",
            duration_sec=5,
            context={"simulate_rewind_unavailable": True},
        )


@pytest.mark.asyncio
async def test_rewind_video_insufficient_tokens_handling():
    """Validates RewindVideoProvider maps HTTP 429 INSUFFICIENT_TOKENS to ProviderUnavailableError."""
    provider = RewindVideoProvider(api_key="sk-test-token")

    async def mock_post(*args, **kwargs):
        return httpx.Response(
            429,
            json={
                "error": {
                    "code": "INSUFFICIENT_TOKENS",
                    "message": "Insufficient tokens: required 59308, available 400",
                }
            },
            request=httpx.Request("POST", "https://api.rewind.ai/v1/videos/generate-async"),
        )

    with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
        with pytest.raises(ProviderUnavailableError, match="insufficient token balance"):
            await provider.generate_video(prompt="Shrine river", duration_sec=4)


@pytest.mark.asyncio
async def test_rewind_video_successful_poll_and_download():
    """Validates RewindVideoProvider async submission, polling, and genuine MP4 validation."""
    provider = RewindVideoProvider(api_key="sk-test-token")
    mp4_bytes = _generate_minimal_mp4_bytes()

    async def mock_post(*args, **kwargs):
        return httpx.Response(
            200,
            json={"jobId": "job-seedance-1234"},
            request=httpx.Request("POST", "https://api.rewind.ai/v1/videos/generate-async"),
        )

    async def mock_get(url, *args, **kwargs):
        if "jobs" in str(url):
            return httpx.Response(
                200,
                json={"status": "completed", "result": {"url": "https://api.rewind.ai/files/video123.mp4"}},
                request=httpx.Request("GET", str(url)),
            )
        elif "video123.mp4" in str(url):
            return httpx.Response(
                200,
                content=mp4_bytes,
                headers={"Content-Type": "video/mp4"},
                request=httpx.Request("GET", str(url)),
            )
        return httpx.Response(404, request=httpx.Request("GET", str(url)))

    with patch.object(httpx.AsyncClient, "post", side_effect=mock_post), \
         patch.object(httpx.AsyncClient, "get", side_effect=mock_get):
        payload = await provider.generate_video(prompt="Bamboo grove", duration_sec=5)
        assert payload.mime_type == "video/mp4"
        assert payload.metadata["resolved_provider"] == "rewind-video"
        assert payload.metadata["job_id"] == "job-seedance-1234"
        assert payload.metadata["is_synthetic"] is False
        assert payload.data == mp4_bytes


@pytest.mark.asyncio
async def test_rewind_music_ambient_disclosure_and_fallback():
    """Validates RewindMusicAudioProvider explicitly tags ambient music and does not claim foley."""
    provider = RewindMusicAudioProvider(api_key="")
    payload = await provider.generate_atmosphere(prompt="Dusk meditation", duration_sec=15)
    assert isinstance(payload, MediaPayload)
    assert payload.metadata["is_ambient_music"] is True
    assert payload.metadata["resolved_provider"] == "rewind-music"
    assert payload.mime_type in ("audio/wav", "audio/mpeg")


@pytest.mark.asyncio
async def test_rewind_music_simulated_outage():
    """Validates RewindMusicAudioProvider raises ProviderUnavailableError on simulated outage."""
    provider = RewindMusicAudioProvider(api_key="test-key")
    with pytest.raises(ProviderUnavailableError, match="outage"):
        await provider.generate_atmosphere(
            prompt="Drone meditation",
            context={"simulate_rewind_audio_unavailable": True},
        )


@pytest.mark.asyncio
async def test_rewind_music_successful_generation():
    """Validates RewindMusicAudioProvider generates audio payload with Lyria model."""
    provider = RewindMusicAudioProvider(api_key="sk-test-token")
    mock_audio = _generate_wav_bytes(duration_sec=10.0, freq=220.0)

    async def mock_post(*args, **kwargs):
        return httpx.Response(
            200,
            json={
                "created": 1791710514,
                "data": [{"url": "https://api.rewind.ai/files/track123.mp3"}],
                "lyrics": "<instrumental>",
            },
            request=httpx.Request("POST", "https://api.rewind.ai/v1/music/generations"),
        )

    async def mock_get(url, *args, **kwargs):
        return httpx.Response(
            200,
            content=mock_audio,
            headers={"Content-Type": "audio/wav"},
            request=httpx.Request("GET", str(url)),
        )

    with patch.object(httpx.AsyncClient, "post", side_effect=mock_post), \
         patch.object(httpx.AsyncClient, "get", side_effect=mock_get):
        payload = await provider.generate_atmosphere(prompt="Evening raga", duration_sec=10)
        assert payload.metadata["resolved_provider"] == "rewind-music"
        assert payload.metadata["is_ambient_music"] is True
        assert payload.metadata["is_environmental_foley"] is False
        assert payload.data == mock_audio


@pytest.mark.asyncio
async def test_factory_resolves_rewind_video_and_audio(monkeypatch):
    """Validates MediaProviderFactory selects Rewind providers via environment variables."""
    monkeypatch.setenv("VIDEO_PROVIDER", "rewind")
    v_prov = MediaProviderFactory.get_video_provider()
    assert isinstance(v_prov, RewindVideoProvider)

    monkeypatch.setenv("AUDIO_PROVIDER", "rewind")
    a_prov = MediaProviderFactory.get_audio_provider()
    assert isinstance(a_prov, RewindMusicAudioProvider)
