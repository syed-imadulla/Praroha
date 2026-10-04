# Phase 5 Discussion Log: Progressive World Unfolding

## Date: 2026-10-04

## Topics Discussed & Decisions Made

### 1. Progressive Unfolding UX & Lifecycle State Machine
- **Question**: How should the creator experience the progressive unfolding flow in Stage 5, and how should failures be handled?
- **Decision**:
  - Lifecycle state machine: `world_selected` -> `unfolding` -> `universe_unfolded`.
  - Single "Unfold Universe" primary CTA trigger with an engaging, step-by-step animated visual reveal on an interactive codex canvas:
    1. Laws, Lore & Key Locations (World Bible)
    2. Inhabitants (Characters)
    3. Tensions & Alliances (Relationship Web)
    4. Narrative Story Beats (Scenes)
  - Failure/transaction behavior: Atomic generation & persistence. If generation or persistence fails, do NOT mark `universe_unfolded`, rollback partial entity records, preserve the selected world candidate and creator rationale, return a clear error, and safely allow the creator to retry unfolding.

### 2. Canonical Demo Fixture Support
- **Question**: How should canonical demo fixtures be handled for Stage 5 unfolding?
- **Decision**: Include rich, deterministic canonical fixtures for all 3 canonical ocean worlds (`Lost Civilization`, `Bio-City`, `Time Capsule`) in `MockProvider` and as deterministic branch points in `GeminiProvider`. Arbitrary seeds use Gemini 2.5 Flash with structured Pydantic JSON schemas.

### 3. Database & Relational Persistence Architecture
- **Question**: What relational persistence schema should store the unfolded universe entities?
- **Decision**: Dedicated relational SQLModel tables:
  - `world_bibles` (geography, physical laws, factions, canon timeline, `key_locations` JSON, visual style prompt)
  - `characters` (name, role, archetype, motivation, core conflict, visual prompt)
  - `character_relationships` (source_id, target_id, relation_type, dynamic_description)
  - `scenes` (scene_number, title, location, characters involved, dramatic question, narrative conflict, outcome, visual prompt)
  All unfolded entities (`world_bibles`, `characters`, `character_relationships`, `scenes`) carry `world_candidate_id` foreign keys linking them directly to the selected world candidate and preserving Traceability DAG alignment.

### 4. Non-blocking Visual Prompt Descriptors (UNFL-05) & Key Locations
- **Question**: How should key locations and UNFL-05 visual prompt descriptors be modeled and presented?
- **Decision**:
  - Do NOT introduce a separate location subsystem or table. Instead, extend `WorldBibleRecord` with a structured `key_locations` JSON field where each item has `{ name, description, visual_prompt }`.
  - Include ready-to-use image generation prompts (optimized for Midjourney/Imagen/DALL-E) on each character card, key location inside the World Bible, and scene card with a 1-click "Copy Visual Prompt" button and interactive feedback.

### 5. Lineage & Inspector Integration
- **Decision**: Extend the Inspector Drawer Lineage tab to show child nodes under Selected World (`-> World Bible`, `-> Characters`, `-> Relationships`, `-> Scenes`) establishing the complete end-to-end causal DAG from the root seed to the generated scenes.

