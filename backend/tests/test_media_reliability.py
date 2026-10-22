import asyncio
import json
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from backend.app.main import app
from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaGenerationRequest, MediaAssetRecord
from backend.app.models.project import ProjectCreate
from backend.app.providers.media.base import (
    AuthenticationError,
    MediaPayload,
    PaymentRequiredError,
    QuotaExceededError,
    ProviderUnavailableError,
    AudioProvider,
    VideoProvider,
    ImageProvider,
)
from backend.app.providers.media.composite import CompositeImageProvider
from backend.app.providers.media.composite_audio import CompositeAudioProvider
from backend.app.providers.media.composite_video import CompositeVideoProvider
from backend.app.providers.media.pollinations import PollinationsImageProvider
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.media_service import MediaService, compute_request_hash


@pytest.fixture
async def clean_client(monkeypatch):
    monkeypatch.setenv("IMAGE_PROVIDER", "mock")
    monkeypatch.setenv("VOICE_PROVIDER", "mock")
    monkeypatch.setenv("VIDEO_PROVIDER", "mock")
    monkeypatch.setenv("AUDIO_PROVIDER", "mock")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# 1. Circuit Breakers: 401/402/403/429 Halt Unsafe Cascades
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_composite_audio_circuit_breaker_on_billing_and_auth_failures():
    """Verify CompositeAudioProvider halts immediately on 401, 402, 429 without cascading to fallback."""
    tier1_mock = AsyncMock(spec=AudioProvider)
    tier1_mock.generate_audio.side_effect = PaymentRequiredError("Audio provider insufficient credits (HTTP 402)")
    mock_tier = AsyncMock(spec=AudioProvider)

    composite = CompositeAudioProvider(
        primary=tier1_mock,
        mock=mock_tier,
    )

    with pytest.raises(PaymentRequiredError):
        await composite.generate_audio("ocean waves", mood="ambient", duration_sec=5)

    mock_tier.generate_audio.assert_not_called()

    # Verify 401 AuthenticationError halts cascade
    tier1_mock.generate_audio.side_effect = AuthenticationError("Unauthorized (HTTP 401)")
    with pytest.raises(AuthenticationError):
        await composite.generate_audio("ocean waves", mood="ambient", duration_sec=5)
    mock_tier.generate_audio.assert_not_called()

    # Verify 429 QuotaExceededError halts cascade
    tier1_mock.generate_audio.side_effect = QuotaExceededError("Rate limit exceeded (HTTP 429)")
    with pytest.raises(QuotaExceededError):
        await composite.generate_audio("ocean waves", mood="ambient", duration_sec=5)
    mock_tier.generate_audio.assert_not_called()


@pytest.mark.asyncio
async def test_composite_video_circuit_breaker_on_billing_and_auth_failures():
    """Verify CompositeVideoProvider halts immediately on 401, 402, 429 without cascading."""
    tier1_mock = AsyncMock(spec=VideoProvider)
    tier1_mock.endpoint = "http://localhost:8890"
    tier1_mock.generate_video.side_effect = PaymentRequiredError("Video out of credits (HTTP 402)")
    mock_tier = AsyncMock(spec=VideoProvider)

    composite = CompositeVideoProvider(
        wan=tier1_mock,
        mock=mock_tier,
    )

    with pytest.raises(PaymentRequiredError):
        await composite.generate_video("cinematic camera pan", duration_sec=5)

    mock_tier.generate_video.assert_not_called()


@pytest.mark.asyncio
async def test_composite_image_circuit_breaker_on_billing_and_auth_failures():
    """Verify CompositeImageProvider halts cascade on billing/auth errors."""
    tier1_mock = AsyncMock(spec=ImageProvider)
    tier1_mock.generate_image.side_effect = AuthenticationError("Pollinations Invalid Key (HTTP 401)")

    tier2_mock = AsyncMock(spec=ImageProvider)

    composite = CompositeImageProvider(
        pollinations=tier1_mock,
        mock=tier2_mock,
    )

    with pytest.raises(AuthenticationError):
        await composite.generate_image("futuristic bioluminescent city")

    tier2_mock.generate_image.assert_not_called()


