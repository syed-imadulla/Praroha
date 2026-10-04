---
phase: 04-human-world-selection
status: discussed
created: "2026-10-04"
---

# Phase 4 Context: Human World Selection

## Executive Summary
Phase 4 implements the pivotal **Human-in-the-Loop Choice Gate** (Tattva 3: Transition from Latent Form to Manifest Form). The system presents the three contrasting world candidates generated in Phase 3, pauses all autonomous AI expansion, and requires the creator to deliberate, compare trade-offs, optionally add creative rationale, and commit to one canonical world direction before universe unfolding begins in Phase 5.

---

<decisions>
- **D-01: Dedicated Selection Endpoint with Latest-Batch Validation**: `POST /api/projects/{project_id}/worlds/{candidate_id}/select` enforces:
  1. Candidate exists (HTTP 404 if not found).
  2. Candidate belongs to the project (HTTP 404 if project mismatch).
  3. Candidate's `batch_id` matches the project's LATEST world-generation batch.
  4. Candidates from older re-generation batches are rejected with an HTTP 400 Bad Request error.
  When valid, sets `project.selected_world_id`, transitions project status to `"world_selected"`, and records a persistent `WorldSelectionRecord` capturing candidate ID, batch ID, creator rationale, and timestamp.
- **D-02: Selection Relational Entity**: A dedicated SQLModel table `world_selections` records: `id`, `project_id`, `world_candidate_id`, `batch_id`, `user_rationale: Optional[str]`, and `created_at`.
- **D-03: Stage 4 ('Choose') Interactive Workspace Canvas**: Stage 4 renders the 3 candidates in a comparative layout with "Select This Direction" actions, an optional "Creator Notes / Rationale" input callout ("Why this direction?"), and a prominent "Confirm & Lock Direction" button that unlocks Stage 5 ('unfold').
- **D-04: Glow & Dim Visual Hierarchy**: When a candidate is clicked/selected, it elevates with a radiant accent glow (`ring-2 ring-cyan-400`, `shadow-glow-cyan`), a "Chosen Canon Direction" badge, while unchosen candidates smoothly dim (`opacity-60`) to maintain clear focus while keeping comparison legible.
- **D-05: Flexible Pre-Unfold Re-Selection**: Creators can freely switch their selected candidate anytime in Stage 4 prior to initiating Stage 5 unfolding. Once Stage 5 universe unfolding begins, changing world candidates requires explicit branching.
- **D-06: Initial Traceability DAG in Inspector**: Phase 4 introduces the first active causal provenance step in the Inspector Drawer's "Lineage" tab: `Raw Seed` -> `Seed DNA` -> `Selected World` with human decision timestamp and creator rationale.
- **D-07: Selection Retrieval Endpoint**: `GET /api/projects/{project_id}/selection` returns the currently active selected world candidate and selection record (`APIResponse[Optional[WorldSelectionRead]]`).
</decisions>

---

## Technical Specifications

### 1. Backend Data Models (`backend/app/models/selection.py`)
- `WorldSelectionCreate`:
  - `user_rationale: Optional[str] = None`
- `WorldSelectionBase`:
  - `project_id: str` (indexed foreign key to `projects.id`)
  - `world_candidate_id: str` (foreign key to `world_candidates.id`)
  - `batch_id: str`
  - `user_rationale: Optional[str] = None`
- `WorldSelectionRecord` (SQLModel table `world_selections`):
  - `id: str` (UUID primary key)
  - `created_at: datetime`
  - Helper methods: `to_read_schema()`
- `WorldSelectionRead`:
  - `id: str`
  - `project_id: str`
  - `world_candidate_id: str`
  - `batch_id: str`
  - `user_rationale: Optional[str]`
  - `selected_world: WorldCandidateRead`
  - `created_at: datetime`

### 2. Database & Repository (`backend/app/repositories/project_repo.py`)
- `Project`:
  - Add `selected_world_id: Optional[str] = None` field.
- `ProjectRepository`:
  - `save_world_selection(project_id: str, candidate_id: str, user_rationale: Optional[str]) -> WorldSelectionRecord`
  - `get_active_world_selection(project_id: str) -> Optional[WorldSelectionRecord]`

### 3. API Endpoints (`backend/app/routers/selection.py`)
- `POST /api/projects/{project_id}/worlds/{candidate_id}/select`:
  - Validates project and candidate exist and match.
  - Validates candidate belongs to the project's latest world generation batch (returns HTTP 400 Bad Request if candidate belongs to an older batch).
  - Creates or updates `WorldSelectionRecord`.
  - Sets `project.selected_world_id = candidate_id` and `project.status = "world_selected"`.
  - Returns `APIResponse[WorldSelectionRead]`.
- `GET /api/projects/{project_id}/selection`:
  - Returns active selection for project (or 404 if not selected yet).
  - Returns `APIResponse[WorldSelectionRead]`.

### 4. Frontend State & Canvas (`frontend/src/`)
- `types/index.ts`:
  - `WorldSelectionRead` interface.
- `api/client.ts`:
  - `selectWorld(projectId: string, candidateId: string, rationale?: string): Promise<APIResponse<WorldSelectionRead>>`
  - `getActiveSelection(projectId: string): Promise<APIResponse<WorldSelectionRead>>`
- `store/workspaceStore.ts`:
  - `selectedWorldId: string | null`
  - `selectedWorldRationale: string`
  - `isSelectingWorld: boolean`
  - `selectWorld(candidateId: string, rationale?: string): Promise<boolean>`
- Components:
  - `WorldSelectionCanvas.tsx`: Dedicated Stage 4 canvas with comparative cards, rationale input, confirm button.
  - `InspectorDrawer.tsx`: Updated "Lineage" tab displaying `Seed -> Seed DNA -> Selected World`.

---

## Verification Strategy
- **Backend Pytest (`backend/tests/test_selection.py`)**:
  - `test_select_world_endpoint`: tests selecting candidate, updating project status to `world_selected`, verifying response.
  - `test_switch_world_selection`: tests changing selection to another candidate in the same batch.
  - `test_get_active_selection`: tests retrieval of selected world with populated candidate details.
- **Frontend Playwright (`frontend/e2e/test_phase4_selection.cjs`)**:
  - Tests navigating to Stage 4.
  - Tests clicking candidate, entering optional rationale, confirming selection.
  - Verifies visual Glow & Dim styling and Inspector Lineage tab update.
