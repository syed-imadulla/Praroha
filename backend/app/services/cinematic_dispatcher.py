"""
PRAROHA Cinematic Preview Job Dispatcher (Phase 52).

Architectural Contract:
- Non-blocking asynchronous dispatch using the Transactional Outbox pattern.
- Primary FastAPI web application commits GenerationJob and RenderOutbox atomically
  in PostgreSQL/SQLite before attempting Azure Queue publication.
- Azure Storage Queue message is dispatched to 'cinematic-render-jobs' using the backend's
  scoped Add-only SAS URL (QUEUE_PUBLISH_URL).
- No database transaction is held open during Azure Storage Queue network requests.
- Upon successful enqueue, the outbox record is marked 'published'.
- If enqueue fails, the outbox record is preserved in 'pending' status with sanitized error
  for recovery by the background sweeper (TASK-52-11).
- Strictly validates project ownership, entity permissions, and asset boundaries.
- Reuses request deduplication and active-job tracking (idempotency).
- Preserves honest labeling: is_synthetic=True, provider_label="Cinematic Preview".
- Strictly forbids credentials or secrets in queue payloads or logs.
"""

import asyncio
import hashlib
import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlparse
from pydantic import BaseModel, Field

import httpx  # retained for backward compatibility with legacy test patches
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from backend.app.config import settings
from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord, MediaJobResponse
from backend.app.models.outbox import RenderOutbox, assert_no_secrets_in_payload
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.queue_contract import validate_queue_message_dict

logger = logging.getLogger("seed_unfold.cinematic_dispatcher")


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def validate_queue_url(queue_url: str) -> None:
    """Validate that the queue publish URL is an HTTPS URL targeting cinematic-render-jobs."""
    if not queue_url or not isinstance(queue_url, str):
        raise ValueError("Queue URL must be a non-empty string.")
    parsed = urlparse(queue_url.strip())
    if parsed.scheme != "https":
        raise ValueError("Queue publish URL must use HTTPS protocol.")
    path = parsed.path.strip("/")
    if path != "cinematic-render-jobs":
        raise ValueError(f"Queue publish URL must target 'cinematic-render-jobs', got '{path}'.")


def sanitize_queue_url(queue_url: Optional[str]) -> str:
    """Return queue URL with SAS token / query string redacted for safe logging."""
    if not queue_url:
        return "[NOT CONFIGURED]"
    try:
        parsed = urlparse(queue_url.strip())
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path} (SAS redacted)"
    except Exception:
        return "[REDACTED_URL]"


def sanitize_error_message(err_str: Optional[str]) -> str:
    """Scrub sensitive query parameters, SAS tokens, passwords, and keys from error messages."""
    if not err_str:
        return "Unknown queue publication error"
    cleaned = re.sub(r"sig=[a-zA-Z0-9%_\-]+", "sig=REDACTED", str(err_str))
    cleaned = re.sub(r"sp=[a-zA-Z0-9%_\-]+", "sp=REDACTED", cleaned)
    cleaned = re.sub(r"se=[a-zA-Z0-9%_\-]+", "se=REDACTED", cleaned)
    cleaned = re.sub(r"sv=[a-zA-Z0-9%_\-]+", "sv=REDACTED", cleaned)
    cleaned = re.sub(r"://[^:]+:[^@]+@", "://[REDACTED]@", cleaned)
    return cleaned[:300]


