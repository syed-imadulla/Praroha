# Seed Unfold — Traceability & Provenance Model

Traceability is a core differentiator and architectural pillar of **Seed Unfold**. It transforms AI from an opaque black box into an explainable, auditable, and navigable creative development tree.

---

## 1. Lineage Graph Model

The traceability system models the project evolution as a Directed Acyclic Graph (DAG) consisting of typed nodes and directed typed edges.

### Node Types

| Node Type | Description | Key Attributes |
|---|---|---|
| `Seed` | The root raw user input | `seed_id`, `raw_text`, `created_at` |
| `Understanding` | AI synthesis of implicit intent | `understanding_id`, `intent_summary` |
| `Seed DNA Field` | Granular constraint/attribute extracted from seed | `dna_field_id`, `field_name`, `value` |
| `World Candidate` | One of the exactly three generated options | `world_id`, `candidate_label` (A/B/C), `logline` |
| `User Choice` | Human selection decision gate | `choice_id`, `selected_world_id`, `timestamp` |
| `Canon Fact` | An established rule or lore entry in the World Bible | `canon_id`, `rule_text`, `category` |
| `Character` | A persona living in the selected world | `character_id`, `name`, `role`, `archetype` |
| `Scene` | A narrative beat or encounter | `scene_id`, `title`, `conflict`, `sequence_index` |
| `Asset` | An image, audio cue, or prompt | `asset_id`, `asset_type`, `uri_or_prompt` |
| `User Edit` | A manual modification or refinement by the human | `edit_id`, `target_node_id`, `diff_summary` |

---

### Edge Relationships

| Edge Type | Source Node → Target Node | Meaning |
|---|---|---|
| `derived_from` | `Understanding` → `Seed`<br>`World Candidate` → `Seed DNA`<br>`Character` → `Canon Fact` | Indicates direct conceptual derivation |
| `selected_by` | `Selected World` → `User Choice` | Links chosen world to the human choice event |
| `constrained_by` | `World Candidate` → `Seed DNA Field`<br>`Scene` → `Canon Fact` | Enforces behavioral boundaries or rules |
| `appears_in` | `Character` → `Scene`<br>`Asset` → `Scene` | Indicates participation or presence |
| `generated_for` | `Asset` → `Character`<br>`Asset` → `World Bible` | Indicates supportive asset generation |
| `revised_from` | `Node v2` → `Node v1` | Preserves iteration history during refinement |
| `branched_from` | `Branch Y` → `Branch X (Node N)` | Tracks macro forks across timelines |

---

## 2. Core Provenance Queries

The traceability engine must answer four primary user/system questions cleanly:

1. **"What was this generated from?"**
   - Traversing `derived_from` backward reveals the immediate parent node(s) and the root `Seed`.
2. **"Which decision caused this?"**
   - Traversing to `User Choice` nodes highlights the human fork that unlocked this branch.
3. **"Which Seed DNA rule influenced this?"**
   - Traversing `constrained_by` edges isolates specific seed constraints (e.g., negative constraints, tone).
4. **"Which branch does this belong to?"**
   - Reading `branch_id` and following `branched_from` ancestors establishes exact project lineage.

---

## 3. Privacy & Explainability Constraints

- **No Chain-of-Thought (CoT) Leaks**: Model reasoning tokens, raw internal prompts, or scratchpad text are never stored in user-facing trace nodes.
- **Human-Intelligible Justifications**: Provenance nodes store concise semantic explanations (e.g., *"Generated because World A specifies deep geothermal power"*), making the graph intuitive and educational for writers, designers, and judges.
