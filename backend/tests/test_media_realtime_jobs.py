import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.core.auth import get_current_user, AuthenticatedUser
from backend.app.main import app
from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaGenerationRequest, MediaAssetRecord
from backend.app.models.project import ProjectCreate
from backend.app.providers.media.mock import MockImageProvider, MockMediaProvider
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.media_service import MediaService


@pytest.mark.asyncio
async def test_media_job_creation_and_persistence():
    """Verify that dispatching media generation creates both media_asset and generation_job in DB."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = await repo.create_project(
            ProjectCreate(title="Job Test Project", seed_text="Testing dual persistence", owner_id="user-a-123")
        )

        service = MediaService(repo=repo, media_provider=MockMediaProvider())
        req = MediaGenerationRequest(
            entity_type="character",
            entity_id="char-archivist",
            media_type="image",
            prompt="A mystical archivist with blue runes",
            aspect_ratio="1:1",
        )

        job_res = await service.dispatch_job(project.id, req)
        assert job_res.status == "queued"
        assert job_res.job_id is not None

        # Verify media asset record in DB
        asset = await repo.get_media_asset(job_res.job_id)
        assert asset is not None
        assert asset.project_id == project.id
        assert asset.entity_id == "char-archivist"
        assert asset.status in ("queued", "processing", "completed")

        # Verify generation job record in DB
        gen_job = await repo.get_generation_job(job_res.job_id)
        assert gen_job is not None
        assert gen_job.project_id == project.id
        assert gen_job.job_type == "media_image"
        assert gen_job.status in ("queued", "processing", "completed")


@pytest.mark.asyncio
async def test_media_generation_success_and_bundle_rehydration():
    """Verify full success pipeline, storage url assignment, and inclusion in get_project_bundle."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = await repo.create_project(
            ProjectCreate(title="Rehydration Project", seed_text="Testing bundle rehydration", owner_id="user-a-123")
        )

        service = MediaService(repo=repo, media_provider=MockMediaProvider())
        req = MediaGenerationRequest(
            entity_type="world",
            entity_id="world-nebula",
            media_type="image",
            prompt="Bioluminescent space reef",
            aspect_ratio="16:9",
        )

        job_res = await service.dispatch_job(project.id, req)
        # Process synchronously
        completed = await service.process_job_now(job_res.job_id, req)
        assert completed.status == "completed"
        assert completed.asset_url is not None
        assert f"/projects/{project.id}/media/image/" in completed.asset_url

        # Check generation job
        gen_job = await repo.get_generation_job(job_res.job_id)
        assert gen_job is not None
        assert gen_job.status == "completed"
        assert gen_job.progress == 100
        assert gen_job.result_json is not None

        # Verify get_project_bundle includes the media asset
        bundle = await repo.get_project_bundle(project.id)
        assert bundle is not None
        assert len(bundle.media_assets) >= 1
        matched = [a for a in bundle.media_assets if a.id == completed.id]
        assert len(matched) == 1
        assert matched[0].asset_url == completed.asset_url


@pytest.mark.asyncio
async def test_media_generation_failure_handling():
    """Verify failed generation persists status='failed' on both media_assets and generation_jobs without crashing."""
    class FailingImageProvider(MockImageProvider):
        async def generate_image(self, prompt: str, aspect_ratio: str = "1:1", context=None):
            raise RuntimeError("Provider connection timed out")

    async with async_session() as session:
        repo = ProjectRepository(session)
        project = await repo.create_project(
            ProjectCreate(title="Failure Project", seed_text="Testing failure handling", owner_id="user-a-123")
        )

        failing_provider = MockMediaProvider(image_provider=FailingImageProvider())
        service = MediaService(repo=repo, media_provider=failing_provider)
        req = MediaGenerationRequest(
            entity_type="scene",
            entity_id="scene-collapse",
            media_type="image",
            prompt="Cataclysmic starburst",
        )

        job_res = await service.dispatch_job(project.id, req)
        failed = await service.process_job_now(job_res.job_id, req)
        assert failed.status == "failed"
        assert "Provider connection timed out" in (failed.error_message or "")

        # Check generation job
        gen_job = await repo.get_generation_job(job_res.job_id)
        assert gen_job is not None
        assert gen_job.status == "failed"
        assert "Provider connection timed out" in (gen_job.error_message or "")


@pytest.mark.asyncio
async def test_user_and_project_media_isolation():
    """Verify that User B cannot access or generate media for User A's project."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Act as User A
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            id="user-a-111", email="user_a@test.local"
        )
        create_res = await client.post(
            "/api/projects",
            json={"title": "User A Private Project", "seed_text": "Protected content"},
        )
        assert create_res.status_code == 201
        proj_a_id = create_res.json()["data"]["id"]

        # Act as User B
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            id="user-b-222", email="user_b@test.local"
        )

        # User B attempts to generate media for User A's project -> Must be rejected (404/403)
        gen_res_b = await client.post(
            f"/api/projects/{proj_a_id}/media/generate",
            json={
                "entity_type": "world",
                "entity_id": "world-secret",
                "media_type": "image",
                "prompt": "Stolen vision",
            },
        )
        assert gen_res_b.status_code in (403, 404)

        # User B attempts to list media assets for User A's project -> Must be rejected
        list_res_b = await client.get(
            f"/api/projects/{proj_a_id}/media/assets",
        )
        assert list_res_b.status_code in (403, 404)

        # Remove auth override to test unauthenticated rejection
        app.dependency_overrides.pop(get_current_user, None)
        gen_res_unauth = await client.post(
            f"/api/projects/{proj_a_id}/media/generate",
            json={
                "entity_type": "world",
                "entity_id": "world-secret",
                "media_type": "image",
                "prompt": "Unauthenticated attempt",
            },
        )
        assert gen_res_unauth.status_code == 401


@pytest.mark.asyncio
async def test_retry_creates_new_job_attempt():
    """Verify that retry dispatches a brand new job and asset rather than mutating old failed job."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = await repo.create_project(
            ProjectCreate(title="Retry Test Project", seed_text="Testing retry semantics", owner_id="user-a-123")
        )

        service = MediaService(repo=repo, media_provider=MockMediaProvider())
        req = MediaGenerationRequest(
            entity_type="character",
            entity_id="char-warrior",
            media_type="image",
            prompt="Sun champion warrior",
        )

        # First attempt
        job1 = await service.dispatch_job(project.id, req)
        # Second attempt (Retry)
        job2 = await service.dispatch_job(project.id, req)

        assert job1.job_id != job2.job_id
        # Both records exist separately in database
        asset1 = await repo.get_media_asset(job1.job_id)
        asset2 = await repo.get_media_asset(job2.job_id)
        assert asset1 is not None
        assert asset2 is not None
        assert asset1.id != asset2.id
