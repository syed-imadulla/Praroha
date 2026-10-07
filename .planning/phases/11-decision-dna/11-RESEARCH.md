# Phase 11 Research: Decision DNA (`DDNA-01`, `DDNA-02`, `DDNA-03`)

## Technical Analysis

### 1. Architectural Overview & Intent
In Phases 1–10, world selection in **Stage 4** operated primarily as a pointer to a selected `world_candidate_id` with an optional single string field `user_rationale`. However, creative direction is far richer than a binary candidate choice:
- Creators choose a direction for specific thematic pillars they want to double down on (**Creative Priorities**).
- They consciously or implicitly reject traits from the unselected alternatives (**Rejected Directions / Negative Guardrails**).
- They establish specific operational boundaries (**Custom Creative Directives**).

Phase 11 introduces **Decision DNA** (`DDNA-01`, `DDNA-02`, `DDNA-03`), turning world selection from an ephemeral choice into a persistent, relationally anchored, and downstream-propagated **Creative Contract**.

```
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: HUMAN WORLD SELECTION                                         │
│                                                                        │
│   Candidate 1 (Lost Civ)    Candidate 2 (Bio-City)    Candidate 3      │
│         [Unselected]               [SELECTED]          (Time Capsule)  │
│                                        │                [Unselected]   │
│                                        ▼                               │
│                   ┌───────────────────────────────┐                    │
│                   │ DECISION DNA CAPTURE          │                    │
│                   │ • Creative Priorities         │                    │
│                   │ • Inferred & Custom Exclusions│                    │
│                   │ • Creator Rationale           │                    │
│                   │ • Custom Directives           │                    │
│                   └──────────────┬────────────────┘                    │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │ Relational Persistence (DDNA-01/02)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 5: PROGRESSIVE UNIVERSE UNFOLDING                                │
│                                                                        │
│   Stable Snapshot Creation -> Passed into AI Provider Context          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ DECISION DNA CREATIVE CONTRACT                                 │   │
│   │ 1. Mandatory Creative Priorities                               │   │
│   │ 2. Negative Guardrails & Rejected Directions                   │   │
│   │ 3. Creator Rationale & Custom Directives                       │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│            ┌───────────────────────┼──────────────────────┐            │
│            ▼                       ▼                      ▼            │
│       World Bible             Characters                Scenes         │
│                                                                        │
│   UI Presentation (DDNA-03):                                           │
│   • Persistent Decision DNA Anchor Strip / Pill Bar at top of Codex    │
│   • Causal visibility in Lineage Drawer Inspector                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Existing Architecture Integration Points

#### 2.1 Backend Data Model (`backend/app/models/selection.py`)
Currently:
```python
class WorldSelectionCreate(BaseModel):
    user_rationale: Optional[str] = None

class WorldSelectionBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    world_candidate_id: str = Field(index=True, foreign_key="world_candidates.id")
    batch_id: str = Field(index=True)
    user_rationale: Optional[str] = Field(default=None, nullable=True)

class WorldSelectionRecord(WorldSelectionBase, table=True):
    id: str = Field(...)
    created_at: datetime = Field(...)
