import asyncio
import io
import json
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from backend.app.models.unfold import CharacterRecord, SceneRecord
from backend.app.models.media import MediaAssetRecord, MediaGenerationRequest
from backend.app.models.project import ProjectCreate
from backend.app.providers.media.base import (
    MediaPayload,
    ProviderUnavailableError,
)
from backend.app.providers.media.composite_voice import CompositeVoiceProvider
from backend.app.providers.media.edge_tts import (
    CURATED_VOICE_PERSONAS,
    EdgeTTSProvider,
    resolve_voice_and_persona,
)
from backend.app.providers.media.kokoro import KokoroVoiceProvider
from backend.app.providers.media.mock import MockVoiceProvider
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.media_service import MediaService


@pytest.mark.asyncio
async def test_edgetts_voice_persona_mapping():
    """Validates all 6 locked voice personas resolve to valid neural voices."""
    expected_mappings = {
        "narrator-deep": "en-US-ChristopherNeural",
        "protagonist-resolute": "en-US-GuyNeural",
        "inquiring-youth": "en-US-JennyNeural",
        "mentor-sage": "en-GB-RyanNeural",
        "calm-mystic": "en-GB-SoniaNeural",
        "brooding-antagonist": "en-US-EricNeural",
    }
    for slug, voice in expected_mappings.items():
        assert slug in CURATED_VOICE_PERSONAS
        assert CURATED_VOICE_PERSONAS[slug]["voice"] == voice
        resolved_v, resolved_slug = resolve_voice_and_persona(slug)
        assert resolved_v == voice
        assert resolved_slug == slug

    # Reverse resolution: exact neural voice name resolves back to persona slug
    resolved_v, resolved_slug = resolve_voice_and_persona("en-US-GuyNeural")
    assert resolved_v == "en-US-GuyNeural"
    assert resolved_slug == "protagonist-resolute"

    # Default / empty resolution
    resolved_v, resolved_slug = resolve_voice_and_persona("default")
    assert resolved_v == "en-US-ChristopherNeural"
    assert resolved_slug == "narrator-deep"


@pytest.mark.asyncio
async def test_edgetts_retry_and_backoff_recovery():
    """Simulates transient failure on attempt 1, success on attempt 2; verifies retry recovers."""
    provider = EdgeTTSProvider(max_retries=2, backoff_factor=0.01)

    fake_mp3 = b"\xff\xfb\x90\x44" + (b"\x00" * 80)

    class MockCommunicateFail:
        def __init__(self, *args, **kwargs):
            pass

        async def stream(self):
            raise ConnectionResetError("Transient network reset")
            yield {}  # noqa

    class MockCommunicateSuccess:
        def __init__(self, *args, **kwargs):
            pass

        async def stream(self):
            yield {"type": "audio", "data": fake_mp3}

    attempts = [MockCommunicateFail, MockCommunicateSuccess]

    def factory(*args, **kwargs):
        cls = attempts.pop(0)
        return cls(*args, **kwargs)

    mock_mod = MagicMock()
    mock_mod.Communicate = factory
    with patch.dict("sys.modules", {"edge_tts": mock_mod}):
        payload = await provider.generate_voice("Greetings from the underwater city.", voice_id="mentor-sage")
        assert payload.data == fake_mp3
        assert payload.mime_type == "audio/mpeg"
        assert payload.metadata["resolved_provider"] == "edge-tts"
        assert payload.metadata["voice_id"] == "en-GB-RyanNeural"
        assert payload.metadata["persona"] == "mentor-sage"
        assert payload.metadata["duration_sec"] > 0


@pytest.mark.asyncio
async def test_edgetts_retry_exhaustion_cascades_to_fallback():
    """Simulates persistent failure across all attempts; verifies ProviderUnavailableError is raised."""
    provider = EdgeTTSProvider(max_retries=2, backoff_factor=0.01)

    class MockCommunicatePersistentFail:
        def __init__(self, *args, **kwargs):
            pass

        async def stream(self):
            raise TimeoutError("WebSocket timed out")
            yield {}  # noqa

    mock_mod = MagicMock()
    mock_mod.Communicate = MockCommunicatePersistentFail
    with patch.dict("sys.modules", {"edge_tts": mock_mod}):
        with pytest.raises(ProviderUnavailableError) as exc_info:
            await provider.generate_voice("Testing retry exhaustion.", voice_id="narrator-deep")
        assert "EdgeTTS synthesis failed after 3 attempts" in str(exc_info.value)


