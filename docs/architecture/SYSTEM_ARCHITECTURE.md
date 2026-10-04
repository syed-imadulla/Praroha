# Seed Unfold — System Architecture

This document records the intended architectural direction, technical stack, and design patterns for the **Seed Unfold** platform.

---

## 1. Technical Stack Overview

| Layer | Recommended Technology | Purpose & Rationale |
|---|---|---|
| **Frontend** | React 18+ / Vite / TypeScript | Fast, type-safe Single Page Application with rapid HMR |
| **Styling** | Tailwind CSS + Framer Motion | Calm dark mode design tokens, smooth progressive disclosure animations |
| **Backend** | Python 3.11+ / FastAPI | High-performance asynchronous API, native Pydantic integration |
| **Data Validation** | Pydantic v2 | Strict schema validation for all incoming and AI-generated outputs |
| **AI Integration** | Gemini (or OpenAI / Claude) via Provider Abstraction | Structured generation with temperature control and deterministic fallbacks |
| **Storage / Persistence** | SQLite / JSON (local MVP) → PostgreSQL / Supabase | Relational tables for entities and JSON columns for lineage DAGs |
| **Optional Multimodal** | Imagen / Stable Diffusion / ElevenLabs (future) | Plug-in asset generation without blocking core text-first workflows |

---

## 2. Architectural Principles & Boundaries

1. **Text-First Vertical Slice**: The MVP prioritizes rock-solid text generation, Seed DNA extraction, three-world comparison, human selection, and narrative unfolding. Media generation (images/audio/video) is strictly non-blocking.
2. **AI Provider Abstraction**: AI services are accessed through an abstract interface (`AIProvider`):
   ```python
   class AIProvider(ABC):
       async def extract_dna(self, seed: str) -> SeedDNA: ...
       async def generate_worlds(self, dna: SeedDNA) -> List[WorldCandidate]: ...
       async def unfold_stage(self, stage: StageType, context: UnfoldContext) -> StageOutput: ...
   ```
   No frontend or core backend business logic binds directly to SDK-specific clients.
3. **Strict Schema Enactment**: Every LLM response is requested with structured output constraints and validated through Pydantic models before being stored or served to the client.
4. **Deterministic Fallbacks & Demo Fixtures**: When external AI APIs are unreachable, rate-limited, or offline, the backend seamlessly falls back to pre-compiled fixture data (e.g. for the canonical underwater city demo seed).
5. **Traceability DAG (Directed Acyclic Graph)**: Every entity maintains explicit parent-child reference arrays in the database. No heavyweight external graph database (like Neo4j) is needed for the MVP.

---

## 3. Data Flow Diagram

```
[ User Input (Seed) ]
         │
         ▼
[ FastAPI /api/seed/understand ] ────> [ AI Provider Adapter ]
         │                                       │ (extract_dna)
         ▼                                       ▼
  [ Seed DNA Record ] <────────────── [ Structured Pydantic Output ]
         │
         ▼
[ FastAPI /api/worlds/generate ] ───> [ AI Provider Adapter ]
         │                                       │ (generate_3_worlds)
         ▼                                       ▼
 [ 3 World Candidates ] <───────────── [ 3 Distinct Worlds Schema ]
         │
         ▼
 [ Human Selection Gate (UI) ]
         │
         ▼
[ Selected World State ]
         │
    ┌────┴──────────────────────────┐
    ▼                               ▼
[ Progressive Unfolding ]   [ Traceability Lineage Engine ]
(Bible, Characters, Scenes)   (Parent-Child DAG Nodes)
    │                               │
    └──────────────┬────────────────┘
                   ▼
     [ Persistence / Export API ]
```
