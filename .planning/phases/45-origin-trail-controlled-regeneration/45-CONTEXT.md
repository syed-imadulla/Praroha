# Phase 45 Context: Origin Trail & Controlled Regeneration

## Philosophical Grounding
In *Tatva 2: Forms Hidden in Formless*, modifying an upstream root premise causes a ripple effect through the universe. In traditional generative tools, changing a prompt either requires wiping out the entire universe or produces disjointed hallucinations where changes don't propagate.
In PRAROHA, creators must have **controlled regeneration**:
1. When an upstream decision (e.g. Seed DNA parameter, chosen World Candidate, or World Bible rule) is modified, the system calculates the **blast radius**:
   - `AFFECTED`: Directly depends on the changed node (e.g., characters belonging to an altered faction).
   - `CONDITIONAL`: May need review based on thematic shift.
   - `PRESERVED`: Completely isolated from the changed node or explicitly locked by the creator.
2. The creator previews this blast radius *before* committing.
3. The creator can selectively regenerate *only* the affected subtrees while keeping beloved, locked, or approved characters and scenes intact.
4. The Causal Lineage DAG is updated to reflect the new parent-child paths and version diffs.

## Technical Alignment
- Builds directly on `LineageService` and `OriginLedger`.
- Requires no external graph databases (Neo4j); computes DAG traversal in Python SQLModel with relational depth traversal.
- Prevents accidental loss of user work by enforcing immutable checkpoints on approved entities.