@pytest.mark.asyncio
async def test_3_tier_fallback_edgetts_fail_kokoro_success():
    """Explicitly verifies:

    Edge TTS fails
        ↓
    Kokoro succeeds
        → resolved_provider = "kokoro"
    Asserts no unhandled 500 error, and consistent metadata (voice_id, persona, duration_sec).
    """
    mock_edge = AsyncMock(spec=EdgeTTSProvider)
    mock_edge.generate_voice.side_effect = ProviderUnavailableError("Edge TTS unavailable")

    fake_kokoro_wav = b"RIFF" + (b"\x00" * 36) + b"data" + (b"\x00" * 40)
    mock_kokoro = AsyncMock(spec=KokoroVoiceProvider)
    mock_kokoro.generate_voice.return_value = MediaPayload(
        data=fake_kokoro_wav,
        mime_type="audio/wav",
        filename="kokoro_asset.wav",
        metadata={
            "voice_id": "am_adam",
            "persona": "protagonist-resolute",
            "resolved_provider": "kokoro",
            "duration_sec": 3.5,
        },
    )

    mock_fallback = AsyncMock(spec=MockVoiceProvider)

    composite = CompositeVoiceProvider(
        edge_tts=mock_edge,
        kokoro=mock_kokoro,
        mock=mock_fallback,
    )

    payload = await composite.generate_voice(
        "I must navigate through the subterranean canal.",
        voice_id="protagonist-resolute",
    )

    assert payload.data == fake_kokoro_wav
    assert payload.metadata["resolved_provider"] == "kokoro"
    assert payload.metadata["persona"] == "protagonist-resolute"
    assert payload.metadata["voice_id"] == "am_adam"
    assert payload.metadata["duration_sec"] == 3.5
    mock_fallback.generate_voice.assert_not_called()



@pytest.mark.asyncio
async def test_3_tier_fallback_edgetts_and_kokoro_fail_mock_success():
    """Explicitly verifies:

    Edge TTS fails
        ↓
    Kokoro fails
        ↓
    Mock succeeds
        → resolved_provider = "mock"
    Asserts zero unhandled 500 errors, valid WAV binary, and consistent metadata.
    """
    mock_edge = AsyncMock(spec=EdgeTTSProvider)
    mock_edge.generate_voice.side_effect = ProviderUnavailableError("Edge TTS connection failed")

    mock_kokoro = AsyncMock(spec=KokoroVoiceProvider)
    mock_kokoro.generate_voice.side_effect = ProviderUnavailableError("Kokoro microservice unreachable")

    real_mock = MockVoiceProvider()
    composite = CompositeVoiceProvider(
        edge_tts=mock_edge,
        kokoro=mock_kokoro,
        mock=real_mock,
    )

    payload = await composite.generate_voice(
        "Under the drowned domes, silent guardians watch.",
        voice_id="calm-mystic",
    )

    assert payload.data.startswith(b"RIFF")
    assert payload.mime_type == "audio/wav"
    assert payload.metadata["resolved_provider"] == "mock"
    assert payload.metadata["persona"] == "calm-mystic"
    assert payload.metadata["voice_id"] == "calm-mystic"
    assert payload.metadata["duration_sec"] > 0
    assert payload.metadata["mock"] is True


@pytest.mark.asyncio
async def test_deterministic_spoken_script_derivation():
    """Asserts creator-supplied text is preserved exactly without rewriting,

    and canonical templates are derived deterministically when empty.
    """
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = await repo.create_canonical_demo_project()
        unfolded = await repo.get_unfolded_universe(project.id)
        assert unfolded is not None
        char = unfolded.characters[0]
        scene = unfolded.scenes[0]


        # Mock Voice Provider to capture passed text
        captured_texts = []


        class SpyVoiceProvider(MockVoiceProvider):
            async def generate_voice(self, text, voice_id="default", context=None):
                captured_texts.append(text)
                return await super().generate_voice(text, voice_id, context)

        from backend.app.providers.storage import LocalStorageProvider
        from backend.app.providers.media.factory import ConfiguredMediaProvider
        from backend.app.providers.media.mock import MockImageProvider, MockVideoProvider, MockAudioProvider

        spy_provider = SpyVoiceProvider()
        media_provider = ConfiguredMediaProvider(
            image=MockImageProvider(),
            voice=spy_provider,
            video=MockVideoProvider(),
            audio=MockAudioProvider(),
        )
        service = MediaService(repo=repo, storage=LocalStorageProvider(upload_dir="./uploads"), media_provider=media_provider)

        # 1. Creator explicitly supplies spoken text -> PRESERVE EXACTLY
        creator_speech = "Listen closely. The tide is turning, and we cannot afford to hesitate."
        req1 = MediaGenerationRequest(
            entity_type="character",
            entity_id=char.id,
            media_type="voice",
            prompt=creator_speech,
            voice_id="protagonist-resolute",
        )
        job1 = await service.dispatch_job(project_id=project.id, request=req1)
        asset1 = await service.process_job_now(job1.job_id, req1)
        assert asset1.status == "completed"
        assert asset1.prompt == creator_speech
        assert creator_speech in captured_texts

        # 2. Creator supplies empty prompt for Character -> CANONICAL CHARACTER TEMPLATE
        req2 = MediaGenerationRequest(
            entity_type="character",
            entity_id=char.id,
            media_type="voice",
            prompt="",
            voice_id="mentor-sage",
        )
        job2 = await service.dispatch_job(project_id=project.id, request=req2)
        asset2 = await service.process_job_now(job2.job_id, req2)
        assert asset2.status == "completed"
        expected_char_script = f"I am {char.name}, {char.role}. My motivation: {char.motivation.rstrip('.')}. My core conflict: {char.core_conflict.rstrip('.')}."
        assert asset2.prompt == expected_char_script
        assert expected_char_script in captured_texts

        # 3. Creator supplies empty prompt for Scene -> CANONICAL SCENE TEMPLATE
        req3 = MediaGenerationRequest(
            entity_type="scene",
            entity_id=scene.id,
            media_type="voice",
            prompt="   ",
            voice_id="narrator-deep",
        )
        job3 = await service.dispatch_job(project_id=project.id, request=req3)
        asset3 = await service.process_job_now(job3.job_id, req3)
        assert asset3.status == "completed"
        expected_scene_script = f"Scene {scene.scene_number}: {scene.title}. In {scene.location_setting}. {scene.conflict_narrative.rstrip('.')}. Outcome: {scene.pivotal_outcome.rstrip('.')}."
        assert asset3.prompt == expected_scene_script
        assert expected_scene_script in captured_texts