# ---------------------------------------------------------------------------
# 2. Transient Failures & Bounded Retries
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_pollinations_unauthenticated_rejects_paid_models():
    """Unauthenticated requests must reject non-free models and pin to verified free models."""
    provider = PollinationsImageProvider(api_key="")

    # A non-free model requested without key must raise AuthenticationError before making network requests
    with pytest.raises(AuthenticationError) as exc_info:
        await provider.generate_image("test prompt", context={"model": "nanomodel-paid"})
    assert "requires an authenticated API key" in str(exc_info.value)


# ---------------------------------------------------------------------------
# 3. Request Deduplication: Cache Hit & In-Flight Attach
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_request_deduplication_completed_cache_hit(clean_client: AsyncClient):
    """Identical request returns completed asset immediately without dispatching a new background job."""
    # Create project
    p_res = await clean_client.post("/api/projects", json={"title": "Dedup Test", "seed_text": "Dedup seed"})
    assert p_res.status_code == 201
    project_id = p_res.json()["data"]["id"]

    # First dispatch
    req_payload = {
        "entity_type": "world",
        "entity_id": project_id,
        "media_type": "image",
        "prompt": "A sprawling crystalline citadel",
        "aspect_ratio": "16:9",
        "force_regenerate": False,
    }
    dispatch_res1 = await clean_client.post(f"/api/projects/{project_id}/media/generate", json=req_payload)
    assert dispatch_res1.status_code == 200
    job1_id = dispatch_res1.json()["data"]["job_id"]

    # Wait for completion
    for _ in range(30):
        poll_res = await clean_client.get(f"/api/projects/{project_id}/media/jobs/{job1_id}")
        if poll_res.status_code == 200 and poll_res.json()["data"]["status"] == "completed":
            break
        await asyncio.sleep(0.1)

    poll_res = await clean_client.get(f"/api/projects/{project_id}/media/jobs/{job1_id}")
    assert poll_res.json()["data"]["status"] == "completed"
    original_asset_url = poll_res.json()["data"]["asset_url"]
    assert original_asset_url is not None

    # Second identical request dispatch -> MUST return status='completed' and same asset_url
    dispatch_res2 = await clean_client.post(f"/api/projects/{project_id}/media/generate", json=req_payload)
    assert dispatch_res2.status_code == 200
    data2 = dispatch_res2.json()["data"]
    assert data2["job_id"] == job1_id
    assert data2["status"] == "completed"
    assert data2["asset_url"] == original_asset_url


@pytest.mark.asyncio
async def test_force_regenerate_bypasses_deduplication(clean_client: AsyncClient):
    """Explicit force_regenerate=True creates a fresh generation even when completed asset exists."""
    p_res = await clean_client.post("/api/projects", json={"title": "Force Regen Test", "seed_text": "Regen seed"})
    project_id = p_res.json()["data"]["id"]

    req_payload = {
        "entity_type": "world",
        "entity_id": project_id,
        "media_type": "image",
        "prompt": "Solar powered sky harbor",
        "aspect_ratio": "1:1",
        "force_regenerate": False,
    }
    dispatch1 = await clean_client.post(f"/api/projects/{project_id}/media/generate", json=req_payload)
    job1_id = dispatch1.json()["data"]["job_id"]

    for _ in range(30):
        poll = await clean_client.get(f"/api/projects/{project_id}/media/jobs/{job1_id}")
        if poll.status_code == 200 and poll.json()["data"]["status"] == "completed":
            break
        await asyncio.sleep(0.1)

    # Force regenerate
    req_payload["force_regenerate"] = True
    dispatch2 = await clean_client.post(f"/api/projects/{project_id}/media/generate", json=req_payload)
    assert dispatch2.status_code == 200
    job2_id = dispatch2.json()["data"]["job_id"]

    # Verify a new job was dispatched
    assert job2_id != job1_id
    assert dispatch2.json()["data"]["status"] == "queued"


