# Phase 18: Seed Mutation Lab - Context & Decisions

## Executive Summary
Phase 18 introduces the **Seed Mutation Lab (MUT-01 to MUT-04)** into **Seed Unfold (Praroha)**. Creators can simulate "What If?" counterfactual modifications to core premise assumptions of their established story universe (e.g., *"What if the submerged metropolis was a weaponized outpost rather than a forgotten sanctuary?"*). The system evaluates causal lineage to classify all universe elements as `AFFECTED`, `CONDITIONAL`, or `PRESERVED` in a **Downstream Impact Preview**, renders an interactive **Causal DAG Diff** highlighting propagation paths, and allows the creator to commit the mutation by **forking an isolated timeline branch** without mutating or corrupting the original universe.

---

## Locked Architectural Decisions

### D-01: Premise Formulation & "What If?" Formulation (`MUT-01`)
1. **Hybrid Variable Formulation**:
   - **Curated Premise Variables**:
     - *Core Premise Assumption*: Extrapolated from `SeedDNA.premise`.
     - *Tone & Atmosphere*: Extrapolated from `SeedDNA.tone` (e.g., Wonder $\rightarrow$ Paranoia).
     - *Central Thematic Conflict*: Primary thematic friction (e.g., Discovery vs Survival).
     - *World Rule / Technological Foundation*: Physical/ecological law of the universe.
   - **Freeform "What If?" Statement Prompt**:
     - Direct text input where creators articulate a creative hypothesis (e.g., *"What if the breathing atmosphere beneath the waves required sacrificing human memories?"*).
   - **AI/Deterministic Variable Synthesis**:
     - System maps the freeform "What If?" statement together with selected premise variables into a structured `SeedMutationRequest(mutated_variable, original_value, new_value, hypothesis_prompt)`.

### D-02: Lineage-Driven Downstream Impact Classification (`MUT-02`)
1. **Three-Tier Impact Categories**:
   - **`AFFECTED`** (High Impact / Red-Amber):
     - Entities whose primary existence or canonical role is directly anchored to the mutated variable (e.g., World Bible physical laws, core protagonist motivations directly tied to the altered premise).
     - Must be rewritten or deeply transformed in the forked universe.
   - **`CONDITIONAL`** (Secondary Impact / Cyan-Blue):
     - Entities that remain conceptually intact but require contextual adaptation (e.g., character relationships strained by new hostilities, scene conflicts escalating in stakes).
   - **`PRESERVED`** (Invariant Foundation / Emerald-Green):
     - Entities whose origin anchor is independent of the mutated premise (e.g., background geography, unrelated historical lore, secondary characters).
2. **Lineage-Driven Evaluation Engine**:
   - Analyzes relational causal links from the `LineageService` DAG and `OriginLedger`.
   - Direct descendants of mutated seed nodes receive `AFFECTED`.
   - Secondary relational edges receive `CONDITIONAL`.
   - Independent subgraphs receive `PRESERVED`.
   - **Semantic Justification**: Fast LLM analysis generates a concise, plain-language causal justification for each entity's classification, backed by deterministic fallback rules when offline.

### D-03: Isolated Timeline Branching Engine (`MUT-03`)
1. **Zero-Destruction Branch Guarantee**:
   - Applying a mutation calls `PersistenceService.branch_project` to clone the active universe into an isolated child project with strict ID remapping.
   - The original universe remains 100% immutable and untouched.
2. **Branch Naming & Lineage Tagging**:
   - Branch named canonically: `mutation/{slugified_variable_name}` (e.g., `mutation/weaponized-outpost`) or creator custom name.
   - Child branch records the mutation metadata (`mutated_variable`, `original_value`, `new_value`, `hypothesis_prompt`, `impact_summary`).
3. **Entity Adaptation in Child Branch**:
   - In the newly forked project, `AFFECTED` and `CONDITIONAL` entities are updated with mutated narratives while preserving `PRESERVED` entities.
   - Lineage edges in the child branch record origin type `USER_ADDED` / `SEED_INFERRED` with mutation citation in the Origin Ledger.

