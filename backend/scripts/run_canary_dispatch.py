#!/usr/bin/env python3
"""
PRAROHA Phase 52 — One-Shot Canary Dispatcher Operator CLI.

STRICT OPERATIONAL SAFETY SPECIFICATION:
1. Operator-only CLI tool for executing exactly ONE synthetic cinematic render canary.
2. Uses real ProjectRepository, CinematicDispatcherService, canonical queue contract,
   and transactional outbox. Zero ad hoc SQL inserts. Zero public HTTP endpoints.
3. Requires explicit command-line confirmation: --confirm-production-canary.
   Without this flag, runs in strict read-only audit/dry-run mode with ZERO production writes.
4. Performs comprehensive read-only preflight checks before any mutation:
   - Backend health probe returns HTTP 200 and fallback_used is False.
   - Live backend Container App is running candidate image v7.3.
   - Production render_outbox table exists and is completely empty (0 rows).
   - Both Azure queues (cinematic-render-jobs, cinematic-render-poison) are empty.
   - Worker job (praroha-render-job) has zero active or historical executions.
   - Both feature flags (CINEMATIC_PREVIEW_ENABLED, VITE_ENABLE_CINEMATIC_PREVIEW) are disabled.
   - Canonical demo project ("The Sunken City: Bio-City") and verified keyframe image exist.
   - Generated payload is 100% compatible with deployed praroha-worker:v6 contract.
5. At-most-one dispatch guarantee: computes deterministic request_hash, rejects duplicates,
   and does not retry on ambiguous outcomes.
6. Zero secret leakage: all queue URLs and payloads are sanitized before logging.
"""

import argparse
import asyncio
import json
import logging
import os
import re
import subprocess
import sys
from pathlib import Path
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx
from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.app.config import settings, Settings
from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord
from backend.app.models.outbox import RenderOutbox, assert_no_secrets_in_payload
from backend.app.models.project import Project
from backend.app.repositories import project_repo
from backend.app.repositories.project_repo import ProjectRepository, async_session, init_db
from backend.app.services.cinematic_dispatcher import (
    CinematicDispatcherService,
    CinematicPreviewJobRequest,
    compute_preview_hash,
    sanitize_error_message,
    sanitize_queue_url,
    validate_queue_url,
)
from backend.app.services.queue_contract import (
    scan_for_credentials,
    validate_queue_message_dict,
)
from backend.app.workers.cinematic_worker import parse_and_validate_queue_message

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [canary-operator] %(message)s",
)
logger = logging.getLogger("canary-operator")

LIVE_BACKEND_HEALTH_URL = "https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io/api/health"
RESOURCE_GROUP = "rg-tendersaathi"
BACKEND_APP_NAME = "praroha-backend"
WORKER_JOB_NAME = "praroha-render-job"
STORAGE_ACCOUNT = "stpraroharender"
JOBS_QUEUE = "cinematic-render-jobs"
POISON_QUEUE = "cinematic-render-poison"
EXPECTED_BACKEND_IMAGE_TAG = "v7.3"
CANONICAL_DEMO_TITLE = "The Sunken City: Bio-City"


@dataclass
class PreflightReport:
    """Detailed audit report of live cloud and database prerequisites."""
    backend_healthy: bool = False
    backend_image_v7_3: bool = False
    outbox_empty: bool = False
    queues_empty: bool = False
    job_executions_zero: bool = False
    feature_flags_disabled: bool = False
    demo_project_found: bool = False
    demo_asset_found: bool = False
    worker_contract_compatible: bool = False
    diagnostics: List[str] = field(default_factory=list)

    @property
    def all_passed(self) -> bool:
        return (
            self.backend_healthy
            and self.backend_image_v7_3
            and self.outbox_empty
            and self.queues_empty
            and self.job_executions_zero
            and self.feature_flags_disabled
            and self.demo_project_found
            and self.demo_asset_found
            and self.worker_contract_compatible
        )


def check_live_backend_health() -> Tuple[bool, bool, str]:
    """
    Probe the live backend /api/health endpoint.
    Returns: (is_healthy, fallback_used, details_string)
    """
    try:
        resp = httpx.get(LIVE_BACKEND_HEALTH_URL, timeout=10.0)
        if resp.status_code != 200:
            return False, False, f"HTTP {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        success = data.get("success", False)
        status_val = data.get("data", {}).get("status", "")
        fallback_used = data.get("fallback_used", False)
        is_healthy = bool(success and status_val == "healthy" and not fallback_used)
        return is_healthy, fallback_used, f"status={status_val}, fallback_used={fallback_used}"
    except Exception as exc:
        return False, False, f"Connection failure: {str(exc)}"


