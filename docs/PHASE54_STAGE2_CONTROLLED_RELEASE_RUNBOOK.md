# PRAROHA Phase 54: Stage 2 Controlled Public Release Runbook

**Document Version:** 1.0.0 (Release Candidate)  
**Date:** October 25, 2026  
**Status:** **GATED — AWAITING USER LAUNCH CONFIRMATION**

---

## 1. Release Architecture & Roles

- **Web Application API:** Azure Container App `praroha-backend` (Central India, 0.5 vCPU / 1.0 GiB) running `tendersaathiacr.azurecr.io/praroha-backend:v7.5`.
- **Rendering Compute:** Azure Container Apps Job `praroha-render-job` (Central India, 1.0 vCPU / 2.0 GiB, timeout 300s, scale-to-zero) in dedicated environment `env-praroha-render`.
- **Message Transport:** Azure Storage Queue `cinematic-render-jobs` and poison queue `cinematic-render-poison` on storage account `stpraroharender`.
- **Object Storage:** Supabase Cloud Storage bucket `seed-unfold-assets`.
- **Frontend SPA:** Vercel Production deployment at `https://praroha-ai.vercel.app`.
- **Emergency Rollback Image:** `tendersaathiacr.azurecr.io/praroha-backend:v7.4` (`sha256:7722da2f830abfd27c4540e0c10296685c4e2cf02609547087a5786d47f19ff3`).

---

## 2. Release Gates & Operational Invariants

| Gate ID | Condition | Mechanism | Status Prior to Launch |
|---|---|---|---|
| **GATE-01** | Backend Public Flag | `CINEMATIC_PREVIEW_PUBLIC_ENABLED=false` | **CLOSED (Disabled)** |
| **GATE-02** | Frontend Build Flag | `VITE_ENABLE_CINEMATIC_PREVIEW=unset/false` | **CLOSED (Disabled)** |
| **GATE-03** | Per-User Quota | Max 2 accepted renders / rolling 24h (`Retry-After`) | **ACTIVE & ENFORCED** |
| **GATE-04** | Per-User Concurrency | Max 1 active concurrent render (`Retry-After: 30`) | **ACTIVE & ENFORCED** |
| **GATE-05** | Global Capacity | Max 5 outstanding renders globally (`Retry-After: 60`) | **ACTIVE & ENFORCED** |
| **GATE-06** | Advisory Locking | `pg_advisory_xact_lock` transaction serialization | **ACTIVE & ENFORCED** |
| **GATE-07** | Dead-Letter Handling | Max 3 retries &rarr; dead-lettered to `cinematic-render-poison` | **ACTIVE & ENFORCED** |
| **GATE-08** | Budget Protection | Filtered ₹200/mo pilot budget (`stpraroharender`, `praroha-render-job`, `env-praroha-render`) | **ACTIVE & ENFORCED** |
| **GATE-09** | Asset Retention | `CinematicPreviewRetentionSweeper` 60-day lifecycle | **IMPLEMENTED & VERIFIED** |

---

## 3. Step-by-Step Staged Execution Plan

> [!CAUTION]
> **HARD STOP:** Do NOT execute Phase 2 through Phase 5 without separate explicit user authorization.

### Phase 1: Preflight Verification (Completed & Green)
- [x] Verify Git state is clean on `main`.
- [x] Full dedicated cinematic test battery passed (121 passed, 0 failed in 16.91s).
- [x] Frontend production bundle compiled with zero errors (`tsc && vite build`).
- [x] Azure budgets verified: `praroha-infrastructure-budget` (₹3,000/mo) and `praroha-rendering-pilot-budget` (₹200/mo with all 3 rendering resource IDs).
- [x] Storage queues empty (`cinematic-render-jobs: 0`, `cinematic-render-poison: 0`).
- [x] Worker job idle at 0 active executions.
- [x] Live backend healthy on `/api/health`.

---

### Phase 2: Backend Public Gate Activation (Requires User Confirmation)
Activate the public cinematic preview flag on Azure Container Apps. This opens render dispatch to all authenticated users under the strict protection of Phase 52 quotas.

