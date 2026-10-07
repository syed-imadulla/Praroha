# Roadmap: Seed Unfold

## Overview

Seed Unfold takes an ambiguous, formless seed idea, understands its core intent, generates exactly three distinct creative worlds, allows a human to select their path, and progressively unfolds that world into an inspectable, traceable mini-universe. This roadmap executes the MVP in 8 sequential, focused phases moving from foundation through progressive unfolding to full provenance and demo resilience.

## Phases

- [x] **Phase 1: Foundation / Project Shell** — Setup full-stack shell (React+Vite frontend, FastAPI backend), calm dark workspace layout, and AI provider abstraction.
- [x] **Phase 2: Seed Understanding + Seed DNA** — Implement seed ingestion, input validation, AI understanding pass, and canonical Seed DNA extraction & inspection.
- [x] **Phase 3: Three World Generation** — Build the branching engine to generate exactly three distinct, high-contrast world candidates respecting Seed DNA.
- [x] **Phase 4: Human World Selection** — Implement the 3-world comparison UI, trade-off review, and explicit human choice gating mechanism.
- [x] **Phase 5: Progressive World Unfolding** — Progressively unfold the selected world into a World Bible, core characters, relationship web, and key dramatic scenes.
- [x] **Phase 6: Traceability / Provenance** — Construct the DAG lineage graph connecting all entities, enabling interactive drill-down to root seed decisions without CoT leakage.
- [x] **Phase 7: Refine / Branch / Save** — Implement localized refinement, macro timeline branching, and complete project state persistence (save/load).
- [x] **Phase 8: Polish / Reliability / Demo** — Integrate canonical underwater city demo fixtures, offline fallback handling, end-to-end testing, and presentation polish.

---

## Phase Details

### Phase 1: Foundation / Project Shell
**Goal**: Deliver a running full-stack application shell with a calm dark aesthetic and clean AI provider abstraction.  
**Depends on**: Nothing (first phase)  
**Requirements**: SHEL-01, SHEL-02, SHEL-03  
**Success Criteria**:
  1. Frontend boots with Vite and renders the dark, creative workspace theme with stage navigation.
  2. Backend boots with FastAPI, health check passes, and API endpoints are reachable from frontend.
  3. `AIProvider` base class and stub/mock provider return structured responses.  
**Plans**: 2 plans (all completed)
- [x] **01-01-PLAN.md** (Wave 1): Backend Application Shell, Provider Abstractions (AIProvider & StorageProvider), Persistence Bootstrap, and Test Suite.
- [x] **01-02-PLAN.md** (Wave 2): Frontend Workspace Shell, Design System, Stage Progression Header, Inspection Drawer, and End-to-End API Integration.

---

### Phase 2: Seed Understanding + Seed DNA
**Goal**: Enable users to enter or choose a seed, extract structured Seed DNA, and inspect intent and boundaries.  
**Depends on**: Phase 1  
**Requirements**: DNA-01, DNA-02, DNA-03, DNA-04, DNA-05  
**Success Criteria**:
  1. User can type a raw seed or pick the pre-seeded demo prompt.
  2. System extracts valid Pydantic `SeedDNA` (premise, themes, entities, constraints, tone, domain keywords).
  3. Seed DNA inspection drawer displays extracted parameters clearly.
  4. Raw user seed remains immutable.  
**Plans**: 2 plans
- [x] **02-01-PLAN.md** (Wave 1): Backend Seed Understanding & DNA Service (GeminiProvider + Mock Fallback, SQLModel SeedDNARecord, Extraction Endpoints, and Pytest Suite).
- [x] **02-02-PLAN.md** (Wave 2): Frontend Seed Ingestion, Understanding Pass Loader, Seed DNA Visualizer, and Inspector Drawer Integration.

---

### Phase 3: Three World Generation
**Goal**: Generate exactly three contrasting, high-quality world candidates grounded in the extracted Seed DNA.  
**Depends on**: Phase 2  
**Requirements**: WGEN-01, WGEN-02, WGEN-03  
**Success Criteria**:
  1. Branching engine outputs precisely three candidate objects (World A, World B, World C).
  2. Candidates have distinct tones, aesthetics, and trade-offs while honoring Seed DNA constraints.
  3. Structured response passes validation without formatting errors.  
