# Seed Unfold (Praroha)

## What This Is

Seed Unfold is an AI-powered creative development workspace that transforms a single, incomplete idea or prompt (the "seed") into structured intent, generates exactly three distinct creative solution worlds, empowers the human user to choose a direction, and progressively unfolds the selected world into a coherent, persistent, and traceable mini-universe. Built around the philosophical theme *Tattva 2: Forms Hidden in the Formless*, it surfaces latent creative potential while maintaining strict parent-child lineage and explainability from the final artifacts back to the root seed.

## Core Value

One incomplete seed becomes structured intent, exactly three distinct creative worlds, a human-selected direction, and then a coherent persistent mini-universe whose evolution can be inspected and traced.

## Business & Hackathon Context

- **Customer / User**: Writers, game designers, filmmakers, hackathon builders, and creative technologists moving from ambiguity to concrete, buildable worlds.
- **Product Metaphor**: A creative ideation IDE (not a chatbot; not an unguided text generator).
- **Core Loop (Milestone 1 MVP)**: Seed → Understanding → Seed DNA → Exactly 3 Worlds → Human Choice → Selected World → Progressive Unfolding (World Bible, Characters, Relationships, Scenes, Assets) → Traceability → Refine / Branch → Save / Load.
- **Evolved Core Loop (Milestone 2)**: Seed → Seed Potential → Divergent Worlds → Human Decision (Decision DNA) → Universe → Origin Ledger → Media (Image, Voice, Video, Audio) → Mutation Lab → Counterfactual Replay.
- **Theme Alignment**: *Tattva 2: Forms Hidden in the Formless*. The seed is formless potential; the Seed Potential Map surfaces explicit vs inferred vs open possibilities; Divergent Worlds explore distinct possibility regions; human decision anchors the path; progressive unfolding manifests the world; the Origin Ledger traces causal genesis; and the Mutation Lab proves how changes to the root seed propagate downstream.

## Milestone Status

### Milestone 1: Core MVP (Completed & Verified)
- [x] Permanent project rules defined in `PROJECT_RULES.md`
- [x] Documentation organized into `docs/` (`product/`, `architecture/`, `decisions/`, `presentation/`, `wiki/`)
- [x] GSD planning and state management initialized
- [x] Graphify knowledge graph integration configured
- [x] Interactive, calm dark workspace UI centered on progressive unfolding
- [x] Seed input ingestion with validation, input tips, and pre-seeded demo fixtures
- [x] Understanding stage extracting structured, canonical Seed DNA (premise, themes, entities, constraints, tone, domain keywords)
- [x] Branching engine generating exactly three meaningfully distinct solution/creative worlds
- [x] Human selection gate for side-by-side world comparison, trade-off review, and explicit choice
- [x] Progressive unfolding engine generating World Bible, Characters, Relationships, and Scenes
- [x] Traceability engine recording and displaying DAG parent-child lineage without exposing internal model chain-of-thought
- [x] Project persistence (saving/loading seeds, DNA, chosen worlds, unfolded universes, and lineage DAGs)
- [x] Refine (localized iteration) and Branch (timeline forking) controls
- [x] Deterministic demo fallback mode using the canonical underwater city fixtures for 100% demo resilience
- [x] Full test verification: 53/53 backend tests, 16/16 E2E tests, clean frontend build

