# Phase 10 Research: Divergent Worlds Engine

## Technical Analysis

### 1. Existing Architecture Integration Points

#### Models (`backend/app/models/world.py`)
- Currently defines `WorldCandidate`, `WorldCandidateBase`, `WorldCandidateRecord`, `WorldCandidateRead`.
- Extension requirements:
  - `DivergenceArchetype(str, Enum)`:
    - `familiar = "familiar"`
    - `radical = "radical"`
    - `inverse = "inverse"`
  - `ExplorationProfile(BaseModel)`:
    - `seed_fidelity: int` (0–100, default 80)
    - `novelty: int` (0–100, default 70)
    - `conceptual_distance: int` (0–100, default 50)
    - `feasibility: int` (0–100, default 80)
    - `summary: str` (default "Balanced exploration profile")
  - Add fields to `WorldCandidate`:
    - `divergence_archetype: DivergenceArchetype = DivergenceArchetype.familiar`
    - `exploration_profile: ExplorationProfile = PydanticField(default_factory=ExplorationProfile)`
    - `emphasized_potential_labels: List[str] = PydanticField(default_factory=list)`
  - Add fields to `WorldCandidateBase`:
    - `divergence_archetype: str = Field(default="familiar")`
    - Store `exploration_profile` and `emphasized_potential_labels` as JSON columns (with SQLite fallback serialization).
  - Update `WorldCandidateRecord.to_candidate()` and `WorldCandidateRecord.to_read_schema()` to populate these fields with backward-compatible defaults.

#### Repository & DB Migration (`backend/app/repositories/project_repo.py`)
- In `_migrate_columns`:
  - Check `world_candidates` table columns.
  - If `divergence_archetype` is missing, `ALTER TABLE world_candidates ADD COLUMN divergence_archetype VARCHAR DEFAULT 'familiar'`.
  - If `exploration_profile` is missing, `ALTER TABLE world_candidates ADD COLUMN exploration_profile JSON`.
  - If `emphasized_potential_labels` is missing, `ALTER TABLE world_candidates ADD COLUMN emphasized_potential_labels JSON`.
- In `save_world_candidates`:
  - Populate `divergence_archetype`, `exploration_profile` (as dict/JSON), and `emphasized_potential_labels` (as list/JSON).
- In `generate_world_candidates` route (`backend/app/routers/worlds.py`):
  - Retrieve existing potential items via `await repo.get_potential_items(project_id)`.
  - Pass `potential_items=[r.model_dump() for r in potential_records]` into `ai_provider.generate_worlds(dna_dict, potential_items=potential_items)`.

#### AI Provider Engine (`backend/app/providers/`)
1. **Base Provider (`backend/app/providers/base.py`)**:
   - Signature: `async def generate_worlds(self, dna: Dict[str, Any], potential_items: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]: ...`
2. **Mock Provider (`backend/app/providers/mock_provider.py`)**:
   - Update `CANONICAL_WORLDS`:
     - **World 1 (Lost Civilization)**:
       - `divergence_archetype`: `familiar`
       - `exploration_profile`: `{"seed_fidelity": 92, "novelty": 54, "conceptual_distance": 28, "feasibility": 88, "summary": "Direct, mythic realization of submerged ruins with high historical grounding."}`
       - `emphasized_potential_labels`: `["Sunken Metropolis", "Child Protagonist", "Abyssal Marine Environment"]`
     - **World 2 (Bio-City)**:
       - `divergence_archetype`: `radical`
       - `exploration_profile`: `{"seed_fidelity": 68, "novelty": 94, "conceptual_distance": 82, "feasibility": 72, "summary": "Radical symbiotic mutation transforming urban decay into living, breathing coral nervous systems."}`
       - `emphasized_potential_labels`: `["Ancient Symbiotic Technology", "Sentient Deep-Sea Ecosystem"]`
     - **World 3 (Time Capsule)**:
       - `divergence_archetype`: `inverse`
       - `exploration_profile`: `{"seed_fidelity": 58, "novelty": 82, "conceptual_distance": 88, "feasibility": 65, "summary": "Conceptual subversion flipping oceanic fantasy into claustrophobic retro-futuristic paranoia."}`
       - `emphasized_potential_labels`: `["Archaeological Scavenger Conflict", "Surface Ecological Rupture"]`
   - Dynamic heuristic generator for arbitrary seeds:
     - Synthesizes 3 distinct archetypes (`familiar`, `radical`, `inverse`).
     - Injects accepted items as emphasized labels.
     - Assigns archetype-differentiated metric values.
