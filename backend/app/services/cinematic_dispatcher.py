"""
PRAROHA Cinematic Preview Job Dispatcher (Phase 51).

Architectural Contract:
- Non-blocking asynchronous dispatch to the isolated cinematic worker.
- The primary FastAPI web application NEVER imports FFmpeg, executes rendering subprocesses,
  or blocks synchronously waiting for an MP4 to render.
- Strictly validates project ownership, entity permissions, and asset boundaries.
- Reuses request deduplication and active-job tracking.
- Preserves honest labeling: is_synthetic=True, provider_label="Cinematic Preview".
"""

import asyncio
import hashlib
import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

import httpx
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord, MediaJobResponse
from backend.app.repositories.project_repo import ProjectRepository, async_session

logger = logging.getLogger("seed_unfold.cinematic_dispatcher")


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_worker_auth_token() -> str:
    """Return expected service-to-service authentication token."""
    token = os.getenv("WORKER_AUTH_TOKEN")
    if token and token.strip():
        return token.strip()
    supa_key = os.getenv("SUPABASE_KEY")
    if supa_key and supa_key.strip():
        return hashlib.sha256(f"praroha-worker:{supa_key.strip()}".encode()).hexdigest()
    return "dev-worker-insecure-secret"


class CinematicPreviewJobRequest(BaseModel):
    entity_type: str = Field("world", description="Entity type: 'world' or 'scene'")
    entity_id: str = Field(..., description="ID of the world candidate or scene")
    title: Optional[str] = Field(None, description="Optional title overlay")
    location_setting: Optional[str] = Field(None, description="Optional location/setting subtitle")
    conflict_narrative: Optional[str] = Field(None, description="Optional conflict narrative context")
    image_url: Optional[str] = Field(None, description="Remote URL or project asset path for keyframe art")
    voice_url: Optional[str] = Field(None, description="Optional remote URL or asset path for vocal narration")
    ambient_url: Optional[str] = Field(None, description="Optional remote URL or asset path for ambient audio")
    duration_sec: int = Field(5, ge=3, le=60, description="Duration in seconds (3-60s)")
    aspect_ratio: str = Field("16:9", description="Aspect ratio (default 16:9 widescreen)")
    force_regenerate: bool = Field(False, description="Bypass deduplication and force regeneration")


def compute_preview_hash(project_id: str, request: CinematicPreviewJobRequest) -> str:
    """Deterministic hash fingerprint for deduplicating preview requests."""
    payload = {
        "project_id": project_id,
        "entity_type": request.entity_type,
        "entity_id": request.entity_id,
        "title": (request.title or "").strip().lower(),
        "image_url": (request.image_url or "").strip(),
        "voice_url": (request.voice_url or "").strip(),
        "ambient_url": (request.ambient_url or "").strip(),
        "duration_sec": request.duration_sec,
        "aspect_ratio": request.aspect_ratio,
    }
    serialized = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


