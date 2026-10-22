import asyncio
import json
import os
import subprocess
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from backend.app.core.auth import AuthenticatedUser, get_current_user
from backend.app.main import app
from backend.app.models.media import MediaAssetRecord
from backend.app.models.project import Project
from backend.app.models.world import WorldCandidate
from backend.app.repositories import project_repo


@pytest_asyncio.fixture
async def setup_project():
    """Create a verified test project with keyframe concept art."""
    from backend.app.models.project import ProjectCreate
    async with project_repo.async_session() as session:
        repo = project_repo.ProjectRepository(session)
        # Create project
        proj = await repo.create_project(
            ProjectCreate(
                title="Aetheria: Sky Harvesters",
                seed_text="Floating archipelagos where skyfarers harvest cloud plasma.",
            ),
            owner_id="test-default-user",
        )

        import uuid
        world_id = f"world-{uuid.uuid4().hex[:8]}"
        world = WorldCandidate(
            id=world_id,
            title="Aetheria Prime",
            archetype="Skyborne Civilization",
            concept="Floating cloud cities sustained by storm turbines.",
            aesthetic="Steampunk brass and luminous cyan plasma.",
            core_tension="Turbine decay vs plasma storms.",
            trade_offs="Infinite energy at high atmospheric danger.",
            key_visual="A colossal brass condenser anchored to a cumulonimbus spire.",
        )
        await repo.save_world_candidates(proj.id, "dna-01", "batch-01", [world])

        # Create verified visual image asset
        img_asset = MediaAssetRecord(
            id=f"asset-img-{uuid.uuid4().hex[:8]}",
            project_id=proj.id,
            entity_type="world",
            entity_id=world.id,
            media_type="image",
            status="completed",
            asset_url="https://test.supabase.co/storage/v1/object/public/seed-unfold-assets/aetheria.png",
            prompt="Aetheria floating cities in sunset clouds",
            aspect_ratio="16:9",
        )
        await repo.create_media_asset(img_asset)

    return proj, world, img_asset


@pytest.mark.asyncio
async def test_authenticated_project_owner_dispatch(client, setup_project):
    """
    Requirement 1 & 3: Authenticated project owner receives HTTP 202
    with durable GenerationJob and MediaAssetRecord created in PostgreSQL/SQLite.
    """
    proj, world, _ = setup_project

    with patch("backend.app.services.cinematic_dispatcher.httpx.AsyncClient") as mock_client_cls:
        mock_instance = AsyncMock()
        mock_instance.post.return_value = MagicMock(status_code=200, json=lambda: {"status": "completed"})
        mock_client_cls.return_value.__aenter__.return_value = mock_instance

        resp = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={
                "entity_type": "world",
                "entity_id": world.id,
                "duration_sec": 5,
                "aspect_ratio": "16:9",
            },
        )

        assert resp.status_code == 202
        data = resp.json()["data"]
        assert data["job_id"] is not None
        assert data["status"] in ("queued", "processing", "completed")
        assert data["media_type"] == "video"
        assert data["entity_id"] == world.id

        # Verify durable database record exists
        async with project_repo.async_session() as session:
            repo = project_repo.ProjectRepository(session)
            job = await repo.get_generation_job(data["job_id"])
            assert job is not None
            assert job.job_type == "media_video"
            assert job.project_id == proj.id

            asset = await repo.get_media_asset(data["job_id"])
            assert asset is not None
            assert asset.provider_name == "Cinematic Preview"
            assert asset.aspect_ratio == "16:9"


@pytest.mark.asyncio
async def test_unauthorized_and_cross_project_dispatch(setup_project):
    """
    Requirement 2: Cross-project and unauthorized requests are rejected (HTTP 404/403).
    """
    proj, world, _ = setup_project

    # Override user to an unauthorized attacker
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="attacker-user-id",
        email="attacker@external.com",
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as rogue_client:
        resp = await rogue_client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={
                "entity_type": "world",
                "entity_id": world.id,
            },
        )
        # Should be rejected because caller is not the project owner
        assert resp.status_code in (403, 404)


@pytest.mark.asyncio
async def test_request_deduplication_and_repeated_clicks(client, setup_project):
    """
    Requirement 4: Repeated identical dispatch requests attach to the existing job
    instead of launching duplicate background jobs.
    """
    proj, world, _ = setup_project

    with patch("backend.app.services.cinematic_dispatcher.httpx.AsyncClient") as mock_client_cls:
        mock_instance = AsyncMock()
        mock_instance.post.return_value = MagicMock(status_code=200, json=lambda: {"status": "completed"})
        mock_client_cls.return_value.__aenter__.return_value = mock_instance

        # First dispatch
        resp1 = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={
                "entity_type": "world",
                "entity_id": world.id,
                "duration_sec": 5,
                "force_regenerate": False,
            },
        )
        assert resp1.status_code == 202
        job_id_1 = resp1.json()["data"]["job_id"]

        # Repeated click / duplicate dispatch
        resp2 = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={
                "entity_type": "world",
                "entity_id": world.id,
                "duration_sec": 5,
                "force_regenerate": False,
            },
        )
        assert resp2.status_code == 202
        job_id_2 = resp2.json()["data"]["job_id"]

        # Must attach to identical job ID (deduplication hit)
        assert job_id_1 == job_id_2


