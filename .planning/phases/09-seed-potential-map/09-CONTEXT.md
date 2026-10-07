# Phase 9 Context: Seed Potential Map

## Phase Goal
Add a semantic exploration layer between Seed DNA (Stage 2) and Three Worlds (Stage 3). The Seed Potential Map surfaces explicit elements, AI-inferred possibilities, and open creative spaces from the raw seed and Seed DNA, allowing creators to accept or reject inferred directions to anchor downstream world synthesis.

---

## Key Concepts & Categories

1. **EXPLICIT**: Facts, entities, and settings directly stated in the user's raw seed.
   - Example: *"child"*, *"discovers"*, *"forgotten city"*, *"beneath the ocean"*.
2. **INFERRED**: Latent possibilities hypothesized by AI based on seed themes and keywords.
   - Example: *"ancient symbiotic civilization"*, *"archaeological mystery"*, *"surface ecological catastrophe"*.
   - *Guardrail*: Always clearly labeled as "AI-inferred possibility" (never as objective hidden facts).
3. **OPEN**: Unresolved narrative or creative questions that invite human imagination.
   - Example: *"Who originally built the submerged city?"*, *"Why was it abandoned?"*, *"What power source sustains it?"*.

## Item Statuses
- **pending**: Default initial state upon extraction.
- **accepted**: User confirms this possibility should steer downstream world generation.
- **rejected**: User explicitly excludes this possibility from downstream worlds.

---

<decisions>
## Implementation Decisions

### Backend Data Model & Repository
- **D-01:** Implement `SeedPotentialItemRecord` SQLModel table with fields: `id` (UUID string), `project_id` (indexed FK), `label` (str), `category` (`explicit` | `inferred` | `open`), `confidence` (float 0.0–1.0), `source_evidence` (str reference to seed text), `user_status` (`pending` | `accepted` | `rejected`), and `created_at`.
- **D-02:** Add repository methods in `ProjectRepository`: `create_potential_items()`, `get_potential_items_by_project()`, `update_potential_item_status()`, and `batch_update_potential_item_statuses()`.

### AI Provider & Extraction Engine
- **D-03:** Add `extract_potential(seed, seed_dna)` method to `AIProvider` base class.
- **D-04:** Implement in `GeminiProvider` using structured JSON schema with strict classification.
- **D-05:** Implement in `MockProvider` with deterministic, high-quality potential maps for the canonical demo seed (*"A child discovers a forgotten city beneath the ocean"*) and generic fallback heuristic for arbitrary seeds.

### API Endpoints
- **D-06:**
  - `POST /api/projects/{id}/potential/extract` — triggers potential map extraction and persistence.
  - `GET /api/projects/{id}/potential` — retrieves all potential items for a project.
  - `PATCH /api/projects/{id}/potential/{item_id}` — updates single item user status.
  - `POST /api/projects/{id}/potential/batch` — batch updates multiple items.

### Frontend Presentation
- **D-07:** Add `SeedPotentialCanvas` component with 3 distinct lanes/columns:
  - Cyan column: Explicit Elements (anchored in seed)
  - Purple/Indigo column: AI-Inferred Possibilities (with Accept / Reject buttons and status pills)
  - Amber column: Open Questions (creative curiosity triggers)
- **D-08:** Smooth integration into the navigation flow between Understand (DNA) and Worlds, allowing the user to review potential before proceeding to world candidate generation.
</decisions>

---

## Out of Scope
- **Divergence Engine (Phase 10)**: Modifying world candidate generation to consume accepted potential items happens in Phase 10.
- **Decision DNA (Phase 11)**: Tracking selection rationale and priorities happens in Phase 11.
