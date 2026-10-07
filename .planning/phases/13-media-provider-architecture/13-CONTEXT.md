# Phase 13 Context: Media Provider Architecture

**Phase Goal**: Build a decoupled, non-blocking `MediaProvider` foundation supporting independent modal sub-interfaces (`ImageProvider`, `VoiceProvider`, `VideoProvider`, `AudioProvider`), a deterministic `MockMediaProvider` returning verifiable lightweight assets for offline/CI testing, a relational `media_assets` table with async job state tracking, and non-blocking polling REST APIs.

---

## 1. Locked Decisions & Implementation Scope

### D-01: Composite Provider Architecture (`MED-01`)
- **Modality-Specific Abstract Interfaces**:
  - `ImageProvider(ABC)`: `async def generate_image(self, prompt: str, aspect_ratio: str = "1:1", context: Dict[str, Any] = None) -> MediaPayload`
  - `VoiceProvider(ABC)`: `async def generate_voice(self, text: str, voice_id: str = "default", context: Dict[str, Any] = None) -> MediaPayload`
  - `VideoProvider(ABC)`: `async def generate_video(self, prompt: str, duration_sec: int = 5, context: Dict[str, Any] = None) -> MediaPayload`
  - `AudioProvider(ABC)`: `async def generate_audio(self, prompt: str, mood: str = "ambient", duration_sec: int = 15, context: Dict[str, Any] = None) -> MediaPayload`
- **Unified Media Provider Coordinator**:
  - `MediaProvider(ABC)`: Composite class or protocol holding references to configured instances of `ImageProvider`, `VoiceProvider`, `VideoProvider`, and `AudioProvider`.
- **Factory Architecture (`MediaProviderFactory`)**:
  - Resolves individual modality providers based on environment settings (e.g. `IMAGE_PROVIDER=mock|pollinations|flux`, `VOICE_PROVIDER=mock|edgetts|kokoro`, `VIDEO_PROVIDER=mock|pyramidflow|wan`, `AUDIO_PROVIDER=mock|acestep`).
  - Enables running concrete providers for certain modalities (e.g. Pollinations for image) while keeping others mocked if hardware/tokens are unavailable.

### D-02: Deterministic Mock Media Provider (`MED-02`)
- **Offline / CI Resilience**:
  - `MockMediaProvider` implements all four interfaces with zero external network dependencies, sub-50ms latency, and 100% determinism.
- **Embedded Lightweight Media Assets**:
  - **Image**: Generates clean SVG images with styled dark-theme gradients, entity title, archetype tags, and subtle iconography, converted/saved to `LocalStorageProvider`.
  - **Audio/Voice**: Generates valid lightweight silent or tonal WAV audio files with proper RIFF headers and metadata chunks, playable by native browser `<audio>`.
  - **Video**: Generates small valid MP4 or animated visual clip payloads with metadata tags.
- Returns verified URLs (e.g., `/uploads/media/mock_image_{hash}.svg`, `/uploads/media/mock_voice_{hash}.wav`).

### D-03: Relational Persistence & Async Job State Machine (`MED-03`)
- **Data Models (`backend/app/models/media.py`)**:
  - `MediaType`: Literal `['image', 'voice', 'video', 'audio']`
  - `MediaJobStatus`: Literal `['queued', 'processing', 'completed', 'failed']`
  - `MediaAssetRecord`:
    - `id`: str (UUID)
    - `project_id`: str (FK)
    - `entity_type`: str (`world`, `character`, `location`, `scene`)
    - `entity_id`: str
    - `media_type`: MediaType
    - `status`: MediaJobStatus
    - `asset_url`: Optional[str]
    - `mime_type`: str
    - `prompt`: str
    - `provider_name`: str
    - `error_message`: Optional[str]
    - `created_at`: datetime
    - `completed_at`: Optional[datetime]
- **Asynchronous Task Execution (`MediaService`)**:
  - Media generation is dispatched asynchronously via background tasks (`asyncio.create_task` or FastAPI `BackgroundTasks`).
  - Request immediately returns a job response with `job_id` and status `queued` or `processing`.
  - Service handles network timeouts, provider crashes, or credit limits gracefully, updating `status = 'failed'` and capturing `error_message` without crashing the application or interrupting visual story-world generation.

### D-04: REST API Endpoints (`backend/app/routers/media.py`)
- `POST /api/projects/{id}/media/generate`: Dispatches an async media generation job for a target entity.
- `GET /api/projects/{id}/media/jobs/{job_id}`: Checks status and polls for completed asset URL.
- `GET /api/projects/{id}/media/assets`: Retrieves all media assets attached to the project, with optional query filters (`entity_id`, `media_type`).
- `GET /api/media/providers/health`: Returns availability and status of configured image, voice, video, and audio providers.

### D-05: Frontend Types, Store, and Reusable UI Components
- **Types (`frontend/src/types/index.ts`)**:
  - Define `MediaType`, `MediaJobStatus`, `MediaAsset`, `MediaGenerationRequest`, `MediaJobResponse`.
- **Workspace Store Integration**:
  - Add `mediaAssets: Record<string, MediaAsset[]>`, `activeMediaJobs: Record<string, MediaJobResponse>`, and `requestMediaGeneration()`.
- **Reusable Foundation Component (`MediaPreviewCard.tsx`)**:
  - Loading skeleton state while job is `queued` or `processing`.
  - Error badge if `failed` with retry action.
  - Native playback rendering: image `<img>`, voice `<audio controls>`, video `<video controls>`.

---

## 2. Verification Criteria

1. **Backend Pytest Suite**:
   - `ImageProvider`, `VoiceProvider`, `VideoProvider`, and `AudioProvider` interface compliance.
   - `MockMediaProvider` generates valid, verifiable SVG and WAV asset payloads without network dependencies.
   - Database persistence of `MediaAssetRecord` with status transitions (`queued` -> `processing` -> `completed` / `failed`).
   - `MediaService` catches simulated provider errors gracefully, marking jobs `failed` without unhandled exceptions.
   - REST API endpoints for dispatching generation, polling status, and fetching assets.
2. **Frontend TypeScript & Build**:
   - `npm run build --prefix frontend` passes with zero errors.
3. **Playwright E2E Suite**:
   - Dispatch mock media generation for a character/location.
   - Poll job to completion and verify asset rendering.
   - Verify non-blocking UI behavior during generation.
