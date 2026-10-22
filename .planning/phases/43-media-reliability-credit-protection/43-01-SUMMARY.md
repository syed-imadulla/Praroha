# Phase 43: Media Reliability & Credit Protection — Summary

## Phase Goal
Implement strict cost-safe composite provider routing, cross-process request deduplication, content-hash asset caching, and background job recovery, preventing accidental credit spend or runaway cascading upon HTTP 401/402/403/429 errors.

---

## 1. Pollinations Cost-Safety Audit & Routing Contract

### Exact Endpoint & Access Method
- **Target Endpoint:** `GET https://image.pollinations.ai/prompt/{encoded_prompt}?width={w}&height={h}&seed={seed}&nologo=true&model={model}`
- **Authentication Method:** Bearer token via `POLLINATIONS_API_KEY` (when present); keyless GET for unauthenticated community access.

### Public Accessibility vs Model Pricing Distinction
- **Unauthenticated Public Tier (`POLLINATIONS_API_KEY=""`):**
  - Confirmed publicly accessible models on `https://image.pollinations.ai/prompt`: `sana` / `lykon/dreamshaper-8-lcm`, `z-image-turbo` / `tongyi-mai/z-image-turbo`, and `flux.1-schnell` / `flux`.
  - Calling any model outside this verified set (e.g., `flux-pro`, `midjourney`, `qwen`, or unverified community models) immediately raises `AuthenticationError` before initiating any network request, preventing unexpected HTTP 401/402 errors.
- **Authenticated Account Tier (`POLLINATIONS_API_KEY` present):**
  - In Pollinations' official OpenAPI catalog (`https://gen.pollinations.ai/openapi.json`), `paid_only: false` indicates public endpoint accessibility, NOT zero model price. Models carry pollen unit costs (e.g. `sana`: 0.0001, `flux`: 0.002, `z-image-turbo`: 0.004 pollen/image).
  - When an account key has depleted pollen, Pollinations returns HTTP 402 Payment Required.
  - The cost-safe circuit breaker catches HTTP 402, raises `PaymentRequiredError`, and immediately halts without cascading to secondary paid tiers or burning user credits.

---

## 2. Concurrency-Safe Deduplication (Cross-Process Guarantee)

