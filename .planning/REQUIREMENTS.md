# Requirements: Seed Unfold (Praroha)

**Current Milestone:** Milestone 2: Semantic Intelligence + Generative Media  
**Core Value:** One incomplete seed reveals structured intent and possibilities, branches into 3 divergent worlds, empowers human decision, unfolds into an auditable universe codex, generates optional non-blocking media, and allows counterfactual exploration and seed mutation.

---

## Milestone 1: Core MVP Requirements (Completed & Verified)

### Shell & Foundation (SHEL)
- [x] **SHEL-01**: User opens a calm, dark content-first creative development workspace.
- [x] **SHEL-02**: Frontend (React + Vite + TypeScript) communicates with backend (FastAPI) via typed API endpoints.
- [x] **SHEL-03**: Backend uses AI Provider abstraction (`AIProvider`) allowing swappable LLM clients (Gemini default, MockProvider fallback).

### Seed Understanding & Seed DNA (DNA)
- [x] **DNA-01**: User enters a raw seed string (or loads the canonical demo seed).
- [x] **DNA-02**: System validates seed input and prevents empty or malformed submissions.
- [x] **DNA-03**: System extracts structured Seed DNA containing core premise, themes, entities, constraints, tone, and domain keywords.
- [x] **DNA-04**: User can inspect extracted Seed DNA in an inspection panel.
- [x] **DNA-05**: Original seed string is stored immutably and never silently altered.

### Three World Generation (WGEN)
- [x] **WGEN-01**: Engine generates exactly three distinct world candidates (World A, World B, World C) from the Seed DNA.
- [x] **WGEN-02**: Each world candidate contains title, concept logline, aesthetic mood, core conflict, and creative trade-offs.
- [x] **WGEN-03**: World generation strictly adheres to Seed DNA constraints and themes.

### Human World Selection (HCHO)
- [x] **HCHO-01**: UI displays the three world candidates in a side-by-side comparative layout.
- [x] **HCHO-02**: Unfolding process halts until user explicitly selects one world candidate.
- [x] **HCHO-03**: Selected world is highlighted, and its selection event is recorded in the traceability graph.

### Progressive World Unfolding (UNFL)
- [x] **UNFL-01**: System progressively unfolds the selected world into a World Bible (physical laws, factions, history, canon facts).
- [x] **UNFL-02**: System generates 2-4 core characters grounded in World Bible rules and Seed DNA constraints.
- [x] **UNFL-03**: System maps relationship webs and socio-emotional tensions between generated characters.
- [x] **UNFL-04**: System generates key scenes / narrative story beats featuring the characters within the world.
- [x] **UNFL-05**: System optionally generates visual prompt descriptors / placeholder asset cards for key entities without blocking text generation.

### Traceability & Provenance (TRAC)
- [x] **TRAC-01**: System records parent-child DAG relations (`derived_from`, `selected_by`, `constrained_by`, `appears_in`, `generated_for`) for every entity.
- [x] **TRAC-02**: User can select any character, scene, or lore rule and view its provenance trail back to the root seed.
- [x] **TRAC-03**: System provides human-intelligible explanations for why an entity exists without exposing raw model chain-of-thought tokens.

### Refine, Branch & Persistence (PERS)
- [x] **PERS-01**: User can refine an individual component (e.g. adjust character traits or scene conflict) producing an auditable new version.
- [x] **PERS-02**: User can branch from any stage or world candidate, creating a new exploratory timeline while preserving the original branch.
- [x] **PERS-03**: User can save the full project state (seed, DNA, worlds, selected world, unfolded universe, trace DAG) and reload it.

### Reliability & Demo Resilience (DEMO)
- [x] **DEMO-01**: System includes pre-baked deterministic fixtures for the canonical demo seed (*"A child discovers a forgotten city beneath the ocean"*).
- [x] **DEMO-02**: If external LLM API is unavailable, throttled, or offline, system falls back gracefully to demo fixtures with user notification.

