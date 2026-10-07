# Phase 12 Research: Origin Ledger

**Phase Goal**: Upgrade provenance across the platform by tagging every universe entity with a universal origin classification (`SEED_EXPLICIT`, `SEED_INFERRED`, `HUMAN_DECISION`, `DERIVED`, `AI_INTRODUCED`, `USER_ADDED`), integrating origin badges and color accents into the Causal Lineage DAG and Universe Codex, and providing an interactive "Why is this here?" causal explainer across all surfaces without raw chain-of-thought leakage.

---

## 1. Domain & Architecture Investigation

### 1.1 Existing Lineage & Entity Architecture
- **Lineage Service (`backend/app/services/lineage_service.py`)**:
  - Dynamically synthesizes the DAG for a project from relational records across 5 layers:
    1. Root Idea Seed (`stage=1`)
    2. Seed DNA (`stage=2`)
    3. World Candidates & Human Selection Gate (`stage=3` & `stage=4`)
    4. World Bible & Key Locations (`stage=5`)
    5. Characters, Relationships & Scenes (`stage=5`) with version chaining (`stage=7`)
  - Currently produces `TraceNode` with `id`, `entity_id`, `entity_type`, `label`, `title`, `stage`, `summary`, `causal_explanation`, `parent_ids`, `metadata`.
  - Missing: structured `origin_type` and `origin_source` fields on `TraceNode`.
- **Entity Records (`backend/app/models/unfold.py`)**:
  - `CharacterRecord` (table `characters`): Stores `name`, `role`, `archetype`, `motivation`, `core_conflict`, `visual_prompt`, `version`, `revision_notes`. Missing `origin_type` and `origin_source`.
  - `SceneRecord` (table `scenes`): Stores `title`, `setting`, `conflict`, `synopsis`, `characters_involved_json`, `emotional_beats_json`, `visual_prompt`, `version`. Missing `origin_type` and `origin_source`.
  - `WorldBibleRecord` (table `world_bibles`): Stores `key_locations_json`, `canon_facts_json`, `factions_json`.
    - `LocationItem` in Pydantic schema: `name`, `description`, `visual_prompt`. Missing `origin_type` and `origin_source`.
- **Repository Migration Pattern (`backend/app/repositories/project_repo.py`)**:
  - `_migrate_columns`: Established pattern for safe, non-destructive schema migration on startup.
  - Successfully used in Phase 9 (`seed_potentials`), Phase 10 (`exploration_profile_json`, `divergence_archetype`), and Phase 11 (`creative_priorities_json`, `rejected_directions_json`, `custom_directives`).
  - Safe inspection of `characters` and `scenes` table columns with `ALTER TABLE ... ADD COLUMN ...` ensures existing databases hydrate without data loss.

### 1.2 The 6-Tier Universal Origin Classification Taxonomy (`ORIG-01`)
The classification maps directly to the creative pipeline stages:
1. `SEED_EXPLICIT`:
   - Concept: Directly anchored in explicit nouns/verbs present in the raw seed text.
   - Typical entities: Root seed node, core protagonist archetype ("Child Protagonist"), primary setting ("Sunken City").
   - Color: **Cyan** (`#06b6d4`).
2. `SEED_INFERRED`:
   - Concept: Stemming from semantic possibilities, tensions, or open questions identified in the Seed Potential Map (Stage 2).
   - Typical entities: Supporting characters embodying potential tensions ("Sentient Deep-Sea Ecosystem", "Ancient Symbiotic Technology").
   - Color: **Indigo** (`#6366f1`).
3. `HUMAN_DECISION`:
   - Concept: Directly commanded or shaped by creator commitments in Stage 4 Decision DNA (selected world archetype, priorities, custom directives, or negative exclusions).
   - Typical entities: Lead characters or locations designed specifically to embody creator non-negotiables (e.g. "Enzyme bio-physics", "Deep Sea Bioluminescence").
   - Color: **Amber** (`#f59e0b`).
4. `DERIVED`:
   - Concept: Logical systemic outgrowth from established World Bible physics, geography, historical timeline, or factions.
   - Typical entities: Landmark locations, secondary factions, environmental hazards, historical eras.
   - Color: **Sky** (`#0284c7`).
5. `AI_INTRODUCED`:
   - Concept: Novel generative synthesis introduced by the AI provider to bridge narrative gaps or add aesthetic depth while respecting all Decision DNA constraints.
   - Typical entities: Incidental scenes, minor relationship dynamics, dialogue color, atmospheric details.
   - Color: **Violet** (`#8b5cf6`).
6. `USER_ADDED`:
   - Concept: Created or explicitly modified/forked by the user in Stage 7 Refine or Timeline Branching.
   - Typical entities: Refined character versions (v2+), user-added scenes, custom world forks.
   - Color: **Emerald** (`#10b981`).

