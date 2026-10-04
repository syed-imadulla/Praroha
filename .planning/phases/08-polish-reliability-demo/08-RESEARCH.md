# Phase 8: Polish / Reliability / Demo — Research & Technical Spikes

**Phase**: 8 of 8  
**Status**: Complete  
**Date**: 2026-10-04  
**Focus**: Fast deterministic universe population, AI provider fallback wrapper, keyboard shortcuts, stepped guided tour, and DAG visual polish.

---

## 1. Fast Canonical Demo Seeding Architecture (`DEMO-01`)

### The Problem
During live hackathon evaluation or judging demonstrations, waiting 15–30 seconds across multiple generation steps introduces latency risk, network unpredictability, and cognitive friction. Judges want to see the complete end-to-end vision (all 7 stages, rich codex, multi-lane DAG, and refinement audit log) in seconds.

### The Solution: `POST /api/projects/canonical-demo`
- Rather than running 5 sequential round-trip requests, the backend provides an atomic seeding method in `project_repo.py`: `create_canonical_demo_project()`.
- It executes inside a single database transaction:
  1. Creates `ProjectRecord` with status `"universe_unfolded"`, branch `"main"`, and title `"The Sunken City: Bio-City"`.
  2. Inserts `SeedDNARecord` from `CANONICAL_SEED_DNA`.
  3. Inserts the 3 contrasting `WorldCandidateRecord`s from `CANONICAL_WORLDS`.
  4. Inserts `WorldSelectionRecord` linking Candidate 2 (Bio-City) with the canonical human rationale.
  5. Inserts `WorldBibleRecord` with key locations (Bioluminescent Spire, Nursery Trench), factions, timeline, and canon facts from `CANONICAL_UNFOLD_WORLD_2`.
  6. Inserts `CharacterRecord`s (Dr. Althea Thorne, Sentry Unit Nereus, Kaelen).
  7. Inserts `CharacterRelationshipRecord`s with emotional and ideological tensions.
  8. Inserts `SceneRecord`s (Scenes 1, 2, 3) with dramatic questions and pivotal outcomes.
  9. Inserts initial baseline `EntityRevisionRecord`s so Stage 7 Refine and Stage 6 DAG have immediate version history.
- Returns `ProjectRead` with all 7 stages unlocked.
- **Latency**: Under 50ms in SQLite; zero external API dependencies.

---

## 2. Bulletproof Error Fallback & Notification (`DEMO-02`)

### The Problem
If the user switches to Gemini or if the network drops, an unhandled exception or 429 quota error could freeze or crash the UI.

### The Solution: Provider Fallback Decorator / Wrapper
- In `backend/app/providers/gemini_provider.py`, every generative method (`extract_seed_dna`, `generate_worlds`, `unfold_universe`) is wrapped in a resilient try/except block.
- Upon any exception (`APIError`, `ResourceExhausted`, `TimeoutError`, network failure, or missing key):
  - Log a clear server warning.
  - Automatically instantiate and call `MockProvider()`.
  - Set a request-level flag or response header `X-AI-Provider-Fallback: true`.
- In `backend/app/models/response.py` or API routers:
  - If fallback occurred, the API response contains `warning: "AI Provider Throttled/Unavailable — Gracefully transitioned to deterministic mock fixtures"`.
- In `frontend/src/store/workspaceStore.ts`:
  - Intercepts the warning and displays an amber toast banner notifying the evaluator that graceful fallback took over, ensuring the demo proceeds without interruption.

---

## 3. Keyboard Shortcuts & Evaluator Flow

### Event Handling Best Practices
- Global keyboard listener bound in `WorkspaceCanvas.tsx` or a custom hook `useKeyboardShortcuts()`.
- Guard clause: ignore events when `event.target` is `INPUT`, `TEXTAREA`, or `SELECT` (so users can type freely in inputs).
- Keys mapped:
  - `1` through `7`: `setActiveStage(stageId)` if stage is unlocked.
  - `i` / `I`: `toggleInspector()`.
  - `t` / `T`: `toggleTour()`.
  - `?`: `toggleShortcutsModal()`.
  - `Escape`: close modal, tour, or inspector.

---

## 4. 7-Stage Stepped Floating Guided Tour (Avyakta + 6 Tattva Transformations)

### Design & Mechanics
- A dedicated overlay component `GuidedTourOverlay.tsx` with high z-index and subtle backdrop.
- Tracks `currentTourStep` (0 to 6) representing the 7-stage journey from Avyakta through the 6 Tattva transformations:
  1. **Stage 1 (Seed)**: *Avyakta (Starting Formless Potential)* — Raw creative premise.
  2. **Stage 2 (Understand)**: *Tattva 1: Bija (First Manifestation)* — Semantic Seed DNA distillation.
  3. **Stage 3 (3 Worlds)**: *Tattva 2: Srishti (Latent Forms)* — Exactly three contrasting creative archetypes.
  4. **Stage 4 (Choose)**: *Tattva 3: Sankalpa (Creative Commitment)* — The human-in-the-loop choice gate.
  5. **Stage 5 (Unfold)**: *Tattva 4: Vistara (Universe Expansion)* — Bible canon, characters, relationships, story beats.
  6. **Stage 6 (Trace)**: *Tattva 5: Sambandha (Causal Lineage)* — Multi-lane provenance DAG.
  7. **Stage 7 (Refine)**: *Tattva 6: Parinamana & Dharana (Transformation & Persistence)* — Versioning, branching, and state portability.
- Advancing step calls `setActiveStage(targetStage)` and animates the spotlight card into view.
- Evaluators can step forward, step backward, or exit at any time.

---

## 5. Lineage DAG Zoom & Polish

### Zoom & Fit Architecture
- In `TraceabilityCanvas.tsx`, state `zoomLevel` (range `0.7` to `1.3`, default `1.0`).
- Zoom controls in header: Zoom In (`+`), Zoom Out (`-`), and Reset (`100%`).
- Outer viewport has `overflow-auto`, inner container uses `style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}` with smooth CSS transition.
- Selected ancestor nodes and edges receive glowing pulsating box-shadows.

---

## 6. Verification Plan
- **Backend Test**: `backend/tests/test_demo.py` verifying `POST /api/projects/canonical-demo` seeds full universe with 0 missing entities in < 500ms, and verifying fallback provider decorator returns valid fixtures upon simulated failure.
- **Frontend Build**: `npm --prefix frontend run build` verifying clean TypeScript compilation.
- **Playwright E2E**: `frontend/e2e/test_phase8_demo.cjs` verifying 1-click canonical demo seeding, keyboard navigation, guided tour stepping, and DAG zoom controls.
