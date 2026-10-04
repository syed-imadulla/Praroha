# ADR-001: Core Architecture & Stack Selection

## Status
Accepted (Revised)

## Context
Seed Unfold is an AI-powered creative development workspace requiring high responsiveness, strict schema validation for AI outputs, progressive disclosure UX, rapid local iteration, and a durable, relational persistence architecture for story-world entities and their causal provenance.

The source documentation specifies:
- Frontend: React + Vite + TypeScript + Tailwind CSS + Framer Motion
- Backend: Python + FastAPI + Pydantic
- Persistence: PostgreSQL / Supabase as the intended managed database
- Data Model: Relational schema for core entities (projects, seeds, DNA, worlds, bibles, characters, relationships, scenes, assets)
- Traceability: Modeled through explicit nodes and edges / Directed Acyclic Graph (DAG) relationships connecting entities back to root decisions, rather than a dedicated graph database engine.

## Decision
1. **Frontend**: React 18+ with Vite and TypeScript. Styling via Tailwind CSS with a dark mode design palette and Framer Motion for progressive disclosure transitions.
2. **Backend**: Python 3.11+ with FastAPI and Pydantic v2. Provides asynchronous execution, typed data contracts, and first-class compatibility with AI provider libraries.
3. **AI Layer**: Abstract provider interface (`AIProvider`) decoupling application logic from concrete LLM APIs (Gemini, Claude, OpenAI) with deterministic fallbacks.
4. **Persistence Direction**: **PostgreSQL / Supabase** is the primary, intended persistence direction. Core domain entities are structured according to a normalized relational data model. SQLite is recognized strictly as an optional local development / offline demo fallback, not the final persistence architecture.
5. **Traceability & Relationship Model**: Traceability is treated as the provenance and causal relationship model across entities—represented through explicit nodes and edges / DAG relationships stored within the relational schema. It is not conflated with the database engine itself, and no external graph database (e.g., Neo4j) is required for the MVP.
6. **Modular Monolith**: A unified single-service backend avoids premature microservices complexity while maintaining clean module boundaries.

## Consequences
- **Positive**: Strict alignment with technical source documentation; robust relational integrity for core entities; clear separation between the storage engine (PostgreSQL/Supabase) and the provenance model (DAG relationships); zero-risk offline demo capability via SQLite fallback.
- **Negative**: Relational schema migrations must be maintained; DAG traversals are handled via relational queries or in-memory graph utilities rather than graph query languages.