def check_azure_container_app_image() -> Tuple[bool, str]:
    """Query Azure Container Apps for the running image tag of praroha-backend."""
    try:
        cmd = [
            "az", "containerapp", "show",
            "--name", BACKEND_APP_NAME,
            "--resource-group", RESOURCE_GROUP,
            "--query", "properties.template.containers[0].image",
            "-o", "tsv",
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=False, timeout=15)
        if res.returncode != 0:
            return False, f"az CLI error: {res.stderr.strip()[:200]}"
        image = res.stdout.strip()
        is_v7_3 = EXPECTED_BACKEND_IMAGE_TAG in image
        return is_v7_3, image
    except Exception as exc:
        return False, f"Exception running az containerapp show: {str(exc)}"


def check_azure_queues_empty() -> Tuple[bool, str]:
    """Peek messages on both Azure Storage Queues. Must both be empty."""
    try:
        key_cmd = [
            "az", "storage", "account", "keys", "list",
            "--account-name", STORAGE_ACCOUNT,
            "--resource-group", RESOURCE_GROUP,
            "--query", "[0].value",
            "-o", "tsv",
        ]
        k_res = subprocess.run(key_cmd, capture_output=True, text=True, check=False, timeout=15)
        if k_res.returncode != 0:
            return False, f"Failed to get storage key: {k_res.stderr.strip()[:200]}"
        account_key = k_res.stdout.strip()

        for q_name in (JOBS_QUEUE, POISON_QUEUE):
            peek_cmd = [
                "az", "storage", "message", "peek",
                "--queue-name", q_name,
                "--account-name", STORAGE_ACCOUNT,
                "--account-key", account_key,
                "-o", "json",
            ]
            p_res = subprocess.run(peek_cmd, capture_output=True, text=True, check=False, timeout=15)
            if p_res.returncode != 0:
                return False, f"Failed to peek {q_name}: {p_res.stderr.strip()[:200]}"
            messages = json.loads(p_res.stdout.strip() or "[]")
            if len(messages) > 0:
                return False, f"Queue {q_name} is NOT empty ({len(messages)} messages found)"

        return True, "Both queues empty"
    except Exception as exc:
        return False, f"Exception checking queues: {str(exc)}"


def check_render_job_executions_zero() -> Tuple[bool, str]:
    """Verify that praroha-render-job has exactly zero executions."""
    try:
        cmd = [
            "az", "containerapp", "job", "execution", "list",
            "--name", WORKER_JOB_NAME,
            "--resource-group", RESOURCE_GROUP,
            "-o", "json",
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=False, timeout=15)
        if res.returncode != 0:
            return False, f"az CLI error: {res.stderr.strip()[:200]}"
        executions = json.loads(res.stdout.strip() or "[]")
        if len(executions) > 0:
            return False, f"Worker job has {len(executions)} prior/active executions (expected 0)"
        return True, "0 executions recorded"
    except Exception as exc:
        return False, f"Exception checking job executions: {str(exc)}"


def check_live_feature_flags_disabled() -> Tuple[bool, str]:
    """Check that neither feature flag is enabled in the live backend environment."""
    try:
        cmd = [
            "az", "containerapp", "show",
            "--name", BACKEND_APP_NAME,
            "--resource-group", RESOURCE_GROUP,
            "--query", "{env:properties.template.containers[0].env[].name}",
            "-o", "json",
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=False, timeout=15)
        if res.returncode != 0:
            return False, f"az CLI error: {res.stderr.strip()[:200]}"
        data = json.loads(res.stdout.strip() or "{}")
        names = data.get("env", [])
        if "CINEMATIC_PREVIEW_ENABLED" in names:
            return False, "CINEMATIC_PREVIEW_ENABLED is present in backend container env"
        if "VITE_ENABLE_CINEMATIC_PREVIEW" in names:
            return False, "VITE_ENABLE_CINEMATIC_PREVIEW is present in backend container env"
        return True, "Both feature flags disabled in production container"
    except Exception as exc:
        return False, f"Exception checking feature flags: {str(exc)}"


