# Phase 1: Foundation / Project Shell - Research

**Researched:** 2026-10-04  
**Domain:** Full-Stack Monorepo Shell (React + Vite + TypeScript / FastAPI + Pydantic / Provider Abstraction / SQLModel Persistence & StorageProvider)  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Top stage progression header, central unfolding canvas, collapsible right-side inspection drawer for Seed DNA & Traceability.
- **D-02:** Deep slate/zinc dark theme (`#090D16` / `#0F172A`) with subtle borders, glowing cyan/emerald accent highlights, and Inter/Outfit typography.
- **D-03:** Progressive disclosure navigation: only unlocked stages are active/clickable; future stages appear dim/locked.
- **D-04:** Top utility bar displaying Project Title ("Seed Unfold / Praroha"), active branch badge, save/sync status indicator, and a "New Seed" restart action.
- **D-05:** Monorepo with `frontend/` (React+Vite) and `backend/` (FastAPI+Python), orchestrated via root `package.json` scripts (`npm run dev` running both concurrently).
- **D-06:** Typed TypeScript API client wrapper with schemas mirroring backend Pydantic models and unified toast notifications for errors.
- **D-07:** Vite development server proxy routing all `/api/*` traffic directly to FastAPI on `localhost:8000`, eliminating local CORS friction.
- **D-08:** Standardized API response envelope: `{ success: boolean, data: T, error?: { code: string, message: string } }`.
- **D-09:** Abstract Base Class (`AIProvider`) defining async methods: `health_check() -> dict`, `extract_dna(seed: str) -> SeedDNA`, `generate_worlds(dna: SeedDNA) -> List[WorldCandidate]`, and `unfold_stage(stage, context) -> StageOutput`.
- **D-10:** Mock Provider implemented in Phase 1 returning canonical underwater city fixtures and deterministic mock data matching schemas for instant zero-key testing.
- **D-11:** Dynamic provider factory configured via environment variable (`AI_PROVIDER=mock|gemini`), automatically falling back to mock provider if API keys are absent or invalid.
- **D-12:** Upstream provider failure resilience: catch API timeouts/rate-limits and return fallback fixtures with a `{ fallback_used: true, warning: '...' }` metadata envelope.
- **D-13:** SQLModel / SQLAlchemy 2.0 async engine configuring PostgreSQL / Supabase as the primary persistence target, defaulting to local SQLite fallback if `DATABASE_URL` is unset.
- **D-14:** Zustand store in React for decoupled, reactive workspace state (active project, current stage, seed input, inspector drawer state).
- **D-15:** Browser `localStorage` session caching so refreshing or reconnecting preserves active workspace in progress.
- **D-16:** Clean Repository pattern (`ProjectRepository`) abstracting DB queries from route handlers, making storage interchangeable and testable.
- **D-17:** `StorageProvider` abstraction: `upload(bytes, key, mime_type) -> str`, `get_url(key) -> str`, `delete(key) -> bool` defined as an ABC in backend, with Supabase Storage as primary and local filesystem fallback (`./uploads/`) as default for zero-cloud local dev.
- **D-18:** Asset Separation Contract: Binary files are never stored in PostgreSQL; asset metadata is defined in SQLModel/Pydantic schemas; causal provenance remains the domain of the Traceability DAG.

### The Agent's Discretion
- Utility functions, CSS transition durations, and toast notifications component choice left to implementation.

