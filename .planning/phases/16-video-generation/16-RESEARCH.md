# Phase 16 Research: Video Generation (Pyramid Flow & Wan2.1)

**Phase Goal:** Integrate `PyramidFlowProvider` as the primary video generator for cinematic scenes and world teasers, with local Wan2.1 T2V-1.3B fallback (`WanVideoProvider`), guaranteed offline `MockVideoProvider` fallback, dual "Bring This World to Life" entry points (World Bible Hero teaser & Scene Story Beat cinematics), enriched cinematic camera motion prompts, and a rich video player experience with an expanding `VideoLightboxModal`.

---

## 1. Requirements & Scope Analysis

### 1.1 Requirements
- **`VID-01`**: Concrete `PyramidFlowProvider` as primary video generator for cinematic scenes, with Wan2.1 T2V-1.3B as practical local fallback, optional/experimental Mochi 1 (not primary due to heavy compute), and `MockMediaProvider` as fallback of last resort.
- **`VID-02`**: Asynchronous video job polling/generation with graceful fallback to Wan2.1 or mock video clips if resources expire.
- **`VID-03`**: Frontend provides "Bring This World to Life" cinematic scene action with embedded video playback.

### 1.2 Upstream Foundation (Phases 13, 14, 15)
- `VideoProvider(ABC)` defined in `backend/app/providers/media/base.py` with:
  ```python
  async def generate_video(
      self,
      prompt: str,
      duration_sec: int = 5,
      context: Optional[Dict[str, Any]] = None,
  ) -> MediaPayload: ...
  ```
- `MediaPayload(data, mime_type, filename, metadata)` encapsulating video binary streams.
- `StorageProvider` (`LocalStorageProvider` and `SupabaseStorageProvider`) handling video uploads (`seed-unfold-assets/media/video/...`).
- Relational database table `media_assets` with columns `id`, `project_id`, `entity_type`, `entity_id`, `media_type`, `status`, `asset_url`, `mime_type`, `prompt`, `provider_name`, `metadata_json`.
- Non-blocking async background job orchestration in `MediaService`.
- Frontend `EntityMediaSection.tsx`, `MediaPreviewCard.tsx`, and `UniverseCodexCanvas.tsx`.

---

## 2. Technical Architecture & Component Design

### 2.1 Pyramid Flow Provider Integration (`VID-01`)
Pyramid Flow is a state-of-the-art autoregressive video generation model operating via multi-resolution pyramidal flow matching:
- **Configuration & Connection**:
  - `PYRAMID_FLOW_ENDPOINT` (or Hugging Face Inference API / microservice endpoint).
  - Optional `HF_TOKEN` for authenticated Hugging Face API access.
  - Configurable timeout: **60.0s** (`PYRAMID_FLOW_TIMEOUT_SEC`).
- **Request Format & Parameters**:
  - `prompt`: Cinematic motion prompt string.
  - `duration_sec`: Typically 5 seconds (default).
  - `aspect_ratio`: "16:9" (cinematic landscape) or "9:16" / "1:1".
  - `resolution`: "720p" (1280x720).
- **Resilient Network & Error Cascade**:
  - Checks configuration; if `PYRAMID_FLOW_ENDPOINT` is unset or `context` simulates an outage (`context.simulate_pyramid_unavailable` or `PYRAMID_FORCE_UNAVAILABLE=1`), raises `ProviderUnavailableError`.
  - Dispatches async HTTP POST request using `httpx.AsyncClient`.
  - On network timeout, connection error, or HTTP 4xx/5xx: raises `ProviderUnavailableError` without throwing unhandled 500 errors to trigger cascade to Tier 2.
- **Return Payload**:
  - `MediaPayload(data=mp4_bytes, mime_type="video/mp4", filename=..., metadata={"resolved_provider": "pyramid-flow", "duration_sec": 5, "aspect_ratio": "16:9", "resolution": "720p"})`.

### 2.2 Local Wan2.1 T2V-1.3B Fallback Integration (`VID-01`)
Wan2.1 (T2V-1.3B) provides efficient local text-to-video generation suited for single-GPU or lightweight microservice deployment:
- **Configuration & Connection**:
  - `WAN_ENDPOINT` (e.g. `http://localhost:8890/v1/video/generate` or local microservice).
  - Configurable timeout: **60.0s** (`WAN_TIMEOUT_SEC`).
