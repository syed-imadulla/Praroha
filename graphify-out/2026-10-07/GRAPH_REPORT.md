# Graph Report - Praroha  (2026-10-07)

## Corpus Check
- 183 files · ~213,527 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 1639 nodes · 3295 edges · 133 communities (110 shown, 23 thin omitted)
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 644 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0852a27`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LocalStorageProvider
- Context
- frontend/package.json
- apiClient
- Acceptance Test Scenarios & Results
- Phase 1: Foundation / Project Shell - Research
- Phase 1: Foundation / Project Shell - Context
- Seed Unfold — Product Concepts Glossary
- compilerOptions
- Milestone 2: Semantic Intelligence + Generative Media Requirements (Active)
- package.json
- Milestone 2 Phase Details
- Phase 6 Research: Traceability & Provenance (TRAC-01 to TRAC-03)
- models/__init__.py
- test_providers.py
- 2. The Three Demo Worlds
- Automated Playwright Test Results
- Phase 1 — Validation Strategy
- Project State: Seed Unfold (Praroha)
- playwright
- ADR-002: Three-World Branching and Traceability DAG
- LineageService
- Seed Unfold — Product Documentation
- Seed Unfold — Project Wiki Index
- Seed Unfold — Project Rules
- Seed Unfold Agent Instructions
- rules/graphify.md
- workflows/graphify.md
- WorldSelectionCreate
- What Was Built
- index.ts
- Areas Discussed & Decisions Made
- 1. Questions & User Decisions
- Topics Discussed & Decisions Made
- WorldSelectionRecord
- Discussion Topics & Agreed Decisions
- Phase 3 — Validation Strategy
- Phase 4 — Validation Strategy
- Implementation Decisions
- Phase 2 Research: Seed Understanding + Seed DNA
- Phase 2 — Validation Strategy
- Phase 1: Foundation / Project Shell - Discussion Log
- ADR-001: Core Architecture & Stack Selection
- test_lineage.py
- Proposed Changes
- Seed Unfold — Traceability & Provenance Model
- test_unfold.py
- Phase 10 Context: Divergent Worlds Engine
- ADR-003: Cloud Object Storage and Asset Management
- Phase 4 User Acceptance Testing (UAT) Report
- project_repo.py
- test_potential.py
- WorldCandidateRecord
- Locked Decisions
- 2.1 Backend Automated Suite (Pytest)
- Project
- useWorkspaceStore
- Canonical Demo Fixture for Seed Potential Map
- Phase 5 Research: Progressive World Unfolding
- Phase 4 Research: Human World Selection
- Phase 5 Execution Summary: Progressive World Unfolding (Tattva 4: Srishti)
- Validation Checklist
- PersistenceService
- http_exception_handler
- MockProvider
- 1. Questions & Locked Decisions
- ProjectRepository
- get_ai_provider
- Phase 3 Research: Three World Generation
- 2. Technical Investigation & Corrected Patterns
- Executive Summary
- test_persistence.py
- AIProvider
- CharacterRefineRequest
- Phase 6: Traceability & Provenance (Tattva 5: Sambandha) - Summary
- StorageProvider
- Phase 7: Refine / Branch / Save (Tattva 6: Parinamana & Dharana) — Summary
- test_gemini_provider_graceful_fallback
- Phase 8: Polish / Reliability / Demo — Research & Technical Spikes
- 2. Technical Tasks
- Phase 9: Seed Potential Map — User Acceptance Testing (UAT) Report
- Areas Discussed & Decisions Made
- Praroha: Comprehensive Judge Explanation
- Praroha
- typing
- persistence_service.py
- Praroha Judge Q&A Cheatsheet
- Plan 02-02 Summary: Frontend Seed Ingestion & Seed DNA Visualizer
- Praroha AI Pipeline & Provider Architecture
- Praroha 3-Minute Live Judging Demo Script
- Praroha Data & Storage Architecture
- Phase 8 User Acceptance Testing (UAT) Report
- 2. Locked Implementation Decisions
- SeedPotentialItemRead
- SupabaseStorageProvider
- 2. Locked Decisions (Incorporating Plan Corrections)
- Key Topics & Alignment
- Praroha Master Architecture: Tattva 2 & Idea 1
- 2. Key Accomplishments & Deliverables
- Proposed Changes
- ProjectRead
- asyncio
- Plan 01-02 Summary: Frontend Workspace Shell & End-to-End Integration
- test_health.py
- Phase 3 Plan 02 Summary: Frontend Candidate Cards, Comparison Canvas & Inspector Integration
- Implementation Decisions
- get_node_ancestor_path
- GeminiProvider
- Technical Specifications
- .generate_worlds
- Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback
- TraceabilityCanvas.tsx
- Proposed Changes
- Phase 9 Context: Seed Potential Map
- Plan 01-01 Summary: Backend Shell, Provider Abstractions, and Persistence
- EntityRevisionRecord
- Settings
- asyncio
- Plan Deliverables
- Locked Decisions
- Phase 8: Polish / Reliability / Demo - Validation Matrix
- test_backward_compatibility_empty_profile
- Phase 11 Context: Decision DNA
- Phase 11 Plan 1 (11-01-PLAN.md): Backend Decision DNA Engine
- Plan 02-01 Summary: Backend Seed Understanding & Seed DNA Service
- 2. Key Architecture Decisions & Implementations

## God Nodes (most connected - your core abstractions)
1. `ProjectRepository` - 103 edges
2. `MockProvider` - 56 edges
3. `PersistenceService` - 44 edges
4. `GeminiProvider` - 43 edges
5. `APIResponse` - 41 edges
6. `api_success()` - 41 edges
7. `AIProvider` - 41 edges
8. `WorldSelectionRecord` - 40 edges
9. `WorldCandidateRecord` - 38 edges
10. `StorageProvider` - 34 edges

## Surprising Connections (you probably didn't know these)
- `3. Immutability & Persistence` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/02-seed-understanding-seed-dna/02-RESEARCH.md → backend/app/models/dna.py
- `2. Reusable Assets in Workspace` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/03-three-world-generation/03-RESEARCH.md → backend/app/models/dna.py
- `Existing Architecture Integration Points` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/09-seed-potential-map/09-RESEARCH.md → backend/app/models/dna.py
- `A. Immutable Revision History (`entity_revisions`) & Audit Diffs` --references--> `EntityRevisionRecord`  [INFERRED]
  .planning/phases/07-refine-branch-save/07-RESEARCH.md → backend/app/models/persistence.py
- `Edge Relationships` --references--> `Asset`  [INFERRED]
  docs/architecture/TRACEABILITY_MODEL.md → backend/app/models/project.py

## Import Cycles
- None detected.

## Communities (133 total, 23 thin omitted)

### Community 0 - "LocalStorageProvider"
Cohesion: 0.14
Nodes (9): LocalStorageProvider, 3. Current Runtime Configuration Audit, Key Takeaway for Judges, 13. Is Supabase actually being used right now?, Final Verdict, Phase 7 User Acceptance Testing (UAT) Report, Test Environment, Test Scenarios & Results (+1 more)

### Community 1 - "Context"
Cohesion: 0.17
Nodes (11): Business & Hackathon Context, Constraints & Guardrails, Context, Core Value, Media Architecture & Design Principles (Phases 13–17), Milestone 1: Core MVP (Completed & Verified), Milestone 2: Semantic Intelligence + Generative Media (Active), Milestone Status (+3 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.05
Nodes (40): dependencies, clsx, framer-motion, lucide-react, react, react-dom, tailwind-merge, zustand (+32 more)

### Community 3 - "apiClient"
Cohesion: 0.17
Nodes (7): apiClient, APIResponse, Project, ProjectBundle, SeedPotentialItem, Delivered Features, What Was Built

### Community 4 - "Acceptance Test Scenarios & Results"
Cohesion: 0.18
Nodes (10): Acceptance Test Scenarios & Results, Phase 3 UAT: Three World Generation, Summary, Test 1: Stage 3 Transition & Candidate Generation, Test 2: Canonical Demo Fixtures Determinism, Test 3: Six Core Dimensions & Visual Contrast, Test 4: Workspace Inspector Drawer (Worlds Tab), Test 5: Re-generation & Append-Only Batch Persistence (+2 more)

### Community 5 - "Phase 1: Foundation / Project Shell - Research"
Cohesion: 0.12
Nodes (16): 1. Monorepo Organization, 2. Standardized Response Envelope, 3. AI Provider ABC Contract, 4. Storage Provider ABC Contract, Architectural Responsibility Map, Architecture Patterns & Implementation Blueprint, Automated Test Commands, Backend Core (+8 more)

### Community 6 - "Phase 1: Foundation / Project Shell - Context"
Cohesion: 0.15
Nodes (12): Architecture & Provenance Specifications, Canonical References, Deferred Ideas, Established Patterns, Existing Code Insights, Integration Points, Phase 1: Foundation / Project Shell - Context, Phase Boundary (+4 more)

### Community 7 - "Seed Unfold — Product Concepts Glossary"
Cohesion: 0.11
Nodes (18): 10. Scenes, 11. Assets, 12. Traceability, 13. Refine, 14. Branch, 15. Save / Load, 16. Canon, 17. Provenance (+10 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 9 - "Milestone 2: Semantic Intelligence + Generative Media Requirements (Active)"
Cohesion: 0.08
Nodes (24): Audio & Atmosphere via ACE-Step 1.5 (AUD) — Phase 17, Counterfactual Replay (CNTR) — Phase 19, Decision DNA (DDNA) — Phase 11, Divergence Engine (DIV) — Phase 10, Human-Only Zones (HOZ) — Phase 20, Human World Selection (HCHO), Image Generation via Pollinations & FLUX (IMG) — Phase 14, Media Provider Architecture (MED) — Phase 13 (+16 more)

### Community 10 - "package.json"
Cohesion: 0.13
Nodes (14): description, devDependencies, concurrently, name, private, scripts, dev, dev:backend (+6 more)

### Community 11 - "Milestone 2 Phase Details"
Cohesion: 0.07
Nodes (27): Milestone 2 Phase Details, Milestone 2 Phases Overview, Milestone 2: Semantic Intelligence + Generative Media, Overview, Phase 10: Divergence Engine, Phase 11: Decision DNA, Phase 12: Origin Ledger, Phase 13: Media Provider Architecture (+19 more)

### Community 12 - "Phase 6 Research: Traceability & Provenance (TRAC-01 to TRAC-03)"
Cohesion: 0.17
Nodes (11): 1.2 Node Schema (`TraceNode`), 1.3 Edge Schema (`TraceEdge`), 1.4 Lineage DAG Response (`TraceGraphRead`), 1. Domain Modeling: Nodes, Edges & Lineage, 2. Causal Explanation Engine (TRAC-03), 3.1 Stage 6 ("Trace") Canvas (`TraceabilityCanvas.tsx`), 3. Frontend Canvas & UX Architecture, 4. Test Strategy (+3 more)

### Community 13 - "models/__init__.py"
Cohesion: 0.26
Nodes (13): CharacterBase, CharacterRead, CharacterRelationshipBase, CharacterRelationshipRead, FactionItem, get_utc_now(), LocationItem, SceneBase (+5 more)

### Community 14 - "test_providers.py"
Cohesion: 0.48
Nodes (5): test_local_storage_provider(), test_mock_provider_extract_dna(), test_mock_provider_generate_worlds(), test_mock_provider_health_check(), test_mock_provider_unfold_stages()

### Community 15 - "2. The Three Demo Worlds"
Cohesion: 0.22
Nodes (8): 1. Canonical Demo Seed, 2. The Three Demo Worlds, 3. Fixture Role & Usage, Seed DNA Extraction (Deterministic Fixture), Seed Unfold — Canonical Demo Fixtures, World 1: Lost Civilization (Archaeological / Mythic), World 2: Bio-City (Symbiotic / Ecological), World 3: Time Capsule (Retro-Futuristic / Cold War)

### Community 16 - "Automated Playwright Test Results"
Cohesion: 0.29
Nodes (6): Automated Playwright Test Results, Phase 2 UAT: Seed Understanding + Seed DNA, Summary, Test 1: Seed Ingestion & Presets, Test 2: Understanding Pass Execution & Stage Progression, Test 3: Seed DNA Parameter Inspection & Drawer Export

### Community 17 - "Phase 1 — Validation Strategy"
Cohesion: 0.25
Nodes (7): Manual-Only Verifications, Per-Task Verification Map, Phase 1 — Validation Strategy, Sampling Rate, Test Infrastructure, Validation Sign-Off, Wave 0 Requirements

### Community 18 - "Project State: Seed Unfold (Praroha)"
Cohesion: 0.25
Nodes (7): Accumulated Context, Architectural & Product Decisions, Current Position, Next Action, Performance Metrics, Project Reference, Project State: Seed Unfold (Praroha)

### Community 19 - "playwright"
Cohesion: 0.06
Nodes (32): { chromium }, path, assert, { chromium }, runUAT(), assert, { chromium }, runPhase10E2E() (+24 more)

### Community 20 - "ADR-002: Three-World Branching and Traceability DAG"
Cohesion: 0.33
Nodes (5): ADR-002: Three-World Branching and Traceability DAG, Consequences, Context, Decision, Status

### Community 21 - "LineageService"
Cohesion: 0.20
Nodes (5): AncestorPathRead, TraceEdge, TraceGraphRead, TraceNode, LineageService

### Community 22 - "Seed Unfold — Product Documentation"
Cohesion: 0.33
Nodes (5): Key Concept Definitions, Overview, Primary References, Seed Unfold — Product Documentation, The Core Product Loop

### Community 23 - "Seed Unfold — Project Wiki Index"
Cohesion: 0.33
Nodes (5): 1. Product Documentation, 2. Architecture & Design, 3. Decisions & Rules, 4. Planning & Execution (GSD), Seed Unfold — Project Wiki Index

### Community 24 - "Seed Unfold — Project Rules"
Cohesion: 0.40
Nodes (4): 1. Product Rules, 2. UX Rules, 3. Architecture Rules, Seed Unfold — Project Rules

### Community 32 - "WorldSelectionCreate"
Cohesion: 0.06
Nodes (40): WorldSelectionCreate, test_cannot_select_world_after_stage5_unfolding_begun(), test_get_active_selection_endpoint(), test_select_candidate_from_older_batch_rejected(), test_select_invalid_candidate(), test_select_world_success(), test_select_world_with_rationale(), test_selection_schema() (+32 more)

### Community 33 - "What Was Built"
Cohesion: 0.08
Nodes (19): ExplorationProfile, WorldCandidateBase, test_exploration_profile_and_archetype_validation(), test_canonical_demo_fixtures_determinism(), test_generate_worlds_mock_fallback(), test_worlds_generate_and_get_endpoint(), test_worlds_regenerate_batch_history(), Phase 3 Plan 01 Summary: Backend World Candidate Models, Provider & API (+11 more)

### Community 34 - "index.ts"
Cohesion: 0.11
Nodes (35): ModalContentProps, SeedDnaViewerProps, DEFAULT_STAGES, WorkspaceState, AncestorPathRead, APIErrorDetail, AssetMetadata, BatchPotentialStatusUpdatePayload (+27 more)

### Community 35 - "Areas Discussed & Decisions Made"
Cohesion: 0.22
Nodes (8): 1. Backend DAG Modeling & Persistence, 2. Causal Explanation Engine (TRAC-03), 3. Stage 6 Canvas Layout & Presentation, 4. Node Selection & Highlighting Behavior, 5. Cross-Stage Integration (Stage 5 to Stage 6), Areas Discussed & Decisions Made, Phase 6 Discussion Log: Traceability & Provenance (TRAC-01 to TRAC-03), Requirements Traceability

### Community 36 - "1. Questions & User Decisions"
Cohesion: 0.22
Nodes (8): 1. Questions & User Decisions, 2. Locked Decisions Summary, Phase 4 Discussion Log: Human World Selection, Q1: Selection Interaction & Confirmation Flow, Q2: Backend Selection Persistence, Q3: Re-Selection / Switching Policy, Q4: Visual Canvas Treatment, Q5: Traceability DAG in Inspector Drawer

### Community 37 - "Topics Discussed & Decisions Made"
Cohesion: 0.22
Nodes (8): 1. Progressive Unfolding UX & Lifecycle State Machine, 2. Canonical Demo Fixture Support, 3. Database & Relational Persistence Architecture, 4. Non-blocking Visual Prompt Descriptors (UNFL-05) & Key Locations, 5. Lineage & Inspector Integration, Date: 2026-10-04, Phase 5 Discussion Log: Progressive World Unfolding, Topics Discussed & Decisions Made

### Community 38 - "WorldSelectionRecord"
Cohesion: 0.13
Nodes (17): WorldSelectionBase, WorldSelectionRecord, 1. Backend Data Models (`backend/app/models/selection.py`), 2. Database & Repository (`backend/app/repositories/project_repo.py`), 3. API Endpoints (`backend/app/routers/selection.py`), 4. Frontend State & Canvas (`frontend/src/`), Executive Summary, Phase 4 Context: Human World Selection (+9 more)

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

### Community 47 - "test_lineage.py"
Cohesion: 0.19
Nodes (8): test_ancestor_path_traversal(), test_lineage_initial_project(), test_lineage_with_dna(), test_lineage_with_selection(), test_lineage_with_unfolded_universe(), test_lineage_with_worlds(), test_no_cot_leakage(), test_relation_types_coverage()

### Community 48 - "Proposed Changes"
Cohesion: 0.20
Nodes (9): 1. Types & Client (`frontend/src/types/index.ts` & `frontend/src/api/client.ts`), 2. Workspace Store (`frontend/src/store/workspaceStore.ts`), 3. Canvas Component (`frontend/src/components/SeedPotentialCanvas.tsx`), 4. Workspace Integration (`frontend/src/components/WorkspaceCanvas.tsx` / `StageProgressHeader.tsx`), 5. Automated Verification & E2E (`frontend/e2e/test_phase9_potential.cjs`), Goal, Phase 9 Plan 2 (09-02-PLAN.md): Frontend Seed Potential Canvas & Interactive Controls, Proposed Changes (+1 more)

### Community 49 - "Seed Unfold — Traceability & Provenance Model"
Cohesion: 0.29
Nodes (6): 1. Lineage Graph Model, 2. Core Provenance Queries, 3. Privacy & Explainability Constraints, Edge Relationships, Node Types, Seed Unfold — Traceability & Provenance Model

### Community 50 - "test_unfold.py"
Cohesion: 0.17
Nodes (10): test_canonical_fixtures_by_raw_seed_and_title(), test_character_relationships_scoped_to_candidate(), test_get_unfolded_endpoint(), test_unfold_concurrency_rejection(), test_unfold_failure_lifecycle_and_rollback(), test_unfold_idempotency_when_already_unfolded(), test_unfold_requires_world_selection(), test_unfold_universe_success() (+2 more)

### Community 51 - "Phase 10 Context: Divergent Worlds Engine"
Cohesion: 0.15
Nodes (12): 1. Phase Goal, 2. Divergence Archetypes, 3. Exploration Profile Metrics (0–100%), 4. Seed Potential Map Integration (Phase 9 Bridge), 5. Implementation Decisions, 6. Out of Scope for Phase 10, D-01: Data Model Expansion (`backend/app/models/world.py`), D-02: AI Provider Engine (`backend/app/providers/`) (+4 more)

### Community 52 - "ADR-003: Cloud Object Storage and Asset Management"
Cohesion: 0.33
Nodes (5): ADR-003: Cloud Object Storage and Asset Management, Consequences, Context, Decision, Status

### Community 53 - "Phase 4 User Acceptance Testing (UAT) Report"
Cohesion: 0.33
Nodes (5): Final Verdict, Phase 4 User Acceptance Testing (UAT) Report, Test Environment, Test Scenarios & Results, Visual Artifacts

### Community 54 - "project_repo.py"
Cohesion: 0.14
Nodes (13): api_error(), api_success(), APIResponse, ErrorDetail, lifespan(), get_session(), create_canonical_demo(), create_project() (+5 more)

### Community 55 - "test_potential.py"
Cohesion: 0.22
Nodes (10): BatchPotentialStatusUpdate, get_utc_now(), PotentialItemStatus, SeedPotentialCategory, SeedPotentialItemBase, SeedPotentialItemUpdate, SinglePotentialItemStatusUpdate, test_gemini_provider_potential_fallback() (+2 more)

### Community 56 - "WorldCandidateRecord"
Cohesion: 0.17
Nodes (20): SeedDNARecord, CharacterRecord, CharacterRelationshipRecord, SceneRecord, WorldBibleRecord, WorldCandidateRecord, 2. Source-Accurate Pipeline Table, Managed Relational Tables (+12 more)

### Community 57 - "Locked Decisions"
Cohesion: 0.25
Nodes (7): D-02: Deterministic Causal Explanation Engine (TRAC-03), D-03: Stage 6 Hybrid Canvas UX, D-04: Cross-Stage Deep Linking, Locked Decisions, Phase 6 Context: Traceability & Provenance (TRAC-01 to TRAC-03), Phase Purpose, Technical Constraints & Boundaries

### Community 58 - "2.1 Backend Automated Suite (Pytest)"
Cohesion: 0.22
Nodes (8): 1. Executive Summary, 2.1 Backend Automated Suite (Pytest), 2.2 Frontend Build & TypeScript Validation, 2.3 End-to-End Browser Automation (Playwright), 2. Test Execution Results, 3. Requirements Traceability Matrix, 4. Next Phase, Phase 10: Divergent Worlds Engine — User Acceptance Testing (UAT) Report

### Community 59 - "Project"
Cohesion: 0.12
Nodes (12): Project, _migrate_columns(), 2. Repository Layer & Schema Migration (`backend/app/repositories/project_repo.py`), 4. Unfolding Router & Stable Snapshot Strategy (`backend/app/routers/unfold.py`), 5. Downstream AI Provider Injection (`backend/app/providers/`), 6. Automated Pytest Verification (`backend/tests/test_decision_dna.py`), Proposed Changes, D-02: Repository & Database Migration (`backend/app/repositories/project_repo.py`) (+4 more)

### Community 60 - "useWorkspaceStore"
Cohesion: 0.11
Nodes (34): App(), GuidedTourOverlay(), TOUR_STEPS, TourStepData, InspectorDrawer(), KeyboardShortcutsModal(), ShortcutRow, SHORTCUTS (+26 more)

### Community 61 - "Canonical Demo Fixture for Seed Potential Map"
Cohesion: 0.25
Nodes (7): AI-Inferred Possibilities, Canonical Demo Fixture for Seed Potential Map, Existing Architecture Integration Points, Explicit Elements, Open Questions, Phase 9 Research: Seed Potential Map, Technical Analysis

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

### Community 66 - "PersistenceService"
Cohesion: 0.11
Nodes (14): BranchCreate, BranchRead, EntityRevisionRead, ProjectBundle, SnapshotRead, branch_project(), create_storage_snapshot(), export_project_bundle() (+6 more)

### Community 69 - "1. Questions & Locked Decisions"
Cohesion: 0.25
Nodes (7): 1. Questions & Locked Decisions, 2. Next Steps, Phase 7: Refine, Branch & Save - Discussion Log, Question 1: Timeline Branching Architecture (PERS-02), Question 2: Component Refinement & Auditable Versioning (PERS-01), Question 3: Full Project State Save/Reload (PERS-03), Question 4: UI Architecture & Stage 7 Canvas Placement

### Community 70 - "ProjectRepository"
Cohesion: 0.15
Nodes (6): SeedPotentialItemRecord, Asset, ProjectCreate, ProjectRepository, Delivered Features, Backend Data Model & Repository

### Community 71 - "get_ai_provider"
Cohesion: 0.08
Nodes (9): get_ai_provider(), extract_seed_dna(), get_latest_seed_dna(), get_unfolded_universe(), unfold_universe(), generate_world_candidates(), get_latest_world_candidates(), B. Foolproof AI Provider Fallback Resilience (DEMO-02) (+1 more)

### Community 72 - "Phase 3 Research: Three World Generation"
Cohesion: 0.29
Nodes (6): 1. Domain & Architecture Analysis, 2. Reusable Assets in Workspace, 3. Potential Hazards & Mitigations, Goal, Key Insights & Standards, Phase 3 Research: Three World Generation

### Community 73 - "2. Technical Investigation & Corrected Patterns"
Cohesion: 0.20
Nodes (9): 1. Domain Overview & Requirements Mapping, 2. Technical Investigation & Corrected Patterns, A. Immutable Revision History (`entity_revisions`) & Audit Diffs, B. Phase 6 Lineage Version Semantics (`refined_from`), C. Strict Branch Cloning ID Remapping (PERS-02), D. Complete ProjectBundle with Lineage DAG, E. StorageProvider Interface Verification, F. Refinement Scope Boundary (+1 more)

### Community 74 - "Executive Summary"
Cohesion: 0.25
Nodes (7): 1. Data Models (`backend/app/models/world.py`), 2. API Endpoints (`backend/app/routers/worlds.py`), 3. Frontend Experience (Stage 3 `worlds`), Executive Summary, Out of Scope for Phase 3, Phase 3 Context: Three World Generation, Technical Specifications

### Community 75 - "test_persistence.py"
Cohesion: 0.27
Nodes (6): _setup_unfolded_project(), test_bundle_export_and_import_with_lineage(), test_character_and_scene_refinement_audit(), test_lineage_version_chaining(), test_storage_snapshots_persistence(), test_timeline_branching_strict_id_remapping()

### Community 76 - "AIProvider"
Cohesion: 0.14
Nodes (4): AIProvider, 1. Actual AI Provider Architecture, Components, 3. Is Gemini actually being used?

### Community 77 - "CharacterRefineRequest"
Cohesion: 0.15
Nodes (4): CharacterRefineRequest, SceneRefineRequest, refine_character(), refine_scene()

### Community 78 - "Phase 6: Traceability & Provenance (Tattva 5: Sambandha) - Summary"
Cohesion: 0.29
Nodes (6): 1. Executive Summary, 3. Verification & Testing, 4. Artifact Links, Backend Test Suite, Frontend Build & End-to-End Suite, Phase 6: Traceability & Provenance (Tattva 5: Sambandha) - Summary

### Community 79 - "StorageProvider"
Cohesion: 0.18
Nodes (5): StorageProvider, 1. Technical Stack Overview, 2. Architectural Principles & Boundaries, 3. Data Flow Diagram, Seed Unfold — System Architecture

### Community 80 - "Phase 7: Refine / Branch / Save (Tattva 6: Parinamana & Dharana) — Summary"
Cohesion: 0.25
Nodes (7): 1. Overview & Architecture, 2. Implementation Artifacts, 3. Verification Results, 4. Visual Artifacts, Core Architectural Guarantees, Frontend (`frontend/src/`), Phase 7: Refine / Branch / Save (Tattva 6: Parinamana & Dharana) — Summary

### Community 81 - "test_gemini_provider_graceful_fallback"
Cohesion: 0.22
Nodes (4): test_canonical_demo_api_endpoint(), test_create_canonical_demo_project_repository(), test_gemini_provider_graceful_fallback(), Task 4: Pytest Suite `backend/tests/test_demo.py`

### Community 82 - "Phase 8: Polish / Reliability / Demo — Research & Technical Spikes"
Cohesion: 0.14
Nodes (13): 1. Fast Canonical Demo Seeding Architecture (`DEMO-01`), 2. Bulletproof Error Fallback & Notification (`DEMO-02`), 3. Keyboard Shortcuts & Evaluator Flow, 4. 7-Stage Stepped Floating Guided Tour (Avyakta + 6 Tattva Transformations), 5. Lineage DAG Zoom & Polish, 6. Verification Plan, Design & Mechanics, Event Handling Best Practices (+5 more)

### Community 83 - "2. Technical Tasks"
Cohesion: 0.17
Nodes (11): 1. Context & Objectives, 2. Technical Tasks, 3. Verification Criteria, Plan: Phase 8 Wave 2 — Frontend Guided Demo Tour, Keyboard Shortcuts, Polish & E2E, Task 1: API & Store Integration for Instant Demo, Task 2: Create `GuidedTourOverlay.tsx`, Task 3: Create `KeyboardShortcutsModal.tsx`, Task 4: Global Keyboard Listener in `WorkspaceCanvas.tsx` (+3 more)

### Community 84 - "Phase 9: Seed Potential Map — User Acceptance Testing (UAT) Report"
Cohesion: 0.22
Nodes (8): 1. Executive Summary, 2.1 Backend Automated Suite (Pytest), 2.2 Frontend Build & TypeScript Validation, 2.3 End-to-End Browser Automation (Playwright), 2. Test Execution Results, 3. Requirements Traceability Matrix, 4. Next Phase, Phase 9: Seed Potential Map — User Acceptance Testing (UAT) Report

### Community 85 - "Areas Discussed & Decisions Made"
Cohesion: 0.29
Nodes (6): 1. Demo Walkthrough & Presentation Aids, 2. Error Communication & Resilience (DEMO-02), 3. UI Polish & Aesthetic Enhancements, 4. Technical Implementation of Fast Demo Preset, Areas Discussed & Decisions Made, Phase 8: Polish / Reliability / Demo — Discussion Log

### Community 86 - "Praroha: Comprehensive Judge Explanation"
Cohesion: 0.10
Nodes (20): 10. What happens without an API key or during network throttling?, 11. What is the canonical demo mode?, 12. How does the seed become a universe?, 13. Where does human agency enter?, 14. How is the original seed preserved?, 15. How does traceability work?, 16. How is project data stored?, 18. What is currently implemented? (+12 more)

### Community 87 - "Praroha"
Cohesion: 0.11
Nodes (18): 1. Problem Statement, 2. The Tattva 2 Connection, 3. Idea 1: Generative AI, 4. The Praroha Solution, 5. System Architecture, 6. AI Models, Reliability & Architecture Modes, 7. Quick Start & Demonstration, 8. Technology Stack (+10 more)

### Community 88 - "typing"
Cohesion: 0.10
Nodes (9): get_storage_provider(), build_engine(), init_db(), health_check(), client(), event_loop(), initialize_test_db(), test_storage_factory_supabase_resolution() (+1 more)

### Community 89 - "persistence_service.py"
Cohesion: 0.23
Nodes (5): EntityRevisionBase, get_utc_now(), get_utc_now(), WorldSelectionRead, WorldCandidateRead

### Community 90 - "Praroha Judge Q&A Cheatsheet"
Cohesion: 0.12
Nodes (15): 10. How is provenance represented?, 11. Why a relational database instead of a dedicated graph database like Neo4j?, 12. What is stored in object storage?, 14. Can this generate actual images, audio, or video right now?, 15. Can this architecture scale?, 16. What is the key technical innovation?, 1. Why is this project Tattva 2?, 2. Why not simply use ChatGPT or Claude in a chat window? (+7 more)

### Community 92 - "Praroha AI Pipeline & Provider Architecture"
Cohesion: 0.22
Nodes (8): 4. Canonical Demo vs Live Custom Seed Operation, 5. Multimodal Capabilities Reality Check, Deterministic Canonical Demo (`POST /api/projects/canonical-demo`), Future / Optional Scope (Explicitly NOT Live Now), Implemented Now, Master Framing, Praroha AI Pipeline & Provider Architecture, True Live Generative Pipeline (Custom Seeds)

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

### Community 97 - "SeedPotentialItemRead"
Cohesion: 0.19
Nodes (5): SeedPotentialItemRead, batch_update_potential_items(), extract_potential_map(), get_potential_map(), update_potential_item()

### Community 98 - "SupabaseStorageProvider"
Cohesion: 0.17
Nodes (4): SupabaseStorageProvider, test_supabase_storage_provider_fallback_on_network_error(), test_supabase_storage_provider_fallback_when_unset(), 17. What is cloud storage?

### Community 99 - "2. Locked Decisions (Incorporating Plan Corrections)"
Cohesion: 0.29
Nodes (6): 1. Phase Objective & Tattva Alignment, 2. Locked Decisions (Incorporating Plan Corrections), D-01: Timeline Branching & Strict Child ID Remapping (PERS-02), D-03: Full Project State Export, Import & Snapshots (PERS-03), D-04: UI Architecture & Stage 7 Canvas, Phase 7: Refine, Branch & Save (Tattva 6: Parinamana & Dharana) - Context

### Community 100 - "Key Topics & Alignment"
Cohesion: 0.40
Nodes (4): Discussion Summary, Key Topics & Alignment, Phase 3 Discussion Log: Three World Generation, Status

### Community 102 - "Praroha Master Architecture: Tattva 2 & Idea 1"
Cohesion: 0.33
Nodes (5): 1. Conceptual Unfolding Pipeline, 2. Technical System Architecture, 3. Core Architectural Guarantees, Philosophical Foundation, Praroha Master Architecture: Tattva 2 & Idea 1

### Community 103 - "2. Key Accomplishments & Deliverables"
Cohesion: 0.20
Nodes (9): 1. Overview & Conceptual Architecture, 2. Key Accomplishments & Deliverables, 3. Verification & Testing, 4. Phase Completion Sign-Off, C. 7-Stage Guided Demo Tour Overlay, D. Global Keyboard Shortcuts & Cheatsheet Modal, E. Traceability DAG Zoom & View Controls, Phase 8: Polish / Reliability / Demo (DEMO-01, DEMO-02) — Summary (+1 more)

### Community 104 - "Proposed Changes"
Cohesion: 0.18
Nodes (10): 1. Types (`frontend/src/types/index.ts`), 2. Candidate Card (`frontend/src/components/WorldCandidateCard.tsx`), 3. Stage 3 Canvas (`frontend/src/components/WorldCandidatesCanvas.tsx`), 4. Stage 4 Selection Canvas (`frontend/src/components/WorldSelectionCanvas.tsx`), 5. Automated E2E Verification (`frontend/e2e/test_phase10_divergence.cjs`), Goal, Phase 10 Plan 2 (10-02-PLAN.md): Frontend Divergent Worlds UI & E2E Verification, Proposed Changes (+2 more)

### Community 105 - "ProjectRead"
Cohesion: 0.36
Nodes (7): AssetBase, AssetCreate, AssetRead, get_utc_now(), ProjectBase, ProjectRead, 1. Data Models & Relational Entity (`backend/app/models/selection.py`)

### Community 106 - "asyncio"
Cohesion: 0.29
Nodes (3): test_canonical_demo_fixtures_divergence_triad(), test_divergent_worlds_endpoints_lifecycle(), test_mock_provider_arbitrary_seed_with_potential()

### Community 110 - "Implementation Decisions"
Cohesion: 0.29
Nodes (7): AI Provider Abstraction & Stub Provider, Frontend-Backend Communication & Monorepo Structure, Implementation Decisions, Initial State & Persistence Bootstrap, Object Storage & Asset Foundation, The Agent's Discretion, Workspace Layout & Shell Aesthetics

### Community 112 - "GeminiProvider"
Cohesion: 0.10
Nodes (16): ExtractDNARequest, get_utc_now(), SeedDNA, SeedDNABase, SeedDNARead, DivergenceArchetype, get_utc_now(), WorldCandidate (+8 more)

### Community 113 - "Technical Specifications"
Cohesion: 0.40
Nodes (5): 2. Provider Unfolding Extension (`backend/app/providers/`), 3. Database & Repository (`backend/app/repositories/project_repo.py`), 4. API Endpoints (`backend/app/routers/unfold.py`), 5. Frontend Canvas & State (`frontend/src/`), Technical Specifications

### Community 114 - ".generate_worlds"
Cohesion: 0.17
Nodes (9): 2. Repository Layer (`backend/app/repositories/project_repo.py`), 3. AI Providers, 4. Router (`backend/app/routers/worlds.py`), 5. Automated Tests (`backend/tests/test_divergence.py`), Goal, Phase 10 Plan 1 (10-01-PLAN.md): Backend Divergent Worlds Engine, Proposed Changes, Requirements Addressed (+1 more)

### Community 115 - "Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback"
Cohesion: 0.29
Nodes (6): 1. Context & Objectives, 2. Technical Tasks, 3. Verification Criteria, Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback, Task 2: Mount `POST /api/projects/canonical-demo`, Task 3: Resilient Fallback Wrapper in `gemini_provider.py`

### Community 116 - "TraceabilityCanvas.tsx"
Cohesion: 0.67
Nodes (3): NodeCard(), NodeCardProps, TraceNode

### Community 117 - "Proposed Changes"
Cohesion: 0.22
Nodes (8): 2. Repository Layer (`backend/app/repositories/project_repo.py`), 3. AI Providers, 4. Router & Endpoints (`backend/app/routers/potential.py`), 5. Automated Tests (`backend/tests/test_potential.py`), Goal, Phase 9 Plan 1 (09-01-PLAN.md): Backend Seed Potential Map Service, Proposed Changes, Verification Criteria

### Community 118 - "Phase 9 Context: Seed Potential Map"
Cohesion: 0.20
Nodes (9): AI Provider & Extraction Engine, API Endpoints, Frontend Presentation, Implementation Decisions, Item Statuses, Key Concepts & Categories, Out of Scope, Phase 9 Context: Seed Potential Map (+1 more)

### Community 120 - "EntityRevisionRecord"
Cohesion: 0.21
Nodes (8): EntityRevisionRecord, TraceNodeType, TraceRelationType, D-02: Component Refinement & Immutable Revision History (PERS-01), Backend (`backend/`), 1. Test Automation Matrix, 2. Acceptance Criteria Checklist, Phase 7: Refine, Branch & Save - Validation Matrix

### Community 122 - "asyncio"
Cohesion: 0.40
Nodes (4): test_canonical_demo_includes_potential_items(), test_mock_provider_extract_potential_arbitrary_seed(), test_mock_provider_extract_potential_canonical(), test_potential_endpoints_lifecycle()

### Community 124 - "Locked Decisions"
Cohesion: 0.50
Nodes (4): Deferred Ideas (OUT OF SCOPE), Locked Decisions, The Agent's Discretion, User Constraints (from CONTEXT.md)

### Community 127 - "Phase 11 Context: Decision DNA"
Cohesion: 0.33
Nodes (5): 1. Phase Goal, 2. Core Elements of Decision DNA, 3. Downstream Propagation & Integration (Stage 5 Bridge), 5. Out of Scope for Phase 11, Phase 11 Context: Decision DNA

### Community 128 - "Phase 11 Plan 1 (11-01-PLAN.md): Backend Decision DNA Engine"
Cohesion: 0.40
Nodes (4): Goal, Phase 11 Plan 1 (11-01-PLAN.md): Backend Decision DNA Engine, Requirements Addressed, Verification Criteria

### Community 130 - "2. Key Architecture Decisions & Implementations"
Cohesion: 0.67
Nodes (3): 2. Key Architecture Decisions & Implementations, B. User Clarifications & Plan Corrections, C. Frontend Visual Excellence & Interactive DAG

## Knowledge Gaps
- **518 isolated node(s):** `{ chromium }`, `path`, `{ chromium }`, `{ chromium }`, `{ chromium }` (+513 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 772 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MockProvider` connect `MockProvider` to `LocalStorageProvider`, `Context`, `Phase 1: Foundation / Project Shell - Research`, `test_providers.py`, `What Was Built`, `Topics Discussed & Decisions Made`, `WorldSelectionRecord`, `Discussion Topics & Agreed Decisions`, `Implementation Decisions`, `test_unfold.py`, `project_repo.py`, `test_potential.py`, `WorldCandidateRecord`, `2.1 Backend Automated Suite (Pytest)`, `useWorkspaceStore`, `ProjectRepository`, `get_ai_provider`, `AIProvider`, `Phase 8: Polish / Reliability / Demo — Research & Technical Spikes`, `Praroha: Comprehensive Judge Explanation`, `Praroha`, `typing`, `Praroha Judge Q&A Cheatsheet`, `2. Locked Implementation Decisions`, `Key Topics & Alignment`, `asyncio`, `GeminiProvider`, `.generate_worlds`, `Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback`, `Proposed Changes`, `Phase 9 Context: Seed Potential Map`, `asyncio`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `ProjectRepository` connect `ProjectRepository` to `.get_unfolded_universe`, `.get_world_candidate`, `Phase 1: Foundation / Project Shell - Research`, `Phase 1: Foundation / Project Shell - Context`, `models/__init__.py`, `LineageService`, `WorldSelectionCreate`, `WorldSelectionRecord`, `Phase 1: Foundation / Project Shell - Discussion Log`, `test_unfold.py`, `project_repo.py`, `test_potential.py`, `WorldCandidateRecord`, `2.1 Backend Automated Suite (Pytest)`, `Project`, `PersistenceService`, `MockProvider`, `get_ai_provider`, `CharacterRefineRequest`, `test_gemini_provider_graceful_fallback`, `persistence_service.py`, `SeedPotentialItemRead`, `ProjectRead`, `Implementation Decisions`, `get_node_ancestor_path`, `GeminiProvider`, `EntityRevisionRecord`, `Locked Decisions`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `1. Test Automation Matrix` connect `useWorkspaceStore` to `MockProvider`, `ProjectRead`, `GeminiProvider`, `WorldCandidateRecord`, `Phase 8: Polish / Reliability / Demo - Validation Matrix`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Are the 55 inferred relationships involving `ProjectRepository` (e.g. with `SeedDNA` and `SeedDNARecord`) actually correct?**
  _`ProjectRepository` has 55 INFERRED edges - model-reasoned connections that need verification._
- **Are the 37 inferred relationships involving `MockProvider` (e.g. with `GeminiProvider` and `ProjectRepository`) actually correct?**
  _`MockProvider` has 37 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `PersistenceService` (e.g. with `branch_project()` and `create_storage_snapshot()`) actually correct?**
  _`PersistenceService` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `GeminiProvider` (e.g. with `SeedDNA` and `WorldCandidate`) actually correct?**
  _`GeminiProvider` has 26 INFERRED edges - model-reasoned connections that need verification._