**Plans**: 2 plans (all completed)
- [x] **03-01-PLAN.md** (Wave 1): Backend World Candidate Models, Provider Generation with Gemini + Mock Fallback, Repository Persistence, API Endpoints, and Pytest Suite.
- [x] **03-02-PLAN.md** (Wave 2): Frontend Candidate Cards, Stage 3 Canvas, Comparison Visualizer, Re-generation, and Inspector Integration.

---

### Phase 4: Human World Selection
**Goal**: Provide side-by-side world comparison and enforce an explicit human selection gate.  
**Depends on**: Phase 3  
**Requirements**: HCHO-01, HCHO-02, HCHO-03  
**Success Criteria**:
  1. User sees 3 world cards side-by-side with loglines, aesthetic palettes, and trade-offs.
  2. The workflow pauses and strictly prevents autonomous progression until human selection occurs.
  3. Selecting a world triggers confirmation and advances to unfolding mode.  
**Plans**: 2 plans (all completed)
- [x] **04-01-PLAN.md** (Wave 1): Backend World Selection Models, Repository Methods with strict latest-batch validation, Endpoints, and Pytest Suite.
- [x] **04-02-PLAN.md** (Wave 2): Frontend Selection Store, Stage 4 Choose Canvas, Glow & Dim Visual Hierarchy, Inspector Lineage Tab, and Playwright E2E Suite.

---

### Phase 5: Progressive World Unfolding
**Goal**: Progressively generate the World Bible, characters, relationships, and story scenes for the selected world.  
**Depends on**: Phase 4  
**Requirements**: UNFL-01, UNFL-02, UNFL-03, UNFL-04, UNFL-05  
**Success Criteria**:
  1. Selected world expands into World Bible codex (laws, factions, lore).
  2. 2-4 characters are generated with motivations grounded in canon.
  3. Relationship graph maps tensions and alliances between characters.
  4. 2-3 narrative scenes are produced displaying characters in conflict.  
**Plans**: 2 plans (all completed)
- [x] **05-01-PLAN.md** (Wave 1): Backend Unfolded Universe Models, AI Provider Unfold Service with Canonical Archetype Fixtures, Atomic Repository Persistence, Router Lifecycle Endpoints, and Pytest Suite.
- [x] **05-02-PLAN.md** (Wave 2): Frontend Unfold Types, Workspace Store, Stage 5 Interactive Codex Canvas, Key Locations & Visual Prompt Copying, Inspector Lineage Expansion, and Playwright E2E Suite.

---

### Phase 6: Traceability / Provenance
**Goal**: Record and visualize the parent-child DAG lineage of all generated entities back to the root seed.  
**Depends on**: Phase 5  
**Requirements**: TRAC-01, TRAC-02, TRAC-03  
**Success Criteria**:
  1. Every character, scene, and world rule stores explicit parent node IDs (`derived_from`, `constrained_by`, `selected_by`).
  2. Clicking any entity highlights its provenance path back to Seed DNA and user choices.
  3. Explanations are plain-language and free of raw model reasoning tokens.  
**Plans**: 2 plans (all completed)
- [x] **06-01-PLAN.md** (Wave 1): Backend Lineage DAG Models, Dynamic Relational Synthesis Engine, Causal Explanation Service, API Endpoints, and Pytest Suite.
- [x] **06-02-PLAN.md** (Wave 2): Frontend Lineage Types, Workspace Store, Stage 6 Traceability Canvas with Multi-Lane DAG, Path Glow & Dimming, Causal Inspector Card, and Playwright E2E Suite.

---

### Phase 7: Refine / Branch / Save
**Goal**: Enable fine-grained component editing, timeline branching, and complete project save/load.  
**Depends on**: Phase 6  
**Requirements**: PERS-01, PERS-02, PERS-03  
**Success Criteria**:
  1. User can modify a character or scene, creating an auditable new version.
  2. User can branch the story-world timeline without destroying the original branch.
  3. Full universe state exports to and imports from persistent storage.  
