# Master Plan: Milestone 4 Real Product Hardening + True Realtime

## 1. Architectural Inspection & Root Causes

A systematic architecture review was conducted across the backend and frontend codebases:

### 1.1. AI Provider Disconnection & Silent Fallback
- **Location**: `backend/app/config.py`, `backend/app/providers/gemini_provider.py`
- **Issue**: `GEMINI_MODEL` was configured to `gemini-3.5-flash` (which failed with 404/429 quota exhaustion).
- **Silent Fallback Loop**: Every method in `GeminiProvider` caught all exceptions (`except (httpx.HTTPError, ...): return await self._mock_provider...`). As a result, when Gemini failed, the backend seamlessly returned the pre-baked "Sunken Ocean City" fixtures. Custom creative seeds were completely ignored.
- **Remedy**: Switch active model to `gemini-3.6-flash` (verified active HTTP 200 with structured JSON support) with failover to `gemini-3.1-flash-lite`. Remove silent fallback to `MockProvider` in production mode; raise explicit `AIProviderError` with retryable metadata.

### 1.2. Client-Side Fake Generation Progress
- **Location**: `frontend/src/store/workspaceStore.ts`
- **Issue**: Unfolding and generation states used client `setTimeout` intervals incrementing arbitrary percentage counters (`progress: 15% -> 40% -> 80%`).
- **Remedy**: Create a persistent `generation_jobs` SQLModel table in PostgreSQL tracking status (`queued`, `processing`, `completed`, `failed`), stage, progress, and error details. The frontend listens to real job events.

### 1.3. Missing Supabase Realtime Subscription Layer
- **Location**: `frontend/src/realtime/` (currently absent)
- **Issue**: Supabase client was used purely as a REST client. No Postgres CDC (`supabase.channel().on('postgres_changes', ...)`) channels were established.
- **Remedy**: Build `frontend/src/realtime/` with a clean lifecycle manager (`connect`, `subscribeProject(projectId)`, `handleEvent`, `disconnect`), strictly filtering by `project_id=eq.${projectId}`.

### 1.4. Store Desynchronization & Multi-Tab Isolation
- **Location**: `frontend/src/store/workspaceStore.ts`
- **Issue**: State mutations updated only the local in-memory Zustand store. A second open tab remained completely oblivious to changes until manual reload.
- **Remedy**: Realtime events received by the realtime subscriber dynamically invoke Zustand actions (`setSeedDna`, `setWorldCandidates`, `selectWorld`, `setCodex`, etc.), ensuring instant two-tab synchronization.

### 1.5. URL Ephemerality & Lack of Backend Rehydration
- **Location**: `frontend/src/AppShell.tsx`, `frontend/src/routes/`
- **Issue**: The application was structured as a single-page stage toggle without deep URL routing. Reloading wiped transient workspace context.
- **Remedy**: Implement `/projects/:projectId` URL routing with authoritative rehydration via `GET /api/projects/:id/bundle`.

### 1.6. Static Mock Data in Creations & Graveyard
- **Location**: `frontend/src/components/MyCreations.tsx`, `frontend/src/components/Graveyard.tsx`
- **Issue**: Displayed hardcoded static lists.
- **Remedy**: Wire directly to `GET /api/projects` and `GET /api/media` with real status flags (`is_archived`, `deleted_at`).

---

## 2. Sequenced Phase Breakdown

```
[Phase 31.1: Gemini Repair] ───> [Phase 31.2: Job State] ───> [Phase 31.3: Realtime Infra]
                                                                        │
[Phase 31.5: Project Routing] <─── [Phase 31.4: Store Sync] <───────────┘
          │
          ├───> [Phase 31.6: Creations & Graveyard]
          ├───> [Phase 31.7: Auth & Ownership]
          └───> [Phase 31.8: Media Realtime]
                    │
                    └───> [Phase 31.9: Error & Demo Isolation]
                              │
                              └───> [Phase 31.10: E2E Two-Tab Suite]
                                        │
                                        └───> [Phase 31.11: Final Audit & Sign-off]
```

---

## 3. Sub-Phase Execution Details

### Sub-Phase 31.1: Gemini & AI Provider Repair
- Update `config.py`: `GEMINI_MODEL="gemini-3.6-flash"`.
- Update `gemini_provider.py`: Remove silent catch-and-fallback logic. Implement model failover (`gemini-3.6-flash` -> `gemini-3.1-flash-lite`).
- Introduce `AIProviderError` and surface 502/503 errors to API callers.
- Verification: Pytest suite verifying Seed A vs Seed B live divergent generation.

### Sub-Phase 31.2: Server-Backed Generation Job State
- Add `generation_jobs` table to PostgreSQL via SQLModel.
- Implement background job worker for AI generation.
- Add `/api/jobs/{job_id}` status endpoint and state machine updates.
- Remove client fake `setTimeout` ladders in `workspaceStore`.

### Sub-Phase 31.3: Supabase Realtime Infrastructure
- Implement `frontend/src/realtime/supabaseRealtime.ts` and `frontend/src/realtime/projectSubscription.ts`.
- Listen to `postgres_changes` on project-scoped tables:
  `projects`, `seed_dna`, `seed_potential_items`, `world_candidates`, `world_selections`, `world_bibles`, `characters`, `character_relationships`, `scenes`, `media_assets`, `generation_jobs`.
- Implement robust reconnection, heartbeat, and teardown logic.

### Sub-Phase 31.4: Realtime Store Synchronization
- Connect Realtime event handlers to `workspaceStore` mutation actions.
- Verify two browser tabs simultaneously: Tab A mutates world selection; Tab B updates instantly without reload.

### Sub-Phase 31.5: Project Routing & Authoritative Rehydration
- Implement deep routing: `/projects/:projectId`.
- On route load, fetch project bundle from backend and hydrate store.
- Connect Project Library UI to backend project CRUD operations.

### Sub-Phase 31.6: Real Creations & Graveyard
- Remove static arrays from `MyCreations.tsx` and `Graveyard.tsx`.
- Connect to live backend endpoints.
- Implement soft-delete, restore, and permanent deletion with confirmation modal.

### Sub-Phase 31.7: Authentication & Project Ownership
- Enforce `projects.user_id` ownership verification in FastAPI routers.
- Prevent cross-user project reads and mutations.

### Sub-Phase 31.8: Media Realtime Pipeline
- Asynchronous media generation jobs emit realtime `media_assets` insert/update events.
- Closing and reopening the browser window restores assets directly from Postgres.

### Sub-Phase 31.9: Error Semantics & Demo Mode Isolation
- Create unified error banner with retry CTA for generation failures.
- Strict isolation: Demo Mode explicitly flagged, never triggered by default for arbitrary seeds.

### Sub-Phase 31.10: Production E2E & Two-Tab Realtime Tests
- Automated Playwright suite launching dual browser contexts against the same project.
- Validate arbitrary seeds (Seed A vs Seed B divergence test).
- Validate realtime sync between Tab A and Tab B.

### Sub-Phase 31.11: Final Full-System Audit & Live Verification
- Execute full backend pytest suite (154+ tests).
- Execute full frontend Playwright suite.
- Live verification of all 23 acceptance criteria.
- Complete milestone sign-off.