### 1.3 Deterministic "Why is this here?" Explainer (`ORIG-03`)
- **Zero LLM Overhead / CoT Shield**:
  - The explainer must NOT make an LLM call or expose raw internal model reasoning tokens.
  - Instead, it is synthesized deterministically from stored metadata:
    ```
    Template:
    [Origin Badge & Title]
    Origin Anchor: [origin_source or "Creative Context"]
    Causal Trail: [parent lineage summary]
    Justification: [plain-language deterministic narrative]
    ```
  - Performance: <10ms execution, 100% deterministic, offline capable, zero credit cost.

### 1.4 Frontend Integration Surfaces (`ORIG-02`, `ORIG-03`)
1. **Universe Codex (`UniverseCodexCanvas.tsx`)**:
   - Embed an interactive `OriginBadge` component on:
     - Character Cards (top-right next to archetype)
     - Location Cards (next to location index)
     - Scene Cards (next to scene badge)
     - Canon Facts / Rules items (next to fact pill)
   - Add an Origin Filter bar at the top of the Codex: `[All] [Seed Explicit] [Seed Inferred] [Human Decision] [Derived] [AI Introduced] [User Added]`.
   - Clicking any OriginBadge opens a compact, floating "Why is this here?" modal or docks into the Inspector.
2. **Causal Lineage DAG (`TraceabilityCanvas.tsx`)**:
   - Every node in the 5-lane DAG displays its OriginBadge and a subtle glow border matching the origin color.
   - Add an Origin Filter toolbar: allows creators to isolate only Human Decisions, Seed Anchors, or AI Syntheses.
   - The right-hand sticky Causal Inspector panel displays the full "Why is this here?" card with parent node links.
3. **Inspector Drawer (`InspectorDrawer.tsx`)**:
   - Provenance / Lineage tab displays an "Origin Ledger Breakdown" pill summary bar showing distribution percentages across the 6 origin types.

---

## 2. Plan Decomposition

### Wave 1: Backend Engine & Deterministic Explainer (`12-01-PLAN.md`)
- Define `OriginType` literal/enum in `backend/app/models/lineage.py` and `backend/app/models/unfold.py`.
- Add `origin_type` and `origin_source` to `CharacterBase`, `CharacterRecord`, `CharacterRead`, `SceneBase`, `SceneRecord`, `SceneRead`, `LocationItem`.
- Add `origin_type` and `origin_source` to `TraceNode`.
- Update `ProjectRepository._migrate_columns` to safely add columns to `characters` and `scenes`.
- Update `ProjectRepository.save_character` and `save_scenes` to accept and persist origin fields.
- Update `create_canonical_demo_project` to pre-seed rich, balanced origin classifications for Bio-City demo.
- Implement `generate_origin_explanation()` in `LineageService` to synthesize plain-language causal narratives.
- Update `LineageService.build_project_lineage` to populate origin data for all DAG nodes.
- Dedicated Pytest suite `backend/tests/test_origin_ledger.py` covering models, migration, explanation generation, and API endpoints.

### Wave 2: Frontend UI Surfaces & Playwright E2E Suite (`12-02-PLAN.md`)
- Update `frontend/src/types/index.ts` with `OriginType` and origin fields on entities and `TraceNode`.
- Create reusable `OriginBadge.tsx` component with distinct color palettes, icons, and tooltips.
- Create `WhyIsThisHereModal.tsx` for instant modal explanation from any card click.
- Update `UniverseCodexCanvas.tsx`:
  - Render `OriginBadge` on Character cards, Location cards, Scene cards, and Canon Facts.
  - Add Origin Filter toolbar across Codex tabs.
  - Wire click handler to open "Why is this here?" explainer.
- Update `TraceabilityCanvas.tsx`:
  - Render `OriginBadge` and origin color accents on DAG nodes.
  - Add Origin Filter toolbar to filter DAG nodes by origin.
  - Update Causal Inspector panel with full origin breakdown.
- Update `InspectorDrawer.tsx` to display origin distribution metrics in Step 5.
- Automated Playwright E2E test `frontend/e2e/test_phase12_origin_ledger.cjs` covering all 5 scenarios.

---

## 3. Risk Mitigation & Verification
- **Backward Compatibility**: `_migrate_columns` defaults `origin_type` to `'AI_INTRODUCED'`, so existing database records never crash or raise validation errors.
- **Performance**: Zero external API calls for origin explanations; completely deterministic templates executed in <10ms.
- **Offline / Demo Resilience**: Pre-seeded Bio-City fixtures hydrate all 6 origin classifications in <500ms.