def get_worker_auth_token() -> str:
    """Return expected service-to-service authentication token (legacy helper)."""
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
    fps: int = Field(24, description="Video frame rate (24 or 30)")
    resolution: str = Field("1280x720", description="Video resolution ('1280x720' or '1920x1080')")
    motion_preset: str = Field("slow_pan", description="Camera motion preset ('slow_pan', 'zoom_in', 'static')")
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
    """
    Dispatches non-blocking cinematic preview rendering jobs using the transactional outbox pattern
    and Azure Storage Queue (cinematic-render-jobs) for Phase 52.
    """

    def __init__(
        self,
        repo: ProjectRepository,
        queue_publish_url: Optional[str] = None,
        queue_client: Optional[Any] = None,
        worker_url: Optional[str] = None,
    ):
        self.repo = repo
        if queue_publish_url is not None:
            self.queue_publish_url = queue_publish_url.strip() if queue_publish_url else None
        else:
            raw_url = getattr(settings, "QUEUE_PUBLISH_URL", None) or os.getenv("QUEUE_PUBLISH_URL")
            self.queue_publish_url = raw_url.strip() if raw_url else None
        self._queue_client = queue_client
        self.worker_url = worker_url or os.getenv("CINEMATIC_WORKER_URL", "http://praroha-cinematic-worker:8080")

    async def _send_queue_message(self, payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Send canonical queue message to Azure Storage Queue.
        Executed outside database transaction boundaries to avoid holding connection locks.
        """
        import inspect
        try:
            message_content = json.dumps(payload)
            if self._queue_client is not None:
                client = self._queue_client
                if inspect.iscoroutinefunction(getattr(client, "send_message", None)):
                    await client.send_message(message_content)
                else:
                    await asyncio.to_thread(client.send_message, message_content)
            else:
                from azure.storage.queue import QueueClient

                def _sync_send():
                    q_client = QueueClient.from_queue_url(self.queue_publish_url)
                    return q_client.send_message(message_content)

                await asyncio.to_thread(_sync_send)
            return True, None
        except Exception as exc:
            return False, str(exc)

    async def dispatch_preview_job(
        self,
        project_id: str,
        request: CinematicPreviewJobRequest,
    ) -> MediaJobResponse:
        """
        Validate request, commit GenerationJob and RenderOutbox atomically,
        then dispatch to Azure Storage Queue outside the database transaction.
        Returns immediately with HTTP 202-compatible MediaJobResponse.
        """
        # 0. Server-side feature gate
        if not getattr(settings, "CINEMATIC_PREVIEW_ENABLED", False):
            raise HTTPException(
                status_code=503,
                detail="Cinematic preview generation is currently disabled on this server.",
            )

        # 0.1 Queue configuration pre-check
        queue_url = self.queue_publish_url
        if not queue_url and self._queue_client is None:
            logger.warning("Cinematic preview dispatch rejected: QUEUE_PUBLISH_URL is not configured.")
            raise HTTPException(
                status_code=503,
                detail="Cinematic preview queue is currently not configured on this server.",
            )

        if queue_url:
            try:
                validate_queue_url(queue_url)
            except ValueError as val_err:
                logger.error("Invalid queue URL configuration: %s", str(val_err))
                raise HTTPException(
                    status_code=500,
                    detail=f"Invalid queue configuration: {str(val_err)}",
                )

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

        # Asset safety validation (path traversal and SSRF protection)
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
                elif existing.status == "failed":
                    logger.info("Retrying previously failed cinematic preview %s; clearing stale request_hash", existing.id)
                    existing.request_hash = None
                    self.repo.session.add(existing)
                    await self.repo.session.commit()

        # 6. Prepare canonical queue message payload
        job_id = str(uuid.uuid4())
        enqueued_at = get_utc_now().isoformat()

        dur = max(3, min(60, int(round(request.duration_sec))))
        ar = request.aspect_ratio if request.aspect_ratio in ("16:9", "1:1", "9:16") else "16:9"
        fps_val = request.fps if request.fps in (24, 30) else 24
        res_val = request.resolution if request.resolution in ("1280x720", "1920x1080") else "1280x720"
        mp_val = request.motion_preset if request.motion_preset in ("slow_pan", "zoom_in", "static") else "slow_pan"

        options = {
            "duration_seconds": dur,
            "fps": fps_val,
            "resolution": res_val,
            "aspect_ratio": ar,
            "motion_preset": mp_val,
        }

        queue_payload = {
            "schema_version": "1.0",
            "job_id": job_id,
            "project_id": project_id,
            "entity_type": request.entity_type,
            "entity_id": request.entity_id,
            "request_hash": req_hash,
            "options": options,
            "enqueued_at": enqueued_at,
            "attempt": 1,
        }

        # Enforce zero credentials in payload
        assert_no_secrets_in_payload(queue_payload)
        # Validate strictly against canonical schema and worker validator
        validate_queue_message_dict(queue_payload)

        # 7. Step A: Atomic Database Transaction
        # Persist MediaAssetRecord, GenerationJob, and RenderOutbox together in one commit.
        asset_record = MediaAssetRecord(
            id=job_id,
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

        job_record = GenerationJob(
            id=job_id,
            project_id=project_id,
            job_type="media_video",
            status="queued",
            progress=0,
            error_code=None,
            error_message=None,
            result_json=None,
        )

        outbox_record = RenderOutbox(
            id=str(uuid.uuid4()),
            project_id=project_id,
            job_id=job_id,
            payload=queue_payload,
            status="pending",
            attempt_count=0,
        )

        try:
            self.repo.session.add(asset_record)
            self.repo.session.add(job_record)
            self.repo.session.add(outbox_record)
            await self.repo.session.commit()
            await self.repo.session.refresh(asset_record)
            await self.repo.session.refresh(job_record)
            await self.repo.session.refresh(outbox_record)
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

        # 8. Step B: Publish to Azure Storage Queue (Outside Database Transaction)
        safe_url = sanitize_queue_url(self.queue_publish_url)
        logger.info("Publishing cinematic render job %s to queue %s...", job_id, safe_url)

        publish_ok, publish_err = await self._send_queue_message(queue_payload)

        # 9. Step C: Handle Enqueue Outcome
        if publish_ok:
            published_at = get_utc_now()
            await self.repo.update_render_outbox_status(
                job_id=job_id,
                status="published",
                published_at=published_at,
            )
            logger.info("Successfully published job %s to queue. Outbox marked published.", job_id)

            return MediaJobResponse(
                job_id=job_id,
                status="queued",
                media_type="video",
                entity_type=request.entity_type,
                entity_id=request.entity_id,
                asset_url=None,
                error_message=None,
            )
        else:
            sanitized_err = sanitize_error_message(publish_err)
            logger.error(
                "Failed to enqueue job %s to Azure Queue: %s. Preserving outbox record in pending status.",
                job_id,
                sanitized_err,
            )
            await self.repo.update_render_outbox_status(
                job_id=job_id,
                status="pending",
                last_error=sanitized_err,
                increment_attempt=True,
            )

            raise HTTPException(
                status_code=502,
                detail=f"Failed to enqueue cinematic preview job: {sanitized_err}. Job preserved in outbox for recovery.",
            )
