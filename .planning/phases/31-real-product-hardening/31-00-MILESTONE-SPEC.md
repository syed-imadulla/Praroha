# Milestone 4: Real Product Hardening + True Realtime Specification

## 1. Executive Summary & Problem Statement

Praroha (Seed Unfold) has achieved exceptional aesthetic and architectural maturity across Milestones 1–3 (Botanical Design System, 7-stage unfolding, lineage DAG, Decision DNA, non-blocking media, and shell simplification).

However, as revealed by the Deep Product Integrity Audit (Phase 30.4):
1. **AI Generation Disconnection**: `GEMINI_MODEL` was configured to `gemini-3.5-flash` (a non-existent model name). Due to silent fallback to `MockProvider`, user submissions appeared to succeed, but every custom seed silently reverted to the canonical Sunken Ocean City fixtures.
2. **Missing Realtime Layer**: The frontend simulated progression via client-side `setTimeout` loops. There was no active Supabase Realtime channel propagating PostgreSQL mutations to open tabs.
3. **Local Store Ephemerality**: If a user refreshed the browser or opened a project URL in a second tab, state was lost or desynchronized because the URL lacked authoritative rehydration from PostgreSQL.
4. **Static Mock Galleries**: My Creations and Graveyard used hardcoded static demonstration arrays rather than live database records.

**Milestone 4 Objective**: Make every user-visible capability **REAL**.
- Real AI outputs from active Google Gemini models (`gemini-2.5-flash`).
- Real PostgreSQL persistence before UI confirmation.
- Real Supabase Realtime channels scoped per project updating Zustand stores across tabs.
- Real asynchronous generation job lifecycle tracking (`queued`, `processing`, `completed`, `failed`).
- Real project routing (`/projects/:projectId`) with authoritative backend rehydration.
- Real My Creations and Graveyard with soft-delete, restore, and permanent deletion.
- Real user ownership and authentication guards.
- Explicit isolation of Canonical Demo Mode from Real Mode.

---

## 2. Non-Negotiable Core Principles

1. **No Silent Fallback**: If external AI or storage fails in Real Mode, return an explicit 4xx/5xx error status, error code, and user-actionable retry button. Never silently substitute mock data without user knowledge.
2. **Authoritative Server State**: The PostgreSQL database is the single source of truth. UI states are committed to the DB and mirrored via Supabase Realtime into the client Zustand store.
3. **Project-Scoped Realtime**: Subscriptions must be strictly scoped to `filter: "project_id=eq.${projectId}"` to prevent cross-tenant message leaks and excess socket traffic.
4. **Demo Mode Isolation**: The canonical demo (*"A child discovers a forgotten city beneath the ocean"*) is preserved as a named, explicit fallback fixture for offline demonstrations and test isolation, but is NEVER returned for arbitrary user seeds.
5. **Multi-Tab Parity**: Any mutation performed in Tab A (renaming a project, choosing a world, generating a scene, refining a character) must reflect in Tab B in real-time without a page refresh.

---

## 3. Sub-Phase Breakdown (31.1 – 31.11)

| Sub-Phase | Title | Focus & Deliverable |
|---|---|---|
| **31.1** | Gemini & AI Provider Repair | Configure active `gemini-2.5-flash`, test live API with key, remove silent fallback, verify Seed A vs Seed B divergence. |
| **31.2** | Server-Backed Generation Job State | Add `generation_jobs` SQLModel table, backend job lifecycle management, eliminate client `setTimeout` fake timers. |
| **31.3** | Supabase Realtime Infrastructure | Build `frontend/src/realtime/` client manager, project channel subscriptions, reconnect/recovery handling. |
| **31.4** | Realtime Store Synchronization | Wire Realtime inserts/updates directly into Zustand `workspaceStore`; prove multi-tab sync without reload. |
| **31.5** | Project Routing & Library | Implement `/projects/:projectId` deep routing, database rehydration on refresh, and real Project Library UI. |
| **31.6** | Real Creations & Graveyard | Replace static arrays with live DB queries; implement soft-delete, restore, and permanent delete. |
| **31.7** | Authentication & Ownership | Secure `projects.user_id`, add Supabase Auth / session verification, restrict endpoints to project owners. |
| **31.8** | Media Realtime Pipeline | Transition media generation to background job model with realtime asset event notifications. |
| **31.9** | Error Semantics & Demo Isolation | Standardize API error envelopes, retry actions, and strictly partition Demo Mode from Real Mode. |
| **31.10** | Production E2E & Two-Tab Realtime Tests | Automated Playwright suites with non-canonical seeds, dual-browser-context sync, and error recovery. |
| **31.11** | Final Full-System Audit | Live verification of Seed A vs Seed B, two-tab realtime proof, full database and component audit. |

---

## 4. Architecture: True Realtime Synchronization Flow

```
[Browser Tab A]                  [FastAPI Backend]                 [Supabase PostgreSQL]               [Browser Tab B]
       │                                 │                                    │                               │
       │─── 1. POST /api/worlds/select ─>│                                    │                               │
       │    (project_id, candidate_id)   │─── 2. Transaction Commit ─────────>│                               │
       │                                 │    (world_selections table)        │                               │
       │<── 3. 200 OK (Confirmed) ───────│                                    │                               │
       │                                                                      │                               │
       │                                                                      │─── 4. Postgres CDC Event ────>│
       │                                                                      │    (supabase_realtime channel)│
       │                                                                      │                               │
       │                                                                      │                               │─── 5. Handle Realtime Event
       │                                                                      │                               │    (update workspaceStore)
       │                                                                      │                               │─── 6. React Re-renders UI
```

---

## 5. Acceptance Checklist (23 Items)

- [ ] 1. `backend/app/core/config.py` uses verified model `gemini-2.5-flash`.
- [ ] 2. Live API generation succeeds for arbitrary prompts.
- [ ] 3. Seed A (*Clockmaker in glass desert*) and Seed B (*Space monastery*) produce distinct DNA and worlds.
- [ ] 4. Silent fallback to `MockProvider` in production is removed.
- [ ] 5. Generation failures return explicit 4xx/5xx error responses with actionable retry options.
- [ ] 6. `generation_jobs` table exists and persists job lifecycle states.
- [ ] 7. Client `setTimeout` fake timers in generation stores are eliminated.
- [ ] 8. `frontend/src/realtime/` provides modular connect, subscribe, and disconnect lifecycle.
- [ ] 9. Subscriptions are strictly scoped to `project_id`.
- [ ] 10. PostgreSQL mutations trigger realtime store updates in open tabs.
- [ ] 11. Multi-tab synchronization verified without page refresh.
- [ ] 12. Direct URL navigation to `/projects/:projectId` hydrates full state from backend.
- [ ] 13. Page refresh preserves complete active project state.
- [ ] 14. Project Library UI (`GET /api/projects`) supports create, open, rename, branch, and delete.
- [ ] 15. My Creations displays real projects and generated media assets.
- [ ] 16. Graveyard displays real archived entities with restore and permanent delete.
- [ ] 17. Projects enforce user ownership via `user_id`.
- [ ] 18. Unauthorized users cannot access or mutate foreign projects.
- [ ] 19. Media generation creates background jobs and emits realtime completion events.
- [ ] 20. Closing and reopening the browser during media generation recovers completed assets.
- [ ] 21. Canonical Demo Mode is clearly distinguished and isolated from Real Mode.
- [ ] 22. Playwright E2E suite verifies two browser tabs syncing in real time.
- [ ] 23. Full test suite (Pytest + Playwright) passes with zero regressions.
