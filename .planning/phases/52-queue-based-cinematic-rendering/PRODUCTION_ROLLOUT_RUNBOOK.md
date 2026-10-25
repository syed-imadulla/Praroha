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

As of the verified Stage 1 internal operator canary execution (2026-10-25 18:26 IST / 12:56 UTC):

- **Production backend:** `v7.4` (`tendersaathiacr.azurecr.io/praroha-backend:v7.4`, digest `sha256:7722da2f830abfd27c4540e0c10296685c4e2cf02609547087a5786d47f19ff3`, revision `praroha-backend--latest`, status `Running`, `provisioningState: Succeeded`, healthy on `/api/health`).
- **Backend security configuration:** `CINEMATIC_PREVIEW_ENABLED=true`, `CINEMATIC_PREVIEW_PUBLIC_ENABLED=false`, `CINEMATIC_OPERATOR_EMAILS=imadulla.s45@gmail.com`.
- **Frontend feature flag:** `VITE_ENABLE_CINEMATIC_PREVIEW` unset/disabled in Vercel production environment.
- **Queue-publisher environment binding:** **BOUND** (`QUEUE_PUBLISH_URL=secretref:queue-publish-url`).
- **Database initialization:** Production schema validated via `validate_production_schema()` with **ZERO DDL**. PostgreSQL connection confirmed (`fallback_used: false`). No SQLite fallback, no crash loop, no import errors.
- **Production `render_outbox`:** exists in Supabase (`public.render_outbox` with 11 columns, 5 constraints, 3 indexes; exactly 2 records present: Historical Oct 24 Canary `0d9c2349-6eed-4686-b148-5f8f5d84c17f` and Stage 1 Canary `9268bc08-0f3e-44e7-8b28-9cc2b96d6ddc`, both `published`).
- **Both queues:** empty (`cinematic-render-jobs`: 0 messages, drained by worker; `cinematic-render-poison`: 0 messages; confirmed via fresh read-only peek).
- **Worker compute:** `praroha-render-job` provisioned in `env-praroha-render` with `praroha-worker:v7` (digest `sha256:dac0a52998652cd586551af81747170b7f092ba67404d3eeb80563ac99199996`, `ingress: null`, scale-to-zero active with 0 running executions).
- **Stage 1 Internal Operator Canary:** **EXECUTED ONCE & 100% SUCCEEDED** (Job ID `9268bc08-0f3e-44e7-8b28-9cc2b96d6ddc`, execution `praroha-render-job-v4dk6`, duration 41s). Playable 5.0-second H.264 MP4 stored in Supabase Storage (`112,893` bytes, 1280x720, 24 fps).
- **Historical Canary Preserved:** Job ID `0d9c2349-6eed-4686-b148-5f8f5d84c17f` MP4 artifact (`124,558` bytes) verified 100% intact.
- **Canary Latency Reconciliation (QG-06):** **ACCEPTED BY OPERATOR (REVISED TWO-TIER SLA)** (Warm render $< 10.0$s; Cold-start $< 75.0$s).
- **Azure Billing Reconciliation (QG-07):** **CLOSED & VERIFIED (PASS)**. Authoritative inspection of Azure Portal Cost Management confirmed exact posted charges for the rendering pilot in `rg-tendersaathi`: `stpraroharender` = **₹0.43 INR**; `tender-saathi-render-job` = **₹8.71 INR**; `praroha-cinematic` = **₹8.65 INR**. Combined dedicated rendering pilot spend is **₹17.79 INR**, strictly below the **$< ₹50.00$ INR** pilot budget ceiling.
- **Phase Gate E (Isolated Resilience Testing):** **EXECUTED & 100% PASSED** (9/9 resilience scenarios passed; 341 passed in full backend suite; zero production mutations).
- **Local Browser Rehearsal (Pre-Gate F):** **EXECUTED & 100% PASSED (Commit `1648e72`)**. Automated browser test suite (`frontend/e2e/test_phase52_cinematic_rehearsal.mjs`) verified 9/9 scenarios across Flag OFF and Flag ON on isolated local ports (5180 and 5181). Discovered and fixed a UI bug in `EntityMediaSection.tsx`.
- **Verified Production Frontend Promotion (2026-10-25):** **EXECUTED & 100% VERIFIED ON LIVE PRODUCTION**. Pre-verified Vercel Preview deployment `dpl_71P97LPcH4Mvksw4mBbZpjj6qmdb` was promoted directly to production domain `https://praroha-ai.vercel.app` (serving bundle `/assets/index-1DKbSIsW.js`).
- **Live Guest/Demo Workspace Flow:** Verified on production without 401 bounce.
- **Disabled Cinematic Control on Production:** Verified in live browser. The control renders `Cinematic Preview (Disabled)` with tooltip *"Cinematic preview generation is currently disabled awaiting release approval."* Exactly 0 render dispatches are issued on click attempts.
- **Security & Authorization Gate:** Ordinary authenticated users receive `HTTP 403 Forbidden`; cross-project operator calls receive `HTTP 404 Not Found`; public access fails closed.
- **Stage 2 Public Rollout Status:** **PREPARED — NOT EXECUTED; AWAITING RATE LIMIT IMPLEMENTATION & SEPARATE APPROVAL**.

