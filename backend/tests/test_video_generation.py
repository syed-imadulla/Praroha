import asyncio
import io
import json
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from backend.app.models.dna import SeedDNA
from backend.app.models.world import WorldCandidateRecord
from backend.app.models.unfold import SceneRecord
from backend.app.models.media import MediaAssetRecord, MediaGenerationRequest
from backend.app.models.project import ProjectCreate
from backend.app.providers.media.base import (
    MediaPayload,
    ProviderUnavailableError,
)
from backend.app.providers.media.composite_video import CompositeVideoProvider
from backend.app.providers.media.mock import MockVideoProvider, _generate_minimal_mp4_bytes
from backend.app.providers.media.pyramid_flow import PyramidFlowProvider
from backend.app.providers.media.wan import WanVideoProvider
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.media_service import MediaService


@pytest.mark.asyncio
async def test_mock_mp4_container_structure():
    """Validates that MockVideoProvider generates valid binary with proper container boxes (ftyp, moov, mvhd, trak, mdat)."""
    provider = MockVideoProvider()
    payload = await provider.generate_video(prompt="Cinematic world teaser", duration_sec=5)
    data = payload.data
    assert isinstance(data, bytes)
    assert len(data) > 500
    assert payload.mime_type == "video/mp4"
    assert payload.metadata["resolved_provider"] == "mock"
    assert payload.metadata["duration_sec"] == 5
    assert payload.metadata["aspect_ratio"] == "16:9"
    assert payload.metadata["resolution"] == "720p"

    # Verify standard ISO BMFF boxes exist in binary
    assert b"ftyp" in data
    assert b"moov" in data
    assert b"mvhd" in data
    assert b"trak" in data
    assert b"mdat" in data


