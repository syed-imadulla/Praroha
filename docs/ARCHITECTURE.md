# PRAROHA — Technical Architecture

**Project:** PRAROHA  
**Core Concept:** Seed → Universe  
**Hackathon:** Vedanta Makeathon  
**Team:** Supreme  
**Status:** Completed Hackathon Technical Specification

---

## 1. System Overview

PRAROHA is designed as a modular, full-stack creative engine. It separates client-side state management, server-side orchestration, persistent relational storage, and third-party generative model providers behind strict abstraction boundaries.

```mermaid
graph TD
    subgraph Client ["Frontend Layer (React 18 + Vite + TypeScript)"]
        UI[Workspace Canvases: Stages 1–7]
        Store[Zustand Workspace Store]
        RealtimeSub[Supabase Realtime Subscriber]
        UI <--> Store
        Store <--> RealtimeSub
    end

    subgraph Server ["Backend Orchestrator (FastAPI + Python 3.10+)"]
        Router[FastAPI API Routers]
        UniService[UniverseService Orchestrator]
        MediaService[MediaService]
        LineageService[LineageService & DAG Builder]
        Repo[SQLModel Repository Layer]

        Router --> UniService
        Router --> MediaService
        Router --> LineageService
        UniService --> Repo
        MediaService --> Repo
        LineageService --> Repo
    end

    subgraph Storage ["Persistence & Data Layer"]
        DB[(PostgreSQL / SQLite)]
        Bucket[(Supabase Storage / Local Disk)]
        Repo --> DB
        MediaService --> Bucket
    end

    subgraph AIProviders ["AI Provider Abstraction Layer"]
        Gemini[GeminiProvider: Flash Models]
        Pollinations[PollinationsProvider: Flux / Sana]
        EdgeTTS[EdgeTTSProvider: Online Speech]
        StableAudio[StableAudioOpenProvider: Stable Audio 2]
        ACEStep[ACEStepAudioProvider / HF]

        UniService --> Gemini
        MediaService --> Pollinations
        MediaService --> EdgeTTS
        MediaService -.-> StableAudio
        MediaService -.-> ACEStep
    end

    Client -- REST API (Port 8000) --> Router
    RealtimeSub -- WebSockets (Postgres Changes) --> DB
```

---

## 2. Component Responsibilities

### Frontend Layer
- **Framework:** React 18 with Vite and TypeScript.
- **Styling & Design System:** Tailwind CSS following the botanical editorial aesthetic (Cream `#F8F4E8`, Forest Green `#294B3A`, Terracotta `#C38A66`, Cormorant Garamond headings, Inter body text).
- **State Management:** Zustand (`workspaceStore.ts`) providing reactive stage transitions, active entity selection, optimistic mutations, and localStorage rehydration.
- **Realtime Layer:** `frontend/src/realtime/projectSubscription.ts` establishes scoped channel subscriptions (`projects:<projectId>`) using `@supabase/supabase-js`, automatically reflecting server-side database mutations across concurrent browser tabs without manual page reloads.

### Backend Orchestration Layer
- **Framework:** FastAPI with Python 3.10+ async endpoints.
- **Domain Services:**
  - `UniverseService`: Coordinates the creative progression (Seed DNA extraction, 3-world synthesis, world selection commitment, and 5-layer universe unfolding).
  - `MediaService`: Manages asynchronous media generation jobs, rate-limit backoff, binary decoding, file storage, and entity attachment.
  - `LineageService`: Assembles and validates the Directed Acyclic Graph (DAG) of project entities, tracking ancestral origins and calculating causal diffs.
- **Data Access:** SQLModel / SQLAlchemy 2 async session management with schema validation using Pydantic v2.

---

## 3. Data Flow: From Seed to Universe

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Human Creator
    participant FE as Frontend (React)
    participant API as Backend (FastAPI)
    participant LLM as Google Gemini
    participant Media as Media Providers
    participant DB as Database (Postgres/SQLite)

    Creator->>FE: Enters initial narrative seed
    FE->>API: POST /api/projects (seed_text)
    API->>LLM: Distill Seed DNA (structured schema)
    LLM-->>API: Structured Seed DNA JSON
    API->>DB: Persist Project & SeedDNA records
    API-->>FE: Return Project + SeedDNA (Stage 2)

    FE->>API: POST /api/projects/{id}/worlds/generate
    API->>LLM: Synthesize 3 high-contrast candidate worlds
    LLM-->>API: 3 World Candidate objects
    API->>DB: Persist WorldCandidate records
    API-->>FE: Return 3 Candidates (Stage 3)

    Creator->>FE: Selects World & writes decision rationale
    FE->>API: POST /api/projects/{id}/worlds/select (Decision DNA)
    API->>DB: Commit WorldSelection record (Locks choice)
    API-->>FE: Return confirmed selection (Stage 4)

    Creator->>FE: Requests Universe Unfolding
    FE->>API: POST /api/projects/{id}/unfold
    API->>LLM: Unfold World Bible, Characters, Relationships, Scenes
    LLM-->>API: Structured 5-layer Universe Codex
    API->>DB: Persist Codex & build Lineage DAG nodes
    API-->>FE: Return Unfolded Universe (Stage 5)

    Creator->>FE: Triggers media generation on scene/character
    FE->>API: POST /api/media/generate (entity_id, type)
    alt Image Request
        API->>Media: Pollinations.ai (Flux/Sana)
    else Voice Request
        API->>Media: Microsoft Edge-TTS (Neural voice)
    end
    Media-->>API: Binary media payload
    API->>DB: Store MediaAsset & attach to Entity
    API-->>FE: Return MediaAsset URL & metadata
