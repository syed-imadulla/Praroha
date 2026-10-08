# Phase 31.5: Project Routing & Authoritative Rehydration

## Goal
Make PRAROHA projects genuinely persistent, directly accessible, and authoritatively rehydrated from PostgreSQL via URL routing.

## 1. Backend: Authoritative Rehydration Endpoint
- **File:** `backend/app/routers/projects.py`
- **Action:** Add `GET /api/projects/{project_id}/bundle` endpoint.
- **Action:** Implement fetching project, seed DNA, seed potential, world candidates, world selection, world bible, characters, relationships, scenes, media assets, and active generation jobs.
- **File:** `backend/app/models/unfolded_universe.py`
- **Action:** Define `UnfoldedUniverseRead` structure matching frontend `UnfoldedUniverseRead` to return all components in the bundle.
- **File:** `backend/app/repositories/project_repo.py`
- **Action:** Implement `get_project_bundle(project_id)`.

## 2. Frontend: Deep Project Routing
- **File:** `frontend/src/App.tsx` or `frontend/src/AppShell.tsx`
- **Action:** Add React Router (or simple path matching) for `/projects/:projectId`.
- **Action:** If URL is `/`, load library/home.
- **Action:** Handle direct navigation to `/projects/:projectId`.

## 3. Frontend: Authoritative Project Rehydration
- **File:** `frontend/src/api/client.ts`
- **Action:** Add `getProjectBundle(projectId)` method.
- **File:** `frontend/src/store/workspaceStore.ts`
- **Action:** Add `hydrateProject(bundle)` action. This completely resets the workspace to the bundle contents.
- **Action:** When navigating to `/projects/:projectId`, call `getProjectBundle(projectId)`, hydrate the store, set `activeProject`, and THEN connect Realtime via `projectSubscription.ts`.
- **Action:** Disconnect previous Realtime connection when switching projects.

## 4. Frontend: Project Library (CRUD)
- **File:** `frontend/src/components/MyCreations.tsx` (or similar library component)
- **Action:** Fetch `/api/projects` to list real projects.
- **Action:** Connect "Create" button to `POST /api/projects`, then redirect to `/projects/:newProjectId`.
- **Action:** Connect "Open" button to navigate to `/projects/:projectId`.
- **Action:** Implement "Rename" and "Delete" using existing backend endpoints.

## 5. Security & UI State
- **File:** `frontend/src/App.tsx` or routing logic
- **Action:** Render "Project not found" state.
- **Action:** Render "Loading your project..." state.
- **Action:** Adhere to simple, visual, non-technical UI guidelines.

## 6. Testing
- **Backend:** Update `backend/tests/` to verify `/api/projects/{id}/bundle`.
- **Frontend E2E:** Add `frontend/e2e/test_phase31_5.cjs` performing direct URL load, refresh, isolation, and new browser context tests.
