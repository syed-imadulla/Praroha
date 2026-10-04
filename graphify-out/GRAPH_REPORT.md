# Graph Report - Praroha  (2026-10-04)

## Corpus Check
- 103 files · ~132,166 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .css 1, .ini 1)

## Summary
- 761 nodes · 1345 edges · 57 communities (44 shown, 13 thin omitted)
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 198 edges (avg confidence: 0.95)
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
- project_repo.py
- models/__init__.py
- AIProvider
- 2. The Three Demo Worlds
- Automated Playwright Test Results
- Phase 1 — Validation Strategy
- conftest.py
- capture_phase3_screenshots.cjs
- ADR-002: Three-World Branching and Traceability DAG
- models/dna.py
- Seed Unfold — Product Documentation
- Seed Unfold — Project Wiki Index
- Seed Unfold — Project Rules
- Seed Unfold Agent Instructions
- rules/graphify.md
- workflows/graphify.md
- test_selection.py
- StorageProvider
- GeminiProvider
- MockProvider
- 1. Questions & User Decisions
- api_success
- WorldCandidateRecord
- Discussion Topics & Agreed Decisions
- Phase 3 — Validation Strategy
- Phase 4 — Validation Strategy
- Implementation Decisions
- Phase 2 Research: Seed Understanding + Seed DNA
- Phase 2 — Validation Strategy
- Phase 1: Foundation / Project Shell - Discussion Log
- ADR-001: Core Architecture & Stack Selection
- Key Topics & Alignment
- gemini_provider.py
- Seed Unfold — Traceability & Provenance Model
- Phase 3 Research: Three World Generation
- http_exception_handler
- generate_world_candidates
- Phase 4 User Acceptance Testing (UAT) Report
- test_health_endpoint
- Plan 01-01 Summary: Backend Shell, Provider Abstractions, and Persistence
- Plan 02-01 Summary: Backend Seed Understanding & Seed DNA Service

## God Nodes (most connected - your core abstractions)
1. `ProjectRepository` - 49 edges
2. `AIProvider` - 30 edges
3. `MockProvider` - 24 edges
4. `GeminiProvider` - 22 edges
5. `StorageProvider` - 21 edges
6. `APIResponse` - 19 edges
7. `api_success()` - 19 edges
8. `useWorkspaceStore` - 19 edges
9. `WorldSelectionRecord` - 18 edges
10. `Seed Unfold — Product Concepts Glossary` - 18 edges

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

## Communities (57 total, 13 thin omitted)

### Community 0 - "LocalStorageProvider"
Cohesion: 0.12
Nodes (4): get_storage_provider(), LocalStorageProvider, SupabaseStorageProvider, Summary

### Community 1 - "ProjectRepository"
Cohesion: 0.16
Nodes (10): Asset, AssetBase, AssetCreate, AssetRead, get_utc_now(), Project, ProjectBase, ProjectCreate (+2 more)

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
Cohesion: 0.10
Nodes (19): 1. Monorepo Organization, 2. Standardized Response Envelope, 3. AI Provider ABC Contract, 4. Storage Provider ABC Contract, Architectural Responsibility Map, Architecture Patterns & Implementation Blueprint, Automated Test Commands, Backend Core (+11 more)

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

### Community 12 - "project_repo.py"
Cohesion: 0.16
Nodes (5): Settings, lifespan(), get_ai_provider(), get_session(), init_db()

### Community 13 - "models/__init__.py"
Cohesion: 0.16
Nodes (12): get_utc_now(), WorldSelectionBase, WorldSelectionCreate, WorldSelectionRead, WorldSelectionRecord, get_utc_now(), WorldCandidate, WorldCandidateBase (+4 more)

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
Cohesion: 0.38
Nodes (3): client(), event_loop(), initialize_test_db()

### Community 19 - "capture_phase3_screenshots.cjs"
Cohesion: 0.13
Nodes (12): { chromium }, path, assert, { chromium }, runUAT(), assert, { chromium }, runPhase3E2E() (+4 more)

### Community 20 - "ADR-002: Three-World Branching and Traceability DAG"
Cohesion: 0.33
Nodes (5): ADR-002: Three-World Branching and Traceability DAG, Consequences, Context, Decision, Status

### Community 21 - "models/dna.py"
Cohesion: 0.13
Nodes (9): ExtractDNARequest, get_utc_now(), SeedDNA, SeedDNABase, SeedDNARead, SeedDNARecord, extract_seed_dna(), get_latest_seed_dna() (+1 more)

### Community 22 - "Seed Unfold — Product Documentation"
Cohesion: 0.33
Nodes (5): Key Concept Definitions, Overview, Primary References, Seed Unfold — Product Documentation, The Core Product Loop

### Community 23 - "Seed Unfold — Project Wiki Index"
Cohesion: 0.33
Nodes (5): 1. Product Documentation, 2. Architecture & Design, 3. Decisions & Rules, 4. Planning & Execution (GSD), Seed Unfold — Project Wiki Index

### Community 24 - "Seed Unfold — Project Rules"
Cohesion: 0.40
Nodes (4): 1. Product Rules, 2. UX Rules, 3. Architecture Rules, Seed Unfold — Project Rules

### Community 32 - "test_selection.py"
Cohesion: 0.11
Nodes (22): test_cannot_select_world_after_stage5_unfolding_begun(), test_get_active_selection_endpoint(), test_select_candidate_from_older_batch_rejected(), test_select_invalid_candidate(), test_select_world_success(), test_select_world_with_rationale(), test_switch_world_selection(), 2. Database & Repository (`backend/app/repositories/project_repo.py`) (+14 more)

