# Phase 52 Task 52-03: Rendering Environment Provisioning Summary

**Phase**: 52 — Queue-Based Cinematic Rendering Architecture  
**Task**: TASK-52-03 — Provision Dedicated Standard ACA Managed Environment `env-praroha-render`  
**Execution Timestamp**: 2026-10-22T18:15:53Z / 2026-10-22T23:45:53+05:30  
**Status**: Completed & Verified  

---

## 1. Provisioned Environment Specifications

- **Resource Name**: `env-praroha-render`
- **Resource ID**: `/subscriptions/36794f11-1aa5-4a25-a4aa-3b973c335e2d/resourceGroups/rg-tendersaathi/providers/Microsoft.App/managedEnvironments/env-praroha-render`
- **Resource Group**: `rg-tendersaathi`
- **Region**: `Central India` (`centralindia`)
- **Environment Mode**: `ConsumptionOnly`
- **Workload Profiles**: `null` (Pure serverless consumption; zero Dedicated profile charges)
- **KEDA Scaler Version**: `2.20.2` (Built-in event-driven scaler enabled for `azure-queue`)
- **Provisioning State**: `Succeeded`
- **Default Domain**: `gentletree-02317e9e.centralindia.azurecontainerapps.io`
- **Static Ingress IP**: `135.235.233.70`

---

## 2. Reused Log Analytics Workspace Configuration

- **Logging Destination**: `log-analytics`
- **Linked Workspace**: `workspace-rgtendersaathinzG6`
- **Customer ID**: `94ef9476-2148-49f4-909f-b1e5851dc574`
- **Shared Key Authentication**: Successfully passed via transient shell variable during creation; zero secrets logged or stored.
- **Log Retention**: 30 days (Per-GB 2018 tier)
- **Base Fee Impact**: **₹0.00** incremental base fee (reuses the existing workspace).

---

## 3. Verification & Isolation Evidence

1. **Zero Workloads Created**:
   - `az containerapp list -g rg-tendersaathi` confirms **0 container apps** inside `env-praroha-render`.
   - `az containerapp job list -g rg-tendersaathi` confirms **0 container apps jobs** in the resource group or environment (`[]`).
2. **Production Web API Undisturbed**:
   - `praroha-backend` remains running in `env-tendersaathi` on revision `praroha-backend--latest`.
   - Live health probe `GET /api/health` responded with HTTP 200 OK (`status: healthy`).
3. **Legacy Worker Inactive**:
   - `praroha-cinematic-worker` remains on `ingress: null` and scaled to 0 replicas.
4. **Feature Guard Discipline**:
   - Server-side guard `CINEMATIC_PREVIEW_ENABLED=False` (HTTP 503) and frontend `VITE_ENABLE_CINEMATIC_PREVIEW=false` remain locked to disabled.

---

## 4. Cost and Financial Modeling

- **One-Time Provisioning Fee**: **₹0.00**
- **Monthly Fixed Base Fee**: **₹0.00 / month** (ConsumptionOnly environments incur no base compute fee when idle).
- **Ongoing Operational Cost**: ₹0 compute charge while empty. Once the Container Apps Job is deployed in future waves, executions will be billed per vCPU-second and GiB-second strictly during active renders. Shared log ingestion into `workspace-rgtendersaathinzG6` is billed at retail per-GB consumption rates (~₹0.001 per render).

---

## 5. Next Steps

- **TASK-52-04**: Generate scoped SAS token with permissions `a` (Add only) on `cinematic-render-jobs` and inject as ACA secret `queue-publish-url` on `praroha-backend` (awaiting separate user review and approval).
