# Rollout, Verification & Rollback Plan

## 1. Staged Rollout Sequence

To ensure zero downtime, strict security compliance, and budget safety, the queue-based rendering architecture follows a 6-stage gated rollout:

```
[Stage 1: Storage & Identity]
       │ ── Checkpoint: Storage Account & Queues created with RBAC role
       ▼
[Stage 2: ACA Job Deployment]
       │ ── Checkpoint: Worker image deployed with 0 ingress & scale-to-0 verified
       ▼
[Stage 3: Primary API Outbox Integration]
       │ ── Checkpoint: FastAPI enqueues messages without FFmpeg in web container
       ▼
[Stage 4: Synthetic Canary Test]
       │ ── Checkpoint: 1 synthetic render executes; MP4 stored & playable; latency < 25s
       ▼
[Stage 5: Fault Injection & Resilience Test]
       │ ── Checkpoint: Web restart recovery, visibility timeout, and poison queue verified
       ▼
[Stage 6: Feature Flag Gate]
       └── Checkpoint: Controlled UI enablement for internal verification
```

---

### Detailed Stage Gates

#### Stage 1: Azure Storage & Managed Identity Setup
- **Actions**:
  1. Create Azure Storage Account `stpraroharender` in resource group `rg-tendersaathi` (`location: centralindia`, `sku: Standard_LRS`).
  2. Create Queues: `cinematic-render-jobs` and `cinematic-render-poison`.
  3. Create User-Assigned Managed Identity `uami-praroha-render`.
  4. Assign least-privilege RBAC roles to `uami-praroha-render`:
     - `AcrPull` on `tendersaathiacr`.
     - `Storage Queue Data Reader` on `stpraroharender` (for KEDA scaler).
     - `Storage Queue Data Message Processor` on `cinematic-render-jobs`.
     - `Storage Queue Data Message Sender` on `cinematic-render-poison`.
  5. Generate scoped Queue Service SAS (`sp=a`) for primary backend enqueueing.
- **Gate Check**: Run `az storage message peek -q cinematic-render-jobs --auth-mode login` using managed identity to verify read/process access without admin credentials.

#### Stage 2: Standard ACA Environment & Job Provisioning (`env-praroha-render` & `praroha-render-job`)
- **Actions**:
  1. Create Standard ACA Managed Environment `env-praroha-render` in `centralindia` with `--environment-mode ConsumptionOnly`, linking existing `workspace-rgtendersaathinzG6`.
  2. Create Container Apps Job in `env-praroha-render` with:
     - `--trigger-type Event`
     - `--scale-rule-type azure-queue`
     - `--scale-rule-metadata "accountName=stpraroharender" "queueName=cinematic-render-jobs" "queueLength=1"`
     - `--scale-rule-auth "identity=$UAMI_ID"`
     - `--mi-user-assigned "$UAMI_ID"`
     - `--registry-server tendersaathiacr.azurecr.io --registry-identity "$UAMI_ID"`
     - `--min-executions 0 --max-executions 2 --replica-timeout 300`
     - `--args "--queue"`
     - `--image tendersaathiacr.azurecr.io/praroha-worker:v6` (built, locally tested, and pushed to ACR)
- **Gate Check**: Run `az containerapp job show -n praroha-render-job -g rg-tendersaathi` and verify:
  - `properties.environmentId` points to `env-praroha-render`.
  - `properties.template.containers[0].resources.cpu == "1.0"`.
  - Zero ingress configuration present in JSON output.
  - Initial active executions == 0 (scale-to-zero verified).

#### Stage 3: Primary API Outbox Integration (`praroha-backend`)
- **Actions**:
  1. Add `render_outbox` table migration in Supabase PostgreSQL. *(Completed & Verified 2026-10-23: 11 columns, 5 constraints, 3 indexes, 0 rows).*
  2. Update `CinematicDispatcherService` in `backend/app/services/cinematic_dispatcher.py` to write to `render_outbox` and dispatch to `cinematic-render-jobs`. *(Completed & Verified).*
   3. Deploy updated `praroha-backend` revision to ACA:
     - *Historical Note*: Initial deployments of v7 and v7.1 encountered startup exceptions (psutil worker import and boolean column migration fallback) and were safely rolled back to `v6` with `QUEUE_PUBLISH_URL` unbound. Telemetry confirmed 0 writes and zero data loss.
     - *Candidate Hardening*: Candidate `v7.3` (`sha256:74c0f103d0894ac931675c99dafdb273414af0c04cd781ed8675ba2ac44b0e1f`) separates runtime validation (zero DDL) from migrations and fails closed against PostgreSQL errors.
     - *Deployment Execution*: Deployed to production on 2026-10-23. `QUEUE_PUBLISH_URL=secretref:queue-publish-url` bound. Provisioning state `Succeeded`, status `Running`. Zero DDL executed on startup; `/api/health` returns HTTP 200 (`fallback_used: false`).
     - *Status*: **COMPLETED & VERIFIED (2026-10-23)**.
