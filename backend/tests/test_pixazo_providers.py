import asyncio
from unittest.mock import AsyncMock, patch
import httpx
import pytest

from backend.app.providers.media.base import MediaPayload, ProviderUnavailableError
from backend.app.providers.media.composite_audio import CompositeAudioProvider
from backend.app.providers.media.composite_video import CompositeVideoProvider
from backend.app.providers.media.factory import MediaProviderFactory
from backend.app.providers.media.json2video import JSON2VideoCompositionProvider
from backend.app.providers.media.pixazo_tracks import PixazoTracksAudioProvider
from backend.app.providers.media.pixazo_video import PixazoVideoProvider


@pytest.mark.asyncio
async def test_pixazo_video_submission_and_polling():
    """Validates Pixazo video submission, APIM auth header, polling, and MP4 validation."""
    provider = PixazoVideoProvider(
        api_key="pixazo_test_secret_key",
        gateway_url="https://gateway.pixazo.ai",
        timeout_sec=10.0,
    )

    submit_resp = httpx.Response(
        202,
        json={"request_id": "req-12345", "status": "IN_PROGRESS"},
    )
    status_resp = httpx.Response(
        200,
        json={"status": "COMPLETED", "media_url": "https://cdn.pixazo.ai/videos/req-12345.mp4"},
    )
    download_resp = httpx.Response(
        200,
        content=b"\x00\x00\x00\x20ftypisom" + b"\x00" * 300,
        headers={"content-type": "video/mp4"},
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:

        mock_post.return_value = submit_resp
        mock_get.side_effect = [status_resp, download_resp]

        payload = await provider.generate_video(
            prompt="Ethereal floating ancient citadel",
            duration_sec=5,
            context={"aspect_ratio": "16:9"},
        )

        mock_post.assert_called_once()
        post_kwargs = mock_post.call_args.kwargs
        assert post_kwargs["headers"]["Ocp-Apim-Subscription-Key"] == "pixazo_test_secret_key"
        assert post_kwargs["json"]["prompt"] == "Ethereal floating ancient citadel"
        assert post_kwargs["json"]["duration"] == 5
        assert post_kwargs["json"]["aspect_ratio"] == "16:9"

        assert payload.mime_type == "video/mp4"
        assert payload.metadata["resolved_provider"] == "pixazo-video"
        assert payload.metadata["provider_label"] == "Pixazo Video"
        assert payload.metadata["duration_sec"] == 5
        assert b"ftyp" in payload.data


@pytest.mark.asyncio
async def test_pixazo_video_quota_rejection_402():
    """Validates that HTTP 402 returns explicit ProviderUnavailableError without silent paid fallback."""
    provider = PixazoVideoProvider(api_key="pixazo_key")

    submit_resp = httpx.Response(
        402,
        json={"error": "Insufficient credits or unpaid account"},
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = submit_resp

        with pytest.raises(ProviderUnavailableError) as exc_info:
            await provider.generate_video(prompt="Canyon river at sunset")

        assert "insufficient credits" in str(exc_info.value).lower() or "402" in str(exc_info.value)


@pytest.mark.asyncio
async def test_pixazo_video_duration_clamping():
    """Validates duration clamping to safe 3s-10s range."""
    provider = PixazoVideoProvider(api_key="pixazo_key")

    mock_resp = httpx.Response(
        200,
        content=b"\x00\x00\x00\x20ftypisom" + b"\x00" * 100,
        headers={"content-type": "video/mp4"},
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        # Request 120s -> clamped to 10s
        payload = await provider.generate_video(prompt="Sunset", duration_sec=120)
        assert mock_post.call_args.kwargs["json"]["duration"] == 10

        # Request 1s -> clamped to 3s
        payload_short = await provider.generate_video(prompt="Dawn", duration_sec=1)
        assert mock_post.call_args.kwargs["json"]["duration"] == 3


@pytest.mark.asyncio
async def test_pixazo_tracks_audio_submission_and_polling():
    """Validates Pixazo Tracks music generation, header, bounded polling, and audio detection."""
    provider = PixazoTracksAudioProvider(
        api_key="pixazo_audio_key",
        timeout_sec=10.0,
    )

    submit_resp = httpx.Response(
        202,
        json={"request_id": "trk-999"},
    )
    status_resp = httpx.Response(
        200,
        json={"status": "COMPLETED", "media_url": "https://cdn.pixazo.ai/music/trk-999.mp3"},
    )
    download_resp = httpx.Response(
        200,
        content=b"ID3\x03\x00\x00\x00\x00\x00\x00\xff\xfb\x90d" + b"\x00" * 200,
        headers={"content-type": "audio/mpeg"},
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:

        mock_post.return_value = submit_resp
        mock_get.side_effect = [status_resp, download_resp]

        payload = await provider.generate_audio(
            prompt="Peaceful bamboo forest meditation",
            mood="zen-ambient",
            duration_sec=10,
        )

        post_kwargs = mock_post.call_args.kwargs
        assert post_kwargs["headers"]["Ocp-Apim-Subscription-Key"] == "pixazo_audio_key"
        assert post_kwargs["json"]["prompt"] == "Peaceful bamboo forest meditation"
        assert post_kwargs["json"]["duration"] == 10
        assert post_kwargs["json"]["mood"] == "zen-ambient"

        assert payload.mime_type == "audio/mpeg"
        assert payload.metadata["resolved_provider"] == "pixazo-tracks"
        assert payload.metadata["acoustic_nature"] == "ambient_music"
        assert "not environmental sound effects" in payload.metadata["note"]


@pytest.mark.asyncio
async def test_pixazo_tracks_quota_rejection_402():
    """Validates Pixazo Tracks handles HTTP 402 with explicit quota error."""
    provider = PixazoTracksAudioProvider(api_key="pixazo_key")

    submit_resp = httpx.Response(
        402,
        json={"error": "Insufficient credits"},
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = submit_resp

        with pytest.raises(ProviderUnavailableError) as exc_info:
            await provider.generate_audio(prompt="Dark synthwave")

        assert "402" in str(exc_info.value) or "insufficient credits" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_json2video_composition_provider():
    """Validates JSON2Video as a composition preview provider (not generative AI video)."""
    provider = JSON2VideoCompositionProvider()

    payload = await provider.generate_video(
        prompt="Scene 1 preview",
        duration_sec=5,
        context={
            "image_url": "https://example.com/scene1.jpg",
            "audio_url": "https://example.com/narration1.mp3",
            "aspect_ratio": "16:9",
        },
    )

    assert payload.mime_type == "video/mp4"
    assert payload.metadata["resolved_provider"] == "json2video-composition"
    assert payload.metadata["is_synthetic"] is True
    assert "Composed Cinematic Preview" in payload.metadata["provider_label"]
    assert b"ftyp" in payload.data


@pytest.mark.asyncio
async def test_factory_resolves_pixazo_and_json2video(monkeypatch):
    """Validates MediaProviderFactory selects new providers via environment variables."""
    monkeypatch.setenv("VIDEO_PROVIDER", "pixazo")
    v_prov = MediaProviderFactory.get_video_provider()
    assert isinstance(v_prov, PixazoVideoProvider)

    monkeypatch.setenv("VIDEO_PROVIDER", "json2video")
    v_prov_comp = MediaProviderFactory.get_video_provider()
    assert isinstance(v_prov_comp, JSON2VideoCompositionProvider)

    monkeypatch.setenv("AUDIO_PROVIDER", "pixazo")
    a_prov = MediaProviderFactory.get_audio_provider()
    assert isinstance(a_prov, PixazoTracksAudioProvider)


@pytest.mark.asyncio
async def test_composite_video_cascade_with_pixazo():
    """Validates CompositeVideoProvider prioritizes Pixazo when available and cascades on outage."""
    pixazo_mock = AsyncMock(spec=PixazoVideoProvider)
    pixazo_mock.generate_video.side_effect = ProviderUnavailableError("Pixazo 402 quota exhausted")

    pyramid_mock = AsyncMock()
    pyramid_mock.generate_video.return_value = MediaPayload(
        data=b"\x00\x00\x00\x20ftypisom" + b"\x00" * 100,
        mime_type="video/mp4",
        filename="pyramid.mp4",
        metadata={"resolved_provider": "pyramid-flow"},
    )

    composite = CompositeVideoProvider(pixazo=pixazo_mock, pyramid=pyramid_mock)
    payload = await composite.generate_video(prompt="Divergent city", duration_sec=5)

    assert payload.metadata["resolved_provider"] == "pyramid-flow"
    pixazo_mock.generate_video.assert_called_once()
    pyramid_mock.generate_video.assert_called_once()


@pytest.mark.asyncio
async def test_composite_audio_cascade_with_pixazo_tracks():
    """Validates CompositeAudioProvider cascades to Pixazo Tracks when ACE-Step is unconfigured."""
    ace_mock = AsyncMock()
    ace_mock.generate_audio.side_effect = ProviderUnavailableError("ACE-Step unavailable")

    tracks_mock = AsyncMock(spec=PixazoTracksAudioProvider)
    tracks_mock.generate_audio.return_value = MediaPayload(
        data=b"ID3" + b"\x00" * 150,
        mime_type="audio/mpeg",
        filename="tracks.mp3",
        metadata={"resolved_provider": "pixazo-tracks", "mood": "ambient"},
    )

    composite = CompositeAudioProvider(ace_step=ace_mock, pixazo_tracks=tracks_mock)
    payload = await composite.generate_audio(prompt="Temple ruins morning wind", mood="ambient", duration_sec=10)

    assert payload.metadata["resolved_provider"] == "pixazo-tracks"
    ace_mock.generate_audio.assert_called_once()
    tracks_mock.generate_audio.assert_called_once()