### Milestone 2: Semantic Intelligence + Generative Media (Completed & Verified)
- [x] **Phase 9: Seed Potential Map** — Explicit, Inferred, Open possibilities layer between Seed DNA and Worlds.
- [x] **Phase 10: Divergence Engine** — Exactly 3 worlds with intentional divergence (Familiar, Radical, Inverse) and exploration profile.
- [x] **Phase 11: Decision DNA** — Capture rich human choice rationale, priorities, rejected directions, and propagate downstream.
- [x] **Phase 12: Origin Ledger** — Entity origin classification (`SEED_EXPLICIT`, `SEED_INFERRED`, `HUMAN_DECISION`, etc.) and "Why is this here?" explanation.
- [x] **Phase 13: Media Provider Architecture** — Clean non-blocking `MediaProvider` abstraction (`ImageProvider`, `VoiceProvider`, `VideoProvider`, `AudioProvider`).
- [x] **Phase 14: Image Generation (Pollinations / FLUX.1 schnell)** — On-demand generation for World cover, Character portrait, Location concept, Scene visual.
- [x] **Phase 15: Voice Generation (Edge TTS / Kokoro-82M)** — Narration audio generation, voice selection, playback, regeneration.
- [x] **Phase 16: Video Generation (Pyramid Flow / Wan2.1)** — Selective cinematic scene generation.
- [x] **Phase 17: Audio & Atmosphere (ACE-Step 1.5 / Stable Audio Open)** — Ambient atmosphere, soundscape, background audio composition.
- [x] **Phase 18: Seed Mutation Lab** — Modify fundamental seed variable, preview impact (Affected/Conditional/Preserved), fork branch.
- [x] **Phase 19: Counterfactual Replay** — Delta comparison between selected world and rejected worlds without full regeneration.
- [x] **Phase 20: Human-Only Zones** — Creator-locked creative guardrails preserved in Decision DNA and Origin Ledger.

### Milestone 3: Complete UI Upgrade (Completed & Verified)
- [x] **Phase 21: Design System Foundation** — Global design tokens, Cormorant Garamond & Inter typography, warm cream parchment, subtle paper texture, button/card/input utility tokens (`design.md`).
- [x] **Phase 22: Global App Shell** — Warm cream sidebar (265-280px), botanical leaf branding, navigation (Home, My Creations, Graveyard, Profile), corner botanical accents.
- [x] **Phase 23: Home Screen & UI Refinement Pass** — Poetic hero statement, leaf separator, 72px pill seed input, 5 creation modes, recent creations row; unified global `PageContainer` grid, removal of large side journey card, modernization of Stage 2 (Understand) and Stage 3 (Divergent Worlds) to PRAROHA botanical system, and 6-viewport responsive validation.
- [x] **Phase 24: Creation Component System** — Unified reusable `CreationCard` component supporting Image, Story, Sound, Video, Chat.
- [x] **Phase 28: Seed → Universe Workspace** — Redesign experience of the 7 stages (Seed, DNA, Divergent Worlds, Choice & HOZ, Universe Codex, Lineage DAG, Mutation Lab, Counterfactual Replay) with botanical aesthetics while keeping 100% of functional contracts intact.
- [x] **Phase 29: Secondary UI Polish** — Standardize typography scale (Cormorant 20-36px, Inter 14-16px, metadata 12-13px min), zero instances of `text-[9px]` or `text-[10px]`, high contrast botanical tokens, 44px min touch targets.
- [x] **Phase 30: Shell Simplification & Clutter Reduction** — Evicted developer telemetry, streamlined header to 3 utility controls, unified Workspace Menu (`•••`), Universe Search (⌘K), non-scrolling mobile carousel.
- [x] **Phase 30.4: Deep Product Integrity Audit** — Comprehensive 17-part audit documenting real vs mock architecture, AI model naming failure, test false positives, and realtime gaps.

