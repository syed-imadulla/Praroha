# Phase 12 Context: Origin Ledger

**Phase Goal**: Upgrade provenance across the entire platform by tagging every universe entity with a universal origin classification, integrating origin badges and color accents into the Causal Lineage DAG and Universe Codex, and providing an interactive "Why is this here?" causal explainer across all surfaces without raw chain-of-thought leakage.

---

## 1. Locked Decisions & Implementation Scope

### D-01: Universal Origin Classification Taxonomy (`ORIG-01`)
Every entity generated or refined in the universe (Characters, Locations, Lore Rules / Canon Facts, Factions, Scenes) must carry an `origin_type` from the locked 6-tier classification enum:
1. `SEED_EXPLICIT` (Cyan): Directly anchored in explicit nouns/verbs from the creator's raw seed text.
2. `SEED_INFERRED` (Indigo): Stemming from accepted possibilities or open questions in the Stage 2 Seed Potential Map.
3. `HUMAN_DECISION` (Amber): Originating from creator commitments made in Stage 4 Decision DNA (chosen archetype, priorities, custom directives, or negative exclusions).
4. `DERIVED` (Sky): Logical systemic outgrowth from established World Bible physics, geography, or factions.
5. `AI_INTRODUCED` (Violet): Novel generative synthesis introduced by the AI provider to bridge narrative gaps or add atmospheric texture.
6. `USER_ADDED` (Emerald): Created directly or explicitly refined/forked by the user in Stage 7 Refine or timeline branching.

Each entity also supports an optional `origin_source` string specifying the exact anchor (e.g., `"Child Protagonist"`, `"Decision DNA Priority: Deep Sea Bioluminescence"`, `"Coral Spire Biology"`).

### D-02: Data Schema & Non-Destructive Relational Migration
- **Backend Models (`backend/app/models/unfold.py` & `lineage.py`)**:
  - `CharacterBase` & `CharacterRecord`: Add `origin_type: str = Field(default="AI_INTRODUCED")` and `origin_source: Optional[str] = Field(default=None)`.
  - `SceneBase` & `SceneRecord`: Add `origin_type: str = Field(default="AI_INTRODUCED")` and `origin_source: Optional[str] = Field(default=None)`.
  - `LocationItem`: Add `origin_type: str = "DERIVED"`, `origin_source: Optional[str] = None`.
  - `WorldBibleBase`: Add `origin_type` and `origin_source` support in `canon_facts_json` and `factions_json`.
  - `TraceNode` in `backend/app/models/lineage.py`: Add `origin_type: Optional[str] = None` and `origin_source: Optional[str] = None`.
- **Database Migration (`backend/app/repositories/project_repo.py`)**:
  - In `_migrate_columns`: Inspect `characters` and `scenes` tables; safely add `origin_type` (default `'AI_INTRODUCED'`) and `origin_source` columns if missing.
  - Legacy records seamlessly hydrate with backward-compatible defaults.

### D-03: Stage 5 Genesis Engine Origin Assignment
- During progressive universe unfolding (`unfold_universe`), the AI provider / prompt generator instructs Gemini (and deterministic MockProvider) to classify each entity with its primary origin and source anchor.
- Canonical Bio-City demo fixtures are pre-populated with a rich, balanced distribution across all origin classifications (e.g., Dr. Althea Thorne as `HUMAN_DECISION`, Coran Vance as `SEED_INFERRED`, Abyssal Symbionts as `SEED_EXPLICIT`).

### D-04: Deterministic "Why is this here?" Explainer (`ORIG-03`)
- Formulated deterministically from stored metadata (Origin Classification + Entity Summary + Linked Parent / Seed Anchor / Decision DNA priority).
- Plain-English, human-intelligible causal template:
  - Example (`SEED_EXPLICIT`): *"This entity is grounded directly in your original seed statement: 'A child discovers a forgotten city beneath the ocean'."*
  - Example (`HUMAN_DECISION`): *"Created to fulfill your Stage 4 Decision DNA commitment: 'Deep Sea Bioluminescence' and 'Enzyme bio-physics' under the Bio-City archetype."*
  - Example (`SEED_INFERRED`): *"Developed from an accepted Seed Potential possibility: 'Ancient Symbiotic Technology'."*
  - Example (`DERIVED`): *"Derived logically from the environmental physics and living coral architecture established in the World Bible."*
  - Example (`AI_INTRODUCED`): *"Introduced by generative synthesis to expand narrative depth while respecting all Decision DNA constraints."*
- **Zero LLM overhead, sub-10ms response time, and zero CoT / raw prompt leakage.**

### D-05: 3-Surface Interactive Access (`ORIG-02`, `ORIG-03`)
1. **Universe Codex Cards**:
   - Every card (Character, Location, Scene, Rule item) displays an interactive Origin Badge pill with distinct visual styling.
   - Clicking the badge opens the "Why is this here?" explainer modal or directly docks into the Inspector Drawer with causal focus.
2. **Causal Lineage DAG (`TraceabilityCanvas`)**:
   - Each DAG node renders its corresponding Origin Badge and border accent.
   - The sticky Causal Inspector panel displays the full "Why is this here?" breakdown and links directly to ancestor roots.
   - Origin filtering toolbar allows filtering nodes by origin classification (`All`, `Seed Explicit`, `Human Decision`, `AI Introduced`, etc.).
3. **Inspector Drawer (`InspectorDrawer`)**:
   - Dedicated "Origin Ledger" subtab / provenance viewer showing origin breakdown stats and entity ancestry.

### D-06: Visual Styling & Color Palette
- `SEED_EXPLICIT`: Cyan (`bg-cyan-950/80 text-cyan-300 border-cyan-800/80`)
- `SEED_INFERRED`: Indigo (`bg-indigo-950/80 text-indigo-300 border-indigo-800/80`)
- `HUMAN_DECISION`: Amber (`bg-amber-950/80 text-amber-300 border-amber-800/80`)
- `DERIVED`: Sky (`bg-sky-950/80 text-sky-300 border-sky-800/80`)
- `AI_INTRODUCED`: Violet (`bg-violet-950/80 text-violet-300 border-violet-800/80`)
- `USER_ADDED`: Emerald (`bg-emerald-950/80 text-emerald-300 border-emerald-800/80`)

---

## 2. Verification Criteria
1. **Backend Tests**:
   - Model validation for `origin_type` and `origin_source` across all entity types.
   - Non-destructive DB schema migration for existing SQLite databases.
   - Lineage graph endpoint returns nodes with populated `origin_type` and `origin_source`.
   - Deterministic explainer generator produces clean explanations without LLM calls.
   - Canonical demo project hydration includes all 6 origin classifications.
2. **Frontend Production Build**:
   - `tsc && vite build` completes with zero errors.
3. **Playwright E2E Suite**:
   - Scenario 1: Verify Origin Badges render across Character, Location, and Scene cards in Universe Codex.
   - Scenario 2: Click "Why is this here?" badge on a Character card and verify deterministic causal explanation.
   - Scenario 3: Verify Origin Badges and color accents render on Causal Lineage DAG nodes.
   - Scenario 4: Filter DAG and Codex by Origin type (`HUMAN_DECISION`, `SEED_EXPLICIT`).
   - Scenario 5: Verify Canonical Demo hydrates with complete Origin Ledger in <500ms.
