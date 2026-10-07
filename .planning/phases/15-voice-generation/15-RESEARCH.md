# Phase 15 Research: Voice Generation (Edge TTS & Kokoro-82M)

**Phase Goal:** Integrate `EdgeTTSProvider` as the primary voice engine for narrative voiceovers without external API keys, backed by a 3-tier fallback hierarchy (Edge TTS $\rightarrow$ Local Kokoro-82M $\rightarrow$ MockVoiceProvider), curated voice archetypes with automatic persona suggestion and manual override, dual generation targets (Character vocal introductions in Characters tab and dramatic scene narration in Story Beats tab), and a custom interactive narrative audio player card.

---

## 1. Requirements & Scope Analysis

### 1.1 Requirements
- **`VOX-01`**: Concrete `EdgeTTSProvider` as primary voice generator for narrative voiceovers without external API keys, with optional local Kokoro-82M fallback and `MockMediaProvider` fallback of last resort.
- **`VOX-02`**: Backend audio endpoints support voice selection, narration generation, and audio asset persistence.
- **`VOX-03`**: Frontend provides interactive narration player with play/pause and regenerate controls.

### 1.2 Upstream Foundation (Phase 13 & 14)
- `VoiceProvider(ABC)` defined in `backend/app/providers/media/base.py` with `generate_voice(text, voice_id, context)`.
- `MediaPayload(data, mime_type, filename, metadata)` encapsulating audio binary streams.
- `StorageProvider` (`LocalStorageProvider` and `SupabaseStorageProvider`) handling audio uploads (`seed-unfold-assets/media/voice/...`).
- Relational database table `media_assets` with columns `id`, `project_id`, `entity_type`, `entity_id`, `media_type`, `status`, `asset_url`, `mime_type`, `prompt`, `provider_name`, `metadata_json`.
- Non-blocking async generation pipeline in `MediaService`.
- Frontend `EntityMediaSection.tsx` and `MediaPreviewCard.tsx`.

---

## 2. Technical Architecture & Component Design

### 2.1 Edge TTS Integration Strategy (`VOX-01`)
`edge-tts` provides asynchronous neural text-to-speech synthesis without requiring Microsoft Azure subscriptions or API keys:
- **Python Library**: `edge-tts` (`import edge_tts`).
- **Core Interface**:
  ```python
  communicate = edge_tts.Communicate(text, voice=resolved_voice)
  stream = io.BytesIO()
  async for chunk in communicate.stream():
      if chunk["type"] == "audio":
          stream.write(chunk["data"])
  audio_bytes = stream.getvalue()
  ```
- **Output Format**: High-fidelity MP3 audio stream (`audio/mpeg`).
- **Curated Voice Archetypes & Persona Mapping**:
  | Persona Slug | Neural Voice | Timbre & Tone | Recommended Context |
  |---|---|---|---|
  | `narrator-deep` | `en-US-ChristopherNeural` | Deep, steady, cinematic authoritative | Default for Scene narration & world lore |
  | `protagonist-resolute` | `en-US-GuyNeural` | Grounded, relatable, driven lead | Heroic, determined characters |
  | `inquiring-youth` | `en-US-JennyNeural` | Bright, expressive, curious | Scientists, explorers, young leads |
  | `mentor-sage` | `en-GB-RyanNeural` | Contemplative, British, philosophical | Mentors, elders, historians |
  | `calm-mystic` | `en-GB-SoniaNeural` | Ethereal, melodic, measured cadence | Mystics, spiritual guides, alien voices |
  | `brooding-antagonist` | `en-US-EricNeural` | Intense, sharp, commanding | Antagonists, stern commanders, rivals |

- **Resilient Network Handling**:
  - Configurable synthesis timeout via `EDGETTS_TIMEOUT_SEC` (default 20 seconds).
  - Retry on transient WebSocket or connection errors with exponential backoff.
  - Raises `ProviderUnavailableError` on retry exhaustion to trigger cascade.

### 2.2 Local Kokoro-82M Fallback Strategy (`VOX-01`)
- **Configurable Endpoint**: `KOKORO_ENDPOINT` environment variable (e.g., `http://localhost:8880/v1/audio/speech` for local Kokoro/FastAPI microservice).
- If `KOKORO_ENDPOINT` is unset or unreachable:
  - Immediately raises `ProviderUnavailableError` allowing immediate cascade to Tier 3.
- If configured and reachable:
  - Dispatches HTTP POST with text and voice parameters.

### 2.3 Guaranteed Safe Tier 3 Fallback (`MockVoiceProvider`)
- Synthesizes clean deterministic WAV audio locally (`audio/wav`) with speech-like harmonic frequencies.
- Zero network or GPU requirements, sub-10ms execution, 100% offline reliability.
- Returns consistent metadata payload: `voice_id`, `persona`, `resolved_provider = "mock"`, and `duration_sec`.

