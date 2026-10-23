# PRAROHA Phase 52 — TASK-52-11: Outbox Sweeper and Safe Job Recovery Summary

**Execution Date:** 2026-10-23  
**Status:** Completed & Verified  
**Parent Plan:** `.planning/phases/52-queue-based-cinematic-rendering/52-01-PLAN.md`  
**Reference Commit:** `ba9bb29` (TASK-52-10 completion)  

---

## 1. Executive Summary

`TASK-52-11` completes Wave 3 of Phase 52 by implementing a lifecycle-managed background **Outbox Sweeper** (`CinematicOutboxSweeper`) and hardening **Orphaned Job Recovery** (`recover_orphaned_jobs`) in `backend/app/repositories/project_repo.py`.

Before implementing recovery, the canonical queue contract between the dispatcher, schema, worker validator, and documentation was audited and reconciled. All operations use concurrency-safe atomic CAS leasing, bounded exponential backoff (max 5 attempts), worker heartbeat protection (90s lease), and clean creator retry enablement by clearing `request_hash = NULL` on genuinely failed jobs.

All feature flags remain disabled (`CINEMATIC_PREVIEW_ENABLED=False`, `VITE_ENABLE_CINEMATIC_PREVIEW=false`), and zero real queue messages or renders were triggered.

---

## 2. Key Implementations

### A. Canonical Schema Alignment & Validation
- **Reconciliation**:
  - Aligned options in `CinematicPreviewJobRequest`, `CinematicDispatcherService`, and `queue_message_schema.json`:
    - `duration_seconds`: integer 3–60 (clamped).
    - `fps`: 24 or 30 (default 24).
    - `resolution`: `"1280x720"` or `"1920x1080"` (default `"1280x720"`).
    - `aspect_ratio`: `"16:9"`, `"1:1"`, or `"9:16"` (default `"16:9"`).
    - `motion_preset`: `"slow_pan"`, `"zoom_in"`, or `"static"` (default `"slow_pan"`).
    - `additionalProperties: false`.
  - The dispatcher now directly executes `validate_queue_message_dict(queue_payload)` before atomic persistence, ensuring that every stored outbox payload is pre-validated against the worker's strict schema rules.
  - Added dedicated regression test `test_dispatcher_payload_conforms_to_canonical_schema_and_worker_validator`.

### B. Periodic Outbox Sweeper (`CinematicOutboxSweeper`)
- Implemented in `backend/app/services/cinematic_outbox_sweeper.py`.
- **FastAPI Lifespan Integration**:
  - Started during application startup in `backend/app/main.py`.
  - Gracefully stopped during application shutdown (`await sweeper.stop()`) using `asyncio.Event` and task cancellation, preventing background task leaks.
- **Concurrency-Safe Atomic CAS Leasing**:
  - `claim_eligible_outbox_records` uses compare-and-swap on `claimed_at` with a 60-second lease window.
  - Multiple backend instances or concurrent sweeper iterations cannot claim or dispatch the same outbox record simultaneously.
- **Bounded Exponential Backoff**:
  - Failed attempts increment `attempt_count` and record sanitized diagnostics.
  - Backoff delay: $\min(300, 30 \times 2^{\text{attempt} - 1})$ seconds.
  - Eligible records require `updated_at <= now - backoff_seconds`.
- **Terminal State Transition**:
  - After 5 attempts, records transition to terminal `status = 'failed'` via `mark_terminal_outbox_failure`.
  - Atomically marks the associated `GenerationJob` and `MediaAssetRecord` as `failed`.
  - Clears `request_hash = None` so creators can retry without collision.
- **Missing Queue URL Protection**:
  - If `QUEUE_PUBLISH_URL` is omitted, the sweeper cleanly skips the cycle without marking records as published or spinning in a tight loop.
- **Crash-After-Enqueue Idempotency**:
  - If Azure Queue accepts a message but the server crashes before updating the outbox status to `published`, the duplicate message delivered on restart is safely discarded by the worker's atomic DB CAS claim (`WHERE status = 'queued'`).

