# Phase 51 Context: Production Dispatch, UI Enablement & Release Gate

## 1. Production Enablement Scope
- Following successful pilot testing in Phase 49 and the renderer decision gate in Phase 50, Phase 51 connects the on-demand worker to the live PRAROHA product.
- **FastAPI Dispatch**: Implement non-blocking endpoint (`/api/media/cinematic-preview/jobs`) in the primary API that queues the job and triggers the ACA Job without executing rendering code in the web process.
- **Frontend UI Enablement**: Transition video preview cards from disabled/offline states to interactive generation buttons with honest `Cinematic Preview` badges and tooltips.
- **Realtime / Polling Updates**: Propagate status updates via Supabase Realtime or lightweight job polling.
- **Milestone 7 Release Gate**: Complete end-to-end acceptance testing across arbitrary worlds and certify production readiness.
