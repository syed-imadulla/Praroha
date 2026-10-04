# Graph Report - Praroha  (2026-10-04)

## Corpus Check
- 101 files · ~130,923 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .css 1, .ini 1)

## Summary
- 743 nodes · 1319 edges · 57 communities (43 shown, 14 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 191 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ee9cc653`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LocalStorageProvider
- ProjectRepository
- frontend/package.json
- workspaceStore.ts
- Acceptance Test Scenarios & Results
- Phase 1: Foundation / Project Shell - Research
- Implementation Decisions
- Seed Unfold — Product Concepts Glossary
- compilerOptions
- v1 Requirements (MVP)
- package.json
- Phase Details
- Seed Unfold (Praroha)
- Project State: Seed Unfold
- AIProvider
- 2. The Three Demo Worlds
- Automated Playwright Test Results
- Phase 1 — Validation Strategy
- conftest.py
- capture_phase3_screenshots.cjs
- ADR-002: Three-World Branching and Traceability DAG
- ADR-003: Cloud Object Storage and Asset Management
- Seed Unfold — Product Documentation
- Seed Unfold — Project Wiki Index
- Seed Unfold — Project Rules
- Seed Unfold Agent Instructions
- rules/graphify.md
- workflows/graphify.md
- WorldSelectionRecord
- StorageProvider
- GeminiProvider
- test_providers.py
- 1. Questions & User Decisions
- MockProvider
- world.py
- Discussion Topics & Agreed Decisions
- Phase 3 — Validation Strategy
- Phase 4 — Validation Strategy
- Implementation Decisions
- Phase 2 Research: Seed Understanding + Seed DNA
- Phase 2 — Validation Strategy
- Phase 1: Foundation / Project Shell - Discussion Log
- ADR-001: Core Architecture & Stack Selection
- Key Topics & Alignment
- test_dna.py
- Seed Unfold — Traceability & Provenance Model
- Phase 3 Research: Three World Generation
- http_exception_handler
- Architecture Patterns & Implementation Blueprint
- health_check
- Standard Stack
- Plan 01-01 Summary: Backend Shell, Provider Abstractions, and Persistence
- Plan 02-01 Summary: Backend Seed Understanding & Seed DNA Service

## God Nodes (most connected - your core abstractions)
1. `ProjectRepository` - 47 edges
2. `AIProvider` - 30 edges
3. `MockProvider` - 24 edges
4. `GeminiProvider` - 22 edges
5. `StorageProvider` - 21 edges
6. `APIResponse` - 19 edges
7. `api_success()` - 19 edges
8. `useWorkspaceStore` - 19 edges
9. `Seed Unfold — Product Concepts Glossary` - 18 edges
10. `WorldSelectionRecord` - 17 edges

## Surprising Connections (you probably didn't know these)
- `3. Immutability & Persistence` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/02-seed-understanding-seed-dna/02-RESEARCH.md → backend/app/models/dna.py
- `2. Reusable Assets in Workspace` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/03-three-world-generation/03-RESEARCH.md → backend/app/models/dna.py
- `Edge Relationships` --references--> `Asset`  [INFERRED]
  docs/architecture/TRACEABILITY_MODEL.md → backend/app/models/project.py
- `Node Types` --references--> `Asset`  [INFERRED]
  docs/architecture/TRACEABILITY_MODEL.md → backend/app/models/project.py
- `Common Pitfalls & Landmines` --references--> `Asset`  [INFERRED]
  .planning/phases/01-foundation-project-shell/01-RESEARCH.md → backend/app/models/project.py

## Import Cycles
- None detected.

## Communities (57 total, 14 thin omitted)

### Community 0 - "LocalStorageProvider"
Cohesion: 0.16
Nodes (3): get_storage_provider(), LocalStorageProvider, SupabaseStorageProvider

### Community 1 - "ProjectRepository"
Cohesion: 0.05
Nodes (35): Settings, api_error(), api_success(), APIResponse, ErrorDetail, lifespan(), ExtractDNARequest, get_utc_now() (+27 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.05
Nodes (40): dependencies, clsx, framer-motion, lucide-react, react, react-dom, tailwind-merge, zustand (+32 more)

### Community 3 - "workspaceStore.ts"
Cohesion: 0.08
Nodes (43): apiClient, App(), InspectorDrawer(), SeedDnaViewer(), SeedDnaViewerProps, SEED_PRESETS, SeedInputCanvas(), StageProgressHeader() (+35 more)

### Community 4 - "Acceptance Test Scenarios & Results"
Cohesion: 0.18
Nodes (10): Acceptance Test Scenarios & Results, Phase 3 UAT: Three World Generation, Summary, Test 1: Stage 3 Transition & Candidate Generation, Test 2: Canonical Demo Fixtures Determinism, Test 3: Six Core Dimensions & Visual Contrast, Test 4: Workspace Inspector Drawer (Worlds Tab), Test 5: Re-generation & Append-Only Batch Persistence (+2 more)

### Community 5 - "Phase 1: Foundation / Project Shell - Research"
Cohesion: 0.17
Nodes (11): Architectural Responsibility Map, Automated Test Commands, Common Pitfalls & Landmines, Deferred Ideas (OUT OF SCOPE), Locked Decisions, Phase 1: Foundation / Project Shell - Research, Summary, The Agent's Discretion (+3 more)

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

### Community 16 - "Automated Playwright Test Results"
Cohesion: 0.29
Nodes (6): Automated Playwright Test Results, Phase 2 UAT: Seed Understanding + Seed DNA, Summary, Test 1: Seed Ingestion & Presets, Test 2: Understanding Pass Execution & Stage Progression, Test 3: Seed DNA Parameter Inspection & Drawer Export

### Community 17 - "Phase 1 — Validation Strategy"
Cohesion: 0.25
Nodes (7): Manual-Only Verifications, Per-Task Verification Map, Phase 1 — Validation Strategy, Sampling Rate, Test Infrastructure, Validation Sign-Off, Wave 0 Requirements

### Community 18 - "conftest.py"
Cohesion: 0.16
Nodes (6): init_db(), client(), event_loop(), initialize_test_db(), test_health_endpoint(), test_projects_crud()

### Community 19 - "capture_phase3_screenshots.cjs"
Cohesion: 0.13
Nodes (12): { chromium }, path, assert, { chromium }, runUAT(), assert, { chromium }, runPhase3E2E() (+4 more)

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

### Community 32 - "WorldSelectionRecord"
Cohesion: 0.12
Nodes (21): get_utc_now(), WorldSelectionBase, WorldSelectionCreate, WorldSelectionRead, WorldSelectionRecord, WorldCandidateRead, test_get_active_selection_endpoint(), test_select_candidate_from_older_batch_rejected() (+13 more)

### Community 33 - "StorageProvider"
Cohesion: 0.13
Nodes (5): StorageProvider, 1. Technical Stack Overview, 2. Architectural Principles & Boundaries, 3. Data Flow Diagram, Seed Unfold — System Architecture

### Community 35 - "test_providers.py"
Cohesion: 0.48
Nodes (5): test_local_storage_provider(), test_mock_provider_extract_dna(), test_mock_provider_generate_worlds(), test_mock_provider_health_check(), test_mock_provider_unfold_stages()

### Community 36 - "1. Questions & User Decisions"
Cohesion: 0.22
Nodes (8): 1. Questions & User Decisions, 2. Locked Decisions Summary, Phase 4 Discussion Log: Human World Selection, Q1: Selection Interaction & Confirmation Flow, Q2: Backend Selection Persistence, Q3: Re-Selection / Switching Policy, Q4: Visual Canvas Treatment, Q5: Traceability DAG in Inspector Drawer

### Community 38 - "world.py"
Cohesion: 0.07
Nodes (24): get_utc_now(), WorldCandidate, WorldCandidateBase, WorldCandidateRecord, test_canonical_demo_fixtures_determinism(), test_generate_worlds_mock_fallback(), test_world_candidate_schema_validation(), test_worlds_generate_and_get_endpoint() (+16 more)

### Community 39 - "Discussion Topics & Agreed Decisions"
Cohesion: 0.20
Nodes (9): 1. AI Provider & Understanding Pass Integration, 2. Human Interaction & Editing Boundaries, 3. Seed Presets on Input Canvas, 4. Inspector Drawer Presentation, Discussion Topics & Agreed Decisions, Next Steps, Participants, Phase 2 Discussion Log: Seed Understanding + Seed DNA (+1 more)

### Community 40 - "Phase 3 — Validation Strategy"
Cohesion: 0.29
Nodes (6): Manual Probes, Per-Task Verification Map, Phase 3 — Validation Strategy, Sampling Rate, Test Infrastructure, Wave 0 Requirements

### Community 41 - "Phase 4 — Validation Strategy"
Cohesion: 0.29
Nodes (6): Manual Probes, Per-Task Verification Map, Phase 4 — Validation Strategy, Sampling Rate, Test Infrastructure, Wave 0 Requirements

### Community 42 - "Implementation Decisions"
Cohesion: 0.25
Nodes (7): AI Provider & Extraction Engine, Implementation Decisions, Inspector Drawer & Visual Presentation, Out of Scope (Deferred to Future Phases), Phase 2 Context: Seed Understanding + Seed DNA, Phase Goal, User Experience & Seed Ingestion

### Community 43 - "Phase 2 Research: Seed Understanding + Seed DNA"
Cohesion: 0.25
Nodes (7): 1. Gemini Current Stable API & Structured Extraction Pattern, 3. Immutability & Persistence, Domain & Problem Analysis, Frontend Component & Visual Strategy, Phase 2 Research: Seed Understanding + Seed DNA, Technical Architecture & Implementation Patterns, The Seed DNA Contract

### Community 44 - "Phase 2 — Validation Strategy"
Cohesion: 0.29
Nodes (6): Manual Probes, Per-Task Verification Map, Phase 2 — Validation Strategy, Sampling Rate, Test Infrastructure, Wave 0 Requirements

### Community 45 - "Phase 1: Foundation / Project Shell - Discussion Log"
Cohesion: 0.25
Nodes (7): AI Provider Abstraction & Stub Provider, Deferred Ideas, Frontend-Backend Communication & Monorepo Structure, Initial State & Persistence Bootstrap, Phase 1: Foundation / Project Shell - Discussion Log, The Agent's Discretion, Workspace Layout & Shell Aesthetics

### Community 46 - "ADR-001: Core Architecture & Stack Selection"
Cohesion: 0.33
Nodes (5): ADR-001: Core Architecture & Stack Selection, Consequences, Context, Decision, Status

### Community 47 - "Key Topics & Alignment"
Cohesion: 0.40
Nodes (4): Discussion Summary, Key Topics & Alignment, Phase 3 Discussion Log: Three World Generation, Status

### Community 48 - "test_dna.py"
Cohesion: 0.43
Nodes (4): test_dna_extract_and_get_endpoint(), test_gemini_provider_mock_fallback(), test_raw_seed_immutability(), test_seed_dna_schema_validation()

### Community 49 - "Seed Unfold — Traceability & Provenance Model"
Cohesion: 0.29
Nodes (6): 1. Lineage Graph Model, 2. Core Provenance Queries, 3. Privacy & Explainability Constraints, Edge Relationships, Node Types, Seed Unfold — Traceability & Provenance Model

### Community 50 - "Phase 3 Research: Three World Generation"
Cohesion: 0.33
Nodes (5): 1. Domain & Architecture Analysis, 2. Reusable Assets in Workspace, 3. Potential Hazards & Mitigations, Goal, Phase 3 Research: Three World Generation

### Community 52 - "Architecture Patterns & Implementation Blueprint"
Cohesion: 0.40
Nodes (5): 1. Monorepo Organization, 2. Standardized Response Envelope, 3. AI Provider ABC Contract, 4. Storage Provider ABC Contract, Architecture Patterns & Implementation Blueprint

### Community 54 - "Standard Stack"
Cohesion: 0.50
Nodes (4): Backend Core, Frontend Core, Monorepo & Tooling, Standard Stack

## Knowledge Gaps
- **249 isolated node(s):** `{ chromium }`, `path`, `{ chromium }`, `{ chromium }`, `{ chromium }` (+244 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 367 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WorldSelectionRecord` connect `WorldSelectionRecord` to `ProjectRepository`, `1. Questions & User Decisions`, `world.py`?**
  _High betweenness centrality (0.261) - this node is a cross-community bridge._
- **Why does `ProjectRepository` connect `ProjectRepository` to `WorldSelectionRecord`, `Phase 1: Foundation / Project Shell - Research`, `world.py`, `Implementation Decisions`, `Phase 1: Foundation / Project Shell - Discussion Log`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Why does `Key Architectural Insights` connect `world.py` to `WorldSelectionRecord`, `workspaceStore.ts`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Are the 28 inferred relationships involving `ProjectRepository` (e.g. with `SeedDNA` and `SeedDNARecord`) actually correct?**
  _`ProjectRepository` has 28 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `AIProvider` (e.g. with `get_ai_provider()` and `health_check()`) actually correct?**
  _`AIProvider` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `MockProvider` (e.g. with `GeminiProvider` and `test_mock_provider_extract_dna()`) actually correct?**
  _`MockProvider` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `GeminiProvider` (e.g. with `SeedDNA` and `WorldCandidate`) actually correct?**
  _`GeminiProvider` has 10 INFERRED edges - model-reasoned connections that need verification._