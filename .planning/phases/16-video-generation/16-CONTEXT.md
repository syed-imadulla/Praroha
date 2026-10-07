# Phase 16 Context: Video Generation (Pyramid Flow / Wan2.1)

**Phase Goal**: Integrate a concrete `PyramidFlowProvider` as the primary video generator for cinematic scenes and world teasers, with local Wan2.1 T2V-1.3B fallback (`WanVideoProvider`), and guaranteed offline `MockVideoProvider` fallback, dual "Bring This World to Life" entry points (World Bible Hero teaser & Scene Story Beat cinematics), enriched cinematic camera motion prompts, and a rich video player experience with an expanding `VideoLightboxModal`.

---

## 1. Locked Decisions & Implementation Scope

### D-01: 3-Tier Video Provider Fallback Hierarchy (`VID-01`, `VID-02`)
- **Tier 1 (Primary Cloud/Microservice)**: `PyramidFlowProvider`
  - Connects to Pyramid Flow via `PYRAMID_FLOW_ENDPOINT` (or HuggingFace Inference API `HF_TOKEN`).
  - Configurable timeout: **60.0s** (`PYRAMID_FLOW_TIMEOUT_SEC`).
  - If unconfigured, unreachable, or rate-limited: raises `ProviderUnavailableError` without throwing unhandled 500 errors to trigger clean cascade to Tier 2.
- **Tier 2 (Practical Local Fallback)**: `WanVideoProvider`
  - Connects to local Wan2.1 T2V-1.3B inference microservice via `WAN_ENDPOINT`.
  - Configurable timeout: **60.0s** (`WAN_TIMEOUT_SEC`).
  - If unconfigured or unreachable: raises `ProviderUnavailableError` to trigger cascade to Tier 3.
- **Tier 3 (Guaranteed Offline Safety)**: `MockVideoProvider`
  - Returns deterministic, valid offline MP4 binary bytes (ISO BMFF container with `ftyp`, `moov`, `mvhd`, and `mdat` boxes).
  - Guarantees zero unhandled 500 errors.
- **Orchestration via `CompositeVideoProvider`**:
  - Implements `VideoProvider` abstract base interface.
  - Explicit cascade:
    $$\text{Pyramid Flow (failed)} \longrightarrow \text{Wan2.1 (failed)} \longrightarrow \text{Mock Video (succeeded)}$$
  - Returns consistent metadata across all tiers in `MediaPayload.metadata`:
    - `resolved_provider`: `"pyramid-flow"`, `"wan2.1"`, or `"mock"`
    - `duration_sec`: default 5
    - `aspect_ratio`: default `"16:9"`
    - `resolution`: `"720p"`

### D-02: Dual Placement for "Bring This World to Life" (`VID-03`)
- **Placement 1: World Bible Hero CTA (`UniverseCodexCanvas.tsx` - Tab 1)**:
  - Prominent banner action: **"Bring This World to Life"** with cinematic film icon.
  - Triggers an opening cinematic teaser video for the selected world.
  - Displays generated teaser in a dedicated video preview section beneath the World Cover art.
- **Placement 2: Scene Story Beats (`UniverseCodexCanvas.tsx` - Tab 3)**:
  - Dedicated **"Video Clip"** / **"Bring This World to Life"** action button on each Scene card.
  - Allows creators to generate individual cinematic scene clips for pivotal moments.

### D-03: Cinematic Video Prompt Enrichment (`VID-01`)
- **Creator Text Preservation**:
  - If the creator explicitly supplies custom prompt text, preserve it **EXACTLY** without modification.
- **Canonical Derivation with Motion Cues** (when prompt is missing or empty):
  - **For World Video (Opening Cinematic Teaser)**:
    `"{world.title}, {world.concept}. Visual aesthetic: {world.aesthetic}. Cinematic camera panning across the expansive environment, atmospheric fog, photorealistic lighting, 4k cinematic render."`
  - **For Scene Video (Pivotal Story Beat)**:
    `"Cinematic scene: {scene.title} in {scene.location_setting}. {scene.conflict_narrative}. Slow dramatic camera motion, dynamic environmental movement, atmospheric lighting."`

### D-04: Video Asset Persistence & Storage (`VID-02`)
- **Binary Storage**:
  - MP4 video binaries stored via `StorageProvider` (Supabase Cloud Storage bucket `seed-unfold-assets/media/video/...` or local fallback `/uploads/media/video/...`).
- **Relational Metadata**:
  - Table: `media_assets`.
  - Persisted fields: `entity_type` (`world`, `scene`), `entity_id`, `media_type = 'video'`, `status`, `asset_url`, `mime_type = 'video/mp4'`, `prompt`, `provider_name`, `metadata_json`.
  - `metadata_json` stores: `resolved_provider`, `duration_sec`, `aspect_ratio`, `resolution`, `raw_prompt`, `enriched_prompt`.

