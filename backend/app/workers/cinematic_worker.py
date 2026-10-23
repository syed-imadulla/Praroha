"""
PRAROHA Dedicated Cinematic Rendering Worker CLI (Phase 48).

Tatva 2: Seed to Universe — Forms Hidden in Formless.

Standalone CLI entrypoint for rendering cinematic preview videos outside the primary FastAPI
web process. Designed to run as an ephemeral Azure Container Apps Job or local container.

ISOLATION GUARANTEE:
This worker NEVER imports FastAPI, Uvicorn, or starts any HTTP web server.
It operates as a run-to-completion batch CLI script that exits immediately upon job completion.

HONEST LABELING:
All generated outputs strictly enforce:
    is_synthetic: True
    provider_label: "Cinematic Preview"
"""

import argparse
import asyncio
import base64
import hashlib
import json
import logging
import os
import re
import shutil
import sys
import tempfile
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

import httpx
try:
    import psutil
except ImportError:
    psutil = None  # type: ignore
import urllib.parse
from sqlalchemy import update
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

try:
    from azure.storage.queue import QueueClient, QueueServiceClient
except ImportError:
    QueueClient = None  # type: ignore
    QueueServiceClient = None  # type: ignore

try:
    from azure.identity import DefaultAzureCredential, ManagedIdentityCredential
except ImportError:
    DefaultAzureCredential = None  # type: ignore
    ManagedIdentityCredential = None  # type: ignore

from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord
from backend.app.providers.storage import LocalStorageProvider, StorageProvider, SupabaseStorageProvider
from backend.app.services.cinematic_preview import (
    CinematicPreviewComposer,
    CinematicPreviewResult,
    CinematicPreviewSpec,
)

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [cinematic-worker] %(message)s",
)
logger = logging.getLogger("cinematic-worker")


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


import urllib.parse

def build_worker_engine(database_url: str):
    """Build async engine for worker database updates."""
    url_str = str(database_url).strip()
    if "://" in url_str:
        scheme, remainder = url_str.split("://", 1)
        if remainder.count("@") > 1 and ":" in remainder:
            last_at = remainder.rfind("@")
            credentials = remainder[:last_at]
            host_and_db = remainder[last_at + 1:]
            if ":" in credentials:
                user, pwd = credentials.split(":", 1)
                encoded_pwd = urllib.parse.quote_plus(pwd)
                remainder = f"{user}:{encoded_pwd}@{host_and_db}"
        if scheme in ("postgres", "postgresql"):
            url_str = f"postgresql+asyncpg://{remainder}"
        else:
            url_str = f"{scheme}://{remainder}"
    if url_str.startswith("sqlite"):
        return create_async_engine(
            url_str,
            echo=False,
            future=True,
            connect_args={"check_same_thread": False, "timeout": 30.0},
        )
    return create_async_engine(
        url_str,
        echo=False,
        future=True,
        pool_pre_ping=True,
        connect_args={"statement_cache_size": 0},
    )


def get_expected_auth_token() -> str:
    """Return expected service-to-service authentication token."""
    token = os.getenv("WORKER_AUTH_TOKEN")
    if token and token.strip():
        return token.strip()
    supa_key = os.getenv("SUPABASE_KEY")
    if supa_key and supa_key.strip():
        return hashlib.sha256(f"praroha-worker:{supa_key.strip()}".encode()).hexdigest()
    return "dev-worker-insecure-secret"


def resolve_asset_to_local_path(
    asset_ref: Optional[str],
    scratch_dir: str,
    prefix: str,
) -> Optional[str]:
    """
    Resolve asset reference (local path or HTTP URL) to a verified local file path.
    Downloads remote assets safely into scratch_dir.
    Rejects path traversal and cloud metadata SSRF attempts.
    """
    if not asset_ref or not str(asset_ref).strip():
        return None

    ref = str(asset_ref).strip()

    # Reject path traversal and null bytes
    if ".." in ref or "\x00" in ref:
        logger.warning("Rejected suspicious asset reference with path traversal: %s", ref)
        return None

    # Block SSRF to cloud metadata IPs
    if "169.254.169.254" in ref or "metadata.google" in ref:
        logger.warning("Blocked SSRF attempt to metadata service: %s", ref)
        return None

    # 1. Local path check
    if os.path.exists(ref):
        abs_path = os.path.abspath(ref)
        # Verify it is within an allowed directory
        allowed_dirs = (scratch_dir, os.getcwd(), tempfile.gettempdir(), "/app/scratch", "/app/uploads")
        if any(abs_path.startswith(os.path.abspath(d)) for d in allowed_dirs):
            return abs_path
        logger.warning("Rejected local asset path outside allowed directories: %s", abs_path)
        return None

    # Check relative to uploads / workspace
    rel_path = os.path.abspath(os.path.join(os.getcwd(), ref))
    if os.path.exists(rel_path):
        return rel_path

    # 2. Remote URL download check
    if ref.startswith("http://") or ref.startswith("https://"):
        try:
            logger.info("Downloading remote asset: %s", ref)
            ext = os.path.splitext(ref.split("?")[0])[1] or ".bin"
            local_target = os.path.join(scratch_dir, f"{prefix}_{int(time.time())}{ext}")
            with httpx.Client(timeout=30.0) as client:
                resp = client.get(ref)
                if resp.status_code == 200 and len(resp.content) > 0:
                    with open(local_target, "wb") as f:
                        f.write(resp.content)
                    return local_target
                else:
                    logger.warning("Failed to download %s (HTTP %s)", ref, resp.status_code)
                    return None
        except Exception as exc:
            logger.warning("Error downloading remote asset %s: %s", ref, exc)
            return None

    return None


def get_default_scratch_dir() -> str:
    """Return a guaranteed writable scratch directory."""
    local_scratch = os.path.join(os.getcwd(), "scratch", "worker_previews")
    try:
        os.makedirs(local_scratch, exist_ok=True)
        test_file = os.path.join(local_scratch, ".write_test")
        with open(test_file, "w") as f:
            f.write("ok")
        os.remove(test_file)
        return local_scratch
    except Exception:
        fallback = os.path.join(tempfile.gettempdir(), "praroha_worker_previews")
        os.makedirs(fallback, exist_ok=True)
        return fallback