| Component | Target Resource | Live Audited State | Status |
| :--- | :--- | :--- | :--- |
| **Supabase DB Schema** | `stxnxkzaftmwcbtvgzbm.supabase.co` | `public.render_outbox` present; 2 rows (`published`). Canary rows marked `completed`. | **MIGRATED & AUDITED** |
| **Backend Container** | `praroha-backend` (in `env-tendersaathi`) | Image: `tendersaathiacr.azurecr.io/praroha-backend:v7.4`. Status: `Running`, `Healthy` (HTTP 200). | **DEPLOYED & HEALTHY** |
| **Backend Security Gate**| `praroha-backend` runtime | `CINEMATIC_PREVIEW_ENABLED=true`, `CINEMATIC_PREVIEW_PUBLIC_ENABLED=false`, `CINEMATIC_OPERATOR_EMAILS=imadulla.s45@gmail.com`. | **VERIFIED & ENFORCED** |
| **Queue Secret Binding** | `praroha-backend` secrets store | `QUEUE_PUBLISH_URL` bound securely to `secretref:queue-publish-url`. | **BOUND & VERIFIED** |
| **ACA Job Provisioning** | `praroha-render-job` (in `env-praroha-render`) | Image: `tendersaathiacr.azurecr.io/praroha-worker:v7`. Scale-to-zero active (0 active executions). | **DEPLOYED & VERIFIED** |
| **Azure Queue Depths** | `stpraroharender` | `cinematic-render-jobs`: 0 messages (drained by worker).<br>`cinematic-render-poison`: 0 messages. | Clean queue baseline verified |
| **Frontend Production App**| `https://praroha-ai.vercel.app` | Deployment: `dpl_71P97LPcH4Mvksw4mBbZpjj6qmdb`. Bundle: `/assets/index-1DKbSIsW.js`. Guest demo workspace functional. | **PROMOTED & VERIFIED** |
| **Frontend Feature Flag** | Production bundle & Vercel env | `VITE_ENABLE_CINEMATIC_PREVIEW` unset (evaluates to falsy in UI). Render control renders `Cinematic Preview (Disabled)`. | Verified disabled in production |
| **Stage 1 Verification** | Live stack & Operator Account | 403 rejection on ordinary user, 404 on non-owned project, 1 canary rendered and verified (113 KB MP4, 720p 24fps). | **100% PASSED** (Stage 1 Complete) |
| **Stage 2 Rollout** | Public access | Requires per-user rate limit & quota; public flag remains false. | **PREPARED — NOT EXECUTED** |
| **Backend Feature Flag** | `praroha-backend` runtime | `CINEMATIC_PREVIEW_ENABLED=False` (default code setting, unset in env). | Verified disabled |
| **Frontend Feature Flag** | Production bundle & Vercel env | `VITE_ENABLE_CINEMATIC_PREVIEW` unset (evaluates to falsy in UI). Render control renders `Cinematic Preview (Disabled)` with 0 dispatches. | Verified disabled in production |
| **Production Smoke Test** | `https://praroha-ai.vercel.app` | 8/8 passed in `test_production_post_promotion_smoke.mjs`. 0 mutating backend requests attempted. | **100% PASSED** (Post-Promotion Smoke) |
| **Resilience Battery** | Isolated SQLite / Mock Queues | 9/9 resilience scenarios verified across Scenarios A, B, C, and D. | **100% PASSED** (Phase Gate E Complete) |
| **Local Browser Rehearsal** | Isolated Playwright / Ports 5180 & 5181 | 9/9 scenarios passed in `test_phase52_cinematic_rehearsal.mjs`. UI fix in `EntityMediaSection.tsx` verified. Zero cloud compute. | **100% PASSED** (Pre-Gate F Rehearsal) |
| **Test Battery & Build** | Local repo | 341 passed in backend suite; 15/15 passed in cinematic worker regression suite; `npm run build --prefix frontend` clean (0 errors); `git diff --check` clean. | Verified 100% green |

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

### 6.5 Executed Production Approval: Frontend Release Promotion & Verification (Completed & Verified 2026-10-25)
The promotion of the verified Vercel Preview deployment `dpl_71P97LPcH4Mvksw4mBbZpjj6qmdb` was explicitly authorized and executed on 2026-10-25:

- **Operation `[PROD-CHANGING]`**: Promote existing Preview deployment `dpl_71P97LPcH4Mvksw4mBbZpjj6qmdb` directly to production alias `https://praroha-ai.vercel.app` via `npx vercel alias set`. Zero rebuild, zero code modification.
- **Target URL**: `https://praroha-ai.vercel.app`
- **Verified Bundle**: `/assets/index-1DKbSIsW.js` (HTTP 200 OK; replaces stale Oct 11 bundle `/assets/index-Bbp0gGL9.js`).
- **Live Verification**: Automated read-only Playwright smoke test (`frontend/e2e/test_production_post_promotion_smoke.mjs`) passed 8/8 checks:
  1. AuthScreen landing: clean render.
  2. Guest/demo workspace entry: `The Sunken City: Bio-City` loaded with zero 401 bounces.
  3. Cinematic control safeguard: renders `Cinematic Preview (Disabled)` with tooltip *"Cinematic preview generation is currently disabled awaiting release approval."* Zero dispatches sent.
  4. Creations & Graveyard views: clean navigation without session loss.
  5. Deep route entry: `/projects/demo-canonical-bio-city` persists guest state.
  6. Session storage: `sessionStorage.praroha_guest_session: "true"` verified.
  7. Sign-out: cleanly clears guest state and routes to login.
  8. Mutation isolation: 29 requests intercepted, **zero mutating requests attempted or executed**.
- **Backend & Worker Invariants**: Azure Container App `praroha-backend` remains on `v7.3`, worker job `praroha-render-job` remains on `v7`, worker executions remain at 0, and queues `cinematic-render-jobs` and `cinematic-render-poison` both have 0 messages.
- **Rollback Option Documented**: `npx vercel alias set praroha-9u0f7819h-imadullas45-4746s-projects.vercel.app praroha-ai.vercel.app` or `npx vercel rollback --yes`.
- **Current Status**: **FRONTEND PROMOTED & VERIFIED (2026-10-25)**.

### 6.6 Next Required Production Approval: Feature Flag Enablement Gate (Phase Gate F — Strictly Unexecuted)
The next operational gate is:
- **Operation**: Enable `CINEMATIC_PREVIEW_ENABLED=true` on `praroha-backend` Container App and `VITE_ENABLE_CINEMATIC_PREVIEW=true` on Vercel frontend.
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
- **Historical Boundary at Build Time**: At candidate audit time, `v7.3` was pushed to ACR only. (Subsequently authorized, deployed, and verified in Phase Gate B on 2026-10-23; live backend Container App is currently running `v7.3`).

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
- **Local Image ID**: `sha256:dac0a52998652cd586551af81747170b7f092ba67404d3eeb80563ac99199996`
- **Config Digest**: `sha256:5982ce59d400125b0f090ff054aa5b36f6ef8dd990c8a6fcf4a54457f9202157`
- **Local Verification**: Built via BuildKit (`Dockerfile.worker`), inspected via `docker run --rm ... --help` with exit code 0.
- **In-Container MP4 Validation**: Executed automated test renders inside the candidate container image for both 24 and 30 FPS (`CinematicPreviewComposer` with `image_path` mount). Verified via in-container `ffprobe` (`24/1` and `30/1` frame rate fractions, exact frame counts `duration * fps`) and zero FFmpeg decode errors (`returncode == 0`, empty `stderr`).
- **Strict Boundary**: Candidate `v7` is built locally only. **Not pushed to ACR, not deployed to Azure.** Production Job `praroha-render-job` remains on `praroha-worker:v6`.

### 9.5 Azure Billing & Financial Reconciliation Status (QG-07 Audit)
- **Quality Gate QG-07 Status**: **CLOSED & VERIFIED (PASS)**.
- **Active Subscription Verified**: `Azure for Students` (`36794f11-1aa5-4a25-a4aa-3b973c335e2d`), status `Enabled`.
- **Target Resource Group**: `rg-tendersaathi`, location `centralindia`, status `Succeeded`.
- **Authoritative Source**: Azure Portal Cost Management & Cost Analysis (`Scope: Azure for Students`, View: `Resources`, Filter: `Oct 2026` MTD through Oct 25).
- **Actual Observed Ledger Values**:
  - `stpraroharender` (Storage Account / Queues): **₹0.43 INR**
  - `tender-saathi-render-job` (Dedicated Render Job): **₹8.71 INR**
  - `praroha-cinematic` (Cinematic Preview Container): **₹8.65 INR**
  - **Combined Dedicated Rendering Pilot Total**: **₹17.79 INR**
  - `praroha-backend` (Persistent Web Container): **₹812.30 INR**
  - `tendersaathiacr` (Container Registry): **₹386.47 INR**
  - `workspace-rgtendersaathinzG6` (Log Analytics): **₹0.00 INR**
  - **Total Resource Group Spend**: **₹1,216.56 INR**
