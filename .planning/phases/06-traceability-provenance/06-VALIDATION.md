# Phase 6 Validation: Traceability & Provenance (TRAC-01 to TRAC-03)

## Validation Checklist

### 1. Backend Verification
- [ ] `backend/app/models/lineage.py` defines `TraceNode`, `TraceEdge`, `TraceGraphRead`, and `AncestorPathRead`.
- [ ] `backend/app/repositories/project_repo.py` or `backend/app/services/lineage_service.py` implements DAG synthesis from relational records.
- [ ] `GET /api/projects/{project_id}/lineage` returns complete node-edge graph with valid root node ID.
- [ ] `GET /api/projects/{project_id}/lineage/node/{node_id}/ancestors` returns exact ordered ancestor path back to Root Seed.
- [ ] All causal explanations are plain-language and contain zero internal LLM prompt strings or raw chain-of-thought tokens.
- [ ] Automated pytest suite `backend/tests/test_lineage.py` passes 100%.

### 2. Frontend Verification
- [ ] `frontend/src/types/index.ts` exports all lineage interfaces.
- [ ] `frontend/src/api/client.ts` implements `getProjectLineage(projectId)` and `getNodeAncestors(projectId, nodeId)`.
- [ ] `frontend/src/store/workspaceStore.ts` stores `lineageGraph`, `selectedNodeId`, and action `fetchLineage(projectId)`.
- [ ] `frontend/src/components/TraceabilityCanvas.tsx` renders 6-lane DAG layout with visual node cards, edge indicators, and entity type filters.
- [ ] Selecting any node triggers active path glow and dims non-ancestor nodes.
- [ ] Interactive Causal Inspector Card displays node details, direct parents, and "Why does this exist?" explanation.
- [ ] Clicking "Trace Lineage" on any Stage 5 Codex card seamlessly transitions to Stage 6 with that node selected.
- [ ] Production build `npm --prefix frontend run build` completes with 0 errors.

### 3. End-to-End Playwright Verification
- [ ] `frontend/e2e/test_phase6_traceability.cjs` runs full pipeline in Chromium:
  - Canonical Ocean Seed $\rightarrow$ Seed DNA $\rightarrow$ 3 Worlds $\rightarrow$ Human Choice (Bio-City) $\rightarrow$ Unfolded Codex.
  - Navigate to Stage 6 Trace Canvas.
  - Verify complete DAG structure (nodes, edges, lanes).
  - Click Character node $\rightarrow$ assert active path glow, ancestor set, and dimming.
  - Verify Causal Inspector Card answers "Why does this exist?".
  - Click "Trace Lineage" button on a Stage 5 Scene card $\rightarrow$ assert transition to Stage 6 with that scene node selected.
  - All Playwright scenarios pass cleanly.
