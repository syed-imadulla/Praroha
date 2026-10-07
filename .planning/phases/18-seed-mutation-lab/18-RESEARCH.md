# Phase 18: Seed Mutation Lab - Research

## Architecture & Technology Research

### 1. Existing System Assets & Integration Points
- **Seed DNA Architecture (`backend/app/models/dna.py`)**:
  - `SeedDNA` contains `premise`, `themes`, `entities`, `constraints`, `tone`, `domain_keywords`.
  - In `SeedMutationLab`, we extract curated premise variables directly from `SeedDNA` and `WorldBibleRecord` to populate the variable selector.
- **Lineage Service & Origin Ledger (`backend/app/services/lineage_service.py`)**:
  - Dynamically synthesizes causal DAG nodes (`TraceNode`) and edges (`TraceEdge`).
  - Supports origin classifications: `SEED_EXPLICIT`, `SEED_INFERRED`, `HUMAN_DECISION`, `DERIVED`, `AI_INTRODUCED`, `USER_ADDED`.
  - Origin explanations are deterministic and plain-language with zero LLM overhead.
  - Phase 18 leverages this relational DAG structure to compute downstream causal reachability:
    - Root nodes connected to mutated premise variables $\rightarrow$ `AFFECTED`.
    - Intermediate relational and conflict dynamics $\rightarrow$ `CONDITIONAL`.
    - Independent subtrees (e.g. background geographic features, secondary lore) $\rightarrow$ `PRESERVED`.
- **Branching Engine (`backend/app/services/persistence_service.py`)**:
  - `branch_project()` already implements zero-destruction cloning with complete ID remapping for:
    - `Project`, `SeedDNARecord`, `WorldCandidateRecord`, `WorldSelectionRecord`, `WorldBibleRecord`, `KeyLocationRecord`, `CharacterRecord`, `RelationshipRecord`, `SceneRecord`, `MediaAssetRecord`, and revisions.
  - Returns the newly created child `Project`.
  - Phase 18 builds directly on `branch_project()`, adapting `AFFECTED` and `CONDITIONAL` entities in the child branch, persisting mutation metadata, and ensuring the parent universe remains 100% immutable.
- **Frontend Workspace & Codex Canvas (`frontend/src/store/workspaceStore.ts`, `UniverseCodexCanvas.tsx`)**:
  - `activeProject`, `projects`, `branches`, `switchBranch` already exist and support multi-branch workflows.
  - Adding a dedicated `#codex-tab-mutation` inside `UniverseCodexCanvas.tsx` provides seamless navigation alongside Bible, Characters, Scenes, and Lineage Inspector.

---

### 2. Three-Tier Impact Classification Strategy
- **`AFFECTED` (High Impact / Amber-Red)**:
  - Entities whose foundational truth or core narrative purpose is anchored directly to the mutated premise.
  - Example: If the ocean city was a *weaponized outpost* instead of a *forgotten sanctuary*:
    - World Bible physical laws (defensive shielding, energy conduits).
    - City primary key location (command hub, heavy turrets).
    - Central world conflict (military threat, active alert).
- **`CONDITIONAL` (Contextual Adaptation / Cyan)**:
  - Entities that survive conceptually but must adapt to the new context.
  - Example:
    - Protagonist motivation (from innocent archeology to espionage or survival evasion).
    - Relationship tensions (allies questioning hidden military loyalties).
    - Scene conflicts (infiltrating barricaded sectors).
- **`PRESERVED` (Causal Invariant / Emerald)**:
  - Entities causally independent of the mutated premise.
  - Example:
    - Oceanic marine ecology (bioluminescent flora, marine life).
    - Ancient geological trenches.
    - Historical artifacts predating the city's construction.
- **Deterministic Offline Fallback**:
  - Rule-based keyword and origin graph mapping guarantees that `Simulate Impact` works reliably without external API dependencies or network latency, satisfying canonical demo requirements.

---

### 3. Causal Diff DAG Visualization & Propagation Aesthetics
- **Visual Design Philosophy**:
  - Visual clarity over complex physics simulations.
  - Distinct color halos and badges:
    - `AFFECTED`: Warning amber-red pulsing halo (`shadow-[0_0_15px_rgba(245,158,11,0.4)]`, `border-amber-500`).
    - `CONDITIONAL`: Cyan adaptation border (`border-cyan-400`, `text-cyan-300`).
    - `PRESERVED`: Emerald calm border with lock icon (`border-emerald-500/50`, `text-emerald-300`).
  - Propagation lines:
    - Glowing animated SVG paths flowing from the Seed node down through World Bible $\rightarrow$ Characters $\rightarrow$ Scenes.
- **Interactive Node Inspection**:
  - Clicking a node displays: Title, Entity Type, Impact Category, Causal Justification, and Projected Impact summary.

---

### 4. Non-Regression Constraints
- 125 backend pytest tests passing across Phases 1–17 must not regress.
- Frontend build must compile with 0 TypeScript errors.
- All existing E2E tests (Phases 1–17) must remain fully passing.
- Media generation (images, voice, video, audio) remains non-blocking and optional.
