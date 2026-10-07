# Phase 14 Research: Image Generation (Pollinations & FLUX.1 schnell)

**Phase Goal:** Integrate `PollinationsProvider` as the primary image generator for on-demand visual creation (world covers, character portraits, location concepts, and scene keyframes), backed by a 3-tier fallback hierarchy (Pollinations $\rightarrow$ Local FLUX/ComfyUI $\rightarrow$ MockImageProvider), context-aware prompt enrichment with Seed DNA aesthetic framing, aspect ratio selection, and an interactive frontend visual lightbox modal.

---

## 1. Requirements & Scope Analysis

### 1.1 Requirements
- **`IMG-01`**: Concrete `PollinationsProvider` as primary image generator (world covers, character portraits, scene visuals) where usable free/team path is available; with local FLUX.1 schnell fallback where practical, and `MockMediaProvider` as fallback of last resort.
- **`IMG-02`**: Generated image assets are stored via `StorageProvider` (Supabase Storage / local uploads) with metadata tracking.
- **`IMG-03`**: Frontend entity cards provide "Generate Visual" buttons with loading skeletons and image preview modals.

### 1.2 Upstream Contracts (Phase 13 Foundation)
Phase 13 provided the exact foundational abstractions required:
- `ImageProvider(ABC)` in `backend/app/providers/media/base.py` with `generate_image(prompt, aspect_ratio, context)`.
- `MediaPayload(data, mime_type, filename, metadata)` for encapsulating raw image binary bytes.
- `StorageProvider` (`LocalStorageProvider` or `SupabaseStorageProvider`) with `upload(data, key, mime_type)`.
- Relational `media_assets` database table and non-blocking `MediaService` state machine (`queued` $\rightarrow$ `processing` $\rightarrow$ `completed` / `failed`).
- Frontend `EntityMediaSection.tsx` and `MediaPreviewCard.tsx`.

---

## 2. Technical Architecture & Component Design

### 2.1 Pollinations.ai Integration Strategy (`IMG-01`)
Pollinations.ai provides direct, keyless HTTP GET endpoint generation:
- **Base URL**: `https://image.pollinations.ai/prompt/{encoded_prompt}`
- **Query Parameters**:
  - `width`: Integer pixels (e.g. 1024)
  - `height`: Integer pixels (e.g. 1024)
  - `model`: `flux` (or `flux-realism` / `turbo`)
  - `seed`: Integer (deterministic seed derived from project ID and entity ID)
  - `nologo`: `true` (removes watermarks)
- **Aspect Ratio Resolution Table**:
  | Aspect Ratio | Dimensions ($W \times H$) | Target Canvas |
  |---|---|---|
  | `1:1` (Square) | $1024 \times 1024$ | Character avatars, icons, badges |
  | `16:9` (Landscape) | $1280 \times 720$ | World covers, environments, scene keyframes |
  | `9:16` (Portrait) | $720 \times 1280$ | Full-body character art, mobile viewports |

- **HTTP Client & Resilience**:
  - Uses `httpx.AsyncClient(timeout=25.0, follow_redirects=True)`
  - Returns `image/jpeg` or `image/png` binary content.
  - Handles transient network timeouts, 429 rate limits, or HTTP 5xx responses with 1 retry before triggering tier 2 fallback.

### 2.2 Local FLUX.1 schnell Fallback Strategy (`IMG-01`)
- **Configurable Endpoint**:
  - `FLUX_ENDPOINT` environment variable (e.g., `http://localhost:8188/generate` for local ComfyUI/Diffusers/Ollama image microservice).
  - If `FLUX_ENDPOINT` is unset or unreachable:
    - Automatically cascades to Tier 3 (`MockImageProvider`).
- **Guaranteed Safe Tier 3 Fallback**:
  - `MockImageProvider` returns crisp dark-mode vector SVG graphics locally with sub-20ms execution and 100% offline determinism.