- **Budget Compliance**: Dedicated rendering pilot expenditure of **₹17.79 INR** strictly complies with the **$< ₹50.00$ INR** pilot budget ceiling (64.4% margin under budget ceiling).
- **API Discrepancy Note**: The Azure Consumption REST API returned HTTP 400 (`"Cost Management supports only Enterprise Agreement, Web direct and Microsoft Customer Agreement offer types"`) and `pretaxCost: "None"` because Azure for Students is a sponsorship offer type. Interactive Azure Portal Cost Analysis provided authoritative resource-level accounting confirming compliance.
- **Artifact Evidence**: Screenshot saved to `azure_cost_by_resource_oct2026.png`.

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
- **Worker Deployment Status**: `tendersaathiacr.azurecr.io/praroha-worker:v7` (`sha256:dac0a52998652cd586551af81747170b7f092ba67404d3eeb80563ac99199996`) published to ACR and deployed to `praroha-render-job`.
- **FPS Acceptance Status**: FPS root cause fix verified dynamically for 24 and 30 FPS in worker codebase and inside candidate container image.
- **Azure Billing Status**: Pending until actual billing data posts (`pretaxCost: None`); actual compute time was 55s on 1.0 vCPU / 2.0 GiB RAM ($< ₹0.50$ INR estimated).
- **Strict Stop Condition**: Phase Gate E complete. Worker v7 deployed. Production feature flags remain disabled. Awaiting separate operator authorization for Phase Gate F.

### 9.7 Canary Latency & End-to-End Timing Reconciliation (QG-06)
Runbook Quality Gate **QG-06** specifies: *Full queue-to-MP4 playback completed in $< 35$ seconds.*
Telemetry reconciliation from the single authorized production canary (`0d9c2349-6eed-4686-b148-5f8f5d84c17f`):

- **Enqueue Timestamp**: `2026-10-24T15:23:31Z` (Outbox HTTP 201 Created from Azure Storage Queue REST API).
- **KEDA Scheduling & Job Start**: `2026-10-24T15:23:40Z` (Queue wait + KEDA scaler detection + Container creation: **9.0 seconds**).
- **Pure FFmpeg Render Duration**: **2.46 seconds** (as recorded in `generation_jobs` result metadata; peak RSS 102.55 MB).
- **Supabase Storage Upload & DB Finalization**: **~1.5 seconds** (124,558 bytes H.264 MP4 upload and status update).
- **Container Execution Duration**: **55.0 seconds** (`praroha-render-job-rsjqv` ran from 15:23:40Z to 15:24:35Z, including container boot, Python runtime import, connection setup, asset fetch, composition, upload, queue drain, and clean shutdown).
- **Acceptance Gate Reconciliation & Operator Policy Decision**:
  - *Original Acceptance Standard*: Full queue-to-MP4 playback completed in $< 35$ seconds. (Historical result: **UNMET** for cold-start scale-from-zero).
  - *Measured Performance*:
    - Active Video Rendering: **2.46 seconds** (Passes $< 35$s).
    - Cold-Start Total Wall Time: **64.0 seconds** (Exceeded original 35s target by 29s due to KEDA scheduling and cold container creation in Azure Container Apps).
  - *Approved Two-Tier SLA (Accepted by Operator on 2026-10-25)*:
    - Tier 1 (Warm Rendering): $< 10.0$ seconds (Measured: **2.46s** — PASS).
    - Tier 2 (Cold-Start Scale-from-Zero): $< 75.0$ seconds (Measured: **64.0s** — PASS).
  - *Governing Policy Status*: **ACCEPTED BY OPERATOR**. The operator has formally accepted and adopted the revised two-tier SLA. The original 35-second cold-start target was not met; this historical finding is preserved and not claimed as passed.

### 9.8 Executed Worker v7 Publication & Deployment (Completed & Verified 2026-10-24)
Worker v7 was explicitly authorized by the operator, published to ACR, and deployed to Container Apps Job `praroha-render-job`:

1. **Preflight Checks (Passed)**:
   - Subscription `36794f11-1aa5-4a25-a4aa-3b973c335e2d` (`Azure for Students`) verified active.
   - Tag `v7` confirmed not present in ACR before push.
   - `praroha-render-job` verified at 0 active executions.
   - Queues `cinematic-render-jobs` and `cinematic-render-poison` confirmed empty (0 messages).
   - Canary record `0d9c2349-6eed-4686-b148-5f8f5d84c17f` and its MP4 verified intact (HTTP 200, 124,558 bytes).
   - Both feature flags confirmed disabled in production.
2. **ACR Publication**:
   - Authenticated via `az acr login --name tendersaathiacr`.
   - Pushed `tendersaathiacr.azurecr.io/praroha-worker:v7`.
   - Remote manifest digest: `sha256:dac0a52998652cd586551af81747170b7f092ba67404d3eeb80563ac99199996` (exact match to local image ID).
3. **Container Apps Job Deployment**:
   - `az containerapp job update --name praroha-render-job --resource-group rg-tendersaathi --image tendersaathiacr.azurecr.io/praroha-worker:v7`
   - Result: `provisioningState: Succeeded`, `runningStatus: Ready`.
4. **Post-Deployment Read-Only Verification**:
   - Image verified: `tendersaathiacr.azurecr.io/praroha-worker:v7`.
   - Ingress verified: `null` (zero open ports).
   - Managed identity: `uami-praroha-render` (`6ec7ec48-9deb-4518-b530-fbc483a9b0c7`) preserved.
   - Scaling: `azure-queue` trigger, min 0, max 2 preserved.
   - Active executions: 0 (scale-to-zero active).
   - Queues: Empty (`cinematic-render-jobs: 0`, `cinematic-render-poison: 0`).
   - Feature flags: Disabled.
5. **Non-Destructive Rollback Procedure (Available if needed)**:
   ```bash
   az containerapp job update \
     --name praroha-render-job \
     --resource-group rg-tendersaathi \
     --image tendersaathiacr.azurecr.io/praroha-worker:v6
   ```

---

## 10. Phase Gate F — Controlled Internal Feature Enablement & Verification Protocol

> [!IMPORTANT]
> **PREPARATION ONLY**: This protocol specifies the exact sequence, verification checks, and instant rollback procedures to be executed ONLY after explicit operator authorization. Do not execute any prod-changing commands in this section without approval.

