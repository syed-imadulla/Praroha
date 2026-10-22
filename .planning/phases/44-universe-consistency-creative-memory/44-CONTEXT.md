# Phase 44 Context: Universe Consistency & Creative Memory

## Creative Dilemma & Tatva 2
Under *Tatva 2: Forms Hidden in Formless*, once a world form is chosen and begins to manifest, it establishes natural laws, institutional factions, character relationships, and visual aesthetics.
Currently in PRAROHA:
1. Universe unfolding is performed in a single large prompt that synthesizes the entire universe codex.
2. If a creator later refines a character or requests a new scene, the LLM has no canonical "Creative Memory" ledger to consult.
3. This risks lore drift, contradictory physical laws (e.g., characters breathing in a vacuum when the world bible states air is toxic), and character personality erosion.

## Architectural Objectives
1. **Canonical Creative Memory Ledger**:
   Define a structured, relational `CreativeMemory` model storing:
   - `canon_facts`: Inviolable world rules (physics, ecology, taboo technologies).
   - `character_profiles`: Protagonist motivation, core flaw, voice archetype, visual anchors.
   - `relationship_matrix`: Tension pairs, secrets, allegiances.
   - `timeline_anchors`: Established historical events and chronological constraints.
   - `creator_locks`: Human-Only Zones and explicit user overrides.
2. **Context Construction Engine**:
   Construct an optimized context budget (e.g. ~1,500 tokens) summarizing active memory facts for every downstream LLM prompt, ensuring new or refined entities respect existing canon.
3. **Deterministic Consistency Validator**:
   Implement automated post-generation checks before database write. If a generated scene violates a locked canon fact or character motivation, flag the contradiction or re-align the entity deterministically.
4. **No Unjustified Overhead**:
   Avoid adding external vector databases (Pinecone, Qdrant) or heavy retrieval stacks. The relational PostgreSQL store and structured SQLModel models provide all necessary state with sub-millisecond retrieval.
