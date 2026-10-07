import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from backend.app.models.dna import SeedDNA, SeedDNARecord
from backend.app.models.media import MediaAssetRecord, MediaGenerationRequest
from backend.app.models.project import ProjectCreate
from backend.app.providers.media.base import (
    MediaPayload,
    ProviderUnavailableError,
)
from backend.app.providers.media.composite import CompositeImageProvider
from backend.app.providers.media.flux import FluxSchnellProvider
from backend.app.providers.media.mock import MockImageProvider
from backend.app.providers.media.pollinations import PollinationsImageProvider
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.media_service import MediaService


@pytest.mark.asyncio
async def test_pollinations_url_and_parameters():
    provider = PollinationsImageProvider()

    # Aspect ratio 1:1
    url_1_1, w, h, seed = provider.build_generation_url("Cosmic nebula", aspect_ratio="1:1")
    assert w == 1024
    assert h == 1024
    assert "width=1024" in url_1_1
    assert "height=1024" in url_1_1
    assert "nologo=true" in url_1_1
    assert "model=flux" in url_1_1
    assert f"seed={seed}" in url_1_1
    assert "Cosmic%20nebula" in url_1_1

    # Aspect ratio 16:9
    url_16_9, w16, h16, _ = provider.build_generation_url("Panoramic desert vista", aspect_ratio="16:9")
    assert w16 == 1280
    assert h16 == 720
    assert "width=1280" in url_16_9
    assert "height=720" in url_16_9

    # Aspect ratio 9:16
    url_9_16, w9, h9, _ = provider.build_generation_url("Towering monolith", aspect_ratio="9:16")
    assert w9 == 720
    assert h9 == 1280
    assert "width=720" in url_9_16
    assert "height=1280" in url_9_16


@pytest.mark.asyncio
async def test_pollinations_retry_and_backoff_transient_recovery():
    """Simulates transient 503 or 429 followed by 200; verifies retry succeeds without fallback."""
    provider = PollinationsImageProvider(max_retries=2, initial_backoff=0.01, backoff_multiplier=1.0)

    mock_resp_fail = MagicMock()
    mock_resp_fail.status_code = 503
    mock_resp_fail.raise_for_status.side_effect = httpx.HTTPStatusError("503 Service Unavailable", request=None, response=mock_resp_fail)

    fake_jpeg_bytes = b"\xff\xd8\xff\xe0" + (b"\x00" * 100) + b"\xff\xd9"
    mock_resp_ok = MagicMock()
    mock_resp_ok.status_code = 200
    mock_resp_ok.content = fake_jpeg_bytes
    mock_resp_ok.headers = {"content-type": "image/jpeg"}
    mock_resp_ok.raise_for_status.return_value = None

    responses = [mock_resp_fail, mock_resp_ok]

    with patch("httpx.AsyncClient.get", side_effect=responses):
        payload = await provider.generate_image("Ancient ruins at dawn", aspect_ratio="16:9")
        assert payload.data == fake_jpeg_bytes
        assert payload.metadata["resolved_provider"] == "pollinations"
        assert payload.metadata["width"] == 1280
        assert payload.metadata["height"] == 720


@pytest.mark.asyncio
async def test_pollinations_retry_exhaustion_cascades_to_fallback():
    """Simulates persistent network/5xx failures; verifies fallback occurs only after retry exhaustion."""
    provider = PollinationsImageProvider(max_retries=2, initial_backoff=0.01, backoff_multiplier=1.0)

    mock_resp_fail = MagicMock()
    mock_resp_fail.status_code = 500
    mock_resp_fail.raise_for_status.side_effect = httpx.HTTPStatusError("500 Server Error", request=None, response=mock_resp_fail)

    with patch("httpx.AsyncClient.get", return_value=mock_resp_fail):
        with pytest.raises(ProviderUnavailableError) as exc_info:
            await provider.generate_image("Deep sea rift", aspect_ratio="1:1")
        assert "retry exhaustion" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_3_tier_fallback_pollinations_fail_flux_success():
    """Pollinations failure -> Flux succeeds -> resolved_provider == 'flux'."""
    pollinations_mock = MagicMock(spec=PollinationsImageProvider)
    pollinations_mock.generate_image = AsyncMock(side_effect=ProviderUnavailableError("Pollinations 503 timeout"))

    flux_mock = MagicMock(spec=FluxSchnellProvider)
    fake_flux_bytes = b"\x89PNG\r\n\x1a\n" + (b"\x00" * 100)
    flux_mock.generate_image = AsyncMock(
        return_value=MediaPayload(
            data=fake_flux_bytes,
            mime_type="image/png",
            filename="flux_test.png",
            metadata={"width": 1024, "height": 1024, "aspect_ratio": "1:1", "resolved_provider": "flux"},
        )
    )

    mock_provider = MockImageProvider()

    composite = CompositeImageProvider(
        pollinations=pollinations_mock,
        flux=flux_mock,
        mock=mock_provider,
    )

    payload = await composite.generate_image("Cybernetic archive", aspect_ratio="1:1")
    assert payload.data == fake_flux_bytes
    assert payload.metadata["resolved_provider"] == "flux"
    assert pollinations_mock.generate_image.called
    assert flux_mock.generate_image.called