### D-05: Cinematic Video Player & Lightbox Experience (`VID-03`)
- **In-Card Player (`MediaPreviewCard.tsx`)**:
  - Native `<video>` element with custom aesthetic wrapper.
  - Play / Pause toggle overlay on hover.
  - Time tracking and duration badge (`0:05 / 0:05`, `16:9`, `MP4`).
  - Provider badge displaying resolved provider accurately (`Pyramid Flow • 16:9 • 5s`, `Wan2.1 • 16:9 • 5s`, or `mock • 16:9 • 5s`).
  - Direct MP4 download button (`data-testid="media-video-download-btn"`).
  - Expand to Lightbox action trigger (`data-testid="media-video-lightbox-trigger"`).
- **Interactive Lightbox Modal (`VideoLightboxModal.tsx`)**:
  - Modeled after `ImageLightboxModal.tsx`.
  - Expanded theater viewing mode with dark backdrop blur.
  - Technical parameters inspection: provider, prompt, duration, resolution, aspect ratio.
  - Download action button and keyboard navigation (Escape to close).

### D-06: Provider Response Isolation & Uniform MediaPayload Abstraction
- **Isolated Response Normalization**:
  - `PyramidFlowProvider` and `WanVideoProvider` must strictly normalize their provider-specific response structures into the existing `MediaPayload` abstraction (`data: bytes`, `mime_type: str`, `filename: str`, `metadata: Dict[str, Any]`).
  - Neither `MediaService`, `StorageProvider`, the database repository layer, nor the frontend shall depend on or leak any provider-specific response formats, schemas, or raw vendor payloads.

---

## 2. Verification & Acceptance Criteria

1. **Backend Unit & Integration Tests (`backend/tests/test_video_generation.py`)**:
   - `test_pyramid_flow_parameters_and_url`: Validates request payload structure, headers, and params.
   - `test_pyramid_flow_retry_and_timeout`: Validates timeout handling and cascade to Wan2.1.
   - `test_3_tier_fallback_pyramid_fail_wan_success`: Validates Pyramid Flow failure $\rightarrow$ Wan2.1 success $\rightarrow$ `resolved_provider == "wan2.1"`.
   - `test_3_tier_fallback_pyramid_and_wan_fail_mock_success`: Validates Pyramid Flow and Wan2.1 failure $\rightarrow$ Mock Video success $\rightarrow$ `resolved_provider == "mock"`, valid container/MP4 binary, zero 500 errors.
   - `test_mock_mp4_container_structure`: Verifies MockVideoProvider generates valid binary with proper container boxes (`ftyp`, `moov`, `mvhd`, `mdat`) and browser-compatible structure.
   - `test_provider_response_isolation`: Verifies `PyramidFlowProvider` and `WanVideoProvider` strictly return normalized `MediaPayload` without leaking vendor-specific payload shapes into service or persistence layers.
   - `test_cinematic_prompt_enrichment`: Verifies canonical world teaser and scene motion templates.
   - `test_video_metadata_persistence`: Generates video and validates database record preserves all metadata.
   - `test_video_api_endpoints`: Verifies REST API dispatch and job completion.
   - **Full Regression Across Milestone 2**:
     - `./.venv/bin/pytest backend/tests/ -v` must execute all existing 103 tests (including Phase 13, 14, 15 suites) plus all new Phase 16 tests with 0 failures.
     - Phase 16 must NOT be reported as complete if existing Phase 13/14/15 functionality regresses.

2. **Frontend Build & Playwright E2E Verification (`frontend/e2e/test_phase16_video_generation.cjs`)**:
   - `npm run build --prefix frontend` succeeds with 0 errors.
   - Playwright test covering 5 locked scenarios:
     - Scenario 1: World Teaser Video Generation ("Bring This World to Life" hero action).
     - Scenario 2: Scene Story Beat Video Generation.
     - Scenario 3: Video Player Controls & Interactive Lightbox Modal verification.
     - Scenario 4: Database Persistence & Offline Video Playback across page reload.
     - Scenario 5: Strengthened 3-tier Fallback & Genuine Browser Playability Verification:
       - Injects simulated outage: forces Pyramid Flow unavailable, forces Wan2.1 unavailable.
       - Verifies Mock video succeeds without UI crash or unhandled 500.
       - Verifies `resolved_provider === "mock"`.
       - Verifies the rendered `<video>` element loads successfully in browser.
       - Verifies `video.readyState` indicates media is loaded enough for playback (`readyState >= 1` / `HAVE_METADATA`).
       - Verifies `video.duration` is available (`!isNaN(duration)` and `duration > 0`).
       - Verifies no video `error` event occurs (`video.error === null`).
       - **Acceptance Criterion**: *"Mock fallback produces a genuinely playable video asset, not merely a file with an .mp4 extension."*

---
*Created: 2026-10-07 during /gsd-discuss-phase 16 (Strengthened per Phase 16 plan adjustments)*
