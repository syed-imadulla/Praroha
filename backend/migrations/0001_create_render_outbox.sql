-- PRAROHA Phase 52: Queue-Based Cinematic Rendering Architecture
-- Migration: 0001_create_render_outbox.sql
-- Target Database: Supabase PostgreSQL (Production)
-- Purpose: Create render_outbox table for transactional outbox dispatch to Azure Storage Queues (TASK-52-09)
-- Preconditions: projects and generation_jobs tables must exist.
-- Safety: Non-destructive, idempotent (IF NOT EXISTS), fully reversible (see DOWN section).
-- Required Authorization: Apply to production database ONLY with explicit user approval during Phase 52 Wave 3 release gate.

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS render_outbox (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    job_id VARCHAR(64) NOT NULL UNIQUE REFERENCES generation_jobs(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    claimed_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for project queries and cascading lookups
CREATE INDEX IF NOT EXISTS ix_render_outbox_project_id 
    ON render_outbox (project_id);

-- Unique index for job lookup and 1-to-1 render job to outbox record invariant
CREATE UNIQUE INDEX IF NOT EXISTS uq_render_outbox_job_id 
    ON render_outbox (job_id);

-- High-performance partial index for pending outbox dispatch sweeps
CREATE INDEX IF NOT EXISTS idx_render_outbox_pending 
    ON render_outbox (status, created_at) 
    WHERE status = 'pending';

-- Column and Table Documentation
COMMENT ON TABLE render_outbox IS 
    'Transactional outbox table for reliable asynchronous queue dispatch to Azure Storage Queues (Phase 52)';
COMMENT ON COLUMN render_outbox.id IS 
    'Unique identifier (UUID string) for outbox record';
COMMENT ON COLUMN render_outbox.project_id IS 
    'Scoped project identifier referencing projects(id)';
COMMENT ON COLUMN render_outbox.job_id IS 
    'Unique reference to generation_jobs(id) representing the cinematic render request';
COMMENT ON COLUMN render_outbox.payload IS 
    'Canonical queue message JSON payload conforming strictly to queue_message_schema.json (zero credentials)';
COMMENT ON COLUMN render_outbox.status IS 
    'Outbox publication status: pending, published, failed';
COMMENT ON COLUMN render_outbox.attempt_count IS 
    'Number of dispatch attempts made by the outbox publisher';
COMMENT ON COLUMN render_outbox.last_error IS 
    'Sanitized diagnostic message from the most recent failed dispatch attempt';
COMMENT ON COLUMN render_outbox.claimed_at IS 
    'Timestamp when the record was claimed by a background sweeper execution';
COMMENT ON COLUMN render_outbox.published_at IS 
    'Timestamp when the message was successfully accepted into Azure Storage Queue';

-- ============================================================================
-- DOWN MIGRATION (ROLLBACK)
-- ============================================================================
-- To roll back this migration in the event of an operational issue:
--
-- DROP INDEX IF EXISTS idx_render_outbox_pending;
-- DROP INDEX IF EXISTS uq_render_outbox_job_id;
-- DROP INDEX IF EXISTS ix_render_outbox_project_id;
-- DROP TABLE IF EXISTS render_outbox;
