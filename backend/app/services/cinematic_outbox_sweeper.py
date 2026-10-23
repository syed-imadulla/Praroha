"""
PRAROHA Cinematic Outbox Sweeper (Phase 52 TASK-52-11).

Background service to periodically poll for pending RenderOutbox records,
safely claim them with concurrency leases, publish them to Azure Storage Queue
(cinematic-render-jobs), mark them published on confirmation, apply exponential
backoff on retryable failures, transition to terminal failed state after 5 attempts,
and shut down cleanly without task leaks.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from backend.app.config import settings
from backend.app.models.outbox import RenderOutbox, assert_no_secrets_in_payload
from backend.app.repositories.project_repo import ProjectRepository, async_session, get_utc_now
from backend.app.services.cinematic_dispatcher import (
    sanitize_error_message,
    sanitize_queue_url,
    validate_queue_url,
)
from backend.app.services.queue_contract import validate_queue_message_dict

logger = logging.getLogger("seed_unfold.cinematic_outbox_sweeper")


class CinematicOutboxSweeper:
    """
    Periodic background sweeper that ensures reliable delivery of render outbox records.
    """

    def __init__(
        self,
        queue_publish_url: Optional[str] = None,
        interval_seconds: float = 30.0,
        lease_seconds: int = 60,
        max_attempts: int = 5,
        base_backoff_seconds: int = 30,
        queue_client: Optional[Any] = None,
    ) -> None:
        raw_url = queue_publish_url if queue_publish_url is not None else getattr(settings, "QUEUE_PUBLISH_URL", None)
        self.queue_publish_url = (raw_url or "").strip()
        self.interval_seconds = interval_seconds
        self.lease_seconds = lease_seconds
        self.max_attempts = max_attempts
        self.base_backoff_seconds = base_backoff_seconds
        self._injected_queue_client = queue_client
        self._task: Optional[asyncio.Task] = None
        self._shutdown_event = asyncio.Event()

    async def _send_queue_message(self, payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Publish payload to Azure Storage Queue outside the database transaction."""
        try:
            assert_no_secrets_in_payload(payload)
            validate_queue_message_dict(payload)

            if self._injected_queue_client is not None:
                client = self._injected_queue_client
                import inspect
                if inspect.iscoroutinefunction(client.send_message):
                    await client.send_message(json.dumps(payload))
                else:
                    await asyncio.to_thread(client.send_message, json.dumps(payload))
                return True, None

            validate_queue_url(self.queue_publish_url)
            from azure.storage.queue import QueueClient

            def _publish_sync() -> None:
                client = QueueClient.from_queue_url(self.queue_publish_url)
                client.send_message(json.dumps(payload))

            await asyncio.to_thread(_publish_sync)
            return True, None
        except Exception as exc:
            return False, str(exc)

    async def sweep_once(self) -> int:
        """
        Execute one sweep cycle:
        1. If queue configuration is missing, return 0 without marking published or spinning.
        2. Claim eligible pending records safely via atomic CAS.
        3. Publish each claimed record outside the DB transaction.
        4. Update outbox status to 'published' on success, or increment attempt/fail on error.
        Returns count of successfully published records.
        """
        if not self.queue_publish_url and self._injected_queue_client is None:
            logger.debug("Cinematic outbox sweeper: QUEUE_PUBLISH_URL not configured. Skipping sweep.")
            return 0

        async with async_session() as session:
            repo = ProjectRepository(session)
            claimed = await repo.claim_eligible_outbox_records(
                limit=10,
                lease_seconds=self.lease_seconds,
                max_attempts=self.max_attempts,
                base_backoff_seconds=self.base_backoff_seconds,
            )

        if not claimed:
            return 0

        logger.info("Outbox sweeper claimed %d record(s) for dispatch.", len(claimed))
        success_count = 0

        for record in claimed:
            payload = dict(record.payload) if isinstance(record.payload, dict) else {}
            # Update attempt counter in payload to reflect this attempt
            payload["attempt"] = record.attempt_count + 1

            publish_ok, publish_err = await self._send_queue_message(payload)

            async with async_session() as session:
                repo = ProjectRepository(session)
                if publish_ok:
                    now = get_utc_now()
                    await repo.update_render_outbox_status(
                        job_id=record.job_id,
                        status="published",
                        published_at=now,
                        clear_claim=True,
                    )
                    success_count += 1
                    logger.info("Sweeper successfully published outbox record for job %s.", record.job_id)
                else:
                    sanitized_err = sanitize_error_message(publish_err)
                    new_attempt = record.attempt_count + 1
                    logger.warning(
                        "Sweeper failed to publish job %s (attempt %d/%d): %s",
                        record.job_id,
                        new_attempt,
                        self.max_attempts,
                        sanitized_err,
                    )

                    if new_attempt >= self.max_attempts:
                        # Terminal failure: attempts exhausted
                        terminal_err = (
                            f"Publish retry limit exhausted ({self.max_attempts} attempts). Last error: {sanitized_err}"
                        )
                        await repo.mark_terminal_outbox_failure(
                            job_id=record.job_id,
                            last_error=terminal_err,
                        )
                        logger.error(
                            "Outbox record for job %s reached maximum retries (%d). Marked terminal failed.",
                            record.job_id,
                            self.max_attempts,
                        )
                    else:
                        # Bounded exponential backoff retry
                        await repo.update_render_outbox_status(
                            job_id=record.job_id,
                            status="pending",
                            last_error=sanitized_err,
                            increment_attempt=True,
                            clear_claim=True,
                        )

        return success_count

    async def _run_loop(self) -> None:
        """Background loop executing sweep every interval_seconds until shutdown."""
        logger.info(
            "Cinematic outbox sweeper loop started (interval=%.1fs, queue=%s).",
            self.interval_seconds,
            sanitize_queue_url(self.queue_publish_url),
        )
        while not self._shutdown_event.is_set():
            try:
                await self.sweep_once()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("Unhandled error in cinematic outbox sweeper: %s", exc, exc_info=True)

            try:
                await asyncio.wait_for(self._shutdown_event.wait(), timeout=self.interval_seconds)
                break
            except asyncio.TimeoutError:
                pass
            except asyncio.CancelledError:
                break

        logger.info("Cinematic outbox sweeper loop stopped cleanly.")

    def start(self) -> asyncio.Task:
        """Start the background sweeper task if not already running."""
        if self._task is None or self._task.done():
            self._shutdown_event.clear()
            self._task = asyncio.create_task(self._run_loop())
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


_sweeper_singleton: Optional[CinematicOutboxSweeper] = None


def get_outbox_sweeper() -> CinematicOutboxSweeper:
    global _sweeper_singleton
    if _sweeper_singleton is None:
        _sweeper_singleton = CinematicOutboxSweeper()
    return _sweeper_singleton
