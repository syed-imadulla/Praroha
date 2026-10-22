# ADR-0052: Event-Driven Queue Dispatch Architecture with Dedicated Standard Managed Environment

## Status
**PROPOSED (Awaiting User Sign-off)** — Planning Phase 52

## Context & Problem Statement
PRAROHA delivers 6-second cinematic video previews by composing image keyframes, audio narrations, and background soundscapes using native FFmpeg. In Phase 51, the architecture used direct synchronous HTTP dispatch from the primary FastAPI backend to a dedicated worker container.

However, two critical production constraints were identified during pre-deployment audits:
1. **Network Ingress Vulnerability**: A dedicated HTTP worker container requires continuous network listening and port exposure.
2. **Azure Express Environment Incompatibility**: The existing primary web backend (`praroha-backend`) is deployed in `env-tendersaathi`, which is an **Azure Container Apps Express environment** (`environmentMode: "Express"`). According to official Microsoft documentation ([Azure Container Apps Express FAQ](https://learn.microsoft.com/en-us/azure/container-apps/express-faq)), **Container Apps Jobs are unsupported in Express environments**.

We require an architecture that:
- Completely eliminates network ingress from the worker container.
- Guarantees durable, idempotent job delivery with visibility timeouts and dead-lettering.
- Reuses the existing public backend in `env-tendersaathi` without disruption, migration, or downtime.
- Incurs **₹0.00 base monthly compute fee** and operates strictly within the ₹500 budget cap (< ₹50 target).

---

## Decision

We adopt **Option A (Refined)**: **Azure Storage Queue with an Event-Driven Azure Container Apps Job hosted in a separate Standard Managed Environment with a Consumption workload profile**.

```
┌────────────────────────────────────────────────────────┐
│  Existing Azure Container Apps Express Environment     │
│  (env-tendersaathi) — Central India                    │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  praroha-backend (FastAPI Web App)               │  │
│  │  - Public HTTP Ingress: port 8000 -> 443         │  │
│  │  - Serves REST API & Realtime Webhooks           │  │
│  │  - Publishes to Storage Queue via secret         │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │
                            │ 1. Transactional Outbox Enqueue
                            ▼
      ┌──────────────────────────────────────────────┐
      │  Azure Storage Account: stpraroharender      │
      │  Queue: cinematic-render-jobs                │
      │  Dead-Letter: cinematic-render-poison        │
      └─────────────────────┬────────────────────────┘
                            │
                            │ 2. KEDA Scaler Event (queueLength >= 1)
                            ▼
┌────────────────────────────────────────────────────────┐
│  NEW Dedicated Standard Managed Environment            │
│  (env-praroha-render) — ConsumptionOnly — ₹0 Base Fee  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  praroha-render-job (Container Apps Job)         │  │
│  │  - Zero Ingress (No HTTP listeners, no ports)    │  │
│  │  - Ephemeral execution: 1.0 vCPU, 2.0 GiB RAM    │  │
│  │  - Native FFmpeg composition in /tmp scratchpad  │  │
│  │  - Atomic status updates to Supabase PostgreSQL  │  │
│  │  - Uploads final MP4 to Supabase Storage         │  │
│  │  - Scales to 0 when idle (₹0 compute)            │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## Evaluation of Architectural Options

### Option A: Azure Storage Queue + Dedicated Standard ACA Environment (SELECTED)
- **Architecture**:
  - Primary backend remains in `env-tendersaathi` (Express) and writes render messages to Azure Storage Queue `cinematic-render-jobs`.
  - A new standard managed environment `env-praroha-render` is provisioned with `--environment-mode ConsumptionOnly`.
  - An event-triggered Container Apps Job `praroha-render-job` is registered with the native `azure-queue` scaler.
- **Compute Sizing**: 1.0 vCPU, 2.0 GiB RAM, 300s timeout, 0 to 2 parallel executions.
- **Cost Model**:
  - `env-praroha-render` base fee: **₹0.00 / month** (Consumption profile has no idle charge).
  - Log Analytics: Reuses existing `workspace-rgtendersaathinzG6` (no new workspace base fee).
  - Storage Account: `Standard_LRS` pay-per-operation (₹0.033 per 10k ops).
  - Execution cost: **₹0.03825 INR per 15-second render** (100 runs $\approx$ ₹3.83 INR).
- **Pros**:
  - Zero network ingress on worker (zero open ports).
  - True scale-to-zero compute (₹0 idle cost).
  - Native KEDA queue scaler with configurable polling and queue length threshold.
  - Zero impact or downtime for existing public backend.
  - Fully compliant with ₹500 budget limit (< ₹5.04 total for 100 runs).
- **Trade-off**: Cold start of 5–12 seconds for ephemeral container spinning, transparently handled by the frontend's stage-by-stage progressive loading indicator.

### Option B: Azure Service Bus + Worker (REJECTED)
- **Cost**:
  - Service Bus **Standard tier** charges a mandatory base fee of **~$10.00 USD / month (~₹850.00 INR / month)** just to exist, even with zero messages sent. This immediately violates the project's ₹500 total budget cap.
  - Service Bus **Basic tier** does not support Dead-Letter Queuing or duplicate detection.
- **Verdict**: **REJECTED** due to unacceptable fixed recurring costs.

### Option C: Azure Functions Queue Trigger (REJECTED)
- **Runtime Constraints**:
  - Azure Functions on Consumption plan enforces a **500 MB `/tmp` scratchpad limit** and **1.5 GB memory cap**, which is too tight for downloading multiple 1080p keyframe images, WAV stems, and running multi-pass FFmpeg encoding.
  - Custom Docker container support in Azure Functions is **unsupported on the Consumption plan** and requires the Premium Elastic plan (EP1) costing **~$150.00 USD / month (~₹12,000 INR / month)**.
- **Verdict**: **REJECTED** due to scratch disk constraints and prohibitive custom container costs.

---

## Security & Authentication Model

### 1. Separation of Responsibilities & Least-Privilege Credentials
A master Storage Account connection string contains the `AccountKey`, granting root administrative rights (Create, Read, Update, Delete, Manage) across all blobs, queues, and tables. Storing a master connection string on the public web API violates the principle of least privilege. Phase 52 enforces strict least-privilege credential separation:

- **Primary Backend (`praroha-backend` in Express environment `env-tendersaathi`)**:
  - Requires **enqueue-only** access to `cinematic-render-jobs`.
  - **Credential**: Uses a separately scoped Queue Service Shared Access Signature (SAS) token with permissions strictly restricted to `sp=a` (Add messages only) on `cinematic-render-jobs`.
  - Zero access to dequeue, peek, update, or delete messages from the work queue.
  - Zero access to the dead-letter poison queue (`cinematic-render-poison`).
  - Zero permissions to list or modify storage containers or other storage services.
- **KEDA Event Scaler (`env-praroha-render`)**:
  - Requires queue length inspection to evaluate scale triggers (`queueLength >= 1`).
  - **Credential**: Authenticates via User-Assigned Managed Identity (`uami-praroha-render`) assigned the `Storage Queue Data Reader` role on `stpraroharender`, or a scoped queue monitoring SAS with read-only permission (`sp=r` - Read metadata/length; noting that Azure Queue Service SAS uses canonical `raup` permission characters without 'l').
- **Worker Job Container (`praroha-render-job` in `env-praroha-render`)**:
  - Requires dequeuing, updating message visibility, and deleting completed messages from `cinematic-render-jobs`, plus enqueueing poison messages to `cinematic-render-poison`.
  - **Credential**: Authenticates via User-Assigned Managed Identity (`uami-praroha-render`) assigned:
    - `Storage Queue Data Message Processor` on `cinematic-render-jobs` (permits peek, dequeue, visibility update, delete).
    - `Storage Queue Data Message Sender` on `cinematic-render-poison` (permits adding dead-letter messages).
    - *Fallback if SAS required*: Work queue SAS using canonical permissions `sp=rup` (Read, Update, Process; noting that Azure Queue Service SAS does not support separate 'd' or 'l' flags), and poison queue SAS `sp=a`.
- **ACR Image-Pull Authentication**:
  - The worker job attaches `uami-praroha-render` with the `AcrPull` role assigned directly on `tendersaathiacr.azurecr.io`.
  - Container Apps Job is registered using `--registry-server tendersaathiacr.azurecr.io --registry-identity "$UAMI_RESOURCE_ID"`.
  - Avoids storing or using registry administrative passwords (`az acr credential show`).

### 2. Comprehensive Service Permissions Matrix

| Service / Component | Target Resource | Required Permissions | Credential Mechanism | Ingress / Port |
| :--- | :--- | :--- | :--- | :--- |
| **Primary API (`praroha-backend`)** | `cinematic-render-jobs` | `Add` (`sp=a`) only | Scoped Queue SAS (`queue-publish-url`) | 443 Inbound (Public HTTPS REST API) |
| **Primary API (`praroha-backend`)** | `render_outbox` & `generation_jobs` | `SELECT`, `INSERT`, `UPDATE` | Supabase DB pooler secret (`db-url`) | Port 6543 / 5432 Egress |
| **KEDA Scaler** | `cinematic-render-jobs` | Queue length inspection (`sp=r` / Reader) | Managed Identity (`uami-praroha-render`) / Reader SAS | None (Internal ACA engine) |
| **Worker Job (`praroha-render-job`)** | ACR `tendersaathiacr.azurecr.io` | `AcrPull` | Managed Identity (`uami-praroha-render`) | Port 443 Egress (Image pull) |
| **Worker Job (`praroha-render-job`)** | `cinematic-render-jobs` | Message Processor (`sp=rup`) | Managed Identity (`uami-praroha-render`) | Zero Ingress (No open ports) |
| **Worker Job (`praroha-render-job`)** | `cinematic-render-poison` | Message Sender (`sp=a`) | Managed Identity (`uami-praroha-render`) | Zero Ingress |
| **Worker Job (`praroha-render-job`)** | Supabase DB | `SELECT`, `UPDATE` (`generation_jobs`, `media_assets`) | `DATABASE_URL` secretref | Port 6543 / 5432 Egress |
| **Worker Job (`praroha-render-job`)** | Supabase Storage (`seed-unfold-assets`) | `GET` (stems), `PUT` (MP4) | `SUPABASE_KEY` secretref | Port 443 Egress |

### 3. Network Security Architecture & Egress Boundary Classification

To maintain security integrity, PRAROHA explicitly classifies network boundaries across three distinct architectural layers:

1. **Zero Inbound Ingress (Platform Enforced)**:
   - The worker runs as an Azure Container Apps Job (`Microsoft.App/jobs`). By design, Container Apps Jobs have no HTTP ingress controllers, no exposed ports, and no web listeners. Inbound network attacks are structurally blocked by the platform.
2. **Application-Level Destination Controls (Software Enforced)**:
   - Worker source code strictly restricts outbound connections to the four required endpoints: Azure Storage Queue (`stpraroharender.queue.core.windows.net`), Supabase DB (`aws-0-ap-south-1.pooler.supabase.com:6543`), Supabase Storage (`dcvyldopjpxehywuvkju.supabase.co`), and ACR during initial image pull (`tendersaathiacr.azurecr.io`).
3. **Network-Enforced Egress Restrictions (Infrastructure Layer)**:
   - In standard Consumption Azure Container Apps environments without custom VNet injection, outbound internet access is open by default.
   - *Infrastructure Dependency Note*: True packet-level network egress enforcement (blocking arbitrary outbound IP/FQDN traffic via Azure Firewall or NSGs with User-Defined Routes) requires deploying ACA into a dedicated Azure Virtual Network (VNet) with NAT Gateway or Azure Firewall. To avoid adding non-trivial fixed monthly cloud costs (~$32/mo for NAT Gateway, ~$900/mo for Azure Firewall) within the strict ₹500 budget constraint, packet-level egress lockdown is documented as an optional enterprise infrastructure dependency rather than a baseline requirement.

---

## Stale-Job Recovery & Liveness Protocol

Rather than relying on naive server restart sweeping or loose timestamps (`updated_at < now() - 10m`), Phase 52 establishes a formal lease and heartbeat timing contract:

1. **Atomic CAS Claim**:
   When the worker claims a job from the queue, it executes an atomic Compare-And-Swap:
   ```sql
   UPDATE generation_jobs
   SET status = 'processing',
       started_at = NOW(),
       updated_at = NOW(),
       worker_id = :worker_id,
       progress = 10
   WHERE id = :job_id
     AND status = 'queued'
   RETURNING id;
   ```
   If 0 rows are returned, the job was already claimed or cancelled; the worker safely deletes the message and terminates.
2. **Heartbeat & Visibility Renewal Contract**:
   - Average render execution: 12–18s (renderer accepts 3–60s duration).
   - Replica execution ceiling: 300s (`--replica-timeout 300`).
   - Queue visibility timeout: 300s default.
   - Worker heartbeat interval: Every 15 seconds during active rendering/uploading, worker updates `updated_at = NOW()` and incremental `progress`.
   - Visibility renewal: If an execution exceeds 60s, worker calls `update_message(visibility_timeout=120)` to ensure Azure Queue does not prematurely redeliver while rendering is in flight.
3. **Lease Expiration Threshold**:
   - Lease timeout is strictly set to **90 seconds** (6 missed 15s heartbeats).
   - `recover_orphaned_jobs()` on API restart or periodic background reaper will **ONLY** transition a job to `failed` if:
     - `status == 'processing'` AND `updated_at < NOW() - INTERVAL '90 seconds'` (worker is demonstrably dead/crashed).
     - `status == 'queued'` AND `created_at < NOW() - INTERVAL '15 minutes'` AND outbox record is confirmed `published` (KEDA failed to scale or message was permanently lost).
   - If a backend restart occurs while a worker is legitimately rendering (`updated_at > NOW() - 90s`), the job is **left untouched** and allowed to finish successfully.
4. **Idempotent Retry Recovery**:
   Whenever a stale job is transitioned to `failed`, the recovery routine sets `media_assets.request_hash = NULL`, enabling creators to click "Try Again" without duplicate-key collisions.

---

## Safe Production Rollback Protocol & Kill Switch

Azure Resource Manager validation for Container Apps Jobs enforces `maxExecutions >= 1`; setting `--max-executions 0` is invalid and rejected by the Azure API. Therefore, the rollback and emergency kill-switch protocol employs verified controls that preserve audit history without indiscriminately purging queues:

1. **Level 1 (T+1m) — Frontend Deactivation**: Set `VITE_ENABLE_CINEMATIC_PREVIEW=false` in Vercel to disable the UI button immediately.
2. **Level 2 (T+5m) — Backend Gate Deactivation**: Set `ENABLE_QUEUE_DISPATCH=false` on `praroha-backend` (returns clean HTTP 503 and ceases queue writes).
3. **Level 3 (T+10m) — Stop Running Executions**: Terminate any in-flight rendering containers:
   ```bash
   az containerapp job stop \
     --name praroha-render-job \
     --resource-group rg-tendersaathi
   ```
4. **Level 4 (T+12m) — Suspend Scale Triggers**: Suspend event scaling by switching trigger type to manual:
   ```bash
   az containerapp job update \
     --name praroha-render-job \
     --resource-group rg-tendersaathi \
     --trigger-type Manual
   ```
5. **Level 5 — Graceful Drain & Cancel**:
   Inspect pending messages in `cinematic-render-jobs`. Update associated `generation_jobs` in PostgreSQL to `cancelled` with message `"System undergoing maintenance. Please retry shortly."`, and route unrendered messages to an archival table before acknowledging queue deletion.

---

## Consequences & Verification Gate

- **Positive**: Complete network ingress isolation for rendering compute; guaranteed scale-to-zero; zero monthly base fees; clean separation of concerns between web traffic and batch media processing; resilient lease-based recovery preventing premature job termination during backend restarts; least-privilege credentials avoiding shared connection strings or ACR admin passwords.
- **Negative / Constraints**: Infrastructure dependency for strict packet-level egress enforcement (requires dedicated VNet + NAT/Firewall if packet-level egress filtering is mandated); ARM requires manual trigger suspension rather than zero-max-executions.
- **Budget Realism**: The ₹5.05 to ₹21.97 INR cost estimates represent engineering projections based on published Azure pricing units, not verified billing.
- **Mandatory Pilot Phase Gate**: The first cloud deployment must execute exactly **1 authorized synthetic canary render**, followed by an immediate billing and telemetry reconciliation in Azure Cost Management before any expanded pilot is authorized.
- **Decision Status**: Planned design specification for Phase 52 implementation. All acceptance criteria remain marked as planned until verified with empirical evidence.