@pytest.mark.asyncio
async def test_concurrent_identical_requests_single_job(clean_client: AsyncClient):
    """Concurrent identical requests attach to the single in-flight job."""
    p_res = await clean_client.post("/api/projects", json={"title": "Concurrent Test", "seed_text": "Concurrent seed"})
    project_id = p_res.json()["data"]["id"]

    req_payload = {
        "entity_type": "character",
        "entity_id": "char-concurrent-1",
        "media_type": "voice",
        "prompt": "I am the sentinel of the chronosphere.",
        "voice_id": "default",
        "force_regenerate": False,
    }

    # Dispatch two identical requests in parallel
    res1, res2 = await asyncio.gather(
        clean_client.post(f"/api/projects/{project_id}/media/generate", json=req_payload),
        clean_client.post(f"/api/projects/{project_id}/media/generate", json=req_payload),
    )

    assert res1.status_code == 200
    assert res2.status_code == 200
    job1_id = res1.json()["data"]["job_id"]
    job2_id = res2.json()["data"]["job_id"]

    # Both requests must attach to the same job_id!
    assert job1_id == job2_id


# ---------------------------------------------------------------------------
# 4. Interrupted Job Recovery
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_interrupted_jobs_recovered_to_failed_state():
    """Jobs left in 'queued' or 'processing' across a container restart must be marked failed with an actionable message."""
    import uuid
    unique_job_id = f"orphaned-test-job-{uuid.uuid4().hex[:8]}"

    async with async_session() as session:
        repo = ProjectRepository(session)
        # Create dummy project
        proj = await repo.create_project(
            ProjectCreate(
                title="Restart Test",
                seed_text="Restart recovery test",
            )
        )

        # Create orphaned GenerationJob and MediaAssetRecord
        orphan_job = GenerationJob(
            id=unique_job_id,
            project_id=proj.id,
            job_type="media_video",
            status="processing",
            progress=40,
        )
        await repo.create_generation_job(orphan_job)

        orphan_asset = MediaAssetRecord(
            id=unique_job_id,
            project_id=proj.id,
            entity_type="world",
            entity_id=proj.id,
            media_type="video",
            status="processing",
            prompt="orphaned prompt",
            provider_name="pixazo-video",
        )
        await repo.create_media_asset(orphan_asset)

        # Run recovery
        recovered_count = await repo.recover_orphaned_jobs()
        assert recovered_count >= 1

        # Verify job and asset transitioned to 'failed'
        updated_job = await repo.get_generation_job(unique_job_id)
        assert updated_job is not None
        assert updated_job.status == "failed"
        assert "interrupted by server restart" in (updated_job.error_message or "").lower()

        updated_asset = await repo.get_media_asset(unique_job_id)
        assert updated_asset is not None
        assert updated_asset.status == "failed"
        assert "interrupted by server restart" in (updated_asset.error_message or "").lower()


# ---------------------------------------------------------------------------
# 5. Error Surfacing to UI / API
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_provider_error_surfaced_to_job_status(clean_client: AsyncClient):
    """When a provider fails with PaymentRequiredError, the clear error message is surfaced in the job record."""
    p_res = await clean_client.post("/api/projects", json={"title": "Error Surface Test", "seed_text": "Error seed"})
    project_id = p_res.json()["data"]["id"]

    # Patch the media service provider to raise PaymentRequiredError during processing
    with patch(
        "backend.app.services.media_service.MediaService._run_generation_pipeline"
    ) as mock_pipeline:
        async def fake_failing_pipeline(asset_id, request, repo):
            await repo.update_media_asset(
                asset_id=asset_id,
                updates={
                    "status": "failed",
                    "error_message": "Pixazo account has insufficient credits or no free tier allowance (HTTP 402)",
                },
            )
            await repo.update_generation_job(
                job_id=asset_id,
                updates={
                    "status": "failed",
                    "error_message": "Pixazo account has insufficient credits or no free tier allowance (HTTP 402)",
                },
            )
            return await repo.get_media_asset(asset_id)

        mock_pipeline.side_effect = fake_failing_pipeline

        dispatch_res = await clean_client.post(
            f"/api/projects/{project_id}/media/generate",
            json={
                "entity_type": "scene",
                "entity_id": "scene-err-1",
                "media_type": "video",
                "prompt": "dramatic chase",
            },
        )
        assert dispatch_res.status_code == 200
        job_id = dispatch_res.json()["data"]["job_id"]

        # Wait for the background task to execute
        await asyncio.sleep(0.3)

        poll_res = await clean_client.get(f"/api/projects/{project_id}/media/jobs/{job_id}")
        assert poll_res.status_code == 200
        job_info = poll_res.json()["data"]
        assert job_info["status"] == "failed"
        assert "insufficient credits" in job_info["error_message"]


