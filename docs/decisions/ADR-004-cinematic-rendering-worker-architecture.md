# ADR-004: Dedicated Cinematic Rendering Worker Architecture

## Status
Proposed (Milestone 7)

## Context
In Phase 46, PRAROHA evaluated programmatic video composition engines following the retirement of unreliable external video generation APIs. 
The empirical benchmark of the native FFmpeg composer demonstrated that a 12-second 720p H.264 MP4 can be rendered in **1.85 seconds** (750 KB file size), but generates a peak RSS memory footprint of **410.40 MB** and an 808% multi-threaded CPU burst.

PRAROHA's primary Azure Container Apps (ACA) web application runs at **0.5 vCPU and 1.0 GiB RAM**. Executing video rendering inside this primary web container creates a severe risk of Linux kernel Out-Of-Memory (`SIGKILL 137`) termination, which would drop active web requests and destabilize the user experience.

With approximately **₹8,711 in remaining Azure student credits** (valid through September 26, 2027), PRAROHA has sufficient compute credit to deploy a dedicated worker. However, this credit must be stewarded responsibly:
- Target test budget: **₹500 maximum**.
- Zero ongoing idle compute charges (must scale to zero).
- Maximum concurrency: 1 (for initial pilot).
- No new complex infrastructure dependencies (no Celery/RabbitMQ, Kafka, Redis, or external orchestration subscriptions).

## Evaluated Architectural Options

| Evaluation Dimension | Option A: Azure Container Apps Job (Recommended) | Option B: Separate Container App (minReplicas = 0) | Option C: Synchronous Background Task in Primary API | Option D: Dedicated Cloud VM (IaaS) |
| :--- | :--- | :--- | :--- | :--- |
| **Execution Model** | Run-to-completion container job (ephemeral lifecycle). | Always-ready HTTP microservice scaling to zero on idle. | `asyncio.create_task` or `BackgroundTasks` in main container. | Persistent Ubuntu VM (e.g. B1ms / B2s). |
| **Idle Billing** | **₹0.00 / hour** (scale to 0 immediately upon process exit). | **Cooldown Billing**: Remains at 1 replica for 5–15 min after request before scale-in. | Shared with primary container. | **Fixed Billing**: ₹1,200 – ₹2,500/month 24/7 regardless of usage. |
| **Process Overhead** | **Pure CLI / Script**: No web server, port listener, or routing layer inside container. | Requires web framework (FastAPI/Uvicorn) listening on port 8000. | Zero extra container, but shares Python process memory. | Full Linux OS maintenance, patching, systemd services. |
| **Concurrency & Limits** | **Native Enforced Concurrency**: Configured via `parallelism=1`, `replicaCompletionCount=1`. | Requires application-level semaphores or mutexes. | Difficult to clamp without blocking FastAPI event loop. | Requires local queue service. |
| **Timeout Protection** | **Hard Ceiling**: ACA Job terminates replica at configured `timeout_sec=120`. | Web client connection timeout; proxy cutoff risks. | Process hung if FFmpeg freezes. | Needs watchdog script. |
| **Image Size** | **Compact**: ~380 MB (`python:3.11-slim` + static ffmpeg). | ~450 MB (Python + Uvicorn + FFmpeg). | N/A (Already 250 MB). | Full OS disk image. |
| **OOM Blast Radius** | **Zero**: Worker container failure has 0 impact on primary API. | **Zero**: Isolated container failure. | **Catastrophic**: Kills entire web server and all active users. | **Zero**: Isolated VM failure. |
| **Orchestration Complexity** | **Low**: Triggered via Azure CLI (`az containerapp job start`) or Azure REST API. | **Medium**: Requires internal service-to-service auth and DNS. | **Zero**: In-memory task dispatch. | **High**: SSH keys, networking, monitoring agents. |

---

## Decision

We adopt **Option A: Azure Container Apps Job (On-Demand Execution)** with the **Native FFmpeg Composer** as the primary renderer.

### Key Architectural Tenets:
1. **Decoupled Job Lifecycle**: The rendering worker container contains no web server. It is packaged with Python 3.11-slim, static FFmpeg n8.0, and a CLI entrypoint (`backend/app/workers/cinematic_worker.py`).
2. **On-Demand Consumption**: The job is configured in the Azure Container Apps Consumption plan. It runs only when triggered and shuts down immediately upon output completion or failure.
3. **Database-Driven State Machine**: 
   - Primary FastAPI backend creates a `generation_jobs` record (`status="queued"`, `job_type="cinematic_preview"`).
   - Backend triggers the ACA Job via Azure REST API or Azure CLI with `--job-id <UUID>`.
   - Worker fetches spec from `generation_jobs`, retrieves assets from Supabase Storage, composes the MP4, uploads to `seed-unfold-assets`, updates `media_assets` and `generation_jobs` (`status="completed"`), and exits cleanly.
4. **Duplicate Prevention**: The existing `request_hash` mechanism (SHA-256 of `entity_id:modality:prompt_hash`) checks if a matching asset exists or is currently `processing` before dispatching a new job.
5. **Crash & Timeout Recovery**: 
   - ACA Job enforces a hard 120-second execution ceiling.
   - Any job lingering in `processing` past 180s is automatically caught by `ProjectRepository.recover_orphaned_jobs` and transitioned to `failed`.
6. **Honest Synthetic Labeling**: Outputs strictly enforce `is_synthetic: true` and `provider_label: "Cinematic Preview"`.
7. **HyperFrames Evaluation Gate**: HyperFrames is retained strictly as an optional second candidate (Phase 50) and will only be piloted if the native FFmpeg composer fails to meet essential motion graphics or styling criteria.

---

## Consequences

### Positive
- **100% Protection of Core Web App**: Primary FastAPI container stays lean (0.5 vCPU, 1.0 GiB) and completely insulated from media rendering spikes.
- **Minimal Azure Spend**: On-demand execution with zero idle cost. A 5-second native render costs ~₹0.0125, allowing hundreds of tests well under the ₹500 pilot budget.
- **Zero New Infrastructure Bloat**: Operates entirely using existing Supabase PostgreSQL (`generation_jobs`), Supabase Storage (`seed-unfold-assets`), and Azure Container Apps environment. No external message broker (RabbitMQ/Redis) required.
- **Deterministic & Fast**: Native FFmpeg renders in under 2 seconds for a 12s 720p clip.

### Negative / Trade-offs
- Azure Container Apps Jobs have a cold-start spin-up latency of ~2 to 5 seconds when triggered on-demand.
- Azure CLI or Azure Management REST API credentials must be securely held by the primary FastAPI container to trigger the job.
