# PRAROHA Phase 52 — TASK-52-10: Transactional Outbox and Queue Dispatch Summary

**Execution Date:** 2026-10-23  
**Status:** Completed & Locally Verified  
**Parent Plan:** `.planning/phases/52-queue-based-cinematic-rendering/52-01-PLAN.md`  
**Reference Commit:** `537f446` (TASK-52-09 completion)  

---

## 1. Executive Summary

`TASK-52-10` implements reliable backend dispatch for cinematic rendering in `CinematicDispatcherService` (`backend/app/services/cinematic_dispatcher.py`), adhering to the **Transactional Outbox Pattern** and decoupling the PostgreSQL database transaction from the Azure Storage Queue network boundary.

All operations execute with least privilege using the backend's scoped Add-only SAS URL (`QUEUE_PUBLISH_URL`). Feature flags remain strictly disabled (`CINEMATIC_PREVIEW_ENABLED=False`, `VITE_ENABLE_CINEMATIC_PREVIEW=false`), and zero real queue messages or renders were triggered.

---

## 2. Key Implementations

### A. Configuration & Least-Privilege Enqueue URL
- Added `QUEUE_PUBLISH_URL: Optional[str] = None` to `Settings` in `backend/app/config.py`.
- Enforces URL validation via `validate_queue_url`:
  - Must use `https://`.
  - Must target `/cinematic-render-jobs`.
  - Rejects plain HTTP or target queues other than `cinematic-render-jobs`.
- If `QUEUE_PUBLISH_URL` is omitted, `CinematicDispatcherService.dispatch_scene_preview` raises HTTP 503 (`Cinematic preview queue dispatch is not configured. Missing QUEUE_PUBLISH_URL setting.`) rather than falsely claiming success.

### B. Secret-Free Canonical Queue Payload
- Payload built according to `queue_message_schema.json`:
  ```json
  {
    "schema_version": "1.0",
    "job_id": "<job-uuid>",
    "project_id": "<project-uuid>",
    "entity_type": "scene",
    "entity_id": "<scene-id>",
    "request_hash": "<sha256-hash>",
    "options": {
      "aspect_ratio": "16:9",
      "duration_sec": 5.0,
      "include_audio": true,
      "style": "cinematic"
    },
    "enqueued_at": "2026-10-23T05:30:00Z",
    "attempt": 1
  }
  ```
- Payload strictly checked via `assert_no_secrets_in_payload`:
  - Scans keys and values for API keys, passwords, SAS signatures (`sig=`), connection strings, tokens, and database URLs.
  - Excludes all internal tokens or credentials.

### C. Transactional Outbox Pattern
1. **Atomic Persistence in PostgreSQL**:
   - Within a single DB transaction (`repo.session`), persists:
     - `MediaAssetRecord` (`status="queued"`, with `request_hash` and `spec_json`).
     - `GenerationJob` (`status="queued"`, `job_type="media_video"`, `progress=0`).
     - `RenderOutbox` (`status="pending"`, `attempt_count=0`, `payload=queue_payload`).
   - If an `IntegrityError` occurs (e.g. duplicate request hash):
     - The transaction rolls back cleanly.
     - If the existing job is in progress or completed, returns the existing job idempotently.
2. **Network Queue Publish Outside Transaction**:
   - The database transaction commits **before** any network call to Azure Storage Queue.
   - Database transactions are never held open during queue publish calls.
   - Message is sent using `QueueClient.from_queue_url(self.queue_publish_url)` via non-blocking worker thread.
3. **Outcome Handling**:
   - **Success**:
     - `repo.update_render_outbox_status(job_id, status="published", published_at=now())`.
     - Returns HTTP 202 `MediaJobResponse(job_id=..., status="queued", ...)`.
   - **Failure**:
     - `RenderOutbox` record is **preserved in `pending` status** with sanitized error message (`last_error`) and incremented `attempt_count` for recovery by TASK-52-11 (outbox sweeper).
     - Does **not** delete the outbox record.
     - Does **not** falsely mark the job as queued.
     - Raises HTTP 502 with sanitized error details.

