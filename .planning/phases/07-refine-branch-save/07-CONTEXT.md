# Phase 7: Refine, Branch & Save (Tattva 6: Parinamana & Dharana) - Context

## 1. Phase Objective & Tattva Alignment
Deliver **Tattva 6: Parinamana (Continuous Transformation & Mutation)** and **Dharana (Sustenance & Persistence)**.
Phase 7 gives creators sovereignty over their mini-universe through:
1. Fine-grained component refinement with immutable auditable version history.
2. Timeline branching preserving the source timeline while exploring alternate possibilities.
3. Complete project state persistence: portable JSON bundle import/export (with Traceability DAG) and backend Object Storage snapshots.

---

## 2. Locked Decisions (Incorporating Plan Corrections)

### D-01: Timeline Branching & Strict Child ID Remapping (PERS-02)
- **Model**: Project-level clone with parent lineage link.
- `Project` model extended with:
  - `parent_project_id: Optional[str] = Field(default=None, index=True)`
  - `branch_name: str = Field(default="main")`
- **Strict Old-to-New ID Remapping**:
  - The `branch_project` service maintains explicit ID translation maps (`old_id -> new_id`) for every cloned entity:
    - `candidate_id_map`: maps parent world candidate IDs to child candidate IDs.
    - `char_id_map`: maps parent character IDs to child character IDs.
  - All foreign keys are rewritten to child IDs:
    - Child selection $\to$ child world candidate ID.
    - Child world bible $\to$ child world candidate ID.
    - Child characters $\to$ child world candidate ID.
    - Child relationships $\to$ child world candidate ID; `source_character_id` & `target_character_id` $\to$ child character IDs.
    - Child scenes $\to$ child world candidate ID; `characters_involved` updated.
  - **Zero Leakage**: No child record may reference any parent-project entity.
- **TopBar Switcher**: Replaces static badge with an active Branch Switcher Dropdown showing current branch, sibling/child branches, and "+ Fork Branch".

### D-02: Component Refinement & Immutable Revision History (PERS-01)
- **Refinement Scope**:
  - **PERS-01 in this phase covers Characters and Story Scenes** (the primary dynamic, inhabited components of the universe where creative evolution occurs).
  - World Bible canon laws and landmark locations remain the immutable grounding anchor for Phase 7.
- **Immutable Revision History (`entity_revisions` table)**:
  - Generic `EntityRevisionRecord` table storing every state mutation:
    - `id: str`
    - `project_id: str`
    - `entity_type: str` (`"character"` | `"scene"`)
    - `entity_id: str`
    - `version: int`
    - `snapshot_json: str` (complete serialized entity state at this version)
    - `revision_notes: str`
    - `created_at: datetime`
  - Refinement creates a revision snapshot before/while updating the current entity and incrementing its `version` counter.
- **Phase 6 Lineage Integration**:
  - `TraceRelationType` extended with `"refined_from"`.
  - When an entity has revisions, `LineageService` synthesizes explicit version lineage nodes:
    `Character v1 -> refined_from -> Character v2` (and similarly for Scenes).
  - Preserves full auditability without exposing internal LLM chain-of-thought tokens or prompts.

### D-03: Full Project State Export, Import & Snapshots (PERS-03)
- **Complete Project Bundle**:
  - `ProjectBundle` contains:
    - Format version (`"1.0"`), export timestamp, project metadata.
    - Seed DNA, World Candidates, Active Selection.
    - World Bible, Characters, Relationships, Scenes.
    - **Synthesized Traceability DAG** (`lineage: Optional[TraceGraphRead]`).
  - Standalone `.seedunfold.json` export and import roundtrip restoring all relational records.
- **StorageProvider Backend Snapshots**:
  - Endpoint `POST /api/projects/{id}/snapshots` uses `await storage.upload(file_data=bundle_bytes, key=..., mime_type="application/json")` on the existing `StorageProvider` abstraction (`LocalStorageProvider` or `SupabaseStorageProvider`).
  - Persists an `Asset` record (`asset_type="project_snapshot"`) queryable via `GET /api/projects/{id}/snapshots`.

### D-04: UI Architecture & Stage 7 Canvas
- **Stage 7 Canvas (`RefineCanvas.tsx`)**:
  - Section A: **Timeline & Branch Navigator** (Visual tree of timeline branches with quick-switch and fork actions).
  - Section B: **Refinement Audit Log** (Detailed audit table with version tags, previous vs new field diffs, timestamps, and revision notes parsed from `entity_revisions`).
  - Section C: **Project Snapshot & State Portability Station** (Download Bundle JSON, Drag-and-drop Import JSON, and StorageProvider snapshot creation).
- **Stage 5 Codex Integration**:
  - "Refine" action buttons (`Edit3`) on Character and Scene cards open the `RefinementModal`.
