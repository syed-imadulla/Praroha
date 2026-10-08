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

### Milestone 3: Complete UI Upgrade (Active)
- [ ] **Phase 21: Design System Foundation** — Global design tokens, Cormorant Garamond & Inter typography, warm cream parchment, subtle paper texture, button/card/input utility tokens (`design.md`).
- [ ] **Phase 22: Global App Shell** — Warm cream sidebar (265-280px), botanical leaf branding, navigation (Home, My Creations, Graveyard, Profile), corner botanical accents.
- [ ] **Phase 23: Home Screen** — Poetic hero statement, leaf separator, 72px pill seed input, 5 creation modes, recent creations row.
- [ ] **Phase 24: Creation Component System** — Unified reusable `CreationCard` component supporting Image, Story, Sound, Video, Chat.
- [ ] **Phase 25: My Creations Screen** — 3-column gallery, search, sort, filter pills, empty states.
- [ ] **Phase 26: Graveyard Screen** — Reflective & poetic idea cemetery, restore, permanent deletion with confirmation modal.
- [ ] **Phase 27: Profile Screen** — Botanical identity card, stats, creation tabs, account settings panel, soft danger logout.
- [ ] **Phase 28: Seed → Universe Workspace** — Redesign experience of the 7 stages (Seed, DNA, Divergent Worlds, Choice & HOZ, Universe Codex, Lineage DAG, Mutation Lab, Counterfactual Replay) with botanical aesthetics while keeping 100% of functional contracts intact.
- [ ] **Phase 29: Secondary UI** — Redesign modals, inspector drawer, lightboxes, dropdowns, toasts, guided tour, and keyboard shortcuts in unified botanical journal design.
- [ ] **Phase 30: Motion & Organic Unfolding** — Organic transitions (180ms), seed pulse, gentle unfolding motion.
- [ ] **Phase 31: Responsive & Accessibility** — Multi-device responsive layout (Desktop, Tablet, Mobile), 44px touch targets, keyboard focus rings.
- [ ] **Phase 32: Final Visual Audit & Verification** — Complete review against `design.md` checklist and test verification.

### Out of Scope (Milestone 2)
- Autonomous multi-agent swarms (preserves human agency and single-creator focus).
- Mandatory media generation (all media is progressive enhancement; core universe never fails on media error).
- Real-time collaborative multi-user sockets.

## Context
- Workspace directory: `Praroha` (Sanskrit for sprout / shoot / unfolding from a seed).
- Frontend: React + Vite + TypeScript, styled with Tailwind CSS (calm dark theme) and Framer Motion.
- Backend: Python 3.11+ with FastAPI, SQLModel, Pydantic v2 schemas.
- AI Provider: Provider abstraction (`AIProvider` with `GeminiProvider` using `gemini-3.5-flash` and `MockProvider` fallback).
- Storage Provider: `StorageProvider` with `SupabaseStorageProvider` and `LocalStorageProvider` fallback.
- Database: Supabase PostgreSQL via Session Pooler with local SQLite fallback.
- Traceability: Relational DAG lineage synthesis without external graph database.

## Constraints & Guardrails
- **Exact Three Worlds**: Exactly three candidates generated before human selection.
- **Human Choice Gate**: Generation strictly halts at candidate stage until human commits.
- **Traceability Integrity**: Every entity records provenance back to Seed DNA and creator decisions.
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
*Updated: 2026-10-07 for Milestone 2: Semantic Intelligence + Generative Media (Finalized Media Strategy)*
