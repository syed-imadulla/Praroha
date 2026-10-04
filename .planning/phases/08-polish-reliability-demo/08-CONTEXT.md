# Phase 8: Polish / Reliability / Demo — Context & Implementation Decisions

**Phase**: 8 of 8  
**Status**: Ready for Planning (`08-PLAN.md`)  
**Context Date**: 2026-10-04  
**Requirements**: DEMO-01, DEMO-02  

---

## 1. Executive Summary & Goals

Phase 8 elevates Seed Unfold from a functional prototype into a polished, hackathon-ready experience. It ensures that judges and evaluators can experience the full 7-stage journey from Avyakta through the 6 Tattva transformations in under 3 minutes with zero latency risks, bulletproof offline fallback resilience, and fluid micro-animations.

---

## 2. Locked Implementation Decisions

### A. Instant Canonical Demo Universe (`DEMO-01`)
- **Dedicated Fast Endpoint**: `POST /api/projects/canonical-demo`
  - Creates a new project titled `"The Sunken City: Bio-City"` with the canonical premise (*"A child discovers a forgotten city beneath the ocean"*).
  - Populates canonical `SeedDNA`, 3 contrasting `WorldCandidateRecord`s, `WorldSelectionRecord` (Bio-City with canonical rationale), full `WorldBibleRecord`, `KeyLocation`s, `CharacterRecord`s, `CharacterRelationshipRecord`s, and `SceneRecord`s in under 500ms using pre-baked deterministic fixtures.
  - Initializes baseline revision records in `entity_revisions` so Stage 7 Refine and Traceability DAG immediately have historical data.
  - Unlocks all 7 stages: `['seed', 'understand', 'worlds', 'choose', 'unfold', 'trace', 'refine']`.
- **Frontend Action**:
  - Prominent `"🌟 Instant Full Universe (Demo)"` button in `SeedInputCanvas.tsx` hero card.
  - Secondary `"🌟 Instant Demo"` button in `TopBar.tsx` for quick reset to the fully unfolded state from anywhere in the app.

### B. Graceful Degradation & Network Resilience (`DEMO-02`)
- **Seamless Provider Fallback**:
  - `GeminiProvider` wraps all API requests with timeout and error handling.
  - Upon network failure, timeout (> 10s), HTTP 429 quota exhaustion, or missing API key, the system automatically falls back to `MockProvider` canonical fixtures without crashing the user request.
  - Backend response payloads include a `warning` field: `"AI Provider Throttled/Unavailable — Gracefully transitioned to deterministic mock fixtures"`.
- **Frontend Toast Communication**:
  - Displays a persistent amber-accented toast banner informing the user/judge of the graceful fallback.
  - `TopBar.tsx` status badge indicates `AI: mock (fallback)` with tooltip explanation.

### C. Guided Demo Tour for Evaluators
- **Floating Spotlight Guide**:
  - Stepped floating card overlay for the 7-stage Guided Demo, highlighting the starting formless state and subsequent 6 Tattva transformations:
    1. **Stage 1 (Seed)**: *Avyakta (Starting Formless Potential)* — Raw creative spark.
    2. **Stage 2 (Understand)**: *Tattva 1: Bija (First Manifestation)* — Semantic Seed DNA distillation.
    3. **Stage 3 (3 Worlds)**: *Tattva 2: Srishti (Latent Forms)* — Exactly three contrasting creative archetypes.
    4. **Stage 4 (Choose)**: *Tattva 3: Sankalpa (Creative Commitment)* — The human-in-the-loop choice gate.
    5. **Stage 5 (Unfold)**: *Tattva 4: Vistara (Universe Expansion)* — Bible canon, characters, relationship web, story beats.
    6. **Stage 6 (Trace)**: *Tattva 5: Sambandha (Causal Lineage)* — Provenance DAG back to root seed.
    7. **Stage 7 (Refine)**: *Tattva 6: Parinamana & Dharana (Transformation & Persistence)* — Versioning, timeline branching, and portability.
  - Step navigation: `Next Stage`, `Previous Stage`, `Exit Tour`.
  - Launched via `"Guided Tour"` button in `TopBar.tsx` or pressing `t`.

### D. Keyboard Shortcuts (`KeyboardShortcutsModal.tsx`)
- Global keyboard event listener in the workspace:
  - `1` through `7`: Jump directly to Stage 1 through Stage 7 (if unlocked).
  - `i`: Toggle Workspace Inspector drawer.
  - `t`: Launch Guided Demo Tour.
  - `?`: Open Keyboard Shortcuts Help Modal.
  - `Escape`: Close modals and tour overlays.
- A sleek modal dialog (`?`) displaying all keyboard shortcuts with visual keycaps.

### E. UI Polish, Aesthetics & Micro-Animations
- **Preset Seed Cards**:
  - Canonical Ocean Seed highlighted with a glowing badge (`🌟 Canonical Demo`).
  - Hover spring animations (`whileHover={{ scale: 1.02 }}`) on world cards, character cards, and branch items.
- **Traceability DAG Controls**:
  - Mini zoom controls in `TraceabilityCanvas.tsx`: Zoom In (`+`), Zoom Out (`-`), and Reset (`100%`) for navigating large lineage DAGs.
  - Enhanced glowing animations for selected ancestor paths (`box-shadow` cyan/emerald pulse).

---

## 3. Plan Decomposition (2 Waves)

- **`08-01-PLAN.md` (Wave 1: Backend Reliability & Fast Demo Endpoint)**:
  - `POST /api/projects/canonical-demo` endpoint populating complete Bio-City universe with all stages unlocked.
  - Error catching and automatic fallback in `AIProvider` factory / `GeminiProvider` returning structured warning.
  - Pytest suite verifying canonical-demo population and error fallback behavior.

- **`08-02-PLAN.md` (Wave 2: Frontend Tour, Shortcuts, Polish & E2E)**:
  - `GuidedTourOverlay.tsx` stepped floating spotlight for the 7-stage Guided Demo (Avyakta through the 6 Tattva transformations).
  - `KeyboardShortcutsModal.tsx` and keyboard listener (`1`-`7`, `i`, `t`, `?`).
  - Instant demo buttons in `SeedInputCanvas.tsx` and `TopBar.tsx`.
  - Fallback notification toast banner in workspace store.
  - Lineage DAG zoom/reset controls.
  - Playwright E2E verification suite (`test_phase8_demo.cjs`) verifying instant demo flow, keyboard shortcuts, tour steps, and fallback handling.
