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
from typing import Any, Dict, Optional, Tuple

import httpx
import psutil
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

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
    proc = psutil.Process(os.getpid())
    start_rss = proc.memory_info().rss / (1024 * 1024)
    start_time = time.perf_counter()

    # Compose video
    result = composer.compose(spec, timeout_sec=timeout_sec)
    render_elapsed = time.perf_counter() - start_time
    end_rss = proc.memory_info().rss / (1024 * 1024)

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

    # Check if server mode requested via flag or environment
    if args.server or os.getenv("RUN_MODE") == "server" or os.getenv("CONTAINER_APP_PORT"):
        run_server(port=args.port)
        return

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