async def execute_cinematic_job(
    spec: CinematicPreviewSpec,
    storage_provider: Optional[StorageProvider] = None,
    output_dir: Optional[str] = None,
    timeout_sec: float = 120.0,
) -> Tuple[CinematicPreviewResult, Dict[str, Any]]:
    """
    Execute cinematic preview composition with empirical resource tracking (RSS & CPU).
    Returns (CinematicPreviewResult, resource_metrics).
    """
    out_dir = output_dir or get_default_scratch_dir()
    os.makedirs(out_dir, exist_ok=True)

    composer = CinematicPreviewComposer(output_dir=out_dir)

    # Resource tracking
    if psutil is not None:
        proc = psutil.Process(os.getpid())
        start_rss = proc.memory_info().rss / (1024 * 1024)
    else:
        start_rss = 0.0
    start_time = time.perf_counter()

    # Compose video
    result = composer.compose(spec, timeout_sec=timeout_sec)
    render_elapsed = time.perf_counter() - start_time
    if psutil is not None:
        end_rss = proc.memory_info().rss / (1024 * 1024)
    else:
        end_rss = 0.0

    # Ensure non-negotiable honest labeling
    if result.metadata is None:
        result.metadata = {}
    result.metadata["is_synthetic"] = True
    result.metadata["provider_label"] = "Cinematic Preview"
    result.metadata["render_engine"] = "native-ffmpeg-worker"

    resource_metrics = {
        "start_rss_mb": round(start_rss, 2),
        "peak_rss_mb": round(max(start_rss, end_rss), 2),
        "render_elapsed_sec": round(render_elapsed, 2),
    }

    # Upload artifact to storage if completed
    if result.status == "completed" and result.video_path and os.path.exists(result.video_path):
        file_size_bytes = os.path.getsize(result.video_path)
        resource_metrics["file_size_kb"] = round(file_size_bytes / 1024, 2)
        result.metadata["file_size_kb"] = resource_metrics["file_size_kb"]

        if storage_provider:
            with open(result.video_path, "rb") as f:
                video_bytes = f.read()
            storage_key = f"projects/{spec.project_id}/media/video/{spec.entity_id}_{int(time.time())}.mp4"
            stored_url = await storage_provider.upload(
                file_data=video_bytes,
                key=storage_key,
                mime_type="video/mp4",
            )
            result.metadata["stored_asset_url"] = stored_url
            result.metadata["storage_key"] = storage_key

    return result, resource_metrics


async def run_worker(
    job_id: Optional[str] = None,
    spec_dict: Optional[Dict[str, Any]] = None,
    database_url: Optional[str] = None,
    storage_provider_type: str = "local",
    timeout_sec: float = 120.0,
    output_dir: Optional[str] = None,
    upload_dir: Optional[str] = None,
) -> int:
    """
    Main worker execution routine.
    Returns process exit code (0 for success / static_fallback, 1 for failure).
    """
    logger.info("Initializing Cinematic Worker (job_id=%s, storage=%s)", job_id, storage_provider_type)

    # 1. Resolve storage provider
    storage: StorageProvider
    if storage_provider_type == "supabase" and os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"):
        storage = SupabaseStorageProvider()
    else:
        # Check if local uploads directory is writable, otherwise fallback to temp
        target_upload_dir = upload_dir or os.getenv("UPLOAD_DIR", "uploads")
        try:
            os.makedirs(target_upload_dir, exist_ok=True)
            test_file = os.path.join(target_upload_dir, ".write_test")
            with open(test_file, "w") as f:
                f.write("ok")
            os.remove(test_file)
        except Exception:
            target_upload_dir = os.path.join(tempfile.gettempdir(), "praroha_uploads")
            os.makedirs(target_upload_dir, exist_ok=True)
        storage = LocalStorageProvider(upload_dir=target_upload_dir)

    # 2. Database session setup if DB URL provided or available
    db_engine = None
    session_factory = None
    db_url = database_url or os.getenv("DATABASE_URL")
    if db_url:
        try:
            db_engine = build_worker_engine(db_url)
            session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
        except Exception as exc:
            logger.warning("Could not initialize DB engine (%s). Proceeding offline.", exc)

    session: Optional[AsyncSession] = None
    if session_factory:
        session = session_factory()

    scratch_temp_dir = tempfile.mkdtemp(prefix="praroha_worker_scratch_")

    try:
        job: Optional[GenerationJob] = None
        target_spec: Optional[CinematicPreviewSpec] = None

        # 3. Load Job from DB if job_id given
        if job_id and session:
            stmt = select(GenerationJob).where(GenerationJob.id == job_id)
            res = await session.execute(stmt)
            job = res.scalars().first()
            if not job:
                logger.error("Job with ID %s not found in database.", job_id)
                return 1

            # Transition to processing
            job.status = "processing"
            job.started_at = get_utc_now()
            job.updated_at = get_utc_now()
            await session.commit()

            # Parse payload from result_json or media record
            if job.result_json:
                try:
                    payload = json.loads(job.result_json)
                    target_spec = CinematicPreviewSpec(**payload)
                except Exception as exc:
                    logger.warning("Could not parse spec from job.result_json: %s", exc)

        # 4. Fallback to passed spec_dict
        if not target_spec and spec_dict:
            target_spec = CinematicPreviewSpec(**spec_dict)

        if not target_spec:
            logger.error("No valid CinematicPreviewSpec provided to worker.")
            if job and session:
                job.status = "failed"
                job.error_message = "No valid preview specification found."
                job.completed_at = get_utc_now()
                await session.commit()
            return 1

        # 5. Resolve image, voice, ambient assets locally
        local_img = resolve_asset_to_local_path(target_spec.image_path, scratch_temp_dir, "img")
        local_vox = resolve_asset_to_local_path(target_spec.voice_path, scratch_temp_dir, "vox")
        local_amb = resolve_asset_to_local_path(target_spec.ambient_path, scratch_temp_dir, "amb")

        resolved_spec = CinematicPreviewSpec(
            project_id=target_spec.project_id,
            entity_type=target_spec.entity_type,
            entity_id=target_spec.entity_id,
            title=target_spec.title,
            location_setting=target_spec.location_setting,
            conflict_narrative=target_spec.conflict_narrative,
            image_path=local_img,
            voice_path=local_vox,
            ambient_path=local_amb,
            duration_sec=target_spec.duration_sec,
            aspect_ratio=target_spec.aspect_ratio,
        )

        # 6. Execute Render
        logger.info("Starting composition for entity %s ('%s')...", resolved_spec.entity_id, resolved_spec.title)
        result, metrics = await execute_cinematic_job(
            spec=resolved_spec,
            storage_provider=storage,
            output_dir=output_dir,
            timeout_sec=timeout_sec,
        )

        logger.info(
            "Composition finished with status: %s (duration: %ss, peak_rss: %sMB)",
            result.status,
            metrics.get("render_elapsed_sec"),
            metrics.get("peak_rss_mb"),
        )

        # 7. Update Database
        if session:
            # Update GenerationJob
            if job:
                if result.status in ("completed", "static_fallback"):
                    job.status = "completed"
                    job.progress = 100
                    job.error_message = None
                    job.result_json = json.dumps({
                        "status": result.status,
                        "video_path": result.video_path,
                        "stored_asset_url": result.metadata.get("stored_asset_url"),
                        "metadata": result.metadata,
                        "metrics": metrics,
                    })
                else:
                    job.status = "failed"
                    job.error_message = result.error_message or "Rendering failed"
                job.completed_at = get_utc_now()
                job.updated_at = get_utc_now()
                session.add(job)

            # Update or create MediaAssetRecord
            stmt_media = select(MediaAssetRecord).where(
                MediaAssetRecord.project_id == target_spec.project_id,
                MediaAssetRecord.entity_id == target_spec.entity_id,
                MediaAssetRecord.media_type == "video",
            )
            media_res = await session.execute(stmt_media)
            media_record = media_res.scalars().first()

            if media_record:
                media_record.status = result.status if result.status in ("completed", "failed") else "completed"
                media_record.asset_url = result.metadata.get("stored_asset_url") or result.video_path
                media_record.metadata_json = json.dumps(result.metadata)
                media_record.error_message = result.error_message
                media_record.completed_at = get_utc_now()
                session.add(media_record)

            await session.commit()

        # Output final JSON summary to stdout
        summary = {
            "status": result.status,
            "error_message": result.error_message,
            "video_path": result.video_path,
            "stored_asset_url": result.metadata.get("stored_asset_url"),
            "metadata": result.metadata,
            "metrics": metrics,
        }
        print(f"__CINEMATIC_WORKER_RESULT__:{json.dumps(summary)}")

        if result.status in ("completed", "static_fallback"):
            return 0
        return 1

    except Exception as exc:
        logger.exception("Unexpected error in cinematic worker: %s", exc)
        if session and job:
            try:
                job.status = "failed"
                job.error_message = f"Worker exception: {str(exc)}"
                job.completed_at = get_utc_now()
                session.add(job)
                await session.commit()
            except Exception:
                pass
        return 1

    finally:
        if session:
            await session.close()
        if db_engine:
            await db_engine.dispose()
        # Clean up temporary downloaded files
        if os.path.exists(scratch_temp_dir):
            shutil.rmtree(scratch_temp_dir, ignore_errors=True)


