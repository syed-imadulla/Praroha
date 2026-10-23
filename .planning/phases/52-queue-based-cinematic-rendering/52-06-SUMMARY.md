# Phase 52 Wave 2 Summary: Provisioning and Verification of Container Apps Job `praroha-render-job`

**Phase**: 52 — Queue-Based Cinematic Rendering Architecture  
**Tasks**:
- `TASK-52-06`: Provision Container Apps Job `praroha-render-job` in `env-praroha-render`
- `TASK-52-07`: Verify Container Apps Job Configuration, Zero Ingress, and KEDA Scale-to-Zero  
**Execution Timestamp**: 2026-10-23T04:15:00Z / 2026-10-23T09:45:00+05:30  
**Status**: Completed & Verified  

---

## 1. Documentation Reconciliation

All Phase 52 planning and inventory files were audited and updated to reconcile stale references from worker image `v5` to verified release `v6`:

- **Image Repository**: `tendersaathiacr.azurecr.io/praroha-worker:v6`
- **Verified Digest**: `sha256:abb5713fa8d831ab3a3fdde7a1ebeca387c57dc9bfeac2f7f05803860c7d332d`
- **Authentication**: Passwordless Azure Managed Identity (`azure-identity`) with dual-queue client initialization (`cinematic-render-jobs`, `cinematic-render-poison`).
- **Files Reconciled**:
  - `.planning/phases/52-queue-based-cinematic-rendering/52-01-PLAN.md` (lines 75–88)
  - `.planning/phases/52-queue-based-cinematic-rendering/AZURE_RESOURCE_INVENTORY.md` (lines 19, 120–137, 245)
  - `.planning/phases/52-queue-based-cinematic-rendering/ROLLOUT_TEST_AND_ROLLBACK_PLAN.md` (line 56)

---

## 2. Azure Preflight Verification

Prior to provisioning any resources, cloud preflight checks verified the target environment:

1. **Subscription & Resource Group**:
   - Subscription ID: `36794f11-1aa5-4a25-a4aa-3b973c335e2d`
   - Resource Group: `rg-tendersaathi` (Central India)
2. **Storage Account & Queues**:
   - Storage Account: `stpraroharender` (`Standard_LRS`, `centralindia`, TLS 1.2, `allowBlobPublicAccess: false`, `provisioningState: Succeeded`).
   - Work Queue: `cinematic-render-jobs` exists; peek returned 0 messages.
   - Poison Queue: `cinematic-render-poison` exists; peek returned 0 messages.
3. **Dedicated Managed Environment**:
   - Environment: `env-praroha-render` exists in `Central India`.
   - Workload Profile: `ConsumptionOnly` (`workloadProfiles: null`).
   - Infrastructure Subnet: `null` (standard shared VNet profile).
4. **Worker Image in ACR**:
   - Registry: `tendersaathiacr.azurecr.io`
   - Tag: `praroha-worker:v6`
   - Digest: `sha256:abb5713fa8d831ab3a3fdde7a1ebeca387c57dc9bfeac2f7f05803860c7d332d`
5. **Production Backend Health & Feature Flags**:
   - Backend URL: `https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io/api/health`
   - Health check: `{"status":"healthy","database":"connected","storage":"connected","cache":"ready"}` (HTTP 200).
   - Backend Flag: `CINEMATIC_PREVIEW_ENABLED=False`
   - Frontend Vercel Flag: `VITE_ENABLE_CINEMATIC_PREVIEW=false`
6. **Job Pre-existence Check**:
   - `az containerapp job show --name praroha-render-job` confirmed no job previously existed.

---

## 3. Managed Identity & Least-Privilege RBAC Configuration

To avoid credential leakage, hardcoded connection strings, or sharing the backend's Add-only SAS (`sp=a`), a dedicated User-Assigned Managed Identity was created with least-privilege role assignments:

1. **Identity Provisioned**:
   - **Name**: `uami-praroha-render`
   - **Resource ID**: `/subscriptions/36794f11-1aa5-4a25-a4aa-3b973c335e2d/resourcegroups/rg-tendersaathi/providers/Microsoft.ManagedIdentity/userAssignedIdentities/uami-praroha-render`
   - **Client ID**: `6ec7ec48-9deb-4518-b530-fbc483a9b0c7`
   - **Principal ID**: `f0eff22c-3999-4236-aa03-570d3f2a380c`
2. **Least-Privilege RBAC Assignments**:
   - **ACR Image Pull**:
     - Role: `AcrPull` (`7f951dda-4ed3-4680-a7ca-43fe172d538d`)
     - Scope: `/subscriptions/36794f11-1aa5-4a25-a4aa-3b973c335e2d/resourceGroups/rg-tendersaathi/providers/Microsoft.ContainerRegistry/registries/tendersaathiacr`
   - **Primary Work Queue Processing**:
     - Role: `Storage Queue Data Message Processor` (`8a0f5c17-1135-430d-a468-b37758bc6a37`)
     - Scope: `/subscriptions/36794f11-1aa5-4a25-a4aa-3b973c335e2d/resourceGroups/rg-tendersaathi/providers/Microsoft.Storage/storageAccounts/stpraroharender/queueServices/default/queues/cinematic-render-jobs`
     - Allows: Dequeue, update visibility, and delete completed messages.
   - **Poison Queue Dead-Lettering**:
     - Role: `Storage Queue Data Message Sender` (`c6a89b2d-59bc-44d0-9896-0f6e12d7b80a`)
     - Scope: `/subscriptions/36794f11-1aa5-4a25-a4aa-3b973c335e2d/resourceGroups/rg-tendersaathi/providers/Microsoft.Storage/storageAccounts/stpraroharender/queueServices/default/queues/cinematic-render-poison`
     - Allows: Push dead-letter messages when retries exceed 3.
   - **KEDA Queue Scaling Metrics**:
     - Role: `Storage Queue Data Reader` (`19e480e4-59f4-4215-a422-a670f13d80d2`)
     - Scope: `/subscriptions/36794f11-1aa5-4a25-a4aa-3b973c335e2d/resourceGroups/rg-tendersaathi/providers/Microsoft.Storage/storageAccounts/stpraroharender`
     - Allows: KEDA scaler to query queue depth and metadata without message dequeuing.
