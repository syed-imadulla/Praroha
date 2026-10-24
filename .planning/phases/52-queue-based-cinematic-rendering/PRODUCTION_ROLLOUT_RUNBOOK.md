# PRAROHA Phase 52 — Production Rollout Runbook & Safe Rollback Protocol

**Target Milestone:** Milestone 7: Dedicated Cinematic Rendering Worker
**Target Phase:** Phase 52: Queue-Based Cinematic Rendering Architecture
**Authoritative Plan Reference:** [.planning/phases/52-queue-based-cinematic-rendering/52-01-PLAN.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/phases/52-queue-based-cinematic-rendering/52-01-PLAN.md)
**Security & Integrity Mandate:** Zero secret leakage, zero data loss, zero indiscriminate queue clearing, and zero premature production changes.

---

## 1. Operating Philosophy & Classification

All operations in this runbook are strictly gated and categorized into three explicit safety classes:

- **`[READ-ONLY]`**: Inspects state, queries health endpoints, peeks queues, or verifies logs. Carries **zero** risk of modifying production state.
- **`[PROD-CHANGING]`**: Modifies database schema, builds/deploys container images, or sets container environment variables. Requires explicit operator authorization.
- **`[RENDER-TRIGGERING]`**: Dispatches a message or launches an execution that consumes cloud GPU/CPU compute or invokes rendering. Requires separate, explicit canary authorization.

### Fundamental Non-Destructive Guarantees
1. **Never drop tables during operational rollback**: `render_outbox` must NEVER be dropped with `CASCADE` (or at all) as part of an operational rollback. Preserving `render_outbox` protects request traceability and audit lineage.
2. **Never clear queues indiscriminately**: `az storage message clear` is prohibited during operational rollback. Messages represent user or test requests; they must be inspected and cleanly transitioned in the database.
3. **Preserve completed renders**: Any successful MP4 asset or completed `generation_jobs` record must remain untouched.
4. **Reconcile pending/interrupted work**: When halting service, in-flight work must be gracefully cancelled in PostgreSQL, and `request_hash` must be set to `NULL` on affected `media_assets` so creators can retry without collision.

---

## 2. Authoritative Current Production State

As of the latest verified canary execution (2026-10-24 15:24 UTC):

- **Production backend:** `v7.3` (`tendersaathiacr.azurecr.io/praroha-backend:v7.3`, digest `sha256:74c0f103d0894ac931675c99dafdb273414af0c04cd781ed8675ba2ac44b0e1f`, revision `praroha-backend--latest`, status `Running`, `provisioningState: Succeeded`, healthy on `/api/health`).
- **Queue-publisher environment binding:** **BOUND** (`QUEUE_PUBLISH_URL=secretref:queue-publish-url`).
- **Database initialization:** Production schema validated via `validate_production_schema()` with **ZERO DDL**. PostgreSQL connection confirmed (`fallback_used: false`). No SQLite fallback, no crash loop, no import errors.
- **Production `render_outbox`:** exists in Supabase (`public.render_outbox` with 11 columns, 5 constraints, 3 indexes; exactly 1 record present: Job ID `0d9c2349-6eed-4686-b148-5f8f5d84c17f`, status `published`, `published_at: 2026-10-24T15:23:31Z`).
- **Both cinematic-preview feature flags:** disabled (backend `CINEMATIC_PREVIEW_ENABLED=False` unset/default false; frontend `VITE_ENABLE_CINEMATIC_PREVIEW` unset/falsy).
- **Both queues:** empty (`cinematic-render-jobs`: 0 messages, drained by worker; `cinematic-render-poison`: 0 messages; confirmed via fresh read-only peek).
- **Worker compute:** `praroha-render-job` provisioned in `env-praroha-render` with `praroha-worker:v6`, zero ingress (`ingress: null`). Exactly 1 historical execution (`praroha-render-job-rsjqv`, status `Succeeded`, 55s duration), 0 active executions (scale-to-zero verified).
- **Canary:** **EXECUTED ONCE** (Job ID `0d9c2349-6eed-4686-b148-5f8f5d84c17f`). Playable 6.0-second H.264 MP4 stored in Supabase Storage (`124,558` bytes, 1280x720).
- **FPS Acceptance Audit:** First canary output measured 25.0 FPS (150 frames / 6.0s) due to hardcoded FFmpeg filter graph constant in worker v6. Root cause resolved in candidate image `praroha-worker:v7` (`sha256:1df95b35a48cda4d77debb607ea0ff8a43ccf51244f9a44a0aa0ad3a11243b06`, built locally, unpushed, undeployed).
- **Azure Billing Reconciliation:** **Pending until actual cost data becomes available**. Consumption API reports `pretaxCost: None` for the current cycle.
- **Phase Gate E (Isolated Resilience Testing):** **EXECUTED & 100% PASSED** (9/9 resilience scenarios passed; 341 passed in full backend suite; zero production mutations).
- **Next required authorization:** Phase Gate F (Frontend / Backend Feature Flag Enablement — Awaiting Operator Authorization).

| Component | Target Resource | Live Audited State | Status |
| :--- | :--- | :--- | :--- |
| **Supabase DB Schema** | `stxnxkzaftmwcbtvgzbm.supabase.co` | `public.render_outbox` present; 1 row (`published`). `generation_jobs` & `media_assets` canary rows marked `completed`. | **MIGRATED & AUDITED** (Phase Gate A Complete) |
| **Backend Container** | `praroha-backend` (in `env-tendersaathi`) | Image: `tendersaathiacr.azurecr.io/praroha-backend:v7.3`. Digest: `sha256:74c0f103d0894ac931675c99dafdb273414af0c04cd781ed8675ba2ac44b0e1f`. Revision: `praroha-backend--latest` (`Running`, `Healthy`). | **DEPLOYED & HEALTHY** (Phase Gate B & C Complete) |
| **Queue Secret Binding** | `praroha-backend` secrets store | `QUEUE_PUBLISH_URL` bound securely to `secretref:queue-publish-url`. | **BOUND & VERIFIED** (Phase Gate B Complete) |
| **ACA Job Provisioning** | `praroha-render-job` (in `env-praroha-render`) | Provisioned with image `praroha-worker:v6`. Exactly 1 execution completed (`Succeeded`), currently 0 active executions. | Scale-to-zero active |
| **Azure Queue Depths** | `stpraroharender` | `cinematic-render-jobs`: 0 messages (drained by worker).<br>`cinematic-render-poison`: 0 messages. | Clean queue baseline verified |
| **Backend Feature Flag** | `praroha-backend` runtime | `CINEMATIC_PREVIEW_ENABLED=False` (default code setting, unset in env). | Verified disabled |
| **Frontend Feature Flag** | Production bundle (`dist/`) | `VITE_ENABLE_CINEMATIC_PREVIEW` unset (evaluates to falsy in UI). | Verified disabled |
| **Resilience Battery** | Isolated SQLite / Mock Queues | 9/9 resilience scenarios verified across Scenarios A, B, C, and D. | **100% PASSED** (Phase Gate E Complete) |
| **Test Battery & Build** | Local repo | 341 passed (2 skipped) in `pytest backend/tests/`. `git diff --check` clean. | Verified 100% green |

