# Graph Report - Praroha  (2026-10-07)

## Corpus Check
- 193 files · ~225,672 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 1741 nodes · 3540 edges · 145 communities (125 shown, 20 thin omitted)
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 697 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ca093307`
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
- routers/persistence.py
- 2. The Three Demo Worlds
- Automated Playwright Test Results
- Phase 1 — Validation Strategy
- Project State: Seed Unfold (Praroha)
- test_phase7_refine.cjs
- ADR-002: Three-World Branching and Traceability DAG
- LineageService
- Seed Unfold — Product Documentation
- Seed Unfold — Project Wiki Index
- Seed Unfold — Project Rules
- Seed Unfold Agent Instructions
- rules/graphify.md
- workflows/graphify.md
- test_selection.py
- What Was Built
- index.ts
- Areas Discussed & Decisions Made
- 1. Questions & User Decisions
- Topics Discussed & Decisions Made
- GeminiProvider
- Discussion Topics & Agreed Decisions
- Phase 3 — Validation Strategy
- Phase 4 — Validation Strategy
- Implementation Decisions
- Phase 2 Research: Seed Understanding + Seed DNA
- Phase 2 — Validation Strategy
- Phase 1: Foundation / Project Shell - Discussion Log
- ADR-001: Core Architecture & Stack Selection
- 06-01-PLAN.md
- Proposed Changes
- Asset
- test_unfold.py
- Phase 10 Context: Divergent Worlds Engine
- ADR-003: Cloud Object Storage and Asset Management
- Phase 4 User Acceptance Testing (UAT) Report
- StorageProvider
- batch_update_potential_items
- CharacterRecord
- Locked Decisions
- devDependencies
- Technical Analysis
- useWorkspaceStore
- Canonical Demo Fixture for Seed Potential Map
- _migrate_columns
- Phase 4 Research: Human World Selection
- Phase 5 Execution Summary: Progressive World Unfolding (Tattva 4: Srishti)
- Validation Checklist
- api_success
- playwright
- Phase 11 Plan 1 (11-01-PLAN.md): Backend Decision DNA Engine
- 1. Questions & Locked Decisions
- ProjectRepository
- models/dna.py
- .generate_worlds
- 2. Technical Investigation & Corrected Patterns
- Executive Summary
- test_persistence.py
- AIProvider
- PersistenceService
- Phase 6: Traceability & Provenance (Tattva 5: Sambandha) - Summary
- MockProvider
- UniverseCodexCanvas.tsx
- Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback
- Phase 8: Polish / Reliability / Demo — Research & Technical Spikes
- 2. Technical Tasks
- Phase 9: Seed Potential Map — User Acceptance Testing (UAT) Report
- Areas Discussed & Decisions Made
- Praroha: Comprehensive Judge Explanation
- Praroha
- test_providers.py
- Phase 9 Context: Seed Potential Map
- Praroha Judge Q&A Cheatsheet
- 1. Locked Decisions & Implementation Scope
- Praroha AI Pipeline & Provider Architecture
- Praroha 3-Minute Live Judging Demo Script
- Praroha Data & Storage Architecture
- Phase 8 User Acceptance Testing (UAT) Report
- 2. Locked Implementation Decisions
- Proposed Changes
- gemini_provider.py
- project_repo.py
- Proposed Changes
- 2. Locked Decisions (Incorporating Plan Corrections)
- Praroha Master Architecture: Tattva 2 & Idea 1
- 2. Key Accomplishments & Deliverables
- Proposed Changes
- conftest.py
- WorldSelectionRecord
- Plan 01-02 Summary: Frontend Workspace Shell & End-to-End Integration
- project.py
- Phase 3 Plan 02 Summary: Frontend Candidate Cards, Comparison Canvas & Inspector Integration
- Phase 12 Plan 1 (12-01-PLAN.md): Backend Origin Ledger Engine
- Implementation Decisions
- world.py
- test_health.py
- Phase 10: Divergent Worlds Engine — User Acceptance Testing (UAT) Report
- ref_assert
- Proposed Changes
- test_supabase_storage_provider_fallback_on_network_error
- test_potential.py
- Key Topics & Alignment
- Technical Specifications
- health_check
- dependencies
- Phase 7: Refine / Branch / Save (Tattva 6: Parinamana & Dharana) — Summary
- ExplorationProfile
- Plan 02-02 Summary: Frontend Seed Ingestion & Seed DNA Visualizer
- 1. Existing Architecture Integration Points
- Phase 11 Context: Decision DNA
- export_project_bundle
- select_world_candidate
- unfold_universe
- asyncio
- get_node_ancestor_path
- Phase 5 Research: Progressive World Unfolding
- Phase 12 Plan 2 (12-02-PLAN.md): Frontend Origin Ledger UI & E2E Suite
- test_phase10_divergence.cjs
- test_phase11_decision_dna.cjs
- test_phase3_worlds.cjs
- test_phase4_selection.cjs
- test_phase5_unfold.cjs
- test_phase6_traceability.cjs
- scripts
- Plan 02-01 Summary: Backend Seed Understanding & Seed DNA Service
- Phase 8: Polish / Reliability / Demo - Validation Matrix
- test_backward_compatibility_empty_profile

## God Nodes (most connected - your core abstractions)
1. `ProjectRepository` - 110 edges
2. `MockProvider` - 58 edges
3. `GeminiProvider` - 46 edges
4. `PersistenceService` - 44 edges
5. `WorldSelectionRecord` - 43 edges
6. `APIResponse` - 41 edges
7. `api_success()` - 41 edges
8. `AIProvider` - 41 edges
9. `CharacterRecord` - 38 edges
10. `WorldCandidateRecord` - 38 edges

## Surprising Connections (you probably didn't know these)
- `3. Immutability & Persistence` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/02-seed-understanding-seed-dna/02-RESEARCH.md → backend/app/models/dna.py
- `2. Reusable Assets in Workspace` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/03-three-world-generation/03-RESEARCH.md → backend/app/models/dna.py
- `Existing Architecture Integration Points` --references--> `SeedDNARecord`  [INFERRED]
  .planning/phases/09-seed-potential-map/09-RESEARCH.md → backend/app/models/dna.py
- `A. Immutable Revision History (`entity_revisions`) & Audit Diffs` --references--> `EntityRevisionRecord`  [INFERRED]
  .planning/phases/07-refine-branch-save/07-RESEARCH.md → backend/app/models/persistence.py
- `1. Test Automation Matrix` --references--> `EntityRevisionRecord`  [INFERRED]
  .planning/phases/07-refine-branch-save/07-VALIDATION.md → backend/app/models/persistence.py

## Import Cycles
- None detected.

## Communities (145 total, 20 thin omitted)

### Community 0 - "LocalStorageProvider"
Cohesion: 0.10
Nodes (10): LocalStorageProvider, SupabaseStorageProvider, test_storage_factory_supabase_resolution(), 3. Current Runtime Configuration Audit, Key Takeaway for Judges, 17. What is cloud storage?, 13. Is Supabase actually being used right now?, Delivered Features (+2 more)

### Community 1 - "Context"
Cohesion: 0.17
Nodes (11): Business & Hackathon Context, Constraints & Guardrails, Context, Core Value, Media Architecture & Design Principles (Phases 13–17), Milestone 1: Core MVP (Completed & Verified), Milestone 2: Semantic Intelligence + Generative Media (Active), Milestone Status (+3 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.11
Nodes (17): name, private, type, version, autoprefixer, clsx, postcss, react-dom (+9 more)

### Community 3 - "apiClient"
Cohesion: 0.17
Nodes (7): apiClient, APIResponse, Project, ProjectBundle, SeedPotentialItem, Delivered Features, What Was Built

### Community 4 - "Acceptance Test Scenarios & Results"
Cohesion: 0.18
Nodes (10): Acceptance Test Scenarios & Results, Phase 3 UAT: Three World Generation, Summary, Test 1: Stage 3 Transition & Candidate Generation, Test 2: Canonical Demo Fixtures Determinism, Test 3: Six Core Dimensions & Visual Contrast, Test 4: Workspace Inspector Drawer (Worlds Tab), Test 5: Re-generation & Append-Only Batch Persistence (+2 more)

### Community 5 - "Phase 1: Foundation / Project Shell - Research"
Cohesion: 0.10
Nodes (20): 1. Monorepo Organization, 2. Standardized Response Envelope, 3. AI Provider ABC Contract, 4. Storage Provider ABC Contract, Architectural Responsibility Map, Architecture Patterns & Implementation Blueprint, Automated Test Commands, Backend Core (+12 more)

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
Cohesion: 0.16
Nodes (15): SeedDNABase, CharacterBase, CharacterRelationshipBase, CharacterRelationshipRead, FactionItem, get_utc_now(), LocationItem, SceneBase (+7 more)

### Community 14 - "routers/persistence.py"
Cohesion: 0.15
Nodes (8): CharacterRefineRequest, CharacterRead, SceneRead, get_storage_provider(), get_persistence_service(), refine_character(), refine_scene(), test_entity_models_origin_defaults_and_serialization()

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

### Community 19 - "test_phase7_refine.cjs"
Cohesion: 0.22
Nodes (8): assert, { chromium }, fs, runPhase7E2E(), assert, { chromium }, fs, runPhase8E2E()

### Community 20 - "ADR-002: Three-World Branching and Traceability DAG"
Cohesion: 0.33
Nodes (5): ADR-002: Three-World Branching and Traceability DAG, Consequences, Context, Decision, Status

### Community 21 - "LineageService"
Cohesion: 0.16
Nodes (7): AncestorPathRead, TraceEdge, TraceGraphRead, TraceNode, LineageService, test_deterministic_explainer_zero_llm_overhead(), test_lineage_graph_returns_populated_origins()

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
Cohesion: 0.12
Nodes (20): test_cannot_select_world_after_stage5_unfolding_begun(), test_get_active_selection_endpoint(), test_select_candidate_from_older_batch_rejected(), test_select_invalid_candidate(), test_select_world_success(), test_select_world_with_rationale(), test_selection_schema(), test_switch_world_selection() (+12 more)

### Community 33 - "What Was Built"
Cohesion: 0.20
Nodes (8): test_canonical_demo_fixtures_determinism(), test_generate_worlds_mock_fallback(), test_worlds_generate_and_get_endpoint(), test_worlds_regenerate_batch_history(), Phase 3 Plan 01 Summary: Backend World Candidate Models, Provider & API, Verification, What Was Built, Repository & DB Migration (`backend/app/repositories/project_repo.py`)

### Community 34 - "index.ts"
Cohesion: 0.10
Nodes (39): ModalContentProps, SeedDnaViewerProps, SeedPotentialCanvas(), SeedPotentialCanvasProps, DEFAULT_STAGES, WorkspaceState, AncestorPathRead, APIErrorDetail (+31 more)

### Community 35 - "Areas Discussed & Decisions Made"
Cohesion: 0.22
Nodes (8): 1. Backend DAG Modeling & Persistence, 2. Causal Explanation Engine (TRAC-03), 3. Stage 6 Canvas Layout & Presentation, 4. Node Selection & Highlighting Behavior, 5. Cross-Stage Integration (Stage 5 to Stage 6), Areas Discussed & Decisions Made, Phase 6 Discussion Log: Traceability & Provenance (TRAC-01 to TRAC-03), Requirements Traceability

### Community 36 - "1. Questions & User Decisions"
Cohesion: 0.22
Nodes (8): 1. Questions & User Decisions, 2. Locked Decisions Summary, Phase 4 Discussion Log: Human World Selection, Q1: Selection Interaction & Confirmation Flow, Q2: Backend Selection Persistence, Q3: Re-Selection / Switching Policy, Q4: Visual Canvas Treatment, Q5: Traceability DAG in Inspector Drawer

### Community 37 - "Topics Discussed & Decisions Made"
Cohesion: 0.22
Nodes (8): 1. Progressive Unfolding UX & Lifecycle State Machine, 2. Canonical Demo Fixture Support, 3. Database & Relational Persistence Architecture, 4. Non-blocking Visual Prompt Descriptors (UNFL-05) & Key Locations, 5. Lineage & Inspector Integration, Date: 2026-10-04, Phase 5 Discussion Log: Progressive World Unfolding, Topics Discussed & Decisions Made

### Community 38 - "GeminiProvider"
Cohesion: 0.13
Nodes (6): GeminiProvider, test_gemini_prompt_creative_contract_injection(), test_dna_extract_and_get_endpoint(), test_gemini_provider_mock_fallback(), test_raw_seed_immutability(), test_seed_dna_schema_validation()

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

### Community 47 - "06-01-PLAN.md"
Cohesion: 0.14
Nodes (13): test_ancestor_path_traversal(), test_lineage_initial_project(), test_lineage_with_dna(), test_lineage_with_selection(), test_lineage_with_unfolded_universe(), test_lineage_with_worlds(), test_no_cot_leakage(), test_relation_types_coverage() (+5 more)

### Community 48 - "Proposed Changes"
Cohesion: 0.20
Nodes (9): 1. Types & Client (`frontend/src/types/index.ts` & `frontend/src/api/client.ts`), 2. Workspace Store (`frontend/src/store/workspaceStore.ts`), 3. Canvas Component (`frontend/src/components/SeedPotentialCanvas.tsx`), 4. Workspace Integration (`frontend/src/components/WorkspaceCanvas.tsx` / `StageProgressHeader.tsx`), 5. Automated Verification & E2E (`frontend/e2e/test_phase9_potential.cjs`), Goal, Phase 9 Plan 2 (09-02-PLAN.md): Frontend Seed Potential Canvas & Interactive Controls, Proposed Changes (+1 more)

### Community 49 - "Asset"
Cohesion: 0.15
Nodes (8): Asset, 1. Lineage Graph Model, 2. Core Provenance Queries, 3. Privacy & Explainability Constraints, Edge Relationships, Node Types, Seed Unfold — Traceability & Provenance Model, Backend (`backend/`)

### Community 50 - "test_unfold.py"
Cohesion: 0.18
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

### Community 54 - "StorageProvider"
Cohesion: 0.11
Nodes (10): StorageProvider, 1. Technical Stack Overview, 2. Architectural Principles & Boundaries, 3. Data Flow Diagram, Seed Unfold — System Architecture, Final Verdict, Phase 7 User Acceptance Testing (UAT) Report, Test Environment (+2 more)

### Community 55 - "batch_update_potential_items"
Cohesion: 0.18
Nodes (4): batch_update_potential_items(), extract_potential_map(), get_potential_map(), update_potential_item()

### Community 56 - "CharacterRecord"
Cohesion: 0.20
Nodes (22): SeedDNARecord, EntityRevisionRecord, CharacterRecord, CharacterRelationshipRecord, SceneRecord, WorldBibleRecord, WorldCandidateRecord, 2. Source-Accurate Pipeline Table (+14 more)

### Community 57 - "Locked Decisions"
Cohesion: 0.25
Nodes (7): D-02: Deterministic Causal Explanation Engine (TRAC-03), D-03: Stage 6 Hybrid Canvas UX, D-04: Cross-Stage Deep Linking, Locked Decisions, Phase 6 Context: Traceability & Provenance (TRAC-01 to TRAC-03), Phase Purpose, Technical Constraints & Boundaries

### Community 58 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, playwright, postcss, tailwindcss, @types/node, @types/react, @types/react-dom (+3 more)

### Community 59 - "Technical Analysis"
Cohesion: 0.15
Nodes (12): 1. Architectural Overview & Intent, 3.1 Data Types (`frontend/src/types/index.ts`), 3.2 Workspace Store (`frontend/src/store/workspaceStore.ts`) & API Client (`frontend/src/api/client.ts`), 3.3 Stage 4 UI: Decision DNA Capture (`frontend/src/components/WorldSelectionCanvas.tsx`), 3.4 Stage 5 UI: Codex Anchor Strip (`frontend/src/components/UniverseCodexCanvas.tsx`), 3.5 Inspector Drawer (`frontend/src/components/InspectorDrawer.tsx`), 3. Frontend Architecture Integration, 4. Canonical Demo & Offline Resilience (+4 more)

### Community 60 - "useWorkspaceStore"
Cohesion: 0.12
Nodes (33): App(), GuidedTourOverlay(), TOUR_STEPS, TourStepData, InspectorDrawer(), KeyboardShortcutsModal(), ShortcutRow, SHORTCUTS (+25 more)

### Community 61 - "Canonical Demo Fixture for Seed Potential Map"
Cohesion: 0.25
Nodes (7): AI-Inferred Possibilities, Canonical Demo Fixture for Seed Potential Map, Existing Architecture Integration Points, Explicit Elements, Open Questions, Phase 9 Research: Seed Potential Map, Technical Analysis

### Community 62 - "_migrate_columns"
Cohesion: 0.22
Nodes (9): _migrate_columns(), 1.1 Existing Lineage & Entity Architecture, 1.2 The 6-Tier Universal Origin Classification Taxonomy (`ORIG-01`), 1.3 Deterministic "Why is this here?" Explainer (`ORIG-03`), 1.4 Frontend Integration Surfaces (`ORIG-02`, `ORIG-03`), 1. Domain & Architecture Investigation, 2. Plan Decomposition, 3. Risk Mitigation & Verification (+1 more)

### Community 63 - "Phase 4 Research: Human World Selection"
Cohesion: 0.29
Nodes (6): 1. Domain & Architecture Analysis, 2. Reusable Assets & Integration Points, 3. Potential Hazards & Mitigations, Goal, Key Architectural Insights, Phase 4 Research: Human World Selection

### Community 64 - "Phase 5 Execution Summary: Progressive World Unfolding (Tattva 4: Srishti)"
Cohesion: 0.40
Nodes (4): Captured Artifacts, Execution Overview, Phase 5 Execution Summary: Progressive World Unfolding (Tattva 4: Srishti), Verification Summary

### Community 65 - "Validation Checklist"
Cohesion: 0.33
Nodes (5): 1. Backend Verification, 2. Frontend Verification, 3. End-to-End Playwright Verification, Phase 6 Validation: Traceability & Provenance (TRAC-01 to TRAC-03), Validation Checklist

### Community 66 - "api_success"
Cohesion: 0.23
Nodes (10): api_success(), APIResponse, ProjectRead, branch_project(), create_storage_snapshot(), import_project_bundle(), create_canonical_demo(), create_project() (+2 more)

### Community 67 - "playwright"
Cohesion: 0.22
Nodes (6): { chromium }, path, assert, { chromium }, runUAT(), playwright

### Community 68 - "Phase 11 Plan 1 (11-01-PLAN.md): Backend Decision DNA Engine"
Cohesion: 0.40
Nodes (4): Goal, Phase 11 Plan 1 (11-01-PLAN.md): Backend Decision DNA Engine, Requirements Addressed, Verification Criteria

### Community 69 - "1. Questions & Locked Decisions"
Cohesion: 0.25
Nodes (7): 1. Questions & Locked Decisions, 2. Next Steps, Phase 7: Refine, Branch & Save - Discussion Log, Question 1: Timeline Branching Architecture (PERS-02), Question 2: Component Refinement & Auditable Versioning (PERS-01), Question 3: Full Project State Save/Reload (PERS-03), Question 4: UI Architecture & Stage 7 Canvas Placement

### Community 70 - "ProjectRepository"
Cohesion: 0.11
Nodes (5): SeedPotentialItemRecord, Project, ProjectRepository, Key Changes, Backend Data Model & Repository

### Community 71 - "models/dna.py"
Cohesion: 0.12
Nodes (10): ExtractDNARequest, get_utc_now(), SeedDNA, SeedDNARead, get_ai_provider(), extract_seed_dna(), get_latest_seed_dna(), generate_world_candidates() (+2 more)

### Community 72 - ".generate_worlds"
Cohesion: 0.18
Nodes (8): 1. Domain & Architecture Analysis, 2. Reusable Assets in Workspace, 3. Potential Hazards & Mitigations, Goal, Key Insights & Standards, Phase 3 Research: Three World Generation, 5. Automated Tests (`backend/tests/test_divergence.py`), 2.1 Backend Automated Suite (Pytest)

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

### Community 77 - "PersistenceService"
Cohesion: 0.12
Nodes (10): BranchCreate, BranchRead, EntityRevisionBase, EntityRevisionRead, get_utc_now(), ProjectBundle, SceneRefineRequest, SnapshotRead (+2 more)

### Community 78 - "Phase 6: Traceability & Provenance (Tattva 5: Sambandha) - Summary"
Cohesion: 0.20
Nodes (9): 1. Executive Summary, 2. Key Architecture Decisions & Implementations, 3. Verification & Testing, 4. Artifact Links, B. User Clarifications & Plan Corrections, Backend Test Suite, C. Frontend Visual Excellence & Interactive DAG, Frontend Build & End-to-End Suite (+1 more)

### Community 80 - "UniverseCodexCanvas.tsx"
Cohesion: 0.13
Nodes (23): ORIGIN_CONFIG, OriginBadge(), OriginBadgeProps, OriginConfig, getOriginAccentClass(), NodeCard(), NodeCardProps, UniverseCodexCanvas() (+15 more)

### Community 81 - "Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback"
Cohesion: 0.12
Nodes (10): test_canonical_demo_api_endpoint(), test_create_canonical_demo_project_repository(), test_gemini_provider_graceful_fallback(), 1. Context & Objectives, 2. Technical Tasks, 3. Verification Criteria, Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback, Task 2: Mount `POST /api/projects/canonical-demo` (+2 more)

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

### Community 88 - "test_providers.py"
Cohesion: 0.48
Nodes (5): test_local_storage_provider(), test_mock_provider_extract_dna(), test_mock_provider_generate_worlds(), test_mock_provider_health_check(), test_mock_provider_unfold_stages()

### Community 89 - "Phase 9 Context: Seed Potential Map"
Cohesion: 0.20
Nodes (9): AI Provider & Extraction Engine, API Endpoints, Frontend Presentation, Implementation Decisions, Item Statuses, Key Concepts & Categories, Out of Scope, Phase 9 Context: Seed Potential Map (+1 more)

### Community 90 - "Praroha Judge Q&A Cheatsheet"
Cohesion: 0.12
Nodes (15): 10. How is provenance represented?, 11. Why a relational database instead of a dedicated graph database like Neo4j?, 12. What is stored in object storage?, 14. Can this generate actual images, audio, or video right now?, 15. Can this architecture scale?, 16. What is the key technical innovation?, 1. Why is this project Tattva 2?, 2. Why not simply use ChatGPT or Claude in a chat window? (+7 more)

### Community 91 - "1. Locked Decisions & Implementation Scope"
Cohesion: 0.25
Nodes (7): 1. Locked Decisions & Implementation Scope, 2. Verification Criteria, D-01: Universal Origin Classification Taxonomy (`ORIG-01`), D-03: Stage 5 Genesis Engine Origin Assignment, D-04: Deterministic "Why is this here?" Explainer (`ORIG-03`), D-06: Visual Styling & Color Palette, Phase 12 Context: Origin Ledger

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

### Community 97 - "Proposed Changes"
Cohesion: 0.17
Nodes (11): 1. Types (`frontend/src/types/index.ts`), 2. API Client & Workspace Store, 3. Stage 4: World Selection Canvas (`frontend/src/components/WorldSelectionCanvas.tsx`), 4. Stage 5: Universe Codex Canvas (`frontend/src/components/UniverseCodexCanvas.tsx`), 5. Inspector Drawer (`frontend/src/components/InspectorDrawer.tsx`), 6. Automated E2E Verification (`frontend/e2e/test_phase11_decision_dna.cjs`), Goal, Phase 11 Plan 2 (11-02-PLAN.md): Frontend Decision DNA UI & E2E Verification (+3 more)

### Community 98 - "gemini_provider.py"
Cohesion: 0.11
Nodes (8): Settings, WorldCandidate, test_canonical_demo_fixtures_divergence_triad(), test_divergent_worlds_endpoints_lifecycle(), test_gemini_provider_fallback_divergence(), test_mock_provider_arbitrary_seed_with_potential(), test_database_url_formatting_for_supabase(), test_world_candidate_schema_validation()

### Community 99 - "project_repo.py"
Cohesion: 0.14
Nodes (8): api_error(), ErrorDetail, http_exception_handler(), lifespan(), build_engine(), get_session(), init_db(), test_supabase_engine_configuration()

### Community 100 - "Proposed Changes"
Cohesion: 0.22
Nodes (8): 2. Repository Layer (`backend/app/repositories/project_repo.py`), 3. AI Providers, 4. Router (`backend/app/routers/worlds.py`), Goal, Phase 10 Plan 1 (10-01-PLAN.md): Backend Divergent Worlds Engine, Proposed Changes, Requirements Addressed, Verification Criteria

### Community 101 - "2. Locked Decisions (Incorporating Plan Corrections)"
Cohesion: 0.25
Nodes (7): 1. Phase Objective & Tattva Alignment, 2. Locked Decisions (Incorporating Plan Corrections), D-01: Timeline Branching & Strict Child ID Remapping (PERS-02), D-02: Component Refinement & Immutable Revision History (PERS-01), D-03: Full Project State Export, Import & Snapshots (PERS-03), D-04: UI Architecture & Stage 7 Canvas, Phase 7: Refine, Branch & Save (Tattva 6: Parinamana & Dharana) - Context

### Community 102 - "Praroha Master Architecture: Tattva 2 & Idea 1"
Cohesion: 0.33
Nodes (5): 1. Conceptual Unfolding Pipeline, 2. Technical System Architecture, 3. Core Architectural Guarantees, Philosophical Foundation, Praroha Master Architecture: Tattva 2 & Idea 1

### Community 103 - "2. Key Accomplishments & Deliverables"
Cohesion: 0.20
Nodes (9): 1. Overview & Conceptual Architecture, 2. Key Accomplishments & Deliverables, 3. Verification & Testing, 4. Phase Completion Sign-Off, C. 7-Stage Guided Demo Tour Overlay, D. Global Keyboard Shortcuts & Cheatsheet Modal, E. Traceability DAG Zoom & View Controls, Phase 8: Polish / Reliability / Demo (DEMO-01, DEMO-02) — Summary (+1 more)

### Community 104 - "Proposed Changes"
Cohesion: 0.18
Nodes (10): 1. Types (`frontend/src/types/index.ts`), 2. Candidate Card (`frontend/src/components/WorldCandidateCard.tsx`), 3. Stage 3 Canvas (`frontend/src/components/WorldCandidatesCanvas.tsx`), 4. Stage 4 Selection Canvas (`frontend/src/components/WorldSelectionCanvas.tsx`), 5. Automated E2E Verification (`frontend/e2e/test_phase10_divergence.cjs`), Goal, Phase 10 Plan 2 (10-02-PLAN.md): Frontend Divergent Worlds UI & E2E Verification, Proposed Changes (+2 more)

### Community 105 - "conftest.py"
Cohesion: 0.32
Nodes (3): client(), event_loop(), initialize_test_db()

### Community 106 - "WorldSelectionRecord"
Cohesion: 0.09
Nodes (24): WorldSelectionBase, WorldSelectionRecord, 1. Backend Data Models (`backend/app/models/selection.py`), 2. Database & Repository (`backend/app/repositories/project_repo.py`), 3. API Endpoints (`backend/app/routers/selection.py`), 4. Frontend State & Canvas (`frontend/src/`), Technical Specifications, 1. Data Models (`backend/app/models/selection.py`) (+16 more)

### Community 108 - "project.py"
Cohesion: 0.39
Nodes (6): AssetBase, AssetCreate, AssetRead, get_utc_now(), ProjectBase, ProjectCreate

### Community 110 - "Phase 12 Plan 1 (12-01-PLAN.md): Backend Origin Ledger Engine"
Cohesion: 0.25
Nodes (7): 3. Causal Explainer & Lineage DAG Synthesis (`backend/app/services/lineage_service.py`), 4. Dedicated Pytest Test Suite (`backend/tests/test_origin_ledger.py`), Goal, Phase 12 Plan 1 (12-01-PLAN.md): Backend Origin Ledger Engine, Requirements Addressed, Technical Tasks, Verification

### Community 111 - "Implementation Decisions"
Cohesion: 0.29
Nodes (7): AI Provider Abstraction & Stub Provider, Frontend-Backend Communication & Monorepo Structure, Implementation Decisions, Initial State & Persistence Bootstrap, Object Storage & Asset Foundation, The Agent's Discretion, Workspace Layout & Shell Aesthetics

### Community 112 - "world.py"
Cohesion: 0.11
Nodes (13): DecisionDNA, get_utc_now(), WorldSelectionCreate, WorldSelectionRead, DivergenceArchetype, get_utc_now(), WorldCandidateRead, test_canonical_demo_decision_dna() (+5 more)

### Community 114 - "Phase 10: Divergent Worlds Engine — User Acceptance Testing (UAT) Report"
Cohesion: 0.25
Nodes (7): 1. Executive Summary, 2.2 Frontend Build & TypeScript Validation, 2.3 End-to-End Browser Automation (Playwright), 2. Test Execution Results, 3. Requirements Traceability Matrix, 4. Next Phase, Phase 10: Divergent Worlds Engine — User Acceptance Testing (UAT) Report

### Community 115 - "ref_assert"
Cohesion: 0.28
Nodes (6): assert, { chromium }, runPhase12E2E(), assert, { chromium }, runPhase9E2E()

### Community 116 - "Proposed Changes"
Cohesion: 0.22
Nodes (8): 2. Repository Layer (`backend/app/repositories/project_repo.py`), 3. AI Providers, 4. Router & Endpoints (`backend/app/routers/potential.py`), 5. Automated Tests (`backend/tests/test_potential.py`), Goal, Phase 9 Plan 1 (09-01-PLAN.md): Backend Seed Potential Map Service, Proposed Changes, Verification Criteria

### Community 118 - "test_potential.py"
Cohesion: 0.15
Nodes (15): BatchPotentialStatusUpdate, get_utc_now(), PotentialItemStatus, SeedPotentialCategory, SeedPotentialItemBase, SeedPotentialItemRead, SeedPotentialItemUpdate, SinglePotentialItemStatusUpdate (+7 more)

### Community 119 - "Key Topics & Alignment"
Cohesion: 0.40
Nodes (4): Discussion Summary, Key Topics & Alignment, Phase 3 Discussion Log: Three World Generation, Status

### Community 120 - "Technical Specifications"
Cohesion: 0.40
Nodes (5): 2. Provider Unfolding Extension (`backend/app/providers/`), 3. Database & Repository (`backend/app/repositories/project_repo.py`), 4. API Endpoints (`backend/app/routers/unfold.py`), 5. Frontend Canvas & State (`frontend/src/`), Technical Specifications

### Community 122 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, clsx, framer-motion, lucide-react, react, react-dom, tailwind-merge, zustand

### Community 123 - "Phase 7: Refine / Branch / Save (Tattva 6: Parinamana & Dharana) — Summary"
Cohesion: 0.25
Nodes (7): 1. Overview & Architecture, 2. Implementation Artifacts, 3. Verification Results, 4. Visual Artifacts, Core Architectural Guarantees, Frontend (`frontend/src/`), Phase 7: Refine / Branch / Save (Tattva 6: Parinamana & Dharana) — Summary

### Community 124 - "ExplorationProfile"
Cohesion: 0.24
Nodes (5): ExplorationProfile, WorldCandidateBase, test_exploration_profile_and_archetype_validation(), 1. Data Models (`backend/app/models/world.py`), Models (`backend/app/models/world.py`)

### Community 126 - "1. Existing Architecture Integration Points"
Cohesion: 0.25
Nodes (7): 1. Existing Architecture Integration Points, AI Provider Engine (`backend/app/providers/`), Frontend (`frontend/src/`), Metric Calibrations & Visual Palette, Phase 10 Research: Divergent Worlds Engine, Potential Bridges & Constraint Injection, Technical Analysis

### Community 127 - "Phase 11 Context: Decision DNA"
Cohesion: 0.33
Nodes (5): 1. Phase Goal, 2. Core Elements of Decision DNA, 3. Downstream Propagation & Integration (Stage 5 Bridge), 5. Out of Scope for Phase 11, Phase 11 Context: Decision DNA

### Community 128 - "export_project_bundle"
Cohesion: 0.29
Nodes (3): export_project_bundle(), get_project_revisions(), list_storage_snapshots()

### Community 131 - "asyncio"
Cohesion: 0.29
Nodes (3): test_ancestor_path_traversal_preserves_origins(), test_canonical_demo_seeding_origin_diversity(), test_database_schema_migration_backward_compatibility()

### Community 133 - "Phase 5 Research: Progressive World Unfolding"
Cohesion: 0.33
Nodes (5): 1. Domain & Architecture Analysis, 2. Reusable Assets & Integration Points, 3. Potential Hazards & Mitigations, Goal, Phase 5 Research: Progressive World Unfolding

### Community 134 - "Phase 12 Plan 2 (12-02-PLAN.md): Frontend Origin Ledger UI & E2E Suite"
Cohesion: 0.40
Nodes (4): Goal, Phase 12 Plan 2 (12-02-PLAN.md): Frontend Origin Ledger UI & E2E Suite, Requirements Addressed, Verification

### Community 135 - "test_phase10_divergence.cjs"
Cohesion: 0.67
Nodes (3): assert, { chromium }, runPhase10E2E()

### Community 136 - "test_phase11_decision_dna.cjs"
Cohesion: 0.67
Nodes (3): assert, { chromium }, runPhase11E2E()

### Community 137 - "test_phase3_worlds.cjs"
Cohesion: 0.67
Nodes (3): assert, { chromium }, runPhase3E2E()

### Community 138 - "test_phase4_selection.cjs"
Cohesion: 0.67
Nodes (3): assert, { chromium }, runPhase4E2E()

### Community 139 - "test_phase5_unfold.cjs"
Cohesion: 0.67
Nodes (3): assert, { chromium }, runPhase5E2E()

### Community 140 - "test_phase6_traceability.cjs"
Cohesion: 0.67
Nodes (3): assert, { chromium }, runPhase6E2E()

### Community 141 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

## Knowledge Gaps
- **546 isolated node(s):** `{ chromium }`, `path`, `{ chromium }`, `{ chromium }`, `{ chromium }` (+541 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 819 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProjectRepository` connect `ProjectRepository` to `LocalStorageProvider`, `select_world_candidate`, `unfold_universe`, `asyncio`, `get_node_ancestor_path`, `Phase 1: Foundation / Project Shell - Research`, `Phase 1: Foundation / Project Shell - Context`, `models/__init__.py`, `routers/persistence.py`, `LineageService`, `test_selection.py`, `What Was Built`, `Phase 1: Foundation / Project Shell - Discussion Log`, `Asset`, `test_unfold.py`, `StorageProvider`, `batch_update_potential_items`, `CharacterRecord`, `api_success`, `models/dna.py`, `.generate_worlds`, `PersistenceService`, `MockProvider`, `Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback`, `gemini_provider.py`, `project_repo.py`, `WorldSelectionRecord`, `project.py`, `Implementation Decisions`, `world.py`, `test_potential.py`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `MockProvider` connect `MockProvider` to `LocalStorageProvider`, `Context`, `Phase 1: Foundation / Project Shell - Research`, `What Was Built`, `Topics Discussed & Decisions Made`, `GeminiProvider`, `Discussion Topics & Agreed Decisions`, `Implementation Decisions`, `Asset`, `test_unfold.py`, `CharacterRecord`, `useWorkspaceStore`, `ProjectRepository`, `models/dna.py`, `.generate_worlds`, `AIProvider`, `Plan: Phase 8 Wave 1 — Backend Reliability, Fast Canonical Demo Seeding & Provider Fallback`, `Phase 8: Polish / Reliability / Demo — Research & Technical Spikes`, `Praroha: Comprehensive Judge Explanation`, `Praroha`, `test_providers.py`, `Phase 9 Context: Seed Potential Map`, `Praroha Judge Q&A Cheatsheet`, `2. Locked Implementation Decisions`, `gemini_provider.py`, `project_repo.py`, `Proposed Changes`, `WorldSelectionRecord`, `world.py`, `Phase 10: Divergent Worlds Engine — User Acceptance Testing (UAT) Report`, `Proposed Changes`, `test_potential.py`, `Key Topics & Alignment`, `1. Existing Architecture Integration Points`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `1. Test Automation Matrix` connect `useWorkspaceStore` to `api_success`, `GeminiProvider`, `Phase 8: Polish / Reliability / Demo - Validation Matrix`, `MockProvider`, `CharacterRecord`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 60 inferred relationships involving `ProjectRepository` (e.g. with `SeedDNA` and `SeedDNARecord`) actually correct?**
  _`ProjectRepository` has 60 INFERRED edges - model-reasoned connections that need verification._
- **Are the 38 inferred relationships involving `MockProvider` (e.g. with `GeminiProvider` and `ProjectRepository`) actually correct?**
  _`MockProvider` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Are the 27 inferred relationships involving `GeminiProvider` (e.g. with `SeedDNA` and `WorldCandidate`) actually correct?**
  _`GeminiProvider` has 27 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `PersistenceService` (e.g. with `branch_project()` and `create_storage_snapshot()`) actually correct?**
  _`PersistenceService` has 30 INFERRED edges - model-reasoned connections that need verification._