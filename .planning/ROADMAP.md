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
- [x] **Phase 9: Seed Potential Map** — Structured extraction and visualization of unspoken themes, latent premises, and hidden tensions.
- [x] **Phase 10: Divergence Engine** — 3 distinct archetypal exploration vectors (Familiar Ground, Radical Departure, Inverse Premise) with explicit metrics.
- [x] **Phase 11: Decision DNA** — Capture rationale and creative constraints during world selection, propagating into unfold generation and inspection.
- [x] **Phase 12: Origin Ledger** — Track granular provenance origins (seed, human, derived, ai, user) on every universe entity with "Why is this here?" explainer.
- [x] **Phase 13: Media Provider Architecture** — Decoupled, non-blocking MediaProvider architecture with deterministic mock fallback and relational persistence.
- [x] **Phase 14: Image Generation (Pollinations / FLUX.1 schnell)** — 3-tier concrete image generation engine, Seed DNA aesthetic prompt enrichment, Lightbox modal, and multi-entity visual coverage.
- [x] **Phase 15: Voice Generation (Edge TTS / Kokoro-82M)** — Narration voiceovers with voice selection and audio playback.
- [x] **Phase 16: Video Generation (Pyramid Flow / Wan2.1)** — Cinematic scene video rendering with local fallback.
- [x] **Phase 17: Audio & Atmosphere (ACE-Step 1.5 / Stable Audio Open)** — Ambient soundscapes and background audio composition.
- [x] **Phase 19: Counterfactual Replay** — Delta inspection between selected and rejected worlds.
- [x] **Phase 20: Human-Only Zones** — Creator-locked creative constraints protected from AI modification.
- [x] **Phase 21: Design System Foundation** — Global design tokens, Cormorant Garamond / Inter typography, warm parchment background, paper grain, and core utilities.
- [x] **Phase 22: Global App Shell** — Warm cream sidebar (265-280px), botanical branding, and corner accents.
- [x] **Phase 23: Home Screen & UI Refinement Pass** — Editorial hero statement, leaf separator, 72px pill seed input, 5 creation modes, recent creations row; global PageContainer layout alignment, side journey card removal, Stage 2 (Understand) and Stage 3 (Divergent Worlds) botanical redesign, and 6-viewport responsive validation.
- [x] **Phase 24: Creation Component System** — Unified reusable CreationCard component supporting Image, Story, Sound, Video, and Chat.
- [ ] **Phase 25: My Creations Screen** — 3-column gallery, search, sort, filter pills, and empty states.
- [ ] **Phase 26: Graveyard Screen** — Calm, poetic cemetery for removed ideas with restore and permanent deletion confirmation.
- [ ] **Phase 27: Profile Screen** — Botanical identity card, creation statistics, tabs, and account settings panel.
- [x] **Phase 28: Seed → Universe Workspace** — Redesign experience of the 7 stages (Seed, DNA, Divergent Worlds, Choice & HOZ, Codex, Lineage DAG, Mutation Lab, Counterfactual Replay) with botanical aesthetics while keeping 100% of functional contracts intact.
- [x] **Phase 29: Secondary UI** — Standardize typography scale, eliminate text <12px, 44px touch targets, modal and drawer polish.
- [x] **Phase 30: UI Clutter Reduction & Shell Simplification** — Wave 1 P0 clutter removal, Wave 2 TopBar & StageProgressHeader redesign, and Deep Product Integrity Audit (30.4).
- [ ] **Phase 31: Real Product Hardening + True Realtime (Milestone 4)**
  - [ ] **Phase 31.1**: Gemini & AI Provider Repair (Valid model, live API calls, arbitrary seed support, no silent fallback).
  - [ ] **Phase 31.2**: Server-Backed Generation Job State (Persistent `generation_jobs`, real progress, remove client setTimeout timers).
  - [ ] **Phase 31.3**: Supabase Realtime Infrastructure (Project-scoped channels, dedicated `frontend/src/realtime/` layer).
  - [ ] **Phase 31.4**: Realtime Store Synchronization (Live DB updates reflect in Zustand store across multi-tab without refresh).
  - [ ] **Phase 31.5**: Project Routing & Authoritative Rehydration (`/projects/:projectId`, backend rehydration, Project Library UI).
  - [ ] **Phase 31.6**: Real My Creations & Graveyard (Live database records, soft delete, real restore, and permanent deletion).
  - [x] **Phase 31.7**: Authentication & Project Ownership (User ownership `projects.owner_id`, Supabase JWT verification, backend authorization guards, pre-confirmed signups).
  - [ ] **Phase 31.8**: Media Realtime Pipeline (Realtime generation events, browser reload resilience).
  - [ ] **Phase 31.9**: Production Error Semantics & Demo Isolation (Explicit errors, retry states, strict separation of Demo vs Real Mode).
  - [ ] **Phase 31.10**: Production E2E & Two-Tab Realtime Tests (Non-canonical seed validation, multi-tab real-time sync tests).
  - [ ] **Phase 31.11**: Final Full-System Audit & Verification (Empirical Seed A vs Seed B proof, live multi-tab proof).

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
- [x] **Phase 13: Media Provider Architecture** — Clean non-blocking `MediaProvider` abstraction (`ImageProvider`, `VoiceProvider`, `VideoProvider`, `AudioProvider`).
- [x] **Phase 14: Image Generation (Pollinations / FLUX.1 schnell)** — On-demand generation for World cover, Character portrait, Location concept, Scene visual.
- [x] **Phase 15: Voice Generation (Edge TTS / Kokoro-82M)** — Narration audio generation, voice selection, playback, regeneration.
- [x] **Phase 16: Video Generation (Pyramid Flow / Wan2.1)** — Selective cinematic scene generation with graceful fallback.
- [x] **Phase 17: Audio & Atmosphere (ACE-Step 1.5 / Stable Audio Open)** — Ambient atmosphere, soundscape, background audio composition.
- [x] **Phase 18: Seed Mutation Lab** — Modify fundamental seed variable, preview impact (Affected/Conditional/Preserved), fork branch.
- [x] **Phase 19: Counterfactual Replay** — Delta comparison between selected world and rejected worlds without full regeneration.
- [x] **Phase 20: Human-Only Zones** — Creator-locked creative guardrails preserved in Decision DNA and Origin Ledger.

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
**Plans**: 2 plans (all completed)
- [x] **13-01-PLAN.md** (Wave 1): Backend Media Provider Engine (Sub-interfaces, Mock Provider, Models, Migrations, Async Service & Pytest Suite)
- [x] **13-02-PLAN.md** (Wave 2): Frontend Media Architecture (Types, Client, Store, Reusable MediaPreviewCard & Playwright E2E Suite)
**Success Criteria**:
  1. Clean `MediaProvider` interfaces defined for all 4 media modalities.
  2. `MockMediaProvider` returns reliable, offline test fixtures.
  3. Media generation failures never block or crash core universe generation.

