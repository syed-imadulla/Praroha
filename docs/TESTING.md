# PRAROHA — Testing & Verification Report

**Project:** PRAROHA  
**Hackathon:** Vedanta Makeathon  
**Team:** Supreme (SJCIT, Chikkaballapura)  
**Status:** Post-Hackathon Verification Record

---

## 1. Testing Strategy

PRAROHA employs a four-tier testing hierarchy to ensure architectural resilience, zero regression, and real-world reliability:

```
┌────────────────────────────────────────────────────────┐
│  Tier 4: Multi-Tab Browser E2E & Realtime Isolation    │
│  (Playwright headless chromium, multi-context sync)    │
├────────────────────────────────────────────────────────┤
│  Tier 3: Live Provider Smoke Tests                     │
│  (Real network calls: Gemini, Pollinations, Edge-TTS)  │
├────────────────────────────────────────────────────────┤
│  Tier 2: Backend Integration & Service Tests           │
│  (FastAPI TestClient, SQLModel async session)          │
├────────────────────────────────────────────────────────┤
│  Tier 1: Unit Tests & Schema Assertions                │
│  (Pydantic validation, DAG acyclicity, error mapping)  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Verified Test Results Ledger

The following results reflect the verified final audit pass:

| Suite | Scope | Command | Result | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Suite** | All unit, integration, and service tests | `pytest backend/tests` | **182 Passed, 1 Skipped** | ~27.8s |
| **Frontend Production Build** | TypeScript compilation & Vite bundling | `npm run build` (in `frontend/`) | **0 Errors, 2028 Modules** | ~13.2s |
| **Provider Live Smoke Suite** | Network connectivity & binary decoding | `python3 backend/tests/smoke_test_providers.py` | **Gemini, Pollinations, Edge-TTS LIVE** | ~4.8s |
| **8-Stage E2E Journey** | Full user journey (Seed to Export) | `node frontend/e2e/test_phase31_10_journey.mjs` | **All 8 Stages Passed (Exit 0)** | ~38.6s |
| **Realtime Sync & Isolation** | Multi-tab state sync & project isolation | `node frontend/e2e/test_phase31_10_realtime.mjs` | **Multi-Tab Sync Verified (Exit 0)** | ~15.2s |

*Note: Historical audit results are documented as verified records. Rerunning tests in new environments will reflect the active environment's network state.*

---

## 3. Test Suites Breakdown

### 3.1 Backend Test Modules (`backend/tests/`)
- `test_journey.py`: Tests the sequential flow from project initialization, Seed DNA extraction, world synthesis, selection locking, universe unfolding, to snapshotting.
- `test_audio_generation.py`: Verifies the Stable Audio 2 protocol, Edge-TTS neural voice synthesis, error mapping (401/402/429), and composite audio cascade.
- `test_media_provider.py`: Validates image generation contracts, Pollinations.ai model selection, and JPEG binary magic-byte assertions.
- `test_lineage_service.py`: Tests Directed Acyclic Graph assembly, topological sorting, circular dependency detection, and causal ancestor tracing.
- `test_providers.py`: Validates Google Gemini structured JSON mode, schema enforcement, and bounded exponential backoff.
- `test_auth_ownership.py`: Tests Supabase JWT verification, `owner_id` scoping, and unauthorized cross-project access rejection.

### 3.2 Automated End-to-End Tests (`frontend/e2e/`)
- `test_phase31_10_journey.mjs`:
  1. Authenticates test user.
  2. Submits non-canonical seed.
  3. Synthesizes exactly 3 divergent worlds.
  4. Commits chosen world to Decision DNA.
  5. Unfolds 5-layer Universe Codex.
  6. Generates real character voice and scene concept art.
  7. Navigates from Stage 6 Traceability DAG directly to Stage 7 Refine.
  8. Exports portable `.seedunfold.json` and reloads project via direct URL.
- `test_phase31_10_realtime.mjs`:
  1. Opens two distinct browser contexts (Tab 1 and Tab 2) on the same project.
  2. Commits world choice in Tab 1; verifies Tab 2 advances to Stage 5 without manual reload.
  3. Dispatches media generation in Project A; verifies concurrent Project B remains completely isolated.

---

## 4. How to Execute Tests

### Run Full Backend Suite
```bash
pytest backend/tests -v
```

### Run Provider Smoke Test
```bash
PYTHONPATH=. python3 backend/tests/smoke_test_providers.py
```

### Run Frontend Production Build Check
```bash
npm --prefix frontend run build
```

### Run E2E Journey Tests
```bash
# Ensure backend is running on port 8000 and frontend on port 5174
node frontend/e2e/test_phase31_10_journey.mjs
node frontend/e2e/test_phase31_10_realtime.mjs
```

---

## 5. Security & Secret Verification

A dedicated automated scanner verifies that no private credentials, service-role keys, or provider tokens are committed to tracked Git files:

```bash
# Verify no secrets in git diff
python3 -c '
import subprocess, re
log = subprocess.check_output(["git", "log", "-p", "origin/main..HEAD"]).decode("utf-8", errors="ignore")
found = [line for line in log.splitlines() if line.startswith("+") and not line.startswith("+++") and re.search(r"sb_secret_|sk-[a-zA-Z0-9_-]{25,}|AIza[0-9A-Za-z_-]{30,}", line)]
print("Secrets found:", len(found))
assert len(found) == 0, "Exposed secrets detected!"
'
```
*Expected: Secrets found: 0.*