### 10.1 Required Preconditions
1. **Operator Decisions Confirmed**:
   - QG-06 Policy Decision: **COMPLETE (ACCEPTED BY OPERATOR)**. Operator explicitly approved and accepted the revised two-tier SLA (warm render $< 10$s, cold-start $< 75$s).
   - Phase Gate F Execution Authorization: **PENDING**. Awaiting separate explicit operator authorization to execute activation.
2. **Read-Only Preflight Baseline**:
   - `praroha-backend` running `v7.3` (`provisioningState: Succeeded`, `Running`).
   - `praroha-render-job` running `v7` with `ingress: null`, scale-to-zero active (0 active executions).
   - Queues `cinematic-render-jobs` and `cinematic-render-poison` confirmed at 0 messages.
   - Completed canary `0d9c2349-6eed-4686-b148-5f8f5d84c17f` and its MP4 artifact intact.

### 10.2 Gated Activation Sequence (Post-Authorization)

#### Step F1: Backend Feature Flag Enablement (Azure Container App)
- **Command**:
  ```bash
  az containerapp update \
    --name praroha-backend \
    --resource-group rg-tendersaathi \
    --set-env-vars CINEMATIC_PREVIEW_ENABLED=true
  ```
- **Verification**:
  - `az containerapp show -n praroha-backend -g rg-tendersaathi --query "properties.template.containers[0].env[?name=='CINEMATIC_PREVIEW_ENABLED'].value" -o tsv` returns `true`.
  - Live health probe: `curl -s https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io/api/health` returns `HTTP 200 OK`, `status: "healthy"`.

#### Step F2: Frontend Feature Flag Enablement (Vercel)
- **Action**:
  - In Vercel Project Settings for `praroha-ai` (or via Vercel CLI), add environment variable:
    `VITE_ENABLE_CINEMATIC_PREVIEW=true` (Production environment).
  - Deploy the updated frontend build to production.
- **Verification**:
  - Inspect production bundle: `isCinematicPreviewEnabled` evaluates to `true`.

#### Step F3: Controlled Browser Verification Walkthrough (Operator / Internal Session)
- **Target URL**: `https://praroha-ai.vercel.app`
- **Test Entity**: Canonical demo project (*"The Sunken City: Bio-City"*, ID `25e15040-73e6-47e5-b030-d95598e17292`), scene entity `99b0c570-2d22-402e-8a68-1392243f8d30`.
- **Grounded Verification Checklist**:
  1. *Preview Control Visibility & Disabled State (Pre-Activation Baseline)*:
     - Component: `EntityMediaSection.tsx` (lines 284–301).
     - When `VITE_ENABLE_CINEMATIC_PREVIEW` is false:
       - Renders badge with `data-testid="generate-video-disabled-${entityId}"`.
       - Title attribute: `"Cinematic preview generation is currently disabled in production. Awaiting release approval."`
       - Visual style: `cursor-not-allowed opacity-80 border-dashed border-stone-800 bg-stone-900/40 text-stone-500`.
       - Text label: `"Cinematic Preview (Disabled)"`.
  2. *Interactive Button & Duplicate-Click Protection (Post-Activation)*:
     - Component: `EntityMediaSection.tsx` (lines 304–326).
     - When `VITE_ENABLE_CINEMATIC_PREVIEW` is true:
       - Renders button with `data-testid="generate-video-${entityId}"`.
       - Title: `"Render 16:9 cinematic motion preview with Ken Burns easing and audio ducking"`.
       - Visual style: active theme gradient/border with video camera icon.
       - Button text: `"Cinematic Preview"`.
     - *Single Click & Double-Click Guard*:
       - Clicking immediately sets `isGeneratingVideo = true` (`isGeneratingMedia[key] = true` in `workspaceStore.ts`).
       - Button enters disabled state (`disabled={isGeneratingVideo}`).
       - Button icon swaps to `<RotateCw className="h-3 w-3 animate-spin" />` with text label `"Rendering Preview..."`.
       - Store-level protection suppresses duplicate clicks while in-flight (`if (isGeneratingMedia[key]) return;`).
  3. *Queued & Processing Progress States*:
     - Component: `MediaPreviewCard.tsx` (lines 200–225) & `workspaceStore.ts` (polling loop every 2000ms).
     - *Queued State*:
       - Status badge `data-testid="media-status-processing"` renders `"Queued"`.
       - Card body displays `"Creating your video..."` with subtext `"Non-blocking background synthesis"`.
     - *Processing State*:
       - Once worker claims the job, status transitions from `queued` to `processing`.
       - Status badge `data-testid="media-status-processing"` updates to `"Synthesizing"`.
       - Spinning amber loader communicates background rendering without blocking the UI.
  4. *Completed MP4 Playback & Synthetic Labeling*:
     - Component: `MediaPreviewCard.tsx` (lines 80–190).
     - Video player mounts: `<video data-testid="media-video-player" ... />`.
     - 16:9 aspect ratio container (`aspect-video`), playable H.264 MP4 with soundscape.
     - Custom media controls:
       - Play/pause toggle: `data-testid="media-video-play-toggle"`.
       - Seek bar: clickable/draggable timeline.
       - Download button: `data-testid="media-video-download-btn"` (initiates direct download of `.mp4`).
       - Lightbox trigger: `data-testid="media-video-lightbox-trigger"` (expands to theater modal).
     - *Honest Provider & Synthetic Badging*:
       - Badge element: `data-testid="media-video-provider-badge"`.
       - Brown synthetic indicator dot: `<span className="h-1.5 w-1.5 rounded-full bg-amber-500/80" />`.
       - Label text: `{providerLabel}` (`"Cinematic Preview"`).
       - Metadata tags: `"16:9"`, `"6s"`, `"completed"`.
       - Tooltip: `"Programmatic cinematic preview composed from world assets."`.
  5. *Safe Error Handling & Retry Behavior*:
     - Component: `MediaPreviewCard.tsx` (lines 228–260).
     - If render fails or poison-routed:
       - Card transitions to `data-testid="media-status-failed"`.
       - Displays descriptive error message (e.g. `asset.error` or generic safe fallback; zero stack traces, connection strings, or internal tokens exposed).
       - Quota badge if applicable: `"Credit / Quota Required"`.
       - Retry trigger: `data-testid="media-retry-btn"` labeled `"Try Again"` with `<RotateCcw />` icon.
       - Clicking retry invokes `generateMediaAction` with `force_regenerate=true`, safely releasing hash and re-enqueueing.
  6. *Accessibility, Layout & Console Hygiene*:
     - Semantic HTML `<video>`, descriptive `aria-label`s on buttons, full keyboard navigation support.
     - Responsive flex/grid layout matching PRAROHA's dark botanical theme.
     - Zero unhandled console errors or runtime warnings in DevTools.