---

### Phase 14: Image Generation (Pollinations / FLUX.1 schnell)
**Goal**: Integrate Pollinations (as primary image provider where a usable free/team-provided access path is available; with local FLUX.1 schnell fallback where practical, and MockMediaProvider fallback of last resort) for on-demand generation of world covers, character portraits, location concepts, and scene visuals.  
**Depends on**: Phase 13  
**Requirements**: IMG-01, IMG-02, IMG-03  
**Plans**: 2 plans (all completed)
- [x] **14-01-PLAN.md** (Wave 1): Backend Image Provider Engine (`PollinationsImageProvider`, `FluxSchnellProvider`, 3-Tier Fallback, Seed DNA Enrichment, Metadata Persistence & Pytest Suite)
- [x] **14-02-PLAN.md** (Wave 2): Frontend Visual Experience & Lightbox Modal (`ImageLightboxModal`, Aspect Ratio Controls, Multi-Entity Generation Coverage, Production Build & Playwright E2E Suite)
**Success Criteria**:
  1. Concrete `PollinationsProvider` generates images for world, character, location, and scene visual prompts with local `FluxSchnellProvider` fallback.
  2. Generated image binaries are persisted via `StorageProvider` (Supabase / local uploads).
  3. Frontend entity cards offer "Generate Visual" actions with live status feedback.

---

