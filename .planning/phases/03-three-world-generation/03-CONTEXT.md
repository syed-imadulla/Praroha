---
phase: 03-three-world-generation
status: discussed
created: "2026-10-04"
---

# Phase 3 Context: Three World Generation

## Executive Summary
Phase 3 builds the branching generation engine for Seed Unfold. Using the immutable Seed DNA extracted in Phase 2, the system generates **exactly three** high-contrast, coherent world candidates (World A, World B, World C) that respect all constraints and themes while maximizing aesthetic separation. Generation strictly halts after three candidates to preserve cognitive focus and prepare for human choice in Phase 4.

---

<decisions>
- **D-01:** Structured Candidate Schema: Each generated world candidate contains `id`, `title`, `archetype`, `concept` (logline), `aesthetic` (mood/palette), `core_tension` (central stakes), `trade_offs` (pros/cons), and `key_visual` (signature scene vignette).
- **D-02:** Contrast Dimensions: Generations must span 3 distinct creative archetypes (e.g., Mythic/Ancient vs Biological/Ecological vs Technological/Human) to ensure wide aesthetic divergence without violating Seed DNA constraints.
- **D-03:** Canonical Demo Fixture Guarantee: Canonical demo detection is strictly evaluated against the persisted, immutable `raw_seed` from `SeedDNARecord` using normalized string matching ("A child discovers a forgotten city beneath the ocean."), NEVER the generated DNA premise (which Gemini may rephrase). When matched, the engine deterministically outputs the canonical demo fixtures (*Lost Civilization*, *Bio-City*, *Time Capsule*) to ensure 100% judge-demo reliability.
- **D-04:** Gemini Provider with Schema Enforcement: For custom/arbitrary seeds, `GeminiProvider.generate_worlds()` calls the Gemini REST API (`gemini-2.5-flash`) with strict `responseSchema` configured to return an array of exactly 3 objects.
- **D-05:** Resilient Fallback Mechanics: If `GEMINI_API_KEY` is not configured, or if the API call fails or times out, the provider falls back cleanly to `MockProvider.generate_worlds()` with `fallback_used: True` and zero runtime crash.
- **D-06:** Relational Persistence: A dedicated SQLModel entity `WorldCandidateRecord` (`world_candidates` table) stores each generated candidate linked to `projects.id` and `seed_dna.id` with `candidate_index: int` (1..3) and model metadata.
- **D-07:** Candidate Re-generation Support: Creators can re-generate a new batch of 3 candidates for the same Seed DNA. New candidates are appended to the database with fresh timestamps, and the latest batch is displayed.
- **D-08:** 3-Column Responsive UI: Main canvas in Stage 3 (`worlds`) presents a 3-column card grid with distinctive color-coded theme accents (Cyan for World 1, Emerald for World 2, Amber for World 3), displaying all narrative dimensions and key visuals.
</decisions>

---

## Technical Specifications

### 1. Data Models (`backend/app/models/world.py`)
- `WorldCandidate`:
  - `id: str`
  - `index: int` (1, 2, or 3)
  - `title: str`
  - `archetype: str`
  - `concept: str`
  - `aesthetic: str`
  - `core_tension: str`
  - `trade_offs: str`
  - `key_visual: str`
- `WorldCandidateRecord` (SQLModel table `world_candidates`):
  - `id: str` (UUID primary key)
  - `project_id: str` (indexed foreign key to `projects.id`)
  - `seed_dna_id: str` (foreign key to `seed_dna.id`)
  - `batch_id: str` (UUID grouping the 3 candidates from a single generation run)
  - `candidate_index: int`
  - `title: str`
  - `archetype: str`
  - `concept: str`
  - `aesthetic: str`
  - `core_tension: str`
  - `trade_offs: str`
  - `key_visual: str`
  - `model_used: str`
  - `fallback_used: bool`
  - `created_at: datetime`

### 2. API Endpoints (`backend/app/routers/worlds.py`)
- `POST /api/projects/{project_id}/worlds/generate`:
  - Triggers generation of exactly three world candidates from the project's latest Seed DNA.
  - Persists all three candidates under a unique `batch_id`.
  - Updates project status to `worlds_generated`.
  - Returns `APIResponse[List[WorldCandidateRead]]`.
- `GET /api/projects/{project_id}/worlds`:
  - Retrieves the latest batch of 3 world candidates for the project.
  - Returns `APIResponse[List[WorldCandidateRead]]`.

### 3. Frontend Experience (Stage 3 `worlds`)
- `WorldCandidateCard.tsx`:
  - Card 1 (Cyan glow): First candidate with archetype tag, concept, aesthetic notes, tension, trade-offs, and key visual.
  - Card 2 (Emerald glow): Second candidate with organic/ecological or contrasting archetype.
  - Card 3 (Amber glow): Third candidate with industrial/retro or high-conflict archetype.
- `WorldCandidatesCanvas.tsx`:
  - Replaces the Stage 3 placeholder on `WorkspaceCanvas.tsx`.
  - Header with Seed DNA summary pills for context continuity.
  - "Re-generate Candidates" secondary button.
  - "Proceed to World Selection (Stage 4)" primary CTA.
- `InspectorDrawer.tsx`:
  - Adds a "Worlds" tab or candidate overview in the inspector drawer.

---

## Out of Scope for Phase 3
- Final world selection and branch locking (handled in Phase 4: Human World Selection).
- Progressive unfolding of Bible, characters, and scenes (handled in Phase 5: Progressive World Unfolding).
- Image rendering or asset generation (remains optional and deferred).