async def check_render_outbox_empty(session: AsyncSession) -> Tuple[bool, str]:
    """Verify production render_outbox table exists and contains exactly 0 rows."""
    try:
        stmt = select(func.count(RenderOutbox.id))
        count = (await session.execute(stmt)).scalar_one()
        if count != 0:
            return False, f"render_outbox has {count} existing records (expected 0)"
        return True, "render_outbox exists with 0 rows"
    except Exception as exc:
        return False, f"Failed querying render_outbox: {str(exc)}"


async def find_canonical_demo_seed(
    session: AsyncSession,
    project_id: Optional[str] = None,
    entity_id: Optional[str] = None,
) -> Tuple[Optional[Project], Optional[MediaAssetRecord], Optional[str], str]:
    """
    Identify and validate the canonical demo project and verified keyframe art.
    Returns: (project, image_asset, entity_id, diagnostic_message)
    """
    repo = ProjectRepository(session)

    # 1. Resolve project candidates
    candidates: List[Project] = []
    if project_id:
        target_project = await repo.get_project(project_id)
        if not target_project:
            return None, None, None, f"Specified project_id '{project_id}' not found."
        candidates = [target_project]
    else:
        stmt = select(Project).where(Project.title == CANONICAL_DEMO_TITLE)
        candidates = (await session.execute(stmt)).scalars().all()
        if not candidates:
            return None, None, None, f"No project with title '{CANONICAL_DEMO_TITLE}' found in database."

    # 2. Find candidate project that has a completed keyframe image asset
    for candidate_project in candidates:
        stmt_assets = select(MediaAssetRecord).where(
            MediaAssetRecord.project_id == candidate_project.id,
            MediaAssetRecord.media_type == "image",
            MediaAssetRecord.status == "completed",
        )
        if entity_id:
            stmt_assets = stmt_assets.where(MediaAssetRecord.entity_id == entity_id)

        image_assets = (await session.execute(stmt_assets)).scalars().all()
        if not image_assets:
            continue

        selected_asset = image_assets[0]
        resolved_entity_id = selected_asset.entity_id

        # 3. Path traversal & SSRF check
        url_val = selected_asset.asset_url or ""
        if ".." in url_val or "\x00" in url_val:
            continue
        if "169.254.169.254" in url_val or "metadata.google" in url_val:
            continue

        return candidate_project, selected_asset, resolved_entity_id, f"Found verified keyframe asset '{selected_asset.id}' in project '{candidate_project.id}'"

    return candidates[0], None, None, f"None of the {len(candidates)} projects matching '{CANONICAL_DEMO_TITLE}' have completed image assets."


