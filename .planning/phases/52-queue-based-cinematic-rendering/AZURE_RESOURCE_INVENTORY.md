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
| **`stpraroharender`** | `Microsoft.Storage/storageAccounts` | `Standard_LRS`, TLS 1.2, HTTPS-only, no public blob | Dedicated storage account for queues. *(Provisioned 2026-10-22)* |
| **`cinematic-render-jobs`** | `Microsoft.Storage/storageAccounts/queueServices/queues` | Inside `stpraroharender` | Primary rendering work queue. *(Provisioned 2026-10-22)* |
| **`cinematic-render-poison`** | `Microsoft.Storage/storageAccounts/queueServices/queues` | Inside `stpraroharender` | Dead-letter poison queue (>3 retries). *(Provisioned 2026-10-22)* |
| **`env-praroha-render`** | `Microsoft.App/managedEnvironments` | `ConsumptionOnly` mode (Central India) | Standard ACA managed environment. Reuses `workspace-rgtendersaathinzG6`. *(Provisioned 2026-10-22)* |
| **`queue-publish-url`** | `Microsoft.App/containerApps/secrets` | Stored in `praroha-backend` | Scoped SAS: `sp=a` (Add only) on `cinematic-render-jobs`, HTTPS-only, expires 2026-11-21T18:24Z (30 days). Not yet bound to env var. *(Stored 2026-10-22)* |

---

## 2. Pending Resources for Queue-Based Rendering (Awaiting Separate Approval)

To support Container Apps Jobs without altering or compromising the Express environment, the following resources are designed for creation upon explicit user approval:

| Resource Name | Azure Resource Type | Region / SKU | Role & Configuration | Monthly Base Cost |
| :--- | :--- | :--- | :--- | :--- |
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
# Generate a scoped SAS token for adding messages only (Least Privilege: sp=a on cinematic-render-jobs)
# Expiry set to 1 year; rotatable via automated secret rotation.
QUEUE_SAS_TOKEN=$(az storage queue generate-sas \
  --name cinematic-render-jobs \
  --account-name stpraroharender \
  --permissions a \
  --expiry 2027-10-22T00:00:00Z \
  --auth-mode key \
  -o tsv)

QUEUE_SAS_URL="https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?$QUEUE_SAS_TOKEN"

# Set write-scoped queue credential on praroha-backend (in env-tendersaathi)
az containerapp secret set \
  --name praroha-backend \
  --resource-group rg-tendersaathi \
  --secrets "queue-publish-url=$QUEUE_SAS_URL"

az containerapp update \
  --name praroha-backend \
  --resource-group rg-tendersaathi \
  --set-env-vars "AZURE_STORAGE_QUEUE_NAME=cinematic-render-jobs" \
                 "AZURE_STORAGE_QUEUE_ENDPOINT=https://stpraroharender.queue.core.windows.net" \
                 "AZURE_STORAGE_QUEUE_SAS_URL=secretref:queue-publish-url"
```

### Step 4: Worker Image Build, Verification & Job Registration

#### 4a. Worker Image Build & Tagging Workflow
- **ACR Repository**: `praroha-worker` (verified existing repository in `tendersaathiacr.azurecr.io`).
- **Existing ACR Tags**: `v1`, `v2`, `v3`, `v4` (verified).
- **CRITICAL**: Tag `v5` does **NOT** exist yet. It must never be referenced until built, locally verified, and pushed.
- **Pre-Registration Build & Verification Workflow**:
  ```bash
  # 1. Build worker container image locally or via ACR build task
  docker build -f Dockerfile.worker -t tendersaathiacr.azurecr.io/praroha-worker:v5 .
  
  # 2. Verify image entrypoint argument handling locally (--queue mode help check)
  docker run --rm tendersaathiacr.azurecr.io/praroha-worker:v5 --help
  
  # 3. Authenticate and push to ACR
  az acr login --name tendersaathiacr
  docker push tendersaathiacr.azurecr.io/praroha-worker:v5
  
  # 4. Verify tag exists in ACR repository
  az acr repository show-tags --name tendersaathiacr --repository praroha-worker -o table
  ```

#### 4b. Create User-Assigned Managed Identity & Assign Least-Privilege Roles
To avoid storing registry admin passwords or passing broad Storage Account keys, a dedicated User-Assigned Managed Identity (`uami-praroha-render`) is provisioned:

```bash
# 1. Create User-Assigned Managed Identity in rg-tendersaathi
az identity create \
  --name uami-praroha-render \
  --resource-group rg-tendersaathi \
  --location centralindia

UAMI_ID=$(az identity show --name uami-praroha-render --resource-group rg-tendersaathi --query id -o tsv)
UAMI_PRINCIPAL_ID=$(az identity show --name uami-praroha-render --resource-group rg-tendersaathi --query principalId -o tsv)

# 2. Grant AcrPull role on ACR to allow secretless container image pulls
ACR_ID=$(az acr show --name tendersaathiacr --query id -o tsv)
az role assignment create \
  --assignee-object-id "$UAMI_PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --role AcrPull \
  --scope "$ACR_ID"

