"""
PRAROHA Cinematic Preview Retention Sweeper (Phase 54 Task B).

Responsible for the safe, bounded, and audit-logged lifecycle management of temporary
cinematic preview video assets.

Core Safety Invariants:
1. Dry-run mode by default: Never deletes storage objects or records unless explicitly
   invoked with execute mode.
2. Scope isolation: Strictly evaluates only assets with media_type='video' and
   provider_name='Cinematic Preview'. Never touches images, soundscapes, voice narration,
   or user-uploaded project assets.
3. Age threshold: Only evaluates preview assets older than the configured threshold (default 60 days).
4. Active asset preservation: An asset is NEVER purged merely because of age. If it is the
   current/active completed preview for an active (non-deleted) project entity, it is PRESERVED.
5. Eligibility criteria (must satisfy at least one):
   - Parent project is soft-deleted (deleted_at IS NOT NULL) or hard-deleted.
   - Asset failed over 60 days ago (status='failed').
   - Asset is superseded by a newer completed preview for the exact same entity.
6. Zero secrets / PII: Audit reports log only internal UUIDs and storage keys; never SAS tokens,
   credentials, or signed URLs.
"""

import argparse
import asyncio
import json
import logging
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.media import MediaAssetRecord
from backend.app.models.project import Project
from backend.app.providers.storage import (
    LocalStorageProvider,
    StorageProvider,
    SupabaseStorageProvider,
)
from backend.app.repositories.project_repo import async_session

logger = logging.getLogger("seed_unfold.cinematic_retention")


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def extract_storage_key(asset_url: Optional[str], metadata_json: Optional[str]) -> Optional[str]:
    """
    Extract canonical cloud storage key from metadata or URL path.
    Example: projects/{project_id}/media/video/{entity_id}_{timestamp}.mp4
    """
    if metadata_json:
        try:
            meta = json.loads(metadata_json)
            if isinstance(meta, dict) and meta.get("storage_key"):
                return str(meta["storage_key"]).strip().lstrip("/\\")
        except Exception:
            pass

    if not asset_url:
        return None

    url_str = str(asset_url).strip()
    match = re.search(r"projects/[^/]+/media/video/[^?#]+", url_str)
    if match:
        return match.group(0).lstrip("/\\")

    return None


class RetentionCandidateDecision(BaseModel):
    asset_id: str
    project_id: str
    entity_type: str
    entity_id: str
    created_at: datetime
    age_days: float
    status: str
    storage_key: Optional[str] = None
    eligible: bool
    decision_reason: str
    purged: bool = False
    storage_deleted: bool = False
    error: Optional[str] = None


class RetentionAuditReport(BaseModel):
    dry_run: bool = True
    retention_threshold_days: int = 60
    evaluated_candidates: int = 0
    eligible_for_purge: int = 0
    preserved_active: int = 0
    purged_storage_count: int = 0
    purged_db_count: int = 0
    storage_errors: int = 0
    decisions: List[RetentionCandidateDecision] = Field(default_factory=list)