### Community 33 - "StorageProvider"
Cohesion: 0.04
Nodes (32): StorageProvider, health_check(), 1. Technical Stack Overview, 2. Architectural Principles & Boundaries, 3. Data Flow Diagram, Seed Unfold — System Architecture, ADR-003: Cloud Object Storage and Asset Management, Consequences (+24 more)

### Community 34 - "GeminiProvider"
Cohesion: 0.18
Nodes (3): GeminiProvider, 1. AI Provider & Understanding Pass Integration, Executive Summary

### Community 35 - "MockProvider"
Cohesion: 0.25
Nodes (6): MockProvider, test_local_storage_provider(), test_mock_provider_extract_dna(), test_mock_provider_generate_worlds(), test_mock_provider_health_check(), test_mock_provider_unfold_stages()

### Community 36 - "1. Questions & User Decisions"
Cohesion: 0.22
Nodes (8): 1. Questions & User Decisions, 2. Locked Decisions Summary, Phase 4 Discussion Log: Human World Selection, Q1: Selection Interaction & Confirmation Flow, Q2: Backend Selection Persistence, Q3: Re-Selection / Switching Policy, Q4: Visual Canvas Treatment, Q5: Traceability DAG in Inspector Drawer

### Community 37 - "api_success"
Cohesion: 0.18
Nodes (10): api_error(), api_success(), APIResponse, ErrorDetail, ProjectRead, create_project(), get_project(), list_projects() (+2 more)

### Community 38 - "WorldCandidateRecord"
Cohesion: 0.08
Nodes (21): WorldCandidateRecord, test_canonical_demo_fixtures_determinism(), test_generate_worlds_mock_fallback(), test_world_candidate_schema_validation(), test_worlds_generate_and_get_endpoint(), test_worlds_regenerate_batch_history(), Phase 3 Plan 01 Summary: Backend World Candidate Models, Provider & API, Verification (+13 more)

### Community 39 - "Discussion Topics & Agreed Decisions"
Cohesion: 0.22
Nodes (8): 2. Human Interaction & Editing Boundaries, 3. Seed Presets on Input Canvas, 4. Inspector Drawer Presentation, Discussion Topics & Agreed Decisions, Next Steps, Participants, Phase 2 Discussion Log: Seed Understanding + Seed DNA, Session Date

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

### Community 48 - "gemini_provider.py"
Cohesion: 0.23
Nodes (4): test_dna_extract_and_get_endpoint(), test_gemini_provider_mock_fallback(), test_raw_seed_immutability(), test_seed_dna_schema_validation()

### Community 49 - "Seed Unfold — Traceability & Provenance Model"
Cohesion: 0.29
Nodes (6): 1. Lineage Graph Model, 2. Core Provenance Queries, 3. Privacy & Explainability Constraints, Edge Relationships, Node Types, Seed Unfold — Traceability & Provenance Model

### Community 50 - "Phase 3 Research: Three World Generation"
Cohesion: 0.29
Nodes (6): 1. Domain & Architecture Analysis, 2. Reusable Assets in Workspace, 3. Potential Hazards & Mitigations, Goal, Key Insights & Standards, Phase 3 Research: Three World Generation

### Community 53 - "Phase 4 User Acceptance Testing (UAT) Report"
Cohesion: 0.33
Nodes (5): Final Verdict, Phase 4 User Acceptance Testing (UAT) Report, Test Environment, Test Scenarios & Results, Visual Artifacts

## Knowledge Gaps
- **257 isolated node(s):** `{ chromium }`, `path`, `{ chromium }`, `{ chromium }`, `{ chromium }` (+252 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 378 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WorldSelectionRecord` connect `models/__init__.py` to `test_selection.py`, `ProjectRepository`, `1. Questions & User Decisions`, `WorldCandidateRecord`, `project_repo.py`?**
  _High betweenness centrality (0.256) - this node is a cross-community bridge._
- **Why does `ProjectRepository` connect `ProjectRepository` to `test_selection.py`, `LocalStorageProvider`, `api_success`, `WorldCandidateRecord`, `Implementation Decisions`, `Phase 1: Foundation / Project Shell - Research`, `project_repo.py`, `models/__init__.py`, `Phase 1: Foundation / Project Shell - Discussion Log`, `generate_world_candidates`, `models/dna.py`?**
  _High betweenness centrality (0.243) - this node is a cross-community bridge._
- **Why does `Key Architectural Insights` connect `WorldCandidateRecord` to `workspaceStore.ts`, `models/__init__.py`?**
  _High betweenness centrality (0.228) - this node is a cross-community bridge._
- **Are the 29 inferred relationships involving `ProjectRepository` (e.g. with `SeedDNA` and `SeedDNARecord`) actually correct?**
  _`ProjectRepository` has 29 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `AIProvider` (e.g. with `get_ai_provider()` and `health_check()`) actually correct?**
  _`AIProvider` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `MockProvider` (e.g. with `GeminiProvider` and `test_mock_provider_extract_dna()`) actually correct?**
  _`MockProvider` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `GeminiProvider` (e.g. with `SeedDNA` and `WorldCandidate`) actually correct?**
  _`GeminiProvider` has 10 INFERRED edges - model-reasoned connections that need verification._