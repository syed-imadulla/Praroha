# Cost Model and Budget Audit: Phase 52

## 1. Budget Envelope & Baseline Principles
- **Authorized Pilot Budget Cap**: **₹500.00 INR**
- **Internal Target Spend**: **< ₹50.00 INR**
- **Subscription Baseline Audit**: The subscription (`36794f11-1aa5-4a25-a4aa-3b973c335e2d`) already hosts active workloads (`praroha-backend` under meter `Azure Container Apps - Standard - IN Central`).
- **Zero Free-Grant Rule**: Because existing workloads consume compute, **free-grant availability (180,000 vCPU-seconds) is treated as 0% available**. Every second of worker compute and storage operation is modeled at 100% billable retail rates.

---

## 2. One-Time vs Recurring vs Usage-Based Cost Breakdown

### A. One-Time Provisioning Costs
| Resource | Action | Provisioning Fee |
| :--- | :--- | :--- |
| `stpraroharender` (Storage Account) | Creation in `rg-tendersaathi` | **₹0.00** |
| `cinematic-render-jobs` (Queue) | Creation in Storage Account | **₹0.00** |
| `cinematic-render-poison` (Queue) | Creation in Storage Account | **₹0.00** |
| `env-praroha-render` (ACA Managed Environment) | Creation in ConsumptionOnly mode | **₹0.00** |
| `praroha-render-job` (Container Apps Job) | Registration in `env-praroha-render` | **₹0.00** |
| **Total One-Time Provisioning Cost** | | **₹0.00 INR** |

### B. Recurring Base Charges (Monthly Fixed Fees)
| Resource | Pricing Metric | Monthly Charge |
| :--- | :--- | :--- |
| `env-tendersaathi` (Express Environment) | Existing public API environment | Existing baseline |
| `env-praroha-render` (Consumption Environment) | Serverless managed environment | **₹0.00 / month** |
| `stpraroharender` (Standard LRS Storage) | Storage account overhead | **₹0.00 / month** |
| `workspace-rgtendersaathinzG6` | Shared Log Analytics workspace | Reused (No new workspace fee) |
| `praroha-render-job` (Scale-to-Zero Job) | Idle compute cost when queue is empty | **₹0.00 / month** |
| **Total Incremental Fixed Base Fees** | | **₹0.00 INR / month** |

### C. Incremental Usage-Based Unit Rates (Central India)
*Exchange Rate baseline: 1 USD = ₹85.00 INR*

1. **ACA Job Compute (Consumption Profile)**:
   - vCPU Price: `$0.000024` per vCPU-second $\approx$ **₹0.00204 INR per vCPU-s**
   - Memory Price: `$0.000003` per GiB-second $\approx$ **₹0.000255 INR per GiB-s**
   - **Per 15-second render execution (1.0 vCPU, 2.0 GiB RAM)**:
     $$\text{vCPU Cost} = 1.0 \times 15 \times 0.00204 = ₹0.0306\text{ INR}$$
     $$\text{Memory Cost} = 2.0 \times 15 \times 0.000255 = ₹0.00765\text{ INR}$$
     $$\mathbf{\text{Compute per Render}} = ₹0.0306 + ₹0.00765 = \mathbf{₹0.03825\text{ INR}}$$

2. **Azure Storage Queue Operations (Standard LRS)**:
   - Class 1 Operations (Put, Get, Delete): `$0.0004` per 10,000 operations $\approx$ **₹0.034 INR per 10k ops**
   - Per render lifecycle (1 Put + 1 Dequeue + 1 Delete = 3 ops):
     $$\text{Queue Cost} = \frac{3}{10,000} \times 0.034 = \mathbf{₹0.0000102\text{ INR}}$$

3. **Log Analytics Ingestion (`workspace-rgtendersaathinzG6`)**:
   - Ingestion rate: `$2.30` per GB $\approx$ **₹195.50 INR per GB**
   - Per render job logging volume: ~5 KB per execution
   - Per render job log cost:
     $$\text{Log Cost} = \frac{0.000005\text{ GB}}{1\text{ GB}} \times 195.50 = \mathbf{₹0.00098\text{ INR}}$$

