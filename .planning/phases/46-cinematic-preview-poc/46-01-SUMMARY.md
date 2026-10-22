# Phase 46: Cinematic Preview Proof of Concept Summary

**Executed:** October 2026  
**Status:** **Completed & Verified**  
**Decision Gate Result:** **`VIABLE WITH LIMITATIONS`**  
**Production Deployment:** **Deferred** (to dedicated worker phase; core API protected from OOM)

---

## 1. Objectives & Achievements

| Task | Description | Status | Evidence |
| :--- | :--- | :--- | :--- |
| **TASK-46-01** | Document HyperFrames licensing, repository structure, and dependencies | **Done** | Apache 2.0; Node >=22; Chromium headless shell; pinned FFmpeg n8.0 |
| **TASK-46-02** | Benchmark memory and CPU usage against 1.0 GiB RAM ACA container limit | **Done** | `scripts/benchmark_cinematic_preview.py`: 410.40 MB RSS peak, 808% CPU burst |
| **TASK-46-03** | Assess render duration and timeout risks for 12–15s preview clips | **Done** | Actual render: 1.85s for 12.0s 720p H.264 MP4 (750 KB) |
| **TASK-46-04** | Design decoupled worker architecture to prevent FastAPI OOM kills | **Done** | Isolated worker pattern specified; zero rendering code in web process |
| **TASK-46-05** | Implement scene composition with pan/zoom, dialogue, and ducked audio | **Done** | `backend/app/services/cinematic_preview.py` (`CinematicPreviewComposer`) |
| **TASK-46-06** | Graceful fallback to static keyframe manifest if assets or renderer missing | **Done** | `test_cinematic_preview_missing_image_graceful_static_fallback` passed |
| **TASK-46-07** | Strict metadata enforcement: `is_synthetic: true`, `provider_label: "Cinematic Preview"` | **Done** | Guaranteed by `CinematicPreviewResult.__post_init__` |
| **TASK-46-08** | Honest UI badges distinguishing composed preview from generative AI video | **Done** | `MediaPreviewCard.tsx` updated with honest `Cinematic Preview` badge & tooltip |
| **TASK-46-09** | Publish comprehensive evaluation report | **Done** | `docs/CINEMATIC_PREVIEW_EVALUATION.md` published |

---

## 2. Key Findings & Empirical Metrics

1. **HyperFrames Profile**:
   - License: Apache 2.0 (compatible).
   - System Dependencies: Chromium Headless Shell via Puppeteer, Node 22, 20+ Debian X11/GL system packages, and FFmpeg.
   - Resource Requirement: 1.2 GiB to 2.5 GiB RAM, 2–4 vCPU.
   - Conclusion: **Incompatible with direct bundling in PRAROHA's 0.5 vCPU / 1.0 GiB RAM Azure Container App**.

2. **PRAROHA Native Composer Benchmark**:
   - Render Time: **1.85 seconds** for a 12.00s 720p H.264 MP4.
   - Output File Size: **750.18 KB**.
   - Peak RSS Memory: **410.40 MB**.
   - Peak CPU Utilization: **808.2%** (multi-threaded encoding burst).

3. **Protection of Core Application**:
   - Because 410 MB represents >40% of the entire 1.0 GiB container allocation, executing video renders synchronously within FastAPI is unsafe.
   - Main web API remains completely decoupled (`test_main_api_process_isolation` confirms zero rendering modules loaded).
   - All 5 retired providers (HF, Stability, Pixazo, JSON2Video, Rewind) remain 100% blocked and absent from active provider registries.

---

## 3. Test & Verification Summary

- **Cinematic Preview Suite**: `pytest backend/tests/test_cinematic_preview.py` — **7/7 passed in 1.40s**.
- **Full Backend Regression Suite**: `pytest backend/tests` — **230 passed, 1 skipped in 28.23s**.
- **Frontend Production Build**: `npm --prefix frontend run build` — **Clean (0 errors, 33 PWA precache entries in 14.1s)**.
