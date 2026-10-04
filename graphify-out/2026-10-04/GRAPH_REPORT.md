# Graph Report - Praroha  (2026-10-04)

## Corpus Check
- 162 files · ~194,181 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 1369 nodes · 2795 edges · 102 communities (92 shown, 10 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 535 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a1f5d5f8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SupabaseStorageProvider
- Seed Unfold (Praroha)
- frontend/package.json
- apiClient
- Acceptance Test Scenarios & Results
- Phase 1: Foundation / Project Shell - Research
- Phase 1: Foundation / Project Shell - Context
- Seed Unfold — Product Concepts Glossary
- compilerOptions
- v1 Requirements (MVP)
- package.json
- Phase Details
- Phase 6 Research: Traceability & Provenance (TRAC-01 to TRAC-03)
- Asset
- routers/persistence.py
- 2. The Three Demo Worlds
- Automated Playwright Test Results
- Phase 1 — Validation Strategy
- Project State: Seed Unfold
- playwright
- ADR-002: Three-World Branching and Traceability DAG
- ProjectRepository
- Seed Unfold — Product Documentation
- Seed Unfold — Project Wiki Index
- Seed Unfold — Project Rules
- Seed Unfold Agent Instructions
- rules/graphify.md
- workflows/graphify.md
- test_selection.py
- LocalStorageProvider
- index.ts
- Areas Discussed & Decisions Made
- 1. Questions & User Decisions
- Topics Discussed & Decisions Made
- WorldCandidate
- Discussion Topics & Agreed Decisions
- Phase 3 — Validation Strategy
- Phase 4 — Validation Strategy
- Implementation Decisions
- Phase 2 Research: Seed Understanding + Seed DNA
- Phase 2 — Validation Strategy
- Phase 1: Foundation / Project Shell - Discussion Log
- ADR-001: Core Architecture & Stack Selection
- LineageService
- GeminiProvider
- Seed Unfold — Traceability & Provenance Model
- test_providers.py
- routers/dna.py
- ADR-003: Cloud Object Storage and Asset Management
- Phase 4 User Acceptance Testing (UAT) Report
- main.py
- project.py
- models/__init__.py
- Locked Decisions
- Phase 3 Context: Three World Generation
- api_success
- useWorkspaceStore
- extract_seed_dna
- Phase 5 Research: Progressive World Unfolding
- Phase 4 Research: Human World Selection
- Phase 5 Execution Summary: Progressive World Unfolding (Tattva 4: Srishti)
- Validation Checklist
- world.py
- Implementation Decisions
- MockProvider
- 1. Questions & Locked Decisions
- models/selection.py
- Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback
- Phase 3 Research: Three World Generation
- Delivered Features
- test_dna.py
- test_persistence.py
- AIProvider
- project_repo.py
- Phase 7: Refine / Branch / Save (Tattva 6: Parinamana & Dharana) — Summary
- httpx
- Phase 8: Polish / Reliability / Demo — Research & Technical Spikes
- 2. Technical Tasks
- 2. Key Accomplishments & Deliverables
- Areas Discussed & Decisions Made
- Praroha: Comprehensive Judge Explanation
- Praroha
- WorldCandidatesCanvas.tsx
- Praroha Judge Q&A Cheatsheet
- SeedPreset
- Praroha AI Pipeline & Provider Architecture
- Praroha 3-Minute Live Judging Demo Script
- Praroha Data & Storage Architecture
- Phase 8 User Acceptance Testing (UAT) Report
- 2. Locked Implementation Decisions
- StorageProvider
- 2. Locked Decisions (Incorporating Plan Corrections)
- models/dna.py
- Praroha Master Architecture: Tattva 2 & Idea 1
- TraceabilityCanvas.tsx
- Plan 01-02 Summary: Frontend Workspace Shell & End-to-End Integration
- Key Changes
- Phase 3 Plan 02 Summary: Frontend Candidate Cards, Comparison Canvas & Inspector Integration

## God Nodes (most connected - your core abstractions)
1. `ProjectRepository` - 89 edges
2. `PersistenceService` - 44 edges
3. `MockProvider` - 40 edges
4. `APIResponse` - 36 edges
5. `api_success()` - 36 edges
6. `WorldSelectionRecord` - 34 edges
7. `AIProvider` - 34 edges
8. `GeminiProvider` - 34 edges
9. `WorldCandidateRecord` - 33 edges
10. `StorageProvider` - 32 edges

## Surprising Connections (you probably didn't know these)
- `3. Immutability & Persistence` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/02-seed-understanding-seed-dna/02-RESEARCH.md → backend/app/models/dna.py
- `2. Reusable Assets in Workspace` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/03-three-world-generation/03-RESEARCH.md → backend/app/models/dna.py
- `A. Immutable Revision History (`entity_revisions`) & Audit Diffs` --references--> `EntityRevisionRecord`  [INFERRED]
  .planning/phases/07-refine-branch-save/07-RESEARCH.md → backend/app/models/persistence.py
- `1. Test Automation Matrix` --references--> `EntityRevisionRecord`  [INFERRED]
  .planning/phases/07-refine-branch-save/07-VALIDATION.md → backend/app/models/persistence.py
- `Common Pitfalls & Landmines` --references--> `Asset`  [INFERRED]
  .planning/phases/01-foundation-project-shell/01-RESEARCH.md → backend/app/models/project.py

## Import Cycles
- None detected.

## Communities (102 total, 10 thin omitted)

### Community 0 - "SupabaseStorageProvider"
Cohesion: 0.17
Nodes (4): SupabaseStorageProvider, test_supabase_storage_provider_fallback_on_network_error(), test_supabase_storage_provider_fallback_when_unset(), 13. Is Supabase actually being used right now?

### Community 1 - "Seed Unfold (Praroha)"
Cohesion: 0.17
Nodes (11): Active (MVP Scope), Business & Hackathon Context, Constraints, Context, Core Value, Key Decisions, Out of Scope (MVP), Requirements (+3 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.05
Nodes (40): dependencies, clsx, framer-motion, lucide-react, react, react-dom, tailwind-merge, zustand (+32 more)

### Community 3 - "apiClient"
Cohesion: 0.17
Nodes (8): apiClient, APIResponse, Project, ProjectBundle, Delivered Features, What Was Built, Plan Deliverables, Wave 2: Frontend Implementation (`05-02-PLAN.md`)

### Community 4 - "Acceptance Test Scenarios & Results"
Cohesion: 0.18
Nodes (10): Acceptance Test Scenarios & Results, Phase 3 UAT: Three World Generation, Summary, Test 1: Stage 3 Transition & Candidate Generation, Test 2: Canonical Demo Fixtures Determinism, Test 3: Six Core Dimensions & Visual Contrast, Test 4: Workspace Inspector Drawer (Worlds Tab), Test 5: Re-generation & Append-Only Batch Persistence (+2 more)

### Community 5 - "Phase 1: Foundation / Project Shell - Research"
Cohesion: 0.10
Nodes (19): 1. Monorepo Organization, 2. Standardized Response Envelope, 3. AI Provider ABC Contract, 4. Storage Provider ABC Contract, Architectural Responsibility Map, Architecture Patterns & Implementation Blueprint, Automated Test Commands, Backend Core (+11 more)

### Community 6 - "Phase 1: Foundation / Project Shell - Context"
Cohesion: 0.15
Nodes (12): Architecture & Provenance Specifications, Canonical References, Deferred Ideas, Established Patterns, Existing Code Insights, Integration Points, Phase 1: Foundation / Project Shell - Context, Phase Boundary (+4 more)

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

### Community 12 - "Phase 6 Research: Traceability & Provenance (TRAC-01 to TRAC-03)"
Cohesion: 0.17
Nodes (11): 1.2 Node Schema (`TraceNode`), 1.3 Edge Schema (`TraceEdge`), 1.4 Lineage DAG Response (`TraceGraphRead`), 1. Domain Modeling: Nodes, Edges & Lineage, 2. Causal Explanation Engine (TRAC-03), 3.1 Stage 6 ("Trace") Canvas (`TraceabilityCanvas.tsx`), 3. Frontend Canvas & UX Architecture, 4. Test Strategy (+3 more)

### Community 13 - "Asset"
Cohesion: 0.27
Nodes (7): Asset, AssetBase, AssetCreate, AssetRead, 1. Lineage Graph Model, Edge Relationships, Node Types

### Community 14 - "routers/persistence.py"
Cohesion: 0.18
Nodes (3): get_storage_provider(), health_check(), get_persistence_service()

### Community 15 - "2. The Three Demo Worlds"
Cohesion: 0.22
Nodes (8): 1. Canonical Demo Seed, 2. The Three Demo Worlds, 3. Fixture Role & Usage, Seed DNA Extraction (Deterministic Fixture), Seed Unfold — Canonical Demo Fixtures, World 1: Lost Civilization (Archaeological / Mythic), World 2: Bio-City (Symbiotic / Ecological), World 3: Time Capsule (Retro-Futuristic / Cold War)

### Community 16 - "Automated Playwright Test Results"
Cohesion: 0.29
Nodes (6): Automated Playwright Test Results, Phase 2 UAT: Seed Understanding + Seed DNA, Summary, Test 1: Seed Ingestion & Presets, Test 2: Understanding Pass Execution & Stage Progression, Test 3: Seed DNA Parameter Inspection & Drawer Export

### Community 17 - "Phase 1 — Validation Strategy"
Cohesion: 0.25
Nodes (7): Manual-Only Verifications, Per-Task Verification Map, Phase 1 — Validation Strategy, Sampling Rate, Test Infrastructure, Validation Sign-Off, Wave 0 Requirements

### Community 18 - "Project State: Seed Unfold"
Cohesion: 0.18
Nodes (10): Accumulated Context, Architectural & Product Decisions, Blockers / Concerns, Current Position, Important Constraints & Guardrails, Pending Todos, Performance Metrics, Project Reference (+2 more)

### Community 19 - "playwright"
Cohesion: 0.07
Nodes (26): { chromium }, path, assert, { chromium }, runUAT(), assert, { chromium }, runPhase3E2E() (+18 more)

### Community 20 - "ADR-002: Three-World Branching and Traceability DAG"
Cohesion: 0.33
Nodes (5): ADR-002: Three-World Branching and Traceability DAG, Consequences, Context, Decision, Status

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
Cohesion: 0.10
Nodes (23): test_cannot_select_world_after_stage5_unfolding_begun(), test_get_active_selection_endpoint(), test_select_candidate_from_older_batch_rejected(), test_select_invalid_candidate(), test_select_world_success(), test_select_world_with_rationale(), test_selection_schema(), test_switch_world_selection() (+15 more)

### Community 33 - "LocalStorageProvider"
Cohesion: 0.15
Nodes (8): LocalStorageProvider, 3. Current Runtime Configuration Audit, Key Takeaway for Judges, Final Verdict, Phase 7 User Acceptance Testing (UAT) Report, Test Environment, Test Scenarios & Results, Visual Artifacts

### Community 34 - "index.ts"
Cohesion: 0.15
Nodes (27): ModalContentProps, DEFAULT_STAGES, WorkspaceState, AncestorPathRead, APIErrorDetail, AssetMetadata, BranchRead, CharacterRead (+19 more)

### Community 35 - "Areas Discussed & Decisions Made"
Cohesion: 0.22
Nodes (8): 1. Backend DAG Modeling & Persistence, 2. Causal Explanation Engine (TRAC-03), 3. Stage 6 Canvas Layout & Presentation, 4. Node Selection & Highlighting Behavior, 5. Cross-Stage Integration (Stage 5 to Stage 6), Areas Discussed & Decisions Made, Phase 6 Discussion Log: Traceability & Provenance (TRAC-01 to TRAC-03), Requirements Traceability

### Community 36 - "1. Questions & User Decisions"
Cohesion: 0.22
Nodes (8): 1. Questions & User Decisions, 2. Locked Decisions Summary, Phase 4 Discussion Log: Human World Selection, Q1: Selection Interaction & Confirmation Flow, Q2: Backend Selection Persistence, Q3: Re-Selection / Switching Policy, Q4: Visual Canvas Treatment, Q5: Traceability DAG in Inspector Drawer

### Community 37 - "Topics Discussed & Decisions Made"
Cohesion: 0.25
Nodes (7): 1. Progressive Unfolding UX & Lifecycle State Machine, 3. Database & Relational Persistence Architecture, 4. Non-blocking Visual Prompt Descriptors (UNFL-05) & Key Locations, 5. Lineage & Inspector Integration, Date: 2026-10-04, Phase 5 Discussion Log: Progressive World Unfolding, Topics Discussed & Decisions Made

### Community 38 - "WorldCandidate"
Cohesion: 0.17
Nodes (9): WorldCandidate, test_canonical_demo_fixtures_determinism(), test_generate_worlds_mock_fallback(), test_world_candidate_schema_validation(), test_worlds_generate_and_get_endpoint(), test_worlds_regenerate_batch_history(), Phase 3 Plan 01 Summary: Backend World Candidate Models, Provider & API, Verification (+1 more)

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

### Community 47 - "LineageService"
Cohesion: 0.05
Nodes (36): AncestorPathRead, TraceEdge, TraceGraphRead, TraceNode, LineageService, test_ancestor_path_traversal(), test_lineage_initial_project(), test_lineage_with_dna() (+28 more)

### Community 48 - "GeminiProvider"
Cohesion: 0.13
Nodes (6): GeminiProvider, 5. What happens if Gemini goes down during a live demo?, 1. AI Provider & Understanding Pass Integration, 2. Canonical Demo Fixture Support, 2. Acceptance Criteria Checklist, Phase 8: Polish / Reliability / Demo - Validation Matrix

### Community 49 - "Seed Unfold — Traceability & Provenance Model"
Cohesion: 0.50
Nodes (3): 2. Core Provenance Queries, 3. Privacy & Explainability Constraints, Seed Unfold — Traceability & Provenance Model

### Community 50 - "test_providers.py"
Cohesion: 0.48
Nodes (5): test_local_storage_provider(), test_mock_provider_extract_dna(), test_mock_provider_generate_worlds(), test_mock_provider_health_check(), test_mock_provider_unfold_stages()

### Community 51 - "routers/dna.py"
Cohesion: 0.19
Nodes (4): get_ai_provider(), get_session(), get_unfolded_universe(), unfold_universe()

### Community 52 - "ADR-003: Cloud Object Storage and Asset Management"
Cohesion: 0.33
Nodes (5): ADR-003: Cloud Object Storage and Asset Management, Consequences, Context, Decision, Status

### Community 53 - "Phase 4 User Acceptance Testing (UAT) Report"
Cohesion: 0.33
Nodes (5): Final Verdict, Phase 4 User Acceptance Testing (UAT) Report, Test Environment, Test Scenarios & Results, Visual Artifacts

### Community 54 - "main.py"
Cohesion: 0.12
Nodes (6): api_error(), ErrorDetail, http_exception_handler(), lifespan(), get_node_ancestor_path(), get_project_lineage()

### Community 55 - "project.py"
Cohesion: 0.36
Nodes (4): get_utc_now(), ProjectBase, ProjectCreate, 1. Data Models & Relational Entity (`backend/app/models/selection.py`)

### Community 56 - "models/__init__.py"
Cohesion: 0.05
Nodes (63): SeedDNARecord, BranchCreate, BranchRead, CharacterRefineRequest, EntityRevisionBase, EntityRevisionRead, EntityRevisionRecord, get_utc_now() (+55 more)

### Community 57 - "Locked Decisions"
Cohesion: 0.25
Nodes (7): D-02: Deterministic Causal Explanation Engine (TRAC-03), D-03: Stage 6 Hybrid Canvas UX, D-04: Cross-Stage Deep Linking, Locked Decisions, Phase 6 Context: Traceability & Provenance (TRAC-01 to TRAC-03), Phase Purpose, Technical Constraints & Boundaries

### Community 58 - "Phase 3 Context: Three World Generation"
Cohesion: 0.29
Nodes (6): 1. Data Models (`backend/app/models/world.py`), 2. API Endpoints (`backend/app/routers/worlds.py`), 3. Frontend Experience (Stage 3 `worlds`), Out of Scope for Phase 3, Phase 3 Context: Three World Generation, Technical Specifications

### Community 59 - "api_success"
Cohesion: 0.13
Nodes (16): api_success(), APIResponse, ProjectRead, branch_project(), create_storage_snapshot(), export_project_bundle(), get_project_revisions(), import_project_bundle() (+8 more)

### Community 60 - "useWorkspaceStore"
Cohesion: 0.14
Nodes (27): App(), GuidedTourOverlay(), TOUR_STEPS, TourStepData, InspectorDrawer(), KeyboardShortcutsModal(), ShortcutRow, SHORTCUTS (+19 more)

### Community 61 - "extract_seed_dna"
Cohesion: 0.20
Nodes (5): extract_seed_dna(), get_latest_seed_dna(), 2. Bulletproof Error Fallback & Notification (`DEMO-02`), The Problem, The Solution: Provider Fallback Decorator / Wrapper

### Community 62 - "Phase 5 Research: Progressive World Unfolding"
Cohesion: 0.33
Nodes (5): 1. Domain & Architecture Analysis, 2. Reusable Assets & Integration Points, 3. Potential Hazards & Mitigations, Goal, Phase 5 Research: Progressive World Unfolding

### Community 63 - "Phase 4 Research: Human World Selection"
Cohesion: 0.29
Nodes (6): 1. Domain & Architecture Analysis, 2. Reusable Assets & Integration Points, 3. Potential Hazards & Mitigations, Goal, Key Architectural Insights, Phase 4 Research: Human World Selection

### Community 64 - "Phase 5 Execution Summary: Progressive World Unfolding (Tattva 4: Srishti)"
Cohesion: 0.40
Nodes (4): Captured Artifacts, Execution Overview, Phase 5 Execution Summary: Progressive World Unfolding (Tattva 4: Srishti), Verification Summary

### Community 65 - "Validation Checklist"
Cohesion: 0.33
Nodes (5): 1. Backend Verification, 2. Frontend Verification, 3. End-to-End Playwright Verification, Phase 6 Validation: Traceability & Provenance (TRAC-01 to TRAC-03), Validation Checklist

### Community 66 - "world.py"
Cohesion: 0.15
Nodes (5): get_utc_now(), WorldCandidateBase, WorldCandidateRead, generate_world_candidates(), get_latest_world_candidates()

### Community 67 - "Implementation Decisions"
Cohesion: 0.29
Nodes (7): AI Provider Abstraction & Stub Provider, Frontend-Backend Communication & Monorepo Structure, Implementation Decisions, Initial State & Persistence Bootstrap, Object Storage & Asset Foundation, The Agent's Discretion, Workspace Layout & Shell Aesthetics

### Community 68 - "MockProvider"
Cohesion: 0.16
Nodes (7): MockProvider, 3. Fallback & Failure Modes (Actual Source Behavior), Summary, Discussion Summary, Key Topics & Alignment, Phase 3 Discussion Log: Three World Generation, Status

### Community 69 - "1. Questions & Locked Decisions"
Cohesion: 0.25
Nodes (7): 1. Questions & Locked Decisions, 2. Next Steps, Phase 7: Refine, Branch & Save - Discussion Log, Question 1: Timeline Branching Architecture (PERS-02), Question 2: Component Refinement & Auditable Versioning (PERS-01), Question 3: Full Project State Save/Reload (PERS-03), Question 4: UI Architecture & Stage 7 Canvas Placement

### Community 70 - "models/selection.py"
Cohesion: 0.19
Nodes (7): get_utc_now(), WorldSelectionBase, WorldSelectionCreate, WorldSelectionRead, get_active_selection(), select_world_candidate(), 1. Backend Data Models (`backend/app/models/selection.py`)

### Community 71 - "Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback"
Cohesion: 0.29
Nodes (6): 1. Context & Objectives, 2. Technical Tasks, 3. Verification Criteria, Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback, Task 2: Mount `POST /api/projects/canonical-demo`, Task 3: Resilient Fallback Wrapper in `gemini_provider.py`

### Community 72 - "Phase 3 Research: Three World Generation"
Cohesion: 0.33
Nodes (5): 1. Domain & Architecture Analysis, 2. Reusable Assets in Workspace, 3. Potential Hazards & Mitigations, Goal, Phase 3 Research: Three World Generation

### Community 73 - "Delivered Features"
Cohesion: 0.50
Nodes (3): Delivered Features, Plan 01-01 Summary: Backend Shell, Provider Abstractions, and Persistence, Verification Evidence

### Community 74 - "test_dna.py"
Cohesion: 0.43
Nodes (4): test_dna_extract_and_get_endpoint(), test_gemini_provider_mock_fallback(), test_raw_seed_immutability(), test_seed_dna_schema_validation()

### Community 75 - "test_persistence.py"
Cohesion: 0.27
Nodes (6): _setup_unfolded_project(), test_bundle_export_and_import_with_lineage(), test_character_and_scene_refinement_audit(), test_lineage_version_chaining(), test_storage_snapshots_persistence(), test_timeline_branching_strict_id_remapping()

### Community 76 - "AIProvider"
Cohesion: 0.16
Nodes (3): AIProvider, 1. Actual AI Provider Architecture, Components

### Community 77 - "project_repo.py"
Cohesion: 0.11
Nodes (10): Settings, build_engine(), init_db(), _migrate_columns(), client(), event_loop(), initialize_test_db(), test_database_url_formatting_for_supabase() (+2 more)

### Community 80 - "Phase 7: Refine / Branch / Save (Tattva 6: Parinamana & Dharana) — Summary"
Cohesion: 0.25
Nodes (7): 1. Overview & Architecture, 2. Implementation Artifacts, 3. Verification Results, 4. Visual Artifacts, Core Architectural Guarantees, Frontend (`frontend/src/`), Phase 7: Refine / Branch / Save (Tattva 6: Parinamana & Dharana) — Summary

### Community 81 - "httpx"
Cohesion: 0.15
Nodes (6): test_canonical_demo_api_endpoint(), test_create_canonical_demo_project_repository(), test_gemini_provider_graceful_fallback(), test_health_endpoint(), test_projects_crud(), Task 4: Pytest Suite `backend/tests/test_demo.py`

### Community 82 - "Phase 8: Polish / Reliability / Demo — Research & Technical Spikes"
Cohesion: 0.18
Nodes (10): 1. Fast Canonical Demo Seeding Architecture (`DEMO-01`), 3. Keyboard Shortcuts & Evaluator Flow, 4. 7-Stage Stepped Floating Guided Tour (Avyakta + 6 Tattva Transformations), 5. Lineage DAG Zoom & Polish, 6. Verification Plan, Design & Mechanics, Event Handling Best Practices, Phase 8: Polish / Reliability / Demo — Research & Technical Spikes (+2 more)

### Community 83 - "2. Technical Tasks"
Cohesion: 0.17
Nodes (11): 1. Context & Objectives, 2. Technical Tasks, 3. Verification Criteria, Plan: Phase 8 Wave 2 — Frontend Guided Demo Tour, Keyboard Shortcuts, Polish & E2E, Task 1: API & Store Integration for Instant Demo, Task 2: Create `GuidedTourOverlay.tsx`, Task 3: Create `KeyboardShortcutsModal.tsx`, Task 4: Global Keyboard Listener in `WorkspaceCanvas.tsx` (+3 more)

### Community 84 - "2. Key Accomplishments & Deliverables"
Cohesion: 0.18
Nodes (10): 1. Overview & Conceptual Architecture, 2. Key Accomplishments & Deliverables, 3. Verification & Testing, 4. Phase Completion Sign-Off, B. Foolproof AI Provider Fallback Resilience (DEMO-02), C. 7-Stage Guided Demo Tour Overlay, D. Global Keyboard Shortcuts & Cheatsheet Modal, E. Traceability DAG Zoom & View Controls (+2 more)

### Community 85 - "Areas Discussed & Decisions Made"
Cohesion: 0.29
Nodes (6): 1. Demo Walkthrough & Presentation Aids, 2. Error Communication & Resilience (DEMO-02), 3. UI Polish & Aesthetic Enhancements, 4. Technical Implementation of Fast Demo Preset, Areas Discussed & Decisions Made, Phase 8: Polish / Reliability / Demo — Discussion Log

### Community 86 - "Praroha: Comprehensive Judge Explanation"
Cohesion: 0.10
Nodes (19): 10. What is deterministic demo mode?, 11. How does the seed become a universe?, 12. Where does human agency enter?, 13. How is the original seed preserved?, 14. How does traceability work?, 15. How is project data stored?, 17. What is currently implemented?, 18. What is future scope? (+11 more)

### Community 87 - "Praroha"
Cohesion: 0.11
Nodes (18): 1. Problem Statement, 2. The Tattva 2 Connection, 3. Idea 1: Generative AI, 4. The Praroha Solution, 5. System Architecture, 6. AI Models & Reliability, 7. Quick Start & Demonstration, 8. Technology Stack (+10 more)

### Community 89 - "WorldCandidatesCanvas.tsx"
Cohesion: 0.36
Nodes (5): WorldCandidateCard(), WorldCandidateCardProps, WorldCandidatesCanvas(), WorldSelectionCanvas(), WorldCandidateRead

### Community 90 - "Praroha Judge Q&A Cheatsheet"
Cohesion: 0.12
Nodes (15): 10. How is provenance represented?, 11. Why a relational database instead of a dedicated graph database like Neo4j?, 12. What is stored in object storage?, 14. Can this generate actual images, audio, or video right now?, 15. Can this architecture scale?, 16. What is the key technical innovation?, 1. Why is this project Tattva 2?, 2. Why not simply use ChatGPT or Claude in a chat window? (+7 more)

### Community 91 - "SeedPreset"
Cohesion: 0.33
Nodes (4): SeedPreset, Key Changes, Plan 02-02 Summary: Frontend Seed Ingestion & Seed DNA Visualizer, Verification Results

### Community 92 - "Praroha AI Pipeline & Provider Architecture"
Cohesion: 0.22
Nodes (8): 4. Canonical Demo vs Live Custom Seed Operation, 5. Multimodal Capabilities Reality Check, Arbitrary Custom Seeds, Canonical Instant Demo (`POST /api/projects/canonical-demo`), Future / Optional Scope (Explicitly NOT Live Now), Implemented Now, Master Framing, Praroha AI Pipeline & Provider Architecture

### Community 93 - "Praroha 3-Minute Live Judging Demo Script"
Cohesion: 0.18
Nodes (10): [0:00 – 0:20] 1. Introduction: The Philosophical & Technical Challenge, [0:20 – 0:40] 2. The Formless Seed (Stage 1), [0:40 – 1:00] 3. Uncovering Hidden Structure: Seed DNA (Stage 2), [1:00 – 1:20] 4. Three Latent Manifestations (Stage 3), [1:20 – 1:35] 5. Human Choice Gate (Stage 4), [1:35 – 2:05] 6. Progressive Universe Unfolding (Stage 5), [2:05 – 2:25] 7. Refinement, Branching & Continuity (Stage 7), [2:25 – 2:45] 8. Traceability DAG: Proving Origin (Stage 6) (+2 more)

### Community 94 - "Praroha Data & Storage Architecture"
Cohesion: 0.17
Nodes (9): 1. Structured Relational Data Layer, 2. Object Storage Layer (`StorageProvider`), 4. State Portability & Snapshots, Lossless Round-Trip Import (`POST /api/projects/import`), Overview, Praroha Data & Storage Architecture, ProjectBundle (`GET /api/projects/{id}/bundle`), Providers Implemented in Source Code (+1 more)

### Community 95 - "Phase 8 User Acceptance Testing (UAT) Report"
Cohesion: 0.29
Nodes (6): Conceptual Framing, Final Verdict, Phase 8 User Acceptance Testing (UAT) Report, Test Environment, Test Scenarios & Results, Visual Artifacts

### Community 96 - "2. Locked Implementation Decisions"
Cohesion: 0.22
Nodes (8): 1. Executive Summary & Goals, 2. Locked Implementation Decisions, 3. Plan Decomposition (2 Waves), B. Graceful Degradation & Network Resilience (`DEMO-02`), C. Guided Demo Tour for Evaluators, D. Keyboard Shortcuts (`KeyboardShortcutsModal.tsx`), E. UI Polish, Aesthetics & Micro-Animations, Phase 8: Polish / Reliability / Demo — Context & Implementation Decisions

### Community 98 - "StorageProvider"
Cohesion: 0.15
Nodes (6): StorageProvider, 1. Technical Stack Overview, 2. Architectural Principles & Boundaries, 3. Data Flow Diagram, Seed Unfold — System Architecture, 16. What is cloud storage?

### Community 99 - "2. Locked Decisions (Incorporating Plan Corrections)"
Cohesion: 0.29
Nodes (6): 1. Phase Objective & Tattva Alignment, 2. Locked Decisions (Incorporating Plan Corrections), D-01: Timeline Branching & Strict Child ID Remapping (PERS-02), D-03: Full Project State Export, Import & Snapshots (PERS-03), D-04: UI Architecture & Stage 7 Canvas, Phase 7: Refine, Branch & Save (Tattva 6: Parinamana & Dharana) - Context

### Community 100 - "models/dna.py"
Cohesion: 0.24
Nodes (5): ExtractDNARequest, get_utc_now(), SeedDNA, SeedDNABase, SeedDNARead

### Community 102 - "Praroha Master Architecture: Tattva 2 & Idea 1"
Cohesion: 0.33
Nodes (5): 1. Conceptual Unfolding Pipeline, 2. Technical System Architecture, 3. Core Architectural Guarantees, Philosophical Foundation, Praroha Master Architecture: Tattva 2 & Idea 1

### Community 103 - "TraceabilityCanvas.tsx"
Cohesion: 0.40
Nodes (4): NodeCard(), NodeCardProps, TraceNode, TraceNodeType

### Community 108 - "Key Changes"
Cohesion: 0.40
Nodes (3): Key Changes, Plan 02-01 Summary: Backend Seed Understanding & Seed DNA Service, Verification Results

## Knowledge Gaps
- **421 isolated node(s):** `{ chromium }`, `path`, `{ chromium }`, `{ chromium }`, `{ chromium }` (+416 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 642 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MockProvider` connect `MockProvider` to `Asset`, `routers/persistence.py`, `ProjectRepository`, `LocalStorageProvider`, `WorldCandidate`, `Implementation Decisions`, `GeminiProvider`, `test_providers.py`, `routers/dna.py`, `models/__init__.py`, `useWorkspaceStore`, `extract_seed_dna`, `Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback`, `Delivered Features`, `test_dna.py`, `AIProvider`, `project_repo.py`, `Praroha: Comprehensive Judge Explanation`, `2. Locked Implementation Decisions`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `ProjectRepository` connect `ProjectRepository` to `Phase 1: Foundation / Project Shell - Research`, `Phase 1: Foundation / Project Shell - Context`, `Asset`, `routers/persistence.py`, `test_selection.py`, `WorldCandidate`, `Phase 1: Foundation / Project Shell - Discussion Log`, `LineageService`, `routers/dna.py`, `main.py`, `project.py`, `models/__init__.py`, `api_success`, `extract_seed_dna`, `world.py`, `Implementation Decisions`, `MockProvider`, `models/selection.py`, `Delivered Features`, `project_repo.py`, `httpx`, `StorageProvider`, `models/dna.py`, `Key Changes`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `1. Test Automation Matrix` connect `useWorkspaceStore` to `GeminiProvider`, `models/__init__.py`, `api_success`, `MockProvider`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `ProjectRepository` (e.g. with `SeedDNA` and `SeedDNARecord`) actually correct?**
  _`ProjectRepository` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `PersistenceService` (e.g. with `branch_project()` and `create_storage_snapshot()`) actually correct?**
  _`PersistenceService` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `MockProvider` (e.g. with `GeminiProvider` and `ProjectRepository`) actually correct?**
  _`MockProvider` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `APIResponse` (e.g. with `extract_seed_dna()` and `get_latest_seed_dna()`) actually correct?**
  _`APIResponse` has 24 INFERRED edges - model-reasoned connections that need verification._