- **Gate Check**: Verify backend tests pass. Live `/api/health` returns HTTP 200. *(VERIFIED: HTTP 200, status healthy).*

#### Stage 4: Synthetic Canary Validation & Acceptance Audit
- **Actions**:
  1. Executed authorized one-shot synthetic canary render via `backend/scripts/run_canary_dispatch.py` on 2026-10-24 15:23 UTC.
  2. Verified transactional outbox publication (`published_at: 2026-10-24T15:23:31Z`) and Azure Queue enqueue.
  3. Verified ACA Job worker execution `praroha-render-job-rsjqv` (started: 15:23:40Z, succeeded: 15:24:35Z, duration: 55s wall-clock, render elapsed: 2.46s).
  4. Verified Supabase database record transition to `status = 'completed'` with honest metadata (`is_synthetic: true`, `provider_label: "Cinematic Preview"`).
  5. Verified Supabase Storage upload to `seed-unfold-assets`: `124,558` bytes, H.264, 1280x720, 6.000s duration, 0 decoding errors.
  6. Verified queue baseline: `cinematic-render-jobs` drained to 0, `cinematic-render-poison` remained 0, worker scaled back to 0.
- **FPS Discrepancy & Root Cause Audit**:
  - *Measured Output*: ffprobe measured `r_frame_rate: 25/1`, `avg_frame_rate: 25/1`, and `nb_read_frames: 150` over 6.0s (25.0 FPS) instead of expected 24 FPS.
  - *Root Cause*: `CinematicPreviewComposer` had a hardcoded `fps=25` constant and `d={duration * 25}` in its FFmpeg `zoompan` filter graph string, and `CinematicPreviewSpec` did not accept an `fps` parameter, dropping `options["fps"] = 24`.
  - *Code Remediation*:
    - Added `fps: int = 24` to `CinematicPreviewSpec` with validation against `{24, 30}`.
    - Wired `fps` dynamically into `zoompan` duration (`d=duration * fps`) and framerate (`fps={fps}`), and added `-r {fps}` to output arguments.
    - Updated `cinematic_worker.py` to forward `options["fps"]` into `CinematicPreviewSpec`.
    - Added regression tests in `test_cinematic_preview.py` and `test_cinematic_queue_worker.py` validating 24 and 30 FPS outputs with `ffprobe` and error-free FFmpeg decoding. Full backend suite (332 passed).
  - *Candidate Worker Image & Production Deployment*: Worker `v7` with the dynamic 24/30 FPS fix was built (`sha256:dac0a52998652cd586551af81747170b7f092ba67404d3eeb80563ac99199996`), published to ACR (`tendersaathiacr.azurecr.io/praroha-worker:v7`), and deployed to ACA Job `praroha-render-job` on 2026-10-24 following operator authorization. Verified in production with 0 active executions (scale-to-zero active).
- **Azure Billing Reconciliation**:
  - Status: **Pending until actual cost data becomes available**. The Azure Consumption API currently reports `pretaxCost: None` and `usageQuantity: None` across resources in `rg-tendersaathi`. No projected numbers are reported as measured spend.
- **Status**: **CANARY EXECUTED & ACCEPTED WITH DOCUMENTED FPS RESOLUTION; WORKER V7 DEPLOYED & VERIFIED**.