### Milestone 4: Real Product Hardening + True Realtime (Active)
- [ ] **Phase 31.1: Gemini & AI Provider Repair** — Valid Gemini model (`gemini-2.5-flash`), live generation verification, remove silent mock fallback, support arbitrary creative seeds, real error & retry handling.
- [ ] **Phase 31.2: Server-Backed Generation Job State** — Persistent `generation_jobs` table, real progress tracking, replace client `setTimeout` fake timers with true job events.
- [ ] **Phase 31.3: Supabase Realtime Infrastructure** — Scoped Supabase Realtime subscriptions per project, dedicated `frontend/src/realtime/` layer, connect/subscribe/disconnect lifecycle.
- [ ] **Phase 31.4: Realtime Store Synchronization** — Realtime database events dynamically updating Zustand store without page refresh (verified across multi-tab).
- [ ] **Phase 31.5: Project Routing & Authoritative Rehydration** — URL-based routing (`/projects/:projectId`), authoritative server rehydration, real Project Library UI (`GET /api/projects`).
- [ ] **Phase 31.6: Real Creations & Graveyard** — Remove static mock arrays, connect My Creations and Graveyard to live Postgres data with real restore and permanent delete.
- [ ] **Phase 31.7: Authentication & Project Ownership** — Supabase Auth, `user_id` ownership on projects, backend security verification, zero unauthorized cross-user access.
- [ ] **Phase 31.8: Media Realtime Pipeline** — Realtime events for image, voice, and audio generation, surviving browser close and reload.
- [ ] **Phase 31.9: Error Semantics & Demo Isolation** — Explicit error codes, retryable states, strict isolation of Canonical Demo Mode from Real Mode.
- [ ] **Phase 31.10: Production E2E & Two-Tab Realtime Tests** — Automated Playwright tests with arbitrary non-canonical seeds and dual-browser-context realtime synchronization.
- [ ] **Phase 31.11: Final Full-System Audit & Live Verification** — Live dual-seed test (Seed A vs Seed B proof), multi-tab realtime proof, and milestone sign-off.

### Out of Scope (Milestone 2)
- Autonomous multi-agent swarms (preserves human agency and single-creator focus).
- Mandatory media generation (all media is progressive enhancement; core universe never fails on media error).
- Real-time collaborative multi-user sockets.

## Context
- Workspace directory: `Praroha` (Sanskrit for sprout / shoot / unfolding from a seed).
- Frontend: React + Vite + TypeScript, styled with Tailwind CSS (calm dark theme) and Framer Motion.
- Backend: Python 3.11+ with FastAPI, SQLModel, Pydantic v2 schemas.
- AI Provider: Provider abstraction (`AIProvider` with `GeminiProvider` using active `gemini-2.5-flash` model, explicit error semantics, and MockProvider reserved strictly for explicit Demo Mode).
- Storage Provider: `StorageProvider` with `SupabaseStorageProvider` and `LocalStorageProvider` fallback.
- Database: Supabase PostgreSQL with Supabase Realtime subscriptions.
- Traceability: Relational DAG lineage synthesis without external graph database.

## Constraints & Guardrails
- **Exact Three Worlds**: Exactly three candidates generated before human selection.
- **Human Choice Gate**: Generation strictly halts at candidate stage until human commits.
- **Traceability Integrity**: Every entity records provenance back to Seed DNA and creator decisions.
- **True Realtime & Persistence**: Supabase Realtime propagates database commits to frontend without fake simulation.
- **Zero Silent Fallback**: Production failures surface real error states with retry mechanisms.
- **Non-blocking Media**: External media failure must never crash or block core universe operations.
- **No Chain-of-Thought Leakage**: Origin explanations use stored metadata, never raw LLM scratchpads.
- **Secrets & Credentials**: Never hardcode API keys or commit `.env`.

### Media Architecture & Design Principles (Phases 13–17)
- **Decoupled Abstraction**: All media modalities sit behind `MediaProvider` (`ImageProvider`, `VoiceProvider`, `VideoProvider`, `AudioProvider`). Conceptual routing:
  - `IMAGE_PROVIDER=pollinations` (fallback: `flux_schnell`, last resort: `mock`)
  - `VOICE_PROVIDER=edge_tts` (fallback: `kokoro`, last resort: `mock`)
  - `VIDEO_PROVIDER=pyramid_flow` (fallback: `wan_2_1`, experimental: `mochi`, last resort: `mock`)
  - `AUDIO_PROVIDER=ace_step` (fallback: `stable_audio_open`, last resort: `mock`)
- **Progressive Enhancement**: Media failure never blocks Seed → Universe unfolding; the entire narrative and visual layout functions gracefully without media.
- **Cost Discipline**: ₹0/free/local options prioritized across all modalities.
- **Provider Transparency**: Clearly distinguish free-tier API, local model, and makeathon-provided services; do not claim unlimited-free unless verified.

---
*Updated: 2026-10-08 for Milestone 4: Real Product Hardening + True Realtime*
