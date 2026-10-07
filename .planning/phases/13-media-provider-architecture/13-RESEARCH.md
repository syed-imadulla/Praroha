# Phase 13 Research: Media Provider Architecture

**Phase Goal:** Build a decoupled, non-blocking `MediaProvider` abstraction supporting four independent modal sub-interfaces (`ImageProvider`, `VoiceProvider`, `VideoProvider`, `AudioProvider`), a deterministic `MockMediaProvider` returning verifiable lightweight assets for offline/CI resilience, a relational `media_assets` table with async job state tracking, and non-blocking REST APIs.

---

## 1. Domain & Architecture Analysis

### 1.1 Requirements
- **`MED-01`**: Abstract `MediaProvider` base class defining `ImageProvider`, `VoiceProvider`, `VideoProvider`, and `AudioProvider` interfaces.
- **`MED-02`**: Deterministic `MockMediaProvider` returning verifiable mock media assets for offline/testing resilience.
- **`MED-03`**: All media generation is strictly asynchronous, non-blocking, and gracefully handled on network/credit failures.

### 1.2 Downstream Alignment (Phases 14–17)
Phase 13 establishes the contractual foundation for subsequent modal integrations:
- **Phase 14 (IMG)**: Concrete `PollinationsProvider` / `FluxProvider` implementing `ImageProvider`.
- **Phase 15 (VOX)**: Concrete `EdgeTTSProvider` / `KokoroProvider` implementing `VoiceProvider`.
- **Phase 16 (VID)**: Concrete `PyramidFlowProvider` / `WanProvider` implementing `VideoProvider`.
- **Phase 17 (AUD)**: Concrete `ACEStepProvider` implementing `AudioProvider`.

By isolating the base contracts and mock fallbacks in Phase 13, downstream phases only need to implement their respective sub-interfaces without modifying the core orchestrator, database tables, or polling contracts.

---

## 2. Technical Design & Architecture

### 2.1 Provider Hierarchy (`backend/app/providers/media/`)
```
backend/app/providers/media/
├── __init__.py
├── base.py       # ImageProvider, VoiceProvider, VideoProvider, AudioProvider, MediaProvider, MediaPayload
├── mock.py       # MockImageProvider, MockVoiceProvider, MockVideoProvider, MockAudioProvider, MockMediaProvider
└── factory.py    # MediaProviderFactory resolving concrete providers per modality
```

#### Base Contracts (`base.py`)
```python
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel

class MediaPayload(BaseModel):
    data: bytes
    mime_type: str
    filename: str
    metadata: Dict[str, Any] = {}

class ImageProvider(ABC):
    @abstractmethod
    async def generate_image(self, prompt: str, aspect_ratio: str = "1:1", context: Optional[Dict[str, Any]] = None) -> MediaPayload:
        pass

class VoiceProvider(ABC):
    @abstractmethod
    async def generate_voice(self, text: str, voice_id: str = "default", context: Optional[Dict[str, Any]] = None) -> MediaPayload:
        pass

class VideoProvider(ABC):
    @abstractmethod
    async def generate_video(self, prompt: str, duration_sec: int = 5, context: Optional[Dict[str, Any]] = None) -> MediaPayload:
        pass

class AudioProvider(ABC):
    @abstractmethod
    async def generate_audio(self, prompt: str, mood: str = "ambient", duration_sec: int = 15, context: Optional[Dict[str, Any]] = None) -> MediaPayload:
        pass

class MediaProvider(ABC):
    image: ImageProvider
    voice: VoiceProvider
    video: VideoProvider
    audio: AudioProvider
```

### 2.2 Deterministic Mock Assets (`mock.py`)
To guarantee 100% offline, zero-network determinism:
1. **Mock Images (SVG)**:
   - Clean SVG markup with responsive viewport, dark-mode gradient (`#030712` to `#1e1b4b`), subtle cyan/violet accent frames, entity title text, and an aesthetic watermark (`SEED UNFOLD MOCK VISUAL`).
   - Mime type: `image/svg+xml`.
