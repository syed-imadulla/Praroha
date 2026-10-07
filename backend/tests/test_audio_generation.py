import asyncio
import json
from unittest.mock import AsyncMock, patch
import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from backend.app.models.dna import SeedDNA
from backend.app.models.world import WorldCandidateRecord
from backend.app.models.unfold import SceneRecord
from backend.app.models.media import MediaGenerationRequest
from backend.app.models.project import ProjectCreate
from backend.app.providers.media.base import (
    MediaPayload,
    ProviderUnavailableError,
)
from backend.app.providers.media.ace_step import ACEStepAudioProvider, detect_audio_mime_type
from backend.app.providers.media.stable_audio import StableAudioOpenProvider
from backend.app.providers.media.composite_audio import CompositeAudioProvider
from backend.app.providers.media.mock import MockAudioProvider
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.media_service import MediaService


@pytest.mark.asyncio
async def test_mock_wav_audio_container_structure():
    """Validates that MockAudioProvider generates authentic, browser-playable WAV container structure."""
    provider = MockAudioProvider()
    payload = await provider.generate_audio(
        prompt="Oceanic ambient soundscape",
        mood="serene-ambient",
        duration_sec=8,
    )
    data = payload.data
    assert isinstance(data, bytes)
    assert len(data) > 44  # WAV header is 44 bytes minimum
    assert payload.mime_type == "audio/wav"
    assert payload.metadata["resolved_provider"] == "mock"
    assert payload.metadata["mood"] == "serene-ambient"
    assert payload.metadata["duration_sec"] == 8.0

    # Validate WAV RIFF header structure
    assert data[:4] == b"RIFF"
    assert data[8:12] == b"WAVE"
    assert data[12:16] == b"fmt "
    assert b"data" in data


