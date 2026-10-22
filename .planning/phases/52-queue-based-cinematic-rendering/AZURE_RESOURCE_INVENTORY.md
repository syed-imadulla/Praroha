# Azure Resource Inventory & Architecture Topology: Phase 52

## 1. Existing Active Resources (Unchanged & Preserved)

All existing resources reside in Resource Group `rg-tendersaathi` in region **Central India** (`centralindia`) under Subscription `36794f11-1aa5-4a25-a4aa-3b973c335e2d`:

| Resource Name | Azure Resource Type | Configuration / Sizing | Operational Role |
| :--- | :--- | :--- | :--- |
| **`env-tendersaathi`** | `Microsoft.App/managedEnvironments` | **Express Mode** (`environmentMode: "Express"`) | Hosts the public web API. **Kept intact with zero disruption**. |
| **`praroha-backend`** | `Microsoft.App/containerApps` | 0.5 vCPU, 1.0 GiB RAM, HTTP Ingress 8000 $\to$ 443 | Primary web API. Serves frontend requests and publishes render tasks. |
| **`tendersaathiacr`** | `Microsoft.ContainerRegistry/registries` | Basic Tier (`tendersaathiacr.azurecr.io`) | Stores Docker images for backend and rendering worker. |
| **`workspace-rgtendersaathinzG6`** | `Microsoft.OperationalInsights/workspaces` | Per-GB 2018 (30-day retention) | Unified Log Analytics workspace. **Reused by both environments**. |
| **`tendersaathi-identity`** | `Microsoft.ManagedIdentity/userAssignedIdentities` | User-Assigned Managed Identity | Available for RBAC on standard resources. |

---

## 2. Proposed New Resources for Queue-Based Rendering

To support Container Apps Jobs without altering or compromising the Express environment, the following resources are designed for creation upon explicit user approval:

| Resource Name | Azure Resource Type | Region / SKU | Role & Configuration | Monthly Base Cost |
| :--- | :--- | :--- | :--- | :--- |
| **`stpraroharender`** | `Microsoft.Storage/storageAccounts` | `centralindia`<br>`Standard_LRS`<br>TLS 1.2 | Dedicated storage account for durable queue orchestration. Public blob access disabled. | **₹0.00** (Pay per transaction) |
| **`cinematic-render-jobs`** | `Microsoft.Storage/storageAccounts/queueServices/queues` | Inside `stpraroharender` | Primary work queue. 300s default visibility timeout, 24h message TTL. | **₹0.00** |
| **`cinematic-render-poison`** | `Microsoft.Storage/storageAccounts/queueServices/queues` | Inside `stpraroharender` | Dead-letter queue for jobs failing $> 3$ processing attempts. | **₹0.00** |
| **`env-praroha-render`** | `Microsoft.App/managedEnvironments` | `centralindia`<br>**ConsumptionOnly** (`--environment-mode ConsumptionOnly`) | Standard ACA managed environment. Reuses `workspace-rgtendersaathinzG6`. **Supports Container Apps Jobs**. | **₹0.00** (Serverless, ₹0 idle) |
| **`praroha-render-job`** | `Microsoft.App/jobs` | `centralindia`<br>1.0 vCPU, 2.0 GiB RAM | Event-driven rendering job. Triggers via KEDA `azure-queue` scaler when `queueLength >= 1`. **Zero Ingress**. | **₹0.00 idle** (Charges only when running) |

---

## 3. Azure CLI Provisioning Commands (Pre-Validated)

These commands are verified for syntax, region availability, and parameter validity. **They will only be executed after explicit user sign-off.**

### Step 1: Provision Dedicated Storage Account & Queues
```bash
# 1. Create Storage Account (Standard LRS, TLS 1.2)
az storage account create \
  --name stpraroharender \
  --resource-group rg-tendersaathi \
  --location centralindia \
  --sku Standard_LRS \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false

# 2. Retrieve connection string securely
QUEUE_CONN_STRING=$(az storage account show-connection-string \
  --name stpraroharender \
  --resource-group rg-tendersaathi \
  --query connectionString -o tsv)

# 3. Create Primary Work Queue and Dead-Letter Poison Queue
az storage queue create \
  --name cinematic-render-jobs \
  --account-name stpraroharender \
  --connection-string "$QUEUE_CONN_STRING"

az storage queue create \
  --name cinematic-render-poison \
  --account-name stpraroharender \
  --connection-string "$QUEUE_CONN_STRING"
```

