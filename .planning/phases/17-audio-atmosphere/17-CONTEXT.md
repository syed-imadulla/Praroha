# Phase 17: Audio & Atmosphere (ACE-Step 1.5 / Stable Audio Open) - Context & Decisions

## Executive Summary
Phase 17 completes the generative media suite of **Seed Unfold (Praroha)** by introducing the **Audio & Atmosphere Engine**. Creators can synthesize immersive ambient soundscapes for Worlds and dramatic narrative underscores for Scenes, preview and scrub them in rich in-card players, download WAV/MP3 files, and stream ambient atmosphere persistently across the entire Universe Codex workspace via a docked **Global Atmosphere Deck** with smart audio ducking when voice narrations or video clips play.

---

## Locked Architectural Decisions

### D-01: 3-Tier Audio Provider Cascade Hierarchy (`AUD-01`)
1. **Tier 1 (Cloud / Microservice)**: `ACEStepAudioProvider`
   - Primary engine utilizing ACE-Step 1.5 architecture for high-fidelity ambient soundscapes and background audio composition.
   - Configured via `ACE_STEP_ENDPOINT` (or HuggingFace Inference API).
   - 30-second timeout, transient network retries with exponential backoff, and graceful error containment.
2. **Tier 2 (Local / Secondary Fallback)**: `StableAudioOpenProvider`
   - Practical alternative utilizing Stable Audio Open for ambient rhythm and sound texture generation.
   - Configured via `STABLE_AUDIO_ENDPOINT` with standardized parameter mapping.
3. **Tier 3 (Offline Deterministic Mock Fallback)**: `MockAudioProvider`
   - Fallback of last resort when cloud endpoints or local GPUs are offline.
   - Produces a **genuine browser-playable WAV audio container** with harmonic sine/chord structures, ensuring valid header formatting and playability.