```bash
az containerapp update \
  -n praroha-backend \
  -g rg-tendersaathi \
  --set-env-vars CINEMATIC_PREVIEW_PUBLIC_ENABLED=true
```

**Verification:**
Wait for the deployment revision to succeed and verify effective environment variable:
```bash
az containerapp show \
  -n praroha-backend \
  -g rg-tendersaathi \
  --query "properties.template.containers[0].env[?name=='CINEMATIC_PREVIEW_PUBLIC_ENABLED'].value" \
  -o tsv
# Expected output: true
```

---

### Phase 3: Backend Smoke Validation
Authenticate as a legitimate non-operator test user and send a preview request:
```bash
# 1. Non-operator preview dispatch request
curl -s -X POST https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io/api/projects/<TEST_PROJECT_ID>/media/cinematic-preview/jobs \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"entity_type":"world","entity_id":"<ENTITY_ID>","duration_sec":5,"aspect_ratio":"16:9"}'

# Expected response: HTTP 202 Accepted (instead of HTTP 403 Forbidden)
```

---

### Phase 4: Frontend Production Deployment
Once backend smoke verification passes, configure the build environment on Vercel and deploy the production bundle:

```bash
# 1. Add feature flag to Vercel production environment
npx vercel env add VITE_ENABLE_CINEMATIC_PREVIEW production
# When prompted, enter value: true

# 2. Trigger fresh production build (Vite compiles environment variables at build time)
npx vercel --prod
```

**Verification:**
Check the live production domain `https://praroha-ai.vercel.app` to confirm:
- The `Cinematic Preview` button is active and interactive (no longer grayed out or displaying the disabled tooltip).

---

### Phase 5: Controlled End-to-End Verification
1. **Interactive Trigger:** Click `Cinematic Preview` in the UI on a test project with existing concept art.
2. **State Transition:** UI displays `"Creating your video..."` with spinning loader and `"Non-blocking background synthesis"`.
3. **Queue Ingestion:** Worker scales from 0 to 1 replica, processes FFmpeg rendering in ~40–60s, uploads MP4 to Supabase, updates status to `completed`, and drains the queue.
4. **Playback:** Video player mounts and plays 720p H.264 preview with synthetic watermarking and audio.
5. **Quota Notice:** Dispatching a 3rd render displays the rate-limit notice: `"Daily cinematic render quota exceeded: maximum 2 renders per 24-hour window. Please try again in approximately..."`.

---

## 6. Rollback Runbook (Recovery & Incident Response)

In the event of an anomaly, high error rate, unexpected cloud cost, or queue backlog, execute the appropriate tier:

### Tier 1: Instant Public Access Cutoff (<15 Seconds)
Disables public access immediately; restricts access back to authorized operator allowlist:
```bash
az containerapp update \
  -n praroha-backend \
  -g rg-tendersaathi \
  --set-env-vars CINEMATIC_PREVIEW_PUBLIC_ENABLED=false
```

### Tier 2: Subsystem Emergency Kill Switch (<15 Seconds)
Completely shuts down the cinematic preview endpoint (returns `HTTP 503 Service Unavailable`):
```bash
az containerapp update \
  -n praroha-backend \
  -g rg-tendersaathi \
  --set-env-vars CINEMATIC_PREVIEW_ENABLED=false CINEMATIC_PREVIEW_PUBLIC_ENABLED=false
```

### Tier 3: Frontend Feature Revert (<30 Seconds)
Revert Vercel production deployment to the previous pre-verified bundle:
```bash
npx vercel rollback
# Alternatively:
# npx vercel env rm VITE_ENABLE_CINEMATIC_PREVIEW production --yes && npx vercel --prod
```

### Tier 4: Backend Image Rollback (<45 Seconds)
Restores certified backend image `v7.4`:
```bash
az containerapp update \
  -n praroha-backend \
  -g rg-tendersaathi \
  --image tendersaathiacr.azurecr.io/praroha-backend:v7.4
```
*Note: Rolling update in Azure Container Apps preserves database data and connection pools with zero downtime.*
