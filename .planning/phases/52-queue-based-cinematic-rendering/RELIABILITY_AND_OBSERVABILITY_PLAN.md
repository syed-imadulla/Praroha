# Reliability, Fault Tolerance & Observability Plan: Phase 52

## 1. Reliability Topology & Dual-Environment Context

```
[Client / UI]
      │
      │ HTTP 202
      ▼
[FastAPI Web API: praroha-backend] ◄── Express Environment (env-tendersaathi)
      │
      ├──────────────────────┐
      │ DB Transaction       │ Enqueue via Secret / SAS
      ▼                      ▼
[PostgreSQL Database]   [Azure Storage Queue: cinematic-render-jobs]
(generation_jobs +            │
 render_outbox)               │ KEDA Event Trigger (queueLength >= 1)
                              ▼
                        [Container Apps Job: praroha-render-job] ◄── Standard Environment (env-praroha-render)
                              │
                              ├── 1. Atomic DB Claim (status = 'processing')
                              ├── 2. Native FFmpeg Composition in /tmp
                              ├── 3. Upload to Supabase Storage
                              ├── 4. Finalize DB (status = 'completed')
                              └── 5. Delete Message from Queue
```

---

## 2. Transactional Consistency: The Outbox Pattern

To eliminate the dual-write consistency hazard (where a database commit succeeds but network timeout prevents queue enqueue, or vice versa):

1. **Transactional Outbox Table (`render_outbox`)**:
   ```sql
   CREATE TABLE IF NOT EXISTS render_outbox (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       job_id UUID NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
       payload JSONB NOT NULL,
       status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, published, failed
       retry_count INT NOT NULL DEFAULT 0,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       published_at TIMESTAMPTZ
   );
   CREATE INDEX IF NOT EXISTS idx_render_outbox_pending ON render_outbox(status) WHERE status = 'pending';
   ```

2. **Atomic Dispatch Flow**:
   - Step A: In a single database transaction, the FastAPI backend inserts the `generation_jobs` record (`status = 'queued'`) and the `render_outbox` record (`status = 'pending'`).
   - Step B: Immediately after commit, the backend attempts to publish the message to Azure Storage Queue `cinematic-render-jobs`.
   - Step C: Upon successful enqueue, the outbox record is marked `status = 'published'`.
   - Step D: If Step B fails (e.g. transient Azure network hiccup), the background outbox sweeper on the backend picks up `'pending'` records and re-publishes with exponential backoff.

---

## 3. Atomic Worker Claims & Concurrency Control

When an ephemeral worker instance starts:
1. It reads the message from `cinematic-render-jobs` (which hides the message for 300 seconds).
2. It executes an atomic Compare-And-Swap (CAS) update against PostgreSQL:
   ```sql
   UPDATE generation_jobs
   SET status = 'processing',
       updated_at = NOW()
   WHERE id = :job_id
     AND status = 'queued'
   RETURNING id, status;
   ```
3. **If 0 rows returned**:
   - Another worker instance has already claimed this job, or the job was cancelled/completed.
   - The worker logs an informational skip and immediately deletes the message from the queue.
4. **If 1 row returned**:
   - The worker owns the execution lease. It proceeds to download stems, render via FFmpeg, upload to storage, mark `status = 'completed'`, and delete the message.

---

## 4. Failure Modes & Crash Recovery Matrix

| Failure Mode | Direct Impact | Recovery Mechanism | End State |
| :--- | :--- | :--- | :--- |
| **Primary API Restarts during Enqueue** | Message in `render_outbox` was committed but not yet sent to Azure Queue. | Primary API `lifespan` startup runs `recover_outbox()`. Background sweeper (every 30s) also sweeps `pending` outbox records. | Job reaches queue without loss; UI updates via polling. |
| **Primary API Restarts during Active Worker Render** | Backend container recycles while worker is running FFmpeg. | **Protected by Lease Contract**: Startup recovery checks `updated_at`. Active worker heartbeats ($< 90$s old) protect the job from premature failure. | Worker finishes rendering and updates DB without disruption. |
| **Worker OOM / Hard Crash during Render** | Worker container dies while running FFmpeg. Message remains invisible in queue. | Azure Storage Queue visibility timeout (300s) expires. Message reappears on queue. | KEDA triggers a fresh worker replica. Worker retries render. |
| **Repeated Failures (Corrupt Audio Stem)** | Render consistently fails 3 consecutive times. | Message `dequeue_count` reaches 4. Worker intercepts: moves message to `cinematic-render-poison`, marks job `failed`, and clears `request_hash = NULL`. | Poison message quarantined. Job marked failed with actionable creator error. Zero infinite loops. |
| **Transient Supabase Storage Upload Failure** | FFmpeg succeeds, but upload of final MP4 to Supabase fails due to network glitch. | Worker retries upload 3 times with exponential backoff (2s, 4s, 8s). If persistent, message is released for retry. | Temporary network partition recovered without user intervention. |
| **Stale Lease / Worker Hang ($> 90$s silence)** | Worker process hangs without crashing; no heartbeat sent for $> 90$s. | Background reaper detects `updated_at < NOW() - 90s`, marks job `failed`, and clears `request_hash = NULL`. | Creator can immediately retry by clicking "Try Again". |
| **Permanently Lost Queue Message** | Job stuck in `queued` for $> 15$ minutes with outbox `status == 'published'`. | Reaper detects stale queue item, marks job `failed`, and clears `request_hash = NULL`. | Immediate retry capability restored. |

---

## 5. Observability & Centralized Log Analytics

Both `praroha-backend` (in `env-tendersaathi`) and `praroha-render-job` (in `env-praroha-render`) output structured JSON logs to `workspace-rgtendersaathinzG6`.

### Key KQL Diagnostic Queries

#### 1. Track Worker Render Latency & Success Rate
```kusto
ContainerAppSystemLogs_CL
| where ContainerAppName_s == "praroha-render-job"
| project TimeGenerated, Message, Reason_s
| order by TimeGenerated desc
```

#### 2. Query Rendering Worker Application Logs
```kusto
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "praroha-render-job"
| project TimeGenerated, Log_s
| where Log_s has "render" or Log_s has "job_id"
| order by TimeGenerated desc
```

#### 3. Audit Poison Message Queue Backlog
```kusto
// Run via Azure CLI:
// az storage message peek --queue-name cinematic-render-poison --account-name stpraroharender --num-messages 10
```
