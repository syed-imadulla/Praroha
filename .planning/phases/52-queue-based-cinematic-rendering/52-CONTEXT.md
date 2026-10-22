# Phase 52 Context: Queue-Based Cinematic Rendering Architecture

## 1. Problem Statement & Root Cause
In Phase 51, the cinematic preview generation architecture was established using direct HTTP dispatch between the primary API and a dedicated worker container. However, during pre-deployment audits and Azure operational reviews:
1. **Network Ingress Vulnerability**: A dedicated HTTP worker requires open ports and continuous listening, even when idle.
2. **Container Restart Resilience**: If the API restarts after an HTTP dispatch or if the worker container recycles under heavy memory pressure, rendering tasks risk being stranded or orphaned without a durable queue contract.
3. **Azure Express Environment Incompatibility**: The existing `env-tendersaathi` environment is an **Azure Container Apps Express environment** (`environmentMode: "Express"`). Official Microsoft documentation explicitly confirms that Container Apps Jobs are **unsupported** in Express environments.

To provide true zero-cost scale-to-zero compute, bulletproof delivery guarantees, and complete network isolation, Phase 52 designs an **event-driven, queue-based dispatch architecture** leveraging Azure Storage Queues and a dedicated, standard Azure Container Apps Managed Environment.

---

## 2. Locked Decisions & Architectural Boundaries

### Decision 1: Dual-Environment Azure Architecture
- **Keep Existing Public Backend Undisturbed**: The public web API (`praroha-backend`) remains deployed in `env-tendersaathi` (Express environment) in `centralindia`. Zero migration risk, zero downtime, zero URL changes.
- **Dedicated Standard Managed Environment for Worker**: A new, separate standard Azure Container Apps Managed Environment (`env-praroha-render`) is provisioned with a **Consumption** profile (`--environment-mode ConsumptionOnly`). This environment hosts the Container Apps Job (`praroha-render-job`) and incurs **₹0.00 base monthly fee**.
- **Log Analytics Re-Use**: Both environments share the existing Log Analytics Workspace (`workspace-rgtendersaathinzG6`), ensuring centralized logging with zero incremental base charge.

### Decision 2: Azure Storage Queue as Work Queue
- **Azure Storage Queue (`stpraroharender`)** is selected over Azure Service Bus and Azure Functions.
- Zero base monthly fee (unlike Service Bus Standard's ~$10/mo fixed charge).
- Native KEDA scaler integration in Azure Container Apps Jobs (`scale-rule-type: azure-queue`).
- 300-second visibility timeout, built-in dequeue counting, and dead-letter queue (`cinematic-render-poison`).

### Decision 3: Zero Network Ingress for Worker Container
- The worker container runs as a **Container Apps Job** (`Microsoft.App/jobs`), which has **no network ingress, no open ports, and no web listener**.
- The job only initiates outbound HTTPS requests to:
  1. Azure Storage Queue (dequeue, delete, quarantine).
  2. Supabase Storage (download source images/audio, upload final MP4).
  3. Supabase PostgreSQL (atomic job status updates).

### Decision 4: Least-Privilege Queue Publishing from Primary Backend
- The primary backend (`praroha-backend` in Express environment) enqueues render jobs using a write-scoped secret (`queue-connection-string` or write-only SAS token). This avoids dependency on unverified Express managed identity support while ensuring least privilege (write-only, no read/delete access).

### Decision 5: Conservative Cost Model (Zero Free-Grant Assumption)
- Because `praroha-backend` already consumes compute against the subscription, the Phase 52 budget model assumes **0% free grant availability**.
- Every second of worker compute is priced at full retail consumption rates ($0.000024/vCPU-s + $0.000003/GiB-s $\approx$ ₹0.03825 INR per 15s render).
- Pilot execution (100 renders) is verified at **~₹5.04 INR**, remaining well under the ₹500 authorized cap.

---

## 3. Strict Planning-Only Boundary
In accordance with GSD safety protocols:
- **No new Azure resources** (`stpraroharender`, `env-praroha-render`, `praroha-render-job`) will be provisioned in this planning phase.
- **No runtime backend or frontend code** will be modified.
- **No live queue messages** will be published.
- **The frontend feature flag** (`VITE_ENABLE_CINEMATIC_PREVIEW`) remains locked to `false`.
