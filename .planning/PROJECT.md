# Seed Unfold (Praroha)

## What This Is

Seed Unfold is an AI-powered creative development workspace that transforms a single, incomplete idea or prompt (the "seed") into structured intent, generates exactly three distinct creative solution worlds, empowers the human user to choose a direction, and progressively unfolds the selected world into a coherent, persistent, and traceable mini-universe. Built around the philosophical theme *Tattva 2: Forms Hidden in the Formless*, it surfaces latent creative potential while maintaining strict parent-child lineage and explainability from the final artifacts back to the root seed.

## Core Value

One incomplete seed becomes structured intent, exactly three distinct creative worlds, a human-selected direction, and then a coherent persistent mini-universe whose evolution can be inspected and traced.

## Business & Hackathon Context

- **Customer / User**: Writers, game designers, filmmakers, hackathon builders, and creative technologists moving from ambiguity to concrete, buildable worlds.
- **Product Metaphor**: A creative ideation IDE (not a chatbot; not an unguided text generator).
- **Core Loop**: Seed → Understanding → Seed DNA → Exactly 3 Worlds → Human Choice → Selected World → Progressive Unfolding (World Bible, Characters, Relationships, Scenes, Assets) → Traceability → Refine / Branch → Save / Load.
- **Theme Alignment**: *Tattva 2: Forms Hidden in the Formless*. The seed is formless potential; the three worlds expose multiple latent forms; human choice provides direction; unfolding manifests the chosen form into reality.

## Requirements

### Validated

- [x] Permanent project rules defined in `PROJECT_RULES.md`
- [x] Documentation organized into `docs/` (`product/`, `architecture/`, `decisions/`, `wiki/`)
- [x] GSD planning and state management initialized
- [x] Graphify knowledge graph integration configured

### Active (MVP Scope)

- [ ] Interactive, calm dark workspace UI centered on progressive unfolding
- [ ] Seed input ingestion with validation, input tips, and pre-seeded demo fixtures
- [ ] Understanding stage extracting structured, canonical Seed DNA (premise, themes, entities, constraints, tone, domain keywords)
- [ ] Branching engine generating exactly three meaningfully distinct solution/creative worlds
- [ ] Human selection gate for side-by-side world comparison, trade-off review, and explicit choice
- [ ] Progressive unfolding engine generating World Bible, Characters, Relationships, and Scenes
- [ ] Traceability engine recording and displaying DAG parent-child lineage without exposing internal model chain-of-thought
- [ ] Project persistence (saving/loading seeds, DNA, chosen worlds, unfolded universes, and lineage DAGs)
- [ ] Refine (localized iteration) and Branch (timeline forking) controls
- [ ] Deterministic demo fallback mode using the canonical underwater city fixtures for 100% demo resilience

### Out of Scope (MVP)

- Full movie or high-fidelity video generation
- Mandatory audio / voice cloning infrastructure
- Real-time collaborative multi-user editing
- Marketplace / community publishing platform
- Autonomous multi-agent swarm orchestration
- Complex external graph databases (e.g. Neo4j)
- Custom model fine-tuning or training

## Context

- Workspace directory: `Praroha` (Sanskrit/Hindi for sprout / shoot / unfolding from a seed).
- Frontend: React + Vite + TypeScript, styled with Tailwind CSS (calm dark theme) and Framer Motion for progressive disclosure.
- Backend: Python 3.11+ with FastAPI, Pydantic v2 schemas for strict structured LLM outputs.
- AI Provider: Provider abstraction (`AIProvider`) decoupling Gemini or other LLMs with deterministic fallbacks.
- Persistence: PostgreSQL / Supabase as the intended persistence direction with a relational data model; SQLite strictly as local development / offline demo fallback.
- Object Storage: Supabase Storage for user-uploaded and AI-generated binary assets, abstracted via `StorageProvider` with a local filesystem fallback for zero-cloud local development.
- Asset Separation: Binary assets live in object storage; PostgreSQL stores asset metadata and relational links; Traceability stores causal provenance.
- Traceability: Modeled as explicit nodes and edges / DAG relationships across core entities, not as a specialized graph database engine.

## Constraints

- **Exact Three Worlds**: Exactly three distinct candidates must be generated before human selection—never fewer, never more.
- **Human Choice Gate**: Generation cannot autonomously bypass the human selection step.
- **Traceability**: Every generated entity must record its lineage back to Seed DNA and parent decisions.
- **Canon Preservation**: Established canon facts and previous versions cannot be silently overwritten.
- **No Chain-of-Thought Leakage**: Provenance explains *why* an output exists without exposing raw model internal scratchpads.
- **No Binary Storage in Database**: Raw files must not be stored directly in PostgreSQL; only asset metadata and storage keys are stored relationally.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Vite + FastAPI | Fast development velocity, async execution, clean typing across full stack | ✓ Accepted (ADR-001) |
| PostgreSQL / Supabase Relational Model | Primary persistence target for core entities; SQLite strictly as local/demo fallback | ✓ Accepted (ADR-001) |
| Cloud Object Storage & Asset Separation | Supabase Storage for binaries with local filesystem fallback; PostgreSQL stores metadata; Traceability tracks causal origin | ✓ Accepted (ADR-003) |
| Exactly 3 Worlds | Balances creative diversity with decision focus; embodies Tattva 2 | ✓ Accepted (ADR-002) |
| Normalized Seed DNA Schema | Provides strict, immutable anchor for all downstream unfolding | ✓ Accepted |
| DAG Lineage Model (No Graph DB) | Relational node/edge structures model provenance cleanly without graph DB complexity | ✓ Accepted (ADR-002) |
| Provider Adapter + Demo Fallbacks | Decouples LLM vendor and guarantees 100% demo uptime | ✓ Accepted (ADR-001) |

---
*Last updated: 2026-10-04 during initial workspace setup*