class CinematicPreviewRetentionSweeper:
    """
    Safe, bounded retention manager for temporary cinematic preview videos.
    """

    def __init__(
        self,
        retention_days: int = 60,
        batch_size: int = 50,
        storage_provider: Optional[StorageProvider] = None,
        session_factory: Optional[Any] = None,
    ) -> None:
        self.retention_days = max(1, retention_days)
        self.batch_size = max(1, min(500, batch_size))
        self.session_factory = session_factory or async_session
        self._storage_provider = storage_provider
        self._task: Optional[asyncio.Task] = None
        self._shutdown_event = asyncio.Event()

    def _resolve_storage_provider(self) -> StorageProvider:
        if self._storage_provider:
            return self._storage_provider
        if os.getenv("STORAGE_PROVIDER", "supabase") == "supabase" and os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"):
            return SupabaseStorageProvider()
        return LocalStorageProvider()

    async def evaluate_and_sweep(self, dry_run: bool = True) -> RetentionAuditReport:
        """
        Evaluate candidates older than retention threshold and safely sweep if dry_run=False.
        """
        now = get_utc_now()
        threshold_dt = now - timedelta(days=self.retention_days)
        storage = self._resolve_storage_provider()

        report = RetentionAuditReport(
            dry_run=dry_run,
            retention_threshold_days=self.retention_days,
        )

        async with self.session_factory() as session:
            # 1. Query candidates older than threshold
            # Strictly filter to video assets from Cinematic Preview provider
            stmt = (
                select(MediaAssetRecord)
                .where(
                    MediaAssetRecord.media_type == "video",
                    MediaAssetRecord.provider_name == "Cinematic Preview",
                    MediaAssetRecord.created_at < threshold_dt,
                    MediaAssetRecord.status.in_(["completed", "failed"]),
                )
                .order_by(MediaAssetRecord.created_at.asc())
                .limit(self.batch_size)
            )
            result = await session.execute(stmt)
            candidates = result.scalars().all()
            report.evaluated_candidates = len(candidates)

            if not candidates:
                logger.info(
                    "cinematic_retention_audit event=sweep_complete evaluated=0 eligible=0 dry_run=%s",
                    dry_run,
                )
                return report

            # 2. Evaluate each candidate against preservation rules
            for asset in candidates:
                asset_dt = asset.created_at if asset.created_at.tzinfo else asset.created_at.replace(tzinfo=timezone.utc)
                age_days = round((now - asset_dt).total_seconds() / 86400, 1)
                storage_key = extract_storage_key(asset.asset_url, asset.metadata_json)

                # Rule A: Check parent project existence and soft-delete status
                proj_stmt = select(Project).where(Project.id == asset.project_id)
                proj_res = await session.execute(proj_stmt)
                project = proj_res.scalar_one_or_none()

                eligible = False
                reason = "Unknown"

                if not project:
                    eligible = True
                    reason = "Parent project hard-deleted / orphaned"
                elif project.deleted_at is not None:
                    eligible = True
                    reason = f"Parent project soft-deleted on {project.deleted_at.isoformat()}"
                elif asset.status == "failed":
                    eligible = True
                    reason = f"Historical failed preview older than {self.retention_days} days"
                else:
                    # Project is active and asset is completed.
                    # Check if there is a newer completed preview for the exact same entity.
                    newer_stmt = (
                        select(func.count(MediaAssetRecord.id))
                        .where(
                            MediaAssetRecord.project_id == asset.project_id,
                            MediaAssetRecord.entity_type == asset.entity_type,
                            MediaAssetRecord.entity_id == asset.entity_id,
                            MediaAssetRecord.media_type == "video",
                            MediaAssetRecord.provider_name == "Cinematic Preview",
                            MediaAssetRecord.status == "completed",
                            MediaAssetRecord.created_at > asset.created_at,
                        )
                    )
                    newer_res = await session.execute(newer_stmt)
                    newer_count = newer_res.scalar() or 0

                    if newer_count > 0:
                        eligible = True
                        reason = f"Superseded by {newer_count} newer preview(s) on active project"
                    else:
                        eligible = False
                        reason = "Preserved: active primary preview on non-deleted project"

                decision = RetentionCandidateDecision(
                    asset_id=asset.id,
                    project_id=asset.project_id,
                    entity_type=asset.entity_type,
                    entity_id=asset.entity_id,
                    created_at=asset_dt,
                    age_days=age_days,
                    status=asset.status,
                    storage_key=storage_key,
                    eligible=eligible,
                    decision_reason=reason,
                )

                if not eligible:
                    report.preserved_active += 1
                    report.decisions.append(decision)
                    continue

                report.eligible_for_purge += 1

                # 3. Apply purge if dry_run=False
                if not dry_run:
                    storage_deleted = False
                    storage_err = None

                    # A. Delete storage asset if key exists
                    if storage_key:
                        try:
                            storage_deleted = await storage.delete(storage_key)
                        except Exception as exc:
                            storage_err = f"Storage delete error: {type(exc).__name__}"
                            report.storage_errors += 1
                            logger.error(
                                "Failed to delete storage asset for key %s: %s",
                                storage_key,
                                exc,
                            )

                    # B. Update database record status to 'purged' and clear asset_url
                    # Preserves historical traceability while removing file reference
                    try:
                        meta = {}
                        if asset.metadata_json:
                            try:
                                meta = json.loads(asset.metadata_json)
                            except Exception:
                                meta = {}
                        meta["purged_at"] = now.isoformat()
                        meta["purge_reason"] = reason
                        if storage_key:
                            meta["purged_storage_key"] = storage_key

                        asset.status = "purged"
                        asset.asset_url = None
                        asset.metadata_json = json.dumps(meta)
                        session.add(asset)
                        await session.commit()

                        decision.purged = True
                        decision.storage_deleted = storage_deleted
                        decision.error = storage_err
                        report.purged_db_count += 1
                        if storage_deleted:
                            report.purged_storage_count += 1
                    except Exception as db_exc:
                        await session.rollback()
                        decision.error = f"Database update error: {type(db_exc).__name__}"
                        logger.error("Failed to update media record %s to purged: %s", asset.id, db_exc)

                report.decisions.append(decision)

        logger.info(
            "cinematic_retention_audit event=sweep_summary dry_run=%s evaluated=%d eligible=%d "
            "preserved=%d purged_storage=%d purged_db=%d errors=%d",
            report.dry_run,
            report.evaluated_candidates,
            report.eligible_for_purge,
            report.preserved_active,
            report.purged_storage_count,
            report.purged_db_count,
            report.storage_errors,
        )
        return report

    async def _run_loop(self, interval_seconds: float, dry_run: bool) -> None:
        """Background loop executing retention sweep on configured cadence until shutdown."""
        logger.info(
            "Cinematic retention sweeper started (interval=%.1fs, dry_run=%s, threshold_days=%d).",
            interval_seconds,
            dry_run,
            self.retention_days,
        )
        while not self._shutdown_event.is_set():
            try:
                await self.evaluate_and_sweep(dry_run=dry_run)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("Unhandled error in cinematic retention sweeper: %s", exc, exc_info=True)

            try:
                await asyncio.wait_for(self._shutdown_event.wait(), timeout=interval_seconds)
                break
            except asyncio.TimeoutError:
                pass
            except asyncio.CancelledError:
                break

        logger.info("Cinematic retention sweeper stopped cleanly.")

    def start(self, interval_seconds: float = 86400.0, dry_run: bool = True) -> asyncio.Task:
        """Start the background retention sweeper task if not already running."""
        if self._task is None or self._task.done():
            self._shutdown_event.clear()
            self._task = asyncio.create_task(self._run_loop(interval_seconds, dry_run))
        return self._task

    async def stop(self) -> None:
        """Signal shutdown and wait cleanly for the background loop to finish."""
        self._shutdown_event.set()
        if self._task is not None and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None


