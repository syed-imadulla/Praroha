---
phase: "2"
slug: "seed-understanding-seed-dna"
status: complete
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-04"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.x (backend) / TypeScript compiler & Vite build (frontend) |
| **Config file** | `pytest.ini` / `frontend/vite.config.ts` |
| **Quick run command** | `pytest backend/tests/test_dna.py` |
| **Full suite command** | `pytest backend/tests/ && npm run build --prefix frontend` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest backend/tests/test_dna.py`
- **After every plan wave:** Run `pytest backend/tests/ && npm run build --prefix frontend`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|---|---|
| 02-01-01 | 01 | 1 | DNA-03 | — | Validates Pydantic SeedDNA model & SQLModel record | unit | `pytest backend/tests/test_dna.py -k test_schema` | ✅ | ✅ green |
| 02-01-02 | 01 | 1 | DNA-02 | — | Verifies GeminiProvider with Mock fallback logic | unit | `pytest backend/tests/test_dna.py -k test_provider` | ✅ | ✅ green |
| 02-01-03 | 01 | 1 | DNA-05 | — | Verifies raw seed immutability & extraction API endpoint | integration | `pytest backend/tests/test_dna.py -k test_endpoint` | ✅ | ✅ green |
| 02-02-01 | 02 | 2 | DNA-01 | — | Verifies frontend presets & seed textarea input | build | `npm run build --prefix frontend` | ✅ | ✅ green |
| 02-02-02 | 02 | 2 | DNA-02 | — | Verifies understanding pass loader and stage transition | component | `npm run build --prefix frontend` | ✅ | ✅ green |
| 02-02-03 | 02 | 2 | DNA-04 | — | Verifies Inspector Drawer Seed DNA cards and JSON export | component | `npm run build --prefix frontend` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `backend/tests/test_dna.py` — unit and integration test fixtures for Seed DNA
- [x] `backend/app/models/dna.py` — SeedDNA Pydantic and SQLModel schemas
- [x] `frontend/src/components/SeedDnaViewer.tsx` — component for rendering DNA parameter cards

---

## Manual Probes

| Probe ID | Target | Condition to Check |
|---|---|---|
| M-01 | Web UI (`localhost:5173`) | Clicking "Use Canonical Demo Seed" populates the textarea and clicking "Analyze & Extract Seed DNA" unlocks Stage 2 |
| M-02 | Web UI (`localhost:5173`) | Inspector Drawer displays Core Premise, Themes (cyan chips), Entities, Constraints (amber chips), and Keywords |
| M-03 | Backend (`GET /api/projects/{id}/dna`) | Returns validated Seed DNA with `raw_seed` matching the initial input |