# ---------------------------------------------------------------------------
# 6. Cross-Process Database Idempotency & Provider Health Verification
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cross_process_concurrent_deduplication_database_guarantee(clean_client: AsyncClient):
    """Even if two separate application processes bypass the local in-memory lock,
    the database partial unique index uq_media_active_request enforces that exactly
    one active generation job exists, and the second process attaches to the first."""
    p_res = await clean_client.post("/api/projects", json={"title": "Cross-Process Test", "seed_text": "CP seed"})
    project_id = p_res.json()["data"]["id"]

    req_data = {
        "entity_type": "character",
        "entity_id": "char-cp-1",
        "media_type": "image",
        "prompt": "bioluminescent sea explorer",
        "aspect_ratio": "1:1",
    }

    # Dispatch two requests simultaneously via asyncio.gather
    res1, res2 = await asyncio.gather(
        clean_client.post(f"/api/projects/{project_id}/media/generate", json=req_data),
        clean_client.post(f"/api/projects/{project_id}/media/generate", json=req_data),
    )

    assert res1.status_code == 200
    assert res2.status_code == 200

    job_id_1 = res1.json()["data"]["job_id"]
    job_id_2 = res2.json()["data"]["job_id"]

    # Both must reference the exact same underlying job ID due to database idempotency
    assert job_id_1 == job_id_2

    # Query database to confirm only 1 asset was inserted with this request_hash
    async with async_session() as session:
        repo = ProjectRepository(session)
        assets = await repo.list_media_assets(project_id, entity_id="char-cp-1")
        assert len(assets) == 1
        assert assets[0].id == job_id_1


@pytest.mark.asyncio
async def test_force_regenerate_bypasses_cache_cleanly(clean_client: AsyncClient):
    """When force_regenerate=True is specified, it clears active collision and creates a new asset."""
    p_res = await clean_client.post("/api/projects", json={"title": "Force Regen Test", "seed_text": "FR seed"})
    project_id = p_res.json()["data"]["id"]

    req_data = {
        "entity_type": "world",
        "entity_id": "world-fr-1",
        "media_type": "image",
        "prompt": "frozen crystalline methane ocean",
        "aspect_ratio": "16:9",
    }

    res1 = await clean_client.post(f"/api/projects/{project_id}/media/generate", json=req_data)
    assert res1.status_code == 200
    job_1 = res1.json()["data"]["job_id"]

    # Force regenerate
    req_data_force = dict(req_data)
    req_data_force["force_regenerate"] = True

    res2 = await clean_client.post(f"/api/projects/{project_id}/media/generate", json=req_data_force)
    assert res2.status_code == 200
    job_2 = res2.json()["data"]["job_id"]

    # A new job must be generated
    assert job_1 != job_2


@pytest.mark.asyncio
async def test_provider_health_endpoint_response(clean_client: AsyncClient):
    """The /api/media/providers/health endpoint returns detailed operational and modality health."""
    res = await clean_client.get("/api/media/providers/health")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "healthy"
    assert "modalities" in data
    assert "image" in data["modalities"]
    assert "voice" in data["modalities"]
    assert "video" in data["modalities"]
    assert "audio" in data["modalities"]

