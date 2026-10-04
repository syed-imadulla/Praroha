# Roadmap: Seed Unfold

## Overview

Seed Unfold takes an ambiguous, formless seed idea, understands its core intent, generates exactly three distinct creative worlds, allows a human to select their path, and progressively unfolds that world into an inspectable, traceable mini-universe. This roadmap executes the MVP in 8 sequential, focused phases moving from foundation through progressive unfolding to full provenance and demo resilience.

## Phases

- [x] **Phase 1: Foundation / Project Shell** — Setup full-stack shell (React+Vite frontend, FastAPI backend), calm dark workspace layout, and AI provider abstraction.
- [x] **Phase 2: Seed Understanding + Seed DNA** — Implement seed ingestion, input validation, AI understanding pass, and canonical Seed DNA extraction & inspection.
- [ ] **Phase 3: Three World Generation** — Build the branching engine to generate exactly three distinct, high-contrast world candidates respecting Seed DNA.
- [ ] **Phase 4: Human World Selection** — Implement the 3-world comparison UI, trade-off review, and explicit human choice gating mechanism.
- [ ] **Phase 5: Progressive World Unfolding** — Progressively unfold the selected world into a World Bible, core characters, relationship web, and key dramatic scenes.
- [ ] **Phase 6: Traceability / Provenance** — Construct the DAG lineage graph connecting all entities, enabling interactive drill-down to root seed decisions without CoT leakage.
- [ ] **Phase 7: Refine / Branch / Save** — Implement localized refinement, macro timeline branching, and complete project state persistence (save/load).
- [ ] **Phase 8: Polish / Reliability / Demo** — Integrate canonical underwater city demo fixtures, offline fallback handling, end-to-end testing, and presentation polish.

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
**Plans**: TBD

---

### Phase 4: Human World Selection
**Goal**: Provide side-by-side world comparison and enforce an explicit human selection gate.  
**Depends on**: Phase 3  
**Requirements**: HCHO-01, HCHO-02, HCHO-03  
**Success Criteria**:
  1. User sees 3 world cards side-by-side with loglines, aesthetic palettes, and trade-offs.
  2. The workflow pauses and strictly prevents autonomous progression until human selection occurs.
  3. Selecting a world triggers confirmation and advances to unfolding mode.  
**Plans**: TBD

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
**Plans**: TBD

---

### Phase 6: Traceability / Provenance
**Goal**: Record and visualize the parent-child DAG lineage of all generated entities back to the root seed.  
**Depends on**: Phase 5  
**Requirements**: TRAC-01, TRAC-02, TRAC-03  
**Success Criteria**:
  1. Every character, scene, and world rule stores explicit parent node IDs (`derived_from`, `constrained_by`, `selected_by`).
  2. Clicking any entity highlights its provenance path back to Seed DNA and user choices.
  3. Explanations are plain-language and free of raw model reasoning tokens.  
**Plans**: TBD

---

### Phase 7: Refine / Branch / Save
**Goal**: Enable fine-grained component editing, timeline branching, and complete project save/load.  
**Depends on**: Phase 6  
**Requirements**: PERS-01, PERS-02, PERS-03  
**Success Criteria**:
  1. User can modify a character or scene, creating an auditable new version.
  2. User can branch the story-world timeline without destroying the original branch.
  3. Full universe state exports to and imports from persistent storage.  
**Plans**: TBD

---

### Phase 8: Polish / Reliability / Demo
**Goal**: Provide foolproof demo resilience with canonical fixtures, offline fallbacks, and polished UI animations.  
**Depends on**: Phase 7  
**Requirements**: DEMO-01, DEMO-02  
**Success Criteria**:
  1. Canonical demo seed (*"A child discovers a forgotten city beneath the ocean"*) works instantly with cached fixtures.
  2. Network disconnection or API failure triggers clean fallback without UI crash.
  3. End-to-end journey completes cleanly in under 5 minutes for judging demonstrations.  
**Plans**: TBD