- **Resilient Cascade Handling**:
  - If `WAN_ENDPOINT` is unset or `context` simulates outage (`context.simulate_wan_unavailable` or `WAN_FORCE_UNAVAILABLE=1`), raises `ProviderUnavailableError`.
  - Dispatches HTTP POST with prompt, aspect ratio, and frame count.
  - On timeout or HTTP failure: raises `ProviderUnavailableError` to trigger cascade to Tier 3.
- **Return Payload**:
  - `MediaPayload(data=mp4_bytes, mime_type="video/mp4", filename=..., metadata={"resolved_provider": "wan2.1", "duration_sec": 5, "aspect_ratio": "16:9", "resolution": "720p"})`.

### 2.3 Guaranteed Safe Tier 3 Fallback & Genuine Browser Playability (`MockVideoProvider`)
- **Deterministic Valid ISO BMFF MP4 Container**:
  - Synthesizes binary bytes with standard MP4 atom/box hierarchy (`ftyp`, `moov`, `mvhd`, `trak`, `mdia`, `minf`, `stbl`, `mdat`).
  - Contains valid timescale and duration box data so browser media engines (Chrome/Chromium HTML5 media pipeline) can decode container metadata, trigger `loadedmetadata` / `canplay` events, report positive `duration`, set `readyState >= 1`, and trigger zero media errors.
  - Sub-10ms generation, zero external network credentials, 100% offline reliability.
- **Consistent Metadata Payload**:
  - `resolved_provider`: `"mock"`
  - `duration_sec`: 5
  - `aspect_ratio`: `"16:9"`
  - `resolution`: `"720p"`
  - `mock`: `True`
- **Playability Acceptance Rule**:
  - "Mock fallback produces a genuinely playable video asset, not merely a file with an .mp4 extension."

### 2.4 Strict Provider Response Isolation & Uniform MediaPayload Abstraction
- **Normalization Boundary**:
  - `PyramidFlowProvider` and `WanVideoProvider` normalize vendor-specific HTTP response payloads (e.g., base64 chunks, raw byte streams, vendor metadata dictionaries) internally within the provider classes.
  - The rest of the system (`MediaService`, `StorageProvider`, `ProjectRepository`, API endpoints, and frontend components) only ever receives and interacts with the canonical `MediaPayload(data: bytes, mime_type: str, filename: str, metadata: Dict[str, Any])`.
  - Zero leakage of Pyramid Flow or Wan2.1 internal schemas into the broader application.

### 2.5 3-Tier Fallback Hierarchy Architecture (`CompositeVideoProvider`)
```
                          ┌─────────────────────────────┐
                          │   CompositeVideoProvider    │
                          └──────────────┬──────────────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  ▼                      ▼                      ▼
        [Tier 1: Cloud]           [Tier 2: Local]        [Tier 3: Offline]
       PyramidFlowProvider   ──▶   WanVideoProvider ──▶  MockVideoProvider
     (Pyramid Flow / HF)         (Wan2.1 T2V-1.3B)       (Valid Playable MP4)
```
- **Fallback Verification Hierarchy**:
  - Pyramid Flow fails $\rightarrow$ Wan2.1 succeeds $\rightarrow$ `resolved_provider = "wan2.1"` (no unhandled 500 error).
  - Pyramid Flow fails $\rightarrow$ Wan2.1 fails $\rightarrow$ Mock succeeds $\rightarrow$ `resolved_provider = "mock"` (no unhandled 500 error).
- **Consistent Metadata Across All Tiers**:
  - Across all 3 tiers, `MediaPayload.metadata` consistently preserves:
    - `resolved_provider`: `"pyramid-flow"`, `"wan2.1"`, or `"mock"`
    - `duration_sec`: default 5
    - `aspect_ratio`: default `"16:9"`
    - `resolution`: `"720p"`

---

## 3. Cinematic Video Prompt Enrichment (`D-03`)

### 3.1 Creator Text Preservation Rule
- If the creator explicitly supplies custom prompt text in the generation request, **preserve it exactly** without modification or silent rewriting.

### 3.2 Canonical Derivation with Motion Cues (when prompt is empty)
When the prompt is omitted or empty:
1. **For World Video (Opening Cinematic Teaser)**:
   ```
   "{world.title}, {world.concept}. Visual aesthetic: {world.aesthetic}. Cinematic camera panning across the expansive environment, atmospheric fog, photorealistic lighting, 4k cinematic render."
   ```