def audit_worker_contract_compatibility(
    job_id: str,
    project_id: str,
    entity_type: str,
    entity_id: str,
    request_hash: str,
    options: Dict[str, Any],
) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Construct the canonical queue payload and test against the exact validator
    running in praroha-worker:v6 (parse_and_validate_queue_message).
    """
    payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": project_id,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "request_hash": request_hash,
        "options": options,
        "enqueued_at": datetime.now(timezone.utc).isoformat(),
        "attempt": 1,
    }

    try:
        assert_no_secrets_in_payload(payload)
        validate_queue_message_dict(payload)
        validated = parse_and_validate_queue_message(payload)
        return True, validated, "Payload strictly valid against worker v6 contract"
    except Exception as exc:
        return False, None, f"Worker contract incompatibility: {str(exc)}"


def resolve_scoped_queue_publish_url(
    provided_url: Optional[str] = None,
    auto_generate_sas: bool = False,
) -> str:
    """
    Resolve and validate the scoped Add-only SAS URL for cinematic-render-jobs.
    Never prints or stores the SAS token.
    """
    candidate_url = provided_url or os.getenv("QUEUE_PUBLISH_URL") or getattr(settings, "QUEUE_PUBLISH_URL", None)

    if not candidate_url and auto_generate_sas:
        try:
            logger.info("Generating ephemeral Add-only SAS token for queue publishing...")
            cmd = [
                "az", "storage", "queue", "generate-sas",
                "--account-name", STORAGE_ACCOUNT,
                "--name", JOBS_QUEUE,
                "--permissions", "a",
                "--expiry", "2026-10-25T00:00:00Z",
                "--https-only",
                "-o", "tsv",
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, check=False, timeout=15)
            if res.returncode == 0 and res.stdout.strip():
                sas_token = res.stdout.strip()
                candidate_url = f"https://{STORAGE_ACCOUNT}.queue.core.windows.net/{JOBS_QUEUE}?{sas_token}"
            else:
                raise RuntimeError(f"az CLI failed to generate SAS: {res.stderr.strip()[:200]}")
        except Exception as exc:
            raise RuntimeError(f"Could not automatically generate queue SAS: {exc}")

    if not candidate_url:
        raise ValueError(
            "Missing queue publishing URL. Pass --queue-publish-url or set QUEUE_PUBLISH_URL. "
            "Use --fetch-azure-sas to dynamically generate an ephemeral Add-only SAS via Azure CLI."
        )

    clean_url = candidate_url.strip()
    validate_queue_url(clean_url)
    return clean_url


async def run_full_preflight_audit(
    session: AsyncSession,
    project_id: Optional[str] = None,
    entity_id: Optional[str] = None,
    skip_azure_cli: bool = False,
) -> Tuple[PreflightReport, Optional[Project], Optional[MediaAssetRecord], Optional[str]]:
    """
    Execute all mandatory read-only preflight checks.
    Returns: (PreflightReport, project, image_asset, entity_id)
    """
    report = PreflightReport()

    # 1. Live backend health
    h_ok, fallback_used, h_diag = check_live_backend_health()
    report.backend_healthy = h_ok
    report.diagnostics.append(f"Backend Health: {h_diag} (pass={h_ok})")

    # 2. Azure container app image v7.3
    if skip_azure_cli:
        report.backend_image_v7_3 = True
        report.diagnostics.append("Azure Container App image check skipped by flag")
    else:
        img_ok, img_diag = check_azure_container_app_image()
        report.backend_image_v7_3 = img_ok
        report.diagnostics.append(f"Backend Image: {img_diag} (pass={img_ok})")

    # 3. Outbox table empty
    outbox_ok, outbox_diag = await check_render_outbox_empty(session)
    report.outbox_empty = outbox_ok
    report.diagnostics.append(f"Outbox Empty: {outbox_diag} (pass={outbox_ok})")

    # 4. Azure queues empty
    if skip_azure_cli:
        report.queues_empty = True
        report.diagnostics.append("Azure queues peek skipped by flag")
    else:
        q_ok, q_diag = check_azure_queues_empty()
        report.queues_empty = q_ok
        report.diagnostics.append(f"Queues Empty: {q_diag} (pass={q_ok})")

    # 5. Worker executions zero
    if skip_azure_cli:
        report.job_executions_zero = True
        report.diagnostics.append("Job executions check skipped by flag")
    else:
        job_ok, job_diag = check_render_job_executions_zero()
        report.job_executions_zero = job_ok
        report.diagnostics.append(f"Worker Executions: {job_diag} (pass={job_ok})")

    # 6. Feature flags disabled
    if skip_azure_cli:
        report.feature_flags_disabled = True
        report.diagnostics.append("Feature flags check skipped by flag")
    else:
        ff_ok, ff_diag = check_live_feature_flags_disabled()
        report.feature_flags_disabled = ff_ok
        report.diagnostics.append(f"Feature Flags: {ff_diag} (pass={ff_ok})")

    # 7. Canonical demo seed & keyframe asset
    proj, asset, resolved_ent, seed_diag = await find_canonical_demo_seed(session, project_id, entity_id)
    report.demo_project_found = proj is not None
    report.demo_asset_found = asset is not None
    report.diagnostics.append(f"Demo Seed: {seed_diag} (proj={proj is not None}, asset={asset is not None})")

    # 8. Worker contract compatibility
    if proj and asset and resolved_ent:
        compat_ok, _, compat_diag = audit_worker_contract_compatibility(
            job_id="00000000-0000-0000-0000-000000000001",
            project_id=proj.id,
            entity_type=asset.entity_type or "character",
            entity_id=resolved_ent,
            request_hash="a" * 64,
            options={
                "duration_seconds": 6,
                "fps": 24,
                "resolution": "1280x720",
                "aspect_ratio": "16:9",
                "motion_preset": "slow_pan",
            },
        )
        report.worker_contract_compatible = compat_ok
        report.diagnostics.append(f"Worker Contract: {compat_diag} (pass={compat_ok})")
    else:
        report.worker_contract_compatible = False
        report.diagnostics.append("Worker Contract: Cannot test without valid demo seed")

    return report, proj, asset, resolved_ent


async def execute_canary_dispatch(
    session: AsyncSession,
    project: Project,
    image_asset: MediaAssetRecord,
    entity_id: str,
    queue_publish_url: str,
    duration_sec: int = 6,
    aspect_ratio: str = "16:9",
    queue_client: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Execute exactly ONE synthetic canary dispatch through the real ProjectRepository
    and CinematicDispatcherService.

    AT-MOST-ONE GUARANTEE:
    - Pre-verifies render_outbox has 0 rows.
    - Pre-verifies media_assets does not contain matching request_hash.
    - Does NOT retry on ambiguity or network failure.
    """
    repo = ProjectRepository(session)

    # 1. Strict pre-dispatch double-check
    outbox_count = (await session.execute(select(func.count(RenderOutbox.id)))).scalar_one()
    if outbox_count > 0:
        raise RuntimeError(f"CANARY DISPATCH ABORTED: render_outbox contains {outbox_count} rows (expected 0).")

    entity_type = image_asset.entity_type or "character"
    request_payload = CinematicPreviewJobRequest(
        entity_type=entity_type,
        entity_id=entity_id,
        duration_sec=duration_sec,
        aspect_ratio=aspect_ratio,
        image_url=image_asset.asset_url,
    )

    req_hash = compute_preview_hash(project.id, request_payload)
    existing_asset = await repo.find_media_asset_by_hash(project.id, req_hash)
    if existing_asset:
        raise RuntimeError(
            f"CANARY DISPATCH ABORTED: Duplicate request_hash '{req_hash}' already exists "
            f"in media_assets (id={existing_asset.id}, status={existing_asset.status})."
        )

    # 2. Local-process-only activation of the internal feature gate
    orig_flag = getattr(settings, "CINEMATIC_PREVIEW_ENABLED", False)
    settings.CINEMATIC_PREVIEW_ENABLED = True

    try:
        dispatcher = CinematicDispatcherService(
            repo=repo,
            queue_publish_url=queue_publish_url,
            queue_client=queue_client,
        )

        safe_url = sanitize_queue_url(queue_publish_url)
        logger.info("Executing ONE-SHOT canary dispatch for project=%s entity=%s to %s", project.id, entity_id, safe_url)

        job_resp = await dispatcher.dispatch_preview_job(project.id, request_payload)

        # 3. Retrieve durable records to confirm commit
        outbox_entry = await repo.get_render_outbox_by_job_id(job_resp.job_id)
        generation_job = await repo.get_generation_job(job_resp.job_id)
        media_asset = await repo.get_media_asset(job_resp.job_id)

        result_summary = {
            "dispatched": True,
            "job_id": job_resp.job_id,
            "project_id": project.id,
            "entity_id": entity_id,
            "entity_type": entity_type,
            "request_hash": req_hash,
            "job_status": generation_job.status if generation_job else job_resp.status,
            "outbox_status": outbox_entry.status if outbox_entry else "unknown",
            "outbox_id": outbox_entry.id if outbox_entry else None,
            "asset_id": media_asset.id if media_asset else None,
            "dispatched_at": datetime.now(timezone.utc).isoformat(),
        }

        return result_summary
    finally:
        settings.CINEMATIC_PREVIEW_ENABLED = orig_flag