### C. Hardened Orphaned Job Recovery (`recover_orphaned_jobs`)
- Updated in `backend/app/repositories/project_repo.py`:
  1. **Worker Heartbeat Protection**:
     - For queue-managed jobs in `processing` status, checks `updated_at < now - 90s`.
     - Active renders with fresh heartbeats (<90s) are **never failed** on server restart.
  2. **Queued Job Protection**:
     - Queued jobs with `pending` outbox records are **preserved** for sweeper dispatch.
     - Queued jobs with `published` outbox records are only failed if queued for more than 15 minutes (`created_at < now - 15m`).
     - Queued jobs whose outbox reached terminal `failed` status are marked `failed`.
  3. **Clean Retry Enablement**:
     - Whenever a job is marked `failed` by recovery, the associated `MediaAssetRecord.request_hash` is cleared to `None`.
  4. **In-Process Job Handling**:
     - Legacy in-process jobs without outbox records are marked `failed` on server restart with `"Generation task interrupted by server restart."`

---

## 3. Test Verification & Results

### Dedicated Test Suite: `backend/tests/test_cinematic_outbox_sweeper.py`
All 9 automated tests passed:
- `test_dispatcher_payload_conforms_to_canonical_schema_and_worker_validator`: Confirms dispatcher-produced payloads pass both JSON schema and worker `validate_queue_message_dict`.
- `test_concurrency_safe_lease_claiming`: Confirms two sweeper iterations cannot claim the same record concurrently.
- `test_sweeper_successful_publication_updates_status`: Confirms status transitions to `published`, sets `published_at`, and releases claim.
- `test_sweeper_failure_preserves_pending_record_with_backoff`: Confirms failed enqueue preserves record in `pending` status, increments attempt count, sanitizes error, and releases claim.
- `test_sweeper_retry_exhaustion_transitions_to_terminal_failed`: Confirms 5 failed attempts transition to terminal `failed`, fail associated job/asset, and clear `request_hash`.
- `test_crash_after_enqueue_safe_against_duplicate_rendering`: Confirms duplicate queue messages resulting from a crash-after-enqueue are discarded by worker's atomic claim.
- `test_missing_queue_config_does_not_falsely_publish_or_spin`: Confirms sweeper skips sweep safely when `QUEUE_PUBLISH_URL` is unset.
- `test_recover_orphaned_jobs_hardened_lifecycle`: Confirms fresh heartbeats (<90s) protect renders, stale jobs (>90s) are failed, pending outbox queued jobs are preserved, recent published jobs (<15m) are preserved, old published jobs (>15m) are timed out, and `request_hash` is cleared.
- `test_sweeper_task_lifecycle_clean_shutdown`: Confirms clean task start and graceful shutdown without task leakage.

### Phase 52 Combined Test Suite: 56 passed in 4.37s
- `test_render_outbox_migration.py` (7 tests pass)
- `test_cinematic_queue_worker.py` (20 tests pass)
- `test_cinematic_queue_dispatch.py` (8 tests pass)
- `test_cinematic_production_dispatch.py` (12 tests pass)
- `test_cinematic_outbox_sweeper.py` (9 tests pass)

### Complete Backend Regression Battery: 304 passed, 1 skipped in 32.07s
All 305 tests across the entire backend repository passed with zero regressions.

---

## 4. Strict Boundaries & Safety Preserved

- **No Live DB Alterations**: `0001_create_render_outbox.sql` remains unapplied to production Supabase.
- **No Secret Alterations**: `QUEUE_PUBLISH_URL` is not bound to live Azure Container Apps.
- **No Live Messages or Renders**: Zero real Azure Storage Queue messages sent; zero Container Apps Job executions triggered.
- **Feature Flags Kept Disabled**:
  - Backend: `CINEMATIC_PREVIEW_ENABLED=False`
  - Frontend: `VITE_ENABLE_CINEMATIC_PREVIEW=false`

---

## 5. Prerequisites for Eventual Production Rollout

Before authorizing real cloud rendering in Wave 4:
1. **Schema Migration**: Apply `backend/migrations/0001_create_render_outbox.sql` to the production Supabase PostgreSQL instance.
2. **Secret Binding**: Bind the backend secret `queue-publish-url` (created in TASK-52-04) to the `QUEUE_PUBLISH_URL` environment variable on `praroha-backend`.
3. **Backend Deployment**: Deploy a new container revision of `praroha-backend` containing the outbox dispatcher, sweeper, and hardened recovery services.
4. **Canary Render Authorization**: Separately authorize a single synthetic canary render (TASK-52-12) to verify end-to-end MP4 generation and Supabase Storage upload before enabling public feature flags.

---

## 6. Exact Next Task

**`TASK-52-12`: Synthetic Canary Render (Wave 4: Verification & Safe Rollback Validation)**
- Execute synthetic canary render using canonical demo seed assets.
- Verify MP4 playback, storage upload, metadata honesty (`is_synthetic: true`, `provider_label: "Cinematic Preview"`), and queue message deletion.
