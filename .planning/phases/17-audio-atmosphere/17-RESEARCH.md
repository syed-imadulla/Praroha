# Phase 17: Audio & Atmosphere (ACE-Step 1.5 / Stable Audio Open) - Research

## Architecture & Technology Research

### 1. Audio Generation Engines & 3-Tier Cascade
- **Tier 1: ACE-Step 1.5 (`ACEStepAudioProvider`)**:
  - State-of-the-art open audio generation architecture optimized for high-fidelity music composition and ambient soundscapes.
  - Dispatched via asynchronous HTTP client to `ACE_STEP_ENDPOINT` (or HuggingFace Inference API).
  - Handles 30-second timeout with non-blocking retry recovery and structured error containment.
- **Tier 2: Stable Audio Open (`StableAudioOpenProvider`)**:
  - Latent diffusion model specialized in generating variable-length stereo sound effects, field recordings, and ambient textures.
  - Dispatched via `STABLE_AUDIO_ENDPOINT` with standardized parameter mapping (`prompt`, `seconds_total`, `steps`).
- **Tier 3: Playable Mock Audio (`MockAudioProvider`)**:
  - Deterministic offline generator in [`backend/app/providers/media/mock.py`](file:///home/syed-imadulla/Desktop/Praroha/backend/app/providers/media/mock.py).
  - Uses `_generate_wav_bytes` to produce authentic RIFF/WAVE PCM audio files with harmonic chord progressions (fundamental frequencies tailored per mood).
  - Decodable by Chromium's Web Audio API and `HTMLMediaElement` without codecs issues (`readyState >= 1`, `duration > 0`, `error === null`).
- **Orchestrator & MIME Preservation Contract: `CompositeAudioProvider`**:
  - Implements Tier 1 $\rightarrow$ Tier 2 $\rightarrow$ Tier 3 fallback cascade.
  - Isolates external provider structures: translates all raw outputs into `MediaPayload` and tags metadata (`resolved_provider`, `mood`, `duration_sec`).
  - **MIME Preservation**: Inspects response `Content-Type` header and binary magic numbers:
    - `b"RIFF" ... b"WAVE"` $\rightarrow$ `audio/wav`, filename `.wav`
    - `b"ID3"` or `\xff[\xfb\xf3\xf2]` $\rightarrow$ `audio/mpeg`, filename `.mp3`
    - Never mislabels MP3 as WAV; persists actual mime type so browser downloads have matching extension.

### 2. Audio Ducking Blocker Set Semantics & Real Element Verification
- **Problem**: Naive booleans (`isDucked: true/false`) cause race conditions when multiple media types play concurrently.
- **Solution: Active Media Blocker Set (`activeMediaBlockers: Set<string>`)**:
  - Blocker IDs are category keys: `"voice"`, `"video"`.
  - `registerMediaBlocker("voice")` is idempotent.
  - Unregistering `"voice"` removes `"voice"`.
  - When Voice ends while Video is still playing, the Set still contains `"video"` (`size > 0`), so ducking remains active.
  - Ducking clears if and only if `Set.size === 0`.
  - **Real Element Inspection**: E2E tests query `audio.volume` directly on the `<audio data-testid="atmosphere-deck-audio-element">` element inside Chromium:
    - Master volume 0.35 $\rightarrow$ ducked volume $\approx 0.07$ ($\pm 0.01$).
    - When all blockers clear $\rightarrow$ restored volume $\approx 0.35$.
    - When `isMuted === true` $\rightarrow$ `audio.volume === 0` (remains 0 after all blockers clear; stored master volume stays 0.35).

### 3. Acoustic Prompt Enrichment & Curated Mood Presets
- When prompt is blank, canonical derivation grounds atmosphere into the universe:
  - **World**: `"{world.title} ambient soundscape. Atmosphere: {world.aesthetic}. {mood_descriptors}. Drone frequencies, textured organic background resonance, immersive 3D acoustic field."`
  - **Scene**: `"Scene atmosphere: {scene.title} in {scene.location_setting}. Tone: {mood}. Dramatic environmental underscore, thematic instrumentation, cinematic background score."`
- Curated Mood Presets:
  1. `serene-ambient` (peaceful harmonic drones, gentle textures)
  2. `tense-dramatic` (pulsing low strings, suspenseful ticking)
  3. `mystic-ethereal` (shimmering reverb, celestial resonance)
  4. `ominous-drone` (dark sub-bass, industrial dissonance)
  5. `epic-orchestral` (sweeping acoustic brass, expansive percussion)

### 4. Non-Regression Scope
- Full pytest suite must pass all 114 existing tests across Phases 1–16 + Phase 17 tests.
- Factory video and audio provider configuration must respect mock and composite environments.
