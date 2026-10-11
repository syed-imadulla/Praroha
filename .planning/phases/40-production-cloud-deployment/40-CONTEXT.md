# Phase 40 Context: Production Cloud Deployment (Azure + Vercel + Supabase)

## Key Technical Decisions

1. **Decoupled Architecture**:
   - **Frontend**: Hosted on Vercel Hobby tier (Global Edge CDN, auto-deployments from Git, zero server management).
   - **Backend**: Hosted on Azure Container Apps (Consumption plan, 0.5 vCPU, 1.0 GiB RAM, minReplicas=1 to prevent scale-in interruption of background tasks).
   - **Database & Storage**: Existing Supabase PostgreSQL and Supabase Object Storage (`seed-unfold-assets`).

2. **API Communication**:
   - Vercel frontend communicates with Azure backend over public HTTPS using `VITE_API_URL=https://<azure-app-fqdn>/api`.
   - `ApiClient` in `frontend/src/api/client.ts` automatically normalizes `VITE_API_URL` to ensure `/api` prefix consistency.
   - Azure Container App configures `CORS_ORIGINS` to explicitly whitelist the Vercel production domain (`https://*.vercel.app` or custom domain).

3. **Background Job Resilience**:
   - In-memory `asyncio.create_task` jobs are tracked in PostgreSQL (`generation_jobs` table).
   - On container startup/restart, `ProjectRepository.recover_orphaned_jobs()` automatically detects any jobs interrupted in `queued` or `processing` state and transitions them to `failed` with actionable retry messages.
   - Setting Azure Container Apps `minReplicas = 1` prevents cold starts and ensures active background tasks run without scale-to-zero termination.

4. **Secret Isolation**:
   - Frontend bundle receives ONLY public variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`).
   - Backend secrets (`GEMINI_API_KEY`, `DATABASE_URL`, `SUPABASE_KEY`, etc.) are secured as Azure Container Apps protected secrets.
