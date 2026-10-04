# Phase 1: Foundation / Project Shell - Context

**Gathered:** 2026-10-04  
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the full-stack foundation and application shell for **Seed Unfold**:
- Monorepo structure with `frontend/` (React 18+, Vite, TypeScript, Tailwind CSS, Framer Motion) and `backend/` (Python 3.11+, FastAPI, Pydantic v2).
- Calm dark creative workspace shell: top stage progression header, central unfolding canvas, and collapsible right-side inspection drawer for Seed DNA & Traceability.
- Standardized API communication contract: typed API client wrapper, Vite dev proxy to FastAPI on port 8000, and standardized `{ success, data, error }` response envelopes.
- AI Provider abstraction layer: abstract base class (`AIProvider`), dynamic factory (`AI_PROVIDER`), and deterministic Mock Provider returning the canonical underwater city fixtures for zero-key local testing.
- Persistence foundation: SQLModel / SQLAlchemy 2.0 async engine defaulting to SQLite fallback when `DATABASE_URL` is unset, with full PostgreSQL / Supabase connection capability via a clean Repository pattern (`ProjectRepository`).
- Client-side reactive state: Zustand store with localStorage persistence for active session recovery.

</domain>

<decisions>
## Implementation Decisions

### Workspace Layout & Shell Aesthetics
- **D-01:** Workspace layout uses a top stage progression header, a central unfolding canvas, and a collapsible right-side inspection drawer for Seed DNA and Traceability graphs. — **Reversibility:** costly — affects primary shell component structure.
- **D-02:** Deep slate/zinc dark theme (`#090D16` / `#0F172A`) with subtle border styling, cyan/emerald glowing accents for active states, and Inter/Outfit typography. — **Reversibility:** reversible — encapsulated in Tailwind tokens.
- **D-03:** Progressive disclosure navigation: only unlocked stages are active/clickable; future stages appear dim/locked until prerequisites complete. — **Reversibility:** reversible — controlled via stage state guard in navigation components.
- **D-04:** Top utility bar displays Project Title ("Seed Unfold / Praroha"), active branch badge, save/sync status indicator, and a "New Seed" restart action. — **Reversibility:** reversible.

### Frontend-Backend Communication & Monorepo Structure
- **D-05:** Monorepo organization with `frontend/` and `backend/` directories, orchestrated via root `package.json` scripts (`npm run dev` running frontend and backend concurrently). — **Reversibility:** costly — defines repository development lifecycle.
- **D-06:** Typed TypeScript API client wrapper with response schemas mirroring backend Pydantic models and unified toast notifications for errors. — **Reversibility:** costly — standardizes client-side HTTP calls.
- **D-07:** Vite development server proxy routes all `/api/*` traffic directly to FastAPI on `localhost:8000`, eliminating local CORS friction. — **Reversibility:** reversible — configured in `vite.config.ts`.
- **D-08:** Standardized API response envelope: `{ success: boolean, data: T, error?: { code: string, message: string } }` across all backend endpoints. — **Reversibility:** one-way — changing this later breaks frontend-backend contract.

### AI Provider Abstraction & Stub Provider
- **D-09:** Abstract Base Class (`AIProvider`) defining async methods: `health_check() -> dict`, `extract_dna(seed: str) -> SeedDNA`, `generate_worlds(dna: SeedDNA) -> List[WorldCandidate]`, and `unfold_stage(stage, context) -> StageOutput`. — **Reversibility:** costly — foundation for all downstream AI generation phases.
- **D-10:** Mock Provider implemented in Phase 1 returning canonical underwater city fixtures and deterministic mock data matching schemas for instant zero-key testing. — **Reversibility:** reversible — mock provider implements same ABC.
- **D-11:** Dynamic provider factory configured via environment variable (`AI_PROVIDER=mock|gemini`), automatically falling back to mock provider if API keys are absent or invalid. — **Reversibility:** reversible.
- **D-12:** Upstream provider failure resilience: catch API timeouts/rate-limits and return fallback fixtures with a `{ fallback_used: true, warning: '...' }` metadata envelope. — **Reversibility:** reversible.

### Initial State & Persistence Bootstrap
- **D-13:** SQLModel / SQLAlchemy 2.0 async engine configuring PostgreSQL / Supabase as the primary persistence target, defaulting to local SQLite fallback if `DATABASE_URL` is unset. — **Reversibility:** costly — database engine and model definition.
- **D-14:** Zustand store in React for decoupled, reactive workspace state (active project, current stage, seed input, inspector drawer state). — **Reversibility:** costly — central frontend state management.
- **D-15:** Browser `localStorage` session caching so refreshing or reconnecting preserves the active workspace in progress. — **Reversibility:** reversible.
- **D-16:** Clean Repository pattern (`ProjectRepository`) abstracting DB queries from route handlers, making storage interchangeable and testable. — **Reversibility:** costly — service layer architecture.

### The Agent's Discretion
- Concrete utility naming, CSS animation durations, and initial toast UI library choice are left to implementation discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Rules & Foundation Decisions
- `PROJECT_RULES.md` — Permanent Product, UX, and Architecture rules
- `docs/decisions/ADR-001-architecture-foundation.md` — Core architecture, PostgreSQL/Supabase persistence direction, and SQLite fallback
- `docs/decisions/ADR-002-branching-and-traceability.md` — Exactly 3 Worlds branching model, human choice gate, and DAG provenance model

### Architecture & Provenance Specifications
- `docs/architecture/SYSTEM_ARCHITECTURE.md` — High-level stack overview, provider abstraction, data flow
- `docs/architecture/TRACEABILITY_MODEL.md` — Provenance DAG schema, nodes, edges, queries
- `docs/architecture/DEMO_FIXTURES.md` — Canonical underwater city seed and 3 demo worlds

### Product Specifications
- `docs/product/CONCEPTS.md` — Definitions of all 17 fundamental product entities
- `docs/product/README.md` — Master workflow and core loop
- `startDocs/Seed_Unfold_Complete_Project_Documentation.pdf` pp. 9, 14, 18 — Hackathon architecture, data models, persistence
- `startDocs/Seed Unfold technical project documentation.pdf` pp. 12, 14 — Story-world engine technical specifications

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — Greenfield Phase 1 establishing the codebase shell.

### Established Patterns
- Permanent rules defined in `PROJECT_RULES.md` governing text-first vertical slicing, schema validation, and provider decoupling.

### Integration Points
- Root monorepo scripts dispatching to `frontend/` and `backend/`.
- Frontend `/api` proxy routing to FastAPI backend.
- FastAPI dependency injection providing `AIProvider` and `ProjectRepository`.

</code_context>

<specifics>
## Specific Ideas

- The workspace should immediately feel like a serious creative development IDE (like a dark-mode specialized CAD or audio workstation), completely avoiding conversational chatbot bubbles.
- Right-side drawer slides in smoothly when clicking "Inspect DNA" or "Trace Provenance" from the top navigation.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion strictly remained within Phase 1 foundation boundaries.

</deferred>

---

*Phase: 1-Foundation / Project Shell*  
*Context gathered: 2026-10-04*
