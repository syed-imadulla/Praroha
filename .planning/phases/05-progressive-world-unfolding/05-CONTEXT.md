---
phase: 05-progressive-world-unfolding
status: discussed
created: "2026-10-04"
---

# Phase 5 Context: Progressive World Unfolding

## Executive Summary
Phase 5 implements **Tattva 4: Generative Unfolding (Srishti)**. Once the human creator commits to a single world direction in Stage 4, this phase expands that locked choice into a coherent, multi-layered mini-universe:
1. **World Bible**: Environmental rules, physical laws, factions, and canon lore.
2. **Characters**: 2 to 4 core cast members grounded strictly in World Bible rules and Seed DNA constraints.
3. **Relationship Web**: Interpersonal tensions, alliances, and dramatic social dynamics connecting the cast.
4. **Narrative Story Beats / Scenes**: 2 to 3 pivotal narrative scenes putting the characters into active conflict.
5. **Visual Prompts (UNFL-05)**: Non-blocking, copyable concept art descriptors for each entity and scene.

---

<decisions>
- **D-01: Dedicated Relational Schema for Unfolded Universe Entities**:
  - `world_bibles` table (`WorldBibleRecord`): `id`, `project_id`, `world_candidate_id`, `geography: str`, `physics_rules: str`, `history_timeline: str (JSON)`, `factions: str (JSON)`, `canon_facts: str (JSON)`, `key_locations: str (JSON List[LocationItem])`, `visual_style_prompt: str`, `created_at`.
  - `characters` table (`CharacterRecord`): `id`, `project_id`, `world_candidate_id`, `name: str`, `role: str`, `archetype: str`, `motivation: str`, `core_conflict: str`, `visual_prompt: str`, `created_at`.
  - `character_relationships` table (`CharacterRelationshipRecord`): `id`, `project_id`, `world_candidate_id`, `source_character_id: str`, `target_character_id: str`, `relation_type: str`, `dynamic_description: str`, `created_at`.
  - `scenes` table (`SceneRecord`): `id`, `project_id`, `world_candidate_id`, `scene_number: int`, `title: str`, `location_setting: str`, `characters_involved: str (JSON)`, `dramatic_question: str`, `conflict_narrative: str`, `pivotal_outcome: str`, `visual_prompt: str`, `created_at`.
  - *Scoping Rule*: All unfolded entities (`world_bibles`, `characters`, `character_relationships`, `scenes`) carry `world_candidate_id` linking them directly to the selected world candidate and preserving Traceability DAG alignment.
- **D-02: Lifecycle State Machine & Atomic Unfold Failure / Transaction Behavior**:
  - Explicit project status progression: `world_selected` -> `unfolding` -> `universe_unfolded`.
  - Concurrency & Idempotency Rules:
    - `POST /unfold` rejects concurrent requests while status is `"unfolding"` with HTTP 409 Conflict.
    - If project is already `"universe_unfolded"`, `POST /unfold` returns the existing unfolded result (or rejects duplicate requests), preventing duplicate universe creation from double-clicks.
    - Starting state MUST be `"world_selected"`. `"unfolding"` is NEVER treated as a normal starting or retryable state.
    - Retries are permitted ONLY after a failed attempt has cleanly rolled back and reset status to `"world_selected"`.
  - Atomicity: The universe expansion (World Bible, Characters, Relationships, Scenes) must be generated and persisted atomically within a database transaction.
  - Failure Guarantees:
    - If generation or persistence fails at any stage, the transaction rolls back any partial entity records.
    - Project status does NOT transition to `"universe_unfolded"`; it safely resets to `"world_selected"`.
    - The selected world candidate and creator rationale remain fully preserved and untouched.
    - The API returns an appropriate error/fallback response and allows the creator to safely retry unfolding without stale or duplicate records.
  - Frontend Stage 5 workspace canvas provides a prominent "Unfold Universe" primary CTA.
  - Step-by-step animated progression reveals each layer in sequence during generation:
    1. Laws, Lore & Key Locations (World Bible)
    2. Inhabitants (Characters)
    3. Tensions & Alliances (Relationship Web)
    4. Narrative Story Beats (Scenes)