2. **For Scene Video (Pivotal Story Beat)**:
   ```
   "Cinematic scene: {scene.title} in {scene.location_setting}. {scene.conflict_narrative}. Slow dramatic camera motion, dynamic environmental movement, atmospheric lighting."
   ```

---

## 4. Frontend Experience & UI Architecture

### 4.1 Dual Placement for "Bring This World to Life" (`D-02`, `VID-03`)
1. **World Bible Hero Banner (Tab 1)**:
   - Prominent action banner: **"Bring This World to Life"** with cinematic film icon.
   - Triggers opening cinematic teaser video generation for the selected world.
   - Displays generated teaser in a dedicated video preview section beneath the World Cover art with `availableModalities={['image', 'video']}`.
2. **Scene Story Beats (Tab 3)**:
   - Dedicated **"Video Clip"** action button on each Scene card.
   - Allows creators to generate individual cinematic scene clips for pivotal story beats.

### 4.2 Rich In-Card Video Player (`MediaPreviewCard.tsx`)
- Native `<video>` element with custom overlay controls:
  - Play / Pause button overlay on hover (`data-testid="media-video-play-pause-btn"`).
  - Video progress tracking and duration badge (`0:05 / 0:05`, `16:9`, `MP4`).
  - Provider badge displaying resolved provider accurately (`Pyramid Flow • 16:9 • 5s`, `Wan2.1 • 16:9 • 5s`, or `mock • 16:9 • 5s`).
  - Direct MP4 download button (`data-testid="media-video-download-btn"`).
  - Expand to Lightbox trigger (`data-testid="media-video-lightbox-trigger"`).

### 4.3 Interactive Lightbox Modal (`VideoLightboxModal.tsx`)
- Modeled after `ImageLightboxModal.tsx`.
- Dark backdrop blur with theater viewing mode (`data-testid="video-lightbox-modal"`).
- Autoplaying native video player (`data-testid="lightbox-video-player"`).
- Technical parameters inspector: resolved provider, prompt, duration, resolution, aspect ratio.
- Download MP4 action button (`data-testid="download-video-btn"`) and keyboard dismissal (Escape).

---

## 5. Verification Plan

### 5.1 Backend Pytest Suite (`backend/tests/test_video_generation.py`)
1. `test_pyramid_flow_parameters_and_url`: Validates request payload structure, headers, and params.
2. `test_pyramid_flow_retry_and_timeout`: Validates timeout handling and cascade to Wan2.1.
3. `test_3_tier_fallback_pyramid_fail_wan_success`: Validates Pyramid Flow failure $\rightarrow$ Wan2.1 success $\rightarrow$ `resolved_provider == "wan2.1"`.
4. `test_3_tier_fallback_pyramid_and_wan_fail_mock_success`: Validates Pyramid Flow and Wan2.1 failure $\rightarrow$ Mock Video success $\rightarrow$ `resolved_provider == "mock"`, valid MP4 binary, zero 500 errors.
5. `test_mock_mp4_container_structure`: Verifies MockVideoProvider generates valid binary with proper container boxes (`ftyp`, `moov`, `mvhd`, `mdat`) and browser-compatible structure.
6. `test_provider_response_isolation`: Verifies `PyramidFlowProvider` and `WanVideoProvider` strictly return normalized `MediaPayload` without leaking vendor-specific payload shapes.
7. `test_cinematic_prompt_enrichment`: Verifies canonical world teaser and scene motion templates and creator text preservation.
8. `test_video_metadata_persistence`: Generates video and validates database record preserves all metadata.
9. `test_video_api_endpoints`: Verifies REST API dispatch and job completion.
10. **Full Regression Across Milestone 2 (Phases 13, 14, 15)**:
    - `./.venv/bin/pytest backend/tests/ -v` must execute all existing 103 tests plus all new Phase 16 tests with 0 failures.
    - Phase 16 must NOT be reported as complete if existing Phase 13/14/15 functionality regresses.

### 5.2 Frontend Build & Playwright E2E Suite (`frontend/e2e/test_phase16_video_generation.cjs`)
1. `npm run build --prefix frontend` succeeds with 0 errors.
2. Playwright test covering 5 locked scenarios:
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
     - Acceptance Criterion: *"Mock fallback produces a genuinely playable video asset, not merely a file with an .mp4 extension."*
