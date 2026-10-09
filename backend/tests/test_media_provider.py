import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app
from backend.app.models.project import ProjectCreate
from backend.app.models.media import MediaGenerationRequest, MediaAssetRecord
from backend.app.providers.media.base import MediaPayload
from backend.app.providers.media.mock import (
    MockImageProvider,
    MockVoiceProvider,
    MockVideoProvider,
    MockAudioProvider,
    MockMediaProvider,
)
from backend.app.providers.media.factory import MediaProviderFactory, get_media_provider
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.media_service import MediaService


@pytest.mark.asyncio
async def test_mock_image_provider():
    provider = MockImageProvider()
    payload = await provider.generate_image(
        prompt="A neon cyberpunk metropolis under bioluminescent rain",
        aspect_ratio="16:9",
        context={"entity_id": "world-1", "entity_type": "world"},
    )
    assert isinstance(payload, MediaPayload)
    assert payload.mime_type == "image/svg+xml"
    content = payload.data.decode("utf-8")
    assert "<svg" in content
    assert "viewBox" in content
    assert "metropolis" in content or "cyberpunk" in content
    health = await provider.health_check()
    assert health["status"] == "healthy"


@pytest.mark.asyncio
async def test_mock_voice_provider():
    provider = MockVoiceProvider()
    payload = await provider.generate_voice(
        text="Greetings, traveler of the latent horizon.",
        voice_id="narrator",
        context={},
    )
    assert isinstance(payload, MediaPayload)
    assert payload.mime_type == "audio/wav"
    # Verify standard 44-byte RIFF/WAVE header
    assert len(payload.data) > 44
    assert payload.data[:4] == b"RIFF"
    assert payload.data[8:12] == b"WAVE"
    assert payload.data[12:16] == b"fmt "
    health = await provider.health_check()
    assert health["status"] == "healthy"


@pytest.mark.asyncio
async def test_mock_video_provider():
    provider = MockVideoProvider()
    payload = await provider.generate_video(
        prompt="Camera pans across jagged crystalline spire",
        context={},
    )
    assert isinstance(payload, MediaPayload)
    assert payload.mime_type == "video/mp4"
    assert len(payload.data) >= 8
    # Check for ftyp signature
    assert b"ftyp" in payload.data[:32]
    health = await provider.health_check()
    assert health["status"] == "healthy"


@pytest.mark.asyncio
async def test_mock_audio_provider():
    provider = MockAudioProvider()
    payload = await provider.generate_audio(
        prompt="Wind chimes over distant cosmic waves",
        duration_sec=3,
        mood="ambient",
        context={},
    )
    assert isinstance(payload, MediaPayload)
    assert payload.mime_type == "audio/wav"
    assert payload.data[:4] == b"RIFF"
    health = await provider.health_check()
    assert health["status"] == "healthy"


@pytest.mark.asyncio
async def test_composite_mock_media_provider():
    provider = MockMediaProvider()
    assert provider.name == "mock"
    health = await provider.health_check()
    assert health["status"] == "healthy"
    assert "image" in health["modalities"]
    assert "voice" in health["modalities"]
    assert "video" in health["modalities"]
    assert "audio" in health["modalities"]



@pytest.mark.asyncio
async def test_media_provider_factory(monkeypatch):
    monkeypatch.setenv("IMAGE_PROVIDER", "mock")
    monkeypatch.setenv("VOICE_PROVIDER", "mock")
    monkeypatch.setenv("VIDEO_PROVIDER", "mock")
    monkeypatch.setenv("AUDIO_PROVIDER", "mock")
    import backend.app.providers.media.factory as mf
    mf._global_media_provider = None
    provider = get_media_provider()
    assert isinstance(provider, MockMediaProvider)


    factory_provider = MediaProviderFactory.create_provider()
    assert factory_provider.name in ("mock", "ConfiguredMediaProvider")


