---
gsd_state_version: '1.0'
milestone: 'Milestone 7: Dedicated Cinematic Rendering Worker'
status: planning
current_phase: 52
progress:
  total_phases: 62
  completed_phases: 62
  total_plans: 88
  completed_plans: 88
  percent: 100.0
---

# Project State: PRAROHA (Seed Unfold)

## Project Reference

See: [.planning/PROJECT.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/PROJECT.md) (updated 2026-10-22)

**Core value:** One incomplete seed becomes structured intent, reveals inferred possibilities, branches into three divergent worlds, empowers human decision, and progressively unfolds into a coherent, persistent, and traceable mini-universe with generative media, counterfactual mutation, creator-locked human-only zones, installable PWA capabilities, and Supabase Realtime synchronization.  
**Current focus:** Milestone 7 — Phase 52: Queue-Based Cinematic Rendering Architecture (Wave 1 & Wave 2 Completed)

## Current Position

- **Milestone 1 (Phases 1–8)**: 100% Completed & Verified (Hackathon MVP baseline).
- **Milestone 2 (Phases 9–20)**: 100% Completed & Verified (Semantic intelligence, divergence engine, origin ledger, and media providers).
- **Milestone 3 (Phases 21–30)**: 100% Completed & Verified (Botanical design system, editorial app shell, and typography polish).
- **Milestone 4 (Phase 31: 31.1–31.11)**: 100% Completed & Verified (Supabase Realtime multi-tab synchronization and project isolation).
- **Milestone 5 (Phases 32–40: Production Product Completion)**: 100% Completed & Verified (ACA cloud backend, Vercel PWA frontend, Supabase DB/Storage/Realtime).
- **Milestone 6 (Phases 41–47: Core Product Intelligence & Media Reliability)**: 100% Completed & Verified (Release Candidate Approved at `e9810a6` / `710a44a`).
- **Milestone 7 (Phases 48–52: Dedicated Cinematic Rendering Worker)**:
  - Phase 48: Dedicated Worker Architecture & Local Prototype (Completed & Verified)
  - Phase 49: Azure Scale-to-Zero Worker Pilot & Cloud Benchmarking (Completed & Verified)
  - Phase 50: HyperFrames Comparative Evaluation & Decision Gate (Completed & Verified)
  - Phase 51: Production Dispatch, UI Enablement & Release Gate (Historical / Superseded by Phase 52)
  - Phase 52: Queue-Based Cinematic Rendering Architecture:
    - Wave 1 (TASK-52-01 to TASK-52-04): Storage `stpraroharender`, queues, `env-praroha-render` Standard ACA environment, and Add-only SAS secret on backend. (Completed & Verified)
    - Wave 2 Worker & Auth (TASK-52-08, TASK-52-05): Queue consumer loop (`--queue`), passwordless Managed Identity authentication (`azure-identity`), dual-queue initialization (`cinematic-render-jobs`, `cinematic-render-poison`), Add-only SAS rejection guard, 20 unit tests, and verified release image `tendersaathiacr.azurecr.io/praroha-worker:v6` (digest `sha256:abb5713fa8d831ab3a3fdde7a1ebeca387c57dc9bfeac2f7f05803860c7d332d`). (Completed & Verified)
    - Wave 2 Job Provisioning (TASK-52-06, TASK-52-07): Dedicated UAMI `uami-praroha-render` with 4 least-privilege RBAC assignments, event-driven Container Apps Job `praroha-render-job` created in `env-praroha-render` with zero ingress (`ingress: null`), KEDA queue scaler (`azure-queue`), scale-to-zero verified (0 executions with empty queues), and secure secret references. (Completed & Verified 2026-10-23)
    - Wave 3 Outbox Migration (TASK-52-09): `render_outbox` table model, programmatic startup migration, reversible PostgreSQL migration script (`backend/migrations/0001_create_render_outbox.sql`), secret-payload guard, and 7 unit tests verified (287 passed full suite). (Completed & Verified 2026-10-23)
    - Wave 3 Backend Outbox Dispatch (TASK-52-10): Transactional outbox persistence (`RenderOutbox`, `MediaAssetRecord`, `GenerationJob` atomically committed), network dispatch strictly outside DB transaction via `QUEUE_PUBLISH_URL` (Add-only SAS URL), canonical schema payload validation with zero secrets, sanitized logging/error reporting, pending record preservation on enqueue failure for sweeper recovery, and 8 dedicated unit tests (295 passed full suite). (Completed & Verified 2026-10-23)
    - Wave 3 Outbox Sweeper & Safe Job Recovery (TASK-52-11): Background `CinematicOutboxSweeper` with atomic CAS leasing (`claimed_at`, 60s lease), exponential backoff (max 5 retries), terminal state handling with sanitized diagnostics; canonical queue schema alignment (`duration_seconds`, `fps`, `resolution`, `aspect_ratio`, `motion_preset`); hardened `recover_orphaned_jobs` protecting active worker leases (<90s) and preserved queued outbox records while releasing `request_hash` on true failures; FastAPI lifespan integration with graceful shutdown; 9 dedicated unit tests (304 passed full suite). (Completed & Verified 2026-10-23)
    - Wave 4 Release Readiness, Incident Containment & Runbook Reconciliation (TASK-52-12):
      - Live Supabase `render_outbox` migration executed and verified (11 columns, 5 constraints, 3 indexes, 0 rows).
      - Historical v7 / v7.1 startup incidents (psutil worker dependency import; boolean column DDL fallback) safely contained and rolled back to `v6` with zero data loss; `QUEUE_PUBLISH_URL` unbound.
      - Implemented database safety hardening: fail-closed startup, separation of zero-DDL runtime schema validation (`validate_production_schema`) from explicit migrations (`run_migrations`).
      - Built, isolated-tested, and published candidate `tendersaathiacr.azurecr.io/praroha-backend:v7.3` (digest `sha256:74c0f103d0894ac931675c99dafdb273414af0c04cd781ed8675ba2ac44b0e1f`).
      - Reconciled authoritative runbook ([PRODUCTION_ROLLOUT_RUNBOOK.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/phases/52-queue-based-cinematic-rendering/PRODUCTION_ROLLOUT_RUNBOOK.md)) and test plan ([ROLLOUT_TEST_AND_ROLLBACK_PLAN.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/phases/52-queue-based-cinematic-rendering/ROLLOUT_TEST_AND_ROLLBACK_PLAN.md)): established explicit current state (backend on `v6`, `QUEUE_PUBLISH_URL` unbound, candidate `v7.3` staged in ACR, outbox exists with 0 rows, feature flags disabled, queues empty, 0 worker executions, canary unexecuted).
    - Operator authorized deployment of candidate `v7.3` with `QUEUE_PUBLISH_URL=secretref:queue-publish-url` (2026-10-23).
      - Phase Gate B step B8 complete: `az containerapp update` succeeded, `provisioningState: Succeeded`, `runningStatus: Running`.
      - Phase Gate C complete: `/api/health` HTTP 200, `fallback_used: false`, PostgreSQL connected (zero DDL schema validation via `validate_production_schema()`), zero errors/SQLite/fallback in logs, `render_outbox` at 0 rows, both queues empty, 0 job executions, feature flags disabled.
    - Single Synthetic Canary Render Executed & Audited (Phase Gate D Complete, 2026-10-24):
      - Dispatched Job ID `0d9c2349-6eed-4686-b148-5f8f5d84c17f` via `backend.scripts.run_canary_dispatch`.
      - Outbox record `e3cfdc80-dca2-4489-98c4-c4dd74a551e2` transitioned durably to `published`.
      - Worker execution `praroha-render-job-rsjqv` ran 55s, succeeded (exit 0), queues drained cleanly (`cinematic-render-jobs: 0`, `cinematic-render-poison: 0`), worker scaled back to 0.
      - Supabase Storage artifact uploaded: `124,558` bytes, H.264, 1280x720, 6.000s duration, genuine playability with 0 decode errors.
      - Post-Canary FPS Acceptance Audit: 25.0 FPS output diagnosed to hardcoded PAL constant in `CinematicPreviewComposer` and dropped parameter in `CinematicPreviewSpec`. Fixed dynamically for 24 and 30 FPS, verified with `ffprobe` and in-container decoding. Candidate worker image `praroha-worker:v7` verified locally (`sha256:dac0a52998652cd586551af81747170b7f092ba67404d3eeb80563ac99199996`).
      - Canary Latency Reconciliation: Pure rendering completed in 2.46s (passes $< 35$s target); total scale-from-zero wall-clock time was 64s due to cold container creation (9s queue wait + 55s container lifecycle).
      - Azure Billing reconciliation status documented: pending until billing data posts (`pretaxCost: None` across all resources in Azure Consumption API); actual compute time was 55s on 1.0 vCPU / 2.0 GiB RAM ($< ₹0.50$ INR estimated).
    - Phase Gate E: Isolated Resilience Testing (Executed & 100% Passed, 2026-10-24):
      - Executed comprehensive 9-scenario resilience battery in `backend/tests/test_cinematic_resilience_phase_gate_e.py`.
      - Test A (Outbox Interruption & Recovery): Verified pending record survival after simulated crash, CAS concurrency-safe multi-sweeper leasing, crash-after-enqueue duplicate protection, exponential backoff, and terminal failure handling on retry budget exhaustion.
      - Test B (Worker Lease Heartbeat & Idempotency): Verified queue message visibility renewal (120s timeout) and periodic database heartbeats during long renders; verified duplicate delivery suppression for in-flight and completed renders with zero redundant execution.
      - Test C (Poison-Message Routing): Injected hostile payloads (unsupported schema versions, invalid UUID formats, unknown entity types, unexpected fields, credential injection); verified rejection with zero secret leakage in logs; verified poison queue routing (`cinematic-render-poison`) on dequeue exhaustion.
      - Test D (Data Immutability): Verified that completed canary render `0d9c2349-6eed-4686-b148-5f8f5d84c17f` and its Supabase MP4 asset are completely immutable across all sweep passes, retries, and duplicate delivery events.
      - Isolation Mechanisms: Strictly bounded to isolated temporary SQLite fixtures (`sqlite+aiosqlite`) and `MockQueueClient`. Zero production queue mutations, zero Container Apps touched.
    - Worker v7 Release Readiness Audit (Completed, 2026-10-24):
      - Audited source, Dockerfile.worker, and dependencies: pure queue worker with no FastAPI/Uvicorn runtime overhead; UAMI `uami-praroha-render` role compatibility confirmed; database connection and honest synthetic MP4 metadata verified.
      - In-container validation: 24 and 30 FPS clips rendered, probed with `ffprobe` (`24/1` and `30/1`), frame count verified, 0 FFmpeg decode errors.
      - Release and non-destructive rollback plans prepared; awaiting separate operator authorization.
    - Next Required Action: Operator Authorization for Worker v7 ACR Push & Deployment.