**Plans**: 2 plans (all completed)
- [x] **07-01-PLAN.md** (Wave 1): Backend Model & Repository Extensions, Persistence & Branching Service, Component Refinement, Portable Bundle Export/Import, Storage Snapshots, and Pytest Suite.
- [x] **07-02-PLAN.md** (Wave 2): Frontend Types & Store Extensions, Refinement Modal, TopBar Branch Switcher Dropdown, Stage 7 Refine Canvas, and Playwright E2E Suite.

---

### Phase 8: Polish / Reliability / Demo
**Goal**: Provide foolproof demo resilience with canonical fixtures, offline fallbacks, and polished UI animations.  
**Depends on**: Phase 7  
**Requirements**: DEMO-01, DEMO-02  
**Success Criteria**:
  1. Canonical demo seed (*"A child discovers a forgotten city beneath the ocean"*) works instantly with cached fixtures.
  2. Network disconnection or API failure triggers clean fallback without UI crash.
  3. End-to-end journey completes cleanly in under 5 minutes for judging demonstrations.  
**Plans**: 2 plans (all completed)
- [x] **08-01-PLAN.md** (Wave 1): Backend Reliability, Fast Canonical Demo Seeding Endpoint, Provider Fallback & Pytest Suite.
- [x] **08-02-PLAN.md** (Wave 2): Frontend Guided Demo Tour, Keyboard Shortcuts Modal, DAG Zoom Controls, Preset Highlighting & Playwright E2E Suite.

---

# Milestone 2: Semantic Intelligence + Generative Media

## Milestone 2 Phases Overview

- [x] **Phase 9: Seed Potential Map** — Semantic classification layer (Explicit, Inferred, Open) between Seed DNA and Worlds.
- [x] **Phase 10: Divergence Engine** — Exactly 3 intentional exploration archetypes (Familiar, Radical, Inverse) with exploration profile.
- [x] **Phase 11: Decision DNA** — Rich human choice capture (rationale, priorities, rejected directions) and downstream propagation.
- [x] **Phase 12: Origin Ledger** — Universal entity origin tagging (`SEED_EXPLICIT`, `SEED_INFERRED`, `HUMAN_DECISION`, etc.) & "Why is this here?" drilldown.
- [ ] **Phase 13: Media Provider Architecture** — Clean non-blocking `MediaProvider` abstraction (`ImageProvider`, `VoiceProvider`, `VideoProvider`, `AudioProvider`).
- [ ] **Phase 14: Image Generation (Pollinations / FLUX.1 schnell)** — On-demand generation for World cover, Character portrait, Location concept, Scene visual.
- [ ] **Phase 15: Voice Generation (Edge TTS / Kokoro-82M)** — Narration audio generation, voice selection, playback, regeneration.
- [ ] **Phase 16: Video Generation (Pyramid Flow / Wan2.1)** — Selective cinematic scene generation with graceful fallback.
- [ ] **Phase 17: Audio & Atmosphere (ACE-Step 1.5 / Stable Audio Open)** — Ambient atmosphere, soundscape, background audio composition.
- [ ] **Phase 18: Seed Mutation Lab** — Modify fundamental seed variable, preview impact (Affected/Conditional/Preserved), fork branch.
- [ ] **Phase 19: Counterfactual Replay** — Delta comparison between selected world and rejected worlds without full regeneration.
- [ ] **Phase 20: Human-Only Zones** — Creator-locked creative guardrails preserved in Decision DNA and Origin Ledger.

---

## Milestone 2 Phase Details

### Phase 9: Seed Potential Map
**Goal**: Reveal inferred possibilities inside the seed before world generation and let the user accept/reject them.  
**Depends on**: Phase 2 (Seed Understanding), Phase 8  
**Requirements**: POT-01, POT-02, POT-03, POT-04  
**Success Criteria**:
  1. Backend extracts structured Seed Potential items classified as `explicit`, `inferred`, or `open`.
  2. Each item tracks confidence, source evidence reference, and user status (`pending`, `accepted`, `rejected`).
  3. Interactive frontend Seed Potential canvas displays items clearly categorized.
  4. User can accept or reject inferred possibilities, anchoring what enters downstream world synthesis.