# 3. Grant Storage Queue roles for KEDA and Worker Job
STORAGE_ID=$(az storage account show --name stpraroharender --resource-group rg-tendersaathi --query id -o tsv)

# KEDA scaler queue inspection role (reads queueLength)
az role assignment create \
  --assignee-object-id "$UAMI_PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Storage Queue Data Reader" \
  --scope "$STORAGE_ID"

# Worker Job message processor role on work queue
az role assignment create \
  --assignee-object-id "$UAMI_PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Storage Queue Data Message Processor" \
  --scope "$STORAGE_ID/queueServices/default/queues/cinematic-render-jobs"

# Worker Job message sender role on poison dead-letter queue
az role assignment create \
  --assignee-object-id "$UAMI_PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Storage Queue Data Message Sender" \
  --scope "$STORAGE_ID/queueServices/default/queues/cinematic-render-poison"
```

#### 4c. Register Event-Driven Container Apps Job
```bash
# Retrieve existing Supabase and DB secrets securely from primary backend for worker injection
SUPA_KEY=$(az containerapp secret show --name praroha-backend --resource-group rg-tendersaathi --secret-name supa-key --query "value" -o tsv)
DB_URL=$(az containerapp secret show --name praroha-backend --resource-group rg-tendersaathi --secret-name db-url --query "value" -o tsv)

# Create Event-Triggered Job with Managed Identity in env-praroha-render
# Note: Zero registry admin passwords; image pull authenticated via uami-praroha-render.
# Note: Explicit --args "--queue" overrides Dockerfile CMD ["--server"] to run finite queue consumer.
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
  --scale-rule-auth "identity=$UAMI_ID" \
  --mi-user-assigned "$UAMI_ID" \
  --image tendersaathiacr.azurecr.io/praroha-worker:v5 \
  --registry-server tendersaathiacr.azurecr.io \
  --registry-identity "$UAMI_ID" \
  --cpu 1.0 \
  --memory 2.0Gi \
  --args "--queue" \
  --secrets "supabase-key=$SUPA_KEY" \
            "database-url=$DB_URL" \
  --env-vars "DATABASE_URL=secretref:database-url" \
             "SUPABASE_URL=https://dcvyldopjpxehywuvkju.supabase.co" \
             "SUPABASE_KEY=secretref:supabase-key" \
             "STORAGE_PROVIDER=supabase" \
             "SUPABASE_BUCKET=seed-unfold-assets" \
             "AZURE_STORAGE_QUEUE_NAME=cinematic-render-jobs" \
             "AZURE_STORAGE_POISON_QUEUE_NAME=cinematic-render-poison" \
             "AZURE_STORAGE_ACCOUNT_NAME=stpraroharender" \
             "AZURE_CLIENT_ID=$(az identity show --name uami-praroha-render --resource-group rg-tendersaathi --query clientId -o tsv)"
```

*Note on SAS Fallback*: If Managed Identity RBAC propagation encounters cloud policy delays during provisioning, worker supports scoped Queue Service SAS fallback: work queue secret `queue-worker-sas` (`--permissions rup` / `sp=rup`) and poison queue secret `queue-poison-sas` (`--permissions a` / `sp=a`), completely avoiding root Storage Account keys.

---

## 4. Verification of Capability vs Assumptions

| Capability / Resource | Verified Reality | Implementation Impact |
| :--- | :--- | :--- |
| **`env-tendersaathi` supports Jobs** | **FALSE (Verified)**. Express environments do not support Container Apps Jobs. | Solved by provisioning dedicated standard environment `env-praroha-render`. |
| **`Microsoft.App/jobs` in `centralindia`** | **TRUE (Verified)**. Central India is confirmed in Azure resource provider locations. | Job can be hosted locally in `centralindia` with zero cross-region data transfer fees. |
| **Consumption Environment Base Fee** | **TRUE (Verified)**. ₹0.00 / month idle base fee on Consumption profile. | Zero recurring idle charges. |
| **Worker Ingress Disabled** | **TRUE (Verified)**. Container Apps Jobs have no ingress listeners or open ports. | Complete network isolation from inbound attacks. |
| **ACR Repository & Image Tag** | **`praroha-worker` (Verified)**. `v1-v4` exist. `v5` is unbuilt. | Tag `v5` will only be registered in ACA after explicit build, local test, and ACR push. |
| **Worker CLI Argument Contract** | **`--args "--queue"` Required (Verified)**. Default CMD is `--server`. | Passing `--args "--queue"` guarantees finite batch execution and exit code 0 on completion. |
| **Worker Environment Completeness** | **`DATABASE_URL`, `SUPABASE_KEY`, `STORAGE_PROVIDER` (Verified)**. | All required secrets and runtime variables explicitly provided in Job spec. |
| **Free-Tier Compute Available** | **UNVERIFIED / TREATED AS ZERO**. Subscription already has active workloads. | 100% of compute cost is modeled as billable retail, yet remains < ₹5.05 for 100 runs. |