---

## Milestone 2: Semantic Intelligence + Generative Media Requirements (Active)

### Seed Potential Map (POT) — Phase 9
- [x] **POT-01**: Backend extracts structured Seed Potential items classified as `explicit`, `inferred`, or `open`.
- [x] **POT-02**: Each potential item records confidence, source evidence, and user status (`pending`, `accepted`, `rejected`).
- [x] **POT-03**: Interactive frontend Seed Potential canvas displays items categorized into Explicit, Inferred Possibilities, and Open Questions.
- [x] **POT-04**: User can review and accept/reject inferred possibilities, anchoring what enters downstream world synthesis.

### Divergence Engine (DIV) — Phase 10
- [x] **DIV-01**: World generation synthesizes exactly three intentional exploration archetypes: World A (Familiar), World B (Radical), World C (Inverse).
- [x] **DIV-02**: Each candidate includes an AI-generated exploration profile across Seed Fidelity, Novelty, Conceptual Distance, and Feasibility.
- [x] **DIV-03**: World generation incorporates accepted Seed Potential items into generation constraints.

### Decision DNA (DDNA) — Phase 11
- [x] **DDNA-01**: World selection records comprehensive Decision DNA: selected world, creator rationale, creative priorities, rejected directions, and custom notes.
- [x] **DDNA-02**: Decision DNA is persisted relationally and linked to the project lifecycle.
- [x] **DDNA-03**: Decision DNA is injected as an explicit constraint into downstream universe unfolding prompts.

### Origin Ledger (ORIG) — Phase 12
- [x] **ORIG-01**: Every universe entity (character, rule, location, scene) is tagged with an origin classification (`SEED_EXPLICIT`, `SEED_INFERRED`, `HUMAN_DECISION`, `DERIVED`, `AI_INTRODUCED`, `USER_ADDED`).
- [x] **ORIG-02**: Causal Lineage DAG integrates origin metadata badges and color accents.
- [x] **ORIG-03**: "Why is this here?" drawer interaction provides human-intelligible causal provenance based on stored metadata without exposing raw LLM reasoning tokens.

### Media Provider Architecture (MED) — Phase 13
- [x] **MED-01**: Abstract `MediaProvider` base class defining `ImageProvider`, `VoiceProvider`, `VideoProvider`, and `AudioProvider` interfaces.
- [x] **MED-02**: Deterministic `MockMediaProvider` returning verifiable mock media assets for offline/testing resilience.
- [x] **MED-03**: All media generation is strictly asynchronous, non-blocking, and gracefully handled on network/credit failures.

### Image Generation via Pollinations & FLUX (IMG) — Phase 14
- [ ] **IMG-01**: Concrete `PollinationsProvider` as primary image generator (world covers, character portraits, scene visuals) where usable free/team path is available; with local FLUX.1 schnell fallback where practical, and `MockMediaProvider` as fallback of last resort.
- [ ] **IMG-02**: Generated image assets are stored via `StorageProvider` (Supabase Storage / local uploads) with metadata tracking.
- [ ] **IMG-03**: Frontend entity cards provide "Generate Visual" buttons with loading skeletons and image preview modals.

### Voice Generation via Edge TTS & Kokoro (VOX) — Phase 15
- [ ] **VOX-01**: Concrete `EdgeTTSProvider` as primary voice generator for narrative voiceovers without external API keys, with optional local Kokoro-82M fallback and `MockMediaProvider` fallback of last resort.
- [ ] **VOX-02**: Backend audio endpoints support voice selection, narration generation, and audio asset persistence.
- [ ] **VOX-03**: Frontend provides interactive narration player with play/pause and regenerate controls.

