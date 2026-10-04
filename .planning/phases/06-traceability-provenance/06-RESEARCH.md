# Phase 6 Research: Traceability & Provenance (TRAC-01 to TRAC-03)

## Research Summary

Phase 6 introduces **Traceability & Provenance (Tattva 5: Sambandha)**, connecting every entity in the story universe back to the root seed via a Directed Acyclic Graph (DAG) with human-intelligible causal explanations.

---

## 1. Domain Modeling: Nodes, Edges & Lineage

### 1.1 Relational Synthesis vs. Stored Graph
Per ADR-002 and the Phase 6 discussion, the DAG is dynamically synthesized on demand from relational tables (`ProjectRecord`, `SeedDNARecord`, `WorldCandidateRecord`, `WorldSelectionRecord`, `WorldBibleRecord`, `CharacterRecord`, `CharacterRelationshipRecord`, `SceneRecord`).
- **Benefits**:
  - Zero risk of state drift between entities and provenance edges.
  - Zero additional database tables or alembic migrations required.
  - O(1) query latency on SQLite / PostgreSQL because project universes are bounded (~15–25 entities per project).

### 1.2 Node Schema (`TraceNode`)
```python
class TraceNode(BaseModel):
    id: str  # e.g., "node-seed", "node-dna", "node-world-{id}", "node-char-{id}"
    entity_id: str  # Underlying record UUID / ID
    entity_type: str  # root_seed, seed_dna, world_candidate, human_selection, world_bible, key_location, character, relationship, scene
    label: str  # Display label / name
    title: str  # Full title
    stage: int  # 1 to 5
    summary: str  # Short description / quote
    causal_explanation: str  # Human-intelligible explanation (TRAC-03)
    parent_ids: List[str] = []  # Direct ancestor node IDs
    metadata: Dict[str, Any] = {}
```

### 1.3 Edge Schema (`TraceEdge`)
```python
class TraceEdge(BaseModel):
    id: str  # e.g., "edge-seed-dna"
    source: str  # Parent node ID
    target: str  # Child node ID
    relation_type: str  # derived_from, selected_by, constrained_by, appears_in, generated_for
    label: str  # Human-readable edge descriptor
```

### 1.4 Lineage DAG Response (`TraceGraphRead`)
```python
class TraceGraphRead(BaseModel):
    project_id: str
    root_node_id: str
    nodes: List[TraceNode]
    edges: List[TraceEdge]
    selected_node_id: Optional[str] = None
```

---

## 2. Causal Explanation Engine (TRAC-03)

### Core Rule: Zero CoT Leakage
As mandated by ADR-002 and project rules:
> "Lineage nodes expose human-understandable justifications, never raw model internal scratchpads or token reasoning chains."

### Deterministic Synthesis Logic
The explanation engine synthesizes plain-language narratives from relational fields:
- **Seed DNA**: Connects to the raw seed intent and explains how premise, tone, and constraints were extracted.
- **World Candidates**: Explains how the candidate's archetype and aesthetic diverge while respecting Seed DNA constraints.
- **Human World Selection**: Documents the user's explicit choice and captures creator rationale.
- **World Bible & Locations**: Explains how the geography, physics rules, and locations were formulated to govern the selected world.
- **Characters**: Explains why the character was cast (their role and archetype) to embody the world's core conflict.
- **Relationships**: Explains the dynamic tension connecting two characters in the selected world. Note: `source_character_id` and `target_character_id` are resolved against the loaded `CharacterRecord` collection (do not assume `source_character_name` or `target_character_name` fields exist on `CharacterRelationshipRecord`).
- **Scenes**: Explains why this dramatic scenario was staged, what dramatic question it tests, and its consequence for the world.

---

## 3. Frontend Canvas & UX Architecture

### 3.1 Stage 6 ("Trace") Canvas (`TraceabilityCanvas.tsx`)
1. **Lanes / Pipeline Hierarchy**:
   - Lane 1: **Root Seed** (Origin)
   - Lane 2: **Seed DNA** (Distilled Intent)
   - Lane 3: **World Candidates & Selection** (Latent forms & Human Gate)
   - Lane 4: **World Bible & Locations** (Canon laws & geography)
   - Lane 5: **Inhabitants & Dynamics** (Characters & relationships)
   - Lane 6: **Story Beats / Scenes** (Narrative drama)

2. **Graph Highlighting & Ancestor Traversal**:
   - Clicking a node computes its transitive ancestor set via BFS/DFS traversal back to `node-seed`.
   - Selected node and all ancestor nodes receive glowing borders and badges (`shadow-glow-cyan`, `border-cyan-400`).
   - Edges connecting ancestors glow bright cyan/amber.
   - All non-ancestor nodes are dimmed (`opacity-35`).

3. **Causal Inspector Card**:
   - Displays:
     - Entity Title & Entity Type Badge
     - "Why does this exist?" Plain-language causal explanation
     - Breadcrumb trail of parent nodes
     - Direct attributes (e.g. character motivation, scene outcome, location description)

4. **Cross-Stage Shortcuts**:
   - In `UniverseCodexCanvas.tsx`, each location, character, relationship, and scene card includes a "Trace Lineage" icon button.
   - For Key Locations: Resolves to deterministic lineage node ID `node-loc-{index}` using the location index or `metadata.location_index` (since locations have no separate database table and must not invent a UUID).
   - Clicking it navigates to Stage 6 with that node ID pre-selected and focused in the DAG.

---

## 4. Test Strategy

1. **Backend Tests (`backend/tests/test_lineage.py`)**:
   - Test DAG synthesis for empty/new project.
   - Test DAG synthesis after Seed DNA extraction.
   - Test DAG synthesis after World generation and Human Selection.
   - Test complete DAG synthesis after Universe Unfolding.
   - Test ancestor path computation.
   - Test plain-language causal explanations for absence of CoT tokens.
2. **Frontend Tests & Build**:
   - `npm run build` TypeScript validation.
   - Playwright E2E (`frontend/e2e/test_phase6_traceability.cjs`):
     - End-to-end journey through Stages 1-5.
     - Enter Stage 6 Trace Canvas.
     - Verify full DAG renders with all 6 lanes.
     - Click Character node (e.g. Dr. Althea Thorne) -> Verify ancestor path glow and non-ancestor dimming.
     - Verify Causal Inspector Card displays plain-language "Why does this exist?" explanation.
     - Test cross-stage jump from Codex card into Trace Canvas.