## Verification Evidence & Quality Gates
- **Live Cloud Production URLs**:
  - Frontend: `https://praroha-ai.vercel.app` (Alias: `https://frontend-iota-green-73.vercel.app`)
  - Backend: `https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io`
- **Backend Test Battery**: 341 passed, 2 skipped in 43.8s (`pytest backend/tests`). Includes 9 dedicated Phase Gate E resilience tests, 21 queue worker tests, 12 production dispatch tests, 9 outbox sweeper tests, 11 canary dispatch CLI tests, and full regression verification.
- **Frontend Production Bundle**: Compiled in 13.9s with zero errors (`npm run build --prefix frontend`). PWA v2.0.0 Workbox precaches 33 entries.
- **PWA Installation Audit**: 100% passed on live Vercel domain (`node frontend/e2e/test_phase37_pwa.mjs`). Verified manifest, icons (192px, 512px, maskable), active Service Worker, and offline transparency banner.
- **Full User Journey E2E**: 100% passed on live cloud stack (`node frontend/e2e/test_phase31_10_journey.mjs`). Verified end-to-end flow with live Gemini AI extraction, divergent 3-world synthesis, EdgeTTS voice generation, concept art and narration, DAG rendering, portable project JSON export, and state reload.
- **Release Free Media & Isolation E2E**: 100% passed on live Azure backend (`node frontend/e2e/test_release_media_and_isolation.mjs`). Verified all 10 checks: CC0 soundscape library, pure WAV synthesis, storage persistence, honest labeling, JSON2Video composed preview, clean failure when generative AI credits are exhausted, and cross-project data isolation.
- **Realtime Multi-Tab & Isolation**: 100% passed on live Vercel + Azure stack (`node frontend/e2e/test_phase31_10_realtime.mjs`). Verified multi-tab broadcast sync and strict project isolation.
