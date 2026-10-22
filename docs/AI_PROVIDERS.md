# PRAROHA — AI Provider Specification & Verification Status

**Project:** PRAROHA  
**Hackathon:** Vedanta Makeathon  
**Team:** Supreme  
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
| **Pollinations.ai** | Image: Concept Art & Character Portraits | **Fully Implemented** | Passed (24 tests) | **VERIFIED LIVE** (~450ms) | Valid 1024×1024 JPEG (`\xff\xd8` magic bytes) | Unauthenticated mode pins to free Flux tier. Non-free models require authenticated key. |
| **Microsoft Edge-TTS** | Audio: Character Voice & Scene Narration | **Fully Implemented** | Passed (16 tests) | **VERIFIED LIVE** (~960ms) | Valid MP3 audio (`audio/mpeg`), playable via HTML5 | Online dependency relying on Microsoft Edge online service. |
| **Procedural Soundscape Composer** | Audio: Ambient Soundscapes | **Fully Implemented** | Passed (10 tests) | **VERIFIED LIVE** (<10ms) | 16-bit PCM WAV (`audio/wav`) with valid RIFF headers | Pure procedural synthesis using curated CC0 public domain layers. |
| **Video Generation** | Scene Motion & Previews | **Retired / Currently Unavailable** | Retired | N/A — actions gracefully disabled | N/A | External APIs (JSON2Video, Pixazo, Pyramid Flow, Rewind) retired due to unreliability. Phase 46 evaluates HyperFrames. |

---

## 3. Provider Deep Dives

### 3.1 Google Gemini
- **Role:** Natural language understanding, Seed DNA extraction, divergent world generation, and 5-layer universe codex synthesis.
- **Models Used:** `gemini-3.1-flash-lite`, `gemini-flash-latest`, with fallback to `gemini-3.5-flash-lite`.
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

### 3.4 Procedural Soundscape Composer
- **Role:** Procedural environmental atmosphere and multi-layer soundscapes.
- **Engine:** Pure Python PCM synthesis with curated CC0 public domain textures.
- **Layers Supported:** Wind turbulence, rain precipitation, singing bowl drones, deep space resonance, and forest acoustic textures.
- **Status:** **Fully Implemented & Verified Live** (<10ms synthesis time, 0 external API cost).
- **UX Behavior:** Produces valid 16-bit PCM WAV assets attached to scenes and worlds.

### 3.5 Video Status & HyperFrames Evaluation
- **Role:** Programmatic cinematic preview composition (Phase 46).
- **Status:** **Under Evaluation (Experimental Candidate)**.
- **Context:** Generative video APIs (JSON2Video, Pixazo, Hugging Face / Pyramid Flow, Rewind) were retired due to unreliability and cost.
- **Current Architecture:** Existing video assets remain viewable. New video generation is unavailable in production until a safe, isolated preview worker is fully proven. HyperFrames is evaluated as an isolated external candidate.
- **Honest Labeling:** All preview assets must carry `is_synthetic: true` and `provider_label: "Cinematic Preview"`.

---

## 4. Deterministic Canonical Demo Mode

To ensure complete presentation reliability during live hackathon judging, PRAROHA includes an optional **Deterministic Canonical Demo Mode**:
- **Seed:** *"A child discovers a forgotten city beneath the ocean"*
- **Hydration Time:** `< 500ms`
- **Purpose:** Exercises the complete database schema, entity relationships, media player components, and lineage DAG without depending on external network connectivity or third-party API availability.
- **Integrity Rule:** Canonical Demo content is explicitly labeled and completely isolated from custom live user generations.
