# Graph Report - Praroha  (2026-10-04)

## Corpus Check
- 57 files · ~103,927 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .css 1, .ini 1)

## Summary
- 451 nodes · 675 edges · 32 communities (24 shown, 8 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1eb089c0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AIProvider
- ProjectRepository
- frontend/package.json
- App.tsx
- main.py
- Phase 1: Foundation / Project Shell - Research
- Implementation Decisions
- Seed Unfold — Product Concepts Glossary
- compilerOptions
- v1 Requirements (MVP)
- package.json
- Phase Details
- Seed Unfold (Praroha)
- Project State: Seed Unfold
- 2. The Three Demo Worlds
- Phase 1: Foundation / Project Shell - Discussion Log
- Phase 1 — Validation Strategy
- Seed Unfold — Traceability & Provenance Model
- ADR-001: Core Architecture & Stack Selection
- ADR-002: Three-World Branching and Traceability DAG
- ADR-003: Cloud Object Storage and Asset Management
- Seed Unfold — Product Documentation
- Seed Unfold — Project Wiki Index
- Seed Unfold — Project Rules
- Seed Unfold Agent Instructions
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `AIProvider` - 28 edges
2. `ProjectRepository` - 24 edges
3. `StorageProvider` - 21 edges
4. `Seed Unfold — Product Concepts Glossary` - 18 edges
5. `MockProvider` - 16 edges
6. `LocalStorageProvider` - 16 edges
7. `compilerOptions` - 16 edges
8. `Asset` - 11 edges
9. `useWorkspaceStore` - 11 edges
10. `APIResponse` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Edge Relationships` --references--> `Asset`  [INFERRED]
  docs/architecture/TRACEABILITY_MODEL.md → backend/app/models/project.py
- `Node Types` --references--> `Asset`  [INFERRED]
  docs/architecture/TRACEABILITY_MODEL.md → backend/app/models/project.py
- `Common Pitfalls & Landmines` --references--> `Asset`  [INFERRED]
  .planning/phases/01-foundation-project-shell/01-RESEARCH.md → backend/app/models/project.py
- `Decision` --references--> `AIProvider`  [INFERRED]
  docs/decisions/ADR-001-architecture-foundation.md → backend/app/providers/base.py
- `AI Provider Abstraction & Stub Provider` --references--> `AIProvider`  [INFERRED]
  .planning/phases/01-foundation-project-shell/01-CONTEXT.md → backend/app/providers/base.py

## Import Cycles
- None detected.

## Communities (32 total, 8 thin omitted)

### Community 0 - "AIProvider"
Cohesion: 0.06
Nodes (18): Settings, AIProvider, get_ai_provider(), get_storage_provider(), MockProvider, LocalStorageProvider, StorageProvider, SupabaseStorageProvider (+10 more)

### Community 1 - "ProjectRepository"
Cohesion: 0.10
Nodes (21): api_error(), api_success(), APIResponse, ErrorDetail, Asset, AssetBase, AssetCreate, AssetRead (+13 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.05
Nodes (40): dependencies, clsx, framer-motion, lucide-react, react, react-dom, tailwind-merge, zustand (+32 more)

### Community 3 - "App.tsx"
Cohesion: 0.14
Nodes (22): apiClient, App(), InspectorDrawer(), StageProgressHeader(), STAGES, TopBar(), WorkspaceCanvas(), DEFAULT_STAGES (+14 more)

### Community 4 - "main.py"
Cohesion: 0.09
Nodes (8): http_exception_handler(), lifespan(), init_db(), client(), event_loop(), initialize_test_db(), test_health_endpoint(), test_projects_crud()

### Community 5 - "Phase 1: Foundation / Project Shell - Research"
Cohesion: 0.10
Nodes (20): 1. Monorepo Organization, 2. Standardized Response Envelope, 3. AI Provider ABC Contract, 4. Storage Provider ABC Contract, Architectural Responsibility Map, Architecture Patterns & Implementation Blueprint, Automated Test Commands, Backend Core (+12 more)

### Community 6 - "Implementation Decisions"
Cohesion: 0.10
Nodes (19): AI Provider Abstraction & Stub Provider, Architecture & Provenance Specifications, Canonical References, Deferred Ideas, Established Patterns, Existing Code Insights, Frontend-Backend Communication & Monorepo Structure, Implementation Decisions (+11 more)

### Community 7 - "Seed Unfold — Product Concepts Glossary"
Cohesion: 0.11
Nodes (18): 10. Scenes, 11. Assets, 12. Traceability, 13. Refine, 14. Branch, 15. Save / Load, 16. Canon, 17. Provenance (+10 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 9 - "v1 Requirements (MVP)"
Cohesion: 0.12
Nodes (15): Collaboration & Publishing, Human World Selection (HCHO), Multimodal Pipeline, Out of Scope (Explicitly Excluded from MVP), Progressive World Unfolding (UNFL), Refine, Branch & Persistence (PERS), Reliability & Demo Resilience (DEMO), Requirements: Seed Unfold (+7 more)

### Community 10 - "package.json"
Cohesion: 0.13
Nodes (14): description, devDependencies, concurrently, name, private, scripts, dev, dev:backend (+6 more)

### Community 11 - "Phase Details"
Cohesion: 0.15
Nodes (12): Overview, Phase 1: Foundation / Project Shell, Phase 2: Seed Understanding + Seed DNA, Phase 3: Three World Generation, Phase 4: Human World Selection, Phase 5: Progressive World Unfolding, Phase 6: Traceability / Provenance, Phase 7: Refine / Branch / Save (+4 more)

### Community 12 - "Seed Unfold (Praroha)"
Cohesion: 0.17
Nodes (11): Active (MVP Scope), Business & Hackathon Context, Constraints, Context, Core Value, Key Decisions, Out of Scope (MVP), Requirements (+3 more)

### Community 13 - "Project State: Seed Unfold"
Cohesion: 0.18
Nodes (10): Accumulated Context, Architectural & Product Decisions, Blockers / Concerns, Current Position, Important Constraints & Guardrails, Pending Todos, Performance Metrics, Project Reference (+2 more)

### Community 15 - "2. The Three Demo Worlds"
Cohesion: 0.22
Nodes (8): 1. Canonical Demo Seed, 2. The Three Demo Worlds, 3. Fixture Role & Usage, Seed DNA Extraction (Deterministic Fixture), Seed Unfold — Canonical Demo Fixtures, World 1: Lost Civilization (Archaeological / Mythic), World 2: Bio-City (Symbiotic / Ecological), World 3: Time Capsule (Retro-Futuristic / Cold War)

### Community 16 - "Phase 1: Foundation / Project Shell - Discussion Log"
Cohesion: 0.25
Nodes (7): AI Provider Abstraction & Stub Provider, Deferred Ideas, Frontend-Backend Communication & Monorepo Structure, Initial State & Persistence Bootstrap, Phase 1: Foundation / Project Shell - Discussion Log, The Agent's Discretion, Workspace Layout & Shell Aesthetics

### Community 17 - "Phase 1 — Validation Strategy"
Cohesion: 0.25
Nodes (7): Manual-Only Verifications, Per-Task Verification Map, Phase 1 — Validation Strategy, Sampling Rate, Test Infrastructure, Validation Sign-Off, Wave 0 Requirements

### Community 18 - "Seed Unfold — Traceability & Provenance Model"
Cohesion: 0.29
Nodes (6): 1. Lineage Graph Model, 2. Core Provenance Queries, 3. Privacy & Explainability Constraints, Edge Relationships, Node Types, Seed Unfold — Traceability & Provenance Model

### Community 19 - "ADR-001: Core Architecture & Stack Selection"
Cohesion: 0.33
Nodes (5): ADR-001: Core Architecture & Stack Selection, Consequences, Context, Decision, Status

### Community 20 - "ADR-002: Three-World Branching and Traceability DAG"
Cohesion: 0.33
Nodes (5): ADR-002: Three-World Branching and Traceability DAG, Consequences, Context, Decision, Status

### Community 21 - "ADR-003: Cloud Object Storage and Asset Management"
Cohesion: 0.33
Nodes (5): ADR-003: Cloud Object Storage and Asset Management, Consequences, Context, Decision, Status

### Community 22 - "Seed Unfold — Product Documentation"
Cohesion: 0.33
Nodes (5): Key Concept Definitions, Overview, Primary References, Seed Unfold — Product Documentation, The Core Product Loop

### Community 23 - "Seed Unfold — Project Wiki Index"
Cohesion: 0.33
Nodes (5): 1. Product Documentation, 2. Architecture & Design, 3. Decisions & Rules, 4. Planning & Execution (GSD), Seed Unfold — Project Wiki Index

### Community 24 - "Seed Unfold — Project Rules"
Cohesion: 0.40
Nodes (4): 1. Product Rules, 2. UX Rules, 3. Architecture Rules, Seed Unfold — Project Rules

## Knowledge Gaps
- **182 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 255 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AIProvider` connect `AIProvider` to `ProjectRepository`, `Phase 1: Foundation / Project Shell - Research`, `Implementation Decisions`, `v1 Requirements (MVP)`, `Phase Details`, `Seed Unfold (Praroha)`, `Project State: Seed Unfold`, `Any`, `Phase 1: Foundation / Project Shell - Discussion Log`, `ADR-001: Core Architecture & Stack Selection`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **Why does `StorageProvider` connect `AIProvider` to `ProjectRepository`, `Phase 1: Foundation / Project Shell - Research`, `Implementation Decisions`, `Seed Unfold (Praroha)`, `Project State: Seed Unfold`, `ADR-003: Cloud Object Storage and Asset Management`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `ProjectRepository` connect `ProjectRepository` to `Phase 1: Foundation / Project Shell - Discussion Log`, `Phase 1: Foundation / Project Shell - Research`, `Implementation Decisions`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `AIProvider` (e.g. with `get_ai_provider()` and `health_check()`) actually correct?**
  _`AIProvider` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `ProjectRepository` (e.g. with `Asset` and `AssetCreate`) actually correct?**
  _`ProjectRepository` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `StorageProvider` (e.g. with `get_storage_provider()` and `health_check()`) actually correct?**
  _`StorageProvider` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `MockProvider` (e.g. with `test_mock_provider_extract_dna()` and `test_mock_provider_generate_worlds()`) actually correct?**
  _`MockProvider` has 6 INFERRED edges - model-reasoned connections that need verification._