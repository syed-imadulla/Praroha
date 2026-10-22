# Phase 49: Azure Native Cinematic Worker Cloud Pilot & Persistence Verification Summary

## Executive Summary
Phase 49 delivered the cloud deployment, security hardening, and empirical verification of PRAROHA's dedicated cinematic preview rendering worker. Due to Azure Container Apps Jobs being unsupported in the existing environment (`env-tendersaathi`, Consumption tier), the worker was successfully deployed as a scale-to-zero Azure Container App (`praroha-cinematic-worker`).

All 4 Phase 49 acceptance criteria achieved **PASS** status. A full end-to-end cloud round-trip was executed against Supabase Storage and PostgreSQL without touching paid AI endpoints. The primary API service remains healthy and insulated from rendering workloads.

---

## 1. Confirmed Deployment Configuration

| Attribute | Deployment Detail |
| :--- | :--- |
| **Resource Name** | `praroha-cinematic-worker` |
| **Resource Group** | `rg-tendersaathi` |
| **Location** | Central India (`env-tendersaathi`) |
| **Container Image** | `tendersaathiacr.azurecr.io/praroha-worker:v4` (and `:latest`) |
| **Compute Profile** | **1.0 vCPU, 2.0 GiB RAM**, 4Gi ephemeral disk |
| **Scaling Policy** | **Min Replicas: 0, Max Replicas: 1** (Scale-to-zero enabled) |
| **Ingress Mode** | **Internal Only** (`external: false`, `targetPort: 8080`) |
| **FQDN (Internal)** | `praroha-cinematic-worker.whiteground-dc69e38a.centralindia.azurecontainerapps.io` |
| **Primary Backend Link**| `CINEMATIC_WORKER_URL=http://praroha-cinematic-worker:8080` configured on `praroha-backend` |
| **Primary Backend Health**| `https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io/api/health` -> **200 OK** |

---

## 2. Worker Security & Authentication Design

1. **Internal-Only Ingress**: Ingress is strictly internal (`external: false`), completely unreachable from the public internet.
2. **Service-to-Service Bearer Authentication**:
   - Every `POST /render` request requires a valid `Authorization: Bearer <token>` header.
   - The token is cryptographically derived from the shared environment secret (`hashlib.sha256(f"praroha-worker:{supa_key}".encode()).hexdigest()`) or an explicit `WORKER_AUTH_TOKEN`.
   - Unauthenticated or malformed requests are rejected with **HTTP 401 Unauthorized**.
3. **Payload Sanitization & SSRF Protection**:
   - `project_id` and `entity_id` are strictly validated against `^[a-zA-Z0-9_\-]+$`.
   - Asset paths are checked for path traversal (`..`, null bytes, outside directory access) and rejected with **HTTP 400 Bad Request**.
   - Remote asset URLs pointing to cloud metadata endpoints (`169.254.169.254`, `metadata.google`) are explicitly blocked with **HTTP 400 Bad Request**.
4. **Bounded Execution Timeout**:
   - Worker execution timeouts are clamped to `min(max(timeout_sec, 5.0), 120.0)` seconds, preventing rogue renders from hanging.

---

## 3. Storage and Persistence Round-Trip Evidence

The full round-trip was verified using a controlled test job (`job-p49-03a1beb8`) and entity (`world-pilot-420823`):

1. **Source Asset Preparation**: A 1280x720 keyframe image was generated and uploaded to Supabase Storage:
   `https://stxnxkzaftmwcbtvgzbm.supabase.co/storage/v1/object/public/seed-unfold-assets/projects/pilot-p49-test/media/image/world-pilot-420823_keyframe.png` (HTTP 200 OK).
2. **Database Job Creation**: A `GenerationJob` (`status: queued`, `progress: 0`) and corresponding `MediaAssetRecord` were inserted into PostgreSQL.
3. **Cloud Worker Execution**:
   - The worker replica downloaded the keyframe image from Supabase Storage.
   - Composed a 4-second 720p H.264 MP4 with Ken Burns motion effect and procedural soundscape in **2.05 seconds** (`peak_rss_mb: 75.68MB`).
   - Uploaded the MP4 directly to Supabase Storage bucket `seed-unfold-assets`.
   - Exited with code `0`.
