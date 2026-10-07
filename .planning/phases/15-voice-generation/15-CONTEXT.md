# Phase 15 Context: Voice Generation (Edge TTS / Kokoro-82M)

**Phase Goal**: Integrate a concrete `EdgeTTSProvider` as the primary voice engine for narrative voiceovers without external API keys, backed by a 3-tier fallback hierarchy (Edge TTS $\rightarrow$ Local Kokoro-82M $\rightarrow$ MockVoiceProvider), curated voice archetypes with automatic persona suggestion and manual override, dual generation targets (Character vocal introductions in Characters tab and dramatic scene narration in Story Beats tab), and a custom interactive narrative audio player card.

---

## 1. Locked Decisions & Implementation Scope

### D-01: Concrete `EdgeTTSProvider` Implementation (`VOX-01`)
- **Primary Generator**:
  - Python asynchronous library `edge-tts` (`import edge_tts`).
  - Generates realistic, natural human speech without requiring any third-party API keys or external billing.
  - Generates binary `audio/mpeg` (MP3) stream encapsulated in `MediaPayload`.
- **Curated Voice Archetypes & Persona Mapping**:
  - Curated roster of 6 high-quality neural voices with distinct dramatic timbres:
    1. `narrator-deep`: `en-US-ChristopherNeural` (Deep, cinematic, steady narrative voice).
    2. `protagonist-resolute`: `en-US-GuyNeural` (Determined, grounded, relatable lead).
    3. `inquiring-youth`: `en-US-JennyNeural` (Expressive, bright, curious explorer).
    4. `mentor-sage`: `en-GB-RyanNeural` (Wise, British contemplative guide).
    5. `calm-mystic`: `en-GB-SoniaNeural` (Ethereal, measured, mysterious tone).
    6. `brooding-antagonist`: `en-US-EricNeural` (Intense, sharp, commanding presence).
  - Voice selection supports both curated persona slugs (`narrator-deep`) and direct Edge-TTS voice names (`en-US-ChristopherNeural`).
- **Resilient Network Handling**:
  - Configurable synthesis timeout (default 20 seconds, configurable via `EDGETTS_TIMEOUT_SEC`).
  - Retry with exponential backoff on transient connection failures.
  - Raises `ProviderUnavailableError` upon retry exhaustion to trigger clean cascade to Tier 2/3.

### D-02: 3-Tier Voice Provider Fallback Hierarchy (`VOX-01`)
- **Tier 1 (Primary Cloud)**: `EdgeTTSProvider` — Free, keyless neural cloud speech synthesis.
- **Tier 2 (Local)**: `KokoroVoiceProvider` — Dispatches to local Kokoro-82M inference HTTP microservice if `KOKORO_ENDPOINT` is configured; skips immediately to Tier 3 if unset or unreachable.
- **Tier 3 (Guaranteed Offline)**: `MockVoiceProvider` — Synthesizes deterministic local WAV speech audio with zero external dependencies.
- **Orchestration & Verification Hierarchy**:
  - Implemented in `CompositeVoiceProvider` adhering to `VoiceProvider` abstract interface.
  - Tiered fallback execution flow:
    1. Edge TTS fails $\rightarrow$ Kokoro succeeds $\rightarrow$ `resolved_provider = "kokoro"` (no unhandled 500).
    2. Edge TTS fails $\rightarrow$ Kokoro fails $\rightarrow$ Mock succeeds $\rightarrow$ `resolved_provider = "mock"` (no unhandled 500).
  - Client never receives an unhandled 500 error for voice generation failure; Mock is the guaranteed final fallback.
- **Consistent Persona Metadata Across All Providers**:
  - All three providers (`EdgeTTSProvider`, `KokoroVoiceProvider`, and `MockVoiceProvider`) MUST return consistent payload metadata:
    - `voice_id`: active voice identifier (e.g. `en-US-ChristopherNeural` or `mock-voice`)
    - `persona`: active persona slug (e.g. `narrator-deep`)
    - `resolved_provider`: provider that actually synthesized the asset (`"edge-tts"`, `"kokoro"`, or `"mock"`)
    - `duration_sec`: estimated or actual audio duration in seconds
  - This guarantees the frontend persona badge remains meaningful and accurate regardless of which provider tier succeeds.

### D-03: Dual Voice Generation Targets & Deterministic Script Derivation (`VOX-02`)
- **Deterministic Spoken Script Rule**:
  - If the creator explicitly supplies spoken text in the generation request, **preserve it exactly**. Never silently rewrite or mutate creator-provided spoken text.
  - If spoken text is not explicitly supplied (or is empty), derive the canonical spoken script from entity fields using deterministic templates:
    - **Target 1: Characters Tab (`UniverseCodexCanvas.tsx` - Tab 2)**:
      - Canonical Character Monologue Template:
        `"I am {name}, {role}. My motivation: {motivation}. My core conflict: {core_conflict}."`
      - Automatic persona suggestion maps character archetype/role to voice persona (e.g. Mentor $\rightarrow$ `mentor-sage`, Protagonist $\rightarrow$ `protagonist-resolute`, Inquirer $\rightarrow$ `inquiring-youth`, Mystic $\rightarrow$ `calm-mystic`, Antagonist $\rightarrow$ `brooding-antagonist`).
    - **Target 2: Scenes / Story Beats Tab (`UniverseCodexCanvas.tsx` - Tab 3)**:
      - Canonical Scene Narration Template:
        `"Scene {scene_number}: {title}. In {location_setting}. {conflict_narrative}. Outcome: {pivotal_outcome}."`
      - Default persona: `narrator-deep`.

