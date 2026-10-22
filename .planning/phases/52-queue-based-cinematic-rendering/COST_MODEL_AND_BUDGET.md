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

## 3. Pilot Scenario Cost Projections

| Component | Standard Pilot (100 Renders) | Heavy Pilot (500 Renders) | Stress Test (1,000 Renders with 3x Retries) |
| :--- | :--- | :--- | :--- |
| **Worker Compute** | ₹3.83 INR | ₹19.13 INR | ₹38.25 INR |
| **Queue Operations** | ₹0.01 INR | ₹0.02 INR | ₹0.05 INR |
| **Log Ingestion** | ₹0.10 INR | ₹0.49 INR | ₹1.00 INR |
| **Internet Egress** | ₹1.11 INR | ₹5.55 INR | ₹11.10 INR |
| **Base / Idle Fees** | ₹0.00 INR | ₹0.00 INR | ₹0.00 INR |
| **Total Projected Cost** | **₹5.05 INR** | **₹25.19 INR** | **₹50.40 INR** |
| **Budget Cap Utilization (₹500)** | **1.01%** | **5.04%** | **10.08%** |

---

## 4. Hard Financial Safeguards & Circuit Breakers

To guarantee that costs cannot breach the ₹500 cap under unexpected retry loops or queue backlog:

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