4. **Orchestrator & MIME Preservation Contract**: `CompositeAudioProvider`
   - Orchestrates Tier 1 $\rightarrow$ Tier 2 $\rightarrow$ Tier 3 cascade in [`backend/app/providers/media/composite_audio.py`](file:///home/syed-imadulla/Desktop/Praroha/backend/app/providers/media/composite_audio.py).
   - **Preserve Actual Supported Audio MIME Types**:
     - Do NOT unconditionally hardcode `mime_type="audio/wav"`.
     - In both `ACEStepAudioProvider` and `StableAudioOpenProvider`, inspect provider response headers and binary payload headers (e.g. `RIFF...WAVE` $\rightarrow$ `audio/wav` / `.wav`, `ID3` or `\xff\xfb` sync words $\rightarrow$ `audio/mpeg` / `.mp3`).
     - Never label MP3 bytes as WAV.
     - Persist the actual `mime_type` in `media_assets` and ensure the frontend download action uses the matching file extension (`.wav` vs `.mp3`).
   - Enforces strict response isolation: external vendor schemas are normalized into internal `MediaPayload` and never leak into `MediaService`, database records, or frontend clients.

### D-02: Multi-Entity Generation Targets & Modal Controls (`AUD-01`, `AUD-02`)
- **World Cover / Bible Section**: Generates the **Global World Ambient Soundscape** (e.g., deep abyssal drones, bioluminescent chimes, whispering crystalline winds).
- **Scene Cards (Story Beats)**: Generates **Dramatic Narrative Atmosphere / Underscore** grounded in the specific scene's conflict, location setting, and pivotal dramatic stakes.
- **EntityMediaSection**: Add `'audio'` modality selector to World Cover alongside `'image'` and `'video'`, enabling 3 modalities on Worlds and all 4 modalities on Scenes.

### D-03: Canonical Acoustic Prompt & Mood Presets Derivation (`AUD-01`)
- **Explicit Creator Prompt**: If the creator provides custom prompt text, it is strictly preserved without mutation or overwrite.
- **Deterministic Canonical Derivation** (when creator prompt is empty):
  - **World Atmosphere**:
    `"{world.title} ambient soundscape. Atmosphere: {world.aesthetic}. {mood_description}. Drone frequencies, textured organic background resonance, immersive 3D acoustic field."`
  - **Scene Atmosphere**:
    `"Scene atmosphere: {scene.title} in {scene.location_setting}. Tone: {mood}. Dramatic environmental underscore, thematic instrumentation, cinematic background score."`
- **5 Curated Acoustic Mood Archetypes**:
  1. `serene-ambient`: "Serene Ambient" (peaceful harmonic drones, gentle textures)
  2. `tense-dramatic`: "Tense Dramatic" (pulsing low strings, suspenseful ticking)
  3. `mystic-ethereal`: "Mystic Ethereal" (shimmering reverb, celestial resonance)
  4. `ominous-drone`: "Ominous Drone" (dark sub-bass, industrial dissonance)
  5. `epic-orchestral`: "Epic Orchestral" (sweeping acoustic brass, expansive percussion)

### D-04: Dual Frontend Playback Experience (`AUD-02`)
1. **In-Card Atmosphere Player** in [`MediaPreviewCard.tsx`](file:///home/syed-imadulla/Desktop/Praroha/frontend/src/components/MediaPreviewCard.tsx):
   - Transport controls: Play/Pause toggle (`data-testid="media-audio-play-pause-btn"`), time tracker (`data-testid="media-audio-time"`), scrubbable progress bar (`data-testid="media-audio-progress"`).
   - In-card volume slider (`data-testid="media-audio-volume"`).
   - Badges: Mood badge (`data-testid="media-audio-mood-badge"`), Provider badge (`data-testid="media-audio-provider-badge"`: `resolved_provider • mood • duration_sec`).
   - Direct download button (`data-testid="media-audio-download-btn"`).
   - Quick action: "Send to Atmosphere Deck" (`data-testid="media-audio-send-to-deck-btn"`).
2. **Persistent Global Atmosphere Deck** (`AtmosphereDeck.tsx`):
   - Docked persistent bar at the bottom of the Universe Codex workspace.
   - Allows ambient soundscapes to play continuously across all tabs (World Bible, Characters, Story Beats, Origin Ledger, Inspector).
   - Provides global track title, entity link, master volume slider (`data-testid="atmosphere-deck-volume"`), mute button, and dismiss control (`data-testid="close-atmosphere-deck"`).

### D-05: Smart Audio Ducking & Multi-Modal Harmonization (`AUD-02`, `AUD-03`)
1. **Shared Media Blocker Set Semantics (`Set<string>`)**:
   - Audio ducking is managed in the client store via an active media category set: `activeMediaBlockers: Set<string>`.
   - Distinct media categories register and unregister:
     - Voice narration active (`media-voice-player`) $\rightarrow$ `registerMediaBlocker("voice")` (idempotent).
     - Video clip active (`media-video-player` / `lightbox-video-player`) $\rightarrow$ `registerMediaBlocker("video")` (idempotent).
   - Unregistering a category (`unregisterMediaBlocker("voice")` or `"video"`) removes that category when no longer active.
   - **Resolution Rules**:
     - `blockers.size === 0`: Atmosphere Deck plays at user master volume.
     - `blockers.size >= 1`: Atmosphere Deck ducks to 20% of user master volume.
     - **Multi-Stream Hand-off Guarantee**:
       - Voice ending while Video remains active keeps `"video"` in the Set $\rightarrow$ atmosphere **MUST remain ducked**.
       - Video ending while Voice remains active keeps `"voice"` in the Set $\rightarrow$ atmosphere **MUST remain ducked**.
       - Ducking clears **only when `blockers.size === 0`**.
2. **Preservation of Manual User Intent**:
   - **User Master Volume Invariance**: Ducking calculates effective volume dynamically without modifying the stored master-volume preference (`atmosphereMasterVolume`).
   - **Exact Volume Restoration**: When blockers clear, atmosphere restores strictly to the creator's chosen volume (e.g., if set to 35% / 0.35, it returns to 0.35, never defaulting to 1.0).
   - **Mute State Immutability**: If the creator muted the deck (`isAtmosphereMuted === true`), the deck remains muted after all blockers finish—ducking restoration **never automatically unmutes**.
   - Formula:
     $$\text{effectiveVolume} = \begin{cases} 0 & \text{if } \text{isAtmosphereMuted} \\ \text{atmosphereMasterVolume} \times 0.2 & \text{if } \text{activeMediaBlockers.size} > 0 \\ \text{atmosphereMasterVolume} & \text{otherwise} \end{cases}$$

### D-06: Verification & Non-Regression Standards
1. **Playable Mock Audio**: `MockAudioProvider` outputs genuine browser-playable WAV audio bytes. E2E tests evaluate Chromium `HTMLMediaElement` properties directly (`audio.readyState >= 1`, `duration > 0`, `error === null`).
2. **Real Audio Element Ducking & Blocker Set E2E Verification**:
   - Automated scenario inspects the actual `audio.volume` on `document.querySelector('[data-testid="atmosphere-deck-audio-element"]')` (with floating-point tolerance $\pm 0.01$):
     1. With master volume = 0.35, 0 blockers $\rightarrow$ `audio.volume ≈ 0.35`.
     2. Voice narration starts $\rightarrow$ `audio.volume ≈ 0.07` (0.35 * 0.20).
     3. Video playback starts while Voice is still active $\rightarrow$ `audio.volume ≈ 0.07` (remains ducked).
     4. Voice narration ends while Video remains active $\rightarrow$ `audio.volume ≈ 0.07` (remains ducked).
     5. Video playback ends $\rightarrow$ `audio.volume ≈ 0.35` (restores previous volume, not 1.0).
     6. Manual mute toggled (`isMuted=true`) $\rightarrow$ `audio.volume === 0`.
     7. Voice starts and ends while muted $\rightarrow$ `audio.volume` remains 0; stored master volume remains 0.35.
3. **MIME Type Preservation Unit Test**:
   - Backend test verifies `ACEStepAudioProvider` and `StableAudioOpenProvider` normalize responses while preserving actual MIME type (`audio/wav` vs `audio/mpeg`), never mislabeling MP3 as WAV.
4. **Zero Regressions**: Pytest suite must pass all 114 existing tests + new Phase 17 audio tests with zero failures.
5. **Frontend Production Build**: Clean `tsc && vite build` with zero TypeScript or bundling errors.
6. **Full E2E Coverage**: 5 automated Playwright scenarios covering World soundscapes, Scene underscores, custom prompts, real audio ducking & intent invariance, and 3-tier cascade resilience.

---

## Success Criteria Checklist
- [ ] `ACEStepAudioProvider` implemented with 30s timeout and error containment.
- [ ] `StableAudioOpenProvider` implemented with standard parameter translation.
- [ ] `MockAudioProvider` generates browser-playable WAV bytes with proper metadata (`resolved_provider="mock"`).
- [ ] `CompositeAudioProvider` coordinates 3-tier cascade and isolates responses into `MediaPayload`.
- [ ] Canonical acoustic prompt derivation and 5 mood presets integrated in `media_service.py`.
- [ ] In-card audio player with volume, progress, and download controls in `MediaPreviewCard.tsx`.
- [ ] Docked persistent `AtmosphereDeck.tsx` with cross-tab playback and shared reference-counted ducking.
- [ ] Atmosphere Deck ducking maintains reference-counted blocker set (`voice`, `video`) and strictly restores custom master volume without unmuting manual mutes.
- [ ] All 114 prior tests + new Phase 17 tests pass in Pytest (0 regressions).
- [ ] Playwright E2E suite passes all 5 scenarios including multi-blocker ducking and Chromium media element evaluation.
