# Phase 14 Context: Image Generation (Pollinations & FLUX.1 schnell)

**Phase Goal**: Integrate a concrete `PollinationsProvider` as the primary image generator for on-demand visual creation (World covers, character portraits, location concepts, and scene keyframes), backed by a 3-tier fallback hierarchy (Pollinations $\rightarrow$ Local FLUX/ComfyUI $\rightarrow$ MockImageProvider), prompt enrichment with Seed DNA aesthetic framing, aspect ratio selection, and an interactive frontend visual lightbox modal.

---

## 1. Locked Decisions & Implementation Scope

### D-01: Concrete `PollinationsProvider` Implementation (`IMG-01`)
- **Primary Generator**:
  - Direct HTTP REST integration with Pollinations.ai (`https://image.pollinations.ai/prompt/{encoded_prompt}`).
  - Query parameters:
    - `width` and `height` resolved dynamically based on requested aspect ratio (`1:1` $\rightarrow$ 1024x1024, `16:9` $\rightarrow$ 1280x720, `9:16` $\rightarrow$ 720x1280).
    - `model`: `flux` (or `flux-realism` / `turbo` configurable via `POLLINATIONS_MODEL` env var).
    - `nologo=true`: Clean professional asset generation without watermarks.
    - `seed`: Deterministic integer seed derived from `project_id` and `entity_id` for reproducibility.
  - Returns binary `image/jpeg` or `image/png` payload encapsulated in `MediaPayload`.
- **Resilient Network Handling**:
  - Configurable HTTP timeout (default 25 seconds).
  - Exponential backoff retry on transient 5xx or rate limit responses.
  - Graceful delegation to next fallback tier on failure or timeout.

### D-02: 3-Tier Image Provider Fallback Hierarchy (`IMG-01`)
- **Tier 1 (Primary)**: `PollinationsProvider` — Free, keyless cloud image generation.
- **Tier 2 (Local)**: `FluxSchnellProvider` — Local FLUX.1 schnell / ComfyUI / local inference endpoint if `FLUX_ENDPOINT` or local weights are configured; skips immediately if unset.
- **Tier 3 (Guaranteed Safe)**: `MockImageProvider` — Synthesizes dark-mode vector SVG graphics locally with zero external network or GPU requirement.
- **Orchestration**:
  - Implemented in `CompositeImageProvider` or `MediaProviderFactory.get_image_provider()` so that any transient network failure or quota exhaustion cascades silently without throwing 500 errors to the client.

### D-03: Context-Aware Visual Prompt Enrichment
- **Aesthetic Consistency**:
  - Before sending to Pollinations or FLUX, prompts are enriched with universe context extracted from `SeedDNA`:
    - Atmosphere and tone (e.g., *"Atmosphere: ethereal bioluminescent mystery"*).
    - Domain keywords and themes (e.g., *"Visual style: high-detail biopunk, volumetric underwater lighting"*).
    - Entity-specific grounding: Prepends entity name, archetype, and key visual attributes while preserving the author's core prompt intact.
  - Enriched prompt is stored alongside the asset in `MediaAssetRecord.prompt` or metadata for full auditability.

### D-04: Storage & Metadata Tracking (`IMG-02`)
- **Persistent Storage**:
  - Binary image data is uploaded via `StorageProvider` (Supabase Cloud Storage bucket `seed-unfold-assets/media/image/...` or local storage `/uploads/media/image/...`).
  - Public/signed URL is attached to `MediaAssetRecord.asset_url`.
- **Relational Metadata**:
  - Table: `media_assets`.
  - Properties stored: `id`, `project_id`, `entity_type` (`world`, `character`, `location`, `scene`), `entity_id`, `media_type = 'image'`, `status`, `asset_url`, `mime_type`, `prompt`, `provider_name` (`pollinations`, `flux`, `mock`), `completed_at`.

### D-05: Multi-Entity Visual Generation Targets (`IMG-03`)
- Visual generation enabled across four key canvas contexts:
  1. **World Covers**: In Stage 3 (World Candidates) and Stage 5 (Universe Codex - World Bible view), allowing creators to generate hero visual covers for the divergent world.
  2. **Character Portraits**: In Stage 5 (Universe Codex - Characters tab), generating focused character concept art.
  3. **Location Concepts**: In Stage 5 (Universe Codex - World Bible Locations).
  4. **Scene Keyframes**: In Stage 5 (Universe Codex - Story Beats tab), rendering pivotal moment keyframes.

### D-06: Frontend Lightbox Modal & Aspect Ratio Controls (`IMG-03`)
- **Aspect Ratio Selector**:
  - Media generation controls include a compact pill toggle for aspect ratio:
    - `1:1` Square (ideal for character avatars and icons).
    - `16:9` Landscape (ideal for world covers, environments, and scene keyframes).
    - `9:16` Portrait (ideal for character full-body art and mobile views).
- **Click-to-Expand Lightbox Modal (`ImageLightboxModal.tsx`)**:
  - Clicking any generated visual opens a high-fidelity modal view.
  - Features:
    - High-resolution unconstrained image display with backdrop blur.
    - Visual prompt inspector and copy button.
    - Generation metadata badge (Provider used, dimensions, aspect ratio, timestamp).
    - Download button (`<a>` tag with download attribute or blob fetch).
    - Keyboard shortcut (`Escape` to close).

---

## 2. Verification & Acceptance Criteria

1. **Backend Unit & Integration Tests**:
   - `test_pollinations_provider`: Tests HTTP request construction, query parameter encoding, mock network response handling, and payload parsing.
   - `test_3_tier_fallback`: Simulates Pollinations failure $\rightarrow$ verifies FLUX or Mock provider handles request seamlessly.
   - `test_prompt_enrichment`: Verifies Seed DNA tone and visual keywords are properly prepended without corrupting entity prompt.
   - `test_image_generation_api`: Verifies `POST /api/projects/{id}/media/generate` with `media_type="image"` and aspect ratio options.
2. **Frontend Build & Playwright E2E Verification**:
   - `npm run build --prefix frontend` builds with zero TypeScript errors.
   - Playwright test (`frontend/e2e/test_phase14_image_generation.cjs`):
     - Scenario 1: World Cover Generation (Stage 3 / Stage 5 World Bible).
     - Scenario 2: Character Portrait Generation with Aspect Ratio selection.
     - Scenario 3: Scene Keyframe Generation in Stage 5 Scenes tab.
     - Scenario 4: Click-to-Expand Lightbox Modal interaction (open, inspect prompt, download action, close).
     - Scenario 5: Fallback resilience (offline/simulated failure gracefully delivers fallback visual).

---

## 3. Downstream Compatibility
- **Phase 15 (Voice Generation)**: Will build `EdgeTTSProvider` following the exact same modular provider pattern established in Phases 13 and 14.
- **Phase 16 (Video Generation)**: Will utilize generated Phase 14 image keyframes as image-to-video source frames for Pyramid Flow / Wan2.1.