@pytest.mark.asyncio
async def test_force_regeneration_bypasses_deduplication(client, setup_project):
    """
    Creator-controlled force regeneration creates a fresh job.
    """
    proj, world, _ = setup_project

    with patch("backend.app.services.cinematic_dispatcher.httpx.AsyncClient") as mock_client_cls:
        mock_instance = AsyncMock()
        mock_instance.post.return_value = MagicMock(status_code=200, json=lambda: {"status": "completed"})
        mock_client_cls.return_value.__aenter__.return_value = mock_instance

        resp1 = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={"entity_type": "world", "entity_id": world.id, "force_regenerate": False},
        )
        job_id_1 = resp1.json()["data"]["job_id"]

        # Dispatch with force_regenerate=True
        resp2 = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={"entity_type": "world", "entity_id": world.id, "force_regenerate": True},
        )
        job_id_2 = resp2.json()["data"]["job_id"]

        assert job_id_1 != job_id_2


@pytest.mark.asyncio
async def test_missing_visual_asset_rejection(client):
    """
    Requirement 8: Rejects preview dispatch with HTTP 400 if no visual concept art exists.
    """
    from backend.app.models.project import ProjectCreate
    async with project_repo.async_session() as session:
        repo = project_repo.ProjectRepository(session)
        empty_proj = await repo.create_project(
            ProjectCreate(
                title="Blank Project",
                seed_text="Dark void",
            ),
            owner_id="test-default-user",
        )

    resp = await client.post(
        f"/api/projects/{empty_proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": "world-empty"},
    )
    assert resp.status_code == 400
    err_text = (resp.json().get("error", {}).get("message") or resp.json().get("detail", "")).lower()
    assert "visual concept art" in err_text


@pytest.mark.asyncio
async def test_path_traversal_and_ssrf_rejection(client, setup_project):
    """
    Rejects suspicious asset paths (path traversal, SSRF metadata IP).
    """
    proj, world, _ = setup_project

    # Path traversal attempt
    resp_traversal = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={
            "entity_type": "world",
            "entity_id": world.id,
            "image_url": "../../etc/passwd",
        },
    )
    assert resp_traversal.status_code == 400
    err_traversal = (resp_traversal.json().get("error", {}).get("message") or resp_traversal.json().get("detail", "")).lower()
    assert "traversal" in err_traversal

    # SSRF metadata address attempt
    resp_ssrf = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={
            "entity_type": "world",
            "entity_id": world.id,
            "image_url": "http://169.254.169.254/latest/meta-data/",
        },
    )
    assert resp_ssrf.status_code == 400
    err_ssrf = (resp_ssrf.json().get("error", {}).get("message") or resp_ssrf.json().get("detail", "")).lower()
    assert "metadata" in err_ssrf


@pytest.mark.asyncio
async def test_worker_failure_handling(client, setup_project):
    """
    Requirement 5 & 7: When worker returns 500 or network fails,
    the job transitions cleanly to 'failed' with error_message. Zero false success.
    """
    proj, world, _ = setup_project

    with patch("backend.app.services.cinematic_dispatcher.httpx.AsyncClient") as mock_client_cls:
        mock_instance = AsyncMock()
        mock_instance.post.return_value = MagicMock(
            status_code=500,
            text='{"status": "error", "message": "Simulated GPU memory timeout"}',
        )
        mock_client_cls.return_value.__aenter__.return_value = mock_instance

        resp = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={"entity_type": "world", "entity_id": world.id, "force_regenerate": True},
        )
        assert resp.status_code == 202
        job_id = resp.json()["data"]["job_id"]

        # Allow background task to execute
        await asyncio.sleep(0.1)

        # Inspect durable database state
        async with project_repo.async_session() as session:
            repo = project_repo.ProjectRepository(session)
            asset = await repo.get_media_asset(job_id)
            assert asset is not None
            assert asset.status == "failed"
            assert "Worker HTTP 500" in (asset.error_message or "")

            job = await repo.get_generation_job(job_id)
            assert job is not None
            assert job.status == "failed"


@pytest.mark.asyncio
async def test_no_ffmpeg_execution_inside_primary_api(client, setup_project):
    """
    Requirement 10: The primary FastAPI web application must NEVER execute FFmpeg
    or rendering subprocesses inside its container.
    """
    proj, world, _ = setup_project

    with patch("subprocess.Popen") as mock_popen, patch("subprocess.run") as mock_run:
        with patch("backend.app.services.cinematic_dispatcher.httpx.AsyncClient") as mock_client_cls:
            mock_instance = AsyncMock()
            mock_instance.post.return_value = MagicMock(status_code=200, json=lambda: {"status": "completed"})
            mock_client_cls.return_value.__aenter__.return_value = mock_instance

            resp = await client.post(
                f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
                json={"entity_type": "world", "entity_id": world.id, "force_regenerate": True},
            )
            assert resp.status_code == 202

            # Give background task a moment
            await asyncio.sleep(0.05)

            # Neither Popen nor run should have been called with ffmpeg in FastAPI
            for call in mock_popen.call_args_list:
                args = call[0][0] if call[0] else []
                assert "ffmpeg" not in str(args).lower()

            for call in mock_run.call_args_list:
                args = call[0][0] if call[0] else []
                assert "ffmpeg" not in str(args).lower()