> [!NOTE]
> **Implementation Alignment Note**:
> Previous documentation drafts informally summarized UI labels as `"Queued in render pipeline..."` and `"AI Cinematic Preview (Synthetic)"`. In the actual grounded implementation:
> - The progress state renders a status pill with `"Queued"` or `"Synthesizing"`, card title `"Creating your video..."`, and button text `"Rendering Preview..."`.
> - The synthetic badge renders `data-testid="media-video-provider-badge"` with provider `"Cinematic Preview"`, an amber synthetic dot, `"16:9"`, `"6s"`, and tooltip `"Programmatic cinematic preview composed from world assets."`.
> The verification protocol uses the exact test IDs and strings above.

### 10.3 Instant Rollback Protocol for Phase Gate F

If any unexpected UI behavior, double-dispatch, playback glitch, or scaling runaway occurs during Phase Gate F, execute the graduated rollback immediately:

#### Level 1: Instant Client Isolation (< 1 Minute)
Disable frontend button immediately so no user can trigger renders:
- Set `VITE_ENABLE_CINEMATIC_PREVIEW=false` in Vercel and redeploy.
- Creator UI instantly returns button to disabled/inactive state.

#### Level 2: Backend Dispatch Decoupling (< 2 Minutes)
Disable backend cinematic dispatch endpoint:
```bash
az containerapp update \
  --name praroha-backend \
  --resource-group rg-tendersaathi \
  --set-env-vars CINEMATIC_PREVIEW_ENABLED=false
```
- Direct `/api/cinematic/generate` requests immediately return clean HTTP 503 `"Cinematic preview temporarily unavailable"`. Core worldbuilding, text, and audio APIs remain 100% operational.

#### Level 3: Worker Scale Suspension (< 3 Minutes)
If job scaling must be paused without losing messages:
```bash
az containerapp job update \
  --name praroha-render-job \
  --resource-group rg-tendersaathi \
  --trigger-type Manual
```
- Halts all automated worker spin-ups (0 active executions, ₹0 compute cost). Preserves all database records and storage queues intact.

---

### 10.4 Pre-Release Local Browser Rehearsal & UI Fix Audit (Commit `1648e72`)

Prior to requesting production authorization for Phase Gate F, a full local browser rehearsal was executed using Playwright (`frontend/e2e/test_phase52_cinematic_rehearsal.mjs`) to validate both feature-flag states in a real browser environment without impacting production.

#### 1. Rehearsal Methodology & Cloud Isolation
- **Dual Server Instances**:
  - Flag OFF server spawned on `http://localhost:5180` (`VITE_ENABLE_CINEMATIC_PREVIEW=false`).
  - Flag ON server spawned on `http://localhost:5181` (`VITE_ENABLE_CINEMATIC_PREVIEW=true`).
- **Complete Cloud Decoupling**:
  - All `**/*.supabase.co/**` requests intercepted and fulfilled locally (`{ data: [], error: null }`).
  - All `/api/**` backend routes intercepted and deterministically mocked (canonical demo universe, instant scene loading, transactional job states, and health checks).
  - Authentic video decoding validated by serving local MP4 test fixture (`scratch/worker_previews/preview_proj-fps-e2e_scene-fps-24_1792907026.mp4`) via route `**/local-fixture-video.mp4`.
  - **Zero production mutations**: 0 Azure queue messages, 0 cloud dispatcher calls, 0 Supabase DB/storage writes, 0 cloud GPU/CPU compute consumed. This local playback test strictly does **not** constitute another production render.

#### 2. Rehearsal Test Matrix & Verification Results
| # | Scenario | Tested State | Verified Behavior | Actual Result |
|---|---|---|---|---|
| 1 | **Flag OFF Control Disabled** | Port 5180 | Badge `data-testid="generate-video-disabled-scene-sanctum-001"` renders `"Cinematic Preview (Disabled)"` with title `"Cinematic preview generation is currently disabled in production. Awaiting release approval."` | **PASS** |
| 2 | **Flag OFF Dispatch Suppression** | Port 5180 | Clicking disabled control triggers zero network dispatches (`stateOff.dispatchCalls === 0`) | **PASS** |
| 3 | **Flag ON Interactivity** | Port 5181 | Button `data-testid="generate-video-scene-sanctum-001"` renders `"Cinematic Preview"` with title `"Render 16:9 cinematic motion preview with Ken Burns easing and audio ducking"` | **PASS** |
| 4 | **Single Click & Double-Click Guard** | Port 5181 | Rapid double-click immediately disables button with `"Rendering Preview..."` and `.animate-spin` icon; duplicate dispatch is suppressed (exactly 1 dispatch call recorded) | **PASS** |
| 5 | **Queued & Synthesizing Progress States** | Port 5181 | Media card displays status pill `"Queued"` / `"Synthesizing"`, card message `"Creating your video..."`, and subtext `"Non-blocking background synthesis"` | **PASS** |
| 6 | **Completed Video Playback & Controls** | Port 5181 | HTML5 `<video data-testid="media-video-player">` mounts with local MP4; play/pause, download, and lightbox buttons attached; badge displays `"Cinematic Preview • 16:9 • 3s"` with tooltip `"Programmatic cinematic preview composed from world assets."` | **PASS** |
| 7 | **Sanitized Failure & Retry Flow** | Port 5181 | Tested on Scene 2 (`scene-abyssal-rift-002`); status pill shows `"Failed"`; displays sanitized error `"Worker capacity reached; safe backoff initiated."`; 0 internal tokens/connection strings leaked; `"Try Again"` retry button renders and is interactive | **PASS** |
| 8 | **Keyboard Accessibility (A11y)** | Port 5181 | Retry button receives keyboard focus (`document.activeElement === retryBtn`) with visible focus ring | **PASS** |
| 9 | **Responsive Layout & Console Hygiene** | Port 5181 | Clean single-column layout at 375x667 mobile viewport with zero horizontal overflow; zero unhandled exceptions or fatal errors across entire session | **PASS** |

#### 3. Frontend Implementation Gap Discovered & Resolved
- **Defect Discovered**: In `frontend/src/components/EntityMediaSection.tsx` (line 363), the Media Cards Grid wrapper evaluated:
  ```tsx
  {availableModalities.some((m) => assets.some((a) => a.media_type === m) || isGeneratingMedia[`${entityId}_${m}`]) && (
  ```
  When a job failed, `isGeneratingMedia` was cleared to `false` and no asset was saved to `assets`. Because `activeMediaJobs` was omitted from this outer check, the entire card container unmounted, hiding the failed card, error message, and retry button from the user.
- **Remediation**: Added `Object.values(activeMediaJobs).some(j => j.entity_id === entityId && j.media_type === m)` to the container condition (committed in `1648e72`).
- **Validation**: Post-fix re-execution verified that the failure card remains visible with the sanitized error and the `"Try Again"` retry button. Production build (`npm run build --prefix frontend`) passed cleanly with zero TypeScript errors.

