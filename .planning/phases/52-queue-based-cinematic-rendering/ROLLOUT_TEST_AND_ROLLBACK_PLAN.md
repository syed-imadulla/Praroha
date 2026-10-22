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
  3. Assign RBAC role `Storage Queue Data Contributor` to `tendersaathi-identity` scoped to `stpraroharender`.
- **Gate Check**: Run `az storage message peek -q cinematic-render-jobs --auth-mode login` using managed identity to verify read/write access.

#### Stage 2: Standard ACA Environment & Job Provisioning (`env-praroha-render` & `praroha-render-job`)
- **Actions**:
  1. Create Standard ACA Managed Environment `env-praroha-render` in `centralindia` with `--environment-mode ConsumptionOnly`, linking existing `workspace-rgtendersaathinzG6`.
  2. Create Container Apps Job in `env-praroha-render` with:
     - `--trigger-type Event`
     - `--scale-rule-type azure-queue`
     - `--scale-rule-metadata "accountName=stpraroharender" "queueName=cinematic-render-jobs" "queueLength=1"`
     - `--scale-rule-auth "connection=queue-connection-string"`
     - `--min-executions 0 --max-executions 2 --replica-timeout 300`
     - `--image tendersaathiacr.azurecr.io/praroha-cinematic-worker:v2`
- **Gate Check**: Run `az containerapp job show -n praroha-render-job -g rg-tendersaathi` and verify:
  - `properties.environmentId` points to `env-praroha-render`.
  - `properties.template.containers[0].resources.cpu == "1.0"`.
  - Zero ingress configuration present in JSON output.
  - Initial active executions == 0 (scale-to-zero verified).

#### Stage 3: Primary API Outbox Integration (`praroha-backend`)
- **Actions**:
  1. Add `render_outbox` table migration in Supabase PostgreSQL.
  2. Update `CinematicDispatcherService` in `backend/app/services/cinematic_dispatcher.py` to write to `render_outbox` and dispatch to `cinematic-render-jobs`.
  3. Deploy updated `praroha-backend` revision to ACA.
- **Gate Check**: Verify 250 backend tests pass with zero regressions. Confirm FastAPI startup logs indicate `recover_orphaned_jobs()` and outbox initialization succeed.

#### Stage 4: Synthetic Canary Validation
- **Actions**:
  1. Execute synthetic end-to-end test script `backend/tests/test_canary_queue_render.py` using canonical demo seed assets.
  2. Observe KEDA trigger execution in Azure Log Analytics.
  3. Confirm rendered MP4 is uploaded to Supabase Storage bucket `seed-unfold-assets`.
- **Gate Check**: Verify MP4 metadata: `duration == 6.0s`, `codec == h264`, `resolution == 1280x720`, `is_synthetic == true`, `provider_label == "Cinematic Preview"`.

#### Stage 5: Fault Injection & Resilience Testing
- **Actions**:
  1. **Restart Simulation**: Enqueue a job and immediately restart the `praroha-backend` container. Confirm the outbox sweeper detects and recovers the job without duplicate execution.
  2. **Poison Message Test**: Inject an intentionally malformed message (`{"schema_version": "0.1", "corrupt": true}`). Verify the message is dequeued, retried up to 3 times, moved to `cinematic-render-poison`, and the job marked `failed` with clear diagnostics.
- **Gate Check**: Zero orphaned locks in `generation_jobs`; `cinematic-render-poison` contains exactly 1 entry.

#### Stage 6: Frontend Feature Flag Enablement
- **Actions**:
  1. Toggle `VITE_ENABLE_CINEMATIC_PREVIEW=true` in Vercel environment variables for preview deployment.
  2. Verify creator UI in browser: button transitions from disabled to interactive, displays honest tooltip, runs progress animation, and plays back video upon completion.

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
- **Action**: Update `praroha-backend` environment variable `ENABLE_CINEMATIC_DISPATCH=false` or rollback container revision to `baefbc6`.
- **Result**: API returns clean HTTP 503 `"Cinematic preview temporarily unavailable"` with zero impact on core text/world/audio capabilities.

### Level 3: Azure Worker Teardown & Purge (T + 10 minutes)
- **Trigger**: KEDA scaling runaway, excessive retries, or cost alert trigger.
- **Action**:
  ```bash
  # 1. Stop and delete the container apps job
  az containerapp job delete -n praroha-render-job -g rg-tendersaathi --yes
  
  # 2. Clear all messages from queues
  az storage message clear -q cinematic-render-jobs --account-name stpraroharender --auth-mode login
  az storage message clear -q cinematic-render-poison --account-name stpraroharender --auth-mode login
  ```
- **Result**: All background rendering compute stops immediately. Compute cost drops to ₹0.