@pytest.mark.asyncio
async def test_voice_metadata_persistence():
    """Verifies persisted database record preserves voice_id, persona, duration_sec, resolved_provider."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = await repo.create_project(ProjectCreate(title="Voice Meta Persistence", original_seed="Test seed"))

        from backend.app.providers.storage import LocalStorageProvider
        from backend.app.providers.media.factory import ConfiguredMediaProvider
        from backend.app.providers.media.mock import MockImageProvider, MockVideoProvider, MockAudioProvider

        media_provider = ConfiguredMediaProvider(
            image=MockImageProvider(),
            voice=MockVoiceProvider(),
            video=MockVideoProvider(),
            audio=MockAudioProvider(),
        )
        service = MediaService(repo=repo, storage=LocalStorageProvider(upload_dir="./uploads"), media_provider=media_provider)

        job = await service.dispatch_job(
            project_id=project.id,
            request=MediaGenerationRequest(
                entity_type="character",
                entity_id="char-999",
                media_type="voice",
                prompt="We venture into the unknown.",
                voice_id="inquiring-youth",
            ),
        )
        for _ in range(50):
            await asyncio.sleep(0.05)
            asset = await service.get_job(job.job_id)
            if asset and asset.status == "completed":
                break

        assert asset is not None
        assert asset.status == "completed"
        assert asset.provider_name == "mock"
        assert asset.asset_url is not None

        meta = json.loads(asset.metadata_json)
        assert meta["voice_id"] == "inquiring-youth"
        assert meta["persona"] == "inquiring-youth"
        assert meta["resolved_provider"] == "mock"
        assert meta["duration_sec"] > 0


@pytest.mark.asyncio
async def test_voice_api_endpoint_with_persona(monkeypatch):
    """Verifies REST API generation dispatch and status polling for voice with persona selection."""
    monkeypatch.setenv("VOICE_PROVIDER", "mock")
    # Reset global media provider singleton to pick up env var
    import backend.app.providers.media.factory as mf
    mf._global_media_provider = None

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create project
        p_res = await client.post("/api/projects", json={"title": "Voice API Project", "original_seed": "Bioluminescent reef"})
        assert p_res.status_code == 201

        project_id = p_res.json()["data"]["id"]

        # Request voice generation
        v_res = await client.post(
            f"/api/projects/{project_id}/media/generate",
            json={
                "entity_type": "scene",
                "entity_id": "scene-101",
                "media_type": "voice",
                "prompt": "Deep underwater, the reef awakens with blue luminescence.",
                "voice_id": "calm-mystic",
            },
        )
        assert v_res.status_code == 200
        job_data = v_res.json()["data"]
        job_id = job_data["job_id"]
        assert job_data["status"] == "queued"

        # Wait for async completion
        for _ in range(50):
            await asyncio.sleep(0.05)
            status_res = await client.get(f"/api/projects/{project_id}/media/jobs/{job_id}")
            assert status_res.status_code == 200
            if status_res.json()["data"]["status"] == "completed":
                break

        # Check assets list
        assets_res = await client.get(f"/api/projects/{project_id}/media/assets?media_type=voice")
        assert assets_res.status_code == 200
        assets = assets_res.json()["data"]
        assert len(assets) >= 1
        asset = assets[0]
        assert asset["media_type"] == "voice"
        assert asset["status"] == "completed"
        meta = json.loads(asset["metadata_json"])
        assert "persona" in meta
        assert "resolved_provider" in meta
        assert "voice_id" in meta


@pytest.mark.asyncio
async def test_3_tier_fallback_via_context_outage_simulation():
    """Explicitly verifies Edge TTS -> Kokoro -> Mock fallback when simulated outage context is passed."""
    provider = CompositeVoiceProvider()
    payload = await provider.generate_voice(
        "Simulating complete primary cloud and local failure.",
        voice_id="mentor-sage",
        context={"simulate_edgetts_unavailable": True, "simulate_kokoro_unavailable": True},
    )
    assert payload.metadata["resolved_provider"] == "mock"
    assert payload.metadata["persona"] == "mentor-sage"
    assert payload.metadata["voice_id"] == "mentor-sage"
    assert payload.mime_type == "audio/wav"



