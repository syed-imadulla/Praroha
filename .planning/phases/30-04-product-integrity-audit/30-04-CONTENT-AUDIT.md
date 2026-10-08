# 30-04-CONTENT-AUDIT.md: Terminology, Jargon & Cognitive Friction Audit

**Audit Date:** 2026-10-08  
**Scope:** PRAROHA (Seed Unfold) — Content Quality, Creative UX, & Terminology Analysis  
**Audience:** Creative Writers, Game Designers, Worldbuilders, and Narrative Architects  
**Methodology:** Full sweep of copy across all 7 stages, navigation shell, drawers, modals, tooltips, and badges.

---

## 1. Executive Content Assessment

PRAROHA suffers from a persistent identity conflict between **Botanical Creative Studio** (seeds, garden, flora, growth) and **Machine Learning Systems Engineering / Graph Theory** (DNA, latent directions, causal DAG, provenance ledgers, counterfactual replays, mutations). 

While the aesthetic presentation (Cormorant Garamond typography, sage greens, warm parchment backgrounds) conveys an editorial, literary atmosphere, the UI copy repeatedly pulls the creator into dense computer science abstractions. For a creative writer or game designer, this creates severe cognitive friction.

---

## 2. Comprehensive Terminology & Jargon Analysis Table

| # | Current UI Copy / Term | Where It Appears | The Core Problem | What a Non-Technical Creator Thinks | Recommended Plain-English Replacement | Severity |
|---|------------------------|------------------|------------------|-------------------------------------|----------------------------------------|----------|
| 1 | **"Seed DNA"** | Stage 2, TopBar, Inspector, Badges | Biological/genetic metaphor implies scientific code or sequencer rather than narrative structure. | "Is this DNA sequencing? Did I upload genetic data?" | **"Core Elements"** or **"World Foundation"** (Premise, Themes, Anchors) | **HIGH** |
| 2 | **"Seed Potential Map"** | Stage 2 Canvas, Inspector | "Potential" sounds like a battery level, energy meter, or capability score rather than creative possibilities. | "Is my seed only 60% potential? Am I being graded?" | **"Possibility Map"** or **"Exploration Paths"** (Stated, Inferred, Open Questions) | **MEDIUM** |
| 3 | **"Latent Directions"** | StageProgressHeader (Stage 3 Subtitle) | Deep machine learning jargon ("latent space vector") completely alien to storytelling. | "Is something hidden or dormant? Is this a math concept?" | **"Contrasting Visions"** or **"World Directions"** | **HIGH** |
| 4 | **"Decision DNA"** | Stage 4, TopBar, Codex Strip, Inspector | Overloaded with "Seed DNA". Having two distinct "DNA" concepts within 2 steps causes acute confusion. | "Wait, which DNA is this? Did my seed DNA get overwritten?" | **"Creator Vision"** or **"Creative Intent Contract"** | **CRITICAL** |
| 5 | **"Human-Only Zones" (HOZ)** | Stage 4 Canvas, Universe Codex Banner | Sounds like a military quarantine sector, sci-fi exclusion zone, or legal disclaimer. | "Is AI forbidden here? Am I entering a danger zone?" | **"Protected Creator Choices"** or **"Locked Canon Decisions"** | **HIGH** |
| 6 | **"Origin Ledger" / "Origin Tier"** | Inspector Drawer, Entity Badges | Accounting / blockchain terminology (`LEDGER`, `TIER`) applied to artistic character origins. | "Is this a financial transaction log or blockchain token?" | **"Source Attribution"** or **"Creative Provenance"** | **MEDIUM** |
| 7 | **"Causal Provenance DAG"** | Stage 6 Subtitle, Traceability Canvas | Computer science graph theory acronym (Directed Acyclic Graph) presented directly to end-users. | "What is a DAG? Why do I need to understand graph algorithms to write a story?" | **"Story Tree"** or **"Inspiration Trail"** (Tracing how your seed grew) | **HIGH** |
| 8 | **"Counterfactual Replay"** | Stage 7 Canvas, Inspector | Analytic philosophy and causal inference jargon. Sounds like a physics simulation or forensic analysis. | "Is this a replay of a video? Did something break?" | **"The Roads Not Taken"** or **"Alternative History"** | **MEDIUM** |
| 9 | **"Seed Mutation Lab"** | Stage 7 Canvas, Inspector | Bio-engineering / laboratory terminology jarringly juxtaposed with botanical gardening. | "Am I mutating viruses? Is this sci-fi only?" | **"Premise Workshop"** or **"What-If Studio"** | **MEDIUM** |
| 10 | **"Divergence Archetype"** | Stage 3 Candidate Cards | Academic / system classification terminology (`familiar`, `radical`, `inverse`). | "Sounds like a sociology textbook classification." | **"Exploration Style"** (Grounded, Transformative, Subversive) | **LOW** |
| 11 | **"Entity Revisions"** | Refine Canvas (Stage 7) | Database / ORM schema terminology for creative rewrites. | "Is this Git for stories? Where is the simple edit button?" | **"Version History"** or **"Draft Revisions"** | **LOW** |
| 12 | **"Creation Modes" (Home)** | Home Page Under Seed Input | Buttons labeled Image, Story, Sound, Video, Chat imply immediate generation modes, but do nothing. | "I clicked 'Story', why did it just open the standard seed input?" | **Remove from home** or make them genuinely pre-filter generation templates. | **HIGH** |
| 13 | **"Graveyard"** | Sidebar Nav (`/graveyard`) | Morbid, jarring terminology in a serene botanical aesthetic. Also pure static mock data. | "Where are dead characters stored? Why is this a primary sidebar tab?" | **"Compost"** (botanical) or **"Archived Seeds"** | **MEDIUM** |
| 14 | **"My Creations"** | Sidebar Nav (`/creations`) | Displays hardcoded Mountain Sunset / Forest Vibes photos that the user never created. | "I never made this mountain photo. Whose account am I looking at?" | **Connect to real project media** or show an honest empty garden state. | **CRITICAL** |