@pytest.mark.asyncio
async def test_3_tier_fallback_pollinations_and_flux_fail_mock_success():
    """Pollinations failure -> Flux failure -> Mock succeeds cleanly (no 500 error)."""
    pollinations_mock = MagicMock(spec=PollinationsImageProvider)
    pollinations_mock.generate_image = AsyncMock(side_effect=ProviderUnavailableError("Pollinations network error"))

    flux_mock = MagicMock(spec=FluxSchnellProvider)
    flux_mock.generate_image = AsyncMock(side_effect=ProviderUnavailableError("FLUX_ENDPOINT unreachable"))

    mock_provider = MockImageProvider()

    composite = CompositeImageProvider(
        pollinations=pollinations_mock,
        flux=flux_mock,
        mock=mock_provider,
    )

    payload = await composite.generate_image("Submerged biosphere", aspect_ratio="16:9")
    assert payload.mime_type == "image/svg+xml"
    assert payload.metadata["resolved_provider"] == "mock"
    assert b"<svg" in payload.data
    assert payload.metadata["width"] == 1200
    assert payload.metadata["height"] == 675


@pytest.mark.asyncio
async def test_prompt_enrichment_with_seed_dna():
    """Asserts Seed DNA tone, atmosphere, and visual keywords are included in image prompt."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = await repo.create_project(ProjectCreate(title="Deep Abyssal Expanse"))

        # Seed DNA fixture
        await repo.save_seed_dna(
            project_id=project.id,
            raw_seed="A submerged dome at the bottom of the Mariana Trench",
            dna=SeedDNA(
                premise="Humanity survives in isolated deep-sea geothermal domes",
                tone="Ethereal biopunk mystery",
                domain_keywords=["bioluminescence", "abyssal trenches", "hydrothermal vents"],
                themes=["survival", "oceanic unknown"],
                constraints=[],
                entities=[],
            ),
        )

        service = MediaService(repo=repo)
        req = MediaGenerationRequest(
            entity_type="world",
            entity_id=project.id,
            media_type="image",
            prompt="A grand observation hall overlooking hydrothermal vents",
            aspect_ratio="16:9",
        )
        asset_record = await repo.create_media_asset(
            MediaAssetRecord(
                project_id=project.id,
                entity_type=req.entity_type,
                entity_id=req.entity_id,
                media_type="image",
                status="queued",
                prompt=req.prompt,
                aspect_ratio="16:9",
            )
        )
        asset = await service.process_job_now(asset_record.id, req)

        assert asset.status == "completed"
        assert "Tone: Ethereal biopunk mystery" in asset.prompt
        assert "Style: bioluminescence, abyssal trenches, hydrothermal vents" in asset.prompt
        assert "Atmosphere: survival, oceanic unknown" in asset.prompt
        assert "A grand observation hall overlooking hydrothermal vents" in asset.prompt


@pytest.mark.asyncio
async def test_image_metadata_persistence():
    """Generates image and verifies database record preserves width, height, aspect_ratio, metadata_json."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = await repo.create_project(ProjectCreate(title="Metadata Verification World"))

        service = MediaService(repo=repo)
        req = MediaGenerationRequest(
            entity_type="character",
            entity_id="char-valen",
            media_type="image",
            prompt="Portrait of Chief Engineer Valen",
            aspect_ratio="9:16",
        )
        asset_record = await repo.create_media_asset(
            MediaAssetRecord(
                project_id=project.id,
                entity_type=req.entity_type,
                entity_id=req.entity_id,
                media_type="image",
                status="queued",
                prompt=req.prompt,
                aspect_ratio="9:16",
            )
        )
        asset = await service.process_job_now(asset_record.id, req)

        assert asset.status == "completed"
        assert asset.aspect_ratio == "9:16"
        assert asset.width is not None
        assert asset.height is not None
        assert asset.provider_name in ("pollinations", "flux", "mock")
        assert asset.asset_url is not None
        assert asset.completed_at is not None

        # Verify parsed metadata_json
        meta = json.loads(asset.metadata_json or "{}")
        assert meta.get("raw_prompt") == "Portrait of Chief Engineer Valen"
        assert meta.get("entity_type") == "character"
        assert meta.get("entity_id") == "char-valen"
        assert "resolved_provider" in meta


@pytest.mark.asyncio
async def test_image_api_with_aspect_ratios():
    """Verifies REST API invocation with aspect ratios 1:1, 16:9, 9:16."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Create project
        create_resp = await client.post("/api/projects", json={"title": "Aspect Ratio Test"})
        assert create_resp.status_code in (200, 201)
        project_id = create_resp.json()["data"]["id"]

        for ratio in ["1:1", "16:9", "9:16"]:
            gen_resp = await client.post(
                f"/api/projects/{project_id}/media/generate",
                json={
                    "entity_type": "scene",
                    "entity_id": f"scene-{ratio.replace(':', '-')}",
                    "media_type": "image",
                    "prompt": f"Dramatic encounter framing at {ratio}",
                    "aspect_ratio": ratio,
                },
            )
            assert gen_resp.status_code == 200
            data = gen_resp.json()["data"]
            assert data["status"] == "queued"
            assert data["media_type"] == "image"
            assert data["job_id"] is not None
            # Brief yield to allow SQLite async worker cycle
            await asyncio.sleep(0.05)
