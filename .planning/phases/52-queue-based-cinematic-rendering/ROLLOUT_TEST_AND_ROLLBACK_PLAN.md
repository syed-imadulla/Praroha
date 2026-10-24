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
  - *Candidate Worker Image*: Built locally as `tendersaathiacr.azurecr.io/praroha-worker:v7` (ID `sha256:1df95b35a48cda4d77debb607ea0ff8a43ccf51244f9a44a0aa0ad3a11243b06`). Unpushed, undeployed. Production remains on `v6`.
- **Azure Billing Reconciliation**:
  - Status: **Pending until actual cost data becomes available**. The Azure Consumption API currently returns `pretaxCost: None` and `usageQuantity: None` for the current billing cycle. No projected numbers are reported as measured spend.
- **Status**: **CANARY EXECUTED & ACCEPTED WITH DOCUMENTED FPS RESOLUTION (Phase Gate D Complete)**.

#### Stage 5: Isolated Fault Injection & Resilience Testing Plan (Prepared — Awaiting Authorization)
*Strict Safety Rule: Must use isolated mock/local test resources only. Never inject faults into production queues, containers, or secrets.*
- **Scope & Scenarios**:
  1. **Outbox Interruption & Recovery**:
     - Simulate primary backend failure immediately after database commit of `render_outbox (status='pending')` but before queue enqueue.
     - Verify the background outbox sweeper (`CinematicOutboxSweeper`) claims stale pending entries with savepoint isolation and successfully enqueues to the queue without duplicating database jobs.
  2. **Worker Lease Renewal & Idempotent Claim**:
     - Simulate extended composition exceeding initial queue visibility timeout (300s).
     - Verify worker heartbeat loop extends lease via `update_message` visibility renewal and updates database heartbeat timestamps.
     - Simulate duplicate delivery of already-claimed or already-completed message; verify worker detects atomic claim conflict or terminal state, discards duplicate, and ACKs queue message without duplicate render.
  3. **Poison Message Routing & Terminal Diagnostics**:
     - Inject malformed/corrupted payloads (`schema_version != '1.0'`, invalid IDs, unexpected fields, credential injection attempts).
     - Verify worker decrements retry budget, moves message to poison queue upon exhaustion, records terminal `failed` state with descriptive error code (`MALFORMED_PAYLOAD`, `INVALID_SCHEMA`), and preserves diagnostic logs.
  4. **Preservation of Existing Completed Renders**:
     - Ensure test runs verify that completed jobs (like canary `0d9c2349-6eed-4686-b148-5f8f5d84c17f`) and outbox records are completely immutable and never modified or deleted by retry/recovery sweeps.
- **Gate Check**: 100% green on isolated resilience test battery; zero mutations to production queues.
- **Status**: **PLAN PREPARED / NOT EXECUTED (Phase Gate E)**. Awaiting separate operator authorization.

#### Stage 6: Frontend Feature Flag Enablement
- **Actions**:
  1. Toggle `VITE_ENABLE_CINEMATIC_PREVIEW=true` in Vercel environment variables for preview deployment.
  2. Verify creator UI in browser: button transitions from disabled to interactive, displays honest tooltip, runs progress animation, and plays back video upon completion.
- **Status**: Pending Stage 5 verification. Both backend and frontend flags currently remain **disabled**.

---

## 2. Acceptance & Quality Gates Matrix

| Gate ID | Verification Item | Target Standard | Tool / Method |
| :--- | :--- | :--- | :--- |
| **QG-01** | **Worker Ingress Audit** | Exactly 0 open network ports; no HTTP ingress listener. | `az containerapp job show` |
| **QG-02** | **Scale-to-Zero Verification** | 0 active executions when queue is empty; ₹0 idle compute. | Azure Portal / CLI query |
| **QG-03** | **No FFmpeg in Web API** | Zero video composition code or subprocesses in FastAPI container. | `test_no_ffmpeg_execution_inside_primary_api` |
| **QG-04** | **Zero Secrets in Payloads** | Messages contain only entity IDs and hashes. | Inspect queue message JSON |
| **QG-05** | **Honest Labeling Compliance** | Video asset metadata retains `is_synthetic: true` and `provider_label: "Cinematic Preview"`. | Inspect DB `media_assets` |
| **QG-06** | **End-to-End Latency** | Full queue-to-MP4 playback completed in $< 35$ seconds. | Synthetic canary run timer |
| **QG-07** | **Budget Verification** | Total pilot expenditure remains strictly $< ₹50.00$ INR. | Azure Cost Management query |

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
