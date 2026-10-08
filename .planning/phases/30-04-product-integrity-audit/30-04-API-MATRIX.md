# 30-04-API-MATRIX.md: Comprehensive Frontend ↔ Backend Contract Audit Matrix

**Audit Date:** 2026-10-08  
**Scope:** PRAROHA (Seed Unfold) — Full API Surface & Persistence Contract  
**Environment:** Linux / FastAPI (Uvicorn 8000) / Vite React (5173) / Supabase Postgres & Storage  
**Methodology:** Direct inspection of FastAPI router definitions, OpenAPI 3.1 schema, `frontend/src/api/client.ts`, Zustand `workspaceStore.ts`, React component call sites, and database query executions.

---

## 1. Complete API Surface Matrix

The backend exposes **36 distinct HTTP endpoints**. The frontend API client defines **38 wrapper methods**. The table below catalogs every endpoint, its HTTP method, frontend caller, backend handler, backing database table or external provider, and its audited functional integrity status.

| # | HTTP Method | Endpoint Path | Frontend Client Method | Calling Component / Store Action | Backing Service / DB Table | Audited Status | Integrity & Persistence Findings |
|---|-------------|---------------|------------------------|----------------------------------|----------------------------|----------------|----------------------------------|
| 1 | `GET` | `/api/health` | `apiClient.getHealth()` | `App.tsx` (10s polling interval) | Health Service / System | **FUNCTIONAL (REAL)** | Queries Gemini & Supabase health live. Returns configured provider status. |
| 2 | `GET` | `/api/media/providers/health` | `apiClient.getMediaProvidersHealth()` | `MediaPreviewCard.tsx`, Store | `MediaProviderFactory` | **FUNCTIONAL (REAL)** | Reports health of 4 composite modalities (Image, Voice, Video, Audio). |
| 3 | `GET` | `/api/projects` | `apiClient.listProjects()` | **NONE (0 callers)** | `ProjectRepository` (`projects`) | **ORPHANED ENDPOINT** | Backend fully implements project listing, but frontend has no Project Library/Switcher UI calling this. |
| 4 | `POST` | `/api/projects` | `apiClient.createProject()` | `workspaceStore.extractSeedDNA()` | `projects` | **FUNCTIONAL (REAL)** | Creates real project in Supabase Postgres. Stores `title` and `seed_text`. |
| 5 | `POST` | `/api/projects/canonical-demo` | `apiClient.createCanonicalDemoProject()` | `workspaceStore.loadCanonicalDemoUniverse()` | `projects`, `seed_dna`, `world_bibles`, `characters`, `scenes` | **FUNCTIONAL (DEMO)** | Seeds database with full canonical demo fixtures atomically. |
| 6 | `POST` | `/api/projects/import` | `apiClient.importProjectBundle()` | `TopBar.tsx` (import bundle button) | `ProjectRepository` (multi-table) | **FUNCTIONAL (REAL)** | Validates JSON bundle and re-hydrates all project entities in DB. |
| 7 | `GET` | `/api/projects/{id}` | `apiClient.getProject()` | `workspaceStore.fetchActiveProject()` | `projects` | **FUNCTIONAL (REAL)** | Returns project record, status, and metadata. |
| 8 | `POST` | `/api/projects/{id}/branch` | `apiClient.branchProject()` | `TopBar.tsx`, `workspaceStore.branchProjectAction()` | `projects` (cloned), `entity_revisions` | **FUNCTIONAL (REAL)** | Creates isolated project branch with copy-on-write semantics. |
| 9 | `GET` | `/api/projects/{id}/branches` | `apiClient.listBranches()` | `TopBar.tsx`, `workspaceStore.fetchBranches()` | `projects` (where `parent_project_id = id`) | **FUNCTIONAL (REAL)** | Returns branch tree records. |
| 10 | `GET` | `/api/projects/{id}/bundle` | `apiClient.getProjectBundle()` | `TopBar.tsx` (export bundle button) | `ProjectRepository` (multi-table JSON) | **FUNCTIONAL (REAL)** | Serializes full universe, DNA, lineage, revisions to downloadable JSON. |
| 11 | `PATCH` | `/api/projects/{id}/characters/{cid}/refine` | `apiClient.refineCharacter()` | `RefinementModal.tsx`, `workspaceStore.refineCharacterAction()` | `characters`, `entity_revisions` | **FUNCTIONAL (REAL)** | Updates character record, increments version, logs revision diff. |
| 12 | `GET` | `/api/projects/{id}/counterfactual/candidates` | `apiClient.getCounterfactualCandidates()` | `CounterfactualReplayCanvas.tsx` | `world_candidates` | **FUNCTIONAL (REAL)** | Fetches unselected world candidates for divergence analysis. |
| 13 | `GET` | `/api/projects/{id}/counterfactual/delta/{cid}` | `apiClient.getCounterfactualDelta()` | `CounterfactualReplayCanvas.tsx` | `CounterfactualService` | **FUNCTIONAL (REAL)** | Calculates causal delta, divergence score, and narrative trade-offs. |
| 14 | `POST` | `/api/projects/{id}/counterfactual/fork` | `apiClient.forkCounterfactualBranch()` | `CounterfactualReplayCanvas.tsx` | `projects`, `world_selections` | **FUNCTIONAL (REAL)** | Forks universe branch grounded in alternative candidate. |
| 15 | `GET` | `/api/projects/{id}/dna` | `apiClient.getLatestDNA()` | `workspaceStore.fetchSeedDNA()` | `seed_dna` | **FUNCTIONAL (REAL)** | Retrieves latest persisted Seed DNA record from Postgres. |
| 16 | `POST` | `/api/projects/{id}/dna/extract` | `apiClient.extractDNA()` | `workspaceStore.extractSeedDNA()` | `seed_dna`, `GeminiProvider` | **CRITICAL COMPROMISE** | Gemini model (`gemini-3.5-flash`) fails (429/404); silently falls back to MockProvider, returning Canonical Ocean City DNA for ALL user seeds. |
| 17 | `GET` | `/api/projects/{id}/lineage` | `apiClient.getProjectLineage()` | `TraceabilityCanvas.tsx`, `workspaceStore.fetchLineage()` | `LineageService` (synthesized from DB) | **FUNCTIONAL (REAL)** | Dynamically synthesizes DAG nodes and edges from all DB records. |
| 18 | `GET` | `/api/projects/{id}/lineage/node/{nid}/ancestors` | `apiClient.getNodeAncestors()` | **NONE (0 callers)** | `LineageService` | **ORPHANED ENDPOINT** | Traced locally in `TraceabilityCanvas.tsx` via in-memory DAG traversal instead of calling backend. |
| 19 | `GET` | `/api/projects/{id}/media/assets` | `apiClient.getMediaAssets()` | `EntityMediaSection.tsx`, `workspaceStore.fetchEntityMedia()` | `media_assets` | **FUNCTIONAL (REAL)** | Queries Supabase Postgres for media records filtered by project/entity. |
| 20 | `POST` | `/api/projects/{id}/media/generate` | `apiClient.generateMedia()` | `EntityMediaSection.tsx`, `UniverseCodexCanvas.tsx` | `MediaService`, `media_assets` | **FUNCTIONAL (REAL)** | Dispatches background task; validates schema (`world`, `character`, `location`, `scene`). |
| 21 | `GET` | `/api/projects/{id}/media/jobs/{jid}` | `apiClient.getMediaJob()` | `workspaceStore.generateMediaAction()` | `media_assets` | **FUNCTIONAL (REAL)** | Polled every 600ms up to 40 times by frontend until `completed`/`failed`. |
| 22 | `POST` | `/api/projects/{id}/mutation/fork` | `apiClient.forkMutatedUniverse()` | `SeedMutationLabCanvas.tsx` | `projects`, `world_bibles`, `entity_revisions` | **FUNCTIONAL (REAL)** | Clones project with mutated premise into isolated timeline branch. |
| 23 | `POST` | `/api/projects/{id}/mutation/simulate` | `apiClient.simulateMutation()` | `SeedMutationLabCanvas.tsx` | `MutationService` | **FUNCTIONAL (HYBRID)** | Simulates impact across entities. Heuristic rules biased toward Ocean City lore. |
| 24 | `GET` | `/api/projects/{id}/mutation/variables` | `apiClient.getPremiseVariables()` | `SeedMutationLabCanvas.tsx` | `MutationService` | **FUNCTIONAL (REAL)** | Extracts 4 premise variables from persisted Seed DNA & World Bible. |
| 25 | `GET` | `/api/projects/{id}/potential` | `apiClient.getPotential()` | `SeedPotentialCanvas.tsx` | `seed_potential_items` | **FUNCTIONAL (REAL)** | Retrieves explicit/inferred/open items from Postgres. |
| 26 | `POST` | `/api/projects/{id}/potential/batch` | `apiClient.batchUpdatePotentialItems()` | `SeedPotentialCanvas.tsx` (Accept All) | `seed_potential_items` | **FUNCTIONAL (REAL)** | Atomic batch update of potential item statuses (`accepted`/`rejected`). |
| 27 | `POST` | `/api/projects/{id}/potential/extract` | `apiClient.extractPotential()` | `SeedPotentialCanvas.tsx` | `seed_potential_items` | **FUNCTIONAL (MOCK FALLBACK)** | Gemini extraction fails; falls back to mock keyword parsing. Persists to DB. |
| 28 | `PATCH` | `/api/projects/{id}/potential/{iid}` | `apiClient.updatePotentialItem()` | `SeedPotentialCanvas.tsx` (individual toggle) | `seed_potential_items` | **FUNCTIONAL (REAL)** | Updates single potential item status in Postgres. |
| 29 | `GET` | `/api/projects/{id}/revisions` | `apiClient.listRevisions()` | `RefineCanvas.tsx`, `InspectorDrawer.tsx` | `entity_revisions` | **FUNCTIONAL (REAL)** | Returns audit log of all character/scene prompt and field revisions. |
| 30 | `PATCH` | `/api/projects/{id}/scenes/{sid}/refine` | `apiClient.refineScene()` | `RefinementModal.tsx`, `workspaceStore.refineSceneAction()` | `scenes`, `entity_revisions` | **FUNCTIONAL (REAL)** | Updates scene record, increments version, logs revision diff. |
| 31 | `GET` | `/api/projects/{id}/selection` | `apiClient.getActiveSelection()` | `App.tsx`, `InspectorDrawer.tsx`, `workspaceStore` | `world_selections` | **FUNCTIONAL (REAL)** | Retrieves active world selection and Decision DNA contract. |
| 32 | `POST` | `/api/projects/{id}/snapshots` | `apiClient.createSnapshot()` | `RefineCanvas.tsx`, `workspaceStore.createSnapshotAction()` | `assets` (snapshot metadata) | **FUNCTIONAL (REAL)** | Saves point-in-time universe snapshot to database. |
| 33 | `GET` | `/api/projects/{id}/snapshots` | `apiClient.listSnapshots()` | `RefineCanvas.tsx`, `workspaceStore.fetchSnapshots()` | `assets` | **FUNCTIONAL (REAL)** | Lists all created snapshots for project. |
| 34 | `POST` | `/api/projects/{id}/unfold` | `apiClient.unfoldUniverse()` | `workspaceStore.unfoldUniverseAction()` | `world_bibles`, `characters`, `scenes`, `character_relationships` | **FUNCTIONAL (REAL DB / MOCK AI)** | Gemini fails or bypasses; writes full 4-layer codex to Postgres. |
| 35 | `GET` | `/api/projects/{id}/unfolded` | `apiClient.getUnfoldedUniverse()` | `App.tsx`, `workspaceStore.fetchUnfoldedUniverse()` | `world_bibles`, `characters`, `scenes`, `character_relationships` | **FUNCTIONAL (REAL)** | Reads complete 4-layer universe codex from Postgres. |
| 36 | `GET` | `/api/projects/{id}/worlds` | `apiClient.getLatestWorlds()` | `workspaceStore.fetchWorlds()` | `world_candidates` | **FUNCTIONAL (REAL)** | Fetches latest batch of 3 world candidates from Postgres. |
| 37 | `POST` | `/api/projects/{id}/worlds/generate` | `apiClient.generateWorlds()` | `workspaceStore.generateWorldsAction()` | `world_candidates` | **FUNCTIONAL (MOCK FALLBACK)** | Generates exactly 3 candidates. Grounded in DNA (which defaulted to ocean). |
| 38 | `POST` | `/api/projects/{id}/worlds/{cid}/select` | `apiClient.selectWorld()` | `WorldSelectionCanvas.tsx`, `workspaceStore.selectWorldCandidateAction()` | `world_selections`, `projects` | **FUNCTIONAL (REAL)** | Enforces Human Gate; captures rationale, priorities, rejected paths, and HOZ. |