- **D-03: Deterministic Canonical Fixtures for All 3 Canonical Ocean Worlds**:
  - Canonical detection strictly evaluates: `normalized immutable raw_seed + selected world title` (never Gemini-rephrased Seed DNA premise).
  - When normalized raw_seed is `"a child discovers a forgotten city beneath the ocean"`:
    - **Bio-City**: Generates the living coral metropolis canon, Dr. Althea / The Siphonophore Collective / Sentry Unit Nereus, symbiotic ecological tensions, key locations (The Bioluminescent Spire, The Nursery Trench), and benthic exploration scenes.
    - **Lost Civilization**: Generates the submerged basalt necropolis canon, ancient guardian constructs, drowned archive lore, key locations (The Obsidian Archive, The Sunken Plaza), and high-pressure dive scenes.
    - **Time Capsule**: Generates the Cold War geodesic dome sanctuary canon, paranoid radio archives, preservationists vs isolationists, key locations (Sector 4 Hydroponics, The Sub-level Radio Bunker), and airlock breach scenes.
  - Arbitrary seeds utilize Gemini 2.5 Flash structured output schema (`response_schema` with Pydantic models) with mock fallback if offline.
- **D-04: Non-blocking UNFL-05 Visual Prompt Descriptors & Embedded Key Locations**:
  - Rather than creating a separate location subsystem table, `WorldBibleRecord` is extended with structured `key_locations` (`name`, `description`, `visual_prompt`).
  - Each character, key location in the World Bible, and narrative scene includes a tailored, cinematic image generation prompt (style tokens, lighting, camera angles, color palettes).
  - Cards feature a 1-click "Copy Visual Prompt" button with toast notification (non-blocking, conceptual prompts ready for Midjourney/Imagen/DALL-E).
- **D-05: Stage 5 Interactive Codex Canvas**:
  - Multi-tabbed and unified view ("Codex View"):
    - Tab 1: **World Bible** (Geographic sectors, fundamental physics laws, key locations with visual prompts, faction matrix, canon timeline).
    - Tab 2: **Characters & Dynamics** (Character cards with archetypes, motivations, conflicts, visual prompts, and interactive relationship web).
    - Tab 3: **Story Beats / Scenes** (Cinematic scene cards with settings, character stakes, dramatic question, pivotal outcome, and visual prompts).
  - Filter and search capabilities for quick review.
- **D-06: Inspector Provenance & Codex Extension**:
  - Provenance tab in Inspector Drawer extends from `Seed -> Seed DNA -> Selected World` to now include child nodes: `-> World Bible`, `-> Characters`, `-> Relationships`, `-> Scenes`.
  - Inspector adds a "Codex" quick-inspect view.
- **D-07: Unfold State Retrieval Endpoint**:
  - `GET /api/projects/{project_id}/unfolded` retrieves the complete unfolded universe (World Bible with key locations, Characters, Relationships, Scenes) for instant hydration on page load.
</decisions>

---

## Technical Specifications

### 1. Backend Data Models (`backend/app/models/unfold.py`)
- Pydantic Schemas:
  - `LocationItem`: `name: str`, `description: str`, `visual_prompt: str`
  - `FactionItem`: `name: str`, `role: str`, `agenda: str`
  - `TimelineEvent`: `era: str`, `event: str`
  - `WorldBibleCreate`: `project_id: str`, `world_candidate_id: str`, `geography: str`, `physics_rules: str`, `history_timeline: List[TimelineEvent]`, `factions: List[FactionItem]`, `canon_facts: List[str]`, `key_locations: List[LocationItem]`, `visual_style_prompt: str`
  - `WorldBibleRead`: Inherits fields + `id: str`, `created_at: datetime`
  - `CharacterCreate`: `project_id: str`, `world_candidate_id: str`, `name: str`, `role: str`, `archetype: str`, `motivation: str`, `core_conflict: str`, `visual_prompt: str`
  - `CharacterRead`: Inherits fields + `id: str`, `created_at: datetime`
  - `CharacterRelationshipCreate`: `project_id: str`, `world_candidate_id: str`, `source_character_id: str`, `target_character_id: str`, `relation_type: str`, `dynamic_description: str`
  - `CharacterRelationshipRead`: Inherits fields + `id: str`, `created_at: datetime`
  - `SceneCreate`: `project_id: str`, `world_candidate_id: str`, `scene_number: int`, `title: str`, `location_setting: str`, `characters_involved: List[str]`, `dramatic_question: str`, `conflict_narrative: str`, `pivotal_outcome: str`, `visual_prompt: str`
  - `SceneRead`: Inherits fields + `id: str`, `created_at: datetime`
  - `UnfoldedUniverseRead`: Aggregated payload containing `world_bible: WorldBibleRead`, `characters: List[CharacterRead]`, `relationships: List[CharacterRelationshipRead]`, `scenes: List[SceneRead]`.
- SQLModel Tables:
  - `WorldBibleRecord` (`world_bibles`): includes `key_locations_json: str = Field(default="[]")`
  - `CharacterRecord` (`characters`): includes `world_candidate_id` foreign key
  - `CharacterRelationshipRecord` (`character_relationships`): includes `world_candidate_id` foreign key
  - `SceneRecord` (`scenes`): includes `world_candidate_id` foreign key

