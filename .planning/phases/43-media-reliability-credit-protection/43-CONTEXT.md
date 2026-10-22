# Phase 43 Context: Media Reliability & Credit Protection

## Problem Statement
During Milestone 5, PRAROHA integrated composite media providers (`CompositeAudioProvider`, `CompositeVideoProvider`) to guarantee resilience. However, an architectural vulnerability exists:
1. **Blind Cascading on Payment Errors**:
   When Tier 1 (e.g. ACE-Step or Wan2.1) returns HTTP 402 (Payment Required) or 429 (Rate/Quota Limit), the provider currently catches `(ProviderUnavailableError, Exception)` and immediately attempts Tier 2 (e.g. Pixazo Tracks) and Tier 3 (Stable Audio).
   If Tier 1 fails due to lack of funds, cascading to other paid providers can rapidly burn through alternative credit pools without the creator's consent.
2. **Media Request Duplication**:
   `MediaService.dispatch_job` currently creates a new `MediaAssetRecord` and spawns a background generation task every time a request arrives, even if an identical asset for that `entity_id`, `media_type`, and `prompt` already exists or is currently generating in the queue.
3. **Orphaned Background Tasks**:
   If the container restarts while a job is running, jobs must be cleanly recovered or marked retryable without leaking unhandled exceptions to the frontend.

## Key Design Decisions
1. **Cost-Safe Circuit Breakers**:
   HTTP 402 (Payment Required) and 403 (Forbidden) must immediately halt the cascade and raise an explicit `CreditExhaustedError`. They must NEVER fall forward to another paid provider unless explicitly authorized by policy.
2. **Asset Deduplication & Content Hashing**:
   Compute a deterministic `content_hash = sha256(f"{project_id}:{entity_id}:{media_type}:{prompt}:{aspect_ratio}")`. If an existing completed asset has this hash, return it immediately (`200 OK`, cache hit). If a job with this hash is currently `queued` or `processing`, return the existing job ID rather than spawning a duplicate task.
3. **Observability**:
   UI provider status cards must clearly indicate whether a provider is `Free / CC0`, `Funded`, `Quota Exhausted`, or `Unconfigured`.