---

### Phase 10: Divergence Engine
**Goal**: Replace fixed archetypes with intentional conceptual divergence across exactly three worlds (Familiar, Radical, Inverse) with exploration profiles.  
**Depends on**: Phase 9  
**Requirements**: DIV-01, DIV-02, DIV-03  
**Plans**: 2 plans (all completed)
- [x] **10-01-PLAN.md** (Wave 1): Backend Divergent Worlds Engine (Models, Provider Bridge, Seed Potential Injection & Pytest Suite)
- [x] **10-02-PLAN.md** (Wave 2): Frontend Divergent Worlds UI (Archetype Banners, 4-Metric Meters, Potential Pills & Playwright E2E Suite)
**Success Criteria**:
  1. Engine synthesizes exactly three distinct exploration worlds: World A (Familiar), World B (Radical), World C (Inverse).
  2. Generates an AI exploration profile across Seed Fidelity, Novelty, Conceptual Distance, and Feasibility.
  3. Downstream world generation incorporates accepted Seed Potential items.

---

### Phase 11: Decision DNA
**Goal**: Capture rich human rationale, priorities, and rejected directions during world selection, injecting them into subsequent universe unfolding.  
**Depends on**: Phase 10  
**Requirements**: DDNA-01, DDNA-02, DDNA-03  
**Plans**: 2 plans (all completed)
- [x] **11-01-PLAN.md** (Wave 1): Backend Decision DNA Engine (Models, Persistence, DB Migration, Stable Snapshot Strategy, Provider Creative Contract & Pytest Suite)
- [x] **11-02-PLAN.md** (Wave 2): Frontend Decision DNA UI (Priorities Chips, Inferred Exclusions, Codex Anchor Pill Bar, Lineage Provenance & Playwright E2E Suite)
**Success Criteria**:
  1. World selection records full Decision DNA (selected world, rationale, priorities, rejected directions, notes).
  2. Decision DNA is persisted relationally and linked to the project lifecycle.
  3. Subsequent universe expansion prompts inject Decision DNA as an explicit constraint.

---

### Phase 12: Origin Ledger
**Goal**: Upgrade provenance with universal entity origin classifications and an interactive "Why is this here?" explainer.  
**Depends on**: Phase 11  
**Requirements**: ORIG-01, ORIG-02, ORIG-03  
**Plans**: 2 plans (all completed)
- [x] **12-01-PLAN.md** (Wave 1): Backend Origin Ledger Engine (Entity Models, Non-Destructive DB Migration, Deterministic Causal Explainer & Pytest Suite)
- [x] **12-02-PLAN.md** (Wave 2): Frontend Origin Ledger UI (Origin Badges, "Why is this here?" Modal, DAG Accents & Filtering, Lineage Metrics & Playwright E2E Suite)
**Success Criteria**:
  1. Universe entities carry origin classifications (`SEED_EXPLICIT`, `SEED_INFERRED`, `HUMAN_DECISION`, `DERIVED`, `AI_INTRODUCED`, `USER_ADDED`).
  2. Provenance DAG renders origin badges and visual color accents.
  3. "Why is this here?" drawer interaction provides human-intelligible causal provenance without exposing raw LLM reasoning tokens.

---

### Phase 13: Media Provider Architecture
**Goal**: Build a decoupled, non-blocking `MediaProvider` abstraction (`ImageProvider`, `VoiceProvider`, `VideoProvider`, `AudioProvider`) with deterministic mock fallback.  
**Depends on**: Phase 12  
**Requirements**: MED-01, MED-02, MED-03  
**Success Criteria**:
  1. Clean `MediaProvider` interfaces defined for all 4 media modalities.
  2. `MockMediaProvider` returns reliable, offline test fixtures.
  3. Media generation failures never block or crash core universe generation.

---