#### Stage 5: Isolated Fault Injection & Resilience Testing (Executed & Passed — Phase Gate E)
*Strict Safety Rule: Must use isolated mock/local test resources only. Never inject faults into production queues, containers, or secrets.*
- **Scope & Scenarios Executed**:
  1. **Outbox Interruption & Recovery**:
     - Simulated primary backend failure immediately after database commit of `render_outbox (status='pending')` but before queue enqueue.
     - Verified outbox sweeper (`CinematicOutboxSweeper`) claims stale pending entries with savepoint isolation and successfully enqueues without duplicating database jobs. Verified CAS concurrency leasing across multiple sweepers and exponential backoff retry budget exhaustion.
  2. **Worker Lease Renewal & Idempotent Claim**:
     - Simulated extended composition exceeding visibility threshold. Verified worker heartbeat loop extends lease via `update_message` (visibility 120s) and updates database heartbeat timestamps.
     - Simulated duplicate delivery of already-claimed (in-flight) and already-completed messages. Verified worker detects claim conflict or terminal state, discards duplicate, performs zero redundant work, and ACKs/deletes message from queue cleanly.
  3. **Poison Message Routing & Terminal Diagnostics**:
     - Injected malformed/corrupted payloads (`schema_version != '1.0'`, invalid IDs, unexpected fields, credential injection attempts).
     - Verified immediate validation rejection before queue enqueue, zero secret leakage in logs, poison routing when `dequeue_count > 3` to `cinematic-render-poison`, terminal error status recording, and release of locks.
  4. **Preservation of Existing Completed Renders (Data Immutability)**:
     - Modeled directly against production canary `0d9c2349-6eed-4686-b148-5f8f5d84c17f`. Verified sweeper passes, duplicate deliveries, and poison handling never mutate or delete completed records or stored video asset URLs.
- **Gate Check**: 100% green on isolated resilience test battery (`pytest backend/tests/test_cinematic_resilience_phase_gate_e.py` — 9 passed in 1.12s); zero mutations to production queues, containers, or secrets.
- **Status**: **EXECUTED & 100% PASSED (Phase Gate E Complete)**.

#### Stage 6: Frontend / Backend Feature Flag Enablement (Phase Gate F — PREPARED, NOT EXECUTED; AWAITING SEPARATE AUTHORIZATION)
- **Scope & Controlled Verification Checklist**:
  1. *Backend Activation*: Set `CINEMATIC_PREVIEW_ENABLED=true` on `praroha-backend` Container App via `az containerapp update`.
  2. *Frontend Activation*: Set `VITE_ENABLE_CINEMATIC_PREVIEW=true` on Vercel frontend.
  3. *Browser Verification Walkthrough*:
     - Internal operator session on canonical project (`25e15040-73e6-47e5-b030-d95598e17292`).
     - Button interactivity & honest tooltip (*"AI-generated synthetic 720p 24fps preview with motion and ambient soundscape"*).
     - Single click dispatch with instant button disabling (double-dispatch prevention).
     - Progress animation (*"Queued in render pipeline..."* -> *"Generating cinematic composition..."*).
     - In-browser HTML5 `<video>` playback at 24 FPS with ambient soundscape.
     - Persistent UI badge: *"AI Cinematic Preview (Synthetic)"*.
     - Failure resilience & retry button verification (`request_hash` released).
     - Scale-to-zero confirmation (0 active executions, queues drained).
  4. *Instant Rollback*:
     - Level 1: `VITE_ENABLE_CINEMATIC_PREVIEW=false` in Vercel (< 1 min).
     - Level 2: `az containerapp update ... --set-env-vars CINEMATIC_PREVIEW_ENABLED=false` (< 2 mins).
     - Level 3: `az containerapp job update ... --trigger-type Manual` (< 3 mins).
- **Status**: **PREPARED — NOT EXECUTED; AWAITING SEPARATE OPERATOR AUTHORIZATION**. Both flags strictly remain **disabled**. Zero customer traffic enabled. For full step-by-step commands, see Section 10 of [PRODUCTION_ROLLOUT_RUNBOOK.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/phases/52-queue-based-cinematic-rendering/PRODUCTION_ROLLOUT_RUNBOOK.md).

---

## 2. Acceptance & Quality Gates Matrix

| Gate ID | Verification Item | Target Standard | Measured Production Value | Status |
| :--- | :--- | :--- | :--- | :--- |
| **QG-01** | **Worker Ingress Audit** | Exactly 0 open network ports; no HTTP ingress listener. | `properties.configuration.ingress == null` | **PASS** |
| **QG-02** | **Scale-to-Zero Verification** | 0 active executions when queue is empty; ₹0 idle compute. | Exactly 0 active executions (`az containerapp job execution list`) | **PASS** |
| **QG-03** | **No FFmpeg in Web API** | Zero video composition code or subprocesses in FastAPI container. | Web API purely dispatches to `render_outbox`; zero FFmpeg invocations | **PASS** |
| **QG-04** | **Zero Secrets in Payloads** | Messages contain only entity IDs, hashes, and schema metadata. | Canonical queue schema 1.0; credentials strictly isolated | **PASS** |
| **QG-05** | **Honest Labeling Compliance** | Video asset metadata retains `is_synthetic: true` and `provider_label: "Cinematic Preview"`. | Verified in DB `media_assets` and `generation_jobs` result JSON | **PASS** |
| **QG-06** | **End-to-End Latency** | **Original Standard**: Full queue-to-MP4 playback completed in $< 35$ seconds (historical baseline).<br>**Approved Revised SLA**: Two-tier standard (Warm render $< 10$s; Cold-start $< 75$s; accepted by operator). | Warm render: **2.46s** (Passes $< 10$s and $< 35$s).<br>Cold start from zero: **64.0s** (Exceeded original 35s standard; meets approved 75s threshold). | **ACCEPTED BY OPERATOR**<br>*(Revised two-tier SLA approved and met. Historical 35s cold-start target was unmet and remains preserved).* |
| **QG-07** | **Budget Verification** | Total pilot expenditure remains strictly $< ₹50.00$ INR. | Measured billed charges: `pretaxCost: None` (Azure Consumption API ingestion delay).<br>Engineering compute estimate: ~₹0.14 INR (55s runtime on 1.0 vCPU / 2.0 GiB RAM). | **PENDING (Reconciliation)**<br>*(Estimates kept strictly separate from measured charges; pending invoice posting).* |