### Phase 15: Voice Generation (Edge TTS / Kokoro-82M)
**Goal**: Integrate Edge TTS as primary voice engine with optional local Kokoro-82M fallback for narration voiceovers with voice selection and audio playback.  
**Depends on**: Phase 13  
**Requirements**: VOX-01, VOX-02, VOX-03  
**Plans**: 2 plans (all completed)
- [x] **15-01-PLAN.md** (Wave 1): Backend Voice Provider Engine (`EdgeTTSProvider`, `KokoroVoiceProvider`, 3-Tier Fallback, Persona Mapping, Spoken Script Synthesis & Pytest Suite)
- [x] **15-02-PLAN.md** (Wave 2): Frontend Voice Generation Experience & Custom Narrative Audio Player (`MediaPreviewCard` Player, Persona Dropdown, Dual-Target Coverage & Playwright E2E Suite)
**Success Criteria**:
  1. Concrete `EdgeTTSProvider` generates narration audio without external API keys (with optional local Kokoro-82M fallback).
  2. Backend endpoints support narration generation and audio asset persistence.
  3. Frontend provides interactive narration player with play/pause and regenerate controls.

---

### Phase 16: Video Generation (Pyramid Flow / Wan2.1)
**Goal**: Integrate Pyramid Flow as primary video engine supporting cinematic scene rendering, with Wan2.1 T2V-1.3B as practical local fallback, optional/experimental Mochi 1 (not primary due to heavy compute), and MockMediaProvider fallback of last resort.  
**Depends on**: Phase 13  
**Requirements**: VID-01, VID-02, VID-03  
**Plans**: 2 plans (all completed)
- [x] **16-01-PLAN.md** (Wave 1): Backend Video Provider Engine (`PyramidFlowProvider`, `WanVideoProvider`, 3-Tier Fallback, Cinematic Motion Cues, Metadata Persistence & Pytest Suite)
- [x] **16-02-PLAN.md** (Wave 2): Frontend Cinematic Video Experience & Lightbox Modal (World Hero CTA, Scene Video Controls, In-Card Player, `VideoLightboxModal`, Production Build & Playwright E2E Suite)
**Success Criteria**:
  1. Concrete `PyramidFlowProvider` handles cinematic scene rendering asynchronously with Wan2.1 T2V-1.3B practical local fallback.
  2. Graceful fallback to mock video clips if credentials, hardware, or compute resources expire.
  3. Frontend includes "Bring This World to Life" cinematic scene action with embedded video playback.

---

### Phase 17: Audio & Atmosphere (ACE-Step 1.5 / Stable Audio Open)
**Goal**: Integrate ACE-Step 1.5 as primary audio generator with Stable Audio Open as an optional alternative for ambient soundscapes and background audio composition.  
**Depends on**: Phase 13  
**Requirements**: AUD-01, AUD-02, AUD-03  
**Plans**: 2 plans (all completed)
- [x] **17-01-PLAN.md** (Wave 1): Backend Audio Engine (`ACEStepAudioProvider`, `StableAudioOpenProvider`, `CompositeAudioProvider`, Canonical Acoustic Derivation, Curated Moods & Pytest Suite)
- [x] **17-02-PLAN.md** (Wave 2): Frontend Atmosphere Experience & Smart Ducking (`AtmosphereDeck`, In-Card Player, Shared Reference-Counted Blocker Ducking, Intent Invariance, Build & Playwright E2E Suite)
**Success Criteria**:
  1. Concrete `ACEStepProvider` creates ambient soundscapes for selected worlds (with Stable Audio Open optional alternative).
  2. Frontend ambient player provides background playback with volume control and scene-synced playback.
  3. Audio errors gracefully degrade without affecting core workflow.

---