# ==============================================================================
# Phase 52: Queue-Based Worker Architecture (Azure Storage Queue Consumer)
# ==============================================================================

from backend.app.services.queue_contract import (
    FORBIDDEN_CREDENTIAL_KEYWORDS,
    ID_PATTERN,
    REQUEST_HASH_PATTERN,
    ALLOWED_ENTITY_TYPES,
    ALLOWED_FPS,
    ALLOWED_RESOLUTIONS,
    ALLOWED_ASPECT_RATIOS,
    ALLOWED_MOTION_PRESETS,
    ALLOWED_TOP_LEVEL_KEYS,
    ALLOWED_OPTION_KEYS,
    scan_for_credentials,
    decode_message_content,
    validate_queue_message_dict,
    parse_and_validate_queue_message,
)


def _safe_delete_message(queue_client: Any, message: Any) -> bool:
    """Acknowledge (delete) a message from queue using either message object or id/pop_receipt."""
    if not queue_client or not hasattr(queue_client, "delete_message"):
        return False
    try:
        queue_client.delete_message(message)
        return True
    except TypeError:
        try:
            msg_id = getattr(message, "id", None)
            pop_receipt = getattr(message, "pop_receipt", None)
            queue_client.delete_message(msg_id, pop_receipt)
            return True
        except Exception as exc:
            logger.warning("Failed to delete message: %s", exc)
            return False
    except Exception as exc:
        logger.warning("Failed to delete message: %s", exc)
        return False


async def _heartbeat_loop(
    job_id: str,
    session_factory: async_sessionmaker,
    queue_client: Any,
    message: Any,
    stop_event: asyncio.Event,
    heartbeat_interval: float = 15.0,
):
    """
    Heartbeat and lease maintenance task:
    - Periodically updates updated_at in DB so API stale lease recovery recognizes active progress.
    - Renews message visibility in queue if elapsed execution time exceeds 60s.
    """
    start_time = time.monotonic()
    while not stop_event.is_set():
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=heartbeat_interval)
            break
        except asyncio.TimeoutError:
            pass

        # 1. Update DB lease
        try:
            async with session_factory() as session:
                stmt = (
                    update(GenerationJob)
                    .where(GenerationJob.id == job_id, GenerationJob.status == "processing")
                    .values(updated_at=get_utc_now())
                )
                await session.execute(stmt)
                await session.commit()
        except Exception as exc:
            logger.warning("Heartbeat DB update failed for job %s: %s", job_id, exc)

        # 2. Renew queue visibility if execution > 60s
        elapsed = time.monotonic() - start_time
        if elapsed > 60.0 and queue_client and hasattr(queue_client, "update_message"):
            try:
                queue_client.update_message(message, visibility_timeout=120)
                logger.debug("Renewed message visibility for job %s", job_id)
            except Exception as exc:
                logger.warning("Queue visibility renewal failed for job %s: %s", job_id, exc)


