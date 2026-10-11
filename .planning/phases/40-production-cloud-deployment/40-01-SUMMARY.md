# Phase 40 Summary: Production Cloud Deployment (Azure + Vercel + Supabase)

## Overview
Phase 40 successfully transitioned PRAROHA from local container testing to a live, publicly accessible production cloud architecture. The system leverages Azure Container Apps (ACA) for the FastAPI backend, Vercel for the React/Vite PWA frontend, and Supabase for persistent PostgreSQL, Object Storage, Authentication, and Realtime event broadcast.

---

## Live Cloud Production Endpoints

| Component | Provider / Platform | Production URL | Operational Status |
| :--- | :--- | :--- | :--- |
| **Frontend Application** | Vercel Edge CDN | `https://praroha-ai.vercel.app` *(Alias: `https://frontend-iota-green-73.vercel.app`)* | **Live & Verified** (HTTPS, PWA Active) |
| **Backend API** | Azure Container Apps | `https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io` | **Live & Verified** (`/api/health` 200 OK) |
| **Database & Auth** | Supabase Cloud | `https://stxnxkzaftmwcbtvgzbm.supabase.co` | **Live & Connected** (PostgreSQL + JWT) |
| **Media Storage** | Supabase Object Storage | Bucket: `seed-unfold-assets` | **Live & Connected** (Persistent assets) |
| **Realtime WebSockets** | Supabase Realtime | `wss://stxnxkzaftmwcbtvgzbm.supabase.co/realtime/v1` | **Live & Connected** (Multi-tab broadcast) |

---

## Infrastructure & Configuration Highlights

1. **Azure Container Apps (`praroha-backend`)**:
   - Resource Group: `rg-tendersaathi` | Environment: `env-tendersaathi` (Central India).
   - Container Registry: `tendersaathiacr.azurecr.io/praroha-backend:v3`.
   - Ingress: External HTTPS on target port `8000`.
   - Health Probes: HTTP `/api/health` returning status `healthy`, storage `ready`, and AI provider `healthy`.
   - Runtime Fixes Applied:
     - Added `greenlet>=3.0.0` for SQLAlchemy `AsyncEngine` with `asyncpg`.
     - Added `pyjwt[crypto]>=2.8.0` for Supabase JWT verification.
     - Added `huggingface_hub>=0.24.0` for HF provider loading.
     - Updated `CORS_ORIGINS` to `Any` with validator in `backend/app/config.py` to support comma-separated origins from Azure CLI without Pydantic parsing errors.
     - Normalized `ApiClient` base URL in `frontend/src/api/client.ts` for clean `/api` suffix routing.

2. **Vercel Edge Deployment (`frontend-iota-green-73.vercel.app`)**:
   - Environment variables configured: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
   - Routing: SPA rewrite rules in `frontend/vercel.json` directing `/(.*)` to `/index.html`.
   - Service Worker & PWA Caching: Specific `no-cache, no-store, must-revalidate` headers configured for `/sw.js` and `/manifest.webmanifest`.

3. **Supabase Persistence & Realtime Integration**:
   - Enforced client usage of public publishable anon key (`sb_publishable_...`) for Realtime WebSocket handshake to avoid 401 handshake rejections.
   - Verified cross-project data isolation and project persistence across container and browser restarts.

---

## Verification Evidence on Live Cloud Endpoints

All tests were executed against the live production URLs:

| Test Suite | Target | Result | Key Checks Verified |
| :--- | :--- | :--- | :--- |
| **Backend Test Battery** | Local & Docker Container | **211 Passed**, 1 Skipped | Auth, ownership, lineage, media fallback, CC0 audio, JSON2Video, lifecycle |
| **Frontend Production Build** | Vercel Edge Build / Local | **Clean (0 Errors)** | TypeScript strict, Vite bundle, Workbox PWA service worker generation |
| **PWA & Offline E2E** | Live Vercel Domain | **100% Passed** | Web app manifest, 192/512px icons, active SW, offline notification banner |
| **Release Media & Isolation** | Live Azure Backend | **10/10 Passed** | CC0 soundscape library, pure WAV synthesis, storage persistence, credit handling, project isolation |
| **Realtime Multi-Tab Sync** | Live Vercel + Live Azure | **100% Passed** | Real multi-tab browser synchronization without manual page reload; cross-project isolation |
| **Full Creative Journey E2E** | Live Cloud Stack | **100% Passed** | 7-stage journey: Gemini DNA extraction, 3 worlds divergence, Edge-TTS voices, DAG, export, and reload |
