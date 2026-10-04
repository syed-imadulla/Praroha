# Phase 6 Discussion Log: Traceability & Provenance (TRAC-01 to TRAC-03)

**Date**: 2026-10-04  
**Topic**: Phase 6 Architecture, DAG Modeling, Causal Explanations, and Interactive Graph UX

---

## Areas Discussed & Decisions Made

### 1. Backend DAG Modeling & Persistence
- **Options Considered**:
  - A: Dynamic synthesis from relational records (Compute on-demand from Project, DNA, Worlds, Selection, Bible, Characters, Relationships, Scenes).
  - B: Dedicated database tables (`ProvenanceNodeRecord`, `ProvenanceEdgeRecord`) populated at generation time.
- **Decision**: **Dynamic Synthesis from Relational Records** (Option A).
  - Guarantees 100% synchronization with actual database state. Zero risk of orphaned provenance nodes or state drift.
  - No new database tables or schema migrations needed.
  - Standardized endpoint `GET /api/projects/{project_id}/lineage` returns the fully constructed DAG.

### 2. Causal Explanation Engine (TRAC-03)
- **Options Considered**:
  - A: Deterministic narrative synthesis linking Seed premise, chosen world archetype, creator rationale, and entity properties.
  - B: On-demand LLM explanation endpoint.
- **Decision**: **Deterministic Narrative Synthesis** (Option A).
  - Instantaneous response with zero latency.
  - Strictly adheres to the rule: "No raw chain-of-thought or internal model tokens exposed."
  - Seamlessly functions in offline and mock modes.

### 3. Stage 6 Canvas Layout & Presentation
- **Options Considered**:
  - A: Visual DAG Flow + Interactive Causal Inspector Card (Hybrid).
  - B: Hierarchical Causal Tree / Breadcrumb Matrix.
  - C: Codex-Integrated Overlay only.
- **Decision**: **Visual DAG Flow + Interactive Causal Inspector Card** (Option A).
  - Full-width interactive node-edge graph illustrating the entire generation pipeline from Root Seed down to specific scenes and characters.
  - Causal Inspector Card updates in real-time when any node is clicked, answering "Why does this exist?".

### 4. Node Selection & Highlighting Behavior
- **Decision**: **Active Path Glow with Dimming**.
  - Clicking any entity node highlights the selected node and its direct ancestor path back to Root Seed with glowing edges.
  - Non-ancestor nodes are dimmed (opacity-30/40) to make the causal trail immediately obvious at a glance.

### 5. Cross-Stage Integration (Stage 5 to Stage 6)
- **Decision**: Add a subtle **"Trace Lineage"** button to cards in the Stage 5 Codex (Key Locations, Characters, Scenes). Clicking this button sets `activeStage = 'trace'`, selects that node, and scrolls/focuses the DAG onto the entity.

---

## Requirements Traceability

| Requirement | How Addressed |
|---|---|
| **TRAC-01** (Record parent-child DAG relations) | `GET /lineage` returns typed nodes and directed edges with explicit relation types (`derived_from`, `selected_by`, `constrained_by`, `appears_in`, `generated_for`). |
| **TRAC-02** (View provenance trail back to root seed) | Clicking any entity in the DAG or Codex highlights the complete ancestor path from Root Seed down to the entity. |
| **TRAC-03** (Human-intelligible explanations without CoT) | Deterministic synthesis engine generates plain-language justifications explaining why the entity was created from previous decisions and constraints. |
