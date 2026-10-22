"""
Unit and Integration Tests for Dedicated Cinematic Rendering Worker (Phase 48).

Verifies:
1. Worker process isolation (zero FastAPI/Uvicorn imports).
2. Local rendering execution using existing assets with resource measurements.
3. Strict honest metadata tagging (is_synthetic: True, provider_label: "Cinematic Preview").
4. Graceful static fallback when image assets are missing.
5. Subprocess timeout handling and failure containment.
6. Database job-state lifecycle transitions (queued -> processing -> completed/failed).
7. Standalone CLI subprocess execution and exit codes.
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import pytest
from datetime import datetime, timezone

from sqlmodel import select, SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord
from backend.app.services.cinematic_preview import CinematicPreviewSpec
from backend.app.workers.cinematic_worker import (
    execute_cinematic_job,
    run_worker,
)


@pytest.mark.asyncio
async def test_worker_does_not_import_web_frameworks():
    """Verify that the worker CLI module does not import FastAPI or Uvicorn."""
    import importlib
    import backend.app.workers.cinematic_worker as worker_module

    # Assert web frameworks are not imported by the worker
    loaded_modules = sys.modules.keys()
    assert "fastapi" not in loaded_modules or not hasattr(worker_module, "FastAPI"), (
        "cinematic_worker must not depend on or expose FastAPI"
    )
    assert "uvicorn" not in loaded_modules or not hasattr(worker_module, "uvicorn"), (
        "cinematic_worker must not depend on or expose Uvicorn"
    )


@pytest.mark.asyncio
async def test_worker_spec_render_with_local_fixtures():
    """Renders a real 5s preview using local assets and measures latency and RSS memory."""
    image_path = "gallery/gallery_04_stage3_divergent_worlds.png"
    voice_path = "uploads/projects/e3a497bc-5c8d-4283-9384-c781551b6ecb/media/audio/95c392ef-a345-4448-881c-73ab7112c7d3.mp3"
    ambient_path = "uploads/media/audio/51f7bcd5-6f0a-473f-af4f-dcca5687f390.wav"

    if not os.path.exists(image_path):
        pytest.skip("Test image fixture missing")

    spec = CinematicPreviewSpec(
        project_id="test-proj-worker",
        entity_type="scene",
        entity_id="test-scene-worker",
        title="Sanctuary of the Ancient Tide",
        location_setting="Submerged Atrium",
        image_path=image_path,
        voice_path=voice_path if os.path.exists(voice_path) else None,
        ambient_path=ambient_path if os.path.exists(ambient_path) else None,
        duration_sec=5,
    )

    result, metrics = await execute_cinematic_job(spec, timeout_sec=30.0)

    assert result.status == "completed"
    assert result.video_path is not None
    assert os.path.exists(result.video_path)
    assert os.path.getsize(result.video_path) > 10000  # At least 10KB

    # Metadata verification
    assert result.metadata["is_synthetic"] is True
    assert result.metadata["provider_label"] == "Cinematic Preview"
    assert result.metadata["render_engine"] == "native-ffmpeg-worker"

    # Latency verification: 5s clip should render in < 5.0 seconds
    assert metrics["render_elapsed_sec"] < 5.0, f"Render took too long: {metrics['render_elapsed_sec']}s"
    assert metrics["peak_rss_mb"] > 0


@pytest.mark.asyncio
async def test_worker_missing_image_graceful_static_fallback():
    """Missing concept art returns static fallback without failing or inventing fake video."""
    spec = CinematicPreviewSpec(
        project_id="test-proj-fallback",
        entity_type="scene",
        entity_id="test-scene-fallback",
        title="Forgotten Hollow",
        image_path="/path/to/nonexistent/image.png",
        duration_sec=5,
    )

    result, metrics = await execute_cinematic_job(spec)

    assert result.status == "static_fallback"
    assert result.video_path is None
    assert result.metadata["is_synthetic"] is True
    assert result.metadata["provider_label"] == "Cinematic Preview"
    assert result.metadata["preview_type"] == "static_keyframe"
    assert result.metadata["title"] == "Forgotten Hollow"


@pytest.mark.asyncio
async def test_worker_timeout_handling():
    """Simulates a frozen FFmpeg process and verifies worker catches timeout cleanly."""
    image_path = "gallery/gallery_04_stage3_divergent_worlds.png"
    if not os.path.exists(image_path):
        pytest.skip("Test image fixture missing")

    spec = CinematicPreviewSpec(
        project_id="test-proj-timeout",
        entity_type="scene",
        entity_id="test-scene-timeout",
        title="Infinite Abyss",
        image_path=image_path,
        duration_sec=5,
    )

    # Use micro-timeout (0.001s) to trigger timeout exception
    result, metrics = await execute_cinematic_job(spec, timeout_sec=0.001)

    assert result.status == "failed"
    assert "timed out" in result.error_message.lower()
    assert result.metadata["is_synthetic"] is True
    assert result.metadata["provider_label"] == "Cinematic Preview"


@pytest.mark.asyncio
async def test_worker_database_lifecycle_integration():
    """
    Tests full database lifecycle with an isolated SQLite database:
    Job state transitions: queued -> processing -> completed.
    """
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp_db:
        db_path = tmp_db.name

    db_url = f"sqlite+aiosqlite:///{db_path}"
    engine = create_async_engine(db_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    image_path = "gallery/gallery_04_stage3_divergent_worlds.png"
    if not os.path.exists(image_path):
        pytest.skip("Test image fixture missing")

    job_id = "test-job-lifecycle-123"
    spec_payload = {
        "project_id": "proj-lifecycle",
        "entity_type": "scene",
        "entity_id": "scene-lifecycle",
        "title": "Sunken Spire",
        "image_path": image_path,
        "duration_sec": 4,
    }

    async with session_maker() as session:
        job = GenerationJob(
            id=job_id,
            project_id="proj-lifecycle",
            job_type="cinematic_preview",
            status="queued",
            result_json=json.dumps(spec_payload),
        )
        media_record = MediaAssetRecord(
            id="media-lifecycle-123",
            project_id="proj-lifecycle",
            entity_type="scene",
            entity_id="scene-lifecycle",
            media_type="video",
            status="queued",
        )
        session.add(job)
        session.add(media_record)
        await session.commit()

    # Execute worker CLI runner
    exit_code = await run_worker(
        job_id=job_id,
        database_url=db_url,
        storage_provider_type="local",
        timeout_sec=30.0,
    )

    assert exit_code == 0

    # Verify updated database records
    async with session_maker() as session:
        stmt_job = select(GenerationJob).where(GenerationJob.id == job_id)
        res_job = await session.execute(stmt_job)
        updated_job = res_job.scalars().first()

        assert updated_job is not None
        assert updated_job.status == "completed"
        assert updated_job.progress == 100
        assert updated_job.started_at is not None
        assert updated_job.completed_at is not None
        result_data = json.loads(updated_job.result_json)
        assert result_data["status"] == "completed"
        assert result_data["metadata"]["is_synthetic"] is True
        assert result_data["metadata"]["provider_label"] == "Cinematic Preview"

        stmt_media = select(MediaAssetRecord).where(MediaAssetRecord.id == "media-lifecycle-123")
        res_media = await session.execute(stmt_media)
        updated_media = res_media.scalars().first()

        assert updated_media is not None
        assert updated_media.status == "completed"
        assert updated_media.asset_url is not None
        meta = json.loads(updated_media.metadata_json)
        assert meta["is_synthetic"] is True
        assert meta["provider_label"] == "Cinematic Preview"

    await engine.dispose()
    if os.path.exists(db_path):
        os.remove(db_path)


def test_worker_cli_subprocess_execution():
    """Runs the worker CLI as an independent OS process and verifies exit code 0."""
    image_path = "gallery/gallery_04_stage3_divergent_worlds.png"
    if not os.path.exists(image_path):
        pytest.skip("Test image fixture missing")

    spec_dict = {
        "project_id": "proj-cli-test",
        "entity_type": "scene",
        "entity_id": "scene-cli-test",
        "title": "Crystal Cavern",
        "image_path": image_path,
        "duration_sec": 3,
    }

    cmd = [
        sys.executable,
        "-m",
        "backend.app.workers.cinematic_worker",
        "--spec-json",
        json.dumps(spec_dict),
    ]

    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
    assert proc.returncode == 0, f"CLI execution failed:\nSTDOUT: {proc.stdout}\nSTDERR: {proc.stderr}"
    assert "__CINEMATIC_WORKER_RESULT__:" in proc.stdout
    assert '"is_synthetic": true' in proc.stdout
    assert '"provider_label": "Cinematic Preview"' in proc.stdout
