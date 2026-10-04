# Phase 5 Research: Progressive World Unfolding

## 1. Domain & Architecture Analysis

### Goal
Implement **Tattva 4: Generative Unfolding (Srishti)**. Once the creator commits to a world direction in Stage 4, this phase expands that locked choice into a coherent, multi-layered mini-universe:
1. **World Bible**: Physical laws, environmental rules, faction matrix, historical timeline, canon facts, and key locations with visual prompts.
2. **Characters**: 2 to 4 core cast members grounded strictly in World Bible rules and Seed DNA constraints.
3. **Relationship Web**: Interpersonal tensions, alliances, and dramatic social dynamics connecting the cast, explicitly scoped by `world_candidate_id`.
4. **Narrative Story Beats / Scenes**: 2 to 3 pivotal narrative scenes putting the characters into active conflict.
5. **Visual Prompts (UNFL-05)**: Non-blocking, copyable concept art descriptors for each entity and scene.

---

### Key Architectural Insights

1. **Relational Data Modeling with Scoped Candidate IDs**:
   - Entities are segregated into dedicated SQLModel tables:
     - `world_bibles` (`WorldBibleRecord`): stores geography, physics_rules, history_timeline, factions, canon_facts, visual_style_prompt, and structured `key_locations_json`.
     - `characters` (`CharacterRecord`): stores name, role, archetype, motivation, core_conflict, visual_prompt.
     - `character_relationships` (`CharacterRelationshipRecord`): stores source_character_id, target_character_id, relation_type, dynamic_description, and `world_candidate_id`.
     - `scenes` (`SceneRecord`): stores scene_number, title, location_setting, characters_involved, dramatic_question, conflict_narrative, pivotal_outcome, visual_prompt.
   - All 4 entity tables carry `project_id` and `world_candidate_id` foreign keys, ensuring direct scoping to the selected world candidate and full alignment with the Traceability DAG.

2. **Key Locations Embedded in World Bible (No Separate Subsystem)**:
   - Per requirement clarification, there is no need for a separate `Location` table.
   - `WorldBibleRecord` is extended with `key_locations_json` storing a structured list of `LocationItem` objects:
     - `name: str`
     - `description: str`
     - `visual_prompt: str`
   - Keeps key locations within the World Bible while supporting the non-blocking 1-click Copy Visual Prompt requirement.

3. **Lifecycle State Machine, Concurrency & Atomic Transaction Failure Recovery**:
   - State transition: `world_selected` -> `unfolding` -> `universe_unfolded`.
   - Concurrency & Idempotency:
     - `POST /unfold` rejects requests while status is `"unfolding"` with HTTP 409 Conflict.
     - If status is `"universe_unfolded"`, `POST /unfold` returns the existing unfolded result (or rejects duplicate requests) without re-generating, preventing duplicate universe creation from double-clicks.
     - Starting state MUST be `"world_selected"`. `"unfolding"` is NEVER treated as a normal starting or retryable state.
     - Retries are permitted ONLY after a failed attempt has cleanly rolled back and reset status to `"world_selected"`.
   - Creation of the World Bible, Characters, Relationships, and Scenes must be persisted inside an atomic database transaction.
   - If provider generation or persistence fails:
     - Entity insertions roll back cleanly.
     - Project status does NOT become `universe_unfolded`; it safely resets to `world_selected`.
     - The selected world candidate and creator rationale remain intact.
     - An error response is returned, enabling the creator to retry unfolding safely without duplicate or corrupt state.

4. **Multi-layer Progressive Visual Reveal**:
   - The frontend triggers `POST /api/projects/{project_id}/unfold` and animates a step-by-step progressive reveal on the Stage 5 canvas:
     - Step 1: Laws, Lore & Key Locations (World Bible)
     - Step 2: Inhabitants (Characters)
     - Step 3: Tensions & Alliances (Relationship Web)
     - Step 4: Narrative Story Beats (Scenes)
   - Completed codex presents a 3-tab layout: **World Bible**, **Characters & Dynamics**, **Story Beats**.

5. **Deterministic Canonical Fixtures for All 3 Canonical Ocean Archetypes**:
   - Canonical detection strictly evaluates: `normalized immutable raw_seed + selected world title` (never Gemini-rephrased Seed DNA premise).
   - When normalized raw_seed is `"a child discovers a forgotten city beneath the ocean"`:
     - **Bio-City**: Living coral metropolis, Dr. Althea / Siphonophore Collective / Sentry Nereus, symbiotic ecological tensions, Bioluminescent Spire / Nursery Trench locations, benthic exploration scenes.
     - **Lost Civilization**: Submerged basalt necropolis, ancient guardian constructs, drowned archive lore, Obsidian Archive / Sunken Plaza locations, high-pressure dive scenes.
     - **Time Capsule**: Cold War geodesic dome sanctuary, paranoid radio archives, preservationists vs isolationists, Sector 4 Hydroponics / Sub-level Radio Bunker locations, airlock breach scenes.

---

## 2. Reusable Assets & Integration Points
- `backend/app/models/project.py`: `ProjectBase.status` and `selected_world_id`.
- `backend/app/models/selection.py`: `WorldSelectionRecord` storing creator rationale.
- `backend/app/providers/base.py`: Provider interface to add `unfold_universe(context)`.
- `backend/app/repositories/project_repo.py`: SQLModel session and transactional save methods.
- `frontend/src/store/workspaceStore.ts`: Zustand store managing active stages and unfolded codex state.
- `frontend/src/components/StageProgressHeader.tsx`: Unlocking Stage 5 ('unfold').
- `frontend/src/components/InspectorDrawer.tsx`: Lineage DAG extension.

---

## 3. Potential Hazards & Mitigations
- **Hazard**: Long LLM generation latency causing UI freeze or timeout.
  - **Mitigation**: Clear animated step-by-step progress indicator in UI; backend timeout handling with fallback to deterministic mock fixtures if needed.
- **Hazard**: Partial generation leaving orphaned characters without a World Bible or relationship web.
  - **Mitigation**: Atomic database transaction; rollback on error; project status reset to `world_selected`.
- **Hazard**: Repeated clicks on "Unfold Universe" leading to duplicated relational rows.
  - **Mitigation**: Clean replacement of existing unfolded records for the active candidate if a re-unfold is triggered; idempotency guard in router checking `is_unfolding`.