3. **Gemini Provider (`backend/app/providers/gemini_provider.py`)**:
   - Parse `potential_items` into:
     - Accepted pillars: items with `user_status == "accepted"`
     - Negative constraints: items with `user_status == "rejected"`
     - Open dilemmas: items with `category == "open"`
   - Include `responseSchema` for `divergence_archetype` (enum `["familiar", "radical", "inverse"]`), `exploration_profile` (object with 4 metrics + summary), and `emphasized_potential_labels` (string array).
   - Graceful fallback on error or absent API key to `MockProvider`.

#### Frontend (`frontend/src/`)
1. **Types (`frontend/src/types/index.ts`)**:
   - `export type DivergenceArchetype = 'familiar' | 'radical' | 'inverse';`
   - `export interface ExplorationProfile { seed_fidelity: number; novelty: number; conceptual_distance: number; feasibility: number; summary: string; }`
   - Add optional fields to `WorldCandidate` and `WorldCandidateRead`:
     - `divergence_archetype?: DivergenceArchetype;`
     - `exploration_profile?: ExplorationProfile;`
     - `emphasized_potential_labels?: string[];`
2. **Components**:
   - `WorldCandidateCard.tsx`:
     - Render archetype banner pill at top:
       - Familiar: Cyan theme (`Familiar • Grounded Archetype`)
       - Radical: Emerald / Violet theme (`Radical • Paradigm Shift`)
       - Inverse: Amber / Rose theme (`Inverse • Conceptual Subversion`)
     - Render Exploration Profile horizontal metric bars:
       - Seed Fidelity (Cyan, `%`)
       - Novelty (Violet, `%`)
       - Conceptual Distance (Rose, `%`)
       - Feasibility (Emerald, `%`)
       - 1-line summary subtitle / tooltip
     - Render Emphasized Potential tags if present (e.g. `+ Sunken Metropolis`).
   - `WorldCandidatesCanvas.tsx`:
     - Add subtle Divergence Triad summary pill bar in header (Familiar / Radical / Inverse balance).

---

## Metric Calibrations & Visual Palette

| Metric | Target Palette | Familiar Bias | Radical Bias | Inverse Bias |
|---|---|---|---|---|
| **Seed Fidelity** | Cyan (`#06b6d4`) | 85–95% | 60–75% | 50–65% |
| **Novelty** | Violet (`#8b5cf6`) | 40–60% | 88–98% | 75–90% |
| **Conceptual Distance** | Rose (`#f43f5e`) | 20–40% | 75–88% | 85–98% |
| **Feasibility** | Emerald (`#10b981`) | 80–92% | 65–78% | 55–70% |

---

## Potential Bridges & Constraint Injection

1. **Accepted Potential Items**:
   - Injected into prompt as:
     `"MANDATORY CREATIVE PILLARS: You MUST incorporate the following creator-accepted concepts: [list]"`
   - Candidates tag which ones they prioritize via `emphasized_potential_labels`.
2. **Rejected Potential Items**:
   - Injected into prompt as:
     `"STRICT NEGATIVE CONSTRAINTS: You must NEVER include or evoke the following rejected concepts: [list]"`
3. **Open Questions**:
   - Injected as catalytic tension seeds:
     `"EXPLORATION DILEMMAS: Use these open mysteries to ground candidate core tensions: [list]"`
