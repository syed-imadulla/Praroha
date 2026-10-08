---
gsd_state_version: '1.0'
milestone: 'Milestone 3: Complete UI Upgrade'
status: in_progress
progress:
  total_phases: 32
  completed_phases: 26
  total_plans: 64
  completed_plans: 46
  percent: 71.88
---

# Project State: Seed Unfold (Praroha)

## Project Reference

See: [.planning/PROJECT.md](file:///home/syed-imadulla/Desktop/Praroha/.planning/PROJECT.md) (updated 2026-10-08)

**Core value:** One incomplete seed becomes structured intent, reveals inferred possibilities, branches into three divergent worlds, empowers human decision, and progressively unfolds into a coherent, persistent, and traceable mini-universe with generative media, counterfactual mutation, and creator-locked human-only zones.  
**Current focus:** Milestone 3: Complete UI Upgrade (Phase 29: Secondary UI + Typography + Visibility Polish Complete)

## Current Position

Phase: 29 Secondary UI + Typography + Visibility Polish — 100% Completed & Verified!
Milestone 1 (Phases 1–8): 100% Completed & Verified (53 backend tests, 16 E2E tests, clean frontend build).
Milestone 2 (Phases 9–20): 100% Completed & Verified (154 backend tests, 77 E2E scenarios, all engines verified).
Milestone 3 UI Refinement & Polish Achievements:
- Phase 21–24: Design System Foundation, Global App Shell, Home Screen, and Canonical `CreationCard` component system.
- Phase 28 (Botanical Workspace): 100% reskinned Stages 4 (Choose & Decision DNA), 5 (Unfold Codex), 6 (Traceability DAG), and 7 (Refine & Mutation Lab & Counterfactual Replay). Zero residual dark cyber elements.
- Phase 29 (Secondary UI & Typography Polish):
  - Standardized typography scale: Headings Cormorant Garamond (20–36px), UI controls Inter (14–15px), body Inter (14–16px), metadata Inter/mono (12–13px min).
  - Absolute elimination of all text under 12px: 0 occurrences of `text-[9px]` or `text-[10px]` across `frontend/src`.
  - Contrast elevation: Replaced faint `/40` and `/50` opacities with solid botanical tokens (`#294B3A`, `#394840`, `#5F6D63`).
  - Touch targets: Minimum 44px hit bounds on primary actions and modal close buttons (`w-11 h-11`); minimum 32–38px for inline chips and tools.
  - Secondary UI components: Upgraded `OriginBadge`, `TopBar`, `StageProgressHeader`, `InspectorDrawer`, `WhyIsThisHereModal`, `RefinementModal`, `KeyboardShortcutsModal`, `GuidedTourOverlay`, `AtmosphereDeck`, and lightboxes.
  - Multi-viewport stability: Zero horizontal page overflow verified across 1440px desktop, 1024px tablet, and 390px mobile viewports.
Status: Phase 29 Complete & Verified (154 backend tests passing, `test_phase29_ui_polish.cjs` passing 100%, clean production build).
Last activity: 2026-10-08 — Completed Phase 29 Secondary UI, Typography & Visibility Polish Pass with zero backend changes and zero functional compromises.

Progress: [██████████] 100.0%

## Performance Metrics

**Milestone 1 & 2 Performance:**
- Total plans completed: 40 (across 20 phases)
- Backend tests passing: 154/154 (0 regressions across Phases 1–20)
- E2E scenarios passing: 77/77
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
| Phase 20: Human-Only Zones | complete | Milestone 2 |
| Phase 21: Design System Foundation | complete | Milestone 3 |
| Phase 22: Global App Shell | complete | Milestone 3 |
| Phase 23: Home Screen | complete | Milestone 3 |
| Phase 24: Creation Component System | complete | Milestone 3 |
| Phase 28: Seed → Universe Workspace | complete | Milestone 3 |
| Phase 29: Secondary UI Polish | complete | Milestone 3 |

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
- **Human-Only Zones Engine (Phase 20)**: Creator-locked creative guardrails for 3 inviolable zones (`core_theme`, `protagonist_motivation`, `central_conflict`) in Stage 4 selection. Dual-layer defense combines prompt invariance contract (`=== IMMUTABLE HUMAN-ONLY ZONES (CREATOR LOCKS) ===` with zero-override directive) and deterministic backend schema guard (`enforce_human_only_zones_guard`) restoring exact locked strings into canon facts, characters, and scenes if AI drifts. Origin stamped as `HUMAN_DECISION` across Decision DNA, Origin Ledger, Causal Lineage DAG, and "Why is this here?" modal banner.
- **Decision DNA Creative Contract**: World selection captures rationale, priorities, and rejected directions, persisted relationally and injected as an immutable creative constraint into downstream unfolding without CoT leakage.
- **No Chain-of-Thought Leakage**: Origin and causal explanations use stored metadata and clean narrative justifications, never raw LLM reasoning tokens.

### Next Action
Milestone 2 is 100% complete! Run milestone audit or prepare for next development cycle.

---
*Updated: 2026-10-08 after Phase 20 execution*