```

**Required Extensions:**
1. Define structured `DecisionDNA(BaseModel)` schema:
   - `selected_world_id: str`
   - `selected_title: str`
   - `selected_archetype: str`
   - `user_rationale: Optional[str] = None`
   - `creative_priorities: List[str] = Field(default_factory=list)`
   - `rejected_directions: List[str] = Field(default_factory=list)`
   - `custom_directives: Optional[str] = None`
   - `created_at: datetime`
2. Extend `WorldSelectionBase` and `WorldSelectionRecord`:
   - `creative_priorities_json: str = Field(default="[]")`
   - `rejected_directions_json: str = Field(default="[]")`
   - `custom_directives: Optional[str] = Field(default=None, nullable=True)`
3. Extend `WorldSelectionCreate`:
   - `user_rationale: Optional[str] = None`
   - `creative_priorities: List[str] = Field(default_factory=list)`
   - `rejected_directions: List[str] = Field(default_factory=list)`
   - `custom_directives: Optional[str] = None`
4. Add helper method `to_decision_dna(candidate: WorldCandidateRead) -> DecisionDNA` on `WorldSelectionRecord`:
   - Deserializes `creative_priorities_json` and `rejected_directions_json` safely with fallback to `[]`.
   - Incorporates `candidate.title` and `candidate.archetype`.
5. Extend `WorldSelectionRead`:
   - Includes `decision_dna: DecisionDNA` alongside existing `selected_world: WorldCandidateRead` for 100% backward compatibility.

#### 2.2 Database Migration & Backward Compatibility (`backend/app/repositories/project_repo.py`)
- In `_migrate_columns`:
  - Inspect columns of table `world_selections`.
  - If `creative_priorities_json` is missing:
    `ALTER TABLE world_selections ADD COLUMN creative_priorities_json TEXT DEFAULT '[]'`
  - If `rejected_directions_json` is missing:
    `ALTER TABLE world_selections ADD COLUMN rejected_directions_json TEXT DEFAULT '[]'`
  - If `custom_directives` is missing:
    `ALTER TABLE world_selections ADD COLUMN custom_directives TEXT`
- In `save_world_selection`:
  - Accept `creative_priorities: Optional[List[str]] = None`, `rejected_directions: Optional[List[str]] = None`, `custom_directives: Optional[str] = None`.
  - Serialize priorities and rejected directions to JSON.
  - Store fields on `WorldSelectionRecord`.
- In `create_canonical_demo_project`:
  - Populate canonical Bio-City Decision DNA:
    - Priorities: `["Ecological / Symbiotic Mystery", "Atmospheric Lore Depth", "Ethical Stakes"]`
    - Rejected Directions: `["Classical sunken ruins archaeology", "Cold War militarized technology"]`
    - Rationale: `"Selected Bio-City for deep biopunk exploration and rich ecological tension."`
    - Custom Directives: `"Ensure coral bio-luminescence and symbiotic sentience remain central across all layers."`

#### 2.3 Stable Decision DNA Snapshot Strategy (`backend/app/routers/unfold.py`)
- **Immutability Scope Guardrail:**
  The creative contract is immutable *for that unfolding execution*. Prior to unfolding, creators can modify their choices or re-select. In future phases (Phase 18 Mutation Lab / Phase 19 Counterfactual Replay), forks can mutate Decision DNA.
- In `unfold_universe` route:
  - Fetch active selection `(sel_rec, cand_rec) = await repo.get_active_world_selection(project_id)`.
  - Build stable `DecisionDNA` snapshot: `decision_dna = sel_rec.to_decision_dna(cand_rec.to_read_schema())`.
  - Pass `"decision_dna": decision_dna.model_dump()` into `context`.

#### 2.4 Downstream Provider Injection (`backend/app/providers/`)
1. **Gemini Provider (`backend/app/providers/gemini_provider.py`)**:
   - When `context.get("decision_dna")` is provided:
     Format the `DECISION DNA CREATIVE CONTRACT`:
     ```text
     === DECISION DNA CREATIVE CONTRACT ===
     1. MANDATORY CREATIVE PRIORITIES:
     - [Priority 1]
     - [Priority 2]
     ...
     2. NEGATIVE GUARDRAILS & REJECTED DIRECTIONS:
     - STRICTLY AVOID: [Rejected direction 1]
     - STRICTLY AVOID: [Rejected direction 2]
     ...
     3. CREATOR RATIONALE & DIRECTIVES:
     Rationale: [user rationale]
     Directives: [custom directives]
     =======================================
     ```
   - Update `system_instruction` to require strict adherence to the Creative Contract across World Bible, Characters, Relationships, and Scenes.
   - **Zero-Leakage Guardrail:** Do not expose raw LLM internal Chain-of-Thought. Keep generated content strictly grounded in the universe schema.
2. **Mock Provider (`backend/app/providers/mock_provider.py`)**:
   - Ensure canonical and fallback generation reads `context.get("decision_dna")` safely.
   - For arbitrary non-canonical seeds, verify that mock generation reflects the selected priorities and respects negative guardrails.

---

### 3. Frontend Architecture Integration

#### 3.1 Data Types (`frontend/src/types/index.ts`)
- Add `DecisionDNA` interface.
- Add `WorldSelectionCreate` interface.
- Extend `WorldSelectionRead` with optional `decision_dna?: DecisionDNA`.

#### 3.2 Workspace Store (`frontend/src/store/workspaceStore.ts`) & API Client (`frontend/src/api/client.ts`)
- Update `apiClient.selectWorld(projectId, candidateId, payload)`:
  - Supports string (for backward compatibility: `{ user_rationale: string }`) or `WorldSelectionCreate` object.
- Update `confirmWorldSelection(candidateId, payload: WorldSelectionCreate)` in `workspaceStore`:
  - Dispatches full Decision DNA payload.
  - Stores `activeSelection` in store.

#### 3.3 Stage 4 UI: Decision DNA Capture (`frontend/src/components/WorldSelectionCanvas.tsx`)
In the chosen candidate drawer/panel:
1. **Selectable Creative Priority Chips**:
   - Preset chips:
     - `Atmospheric Lore Depth`
     - `Character-Driven Conflict`
     - `Ecological / Symbiotic Mystery`
     - `Philosophical & Ethical Stakes`
     - `Visceral Sensory Worldbuilding`
     - `Intimate Personal Scale`
   - Custom priority tag input (type & press Enter or click Add).
2. **Inferred Exclusions & Negative Guardrails**:
   - Inferred from the two unselected candidate worlds.
     - E.g., if Candidate 2 (Bio-City) is chosen and Candidate 1 is "Lost Civilization", infer: `"Sunken classical ruins & relic looting tropes"`.
     - If Candidate 3 is "Time Capsule", infer: `"Cold War militarized bunker paranoia"`.
   - Toggle checkboxes for inferred exclusions.
   - Custom negative guardrails input (e.g. `"No magical teleportation"`).
3. **Creator Notes / Freeform Rationale**:
   - Multi-line textarea for why the creator chose this direction.
4. **Custom Creative Directives**:
   - Textarea for non-negotiable guidelines for Stage 5 generation.
5. **Confirmation Action**:
   - Sends the complete `WorldSelectionCreate` object to backend.

#### 3.4 Stage 5 UI: Codex Anchor Strip (`frontend/src/components/UniverseCodexCanvas.tsx`)
- Replace the simple highlight box with the **Decision DNA Anchor Strip / Pill Bar**:
  - Selected Archetype badge (e.g. `Bio-City (Radical • Symbiotic / Ecological)`).
  - Priority Pills with cyan glow (e.g. `★ Ecological / Symbiotic Mystery`, `★ Atmospheric Lore Depth`).
  - Active Exclusions / Negative Guardrails pills with rose/amber accent (e.g. `⊘ No sunken ruins archaeology`, `⊘ No Cold War bunker tech`).
  - "Inspect Full DNA" button that opens the Inspector Drawer to the provenance tab.

#### 3.5 Inspector Drawer (`frontend/src/components/InspectorDrawer.tsx`)
- Enhance the Step 3 node in the Lineage tab:
  - Display selected archetype.
  - Display creator rationale.
  - Display active creative priorities tags.
  - Display active negative guardrails tags.

---

### 4. Canonical Demo & Offline Resilience
- **Deterministic Bio-City Seeding:**
  - `create_canonical_demo_project()` must pre-populate the full Decision DNA with canonical priorities, exclusions, and rationale.
  - Target < 500ms hydration is preserved because data is seeded atomically into the SQLite/PostgreSQL database without external network calls.
- **Mock Provider Determinism:**
  - Offline tests and canonical demo continue to return deterministic fixtures without LLM latency.

---

### 5. Backward Compatibility & Migration Strategy
- Old database records that do not have `creative_priorities_json`, `rejected_directions_json`, or `custom_directives` will be automatically populated with safe defaults (`[]`, `[]`, `None`).
- Existing API clients that send `{ "user_rationale": "..." }` will continue to function without errors.
- Existing tests (all 65 backend tests and 24 E2E scenarios) will continue to pass.

---

### 6. Scope Guardrails (Out of Scope for Phase 11)
- **Phase 12 (Origin Ledger):** Do not tag universe entities with `HUMAN_DECISION` vs `AI_INTRODUCED` yet.
- **Phases 13–17 (Media Providers):** Do not generate audio, image, or video assets in Phase 11.
- **Phases 18–19 (Mutation Lab & Counterfactual Replay):** Do not implement post-unfolding mutation or counterfactual deltas in Phase 11.