### Deferred Ideas (OUT OF SCOPE)
- Autonomous multi-agent swarms, external graph databases (Neo4j), real-time collaboration, video/voice generation pipelines.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Workspace Layout & Stage Navigation | Browser / React Client | — | Client-side reactive layout, progressive disclosure, animations |
| Client State & Session Cache | Browser / Zustand | LocalStorage | Instant optimistic UI updates and session recovery across browser refreshes |
| API Orchestration & Routing | API / FastAPI Backend | — | Typed endpoints, error envelope formatting, CORS/proxy target |
| AI Provider Abstraction | API / Python Layer | — | Provider factory, LLM prompt formatting, timeout handling, fallback fixtures |
| Asset Metadata Persistence | Database / PostgreSQL | SQLite (local fallback) | Normalized schema for projects, stages, entities, and asset references |
| Binary Asset Storage | Object Storage / Supabase | Local Filesystem (local dev) | Pure binary payload storage; completely decoupled from PostgreSQL tables |
| Traceability Lineage DAG | API / Relational Schema | Client Inspector | DAG edge recording and path queries connecting entities to root decisions |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 establishes the complete foundation and walking skeleton for **Seed Unfold**. To maintain maximum agility, rock-solid schema validation, and zero-friction developer setup:
1. **Frontend Architecture**: A React 18+ Single Page Application created with Vite and TypeScript. Styled with Tailwind CSS configured with a calm, dark palette (`#090D16` / `#0F172A`) and Framer Motion for progressive disclosure transitions. State is governed by a lightweight Zustand store with `localStorage` persistence.
2. **Backend Architecture**: A FastAPI service structured around Pydantic v2 models and SQLModel (SQLAlchemy 2.0 async engine). The backend implements standardized API response envelopes (`{ success, data, error }`), clean dependency injection for the `AIProvider` and `StorageProvider`, and repository abstraction (`ProjectRepository`).
3. **Resilience & Fallback First**: The backend boots seamlessly without requiring external credentials:
   - Database defaults to local SQLite (`sqlite+aiosqlite:///./seed_unfold.db`) if `DATABASE_URL` is unset, and connects to Supabase/PostgreSQL when provided.
   - AI Provider defaults to `MockProvider` returning the canonical underwater city fixtures (`Lost Civilization`, `Bio-City`, `Time Capsule`).
   - Storage Provider defaults to `LocalStorageProvider` saving uploads to `./uploads/`.

**Primary recommendation:** Build Phase 1 in two tightly coupled vertical tracer plans: (1) Backend Foundation & Core Contracts (FastAPI, schemas, mock AI provider, storage provider, SQLite/PostgreSQL engine), and (2) Frontend Workspace Shell & Integration (React+Vite, dark theme, stage progression bar, inspection drawer, typed API client wired to backend).
</research_summary>

<standard_stack>
## Standard Stack

### Frontend Core
| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| `react` / `react-dom` | ^18.3.1 | Core UI runtime | Component hierarchy, hooks, modern React ecosystem |
| `vite` | ^5.4.0 | Build tool & dev server | Instant HMR, lightweight proxying, TypeScript support |
| `typescript` | ^5.5.0 | Type safety | Catch errors at compile time, type-safe API client |
| `tailwindcss` | ^3.4.0 | Styling & Design System | Dark mode utility classes, custom color tokens |
| `framer-motion` | ^11.5.0 | Micro-animations & disclosure | Smooth accordion/drawer transitions, progressive disclosure effects |
| `lucide-react` | ^0.440.0 | Iconography | Clean, consistent, tree-shakeable icons |
| `zustand` | ^4.5.0 | Workspace state management | Simple, boilerplate-free state with built-in persist middleware |

### Backend Core
| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| `fastapi` | ^0.115.0 | Async web framework | High performance, automatic OpenAPI specs, native Pydantic support |
| `uvicorn` | ^0.30.0 | ASGI web server | Production-grade async HTTP server |
| `pydantic` | ^2.9.0 | Schema validation | Strict data contract enforcement across AI inputs/outputs |
| `sqlmodel` / `sqlalchemy` | ^0.0.22 / ^2.0.35 | Async ORM & DB schema | Combines Pydantic and SQLAlchemy; seamless async support |
| `aiosqlite` | ^0.20.0 | Local SQLite async driver | Zero-dependency local development and testing |
| `asyncpg` | ^0.29.0 | PostgreSQL async driver | Production driver for Supabase / PostgreSQL |
| `python-dotenv` | ^1.0.0 | Environment management | Safe configuration loading (`.env`) |
| `httpx` | ^0.27.0 | Async HTTP client | Clean async requests for live AI and Supabase Storage |

### Monorepo & Tooling
| Tool | Version | Purpose | Why Standard |
|---|---|---|---|
| `concurrently` | ^8.2.0 | Dev process orchestration | Runs frontend and backend in a single terminal with color-coded logs |
| `pytest` / `pytest-asyncio` | ^8.3.0 | Backend test suite | Industry standard async test framework |
| `vitest` | ^2.1.0 | Frontend test suite | Native Vite-powered unit and component testing |
</standard_stack>