### Phase 14: Image Generation (Pollinations / FLUX.1 schnell)
**Goal**: Integrate Pollinations (as primary image provider where a usable free/team-provided access path is available; with local FLUX.1 schnell fallback where practical, and MockMediaProvider fallback of last resort) for on-demand generation of world covers, character portraits, location concepts, and scene visuals.  
**Depends on**: Phase 13  
**Requirements**: IMG-01, IMG-02, IMG-03  
**Success Criteria**:
  1. Concrete `PollinationsProvider` generates images for world, character, location, and scene visual prompts with local `FluxSchnellProvider` fallback.
  2. Generated image binaries are persisted via `StorageProvider` (Supabase / local uploads).
  3. Frontend entity cards offer "Generate Visual" actions with live status feedback.

---

### Phase 15: Voice Generation (Edge TTS / Kokoro-82M)
**Goal**: Integrate Edge TTS as primary voice engine with optional local Kokoro-82M fallback for narration voiceovers with voice selection and audio playback.  
**Depends on**: Phase 13  
**Requirements**: VOX-01, VOX-02, VOX-03  
**Success Criteria**:
  1. Concrete `EdgeTTSProvider` generates narration audio without external API keys (with optional local Kokoro-82M fallback).
  2. Backend endpoints support narration generation and audio asset persistence.
  3. Frontend provides interactive narration player with play/pause and regenerate controls.

---

### Phase 16: Video Generation (Pyramid Flow / Wan2.1)
**Goal**: Integrate Pyramid Flow as primary video engine supporting cinematic scene rendering, with Wan2.1 T2V-1.3B as practical local fallback, optional/experimental Mochi 1 (not primary due to heavy compute), and MockMediaProvider fallback of last resort.  
**Depends on**: Phase 13  
**Requirements**: VID-01, VID-02, VID-03  
**Success Criteria**:
  1. Concrete `PyramidFlowProvider` handles cinematic scene rendering asynchronously with Wan2.1 T2V-1.3B practical local fallback.
  2. Graceful fallback to mock video clips if credentials, hardware, or compute resources expire.
  3. Frontend includes "Bring This World to Life" cinematic scene action with embedded video playback.

---

### Phase 17: Audio & Atmosphere (ACE-Step 1.5 / Stable Audio Open)
**Goal**: Integrate ACE-Step 1.5 as primary audio generator with Stable Audio Open as an optional alternative for ambient soundscapes and background audio composition.  
**Depends on**: Phase 13  
**Requirements**: AUD-01, AUD-02, AUD-03  
**Success Criteria**:
  1. Concrete `ACEStepProvider` creates ambient soundscapes for selected worlds (with Stable Audio Open optional alternative).
  2. Frontend ambient player provides background playback with volume control and scene-synced playback.
  3. Audio errors gracefully degrade without affecting core workflow.

---

### Phase 18: Seed Mutation Lab
**Goal**: Provide a "What If?" interface to modify fundamental seed variables and preview downstream impact before branching.  
**Depends on**: Phase 12 (Origin Ledger)  
**Requirements**: MUT-01, MUT-02, MUT-03, MUT-04  
**Success Criteria**:
  1. User can modify a core seed variable.
  2. Downstream impact preview classifies elements as `AFFECTED`, `CONDITIONAL`, or `PRESERVED`.
  3. User approval forks a new timeline branch, preserving original universe untouched.
  4. Causal DAG highlights affected mutation paths.

---

### Phase 19: Counterfactual Replay
**Goal**: Allow creators to inspect delta differences between selected and rejected worlds without full universe re-generation.  
**Depends on**: Phase 11 (Decision DNA)  
**Requirements**: CNTR-01, CNTR-02  
**Success Criteria**:
  1. Delta view compares current universe against rejected candidate worlds.
  2. Highlights key divergence in protagonist, tone, conflict, and lore assumptions.

---

### Phase 20: Human-Only Zones
**Goal**: Provide creator-locked creative controls for defining core theme and motivations before AI expansion, protected from AI override.  
**Depends on**: Phase 11 (Decision DNA), Phase 12 (Origin Ledger)  
**Requirements**: HOZ-01, HOZ-02  
**Success Criteria**:
  1. Creator-locked input fields for core theme, protagonist motivation, and central conflict.
  2. Locked parameters are marked `HUMAN_DECISION` in Decision DNA and Origin Ledger.
