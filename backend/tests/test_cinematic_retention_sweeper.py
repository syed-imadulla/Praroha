"""
Tests for PRAROHA Cinematic Preview Retention Sweeper (Phase 54 Task B).
"""

import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.media import MediaAssetRecord
from backend.app.models.project import Project
from backend.app.providers.storage import StorageProvider
from backend.app.repositories.project_repo import async_session
from backend.app.services.cinematic_retention_sweeper import (
    CinematicPreviewRetentionSweeper,
    extract_storage_key,
)


class MockStorageProvider(StorageProvider):
    def __init__(self):
        self.deleted_keys = []
        self.files = {}

    async def upload(self, file_data: bytes, key: str, mime_type: str) -> str:
        self.files[key] = file_data
        return f"https://mock-storage.test/{key}"

    async def get_url(self, key: str) -> str:
        return f"https://mock-storage.test/{key}"

    async def delete(self, key: str) -> bool:
        self.deleted_keys.append(key)
        if key in self.files:
            del self.files[key]
        return True


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


@pytest.mark.asyncio
async def test_extract_storage_key():
    # From metadata_json
    meta = json.dumps({"storage_key": "projects/proj-1/media/video/entity_123.mp4"})
    assert extract_storage_key(None, meta) == "projects/proj-1/media/video/entity_123.mp4"

    # From Supabase public URL
    url = "https://stxnxkzaftmwcbtvgzbm.supabase.co/storage/v1/object/public/seed-unfold-assets/projects/proj-1/media/video/scene-001_1792923335.mp4"
    assert extract_storage_key(url, None) == "projects/proj-1/media/video/scene-001_1792923335.mp4"

    # Unknown url format
    assert extract_storage_key("https://example.com/random.png", None) is None


@pytest.mark.asyncio
async def test_dry_run_by_default():
    """Dry run identifies eligible candidates but mutates neither storage nor database."""
    now = get_utc_now()
    old_date = now - timedelta(days=75)

    async with async_session() as session:
        # Create a soft-deleted project
        proj = Project(
            id=str(uuid.uuid4()),
            title="Deleted World",
            deleted_at=now - timedelta(days=10),
        )
        session.add(proj)

        asset = MediaAssetRecord(
            id=str(uuid.uuid4()),
            project_id=proj.id,
            entity_type="world",
            entity_id="world-del-1",
            media_type="video",
            provider_name="Cinematic Preview",
            status="completed",
            asset_url=f"https://mock-storage.test/projects/{proj.id}/media/video/world-del-1_100.mp4",
            metadata_json=json.dumps({"storage_key": f"projects/{proj.id}/media/video/world-del-1_100.mp4"}),
            created_at=old_date,
        )
        session.add(asset)
        await session.commit()

        asset_id = asset.id

    mock_storage = MockStorageProvider()
    mock_storage.files[f"projects/{proj.id}/media/video/world-del-1_100.mp4"] = b"fake-video-bytes"

    sweeper = CinematicPreviewRetentionSweeper(
        retention_days=60,
        storage_provider=mock_storage,
    )

    report = await sweeper.evaluate_and_sweep(dry_run=True)

    assert report.dry_run is True
    assert report.evaluated_candidates >= 1
    decision = next(d for d in report.decisions if d.asset_id == asset_id)
    assert decision.eligible is True
    assert "soft-deleted" in decision.decision_reason
    assert decision.purged is False
    assert len(mock_storage.deleted_keys) == 0

    # Verify DB record is untouched
    async with async_session() as session:
        fetched = await session.get(MediaAssetRecord, asset_id)
        assert fetched.status == "completed"
        assert fetched.asset_url is not None


@pytest.mark.asyncio
async def test_preserves_active_primary_preview_even_if_old():
    """An asset older than 60 days on an active project that is the sole preview is PRESERVED."""
    now = get_utc_now()
    old_date = now - timedelta(days=70)

    async with async_session() as session:
        proj = Project(
            id=str(uuid.uuid4()),
            title="Active World",
            deleted_at=None,
        )
        session.add(proj)

        asset = MediaAssetRecord(
            id=str(uuid.uuid4()),
            project_id=proj.id,
            entity_type="world",
            entity_id="world-active-1",
            media_type="video",
            provider_name="Cinematic Preview",
            status="completed",
            asset_url=f"https://mock-storage.test/projects/{proj.id}/media/video/world-active-1.mp4",
            created_at=old_date,
        )
        session.add(asset)
        await session.commit()
        asset_id = asset.id

    mock_storage = MockStorageProvider()
    sweeper = CinematicPreviewRetentionSweeper(
        retention_days=60,
        storage_provider=mock_storage,
    )

    report = await sweeper.evaluate_and_sweep(dry_run=False)

    decision = next(d for d in report.decisions if d.asset_id == asset_id)
    assert decision.eligible is False
    assert "Preserved" in decision.decision_reason
    assert len(mock_storage.deleted_keys) == 0

    async with async_session() as session:
        fetched = await session.get(MediaAssetRecord, asset_id)
        assert fetched.status == "completed"
        assert fetched.asset_url is not None