class CinematicDispatcherService:
    """Dispatches non-blocking cinematic preview rendering jobs to the isolated worker."""

    def __init__(self, repo: ProjectRepository, worker_url: Optional[str] = None):
        self.repo = repo
        self.worker_url = worker_url or os.getenv("CINEMATIC_WORKER_URL", "http://praroha-cinematic-worker:8080")

    async def dispatch_preview_job(
        self,
        project_id: str,
        request: CinematicPreviewJobRequest,
    ) -> MediaJobResponse:
        """
        Validate, create durable job record, and dispatch to worker asynchronously.
        Returns immediately with HTTP 202-compatible MediaJobResponse.
        """
        # 1. Validate Project and Entity ID formats
        if not re.match(r"^[a-zA-Z0-9_\-]+$", project_id):
            raise HTTPException(status_code=400, detail="Invalid project_id format.")
        if not re.match(r"^[a-zA-Z0-9_\-]+$", request.entity_id):
            raise HTTPException(status_code=400, detail="Invalid entity_id format.")

        # 2. Verify project exists
        project = await self.repo.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")

        # 3. Resolve and validate essential entity context
        resolved_title = request.title
        resolved_setting = request.location_setting
        resolved_conflict = request.conflict_narrative

        if request.entity_type == "world":
            world_cand = await self.repo.get_world_candidate(request.entity_id)
            if not world_cand:
                sel_tuple = await self.repo.get_active_world_selection(project_id)
                if sel_tuple:
                    _, world_cand = sel_tuple
            if world_cand:
                resolved_title = resolved_title or world_cand.title
                resolved_setting = resolved_setting or (world_cand.aesthetic or "")
                resolved_conflict = resolved_conflict or (world_cand.concept or "")
        elif request.entity_type == "scene":
            scene = await self.repo.get_scene(request.entity_id)
            if not scene:
                clean_id = request.entity_id.replace("scene-", "").strip()
                scene = await self.repo.get_scene(clean_id)
            if scene:
                resolved_title = resolved_title or scene.title
                resolved_setting = resolved_setting or scene.location_setting
                resolved_conflict = resolved_conflict or scene.conflict_narrative

        resolved_title = resolved_title or "Speculative World Preview"

        # 4. Resolve visual asset (image)
        resolved_image = request.image_url
        resolved_voice = request.voice_url
        resolved_ambient = request.ambient_url

        # Check existing project assets for missing media URLs
        existing_assets = await self.repo.list_media_assets(project_id=project_id, entity_id=request.entity_id)
        for ea in existing_assets:
            if ea.status == "completed" and ea.asset_url:
                if ea.media_type == "image" and not resolved_image:
                    resolved_image = ea.asset_url
                elif ea.media_type == "voice" and not resolved_voice:
                    resolved_voice = ea.asset_url
                elif ea.media_type == "audio" and not resolved_ambient:
                    resolved_ambient = ea.asset_url

        if not resolved_image:
            raise HTTPException(
                status_code=400,
                detail="No visual concept art found for this entity. Generate an image first before composing a cinematic preview.",
            )

        # Asset safety validation
        for field_name, url_val in (("image_url", resolved_image), ("voice_url", resolved_voice), ("ambient_url", resolved_ambient)):
            if url_val:
                s_val = str(url_val).strip()
                if ".." in s_val or "\x00" in s_val:
                    raise HTTPException(status_code=400, detail=f"Invalid asset path in {field_name}: path traversal rejected.")
                if "169.254.169.254" in s_val or "metadata.google" in s_val:
                    raise HTTPException(status_code=400, detail=f"Blocked metadata address in {field_name}.")

        # 5. Deduplication check
        req_hash = compute_preview_hash(
            project_id=project_id,
            request=CinematicPreviewJobRequest(
                entity_type=request.entity_type,
                entity_id=request.entity_id,
                title=resolved_title,
                location_setting=resolved_setting,
                conflict_narrative=resolved_conflict,
                image_url=resolved_image,
                voice_url=resolved_voice,
                ambient_url=resolved_ambient,
                duration_sec=request.duration_sec,
                aspect_ratio=request.aspect_ratio,
                force_regenerate=request.force_regenerate,
            ),
        )

        if request.force_regenerate:
            from sqlalchemy import text
            await self.repo.session.execute(
                text("UPDATE media_assets SET request_hash = NULL WHERE project_id = :project_id AND request_hash = :request_hash"),
                {"project_id": project_id, "request_hash": req_hash},
            )
            await self.repo.session.commit()
        else:
            existing = await self.repo.find_media_asset_by_hash(project_id, req_hash)
            if existing:
                if existing.status == "completed":
                    logger.info("Deduplication hit: returning existing completed cinematic preview %s", existing.id)
                    return MediaJobResponse(
                        job_id=existing.id,
                        status="completed",
                        media_type="video",
                        entity_type=existing.entity_type,
                        entity_id=existing.entity_id,
                        asset_url=existing.asset_url,
                        error_message=None,
                    )
                elif existing.status in ("queued", "processing"):
                    logger.info("Deduplication hit: attaching to active cinematic preview job %s", existing.id)
                    return MediaJobResponse(
                        job_id=existing.id,
                        status=existing.status,
                        media_type="video",
                        entity_type=existing.entity_type,
                        entity_id=existing.entity_id,
                        asset_url=existing.asset_url,
                        error_message=None,
                    )

        # 6. Create durable records in database
        asset_record = MediaAssetRecord(
            project_id=project_id,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            media_type="video",
            status="queued",
            prompt=f"Cinematic Preview: {resolved_title}",
            aspect_ratio=request.aspect_ratio or "16:9",
            provider_name="Cinematic Preview",
            request_hash=req_hash,
        )

        try:
            created_asset = await self.repo.create_media_asset(asset_record)
            job_record = GenerationJob(
                id=created_asset.id,
                project_id=project_id,
                job_type="media_video",
                status="queued",
                progress=0,
                error_code=None,
                error_message=None,
                result_json=None,
            )
            await self.repo.create_generation_job(job_record)
        except IntegrityError:
            await self.repo.session.rollback()
            existing = await self.repo.find_media_asset_by_hash(project_id, req_hash)
            if existing:
                return MediaJobResponse(
                    job_id=existing.id,
                    status=existing.status,
                    media_type="video",
                    entity_type=existing.entity_type,
                    entity_id=existing.entity_id,
                    asset_url=existing.asset_url,
                    error_message=existing.error_message,
                )
            raise

        # 7. Prepare specification dictionary for the worker
        spec_dict = {
            "project_id": project_id,
            "entity_type": request.entity_type,
            "entity_id": request.entity_id,
            "title": resolved_title,
            "location_setting": resolved_setting or "",
            "conflict_narrative": resolved_conflict or "",
            "image_path": resolved_image,
            "voice_path": resolved_voice,
            "ambient_path": resolved_ambient,
            "duration_sec": request.duration_sec,
            "aspect_ratio": request.aspect_ratio or "16:9",
        }

        # 8. Dispatch asynchronously without blocking FastAPI
        asyncio.create_task(
            self._dispatch_to_worker_background(
                job_id=created_asset.id,
                project_id=project_id,
                spec_dict=spec_dict,
                worker_url=self.worker_url,
            )
        )

        return MediaJobResponse(
            job_id=created_asset.id,
            status="queued",
            media_type="video",
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            asset_url=None,
            error_message=None,
        )

    @staticmethod
    async def _dispatch_to_worker_background(
        job_id: str,
        project_id: str,
        spec_dict: Dict[str, Any],
        worker_url: str,
    ) -> None:
        """Background coroutine to invoke the worker HTTP endpoint and ensure reliable job transition."""
        logger.info("Background dispatching job %s to worker at %s...", job_id, worker_url)
        target_url = (worker_url or "").strip().rstrip("/")

        if not target_url:
            async with async_session() as session:
                repo = ProjectRepository(session)
                err_msg = "Cinematic preview worker unavailable (CINEMATIC_WORKER_URL not configured)."
                await repo.update_media_asset(job_id, {"status": "failed", "error_message": err_msg})
                await repo.update_generation_job(job_id, {"status": "failed", "error_message": err_msg})
            logger.error("Failed job %s: Worker URL not configured.", job_id)
            return

        # Transition to processing
        async with async_session() as session:
            repo = ProjectRepository(session)
            await repo.update_media_asset(job_id, {"status": "processing"})
            await repo.update_generation_job(job_id, {"status": "processing", "started_at": get_utc_now(), "progress": 25})

        auth_token = get_worker_auth_token()
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json",
        }

        database_url = os.getenv("DATABASE_URL")
        storage_provider = os.getenv("STORAGE_PROVIDER", "supabase")

        worker_payload = {
            "job_id": job_id,
            "spec": spec_dict,
            "database_url": database_url,
            "storage_provider": storage_provider,
            "timeout": 120.0,
        }

        try:
            async with httpx.AsyncClient(timeout=125.0) as client:
                resp = await client.post(f"{target_url}/render", json=worker_payload, headers=headers)

                if resp.status_code == 200:
                    resp_data = resp.json()
                    logger.info("Worker successfully completed render for job %s: %s", job_id, resp_data)
                    # Verify job in database is marked completed
                    async with async_session() as session:
                        repo = ProjectRepository(session)
                        asset = await repo.get_media_asset(job_id)
                        if asset and asset.status != "completed":
                            # In case worker did not update directly, update here
                            await repo.update_media_asset(job_id, {"status": "completed", "completed_at": get_utc_now()})
                            await repo.update_generation_job(job_id, {"status": "completed", "progress": 100})
                else:
                    err_text = resp.text
                    logger.error("Worker failed for job %s with HTTP %d: %s", job_id, resp.status_code, err_text)
                    async with async_session() as session:
                        repo = ProjectRepository(session)
                        err_msg = f"Worker HTTP {resp.status_code}: {err_text[:200]}"
                        await repo.update_media_asset(job_id, {"status": "failed", "error_message": err_msg})
                        await repo.update_generation_job(job_id, {"status": "failed", "error_message": err_msg})
        except Exception as exc:
            logger.error("Exception invoking cinematic worker for job %s: %s", job_id, exc, exc_info=True)
            async with async_session() as session:
                repo = ProjectRepository(session)
                err_msg = f"Worker connection error: {str(exc)[:200]}"
                await repo.update_media_asset(job_id, {"status": "failed", "error_message": err_msg})
                await repo.update_generation_job(job_id, {"status": "failed", "error_message": err_msg})
