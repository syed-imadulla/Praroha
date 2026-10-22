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

### 1. Primary Backend Queue Publishing (`praroha-backend` in `env-tendersaathi`)
- Because `env-tendersaathi` is an Express environment, managed identity support on individual containers may be restricted or subject to preview instability.
- **Least-Privilege Mechanism**: A scoped connection string or SAS token with **write-only** permissions (`sp=a` - Add messages only) is injected into `praroha-backend` via the native Container App Secret `queue-publish-conn-string`.
- This guarantees:
  - Primary API cannot peek, dequeue, or delete messages from the work queue.
  - Primary API cannot access the dead-letter poison queue.
  - Zero credentials are transmitted across client connections.

### 2. Container Apps Job Queue Scaler & Worker (`praroha-render-job` in `env-praroha-render`)
- **KEDA Scaler Authentication**: Uses secret reference `queue-connection-string` or User-Assigned Managed Identity `tendersaathi-identity` assigned the role `Storage Queue Data Contributor` on `stpraroharender`.
- **Worker Egress Only**: The container runs with **zero ingress**. It initiates outbound HTTPS traffic over port 443 exclusively to:
  - Azure Storage Queues (`*.queue.core.windows.net`)
  - Supabase Storage (`*.supabase.co`)
  - Supabase PostgreSQL database

---

## Consequences & Verification

- **Positive**: Complete network isolation for rendering compute; guaranteed scale-to-zero; zero monthly base fees; clean separation of concerns between web traffic and batch media processing.
- **Negative / Risks**: Managing two ACA environments in `rg-tendersaathi`. Mitigated by having the rendering environment be completely serverless and sharing the existing Log Analytics workspace.
- **Decision Status**: Pending user confirmation of cloud provisioning.