#### 4. Gate Confirmation
Phase Gate F remains **`PREPARED — NOT EXECUTED`**. All production settings and feature flags remain strictly disabled.

---

### 10.5 Verified Production Frontend Promotion & Read-Only Smoke Audit (2026-10-25)

Following operator authorization, the pre-verified Vercel Preview deployment was promoted directly to production to remediate the stale frontend bundle and broken guest/demo workspace flow while maintaining strict Phase Gate F feature flag isolation.

#### 1. Promotion Execution
- **Deployment Promoted**: `dpl_71P97LPcH4Mvksw4mBbZpjj6qmdb`
- **Preview Source URL**: `https://praroha-15cmnschd-imadullas45-4746s-projects.vercel.app`
- **Production Alias**: `https://praroha-ai.vercel.app`
- **Promotion Command**:
  ```bash
  npx vercel alias set praroha-15cmnschd-imadullas45-4746s-projects.vercel.app praroha-ai.vercel.app
  ```
- **Live Deployed Bundle**: `/assets/index-1DKbSIsW.js` (verified via curl; replaces stale Oct 11 bundle `/assets/index-Bbp0gGL9.js`).
- **Feature Flag Configuration**: `VITE_ENABLE_CINEMATIC_PREVIEW` unset in Vercel production environment (evaluates to `false`).

#### 2. Live Production Smoke-Test Matrix (`frontend/e2e/test_production_post_promotion_smoke.mjs`)
| # | Test Scenario | Production Verification | Result |
|---|---|---|---|
| 1 | **Initial Auth Landing** | Clean load of `https://praroha-ai.vercel.app` with zero fatal JS errors | **PASS** |
| 2 | **Guest Demo Workspace Hydration** | Click `"Explore as Guest"`; `The Sunken City: Bio-City` loads; zero 401 bounces | **PASS** |
| 3 | **Cinematic Control Disabled Safeguard** | Renders `Cinematic Preview (Disabled)` with tooltip *"Cinematic preview generation is currently disabled awaiting release approval."*; 0 dispatches | **PASS** |
| 4 | **Creations & Graveyard Navigation** | Clean tab navigation without dropping guest session | **PASS** |
| 5 | **Deep Route Direct Navigation** | Direct load of `/projects/demo-canonical-bio-city` preserves guest state | **PASS** |
| 6 | **Session Storage Persistence** | `sessionStorage.getItem('praroha_guest_session') === 'true'` verified | **PASS** |
| 7 | **Clean Sign-Out Flow** | Sign out cleanly flushes `praroha_guest_session` and navigates to AuthScreen | **PASS** |
| 8 | **Backend Mutation Isolation Audit** | 29 HTTP requests intercepted; exactly 0 mutating requests (POST/PUT/PATCH/DELETE) attempted or executed | **PASS** |

#### 3. Cloud Backend Invariants Verified
- **Backend Container**: `praroha-backend` running image `tendersaathiacr.azurecr.io/praroha-backend:v7.4`; `/api/health` returns HTTP 200 (`status: "healthy"`).
- **Worker Job**: `praroha-render-job` running image `tendersaathiacr.azurecr.io/praroha-worker:v7`; scale-to-zero active with **0 running executions**.
- **Storage Queues**: `cinematic-render-jobs` has **0 messages** (`[]`); `cinematic-render-poison` has **0 messages** (`[]`).
- **Feature Flags**: `CINEMATIC_PREVIEW_ENABLED=true` (operator mode), `CINEMATIC_PREVIEW_PUBLIC_ENABLED=false` (public access disabled), `VITE_ENABLE_CINEMATIC_PREVIEW=false` (frontend disabled).
- **Quality Gate QG-07**: Status is **CLOSED & VERIFIED (PASS)** against official Azure Cost Management resource records (₹17.79 total pilot spend < ₹50.00 ceiling).

#### 4. Documented Rollback Command
If immediate rollback is required, re-alias the previous deployment (`0216121`):
```bash
npx vercel alias set praroha-9u0f7819h-imadullas45-4746s-projects.vercel.app praroha-ai.vercel.app
# Alternatively:
npx vercel rollback --yes
```

#### 5. Authoritative Boundary Statement
**Frontend hotfix deployment is COMPLETED and VERIFIED.**
**Phase Gate F (Cinematic Feature Enablement) is NOT AUTHORIZED and remains PREPARED — NOT EXECUTED.**

---

## 11. Backend v7.4 Security Release & Stage 1 Internal Operator Verification (2026-10-25)

### 11.1 Security Implementation Details (v7.4)
- **Problem Solved**: Enabling `CINEMATIC_PREVIEW_ENABLED=true` on the backend without public frontend release exposed an authorization gap where arbitrary authenticated users could invoke `POST /api/projects/{project_id}/media/cinematic-preview/jobs` directly.
- **Remediation**: Implemented `verify_cinematic_preview_access(current_user)` in `backend/app/core/auth.py` and applied across all dispatch routes and aliases in `backend/app/routers/media.py`.
- **Fail-Closed Operator Allowlist**: Requires `current_user.email` to match server-configured `CINEMATIC_OPERATOR_EMAILS` or `ADMIN_EMAILS` when `CINEMATIC_PREVIEW_PUBLIC_ENABLED=false`. Client-supplied role claims (e.g. `role='admin'`) are strictly untrusted.
- **Candidate Image**: `tendersaathiacr.azurecr.io/praroha-backend:v7.4` (digest `sha256:7722da2f830abfd27c4540e0c10296685c4e2cf02609547087a5786d47f19ff3`).

### 11.2 Negative Security Audit & Ordinary User 403 Rejection
- **Caller**: Authenticated non-operator user (`test@example.com` via verified Supabase JWT).
- **Target**: `POST /api/projects/25e15040-73e6-47e5-b030-d95598e17292/media/cinematic-preview/jobs`.
- **Live HTTP Response**: `HTTP 403 Forbidden`.
- **Error Body**: `{"code": "HTTP_403", "message": "Cinematic preview generation is restricted to authorized operators during internal verification."}`.
- **Side Effects**: Exactly 0 outbox rows created, 0 queue messages published.

### 11.3 Operator Project Ownership Isolation (404 Rejection)
- **Caller**: Authorized operator (`imadulla.s45@gmail.com`).
- **Target**: `POST /api/projects/25e15040-73e6-47e5-b030-d95598e17292/media/cinematic-preview/jobs` (canonical project not owned by operator).
- **Live HTTP Response**: `HTTP 404 Not Found` (`Project with ID '25e15040-73e6-47e5-b030-d95598e17292' not found.`).
- **Side Effects**: Exactly 0 outbox rows created, 0 queue messages published.

