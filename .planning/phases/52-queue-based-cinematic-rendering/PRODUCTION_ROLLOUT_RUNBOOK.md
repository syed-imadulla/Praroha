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

## 2. Audited Pre-Deployment Verification

The following pre-rollout facts have been empirically audited as of commit `e0239e7`:

| Component | Target Resource | Live Audited State | Status |
| **Supabase DB Schema** | `stxnxkzaftmwcbtvgzbm.supabase.co` | `public.render_outbox` created via `0001_create_render_outbox.sql`. 11 columns, 5 constraints, 3 indexes verified. HTTP 200 on REST API. | **MIGRATED & VERIFIED** (Phase Gate A Complete) |
| **Backend Container** | `praroha-backend` (in `env-tendersaathi`) | Image: `tendersaathiacr.azurecr.io/praroha-backend:v7.1`. Revision: `praroha-backend--latest` (`Running`, `Healthy`). | **DEPLOYED & HEALTHY** (Phase Gate B Complete) |
| **Queue Secret Binding** | `praroha-backend` secrets store | `QUEUE_PUBLISH_URL` bound securely to `secretref:queue-publish-url`. | **BOUND & VERIFIED** (Phase Gate B Complete) |
| **ACA Job Provisioning** | `praroha-render-job` (in `env-praroha-render`) | Provisioned with image `praroha-worker:v6`, UAMI `uami-praroha-render`, zero ingress (`ingress: null`), and 0 active executions. | Verified scale-to-zero active |
| **Azure Queue Depths** | `stpraroharender` | `cinematic-render-jobs`: 0 messages (`[]`).<br>`cinematic-render-poison`: 0 messages (`[]`). | Verified clean queue baseline |
| **Backend Feature Flag** | `praroha-backend` runtime | `CINEMATIC_PREVIEW_ENABLED=False` (default code setting, unset in env). | Verified disabled |
| **Frontend Feature Flag** | Production bundle (`dist/`) | `VITE_ENABLE_CINEMATIC_PREVIEW` unset (evaluates to falsy in UI). | Verified disabled |
| **Test Battery & Build** | Local repo | 306 passed in `pytest backend/tests/`. Frontend production build succeeds in 13.1s (33 precached PWA entries). | Verified 100% green |

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

### Phase Gate B: Backend Container Build & Deployment
*Prerequisite: Phase Gate A verified. Explicit operator approval to build and deploy image `v7`.*

- [x] **Step B1 `[PROD-CHANGING]`**: Build backend image `v7` via Azure Container Registry:
  - `az acr build` returned `TasksOperationsNotAllowed` (Azure for Students subscription does not permit remote ACR Tasks).
  - Built locally using BuildKit with OCI container manifest (`docker build --load -f Dockerfile.backend -t tendersaathiacr.azurecr.io/praroha-backend:v7 .`).
  - Authenticated via `az acr login -n tendersaathiacr` and pushed to ACR.
  - Published Image Tags: `praroha-backend:v7` and `praroha-backend:v7.0`.
  - Image Digest: `sha256:4b180a7f78f832412ecfdedbdd3e343c5654ba08cea545191d5443afa8440b5d` *(Recorded 2026-10-23)*.
- [!] **Step B2 `[PROD-CHANGING]`**: Update `praroha-backend` container app & Startup Diagnostics:
  - Deployed image `tendersaathiacr.azurecr.io/praroha-backend:v7.0` and bound `QUEUE_PUBLISH_URL=secretref:queue-publish-url`.
  - Azure Container Apps provisioning succeeded (`provisioningState: Succeeded`).
  - Container entered `CrashLoopBackOff` on boot.
  - **Diagnostic Root Cause**: Log Analytics query revealed `ModuleNotFoundError: No module named 'psutil'` in `backend/app/main.py` -> `routers/media.py` -> `services/cinematic_dispatcher.py` -> `workers/cinematic_worker.py:35` (`import psutil`). `psutil` is listed in `requirements-worker.txt` for the worker, but was not in `backend/requirements.txt` for the backend app.
- [x] **Step B3 `[ROLLBACK-EXECUTED]`**: Execute Rollback Level 1 per runbook:
  - Immediate non-destructive rollback executed:
    ```bash
    az containerapp update \
      --name praroha-backend \
      --resource-group rg-tendersaathi \
      --image tendersaathiacr.azurecr.io/praroha-backend:v6 \
      --remove-env-vars QUEUE_PUBLISH_URL
    ```