async def main_async(args: argparse.Namespace) -> int:
    """Async entrypoint for operator CLI."""
    logger.info("=" * 70)
    logger.info("PRAROHA Phase 52 — Synthetic Canary Dispatch Operator Tool")
    logger.info("=" * 70)

    # 1. Connect to production database (Zero DDL validation on startup)
    logger.info("Initializing database session and validating schema (Zero DDL)...")
    await init_db()

    async with async_session() as session:
        # 2. Execute full read-only preflight checks
        logger.info("Running mandatory read-only preflight checks...")
        report, project, keyframe_asset, entity_id = await run_full_preflight_audit(
            session=session,
            project_id=args.project_id,
            entity_id=args.entity_id,
            skip_azure_cli=args.skip_azure_cli_for_testing,
        )

        print("\n--- PREFLIGHT AUDIT REPORT ---")
        for diag in report.diagnostics:
            print(f"  • {diag}")
        print("------------------------------\n")

        if not report.all_passed:
            logger.error("PREFLIGHT AUDIT FAILED. Exactly 0 mutations were made. Aborting.")
            return 1

        logger.info("All preflight checks PASSED.")
        logger.info("Selected Canonical Project: '%s' (%s)", project.title, project.id)
        logger.info("Selected Keyframe Asset: id=%s (entity_id=%s)", keyframe_asset.id, entity_id)

        # 3. Resolve queue publishing credential
        try:
            queue_url = resolve_scoped_queue_publish_url(
                provided_url=args.queue_publish_url,
                auto_generate_sas=args.fetch_azure_sas,
            )
            safe_queue = sanitize_queue_url(queue_url)
            logger.info("Queue publishing target validated: %s", safe_queue)
        except Exception as exc:
            logger.error("Queue URL resolution failed: %s", exc)
            return 1

        # 4. Enforce explicit operator confirmation gate
        if not args.confirm_production_canary:
            logger.warning("=" * 70)
            logger.warning("DRY-RUN / AUDIT MODE COMPLETE: --confirm-production-canary was NOT passed.")
            logger.warning("ZERO changes were made to production PostgreSQL, outbox, or Azure queues.")
            logger.warning("To execute the single authorized synthetic canary, re-run with:")
            logger.warning("    python -m backend.scripts.run_canary_dispatch --confirm-production-canary")
            logger.warning("=" * 70)
            return 0

        # 5. Execute authorized single canary dispatch
        logger.info("Operator confirmation received. Executing single canary dispatch...")
        try:
            dispatch_result = await execute_canary_dispatch(
                session=session,
                project=project,
                image_asset=keyframe_asset,
                entity_id=entity_id,
                queue_publish_url=queue_url,
                duration_sec=args.duration,
                aspect_ratio=args.aspect_ratio,
            )

            print("\n" + "=" * 70)
            print("CANARY DISPATCH EXECUTED SUCCESSFULLY")
            print("=" * 70)
            print(json.dumps(dispatch_result, indent=2))
            print("=" * 70 + "\n")

            logger.info("Phase Gate D dispatch initiated. Normal Azure queue worker will now claim the job.")
            logger.info("Monitor with: az containerapp job execution list --name praroha-render-job -g rg-tendersaathi")
            return 0
        except Exception as exc:
            logger.error("Canary dispatch failed or aborted: %s", exc, exc_info=True)
            return 2


