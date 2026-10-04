# Seed Unfold — Project Rules

This document establishes the permanent, non-negotiable rules for the **Seed Unfold** project. Every human contributor and AI agent working on this codebase must strictly adhere to these rules.

---

## 1. Product Rules

1. **Preserve the original user seed**: The raw seed entered by the user must always remain immutable and intact.
2. **Never silently replace or mutate the original seed**: Any downstream normalization, expansion, or prompt wrapping must exist as distinct data artifacts referencing the original seed.
3. **Extract structured Seed DNA from the seed**: Every seed must pass through an understanding stage that normalizes it into a structured, validated Seed DNA schema (intent, core premise, themes, entities, constraints, tone, domain keywords).
4. **Seed DNA is canonical context for downstream generation**: All subsequent world generation and unfolding phases must ingest and respect the extracted Seed DNA as grounding context.
5. **Always generate EXACTLY THREE world candidates before human selection**: The branching engine must always output precisely three world paths (World A, World B, World C)—never fewer, never more.
6. **The three worlds must be meaningfully distinct**: The three candidates must represent contrasting creative or strategic interpretations (e.g., contrasting genres, visual tones, thematic tensions, or mechanics), not superficial variations.
7. **Human choice is a first-class product action**: Generation halts at the three-world stage until the human user explicitly reviews, compares, and selects one direction.
8. **Downstream outputs inherit Seed DNA and selected-world context**: Once a world candidate is chosen, all subsequent unfolded artifacts (World Bible, characters, scenes, assets) strictly inherit the combined context of the root Seed DNA and the selected world.
9. **Never silently overwrite established canon**: Once established, canon facts and world rules cannot be overwritten or discarded by subsequent generations without explicit user consent.
10. **Changes to canon must be explicit and traceable**: Any alteration to established world facts must produce an explicit modification record indicating what changed and why.
11. **Refinements must preserve version history**: Refinement operations on characters, scenes, or bibles must generate new versions, preserving previous iterations for rollback and comparison.
12. **Branching must preserve the previous branch**: Creating a new branch from a world or scene must fork state cleanly, keeping the source branch uncorrupted and accessible.
13. **Every important generated output should have traceable provenance**: Every character, scene, bible entry, or asset must record its parent nodes and causal lineage.
14. **Explain WHY an output exists without exposing private chain-of-thought**: The system must provide human-understandable provenance justifications (e.g., "Generated from World A's Bio-luminescent rule and Seed DNA constraint: no modern electricity") without leaking raw LLM thinking traces or system prompts.
15. **Media generation is optional and non-blocking**: Image, audio, or video generation is an optional sensory enhancement; the core text-first creative workflow must remain fully functional and independent of media APIs.
16. **Prefer a reliable text-first vertical slice over broad unfinished functionality**: Prioritize rock-solid narrative, structural coherence, and lineage over speculative multimodal pipelines.
17. **Use provider abstraction for AI services**: AI models must sit behind clean provider interfaces with decoupled request/response schemas, enabling hot-swapping between Gemini, OpenAI, Claude, or local models.
18. **Use structured/schema-validated AI responses**: All AI interactions must enforce strict structured schemas (e.g., Pydantic / JSON Schema validation) to eliminate syntax hallucinations.
19. **Include deterministic fallback/demo data**: Provide pre-baked, deterministic fixture data for all stages (including the canonical demo seed) to ensure 100% demo resilience during network outages or API throttling.
20. **Avoid unnecessary architecture or infrastructure before the core loop works**: Do not prematurely introduce distributed microservices, heavy message queues, or complex graph databases until the core vertical slice is proven.

---

## 2. UX Rules

- **Calm, dark, content-first workspace**: The user interface must feature a refined dark aesthetic that keeps the user's attention centered on their emerging universe.
- **Creative development workspace, not a chatbot**: Seed Unfold is an ideation and worldbuilding IDE, not a chat bubble interface. Interactions are structured, visual, and stage-driven.
- **Progressive unfolding instead of dumping everything at once**: Guide the user step-by-step through distinct disclosure stages (Seed → Understanding → 3 Worlds → Selection → Progressive Unfolding) rather than overwhelming them with monolithic text walls.
- **Make three-world comparison visually clear**: Present the three world options side-by-side with clear comparative dimensions (logline, aesthetic, trade-offs, core conflict).
- **Human decisions must be visible**: Explicitly show user choices, selected branches, and user modifications as active, highlighted states in the workflow.
- **Seed DNA and provenance must be inspectable**: Provide accessible inspection panels where users can view the underlying Seed DNA and drill into the lineage of any artifact.
- **Traceability should be understandable to a normal user**: Lineage diagrams and node relationships should be labeled intuitively (e.g., "Inspired by", "Constrained by", "Branched from") rather than exposing raw database foreign keys.
- **Clean and minimal interface**: Prioritize clarity and typography over visual clutter.
- **Avoid excessive icons, visual noise, or unnecessary animations**: Keep animations subtle, functional, and purposeful (e.g., communicating progressive growth or stage transitions).

---

## 3. Architecture Rules

- **Strict concern separation**: Cleanly isolate Frontend (UI/State), Backend (API/Orchestration), AI Providers (Adapters), Persistence (Storage), and Traceability (Lineage Graph).
- **Prefer simple architecture first**: Start with a unified FastAPI backend and React/Vite SPA. Keep deployment and local execution zero-friction.
- **Do not introduce microservices prematurely**: Keep the MVP monolithic and modular.
- **Do not introduce complex graph databases unless clearly required**: The parent-child traceability tree can be represented with standard relational/document foreign keys and directed acyclic graph (DAG) abstractions in SQLite/PostgreSQL.
- **Do not build full autonomous multi-agent orchestration for the MVP**: Keep agent workflows deterministic, sequential, and human-in-the-loop.
- **Do not build full video generation infrastructure for the MVP**: Placeholders, static frames, or optional single-image generation suffice for early milestones.