- [x] **Step B4 `[PROD-DEPLOYED]`**: Build, Verify, and Deploy Candidate `v7.1`:
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
  - Deployment status: `provisioningState: Succeeded`, `runningStatus: Running`.
  - `QUEUE_PUBLISH_URL` bound via `secretref:queue-publish-url`.

---

### Phase Gate C: Post-Deployment Health & Infrastructure Audit
*Prerequisite: Phase Gate B deployed.*

- [x] **Step C1 `[READ-ONLY]`**: Verify backend API health:
  ```bash
  curl -fsS https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io/api/health | jq .
  ```
  *Result*: HTTP/2 200 OK, `{"success": true, "data": {"status": "healthy", "service": "PRAROHA — Seed to Universe", "environment": "production"}}`.
- [x] **Step C2 `[READ-ONLY]`**: Verify database outbox state:
  - Connected via production connection to Supabase `stxnxkzaftmwcbtvgzbm`.
  - `render_outbox` table verified accessible with exactly 0 rows (`count = 0`). Zero unexpected rows, zero pending rows.
- [x] **Step C3 `[READ-ONLY]`**: Verify queue baseline & zero worker activity:
  - `cinematic-render-jobs`: 0 messages.
  - `cinematic-render-poison`: 0 messages.
  - `praroha-render-job` execution history: `[]` (0 executions).
- [x] **Step C4 `[READ-ONLY]`**: Verify feature flag status:
  - Backend `CINEMATIC_PREVIEW_ENABLED = False` (unset in environment).
  - Frontend `VITE_ENABLE_CINEMATIC_PREVIEW` disabled.
- [x] **Step C5 `[READ-ONLY]`**: Verify startup log telemetry:
  - Log Analytics shows clean server process boot: `INFO: Started server process [5]`, `INFO: Application startup complete.`, `INFO: Uvicorn running on http://0.0.0.0:8000`.
  - Zero import errors, zero crash loops. Health probe returned 200 OK.

---

### Phase Gate D: Authorized Synthetic Canary Render
*Prerequisite: Phase Gates A, B, and C verified. SEPARATE EXPLICIT OPERATOR APPROVAL REQUIRED.*

- [ ] **Step D1 `[RENDER-TRIGGERING]`**: Dispatch exactly one synthetic render job:
  - Trigger via authorized test script with canonical demo seed.
  - Observe `render_outbox` row created with `status = 'pending'`.
  - Observe immediate or sweeper dispatch transitions status to `status = 'published'`, and `published_at` is set.
- [ ] **Step D2 `[READ-ONLY]`**: Monitor event-driven worker execution:
  - Observe `praroha-render-job` KEDA scaler triggers from 0 to 1 execution.
  - Worker claims job via atomic CAS (`UPDATE generation_jobs SET status = 'processing' WHERE id = :id AND status = 'queued'`).
  - Worker maintains 15s heartbeat visibility updates.
  - Synthetic video renders cleanly and uploads MP4 to Supabase Storage `seed-unfold-assets`.
  - Generation job finalizes to `completed`.
  - Message is deleted from `cinematic-render-jobs`.
- [ ] **Step D3 `[READ-ONLY]`**: Verify clean drain and poison queue:
  - `cinematic-render-poison` message count remains 0.
  - `praroha-render-job` execution exits code 0 and scales back to 0 active executions.
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

## 6. Exact Remaining Production Approvals

Before any production state is modified, the following sequential operator approvals are required:

1. **Approval 1 [PROD-CHANGING]**: Approval to apply [0001_create_render_outbox.sql](file:///home/syed-imadulla/Desktop/Praroha/backend/migrations/0001_create_render_outbox.sql) to production Supabase database.
2. **Approval 2 [PROD-CHANGING]**: Approval to build image `praroha-backend:v7` via ACR and update `praroha-backend` Container App with `QUEUE_PUBLISH_URL=secretref:queue-publish-url`.
3. **Approval 3 [RENDER-TRIGGERING]**: Separate approval to trigger exactly one synthetic canary render to verify end-to-end rendering, storage upload, and worker scale-to-zero.

**CURRENT STATUS: Staged & Paused. Awaiting Operator Approval for Candidate v7.2.**

---

## 7. Incident Post-Mortem & Candidate Image v7.2 Verification

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