def parse_args(args_list: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="PRAROHA Phase 52 One-Shot Canary Dispatcher Operator CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--confirm-production-canary",
        action="store_true",
        default=False,
        help="MANDATORY confirmation flag to execute production dispatch. Without this flag, runs in strict dry-run mode.",
    )
    parser.add_argument(
        "--project-id",
        type=str,
        default=None,
        help="UUID of the project to dispatch for. Defaults to auto-discovering 'The Sunken City: Bio-City'.",
    )
    parser.add_argument(
        "--entity-id",
        type=str,
        default=None,
        help="Entity ID with keyframe art. Defaults to auto-discovering from project assets.",
    )
    parser.add_argument(
        "--queue-publish-url",
        type=str,
        default=None,
        help="Add-only SAS URL for cinematic-render-jobs. If omitted, uses QUEUE_PUBLISH_URL env var.",
    )
    parser.add_argument(
        "--fetch-azure-sas",
        action="store_true",
        default=False,
        help="Dynamically generate an Add-only SAS token for cinematic-render-jobs using authenticated Azure CLI.",
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=6,
        help="Duration of the canary render in seconds (3-60).",
    )
    parser.add_argument(
        "--aspect-ratio",
        type=str,
        default="16:9",
        choices=["16:9", "1:1", "9:16"],
        help="Aspect ratio for the preview render.",
    )
    parser.add_argument(
        "--skip-azure-cli-for-testing",
        action="store_true",
        default=False,
        help="Internal test flag to skip external Azure CLI calls during offline unit testing.",
    )
    return parser.parse_args(args_list)


def main():
    args = parse_args()
    exit_code = asyncio.run(main_async(args))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
