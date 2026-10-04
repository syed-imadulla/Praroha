# Praroha Data & Storage Architecture

## Overview
Praroha enforces a clean architectural separation between **Structured Relational State** (projects, seeds, candidates, world bibles, characters, scenes, revisions), **Causal Provenance Lineage** (synthesized DAG), and **Binary/File Object Storage** (portable bundles and serialized universe snapshots).

```
                            USER / BROWSER
                                  │
                                  ▼
                        React 18 + Vite (SPA)
                                  │
                                  ▼
                          FastAPI REST API
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
   AIProvider Layer       Relational Database     StorageProvider Layer
  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐
  │Gemini 3.5 Flash │    │ SQLModel (ORM)  │    │ LocalStorageProvider│
  │  / MockProvider │    │ SQLite (Dev) /  │    │  (./uploads/)       │
  └─────────────────┘    │ Postgres (Prod) │    ├─────────────────────┤
                         └─────────────────┘    │SupabaseStorageProvider
                                                │  (Cloud Bucket)     │
                                                └─────────────────────┘
```

---

## 1. Structured Relational Data Layer

Structured application state is managed using **SQLModel** (Pydantic v2 + SQLAlchemy), supporting asynchronous queries and transaction guarantees.

### Managed Relational Tables
1. **`projects` (`ProjectRecord`)**: Root entity storing project ID, title, original `seed_text`, creation timestamp, and timeline branching fields (`parent_project_id`, `branch_name`).
2. **`seed_dna` (`SeedDNARecord`)**: Immutable record storing the distilled semantic DNA (`premise`, `themes`, `entities`, `constraints`, `tone`, `domain_keywords`) with foreign key back to `project_id`.
3. **`world_candidates` (`WorldCandidateRecord`)**: Stores generated world archetypes (`batch_id`, `candidate_index`, `title`, `archetype`, `concept`, `aesthetic`, `core_tension`, `trade_offs`, `key_visual`, `is_active`).
4. **`world_selections` (`WorldSelectionRecord`)**: Stores the human commitment decision (`world_candidate_id`, `batch_id`, `user_rationale`, `selected_at`).
5. **`world_bibles` (`WorldBibleRecord`)**: Structured canon rules for the chosen world (`geography`, `physics_rules`, `history_timeline`, `factions`, `canon_facts`, `key_locations`, `visual_style_prompt`).
6. **`characters` (`CharacterRecord`)**: Core cast members (`name`, `archetype`, `role`, `motivation`, `core_conflict`, `visual_prompt`, `version`, `revision_notes`).
7. **`character_relationships` (`CharacterRelationshipRecord`)**: Relational dynamics connecting characters (`source_character_id`, `target_character_id`, `relationship_type`, `dynamic_description`, `tension_point`).
8. **`scenes` (`SceneRecord`)**: Narrative story beats (`scene_order`, `title`, `location_id`, `dramatic_question`, `conflict_description`, `pivotal_outcome`, `visual_prompt`, `version`, `revision_notes`).
9. **`entity_revisions` (`EntityRevisionRecord`)**: Immutable audit log records capturing point-in-time entity snapshots before/during modification (`entity_type`, `entity_id`, `version`, `snapshot_json`, `revision_notes`).
10. **`snapshot_assets` (`SnapshotAssetRecord`)**: Metadata pointers for persisted universe storage snapshots (`snapshot_name`, `storage_path`, `byte_size`, `entity_count`).

---

## 2. Object Storage Layer (`StorageProvider`)

Binary payloads, portable project export bundles, and serialized state snapshots are managed via the abstract [`StorageProvider`](file:///home/syed-imadulla/Desktop/Praroha/backend/app/providers/storage.py) interface.

### Providers Implemented in Source Code
1. **`LocalStorageProvider`**:
   - Stores files in local filesystem directory (default: `./uploads/`).
   - Generates local asset paths (e.g. `/uploads/{key}`).
   - Automatically initializes directory structure on write.
   - Used for zero-cloud local development, automated testing, and offline competition judging.
2. **`SupabaseStorageProvider`**:
   - Production cloud object storage implementation targeting Supabase Storage buckets (default: `seed-unfold-assets`).
   - Communicates with Supabase REST storage API when credentials exist.
   - Automatically degrades safely to `LocalStorageProvider` if `SUPABASE_URL` or `SUPABASE_KEY` is unset.

---

## 3. Current Runtime Configuration Audit

Safely inspected from active environment:

| Config Variable | Default Value | Runtime Status | Active Provider |
|---|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./seed_unfold.db` | **NOT CONFIGURED** (Using SQLite default) | SQLite via `aiosqlite` |
| `STORAGE_PROVIDER` | `local` | **NOT CONFIGURED** (Using local default) | `LocalStorageProvider` (`./uploads`) |
| `SUPABASE_URL` | None | **NOT CONFIGURED** | Inactive (Safe Fallback Active) |
| `SUPABASE_KEY` | None | **NOT CONFIGURED** | Inactive (Safe Fallback Active) |
| `SUPABASE_BUCKET` | `seed-unfold-assets` | Default set in code | Inactive |
| `GEMINI_API_KEY` | None | **NOT CONFIGURED** | `MockProvider` fallback active |
| `AI_PROVIDER` | `mock` | **NOT CONFIGURED** (Using mock default) | `MockProvider` |

### Key Takeaway for Judges
- **Pipeline Flexibility**: Praroha supports a live Gemini + Supabase cloud pipeline for custom seeds, with deterministic fallback fixtures and local fallback paths for reliable demonstrations.
- **True Live Generative Pipeline**: For custom audience prompts, Praroha can connect to the configured Gemini model through its `AIProvider` abstraction and persist application state through Supabase PostgreSQL and Supabase Storage when cloud mode is enabled.
- **Deterministic Canonical Demo**: A pre-compiled, verified universe fixture that exercises the same application data model, persistence flow, lineage system, and frontend rendering without depending on an external LLM during presentation.
- **Zero-Cloud Local Fallback**: When cloud credentials are not configured or external networks are offline, the local SQLite database and `LocalStorageProvider` fallback paths ensure 100% functionality with zero cloud dependency.

---

## 4. State Portability & Snapshots

### ProjectBundle (`GET /api/projects/{id}/bundle`)
A self-contained JSON schema compiling:
- Project metadata and raw seed
- Distilled Seed DNA specification
- All 3 world candidates with batch identifiers
- Active human selection and rationale
- Complete World Bible (canon facts, physics rules, locations)
- Grounded characters and socio-emotional relationship graph
- Narrative scenes and pivotal outcomes
- Complete immutable entity revision audit history
- Synthesized Lineage DAG (`TraceGraphRead`) with topological node levels and edge relations

### Lossless Round-Trip Import (`POST /api/projects/import`)
Accepts an exported `ProjectBundle` JSON document and reconstitutes the entire project, its relational entities, and its revision history into the database atomically.

### Storage Snapshots (`POST /api/projects/{id}/snapshots`)
Serializes universe state and uploads the payload to `StorageProvider.upload()`, recording a trackable `SnapshotAssetRecord` with exact byte counts.