_retention_sweeper_singleton: Optional[CinematicPreviewRetentionSweeper] = None


def get_retention_sweeper() -> CinematicPreviewRetentionSweeper:
    global _retention_sweeper_singleton
    if _retention_sweeper_singleton is None:
        from backend.app.config import settings
        days = getattr(settings, "CINEMATIC_RETENTION_DAYS", 60)
        _retention_sweeper_singleton = CinematicPreviewRetentionSweeper(retention_days=days)
    return _retention_sweeper_singleton


async def _run_cli() -> None:
    parser = argparse.ArgumentParser(description="PRAROHA Cinematic Preview Retention Sweeper")
    parser.add_argument(
        "--days",
        type=int,
        default=60,
        help="Retention threshold in days (default: 60)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Batch size per run (default: 50)",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        default=False,
        help="Explicitly execute real deletion (defaults to dry-run)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Dry run without mutating database or storage (default: True)",
    )
    args = parser.parse_args()

    is_dry_run = not args.execute
    sweeper = CinematicPreviewRetentionSweeper(
        retention_days=args.days,
        batch_size=args.batch_size,
    )
    report = await sweeper.evaluate_and_sweep(dry_run=is_dry_run)
    print(json.dumps(report.model_dump(), default=str, indent=2))


if __name__ == "__main__":
    asyncio.run(_run_cli())
