# Phase 19: Counterfactual Replay - Context & Decisions

## Executive Summary
Phase 19 introduces **Counterfactual Replay (CNTR-01, CNTR-02)** into **Seed Unfold (Praroha)**. Creators can explore "What If I Chose Another World?" by comparing their currently unfolded universe against the candidate worlds that were rejected during Stage 4 (Human World Selection). Without triggering expensive full universe re-generation, the system produces a structured divergence delta highlighting key contrasts across protagonist conception, tone and atmosphere, central dramatic conflict, and world rules/lore. Creators can inspect these counterfactual worlds in a side-by-side comparative matrix, evaluate divergence profiles, and optionally fork an isolated timeline branch rooted in any rejected candidate world if they wish to pursue that creative path.

---

## Locked Architectural Decisions

### D-01: UI Entry Point & Codex Integration (`CNTR-01`)
1. **5th Codex Navigation Tab**:
   - Added as a first-class tab in [UniverseCodexCanvas.tsx](file:///home/syed-imadulla/Desktop/Praroha/frontend/src/components/UniverseCodexCanvas.tsx): **"Counterfactual Replay"** (`#codex-tab-replay`).
   - Sits alongside `World Bible & Locations`, `Characters & Dynamics`, `Story Beats / Scenes`, and `Seed Mutation Lab`.
2. **Top Header Launcher Button**:
   - Prominent launcher button in the universe header alongside *"Simulate What If?"* and *"Inspect Lineage"*:
     - ID: `#launcher-counterfactual-replay-btn`
     - Label: `"What If I Chose Another World?"` (with alternative universe icon, e.g., `Shuffle` or `Split`).
   - Directly switches the active Codex tab to `'replay'`.
3. **Candidate World Selector Strip**:
   - Inside the Counterfactual Replay canvas, a horizontal selector displays the rejected candidate worlds (typically the 2 non-selected candidates from the batch of 3 generated in Stage 3).
   - Each card displays candidate title, archetype badge, divergence archetype (`familiar`, `radical`, `inverse`), and selection indicator.

### D-02: Hybrid Divergence Delta Generation (`CNTR-02`)
1. **Instant Deterministic Baseline Comparison**:
   - Zero-latency extraction comparing the active selected world and the inspected counterfactual candidate:
     - Basic metadata: Title, concept logline, creative archetype, divergence archetype.
     - Exploration profile comparison: 4-metric delta bars across Seed Fidelity, Novelty, Conceptual Distance, and Feasibility.
     - Stored candidate fields: `aesthetic`, `core_tension`, `trade_offs`, `key_visual`.
     - Decision DNA context: Rationale why the active world was chosen and what directions were rejected.
2. **On-Demand AI Semantic Delta Projection**:
   - Fast semantic projection endpoint (`/api/projects/{id}/counterfactual/delta/{candidate_id}`) synthesizing:
     - **Protagonist Divergence**: How the primary character / protagonist archetype would fundamentally differ (e.g., curious young scavenger vs elite military deep-sea pilot).
     - **Tone & Atmosphere Shift**: Visual and emotional contrast between current canon and counterfactual atmosphere.
     - **Central Conflict Divergence**: Core dramatic friction differences (e.g., ancient mystery vs factional warfare).
     - **World Rules & Lore Divergence**: Key differences in physical laws, tech level, and societal structure.
     - **Key Narrative Trade-Offs**: What was gained vs sacrificed by choosing current canon instead of this candidate.
3. **Deterministic Fallback & Offline Resilience**:
   - If the AI provider is offline or throttled, synthesize structured counterfactual delta immediately from stored candidate fields and Decision DNA without blocking or erroring.
   - Clean narrative justifications with zero Chain-of-Thought leakage.

### D-03: Side-by-Side Comparative Matrix UX Architecture
1. **50/50 Dual-Column Comparative Layout**:
   - **Left Column (Current Canon)**:
     - Selected world title, concept, divergence archetype.
     - Unfolded entity anchors: Leading protagonist character summary, core physical law, primary scene conflict.
     - Decision DNA rationale badge: *"Why you chose this world"*.
   - **Right Column (Counterfactual Candidate)**:
     - Alternative candidate title, concept, divergence archetype.
     - Projected protagonist archetype, tone shift, alternative central conflict, alternative lore rules.
     - Inferred exclusion tags (what was avoided by not picking this world).
2. **Divergence Metric & Profile Radar / Bar Overlays**:
   - Comparative exploration profile meters visualizing where the counterfactual world deviates in novelty, conceptual distance, and seed fidelity compared to the active universe.
3. **Divergence Cards**:
   - 4 clear visual delta cards with distinct thematic icons:
     - Protagonist Divergence (`User` / `UserCheck`)
     - Tone & Atmosphere (`Sparkles` / `Eye`)
     - Conflict & Stakes (`Swords` / `Flame`)
     - Lore & Rules (`BookOpen` / `Shield`)

### D-04: Actionable Timeline Branching ("Fork Timeline from Alternative World")
1. **Branching Action Button**:
   - Primary action: `"Fork Timeline from This World"` (`#fork-counterfactual-branch-btn`).
   - Allows creators to branch the project into an isolated timeline where the counterfactual candidate becomes the selected world.
2. **Branch Isolation & Persistence**:
   - Creates a new isolated branch project using `PersistenceService.branch_project`.
   - Branch name canonical pattern: `counterfactual/{candidate_slug}` (e.g., `counterfactual/sunken-time-capsule`).
   - Updates the child branch's selected world to the alternative candidate.
   - Sets project status to `world_selected` so the creator can either trigger progressive unfolding for this alternative universe or inspect its new branch.
   - Persists counterfactual metadata recording source parent project, alternative world ID, and branch trigger timestamp.
   - Switches the active workspace branch to the newly spawned branch while keeping the parent branch 100% immutable.

### D-05: Verification & Quality Standards
1. **Backend Pytest Coverage**:
   - Test retrieval of counterfactual candidates for a project.
   - Test deterministic delta generation baseline.
   - Test AI semantic delta projection endpoint with mock fallback.
   - Test counterfactual branch creation, ensuring parent canon remains intact and child branch selects the counterfactual candidate.
   - Full regression suite passing all 138 existing tests + Phase 19 tests with 0 failures.
2. **Frontend Production Build**:
   - Clean `tsc && vite build` with 0 TypeScript or bundling errors.
3. **Playwright E2E Suite**:
   - Scenario 1: Open Codex and launch Counterfactual Replay via header button or tab (`#codex-tab-replay`).
   - Scenario 2: Select a rejected candidate and verify side-by-side comparative matrix renders current canon vs alternative world.
   - Scenario 3: Verify the 4 divergence delta cards (Protagonist, Tone, Conflict, Lore) and exploration profile comparison meters.
   - Scenario 4: Trigger AI semantic delta projection and verify enriched divergence details.
   - Scenario 5: Fork timeline into alternative world, verify branch creation and switching, and confirm parent universe immutability.

---

## Scope Boundaries

### Strict MVP Boundaries
- **In Scope**:
  - Listing rejected candidate worlds from the active project's generation batch.
  - Instant deterministic delta comparison and on-demand AI semantic delta projection.
  - Side-by-side comparative UI matrix with 4 divergence dimensions and exploration profiles.
  - Forking timeline branch into the alternative world candidate with parent immutability.
  - Automated backend and Playwright E2E test suites.
- **Out of Scope (Deferred to Phase 20 / Milestone 3)**:
  - Phase 20: Human-Only Zones (creator-locked fields protected from AI rewriting).
  - Automated simultaneous multi-world unfolding (re-running full Bible, Characters, Scenes for all 3 worlds in parallel). Full unfolding occurs when the user branches into the world and triggers unfold.
  - Three-way cross-branch timeline merging or cherry-picking.