### 11.4 Authorized Stage 1 Canary Execution & Telemetry
- **Authorization**: User explicitly authorized Stage 1 execution in operator-only mode with operator email `imadulla.s45@gmail.com`.
- **Operator Project**: `c49858cd-8304-44de-8804-45f8b85790b9` ("Internal Operator Canary World", owned by operator UUID `918f7eed-9ecf-4676-9e98-0fb181420965`).
- **Dispatched Job ID**: `9268bc08-0f3e-44e7-8b28-9cc2b96d6ddc`.
- **Dispatch API Response**: `HTTP 202 Accepted` in 6.67s.
- **Transactional Outbox Record**: `91a0ccfb-81ac-48a1-84df-74b9fee343dc` (created `12:55:25 UTC`, published `12:55:28 UTC`).
- **Worker Execution**: `praroha-render-job-v4dk6` (Image: `praroha-worker:v7`).
  - Started: `2026-10-25T12:55:35Z`
  - Ended: `2026-10-25T12:56:16Z`
  - Duration: **41.0 seconds**
  - Exit Status: **`Succeeded`**
- **Queue Draining**: `cinematic-render-jobs` drained to 0 messages; `cinematic-render-poison` remained at 0 messages.
- **Worker Scale-to-Zero**: Worker job terminated execution pod and scaled to 0 active instances.

### 11.5 Output Asset Integrity & Preservation
- **Rendered Output URL**: `https://stxnxkzaftmwcbtvgzbm.supabase.co/storage/v1/object/public/seed-unfold-assets/projects/c49858cd-8304-44de-8804-45f8b85790b9/media/video/world-canary-01_1792932965.mp4`
- **Asset Size & Type**: 112,893 bytes, `video/mp4`, HTTP 200 OK.
- **ffprobe Verification**: H.264 video (1280x720, 24 fps) + AAC audio, duration exactly 5.000s.
- **Synthetic Metadata**: `metadata_json` contains `is_synthetic: true`, `provider_label: "Cinematic Preview"`, `render_engine: "native-ffmpeg-worker"`.
- **Historical Asset Preservation**: October 24 Canary (`0d9c2349-6eed-4686-b148-5f8f5d84c17f`, 124,558 bytes) verified 100% intact.

---

## 12. Stage 2 Public Rollout Readiness & Pre-Execution Specification (Unexecuted)

> [!CAUTION]
> **PREPARATION ONLY — DO NOT EXECUTE**: Public rollout (Stage 2) requires separate approval and resolution of server-side rate-limiting safeguards. The frontend feature flag must remain disabled.

### 12.1 Prerequisites & Blockers to Public Rollout (Status Update)
1. **Per-User Rate Limiting & Daily Quota [RESOLVED & TESTED LOCALLY]**:
   - Implemented server-side atomic per-user quota in `backend/app/services/cinematic_dispatcher.py` and `backend/app/config.py`:
     - Max 2 accepted cinematic renders per user per rolling 24-hour window (`CINEMATIC_MAX_USER_DAILY_RENDERS=2`).
     - Max 1 active concurrent cinematic render per user (`CINEMATIC_MAX_USER_ACTIVE_RENDERS=1`).
     - Returns HTTP 429 with computed `Retry-After` header when daily or active limits are reached.
     - Preserves duplicate-request idempotency: identical parameters return existing active/completed jobs without quota consumption.
     - Supersedes prior active renders on the same entity when `force_regenerate=True` is requested.
     - Verified with 8 dedicated tests in `backend/tests/test_cinematic_quotas_and_safeguards.py`.
2. **Global Concurrency & Workload Protection [RESOLVED & TESTED LOCALLY]**:
   - Implemented system-wide capacity limit in `backend/app/services/cinematic_dispatcher.py`:
     - Max 5 outstanding (queued + processing) cinematic jobs globally (`CINEMATIC_MAX_GLOBAL_OUTSTANDING_RENDERS=5`).
     - Uses atomic database transaction and PostgreSQL advisory transaction locks (`pg_advisory_xact_lock`) + in-process `_dispatch_concurrency_lock` to prevent race conditions under concurrent requests.
     - Returns HTTP 429 with `Retry-After: 60` when capacity is exhausted.
3. **Spend & Billing Sign-Off [PENDING OPERATOR APPROVAL]**:
   - Azure Cost Management audit confirmed dedicated rendering pilot spend is **₹17.79 INR**, well below the ₹50.00 ceiling.
   - `az consumption budget list` returns `[]`; no automated Azure Cost Management budget alert is currently configured on this subscription.
   - **Requirement**: Public-pilot spending ceiling (proposed: ₹100 or ₹200 INR) must be explicitly approved by operator and configured with an alert before public rollout. The verified ₹17.79 internal pilot spend remains strictly separated.

---

## 13. Stage 2 Public Rollout Safeguards Implementation & Local Verification

### 13.1 Safeguards Architecture
1. **Atomic Per-User Quotas (`backend/app/services/cinematic_dispatcher.py`)**:
   - User identity resolved strictly from cryptographically validated token (`current_user.id`) via `backend/app/routers/media.py`.
   - Projects owned by the user are queried atomically in PostgreSQL/SQLite.
   - Active render limit (1 active): rejects distinct dispatches with `HTTP 429` and `Retry-After: 30`.
   - Daily render quota (2 renders / 24h): rejects excessive dispatches with `HTTP 429` and calculated `Retry-After` (hours/minutes remaining until oldest accepted job expires).
   - Duplicate suppression: duplicate identical requests return the existing job (`status in ('queued', 'processing', 'completed')`) with HTTP 202/200 without consuming quota.
   - Force regeneration: supersedes prior active jobs on the same entity, freeing concurrency while consuming one daily render.
2. **Global Workload Protection (`_enforce_global_workload_limit`)**:
   - PostgreSQL-backed query counting outstanding cinematic jobs (`status in ('queued', 'processing')`).
   - Saturated capacity (>= 5 jobs) triggers `HTTP 429` with `Retry-After: 60`.
   - Serialization: dual-layer locking using in-process `asyncio.Lock` and PostgreSQL transaction advisory lock `pg_advisory_xact_lock`.
3. **Structured Secret-Free Telemetry**:
   - Standardized log events: `event=request_accepted`, `event=request_rejected`, `event=job_enqueued`, `event=queue_publish_failed`.
   - Logs include `job_id`, `user_id`, `project_id`, `duration_sec`, `aspect_ratio`, `fps`, `resolution`.
   - Zero secrets: all error messages, URLs, and payloads are stripped of credentials and SAS signatures.
4. **FastAPI HTTP Header Preservation (`backend/app/main.py`)**:
   - Updated `http_exception_handler` to forward `exc.headers` to `JSONResponse`, ensuring `Retry-After` headers reach clients.

