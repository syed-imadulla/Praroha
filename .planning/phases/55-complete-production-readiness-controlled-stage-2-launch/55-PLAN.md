# Phase 55 Plan: Complete Production Readiness, Cost Safety, Retention & Controlled Stage 2 Launch

## Goal
Safely execute the controlled Stage 2 public release of the PRAROHA cinematic preview subsystem, ensuring verified Azure cost controls, asset retention management, automated test verification, live smoke testing, and emergency rollback readiness.

---

## Wave 1: Verification, Security Audit & Retention Sweeper Integration
- [ ] Task 1.1: Verify Azure Resource ID filter on `praroha-rendering-pilot-budget` and total spend on `praroha-infrastructure-budget`.
- [ ] Task 1.2: Audit live queues (`cinematic-render-jobs`, `cinematic-render-poison`) and verify worker (`praroha-render-job`) scale-to-zero state.
- [ ] Task 1.3: Integrate `CinematicPreviewRetentionSweeper` with backend configuration (`CINEMATIC_RETENTION_ENABLED`, `CINEMATIC_RETENTION_DRY_RUN=True`) and lifecycle background task.
- [ ] Task 1.4: Run the complete automated test suite (121 cinematic/retention tests + frontend build validation).

## Wave 2: Controlled Backend Gate Activation
- [ ] Task 2.1: Verify all 15 mandatory preflight gates pass with recorded evidence.
- [ ] Task 2.2: Update `praroha-backend` Container App environment: `CINEMATIC_PREVIEW_PUBLIC_ENABLED=true`.
- [ ] Task 2.3: Verify Container App provisioning state (`Succeeded`), running status, and health endpoint (`/api/health` HTTP 200).
- [ ] Task 2.4: Execute authenticated non-operator smoke test to confirm public dispatch acceptance (HTTP 202/job status instead of HTTP 403 Forbidden).

## Wave 3: Frontend Validation & Quota Enforcement
- [ ] Task 3.1: Verify frontend bundle at `https://praroha-ai.vercel.app` exposes active preview button and dispatches to public backend.
- [ ] Task 3.2: Verify quota enforcement: 2 renders per rolling 24 hours per user, 1 active render per user, and HTTP 429 `Retry-After` behavior.
- [ ] Task 3.3: Verify cross-owner rejection (HTTP 403/404) and unauthenticated rejection (HTTP 401).

## Wave 4: Observability, UAT & Handover
- [ ] Task 4.1: Monitor Azure queues, worker execution history, and cost attribution post-activation.
- [ ] Task 4.2: Record all verification evidence in `55-UAT.md` and any remediations in `55-AUDIT-FIX.md`.
- [ ] Task 4.3: Update `.planning/STATE.md` and `ROADMAP.md` reflecting Stage 2 launch.
- [ ] Task 4.4: Deliver Executive Final Report (Sections A–K) with verdict `READY AND LAUNCHED` or documented blocker.
