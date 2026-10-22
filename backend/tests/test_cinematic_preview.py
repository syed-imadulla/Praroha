import os
import subprocess
import time
from unittest.mock import patch
import pytest

from backend.app.providers.media.factory import MediaProviderFactory
from backend.app.providers.media.base import ProviderUnavailableError
from backend.app.services.cinematic_preview import (
    CinematicPreviewComposer,
    CinematicPreviewResult,
    CinematicPreviewSpec,
)


def test_cinematic_preview_honest_labeling_defaults():
    """Verify that CinematicPreviewResult enforces is_synthetic: True and provider_label: 'Cinematic Preview'."""
    res = CinematicPreviewResult(status="failed", error_message="Test failure")
    assert res.metadata["is_synthetic"] is True
    assert res.metadata["provider_label"] == "Cinematic Preview"

    custom_meta = {"duration_sec": 10, "is_synthetic": False}  # Attempted override
    res2 = CinematicPreviewResult(status="completed", metadata=custom_meta)
    # The __post_init__ guarantees non-negotiable honest labeling
    assert res2.metadata["is_synthetic"] is True
    assert res2.metadata["provider_label"] == "Cinematic Preview"


def test_cinematic_preview_spec_validation():
    """Validates that CinematicPreviewSpec catches invalid fields."""
    invalid_spec = CinematicPreviewSpec(
        project_id="proj-1",
        entity_type="scene",
        entity_id="scene-1",
        title="",  # Empty title
        duration_sec=2,  # Too short
    )
    issues = invalid_spec.validate()
    assert len(issues) >= 2
    assert any("title" in i.lower() for i in issues)
    assert any("duration" in i.lower() for i in issues)


def test_cinematic_preview_missing_image_graceful_static_fallback():
    """Missing visual concept art must gracefully return a static fallback, not fake media."""
    composer = CinematicPreviewComposer()
    spec = CinematicPreviewSpec(
        project_id="proj-test",
        entity_type="scene",
        entity_id="scene-no-image",
        title="Sanctuary in the Clouds",
        image_path="/path/to/nonexistent/image.png",
        duration_sec=10,
    )
    result = composer.compose(spec)
    assert result.status == "static_fallback"
    assert result.video_bytes is None
    assert result.metadata["is_synthetic"] is True
    assert result.metadata["provider_label"] == "Cinematic Preview"
    assert result.metadata["preview_type"] == "static_keyframe"
    assert result.metadata["title"] == "Sanctuary in the Clouds"


def test_cinematic_preview_timeout_isolation():
    """Simulates a worker timeout and confirms the caller process is isolated from hanging."""
    composer = CinematicPreviewComposer()
    dummy_image = "gallery/gallery_04_stage3_divergent_worlds.png"
    if not os.path.exists(dummy_image):
        pytest.skip("Test asset missing")

    spec = CinematicPreviewSpec(
        project_id="proj-timeout",
        entity_type="scene",
        entity_id="scene-timeout",
        title="Frozen Spire",
        image_path=dummy_image,
        duration_sec=10,
    )

    with patch("subprocess.run", side_effect=subprocess.TimeoutExpired(cmd="ffmpeg", timeout=0.01)):
        result = composer.compose(spec, timeout_sec=0.01)
        assert result.status == "failed"
        assert "timed out" in result.error_message.lower()
        assert result.metadata["is_synthetic"] is True
        assert result.metadata["provider_label"] == "Cinematic Preview"


def test_cinematic_preview_actual_render_with_existing_assets():
    """Renders a real 5-second cinematic motion preview using existing workspace assets."""
    composer = CinematicPreviewComposer()
    if not composer.is_ffmpeg_available():
        pytest.skip("FFmpeg not installed on host")

    image_path = "gallery/gallery_04_stage3_divergent_worlds.png"
    voice_path = "uploads/projects/e3a497bc-5c8d-4283-9384-c781551b6ecb/media/audio/95c392ef-a345-4448-881c-73ab7112c7d3.mp3"
    ambient_path = "uploads/media/audio/51f7bcd5-6f0a-473f-af4f-dcca5687f390.wav"

    if not os.path.exists(image_path):
        pytest.skip("Benchmark image not found")

    spec = CinematicPreviewSpec(
        project_id="proj-e2e",
        entity_type="scene",
        entity_id="scene-real-render",
        title="The Luminescent Grove",
        location_setting="Inner Canopy",
        image_path=image_path,
        voice_path=voice_path if os.path.exists(voice_path) else None,
        ambient_path=ambient_path if os.path.exists(ambient_path) else None,
        duration_sec=5,
    )

    result = composer.compose(spec, timeout_sec=15.0)
    assert result.status == "completed"
    assert result.video_path is not None
    assert os.path.exists(result.video_path)
    assert len(result.video_bytes) > 10000
    assert result.mime_type == "video/mp4"

    # Verify honest metadata contract
    assert result.metadata["is_synthetic"] is True
    assert result.metadata["provider_label"] == "Cinematic Preview"
    assert result.metadata["duration_sec"] == 5
    assert result.metadata["resolution"] == "720p"
    assert result.metadata["aspect_ratio"] == "16:9"

    # Verify standard MP4 box markers in output
    assert b"ftyp" in result.video_bytes
    assert b"moov" in result.video_bytes


def test_retired_providers_are_completely_absent():
    """Guarantees that all 5 retired providers (HF, Stability, Pixazo, JSON2Video, Rewind) cannot be activated."""
    retired_video_providers = ["json2video", "pixazo", "rewind", "composition", "pyramid_flow"]
    for provider in retired_video_providers:
        with patch.dict(os.environ, {"VIDEO_PROVIDER": provider}):
            with pytest.raises(ProviderUnavailableError) as exc_info:
                MediaProviderFactory.get_video_provider()
            assert "retired" in str(exc_info.value).lower()

    retired_audio_providers = ["stable_audio", "pixazo", "pixazo_tracks", "rewind", "rewind_music", "ace_step"]
    for provider in retired_audio_providers:
        with patch.dict(os.environ, {"AUDIO_PROVIDER": provider}):
            with pytest.raises(ProviderUnavailableError) as exc_info:
                MediaProviderFactory.get_audio_provider()
            assert "retired" in str(exc_info.value).lower()


def test_main_api_process_isolation():
    """Guarantees that the core FastAPI application does not import or depend on heavy video rendering packages."""
    from backend.app.main import app
    assert app is not None

    # Check imported sys.modules to ensure headless browser or puppeteer are not loaded into web server
    import sys
    forbidden_modules = ["puppeteer", "playwright", "selenium"]
    for mod in forbidden_modules:
        assert mod not in sys.modules, f"Forbidden renderer module '{mod}' found loaded in API process!"
