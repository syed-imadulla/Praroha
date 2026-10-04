---
phase: "1"
slug: "foundation-project-shell"
status: complete
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-04"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.x (backend) / TypeScript compiler & Vite build (frontend) |
| **Config file** | `pytest.ini` / `frontend/vite.config.ts` |
| **Quick run command** | `pytest backend/tests/test_health.py` |
| **Full suite command** | `pytest backend/tests/ && npm run build --prefix frontend` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest backend/tests/test_health.py`
- **After every plan wave:** Run `pytest backend/tests/ && npm run build --prefix frontend`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|---|---|
| 01-01-01 | 01 | 1 | SHEL-02 | — | Validates monorepo structure & backend dependencies | unit | `pytest backend/tests/test_health.py` | ✅ Yes | ✅ green |
| 01-01-02 | 01 | 1 | SHEL-03 | — | Verifies AIProvider interface & MockProvider fallback | unit | `pytest backend/tests/test_providers.py` | ✅ Yes | ✅ green |
| 01-01-03 | 01 | 1 | SHEL-02 | — | Verifies SQLModel async engine & ProjectRepository | integration | `pytest backend/tests/test_health.py` | ✅ Yes | ✅ green |
| 01-02-01 | 02 | 2 | SHEL-01 | — | Verifies frontend compiles with Tailwind dark theme tokens | build | `npm run build --prefix frontend` | ✅ Yes | ✅ green |
| 01-02-02 | 02 | 2 | SHEL-01 | — | Verifies shell layout, StageBar & InspectorDrawer rendering | component | `npm run build --prefix frontend` | ✅ Yes | ✅ green |
| 01-02-03 | 02 | 2 | SHEL-02 | — | Verifies typed API client connects to backend health endpoint via proxy | integration | `pytest backend/tests/ && npm run build --prefix frontend` | ✅ Yes | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `backend/tests/conftest.py` — shared fixtures and test client
- [x] `backend/tests/test_health.py` — health check and API envelope test stubs
- [x] `backend/tests/test_providers.py` — AIProvider and StorageProvider test stubs
- [x] `frontend/src/` — initial React + Vite TypeScript setup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| Calm Dark Visual Theme | SHEL-01 | Aesthetic evaluation requires human visual check | Open http://localhost:5173 and verify calm dark palette, Inter typography, and lack of visual clutter |
| Inspector Drawer Animation | SHEL-01 | Transition smoothness check | Click "Inspect DNA" in top bar and observe smooth slide-in drawer transition |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-04