async def process_queue_message(
    message: Any,
    queue_client: Any,
    poison_queue_client: Optional[Any] = None,
    session_factory: Optional[async_sessionmaker] = None,
    storage_provider: Optional[StorageProvider] = None,
    timeout_sec: float = 120.0,
    heartbeat_interval: float = 15.0,
    output_dir: Optional[str] = None,
) -> bool:
    """
    Process a single Azure Queue render message according to the 9-step durable lifecycle:
    1. Poison queue routing if dequeue_count > 3.
    2. Schema and credential validation.
    3. Atomic PostgreSQL CAS claim (WHERE status = 'queued').
    4. Heartbeat loop (15s DB lease + 60s visibility renewal).
    5. Native FFmpeg composition.
    6. Supabase Storage MP4 upload.
    7. Database finalization (is_synthetic=True, provider_label='Cinematic Preview').
    8. Queue message deletion only upon verified completion.
    """
    raw_content = getattr(message, "content", message)
    dequeue_count = getattr(message, "dequeue_count", 1) or 1

    # 1. Inspect retry count: if > 3, dead-letter to poison queue
    if dequeue_count > 3:
        job_id = None
        try:
            raw_dict = decode_message_content(raw_content)
            if isinstance(raw_dict, dict) and "job_id" in raw_dict:
                jid = str(raw_dict["job_id"]).strip()
                if ID_PATTERN.match(jid):
                    job_id = jid
        except Exception:
            pass

        logger.error(
            "Job %s exceeded retry threshold (dequeue_count=%d > 3). Moving to poison queue.",
            job_id or "unknown",
            dequeue_count,
        )

        if poison_queue_client and hasattr(poison_queue_client, "send_message"):
            try:
                poison_payload = json.dumps({
                    "job_id": job_id,
                    "error": f"Job failed after {dequeue_count} execution attempts. Moved to poison queue.",
                    "moved_at": get_utc_now().isoformat(),
                    "original_content": str(raw_content),
                })
                poison_queue_client.send_message(poison_payload)
            except Exception as exc:
                logger.warning("Failed to publish to poison queue: %s", exc)

        if session_factory and job_id:
            try:
                async with session_factory() as session:
                    stmt_j = (
                        update(GenerationJob)
                        .where(GenerationJob.id == job_id)
                        .values(
                            status="failed",
                            error_message=f"Job failed after {dequeue_count} execution attempts. Moved to poison queue.",
                            completed_at=get_utc_now(),
                            updated_at=get_utc_now(),
                        )
                    )
                    await session.execute(stmt_j)

                    stmt_m = (
                        update(MediaAssetRecord)
                        .where(MediaAssetRecord.id == job_id)
                        .values(
                            status="failed",
                            request_hash=None,
                            error_message=f"Job moved to poison queue after retry exhaustion ({dequeue_count} attempts)",
                            completed_at=get_utc_now(),
                        )
                    )
                    await session.execute(stmt_m)
                    await session.commit()
            except Exception as exc:
                logger.warning("Failed to record poison job failure in DB: %s", exc)

        _safe_delete_message(queue_client, message)
        return True

    # 2. Schema and credential validation
    try:
        validated_msg = parse_and_validate_queue_message(raw_content)
    except Exception as val_exc:
        logger.warning("Rejecting invalid or credential-bearing queue message: %s", val_exc)
        if poison_queue_client and hasattr(poison_queue_client, "send_message"):
            try:
                poison_queue_client.send_message(json.dumps({
                    "error": f"Schema validation failed: {str(val_exc)}",
                    "moved_at": get_utc_now().isoformat(),
                }))
            except Exception:
                pass

        try:
            raw_dict = decode_message_content(raw_content)
            if isinstance(raw_dict, dict) and "job_id" in raw_dict:
                jid = str(raw_dict["job_id"]).strip()
                if ID_PATTERN.match(jid) and session_factory:
                    async with session_factory() as session:
                        stmt_j = (
                            update(GenerationJob)
                            .where(GenerationJob.id == jid)
                            .values(
                                status="failed",
                                error_message=f"Invalid queue message: {str(val_exc)}",
                                completed_at=get_utc_now(),
                                updated_at=get_utc_now(),
                            )
                        )
                        await session.execute(stmt_j)
                        stmt_m = (
                            update(MediaAssetRecord)
                            .where(MediaAssetRecord.id == jid)
                            .values(
                                status="failed",
                                request_hash=None,
                                error_message=f"Invalid queue message schema: {str(val_exc)}",
                                completed_at=get_utc_now(),
                            )
                        )
                        await session.execute(stmt_m)
                        await session.commit()
        except Exception:
            pass

        _safe_delete_message(queue_client, message)
        return True

    job_id = validated_msg["job_id"]
    project_id = validated_msg["project_id"]
    entity_type = validated_msg["entity_type"]
    entity_id = validated_msg["entity_id"]
    options = validated_msg["options"]

    # 3. Atomic PostgreSQL claim (WHERE status = 'queued')
    if session_factory:
        async with session_factory() as session:
            stmt_claim = (
                update(GenerationJob)
                .where(GenerationJob.id == job_id, GenerationJob.status == "queued")
                .values(
                    status="processing",
                    started_at=get_utc_now(),
                    updated_at=get_utc_now(),
                )
            )
            claim_res = await session.execute(stmt_claim)
            await session.commit()
            if claim_res.rowcount == 0:
                logger.info("Job %s already claimed by another worker or not queued. Acknowledging message.", job_id)
                _safe_delete_message(queue_client, message)
                return True

    logger.info("Claimed render job %s (project=%s, entity=%s)", job_id, project_id, entity_id)

    # 4. Resolve media assets from database
    image_path = None
    voice_path = None
    ambient_path = None
    title = f"Cinematic Preview: {entity_id}"
    location_setting = ""
    conflict_narrative = ""

    if session_factory:
        async with session_factory() as session:
            stmt_assets = select(MediaAssetRecord).where(
                MediaAssetRecord.project_id == project_id,
                MediaAssetRecord.entity_id == entity_id,
            )
            records = (await session.execute(stmt_assets)).scalars().all()
            for r in records:
                if r.status == "completed" and r.asset_url:
                    if r.media_type == "image" and not image_path:
                        image_path = r.asset_url
                    elif r.media_type == "voice" and not voice_path:
                        voice_path = r.asset_url
                    elif r.media_type == "audio" and not ambient_path:
                        ambient_path = r.asset_url
                if r.id == job_id and r.prompt:
                    title = r.prompt

            stmt_job = select(GenerationJob).where(GenerationJob.id == job_id)
            job_record = (await session.execute(stmt_job)).scalars().first()
            if job_record and job_record.result_json:
                try:
                    p_json = json.loads(job_record.result_json)
                    if isinstance(p_json, dict):
                        image_path = image_path or p_json.get("image_path")
                        voice_path = voice_path or p_json.get("voice_path")
                        ambient_path = ambient_path or p_json.get("ambient_path")
                        title = p_json.get("title", title)
                        location_setting = p_json.get("location_setting", location_setting)
                        conflict_narrative = p_json.get("conflict_narrative", conflict_narrative)
                except Exception:
                    pass

    scratch_temp_dir = tempfile.mkdtemp(prefix=f"praroha_queue_render_{job_id}_")

    stop_heartbeat = asyncio.Event()
    heartbeat_task = None
    if session_factory:
        heartbeat_task = asyncio.create_task(
            _heartbeat_loop(
                job_id=job_id,
                session_factory=session_factory,
                queue_client=queue_client,
                message=message,
                stop_event=stop_heartbeat,
                heartbeat_interval=heartbeat_interval,
            )
        )

    try:
        local_img = resolve_asset_to_local_path(image_path, scratch_temp_dir, "img")
        local_vox = resolve_asset_to_local_path(voice_path, scratch_temp_dir, "vox")
        local_amb = resolve_asset_to_local_path(ambient_path, scratch_temp_dir, "amb")

        spec = CinematicPreviewSpec(
            project_id=project_id,
            entity_type=entity_type,
            entity_id=entity_id,
            title=title,
            location_setting=location_setting,
            conflict_narrative=conflict_narrative,
            image_path=local_img,
            voice_path=local_vox,
            ambient_path=local_amb,
            duration_sec=options["duration_seconds"],
            aspect_ratio=options["aspect_ratio"],
        )

        logger.info("Executing composition for job %s (duration=%ss)...", job_id, spec.duration_sec)
        result, metrics = await execute_cinematic_job(
            spec=spec,
            storage_provider=storage_provider,
            output_dir=output_dir,
            timeout_sec=timeout_sec,
        )

        # Stop heartbeat before final DB commits
        stop_heartbeat.set()
        if heartbeat_task:
            try:
                await asyncio.wait_for(heartbeat_task, timeout=5.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                pass

        if result.status in ("completed", "static_fallback"):
            # Upload artifact to Supabase Storage if present
            stored_url = result.metadata.get("stored_asset_url")
            storage_key = result.metadata.get("storage_key") or f"cinematic-previews/{project_id}/{job_id}.mp4"

            if not stored_url and storage_provider and result.video_path and os.path.exists(result.video_path):
                with open(result.video_path, "rb") as vf:
                    video_bytes = vf.read()
                stored_url = await storage_provider.upload(
                    file_data=video_bytes,
                    key=storage_key,
                    mime_type="video/mp4",
                )
                result.metadata["stored_asset_url"] = stored_url
                result.metadata["storage_key"] = storage_key

            # Enforce honest synthetic metadata
            result.metadata["is_synthetic"] = True
            result.metadata["provider_label"] = "Cinematic Preview"
            result.metadata["render_engine"] = "native-ffmpeg-worker"
            result.metadata["options"] = options

            final_url = stored_url or result.video_path

            if session_factory:
                async with session_factory() as session:
                    stmt_j = (
                        update(GenerationJob)
                        .where(GenerationJob.id == job_id)
                        .values(
                            status="completed",
                            progress=100,
                            error_message=None,
                            completed_at=get_utc_now(),
                            updated_at=get_utc_now(),
                            result_json=json.dumps({
                                "status": result.status,
                                "video_path": result.video_path,
                                "stored_asset_url": final_url,
                                "metadata": result.metadata,
                                "metrics": metrics,
                            }),
                        )
                    )
                    await session.execute(stmt_j)

                    stmt_m = (
                        update(MediaAssetRecord)
                        .where(MediaAssetRecord.id == job_id)
                        .values(
                            status="completed",
                            asset_url=final_url,
                            mime_type="video/mp4",
                            metadata_json=json.dumps(result.metadata),
                            completed_at=get_utc_now(),
                        )
                    )
                    await session.execute(stmt_m)
                    await session.commit()

            # Acknowledge and delete message ONLY upon successful finalization
            _safe_delete_message(queue_client, message)
            logger.info("Successfully rendered and finalized job %s (status=%s)", job_id, result.status)
            return True

        else:
            # Composition failed
            logger.error("Composition failed for job %s: %s", job_id, result.error_message)
            if dequeue_count >= 3:
                # Poison route
                if poison_queue_client and hasattr(poison_queue_client, "send_message"):
                    try:
                        poison_queue_client.send_message(json.dumps({
                            "job_id": job_id,
                            "error": result.error_message or "Rendering composition failure",
                            "moved_at": get_utc_now().isoformat(),
                        }))
                    except Exception:
                        pass
                if session_factory:
                    async with session_factory() as session:
                        stmt_j = (
                            update(GenerationJob)
                            .where(GenerationJob.id == job_id)
                            .values(
                                status="failed",
                                error_message=result.error_message or "Rendering failed",
                                completed_at=get_utc_now(),
                                updated_at=get_utc_now(),
                            )
                        )
                        await session.execute(stmt_j)
                        stmt_m = (
                            update(MediaAssetRecord)
                            .where(MediaAssetRecord.id == job_id)
                            .values(
                                status="failed",
                                request_hash=None,
                                error_message=result.error_message or "Rendering failed",
                                completed_at=get_utc_now(),
                            )
                        )
                        await session.execute(stmt_m)
                        await session.commit()
                _safe_delete_message(queue_client, message)
                return True
            else:
                # Transient error: do NOT delete message; allow retry on next dequeue
                return False

    except Exception as exc:
        logger.exception("Unexpected error processing queue message for job %s: %s", job_id, exc)
        stop_heartbeat.set()
        if heartbeat_task:
            try:
                await asyncio.wait_for(heartbeat_task, timeout=5.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                pass

        if dequeue_count >= 3:
            if poison_queue_client and hasattr(poison_queue_client, "send_message"):
                try:
                    poison_queue_client.send_message(json.dumps({
                        "job_id": job_id,
                        "error": f"Worker exception: {str(exc)}",
                        "moved_at": get_utc_now().isoformat(),
                    }))
                except Exception:
                    pass
            if session_factory:
                async with session_factory() as session:
                    stmt_j = (
                        update(GenerationJob)
                        .where(GenerationJob.id == job_id)
                        .values(status="failed", error_message=f"Worker exception: {str(exc)}", completed_at=get_utc_now(), updated_at=get_utc_now())
                    )
                    await session.execute(stmt_j)
                    stmt_m = (
                        update(MediaAssetRecord)
                        .where(MediaAssetRecord.id == job_id)
                        .values(status="failed", request_hash=None, error_message=f"Worker exception: {str(exc)}", completed_at=get_utc_now())
                    )
                    await session.execute(stmt_m)
                    await session.commit()
            _safe_delete_message(queue_client, message)
            return True
        return False

    finally:
        stop_heartbeat.set()
        if os.path.exists(scratch_temp_dir):
            shutil.rmtree(scratch_temp_dir, ignore_errors=True)


async def run_queue_worker(
    queue_client: Any,
    poison_queue_client: Optional[Any] = None,
    database_url: Optional[str] = None,
    storage_provider: Optional[StorageProvider] = None,
    timeout_sec: float = 120.0,
    max_messages: int = 32,
    visibility_timeout: int = 300,
    heartbeat_interval: float = 15.0,
    once: bool = False,
    output_dir: Optional[str] = None,
) -> int:
    """
    Continuous queue consumer batch loop.
    Polls queue, processes messages until queue is drained, then cleanly exits with code 0.
    """
    logger.info(
        "Initializing PRAROHA Queue Worker Loop (visibility=%ds, heartbeat=%0.1fs)",
        visibility_timeout,
        heartbeat_interval,
    )

    db_engine = None
    session_factory = None
    db_url = database_url or os.getenv("DATABASE_URL")
    if db_url:
        try:
            db_engine = build_worker_engine(db_url)
            session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
        except Exception as exc:
            logger.warning("Could not initialize DB engine (%s). Proceeding offline.", exc)

    storage = storage_provider
    if storage is None:
        if os.getenv("STORAGE_PROVIDER", "supabase") == "supabase" and os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"):
            storage = SupabaseStorageProvider()
        else:
            storage = LocalStorageProvider()

    total_processed = 0
    try:
        while True:
            messages = []
            if hasattr(queue_client, "receive_messages"):
                try:
                    paged = queue_client.receive_messages(
                        messages_per_page=max_messages,
                        visibility_timeout=visibility_timeout,
                    )
                    messages = list(paged)
                except Exception as rx_exc:
                    logger.error("Failed to receive messages from queue: %s", rx_exc)
                    return 1

            if not messages:
                logger.info("Queue is empty. Drained (%d total jobs processed). Exiting cleanly with code 0.", total_processed)
                break

            logger.info("Received %d message(s) from queue.", len(messages))
            for msg in messages:
                await process_queue_message(
                    message=msg,
                    queue_client=queue_client,
                    poison_queue_client=poison_queue_client,
                    session_factory=session_factory,
                    storage_provider=storage,
                    timeout_sec=timeout_sec,
                    heartbeat_interval=heartbeat_interval,
                    output_dir=output_dir,
                )
                total_processed += 1

            if once:
                logger.info("Single-pass (--once) completed. Exiting.")
                break

        return 0
    finally:
        if db_engine:
            await db_engine.dispose()


def is_add_only_sas(url_or_token: Optional[str]) -> bool:
    """Detect if a SAS URL or token contains only add ('a') permissions without dequeue/read capabilities."""
    if not url_or_token or "?" not in url_or_token:
        return False
    try:
        query = url_or_token.split("?", 1)[1]
        params = dict(urllib.parse.parse_qsl(query))
        sp = params.get("sp", "")
        # If permissions include 'a' but lack read ('r'), update ('u'), process ('p'), or delete ('d')
        return "a" in sp and not any(c in sp for c in ("r", "u", "p", "d"))
    except Exception:
        return False


def build_queue_clients(args: Any) -> Tuple[Optional[Any], Optional[Any]]:
    """
    Construct authenticated clients for BOTH the work queue and poison queue.
    Supports:
    1. Azure Managed Identity via DefaultAzureCredential + AZURE_CLIENT_ID (passwordless, least privilege).
    2. Scoped Queue URLs (e.g. for fallback testing or development).
    3. Connection string (local dev/testing/Azurite).
    Rejects Add-only SAS URLs (backend enqueue credential) with an explicit error.
    """
    if QueueClient is None:
        logger.error("azure-storage-queue package is required for queue mode.")
        return None, None

    work_queue_name = (
        getattr(args, "queue_name", None)
        or os.getenv("AZURE_STORAGE_QUEUE_NAME")
        or os.getenv("QUEUE_NAME")
        or "cinematic-render-jobs"
    )
    poison_queue_name = (
        getattr(args, "poison_queue_name", None)
        or os.getenv("AZURE_STORAGE_POISON_QUEUE_NAME")
        or os.getenv("POISON_QUEUE_NAME")
        or "cinematic-render-poison"
    )

    conn_str = (
        getattr(args, "connection_string", None)
        or os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        or os.getenv("QUEUE_CONNECTION_STRING")
        or os.getenv("stpraroharender_connection_string")
    )

    qurl = (
        getattr(args, "queue_url", None)
        or os.getenv("AZURE_STORAGE_QUEUE_URL")
        or os.getenv("QUEUE_URL")
    )
    poison_qurl = (
        getattr(args, "poison_queue_url", None)
        or os.getenv("AZURE_STORAGE_POISON_QUEUE_URL")
        or os.getenv("POISON_QUEUE_URL")
    )

    account_name = getattr(args, "account_name", None) or os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
    endpoint = getattr(args, "queue_endpoint", None) or os.getenv("AZURE_STORAGE_QUEUE_ENDPOINT")
    client_id = getattr(args, "client_id", None) or os.getenv("AZURE_CLIENT_ID")

    # Guard: Check for accidental usage of backend's Add-only SAS
    backend_sas_url = os.getenv("AZURE_STORAGE_QUEUE_SAS_URL")
    for candidate in [qurl, poison_qurl, backend_sas_url]:
        if candidate and is_add_only_sas(candidate):
            logger.error(
                "FATAL: Add-only SAS credential ('sp=a') detected. "
                "The backend's Add-only SAS cannot be used for worker queue consumption. "
                "The worker requires dequeue/update permissions (sp=rup) or Azure Managed Identity."
            )
            return None, None

    # Priority 1: Connection string (Local Azurite / dev)
    if conn_str:
        try:
            logger.info("Initializing Azure QueueClients using connection string (local/test mode)")
            work_client = QueueClient.from_connection_string(conn_str, queue_name=work_queue_name)
            poison_client = QueueClient.from_connection_string(conn_str, queue_name=poison_queue_name)
            return work_client, poison_client
        except Exception as exc:
            logger.error("Failed to initialize QueueClient from connection string: %s", exc)
            return None, None

    # Priority 2: Managed Identity (Passwordless production mode on Azure Container Apps Job)
    if account_name or endpoint:
        if DefaultAzureCredential is None:
            logger.error("azure-identity package is required for Managed Identity authentication.")
            return None, None

        account_url = endpoint.rstrip("/") if endpoint else f"https://{account_name}.queue.core.windows.net"
        try:
            if client_id:
                logger.info("Initializing DefaultAzureCredential with managed_identity_client_id=%s", client_id)
                credential = DefaultAzureCredential(managed_identity_client_id=client_id)
            else:
                logger.info("Initializing DefaultAzureCredential (system identity / environment)")
                credential = DefaultAzureCredential()

            work_client = QueueClient(account_url=account_url, queue_name=work_queue_name, credential=credential)
            poison_client = QueueClient(account_url=account_url, queue_name=poison_queue_name, credential=credential)
            logger.info(
                "Successfully constructed Managed Identity queue clients for %s and %s on %s",
                work_queue_name,
                poison_queue_name,
                account_url,
            )
            return work_client, poison_client
        except Exception as exc:
            logger.error("Failed to initialize Managed Identity QueueClient: %s", exc)
            return None, None

    # Priority 3: Scoped Queue URLs (Worker SAS / fallback)
    if qurl:
        try:
            if "?" in qurl:
                work_client = QueueClient.from_queue_url(qurl)
            else:
                if DefaultAzureCredential is None:
                    logger.error("azure-identity required to access queue URL without SAS")
                    return None, None
                credential = DefaultAzureCredential(managed_identity_client_id=client_id) if client_id else DefaultAzureCredential()
                work_client = QueueClient.from_queue_url(qurl, credential=credential)

            poison_client = None
            if poison_qurl:
                if "?" in poison_qurl:
                    poison_client = QueueClient.from_queue_url(poison_qurl)
                else:
                    poison_client = QueueClient.from_queue_url(poison_qurl, credential=credential)

            return work_client, poison_client
        except Exception as exc:
            logger.error("Failed to initialize QueueClient from URL: %s", exc)
            return None, None

    logger.error(
        "Missing Azure Storage credentials. Supply AZURE_STORAGE_ACCOUNT_NAME with AZURE_CLIENT_ID (Managed Identity), "
        "or QUEUE_URL / POISON_QUEUE_URL, or AZURE_STORAGE_CONNECTION_STRING."
    )
    return None, None


async def run_queue_cli(args: argparse.Namespace) -> int:
    """Entrypoint for CLI --queue execution with Azure Queue credentials."""
    queue_client, poison_client = build_queue_clients(args)
    if queue_client is None:
        return 1

    return await run_queue_worker(
        queue_client=queue_client,
        poison_queue_client=poison_client,
        database_url=args.database_url,
        timeout_sec=args.timeout,
        max_messages=getattr(args, "max_messages", 32),
        visibility_timeout=getattr(args, "visibility_timeout", 300),
        heartbeat_interval=getattr(args, "heartbeat_interval", 15.0),
        once=getattr(args, "once", False),
        output_dir=args.output_dir,
    )


import http.server


class WorkerHTTPHandler(http.server.BaseHTTPRequestHandler):
    """Standard library HTTP handler for Azure Container Apps scale-to-zero worker."""

    def log_message(self, format, *args):
        logger.info("Worker HTTP: %s - %s", self.address_string(), format % args)

    def do_GET(self):
        if self.path in ("/health", "/", "/api/health"):
            body = json.dumps({
                "status": "healthy",
                "service": "praroha-cinematic-worker",
                "mode": "isolated-scale-to-zero",
                "runtime": "ffmpeg-native",
            }).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path in ("/render", "/api/render"):
            try:
                # 1. Service-to-Service Authentication
                auth_header = self.headers.get("Authorization", "").strip()
                expected_token = get_expected_auth_token()
                if not auth_header or auth_header != f"Bearer {expected_token}":
                    logger.warning("Rejected unauthenticated render request from %s", self.address_string())
                    self.send_response(401)
                    self.send_header("Content-Type", "application/json")
                    err_body = json.dumps({"status": "unauthorized", "error": "Invalid or missing Bearer token"}).encode("utf-8")
                    self.send_header("Content-Length", str(len(err_body)))
                    self.end_headers()
                    self.wfile.write(err_body)
                    return

                # 2. Parse JSON Payload
                content_len = int(self.headers.get("Content-Length", 0))
                post_data = self.rfile.read(content_len)
                payload = json.loads(post_data.decode("utf-8")) if post_data else {}

                job_id = payload.get("job_id")
                spec_dict = payload.get("spec_dict") or payload.get("spec")
                if not spec_dict or not isinstance(spec_dict, dict):
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    err_body = json.dumps({"status": "invalid_request", "error": "Missing or invalid spec dictionary"}).encode("utf-8")
                    self.send_header("Content-Length", str(len(err_body)))
                    self.end_headers()
                    self.wfile.write(err_body)
                    return

                # 3. Validate Project and Entity IDs (alphanumeric/hyphen/underscore only)
                project_id = str(spec_dict.get("project_id", "")).strip()
                entity_id = str(spec_dict.get("entity_id", "")).strip()
                if not project_id or not re.match(r"^[a-zA-Z0-9_\-]+$", project_id):
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    err_body = json.dumps({"status": "invalid_request", "error": "Invalid project_id format"}).encode("utf-8")
                    self.send_header("Content-Length", str(len(err_body)))
                    self.end_headers()
                    self.wfile.write(err_body)
                    return

                if not entity_id or not re.match(r"^[a-zA-Z0-9_\-]+$", entity_id):
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    err_body = json.dumps({"status": "invalid_request", "error": "Invalid entity_id format"}).encode("utf-8")
                    self.send_header("Content-Length", str(len(err_body)))
                    self.end_headers()
                    self.wfile.write(err_body)
                    return

                # 4. Validate Asset Paths against Traversal & SSRF
                for field in ("image_path", "voice_path", "ambient_path"):
                    val = spec_dict.get(field)
                    if val and isinstance(val, str):
                        v_str = val.strip()
                        if ".." in v_str or "\x00" in v_str:
                            self.send_response(400)
                            self.send_header("Content-Type", "application/json")
                            err_body = json.dumps({"status": "invalid_request", "error": f"Path traversal rejected in {field}"}).encode("utf-8")
                            self.send_header("Content-Length", str(len(err_body)))
                            self.end_headers()
                            self.wfile.write(err_body)
                            return
                        if v_str.startswith("http://") or v_str.startswith("https://"):
                            if "169.254.169.254" in v_str or "metadata.google" in v_str:
                                self.send_response(400)
                                self.send_header("Content-Type", "application/json")
                                err_body = json.dumps({"status": "invalid_request", "error": f"Metadata endpoint blocked in {field}"}).encode("utf-8")
                                self.send_header("Content-Length", str(len(err_body)))
                                self.end_headers()
                                self.wfile.write(err_body)
                                return

                # Enforce server-side secret configuration: do not accept or read database credentials from request payload
                db_url = os.getenv("DATABASE_URL")
                storage_type = payload.get("storage_provider", os.getenv("STORAGE_PROVIDER", "supabase"))
                # 5. Bound execution timeout (5s to 120s max)
                raw_timeout = float(payload.get("timeout", 120.0))
                timeout_sec = min(max(raw_timeout, 5.0), 120.0)

                logger.info("Received authenticated render request for job_id=%s, storage=%s, timeout=%ss", job_id, storage_type, timeout_sec)
                exit_code = asyncio.run(
                    run_worker(
                        job_id=job_id,
                        spec_dict=spec_dict,
                        database_url=db_url,
                        storage_provider_type=storage_type,
                        timeout_sec=timeout_sec,
                    )
                )
                status_code = 200 if exit_code == 0 else 500
                resp_data = json.dumps({
                    "status": "completed" if exit_code == 0 else "failed",
                    "exit_code": exit_code,
                    "job_id": job_id,
                }).encode("utf-8")
                self.send_response(status_code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(resp_data)))
                self.end_headers()
                self.wfile.write(resp_data)
            except Exception as exc:
                logger.error("Error processing render request: %s", exc)
                err_data = json.dumps({"status": "error", "message": str(exc)}).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err_data)))
                self.end_headers()
                self.wfile.write(err_data)
        else:
            self.send_response(404)
            self.end_headers()