---

## 2. API Contract Anomaly Analysis

### Anomaly 1: Dual Envelope `fallback_used` Collision
- **Observed Behavior:** In `POST /api/projects/{id}/dna/extract`:
  ```json
  {
    "success": true,
    "data": {
      "raw_seed": "...",
      "dna": { ... },
      "fallback_used": true,
      "model_used": "gemini-3.5-flash-mock-fallback"
    },
    "error": null,
    "fallback_used": false,
    "warning": null
  }
  ```
- **Root Cause:** The outer FastAPI response utility `api_success()` defaults `fallback_used=False`. The inner payload in `data` has `fallback_used=True`.
- **Impact:** Frontend checks `res.data.fallback_used` in some places and top-level `res.fallback_used` in others, creating inconsistent fallback status indicators.

### Anomaly 2: Orphaned Backend Endpoints
- `GET /api/projects`: Completely implemented on backend with pagination and sorting, but **0 call sites** in the frontend. There is no project switcher, history modal, or multi-project drawer. Users cannot return to previously created projects unless they have the UUID in localStorage.
- `GET /api/projects/{id}/lineage/node/{nid}/ancestors`: Fully implemented recursive ancestor traversal endpoint on backend, but **0 call sites** in frontend. `TraceabilityCanvas.tsx` performs its own local in-memory graph traversal.

### Anomaly 3: Entity Type Validation Mismatch
- `POST /api/projects/{id}/media/generate` requires `entity_type: Literal['world', 'character', 'location', 'scene']`.
- Lineage DAG nodes use `key_location`. If a frontend component passes DAG node entity types directly to media generation, FastAPI returns `HTTP 422 Unprocessable Entity` ("Input should be 'world', 'character', 'location' or 'scene'").
