# Phase 7: Refine, Branch & Save - Validation Matrix

## 1. Test Automation Matrix

| Layer | Requirement | Test File | Target Coverage |
|---|---|---|---|
| **Backend** | PERS-01 | `backend/tests/test_persistence.py` | Refine character & scene traits, verify `EntityRevisionRecord` creation, version increment (v1 $\to$ v2), revision notes persistence |
| **Backend** | PERS-01 / TRAC | `backend/tests/test_persistence.py` | Lineage DAG includes `refined_from` relation connecting v1 and v2 version nodes |
| **Backend** | PERS-02 | `backend/tests/test_persistence.py` | Fork timeline branch; verify strict ID remapping (no child record shares parent foreign keys); verify branch isolation |
| **Backend** | PERS-03 | `backend/tests/test_persistence.py` | Export `ProjectBundle` containing `lineage`; import roundtrip restoration; snapshot upload via `storage.upload(...)` |
| **Frontend** | PERS-01 | `frontend/e2e/test_phase7_refine.cjs` | Refinement modal on character card, save with rationale, verify v2 badge in Codex & Audit Log with diff |
| **Frontend** | PERS-02 | `frontend/e2e/test_phase7_refine.cjs` | Fork timeline from Stage 7, switch branch via TopBar switcher, verify isolated states |
| **Frontend** | PERS-03 | `frontend/e2e/test_phase7_refine.cjs` | Export JSON bundle with lineage, save backend snapshot via `storage.upload`, verify snapshot card list |

---

## 2. Acceptance Criteria Checklist
- [ ] `EntityRevisionRecord` table captures immutable revision snapshots on every refinement.
- [ ] `TraceRelationType` includes `"refined_from"`, and `LineageService` synthesizes explicit version lineage nodes.
- [ ] `ProjectBundle` includes `lineage: Optional[TraceGraphRead]`.
- [ ] `branch_project` explicitly remaps all relational IDs (`candidate_id_map`, `char_id_map`) with zero foreign key leakage.
- [ ] Refinement scope explicitly covers Characters and Scenes (PERS-01).
- [ ] Snapshot service uses `storage.upload(file_data, key, mime_type)` matching `StorageProvider` interface.
- [ ] Frontend `TopBar.tsx` features interactive Branch Switcher Dropdown.
- [ ] Frontend `RefineCanvas.tsx` renders Timeline Tree, Refinement Audit Log with diffs, and Project State Hub.
- [ ] Automated Playwright test suite passes cleanly end-to-end.