### Video Generation via Pyramid Flow & Wan2.1 (VID) — Phase 16
- [ ] **VID-01**: Concrete `PyramidFlowProvider` as primary video generator for cinematic scenes, with Wan2.1 T2V-1.3B as practical local fallback, optional/experimental Mochi 1 (not primary due to heavy compute), and `MockMediaProvider` as fallback of last resort.
- [ ] **VID-02**: Asynchronous video job polling/generation with graceful fallback to Wan2.1 or mock video clips if resources expire.
- [ ] **VID-03**: Frontend provides "Bring This World to Life" cinematic scene action with embedded video playback.

### Audio & Atmosphere via ACE-Step 1.5 (AUD) — Phase 17
- [ ] **AUD-01**: Concrete `ACEStepProvider` as primary audio generator for ambient soundscapes and background audio composition, with Stable Audio Open as an optional alternative and `MockMediaProvider` fallback of last resort.
- [ ] **AUD-02**: Ambient audio player in frontend with volume control and scene-synced playback.
- [ ] **AUD-03**: Audio failure gracefully degrades without interrupting visual or narrative experience.

### Seed Mutation Lab (MUT) — Phase 18
- [ ] **MUT-01**: "What If?" seed variable modification interface allowing user to alter a core premise assumption.
- [ ] **MUT-02**: Downstream Impact Preview classifies universe entities as `AFFECTED`, `CONDITIONAL`, or `PRESERVED`.
- [ ] **MUT-03**: Applying a mutation forks an isolated timeline branch using the existing branching engine, keeping the original universe immutable.
- [ ] **MUT-04**: Causal DAG visualizes mutation diffs and highlights affected lineage paths.

### Counterfactual Replay (CNTR) — Phase 19
- [ ] **CNTR-01**: "What If I Chose Another World?" delta comparison comparing current universe with rejected candidate worlds.
- [ ] **CNTR-02**: Delta view highlights key divergences in protagonist, tone, conflict, and lore without re-running full universe generation.

### Human-Only Zones (HOZ) — Phase 20
- [ ] **HOZ-01**: Creator-locked input controls for defining core theme, protagonist motivation, and central conflict before AI expansion.
- [ ] **HOZ-02**: Human-locked parameters are immutably tagged with `HUMAN_DECISION` in Decision DNA and protected from AI overriding.

---

## Traceability Matrix

| Requirement | Phase | Status |
|---|---|---|
| SHEL-01 – SHEL-03 | Phase 1 | Complete |
| DNA-01 – DNA-05 | Phase 2 | Complete |
| WGEN-01 – WGEN-03 | Phase 3 | Complete |
| HCHO-01 – HCHO-03 | Phase 4 | Complete |
| UNFL-01 – UNFL-05 | Phase 5 | Complete |
| TRAC-01 – TRAC-03 | Phase 6 | Complete |
| PERS-01 – PERS-03 | Phase 7 | Complete |
| DEMO-01 – DEMO-02 | Phase 8 | Complete |
| POT-01 – POT-04 | Phase 9 | Complete |
| DIV-01 – DIV-03 | Phase 10 | Complete |
| DDNA-01 – DDNA-03 | Phase 11 | Complete |
| ORIG-01 – ORIG-03 | Phase 12 | Complete |
| MED-01 – MED-03 | Phase 13 | Complete |
| IMG-01 – IMG-03 | Phase 14 | Complete |
| VOX-01 – VOX-03 | Phase 15 | Complete |
| VID-01 – VID-03 | Phase 16 | Complete |
| AUD-01 – AUD-03 | Phase 17 | Complete |
| MUT-01 – MUT-04 | Phase 18 | Complete |
| CNTR-01 – CNTR-02 | Phase 19 | Complete |
| HOZ-01 – HOZ-02 | Phase 20 | Complete |
| REAL-01 – REAL-20 | Phase 31 | Active |

---

## Milestone 4: Real Product Hardening + True Realtime Requirements (Active)