4. **Database Verification**:
   - `GenerationJob` transitioned to `status="completed"`, `progress=100`, `error_message=None`.
   - `MediaAssetRecord` updated to `status="completed"`, `asset_url="https://stxnxkzaftmwcbtvgzbm.supabase.co/storage/v1/object/public/seed-unfold-assets/projects/pilot-p49-test/media/video/world-pilot-420823_1792675392.mp4"`.
   - Honest labeling verified: `is_synthetic: true`, `provider_label: "Cinematic Preview"`, `render_engine: "native-ffmpeg-worker"`.
5. **Playable Video Resolution**:
   - The stored Supabase URL was fetched via HTTP GET: **HTTP 200 OK**, **295,996 bytes**, `Content-Type: video/mp4`.
   - Valid MP4 container header (`ftyp` box) verified in binary stream.
6. **Failure Mode Handling**:
   - Tested invalid specification (`job-fail-8cb8f379`).
   - Worker returned exit code `1` and updated `GenerationJob.status="failed"` with descriptive error message (`"Invalid preview specification: Missing title, Duration 100s outside allowed range (3-60s)"`).
   - Zero false-success responses produced.

---

## 4. Cost Verification & Financial Audit

- **Resource Consumption**:
  - Render duration: **2.05 vCPU-seconds**
  - Memory consumption: **4.10 GiB-seconds**
  - Worker image storage in ACR: Basic registry tier.
- **Billing Telemetry**:
  - `az consumption usage list` confirms `PretaxCost: None` / **₹0.00** billable usage to date.
  - The measured compute falls entirely within Azure Container Apps' free monthly tier (180,000 vCPU-seconds and 360,000 GiB-seconds free per month).
  - Immediate zero-usage is acknowledged as preliminary until monthly invoice close, but estimated cost per 4s render is `< ₹0.005`.
  - The ₹50.00 target and ₹500.00 pilot ceiling remain completely intact.
  - Scale-to-zero (`minReplicas: 0`) ensures ₹0.00 ongoing compute charges when no rendering tasks are executing.

---

## 5. Test Suite & Validation Results

- **Automated Regression Suite**: **242 passed, 1 skipped** in 28.23s (`pytest backend/tests`).
  - Skipped test: `test_live_gemini_generation_seed_a_vs_seed_b` (cost-safety guard against paid AI API spend).
- **Worker Security Test Suite**: `backend/tests/test_worker_security.py` (6/6 passed):
  - `test_worker_unauthenticated_request_rejected`: PASS (401 Unauthorized)
  - `test_worker_authenticated_request_valid_token`: PASS (Bearer token authorized)
  - `test_worker_rejects_path_traversal`: PASS (400 Bad Request)
  - `test_worker_rejects_cloud_metadata_ssrf`: PASS (400 Bad Request)
  - `test_worker_rejects_invalid_project_id`: PASS (400 Bad Request)
  - `test_resolve_asset_blocks_ssrf_and_traversal`: PASS (Safe local resolution)

---

## 6. Phase 49 Acceptance Criteria Decision Table

| Acceptance Criterion | Result | Evidence |
| :--- | :---: | :--- |
| **1. Cloud Execution** | **PASS** | Genuine 720p H.264 MP4 composed in Azure Container App and uploaded to Supabase Storage (295,996 bytes, valid `ftyp` header). |
| **2. Storage & Persistence** | **PASS** | `GenerationJob` and `MediaAssetRecord` transitioned to `completed` in PostgreSQL; honest labeling verified (`is_synthetic: true`, `provider_label: "Cinematic Preview"`). |
| **3. Security & Isolation** | **PASS** | Ingress internal-only; Bearer token required; path traversal & SSRF rejected; bounded 5s–120s timeout; maxReplicas=1. |
| **4. Cost & Budget Safety** | **PASS** | ₹0.00 measured billable cost, scale-to-zero active, well below ₹50 target and ₹500 ceiling. |
| **5. Primary API Durability**| **PASS** | `praroha-backend` (/api/health) returns 200 OK healthy; zero local FFmpeg execution on the 0.5 vCPU web container. |

**Final Phase 49 Verdict: ALL CRITERIA PASSED**

---

## 7. Rollback Instructions

If the isolated cinematic worker must be de-provisioned:
1. Clear the worker reference from primary backend:
   ```bash
   az containerapp update -n praroha-backend -g rg-tendersaathi --remove-env-vars CINEMATIC_WORKER_URL
   ```
2. Delete the worker Container App:
   ```bash
   az containerapp delete -n praroha-cinematic-worker -g rg-tendersaathi --yes
   ```
3. Primary backend automatically reverts to static manifest fallback for video previews without disruption.
