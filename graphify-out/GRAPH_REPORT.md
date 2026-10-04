# Graph Report - Praroha  (2026-10-04)

## Corpus Check
- 89 files · ~122,315 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .css 1, .ini 1)

## Summary
- 655 nodes · 1130 edges · 44 communities (36 shown, 8 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 158 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1322c0d0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LocalStorageProvider
- project_repo.py
- frontend/package.json
- workspaceStore.ts
- conftest.py
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
- Phase 1: Foundation / Project Shell - Discussion Log
- capture_phase3_screenshots.cjs
- ADR-002: Three-World Branching and Traceability DAG
- ADR-003: Cloud Object Storage and Asset Management
- Seed Unfold — Product Documentation
- Seed Unfold — Project Wiki Index
- Seed Unfold — Project Rules
- Seed Unfold Agent Instructions
- rules/graphify.md
- workflows/graphify.md
- GeminiProvider
- StorageProvider
- Architecture Patterns & Implementation Blueprint
- Locked Decisions
- world.py
- Discussion Topics & Agreed Decisions
- Phase 3 — Validation Strategy
- Implementation Decisions
- Phase 2 Research: Seed Understanding + Seed DNA
- Phase 2 — Validation Strategy
- ProjectRepository

## God Nodes (most connected - your core abstractions)
1. `ProjectRepository` - 40 edges
2. `AIProvider` - 30 edges
3. `MockProvider` - 24 edges
4. `GeminiProvider` - 22 edges
5. `StorageProvider` - 21 edges
6. `Seed Unfold — Product Concepts Glossary` - 18 edges
7. `useWorkspaceStore` - 17 edges
8. `APIResponse` - 16 edges
9. `api_success()` - 16 edges
10. `LocalStorageProvider` - 16 edges

## Surprising Connections (you probably didn't know these)
- `3. Immutability & Persistence` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/02-seed-understanding-seed-dna/02-RESEARCH.md → backend/app/models/dna.py
- `Common Pitfalls & Landmines` --references--> `Asset`  [INFERRED]
  .planning/phases/01-foundation-project-shell/01-RESEARCH.md → backend/app/models/project.py
- `AI Provider Abstraction & Stub Provider` --references--> `AIProvider`  [INFERRED]
  .planning/phases/01-foundation-project-shell/01-CONTEXT.md → backend/app/providers/base.py
- `AI Provider Abstraction & Stub Provider` --references--> `AIProvider`  [INFERRED]
  .planning/phases/01-foundation-project-shell/01-DISCUSSION-LOG.md → backend/app/providers/base.py
- `Shell & Foundation (SHEL)` --references--> `AIProvider`  [INFERRED]
  .planning/REQUIREMENTS.md → backend/app/providers/base.py

## Import Cycles
- None detected.

## Communities (44 total, 8 thin omitted)

### Community 0 - "LocalStorageProvider"
Cohesion: 0.14
Nodes (5): LocalStorageProvider, SupabaseStorageProvider, Delivered Features, Plan 01-01 Summary: Backend Shell, Provider Abstractions, and Persistence, Verification Evidence

### Community 1 - "project_repo.py"
Cohesion: 0.06
Nodes (23): Settings, api_error(), api_success(), APIResponse, ErrorDetail, http_exception_handler(), lifespan(), ExtractDNARequest (+15 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.05
Nodes (40): dependencies, clsx, framer-motion, lucide-react, react, react-dom, tailwind-merge, zustand (+32 more)

### Community 3 - "workspaceStore.ts"
Cohesion: 0.08
Nodes (41): apiClient, App(), InspectorDrawer(), SeedDnaViewer(), SeedDnaViewerProps, SEED_PRESETS, SeedInputCanvas(), StageProgressHeader() (+33 more)

### Community 4 - "conftest.py"
Cohesion: 0.20
Nodes (5): client(), event_loop(), initialize_test_db(), test_health_endpoint(), test_projects_crud()

### Community 5 - "Phase 1: Foundation / Project Shell - Research"
Cohesion: 0.17
Nodes (11): Architectural Responsibility Map, Automated Test Commands, Backend Core, Common Pitfalls & Landmines, Frontend Core, Monorepo & Tooling, Phase 1: Foundation / Project Shell - Research, Standard Stack (+3 more)

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

### Community 14 - "AIProvider"
Cohesion: 0.09
Nodes (12): AIProvider, MockProvider, test_local_storage_provider(), test_mock_provider_extract_dna(), test_mock_provider_generate_worlds(), test_mock_provider_health_check(), test_mock_provider_unfold_stages(), ADR-001: Core Architecture & Stack Selection (+4 more)

### Community 15 - "2. The Three Demo Worlds"
Cohesion: 0.22
Nodes (8): 1. Canonical Demo Seed, 2. The Three Demo Worlds, 3. Fixture Role & Usage, Seed DNA Extraction (Deterministic Fixture), Seed Unfold — Canonical Demo Fixtures, World 1: Lost Civilization (Archaeological / Mythic), World 2: Bio-City (Symbiotic / Ecological), World 3: Time Capsule (Retro-Futuristic / Cold War)

### Community 16 - "Automated Playwright Test Results"
Cohesion: 0.29
Nodes (6): Automated Playwright Test Results, Phase 2 UAT: Seed Understanding + Seed DNA, Summary, Test 1: Seed Ingestion & Presets, Test 2: Understanding Pass Execution & Stage Progression, Test 3: Seed DNA Parameter Inspection & Drawer Export

### Community 17 - "Phase 1 — Validation Strategy"
Cohesion: 0.25
Nodes (7): Manual-Only Verifications, Per-Task Verification Map, Phase 1 — Validation Strategy, Sampling Rate, Test Infrastructure, Validation Sign-Off, Wave 0 Requirements

### Community 18 - "Phase 1: Foundation / Project Shell - Discussion Log"
Cohesion: 0.25
Nodes (7): AI Provider Abstraction & Stub Provider, Deferred Ideas, Frontend-Backend Communication & Monorepo Structure, Initial State & Persistence Bootstrap, Phase 1: Foundation / Project Shell - Discussion Log, The Agent's Discretion, Workspace Layout & Shell Aesthetics

### Community 19 - "capture_phase3_screenshots.cjs"
Cohesion: 0.16
Nodes (9): { chromium }, path, assert, { chromium }, runUAT(), assert, { chromium }, runPhase3E2E() (+1 more)

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

### Community 32 - "GeminiProvider"
Cohesion: 0.07
Nodes (21): SeedDNA, SeedDNARecord, GeminiProvider, test_dna_extract_and_get_endpoint(), test_gemini_provider_mock_fallback(), test_raw_seed_immutability(), test_seed_dna_schema_validation(), Key Changes (+13 more)

### Community 33 - "StorageProvider"
Cohesion: 0.17
Nodes (5): StorageProvider, 1. Technical Stack Overview, 2. Architectural Principles & Boundaries, 3. Data Flow Diagram, Seed Unfold — System Architecture

### Community 34 - "Architecture Patterns & Implementation Blueprint"
Cohesion: 0.40
Nodes (5): 1. Monorepo Organization, 2. Standardized Response Envelope, 3. AI Provider ABC Contract, 4. Storage Provider ABC Contract, Architecture Patterns & Implementation Blueprint

### Community 35 - "Locked Decisions"
Cohesion: 0.50
Nodes (4): Deferred Ideas (OUT OF SCOPE), Locked Decisions, The Agent's Discretion, User Constraints (from CONTEXT.md)

### Community 38 - "world.py"
Cohesion: 0.09
Nodes (19): get_utc_now(), WorldCandidate, WorldCandidateBase, WorldCandidateRead, WorldCandidateRecord, test_canonical_demo_fixtures_determinism(), test_generate_worlds_mock_fallback(), test_world_candidate_schema_validation() (+11 more)

### Community 39 - "Discussion Topics & Agreed Decisions"
Cohesion: 0.20
Nodes (9): 1. AI Provider & Understanding Pass Integration, 2. Human Interaction & Editing Boundaries, 3. Seed Presets on Input Canvas, 4. Inspector Drawer Presentation, Discussion Topics & Agreed Decisions, Next Steps, Participants, Phase 2 Discussion Log: Seed Understanding + Seed DNA (+1 more)

### Community 40 - "Phase 3 — Validation Strategy"
Cohesion: 0.29
Nodes (6): Manual Probes, Per-Task Verification Map, Phase 3 — Validation Strategy, Sampling Rate, Test Infrastructure, Wave 0 Requirements

### Community 42 - "Implementation Decisions"
Cohesion: 0.25
Nodes (7): AI Provider & Extraction Engine, Implementation Decisions, Inspector Drawer & Visual Presentation, Out of Scope (Deferred to Future Phases), Phase 2 Context: Seed Understanding + Seed DNA, Phase Goal, User Experience & Seed Ingestion

### Community 43 - "Phase 2 Research: Seed Understanding + Seed DNA"
Cohesion: 0.25
Nodes (7): 1. Gemini Current Stable API & Structured Extraction Pattern, 3. Immutability & Persistence, Domain & Problem Analysis, Frontend Component & Visual Strategy, Phase 2 Research: Seed Understanding + Seed DNA, Technical Architecture & Implementation Patterns, The Seed DNA Contract

### Community 44 - "Phase 2 — Validation Strategy"
Cohesion: 0.29
Nodes (6): Manual Probes, Per-Task Verification Map, Phase 2 — Validation Strategy, Sampling Rate, Test Infrastructure, Wave 0 Requirements

### Community 45 - "ProjectRepository"
Cohesion: 0.13
Nodes (16): Asset, AssetBase, AssetCreate, AssetRead, get_utc_now(), Project, ProjectBase, ProjectCreate (+8 more)

## Knowledge Gaps
- **227 isolated node(s):** `{ chromium }`, `path`, `{ chromium }`, `{ chromium }`, `name` (+222 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 332 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AIProvider` connect `AIProvider` to `GeminiProvider`, `project_repo.py`, `LocalStorageProvider`, `StorageProvider`, `Locked Decisions`, `Phase 1: Foundation / Project Shell - Research`, `Implementation Decisions`, `v1 Requirements (MVP)`, `Phase Details`, `Seed Unfold (Praroha)`, `Project State: Seed Unfold`, `Phase 1: Foundation / Project Shell - Discussion Log`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `ProjectRepository` connect `ProjectRepository` to `GeminiProvider`, `project_repo.py`, `LocalStorageProvider`, `Locked Decisions`, `Phase 1: Foundation / Project Shell - Research`, `Implementation Decisions`, `world.py`, `Phase 1: Foundation / Project Shell - Discussion Log`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `MockProvider` connect `AIProvider` to `GeminiProvider`, `project_repo.py`, `LocalStorageProvider`, `Phase 1: Foundation / Project Shell - Research`, `world.py`, `Discussion Topics & Agreed Decisions`, `Implementation Decisions`, `ProjectRepository`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `ProjectRepository` (e.g. with `SeedDNA` and `SeedDNARecord`) actually correct?**
  _`ProjectRepository` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `AIProvider` (e.g. with `get_ai_provider()` and `health_check()`) actually correct?**
  _`AIProvider` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `MockProvider` (e.g. with `GeminiProvider` and `test_mock_provider_extract_dna()`) actually correct?**
  _`MockProvider` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `GeminiProvider` (e.g. with `SeedDNA` and `WorldCandidate`) actually correct?**
  _`GeminiProvider` has 10 INFERRED edges - model-reasoned connections that need verification._