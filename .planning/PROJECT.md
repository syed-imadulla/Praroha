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

### Milestone 4: Real Product Hardening + True Realtime (Complete)
- [x] **Phase 31.1: Gemini & AI Provider Repair** — Valid Gemini model (`gemini-2.5-flash`), live generation verification, remove silent mock fallback, support arbitrary creative seeds, real error & retry handling.
- [x] **Phase 31.2: Server-Backed Generation Job State** — Persistent `generation_jobs` table, real progress tracking, replace client `setTimeout` fake timers with true job events.
- [x] **Phase 31.3: Supabase Realtime Infrastructure** — Scoped Supabase Realtime subscriptions per project, dedicated `frontend/src/realtime/` layer, connect/subscribe/disconnect lifecycle.
- [x] **Phase 31.4: Realtime Store Synchronization** — Realtime database events dynamically updating Zustand store without page refresh (verified across multi-tab).
- [x] **Phase 31.5: Project Routing & Authoritative Rehydration** — URL-based routing (`/projects/:projectId`), authoritative server rehydration, real Project Library UI (`GET /api/projects`).
- [x] **Phase 31.6: Real Creations & Graveyard** — Remove static mock arrays, connect My Creations and Graveyard to live Postgres data with real restore and permanent delete.
- [x] **Phase 31.7: Authentication & Project Ownership** — Supabase Auth, `user_id` ownership on projects, backend security verification, zero unauthorized cross-user access.
- [x] **Phase 31.8: Media Realtime Pipeline** — Realtime events for image, voice, and audio generation, surviving browser close and reload.
- [x] **Phase 31.9: Error Semantics & Demo Isolation** — Explicit error codes, retryable states, strict isolation of Canonical Demo Mode from Real Mode.
- [x] **Phase 31.10: Production E2E & Two-Tab Realtime Tests** — Automated Playwright tests with arbitrary non-canonical seeds and dual-browser-context realtime synchronization.
- [x] **Phase 31.11: Final Full-System Audit & Live Verification** — Live dual-seed test (Seed A vs Seed B proof), multi-tab realtime proof, and milestone sign-off.

### Milestone 5: PRAROHA — Production Product Completion (Completed & Verified)
- [x] **Phase 32: Product Audit & Production Foundation** — Forensic audit, production environment baseline, and dependency ordering.
- [x] **Phase 33: Email Authentication & Account Security** — Real email registration, confirmation lifecycle, password reset, session recovery, and strict server-side ownership.
- [x] **Phase 34: Atmospheric Audio Generation** — Live playable atmospheric soundscapes, CC0 soundscape fallback, provider credential validation, honest status reporting, and scene persistence.
- [x] **Phase 35: Real Video Generation** — JSON2Video composition preview engine verified with synthetic badges; Wan 2.1 / Pyramid Flow / Pixazo video integration with clear credit gates.
- [x] **Phase 36: UI Reliability, Accessibility & Responsive Polish** — Comprehensive UI bug elimination, interactive flow validation across 6 viewports, touch target & focus compliance.
- [x] **Phase 37: PWA Installation & Offline Behaviour** — Valid web app manifest, service worker lifecycle, installation support, and honest offline app shell.
- [x] **Phase 38: Production Deployment & Operational Readiness** — Reproducible staging & production configuration, persistent storage, health checks, rate limiting, and runbooks.
- [x] **Phase 39: Full-System Verification & Release Documentation** — End-to-end user lifecycle verification, updated documentation, and deployment audit.
- [x] **Phase 40: Production Cloud Deployment (Azure + Vercel + Supabase)** — Azure Container Apps backend, Vercel Edge frontend, Supabase DB/Auth/Storage/Realtime, 100% live cloud verified.

### Milestone 6: Core Product Intelligence & Media Reliability (Active)
- [ ] **Phase 41: Product Alignment & Technical Audit** — Baseline seed interpretation, 3-world divergence, character consistency, origin trail accuracy, failure modes, and credit constraints.
- [ ] **Phase 42: Pollinations & Media Capability Audit** — Live catalog audit of `gen.pollinations.ai`, modal capabilities (image, audio, video), pollen pricing, quota behavior, and zero-cost vs credit routing.
- [ ] **Phase 43: Media Reliability & Credit Protection** — Cost-safe composite provider routing (no cascading on 402/403/429), request deduplication, content-hash caching, and container job recovery.
- [ ] **Phase 44: Universe Consistency & Creative Memory** — Canonical creative memory schema, context construction engine, and rule validation preventing lore contradictions.
- [ ] **Phase 45: Origin Trail & Controlled Regeneration** — Blast radius change-impact preview (`AFFECTED`/`CONDITIONAL`/`PRESERVED`), stale entity detection, selective subtree regeneration, and DAG updates.
- [ ] **Phase 46: Cinematic Preview Proof of Concept** — HyperFrames feasibility evaluation (licensing, Node/Chromium/FFmpeg footprint vs ACA limits) and separate worker pilot to establish a reliable self-contained cinematic preview engine.
- [ ] **Phase 47: Product Evaluation & Release Gate** — Automated E2E verification across arbitrary seeds, character consistency, credit protection, live provider proof, and PWA release gate.

