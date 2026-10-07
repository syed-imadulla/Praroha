---
gsd_state_version: '1.0'
milestone: 'Milestone 2: Semantic Intelligence + Generative Media'
status: in_progress
progress:
  total_phases: 20
  completed_phases: 19
  total_plans: 38
  completed_plans: 38
  percent: 95.00
---

# Project State: Seed Unfold (Praroha)

## Project Reference

See: [.planning/PROJECT.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/PROJECT.md) (updated 2026-10-07)

**Core value:** One incomplete seed becomes structured intent, reveals inferred possibilities, branches into three divergent worlds, empowers human decision, and progressively unfolds into a coherent, persistent, and traceable mini-universe with generative media and counterfactual mutation capabilities.  
**Current focus:** Milestone 2: Semantic Intelligence + Generative Media (Phase 19 Counterfactual Replay Completed; Next: Phase 20 Human-Only Zones)

## Current Position

Phase: 19 of 20 (Counterfactual Replay) — 100% Completed & Verified (2 Waves)
Milestone 1 (Phases 1–8): 100% Completed & Verified (53 backend tests, 16 E2E tests, clean frontend build).
Phase 9 (Seed Potential Map): 100% Completed & Verified (59 backend tests, 4 E2E scenarios, 3 visual proofs).
Phase 10 (Divergence Engine): 100% Completed & Verified (65 backend tests, 4 E2E scenarios, 3 visual proofs).
Phase 11 (Decision DNA): 100% Completed & Verified (71 backend tests, 5 E2E scenarios, 3 visual proofs).
Phase 12 (Origin Ledger): 100% Completed & Verified (77 backend tests, 5 E2E scenarios, 5 visual proofs).
Phase 13 (Media Provider Architecture): 100% Completed & Verified (86 backend tests, 5 E2E scenarios, 5 visual proofs).
Phase 14 (Image Generation): 100% Completed & Verified (94 backend tests, 6 E2E scenarios, 6 visual proofs).
Phase 15 (Voice Generation): 100% Completed & Verified (102 backend tests, 5 E2E scenarios, 5 visual proofs).
Phase 16 (Video Generation): 100% Completed & Verified (114 backend tests, 5 E2E scenarios, genuine playable browser MP4 mock verified).
Phase 17 (Audio & Atmosphere): 100% Completed & Verified (125 backend tests, 5 E2E scenarios, 4 visual proofs, real DOM audio.volume ducking verified).
Phase 18 (Seed Mutation Lab): 100% Completed & Verified (138 backend tests, 5 E2E scenarios, 2 visual proofs, parent branch immutability verified).
Phase 19 (Counterfactual Replay): 100% Completed & Verified (146 backend tests, 5 E2E scenarios, 2 visual proofs, parent branch immutability verified).
Status: Phase 19 executed and verified. Ready for Phase 20 planning.
Last activity: 2026-10-08 — Phase 19 completed with rejected candidate extraction, instant deterministic delta generation with AI semantic projection fallback, 50/50 dual-column comparative matrix, 4 divergence delta cards (protagonist, tone, conflict, lore), exploration profile divergence meters, actionable timeline branching with `counterfactual_metadata_json` persistence, and 100% parent branch immutability.

Progress: [██████████] 95.0%

## Performance Metrics

**Milestone 1 & 2 Performance:**
- Total plans completed: 38 (across 19 phases)
- Backend tests passing: 146/146 (0 regressions across Phases 1–19)
- E2E scenarios passing: 70/70
- Zero-error demo hydration: < 500ms

**By Phase:**

| Phase | Status | Milestone |
|---|---|---|
| Phase 1: Foundation / Project Shell | complete | Milestone 1 |
| Phase 2: Seed Understanding + Seed DNA | complete | Milestone 1 |
| Phase 3: Three World Generation | complete | Milestone 1 |
| Phase 4: Human World Selection | complete | Milestone 1 |
| Phase 5: Progressive World Unfolding | complete | Milestone 1 |
| Phase 6: Traceability / Provenance | complete | Milestone 1 |
| Phase 7: Refine / Branch / Save | complete | Milestone 1 |
| Phase 8: Polish / Reliability / Demo | complete | Milestone 1 |
| Phase 9: Seed Potential Map | complete | Milestone 2 |
| Phase 10: Divergence Engine | complete | Milestone 2 |
| Phase 11: Decision DNA | complete | Milestone 2 |
| Phase 12: Origin Ledger | complete | Milestone 2 |
| Phase 13: Media Provider Architecture | complete | Milestone 2 |
| Phase 14: Image Generation (Pollinations / FLUX) | complete | Milestone 2 |
| Phase 15: Voice Generation (Edge TTS / Kokoro) | complete | Milestone 2 |
| Phase 16: Video Generation (Pyramid Flow / Wan2.1) | complete | Milestone 2 |
| Phase 17: Audio & Atmosphere (ACE-Step 1.5 / Stable Audio) | complete | Milestone 2 |
| Phase 18: Seed Mutation Lab | complete | Milestone 2 |
| Phase 19: Counterfactual Replay | complete | Milestone 2 |
| Phase 20: Human-Only Zones | pending | Milestone 2 |