```

---

## 4. Database Entities and Data Model

The relational schema ensures complete referential integrity across all stages of creation:

```mermaid
erDiagram
    PROJECT ||--|| SEED_DNA : has
    PROJECT ||--o{ WORLD_CANDIDATE : explores
    PROJECT ||--o| WORLD_SELECTION : commits
    PROJECT ||--o| UNFOLDED_UNIVERSE : contains
    PROJECT ||--o{ GENERATION_JOB : tracks
    PROJECT ||--o{ TRACE_NODE : maps

    UNFOLDED_UNIVERSE ||--o{ CHARACTER : features
    UNFOLDED_UNIVERSE ||--o{ RELATIONSHIP : maps
    UNFOLDED_UNIVERSE ||--o{ SCENE : depicts
    CHARACTER ||--o{ MEDIA_ASSET : portrays
    SCENE ||--o{ MEDIA_ASSET : illustrates

    TRACE_NODE ||--o{ TRACE_EDGE : connects_from
    TRACE_NODE ||--o{ TRACE_EDGE : connects_to
```

### Core Schema Definitions
1. **Project (`projects`):** Root record storing title, creator `owner_id`, active stage, timestamps, and soft-delete graveyard state.
2. **SeedDNA (`seed_dna`):** Core motifs, thematic vectors, negative constraints, and aesthetic tone extracted from the seed.
3. **WorldCandidate (`world_candidates`):** Candidate title, high concept, aesthetic rules, and divergence axis metrics.
4. **WorldSelection (`world_selections`):** Selected world foreign key, human decision rationale, priorities, and rejected alternatives.
5. **UnfoldedUniverse (`unfolded_universes`):** JSON-backed World Bible (factions, canon laws, locations, magic/technology systems).
6. **Character (`characters`):** Name, archetype, motivation, flaw, backstory, and visual prompt descriptor.
7. **Relationship (`character_relationships`):** Source character, target character, relationship dynamic, and conflict narrative.
8. **Scene (`story_scenes`):** Sequence order, setting, dramatic conflict, and narrative beat.
9. **MediaAsset (`media_assets`):** Binary storage URL, asset type (image, voice, narration, atmosphere), provider name, MIME type, and entity foreign key.
10. **TraceNode & TraceEdge (`trace_nodes`, `trace_edges`):** Relational DAG representation storing node type, entity reference, origin tier, and parent connections.

---

## 5. Provenance & The Lineage DAG

PRAROHA models creative lineage using an explicit **Directed Acyclic Graph (DAG)**:

- **Node Types:** `SEED`, `SEED_DNA`, `WORLD_CANDIDATE`, `WORLD_SELECTION`, `WORLD_BIBLE_RULE`, `CHARACTER`, `RELATIONSHIP`, `SCENE`.
- **Origin Classifications:**
  - `SEED_EXPLICIT`: Directly mentioned in the user's initial prompt.
  - `SEED_INFERRED`: Logically deduced by Gemini during DNA analysis.
  - `HUMAN_DECISION`: Injected explicitly by the creator during world selection or Human-Only Zone definition.
  - `DERIVED`: Synthesized during progressive unfolding to support other entities.
  - `AI_INTRODUCED`: Creative embellishment introduced during scene or character generation.

The lineage engine guarantees topological consistency, allowing the **Causal Inspector** to traverse ancestor paths without circular dependencies.

---

## 6. Security, Ownership, and Secrets Management

1. **Server-Side API Key Storage:** All third-party AI keys (`GEMINI_API_KEY`, `POLLINATIONS_API_KEY`, `STABILITY_API_KEY`, `HF_TOKEN`) reside strictly in server-side environment variables. No external provider keys are bundled into the client-side JavaScript bundle or exposed via client-facing HTTP headers.
2. **Project Ownership Guards:** Every authenticated request verifies the caller's Supabase JWT. Projects are bound to `owner_id`. Backend endpoints reject unauthorized access with HTTP 404/403.
3. **Data Sanitization:** Input seeds are sanitized, and LLM outputs are validated against strict Pydantic models before being written to persistent storage.
4. **Resilient Failure Handling:** In Real Mode, if a third-party provider fails or lacks credits, the system registers a clean error badge and preserves a retry action. It never simulates fake outputs.