### Architecture Decisions: Referenced Projects Analysis
1. **Pollinations (`gen.pollinations.ai`) [ADOPTED WITH BOUNDARIES]**:
   - *Analysis*: Offers image (`/image`), audio/speech (`/v1/audio/speech`, `/audio`), and video (`/video`) endpoints. Unauthenticated public access defaults strictly to `sana` image generation. Paid models and video require funded pollen balance via `pk_`/`sk_` API keys.
   - *Decision*: Audit live models and quotas via catalog inspection (no credit spend during planning). Implement cost-safe routing that respects key limits and prevents 402/403 errors.
2. **HyperFrames [PILOT AS SEPARATE RENDERER]**:
   - *Analysis*: Code-driven, web-standards (HTML/CSS/Canvas/Chromium/Node/FFmpeg) programmatic video renderer. High visual quality for motion graphics and scene assemblies.
   - *Decision*: Evaluate licensing (open source) and resource demands against Azure Container Apps limits (0.5 vCPU, 1.0 GiB RAM). Scope as a separate isolated preview worker proof-of-concept to replace retired external video APIs. Never label composed footage as generative AI video.
3. **DramaClaw [ADAPT PATTERNS ONLY]**:
   - *Analysis*: Provides concepts for reusable asset libraries, storyboarding workflows, and production checkpoint management.
   - *Decision*: Adapt architectural patterns (asset banks, state checkpoints) into PRAROHA's existing SQLModel/PostgreSQL schema. Do not import hosted-service dependencies or unverified third-party code.
4. **OmniVoice [DEFERRED]**:
   - *Rationale*: PRAROHA's existing integration with Microsoft Edge-TTS delivers 6 distinct, high-fidelity neural voice personas (Christopher, Guy, Aria, Sonia, Eric, Ana) with 0 API cost and 0 server compute/memory overhead. Hosting local neural TTS models or external third-party speech endpoints is unjustified without a measured quality deficit.
5. **SkyReels V2 [DEFERRED]**:
   - *Rationale*: Open diffusion video generation models require massive dedicated GPU infrastructure (80GB VRAM / A100 instances). Deploying or consuming SkyReels V2 violates PRAROHA's low-resource Azure Container Apps architecture and zero-waste budget policy.
6. **Duix Avatar [DEFERRED]**:
   - *Rationale*: Digital talking avatars focus on face puppet animation for talking-head videos. PRAROHA's core artistic mission is *Tatva 2: Seed to Universe — Forms Hidden in the Formless*, creating deep speculative world bibles, ecological rules, character conflict webs, and cinematic atmosphere. Talking avatars are out of scope.

### Out of Scope (Milestone 6)
- Autonomous multi-agent swarms (preserves human agency and single-creator focus).
- Mandatory media generation (all media is progressive enhancement; core universe never fails on media error).
- Local heavy GPU inference engines (SkyReels, local Flux dev) inside the production Azure container.
- Digital talking-head avatars (Duix Avatar).

## Context
- Workspace directory: `Praroha` (Sanskrit for sprout / shoot / unfolding from a seed).
- Frontend: React + Vite + TypeScript, styled with Tailwind CSS (calm botanical editorial theme) and Framer Motion.
- Backend: Python 3.11+ with FastAPI, SQLModel, Pydantic v2 schemas.
- AI Provider: Provider abstraction (`AIProvider` with `GeminiProvider` using active `gemini-2.5-flash` model, explicit error semantics, and MockProvider reserved strictly for explicit Demo Mode).
- Storage Provider: `StorageProvider` with `SupabaseStorageProvider` and `LocalStorageProvider` fallback.
- Database: Supabase PostgreSQL with Supabase Realtime subscriptions.
- Traceability: Relational DAG lineage synthesis with change-impact blast radius and origin classifications.

## Constraints & Guardrails
- **Exact Three Worlds**: Exactly three candidates generated before human selection.
- **Human Choice Gate**: Generation strictly halts at candidate stage until human commits.
- **Traceability Integrity**: Every entity records provenance back to Seed DNA and creator decisions.
- **True Realtime & Persistence**: Supabase Realtime propagates database commits to frontend without fake simulation.
- **Zero Silent Fallback**: Production failures surface real error states with retry mechanisms.
- **Cost-Safe Media Cascading**: Composite providers must NEVER cascade to paid alternatives upon encountering 402, 403, or 429 status codes without explicit policy authorization.
- **Honest Labeling**: Synthetic and composed media must always carry clear indicators; never label rendered motion graphics as generative AI video.
- **Secrets & Credentials**: Never hardcode API keys or commit `.env`.

---
*Updated: 2026-10-22 for Milestone 6: Core Product Intelligence & Media Reliability*
