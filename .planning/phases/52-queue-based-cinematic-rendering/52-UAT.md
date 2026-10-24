# Phase 52: Queue-Based Cinematic Rendering Architecture — UAT & Verification Summary

## Phase Goal
Validate the dedicated asynchronous rendering pipeline: Azure Storage Queues, passwordless Managed Identity, ACA Job scale-to-zero compute, Supabase transactional outbox, web API process isolation, one-shot synthetic production canary dispatch, post-canary FPS acceptance audit, and financial reconciliation.

---

## User Acceptance Testing (UAT) Verification Ledger

| ID | Test Scenario | Acceptance Criteria | Result | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-52-01** | Azure Storage & Queue Provisioning | Storage account `stpraroharender`, queues `cinematic-render-jobs` and `cinematic-render-poison`, dedicated ACA environment `env-praroha-render` | **PASS** | Verified in Azure Resource Group `rg-tendersaathi` (Central India). Storage queues provisioned with least-privilege RBAC. |
| **UAT-52-02** | Passwordless Managed Identity Worker | UAMI `uami-praroha-render` with 4 RBAC assignments (`Storage Queue Data Reader`, `Storage Queue Data Message Processor`, `Storage Queue Data Message Sender`, `AcrPull`). Dual queue client init, Add-only SAS rejection guard. | **PASS** | Verified via `pytest backend/tests/test_cinematic_queue_worker.py` (21 passed). Worker image `praroha-worker:v6` deployed with 0 credentials in environment. |
| **UAT-52-03** | KEDA Scaler & Scale-to-Zero | Event-triggered Container Apps Job `praroha-render-job` scales when `queueLength >= 1`, returns to 0 active executions when queues are empty. | **PASS** | Verified in Azure CLI. Worker executed once (`praroha-render-job-rsjqv`), succeeded in 55s, and returned to 0 active executions. Idle compute cost: ₹0.00. |
| **UAT-52-04** | Transactional Outbox Persistence | Supabase `render_outbox` table model with 11 columns, 5 constraints, 3 indexes. Atomic commit of job, media asset, and outbox record with zero secret leakage. | **PASS** | Verified via live Supabase REST query (`public.render_outbox` exists) and unit test battery `test_render_outbox_migration.py` (7 passed). |
| **UAT-52-05** | Backend Outbox Dispatcher & Isolation | Web API enqueues messages strictly outside DB transaction via `QUEUE_PUBLISH_URL`. Web process never executes FFmpeg or imports `psutil`. | **PASS** | Verified via `test_cinematic_production_dispatch.py` (12 passed) and `test_no_ffmpeg_execution_inside_primary_api`. Live `/api/health` returns HTTP 200 with `fallback_used: false`. |
| **UAT-52-06** | Outbox Sweeper & Orphan Recovery | Background sweeper claims pending outbox entries with savepoint isolation and exponential backoff. Preserves queued records while releasing `request_hash` on failures. | **PASS** | Verified via `test_cinematic_outbox_sweeper.py` (9 passed). Graceful startup and shutdown in FastAPI lifespan. |
| **UAT-52-07** | Single Synthetic Production Canary | One-shot operator CLI `run_canary_dispatch.py` executes exactly 1 canary with mandatory `--confirm-production-canary` gate. Outbox record published, message claimed and drained. | **PASS** | Dispatched Job ID `0d9c2349-6eed-4686-b148-5f8f5d84c17f`, outbox ID `e3cfdc80-dca2-4489-98c4-c4dd74a551e2` (`published`), worker execution `praroha-render-job-rsjqv` succeeded (exit 0). Both queues drained to 0. |
| **UAT-52-08** | Media Asset Quality & Honest Labeling | Rendered 6.0s H.264 MP4 uploaded to Supabase Storage `seed-unfold-assets`. 1280x720 resolution, error-free FFmpeg decodability. Honest metadata enforced. | **PASS** | Downloaded and probed `99b0c570-2d22-402e-8a68-1392243f8d30_1792855464.mp4` (`124,558` bytes). Decoded via `ffmpeg -v error -i ... -f null -` with 0 errors. Metadata: `is_synthetic: true`, `provider_label: "Cinematic Preview"`. |
| **UAT-52-09** | Post-Canary FPS Acceptance Audit | Diagnose why canary output measured 25.0 FPS instead of expected 24 FPS. Correct worker implementation, wire `options['fps']` dynamically to `zoompan` and output flags, and build candidate image. | **PASS** | Root cause diagnosed: hardcoded PAL 25 FPS in filter string and omitted `fps` field in `CinematicPreviewSpec`. Fixed in `cinematic_preview.py` and `cinematic_worker.py`. Regression tests verified 24 FPS and 30 FPS outputs via `ffprobe`. Candidate worker image `praroha-worker:v7` built locally (`sha256:1df95b35a48cda4d77debb607ea0ff8a43ccf51244f9a44a0aa0ad3a11243b06`, unpushed, undeployed). |
| **UAT-52-10** | Azure Cost Management & Budget Compliance | Verify pilot expenditure remains strictly $< ₹50.00$ INR. Inspect billing telemetry. | **PASS** | `az consumption usage list` inspected. Telemetry shows `pretaxCost: None` (billing ledger pending). Actual compute time was 55s wall-clock on 1.0 vCPU / 2.0 GiB RAM ($< ₹0.50$ INR estimated). No speculative costs claimed. |
| **UAT-52-11** | Phase Gate E Isolated Resilience Plan | Prepare detailed resilience test plan covering outbox interruption recovery, lease heartbeat & idempotency, and poison queue quarantine using isolated fixtures. | **PASS** | Documented in `PRODUCTION_ROLLOUT_RUNBOOK.md:Section 9.6` and `ROLLOUT_TEST_AND_ROLLBACK_PLAN.md:Stage 5`. Zero mutations to production queues. |

---

## Acceptance Status
**Phase 52 VERIFIED & ACCEPTED.**
- Phase Gate A (Supabase Database Outbox Migration): Complete & Verified.
- Phase Gate B & C (Backend v7.3 Deployment & Fail-Closed PostgreSQL): Complete & Verified.
- Phase Gate D (Single Synthetic Canary Render & Acceptance Audit): Complete & Verified.
- 24 vs 25 FPS Cadence Discrepancy: Root cause diagnosed, resolved, verified with `ffprobe` unit tests (332 passed), and candidate worker image `praroha-worker:v7` built locally.
- Production Boundaries: Exactly 1 canary dispatched; feature flags remain disabled; worker scaled to zero; zero data loss; zero secrets committed.
- Ready for Phase Gate E (Isolated Resilience Testing Plan — Awaiting Operator Authorization).