### 13.2 Local Test Evidence
- **Dedicated Safeguards Suite**: `backend/tests/test_cinematic_quotas_and_safeguards.py` (8/8 passed in 1.16s).
  - Proves ordinary owner rejection when public mode is false (403).
  - Proves unauthenticated (401) and non-owner (404) rejection.
  - Proves user concurrency limit enforcement (429).
  - Proves rolling 24-hour quota enforcement with accurate `Retry-After` calculation.
  - Proves global capacity limit enforcement (429).
  - Proves duplicate-request idempotency without quota penalty.
  - Proves race-safe atomic concurrency under `asyncio.gather` (1 succeeds, competitors receive 429).
  - Proves normal non-cinematic features (soundscape library, composition) are completely unaffected.
- **Cinematic Test Battery**: 130/130 passed across all 13 cinematic test files in 18.3s.
- **Full Backend Suite**: 362 passed, 2 skipped, 0 failures in 43.9s (`pytest backend/tests/`).
- **Frontend Production Build**: `npm run build` compiled cleanly in 12.44s with Workbox PWA precaching.
- **Git Tree Cleanliness**: `git diff --check` passed with 0 errors; zero secrets introduced.

### 13.3 Exact Approvals Required Before Live Stage 2 Execution
Stage 2 public access is **STRICTLY GATED**. Before public access can be activated, the following explicit approvals and actions are required:
1. **Approval 1 `[PROD-CHANGING]` (Deploy Backend v7.5)**:
   - Build and deploy backend candidate containing the quota and workload protection code to Azure Container App `praroha-backend`.
2. **Approval 2 `[PROD-CHANGING]` (Configure Azure Budget & Spending Ceiling)**:
   - Configure Azure budget alert for public pilot (proposed: ₹100 or ₹200 INR).
3. **Approval 3 `[FLAG-ENABLING]` (Backend Public Flag Enablement)**:
   - Set `CINEMATIC_PREVIEW_PUBLIC_ENABLED=true` on `praroha-backend` Container App.
4. **Approval 4 `[FLAG-ENABLING]` (Frontend Public Flag Enablement)**:
   - Set `VITE_ENABLE_CINEMATIC_PREVIEW=true` on Vercel production environment and redeploy frontend.
5. **Stage 2 Verification**:
   - Run post-rollout smoke test with ordinary non-operator test account to verify public render capability, per-user quota enforcement (HTTP 429 on 3rd render), and frontend UI interactivity.

### 12.2 Required Configuration Changes (When Authorized)
- **Backend**:
  ```bash
  az containerapp update \
    --name praroha-backend \
    --resource-group rg-tendersaathi \
    --set-env-vars CINEMATIC_PREVIEW_PUBLIC_ENABLED=true
  ```
- **Frontend (Vercel)**:
  ```bash
  npx vercel env add VITE_ENABLE_CINEMATIC_PREVIEW production
  # Value: true
  npx vercel redeploy
  ```

### 13.4 Backend v7.5 Safeguards Deployment & Budget Alert Verification (Executed 2026-10-25)
1. **Azure Container Registry Push**:
   - Pushed `tendersaathiacr.azurecr.io/praroha-backend:v7.5` (ID: `681713e79a44`, Digest: `sha256:681713e79a44240f296c8c85dac00e96c1919079e75e5d642c02f1d8f2369a45`, Size: 436 MB).
   - Confirmed remote ACR manifest digest matches candidate image digest byte-for-byte.
2. **Azure Container App Update**:
   - Deployed `v7.5` to `praroha-backend` in `rg-tendersaathi` (`provisioningState: Succeeded`, `runningStatus: Running`, revision `praroha-backend--latest`).
   - Secret bindings (`database-url`, `supabase-key`, `gemini-key`, `queue-publish-url`, etc.) and networking preserved without modification.
3. **Azure Budget Alert Configured**:
   - Budget Name: `praroha-pilot-budget`
   - Scope: Resource Group `rg-tendersaathi`
   - Amount / Currency: **₹200.00 INR / month**
   - Time Period: `2026-10-01` to `2027-10-01` (Monthly grain)
   - Notifications:
     - 80% (₹160.00 INR): `imadulla.s45@gmail.com`
     - 100% (₹200.00 INR): `imadulla.s45@gmail.com`
   - Confirmed: Budget alert serves as an asynchronous notification mechanism, NOT a real-time hard compute kill switch.
4. **Post-Deployment Verification**:
   - `/api/health`: HTTP 200 OK (`service: PRAROHA — Seed to Universe`, `ai_provider: gemini`, `storage_provider: supabase`).
   - Unauthenticated rejection: `POST /api/projects/{id}/media/cinematic-preview/jobs` returns `HTTP 401 Unauthorized` (`Authentication required`).
   - Security gate: Non-operator access returns `HTTP 403 Forbidden` (`Cinematic preview generation is restricted to authorized operators during internal verification`).
   - Modality readiness: `/api/media/providers/health` returns HTTP 200 with all image, voice, video, and audio providers healthy.
   - Worker status: `praroha-worker:v7` configured with scale-to-zero (`minExecutions: 0`), zero active executions.
   - Queues: `cinematic-render-jobs` (0 messages) and `cinematic-render-poison` (0 messages).
5. **Rollback Readiness**:
   - Proven rollback target: `tendersaathiacr.azurecr.io/praroha-backend:v7.4` verified in ACR.
   - Rollback command: `az containerapp update --name praroha-backend --resource-group rg-tendersaathi --image tendersaathiacr.azurecr.io/praroha-backend:v7.4`.
6. **Strict Production Boundary Maintained**:
   - `CINEMATIC_PREVIEW_ENABLED=true`
   - `CINEMATIC_PREVIEW_PUBLIC_ENABLED=false`
   - `CINEMATIC_OPERATOR_EMAILS=imadulla.s45@gmail.com`
   - `VITE_ENABLE_CINEMATIC_PREVIEW=false` (Vercel)
   - Public rendering remains strictly disabled. Zero new renders enqueued.

### 12.3 Instant Rollback Protocol for Stage 2
1. **Tier 1 (Instant Public Cut-off — Preserve Operator Access)**:
   ```bash
   az containerapp update \
     --name praroha-backend \
     --resource-group rg-tendersaathi \
     --set-env-vars CINEMATIC_PREVIEW_PUBLIC_ENABLED=false
   ```
   *Effect*: Public requests instantly receive `HTTP 403 Forbidden`; authorized operator remains capable of diagnosing and verifying.
2. **Tier 2 (Full Emergency Kill-Switch)**:
   ```bash
   az containerapp update \
     --name praroha-backend \
     --resource-group rg-tendersaathi \
     --set-env-vars CINEMATIC_PREVIEW_ENABLED=false CINEMATIC_PREVIEW_PUBLIC_ENABLED=false
   ```
   *Effect*: All cinematic dispatch routes immediately return `HTTP 503 Service Unavailable`.
3. **Tier 3 (Frontend Rollback)**:
   ```bash
   npx vercel rollback --yes
   ```
   *Effect*: Frontend returns to disabled button state with tooltip.