@pytest.mark.asyncio
async def test_purges_superseded_preview_older_than_60_days():
    """An old preview that was superseded by a newer preview on the same entity IS eligible and purged."""
    now = get_utc_now()
    old_date = now - timedelta(days=65)
    new_date = now - timedelta(days=10)

    async with async_session() as session:
        proj = Project(
            id=str(uuid.uuid4()),
            title="Evolving World",
            deleted_at=None,
        )
        session.add(proj)

        old_asset = MediaAssetRecord(
            id=str(uuid.uuid4()),
            project_id=proj.id,
            entity_type="scene",
            entity_id="scene-001",
            media_type="video",
            provider_name="Cinematic Preview",
            status="completed",
            asset_url=f"https://mock-storage.test/projects/{proj.id}/media/video/scene-001_old.mp4",
            metadata_json=json.dumps({"storage_key": f"projects/{proj.id}/media/video/scene-001_old.mp4"}),
            created_at=old_date,
        )
        new_asset = MediaAssetRecord(
            id=str(uuid.uuid4()),
            project_id=proj.id,
            entity_type="scene",
            entity_id="scene-001",
            media_type="video",
            provider_name="Cinematic Preview",
            status="completed",
            asset_url=f"https://mock-storage.test/projects/{proj.id}/media/video/scene-001_new.mp4",
            metadata_json=json.dumps({"storage_key": f"projects/{proj.id}/media/video/scene-001_new.mp4"}),
            created_at=new_date,
        )
        session.add(old_asset)
        session.add(new_asset)
        await session.commit()
        old_id = old_asset.id
        new_id = new_asset.id

    mock_storage = MockStorageProvider()
    mock_storage.files[f"projects/{proj.id}/media/video/scene-001_old.mp4"] = b"old-video"
    mock_storage.files[f"projects/{proj.id}/media/video/scene-001_new.mp4"] = b"new-video"

    sweeper = CinematicPreviewRetentionSweeper(
        retention_days=60,
        storage_provider=mock_storage,
    )

    report = await sweeper.evaluate_and_sweep(dry_run=False)

    old_decision = next(d for d in report.decisions if d.asset_id == old_id)
    assert old_decision.eligible is True
    assert "Superseded" in old_decision.decision_reason
    assert old_decision.purged is True
    assert f"projects/{proj.id}/media/video/scene-001_old.mp4" in mock_storage.deleted_keys
    assert f"projects/{proj.id}/media/video/scene-001_new.mp4" not in mock_storage.deleted_keys

    # Verify old DB record transitioned to purged with asset_url cleared
    async with async_session() as session:
        fetched_old = await session.get(MediaAssetRecord, old_id)
        assert fetched_old.status == "purged"
        assert fetched_old.asset_url is None
        meta = json.loads(fetched_old.metadata_json)
        assert "purged_at" in meta

        # Verify new record is untouched
        fetched_new = await session.get(MediaAssetRecord, new_id)
        assert fetched_new.status == "completed"
        assert fetched_new.asset_url is not None


@pytest.mark.asyncio
async def test_purges_failed_preview_older_than_60_days():
    """Failed previews older than 60 days are eligible and purged."""
    now = get_utc_now()
    old_date = now - timedelta(days=62)

    async with async_session() as session:
        proj = Project(
            id=str(uuid.uuid4()),
            title="Failed Render Project",
            deleted_at=None,
        )
        session.add(proj)

        failed_asset = MediaAssetRecord(
            id=str(uuid.uuid4()),
            project_id=proj.id,
            entity_type="world",
            entity_id="world-fail-1",
            media_type="video",
            provider_name="Cinematic Preview",
            status="failed",
            error_message="Worker timeout",
            asset_url=None,
            created_at=old_date,
        )
        session.add(failed_asset)
        await session.commit()
        failed_id = failed_asset.id

    mock_storage = MockStorageProvider()
    sweeper = CinematicPreviewRetentionSweeper(
        retention_days=60,
        storage_provider=mock_storage,
    )

    report = await sweeper.evaluate_and_sweep(dry_run=False)

    decision = next(d for d in report.decisions if d.asset_id == failed_id)
    assert decision.eligible is True
    assert "failed preview" in decision.decision_reason
    assert decision.purged is True

    async with async_session() as session:
        fetched = await session.get(MediaAssetRecord, failed_id)
        assert fetched.status == "purged"


@pytest.mark.asyncio
async def test_ignores_non_cinematic_assets():
    """Never evaluates or purges non-cinematic assets (images, audio, voice, or third-party providers)."""
    now = get_utc_now()
    old_date = now - timedelta(days=100)

    async with async_session() as session:
        proj = Project(
            id=str(uuid.uuid4()),
            title="Media Project",
            deleted_at=now - timedelta(days=5),
        )
        session.add(proj)

        image_asset = MediaAssetRecord(
            id=str(uuid.uuid4()),
            project_id=proj.id,
            entity_type="world",
            entity_id="world-art-1",
            media_type="image",
            provider_name="Pollinations",
            status="completed",
            asset_url="https://mock-storage.test/projects/image.jpg",
            created_at=old_date,
        )
        audio_asset = MediaAssetRecord(
            id=str(uuid.uuid4()),
            project_id=proj.id,
            entity_type="scene",
            entity_id="scene-audio-1",
            media_type="audio",
            provider_name="AtmosphericAudio",
            status="completed",
            asset_url="https://mock-storage.test/projects/ambient.wav",
            created_at=old_date,
        )
        session.add(image_asset)
        session.add(audio_asset)
        await session.commit()
        img_id = image_asset.id
        aud_id = audio_asset.id

    mock_storage = MockStorageProvider()
    sweeper = CinematicPreviewRetentionSweeper(
        retention_days=60,
        storage_provider=mock_storage,
    )

    report = await sweeper.evaluate_and_sweep(dry_run=False)

    evaluated_ids = [d.asset_id for d in report.decisions]
    assert img_id not in evaluated_ids
    assert aud_id not in evaluated_ids
    assert len(mock_storage.deleted_keys) == 0

    async with async_session() as session:
        assert (await session.get(MediaAssetRecord, img_id)).status == "completed"
        assert (await session.get(MediaAssetRecord, aud_id)).status == "completed"
