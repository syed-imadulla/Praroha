# 30-04-TEST-AUDIT.md: Test Quality, False Positive & Coverage Gap Audit

**Audit Date:** 2026-10-08  
**Scope:** PRAROHA (Seed Unfold) — Backend Unit/Integration Tests & Frontend Playwright E2E Suites  
**Methodology:** Direct inspection of pytest test files, Playwright test scripts, test execution logs, mock configurations, and network interceptor analysis.

---

## 1. Test Suite Inventory

| Test Layer | Framework | Total Tests | Pass Rate | Primary Execution Mechanism |
|------------|-----------|-------------|-----------|-----------------------------|
| **Backend Test Suite** | `pytest` + `pytest-asyncio` | 154 tests across 16 files | **100% (154/154)** | In-memory SQLite async engine (`sqlite+aiosqlite:///:memory:`) with `MockProvider` or FastAPI TestClient. |
| **Frontend Playwright E2E** | Playwright (Node.js CJS) | 21 test suites | **100% Passed** | Headless Chromium against live Vite dev server (port 5173) and live FastAPI server (port 8000). |

---

## 2. The Canonical Demo Bypass Discovery (Critical False Positive)

### Finding: 100% of E2E Suites Test ONLY Hardcoded Fixtures

Detailed audit of all 21 Playwright test files in `frontend/e2e/` revealed an alarming architectural pattern:
1. **Direct Store Hydration Bypass (4 Suites):**
   - `test_phase28_botanical_workspace.cjs`
   - `test_phase29_ui_polish.cjs`
   - `test_phase30_01_clutter_reduction.cjs`
   - `test_phase30_02_shell_simplification.cjs`
   
   These suites bypass the API and AI pipeline entirely by executing:
   ```javascript
   await page.evaluate(() => window.__workspaceStore.getState().loadCanonicalDemoUniverse());
   ```
   They test only that DOM CSS classes, font sizes, and buttons render properly on pre-loaded fixtures.

2. **The Preset String-Match Bypass (17 Suites):**
   Every other suite (e.g. `test_phase3_worlds.cjs`, `test_phase11_decision_dna.cjs`, `test_phase12_origin_ledger.cjs`, `test_phase20_human_only_zones.cjs`) begins with:
   ```javascript
   const oceanPreset = page.locator('button:has-text("Sunken Ocean City")');
   await oceanPreset.click();
   await page.locator('button:has-text("Extract Seed DNA")').click();
   ```
   In `backend/app/providers/gemini_provider.py`:
   ```python
   # 1. Canonical Demo Fixture Determinism (strictly evaluate against immutable raw_seed)
   raw_seed = (dna.get("raw_seed") or "").strip().lower().rstrip(".")
   if raw_seed == "a child discovers a forgotten city beneath the ocean":
       logger.info("Canonical ocean seed detected; deterministically returning canonical demo fixtures.")
       return await self._mock_provider.generate_worlds(dna, potential_items=potential_items)
   ```
   **Because the tests exclusively use the Sunken Ocean City preset, the Gemini AI API is never contacted in any E2E test.**

3. **Consequence:**  
   The entire test suite achieved a 100% green pass rate while the real-world Gemini AI generation was completely broken (429/404/Timeout errors) for all custom user seeds. Not a single test failed because not a single test attempted to enter an original creative seed.

---

## 3. Backend Pytest Quality Audit

| Test File | Test Count | Provider Tested | Database Used | Real Service or Mock? | Quality Rating |
|-----------|------------|-----------------|---------------|-----------------------|----------------|
| `test_health.py` | 6 | Mock & Gemini health | Mocked engine | Mock | **ADEQUATE** |
| `test_dna_extraction.py` | 12 | MockProvider | SQLite in-memory | Mock fixtures | **ARTIFICIAL** (Asserts canonical ocean DNA) |
| `test_world_generation.py` | 14 | MockProvider | SQLite in-memory | Mock fixtures | **ARTIFICIAL** (Asserts exactly 3 canonical worlds) |
| `test_world_selection.py` | 10 | Repo only | SQLite in-memory | Database logic | **SOLID** (Validates 404, 400, batch checks) |
| `test_universe_unfold.py` | 16 | MockProvider | SQLite in-memory | Mock fixtures | **SOLID** on HOZ guard; **ARTIFICIAL** on LLM |
| `test_lineage_dag.py` | 14 | LineageService | SQLite in-memory | DB synthesis | **EXCELLENT** (Tests graph algorithms, cycles, paths) |
| `test_mutation_lab.py` | 15 | MutationService | SQLite in-memory | Heuristic service | **SOLID** (Tests variable extraction and cloning) |
| `test_counterfactual.py` | 11 | CounterfactualService| SQLite in-memory | Delta calculations | **SOLID** (Tests divergence scoring) |
| `test_persistence.py` | 18 | PersistenceService | SQLite in-memory | DB transactions | **EXCELLENT** (Tests branching, snapshots, bundles) |
| `test_media_generation.py`| 10 | MockMediaProvider | SQLite in-memory | Mock generator | **SOLID** (Tests job state machine & polling) |
| `test_voice_generation.py`| 8 | EdgeTTS / Mock | SQLite in-memory | Mocked audio bytes | **ADEQUATE** |
| `test_image_generation.py`| 8 | Pollinations / Mock | SQLite in-memory | Mocked image bytes | **ADEQUATE** |
| `test_video_generation.py`| 6 | Pyramid / Wan / Mock| SQLite in-memory | Mocked mp4 bytes | **ADEQUATE** |
| `test_audio_atmosphere.py`| 6 | ACEStep / Mock | SQLite in-memory | Mocked wav bytes | **ADEQUATE** |

---

## 4. Test Coverage Gaps (Blind Spots)

1. **Zero Real-World LLM Integration Tests:**  
   There is no test in either backend or frontend that invokes `GeminiProvider` with an actual live or mock-recorded API response for an arbitrary user prompt.
2. **Missing Negative / Quota Test:**  
   When the Gemini API returns HTTP 429 Too Many Requests or 404 Model Not Found, there are no tests verifying that the user is informed or that fallback alerts are rendered in the UI.
3. **Orphaned Endpoint Untested in E2E:**  
   `GET /api/projects` and `GET /api/projects/{id}/lineage/node/{id}/ancestors` have 0 E2E coverage because the frontend does not expose them.
4. **No Multi-Tab / Multi-Client Concurrency Tests:**  
   Zero tests evaluating concurrent writes from two clients to the same project.
5. **No Refresh / LocalStorage Desynchronization Tests:**  
   Tests always run in a clean browser session with empty localStorage, never testing what happens when a user refreshes mid-pipeline or when `localStorage` has a project ID that was deleted from the database.