4. **Network Egress (Azure to Supabase Storage)**:
   - Uploading one 720p MP4 preview: ~1.5 MB (0.0015 GB)
   - Azure grants 100 GB free internet egress per month per subscription.
   - Even assuming 100% billable internet egress at `$0.087` per GB ($\approx$ ₹7.40 INR/GB):
     $$\text{Egress Cost} = 0.0015\text{ GB} \times 7.40 = \mathbf{₹0.0111\text{ INR}}$$

---

## 3. Pilot Scenario Cost Projections & Sensitivity Analysis

> [!IMPORTANT]
> The figures below represent **engineering projections based on published Azure pricing units**, not verified invoices or guaranteed billing. Container startup durations, Log Analytics telemetry volume, and network egress can vary based on cloud conditions. A formal billing reconciliation checkpoint is mandated during the pilot.

### Sensitivity Matrix Across Varied Operational Conditions

| Scenario | Billable Duration per Job | Retries per 100 Jobs | Compute Cost | Queue & Log Cost | Egress Cost | Total Projected Cost | % of ₹500 Cap |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Best-Case Baseline** (100 jobs) | 15s (Instant start) | 0% | ₹3.83 INR | ₹0.11 INR | ₹1.11 INR | **₹5.05 INR** | 1.01% |
| **Realistic Operational** (100 jobs) | 28s (13s start + 15s render) | 5% | ₹7.50 INR | ₹0.12 INR | ₹1.16 INR | **₹8.78 INR** | 1.76% |
| **Conservative Ceiling** (100 jobs) | 45s (15s start + 30s render) | 15% | ₹13.20 INR | ₹0.14 INR | ₹1.28 INR | **₹14.62 INR** | 2.92% |
| **Worst-Case Stress** (100 jobs) | 60s max execution | 30% retries | ₹20.35 INR | ₹0.18 INR | ₹1.44 INR | **₹21.97 INR** | 4.39% |
| **Heavy Volume** (500 jobs) | 28s average | 5% | ₹37.50 INR | ₹0.60 INR | ₹5.80 INR | **₹43.90 INR** | 8.78% |

Even under the worst-case stress scenario with 30% crash retries and 60-second billing per job, the pilot expenditure remains $< ₹22.00$ INR, which is well within the project's internal $< ₹50.00$ target and less than 5% of the authorized ₹500 cap.

---

## 4. Hard Financial Safeguards, Acceptance Testing & Billing Reconciliation

### A. Automated Circuit Breakers
1. **Execution Concurrency Cap**:
   - `--max-executions 2`: Limits the event scaler to a maximum of 2 concurrent container executions under all conditions.
2. **Replica Timeout Ceiling**:
   - `--replica-timeout 300`: The container is killed by Azure if processing exceeds 5 minutes (preventing runaway compute bills).
3. **Queue Message TTL**:
   - Queue messages have an explicit 24-hour Time-To-Live (`time_to_live=86400`). Stale messages expire automatically without triggering renders.
4. **Poison Message Dead-Letter Threshold**:
   - If a message fails 3 times (`dequeue_count > 3`), it is moved to `cinematic-render-poison`, preventing infinite retry loops.
5. **Subscription-Level Budget Alert**:
   - An Azure Budget alert is set at ₹400 INR (80% of the ₹500 cap) with an automated notification.

### B. Pilot Billing Reconciliation & Acceptance Testing
During the approved cloud pilot, the following acceptance tests must be executed to reconcile projected vs actual billing:
1. **Initial 10-Render Reconciliation**:
   - Execute 10 synthetic canary renders.
   - Query Log Analytics `ContainerAppSystemLogs_CL` to record exact container start-to-stop billing seconds.
   - Query Azure Cost Management API at T+24h to verify actual billed meters against the ₹0.88 projection for 10 runs.
2. **Egress & Storage Op Verification**:
   - Verify that Supabase Storage MP4 upload size averages $\le 1.8$ MB and that queue operations do not generate unexpected billable API calls.
3. **Budget Sign-off Gate**:
   - If actual billing for 10 renders exceeds ₹3.00 INR (more than 3x projected), halt the pilot immediately for root cause analysis before proceeding to 100 renders.