### Database-Backed Idempotency Engine
- **Partial Unique Index:** Enforced at database level across both SQLite and PostgreSQL:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS uq_media_active_request
  ON media_assets (project_id, request_hash)
  WHERE request_hash IS NOT NULL AND status IN ('queued', 'processing');
  ```
- **Cross-Process Race Resolution:**
  - Removed process-local `asyncio.Lock()`, which only synchronized coroutines within a single Python process and caused event loop binding conflicts across asynchronous boundaries.
  - When two concurrent requests arrive simultaneously across separate application processes or workers for the same request hash:
    1. Worker 1 inserts the new `MediaAssetRecord` and `GenerationJob`, and launches the background task.
    2. Worker 2 attempts insertion and is rejected by the database with an `IntegrityError` (violating `uq_media_active_request`).
    3. Worker 2 catches `IntegrityError`, rolls back its session, queries `find_media_asset_by_hash(project_id, req_hash)`, and attaches to Worker 1's active job.
    4. Exactly one background generation task is executed.
- **Completed Asset Reuse & Force Regeneration:**
  - If a matching asset exists with `status='completed'`, `dispatch_job` returns the cached asset immediately without touching background workers.
  - If `force_regenerate=True` is provided, `clear_active_media_request_hash` unlinks the request hash from any prior active rows, allowing a fresh generation job to insert cleanly.

---

## 3. Retry and Circuit-Breaker Verification

### Error Classification & Behavior by Status Code
- **Non-Retryable Fatal Billing/Auth Errors (401, 402, 403, 429):**
  - **HTTP 401 / 403**: Raises `AuthenticationError`. Circuit breaker halts cascade immediately.
  - **HTTP 402**: Raises `PaymentRequiredError`. Circuit breaker halts cascade immediately to prevent credit consumption.
  - **HTTP 429**: Raises `QuotaExceededError`. Circuit breaker halts cascade immediately.
- **Bounded Transient Retries (500, 502, 503, 504, Network Timeouts):**
  - Handled strictly by providers with configured retry policies:
    - `PollinationsImageProvider`: max 2 retries (3 total attempts) with exponential backoff and jitter.
    - `EdgeTTSProvider`: max 2 retries (3 total attempts) with exponential backoff and jitter.
  - Commercial providers (Pixazo, Pyramid Flow, Stable Audio, ACEStep) do not retry; they fail fast and re-raise explicit error classes to protect budgets.

---

## 4. Provider-Status UI Acceptance Criterion

### UI Exposure of Provider Health & Credit Errors
- **Backend Endpoint (`GET /api/media/providers/health`):**
  - Aggregates operational status and modality health across Image, Voice, Video, and Audio providers.
- **Frontend Health Indicator (`EntityMediaSection.tsx`):**
  - Queries `apiClient.getMediaProvidersHealth()` on mount.
  - Displays `provider-health-badge` with `"Credit-Safe Routing"` pill and pulse indicator in the media action header, clarifying active spend protection without claiming that all external providers are free.
- **Frontend Credit Alert Banner (`EntityMediaSection.tsx`):**
  - Inspects active generation jobs and entity assets for billing/credit failure messages.
  - When a credit/quota failure occurs, renders `data-testid="provider-credit-alert"` banner explaining authorization/credit limits.
- **Card-Level Credit Error Badge (`MediaPreviewCard.tsx`):**
  - When asset or job failure includes credit, payment, quota, or 402 errors, displays `data-testid="media-credit-error-badge"` (`"Credit / Quota Required"`), ensuring the user immediately understands provider limits.

---

## 5. Changed Files & Migration Implications

| File | Changes Made |
| :--- | :--- |
| `backend/app/providers/media/pollinations.py` | Clarified `PUBLIC_UNAUTHENTICATED_MODELS` vs paid pollen catalog pricing; raised specific `AuthenticationError`, `PaymentRequiredError`, `QuotaExceededError`, `TransientProviderError`. |
| `backend/app/repositories/project_repo.py` | Added `uq_media_active_request` partial unique index on active jobs; added `clear_active_media_request_hash`. |
| `backend/app/services/media_service.py` | Removed process-local `asyncio.Lock()`; implemented database-backed `IntegrityError` race recovery in `dispatch_job`. |
| `backend/app/providers/media/factory.py` | Updated `ConfiguredMediaProvider.health_check()` to inspect sub-provider readiness. |
| `backend/tests/test_media_reliability.py` | Added tests for cross-process deduplication database guarantee, force regeneration, and provider health. |
| `backend/tests/test_media_realtime_jobs.py` | Isolated background execution in retry test to prevent async race condition. |
| `frontend/src/components/EntityMediaSection.tsx` | Added provider health status badge and credit alert banner. |
| `frontend/src/components/MediaPreviewCard.tsx` | Added explicit `media-credit-error-badge` for 401/402/403/429 failures. |

### Migration Implications
- Existing `media_assets` table receives partial unique index `uq_media_active_request` (`WHERE request_hash IS NOT NULL AND status IN ('queued', 'processing')`). Existing completed or failed assets are completely unaffected. Zero downtime.

---

## 6. Test Suite Results

- **Media Reliability Tests (`test_media_reliability.py`):** 12/12 passed (100%).
- **Full Media Suite (9 test files, 89 tests):**
  - `test_media_provider.py`: 10/10 passed.
  - `test_media_realtime_jobs.py`: 5/5 passed.
  - `test_media_reliability.py`: 12/12 passed.
  - `test_image_generation.py`: 8/8 passed.
  - `test_voice_generation.py`: 9/9 passed.
  - `test_video_generation.py`: 11/11 passed.
  - `test_audio_generation.py`: 17/17 passed.
  - `test_pixazo_providers.py`: 9/9 passed.
  - `test_rewind_providers.py`: 8/8 passed.
  - **Total:** 89/89 passed in 23.19s.
- **Universe Generation Tests:** 30/30 passed in 3.46s.
- **Frontend Build (`tsc && vite build`):** 0 errors, production bundle built cleanly in 12.96s.
- **Paid API Spend:** $0.00 spent across verification pass.
- **Phase Boundary:** Phase 44 NOT started.
