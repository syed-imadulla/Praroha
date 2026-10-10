# ADR-002: Three-World Branching and Traceability DAG

## Status
Accepted

## Context
PRAROHA is built around *Tattva 2: Forms Hidden in the Formless*. Traditional generative storytelling tools immediately jump from a prompt into an unguided narrative wall, robbing the user of agency and obscuring how decisions were made.

## Decision
1. **Exactly Three Worlds**: The branching engine strictly generates three distinct world options. This balances creative divergence with decision fatigue.
2. **Human Selection Gate**: The engine never autonomously picks a path. Human selection is a mandatory gating event.
3. **Lineage DAG**: Traceability is modeled as an in-memory / relational Directed Acyclic Graph (DAG) with explicit parent references (`derived_from`, `constrained_by`, `selected_by`).
4. **No External Graph Database**: To keep local development and deployment simple and reliable, we will not deploy Neo4j or complex graph servers for the MVP. Standard relational foreign keys and JSON arrays fulfill all traversal needs.
5. **No Private Chain-of-Thought**: Lineage nodes expose human-understandable justifications, never raw model internal scratchpads or token reasoning chains.

## Consequences
- **Positive**: Strict alignment with Tattva 2, verifiable provenance, zero infrastructure bloat.
- **Negative**: Graph algorithms (such as cycle detection or path traversal) must be implemented with lightweight Python/SQL logic rather than native graph query languages like Cypher.
