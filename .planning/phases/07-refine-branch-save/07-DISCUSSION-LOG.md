# Phase 7: Refine, Branch & Save - Discussion Log

**Date:** 2026-10-04  
**Context:** GSD Phase 7 Discussion (`/gsd-discuss-phase 7`)  
**Tattvas Covered:** Tattva 6: Parinamana (Mutation & Transformation) & Dharana (Persistence)  

---

## 1. Questions & Locked Decisions

### Question 1: Timeline Branching Architecture (PERS-02)
- **Options Presented:**
  1. *(Recommended)* Clone project with parent lineage link (creates a child project copying state up to branch point, preserving parent_project_id and branch label in TopBar)
  2. Entity-level branch tagging (keep same project ID, but tag records with branch_name, filtering active entities by branch)
- **User Decision:** **Clone project with parent lineage link.**
- **Rationale:** Ensures total isolation between branches. Exploring alternate worlds or narrative twists will never accidentally corrupt or mutate the original timeline.

### Question 2: Component Refinement & Auditable Versioning (PERS-01)
- **Options Presented:**
  1. *(Recommended)* Inline Quick Edit with version history (Editable modal/drawer in Codex/Refine canvas that increments entity version, records change rationale, and appends a 'refined_version' node to Lineage DAG)
  2. Pure in-place update (simple update to entity fields with updated_at timestamp without storing previous version snapshots)
- **User Decision:** **Inline Quick Edit with version history.**
- **Rationale:** Aligns with Tattva 5 & 6 philosophy where every creative modification remains auditable, traceable in the Lineage DAG, and backed by a version counter.

### Question 3: Full Project State Save/Reload (PERS-03)
- **Options Presented:**
  1. *(Recommended)* Both JSON file Download/Upload AND Cloud/Local Storage Snapshot (User can export/import a standalone .json bundle file, plus save snapshot to StorageProvider backend)
  2. Browser-based JSON file export/import only
  3. Backend StorageProvider persistence only
- **User Decision:** **Both JSON file Download/Upload AND Cloud/Local Storage Snapshot.**
- **Rationale:** Gives creators both portable self-contained project bundles (e.g. sharing or backup) and instant backend persistence through `StorageProvider` assets.

### Question 4: UI Architecture & Stage 7 Canvas Placement
- **Options Presented:**
  1. *(Recommended)* Dedicated Stage 7 'Refine & Branch' Canvas (Full visual hub for Branch timeline tree, project snapshot/export tools, and version audit log, plus refine action buttons in Stage 5 Codex)
  2. Modal/Drawer only
- **User Decision:** **Dedicated Stage 7 'Refine & Branch' Canvas.**
- **Rationale:** Completes the 7-stage pipeline progression defined in the design spec, providing a dedicated control center for timeline forks, version logs, and project bundle management.

---

## 2. Next Steps
- Transition to Phase 7 Planning: `/gsd-plan-phase 7`.