<architecture_patterns>
## Architecture Patterns & Implementation Blueprint

### 1. Monorepo Organization
```
Praroha/
├── package.json               # Root scripts: "dev", "install:all", "test"
├── .gitignore
├── PROJECT_RULES.md
├── docs/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts         # Proxy config: /api -> http://127.0.0.1:8000
│   ├── tailwind.config.js     # Dark theme colors (#090D16, #0F172A)
│   ├── tsconfig.json
│   └── src/
│       ├── api/               # Typed API client wrapper
│       ├── components/        # Shell layout, StageBar, InspectorDrawer
│       ├── store/             # Zustand workspace store
│       └── types/             # Frontend models matching backend Pydantic
└── backend/
    ├── requirements.txt
    ├── app/
    │   ├── main.py            # FastAPI entrypoint & middleware
    │   ├── config.py          # Settings loading (Pydantic BaseSettings)
    │   ├── core/              # Standard response envelopes & exceptions
    │   ├── models/            # SQLModel & Pydantic domain models
    │   ├── providers/         # AIProvider & StorageProvider ABCs + implementations
    │   ├── repositories/      # ProjectRepository DB abstraction
    │   ├── routers/           # /api/health, /api/projects, /api/seed
    │   └── fixtures/          # Canonical demo fixtures
    └── tests/
```

### 2. Standardized Response Envelope
```python
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None
    fallback_used: bool = False
    warning: Optional[str] = None
```

### 3. AI Provider ABC Contract
```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class AIProvider(ABC):
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def extract_dna(self, seed: str) -> "SeedDNAResponse":
        pass

    @abstractmethod
    async def generate_worlds(self, dna: "SeedDNAResponse") -> List["WorldCandidateResponse"]:
        pass

    @abstractmethod
    async def unfold_stage(self, stage: str, context: Dict[str, Any]) -> Dict[str, Any]:
        pass
```

### 4. Storage Provider ABC Contract
```python
from abc import ABC, abstractmethod

class StorageProvider(ABC):
    @abstractmethod
    async def upload(self, file_data: bytes, key: str, mime_type: str) -> str:
        """Uploads binary file and returns public or signed access URL."""
        pass

    @abstractmethod
    async def get_url(self, key: str) -> str:
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        pass
```
</architecture_patterns>

<pitfalls>
## Common Pitfalls & Landmines

1. **Vite Proxy vs Direct CORS**: If the Vite proxy is not configured with `changeOrigin: true` and rewrite rules, requests to `/api/health` fail with CORS errors when testing locally.
2. **Pydantic v1 vs v2 Syntax**: Ensure `model_config = ConfigDict(...)` and `model_dump()` are used instead of legacy `class Config` and `.dict()`.
3. **Async SQLite Table Locking**: When using `aiosqlite`, ensure transactions are cleanly committed or scoped with session context managers (`async with AsyncSession(engine) as session:`) to prevent database lock timeouts.
4. **Binary Bloat in Relational Schemas**: Never create binary or byte array columns on the `Asset` table; only store `storage_key`, `mime_type`, and `size_bytes`.
</pitfalls>

<validation_architecture>
## Validation Architecture

### Verification Strategy
- **Backend Unit & Integration Tests**: `pytest -v backend/tests/` verifies health check endpoint, Pydantic schema validation, Mock AI provider outputs, and SQLite repository queries.
- **Frontend Build & Unit Tests**: `npm run build --prefix frontend` validates TypeScript compilation, JSX syntax, and CSS generation.
- **End-to-End Shell Connectivity**: Automated curl/fetch test verifying that `GET /api/health` returns `{ success: true, data: { status: "healthy", provider: "mock", storage: "local" } }` via Vite proxy.

### Automated Test Commands
- **Quick Test (Backend)**: `pytest backend/tests/test_health.py` (< 2s)
- **Quick Test (Frontend)**: `npm run build --prefix frontend` (< 4s)
- **Full Suite**: `pytest backend/tests/ && npm run build --prefix frontend` (< 10s)
</validation_architecture>