### 2.4 3-Tier Fallback Hierarchy Architecture & Consistent Persona Metadata
```
                         ┌─────────────────────────────┐
                         │    CompositeVoiceProvider   │
                         └──────────────┬──────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
       [Tier 1: Cloud]           [Tier 2: Local]        [Tier 3: Offline]
       EdgeTTSProvider     ──▶  KokoroVoiceProvider──▶  MockVoiceProvider
     (Keyless edge-tts)        (Local Kokoro-82M)       (Deterministic WAV)
```
- **Fallback Verification Hierarchy**:
  - Edge TTS fails $\rightarrow$ Kokoro succeeds $\rightarrow$ `resolved_provider = "kokoro"` (assert no 500 error).
  - Edge TTS fails $\rightarrow$ Kokoro fails $\rightarrow$ Mock succeeds $\rightarrow$ `resolved_provider = "mock"` (assert no 500 error).
- **Consistent Persona Metadata Across All Providers**:
  - Regardless of whether Tier 1, Tier 2, or Tier 3 succeeds, each provider must return:
    - `voice_id`: Active voice name
    - `persona`: Active persona slug
    - `resolved_provider`: The provider that actually synthesized the asset (`"edge-tts"`, `"kokoro"`, or `"mock"`)
    - `duration_sec`: Float seconds
  - This ensures the frontend persona badge always remains meaningful and accurate.

### 2.5 Deterministic Script Derivation & Dual Targets (`VOX-02`)
- **Deterministic Spoken Script Rule**:
  - If creator explicitly supplies spoken text in the generation request, **preserve it exactly**. Never silently rewrite or mutate creator-provided text.
  - If spoken text is omitted (or empty), derive the canonical script deterministically:
    - **Target 1: Characters Tab (`UniverseCodexCanvas.tsx` - Tab 2)**:
      - Canonical Character Monologue Template:
        `"I am {name}, {role}. My motivation: {motivation}. My core conflict: {core_conflict}."`
      - Auto-suggests persona based on role/archetype (e.g. Mentor $\rightarrow$ `mentor-sage`, Protagonist $\rightarrow$ `protagonist-resolute`).
    - **Target 2: Story Beats / Scenes Tab (`UniverseCodexCanvas.tsx` - Tab 3)**:
      - Canonical Scene Narration Template:
        `"Scene {scene_number}: {title}. In {location_setting}. {conflict_narrative}. Outcome: {pivotal_outcome}."`
      - Default persona: `narrator-deep`.

### 2.6 Custom Narrative Audio Player Card (`VOX-03`)
- In `MediaPreviewCard.tsx`, replace the raw `<audio>` element with a custom player:
  - Play / Pause button with instant UI state reaction.
  - Interactive scrubbable progress bar with smooth CSS styling, allowing seeking to arbitrary timeline positions (e.g. 50%).
  - Time elapsed / total duration counter (`0:05 / 0:18`).
  - Voice Persona Tag: Displays active persona and resolved neural voice across all provider tiers.
  - Audio Download button: Allows local saving of `.mp3` or `.wav` file.
  - Regenerate voice action with persona dropdown.

---

## 3. Verification & Acceptance Plan
1. **Pytest Integration Tests (`backend/tests/test_voice_generation.py`)**:
   - `test_edgetts_voice_persona_mapping`
   - `test_edgetts_retry_and_backoff_recovery`
   - `test_3_tier_fallback_edgetts_fail_kokoro_success`: Asserts `resolved_provider == "kokoro"`, no unhandled 500 error, and complete metadata (`voice_id`, `persona`, `duration_sec`).
   - `test_3_tier_fallback_edgetts_and_kokoro_fail_mock_success`: Asserts `resolved_provider == "mock"`, no unhandled 500 error, valid WAV binary, and complete metadata (`voice_id`, `persona`, `duration_sec`).
   - `test_deterministic_spoken_script_derivation`: Asserts creator text is never rewritten, and canonical templates are used deterministically when empty.
   - `test_voice_metadata_persistence`: Asserts `voice_id`, `persona`, `duration_sec`, and `resolved_provider` are preserved in database `metadata_json`.
   - `test_voice_api_with_persona_selection`
   - Full regression run of all 94 existing tests.
2. **Playwright E2E Suite (`frontend/e2e/test_phase15_voice_generation.cjs`)**:
   - Scenario 1: Character Voice Generation with persona selection.
   - Scenario 2: Scene Dramatic Voice Narration in Story Beats tab.
   - Scenario 3: Strengthened Custom Narrative Player Card verification:
     - Generate/load voice asset.
     - Click Play $\rightarrow$ verify current playback time advances.
     - Seek approximately to 50% using progress control $\rightarrow$ verify current time updates accordingly.
     - Click Pause $\rightarrow$ verify playback stops.
     - Verify persona badge renders meaningfully and download action triggers.
   - Scenario 4: Database persistence across reload and audio playback from storage.
   - Scenario 5: Fallback resilience under simulated offline/mock mode.