---

## 3. Rollback Procedures

If any gate fails or unexpected behavior is detected during rollout, execute the graduated rollback plan:

### Level 1: Instant Client Isolation (T + 1 minute)
- **Trigger**: Any frontend display bug, unexpected error state, or confusing user feedback.
- **Action**: In Vercel Project Settings, set `VITE_ENABLE_CINEMATIC_PREVIEW=false` and trigger instant redeploy.
- **Result**: The "Cinematic Preview" button immediately returns to its disabled state. No user can trigger new renders.

### Level 2: Backend Dispatch Decoupling (T + 5 minutes)
- **Trigger**: Queue dispatch exceptions, database outbox locks, or message serialization issues.
- **Action**: Update `praroha-backend` container to unbind `QUEUE_PUBLISH_URL` or revert container revision to `tendersaathiacr.azurecr.io/praroha-backend:v6`.
- **Result**: API returns clean HTTP 503 `"Cinematic preview temporarily unavailable"` with zero impact on core text/world/audio capabilities.
- **Non-Destructive Invariant**: Do NOT drop `render_outbox` or delete database records during an operational rollback. Preserving rows guarantees audit traceability.

### Level 3: Azure Worker Scale Suspension & Graceful Drain (T + 10 minutes)
- **Trigger**: KEDA scaling runaway, excessive retries, or cost alert trigger.
- **Action**:
  1. **Stop Active Running Job Instances**:
     ```bash
     az containerapp job stop \
       --name praroha-render-job \
       --resource-group rg-tendersaathi
     ```
  2. **Suspend Event-Trigger Scaling** (switch trigger to Manual; ARM rejects `--max-executions 0`):
     ```bash
     az containerapp job update \
       --name praroha-render-job \
       --resource-group rg-tendersaathi \
       --trigger-type Manual
     ```
  3. **Inspect and Reconcile Pending Messages Gracefully (DO NOT run `message clear`)**:
     - Inspect messages in `cinematic-render-jobs` without clearing them indiscriminately.
     - For pending cinematic preview jobs, reconcile only `job_type = 'media_video'` records (preserving all other job types like DNA, world, audio):
       ```sql
       UPDATE generation_jobs
       SET status = 'failed',
           error_code = 'SERVICE_SUSPENDED',
           error_message = 'Cinematic rendering temporarily suspended for maintenance. Please retry shortly.'
       WHERE job_type = 'media_video'
         AND status = 'queued'
         AND id IN (
             SELECT id FROM media_assets
             WHERE media_type = 'video' AND provider_name = 'Cinematic Preview'
         );
       ```
     - Clear `request_hash = NULL` on affected `media_assets` (`media_assets.id` is identical to `generation_jobs.id`) so users can cleanly re-request once service is restored:
       ```sql
       UPDATE media_assets
       SET request_hash = NULL,
           status = 'failed',
           error_message = 'Cinematic preview interrupted by service suspension. Request hash released for clean retry.'
       WHERE media_type = 'video'
         AND provider_name = 'Cinematic Preview'
         AND status IN ('queued', 'processing');
       ```
  4. **Result**: Background rendering compute halts immediately (0 active executions, ₹0 compute cost). Zero user requests are lost or left in orphaned `processing` state. Non-cinematic jobs remain 100% unaffected. Audit integrity is 100% preserved.

---

## 4. Authoritative Production Runbook
For the complete step-by-step non-destructive execution checklist and safety classifications, see:
- [PRODUCTION_ROLLOUT_RUNBOOK.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/phases/52-queue-based-cinematic-rendering/PRODUCTION_ROLLOUT_RUNBOOK.md)
