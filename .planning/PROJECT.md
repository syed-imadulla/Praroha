# Seed Unfold (Praroha)

## What This Is

Seed Unfold is an AI-powered creative development engine that transforms a compact, incomplete idea or problem (the "seed") into multiple structured solution paths, empowers human choice, and progressively unfolds the selected direction into a comprehensive, buildable solution. Built around the theme *Tattva 2: Forms Hidden in the Formless*, it makes latent possibilities visible while maintaining end-to-end traceability from final artifacts back to the original seed.

## Core Value

Progressive unfolding from normalized Seed DNA into exactly three distinct solution worlds, guided by explicit human choice, with transparent parent-child lineage tracing every generated artifact back to the root idea.

## Business Context

- **Customer**: Hackathon teams, early-stage innovators, students, and project builders seeking rapid, explainable paths from idea to buildable prototype.
- **Revenue model**: Hackathon project / Open developer tool / Future API-first SaaS.
- **Success metric**: Time from seed input to complete buildable specification (< 5 minutes) with 100% lineage graph integrity.
- **Strategy notes**: Aligned with Tattva 2 (*Forms Hidden in the Formless*) as specified in `startDocs/`.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Interactive Landing Page with central "unfolding seed" visual metaphor and product explanation
- [ ] Seed input ingestion with validation, guidelines, and pre-seeded curated examples
- [ ] Understand Stage constructing normalized Seed DNA (intent, problem, users, context, constraints, tone, domain, keywords)
- [ ] Branching engine generating exactly three meaningfully distinct solution worlds (World A, B, C) with titles, loglines, and trade-offs
- [ ] Human Comparison & Selection interface enabling side-by-side trade-off review and explicit selection
- [ ] Visible Progressive Unfolding through 5–7 structured stages (e.g. Concept, World Bible / Context, Requirements, Feature Hierarchy, Tech & Prototype blueprint)
- [ ] Traceability Lineage Graph dynamically rendering parent-child relationships from each output node back to Seed DNA
- [ ] Project persistence storing projects, seeds, DNA, branches, selections, unfolded stages, and trace nodes
- [ ] Refine and regenerate controls allowing modification of constraints or regeneration of specific stage outputs
- [ ] Offline / Demo Fallback Mode with cached outputs to guarantee zero-downtime demonstration resilience

### Out of Scope

- Microservices architecture — A clean React + Vite frontend and FastAPI backend is specified for high agility and reliability.
- Mandatory video/audio generation — Multimodal audio/video are optional enhancements; core workflow must operate independently.
- Custom model fine-tuning or training — Prompt engineering and structured Pydantic schemas over LLM provider adapters fulfill all requirements.
- Real-time collaborative editing / multi-user concurrency — Focus is on single-user hackathon/innovator project creation.
- Complex external vector database — Relational/JSON persistence and explicit trace graphs satisfy all lineage and retrieval needs without added operational overhead.

## Context

- The project specifications, architecture, and workflow are strictly defined in `startDocs/` (`Seed_Unfold_Complete_Project_Documentation.pdf`, `Seed Unfold technical project documentation.pdf`, `SEED UNFOLD product documentation.pdf`, and `Seed Unfold Architecture and Workflow.png`).
- The workspace directory is named `Praroha` (Sanskrit/Hindi for "sprout / shoot / unfolding from a seed").
- Frontend: React + Vite + Tailwind CSS / Vanilla CSS with rich animations highlighting progressive unfolding.
- Backend: FastAPI, Pydantic schemas for structured LLM outputs, provider adapter pattern (`generate_text`, `generate_image`, etc.), and SQLite/JSON persistence.
- Provider reliability: Keys reside exclusively on backend; graceful degradation to demo seeds if providers fail or timeout.

## Constraints

- **Exact Three Worlds**: The branching engine must generate exactly three meaningfully distinct worlds (no more, no less).
- **Human Choice Gate**: Unfolding cannot proceed autonomously without explicit human selection of a branch.
- **Traceability**: Every generated artifact must store and display its lineage back to the root Seed DNA.
- **Resilience**: The application must remain fully testable and demonstrable offline via curated demo seeds.
- **Scope Discipline**: Scope cannot be expanded beyond the documented MVP without explicit user approval.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Vite + FastAPI | Standardized, robust full-stack architecture recommended in technical project docs | ✓ Good |
| Exactly 3 Worlds branching | Core USP embodying Tattva 2: multiple latent forms extracted from a single formless seed | ✓ Good |
| Normalized Seed DNA schema | Preserves core intent and constraints across all downstream unfolding steps | ✓ Good |
| Parent-Child Traceability Graph | Directly addresses the "AI black-box" gap by mapping every feature to root intent | ✓ Good |
| Provider Adapter + Demo Fallbacks | Decouples AI providers and protects against live demo rate-limits/outages | ✓ Good |

---
*Last updated: 2026-10-04 after project initialization*
