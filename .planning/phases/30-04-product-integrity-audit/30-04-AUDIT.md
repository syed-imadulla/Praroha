# 30-04-AUDIT.md: Full Deep Technical & Product Integrity Audit

**Product:** PRAROHA (Seed Unfold)  
**Audit Date:** 2026-10-08  
**Auditor:** Antigravity Senior Product Engineer & Technical Architect  
**Workspace:** `/home/syed-imadulla/Desktop/Praroha`  
**Execution Environment:** Linux / FastAPI (Uvicorn 8000) / Vite React (5173) / Supabase Postgres / Supabase Storage  
**Audit Mandate:** Pure inspection, live execution tracing, and evidence collection. Strictly zero production code modifications.

---

## Table of Contents
1. [Part 1 — Complete System Architecture Map](#part-1--complete-system-architecture-map)
2. [Part 2 — Frontend ↔ Backend Contract Audit](#part-2--frontend--backend-contract-audit)
3. [Part 3 — Stage-by-Stage Functional Audit (Stages 1–7)](#part-3--stage-by-stage-functional-audit)
4. [Part 4 — Realtime vs. Reactivity Audit](#part-4--realtime-vs-reactivity-audit)
5. [Part 5 — AI Provider & Generation Audit](#part-5--ai-provider--generation-audit)
6. [Part 6 — Demo Mode & Deterministic Fixture Audit](#part-6--demo-mode--deterministic-fixture-audit)
7. [Part 7 — Content Quality & Creative Jargon Audit](#part-7--content-quality--creative-jargon-audit)
8. [Part 8 — Loading, Error & Empty State Audit](#part-8--loading-error--empty-state-audit)
9. [Part 9 — Persistence & Browser Refresh Audit](#part-9--persistence--browser-refresh-audit)
10. [Part 10 — Media Generation & Storage Audit](#part-10--media-generation--storage-audit)
11. [Part 11 — Secondary Components & Utility Surface Audit](#part-11--secondary-components--utility-surface-audit)
12. [Part 12 — Lifecycle State Machine Audit](#part-12--lifecycle-state-machine-audit)
13. [Part 13 — Race Conditions & Concurrency Audit](#part-13--race-conditions--concurrency-audit)
14. [Part 14 — Security, Privacy & Data Integrity Audit](#part-14--security-privacy--data-integrity-audit)
15. [Part 15 — Test Suite Quality & False Positive Audit](#part-15--test-suite-quality--false-positive-audit)
16. [Part 16 — Dual Seed Live Execution Trace (Seed A vs. Seed B)](#part-16--dual-seed-live-execution-trace)
17. [Part 17 — Consolidated Findings & Severity Classification](#part-17--consolidated-findings--severity-classification)

---

## Part 1 — Complete System Architecture Map

PRAROHA is composed of three interconnected layers:
1. **Frontend Presentation & State Layer:**
   - Single-Page Application (SPA) built with React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, and Lucide React.
   - Global client state is coordinated by a unified Zustand store (`frontend/src/store/workspaceStore.ts`) configured with `persist` middleware targeting browser `localStorage` (`seed-unfold-workspace`).
   - All network traffic passes through a unified singleton API client (`frontend/src/api/client.ts`) talking to `/api` proxy.
2. **Backend API & Service Layer:**
   - Asynchronous Python backend powered by FastAPI and Uvicorn.
   - 12 route modules in `backend/app/routers/` handling projects, health, seed DNA, seed potential, worlds, selection, unfold, lineage, persistence, mutation, counterfactual, and media.
   - Core domain logic encapsulated in dedicated services: `LineageService`, `MediaService`, `MutationService`, `CounterfactualService`, `PersistenceService`.
   - Pluggable AI and Media Provider architectures managed via dynamic factories (`backend/app/providers/factory.py`, `backend/app/providers/media/factory.py`).
3. **Data Persistence & Object Storage Layer:**
   - Primary Relational Database: PostgreSQL on Supabase (accessed asynchronously via `asyncpg` and SQLAlchemy/SQLModel).
   - 12 active database tables:
     - `projects`: Master project metadata, seed text, stage status, branch tracking.
     - `seed_dna`: Structured semantic distillation records.
     - `seed_potential_items`: Extracted exploration possibilities (explicit, inferred, open).
     - `world_candidates`: Generated triad archetypes (familiar, radical, inverse).
     - `world_selections`: Human Gate commitment records, user rationale, HOZ locks.
     - `world_bibles`: Macro world rules, geography, history, factions, canon facts, key locations.
     - `characters`: Cast members, archetypes, motivations, conflicts, visual prompts.
     - `character_relationships`: Relational edges between characters.
     - `scenes`: Pivotal dramatic scenes with conflict narratives and prompts.
     - `media_assets`: Image, audio, video, and voice asset records and public URLs.
     - `entity_revisions`: Immutable audit log of character and scene prompt iterations.
     - `assets`: Storage snapshot records and project bundle archives.
   - Cloud Object Storage: Supabase Storage bucket (`seed-unfold-assets`) serving public media URLs.

---

## Part 2 — Frontend ↔ Backend Contract Audit

See companion document [30-04-API-MATRIX.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/phases/30-04-product-integrity-audit/30-04-API-MATRIX.md) for the complete 36-endpoint table.

### Key Contract Insights:
- **36 Defined Endpoints:** Every backend endpoint has a corresponding client method in `apiClient`.
- **2 Orphaned Methods:**
  - `GET /api/projects`: Fully implemented on backend with pagination, but called by **0 frontend components**. The frontend lacks a project switcher or multi-project library.
  - `GET /api/projects/{id}/lineage/node/{id}/ancestors`: Traced locally in `TraceabilityCanvas.tsx` using an in-memory graph traversal instead of the backend endpoint.
- **Envelope Inconsistency:** The backend returns an outer wrapper `{"success": true, "data": {...}, "error": null, "fallback_used": false, "warning": null}`. However, within `data`, endpoints like DNA extraction return their own `fallback_used: true`. When fallback occurs, the outer envelope reports `fallback_used: false` while the inner payload reports `fallback_used: true`.

---

## Part 3 — Stage-by-Stage Functional Audit

### Stage 1: Seed Input
- **Intended Function:** Accepts arbitrary creative premise, validates length, initiates project creation, and triggers DNA extraction.
- **Audited Reality:** Project is created successfully in Postgres. However, DNA extraction fails against Gemini and silently reverts to MockProvider. Regardless of the user's input, the downstream pipeline receives the Canonical Sunken Ocean City DNA.

### Stage 2: Understand (Seed DNA & Potential Map)
- **Intended Function:** Displays distilled semantic intent and a map of explicit, inferred, and open possibilities for human approval.
- **Audited Reality:**
  - **Seed DNA Viewer:** Renders premise, themes, entities, tone, and constraints. Because of the fallback, this displays oceanic diving bell lore for all inputs. The "Mock Fallback Active" badge renders as a subtle 11px pill.
  - **Seed Potential Canvas:** Correctly allows toggling items as accepted (Pillars) or rejected (Guardrails). Toggles persist to `seed_potential_items` table in Postgres. However, because Gemini failed, the items were generated via naive keyword extraction on the seed string.

### Stage 3: 3 Worlds (Divergent Archetypes)
- **Intended Function:** Generates exactly three contrasting creative candidate worlds: Familiar (Candidate 1), Radical (Candidate 2), and Inverse (Candidate 3).
- **Audited Reality:** Generates exactly 3 candidates and saves them to `world_candidates`. The radar metrics (Fidelity, Novelty, Distance, Feasibility) are populated. However, the world concepts are generated from the oceanic Seed DNA, resulting in oceanic world archetypes regardless of the original seed prompt.

### Stage 4: Choose & Human Gate (Decision DNA & HOZ)
- **Intended Function:** Creator selects a world, enters rationale, sets creative priorities, rejects directions, and locks Human-Only Zones (HOZ).
- **Audited Reality:** **Fully functional and high integrity.** The Human Gate strictly enforces creator commitment. The backend writes `world_selections` and records `human_only_zones`. Downstream unfolding cannot proceed until this stage is committed.

### Stage 5: Unfold (Universe Codex)
- **Intended Function:** Expands selected world into World Bible, Characters, Relationships, and Scenes, strictly obeying creator rationale and HOZ locks.
- **Audited Reality:**
  - **HOZ Guard:** **100% functional.** `enforce_human_only_zones_guard` deterministically overwrites canon facts, protagonist motivation, and climax scene conflict with the user's exact locked values.
  - **LLM Unfolding:** Gemini API times out or throws 429; execution cascades to `MockProvider.unfold_universe`. The generated codex features Dr. Althea Thorne, Sentry Unit Nereus, and Kaelen.
  - **Progress Timers:** The 4-step progress bar is simulated by client-side `setTimeout` timers (500ms, 1000ms, 1500ms), not a server streaming connection.

### Stage 6: Trace (Causal Provenance DAG)
- **Intended Function:** Interactive DAG tracing causal lineage from root seed to all downstream lore and scenes.
- **Audited Reality:** **Fully functional and real.** `LineageService` dynamically queries the database and builds an interactive 6-lane DAG. Clicking nodes displays `WhyIsThisHereModal` with exact plain-English explanations.

### Stage 7: Refine, Branch, Mutate & Replay
- **Intended Function:** Allows prompt iteration, project branching, premise variable mutation, and counterfactual exploration.
- **Audited Reality:**
  - **Entity Refinement:** Real. Writes diff logs to `entity_revisions` table.
  - **Branching:** Real. Clones project in Postgres with `parent_project_id`.
  - **Mutation Lab:** Real. Extracts 4 premise variables and simulates downstream impacts.
  - **Counterfactual Replay:** Real. Pulls unselected world candidates and calculates divergence delta.

---

## Part 4 — Realtime vs. Reactivity Audit

See companion document [30-04-REALTIME-MATRIX.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/phases/30-04-product-integrity-audit/30-04-REALTIME-MATRIX.md).

### Key Findings:
1. **Zero Realtime Transport:** There are **NO WebSockets, Server-Sent Events (SSE), or Supabase Realtime channels** in PRAROHA.
2. **Reactivity is Local Only:** The user interface re-renders reactively because of Zustand and React state, but this reactivity is completely confined to the local browser tab.
3. **No Multi-Client Sync:** If two users or two tabs open the same project, edits in Tab A will never appear in Tab B without a manual page refresh.
4. **Simulated Server Streaming:** Step-by-step progress bars in Stage 3 and Stage 5 are created by client `setTimeout()` calls running over a single blocking HTTP request.

---

## Part 5 — AI Provider & Generation Audit

### The Critical Model Configuration Failure:
In `backend/app/config.py`:
```python
GEMINI_MODEL: str = "gemini-3.5-flash"
```
And in `.env`:
```
GEMINI_MODEL=gemini-3.5-flash
```

### Verified Runtime Behavior:
1. Google Gemini API has models such as `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-flash-latest`. **The model `gemini-3.5-flash` does not exist.**
2. When the backend calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`, Google returns `HTTP 429 Too Many Requests` or `HTTP 404 Not Found`.
3. `GeminiProvider` catches the exception:
   ```python
   logger.warning("Gemini API call failed (%s: %s). Falling back gracefully to MockProvider.", type(exc).__name__, exc)
   ```
4. `MockProvider.extract_dna(seed)` returns:
   ```python
   return {
       "raw_seed": seed,
       "seed_dna": CANONICAL_SEED_DNA,
   }
   ```
5. `CANONICAL_SEED_DNA` is the Sunken Ocean City premise.
6. **Result:** Every single user who inputs a seed into PRAROHA receives the Sunken Ocean City DNA.

---

## Part 6 — Demo Mode & Deterministic Fixture Audit

### Feature Classification Table:

| Category | Features Included | Audited Integrity Status |
|----------|-------------------|--------------------------|
| **100% Real Production Code** | Database persistence, project branching, entity revision logging, human-only zones guard, media generation (images via Pollinations/Flux, voice via EdgeTTS), Supabase storage upload, DAG graph synthesis, snapshot exports. | **VERIFIED REAL & PERSISTENT** |
| **Hybrid / Mock Fallback** | Gemini LLM extraction (DNA, Worlds, Codex). Intended to be real, but actively falling back to MockProvider due to model naming error. | **CURRENTLY FALLING BACK** |
| **100% Static Mock / Fixture** | Home page "Recent Creations" (Mountain Sunset, Forest Vibes), "My Creations" gallery, "Graveyard" screen, "Creation Modes" selector buttons, "Profile" screen. | **VISUAL PLACEHOLDER ONLY** |
| **Simulated UI State** | Multi-step progress bars during world generation and universe unfolding (`setTimeout` step timers). | **CLIENT-SIDE SIMULATION** |

---

## Part 7 — Content Quality & Creative Jargon Audit

See companion document [30-04-CONTENT-AUDIT.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/phases/30-04-product-integrity-audit/30-04-CONTENT-AUDIT.md).

### The Cognitive Conflict:
- The app uses botanical, literary branding: "Botanical Creative Journal", "Seed Unfold", Cormorant Garamond typography.
- The UI language bombards the user with machine learning and graph theory jargon: "Seed DNA", "Decision DNA", "Latent Directions", "Causal Provenance DAG", "Counterfactual Replay", "Origin Ledger".
- The coexistence of **Seed DNA** and **Decision DNA** creates acute confusion for creative writers who do not understand which DNA controls their world.

---

## Part 8 — Loading, Error & Empty State Audit

1. **Misleading Success on Fallback:**  
   When the AI provider fails, the user is not given an error dialog or retry prompt. Instead, the UI renders the canonical sunken city DNA with an obscure `[11px] font-mono text-[#B8734F]` badge: `"Mock Fallback Active"`. Non-technical users do not realize generation failed.
2. **Fake Progress Timers:**  
   During generation, the UI displays sequential stages ("Analyzing constraints...", "Formulating archetypes...", "Synthesizing lore..."). These advance on client-side timers (700ms, 1400ms) regardless of backend server state.
3. **Empty State Quality:**  
   Empty states on Canvas and Drawer are well-styled (warm parchment backgrounds, botanical leaf illustrations, helpful hints). However, the empty state on "My Creations" is bypassed because hardcoded mock cards are permanently displayed.

---

## Part 9 — Persistence & Browser Refresh Audit

1. **What Survives a Page Refresh:**
   - Active Stage & Unlocked Stages (saved in `localStorage`).
   - Active Project, Seed DNA, Potential Items, Worlds, Selection Record, Unfolded Universe Codex, Active Codex Tab, Inspector Tab, Media Assets (saved in `localStorage` and Supabase Postgres).
   - If the user reloads the page, Zustand re-hydrates seamlessly and calls `apiClient.getHealth()`.
2. **What Does NOT Survive a Page Refresh:**
   - Active Media Polling loop (if refresh happens while generating an image, the poll loop aborts; image completes in background but user must manually refresh or inspect media to see it).
   - Simulated progress state (resets to default).
   - Unsaved text in Refinement Modal or WhyIsThisHereModal.
   - Non-partialized store state: `lineageGraph`, `entityRevisions`, `snapshots`, `mutationSimulation`, `counterfactualDelta`. These are re-fetched from the API when entering their respective stages.
3. **Missing URL-Based Routing:**
   - The app runs on a single URL (`/`). There are no query params or route paths (`/projects/:id` or `/stage/:stage`).
   - Opening the application in a new browser window or incognito session always resets to Stage 1 with `activeProject: null`.

---

## Part 10 — Media Generation & Storage Audit

### Tested and Verified Live:
1. **Image Generation:**
   - Request: `entity_type: 'location'`, `prompt: 'A crystal cavern glowing with emerald light'`.
   - Result: Dispatched to `CompositeImageProvider` (Pollinations API). Completed in 5 seconds.
   - Stored in Supabase bucket `seed-unfold-assets/media/image/ece83635-a448-4814-8f2a-c4779aa66ea7.jpg` (35,442 bytes JPEG).
   - Public URL verified accessible via HTTP/2 200.
2. **Voice Generation:**
   - Request: `entity_type: 'character'`, `voice_id: 'en-US-ChristopherNeural'`.
   - Result: Dispatched to `CompositeVoiceProvider` (Edge TTS). Completed in 4 seconds.
   - Stored in Supabase bucket `seed-unfold-assets/media/voice/743f9ea9-1094-47ff-87f5-1479dabe5ee9.mp3`.
   - Public URL verified accessible.
3. **Atmosphere Deck:**
   - Audio loop player rendered at bottom of screen.
   - Accurately synchronizes HTML5 audio element volume, provides ducking when narration plays, and loops ambient sound.

---

## Part 11 — Secondary Components & Utility Surface Audit

1. **Search Modal (`SearchModal.tsx` / Cmd+K):**  
   Searches characters, scenes, and lore settings. Operates **strictly in-memory** across hydrated Zustand store state. Does not call the backend.
2. **Inspector Drawer (`InspectorDrawer.tsx`):**  
   Provides slide-over inspection of Seed DNA, Decision DNA, Universe Codex, Origin Ledger, and Revision History. Fully interactive.
3. **Why Is This Here Modal (`WhyIsThisHereModal.tsx`):**  
   Displays causal justification, origin classification, and ancestor trail. Fully interactive.
4. **Atmosphere Deck (`AtmosphereDeck.tsx`):**  
   Floating audio player with master volume, ducking indicator, and play/pause toggle. Real audio element.
5. **Guided Tour (`GuidedTourOverlay.tsx`):**  
   Multi-step onboarding walkthrough. Interactive and navigable.
6. **Keyboard Shortcuts (`KeyboardShortcutsModal.tsx`):**  
   Modal displaying Cmd+K, 1-7 stage navigation, Esc.

---

## Part 12 — Lifecycle State Machine Audit

The backend enforces strict lifecycle state transitions on the `projects` table:
- Transition 1: `draft` -> `seed_extracted` (via `POST /dna/extract`)
- Transition 2: `seed_extracted` -> `worlds_generated` (via `POST /worlds/generate`)
- Transition 3: `worlds_generated` -> `world_selected` (via `POST /worlds/{cid}/select`)
- Transition 4: `world_selected` -> `universe_unfolded` (via `POST /unfold`)

### Enforced Guards:
- Calling `POST /worlds/generate` without DNA returns `HTTP 400 Bad Request`.
- Calling `POST /unfold` without world selection returns `HTTP 400 Bad Request`.
- Calling `POST /unfold` while already unfolding returns `HTTP 409 Conflict`.
- Calling `POST /unfold` when already unfolded returns existing codex (idempotent).

---

## Part 13 — Race Conditions & Concurrency Audit

1. **Rapid Multi-Click on Generation Buttons:**  
   Guarded on the frontend by booleans (`isExtracting`, `isGeneratingWorlds`, `isUnfolding`). Double-clicking buttons does not fire duplicate requests.
2. **Backend Concurrency Guard:**  
   `POST /unfold` locks project state with `status = "unfolding"` to prevent race conditions during long-running generation.
3. **Media Polling Race Condition:**  
   If the user navigates away or switches stages while media generation is polling, the polling loop in `workspaceStore.ts` terminates. The job completes on the server, but the UI does not automatically update until the user re-fetches media assets.

---

## Part 14 — Security, Privacy & Data Integrity Audit

1. **Zero Authentication / Authorization:**  
   There is **no user authentication, token validation, or session management** in the application. Any client can read, update, or delete any project by knowing its UUID (`GET /api/projects/{id}`).
2. **No Multi-Tenant Isolation:**  
   All records in `projects`, `characters`, `world_bibles`, `media_assets` reside in a shared schema without a `user_id` foreign key.
3. **API Key Security:**  
   `GEMINI_API_KEY` and Supabase keys are securely stored on the backend in `.env` and never leaked to the client bundle. The frontend communicates exclusively via `/api` proxy.

---

## Part 15 — Test Suite Quality & False Positive Audit

See companion document [30-04-TEST-AUDIT.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/phases/30-04-product-integrity-audit/30-04-TEST-AUDIT.md).

### The False Positive Dilemma:
- 154 pytest tests and 21 Playwright E2E suites pass with a 100% success rate.
- **However, 100% of E2E tests either inject canonical demo fixtures directly or select the "Sunken Ocean City" preset.**
- The Sunken Ocean City preset string triggers a deterministic bypass in `GeminiProvider`:
  ```python
  if raw_seed == "a child discovers a forgotten city beneath the ocean":
      return await self._mock_provider.generate_worlds(...)
  ```
- As a result, the live Gemini API was never executed during automated testing, masking the invalid model name error (`gemini-3.5-flash`) and silent fallback behavior.

---

## Part 16 — Dual Seed Live Execution Trace

To confirm findings empirically, we executed the full pipeline against the live backend with two genuinely distinct creative seeds.

### Test Seed A:
> **Input:** *"An abandoned railway station slowly becomes a living library where forgotten memories are stored as plants."*

### Test Seed B:
> **Input:** *"A village discovers a machine beneath an ancient lake that predicts storms."*

### Execution Results Comparison:

| Pipeline Step | Seed A Execution | Seed B Execution | Identical? | Cause |
|---------------|------------------|------------------|------------|-------|
| **1. Project Creation** | Created ID: `9563c180-...`<br>Seed text recorded in DB. | Created ID: `19fe1176-...`<br>Seed text recorded in DB. | No (Unique IDs) | Real Postgres INSERT |
| **2. Seed DNA Extraction** | **Premise:** *"An innocent protagonist uncovers a submerged, lost human or non-human settlement hidden in the oceanic depths."*<br>**Entities:** Child, Submersible, Sunken City, Ocean Wildlife, Relics. | **Premise:** *"An innocent protagonist uncovers a submerged, lost human or non-human settlement hidden in the oceanic depths."*<br>**Entities:** Child, Submersible, Sunken City, Ocean Wildlife, Relics. | **100% IDENTICAL** | Gemini failed (429/404); fell back to `CANONICAL_SEED_DNA`. |
| **3. Seed Potential Extraction** | Sample labels: `['Abandoned', 'Railway', 'Station', 'Slowly', 'Thematic: Wonder vs. danger']` | Sample labels: `['Village', 'Discovers', 'Machine', 'Beneath', 'Thematic: Wonder vs. danger']` | Differed only on first 4 words | Naive string-split keyword extractor in `MockProvider`. |
| **4. 3 World Candidates** | Candidate 1: The Grounded Expanse<br>Candidate 2: The Metamorphic Nexus<br>Candidate 3: The Inverted Sanctuary | Candidate 1: The Grounded Expanse<br>Candidate 2: The Metamorphic Nexus<br>Candidate 3: The Inverted Sanctuary | **100% IDENTICAL** | Generated from identical oceanic Seed DNA. |
| **5. Selection & HOZ** | Selected World 1, saved rationale & HOZ in DB. | Selected World 1, saved rationale & HOZ in DB. | No (Custom creator rationale & HOZ) | Real Postgres INSERT |
| **6. Universe Unfold** | Characters: Dr. Althea Thorne, Sentry Unit Nereus, Kaelen.<br>Scenes: Awakening of the Deep Spire, Breach at Nursery Trench. | Characters: Dr. Althea Thorne, Sentry Unit Nereus, Kaelen.<br>Scenes: Awakening of the Deep Spire, Breach at Nursery Trench. | **100% IDENTICAL** (except HOZ overrides) | Fallback to canonical codex fixtures. |
| **7. Lineage DAG** | 17 nodes synthesized from DB records. | 17 nodes synthesized from DB records. | Graph structure identical | Lineage generated from identical codex entities. |

---

## Part 17 — Consolidated Findings & Severity Classification

| Finding ID | Description | Root Cause | Impact | Severity |
|------------|-------------|------------|--------|----------|
| **CRIT-01** | **All user seeds generate Sunken Ocean City worlds** | `GEMINI_MODEL=gemini-3.5-flash` is invalid; Gemini API errors silently fall back to `MockProvider.extract_dna()`. | Core product value proposition (turning any seed into a universe) is broken for novel user seeds. | **CRITICAL** |
| **CRIT-02** | **100% of E2E tests are false positives** | All Playwright suites test only canonical fixtures or the ocean preset string bypass. | Critical bugs and API failures can remain undetected while all tests pass. | **CRITICAL** |
| **HIGH-01** | **Sidebar navigation leads to static mock fixtures** | `My Creations` and `Graveyard` render hardcoded Unsplash images; `Profile` is a placeholder. | Gives creators the false impression that account persistence and asset storage are fake. | **HIGH** |
| **HIGH-02** | **Zero collaborative or multi-client realtime sync** | No WebSockets, SSE, or Supabase Realtime channels exist. | Changes made in one browser tab are invisible to other tabs or collaborators without reload. | **HIGH** |
| **HIGH-03** | **Cognitive overload from ML & Graph Theory jargon** | Heavy use of "Latent Directions", "Causal DAG", "Counterfactual Replay", "Decision DNA vs Seed DNA". | Creative writers experience confusion and friction when navigating technical abstractions. | **HIGH** |
| **HIGH-04** | **No Project Switcher / Library UI** | Backend has `GET /api/projects`, but frontend has 0 callers and no project library modal. | Users who create multiple projects cannot navigate between them or reopen previous projects. | **HIGH** |
| **MED-01** | **Dual `fallback_used` envelope collision** | `api_success()` sets outer `fallback_used: false` while inner payload contains `fallback_used: true`. | Inconsistent fallback badge indicators across the UI. | **MEDIUM** |
| **MED-02** | **Simulated server streaming progress** | Progress indicators during generation are driven by client `setTimeout()` timers. | Progress bars do not reflect actual server execution or abort if server errors early. | **MEDIUM** |
| **LOW-01** | **Orphaned ancestor traversal endpoint** | Backend implements `GET /lineage/node/{id}/ancestors`, but frontend traces DAG in-memory. | Redundant dead endpoint in API surface. | **LOW** |