### D. Sanitized Logging and Error Messages
- `sanitize_queue_url`: Strips SAS query parameters (`?sig=...`, `se=...`, `sp=...`) before logging or displaying queue URLs.
- `sanitize_error_message`: Redacts SAS query strings, bearer tokens, and credentials from exception messages before recording to database or returning to clients.

---

## 3. Test Matrix & Validation Results

### Dedicated Test Suite: `backend/tests/test_cinematic_queue_dispatch.py`
| Test Case | Description | Result |
| :--- | :--- | :--- |
| `test_dispatch_valid_schema_compliant_payload` | Confirms atomic commit of asset, job, outbox; sends schema-compliant payload; marks outbox published; returns 202. | **PASS** |
| `test_dispatch_missing_queue_configuration` | Confirms HTTP 503 error when `QUEUE_PUBLISH_URL` is unset or blank without DB mutations. | **PASS** |
| `test_dispatch_invalid_queue_url_validation` | Confirms HTTP 500 when queue URL is non-HTTPS or targets an invalid queue name. | **PASS** |
| `test_dispatch_azure_enqueue_failure_preserves_pending_outbox` | Confirms that on Azure queue failure, outbox record is preserved with `status='pending'`, `attempt_count=1`, sanitized error, and API returns HTTP 502. | **PASS** |
| `test_sanitize_url_and_error_helpers` | Unit verification of URL and error sanitizers to guarantee zero credential/SAS leakage in logs. | **PASS** |
| `test_dispatch_idempotency_and_duplicate_suppression` | Confirms repeated requests with identical hashes return the existing job and suppress duplicate outbox records. | **PASS** |
| `test_database_transaction_failure_rollback` | Confirms database transaction rollback on simulated constraint failure with no orphaned outbox rows. | **PASS** |
| `test_api_route_authorization_and_feature_flag` | Confirms existing auth/ownership checks and feature flag guard (`CINEMATIC_PREVIEW_ENABLED=False` -> HTTP 403). | **PASS** |

### Phase 52 Combined Test Suite: 47 passed in 3.87s
- `backend/tests/test_render_outbox_migration.py` (7 tests pass)
- `backend/tests/test_cinematic_queue_worker.py` (20 tests pass)
- `backend/tests/test_cinematic_queue_dispatch.py` (8 tests pass)
- `backend/tests/test_cinematic_production_dispatch.py` (12 tests pass)

### Full Backend Regression Battery: 295 passed, 1 skipped in 32.73s
All 296 unit/integration tests across the entire backend passed with zero regressions.

---

## 4. Strict Boundaries & Deployment Prerequisites

### Strict Operational Boundaries Adhered To
1. **Local Implementation Only**: No live Azure deployments or container revision updates performed.
2. **Production DB Untouched**: `0001_create_render_outbox.sql` has **not** been applied to production Supabase.
3. **No Real Messages Sent**: Tested strictly with mocked/isolated queue clients.
4. **No Renders Triggered**: `praroha-render-job` remains at 0 executions.
5. **Feature Guards Preserved**:
   - Backend: `CINEMATIC_PREVIEW_ENABLED=False`
   - Frontend: `VITE_ENABLE_CINEMATIC_PREVIEW=false`

### Prerequisites for Production Rollout
Before enabling cinematic dispatch in production during Wave 4:
1. Apply `backend/migrations/0001_create_render_outbox.sql` to production Supabase database.
2. Bind ACA secret `queue-publish-url` (generated in TASK-52-04) to the backend environment variable `QUEUE_PUBLISH_URL` on `praroha-backend`.
3. Complete TASK-52-11 (background outbox sweeper and orphan recovery).

---

## 5. Next Task

**TASK-52-11: Outbox Sweeper & Stale Lease Recovery**
- Implement background outbox sweeper (polling every 30s) to retry unpublished outbox records with exponential backoff (up to 5 retries).
- Update `recover_orphaned_jobs()` in `backend/app/repositories/project_repo.py`:
  - Stale lease recovery: check `updated_at < now() - INTERVAL '90 seconds'` for jobs with `status == 'processing'` (never fail actively running renders with valid heartbeats).
  - Clear `request_hash = NULL` on truly failed/interrupted jobs so creators can retry without collision.