3. **Verification**:
   - All 4 assignments verified via `az role assignment list --assignee f0eff22c-3999-4236-aa03-570d3f2a380c --all`.

---

## 4. Container Apps Job Provisioning Details

The job was created using `az containerapp job create` with the following verified parameters:

- **Job Name**: `praroha-render-job`
- **Environment**: `env-praroha-render` (Standard ACA, `centralindia`)
- **Trigger Type**: `Event`
- **Replica Timeout**: `300` seconds (matching worker 300s lease)
- **Replica Retry Limit**: `2`
- **Parallelism**: `1`
- **Replica Completion Count**: `1`
- **Minimum Executions**: `0` (enforces strict scale-to-zero when queues are empty)
- **Maximum Executions**: `2` (capped concurrency during Phase 52 rollout)
- **Polling Interval**: `15` seconds
- **Image**: `tendersaathiacr.azurecr.io/praroha-worker:v6`
- **Compute Resources**: `cpu: 1.0`, `memory: 2.0Gi`
- **Container Arguments**: `--queue` (supplied via `--args=--queue`, verified in JSON template as `args: ["--queue"]`)
- **Registry Authentication**:
  - Server: `tendersaathiacr.azurecr.io`
  - Identity: `/subscriptions/36794f11-1aa5-4a25-a4aa-3b973c335e2d/resourcegroups/rg-tendersaathi/providers/Microsoft.ManagedIdentity/userAssignedIdentities/uami-praroha-render`
- **Scale Rule Configuration**:
  - Type: `azure-queue`
  - Metadata: `accountName: stpraroharender`, `queueName: cinematic-render-jobs`, `queueLength: "1"`
  - Authentication: `identity: <uami-praroha-render resource ID>`
- **Environment Variables**:
  - `AZURE_STORAGE_ACCOUNT_NAME=stpraroharender`
  - `AZURE_STORAGE_QUEUE_ENDPOINT=https://stpraroharender.queue.core.windows.net`
  - `AZURE_STORAGE_QUEUE_NAME=cinematic-render-jobs`
  - `AZURE_STORAGE_POISON_QUEUE_NAME=cinematic-render-poison`
  - `AZURE_CLIENT_ID=6ec7ec48-9deb-4518-b530-fbc483a9b0c7` (Client ID of `uami-praroha-render`)
  - `STORAGE_PROVIDER=supabase`
  - `SUPABASE_BUCKET=seed-unfold-assets`
  - `SUPABASE_URL=https://stxnxkzaftmwcbtvgzbm.supabase.co`
  - `DATABASE_URL=secretref:database-url`
  - `SUPABASE_KEY=secretref:supabase-key`
- **Secret Hygiene & Security**:
  - Secret values for `database-url` and `supabase-key` were extracted directly from the existing `praroha-backend` configuration using authorized Azure CLI queries.
  - Commands were executed with shell tracing disabled (`set +x`) into ephemeral variables.
  - No secret values, connection strings, or plaintexts were printed to standard output, logs, or stored in repository files.

---

## 5. Post-Provisioning Verification & Quality Gates

The provisioned Container Apps Job was inspected using `az containerapp job show` and `az containerapp job execution list`:

| Verification Item | Specification / Expectation | Verified State | Status |
| :--- | :--- | :--- | :--- |
| **Worker Image** | `tendersaathiacr.azurecr.io/praroha-worker:v6` | `tendersaathiacr.azurecr.io/praroha-worker:v6` | PASS |
| **Container Mode** | `--queue` | `args: ["--queue"]` | PASS |
| **Server / Ingress** | Zero Ingress / No HTTP listener | `ingress: null` (no ports open) | PASS |
| **Managed Identity** | `uami-praroha-render` | Attached as User-Assigned Identity | PASS |
| **ACR Registry Auth** | Managed Identity (`uami-praroha-render`) | `identity: <uami-praroha-render resource ID>` | PASS |
| **KEDA Scale Rule** | `azure-queue` on `cinematic-render-jobs` | Configured with `queueLength: 1`, UAMI auth | PASS |
| **Scale-to-Zero** | 0 active executions when queue is empty | `az containerapp job execution list` -> `[]` | PASS |
| **Running Status** | Ready | `runningStatus: "Ready"`, `provisioningState: "Succeeded"` | PASS |
| **Backend Health** | Production backend healthy | HTTP 200 `status: healthy` | PASS |
| **Feature Flags** | Disabled in backend and frontend | `CINEMATIC_PREVIEW_ENABLED=False`, frontend=false | PASS |

---

## 6. Exact Next Task

The next approved task in `.planning/phases/52-queue-based-cinematic-rendering/52-01-PLAN.md` is **Wave 3: Backend Outbox Dispatch Implementation**:

- **`TASK-52-09`**: Create PostgreSQL database migration for `render_outbox` table (tracking `job_id`, `project_id`, `payload`, `status`, `attempt_count`, `last_error`, `claimed_at`, `created_at`, `updated_at`).
