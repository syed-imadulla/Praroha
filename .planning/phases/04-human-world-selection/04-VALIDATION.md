---
phase: "4"
slug: "human-world-selection"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-04"
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.x (backend) / Playwright & TypeScript compiler (frontend) |
| **Config file** | `pytest.ini` / `frontend/vite.config.ts` |
| **Quick run command** | `pytest backend/tests/test_selection.py` |
| **Full suite command** | `pytest backend/tests/ && node frontend/e2e/test_phase4_selection.cjs` |
| **Estimated runtime** | ~6 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest backend/tests/test_worlds.py backend/tests/test_selection.py`
- **After every plan wave:** Run `pytest backend/tests/ && npm run build --prefix frontend`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|---|---|
| 04-01-01 | 01 | 1 | HCHO-03 | — | Validates selection models & SQLModel record | unit | `pytest backend/tests/test_selection.py -k test_selection_schema` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | HCHO-02 | — | Verifies selection repository methods & latest batch validation (rejects older batch with ValueError) | unit | `pytest backend/tests/test_selection.py -k test_repo_selection` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | HCHO-03 | — | Verifies selection endpoint, latest batch enforcement (HTTP 400 for older batches), and retrieval | integration | `pytest backend/tests/test_selection.py -k test_select_candidate_from_older_batch_rejected` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | HCHO-01 | — | Verifies frontend types, API client methods & store selection state | build | `npm run build --prefix frontend` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | HCHO-01, HCHO-02 | — | Verifies Stage 4 Choose Canvas, Glow & Dim styling, rationale input | component | `node frontend/e2e/test_phase4_selection.cjs` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | HCHO-03 | — | Verifies Inspector Drawer Lineage tab with human selection edge | e2e | `node frontend/e2e/test_phase4_selection.cjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_selection.py` — unit and integration test fixtures for world selection
- [ ] `backend/app/models/selection.py` — WorldSelection Pydantic and SQLModel schemas
- [ ] `frontend/src/components/WorldSelectionCanvas.tsx` — Stage 4 Choose canvas component

---

## Manual Probes

| Probe ID | Target | Condition to Check |
|---|---|---|
| M-01 | Web UI (`localhost:5173`) | Advancing to Stage 4 ('Choose') displays 3 cards with 'Select This Direction' buttons |
| M-02 | Web UI (`localhost:5173`) | Selecting a candidate elevates it with cyan glow and dims the other two cards |
| M-03 | Web UI (`localhost:5173`) | Confirming selection saves creator rationale and enables progression to Stage 5 |
| M-04 | Inspector Drawer | Lineage tab displays 'Seed -> Seed DNA -> Selected World' with human timestamp |