@pytest.mark.asyncio
async def test_pyramid_flow_parameters_and_url():
    """Validates Pyramid Flow request payload formatting and bearer authentication."""
    provider = PyramidFlowProvider(endpoint="https://api.mock.test/pyramid", hf_token="hf_secret123", timeout_sec=45.0)

    mock_response = httpx.Response(
        200,
        content=b"\x00\x00\x00\x20ftypisom" + b"\x00" * 200,
        headers={"content-type": "video/mp4"},
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        payload = await provider.generate_video(prompt="A mystical floating island", duration_sec=5, context={"aspect_ratio": "16:9"})

        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["json"]["inputs"] == "A mystical floating island"
        assert call_kwargs["json"]["parameters"]["aspect_ratio"] == "16:9"
        assert call_kwargs["json"]["parameters"]["duration_sec"] == 5
        assert call_kwargs["headers"]["Authorization"] == "Bearer hf_secret123"

        assert payload.metadata["resolved_provider"] == "pyramid-flow"
        assert payload.metadata["duration_sec"] == 5
        assert payload.metadata["aspect_ratio"] == "16:9"
        assert payload.metadata["resolution"] == "720p"


@pytest.mark.asyncio
async def test_pyramid_flow_retry_and_timeout():
    """Validates timeout handling cascades gracefully by raising ProviderUnavailableError."""
    provider = PyramidFlowProvider(endpoint="https://api.mock.test/pyramid", timeout_sec=1.0)

    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Connection timed out")):
        with pytest.raises(ProviderUnavailableError) as exc_info:
            await provider.generate_video(prompt="Expansive canyon")
        assert "network error" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_wan_video_provider_parameters_and_execution():
    """Validates Wan2.1 microservice invocation and payload normalization."""
    provider = WanVideoProvider(endpoint="http://localhost:8890/v1/video/generate", timeout_sec=30.0)

    mock_response = httpx.Response(
        200,
        content=b"\x00\x00\x00\x20ftypisom" + b"\x00" * 150,
        headers={"content-type": "video/mp4"},
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        payload = await provider.generate_video(prompt="Neon cyberpunk skyline", duration_sec=5, context={"aspect_ratio": "16:9"})

        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["json"]["prompt"] == "Neon cyberpunk skyline"
        assert call_kwargs["json"]["duration"] == 5
        assert payload.metadata["resolved_provider"] == "wan2.1"
        assert payload.metadata["aspect_ratio"] == "16:9"


@pytest.mark.asyncio
async def test_3_tier_fallback_pyramid_fail_wan_success():
    """Verifies: Tier 1 (Pyramid Flow) fails -> Tier 2 (Wan2.1) succeeds -> resolved_provider is 'wan2.1'."""
    pyramid_mock = AsyncMock(spec=PyramidFlowProvider)
    pyramid_mock.generate_video.side_effect = ProviderUnavailableError("Pyramid Flow 503 service unavailable")

    wan_mock = AsyncMock(spec=WanVideoProvider)
    wan_mock.generate_video.return_value = MediaPayload(
        data=b"mock_wan_mp4_bytes",
        mime_type="video/mp4",
        filename="wan_clip.mp4",
        metadata={
            "resolved_provider": "wan2.1",
            "duration_sec": 5,
            "aspect_ratio": "16:9",
            "resolution": "720p",
        },
    )

    composite = CompositeVideoProvider(pyramid=pyramid_mock, wan=wan_mock, mock=MockVideoProvider())
    payload = await composite.generate_video(prompt="Dramatic reveal")

    assert payload.metadata["resolved_provider"] == "wan2.1"
    assert payload.metadata["duration_sec"] == 5
    assert payload.metadata["aspect_ratio"] == "16:9"
    assert payload.metadata["resolution"] == "720p"
    wan_mock.generate_video.assert_called_once()


@pytest.mark.asyncio
async def test_3_tier_fallback_pyramid_and_wan_fail_mock_success():
    """Verifies: Tier 1 & Tier 2 fail -> Tier 3 (Mock) succeeds with 0 unhandled errors and resolved_provider='mock'."""
    pyramid_mock = AsyncMock(spec=PyramidFlowProvider)
    pyramid_mock.generate_video.side_effect = ProviderUnavailableError("Pyramid Flow quota exceeded")

    wan_mock = AsyncMock(spec=WanVideoProvider)
    wan_mock.generate_video.side_effect = ProviderUnavailableError("Wan2.1 GPU microservice offline")

    composite = CompositeVideoProvider(pyramid=pyramid_mock, wan=wan_mock, mock=MockVideoProvider())
    payload = await composite.generate_video(prompt="Ancient monolith awaken")

    assert payload.metadata["resolved_provider"] == "mock"
    assert payload.metadata["duration_sec"] == 5
    assert payload.metadata["aspect_ratio"] == "16:9"
    assert payload.metadata["resolution"] == "720p"
    assert b"ftyp" in payload.data
    assert b"moov" in payload.data


@pytest.mark.asyncio
async def test_3_tier_fallback_via_context_outage_simulation():
    """Verifies contextual outage simulation triggers seamless cascade down to MockVideoProvider."""
    composite = CompositeVideoProvider()
    payload = await composite.generate_video(
        prompt="Simulated fallback scene",
        context={"simulate_pyramid_unavailable": True, "simulate_wan_unavailable": True},
    )
    assert payload.metadata["resolved_provider"] == "mock"
    assert payload.metadata["duration_sec"] == 5


@pytest.mark.asyncio
async def test_provider_response_isolation():
    """D-06: Verifies that vendor response payloads are normalized into MediaPayload without leaking vendor structures."""
    provider = PyramidFlowProvider(endpoint="https://api.mock.test/pyramid")
    mock_response = httpx.Response(
        200,
        json={"video_base64": "AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=", "vendor_extra_id": 9999},
        headers={"content-type": "application/json"},
    )
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        payload = await provider.generate_video(prompt="Canyon river")
        assert isinstance(payload, MediaPayload)
        # Ensure only canonical keys are exposed
        assert "resolved_provider" in payload.metadata
        assert "duration_sec" in payload.metadata
        assert "vendor_extra_id" not in payload.metadata


@pytest.mark.asyncio
async def test_cinematic_prompt_enrichment():
    """D-03: Verifies canonical world teaser and scene motion templates, and creator prompt preservation."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        service = MediaService(repo)

        # Create dummy project
        proj = await repo.create_project(ProjectCreate(title="Cinematic Test Universe"))

        # Seed DNA fixture
        dna_record = await repo.save_seed_dna(
            project_id=proj.id,
            raw_seed="Floating islands connected by anti-gravity anchors",
            dna=SeedDNA(
                premise="Civilization lives in floating islands powered by anchors",
                tone="Ethereal solarpunk mystery",
                domain_keywords=["floating archipelago", "gravity anchors"],
                themes=["balance", "sky exploration"],
                constraints=[],
                entities=[],
            ),
        )

        # Create world candidate
        world = WorldCandidateRecord(
            project_id=proj.id,
            seed_dna_id=dna_record.id,
            batch_id="batch_1",
            candidate_index=0,
            title="Aetheria",
            archetype="Solarium",
            concept="Floating crystalline archipelago",
            aesthetic="Volumetric sunbeams and prismatic clouds",
            core_tension="Gravity anchors failing vs sky currents",
            trade_offs="Breathtaking vistas vs unstable ground",
            key_visual="A soaring spire caught in golden light",
        )
        session.add(world)
        await session.commit()
        await session.refresh(world)

        # Create scene
        scene = SceneRecord(
            project_id=proj.id,
            world_candidate_id=world.id,
            scene_number=1,
            title="The Shattered Spire",
            location_setting="Upper Cloud Sanctuary",
            conflict_narrative="The anti-gravity anchor fractures under seismic flux",
            pivotal_outcome="The island begins its descent toward the storm veil",
            dramatic_question="Can the spire be stabilized?",
            visual_prompt="A spire shattering amidst clouds",
        )
        session.add(scene)
        await session.commit()
        await session.refresh(scene)

        # 1. World Video with empty prompt -> canonical world teaser template
        world_req = MediaGenerationRequest(
            entity_type="world",
            entity_id=world.id,
            media_type="video",
            prompt="",
        )
        world_job = await service.dispatch_job(proj.id, world_req)
        completed_world = await service.process_job_now(world_job.job_id, world_req)
        assert "Aetheria, Floating crystalline archipelago" in completed_world.prompt
        assert "Visual aesthetic: Volumetric sunbeams and prismatic clouds" in completed_world.prompt
        assert "Cinematic camera panning across the expansive environment" in completed_world.prompt

        # 2. Scene Video with empty prompt -> canonical scene motion template
        scene_req = MediaGenerationRequest(
            entity_type="scene",
            entity_id=scene.id,
            media_type="video",
            prompt="",
        )
        scene_job = await service.dispatch_job(proj.id, scene_req)
        completed_scene = await service.process_job_now(scene_job.job_id, scene_req)
        assert "Cinematic scene: The Shattered Spire in Upper Cloud Sanctuary" in completed_scene.prompt
        assert "The anti-gravity anchor fractures under seismic flux" in completed_scene.prompt
        assert "Slow dramatic camera motion, dynamic environmental movement" in completed_scene.prompt

        # 3. Creator-supplied prompt preserved exactly
        custom_prompt = "Custom creator cinematic vision of aerial skiffs racing."
        custom_req = MediaGenerationRequest(
            entity_type="scene",
            entity_id=scene.id,
            media_type="video",
            prompt=custom_prompt,
        )
        custom_job = await service.dispatch_job(proj.id, custom_req)
        completed_custom = await service.process_job_now(custom_job.job_id, custom_req)
        assert completed_custom.prompt == custom_prompt


@pytest.mark.asyncio
async def test_video_metadata_persistence():
    """Validates that generated video persists complete metadata (resolved_provider, duration_sec, aspect_ratio, resolution)."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        service = MediaService(repo)

        proj = await repo.create_project(ProjectCreate(title="Persistence Test Universe"))
        req = MediaGenerationRequest(
            entity_type="world",
            entity_id="world-dummy-id",
            media_type="video",
            prompt="Epic opening cinematic teaser",
            duration_sec=5,
        )
        job = await service.dispatch_job(proj.id, req)
        asset = await service.process_job_now(job.job_id, req)

        assert asset.status == "completed"
        assert asset.mime_type == "video/mp4"
        assert asset.asset_url is not None

        meta = json.loads(asset.metadata_json)
        assert meta["resolved_provider"] in ["pyramid-flow", "wan2.1", "mock"]
        assert meta["duration_sec"] == 5
        assert meta["aspect_ratio"] == "16:9"
        assert meta["resolution"] == "720p"


@pytest.mark.asyncio
async def test_video_api_endpoints():
    """Verifies REST API dispatch, polling, and entity media listing for video assets."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create project
        create_res = await client.post("/api/projects", json={"title": "REST Video Universe", "original_seed": "Cyber city"})
        assert create_res.status_code == 201
        proj_id = create_res.json()["data"]["id"]

        # Dispatch video job
        dispatch_res = await client.post(
            f"/api/projects/{proj_id}/media/generate",
            json={
                "entity_type": "scene",
                "entity_id": "scene-api-test-1",
                "media_type": "video",
                "prompt": "Cinematic sequence through ancient ruins",
                "duration_sec": 5,
            },
        )
        assert dispatch_res.status_code == 200
        job_data = dispatch_res.json()["data"]
        job_id = job_data["job_id"]
        assert job_data["media_type"] == "video"

        # Poll status
        status_res = await client.get(f"/api/projects/{proj_id}/media/jobs/{job_id}")
        assert status_res.status_code == 200

        # Query entity assets
        entity_res = await client.get(f"/api/projects/{proj_id}/media/assets?entity_id=scene-api-test-1&media_type=video")
        assert entity_res.status_code == 200
        assets = entity_res.json()["data"]
        assert len(assets) >= 1
        assert assets[0]["media_type"] == "video"