@pytest.mark.asyncio
async def test_media_service_lifecycle_and_execution():
    async with async_session() as session:
        repo = ProjectRepository(session)
        # Create a test project
        project = await repo.create_project(
            ProjectCreate(
                title="Media Test Project",
                seed_text="Testing media generation pipeline",
            )
        )

        service = MediaService(repo=repo)
        req = MediaGenerationRequest(
            entity_type="character",
            entity_id="char-1",
            media_type="image",
            prompt="A mystical archivist with glowing obsidian runes",
            aspect_ratio="1:1",
        )

        # 1. Dispatch job (non-blocking)
        job_res = await service.dispatch_job(project.id, req)
        assert job_res.status == "queued"
        assert job_res.job_id is not None

        # 2. Directly process job to test synchronous execution
        completed_rec = await service.process_job_now(job_res.job_id, req)
        assert completed_rec.status == "completed"
        assert completed_rec.asset_url is not None
        assert f"/projects/{project.id}/media/image/" in completed_rec.asset_url
        assert completed_rec.mime_type in ("image/svg+xml", "image/jpeg", "image/png")
        assert completed_rec.completed_at is not None

        # 3. Retrieve job
        fetched_rec = await service.get_job(job_res.job_id)
        assert fetched_rec is not None
        assert fetched_rec.status == "completed"

        # 4. List assets
        assets = await service.list_assets(project.id, entity_id="char-1")
        assert len(assets) >= 1
        assert assets[0].id == job_res.job_id


@pytest.mark.asyncio
async def test_media_service_error_containment():
    class FailingImageProvider(MockImageProvider):
        async def generate_image(self, prompt: str, aspect_ratio: str = "1:1", context=None):
            raise RuntimeError("API quota exhausted: simulated 429 provider error")

    failing_provider = MockMediaProvider(image_provider=FailingImageProvider())

    async with async_session() as session:
        repo = ProjectRepository(session)
        project = await repo.create_project(
            ProjectCreate(
                title="Fault Tolerant Project",
                seed_text="Testing graceful error containment",
            )
        )


        service = MediaService(repo=repo, media_provider=failing_provider)
        req = MediaGenerationRequest(
            entity_type="scene",
            entity_id="scene-1",
            media_type="image",
            prompt="A cataclysmic star collapse",
        )

        job_res = await service.dispatch_job(project.id, req)
        # Process directly with failing provider
        result = await service.process_job_now(job_res.job_id, req)

        # Must not crash, but cleanly record failure
        assert result.status == "failed"
        assert "API quota exhausted" in (result.error_message or "")


@pytest.mark.asyncio
async def test_media_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create project
        create_res = await client.post(
            "/api/projects",
            json={"title": "Media API Test", "seed_text": "Testing media endpoints"},
        )
        assert create_res.status_code == 201
        proj_id = create_res.json()["data"]["id"]

        # Health endpoint
        health_res = await client.get("/api/media/providers/health")
        assert health_res.status_code == 200
        assert health_res.json()["data"]["status"] == "healthy"
        assert "modalities" in health_res.json()["data"]


        # Generate media
        gen_res = await client.post(
            f"/api/projects/{proj_id}/media/generate",
            json={
                "entity_type": "world",
                "entity_id": "world-beta",
                "media_type": "voice",
                "prompt": "Welcome to the celestial sanctuary.",
                "voice_id": "oracle",
            },
        )
        assert gen_res.status_code == 200
        job_data = gen_res.json()["data"]
        job_id = job_data["job_id"]
        assert job_data["status"] in ["queued", "processing", "completed"]

        # Poll status
        import asyncio
        for _ in range(20):
            status_res = await client.get(f"/api/projects/{proj_id}/media/jobs/{job_id}")
            assert status_res.status_code == 200
            current_status = status_res.json()["data"]["status"]
            if current_status in ["completed", "failed"]:
                break
            await asyncio.sleep(0.1)

        # Asset listing
        assets_res = await client.get(f"/api/projects/{proj_id}/media/assets?entity_id=world-beta")
        assert assets_res.status_code == 200
        assets = assets_res.json()["data"]
        assert len(assets) >= 1
        assert assets[0]["id"] == job_id


@pytest.mark.asyncio
async def test_real_mode_prevents_mock_fallback(monkeypatch):
    """Explicit test that forces real provider failure and ensures the job fails without reaching MockProvider."""
    # We will set PRAROHA_ENV=real to trigger real mode
    monkeypatch.setenv("PRAROHA_ENV", "real")
    monkeypatch.setenv("ENVIRONMENT", "real")
    
    from backend.app.providers.media.composite import CompositeImageProvider
    from backend.app.providers.media.base import ProviderUnavailableError
    
    class AlwaysFailsImageProvider(MockImageProvider):
        async def generate_image(self, prompt: str, aspect_ratio: str = "1:1", context=None):
            raise ProviderUnavailableError("Simulated real provider failure")
            
    provider = CompositeImageProvider(
        pollinations=AlwaysFailsImageProvider(),
        flux=AlwaysFailsImageProvider(),
    )
    
    with pytest.raises(ProviderUnavailableError, match="disabled in real mode"):
        await provider.generate_image(prompt="test")

