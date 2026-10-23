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
| :--- | :--- | :--- | :--- |
| **Supabase DB Schema** | `stxnxkzaftmwcbtvgzbm.supabase.co` | `public.render_outbox` is absent (`PGRST205`). `projects` and `generation_jobs` exist with UUID primary keys. | Verified ready for DDL migration |
| **Backend Container** | `praroha-backend` (in `env-tendersaathi`) | Image: `tendersaathiacr.azurecr.io/praroha-backend:v6`. Does not yet contain TASK-52-09, 52-10, or 52-11 code. | Verified ready for image update |
| **Queue Secret Binding** | `praroha-backend` secrets store | Secret `queue-publish-url` exists in backend configuration. `QUEUE_PUBLISH_URL` env var is NOT yet bound to container. | Verified ready for secret binding |
| **ACA Job Provisioning** | `praroha-render-job` (in `env-praroha-render`) | Provisioned with image `praroha-worker:v6`, UAMI `uami-praroha-render`, zero ingress (`ingress: null`), and 0 active executions. | Verified scale-to-zero active |
| **Azure Queue Depths** | `stpraroharender` | `cinematic-render-jobs`: 0 messages (`[]`).<br>`cinematic-render-poison`: 0 messages (`[]`). | Verified clean queue baseline |
| **Backend Feature Flag** | `praroha-backend` runtime | `CINEMATIC_PREVIEW_ENABLED=False` (default code setting, unset in env). | Verified disabled |
| **Frontend Feature Flag** | Production bundle (`dist/`) | `VITE_ENABLE_CINEMATIC_PREVIEW` unset (evaluates to falsy in UI). | Verified disabled |
| **Test Battery & Build** | Local repo | 304 passed in `pytest backend/tests/`. Frontend production build succeeds in 13.7s (33 precached PWA entries). | Verified 100% green |

---

## 3. Non-Destructive Deployment Checklist

### Phase Gate A: Database Schema Migration
*Prerequisite: Explicit operator approval to apply DDL to Supabase.*

- [ ] **Step A1 `[READ-ONLY]`**: Re-verify `render_outbox` absence:
  ```bash
  SUPA_URL=$(grep "^SUPABASE_URL=" .env | cut -d= -f2-)
  SUPA_KEY=$(grep "^SUPABASE_KEY=" .env | cut -d= -f2-)
  curl -s -X GET "$SUPA_URL/rest/v1/render_outbox?limit=1" \
    -H "apikey: $SUPA_KEY" -H "Authorization: Bearer $SUPA_KEY"
  # Expected: {"code":"PGRST205", ...}
  ```
- [ ] **Step A2 `[PROD-CHANGING]`**: Apply [backend/migrations/0001_create_render_outbox.sql](file:///home/syed-imadulla/Desktop/Praroha/backend/migrations/0001_create_render_outbox.sql) in Supabase SQL Editor.
  - Safe, non-destructive, idempotent DDL (`CREATE TABLE IF NOT EXISTS`).
  - Creates partial index `idx_render_outbox_pending` on `(status, created_at) WHERE status = 'pending'`.
  - Creates foreign keys to `projects(id)` and `generation_jobs(id)` with `ON DELETE CASCADE`.
- [ ] **Step A3 `[READ-ONLY]`**: Verify migration success:
  ```bash
  curl -s -X GET "$SUPA_URL/rest/v1/render_outbox?limit=1" \
    -H "apikey: $SUPA_KEY" -H "Authorization: Bearer $SUPA_KEY"
  # Expected: [] (HTTP 200 with empty array)
  ```

---

### Phase Gate B: Backend Container Build & Deployment
*Prerequisite: Phase Gate A verified. Explicit operator approval to build and deploy image `v7`.*

- [ ] **Step B1 `[PROD-CHANGING]`**: Build backend image `v7` via Azure Container Registry:
  ```bash
  az acr build \
    --registry tendersaathiacr \
    --image praroha-backend:v7 \
    --file Dockerfile.backend .
  ```
  *Verification*: Image includes `backend/app/models/outbox.py`, `backend/app/services/cinematic_outbox_sweeper.py`, `backend/app/services/cinematic_dispatcher.py`, and `backend/requirements.txt` (`azure-storage-queue`, `azure-identity`).
- [ ] **Step B2 `[PROD-CHANGING]`**: Update `praroha-backend` container app:
  ```bash
  az containerapp update \
    --name praroha-backend \
    --resource-group rg-tendersaathi \
    --image tendersaathiacr.azurecr.io/praroha-backend:v7 \
    --set-env-vars QUEUE_PUBLISH_URL=secretref:queue-publish-url
  ```
  *Security Note*: `secretref:queue-publish-url` references the existing backend secret without exposing the SAS token in command arguments or shell history.
  *Safety Guarantee*: `CINEMATIC_PREVIEW_ENABLED` remains unset/false, so public users cannot trigger renders.

---

### Phase Gate C: Post-Deployment Health & Infrastructure Audit
*Prerequisite: Phase Gate B deployed.*

- [ ] **Step C1 `[READ-ONLY]`**: Verify backend API health:
  ```bash
  curl -fsS https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io/api/health | jq .
  # Expected: {"success": true, "data": {"status": "healthy", ...}}
  ```
- [ ] **Step C2 `[READ-ONLY]`**: Confirm startup tasks & sweeper initialization:
  - Startup orphan recovery runs without falsely failing active leases.
  - Background outbox sweeper starts and enters its 30-second polling cycle.
- [ ] **Step C3 `[READ-ONLY]`**: Verify queue baseline & zero worker activity:
  ```bash
  az containerapp job execution list \
    --name praroha-render-job \
    --resource-group rg-tendersaathi \
    --output json
  # Expected: [] (0 active or past executions)
  ```

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
*Goal: Reconcile all job states safely without dropping tables or clearing queues.*

> [!CAUTION]
> **DO NOT** run `az storage message clear` on `cinematic-render-jobs`.  
> **DO NOT** run `DROP TABLE render_outbox CASCADE`.  
> Indiscriminate deletion destroys audit history and permanently corrupts client retry semantics.

Instead, execute the following state-by-state reconciliation in Supabase SQL:

1. **Reconcile `queued` jobs**:
   For jobs that were enqueued but not rendered:
   ```sql
   UPDATE generation_jobs
   SET status = 'failed',
       error_code = 'SERVICE_SUSPENDED',
       error_message = 'Rendering service temporarily suspended for maintenance. Please retry shortly.',
       updated_at = CURRENT_TIMESTAMP
   WHERE status = 'queued';
   ```
2. **Reconcile `processing` jobs**:
   For jobs that were actively rendering when the worker was stopped:
   ```sql
   UPDATE generation_jobs
   SET status = 'failed',
       error_code = 'RENDER_INTERRUPTED',
       error_message = 'Rendering was interrupted during service maintenance.',
       updated_at = CURRENT_TIMESTAMP
   WHERE status = 'processing';
   ```
3. **Release Creator Request Hashes**:
   Allow affected creators to re-request video generation without unique hash collisions:
   ```sql
   UPDATE media_assets
   SET request_hash = NULL
   WHERE id IN (
       SELECT target_asset_id FROM generation_jobs 
       WHERE error_code IN ('SERVICE_SUSPENDED', 'RENDER_INTERRUPTED')
   );
   ```
4. **Preserve `completed` and `failed` records**:
   - `completed` jobs and their stored MP4 assets remain 100% intact.
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

**CURRENT STATUS: Staged & Paused. Awaiting Operator Approval 1.**
