# Phase 9 Research: Seed Potential Map

## Technical Analysis

### Existing Architecture Integration Points
1. **Models**:
   - `backend/app/models/dna.py` currently has `SeedDNA` and `SeedDNARecord`.
   - We will create `backend/app/models/potential.py` containing:
     - `SeedPotentialCategory(str, Enum)`: `explicit`, `inferred`, `open`
     - `PotentialItemStatus(str, Enum)`: `pending`, `accepted`, `rejected`
     - `SeedPotentialItem(SQLModel)` schema: `id`, `project_id`, `label`, `category`, `confidence`, `source_evidence`, `user_status`, `created_at`
     - `SeedPotentialItemRecord(SQLModel, table=True)`: Table mapping with foreign key to `projects.id`.
     - `SeedPotentialResponse`: API payload format.
2. **Repository**:
   - `backend/app/repositories/project_repo.py`:
     - Method `save_potential_items(project_id, items)`.
     - Method `get_potential_items(project_id)`.
     - Method `update_potential_item_status(item_id, status)`.
3. **AI Provider**:
   - `backend/app/providers/base.py`:
     - Add `async def extract_potential(self, seed: str, dna: Dict[str, Any]) -> List[Dict[str, Any]]: ...`
   - `backend/app/providers/mock_provider.py`:
     - Provide rich canonical potential fixture for *"A child discovers a forgotten city beneath the ocean"*.
     - Fallback generator for arbitrary seeds extracting keywords from seed and DNA.
   - `backend/app/providers/gemini_provider.py`:
     - Call Gemini with structured JSON schema (`responseSchema`) enforcing an array of objects with `label`, `category`, `confidence`, `source_evidence`.
4. **Router**:
   - `backend/app/routers/potential.py`:
     - Mount under `/api/projects/{id}/potential`.
   - Register in `backend/app/main.py`.
5. **Frontend**:
   - Store: `frontend/src/store/workspaceStore.ts`:
     - State `potentialItems: SeedPotentialItem[]`.
     - Actions: `fetchPotentialItems(projectId)`, `extractPotentialItems(projectId)`, `updatePotentialItemStatus(itemId, status)`.
   - Components:
     - `SeedPotentialCanvas.tsx`: Multi-lane cards with accept/reject badges.
     - Integration in `App.tsx` / `WorkspaceCanvas.tsx`.

---

## Canonical Demo Fixture for Seed Potential Map

For Seed: *"A child discovers a forgotten city beneath the ocean."*

### Explicit Elements
- **Child Protagonist** (`confidence`: 1.0, `evidence`: "A child")
- **Discovery Event** (`confidence`: 1.0, `evidence`: "discovers")
- **Sunken Metropolis** (`confidence`: 1.0, `evidence`: "forgotten city")
- **Abyssal Marine Environment** (`confidence`: 1.0, `evidence`: "beneath the ocean")

### AI-Inferred Possibilities
- **Ancient Symbiotic Technology** (`confidence`: 0.88, `evidence`: "forgotten city + ocean depth suggests bio-tech survival")
- **Surface Ecological Rupture** (`confidence`: 0.75, `evidence`: "forgotten indicates isolation from surface world")
- **Sentient Deep-Sea Ecosystem** (`confidence`: 0.82, `evidence`: "abyssal fauna interacting with ruins")
- **Archaeological Scavenger Conflict** (`confidence`: 0.70, `evidence`: "value of forgotten knowledge")

### Open Questions
- **Who inhabited the city before its submersion?** (`evidence`: "forgotten city")
- **What preserves the city from catastrophic deep-sea pressure?** (`evidence`: "beneath the ocean")
- **Was the abandonment accidental or deliberate evacuation?** (`evidence`: "forgotten")