### Phase 18: Seed Mutation Lab
**Goal**: Provide a "What If?" interface to modify fundamental seed variables and preview downstream impact before branching.  
**Depends on**: Phase 12 (Origin Ledger)  
**Requirements**: MUT-01, MUT-02, MUT-03, MUT-04  
**Plans**: 2 plans (all completed)
- [x] **18-01-PLAN.md** (Wave 1): Backend Seed Mutation Engine & Branching Integration (`mutation.py` Models, `MutationService`, Downstream Causal Lineage Classification, Zero-Destruction Forking & Pytest Suite)
- [x] **18-02-PLAN.md** (Wave 2): Frontend Seed Mutation Lab & Causal Diff DAG (`SeedMutationLabCanvas`, `MutationCausalDiffDAG`, Split-View UX, Branch Switching, Production Build & Playwright E2E Suite)
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
**Plans**: 2 plans (all completed)
- [x] **19-01-PLAN.md** (Wave 1): Backend Counterfactual Delta Engine & Branching Integration (`counterfactual.py` Models, `CounterfactualService`, Hybrid Delta Generation, Isolated Branching & Pytest Suite)
- [x] **19-02-PLAN.md** (Wave 2): Frontend Counterfactual Replay Canvas & Branching (`CounterfactualReplayCanvas`, 50/50 Comparative Matrix, 4 Divergence Delta Cards, Timeline Forking & Playwright E2E Suite)
**Success Criteria**:
  1. Delta view compares current universe against rejected candidate worlds.
  2. Highlights key divergence in protagonist, tone, conflict, and lore assumptions without re-running full universe generation.
  3. Actionable timeline forking creates an isolated child branch rooted in the alternative world, keeping the parent universe immutable.

---

### Phase 20: Human-Only Zones
**Goal**: Provide creator-locked creative controls for defining core theme and motivations before AI expansion, protected from AI override.  
**Depends on**: Phase 11 (Decision DNA), Phase 12 (Origin Ledger)  
**Plans**: 2 plans (all completed)
- [x] **20-01-PLAN.md** (Wave 1): Backend Human-Only Zones & AI Protection Engine (`selection.py` Models, `ProjectRepository` Migration, Dual-Layer Prompt Invariance & Schema Guard, Pytest Suite)
- [x] **20-02-PLAN.md** (Wave 2): Frontend Creator Lock Controls & Visual Indicators (`WorldSelectionCanvas` Panel, Stage 5 Banner, Codex Card Lock Badges, Production Build & Playwright E2E Suite)
**Success Criteria**:
  1. Creator-locked input fields for core theme, protagonist motivation, and central conflict in Stage 4.
  2. Locked parameters are marked `HUMAN_DECISION` in Decision DNA, Origin Ledger, and Causal Lineage DAG.
  3. AI models are strictly prohibited from overriding or diluting locked zones via dual-layer defense (prompt contract + backend schema guard).

---

# Milestone 3: Complete UI Upgrade

## Milestone 3 Phases Overview

- [x] **Phase 21: Design System Foundation** — Global design tokens, Cormorant Garamond & Inter typography, warm cream parchment, subtle paper texture, button/card/input utility tokens (`design.md`).
- [x] **Phase 22: Global App Shell** — Warm cream sidebar (265-280px), botanical leaf branding, navigation (Home, My Creations, Graveyard, Profile), corner botanical accents.
- [x] **Phase 23: Home Screen** — Poetic hero statement, leaf separator, 72px pill seed input, 5 creation modes, recent creations row.
- [x] **Phase 24: Creation Component System** — Unified reusable `CreationCard` component supporting Image, Story, Sound, Video, Chat.
- [ ] **Phase 25: My Creations Screen** — 3-column gallery, search, sort, filter pills, empty states.
- [ ] **Phase 26: Graveyard Screen** — Reflective & poetic idea cemetery, restore, permanent deletion with confirmation modal.
- [ ] **Phase 27: Profile Screen** — Botanical identity card, stats, creation tabs, account settings panel, soft danger logout.
- [x] **Phase 28: Seed → Universe Workspace** — Botanical redesign of the 7 workspace stages preserving all functional logic.
- [x] **Phase 29: Secondary UI** — Botanical modals, drawer, lightboxes, dropdowns, shortcuts, typography standardization, and minimum 12px text polish.
- [/] **Phase 30: UI Density, Clustering & Composition Polish** — Comprehensive density audit and multi-wave decluttering (Wave 1 P0 Canvas Cleanup completed).
- [ ] **Phase 31: Motion & Organic Unfolding** — Organic transitions (180ms), seed pulse, gentle unfolding motion.
- [ ] **Phase 32: Final Visual Audit & Verification** — Complete review against `design.md` checklist and test verification.

---