### D-04: Causal DAG Mutation Diff & Propagation Visualization (`MUT-04`)
1. **Visual Diff Highlighting**:
   - Causal DAG renders nodes with status-specific styling:
     - `AFFECTED`: Pulsing amber/red halo and border with mutation badge.
     - `CONDITIONAL`: Cyan outline with adaptation indicator.
     - `PRESERVED`: Soft emerald outline with lock/anchor icon.
2. **Lineage Propagation Paths**:
   - Edges connecting mutated premise to affected entities are highlighted as glowing animated paths, demonstrating ripple effects down the creative hierarchy (Seed $\rightarrow$ World $\rightarrow$ Characters $\rightarrow$ Scenes).
3. **Interactive Inspection**:
   - Clicking any node in the Diff DAG displays its causal justification, original description, and projected mutation impact.

### D-05: Dedicated Mutation Lab Tab & Split-View UX Architecture
1. **Codex Tab & TopBar Access**:
   - Added as a top-level tab in `UniverseCodexCanvas.tsx`: **"Seed Mutation Lab"** (`#codex-tab-mutation`).
   - Quick launcher in TopBar / Universe Header alongside "Inspect Lineage": *"Simulate What If?"* button.
2. **Split-Screen Ergonomics**:
   - **Left Panel (50%)**: "What If?" Premise Controls, variable modifiers, "Simulate Impact" trigger, and categorized Impact Matrix (`AFFECTED` / `CONDITIONAL` / `PRESERVED` cards with diff summaries).
   - **Right Panel (50%)**: Interactive Causal Diff DAG rendering real-time ripple paths and node state badges.
3. **Commit Action**:
   - Prominent **"Fork Mutated Universe"** action button.
   - Displays confirmation with branch name preview and direct navigation to the newly spawned branch upon completion.

### D-06: Verification & Non-Regression Standards
1. **Backend Pytest Coverage**:
   - Test premise variable extraction and structured mutation payload generation.
   - Test downstream impact classification with deterministic lineage fallback.
   - Test timeline branch creation from mutation, verifying parent immutability and child ID remapping.
   - Full regression suite passing all 125 existing tests + Phase 18 tests with zero failures.
2. **Frontend Production Build**:
   - Clean `tsc && vite build` with zero TypeScript or bundling errors.
3. **Playwright E2E Suite**:
   - Scenario 1: Navigate to Seed Mutation Lab tab and verify premise variable controls.
   - Scenario 2: Simulate "What If?" premise change and verify `AFFECTED`, `CONDITIONAL`, and `PRESERVED` classifications.
   - Scenario 3: Verify Causal Diff DAG renders color-coded nodes and highlighted propagation paths.
   - Scenario 4: Commit "Fork Mutated Universe" and verify child branch creation, branch switching, and original universe immutability.
   - Scenario 5: Verify Origin Ledger and Lineage in mutated branch cite the mutation event.

---

## Scope Boundaries

### Strict MVP Boundaries
- **In Scope**:
  - Structured premise variables + freeform "What If?" input.
  - Causal lineage impact simulation (`AFFECTED`, `CONDITIONAL`, `PRESERVED`).
  - Causal DAG diff visualization with propagation highlights.
  - Branching execution creating isolated child projects with mutated entities.
  - Comprehensive automated pytest and Playwright test suites.
- **Out of Scope (Deferred to Future Phases)**:
  - Phase 19: Counterfactual Replay (comparing delta differences across rejected Stage 3 candidate worlds).
  - Phase 20: Human-Only Zones (creator-locked fields protected from AI rewriting).
  - Multi-way parallel timeline merges / git-style cherry-picking.

---

## Requirements Traceability

| Requirement | Description | Implementation Strategy |
|---|---|---|
| **MUT-01** | "What If?" seed variable modification interface | Premise variable selector + hypothesis prompt in Seed Mutation Lab tab. |
| **MUT-02** | Downstream Impact Preview classifies universe entities | `AFFECTED`, `CONDITIONAL`, `PRESERVED` matrix backed by Lineage DAG & semantic analysis. |
| **MUT-03** | Apply mutation forks isolated timeline branch | `PersistenceService.branch_project` forks parent project into immutable child branch. |
| **MUT-04** | Causal DAG visualizes mutation diffs | Interactive SVG DAG with color halos, badge overlays, and glowing ripple paths. |
