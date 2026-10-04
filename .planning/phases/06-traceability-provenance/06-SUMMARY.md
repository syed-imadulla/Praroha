# Phase 6: Traceability & Provenance (Tattva 5: Sambandha) - Summary

**Phase Status:** Complete  
**Execution Date:** 2026-10-04  
**Requirements Delivered:** TRAC-01, TRAC-02, TRAC-03  

---

## 1. Executive Summary
Phase 6 delivers **Tattva 5: Sambandha (Causal Lineage & Provenance)**. The system dynamically synthesizes a complete Directed Acyclic Graph (DAG) connecting every creative entity across all pipeline stages directly back to the immutable root idea seed. Creators can view the interactive DAG, click any entity (world candidate, canon law, key location, character, relationship, or scene) to illuminate its ancestor provenance trail with glowing paths and dimmed non-ancestors, and inspect human-intelligible causal explanations ("Why Does This Exist?") without exposing internal model chain-of-thought tokens or prompts.

---

## 2. Key Architecture Decisions & Implementations

### A. Dynamic Lineage Synthesis (ADR-002)
- Instead of maintaining complex write-time provenance tables or external graph databases, the backend dynamically synthesizes the causal DAG on demand from existing relational records (`Project`, `SeedDNARecord`, `WorldCandidateRecord`, `WorldSelectionRecord`, `WorldBibleRecord`, `CharacterRecord`, `CharacterRelationshipRecord`, `SceneRecord`).
- Defined explicit typed edges: `derived_from`, `selected_by`, `constrained_by`, `appears_in`, `generated_for`.
- Exported Pydantic schemas: `TraceNode`, `TraceEdge`, `TraceGraphRead`, `AncestorPathRead` in `backend/app/models/lineage.py`.

### B. User Clarifications & Plan Corrections
1. **Key Location Deep-Linking**:
   - Resolved key locations using deterministic node IDs: `node-loc-{index}` with metadata `location_index` and `location_name`.
   - Prevented invention of synthetic database UUIDs since key locations intentionally reside within the World Bible JSON.
2. **Relationship Character Names**:
   - In `LineageService`, character names are resolved dynamically via an in-memory character map (`char_map = {c.id: c.name for c in unfolded.characters}`) rather than assuming non-existent columns on `CharacterRelationshipRecord`.
3. **Zero Chain-of-Thought Leakage (TRAC-03)**:
   - Natural language explanations articulate the causal reasoning and narrative tension grounding each entity without leaking model scratchpads, system prompts, or raw JSON tokens.

### C. Frontend Visual Excellence & Interactive DAG
- **Multi-Lane Pipeline Layout**: 6 distinct stages/lanes rendered with custom typography, responsive grid columns, and entity-specific color coding (Cyan for Root/DNA, Amber for Candidates, Emerald for Selection & World Bible, Indigo for Characters, Orange for Dynamics, Purple for Scenes).
- **Interactive Highlighting & Dimming**:
  - Selecting any target node highlights the target with a cyan glow (`ring-2 ring-cyan-400`).
  - Ancestor nodes glow emerald (`ring-1 ring-emerald-400`).
  - Unrelated nodes dim to `opacity-35` for immediate visual clarity.
- **Causal Inspector Card**:
  - Displays entity identity, stage badge, and the prominent **"Why Does This Exist?"** callout card.
  - Interactive clickable Provenance Trail breadcrumbs allowing step-by-step backward traversal to the root seed.
  - Entity attributes and visual prompt metadata inspection.
- **Cross-Stage Deep Linking**:
  - "Trace Lineage" shortcut buttons on Stage 5 Universe Codex cards (Key Locations, Characters, Relationships, Scenes) jump straight to Stage 6 with the clicked entity focused and highlighted.

---

## 3. Verification & Testing

### Backend Test Suite
- `backend/tests/test_lineage.py`: 8 comprehensive async tests covering:
  - Lineage graph synthesis across all 5 lifecycle stages.
  - Verification of all 5 relation edge types (`derived_from`, `selected_by`, `constrained_by`, `appears_in`, `generated_for`).
  - Backward ancestor BFS traversal ordering from target to root seed.
  - Zero CoT leakage verification across all generated node explanations.
- Full backend suite: **40/40 tests passing** (`python3 -m pytest backend/tests/`).

### Frontend Build & End-to-End Suite
- Frontend TypeScript & Vite production build: **Passed cleanly with 0 errors** (`npm --prefix frontend run build`).
- Automated Playwright E2E suite (`frontend/e2e/test_phase6_traceability.cjs`):
  1. `[PASSED]` Scenario 1: Stage 6 Canvas & 6 Pipeline Lanes
  2. `[PASSED]` Scenario 2: Ancestor Path Glow & Dimming
  3. `[PASSED]` Scenario 3: Causal Inspector Card & Zero CoT Leakage
  4. `[PASSED]` Scenario 4: Deep Linking from Stage 5 Scenes
  5. `[PASSED]` Scenario 5: Key Location Deep Linking (Deterministic `node-loc-0`)
  6. `[PASSED]` Scenario 6: Backend API Lineage & Ancestor Verification
- Verification Screenshots Captured:
  - `phase6_dag_overview.png`
  - `phase6_node_ancestor_glow.png`
  - `phase6_causal_inspector_card.png`

---

## 4. Artifact Links
- Backend lineage models: [lineage.py](file:///home/syed-imadulla/Desktop/Praroha/backend/app/models/lineage.py)
- Dynamic lineage service: [lineage_service.py](file:///home/syed-imadulla/Desktop/Praroha/backend/app/services/lineage_service.py)
- Lineage router: [lineage.py](file:///home/syed-imadulla/Desktop/Praroha/backend/app/routers/lineage.py)
- Traceability Canvas: [TraceabilityCanvas.tsx](file:///home/syed-imadulla/Desktop/Praroha/frontend/src/components/TraceabilityCanvas.tsx)
- Stage 5 Codex shortcuts: [UniverseCodexCanvas.tsx](file:///home/syed-imadulla/Desktop/Praroha/frontend/src/components/UniverseCodexCanvas.tsx)
- Playwright E2E suite: [test_phase6_traceability.cjs](file:///home/syed-imadulla/Desktop/Praroha/frontend/e2e/test_phase6_traceability.cjs)