### 2.3 3-Tier Fallback Hierarchy Architecture
```
                         ┌─────────────────────────────┐
                         │   CompositeImageProvider    │
                         └──────────────┬──────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
       [Tier 1: Cloud]           [Tier 2: Local]        [Tier 3: Offline]
     PollinationsProvider   ──▶  FluxSchnellProvider  ──▶  MockImageProvider
   (Keyless HTTP GET REST)     (Local FLUX/ComfyUI)       (Deterministic SVG)
```

### 2.4 Context-Aware Visual Prompt Enrichment
To prevent stylistic dissonance across entities within the same world, prompts are enriched dynamically using `SeedDNA` context before being submitted to the image provider:
- **Enrichment Structure**:
  ```python
  def enrich_image_prompt(raw_prompt: str, dna: Optional[SeedDNA], entity_type: str) -> str:
      if not dna:
          return raw_prompt
      
      style_cues = []
      if dna.tone:
          style_cues.append(f"Tone: {dna.tone}")
      if dna.domain_keywords:
          style_cues.append(f"Style: {', '.join(dna.domain_keywords[:3])}")
      
      context_header = "; ".join(style_cues)
      return f"{raw_prompt}. Cinematic atmosphere, highly detailed visual aesthetics, {context_header}."
  ```

### 2.5 Storage & Relational Metadata Tracking (`IMG-02`)
- **Storage Path**:
  - `media/image/{asset_id}.jpg` (or `.png` / `.svg`)
  - Stored in Supabase bucket `seed-unfold-assets` or local `./uploads/media/image/`.
- **Database Record**:
  - Table: `media_assets`
  - Record fields: `id`, `project_id`, `entity_type`, `entity_id`, `media_type = 'image'`, `status`, `asset_url`, `mime_type`, `prompt`, `provider_name`, `created_at`, `completed_at`.

### 2.6 Frontend Lightbox Modal & Multi-Entity Controls (`IMG-03`)
- **Component**: `ImageLightboxModal.tsx`
  - Modal overlay with backdrop blur.
  - High-resolution unconstrained image view.
  - Metadata pill header: Provider name (`pollinations`, `flux`, `mock`), dimensions, aspect ratio.
  - Visual prompt inspection box with 1-click clipboard copy.
  - Direct download button triggering native browser file download.
  - Keyboard shortcut (`Escape`) and click-outside dismissal.
- **Generation Control Enhancements**:
  - Aspect ratio toggle buttons (`1:1`, `16:9`, `9:16`) in `EntityMediaSection.tsx`.
  - Added visual generation actions to:
    - Stage 3 World Candidate cards (`WorldCandidateCard.tsx`).
    - Stage 5 World Bible header and Locations in `UniverseCodexCanvas.tsx`.
    - Stage 5 Characters and Scenes in `UniverseCodexCanvas.tsx`.

---

## 3. Verification Strategy

1. **Backend Tests (`backend/tests/test_image_generation.py`)**:
   - `test_pollinations_url_construction`: Aspect ratio mapping to width/height, encoding, parameters.
   - `test_pollinations_mock_http_success`: Simulates successful HTTP 200 JPEG response.
   - `test_3_tier_fallback_cascade`: Simulates Pollinations network failure and verifies clean fallback to Tier 2 / Tier 3.
   - `test_prompt_enrichment_with_seed_dna`: Asserts Seed DNA tone and visual keywords are included.
   - `test_image_generation_api`: End-to-end REST endpoint test verifying `POST /api/projects/{id}/media/generate` returns 200 with job and image asset.
2. **Frontend Playwright E2E (`frontend/e2e/test_phase14_image_generation.cjs`)**:
   - Scenario 1: World Cover generation on World Candidate / World Bible.
   - Scenario 2: Character Portrait generation with Aspect Ratio selection.
   - Scenario 3: Scene Keyframe generation.
   - Scenario 4: Click-to-Expand Image Lightbox Modal (prompt inspection, copy, download).
   - Scenario 5: 3-Tier Fallback resilience under simulated network disconnection.
