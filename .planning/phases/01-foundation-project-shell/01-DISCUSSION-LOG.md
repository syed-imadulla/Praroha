# Phase 1: Foundation / Project Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-04  
**Phase:** 01-foundation-project-shell  
**Areas discussed:** Workspace Layout & Shell Aesthetics, Frontend-Backend Communication & Monorepo Structure, AI Provider Abstraction & Stub Provider, Initial State & Persistence Bootstrap

---

## Workspace Layout & Shell Aesthetics

| Option | Description | Selected |
|---|---|---|
| Top stage progression header, central unfolding canvas, collapsible right inspection drawer | Structured creative workspace layout with dedicated inspectable panels | ✓ |
| Full-width centered vertical stream with modal/bottom drawer | Simpler single-column feed layout | |
| Multi-column IDE layout with permanent left navigation and right inspector | Complex 3-column fixed IDE layout | |

**User's choice:** Top stage progression header, central unfolding canvas, and a collapsible right-side inspection drawer (for Seed DNA & Traceability).

| Option | Description | Selected |
|---|---|---|
| Deep slate/zinc dark theme (#090D16 / #0F172A) with subtle borders, glowing cyan/emerald accents | Calm, focused creative workspace with vibrant accents | ✓ |
| Monochrome OLED pure black (#000000) with minimalist white/gray | High-contrast stark black theme | |
| Dark navy/abyssal oceanic theme (#050C1A) | Themed around oceanic palette | |

**User's choice:** Deep slate/zinc dark theme with cyan/emerald glowing accents and Inter/Outfit typography.

| Option | Description | Selected |
|---|---|---|
| Progressive disclosure: unlocked stages active; future stages dim/locked | Step-by-step disclosure preventing jumping ahead | ✓ |
| Free tabbed navigation: all stages visible with empty states | Open tabbed model | |

**User's choice:** Progressive disclosure navigation.

| Option | Description | Selected |
|---|---|---|
| Clean top utility bar showing Project Title, active branch badge, save/sync indicator, New Seed action | Clear high-level status and session controls | ✓ |
| Minimal floating pills overlaid on canvas | Super-minimal floating UI | |

**User's choice:** Clean top utility bar with project title, branch badge, save status, and restart button.

---

## Frontend-Backend Communication & Monorepo Structure

| Option | Description | Selected |
|---|---|---|
| Clean monorepo with frontend/ (React+Vite) and backend/ (FastAPI), with root scripts | Unified repository workflow running both servers concurrently | ✓ |
| Independent workspaces with separate terminal commands | Decoupled directories without root scripts | |

**User's choice:** Clean monorepo with `frontend/` and `backend/` and root `package.json` scripts.

| Option | Description | Selected |
|---|---|---|
| Typed TypeScript API client wrapper mirroring backend Pydantic models | Type-safe, centralized fetch wrapper | ✓ |
| TanStack Query hooks fetching from FastAPI | Dedicated server-state management library | |
| Standard Axios client with interceptors | Axios HTTP client instance | |

**User's choice:** Typed TypeScript API client wrapper with schemas mirroring Pydantic contracts.

| Option | Description | Selected |
|---|---|---|
| Vite proxy configured so /api/* routes directly to FastAPI on localhost:8000 | Transparent local proxying eliminating dev CORS friction | ✓ |
| Direct cross-origin requests with FastAPI CORS middleware | Separate origin calls | |

**User's choice:** Vite proxy for transparent local API routing.

| Option | Description | Selected |
|---|---|---|
| Explicit standardized API response envelope: { success, data, error } | Consistent response format across all endpoints | ✓ |
| Direct JSON response bodies matching Pydantic models directly | Raw models with HTTP error codes | |

**User's choice:** Standardized API response envelope `{ success: boolean, data: T, error?: { code, message } }`.

---

## AI Provider Abstraction & Stub Provider

| Option | Description | Selected |
|---|---|---|
| Abstract Base Class (ABC) in backend with async methods | Python ABC with async extract_dna, generate_worlds, unfold_stage, health_check | ✓ |
| Python Protocol with duck-typing | Protocol-based typing | |
| Functional adapter dispatch table | Functional mapping dictionary | |

**User's choice:** Abstract Base Class (`AIProvider`) with typed async methods.

| Option | Description | Selected |
|---|---|---|
| Mock provider returning canonical underwater city fixtures and deterministic mock data | Instant zero-key local testing and 100% demo resilience | ✓ |
| Stub provider returning echo/dummy strings | Generic lorem ipsum placeholder text | |

**User's choice:** Mock provider returning canonical underwater city fixtures and schema-valid mock data.

| Option | Description | Selected |
|---|---|---|
| Dynamic provider factory via env (AI_PROVIDER=mock\|gemini), falling back to mock | Safe configuration with automatic fallback | ✓ |
| Strict provider selection: fail startup if live key missing | Hard failure mode | |

**User's choice:** Dynamic provider factory via env with automatic mock fallback.

| Option | Description | Selected |
|---|---|---|
| Catch upstream AI timeouts/errors and return fallback fixtures with metadata warning | Graceful degradation preserving UI functionality | ✓ |
| Propagate exceptions as standard HTTP 502/504 errors | Hard error propagation | |

**User's choice:** Catch upstream timeouts/errors and return fallback fixtures with `{ fallback_used: true, warning: '...' }`.

---

## Initial State & Persistence Bootstrap

| Option | Description | Selected |
|---|---|---|
| SQLModel / SQLAlchemy 2.0 async engine: SQLite fallback by default, PostgreSQL/Supabase via DATABASE_URL | Dual-target persistence engine ready for local and production | ✓ |
| Strict PostgreSQL/Supabase requirement from Phase 1 | Immediate cloud DB connection required | |
| Pure in-memory dictionary repository for Phase 1 | Defer DB schema to Phase 7 | |

**User's choice:** SQLModel / SQLAlchemy 2.0 async engine defaulting to SQLite fallback, with PostgreSQL/Supabase support when `DATABASE_URL` is set.

| Option | Description | Selected |
|---|---|---|
| Zustand store for reactive, decoupled workspace state | Lightweight, ergonomic state management | ✓ |
| React Context API with useReducer | Built-in React state management | |

**User's choice:** Zustand store.

| Option | Description | Selected |
|---|---|---|
| Browser localStorage persistence for current active session | State survives browser refresh | ✓ |
| SessionStorage only | Resets on tab close | |
| No client-side caching in Phase 1 | State resets on refresh | |

**User's choice:** Browser localStorage persistence for active session state.

| Option | Description | Selected |
|---|---|---|
| Clean Repository pattern (ProjectRepository) abstracting DB queries | Encapsulated, testable database operations | ✓ |
| Direct database session queries inside FastAPI route functions | Inline queries in routes | |

**User's choice:** Clean Repository pattern (`ProjectRepository`).

---

## The Agent's Discretion
- Utility functions, CSS transition durations, and toast notifications component choice left to implementation.

## Deferred Ideas
None — discussion stayed strictly within Phase 1 foundation scope.