2. **Mock Audio / Voice (RIFF WAV)**:
   - Valid 44-byte standard RIFF WAV header containing 1-2 seconds of gentle low-amplitude sine wave (440Hz / 220Hz) or silence.
   - Directly playable by any browser HTML5 `<audio>` tag without codecs or external plugins.
   - Mime type: `audio/wav`.
3. **Mock Video (MP4 / WebP)**:
   - Lightweight animated WebP or standard minimal MP4 binary payload with valid container headers and metadata.
   - Mime type: `video/mp4` or `image/webp`.

### 2.3 Database Schema & Persistence (`media_assets`)
```sql
CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'world', 'character', 'location', 'scene'
    entity_id TEXT NOT NULL,
    media_type TEXT NOT NULL,  -- 'image', 'voice', 'video', 'audio'
    status TEXT NOT NULL,      -- 'queued', 'processing', 'completed', 'failed'
    asset_url TEXT,
    mime_type TEXT,
    prompt TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### 2.4 Asynchronous Job Service (`media_service.py`)
- `dispatch_generation(project_id, entity_type, entity_id, media_type, prompt, context)`:
  1. Creates a `MediaAssetRecord` in state `queued`.
  2. Spawns `asyncio.create_task(_process_media_job(job_id))` or uses FastAPI background tasks.
  3. Returns initial `MediaJobResponse` immediately (`< 15ms`).
- `_process_media_job(job_id)`:
  1. Transitions state to `processing`.
  2. Calls appropriate modality provider (`image`, `voice`, `video`, `audio`).
  3. Uploads binary payload via configured `StorageProvider` (`LocalStorageProvider` or `SupabaseStorageProvider`).
  4. Updates record status to `completed` with `asset_url` and `completed_at`.
  5. On any exception (timeout, credit exhaustion, network failure): logs error, sets status to `failed` with `error_message`, ensuring no uncaught crash or process termination.

### 2.5 REST API Design (`backend/app/routers/media.py`)
- `POST /api/projects/{id}/media/generate`: Dispatches async media job.
- `GET /api/projects/{id}/media/jobs/{job_id}`: Polls single job status and asset URL.
- `GET /api/projects/{id}/media/assets`: Lists completed and active media assets for a project / entity.
- `GET /api/media/providers/health`: Returns health status of image, voice, video, audio providers.

### 2.6 Frontend Components & State
- `frontend/src/types/index.ts`: Add `MediaType`, `MediaJobStatus`, `MediaAsset`, `MediaJobResponse`.
- `frontend/src/api/client.ts`: Add `apiClient.generateMedia()`, `apiClient.getMediaJob()`, `apiClient.getMediaAssets()`.
- `frontend/src/store/workspaceStore.ts`: Add media actions and polling helper.
- `frontend/src/components/MediaPreviewCard.tsx`:
  - Reusable card component rendering asset depending on type (`img`, `audio`, `video`), loading skeleton during generation, and error badge with retry.

---

## 3. Wave Breakdown

- **Wave 1: Backend Media Provider Engine & Persistence** (`13-01-PLAN.md`)
  - Sub-interfaces (`ImageProvider`, `VoiceProvider`, `VideoProvider`, `AudioProvider`) in `backend/app/providers/media/base.py`.
  - Deterministic `MockMediaProvider` generating valid SVG, WAV, and video assets in `backend/app/providers/media/mock.py`.
  - Provider factory in `backend/app/providers/media/factory.py`.
  - Database schema & migrations in `backend/app/repositories/project_repo.py`.
  - Async `MediaService` in `backend/app/services/media_service.py`.
  - REST endpoints in `backend/app/routers/media.py`.
  - Comprehensive Pytest test suite in `backend/tests/test_media_provider.py`.

- **Wave 2: Frontend Media Integration & E2E Suite** (`13-02-PLAN.md`)
  - TypeScript types and API client methods in `frontend/src/types/index.ts` and `frontend/src/api/client.ts`.
  - Workspace store actions and polling in `frontend/src/store/workspaceStore.ts`.
  - Reusable `MediaPreviewCard.tsx` component with skeleton loaders, native playback, and error retry.
  - Automated Playwright E2E test in `frontend/e2e/test_phase13_media_provider.cjs`.