### Phase 24: Creation Component System
**Goal**: Create ONE canonical, strongly-typed, accessible `CreationCard` component for the entire PRAROHA application.  
**Depends on**: Phase 21, Phase 22, Phase 23  
**Plans**: 1 plan (completed)
- [x] **24-PLAN.md**: Strongly-typed `CreationCard` (`types.ts`, `CreationCard.tsx`), 16:9 thumbnail, 5 content types (Image, Story, Sound, Video, Chat), type badges, calm fallbacks, context menu, favorite toggle, Graveyard variant, Home `RecentCreationsRow` refactoring, and Playwright E2E suite (`test_phase24_creation_component.cjs`).  
**Success Criteria**:
  1. Single reusable `CreationCard` supports Image, Story, Sound, Video, Chat.
  2. Type-specific color/icon language adheres strictly to `design.md`.
  3. Actions and context menu are configurable by parent.
  4. 44x44px accessible favorite toggle and keyboard support verified.
  5. Missing/failed media degrades gracefully into calm botanical placeholder.
  6. `RecentCreationsRow` refactored to consume `CreationCard` with zero duplicated styles.
  7. Automated Playwright test suite passes 100% across all 13 criteria.

---

### Phase 28: Seed → Universe Workspace Botanical Redesign
**Goal**: Perform a complete visual convergence pass across Stages 4, 5, 6, and 7 adhering strictly to the PRAROHA Botanical Design System while preserving 100% of functional logic, APIs, and schemas.  
**Depends on**: Phase 20, Phase 21, Phase 22  
**Plans**: 1 plan (completed)
- [x] **28-01-PLAN.md**: Botanical redesign of Stages 4 (Choose & Decision DNA), 5 (Unfold Codex), 6 (Traceability DAG), and 7 (Refine & Mutation Lab & Counterfactual Replay). Zero residual dark cyber elements, responsive multi-viewport pass, and Playwright E2E suite (`test_phase28_botanical_workspace.cjs`).  
**Success Criteria**:
  1. Zero dark cyber panels, neon cyan/blue glows, or dark navy blocks in Stages 4-7.
  2. All functional logic, Human-Only Zones, Decision DNA, Origin Ledger, and Media Engines remain operational.
  3. Zero horizontal page overflow across 1440px desktop, 1024px tablet, and 390px mobile viewports.
  4. 154/154 backend pytest suite and Playwright multi-viewport suite pass 100%.

---

