# Phase 42 Context: Pollinations & Media Capability Audit

## Overview
Pollinations (`gen.pollinations.ai`) provides generative AI routing across image, audio, and video modalities. To avoid assumptions or wasted credit spend, Phase 42 conducts a forensic audit of the official live OpenAPI specification and documentation without executing blind paid generation calls.

## Live Endpoint Investigation Findings
From `https://gen.pollinations.ai/openapi.json` and official docs:
1. **Authentication**:
   - Bearer token authentication via `pk_` (publishable key) or `sk_` (secret key).
   - Unauthenticated requests are allowed for specific public endpoints, but subject to default model constraints.
2. **Account & Balance Protocol**:
   - `GET /account/balance`: Returns user account balance in "pollen" units.
   - Allows proactive credit availability checks before dispatching paid model requests.
3. **Modality Endpoints**:
   - **Image**: `GET /image/{prompt}` or `POST /image/{prompt}`. Model list via `GET /image/models`. Unauthenticated requests default to `sana`. Models like `flux` or `flux-pro` require credit-funded keys.
   - **Audio / Speech**: `GET /audio/{text}` and OpenAI-compatible `POST /v1/audio/speech`. Voice selection and sample rate parameters.
   - **Video**: `POST /video/{prompt}`. Model list via `GET /video/models`. Models require pollen balance.
4. **Error Semantics**:
   - HTTP 401: Invalid or missing API key for protected models.
   - HTTP 402: Insufficient pollen balance.
   - HTTP 429: Rate limit exceeded.

## Architectural Objectives
- Define clear routing boundaries: When an API key is present with positive pollen balance vs when public zero-cost access must be used.
- Ensure PRAROHA never invokes credit-required models when unauthenticated, avoiding 401/402 user error banners.