@pytest.mark.asyncio
async def test_ace_step_parameters_and_url():
    """Validates ACE-Step payload formatting, headers, and parameter mapping."""
    provider = ACEStepAudioProvider(
        endpoint="https://api.mock.test/acestep",
        hf_token="hf_test_audio_token",
        timeout_sec=30.0,
    )

    dummy_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00" + b"\x00" * 100
    mock_response = httpx.Response(
        200,
        content=dummy_wav,
        headers={"content-type": "audio/wav"},
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        payload = await provider.generate_audio(
            prompt="Ethereal synth waves",
            mood="mystic-ethereal",
            duration_sec=15,
        )

        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["json"]["inputs"] == "Ethereal synth waves"
        assert call_kwargs["json"]["parameters"]["duration"] == 15
        assert call_kwargs["json"]["parameters"]["mood"] == "mystic-ethereal"
        assert call_kwargs["headers"]["Authorization"] == "Bearer hf_test_audio_token"

        assert payload.metadata["resolved_provider"] == "ace-step"
        assert payload.metadata["mood"] == "mystic-ethereal"
        assert payload.metadata["duration_sec"] == 15


@pytest.mark.asyncio
async def test_ace_step_retry_and_timeout():
    """Validates timeout and retry handling cascades by raising ProviderUnavailableError."""
    provider = ACEStepAudioProvider(
        endpoint="https://api.mock.test/acestep",
        timeout_sec=1.0,
    )

    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Connection timed out")):
        with pytest.raises(ProviderUnavailableError) as exc_info:
            await provider.generate_audio(prompt="Tense drums")
        assert "exhausted 3 retries" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_stable_audio_provider_parameters():
    """Validates Stable Audio Open parameter mapping and payload normalization."""
    provider = StableAudioOpenProvider(
        endpoint="https://api.stability.ai/v2beta/stable-audio/generate",
        api_key="sk-stability-test",
        timeout_sec=30.0,
    )

    dummy_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00" + b"\x00" * 100
    mock_response = httpx.Response(
        200,
        content=dummy_wav,
        headers={"content-type": "audio/wav"},
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        payload = await provider.generate_audio(
            prompt="Dramatic orchestral strings",
            mood="epic-orchestral",
            duration_sec=20,
        )

        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["json"]["prompt"] == "Dramatic orchestral strings"
        assert call_kwargs["json"]["seconds_total"] == 20
        assert call_kwargs["json"]["mood"] == "epic-orchestral"
        assert call_kwargs["headers"]["Authorization"] == "Bearer sk-stability-test"

        assert payload.metadata["resolved_provider"] == "stable-audio"
        assert payload.metadata["mood"] == "epic-orchestral"
        assert payload.metadata["duration_sec"] == 20


@pytest.mark.asyncio
async def test_3_tier_fallback_acestep_fail_stableaudio_success():
    """Verifies: Tier 1 (ACE-Step) fails -> Tier 2 (Stable Audio Open) succeeds -> resolved_provider is 'stable-audio'."""
    ace_mock = AsyncMock(spec=ACEStepAudioProvider)
    ace_mock.generate_audio.side_effect = ProviderUnavailableError("ACE-Step 503 service unavailable")

    stable_mock = AsyncMock(spec=StableAudioOpenProvider)
    stable_mock.generate_audio.return_value = MediaPayload(
        data=b"mock_stable_audio_bytes",
        mime_type="audio/wav",
        filename="stable_audio_track.wav",
        metadata={
            "resolved_provider": "stable-audio",
            "mood": "tense-dramatic",
            "duration_sec": 15,
        },
    )

    composite = CompositeAudioProvider(ace_step=ace_mock, stable_audio=stable_mock, mock=MockAudioProvider())
    payload = await composite.generate_audio(prompt="Tension rising", mood="tense-dramatic", duration_sec=15)

    assert payload.metadata["resolved_provider"] == "stable-audio"
    assert payload.metadata["mood"] == "tense-dramatic"
    assert payload.metadata["duration_sec"] == 15
    stable_mock.generate_audio.assert_called_once()


@pytest.mark.asyncio
async def test_3_tier_fallback_acestep_and_stableaudio_fail_mock_success():
    """Verifies: Tier 1 & Tier 2 fail -> Tier 3 (Mock) succeeds with authentic WAV and resolved_provider='mock'."""
    ace_mock = AsyncMock(spec=ACEStepAudioProvider)
    ace_mock.generate_audio.side_effect = ProviderUnavailableError("ACE-Step quota exceeded")

    stable_mock = AsyncMock(spec=StableAudioOpenProvider)
    stable_mock.generate_audio.side_effect = ProviderUnavailableError("Stable Audio service unavailable")

    composite = CompositeAudioProvider(ace_step=ace_mock, stable_audio=stable_mock, mock=MockAudioProvider())
    payload = await composite.generate_audio(prompt="Ominous sub-bass drone", mood="ominous-drone", duration_sec=15)

    assert payload.metadata["resolved_provider"] == "mock"
    assert payload.metadata["mood"] == "ominous-drone"
    assert payload.mime_type == "audio/wav"
    assert payload.data[:4] == b"RIFF"
    assert payload.data[8:12] == b"WAVE"


@pytest.mark.asyncio
async def test_3_tier_fallback_via_context_outage_simulation():
    """Verifies contextual outage simulation triggers non-blocking cascade down to MockAudioProvider."""
    composite = CompositeAudioProvider()
    payload = await composite.generate_audio(
        prompt="Simulated fallback atmosphere",
        mood="serene-ambient",
        duration_sec=10,
        context={"simulate_acestep_unavailable": True, "simulate_stableaudio_unavailable": True},
    )
    assert payload.metadata["resolved_provider"] == "mock"
    assert payload.metadata["mood"] == "serene-ambient"
    assert payload.metadata["duration_sec"] == 10


@pytest.mark.asyncio
async def test_audio_provider_response_isolation_and_mime_preservation():
    """D-01 & D-06: Verifies response normalization into MediaPayload and preservation of actual MIME types."""
    provider = ACEStepAudioProvider(endpoint="https://api.mock.test/acestep")

    # Case A: Provider returns WAV bytes
    wav_bytes = b"RIFF\x24\x00\x00\x00WAVEfmt " + b"\x00" * 40
    mock_wav_res = httpx.Response(
        200,
        content=wav_bytes,
        headers={"content-type": "audio/wav"},
    )
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_wav_res
        payload = await provider.generate_audio(prompt="Flute melody", mood="serene-ambient")
        assert payload.mime_type == "audio/wav"
        assert payload.filename.endswith(".wav")
        assert payload.metadata["resolved_provider"] == "ace-step"

    # Case B: Provider returns MP3 bytes (ID3 tag) with audio/mpeg
    mp3_bytes = b"ID3\x03\x00\x00\x00\x00\x00\x00" + b"\xff\xfb\x90d" + b"\x00" * 100
    mock_mp3_res = httpx.Response(
        200,
        content=mp3_bytes,
        headers={"content-type": "audio/mpeg"},
    )
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_mp3_res
        payload = await provider.generate_audio(prompt="Acoustic guitar", mood="ambient")
        assert payload.mime_type == "audio/mpeg"
        assert payload.filename.endswith(".mp3")
        assert payload.metadata["resolved_provider"] == "ace-step"

    # Case C: Byte safeguard: even if Content-Type says audio/wav, MP3 bytes must NEVER be labeled as WAV
    mock_mislabeled_res = httpx.Response(
        200,
        content=mp3_bytes,
        headers={"content-type": "audio/wav"},
    )
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_mislabeled_res
        payload = await provider.generate_audio(prompt="Violin solo", mood="epic-orchestral")
        assert payload.mime_type == "audio/mpeg"
        assert payload.filename.endswith(".mp3")

    # Helper function unit tests
    mime, ext = detect_audio_mime_type("audio/mpeg", b"some_bytes")
    assert mime == "audio/mpeg" and ext == ".mp3"
    mime, ext = detect_audio_mime_type("audio/wav", b"RIFF....WAVE")
    assert mime == "audio/wav" and ext == ".wav"


@pytest.mark.asyncio
async def test_canonical_acoustic_prompt_and_mood_enrichment():
    """D-03: Verifies canonical World and Scene acoustic prompt derivation and mood preservation."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        service = MediaService(repo)

        proj = await repo.create_project(ProjectCreate(title="Audio Universe"))

        dna_record = await repo.save_seed_dna(
            project_id=proj.id,
            raw_seed="Deep subterranean civilization with geothermal rivers",
            dna=SeedDNA(
                premise="Subterranean civilization powered by glowing geothermal currents",
                tone="Dark ambient cavernous mystery",
                domain_keywords=["geothermal", "caverns"],
                themes=["depth", "luminescence"],
                constraints=[],
                entities=[],
            ),
        )

        world = WorldCandidateRecord(
            project_id=proj.id,
            seed_dna_id=dna_record.id,
            batch_id="batch_1",
            candidate_index=0,
            title="Subterra",
            archetype="Subterrane",
            concept="Vast subterranean realm of magma waterfalls",
            aesthetic="Obsidian basalt, bioluminescent lichen, resonant basalt chambers",
            core_tension="Thermal depletion vs seismic stability",
            trade_offs="Abundant energy vs tectonic tremors",
            key_visual="A magma falls cascading into an underground lake",
        )
        session.add(world)
        await session.commit()
        await session.refresh(world)

        scene = SceneRecord(
            project_id=proj.id,
            world_candidate_id=world.id,
            scene_number=1,
            title="The Obsidian Forge",
            location_setting="Deep Cavern Level 4",
            conflict_narrative="Geothermal pressure spikes threatening the magma valve",
            pivotal_outcome="The forge masters divert the flow to save the enclave",
            dramatic_question="Can the valve hold?",
            visual_prompt="Sparks flying over a roaring obsidian forge",
        )
        session.add(scene)
        await session.commit()
        await session.refresh(scene)

        # 1. World Audio with empty prompt -> canonical world soundscape template
        world_req = MediaGenerationRequest(
            entity_type="world",
            entity_id=world.id,
            media_type="audio",
            prompt="",
            mood="mystic-ethereal",
        )
        world_job = await service.dispatch_job(proj.id, world_req)
        completed_world = await service.process_job_now(world_job.job_id, world_req)
        assert "Subterra ambient soundscape" in completed_world.prompt
        assert "Atmosphere: Obsidian basalt, bioluminescent lichen, resonant basalt chambers" in completed_world.prompt
        assert "Mood: mystic-ethereal" in completed_world.prompt
        assert "Drone frequencies, textured organic background resonance" in completed_world.prompt

        # 2. Scene Audio with empty prompt -> canonical scene atmospheric underscore template
        scene_req = MediaGenerationRequest(
            entity_type="scene",
            entity_id=scene.id,
            media_type="audio",
            prompt="",
            mood="tense-dramatic",
        )
        scene_job = await service.dispatch_job(proj.id, scene_req)
        completed_scene = await service.process_job_now(scene_job.job_id, scene_req)
        assert "Scene atmosphere: The Obsidian Forge in Deep Cavern Level 4" in completed_scene.prompt
        assert "Tone: tense-dramatic" in completed_scene.prompt
        assert "Dramatic environmental underscore, thematic instrumentation" in completed_scene.prompt

        # 3. Creator-supplied prompt preserved exactly without alteration
        custom_prompt = "Custom creator acoustic arrangement of tribal water percussion."
        custom_req = MediaGenerationRequest(
            entity_type="scene",
            entity_id=scene.id,
            media_type="audio",
            prompt=custom_prompt,
            mood="serene-ambient",
        )
        custom_job = await service.dispatch_job(proj.id, custom_req)
        completed_custom = await service.process_job_now(custom_job.job_id, custom_req)
        assert completed_custom.prompt == custom_prompt


@pytest.mark.asyncio
async def test_audio_metadata_persistence():
    """Validates that generated audio persists complete metadata (resolved_provider, mood, duration_sec)."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        service = MediaService(repo)

        proj = await repo.create_project(ProjectCreate(title="Audio Persistence Universe"))
        req = MediaGenerationRequest(
            entity_type="world",
            entity_id="world-audio-id",
            media_type="audio",
            prompt="Ethereal cathedral bells reverberating in mist",
            mood="mystic-ethereal",
            duration_sec=15,
        )
        job = await service.dispatch_job(proj.id, req)
        asset = await service.process_job_now(job.job_id, req)

        assert asset.status == "completed"
        assert asset.mime_type in ["audio/wav", "audio/mpeg"]
        assert asset.asset_url is not None

        meta = json.loads(asset.metadata_json)
        assert meta["resolved_provider"] in ["ace-step", "stable-audio", "mock"]
        assert meta["mood"] == "mystic-ethereal"
        assert meta["duration_sec"] > 0


@pytest.mark.asyncio
async def test_audio_api_endpoints():
    """Verifies REST API dispatch, polling, and entity media listing for audio assets."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create project
        create_res = await client.post("/api/projects", json={"title": "REST Audio Universe", "original_seed": "Sound wave world"})
        assert create_res.status_code == 201
        proj_id = create_res.json()["data"]["id"]

        # Dispatch audio job
        dispatch_res = await client.post(
            f"/api/projects/{proj_id}/media/generate",
            json={
                "entity_type": "world",
                "entity_id": "world-api-audio-1",
                "media_type": "audio",
                "prompt": "Deep oceanic resonance and whale song",
                "mood": "serene-ambient",
                "duration_sec": 15,
            },
        )
        assert dispatch_res.status_code == 200
        job_data = dispatch_res.json()["data"]
        job_id = job_data["job_id"]
        assert job_data["media_type"] == "audio"

        # Poll status
        status_res = await client.get(f"/api/projects/{proj_id}/media/jobs/{job_id}")
        assert status_res.status_code == 200

        # Query entity assets
        entity_res = await client.get(f"/api/projects/{proj_id}/media/assets?entity_id=world-api-audio-1&media_type=audio")
        assert entity_res.status_code == 200
        assets = entity_res.json()["data"]
        assert len(assets) >= 1
        assert assets[0]["media_type"] == "audio"
