# Phase 8: Polish / Reliability / Demo - Validation Matrix

## 1. Test Automation Matrix

| Layer | Requirement | Test File | Target Coverage |
|---|---|---|---|
| **Backend** | DEMO-01 | `backend/tests/test_demo.py` | `create_canonical_demo_project()` atomic repository seeding creates complete ProjectRecord with DNA, 3 worlds, selection, bible, 3 characters, relationships, 3 scenes, and revisions in < 500ms |
| **Backend** | DEMO-01 | `backend/tests/test_demo.py` | `POST /api/projects/canonical-demo` HTTP endpoint returns 200 OK with complete `ProjectRead` and unlocks all stages |
| **Backend** | DEMO-02 | `backend/tests/test_demo.py` | `GeminiProvider` wraps exceptions, automatically falls back to `MockProvider` fixtures, logs warning, and returns valid responses without unhandled crashes |
| **Frontend** | DEMO-01 | `frontend/e2e/test_phase8_demo.cjs` | Instant Full Universe button in `SeedInputCanvas` & `TopBar` triggers `POST /api/projects/canonical-demo`, updates store, and navigates with all 7 stages unlocked in < 1s |
| **Frontend** | DEMO-02 | `frontend/e2e/test_phase8_demo.cjs` | Warning toast banner appears gracefully when provider fallback occurs without blocking user interaction |
| **Frontend** | UX / Polish | `frontend/e2e/test_phase8_demo.cjs` | 7-stage Guided Demo Tour (`t` or button) steps through Stages 1–7 (Avyakta through the 6 Tattva transformations) and synchronizes `activeStage` automatically |
| **Frontend** | UX / Polish | `frontend/e2e/test_phase8_demo.cjs` | Global keyboard shortcuts (`1-7` stage jumps, `i` inspector toggle, `?` shortcuts cheat-sheet modal, `Escape` close) operate correctly |
| **Frontend** | UX / Polish | `frontend/e2e/test_phase8_demo.cjs` | Lineage DAG Zoom controls in `TraceabilityCanvas` (`+`, `-`, `100%`) scale the graph smoothly |

---

## 2. Acceptance Criteria Checklist
- [ ] `POST /api/projects/canonical-demo` seeds the canonical "Bio-City" universe atomically in < 500ms.
- [ ] `GeminiProvider` catches timeouts and rate-limit exceptions, gracefully falling back to deterministic mock fixtures.
- [ ] `SeedInputCanvas.tsx` highlights the canonical ocean seed and provides a 1-click `"🌟 Instant Full Universe (Demo)"` button.
- [ ] `GuidedTourOverlay.tsx` provides a 7-step narrative walkthrough from Avyakta through the 6 Tattva transformations for hackathon evaluators.
- [ ] `KeyboardShortcutsModal.tsx` provides visual keycap indicators for `1-7`, `i`, `t`, `?`, and `Escape`.
- [ ] `WorkspaceCanvas.tsx` registers a global keyboard shortcuts listener that respects form input fields.
- [ ] `TraceabilityCanvas.tsx` features interactive zoom controls (`+`, `-`, `100% reset`).
- [ ] All 45 existing backend tests continue to pass + new `test_demo.py` tests pass.
- [ ] Frontend builds cleanly with zero TypeScript errors (`npm --prefix frontend run build`).
- [ ] Automated Playwright test suite `test_phase8_demo.cjs` passes end-to-end.
