---
phase: "3"
slug: "three-world-generation"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-04"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.x (backend) / TypeScript compiler & Vite build (frontend) |
| **Config file** | `pytest.ini` / `frontend/vite.config.ts` |
| **Quick run command** | `pytest backend/tests/test_worlds.py` |
| **Full suite command** | `pytest backend/tests/ && npm run build --prefix frontend` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest backend/tests/test_worlds.py`
- **After every plan wave:** Run `pytest backend/tests/ && npm run build --prefix frontend`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|---|---|
| 03-01-01 | 01 | 1 | WGEN-01 | — | Validates WorldCandidate models & SQLModel record | unit | `pytest backend/tests/test_worlds.py -k test_schema` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | WGEN-02 | — | Verifies Gemini generation with Mock fallback & exactly 3 candidates | unit | `pytest backend/tests/test_worlds.py -k test_provider` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | WGEN-03 | — | Verifies generation API, batch persistence, and re-generation | integration | `pytest backend/tests/test_worlds.py -k test_endpoint` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | WGEN-01 | — | Verifies frontend types, API client methods & store integration | build | `npm run build --prefix frontend` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | WGEN-02 | — | Verifies 3-column candidate cards with theme accents | component | `npm run build --prefix frontend` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | WGEN-03 | — | Verifies Stage 3 canvas, candidate comparison, and inspector view | component | `npm run build --prefix frontend` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_worlds.py` — unit and integration test fixtures for 3 world candidates
- [ ] `backend/app/models/world.py` — WorldCandidate Pydantic and SQLModel schemas
- [ ] `frontend/src/components/WorldCandidateCard.tsx` — component for rendering individual candidate world cards

---

## Manual Probes

| Probe ID | Target | Condition to Check |
|---|---|---|
| M-01 | Web UI (`localhost:5173`) | Advancing to Stage 3 generates exactly 3 distinct world cards on screen |
| M-02 | Web UI (`localhost:5173`) | Each card displays title, archetype, concept, aesthetic, core tension, trade-offs, and key visual |
| M-03 | Backend (`POST /api/projects/{id}/worlds/generate`) | Saves 3 candidates with a unique `batch_id`; re-generating appends 3 more with a new `batch_id` |