## Accumulated Context

### Architectural & Product Decisions
- **React + Vite + TypeScript**: Rapid frontend build velocity, strong typing, and rich animation support.
- **FastAPI + SQLModel + Pydantic v2**: High-performance async backend and strict schema validation of all AI outputs.
- **Provider Abstraction**: Model access decoupled behind `AIProvider` (Gemini 3.5 Flash default, MockProvider fallback).
- **PostgreSQL / Supabase Persistence**: Supabase Session Pooler in cloud mode; SQLite fallback locally.
- **Cloud Object Storage (`StorageProvider`)**: Supabase Storage for binary assets with local filesystem fallback (`./uploads`).
- **Traceability / Provenance DAG**: Relational DAG modeling parent-child provenance without external graph database.
- **Deterministic Canonical Demo**: Pre-compiled fixture (*"A child discovers a forgotten city beneath the ocean"*) for sub-second demo resilience.
- **Non-blocking Media Architecture**: Media generation (images, voice, video, audio) is strictly progressive enhancement. Media failure never blocks core universe generation.
- **Image Generation Engine (Phase 14)**: Pollinations as zero-key primary with FLUX.1 schnell fallback, multi-aspect ratio (1:1, 16:9, 9:16), Seed DNA visual prompt enrichment, and interactive lightbox modal.
- **Voice Generation Engine (Phase 15)**: 3-tier fallback hierarchy (Edge TTS -> Kokoro -> Mock) with 6 curated archetypes, consistent metadata (`voice_id`, `persona`, `resolved_provider`, `duration_sec`), deterministic script derivation (preserving creator text, canonical templates when empty), and custom narrative audio player with scrubbing/seek bar, time tracker, and 1-click script copy.
- **Video Generation Engine (Phase 16)**: 3-tier fallback hierarchy (Pyramid Flow -> Wan2.1 -> Playable Mock MP4) with cinematic motion prompts, video player with scrubbing, `VideoLightboxModal`, and browser-playable MP4 container verification.
- **Audio & Atmosphere Engine (Phase 17)**: 3-tier fallback cascade (`ACEStepAudioProvider` -> `StableAudioOpenProvider` -> `MockAudioProvider`) with actual MIME preservation (`audio/wav` vs `audio/mpeg`), canonical acoustic derivation, docked `AtmosphereDeck` with reactive HTML5 audio element, multi-stream blocker set (`Set<string>`) smart ducking to 20% with manual intent invariance (preserving custom volume e.g. 0.35 and mute state), and verified real `audio.volume` DOM changes.
- **Seed Mutation Lab (Phase 18)**: 4-variable premise extraction (`core_premise`, `tone_atmosphere`, `central_conflict`, `world_rule`), 3-tier lineage-first causal impact simulation (`AFFECTED`, `CONDITIONAL`, `PRESERVED`), interactive SVG Causal Diff DAG with status halos and detail panel, isolated branch creation via `PersistenceService.branch_project` with project-level `mutation_metadata_json` persistence, and parent immutability verification.
- **Counterfactual Replay Engine (Phase 19)**: Candidate extraction filtering out committed world, deterministic baseline delta derivation across 4 dimensions (protagonist, tone, conflict, lore) with AI semantic enrichment fallback, exploration profile metric comparisons (seed fidelity, novelty, distance, feasibility), 50/50 dual-column side-by-side comparative matrix, 4 divergence delta cards, actionable timeline branching with `counterfactual_metadata_json` persistence, and 100% parent canon immutability.
- **Decision DNA Creative Contract**: World selection captures rationale, priorities, and rejected directions, persisted relationally and injected as an immutable creative constraint into downstream unfolding without CoT leakage.
- **No Chain-of-Thought Leakage**: Origin and causal explanations use stored metadata and clean narrative justifications, never raw LLM reasoning tokens.

### Next Action
Ready to discuss and plan Phase 20: Human-Only Zones (`/gsd-discuss-phase 20`).

---
*Updated: 2026-10-08 after Phase 19 execution*
