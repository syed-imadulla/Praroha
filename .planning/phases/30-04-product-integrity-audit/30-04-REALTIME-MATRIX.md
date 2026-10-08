# 30-04-REALTIME-MATRIX.md: Realtime & Reactivity Audit Matrix

**Audit Date:** 2026-10-08  
**Scope:** PRAROHA (Seed Unfold) — Reactivity Architecture vs. Realtime Synchronization  
**Environment:** Linux / React 18 / Zustand / FastAPI / Supabase  
**Methodology:** Full codebase AST analysis, grep inspection for transport protocols (`WebSocket`, `EventSource`, `channel`, `polling`), network traffic inspection, and multi-tab state isolation verification.

---

## 1. System-Wide Transport Protocol Audit

| Transport Protocol | In Codebase? | Verified Instances | Implementation Scope |
|--------------------|--------------|-------------------|----------------------|
| **WebSockets (`ws://`, `wss://`)** | **NO** | 0 production instances | One test mock in `test_voice_generation.py`, one mention in documentation. |
| **Server-Sent Events (`EventSource`)**| **NO** | 0 instances | No SSE endpoints or client listeners exist anywhere in the application. |
| **Supabase Realtime Channels** | **NO** | 0 instances | Supabase client is only used as a Postgres DB connection & S3 storage bucket; zero realtime channel subscriptions. |
| **HTTP Short-Polling** | **YES** | 2 instances | 1. `App.tsx`: polls `GET /api/health` every 10,000ms.<br>2. `workspaceStore.ts`: polls `GET /api/projects/{id}/media/jobs/{id}` every 600ms (max 40 iterations) during media generation. |
| **Standard HTTP Request / Response**| **YES** | 34 endpoints | All data fetching and mutations occur over standard async REST `fetch()`. |
| **In-Memory Reactive State (Zustand)**| **YES** | Entire UI | Local browser tab state management via `useWorkspaceStore`. |
| **Local React State (`useState`)** | **YES** | Component level | Visual toggles, drawer state, active tab selections, filters. |

---

## 2. Screen & Component Reactivity Matrix

