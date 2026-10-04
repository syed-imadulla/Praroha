# Graph Report - Praroha  (2026-10-04)

## Corpus Check
- 74 files · ~113,046 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .css 1, .ini 1)

## Summary
- 568 nodes · 929 edges · 37 communities (28 shown, 9 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `672c3ef6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AIProvider
- projects.py
- frontend/package.json
- workspaceStore.ts
- test_dna.py
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
- Automated Playwright Test Results
- Phase 1 — Validation Strategy
- ADR-001: Core Architecture & Stack Selection
- ADR-002: Three-World Branching and Traceability DAG
- ADR-003: Cloud Object Storage and Asset Management
- Seed Unfold — Product Documentation
- Seed Unfold — Project Wiki Index
- Seed Unfold — Project Rules
- Seed Unfold Agent Instructions
- rules/graphify.md
- workflows/graphify.md
- ProjectRepository
- Discussion Topics & Agreed Decisions
- Implementation Decisions
- Phase 2 Research: Seed Understanding + Seed DNA
- Phase 2 — Validation Strategy

## God Nodes (most connected - your core abstractions)
1. `ProjectRepository` - 33 edges
2. `AIProvider` - 30 edges
3. `MockProvider` - 22 edges
4. `StorageProvider` - 21 edges
5. `Seed Unfold — Product Concepts Glossary` - 18 edges
6. `GeminiProvider` - 17 edges
7. `LocalStorageProvider` - 16 edges
8. `compilerOptions` - 16 edges
9. `useWorkspaceStore` - 15 edges
10. `SeedDNA` - 14 edges

## Surprising Connections (you probably didn't know these)
- `3. Immutability & Persistence` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/02-seed-understanding-seed-dna/02-RESEARCH.md → backend/app/models/dna.py
- `Common Pitfalls & Landmines` --references--> `Asset`  [INFERRED]
  .planning/phases/01-foundation-project-shell/01-RESEARCH.md → backend/app/models/project.py
- `Decision` --references--> `AIProvider`  [INFERRED]
  docs/decisions/ADR-001-architecture-foundation.md → backend/app/providers/base.py
- `AI Provider Abstraction & Stub Provider` --references--> `AIProvider`  [INFERRED]
  .planning/phases/01-foundation-project-shell/01-CONTEXT.md → backend/app/providers/base.py
- `AI Provider Abstraction & Stub Provider` --references--> `AIProvider`  [INFERRED]
  .planning/phases/01-foundation-project-shell/01-DISCUSSION-LOG.md → backend/app/providers/base.py

## Import Cycles
- None detected.

## Communities (37 total, 9 thin omitted)

### Community 0 - "AIProvider"
Cohesion: 0.05
Nodes (28): Settings, AIProvider, get_ai_provider(), get_storage_provider(), GeminiProvider, MockProvider, LocalStorageProvider, StorageProvider (+20 more)

### Community 1 - "projects.py"
Cohesion: 0.12
Nodes (11): api_error(), api_success(), APIResponse, ErrorDetail, http_exception_handler(), lifespan(), ProjectRead, health_check() (+3 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.04
Nodes (44): assert, { chromium }, runUAT(), dependencies, clsx, framer-motion, lucide-react, react (+36 more)

### Community 3 - "workspaceStore.ts"
Cohesion: 0.10
Nodes (33): apiClient, App(), InspectorDrawer(), SeedDnaViewer(), SeedDnaViewerProps, SEED_PRESETS, SeedInputCanvas(), StageProgressHeader() (+25 more)

### Community 4 - "test_dna.py"
Cohesion: 0.12
Nodes (9): init_db(), client(), event_loop(), initialize_test_db(), test_dna_extract_and_get_endpoint(), test_raw_seed_immutability(), test_seed_dna_schema_validation(), test_health_endpoint() (+1 more)

### Community 5 - "Phase 1: Foundation / Project Shell - Research"
Cohesion: 0.11
Nodes (18): 1. Monorepo Organization, 2. Standardized Response Envelope, 3. AI Provider ABC Contract, 4. Storage Provider ABC Contract, Architectural Responsibility Map, Architecture Patterns & Implementation Blueprint, Automated Test Commands, Backend Core (+10 more)

### Community 6 - "Implementation Decisions"
Cohesion: 0.11
Nodes (18): AI Provider Abstraction & Stub Provider, Architecture & Provenance Specifications, Canonical References, Deferred Ideas, Established Patterns, Existing Code Insights, Frontend-Backend Communication & Monorepo Structure, Implementation Decisions (+10 more)

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
Cohesion: 0.18
Nodes (10): Active (MVP Scope), Business & Hackathon Context, Constraints, Core Value, Key Decisions, Out of Scope (MVP), Requirements, Seed Unfold (Praroha) (+2 more)

### Community 13 - "Project State: Seed Unfold"
Cohesion: 0.20
Nodes (9): Accumulated Context, Blockers / Concerns, Current Position, Important Constraints & Guardrails, Pending Todos, Performance Metrics, Project Reference, Project State: Seed Unfold (+1 more)

### Community 15 - "2. The Three Demo Worlds"
Cohesion: 0.22
Nodes (8): 1. Canonical Demo Seed, 2. The Three Demo Worlds, 3. Fixture Role & Usage, Seed DNA Extraction (Deterministic Fixture), Seed Unfold — Canonical Demo Fixtures, World 1: Lost Civilization (Archaeological / Mythic), World 2: Bio-City (Symbiotic / Ecological), World 3: Time Capsule (Retro-Futuristic / Cold War)

### Community 16 - "Automated Playwright Test Results"
Cohesion: 0.29
Nodes (6): Automated Playwright Test Results, Phase 2 UAT: Seed Understanding + Seed DNA, Summary, Test 1: Seed Ingestion & Presets, Test 2: Understanding Pass Execution & Stage Progression, Test 3: Seed DNA Parameter Inspection & Drawer Export

### Community 17 - "Phase 1 — Validation Strategy"
Cohesion: 0.25
Nodes (7): Manual-Only Verifications, Per-Task Verification Map, Phase 1 — Validation Strategy, Sampling Rate, Test Infrastructure, Validation Sign-Off, Wave 0 Requirements

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

### Community 32 - "ProjectRepository"
Cohesion: 0.06
Nodes (34): ExtractDNARequest, get_utc_now(), SeedDNA, SeedDNABase, SeedDNARead, SeedDNARecord, Asset, AssetBase (+26 more)

### Community 39 - "Discussion Topics & Agreed Decisions"
Cohesion: 0.22
Nodes (8): 2. Human Interaction & Editing Boundaries, 3. Seed Presets on Input Canvas, 4. Inspector Drawer Presentation, Discussion Topics & Agreed Decisions, Next Steps, Participants, Phase 2 Discussion Log: Seed Understanding + Seed DNA, Session Date

### Community 42 - "Implementation Decisions"
Cohesion: 0.25
Nodes (7): AI Provider & Extraction Engine, Implementation Decisions, Inspector Drawer & Visual Presentation, Out of Scope (Deferred to Future Phases), Phase 2 Context: Seed Understanding + Seed DNA, Phase Goal, User Experience & Seed Ingestion

### Community 43 - "Phase 2 Research: Seed Understanding + Seed DNA"
Cohesion: 0.25
Nodes (7): 1. Gemini Current Stable API & Structured Extraction Pattern, 3. Immutability & Persistence, Domain & Problem Analysis, Frontend Component & Visual Strategy, Phase 2 Research: Seed Understanding + Seed DNA, Technical Architecture & Implementation Patterns, The Seed DNA Contract

### Community 44 - "Phase 2 — Validation Strategy"
Cohesion: 0.29
Nodes (6): Manual Probes, Per-Task Verification Map, Phase 2 — Validation Strategy, Sampling Rate, Test Infrastructure, Wave 0 Requirements

## Knowledge Gaps
- **210 isolated node(s):** `{ chromium }`, `name`, `private`, `version`, `type` (+205 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 302 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AIProvider` connect `AIProvider` to `ProjectRepository`, `projects.py`, `Implementation Decisions`, `v1 Requirements (MVP)`, `Phase Details`, `Any`, `ADR-001: Core Architecture & Stack Selection`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `ProjectRepository` connect `ProjectRepository` to `AIProvider`, `projects.py`, `Implementation Decisions`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `MockProvider` connect `AIProvider` to `Implementation Decisions`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `ProjectRepository` (e.g. with `SeedDNA` and `SeedDNARecord`) actually correct?**
  _`ProjectRepository` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `AIProvider` (e.g. with `get_ai_provider()` and `health_check()`) actually correct?**
  _`AIProvider` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `MockProvider` (e.g. with `GeminiProvider` and `test_mock_provider_extract_dna()`) actually correct?**
  _`MockProvider` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `StorageProvider` (e.g. with `get_storage_provider()` and `health_check()`) actually correct?**
  _`StorageProvider` has 11 INFERRED edges - model-reasoned connections that need verification._