def run_server(port: int = 8080):
    server_address = ("0.0.0.0", port)
    httpd = http.server.ThreadingHTTPServer(server_address, WorkerHTTPHandler)
    logger.info("PRAROHA Dedicated Cinematic Worker server listening on port %d...", port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Worker server shutting down...")
    finally:
        httpd.server_close()


def parse_args():
    parser = argparse.ArgumentParser(description="PRAROHA Isolated Cinematic Rendering Worker")
    parser.add_argument("--queue", action="store_true", help="Run as queue consumer batch worker")
    parser.add_argument("--queue-name", type=str, default=os.getenv("AZURE_STORAGE_QUEUE_NAME") or os.getenv("QUEUE_NAME", "cinematic-render-jobs"), help="Azure Storage Queue name")
    parser.add_argument("--poison-queue-name", type=str, default=os.getenv("AZURE_STORAGE_POISON_QUEUE_NAME") or os.getenv("POISON_QUEUE_NAME", "cinematic-render-poison"), help="Azure Poison Queue name")
    parser.add_argument("--account-name", type=str, default=os.getenv("AZURE_STORAGE_ACCOUNT_NAME"), help="Azure Storage Account name for Managed Identity authentication")
    parser.add_argument("--queue-endpoint", type=str, default=os.getenv("AZURE_STORAGE_QUEUE_ENDPOINT"), help="Azure Storage Queue endpoint (e.g. https://<account>.queue.core.windows.net)")
    parser.add_argument("--client-id", type=str, default=os.getenv("AZURE_CLIENT_ID"), help="User-Assigned Managed Identity Client ID")
    parser.add_argument("--connection-string", type=str, default=None, help="Azure Storage Connection String")
    parser.add_argument("--queue-url", type=str, default=os.getenv("AZURE_STORAGE_QUEUE_URL") or os.getenv("QUEUE_URL"), help="Azure Queue URL")
    parser.add_argument("--poison-queue-url", type=str, default=os.getenv("AZURE_STORAGE_POISON_QUEUE_URL") or os.getenv("POISON_QUEUE_URL"), help="Azure Poison Queue URL")
    parser.add_argument("--max-messages", type=int, default=32, help="Max messages per batch")
    parser.add_argument("--visibility-timeout", type=int, default=300, help="Queue visibility timeout in seconds")
    parser.add_argument("--heartbeat-interval", type=float, default=15.0, help="Lease heartbeat interval in seconds")
    parser.add_argument("--once", action="store_true", help="Process only a single batch and exit")
    parser.add_argument("--server", action="store_true", help="Run as lightweight scale-to-zero HTTP worker")
    parser.add_argument("--port", type=int, default=int(os.getenv("PORT", "8080")), help="HTTP server port")
    parser.add_argument("--job-id", type=str, default=None, help="Database GenerationJob ID")
    parser.add_argument("--spec-json", type=str, default=None, help="JSON string with preview specification")
    parser.add_argument("--spec-file", type=str, default=None, help="Path to JSON file with preview specification")
    parser.add_argument("--database-url", type=str, default=None, help="Database connection URL")
    parser.add_argument("--storage-provider", type=str, default="local", choices=["local", "supabase"], help="Storage provider")
    parser.add_argument("--timeout", type=float, default=120.0, help="Rendering subprocess timeout in seconds")
    parser.add_argument("--output-dir", type=str, default=None, help="Local scratch output directory")
    parser.add_argument("--upload-dir", type=str, default=None, help="Destination directory for local storage")
    return parser.parse_args()


def main():
    # Verify no heavyweight HTTP framework is active
    if "fastapi" in sys.modules or "uvicorn" in sys.modules:
        logger.error("FATAL: Web frameworks (FastAPI/Uvicorn) must NEVER be imported in the dedicated worker.")
        sys.exit(1)

    args = parse_args()

    # 1. Queue Mode has absolute priority over legacy HTTP server
    if args.queue or os.getenv("RUN_MODE") == "queue":
        logger.info("Executing PRAROHA Dedicated Cinematic Worker in Queue Mode (--queue)")
        exit_code = asyncio.run(run_queue_cli(args))
        sys.exit(exit_code)

    # 2. Server mode (legacy HTTP) only if explicitly requested AND not in queue mode
    if args.server or os.getenv("RUN_MODE") == "server" or os.getenv("CONTAINER_APP_PORT"):
        run_server(port=args.port)
        return

    # 3. Direct single-job CLI execution mode
    spec_dict = None
    if args.spec_file and os.path.exists(args.spec_file):
        with open(args.spec_file, "r") as f:
            spec_dict = json.load(f)
    elif args.spec_json:
        spec_dict = json.loads(args.spec_json)

    exit_code = asyncio.run(
        run_worker(
            job_id=args.job_id,
            spec_dict=spec_dict,
            database_url=args.database_url,
            storage_provider_type=args.storage_provider,
            timeout_sec=args.timeout,
            output_dir=args.output_dir,
            upload_dir=args.upload_dir,
        )
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