| Screen / Component | How Data Arrives Initially | Reactivity Mechanism | Multi-Client Realtime Sync? | Realtime Drift / Failure Risk |
|--------------------|----------------------------|----------------------|-----------------------------|-------------------------------|
| **TopBar & Brand Bar** | Store initialization / DB fetch | Zustand selector (`activeProject`, `health`) | **NONE** | If project is renamed or branched in another tab, TopBar does not reflect change until page refresh. |
| **Stage Progress Header** | `DEFAULT_STAGES` + `localStorage` | Zustand selector (`unlockedStages`, `activeStage`) | **NONE** | Unlocks are local to client. Opening project on a second computer will reset unlocked stages to Stage 1. |
| **Stage 1: Seed Input Canvas** | Static presets + local input | React `useState` + Zustand `seedText` | **NONE** | Pure local form input. No collaborative drafting. |
| **Recent Creations Row (Home)** | Hardcoded mock array `CANONICAL_RECENT_CREATIONS` | React `useState` | **NONE (100% STATIC)** | Zero database integration. Deletions or favorites only exist in local component state. |
| **Creation Modes (Image/Story/Sound)** | Static config array | React `useState` | **NONE (VISUAL ONLY)** | Mode selection has zero downstream effect on prompt, engine, or API request. |
| **Stage 2: Seed Potential Canvas** | `GET /api/projects/{id}/potential` | Zustand `potentialItems` + React `useState` | **NONE** | Status toggles (`accepted`/`rejected`) update DB, but other tabs viewing same project never see the updates. |
| **Stage 2: Seed DNA Viewer** | `GET /api/projects/{id}/dna` | Zustand `seedDNA` | **NONE** | Persisted in DB and `localStorage`. No multi-user change propagation. |
| **Stage 3: World Candidates Canvas**| `GET /api/projects/{id}/worlds` | Zustand `worlds` + client-side timers | **NONE** | Generating worlds in Tab A will not appear in Tab B without manual refresh. |
| **Stage 4: World Selection & HOZ** | `GET /api/projects/{id}/selection` | Zustand `activeSelection`, `humanOnlyZones` | **NONE** | Commitment is written to DB once. No concurrent lock arbitration. |
| **Stage 5: Universe Codex Canvas** | `GET /api/projects/{id}/unfolded` | Zustand `unfoldedUniverse` + client timers | **NONE** | Generation is monolithic POST. Multi-step progress bar is a simulated client timer. |
| **Stage 6: Traceability Canvas (DAG)**| `GET /api/projects/{id}/lineage` | Zustand `lineageGraph` | **NONE** | Graph dynamically synthesized from DB upon entering stage. No live edge animation from remote updates. |
| **Stage 7: Seed Mutation Lab** | `GET /api/projects/{id}/mutation/variables` | Zustand `mutationSimulation` | **NONE** | Simulations run on demand. Forking creates a new project record, completely decoupled. |
| **Stage 7: Counterfactual Replay** | `GET /api/projects/{id}/counterfactual/candidates` | Zustand `counterfactualDelta` | **NONE** | Divergence score calculated on demand via REST. |
| **Refine Canvas (Stage 7)** | `GET /api/projects/{id}/revisions` | Zustand `entityRevisions` | **NONE** | Revision history fetched on mount; concurrent edits in another tab will conflict or overwrite. |
| **Media Preview Card & Lightboxes** | `POST /api/media/generate` + 600ms poll | Zustand `activeMediaJobs` + HTTP poll | **LOCAL ONLY** | The tab that initiated media generation polls until complete; any other open tab sees "no media" until full page reload. |
| **Atmosphere Deck (Floating Audio)** | Active audio asset from store | HTML5 `<audio>` element + Zustand volume | **LOCAL ONLY** | Playback, volume, ducking, and mute are strictly local browser audio session. |
| **Inspector Drawer** | Active store state + revisions REST | Zustand selectors | **NONE** | Pure slide-over viewer of existing in-memory store. |
| **Search Modal (Cmd+K)** | In-memory Zustand state | `useMemo` filter over characters/scenes | **NONE** | Zero server search query. Only searches items already hydrated into the current browser's memory. |
| **My Creations Gallery (`activeNav`)** | Static mock array `CANONICAL_CREATIONS_SHOWCASE` | React `useState` | **NONE (100% STATIC)** | Clicking "Inspect" shows a toast; images are external Unsplash placeholders. |
| **Graveyard Screen (`activeNav`)** | Static mock array `CANONICAL_GRAVEYARD_SHOWCASE` | React `useState` | **NONE (100% STATIC)** | Restoring or deleting cards only mutates component memory. No backend record deleted. |

---

## 3. Critical Findings on Realtime Claims

1. **Reactivity vs. Realtime Confusion:**  
   The application exhibits **high frontend reactivity** (Zustand store updates trigger instantaneous smooth DOM re-renders, framer-motion transitions, and state propagation between canvas and inspector). However, it possesses **ZERO realtime synchronization**. It cannot support multi-user collaboration, live multiplayer worldbuilding, or cross-tab synchronization.
2. **The "Simulated Streaming" Pattern:**  
   Both World Generation and Universe Unfolding present the user with sequential multi-step status indicators ("Analyzing constraints...", "Formulating archetypes...", "Synthesizing lore..."). Tracing network requests proves that **no streaming SSE or WebSocket connection exists**. The backend executes a single blocking synchronous HTTP POST, while the frontend advances status strings using `setTimeout()` timers (700ms, 1400ms). If the backend finishes in 400ms or 20,000ms, the timers run completely independently of actual server-side execution.
3. **Media Job Polling Isolation:**  
   Media generation is genuinely asynchronous in the backend (using `asyncio.create_task` with isolated database sessions). However, job status notification relies on frontend client polling (`GET /api/projects/{id}/media/jobs/{id}` every 600ms). If the user closes the tab or switches pages before the 40 iterations complete (24 seconds), the poll loop aborts. When the user returns, the frontend has lost the job ID unless it re-queries `GET /api/projects/{id}/media/assets`.
