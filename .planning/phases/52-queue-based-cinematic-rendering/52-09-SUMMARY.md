# Phase 52 Wave 3 Summary: Render Outbox Database Migration (`TASK-52-09`)

**Phase**: 52 — Queue-Based Cinematic Rendering Architecture  
**Task**: `TASK-52-09`: Database Migration for `render_outbox` Table  
**Execution Timestamp**: 2026-10-23T04:35:00Z / 2026-10-23T10:05:00+05:30  
**Status**: Completed & Verified  

---

## 1. Overview & Architecture Conformance

As specified in `ADR-0052-QUEUE-DISPATCH-ARCHITECTURE.md` and `RELIABILITY_AND_OBSERVABILITY_PLAN.md`, `render_outbox` implements the Transactional Outbox pattern to eliminate dual-write hazards between PostgreSQL job creation and Azure Storage Queue dispatch.

- When a cinematic render request is received, the backend commits both the `generation_jobs` record (`status = 'queued'`) and the `render_outbox` record (`status = 'pending'`) in a single atomic database transaction.
- The outbox publisher publishes the job payload asynchronously. Upon confirmation from Azure Queue, the outbox record is marked `published`.
- If an interruption or transient failure occurs, a background sweeper scans pending outbox records and re-publishes with exponential backoff.

---

## 2. Table Schema & Column Specifications

The table is defined in `backend/app/models/outbox.py`, integrated programmatically in `backend/app/repositories/project_repo.py` (`_migrate_columns`), and scripted in `backend/migrations/0001_create_render_outbox.sql`:

| Column Name | Type (PostgreSQL) | Type (SQLite) | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | `VARCHAR` | `PRIMARY KEY` | UUID string identifying the outbox record |
| `project_id` | `VARCHAR(64)` | `VARCHAR` | `NOT NULL`, `REFERENCES projects(id) ON DELETE CASCADE` | Scoped project foreign key |
| `job_id` | `VARCHAR(64)` | `VARCHAR` | `NOT NULL`, `UNIQUE`, `REFERENCES generation_jobs(id) ON DELETE CASCADE` | 1-to-1 unique relationship with the generation job |
| `payload` | `JSONB` | `JSON` | `NOT NULL` | Canonical queue message payload conforming to `queue_message_schema.json` |
| `status` | `VARCHAR(20)` | `VARCHAR` | `NOT NULL DEFAULT 'pending'`, `CHECK (status IN ('pending', 'published', 'failed'))` | Publication lifecycle status |
| `attempt_count` | `INTEGER` | `INTEGER` | `NOT NULL DEFAULT 0` | Counter of dispatch attempts |
| `last_error` | `TEXT` | `TEXT` | `NULLABLE` | Sanitized diagnostic error string from most recent failed attempt |
| `claimed_at` | `TIMESTAMPTZ` | `TIMESTAMP` | `NULLABLE` | Sweeper lease claim timestamp |
| `published_at` | `TIMESTAMPTZ` | `TIMESTAMP` | `NULLABLE` | Timestamp when Azure Storage Queue accepted the message |
| `created_at` | `TIMESTAMPTZ` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Outbox record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Last update timestamp |

---

## 3. Indexes & Constraints

1. **`ix_render_outbox_project_id`**: Standard index on `project_id` for project-scoped queries and cascading lookups.
2. **`uq_render_outbox_job_id`**: Unique index on `job_id` enforcing that no render job can ever have more than one outbox entry.
3. **`idx_render_outbox_pending`**: Partial index on `(status, created_at) WHERE status = 'pending'` for efficient background sweeper polling without scanning published or failed rows.
4. **Status Check Constraint**: `CHECK (status IN ('pending', 'published', 'failed'))` enforced at the database level and via Pydantic model validation.

---

## 4. Credential & Secret Leakage Protection

`RenderOutbox` enforces strict payload validation via `assert_no_secrets_in_payload`:
- Any attempt to instantiate or insert an outbox record with credentials (`password`, `secret`, `token`, `credential`, `api_key`, `connection_string`, `database_url`, `sas`, `key`, `client_secret`, etc.) raises an immediate `ValueError`.
- Both top-level and nested structures (dicts, lists) are recursively inspected.

---

## 5. Verification & Test Evidence

A dedicated unit test suite was implemented in `backend/tests/test_render_outbox_migration.py`:

- **7 Dedicated Tests (100% Passed)**:
  1. `test_render_outbox_table_and_columns_exist`: Verified all 11 columns created by `init_db`.
  2. `test_render_outbox_indexes_exist`: Verified indexes created on `project_id`, `job_id`, and `pending`.
  3. `test_render_outbox_unique_job_id_constraint`: Verified duplicate `job_id` raises `IntegrityError`.
  4. `test_render_outbox_status_validation`: Verified status validator enforces `pending`, `published`, `failed`.
  5. `test_render_outbox_payload_secret_guard`: Verified all credential leak examples are blocked.
  6. `test_render_outbox_repository_crud`: Verified create, get by job ID, list pending, update to failed, and update to published via `ProjectRepository`.
  7. `test_sql_migration_file_integrity`: Verified SQL script syntax, comments, down rollback, and zero credentials.

- **Full Backend Test Suite Execution**:
  - `287 passed, 1 skipped in 31.84s` across all 43 backend test modules.
  - Zero regressions.

---

## 6. Production Application Guidance

**Current State**: In accordance with strict scope boundaries, this migration **has NOT been applied to the live Supabase production database**. The schema runs automatically on local SQLite test databases via `init_db()`.

### Production Deployment Command (Requires Explicit Operator Approval):
When authorized for production application in Phase 52 Wave 3 release gate:

```bash
# Option A: Via Supabase SQL Editor
# Paste and execute the contents of:
# backend/migrations/0001_create_render_outbox.sql

# Option B: Via psql CLI with Supabase connection string
psql "$DATABASE_URL" -f backend/migrations/0001_create_render_outbox.sql
```

### Rollback Command (If Needed):
```sql
DROP INDEX IF EXISTS idx_render_outbox_pending;
DROP INDEX IF EXISTS uq_render_outbox_job_id;
DROP INDEX IF EXISTS ix_render_outbox_project_id;
DROP TABLE IF EXISTS render_outbox;
```

---

## 7. Exact Next Task

The next task in `.planning/phases/52-queue-based-cinematic-rendering/52-01-PLAN.md` is:
- **`TASK-52-10`**: Update `CinematicDispatcherService` in `backend/app/services/cinematic_dispatcher.py` to write to `render_outbox` and dispatch to `cinematic-render-jobs` using the backend's scoped Add-only SAS credential.
