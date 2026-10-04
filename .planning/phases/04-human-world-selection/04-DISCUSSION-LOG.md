# Phase 4 Discussion Log: Human World Selection

**Date:** 2026-10-04  
**Phase:** 04-human-world-selection  
**Status:** Decisions Locked  

---

## 1. Questions & User Decisions

### Q1: Selection Interaction & Confirmation Flow
- **Question:** How should the human world selection interaction and confirmation flow be structured?
- **Options Presented:**
  1. *(Recommended)* Stage 4 ('Choose') presents the 3 cards with 'Select This World' buttons, an optional creative rationale input, and a definitive 'Confirm Selection' action that unlocks Stage 5.
  2. Selection occurs directly from Stage 3 cards by clicking a prominent 'Choose This World' button, immediately confirming and unlocking Stage 5 without a separate review step.
- **Decision:** **Option 1 Selected**  
  Stage 4 ('Choose') provides a dedicated comparative workspace canvas where the creator evaluates the 3 directions, selects their preferred candidate, optionally enters notes/rationale, and confirms to unlock Stage 5.

### Q2: Backend Selection Persistence
- **Question:** How should the selected world be recorded and persisted in the backend?
- **Options Presented:**
  1. *(Recommended)* Dedicated `POST /api/projects/{id}/worlds/{candidate_id}/select` endpoint that updates `project.selected_world_id`, sets status to `'world_selected'`, and records a `WorldSelectionRecord` capturing timestamp and rationale.
  2. Simple project status update without a dedicated selection endpoint.
- **Decision:** **Option 1 Selected**  
  Implement dedicated `POST /api/projects/{id}/worlds/{candidate_id}/select` and `GET /api/projects/{id}/selection` endpoints with a `WorldSelectionRecord` SQLModel table.

### Q3: Re-Selection / Switching Policy
- **Question:** Should the user be allowed to switch their selected world candidate?
- **Options Presented:**
  1. *(Recommended)* Flexible: User can switch the selected world anytime before initiating Stage 5 unfolding; once Stage 5 unfolding begins, changing world requires explicit branching.
  2. Strictly locked: Once 'Confirm Selection' is clicked, the selection is permanently locked for this project.
- **Decision:** **Option 1 Selected**  
  Creators can switch their selected candidate freely within Stage 4 prior to initiating universe unfolding in Stage 5.

### Q4: Visual Canvas Treatment
- **Question:** How should the selected world be visually highlighted on the Stage 4 canvas?
- **Options Presented:**
  1. *(Recommended)* Glow & Dim treatment: The selected card expands slightly with a prominent 'Selected Canon Direction' badge and primary accent glow, while the other 2 candidates remain legible but dim (opacity-60) for comparison.
  2. Equal cards with a green checkmark badge on the selected candidate.
- **Decision:** **Option 1 Selected**  
  Implement Glow & Dim visual hierarchy (`ring-2 ring-cyan-400`, `shadow-glow-cyan`, unselected dimmed to `opacity-60`).

### Q5: Traceability DAG in Inspector Drawer
- **Question:** Should Phase 4 introduce the first step of the Traceability DAG in the Inspector Drawer?
- **Options Presented:**
  1. *(Recommended)* Yes, show an initial 'Provenance Trail' card or section in Inspector Drawer showing 'Seed -> Seed DNA -> Selected World' with human decision timestamp and optional creator rationale.
  2. No, keep Inspector Drawer as is until Phase 6 (Traceability).
- **Decision:** **Option 1 Selected**  
  Introduce the initial Provenance Trail (`Seed -> Seed DNA -> Selected World`) with human-in-the-loop decision tag in the Inspector Drawer's Lineage tab.

---

## 2. Locked Decisions Summary
- **D-01**: Dedicated Selection Endpoint `POST /api/projects/{id}/worlds/{candidate_id}/select`.
- **D-02**: SQLModel table `world_selections` linked to project, candidate, batch.
- **D-03**: Dedicated Stage 4 ('Choose') canvas with comparative layout, rationale input, and confirm action.
- **D-04**: Glow & Dim visual hierarchy for selected vs unselected candidates.
- **D-05**: Flexible re-selection before Stage 5 unfolding is initiated.
- **D-06**: Initial Provenance Trail in Inspector Drawer's Lineage tab.
- **D-07**: Selection retrieval endpoint `GET /api/projects/{id}/selection`.
