# Phase 4 Research: Human World Selection

## 1. Domain & Architecture Analysis

### Goal
Implement the **Human-in-the-Loop Choice Gate** (Stage 4 / 'Choose') where the creator deliberates between the three world candidates generated in Phase 3, explicitly selects one canonical direction, optionally records creative rationale, and commits to lock the choice before universe unfolding begins in Phase 5.

### Key Architectural Insights
1. **Tattva 3 Principle (Human Selection Gate)**:
   - AI generation must halt at Stage 3/4. The system never autonomously picks a "winner" or proceeds to Stage 5 without an explicit human selection action.
   - This ensures human intentionality anchors all downstream generation (World Bible, characters, scenes).
2. **Dedicated Persistence (`world_selections` table)**:
   - A dedicated relational entity `WorldSelectionRecord` records `id`, `project_id`, `world_candidate_id`, `batch_id`, `user_rationale`, and `created_at`.
   - `Project` entity updates `selected_world_id` and transitions status to `"world_selected"`.
   - Re-selecting another candidate within Stage 4 (before Stage 5 unfolding begins) updates the active selection cleanly.
3. **Stage 4 UI Canvas ('Choose')**:
   - Reuses `WorldCandidateCard` with active selection capabilities.
   - Glow & Dim visual treatment: The selected candidate elevates with `ring-2 ring-cyan-400` and `shadow-glow-cyan`, a prominent "Selected Canon Direction" badge, while unchosen candidates smoothly dim (`opacity-60`) to keep focus on the committed direction while preserving comparative context.
   - Creator Notes Callout: A clean input field allowing the creator to note why they picked this direction (e.g., *"Focusing on symbiotic biology and ecological mystery"*), which feeds into the provenance graph.
   - Confirm CTA: "Confirm & Proceed to Universe Unfolding (Stage 5)" which unlocks Stage 5 (`unfold`).
4. **Initial Lineage DAG in Inspector**:
   - The Inspector Drawer's "Lineage" tab bootstraps its first active provenance tree:
     `Raw Seed` ➔ `Seed DNA` ➔ `Selected World Candidate` (with creator rationale and human decision metadata).

## 2. Reusable Assets & Integration Points
- `backend/app/models/world.py`: `WorldCandidateRecord` and `WorldCandidateRead` schemas.
- `backend/app/repositories/project_repo.py`: SQLModel session and CRUD pattern.
- `frontend/src/components/WorldCandidateCard.tsx`: Reusable card component supporting `isSelected`, `onSelect`, and selection badges.
- `frontend/src/store/workspaceStore.ts`: Zustand store managing active stages and persistence.

## 3. Potential Hazards & Mitigations
- **Hazard:** User accidentally bypassing Stage 4 and triggering unfolding on an unselected project.
  - **Mitigation:** Backend validation in Stage 5 router enforcing `project.selected_world_id is not None`.
- **Hazard:** Selecting a candidate from a stale/obsolete batch.
  - **Mitigation:** Backend validates that `candidate.project_id == project.id` and matches the project's latest candidate batch.
- **Hazard:** Locking user out if they change their mind before unfolding starts.
  - **Mitigation:** Flexible pre-unfold re-selection enabled in Stage 4.