### Phase 29: Secondary UI + Typography + Visibility Polish
**Goal**: Senior Product Designer & Frontend Engineer polish pass standardizing typography scales, eliminating faint text (<12px and /40 opacities), ensuring 44px touch targets, and refining modals, drawers, and lightboxes.  
**Depends on**: Phase 28  
**Plans**: 1 plan (completed)
- [x] **29-01-PLAN.md**: Typography scale standardization (Cormorant Garamond 20–36px, Inter 14–16px, metadata 12–13px min), zero instances of `text-[9px]` or `text-[10px]` across `frontend/src`, high-contrast palette (#294B3A, #394840, #5F6D63), 44px min touch targets for primary buttons and close targets, and comprehensive E2E suite (`test_phase29_ui_polish.cjs`).  
**Success Criteria**:
  1. Complete purge of text under 12px across the entire frontend codebase.
  2. Elimination of faint `/40` opacity text in favor of solid high-contrast botanical tokens.
  3. Minimum 44px touch targets on primary actions, modal close triggers, and drawer headers.
  4. Origin badges, media controls, and stage progress headers styled with comfortable padding and readable font sizes.
  5. 154/154 pytest tests, clean production build (`npm run build`), and 100% pass rate in `test_phase29_ui_polish.cjs`.

---

### Phase 30: UI Density, Clustering & Composition Polish
**Goal**: Systematic elimination of visual clutter, misplaced developer telemetry, and competing actions across primary creative workspaces.  
**Depends on**: Phase 29  
**Plans**: 4 Waves (Waves 1 & 2 completed)
- [x] **30-01-PLAN.md / Wave 1 (P0 Clutter Reduction)**: Removal of canvas architecture/engine status cards across all 7 stages, removal of premature media generation from Stage 3 candidates, removal of duplicate branching launchers/tabs from Stage 5 Codex, removal of competing Stage 3 bottom CTA, and Stage 7 refinement sub-view consolidation (`test_phase30_01_clutter_reduction.cjs`).
- [x] **30-02-PLAN.md / Wave 2 (Clean Global Header & Shell Simplification)**: Senior UX redesign of TopBar and StageProgressHeader. Left brand mark and project identity cleanly separated with subtle vertical divider; top-level button cluster evicted into unified Workspace Menu (`•••`) popover; maximum 3 visible utility controls (Search, Inspect, Overflow); Universe Search Modal (`SearchModal.tsx`) with ⌘K hotkey; quiet editorial progress rail on desktop with thin 1px connectors, green checkmarks, and active underline indicator; non-scrolling mobile compact stage carousel with Prev/Next buttons and 7 interactive stage indicator dots; mobile header deduplication in AppShell (`test_phase30_02_shell_simplification.cjs`).
- [ ] **Wave 3 (Stage 4 & Stage 2 Layout Flattening)**: Stage 4 selection gate consolidation and Stage 2 DNA blueprint flattening.
- [ ] **Wave 4 (Stage 3 & Stage 6 Progressive Disclosure)**: Stage 3 narrative dimensions progressive disclosure and Stage 6 DAG filter toolbar unification.
**Success Criteria (Wave 1 & 2)**:
  1. Zero technical architecture cards rendered on creative canvases.
  2. Stage 3 candidate comparison contains zero premature media generation inputs/buttons.
  3. Stage 5 Codex contains zero duplicate Mutation Lab or Counterfactual Replay launchers.
  4. TopBar header reduced to max 3 utility controls with zero competing developer badges.
  5. StageProgressHeader provides clean editorial rail on desktop and non-scrolling carousel on mobile.
  6. 100% pass across all 9 automated test suites with zero horizontal overflow across 6 viewports.

---

## Milestone 4: Real Product Hardening + True Realtime

### Phase 31.1: Gemini & AI Provider Repair
**Goal**: Repair live AI generation so that arbitrary seeds produce genuine, divergent outputs from Google Gemini without silent mock fallbacks.  
**Depends on**: Phase 30  
**Requirements**: REAL-01.1, REAL-01.2, REAL-01.3, REAL-01.4  
**Success Criteria**:
  1. Active model is configured as `gemini-2.5-flash` in `backend/app/core/config.py` and instantiated cleanly.
  2. Live Google AI API calls succeed for Seed DNA, Worlds, and Unfold when `GEMINI_API_KEY` is present.
  3. Silent fallback to `MockProvider` in production mode is completely removed; real error envelopes are returned if API fails.
  4. Testing with Seed A (*"A nomadic clockmaker in a desert of glass"*) and Seed B (*"A monastery in space tending a dying dying star"*) produces fundamentally distinct outputs.

---

### Phase 31.2: Server-Backed Generation Job State
**Goal**: Model and persist asynchronous generation jobs in PostgreSQL to replace client-side `setTimeout` fake progress bars with genuine server job lifecycle states.  
**Depends on**: Phase 31.1  
**Requirements**: REAL-04.1, REAL-04.2  
**Success Criteria**:
  1. `generation_jobs` SQLModel table created in backend tracking `job_id`, `project_id`, `stage`, `status`, `progress_percent`, `error_message`, and timestamps.
  2. Long-running AI operations create a job and execute via background tasks or async pipelines.
  3. Client subscribes to real job progression; fake `setTimeout` ladders in frontend stores are eliminated.

---

### Phase 31.3: Supabase Realtime Infrastructure
**Goal**: Establish a dedicated, robust Supabase Realtime subscription layer in the frontend scoped strictly by project.  
**Depends on**: Phase 31.2  
**Requirements**: REAL-02.1, REAL-02.2, REAL-02.3  
**Success Criteria**:
  1. Dedicated module `frontend/src/realtime/` with lifecycle methods: `connect`, `subscribeProject(projectId)`, `unsubscribeProject`, `disconnect`.
  2. Scoped Postgres change listeners on `projects`, `seed_dna`, `seed_potential_items`, `world_candidates`, `world_selections`, `world_bibles`, `characters`, `character_relationships`, `scenes`, `media_assets`, and `entity_revisions`.
  3. Connection resilience handles disconnection, network interruptions, and automatic re-subscription without memory leaks.

---

### Phase 31.4: Realtime Store Synchronization
**Goal**: Wire Supabase Realtime events directly to Zustand workspace store so any database mutation automatically updates the UI across open tabs without refreshing.  
**Depends on**: Phase 31.3  
**Requirements**: REAL-03.1, REAL-03.2  
**Success Criteria**:
  1. Store state updates deterministically upon receiving Realtime `INSERT`, `UPDATE`, or `DELETE` events.
  2. Opening the project in two separate browser tabs verifies that an action taken in Tab A (e.g. world selection or entity editing) reflects immediately in Tab B.

---

### Phase 31.5: Project Routing & Authoritative Rehydration
**Goal**: Implement authoritative URL routing and server rehydration so users can refresh, bookmark, or navigate between real projects via `/projects/:projectId`.  
**Depends on**: Phase 31.4  
**Requirements**: REAL-06.1, REAL-06.2  
**Success Criteria**:
  1. Application supports deep routes: `/`, `/projects`, `/projects/:projectId`, `/creations`, `/graveyard`.
  2. Navigating to `/projects/:projectId` fetches authoritative state from backend API and subscribes to project realtime channel.
  3. Project Library UI allows creating, renaming, opening, switching, and deleting real projects.

---

### Phase 31.6: Real My Creations & Graveyard
**Goal**: Replace static placeholder arrays in My Creations and Graveyard with live database-driven records supporting soft-delete, restore, and permanent deletion.  
**Depends on**: Phase 31.5  
**Requirements**: REAL-07.1, REAL-07.2  
**Success Criteria**:
  1. My Creations displays actual projects and media assets queried from backend.
  2. Moving an entity or project to the Graveyard marks `archived_at` or `deleted_at` in Postgres.
  3. Graveyard screen allows genuine restoration and permanent deletion with confirmation modal, syncing via Realtime.

---

### Phase 31.7: Authentication & Project Ownership
**Goal**: Integrate user ownership (`projects.user_id`) and protect backend endpoints against unauthorized access.  
**Depends on**: Phase 31.6  
**Requirements**: REAL-08.1, REAL-08.2  
**Success Criteria**:
  1. User authentication context (via Supabase Auth or session token) binds to newly created projects.
  2. Backend endpoints verify that the requesting user owns the target project before reading or mutating.
  3. Anonymous or unauthorized requests cannot mutate or delete other users' projects.

---

### Phase 31.8: Media Realtime Pipeline
**Goal**: Convert media generation into a background job pipeline backed by Supabase Realtime events.  
**Depends on**: Phase 31.4  
**Requirements**: REAL-05.1, REAL-05.2  
**Success Criteria**:
  1. `POST /media/generate` triggers background generation and emits realtime updates as assets complete.
  2. Browser tab closure during generation does not lose asset; reopening the project immediately renders the newly created asset from Postgres.

---

### Phase 31.9: Error Semantics & Demo Mode Isolation
**Goal**: Enforce strict error semantics (no 200 OK mask on failures) and isolate Canonical Demo Mode with zero bleed into Real Mode.  
**Depends on**: Phase 31.1, Phase 31.2  
**Requirements**: REAL-09.1, REAL-09.2  
**Success Criteria**:
  1. Explicit error states with actionable codes and retry actions rendered in UI.
  2. Canonical demo data (*"A child discovers a forgotten city beneath the ocean"*) is available ONLY when explicitly entering Demo Mode.
  3. Real Mode uses live Gemini generation and Postgres persistence without mixing demo fixtures.

---

### Phase 31.10: Production E2E & Two-Tab Realtime Tests
**Goal**: Develop and pass automated Playwright test suites verifying live arbitrary seeds, two-tab realtime synchronization, and recovery.  
**Depends on**: Phases 31.1–31.9  
**Requirements**: REAL-10.1  
**Success Criteria**:
  1. Playwright test suite launches two browser contexts simultaneously and proves realtime sync without refresh.
  2. E2E test runs with arbitrary non-demo seeds and verifies live AI outputs.
  3. Reconnect and error recovery flows pass automated verification.

---

### Phase 31.11: Final Full-System Audit & Verification
**Goal**: Perform exhaustive end-to-end verification, live Seed A vs Seed B proof, component integrity audit, and produce final milestone sign-off.  
**Depends on**: Phase 31.10  
**Requirements**: REAL-10.2  
**Success Criteria**:
  1. Empirical proof of Seed A vs Seed B divergent outputs documented.
  2. 23-item Final Acceptance Criteria verified 100%.
  3. Production build succeeds and all regression suites pass.