---

## 3. Structural Confusion: The "Two DNA" Trap

The single biggest source of cognitive friction in PRAROHA is the simultaneous existence of **Seed DNA** and **Decision DNA**:
1. **In Stage 2 (Understand):** The user is taught that **Seed DNA** is the immutable distilled core of their original thought (premise, tone, constraints, themes).
2. **In Stage 4 (Choose):** The user makes a choice among 3 worlds, and the system synthesizes **Decision DNA** (selected world, rationale, creative priorities, rejected paths, HOZ).
3. **In Stage 5 & 6 (Codex & Trace):** Both DNAs appear side-by-side in the TopBar and Inspector. Users routinely confuse which one governs downstream constraints.
- **Auditor Recommendation:** Unify the mental model. Rename Stage 2 to **"Seed Essence"** (the seed's intrinsic nature) and Stage 4 to **"Creator Compass"** (the author's active guidance for expansion).

---

## 4. Misleading Navigation Promises

1. **Sidebar Items (`My Creations`, `Graveyard`, `Profile`):**  
   - Clicking `My Creations` displays 6 hardcoded creations with Unsplash images (Mountain Sunset, The Whispering Grove, Dreamscape Reverie). None of them belong to the current user's project.
   - Clicking `Graveyard` displays 2 hardcoded deleted items (Floating Islands, Forgotten Chronicle) with functional-looking "Restore" and "Delete permanently" buttons that only modify ephemeral React component memory.
   - Clicking `Profile` displays: *"Your botanical creator profile and account preferences will unfold in Phase 27."*  
   - **Verdict:** Three out of five primary sidebar icons lead to non-production placeholders, giving a false impression of a multi-user platform.
