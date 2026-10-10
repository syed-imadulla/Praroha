# PRAROHA — AI Provider Specification & Verification Status

**Project:** PRAROHA  
**Hackathon:** Vedanta Makeathon  
**Team:** Supreme (SJCIT, Chikkaballapura)  
**Status:** Post-Hackathon Verified Audit

---

## 1. Provider Architecture Overview

PRAROHA decouples all artificial intelligence generation behind clean, modular provider interfaces in `backend/app/providers/`. This ensures:
1. **Model Independence:** Upstream LLMs and media models can be updated or swapped without refactoring business logic.
2. **Strict Output Validation:** All generative outputs are validated against Pydantic schemas or binary magic-byte signatures before persistence.
3. **Resilience & Honest Failure Handling:** Real Mode never masks third-party outages with fake outputs. When external services fail, PRAROHA displays clear error indicators with actionable retry controls.

---

## 2. Comprehensive Provider Matrix

| Provider | Modality & Purpose | Integration Status | Automated Test Status | Live Execution Result | Output Validation | Production Limitation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Gemini** | Text: Seed DNA, 3 Worlds, Codex Unfolding | **Fully Implemented** | Passed (42 tests) | **VERIFIED LIVE** (~1.9s) | Structured JSON validated against Pydantic models | Standard Google AI Studio rate limits and quotas. |
| **Pollinations.ai** | Image: Concept Art & Character Portraits | **Fully Implemented** | Passed (24 tests) | **VERIFIED LIVE** (~450ms) | Valid 1024×1024 JPEG (`\xff\xd8` magic bytes) | Unauthenticated mode defaults to `sana` model. Requires funded key for paid-only models. |
| **Microsoft Edge-TTS** | Audio: Character Voice & Scene Narration | **Fully Implemented** | Passed (16 tests) | **VERIFIED LIVE** (~960ms) | Valid MP3 audio (`audio/mpeg`), playable via HTML5 | Online dependency relying on Microsoft Edge online service. |
| **Stability AI Stable Audio** | Audio: Atmospheric Soundscapes | **Fully Implemented** | Passed (12 tests) | **BLOCKED (HTTP 401/402)** | N/A — live requests fail cleanly without generating fake media | Requires funded `STABILITY_API_KEY` with available generation credits. |
| **Hugging Face / ACE-Step** | Audio: Atmospheric Music Synthesis | **Fully Implemented** | Passed (8 tests) | **BLOCKED (HTTP 404/410)** | N/A — live requests fail cleanly with error toast | Model `facebook/musicgen-small` requires a dedicated inference endpoint (`ACE_STEP_ENDPOINT`). |

---

## 3. Provider Deep Dives

### 3.1 Google Gemini
- **Role:** Natural language understanding, Seed DNA extraction, divergent world generation, and 5-layer universe codex synthesis.
- **Models Used:** `gemini-3.1-flash-lite`, `gemini-flash-latest`, with fallback to `gemini-2.5-flash`.
- **Protocol:** REST API calls with strict schema enforcement (`responseMimeType="application/json"`).
- **Authentication:** Server-side `GEMINI_API_KEY` environment variable.
- **Error Handling:** Bounded exponential backoff with jitter for transient HTTP 429 rate limits; non-retryable 4xx errors surface immediate user feedback.

### 3.2 Pollinations.ai
- **Role:** Generating concept art for key world locations and portraits for cast members.
- **Endpoint:** `https://image.pollinations.ai/prompt/{encoded_prompt}`.
- **Authentication:** Bearer token via `POLLINATIONS_API_KEY` when configured; gracefully falls back to public access when absent.
- **Binary Validation:** Verifies non-empty response, content-type `image/jpeg`, and JPEG SOI marker (`\xff\xd8`).
- **Resilience:** Differentiates HTTP 401/402 payment/auth errors (which fail immediately) from transient 5xx errors (which trigger retries).

### 3.3 Microsoft Edge-TTS
- **Role:** Spoken character dialogue and dramatic scene narration.
- **Engine:** Python asynchronous `edge_tts` online service library.
- **Curated Neural Personas:**
  - `en-US-ChristopherNeural` (Authoritative Narrator / Default)
  - `en-US-GuyNeural` (Grounded Protagonist)
  - `en-US-AriaNeural` (Expressive Lead)
  - `en-GB-SoniaNeural` (Scholarly / Lorekeeper)
  - `en-US-EricNeural` (Younger Archetype)
  - `en-US-AnaNeural` (Child / Companion)
- **Binary Validation:** Verifies non-empty audio bytes and MP3 container headers.
- **Fallback Behavior:** Invalid or deprecated voice strings automatically fall back to the default narrator persona.
- **Important Note:** Edge-TTS is an online cloud dependency and requires active Internet connectivity; it is not an embedded offline model.

### 3.4 Stability AI Stable Audio 2
- **Role:** Text-to-audio environmental atmosphere and soundscape generation.
- **Endpoint:** `POST https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio`.
- **Payload:** Multipart form data containing `prompt`, clamped `duration` (5–190 seconds), and `output_format="mp3"`.
- **Protocol Handling:** Implemented for direct synchronous HTTP 200 binary response handling.
- **Live Status:** **BLOCKED**. During evaluation, requests return HTTP 401/402 due to lack of a funded credit balance in the test environment.
- **UX Behavior:** The UI registers a clean error badge and preserves a working "Try Again" button. No simulated or mock audio is injected into Real Mode.

### 3.5 Hugging Face / ACE-Step
- **Role:** Generative ambient background music.
- **Target Model:** `facebook/musicgen-small`.
- **Live Status:** **BLOCKED**. Hugging Face free Serverless Inference no longer hosts MusicGen. Live generation requires an active, paid Dedicated Inference Endpoint (`ACE_STEP_ENDPOINT`).
- **UX Behavior:** Fails gracefully with a clear message explaining that a dedicated endpoint is required.

---

## 4. Deterministic Canonical Demo Mode

To ensure complete presentation reliability during live hackathon judging, PRAROHA includes an optional **Deterministic Canonical Demo Mode**:
- **Seed:** *"A child discovers a forgotten city beneath the ocean"*
- **Hydration Time:** `< 500ms`
- **Purpose:** Exercises the complete database schema, entity relationships, media player components, and lineage DAG without depending on external network connectivity or third-party API availability.
- **Integrity Rule:** Canonical Demo content is explicitly labeled and completely isolated from custom live user generations.