---

## 3. Non-Destructive Deployment Checklist

### Phase Gate A: Database Schema Migration
*Prerequisite: Explicit operator approval to apply DDL to Supabase.*

- [x] **Step A1 `[READ-ONLY]`**: Re-verify `render_outbox` absence:
  - Confirmed via asyncpg and REST probe (`PGRST205` / `to_regclass = None`). *(Completed 2026-10-23)*

- [x] **Step A2 `[READ-ONLY]`**: Verified Column Type Compatibility:
  - *Empirical Verification*: Queried PostgREST OpenAPI schema definition directly from live Supabase:
    - `projects.id`: `{"format": "character varying", "type": "string"}` (unbounded `VARCHAR`)
    - `generation_jobs.id`: `{"format": "character varying", "type": "string"}` (unbounded `VARCHAR`)
    - `media_assets.id`: `{"format": "character varying", "type": "string"}` (unbounded `VARCHAR`)
  - *PostgreSQL Type Compatibility*: Both referenced columns are `character varying` (OID 1043). The proposed foreign keys in [backend/migrations/0001_create_render_outbox.sql](file:///home/syed-imadulla/Desktop/Praroha/backend/migrations/0001_create_render_outbox.sql) declare `project_id VARCHAR(64)` and `job_id VARCHAR(64)`. Both share the exact same underlying PostgreSQL type category (`character varying`). Because all PRAROHA identifiers are 36-character UUID strings (well within 64 characters), this is type-compatible. *(Completed 2026-10-23)*

- [x] **Step A3 `[PROD-CHANGING]`**: Apply [backend/migrations/0001_create_render_outbox.sql](file:///home/syed-imadulla/Desktop/Praroha/backend/migrations/0001_create_render_outbox.sql) in production Supabase:
  - Applied atomically in transaction using authorized database pooler connection (`postgres.stxnxkzaftmwcbtvgzbm`).
  - Zero application downtime; zero changes to existing records. *(Completed 2026-10-23)*

- [x] **Step A4 `[READ-ONLY]`**: Verify migration success:
  - `to_regclass('public.render_outbox')` confirmed present.
  - REST query `GET /rest/v1/render_outbox?limit=1` returns HTTP 200 with `[]`.
  - All 11 columns, 5 constraints (PK, 2 FKs, unique, status check), and 3 indexes verified.
  - Baselines preserved: `projects` (381), `generation_jobs` (492), `media_assets` (282). *(Completed 2026-10-23)*

---

### Phase Gate B: Backend Container Build & Deployment History
*Historical Record of v7/v7.1 deployments, incident containment, hardening, and Candidate v7.3 release gate:*

- [x] **Step B1 `[PROD-CHANGING-HISTORICAL]`**: Build backend image `v7` via Azure Container Registry:
  - `az acr build` returned `TasksOperationsNotAllowed` (Azure for Students subscription does not permit remote ACR Tasks).
  - Built locally using BuildKit with OCI container manifest (`docker build --load -f Dockerfile.backend -t tendersaathiacr.azurecr.io/praroha-backend:v7 .`).
  - Authenticated via `az acr login -n tendersaathiacr` and pushed to ACR.
  - Published Image Tags: `praroha-backend:v7` and `praroha-backend:v7.0`.
  - Image Digest: `sha256:4b180a7f78f832412ecfdedbdd3e343c5654ba08cea545191d5443afa8440b5d` *(Recorded 2026-10-23)*.
- [!] **Step B2 `[INCIDENT-HISTORICAL]`**: Update `praroha-backend` container app & Startup Crash on v7.0:
  - Deployed image `tendersaathiacr.azurecr.io/praroha-backend:v7.0` and bound `QUEUE_PUBLISH_URL=secretref:queue-publish-url`.
  - Azure Container Apps provisioning succeeded (`provisioningState: Succeeded`).
  - Container entered `CrashLoopBackOff` on boot.
  - **Diagnostic Root Cause**: Log Analytics query revealed `ModuleNotFoundError: No module named 'psutil'` in `backend/app/main.py` -> `routers/media.py` -> `services/cinematic_dispatcher.py` -> `workers/cinematic_worker.py:35` (`import psutil`). `psutil` is listed in `requirements-worker.txt` for the worker, but was not in `backend/requirements.txt` for the backend app.
- [x] **Step B3 `[ROLLBACK-EXECUTED-HISTORICAL]`**: Execute Rollback Level 1 to v6:
  - Immediate non-destructive rollback executed:
    ```bash
    az containerapp update \
      --name praroha-backend \
      --resource-group rg-tendersaathi \
      --image tendersaathiacr.azurecr.io/praroha-backend:v6 \
      --remove-env-vars QUEUE_PUBLISH_URL
    ```
- [x] **Step B4 `[PROD-DEPLOYED-HISTORICAL]`**: Build and Deploy Candidate `v7.1` (Superseded):
  - Extracted pure `backend/app/services/queue_contract.py` removing `psutil` dependency boundary.
  - Validated local container boot and clean dependency imports inside built container.
  - Published immutable image `tendersaathiacr.azurecr.io/praroha-backend:v7.1`.
  - Image Digest: `sha256:ecc6751d1bd93fa0d02bfd69b762d24ea268c1604788e8702a5954bad2535744`.
  - Operator approved Gate 2 deployment:
    ```bash
    az containerapp update \
      --name praroha-backend \
      --resource-group rg-tendersaathi \
      --image tendersaathiacr.azurecr.io/praroha-backend:v7.1 \
      --set-env-vars QUEUE_PUBLISH_URL=secretref:queue-publish-url
    ```
- [!] **Step B5 `[INCIDENT-HISTORICAL]`**: Database Fallback Incident on v7.1 Startup:
  - During v7.1 startup, `project_repo._migrate_columns()` executed: `ALTER TABLE characters ADD COLUMN is_stale BOOLEAN DEFAULT 0;`.
  - PostgreSQL rejected integer default `0` for `BOOLEAN` column (`DatatypeMismatch`), aborting the transaction.
  - An overly permissive `except Exception` caught the error and triggered a legacy fallback to local SQLite (`/app/seed_unfold.db`).
- [x] **Step B6 `[ROLLBACK-EXECUTED-CONTAINED]`**: Immediate Rollback to v6 & Containment:
  - Reverted production container app `praroha-backend` to `tendersaathiacr.azurecr.io/praroha-backend:v6`.
  - Removed `QUEUE_PUBLISH_URL` environment variable binding from `praroha-backend`.
  - Telemetry audit: exactly 0 writes occurred during brief v7.1 runtime; zero data lost. Both queues remained at 0 messages.
- [x] **Step B7 `[PREPARED-IN-ACR]`**: Database Safety Hardening & Candidate `v7.3` Release Gate:
  - Fail-closed initialization implemented (`RuntimeError` on DB init failure; silent SQLite fallback completely eliminated in production).
  - Strict separation of concerns: production runtime startup only validates schema (`validate_production_schema()`) with **ZERO DDL** statements; automatic migrations disabled (`ALLOW_PRODUCTION_DB_MIGRATIONS=False`).
  - Built and verified candidate `v7.3` locally in an isolated PostgreSQL container (`testdb`):
    - Unmigrated DB: cleanly refused startup with exit code 3 (`RuntimeError`).
    - Explicit migration: `run_migrations()` succeeded with `ALLOW_PRODUCTION_DB_MIGRATIONS=True`.
    - Migrated DB: normal startup validated schema with zero DDL; `/api/health` returned HTTP 200.
  - Published immutable candidate image `tendersaathiacr.azurecr.io/praroha-backend:v7.3` to ACR.
  - Expected & Verified Digest: `sha256:74c0f103d0894ac931675c99dafdb273414af0c04cd781ed8675ba2ac44b0e1f`.
- [x] **Step B8 `[PROD-DEPLOYED]`**: Operator-Authorized Deployment of Candidate `v7.3` (2026-10-23):
  - Operator explicitly authorized deploying `v7.3` and binding `QUEUE_PUBLISH_URL`.
  - All preflight prerequisites verified read-only before deployment:
    - Production on `v6`, ACR digest `sha256:74c0f103...` exact match, `render_outbox` exists with 0 rows, both queues empty, 0 job executions, both feature flags disabled, secret reference `queue-publish-url` provisioned.
  - Executed:
    ```bash
    az containerapp update \
      --name praroha-backend \
      --resource-group rg-tendersaathi \
      --image tendersaathiacr.azurecr.io/praroha-backend:v7.3 \
      --set-env-vars QUEUE_PUBLISH_URL=secretref:queue-publish-url
    ```
  - Deployment result: `provisioningState: Succeeded`, `runningStatus: Running`.
  - `QUEUE_PUBLISH_URL` bound via `secretref:queue-publish-url` (secret value never printed or logged).
  - **Status: DEPLOYED & HEALTHY. Phase Gate C verification follows.**

---

### Phase Gate C: Post-Deployment Health & Infrastructure Audit (v7.3)
*Prerequisite: Phase Gate B step B8 deployed. All checks verified 2026-10-23.*

- [x] **Step C1 `[READ-ONLY]`**: Verify backend API health:
  ```bash
  curl -fsS -i https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io/api/health
  ```
  *Result*: HTTP/2 200 OK, `{"success": true, "data": {"status": "healthy", "service": "PRAROHA — Seed to Universe", "environment": "production"}, "fallback_used": false}`.
- [x] **Step C2 `[READ-ONLY]`**: Verify PostgreSQL connection & production schema validation:
  - `init_db()` called at `main.py:34` during FastAPI lifespan, before uvicorn's `Application startup complete`.
  - In production mode, `init_db()` executes `validate_production_schema()` with **ZERO DDL** and raises `RuntimeError` on any failure (line 456–460 of `project_repo.py`).
  - Log Analytics confirmed clean startup: `INFO: Waiting for application startup.` (13:10:16Z) → `INFO: Application startup complete.` (13:10:23Z) → `INFO: Uvicorn running on http://0.0.0.0:8000` (13:10:23Z). Startup took ~7s consistent with PostgreSQL connection + schema validation.
  - Zero log entries matching: `error`, `ERROR`, `SQLite`, `sqlite`, `fallback`, `RuntimeError`, `Traceback`, `CrashLoop`, `database`, `schema`, `migration`, `sweeper` (comprehensive keyword search across 15-minute window).
  - Health response confirms `"fallback_used": false` — no SQLite fallback triggered.
  - **Conclusion**: PostgreSQL connected, production schema validated with zero DDL, no silent fallback.
- [x] **Step C3 `[READ-ONLY]`**: Verify database outbox state:
  - Supabase REST API query: `GET /rest/v1/render_outbox` → HTTP 200, `Content-Range: */0`. Exactly 0 rows, 0 pending rows.
- [x] **Step C4 `[READ-ONLY]`**: Verify queue baseline & zero worker activity:
  - `cinematic-render-jobs`: 0 messages (`[]` via `az storage message peek`).
  - `cinematic-render-poison`: 0 messages (`[]`).
  - `praroha-render-job` execution history: `[]` (0 executions).
- [x] **Step C5 `[READ-ONLY]`**: Verify feature flag status:
  - Backend `CINEMATIC_PREVIEW_ENABLED`: not present in container env vars (defaults to `False`).
  - Frontend `VITE_ENABLE_CINEMATIC_PREVIEW`: not present (falsy).
  - `QUEUE_PUBLISH_URL`: present and bound to `secretref:queue-publish-url` (value never exposed).
- [x] **Step C6 `[READ-ONLY]`**: Verify running image matches approved digest:
  - `az containerapp show` confirms `image: tendersaathiacr.azurecr.io/praroha-backend:v7.3`.
  - ACR manifest confirms tag `v7.3` → digest `sha256:74c0f103d0894ac931675c99dafdb273414af0c04cd781ed8675ba2ac44b0e1f` (exact match).

---

### Phase Gate D: Authorized Synthetic Canary Render
*Prerequisite: Phase Gates A, B, and C verified. SEPARATE EXPLICIT OPERATOR APPROVAL REQUIRED.*

- [ ] **Step D1 `[RENDER-TRIGGERING]`**: Dispatch exactly one synthetic render job:
  - **Tooling**: Standalone operator CLI `backend/scripts/run_canary_dispatch.py` (commit `fbfe02b`).
  - **Dry-Run Audit Command** (zero mutations, verifies all 8 preflights):
    ```bash
    python -m backend.scripts.run_canary_dispatch --fetch-azure-sas
    ```
  - **Authorized Canary Execution Command** (requires explicit confirmation flag):
    ```bash
    python -m backend.scripts.run_canary_dispatch --fetch-azure-sas --confirm-production-canary
    ```
  - **Expected Observations**:
    1. Preflight audit reports all 8 checks passed (health, image v7.3, empty outbox, empty queues, 0 executions, disabled flags, verified demo seed, worker contract compatibility).
    2. Selected project is `"The Sunken City: Bio-City"` with verified keyframe image.
    3. Exactly 1 `MediaAssetRecord`, 1 `GenerationJob`, and 1 `RenderOutbox` created atomically in PostgreSQL.
    4. Outbox payload published to Azure Storage Queue `cinematic-render-jobs` outside DB transaction.
    5. `RenderOutbox` transitions to `status = 'published'` with `published_at` timestamp.
- [ ] **Step D2 `[READ-ONLY]`**: Monitor event-driven worker execution:
  - Monitor with:
    ```bash
    az containerapp job execution list --name praroha-render-job --resource-group rg-tendersaathi -o table
    ```
  - Observe `praroha-render-job` KEDA scaler triggers from 0 to 1 execution (`Running`).
  - Worker claims job via atomic CAS (`UPDATE generation_jobs SET status = 'processing' WHERE id = :id AND status = 'queued'`).
  - Worker maintains 15s heartbeat visibility updates.
  - Synthetic video renders cleanly (6.0s duration, 1280x720, 24fps, H.264).
  - Worker uploads MP4 to Supabase Storage bucket `seed-unfold-assets`.
  - Generation job finalizes to `status = 'completed'` with `progress = 100`.
  - Media asset record finalizes to `status = 'completed'` with `is_synthetic: true` and `provider_label: "Cinematic Preview"`.
  - Queue message is deleted from `cinematic-render-jobs` upon verified completion.
- [ ] **Step D3 `[READ-ONLY]`**: Verify clean drain and poison queue:
  - Peek queues:
    ```bash
    ACCOUNT_KEY=$(az storage account keys list --account-name stpraroharender --resource-group rg-tendersaathi --query "[0].value" -o tsv)
    az storage message peek --queue-name cinematic-render-jobs --account-name stpraroharender --account-key "$ACCOUNT_KEY" -o json
    az storage message peek --queue-name cinematic-render-poison --account-name stpraroharender --account-key "$ACCOUNT_KEY" -o json
    unset ACCOUNT_KEY
    ```
  - `cinematic-render-jobs` message count == 0.
  - `cinematic-render-poison` message count == 0.
  - `praroha-render-job` execution exits with code 0 (`Succeeded`) and scales back to 0 active executions.
  - MP4 asset playback verified in Supabase Storage.

---

## 4. Safe, Non-Destructive Rollback Protocol

If an anomaly, dispatch exception, worker failure, or unexpected cost alert occurs at any stage, execute the graduated non-destructive rollback protocol below.

```
[Rollback Level 1: Disable New Ingress]
       │  ── Unset QUEUE_PUBLISH_URL or revert image to v6 (Prevents new queue messages)
       ▼
[Rollback Level 2: Suspend Worker Scaling]
       │  ── Switch ACA Job trigger to Manual (Halts automatic compute provisioning)
       ▼
[Rollback Level 3: Database & Queue Reconciliation]
       │  ── Reconcile queued/processing jobs gracefully; clear request_hash for creator retries
       ▼
[Rollback Level 4: Audit & Post-Mortem]
       └── All outbox records, queue messages, and error diagnostics preserved for analysis
```

### Rollback Level 1: Halt New Dispatch (T + 1 minute)
*Goal: Immediately stop new jobs from being enqueued without losing existing state.*
- Revert the backend revision or unbind the queue URL:
  ```bash
  az containerapp update \
    --name praroha-backend \
    --resource-group rg-tendersaathi \
    --image tendersaathiacr.azurecr.io/praroha-backend:v6 \
    --remove-env-vars QUEUE_PUBLISH_URL
  ```
- **Impact**: Any attempt to dispatch cinematic preview returns a clean, non-crashing response. Core application journeys (story, voice, divergence, world mutation) remain 100% operational.
- **Data Protection**: `render_outbox` table and all existing rows remain untouched.

### Rollback Level 2: Suspend Worker Scaling (T + 3 minutes)
*Goal: Stop background container instances from spinning up or running away.*
1. Stop any currently executing job instances:
   ```bash
   az containerapp job stop \
     --name praroha-render-job \
     --resource-group rg-tendersaathi
   ```
2. Suspend event-based scaling by switching the trigger type to `Manual`:
   ```bash
   az containerapp job update \
     --name praroha-render-job \
     --resource-group rg-tendersaathi \
     --trigger-type Manual
   ```
- **Impact**: Compute cost drops to ₹0.00 immediately. No worker will execute automatically until manually triggered.

### Rollback Level 3: Graceful Job & Queue Reconciliation (T + 10 minutes)
*Goal: Reconcile all job states safely without dropping tables, clearing queues, or corrupting unrelated application jobs.*

> [!CAUTION]
> **DO NOT** run `az storage message clear` on `cinematic-render-jobs`.
> **DO NOT** run `DROP TABLE render_outbox CASCADE`.
> **DO NOT** run unscoped updates on `generation_jobs` (`WHERE status = 'queued'`). PRAROHA runs concurrent generation jobs (DNA extraction, world synthesis, voice generation, universe unfold). Unscoped updates will corrupt active non-cinematic jobs!

#### Verified Schema Relationships:
- **`GenerationJob`**: Cinematic preview jobs strictly use `job_type = 'media_video'`.
- **`MediaAssetRecord`**: Cinematic preview assets have `media_type = 'video'` and `provider_name = 'Cinematic Preview'`.
- **Primary/Foreign Key Alignment**: In `CinematicDispatcherService.dispatch_preview_job()`, `job_record.id` is explicitly created identical to `asset_record.id` (`job_id`). There is NO `target_asset_id` column on `generation_jobs`. `media_assets.id` directly matches `generation_jobs.id`.
- **`RenderOutbox`**: Every Phase 52 cinematic job has `render_outbox.job_id = generation_jobs.id`.

Execute the following scoped, verified reconciliation in Supabase SQL:

```sql
-- Step 1: Reconcile ONLY queued cinematic preview jobs (protects DNA, world, and voice jobs)
UPDATE generation_jobs
SET status = 'failed',
    error_code = 'SERVICE_SUSPENDED',
    error_message = 'Cinematic rendering temporarily suspended for maintenance. Please retry shortly.',
    updated_at = CURRENT_TIMESTAMP
WHERE job_type = 'media_video'
  AND status = 'queued'
  AND id IN (
      SELECT id FROM media_assets
      WHERE media_type = 'video' AND provider_name = 'Cinematic Preview'
  );

-- Step 2: Reconcile ONLY interrupted processing cinematic preview jobs
UPDATE generation_jobs
SET status = 'failed',
    error_code = 'RENDER_INTERRUPTED',
    error_message = 'Cinematic rendering was interrupted during service maintenance.',
    updated_at = CURRENT_TIMESTAMP
WHERE job_type = 'media_video'
  AND status = 'processing'
  AND id IN (
      SELECT id FROM media_assets
      WHERE media_type = 'video' AND provider_name = 'Cinematic Preview'
  );

-- Step 3: Reconcile pending outbox records so sweeper will not attempt dispatch
UPDATE render_outbox
SET status = 'failed',
    last_error = 'Rollback: Dispatch cancelled due to service suspension.',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'pending';

-- Step 4: Release request_hash ONLY on the affected cinematic preview media assets
-- Allows creators to re-request preview rendering without hash collisions.
UPDATE media_assets
SET request_hash = NULL,
    status = 'failed',
    error_message = 'Cinematic preview interrupted by service suspension. Request hash released for clean retry.'
WHERE media_type = 'video'
  AND provider_name = 'Cinematic Preview'
  AND status IN ('queued', 'processing');
```

4. **Preserve `completed` and `failed` records**:
   - `completed` jobs and their stored MP4 assets in Supabase Storage remain 100% intact.
   - Non-cinematic jobs (`dna_extraction`, `world_generation`, `media_audio`, `media_voice`) remain 100% intact.
   - Historical error diagnostics remain preserved for post-mortem analysis.
   - `failed` jobs and diagnostic errors remain available for engineering analysis.
5. **Inspect Queue Messages**:
   Peek at pending messages to correlate message IDs with database records:
   ```bash
   ACCOUNT_KEY=$(az storage account keys list --account-name stpraroharender --resource-group rg-tendersaathi --query "[0].value" -o tsv)
   az storage message peek --queue-name cinematic-render-jobs \
     --account-name stpraroharender --account-key "$ACCOUNT_KEY" --num-messages 32 -o json
   ```

---

## 5. Cost Exposure & Financial Compliance

- **Idle Readiness**: ₹0.00 compute cost. Azure Storage Queue storage is negligible (~₹1–2/month). ACA Job in Consumption environment incurs ₹0.00 when executions == 0.
- **Single Canary Cost**: $< ₹0.50 INR (~$0.005 USD). A single 30–45 second synthetic render on 1.0 vCPU / 2.0 GiB RAM is well within the authorized ₹50.00 pilot ceiling.
- **Rollback Cost**: ₹0.00 compute cost once trigger is set to `Manual` and backend is reverted.

---

## 6. Authoritative Production Approvals Status & Next Required Gate

All operations remain strictly gated. The reconciliation of historical and remaining approvals is as follows:

### 6.1 Historical Production Approvals
1. **Approval 1 `[PROD-CHANGING]` (Supabase Outbox Schema)**:
   - *Action*: Apply [backend/migrations/0001_create_render_outbox.sql](file:///home/syed-imadulla/Desktop/Praroha/backend/migrations/0001_create_render_outbox.sql) to production Supabase.
   - *Status*: **GRANTED & FULLY EXECUTED** (2026-10-23). `render_outbox` verified present with 11 columns, 5 constraints, 3 indexes, 0 rows.
2. **Approval 2 (Historical) `[PROD-CHANGING]` (Deploy v7 / v7.1)**:
   - *Action*: Deploy `praroha-backend:v7` / `v7.1` and bind `QUEUE_PUBLISH_URL`.
   - *Status*: **EXECUTED, INCIDENTS ENCOUNTERED, AND FULLY ROLLED BACK TO v6** (2026-10-23). `QUEUE_PUBLISH_URL` unbound. Telemetry verified 0 writes and zero data loss.

### 6.2 Executed Production Approval: Deploy Candidate v7.3 Gate (Completed & Verified)
The candidate `v7.3` deployment was explicitly authorized and executed on 2026-10-23:

- **Operation `[PROD-CHANGING]`**: Deploy candidate `v7.3` image and bind existing secret reference `QUEUE_PUBLISH_URL=secretref:queue-publish-url`.
- **Target Container App**: `praroha-backend` (Resource Group: `rg-tendersaathi`).
- **Verified Image**: `tendersaathiacr.azurecr.io/praroha-backend:v7.3`
- **Verified Digest**: `sha256:74c0f103d0894ac931675c99dafdb273414af0c04cd781ed8675ba2ac44b0e1f` (exact match).
- **Execution Result**: Container App updated successfully (`provisioningState: Succeeded`, `runningStatus: Running`).
- **Safety Properties Verified**:
  - Production runtime startup performed **ZERO DDL** schema changes (`validate_production_schema()`); automatic migrations disabled (`ALLOW_PRODUCTION_DB_MIGRATIONS=False`).
  - Fail-closed initialization verified; silent SQLite fallback eliminated; `/api/health` returned HTTP 200 with `fallback_used: false`.
  - Dependency boundary clean: pure `queue_contract.py` without `psutil` or FFmpeg worker dependencies.
- **Current Status**: **DEPLOYED & HEALTHY (2026-10-23). Phase Gate B step B8 and Phase Gate C complete.**

### 6.3 Executed Production Approval: Single Synthetic Canary Render Gate (Phase Gate D — Completed)
The single authorized synthetic canary render was executed on 2026-10-24 15:23 UTC via `backend/scripts/run_canary_dispatch.py`:

- **Operation `[RENDER-TRIGGERING]`**: Exactly ONE synthetic canary render dispatched.
- **Canary Job ID**: `0d9c2349-6eed-4686-b148-5f8f5d84c17f` (Project: `25e15040-73e6-47e5-b030-d95598e17292`, Entity: `99b0c570-2d22-402e-8a68-1392243f8d30`).
- **Transactional Outbox Record**: ID `e3cfdc80-dca2-4489-98c4-c4dd74a551e2` transitioned durably to `status = 'published'` (`published_at: 2026-10-24T15:23:31Z`).
- **Queue Enqueue**: HTTP 201 Created from Azure Storage Queue REST API (`x-ms-request-id: bb991d11-0003-0076-71cb-63699c000000`).
- **Worker Execution**: `praroha-render-job-rsjqv` ran for 55 seconds (started 15:23:40Z, succeeded 15:24:35Z, exit 0). Returned to scale-to-zero (0 active executions).
- **Database Records**: `generation_jobs` marked `completed` (100% progress, 2.46s render elapsed, peak RSS 102.55 MB). `media_assets` marked `completed` with honest badges (`is_synthetic: true`, `provider_label: "Cinematic Preview"`).
- **Generated Media**: Uploaded to Supabase Storage `seed-unfold-assets`. 124,558 bytes, 1280x720, 6.000s duration, H.264 MP4, 0 decoding errors.
- **Queue Drained**: `cinematic-render-jobs`: 0 messages, `cinematic-render-poison`: 0 messages.
- **Current Status**: **CANARY EXECUTED & AUDITED (2026-10-24). Phase Gate D complete.**

### 6.4 Phase Gate E: Isolated Resilience Testing (Executed & Passed)
Phase Gate E has been executed and verified 100% green:
- **Operation**: Executed isolated resilience scenarios (Scenarios A, B, C, D) covering outbox sweeper retry/recovery, worker visibility renewal and idempotent duplicate suppression, poison routing, and data immutability.
- **Boundary**: Ran exclusively against isolated temporary SQLite databases and mocked Azure Storage Queue clients (`MockQueueClient`). Zero production queue mutations, zero cloud executions, zero database mutations.
- **Status**: **EXECUTED & 100% PASSED** (9/9 tests passed in `backend/tests/test_cinematic_resilience_phase_gate_e.py`; 341 passed in full backend suite). Phase Gate E complete.

### 6.5 Next Required Production Approval: Feature Flag Enablement Gate (Phase Gate F)
The next operational gate is:
- **Operation**: Enable `CINEMATIC_PREVIEW_ENABLED=true` on `praroha-backend` and `VITE_ENABLE_CINEMATIC_PREVIEW=true` on Vercel frontend.
- **Status**: **AWAITING SEPARATE OPERATOR AUTHORIZATION**. Strictly gated. Both feature flags remain disabled.

---

## 7. Incident Post-Mortem & Candidate Image v7.2 / v7.3 Verification

### 7.1 Incident Summary (v7.1 Boot Failure & Silent SQLite Fallback)
- **Incident**: Upon deployment of `praroha-backend:v7.1`, during application startup, `project_repo._migrate_columns()` executed:
  `ALTER TABLE characters ADD COLUMN is_stale BOOLEAN DEFAULT 0;`
- **PostgreSQL Rejection**: PostgreSQL rejects integer defaults (`0`) on `BOOLEAN` columns (`DatatypeMismatch`), aborting the transaction block (`current transaction is aborted, commands ignored until end of transaction block`).
- **Unintended Fallback**: In `init_db()`, an overly permissive `except Exception` clause caught the error and triggered a legacy development fallback path to local ephemeral SQLite (`/app/seed_unfold.db`), silently decoupling the app from Supabase PostgreSQL.

### 7.2 Containment (Phase 1 — Executed)
- **Rollback Applied**: Reverted production container app `praroha-backend` to `tendersaathiacr.azurecr.io/praroha-backend:v6`.
- **Secret Unbound**: Removed `QUEUE_PUBLISH_URL` environment variable binding from `praroha-backend`.
- **Health Verified**: Live production endpoint verified at `https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io/api/health` (HTTP/2 200 OK, `service: "PRAROHA — Seed to Universe"`, `status: "healthy"`).
- **Log Audit**: Log Analytics telemetry for the brief v7.1 runtime showed only two `/api/health` probes (200 OK) and one unauthenticated `/api/projects` GET (401 Unauthorized). Exactly **0 writes** (POST/PUT/PATCH/DELETE) were issued; zero data was stored in SQLite or lost.
- **Queues & Jobs Verified**: `cinematic-render-jobs`: 0 messages, `cinematic-render-poison`: 0 messages, `praroha-render-job` executions: 0.

### 7.3 Code Remediation (Phase 2 & Phase 3 — Completed)
1. **Config Hardening** (`backend/app/config.py`):
   - Added `ALLOW_SQLITE_FALLBACK: bool = False` to `Settings`.
2. **Fail-Closed Database Initialization** (`backend/app/repositories/project_repo.py`):
   - `init_db()` now strictly fails closed (`RuntimeError: Database initialization failed against <dialect>. Silent fallback to SQLite is disabled.`) in `production`, `staging`, or whenever targeting PostgreSQL without explicit `ALLOW_SQLITE_FALLBACK=True`.
   - Silent SQLite fallback in production is completely eliminated.
3. **PostgreSQL-Safe Boolean Defaults** (`backend/app/repositories/project_repo.py`):
   - Changed all column additions from `DEFAULT 0` to `DEFAULT FALSE` for `characters.is_stale`, `scenes.is_stale`, `world_bibles.is_stale`.
4. **Savepoint Isolation Pattern** (`backend/app/repositories/project_repo.py`):
   - Implemented `_safe_execute()` using `with connection.begin_nested():` (SAVEPOINT) on PostgreSQL dialects. Individual DDL errors (such as column already existing) roll back only to the savepoint and do not poison the outer transaction.
5. **Comprehensive Test Suite**:
   - Added `backend/tests/test_production_database_init.py` verifying fail-closed behavior, opt-in development fallback, SQLite compatibility, PostgreSQL savepoint isolation, and live Supabase PostgreSQL connection initialization.
   - All backend test suites passed (312 tests).
   - Frontend production build (`npm run build`) succeeded without error.
   - `git diff --check` passed with 0 errors.

### 7.4 Candidate Image v7.2 Verification (Superceded by v7.3)
- **Image Tag**: `tendersaathiacr.azurecr.io/praroha-backend:v7.2`
- **ACR Digest**: `sha256:3c92a5c6300b96fda3e1fe95a91db341d0416edf777a59a6665cfc4afb8621ac`
- Superceded by `v7.3` due to separation of production runtime validation from automatic DDL migrations.

---

## 8. Final Database Safety Hardening & Candidate Image v7.3 Verification

### 8.1 Architectural Policy: Separation of Validation and Migrations
1. **Production Runtime (Zero DDL)**:
   - Application startup (`ENVIRONMENT=production` or targeting production Supabase database) connects to PostgreSQL and invokes `validate_production_schema()`.
   - Checks required tables (`projects`, `characters`, `scenes`, `world_bibles`, `world_candidates`, `world_selections`, `generation_jobs`, `media_assets`, `creative_memory`, `render_outbox`, `seed_dna`, `seed_potential_items`), required columns, and indexes/constraints.
   - Executes **ZERO DDL** statements (`CREATE`, `ALTER`, `DROP`).
   - If any required schema object is missing, startup immediately fails with a descriptive `RuntimeError`. Never silently switches to SQLite.
2. **Explicit Migration Operation**:
   - Schema modifications are executed ONLY via explicit migration operations (`run_migrations()` or `ALLOW_PRODUCTION_DB_MIGRATIONS=True`).
   - `ALLOW_PRODUCTION_DB_MIGRATIONS` defaults to `False` and cannot be bypassed simply by setting `ENVIRONMENT=production`.
3. **Development / Test Isolation**:
   - Automated tests targeting production Supabase URLs are rejected before connection or DDL.
   - Development initialization runs automatically only on explicitly isolated SQLite or disposable test databases.

### 8.2 Candidate Image v7.3 Verification
- **Image Tag**: `tendersaathiacr.azurecr.io/praroha-backend:v7.3`
- **ACR Digest**: `sha256:74c0f103d0894ac931675c99dafdb273414af0c04cd781ed8675ba2ac44b0e1f`
- **Commit**: `e9a42cb`
- **Verification Evidence (Isolated PostgreSQL Container `testdb`)**:
  1. *Unmigrated DB*: Startup failed with exit code 3 and logged:
     `RuntimeError: Database startup failed against postgresql+asyncpg: Production schema validation failed: missing required tables... Automatic schema migrations are disabled in production runtime. Apply approved database migrations before starting the service.. Silent fallback to SQLite is disabled.`
  2. *Explicit Migration*: Executed via `run_migrations()` with `ALLOW_PRODUCTION_DB_MIGRATIONS=True`. Completed cleanly.
  3. *Migrated DB*: Normal production container startup (`ALLOW_PRODUCTION_DB_MIGRATIONS=False`) connected, validated schema with zero DDL, and `/api/health` returned `HTTP 200 OK`.
  4. *Fail-Closed*: Invalid PostgreSQL URL terminated immediately with code 3.
- **Strict Boundary**: Candidate `v7.3` is pushed to ACR only. **Not deployed to production.** Production Container App remains on `v6`.

---

## 9. Post-Canary Acceptance Audit, FPS Root Cause & Candidate Worker v7 Verification

### 9.1 Canary Execution Summary & Telemetry
On 2026-10-24 15:23 UTC, the operator-authorized single synthetic production canary was dispatched via `backend.scripts.run_canary_dispatch`:

- **Job ID**: `0d9c2349-6eed-4686-b148-5f8f5d84c17f`
- **Project ID**: `25e15040-73e6-47e5-b030-d95598e17292` (*"The Sunken City: Bio-City"*)
- **Entity ID**: `99b0c570-2d22-402e-8a68-1392243f8d30`
- **Request Hash**: `4f8521d16e432af8ef023f8036e0b5525f78bc85991ef94002936ba2d4a64448`
- **Outbox ID**: `e3cfdc80-dca2-4489-98c4-c4dd74a551e2` (status: `published`, `published_at: 2026-10-24T15:23:31Z`)
- **Queue Enqueue**: HTTP 201 Created from Azure Storage Queue REST API (`x-ms-request-id: bb991d11-0003-0076-71cb-63699c000000`)
- **Worker Execution**: `praroha-render-job-rsjqv` on `praroha-worker:v6` (1.0 vCPU, 2.0 GiB RAM):
  - Start Time: `2026-10-24T15:23:40+00:00`
  - End Time: `2026-10-24T15:24:35+00:00`
  - Exit Status: `Succeeded` (Exit code 0, 55s wall-clock duration)
- **DB Transitions**: `generation_jobs` & `media_assets` both marked `completed` (render elapsed: 2.46s, peak RSS: 102.55 MB).
- **Storage Artifact**: Uploaded to `seed-unfold-assets`:
  - URL: `https://stxnxkzaftmwcbtvgzbm.supabase.co/storage/v1/object/public/seed-unfold-assets/projects/25e15040-73e6-47e5-b030-d95598e17292/media/video/99b0c570-2d22-402e-8a68-1392243f8d30_1792855464.mp4`
  - File Size: 124,558 bytes
  - Codec: H.264, 1280x720, duration 6.000s, 0 decoding errors (`ffmpeg -v error -i ... -f null -`).
- **Post-Canary Isolation**: `cinematic-render-jobs`: 0 messages, `cinematic-render-poison`: 0 messages, worker returned to scale-to-zero. Both feature flags remain disabled.

### 9.2 24-versus-25 FPS Discrepancy & Root Cause Analysis
- **Empirical Measurement**: Probing the generated MP4 via `ffprobe` revealed:
  - `codec_name`: `h264`
  - `r_frame_rate`: `25/1`
  - `avg_frame_rate`: `25/1`
  - `nb_read_frames`: 150 frames over 6.000 seconds (25.0 FPS)
- **Expected Acceptance Standard**: The Phase 52 runbook and queue contract specify `fps = 24`.
- **Root Cause Investigation**:
  1. *Filter Graph Hardcoding*: In `backend/app/services/cinematic_preview.py:169`, `zoompan` was hardcoded to `fps=25` and `d={spec.duration_sec * 25}` (authored in Phase 46 using the European broadcast PAL default).
  2. *Dropped Parameter*: In `backend/app/workers/cinematic_worker.py:791`, `CinematicPreviewSpec` was instantiated with `duration_sec` and `aspect_ratio`, but `CinematicPreviewSpec` did not declare an `fps` field. Thus, `options["fps"] = 24` was discarded upon receipt.
  3. *Missing Output Flag*: Without `-r` specified in FFmpeg output arguments, FFmpeg defaulted to the filter stream's output cadence of 25.0 FPS.

### 9.3 Code Remediation & Verification
1. **Dynamic FPS in `CinematicPreviewSpec`** (`backend/app/services/cinematic_preview.py`):
   - Added `fps: int = 24` with validation enforcing `fps in (24, 30)`.
2. **Dynamic Zoompan & Output Cadence** (`backend/app/services/cinematic_preview.py`):
   - Filter calculates `total_frames = spec.duration_sec * fps`.
   - `zoompan` configured with `d={total_frames}:...:fps={fps}`.
   - Added `-r {fps}` to output arguments to guarantee matching container/stream headers.
3. **Queue Worker Forwarding** (`backend/app/workers/cinematic_worker.py`):
   - Worker extracts `fps=options.get("fps", 24)` and passes it to `CinematicPreviewSpec`.
4. **Local ffprobe Verification**:
   - Added unit tests in `test_cinematic_preview.py` and `test_cinematic_queue_worker.py` rendering clips at 24 and 30 FPS.
   - `ffprobe` measured exact `24/1` (72 frames / 3.0s) and `30/1` (90 frames / 3.0s).
   - Zero FFmpeg decode errors verified via `ffmpeg -v error -i ... -f null -`.
   - Full test battery: 332 passed in `pytest backend/tests/`.

### 9.4 Candidate Image Worker v7 Verification
- **Target Image Tag**: `tendersaathiacr.azurecr.io/praroha-worker:v7`
- **Local Image ID**: `sha256:1df95b35a48cda4d77debb607ea0ff8a43ccf51244f9a44a0aa0ad3a11243b06`
- **Config Digest**: `sha256:48c701c4f3a5527e50bd8a522dfe79ec79eb571c572cfb0d2d38e7fb32b4b455`
- **Local Verification**: Built via BuildKit (`Dockerfile.worker`), inspected via `docker run --rm ... --help` with exit code 0.
- **Strict Boundary**: Candidate `v7` is built locally only. **Not pushed to ACR, not deployed to Azure.** Production Job `praroha-render-job` remains on `praroha-worker:v6`.

### 9.5 Azure Billing & Financial Reconciliation Status
- **Current Status**: **PENDING UNTIL ACTUAL COST DATA BECOMES AVAILABLE**.
- **Inspection Query**: `az consumption usage list` executed against subscription `36794f11-1aa5-4a25-a4aa-3b973c335e2d`.
- **Finding**: Azure billing engine returns `pretaxCost: None` and `usageQuantity: None` for the current billing period. Usage records have not yet posted to the billing ledger.
- **Policy**: In accordance with project instructions, projected numbers are not claimed as measured spend. Actual container runtime was 55 seconds on 1.0 vCPU / 2.0 GiB RAM ($< ₹0.50$ INR estimated).

### 9.6 Phase Gate E: Isolated Resilience Testing Evidence (Executed & Passed)
Isolated resilience testing was executed and verified 100% green against isolated test fixtures and mock queue clients:

1. **Test A — Outbox Interruption & Recovery**:
   - *Scenario A1 (Interruption & Sweeper Recovery)*: Simulated primary backend crash after outbox commit but before queue publication. Record survived in `pending` state; sweeper claimed after lease elapsed and published successfully.
   - *Scenario A2 (CAS Concurrency Locking)*: Multiple concurrent sweepers competed for eligible records; atomic CAS leasing ensured exactly one sweeper claimed each record with zero duplicate dispatches.
   - *Scenario A3 (Crash After Enqueue)*: Verified worker rejects duplicate deliveries if a crash occurs after enqueue, preventing duplicate renders.
   - *Scenario A4 (Terminal Failure & Backoff)*: Verified exponential backoff and terminal `failed` status when Azure Queue outages exceed the retry budget (5 attempts), clearing `request_hash` safely.

2. **Test B — Worker Lease Heartbeat & Idempotency**:
   - *Scenario B1 (Heartbeat & Visibility Renewal)*: Verified worker `_heartbeat_loop` executes Azure Queue message visibility renewal (`update_message`, visibility 120s) and persists periodic database heartbeats to prevent API lease expiration.
   - *Scenario B2 (Duplicate Delivery for In-Flight Job)*: Simulated duplicate delivery for a job currently in `processing` status. Worker detected atomic claim conflict, performed zero render work, and safely deleted duplicate from queue to prevent poison looping.
   - *Scenario B3 (Duplicate Delivery for Completed Job)*: Simulated duplicate delivery for an already `completed` job. Worker recognized terminal completion, bypassed render, and acknowledged message.

3. **Test C — Poison-Message Routing & Hostile Payloads**:
   - *Scenario C1 (Hostile Payload Rejection)*: Injected malformed payloads (unsupported schema versions, invalid UUID formats, unknown entity types, unexpected fields, and credential injection attempts like `sig=secret`). Verified immediate rejection before queue dispatch or render processing, with zero secret leakage in logs.
   - *Scenario C2 (Poison Queue Routing)*: Simulated poisoned message exceeding retry budget (`dequeue_count > 3`). Verified message was routed to `cinematic-render-poison`, terminal error status recorded, and processing lock released.

4. **Test D — Data Immutability for Pre-Existing Completed Renders**:
   - *Scenario D1 (Canary Immutability)*: Modeled against production canary `0d9c2349-6eed-4686-b148-5f8f5d84c17f`. Verified that sweeps, duplicate worker deliveries, and poison routing never mutate, overwrite, or delete already-completed render records, media assets, or stored MP4 URLs.

- **Isolation Mechanisms Used**: Isolated SQLite databases (`test_seed_unfold.db` / temporary SQLite file fixtures via `sqlite+aiosqlite`), mocked queue clients (`MockQueueClient`). Zero production Azure queues accessed, zero cloud Container Apps touched.
- **Regression Results**: 9/9 resilience tests passed (`backend/tests/test_cinematic_resilience_phase_gate_e.py`); 61/62 passed in related outbox/worker suite (1 skipped); 341 passed (2 skipped) in full backend suite (`pytest backend/tests/`).
- **Worker Candidate Status**: `praroha-worker:v7` built locally (`sha256:1df95b35a48cda4d77debb607ea0ff8a43ccf51244f9a44a0aa0ad3a11243b06`), not pushed to ACR, not deployed. Production job remains on `praroha-worker:v6`.
- **FPS Acceptance Status**: FPS root cause fix verified dynamically for 24 and 30 FPS in worker codebase.
- **Azure Billing Status**: Pending until actual billing data posts (`pretaxCost: None`); actual compute time was 55s on 1.0 vCPU / 2.0 GiB RAM ($< ₹0.50$ INR estimated).
- **Strict Stop Condition**: Phase Gate E complete. Production feature flags remain disabled. Awaiting separate operator authorization for Phase Gate F.