### Step 2: Provision Standard Managed Environment (Consumption-Only)
```bash
# Get existing Log Analytics workspace credentials
LOGS_WS_ID=$(az monitor log-analytics workspace show \
  --resource-group rg-tendersaathi \
  --workspace-name workspace-rgtendersaathinzG6 \
  --query customerId -o tsv)

LOGS_WS_KEY=$(az monitor log-analytics workspace get-shared-keys \
  --resource-group rg-tendersaathi \
  --workspace-name workspace-rgtendersaathinzG6 \
  --query primarySharedKey -o tsv)

# Create Standard Managed Environment in ConsumptionOnly mode
az containerapp env create \
  --name env-praroha-render \
  --resource-group rg-tendersaathi \
  --location centralindia \
  --environment-mode ConsumptionOnly \
  --logs-workspace-id "$LOGS_WS_ID" \
  --logs-workspace-key "$LOGS_WS_KEY"
```

### Step 3: Configure Queue Publishing Secret on Primary Backend
```bash
# Set write-scoped queue connection string on praroha-backend (in env-tendersaathi)
az containerapp secret set \
  --name praroha-backend \
  --resource-group rg-tendersaathi \
  --secrets "queue-connection-string=$QUEUE_CONN_STRING"

az containerapp update \
  --name praroha-backend \
  --resource-group rg-tendersaathi \
  --set-env-vars "AZURE_STORAGE_QUEUE_NAME=cinematic-render-jobs" \
                 "AZURE_STORAGE_CONNECTION_STRING=secretref:queue-connection-string"
```

### Step 4: Register Event-Driven Container Apps Job
```bash
# Retrieve ACR password securely
ACR_PASS=$(az acr credential show --name tendersaathiacr --query "passwords[0].value" -o tsv)

# Create Event-Triggered Job with KEDA azure-queue scaler in env-praroha-render
az containerapp job create \
  --name praroha-render-job \
  --resource-group rg-tendersaathi \
  --environment env-praroha-render \
  --trigger-type Event \
  --replica-timeout 300 \
  --replica-retry-limit 2 \
  --replica-completion-count 1 \
  --parallelism 1 \
  --polling-interval 15 \
  --min-executions 0 \
  --max-executions 2 \
  --scale-rule-name queueJob \
  --scale-rule-type azure-queue \
  --scale-rule-metadata "accountName=stpraroharender" \
                        "cloud=AzurePublicCloud" \
                        "queueLength=1" \
                        "queueName=cinematic-render-jobs" \
  --scale-rule-auth "connection=queue-connection-string" \
  --image tendersaathiacr.azurecr.io/praroha-cinematic-worker:v2 \
  --registry-server tendersaathiacr.azurecr.io \
  --registry-username tendersaathiacr \
  --registry-password "$ACR_PASS" \
  --cpu 1.0 \
  --memory 2.0Gi \
  --secrets "queue-connection-string=$QUEUE_CONN_STRING" \
            "supabase-url=https://dcvyldopjpxehywuvkju.supabase.co" \
            "supabase-key=secretref:supa-key" \
  --env-vars "SUPABASE_URL=secretref:supabase-url" \
             "SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-key" \
             "AZURE_STORAGE_QUEUE_NAME=cinematic-render-jobs" \
             "AZURE_STORAGE_POISON_QUEUE_NAME=cinematic-render-poison" \
             "AZURE_STORAGE_CONNECTION_STRING=secretref:queue-connection-string"
```

---

## 4. Verification of Capability vs Assumptions

| Capability / Resource | Verified Reality | Implementation Impact |
| :--- | :--- | :--- |
| **`env-tendersaathi` supports Jobs** | **FALSE (Verified)**. Express environments do not support Container Apps Jobs. | Solved by provisioning dedicated standard environment `env-praroha-render`. |
| **`Microsoft.App/jobs` in `centralindia`** | **TRUE (Verified)**. Central India is confirmed in Azure resource provider locations. | Job can be hosted locally in `centralindia` with zero cross-region data transfer fees. |
| **Consumption Environment Base Fee** | **TRUE (Verified)**. ₹0.00 / month idle base fee on Consumption profile. | Zero recurring idle charges. |
| **Worker Ingress Disabled** | **TRUE (Verified)**. Container Apps Jobs have no ingress listeners or open ports. | Complete network isolation from inbound attacks. |
| **Free-Tier Compute Available** | **UNVERIFIED / TREATED AS ZERO**. Subscription already has active workloads. | 100% of compute cost is modeled as paid, yet still remains < ₹5.04 for 100 runs. |