### D-04: Audio Storage & Relational Metadata Tracking (`VOX-02`)
- **Persistent Storage**:
  - Audio binaries uploaded via `StorageProvider` (Supabase Cloud Storage bucket `seed-unfold-assets/media/voice/...` or local storage `/uploads/media/voice/...`).
  - Public/signed URL attached to `MediaAssetRecord.asset_url`.
- **Relational Metadata**:
  - Table: `media_assets`.
  - Stored fields: `id`, `project_id`, `entity_type` (`character`, `scene`), `entity_id`, `media_type = 'voice'`, `status`, `asset_url`, `mime_type` (`audio/mpeg` or `audio/wav`), `prompt` (spoken text), `provider_name`, `completed_at`.
  - `metadata_json` persists consistent voice metadata across all tiers: `voice_id`, `persona`, `duration_sec`, and `resolved_provider`.

### D-05: Custom Narrative Player Card & Audio UX (`VOX-03`)
- **Interactive Audio Player Card in `MediaPreviewCard.tsx`**:
  - Replaces default raw `<audio>` tag with a polished narrative audio card matching calm dark aesthetics:
    - Play / Pause toggle button with instantaneous playback state.
    - Animated audio soundwave / seekable progress slider allowing scrub/seek to arbitrary positions (e.g. 50%).
    - Time display: current time and total audio duration (`0:04 / 0:12`).
    - Voice persona badge displaying meaningful persona across all provider tiers.
    - Audio download action button.
- **Voice Selection Dropdown in `EntityMediaSection.tsx`**:
  - Compact dropdown allowing creator to preview and switch between the 6 curated voice archetypes prior to generation.
  - Automatically pre-selects recommended archetype based on entity type and character role.

---

## 2. Verification & Acceptance Criteria

1. **Backend Unit & Integration Tests (`backend/tests/test_voice_generation.py`)**:
   - `test_edgetts_voice_persona_mapping`: Validates all 6 voice personas resolve to valid neural voices.
   - `test_edgetts_retry_and_backoff`: Simulates transient network failure and validates retry recovery.
   - `test_3_tier_fallback_edgetts_fail_kokoro_success`: Simulates Edge TTS failure $\rightarrow$ Kokoro succeeds $\rightarrow$ asserts `resolved_provider == "kokoro"`, no unhandled 500 error, and complete metadata (`voice_id`, `persona`, `duration_sec`).
   - `test_3_tier_fallback_edgetts_and_kokoro_fail_mock_success`: Simulates Edge TTS and Kokoro failure $\rightarrow$ Mock succeeds $\rightarrow$ asserts `resolved_provider == "mock"`, valid WAV binary, zero 500 errors, and complete metadata (`voice_id`, `persona`, `duration_sec`).
   - `test_deterministic_spoken_script_derivation`: Verifies creator-supplied text is preserved exactly without rewriting, and canonical templates are used deterministically when empty.
   - `test_voice_metadata_persistence`: Generates voice and validates database record preserves `voice_id`, `provider_name`, `metadata_json`, `prompt`, `asset_url`.
   - `test_voice_api_endpoints`: Verifies REST API invocation with `voice_id` parameter.
   - Full regression run: all existing backend tests continue to pass.

2. **Frontend Build & Playwright E2E Verification (`frontend/e2e/test_phase15_voice_generation.cjs`)**:
   - `npm run build --prefix frontend` builds with zero TypeScript errors.
   - Playwright test covering:
     - Scenario 1: Character Voice Generation with persona selector (select persona, generate, verify audio asset).
     - Scenario 2: Scene Dramatic Narration Generation in Story Beats tab.
     - Scenario 3: Strengthened Custom Narrative Player Card verification:
       - Generate/load voice asset.
       - Click Play $\rightarrow$ verify current playback time advances.
       - Seek approximately to 50% using progress control $\rightarrow$ verify current time updates accordingly.
       - Click Pause $\rightarrow$ verify playback stops.
       - Verify persona badge renders meaningfully and download action triggers.
     - Scenario 4: Database Persistence across reload (audio record loads directly from database and plays).
     - Scenario 5: 3-Tier Fallback resilience under simulated offline/mock mode (asserts no UI crashes and persona badge renders).
   - Capture visual artifact screenshots for all scenarios to the brain directory.

---

## 3. Downstream Compatibility
- **Phase 16 (Video Generation)**: Can pair generated scene voiceovers with Pyramid Flow / Wan2.1 video clips for synchronized multimedia storytelling.
- **Phase 17 (Audio & Atmosphere)**: Ambient soundscapes can play in tandem with narration voice tracks with balanced audio mixing.
