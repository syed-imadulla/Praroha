import asyncio
import json
from unittest.mock import AsyncMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from backend.app.models.dna import SeedDNA
from backend.app.models.world import WorldCandidateRecord
from backend.app.models.unfold import SceneRecord
from backend.app.models.media import MediaGenerationRequest
from backend.app.models.project import ProjectCreate
from backend.app.providers.media.base import (
    AudioProvider,
    MediaPayload,
    ProviderUnavailableError,
    detect_audio_mime_type,
)
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
async def test_composite_audio_procedural_generation():
    """Verifies CompositeAudioProvider delivers authentic procedural WAV soundscape."""
    composite = CompositeAudioProvider()
    payload = await composite.generate_audio(
        prompt="Ominous sub-bass drone",
        mood="ominous-drone",
        duration_sec=15,
    )
    assert payload.metadata["resolved_provider"] == "procedural-soundscape"
    assert payload.metadata["mood"] == "ominous-drone"
    assert payload.mime_type == "audio/wav"
    assert payload.data[:4] == b"RIFF"
    assert payload.data[8:12] == b"WAVE"


@pytest.mark.asyncio
async def test_procedural_soundscape_scene1_the_forbidden_docking():
    """Validates end-to-end procedural soundscape generation for 'Scene 1: The Forbidden Docking'.

    Verifies:
    - Built-in composer selects correct atmospheric layers based on scene mood & environment.
    - WAV container has valid RIFF/WAVE header and 16-bit PCM payload.
    - Output is playable ambient audio matching requested duration.
    - Metadata accurately reports resolved_provider and layer synthesis breakdown.
    """
    composite = CompositeAudioProvider()
    payload = await composite.generate_audio(
        prompt="Scene atmosphere: Scene 1: The Forbidden Docking in Submerged Deep-Water Sub-Bay. Tone: tense-dramatic.",
        mood="tense-dramatic",
        duration_sec=15,
        context={
            "scene_title": "Scene 1: The Forbidden Docking",
            "location_setting": "Submerged Deep-Water Sub-Bay",
            "conflict_narrative": "Unauthorized docking in high-security submersible bay under sensor lockdown",
        },
    )
    assert payload.mime_type == "audio/wav"
    assert payload.metadata["resolved_provider"] == "procedural-soundscape"
    assert payload.metadata["provider_label"] == "Procedural Soundscape Composer"
    assert payload.metadata["mood"] == "tense-dramatic"
    assert payload.metadata["duration_sec"] == 15.0
    layer_ids = [l["id"] for l in payload.metadata.get("layers", [])]
    assert "submerged_dock" in layer_ids
    assert "tense_pulse" in layer_ids

    data = payload.data
    assert len(data) > 600_000  # 15s * 22050 samples/sec * 2 bytes/sample + 44 header ~= 661,544 bytes
    assert data[:4] == b"RIFF"
    assert data[8:12] == b"WAVE"
    assert data[12:16] == b"fmt "
    assert b"data" in data


@pytest.mark.asyncio
async def test_composite_audio_synthesis_failure_handling():
    """Validates that procedural synthesis errors are wrapped in AudioSynthesisError with clear diagnostics."""
    from backend.app.providers.media.composite_audio import AudioSynthesisError
    from backend.app.services.soundscape_library import SoundscapeComposer

    composite = CompositeAudioProvider(mock=None)
    with patch.object(SoundscapeComposer, "compose_procedural_soundscape", side_effect=RuntimeError("WAV synthesis buffer overflow")):
        with pytest.raises(AudioSynthesisError) as exc_info:
            await composite.generate_audio("Corrupted scene", mood="tense-dramatic")
        assert "Atmospheric soundscape synthesis failed" in str(exc_info.value)


@pytest.mark.asyncio
async def test_composite_audio_circuit_breaker_when_primary_provided():
    """Verifies that if a custom primary provider is injected, circuit errors halt without mock fallback."""
    from backend.app.providers.media.base import PaymentRequiredError

    failing_primary = AsyncMock(spec=AudioProvider)
    failing_primary.generate_audio.side_effect = PaymentRequiredError("Payment required")

    composite = CompositeAudioProvider(primary=failing_primary)
    with pytest.raises(PaymentRequiredError):
        await composite.generate_audio("test prompt")


@pytest.mark.asyncio
async def test_audio_mime_detection_and_safeguards():
    """Verifies detect_audio_mime_type identifies magic bytes and content types accurately."""
    wav_bytes = b"RIFF\x24\x00\x00\x00WAVEfmt " + b"\x00" * 40
    mime, ext = detect_audio_mime_type("audio/wav", wav_bytes)
    assert mime == "audio/wav" and ext == ".wav"

    mp3_bytes = b"ID3\x03\x00\x00\x00\x00\x00\x00" + b"\xff\xfb\x90d" + b"\x00" * 100
    mime, ext = detect_audio_mime_type("audio/mpeg", mp3_bytes)
    assert mime == "audio/mpeg" and ext == ".mp3"

    # Safeguard: if mislabeled Content-Type says audio/wav, MP3 header is still detected as audio/mpeg
    mime, ext = detect_audio_mime_type("audio/wav", mp3_bytes)
    assert mime == "audio/mpeg" and ext == ".mp3"


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
        assert meta["resolved_provider"] in ["mock"]
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


@pytest.mark.asyncio
async def test_audio_retry_clears_failed_hash_and_regenerates():
    """Validates retry semantics: failed jobs have their hash cleared and regenerate cleanly without duplicates."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        service = MediaService(repo)

        proj = await repo.create_project(ProjectCreate(title="Retry Test Universe"))
        req = MediaGenerationRequest(
            entity_type="scene",
            entity_id="scene-docking-retry-1",
            media_type="audio",
            prompt="Scene 1: The Forbidden Docking",
            mood="tense-dramatic",
            duration_sec=15,
        )

        # 1. Dispatch initial job and allow background pipeline to complete
        job1 = await service.dispatch_job(proj.id, req)
        await asyncio.sleep(0.3)

        # 2. Simulate failure
        await repo.update_media_asset(job1.job_id, {"status": "failed", "error_message": "Synthesis timeout"})
        failed_asset = await repo.get_media_asset(job1.job_id)
        assert failed_asset.status == "failed"

        # 3. Retry with force_regenerate=True
        retry_req = MediaGenerationRequest(
            entity_type="scene",
            entity_id="scene-docking-retry-1",
            media_type="audio",
            prompt="Scene 1: The Forbidden Docking",
            mood="tense-dramatic",
            duration_sec=15,
            force_regenerate=True,
        )
        retry_job = await service.dispatch_job(proj.id, retry_req)
        # Old failed job's hash should have been cleared, so new job ID is created
        assert retry_job.job_id != job1.job_id
        assert retry_job.status in ("queued", "processing")

        # Process and verify completion
        completed = await service.process_job_now(retry_job.job_id, retry_req)
        assert completed.status == "completed"
        assert completed.asset_url is not None