### Real AI Generation (REAL-01)
- [ ] **REAL-01.1**: Use an active, valid Gemini model (`gemini-2.5-flash`) verified against live Google AI API.
- [ ] **REAL-01.2**: Remove silent fallback to `MockProvider` for production user generation.
- [ ] **REAL-01.3**: Arbitrary creative seeds produce materially different Seed DNA, World candidates, and Universe codexes (verified with Seed A vs Seed B).
- [ ] **REAL-01.4**: If the provider fails, return an explicit error with actionable error codes and retry capabilities.

### True Realtime Architecture (REAL-02)
- [ ] **REAL-02.1**: Implement Supabase Realtime subscriptions in `frontend/src/realtime/` with clear lifecycle (`connect`, `subscribe`, `handleInsert`, `handleUpdate`, `handleDelete`, `disconnect`).
- [ ] **REAL-02.2**: Subscriptions are strictly scoped to the active project (`project_id`), avoiding global database leaks.
- [ ] **REAL-02.3**: Realtime subscriptions cover `projects`, `seed_dna`, `seed_potential_items`, `world_candidates`, `world_selections`, `world_bibles`, `characters`, `character_relationships`, `scenes`, `media_assets`, and `entity_revisions`.

### Realtime Store Synchronization (REAL-03)
- [ ] **REAL-03.1**: Database mutations trigger Supabase Realtime events that dynamically update the Zustand store in other open tabs without a page refresh.
- [ ] **REAL-03.2**: Multi-tab synchronization verified: mutations in Tab A immediately reflect in Tab B.

### Real Server Generation Status (REAL-04)
- [ ] **REAL-04.1**: Persist generation job state in Postgres (`generation_jobs` table) with states: `queued`, `processing`, `stage_started`, `stage_completed`, `completed`, `failed`, `cancelled`.
- [ ] **REAL-04.2**: Remove client `setTimeout` fake progress bars; UI binds to real server job progression via realtime events.

### Media Realtime (REAL-05)
- [ ] **REAL-05.1**: Media generation (`POST /media/generate`) creates background jobs that emit realtime asset creation/completion events.
- [ ] **REAL-05.2**: Generation survives browser tab closing; reopening the project retrieves completed assets and resumes realtime subscriptions.

### Real Project Library & Routing (REAL-06)
- [ ] **REAL-06.1**: Authoritative URL routing (`/projects/:projectId`); loading a project hydrates state from the backend database.
- [ ] **REAL-06.2**: Functional Project Library UI connected to `GET /api/projects` allowing users to see, open, create, rename, branch, and delete projects.

### Real My Creations & Graveyard (REAL-07)
- [ ] **REAL-07.1**: Remove hardcoded showcase array; My Creations queries real project and media asset records.
- [ ] **REAL-07.2**: Real Graveyard displaying soft-deleted/archived entities with functioning restore and permanent deletion via database transactions.

### Real Authentication & Ownership (REAL-08)
- [ ] **REAL-08.1**: Integrate user ownership (`projects.user_id`) with Supabase Auth or secure session tokens.
- [ ] **REAL-08.2**: Backend verifies project ownership on every endpoint, preventing unauthorized access across users.

### Real Error Semantics & Demo Mode Isolation (REAL-09)
- [ ] **REAL-09.1**: Clear API response semantics distinguishing `success`, `error`, and `processing`; no 200 OK responses masking internal fallbacks.
- [ ] **REAL-09.2**: Explicit Demo Mode clearly isolated from Real Mode; canonical underwater city fixtures are loaded only when Demo Mode is explicitly chosen.

### Production Tests & Acceptance Proof (REAL-10)
- [ ] **REAL-10.1**: New Playwright E2E tests validating arbitrary creative seeds, dual-tab realtime synchronization without refresh, and server recovery.
- [ ] **REAL-10.2**: Empirical proof of Seed A vs Seed B output divergence and database-backed realtime synchronization.

---
*Last updated: 2026-10-08 for Milestone 4: Real Product Hardening + True Realtime*