### 2. Provider Unfolding Extension (`backend/app/providers/`)
- `MockProvider.unfold_universe(context: Dict[str, Any]) -> Dict[str, Any]`:
  - Contains deterministic fixtures for all 3 canonical ocean archetypes (including key locations with visual prompts).
- `GeminiProvider.unfold_universe(context: Dict[str, Any]) -> Dict[str, Any]`:
  - System prompt enforcing grounding in `Seed DNA + Selected World Candidate + Creator Rationale`.
  - Structured output schema enforcing `key_locations` with `visual_prompt` and character relationships scoped to candidate.
  - Fallback to MockProvider on error.

### 3. Database & Repository (`backend/app/repositories/project_repo.py`)
- `save_unfolded_universe(project_id, world_candidate_id, data) -> UnfoldedUniverseRead`:
  - Executes inside a strict database transaction (`session.begin_nested()` or atomic block).
  - Inserts WorldBible, Characters, Relationships (with `world_candidate_id`), and Scenes.
  - If any insertion or constraint fails, rolls back completely.
  - If previous unfolded entities exist for this candidate (e.g., from retry), cleanses/replaces them atomically.
- `get_unfolded_universe(project_id) -> Optional[UnfoldedUniverseRead]`

### 4. API Endpoints (`backend/app/routers/unfold.py`)
- `POST /api/projects/{project_id}/unfold`:
  - Validates project status:
    - Must be `"world_selected"`.
    - If status is `"unfolding"`, rejects with HTTP 409 Conflict (concurrency guard).
    - If status is `"universe_unfolded"`, returns existing unfolded universe (idempotency guard) without re-generating.
    - Otherwise returns HTTP 400 Bad Request.
  - Sets `project.status = "unfolding"`, commits status transition.
  - Fetches Seed DNA, selected world candidate, and creator rationale.
  - Passes normalized immutable `raw_seed` and `selected_world.title` to `provider.unfold_universe()`.
  - On generation or persistence error:
    - Rolls back any partial entity insertions.
    - Resets `project.status = "world_selected"`.
    - Preserves selected world candidate and rationale.
    - Raises/returns HTTP 500/502 with error details, allowing clean retry.
  - On success:
    - Sets `project.status = "universe_unfolded"`.
    - Returns `APIResponse[UnfoldedUniverseRead]`.
- `GET /api/projects/{project_id}/unfolded`:
  - Returns the active unfolded universe or 404.

### 5. Frontend Canvas & State (`frontend/src/`)
- `types/index.ts`: Add `LocationItem`, `WorldBibleRead`, `CharacterRead`, `CharacterRelationshipRead`, `SceneRead`, `UnfoldedUniverseRead`.
- `api/client.ts`: Add `unfoldUniverse(projectId: string)` and `getUnfoldedUniverse(projectId: string)`.
- `store/workspaceStore.ts`: Add `unfoldedUniverse`, `isUnfolding`, `unfoldingStep`, `activeCodexTab`.
- Components:
  - `UniverseCodexCanvas.tsx`: Stage 5 workspace canvas with progressive reveal loader, World Bible view (including Key Locations section with visual prompts and copy button), character grid, relationship matrix, and scene cards with 1-click "Copy Visual Prompt" buttons.
  - Safe error handling & retry button on unfold failure.
  - `InspectorDrawer.tsx`: Updated Lineage tab displaying expanded causal DAG.

---

## Verification Strategy
- **Backend Pytest (`backend/tests/test_unfold.py`)**:
  - `test_unfold_universe_success`: Project creates, extracts DNA, generates worlds, selects world, triggers unfold; asserts all 4 layers persisted with `world_candidate_id` and key locations.
  - `test_canonical_fixtures_for_all_three_worlds`: Verifies deterministic fixtures for Bio-City, Lost Civilization, and Time Capsule.
  - `test_unfold_requires_world_selection`: Calling unfold before selection returns HTTP 400.
  - `test_unfold_failure_lifecycle_and_rollback`: Simulates provider error during unfold; verifies project status remains `world_selected`, no partial entities are persisted, selected world is untouched, and retry succeeds cleanly.
  - `test_character_relationships_have_candidate_id`: Verifies `world_candidate_id` is populated on relationships.
  - `test_get_unfolded_endpoint`: Retrieves complete codex via GET.
- **Frontend Playwright (`frontend/e2e/test_phase5_unfold.cjs`)**:
  - Full flow: Ingest seed $\rightarrow$ Extract DNA $\rightarrow$ Generate worlds $\rightarrow$ Select Bio-City with rationale $\rightarrow$ Trigger Unfold Universe $\rightarrow$ Verify World Bible (with key locations and visual prompt copy), Characters, Relationships, Scenes, and Inspector Lineage DAG.

