# PRAROHA — UI Density, Clustering & Composition Audit
**Role:** Senior Product Designer + UX Architect + Frontend Engineer  
**Date:** 2026-10-08  
**Scope:** Full Frontend Interface Composition, Density, Hierarchy, Responsive Behavior & Architectural Audit  
**Status:** AUDIT COMPLETE — STRICTLY NO IMPLEMENTATION YET  

---

## 1. Executive Summary & Core Philosophy

PRAROHA is an **AI-powered Creative Ideation IDE**, a **Botanical Creative Journal**, and a **Seed → Universe world-building environment**. Its core poetic and architectural premise is anchored in *Tattva 2: Forms Hidden in the Formless* — communicating the visceral feeling that **one raw, incomplete seed gradually unfolds into a living, coherent, and traceable universe**.

### The Paradox of Current Visual Consistency vs. Composition Quality
Through Phases 21–29, the application achieved **theme consistency**: dark cyber neon was successfully replaced with warm parchment (`#F8F4E8`), sage green (`#294B3A`, `#355A46`), terracotta (`#A0522D`, `#B8734F`), and typography tokens (Cormorant Garamond + Inter). 

However, **visual theme consistency is not composition quality**. The interface suffers from:
1. **Control Clutter & Dashboard Creep:** Developer information (AI provider engines, fallback indicators, database engine labels, storage types) occupies primary layout real estate alongside creative tools.
2. **Card-in-Card Nesting Cascades:** In Stages 4, 5, 6, and 7, containers nest inside containers 3 to 4 levels deep, multiplying borders, padding, and visual friction.
3. **Pill & Chip Inflation:** Multiple sections feature dense swarms of 10–18 pills with equal visual weight (Origin badges, priorities, tags, metadata, and status dots).
4. **Action Weight Equalization:** Primary creative progression CTAs (e.g., "Confirm & Lock Direction", "Unfold Universe") compete visually with secondary utility buttons (JSON exports, modal triggers, reset buttons).
5. **Desktop Stretching & Mobile Compression:** On wide screens (1440px+), content stretches into expansive empty voids or awkwardly stretched cards; on mobile (390px), complex desktop multi-column layouts are crudely stacked, creating endless vertical scrolling marathons.

---

## 2. Phase A: Full Application Audit by Screen & Shared UI

### Screen 1: Home / Seed Input (Stage 1)
- **Primary Purpose:** Ingest a creative premise, spark imagination, and launch exploration.
- **Current Layout Composition:**
  - Sidebar (272px fixed) + TopBar (60px) + StageProgressHeader (44px)
  - Main container: Continuity pill (`Seed → Universe · Botanical Creative Journal`)
  - Hero: Editorial statement + decorative leaf SVG
  - Primary Seed Input: 72px pill textarea with leaf icon and submit circle
  - In-flight extraction progress pill
  - Presets row: "Presets:" label + 3 pill buttons + "Instant Full Universe" button
  - Creation Modes: 5 large colored cards (Image, Story, Sound, Video, Chat)
  - Recent Creations: Horizontal row of 3 `CreationCard` items
  - **Bottom Architecture Cards:** 3 technical cards (`AI Provider Engine`, `Persistence Layer`, `Cloud Object Storage`) rendered via `WorkspaceCanvas.tsx`.
- **Key Composition Flaws:**
  - The 3 architecture cards at the bottom scream "developer internal debugging console" rather than "poetic creative journal".
  - "Instant Full Universe" button sits awkwardly at the end of the preset pills row, visually masquerading as a preset while functioning as a nuclear demo shortcut.
  - Creation Modes grid and Recent Creations row compete for vertical focus before the user has even entered their seed.

### Screen 2: Stage 2 — Understand (Seed DNA & Potential Map)
- **Primary Purpose:** Reveal structural comprehension of the seed and allow exploring latent potential.
- **Current Layout Composition:**
  - Sub-stage switcher: `Seed DNA Blueprint` vs `Seed Potential Map` pill toggle
  - Top header with stage subtitle, title, and action buttons (`Export JSON`, `Refine Seed`)
  - Engine & schema badges (`Engine: gemini`, `Mock Fallback Active`, `DNA Schema v1.0`)
  - Immutable Raw Seed quote banner
  - Core Distilled Premise card with left green border
  - 2-column grid: Emotional Tone card vs Implicit Thematic Tensions card
  - 2-column grid: Core Entities card vs Strict Boundary Constraints card
  - Domain Keywords card with hashtag pills
  - Bottom CTA strip: `Explore Potential Map` + `Generate 3 Worlds (Stage 3)`
  - Bottom Architecture Cards (again rendered at canvas bottom).
- **Key Composition Flaws:**
  - 4 separate 2-column cards create a boxed, spreadsheet-like fragmentation.
  - The engine and schema badges (`Engine: gemini`, `DNA Schema v1.0`) introduce tech noise right at the top of the creative analysis.
  - Sub-stage switcher between DNA Blueprint and Potential Map feels detached from the primary progression CTA.

### Screen 3: Stage 3 — Divergent Worlds (Three Candidate Cards)
- **Primary Purpose:** Side-by-side exploration of three intentional archetypes (Familiar, Radical, Inverse).
- **Current Layout Composition:**
  - Header with triad archetype indicator (`1 Familiar • 1 Radical • 1 Inverse`), title, description, and two CTAs (`Re-generate`, `Proceed to Selection`)
  - Grounding reminder strip: Seed DNA Anchor premise quote + Tone + `View DNA Full` button
  - 3-column world comparison grid with `WorldCandidateCard` components
  - Each card contains: Archetype badge, Candidate #, Title, Logline, Concept, Archetype explanation, Dimensions (Protagonist, Conflict, Tone, World Rule), Trade-offs, Exploration Profile (Seed Fidelity, Novelty, Semantic Distance, Feasibility), and EntityMediaSection
  - Bottom guidance banner: "Compare the three archetypes side-by-side..." + `Continue to Stage 4`
  - Bottom Architecture Cards.
- **Key Composition Flaws:**
  - Each `WorldCandidateCard` is vastly overloaded: contains over 14 distinct data points plus media controls. The card is over 1100px tall in a single column!
  - Two "Proceed to Stage 4" buttons exist simultaneously (one in the header, one in the bottom guidance banner).
  - Media generation controls inside candidate cards distract the user *before* they have even chosen a world direction.

### Screen 4: Stage 4 — Choose (Human Selection & Decision DNA)
- **Primary Purpose:** Enforce the creative human fork: select one world and establish inviolable creative axioms.
- **Current Layout Composition:**
  - Header with stage description and selection indicator
  - Seed DNA Anchor strip
  - Stage 5 lock banner (when active)
  - 3 world cards with glow/dim visual state
  - Below world cards: Massive "Chosen World Direction" panel containing:
    - Chosen world title and archetype badges + `Confirm & Lock Direction` CTA
    - Section 1: Creative Priorities (7 preset chips + custom input + chip list)
    - Section 2: Negative Guardrails & Exclusions (checklist + custom input + exclusion list)
    - Section 3: Creator Rationale & Intent (textarea)
    - Section 4: Custom Directives (textarea)
    - Section 5: Human-Only Zones panel (Suggest button, Lock toggle, 3 input cards for Core Theme, Protagonist Motivation, Central Conflict)
  - Bottom Architecture Cards.
- **Key Composition Flaws:**
  - **Severe cognitive overload:** The selection panel tries to do 5 distinct configuration jobs in one giant screen section.
  - After choosing a candidate at the top, the user must scroll through a 1400px tall control labyrinth to reach the lock button or human zones.
  - Card-in-card nesting reaches 4 levels: Page -> Canvas -> Selection Panel -> Section 5 HOZ Box -> Zone Input Card.

### Screen 5: Stage 5 — Unfold (Universe Codex)
- **Primary Purpose:** Explore the living, unfolded world across Bible, Characters, Dynamics, and Story Beats.
- **Current Layout Composition:**
  - Header with world title, concept, and 3 utility launchers (`Simulate "What If?"`, `What If I Chose Another World?`, `Inspect Lineage`)
  - Decision DNA Anchor Strip (Priorities stars, exclusions strikethroughs, inspect button)
  - Human-Only Zones Summary Banner (3 locked zone cards)
  - Pre-unfold Hero CTA or progressive reveal loader
  - Interactive Codex workspace with 5 tabs:
    - World Bible & Locations
    - Characters & Dynamics
    - Story Beats / Scenes
    - Seed Mutation Lab (Tab 4)
    - Counterfactual Replay (Tab 5)
  - Origin Filter Toolbar (`All`, `SEED_EXPLICIT`, `HUMAN_DECISION`, etc.)
  - Tab content cards (Location cards, Character cards, Scene cards) with media generation sections and audio players
  - Bottom AtmosphereDeck fixed dock
  - Bottom Architecture Cards.
- **Key Composition Flaws:**
  - **Identity Confusion:** Tab 4 (Mutation Lab) and Tab 5 (Counterfactual Replay) belong conceptually to Stage 7 (Refine & Branch), yet they are duplicated as tabs inside Stage 5 Codex *and* as top header launch buttons.
  - The page header contains 3 launcher buttons that pull the user completely out of the Codex.
  - Decision DNA strip + Human-Only Zones summary banner consume 340px of vertical height before the user even sees the first World Bible location or character.

### Screen 6: Stage 6 — Trace (Causal Lineage DAG)
- **Primary Purpose:** Visually verify parent-child causality and explain *why* any element exists back to the seed.
- **Current Layout Composition:**
  - Header with title, reset highlighting, sync graph button, and zoom controls
  - Filter Focus bar (`All`, `Characters`, `Scenes`, `Locations`, `Canon & Laws`)
  - Legend items (Selected Target, Causal Ancestor Path, Unrelated Node)
  - Origin Tier filter toolbar (7 origin badges)
  - 2-column workspace (8 cols DAG pipeline, 4 cols Causal Provenance Inspector)
  - Left column: 6 visual lanes connected with vertical lines
  - Right column: Causal Inspector card with node details, parents list, child nodes, and plain-language explanation
  - Bottom Architecture Cards.
- **Key Composition Flaws:**
  - The top toolbar contains 5 separate control clusters in 4 vertical rows before the DAG begins.
  - The right-hand Causal Inspector duplicates information already present in the global `InspectorDrawer` (accessed via TopBar "Inspect" button).

### Screen 7: Stage 7 — Refine (Timeline Branching & Audit Log)
- **Primary Purpose:** Fork alternate timelines, refine specific characters/scenes, and save portable snapshots.
- **Current Layout Composition:**
  - Header with `Export Bundle (.json)` and `Save Storage Snapshot` buttons
  - 12-column split view:
    - Left (5 cols): Timeline Branching card (active timeline info, fork form, branches list) + Direct Refinement Launchers card
    - Right (7 cols): Refinement Audit Log (filter tabs, revision cards with diff notes and attribute changes)
  - Bottom Architecture Cards.
- **Key Composition Flaws:**
  - Stage 7 contains two primary operations (Timeline Branching vs Entity Revision History) that fight for layout dominance in an asymmetrical 5/7 column split.
  - On viewports under 1280px, the 5-column left side cramps branch names and fork inputs into tight, unreadable boxes.

### Screens 8–10: My Creations, Graveyard, Profile
- **My Creations:** 3-column grid of canonical `CreationCard` items with favorite toggle and toast notifications. Clean and focused, but lacks search/filter controls.
- **Graveyard:** 3-column grid with restore and permanent delete actions. Poetic and calm, well balanced.
- **Profile:** Simple card placeholder returning to seed workspace. Needs future expansion in Phase 27.

### Shared Components Audit
- **TopBar:** Overloaded with 10 disparate controls: Brand, Tattva 2, Branch dropdown, AI status, Supabase status, Demo Universe button, Guided Tour button, Shortcuts Help button, New Seed button, Inspect button.
- **StageProgressHeader:** Horizontal scrolling pill row of 7 stages. Consumes 64px height. On mobile, it scrolls horizontally offscreen, losing the user's immediate sense of "Stage X of 7".
- **InspectorDrawer:** Right sliding drawer with 3 tabs (DNA, Worlds, Lineage). High utility, but overlaps content without pushing canvas when opened.
- **AtmosphereDeck:** Floating audio player bar at the bottom. Well designed, but collides with mobile fixed controls and bottom toasts.

---

## 3. Phase B: Component Density Maps

### Classification Criteria:
- **PRIMARY:** Essential to the user's immediate creative task on this screen.
- **SECONDARY:** Important contextual support, filters, or alternative views.
- **TERTIARY:** Historical logs, deep reference, or advanced editing tools.
- **SYSTEM / TECHNICAL:** Diagnostics, provider status, schemas, IDs, timestamps.
- **DECORATIVE:** Pure aesthetic flourishes, dividers, brand stamps.

---

### Density Map: HOME / STAGE 1 (SEED)
```
GLOBAL SHELL
  ├── Sidebar [PRIMARY - Global Navigation]
  ├── TopBar [MIXED - Brand + 6 Clustered Actions]
  └── StageProgressHeader [SECONDARY - Step Navigation]

MAIN CANVAS
  ├── Continuity Indicator ("Seed → Universe") [DECORATIVE]
  ├── HomeHero Statement & Leaf Divider [PRIMARY - Emotional Spark]
  ├── Primary Seed Input (72px Pill) [PRIMARY - Core Interaction]
  ├── Extraction Progress Status Pill [SECONDARY - System Feedback]
  ├── Preset Seed Chips (Ocean, Ark, Forest) [SECONDARY - Inspiration]
  ├── Instant Full Universe Button [UTILITY - Demo Shortcut]
  ├── Creation Modes Grid (Image, Story, Sound, Video, Chat) [SECONDARY - Capability Discovery]
  ├── Recent Creations Row (3 Cards) [SECONDARY - Continuity]
  └── Bottom Architecture Cards (AI, Persistence, Storage) [SYSTEM / TECHNICAL - Clutter]
```
- **Composition Judgment:** The 3 bottom Architecture Cards are purely **SYSTEM / TECHNICAL** and must be removed from the canvas. The "Instant Full Universe" button should move to a developer/demo menu.

---

### Density Map: STAGE 2 (UNDERSTAND)
```
STAGE 2 CANVAS
  ├── Sub-stage Lens Switcher (DNA vs Potential) [SECONDARY - View Mode]
  ├── Header & Subtitle [PRIMARY - Stage Context]
  ├── Action Buttons (Export JSON, Refine Seed) [UTILITY]
  ├── Engine & Schema Badges (gemini, mock, v1.0) [SYSTEM / TECHNICAL]
  ├── Raw Seed Quote Box [SUPPORTING - Grounding]
  ├── Core Distilled Premise Card [PRIMARY - Key Creative Insight]
  ├── Tone & Themes Cards (2-col) [SECONDARY - Creative Attributes]
  ├── Entities & Constraints Cards (2-col) [SECONDARY - World Rules]
  ├── Domain Keywords Card [TERTIARY - Metadata]
  ├── Primary Progression CTAs (Potential vs Stage 3) [PRIMARY - Advance Workflow]
  └── Bottom Architecture Cards [SYSTEM / TECHNICAL]
```
- **Composition Judgment:** The Engine & Schema badges and Bottom Architecture Cards distract from the poetic distillation of the seed.

---

### Density Map: STAGE 3 (THREE WORLDS)
```
STAGE 3 CANVAS
  ├── Stage Header & Triad Archetype Badge [PRIMARY - Context]
  ├── Top Action Buttons (Re-generate, Proceed to 4) [PRIMARY - Stage Actions]
  ├── Seed DNA Anchor Strip [SUPPORTING - Context Continuity]
  ├── 3-Column Candidates Grid [PRIMARY - Core Comparative Experience]
  │   └── Each WorldCandidateCard:
  │       ├── Archetype & Index Badge [PRIMARY]
  │       ├── Title & Logline [PRIMARY]
  │       ├── Concept & Archetype Justification [SECONDARY]
  │       ├── 4 Dimensions (Protagonist, Tone, Conflict, Rule) [SUPPORTING]
  │       ├── Trade-offs & Consequences [SUPPORTING]
  │       ├── 4-Metric Exploration Profile Meters [TERTIARY / ANALYTIC]
  │       └── EntityMediaSection (Image prompt, aspect ratio, generate btn) [SECONDARY / PREMATURE]
  ├── Bottom Guidance Banner & Duplicate CTA [TERTIARY - Redundant]
  └── Bottom Architecture Cards [SYSTEM / TECHNICAL]
```
- **Composition Judgment:** `EntityMediaSection` inside candidate cards is premature — users should not generate media for 3 worlds before picking one. Metrics meters should be compact or collapsed.

---

### Density Map: STAGE 4 (CHOOSE & DECISION DNA)
```
STAGE 4 CANVAS
  ├── Header & Direction Lock Banner [PRIMARY - Stage Context]
  ├── Seed DNA Anchor Strip [SUPPORTING]
  ├── 3-Column Worlds Grid (Glow / Dim selection) [PRIMARY - Selection Target]
  └── Selected World Direction & Decision DNA Panel [OVERLOADED]
      ├── Chosen World Header & Lock CTA [PRIMARY]
      ├── Section 1: Creative Priorities (Pillars) [SECONDARY - Guiding Intent]
      ├── Section 2: Negative Guardrails (Checklist) [SECONDARY - Boundaries]
      ├── Section 3: Creator Rationale Textarea [SECONDARY - Justification]
      ├── Section 4: Custom Directives Textarea [TERTIARY - Detailed Prompts]
      └── Section 5: Human-Only Zones Panel [PRIMARY - Creator Axioms]
          ├── HOZ Header & Lock / Suggest Buttons [SECONDARY]
          ├── Core Theme Input Card [PRIMARY]
          ├── Protagonist Motivation Input Card [PRIMARY]
          └── Central Conflict Input Card [PRIMARY]
```
- **Composition Judgment:** The Decision DNA panel is an overloaded 5-part form. Sections 1–4 should be progressive disclosures or grouped into a unified "Creative Intent" notebook section, with Human-Only Zones given clean, dedicated prominence.

---

### Density Map: STAGE 5 (UNFOLD / CODEX)
```
STAGE 5 CANVAS
  ├── Codex Header Banner [PRIMARY]
  ├── Top Header Launchers (What If, Replay, Inspect) [SECONDARY - Disorienting Links]
  ├── Decision DNA Anchor Strip [SUPPORTING]
  ├── Human-Only Zones Summary Banner [SUPPORTING]
  ├── Pre-unfold Hero CTA or Reveal Progress Loader [PRIMARY - Unfold Engine]
  ├── Codex Tabs (Bible, Characters, Scenes, Mutation, Replay) [PRIMARY - Content Navigation]
  ├── Origin Filter Toolbar [SECONDARY - Provenance Filter]
  ├── Active Tab Content [PRIMARY - Rich World Elements]
  │   ├── Bible: Physics, History, Locations Cards [PRIMARY]
  │   ├── Characters: Cast Cards with Voice & Portrait Controls [PRIMARY]
  │   └── Scenes: Dramatic conflict cards with Video & Narrative Player [PRIMARY]
  └── AtmosphereDeck Dock [SECONDARY - Sensory Audio]
```
- **Composition Judgment:** Launching Mutation Lab and Counterfactual Replay from tabs inside Stage 5 creates duplicate architecture with Stage 7. They belong to Stage 7 Refine & Branch.

---

### Density Map: STAGE 6 (TRACE / DAG)
```
STAGE 6 CANVAS
  ├── Header Banner & Reset / Sync / Zoom Controls [PRIMARY & UTILITY]
  ├── Filter Focus Row (All, Characters, Scenes, Locations, Lore) [SECONDARY]
  ├── Origin Tier Toolbar (7 badges) [SECONDARY]
  ├── 8-Col 6-Lane DAG Pipeline [PRIMARY - Visual Proof of Lineage]
  └── 4-Col Causal Provenance Inspector Card [PRIMARY - Explanatory Narrative]
```
- **Composition Judgment:** Having two separate filter bars (Filter Focus + Origin Tier Toolbar) stacked vertically creates unnecessary control clutter.

---

### Density Map: STAGE 7 (REFINE / TIMELINE BRANCHING)
```
STAGE 7 CANVAS
  ├── Header & Export / Save Buttons [PRIMARY & UTILITY]
  ├── 5-Col Left: Timeline Branching [PRIMARY]
  │   ├── Active Timeline Status [PRIMARY]
  │   ├── Fork Branch Form [PRIMARY]
  │   ├── Known Branches List [SECONDARY]
  │   └── Direct Refinement Launchers [SECONDARY]
  └── 7-Col Right: Refinement Audit Log [PRIMARY]
      ├── Filter Tabs (All, Character, Scene) [SECONDARY]
      └── Revision History Cards [SECONDARY]
```
- **Composition Judgment:** The asymmetrical 5/7 split is functional, but cramps timeline branches on tablet viewports.

---

## 4. Phase C: Visual Cluster Analysis

### Diagnostic Evaluation: One Section = One Purpose

| Screen | Cluster / Component | Diagnostic Questions (1–10) | Evaluation & Redesign Recommendation |
|---|---|---|---|
| **TopBar** | Brand + Status + 6 Actions | 10 controls at equal visual weight. What is primary? | **UNNECESSARILY GROUPED.** The TopBar is a control dashboard. **Move** AI and database status to an unobtrusive footer or drawer. **Collapse** Tour, Shortcuts, and Demo into a clean `···` overflow menu. |
| **Stage 1 (Home)** | Architecture Cards (Bottom) | Do users need database/storage specs while planting a seed? | **UNNECESSARY GROUPING.** Remove completely from creative canvas. Move to system status modal or settings. |
| **Stage 1 (Home)** | Preset Chips + Instant Demo | "Instant Full Universe" button sits at end of seed presets row. | **MISMATCHED PURPOSE.** A seed preset fills the textarea; "Instant Universe" skips all 7 stages. **Separate** demo launcher into a subtle "Explore Judge Demo" link. |
| **Stage 2 (Understand)** | Model & Schema Badges | `Engine: gemini`, `DNA Schema v1.0` pills sit above the seed quote. | **MOVE TO PROGRESSIVE DISCLOSURE.** Creators care about the premise, themes, and tensions — not the schema version. Convert to compact inline metadata at card bottom. |
| **Stage 2 (Understand)** | 4 Attribute Cards (2x2 Grid) | Tone, Themes, Entities, Constraints are separate boxes with thick borders. | **UNNECESSARILY FRAGMENTED.** Merge into a unified **Seed DNA Ledger** with clean typographic dividers instead of heavy card-in-card containers. |
| **Stage 3 (Worlds)** | World Candidate Card Internal Sections | Each card has 6 sections, 8 pills, and media buttons. | **OVER-CLUSTERED.** Candidate cards must help user **compare and choose**, not configure media. **Collapse** exploration metrics into an expandable disclosure. **Remove** media generation until Stage 5. |
| **Stage 4 (Choose)** | Decision DNA Panel (5 sections) | Priorities, Exclusions, Rationale, Directives, and Human-Only Zones in one card. | **UNNECESSARY GROUPING.** Split into two distinct stages of thought: **1. World Direction & Creator Rationale** (why you chose it), and **2. Human-Only Zones** (your inviolable creative locks). Collapse directives into rationale. |
| **Stage 5 (Unfold)** | Codex Tabs + Mutation & Replay | Tabs row contains 3 codex content tabs + 2 branching lab tools. | **INCORRECT GROUPING.** World Bible, Characters, and Scenes are *what exists in this world*. Mutation Lab and Replay are *what if this world were different*. Move Mutation and Replay exclusively to Stage 7. |
| **Stage 5 (Unfold)** | Top Header Action Buttons | 3 launcher buttons (`Simulate What If`, `Counterfactual Replay`, `Inspect Lineage`). | **COMPETING FOCAL POINTS.** These buttons draw attention away from the primary task: exploring the unfolded universe. Remove top launchers. Keep lineage in the TopBar/Inspector. |
| **Stage 6 (Trace)** | Dual Filter Toolbars | Filter Focus pills + Origin Tier toolbar pills stacked together. | **DUPLICATED CONTROLS.** Merge into a single unified filter strip with dropdown or segment selector. |

---

## 5. Phase D: Information Hierarchy Matrix

For every stage in PRAROHA, we define the single **Primary User Task** and allocate visual weight accordingly:

| Stage | Primary User Task | Primary Information (Visually Dominant) | Secondary Information (Comfortable Support) | Supporting Information (Light Touch) | Technical Information (Collapsed / Hidden) |
|---|---|---|---|---|---|
| **Stage 1: Seed** | Express creative premise | 72px Seed Input & Editorial Statement | Preset Seed ideas, Creation Mode icons | Recent creations row | AI Provider resolution, database status |
| **Stage 2: Understand** | Validate and refine extracted seed DNA | Core Distilled Premise & Thematic Tensions | Immutable Seed Quote, Entities, Constraints | Domain keywords, sub-stage lens toggle | LLM Model name, JSON schema version |
| **Stage 3: Worlds** | Compare 3 divergent creative directions | 3 World Titles, Archetypes, Loglines & Core Contrasts | Distinct creative trade-offs, protagonist motivations | 4-metric exploration profile meters | Batch ID, token counts, generation latency |
| **Stage 4: Choose** | Commit to one world & establish creator locks | Selected World Direction Card & Human-Only Zones | Creative Priorities chips, Creator Rationale note | Inferred negative guardrails checklist | Internal Decision DNA JSON payload |
| **Stage 5: Unfold** | Explore and inhabit the generated universe | World Bible Codex, Characters cast, Story Scenes | Relationship web, key locations, audio atmosphere | Midjourney visual prompts, scene versions | Provider fallback cascades, MIME types |
| **Stage 6: Trace** | Verify provenance back to seed | 6-Lane DAG Pipeline & Selected Node Provenance Trail | Causal narrative explanation, ancestor path glow | Origin Tier badges (SEED, HUMAN, DERIVED) | Node internal UUIDs, relational edge IDs |
| **Stage 7: Refine** | Fork parallel timeline or inspect revisions | Timeline Branch Selector & Fork Action | Refinement Audit Log diff notes, entity versions | Quick refinement launchers for characters/scenes | Storage snapshot JSON byte length |

---

## 6. Phase E: Clustering Test Results

### Good Clustering (Naturally Perceived as One Thing):
- **World Candidate Summary:** `[Archetype Badge] + [World Title] + [Logline] + [Select Button]`. These directly answer: *"What is this world and can I choose it?"*
- **Human-Only Zone Axiom:** `[Lock Icon] + [Zone Label] + [Inviolable Text Input] + [Explanation]`. These directly answer: *"What creator rule is locked against AI drift?"*
- **Character Profile:** `[Portrait/Fallback] + [Name] + [Role] + [Internal Conflict] + [Voice Narration Player]`. These directly answer: *"Who is this person and how do they sound?"*
- **Timeline Branch Item:** `[Branch Name] + [Active Badge] + [Creation Date] + [Switch Button]`. These directly answer: *"Which story version is this?"*

### Bad Clustering (Currently Forced Together Unnaturally):
- **TopBar Right Group:** `[AI Provider Pill] + [Storage Pill] + [Demo Universe] + [Guided Tour] + [Keyboard Shortcuts] + [New Seed] + [Inspect Drawer]`. 7 buttons with different functions (diagnostic, demo, help, lifecycle, sidebar toggle) sitting in a continuous line.
- **Stage 3 Candidate Card Body:** `[Dimensions Grid] + [Trade-offs Box] + [Exploration Meters] + [Entity Media Section with Aspect Ratio Select and Prompt Text]`. Media generation is clustered into a candidate card before the world is chosen.
- **Stage 4 Configuration Box:** `[Priorities Chips] + [Custom Priority Input] + [Exclusions Checklist] + [Custom Exclusion Input] + [Rationale Textarea] + [Directives Textarea] + [HOZ Theme Input] + [HOZ Motivation Input] + [HOZ Conflict Input]`. 9 distinct input widgets crammed into a single bordered card.
- **Canvas Bottom:** `[AI Provider Engine Card] + [Persistence Layer Card] + [Cloud Object Storage Card]`. Clustered at the bottom of every stage canvas regardless of user context.

---

## 7. Phase F: Nested Card Audit (Anti-Pattern Hunt)

### The "Card Inside Card Inside Card" Problem
In multiple views, PRAROHA currently nests bordered containers 3 to 4 levels deep:

```
LEVEL 0: Page / Canvas (bg-[#FAF5EE])
  └── LEVEL 1: Section Container (bg-[#F8F4E8], border-[#D8CCB7])
        └── LEVEL 2: Subsection Card (bg-[#F2EBDD], border-[#D8CCB7])
              └── LEVEL 3: Attribute Card (bg-[#FAF5EE], border-[#E8DCC8])
                    └── LEVEL 4: Nested Item / Chip (bg-[#DDE2D2])
```

### Audit & Flattening Recommendations:

| Location | Current Nesting Chain | Verdict | Recommended Flattening Strategy |
|---|---|---|---|
| **Stage 4: Selection Canvas** | Canvas -> Selection Panel -> Section 5 HOZ Panel -> Zone Input Card | **FLATTEN (P0)** | Remove Selection Panel outer container. Present Human-Only Zones as clean, borderless editorial sections with typography headings and subtle background tint. |
| **Stage 2: Understand** | Canvas -> 2-col Grid -> Tone/Themes Card -> Tag Pills | **MERGE & FLATTEN (P1)** | Flatten the 4 separate cards into a two-column editorial spread like an open notebook page: left column for Core Premise & Philosophy, right column for Living Elements & Rules. |
| **Stage 5: Codex Cards** | Canvas -> Codex Container -> Character Card -> Media Section -> Scrubber Bar | **FLATTEN (P1)** | Keep Character Card as single clean container. Integrate portrait, voice player, and traits with whitespace separation instead of separate bordered inner boxes. |
| **Stage 6: Traceability** | Canvas -> DAG Lane Container -> Node Card -> Origin Badge | **BALANCED (KEEP)** | The DAG requires distinct nodes for visual graph representation. Keep nodes as clean single-layer cards. |
| **Stage 7: Refine** | Canvas -> 7-col Container -> Audit Log Container -> Revision Card -> Diff Notes Box -> Snapshot Diff Box | **FLATTEN (P1)** | Eliminate outer container. Render audit log as a clean editorial timeline feed with subtle vertical timeline spine. |
| **All Stages (Canvas Bottom)** | Canvas -> Architecture Status Grid -> 3 Engine Cards | **REMOVE (P0)** | Remove the 3 cards entirely from the creative canvas. |

---

## 8. Phase G: Spacing & Rhythm Audit

### Spacing Breakdown:

| UI Dimension | Current Value | Measurement Status | UX Rationale |
|---|---|---|---|
| **Page Outer Padding** | `p-4 sm:p-6 lg:p-10` | **BALANCED** | Gives comfortable breathing room from the fixed sidebar and top bar. |
| **TopBar Height** | `h-15 sm:h-16` (60–64px) | **BALANCED** | Appropriate height, but overfilled horizontally with controls. |
| **StageProgress Height** | `py-2` (approx 60px) | **BALANCED Desktop / TOO TIGHT Mobile** | On mobile, the 7-stage horizontal row overflows awkwardly. |
| **Card Inner Padding** | `p-6 sm:p-8` | **TOO LOOSE in nested cards** | When cards nest 3 levels deep, `p-6` + `p-4` + `p-3` robs 60% of the horizontal space from actual text. |
| **Card-to-Card Gap** | `gap-6` (24px) | **BALANCED** | Good rhythm between major content cards. |
| **Heading to Body Gap** | `space-y-1.5` to `space-y-2` | **BALANCED** | Clear relationship between Cormorant titles and Inter descriptions. |
| **Pill & Chip Spacing** | `gap-1.5` to `gap-2` | **TOO TIGHT when >8 pills** | Dense pill clusters create visual "grit" that fatigues the eye. Needs grouping into semantic clusters. |
| **Modal Padding** | `p-6 sm:p-8` | **BALANCED** | Modals feel like premium stationery journals. |
| **Drawer Padding** | `p-4 sm:p-5` (w-80 / w-96) | **TOO TIGHT for complex DAG trails** | Lineage step cards feel squeezed in a 320px drawer. |

---

## 9. Phase H: Density Ratio Assessment

| Section | Current Density Rating | Target Density Rating | Recommended Intervention |
|---|---|---|---|
| **TopBar** | **OVERLOADED** | **BALANCED** | Relocate technical badges; collapse utilities into overflow menu. |
| **Stage 1 (Home)** | **BALANCED** (excluding bottom) | **BALANCED** | Remove bottom architecture cards; separate demo launcher. |
| **Stage 2 (Understand)** | **HIGH DENSITY** | **COMFORTABLE EDITORIAL** | Flatten 4 boxed cards into open two-column editorial spread. |
| **Stage 3 (Worlds)** | **OVERLOADED** | **BALANCED COMPARATIVE** | Collapse metrics into progressive disclosure; remove pre-selection media tools. |
| **Stage 4 (Choose)** | **OVERLOADED** | **FOCUSED CREATIVE GATE** | Split into Selection confirmation + Human-Only Zones; collapse secondary fields. |
| **Stage 5 (Codex)** | **HIGH DENSITY** | **RICH JOURNAL CODEX** | Remove duplicate Mutation/Replay tabs and top launcher buttons. |
| **Stage 6 (Trace)** | **BALANCED** | **BALANCED** | Merge dual filter bars into a single clean filter line. |
| **Stage 7 (Refine)** | **HIGH DENSITY** | **BALANCED TWO-COLUMN** | Balance 5/7 column split to responsive stack on tablets; clean revision timeline. |

---

## 10. Phase I: Action Hierarchy Audit

### The "One Dominant Action Per Section" Rule

Every view must have exactly **ONE** visually dominant primary action button. Secondary actions must use outline or ghost styles; tertiary actions must be links or icons.

| Screen | Dominant Primary Action (Filled Sage) | Secondary Actions (Warm Paper / Subtle Border) | Tertiary / Utility (Icon / Ghost / Link) |
|---|---|---|---|
| **Stage 1: Seed** | **Extract Seed DNA** (`ArrowRight` circular button) | Preset Seed chips | Instant Demo link, Clear input |
| **Stage 2: Understand** | **Generate 3 Worlds** (`btn-sage-primary`) | Explore Potential Map (`btn-outline`) | Export JSON, Refine Seed |
| **Stage 3: Worlds** | **Proceed to Selection (Stage 4)** (`btn-sage-primary`) | Re-generate Worlds (`btn-outline`) | Card selection clicks, View DNA Full link |
| **Stage 4: Choose** | **Confirm & Lock Direction** (`btn-sage-primary`) | Lock Parameters (HOZ) | Suggest from World, Add Priority, Add Guardrail |
| **Stage 5: Codex** | **Unfold Universe** (Pre-unfold) / **Create Scene** (Unfolded) | Media generation buttons on individual cards | Copy visual prompt, Inspect DNA link |
| **Stage 6: Trace** | **Sync Graph** (or Node Inspection click) | Filter Focus pills | Zoom in/out, Reset Highlighting |
| **Stage 7: Refine** | **Fork Timeline Branch** | Save Storage Snapshot | Export Bundle (.json), Switch Branch |

---

## 11. Phase J: TopBar De-Cluttering & Structural Redesign

### Current State (10 Controls at Same Visual Level):
```
[Logo + Praroha + Tattva 2 + Subtitle] [Branch Dropdown]   ---   [AI Provider Pill] [Demo Universe] [Guided Tour] [Help (?)] [New Seed] [Inspect]
```

### Proposed Redesign (One Section = One Purpose):
The TopBar must answer three questions in 2 seconds:
1. **Where am I?** -> `Praroha · Seed → Universe`
2. **What am I working on?** -> `Active Project Title` + `Timeline Branch`
3. **What is my context inspector?** -> `Inspect` button

```
LEFT:
  ├── Brand Wordmark & Tattva 2 Pill (Compact)
  └── Active Project Title & Branch Switcher Dropdown (Merged Pill)

RIGHT:
  ├── Primary Stage Action or Status (Contextual)
  ├── Inspect Drawer Toggle (Sage Pill Button)
  └── Workspace Menu (`···` Dropdown containing: Guided Tour, Keyboard Shortcuts, Reset Workspace, Demo Universe, System Diagnostics)
```
- **Result:** Reduces 10 controls down to **3 clean interactive anchors** on desktop, with zero visual clutter.

---

## 12. Phase K: Stage Progress Rail Composition

### The Problem:
`StageProgressHeader` currently renders all 7 stages as 44px pill buttons with numbers, labels, descriptions, and chevrons. Across viewports under 1280px, it causes horizontal scrolling and consumes excessive vertical and mental space.

### Responsive Composition Strategy:

```
DESKTOP (>= 1280px):
[ 1. Seed ] -> [ 2. Understand ] -> [ 3. 3 Worlds ] -> [ 4. Choose ] -> [ 5. Unfold ] -> [ 6. Trace ] -> [ 7. Refine ]
Full 7-step botanical progress rail with active state, checkmarks, and subtle chevrons.

TABLET (768px - 1279px):
Compact pill rail showing stage number + label (descriptions hidden), gracefully centered.

MOBILE (< 768px):
Editorial Stage Tracker:
"STAGE 4 OF 7 · CHOOSE"
[  ••••●••  ] (Subtle botanical seed-dot progression bar)
Tapping opens a lightweight bottom sheet for direct stage navigation if unlocked.
```
- **Result:** Complete elimination of awkward horizontal overflow on mobile; zero cognitive competition with the main creative canvas.

---

## 13. Phase L: Responsive Composition Audit (6 Viewports)

| Viewport | Current Behavior | Problem Identified | Required Re-composition Strategy |
|---|---|---|---|
| **1440px (Desktop Large)** | 3-column world grids stretch; cards can reach 1200px+ height | Excessive vertical space consumed by tall candidate cards | Cap max-width on text columns; use horizontal tabbed/split views for dense card metrics. |
| **1280px (Desktop Medium)** | Stage progress rail begins crowding TopBar | Header elements start colliding | Collapse TopBar utilities into overflow menu; shorten stage descriptions. |
| **1024px (Tablet Landscape)** | 3 candidate columns become very narrow (~280px) | Candidate cards become uncomfortably narrow vertical pillars | Recompose 3-column grid into a **2-column + 1 full-width** or **horizontal swipeable card carousel** with clear radio selectors. |
| **768px (Tablet Portrait)** | Stage 7 5/7 column split gets crushed; DAG lanes overflow | Dual-column layouts become unreadable | Stack 12-col grids into full-width sequential sections: primary action on top, historical logs below. |
| **390px (Mobile Phone)** | 7-stage header scrolls offscreen; 9 nested cards stack indefinitely | Users scroll through 4000px of vertical cards to reach actions | Replace 7-stage rail with "Stage X of 7" tracker; pin primary progression action to sticky bottom bar; collapse secondary cards into accordions. |
| **360px (Small Mobile)** | Horizontal overflow risk on wide table headers or toolbars | Toolbars wrap into 4 awkward rows | Convert toolbars to single dropdown select; collapse all chips into badge counts. |

---

## 14. Phase M: Comprehensive Remove / Merge / Move / Collapse Master Table

| Component | Current Problem | Action | Architectural & UX Reason | Priority |
|---|---|---|---|---|
| **Bottom Architecture Cards** (AI, DB, Storage) | Renders internal backend/database diagnostics at the bottom of every stage canvas | **REMOVE** | PRAROHA is a creative journal, not a developer dashboard. System status belongs in a modal or settings. | **P0** |
| **Candidate Card Media Section** (Stage 3) | Generates images for candidates before the user has even chosen a world | **REMOVE** | Generates premature media waste; clutters candidate cards during high-level direction comparison. | **P0** |
| **Duplicate Stage 5 Launchers** (What If & Replay in Codex Header) | Header buttons pull user away from Codex and duplicate Stage 7 features | **REMOVE** | Breaks stage progression logic. Mutation Lab and Counterfactual Replay belong strictly to Stage 7. | **P0** |
| **TopBar Control Clutter** (6 separate utility buttons on right) | AI status, Tour, Demo, Help, Reset, Inspect crowd the header | **MERGE & COLLAPSE** | Merge Tour, Demo, Help, and Reset into a single clean `···` workspace menu. Keep only Branch, Inspect, and Brand. | **P1** |
| **Decision DNA & HOZ in Stage 4** | 5 distinct sub-sections crammed into one massive 1400px card | **SPLIT & REDESIGN** | Split into two clean progressive steps: 1. Confirm Chosen Direction & Rationale; 2. Lock Human-Only Zones. | **P1** |
| **Seed DNA 4-Card Grid** (Stage 2) | Tone, Themes, Entities, Constraints split into 4 separate boxed cards | **MERGE & FLATTEN** | Merge into a unified, elegant 2-column editorial notebook layout with typographic headers rather than heavy card boxes. | **P1** |
| **Exploration Profile Metrics** in Stage 3 Cards | 4 progress bars (Seed Fidelity, Novelty, Distance, Feasibility) add visual noise | **COLLAPSE** | Collapse into an expandable "Exploration Metrics" disclosure on the candidate card. | **P1** |
| **Dual Filter Toolbars in Stage 6** | Filter Focus pills + Origin Tier toolbar stacked on top of DAG | **MERGE** | Combine into a single unified filter row with a clean origin dropdown. | **P2** |
| **StageProgressHeader on Mobile** | 7 horizontal buttons overflow and scroll offscreen | **RESTRUCTURE** | On mobile (<768px), display a clean "Stage X of 7: Name" badge with a progress indicator and tap-to-switch drawer. | **P1** |
| **Model & Schema Badges in Stage 2** | `Engine: gemini` and `Schema v1.0` pills sit above the seed quote | **MOVE** | Move to footer or info tooltip. Creative content takes visual precedence. | **P2** |
| **Duplicate Stage 3 CTAs** | "Proceed to Stage 4" exists both in the header and the bottom banner | **REMOVE DUPLICATE** | Keep one dominant CTA in the header; replace bottom banner with subtle navigation helper. | **P2** |
| **Stage 7 Direct Refinement Launchers** | Small card with character/scene refinement buttons duplicates Stage 5 tools | **MERGE** | Integrate refinement triggers directly into the audit log items or branch editor. | **P2** |

---

## 15. Phase N & O: PRAROHA Botanical Design Language Alignment

### Editorial & Visual Rules for the Upcoming Redesign:
1. **One Primary Idea per Section:** A card or section must not mix generation, configuration, audit logging, and diagnostics.
2. **One Dominant Action per Viewport:** Use the rich, grounded Sage green (`bg-[#355A46] text-[#F8F4E8]`) exclusively for the single primary step forward. All others must be quiet paper buttons (`bg-[#F2EBDD] text-[#294B3A] border-[#D8CCB7]`).
3. **Typography Before Boxes:** Use Cormorant Garamond hierarchy and generous whitespace to create grouping, rather than wrapping everything in borders and cards.
4. **Whitespace Creates Hierarchy:** Generous 32–48px vertical rhythm between editorial sections makes dense creative text feel calm, inviting, and premium.
5. **Color Used with Restraint:** Sage is life and growth (primary); Terracotta is alert or boundary (guardrails); Plum is deep lore and dynamics; Gold is creator lock and provenance. Never use decorative color without semantic purpose.

---

## 16. Phase Q: Issue Priority Matrix

### P0 — Major Usability & Architectural Problems (Must Fix First):
1. **Remove Canvas Bottom Architecture Cards:** AI Engine, Persistence, and Storage cards currently pollute all 7 stage canvases.
2. **Remove Premature Media Tools from Stage 3:** Candidate cards contain full image generators before world selection.
3. **De-clutter Stage 4 Decision DNA & HOZ:** Split the 5-part form into clean, focused steps with primary lock CTA prominent.
4. **Remove Duplicate Mutation & Replay Tabs from Stage 5:** Codex should focus strictly on Bible, Characters, and Scenes.

### P1 — Significant Visual & Composition Problems (Core Redesign):
5. **TopBar Simplification:** Reduce 10 controls to Brand, Branch, Inspect, and an overflow menu.
6. **Mobile Stage Progress Re-composition:** Replace horizontal 7-button rail with clean "Stage X of 7" tracker on small screens.
7. **Flatten Stage 2 Seed DNA Cards:** Replace 4 heavy card boxes with a two-column open journal layout.
8. **Collapse Stage 3 Candidate Metrics:** Hide detailed exploration meters behind a clean progressive disclosure.

### P2 — Noticeable Polish & Rhythm Issues:
9. **Merge Stage 6 Dual Filter Bars:** Combine focus pills and origin badges into one cohesive filter toolbar.
10. **Rebalance Stage 7 Tablet Layout:** Stack 5/7 column layout into sequential blocks on viewports below 1280px.
11. **Relocate Schema and Engine Pills:** Demote model names and schema versions to subtle metadata in Stage 2.

### P3 — Minor Refinements:
12. **Micro-typography Spacing:** Fine-tune badge heights and chip margins across modals and drawers.
13. **Subtle Leaf Transitions:** Ensure Framer Motion springs use consistent 180ms ease across all disclosures.

---

## 17. Phase R: Recommended Implementation Order for Phase 30+

When implementation commences in the next phase, work should execute in the following disciplined waves:

- **Wave 1: Canvas Cleanup & De-cluttering (Quick P0 Wins)**
  - Remove the 3 bottom Architecture Cards from `WorkspaceCanvas.tsx`.
  - Remove premature `EntityMediaSection` from `WorldCandidateCard.tsx` in Stage 3.
  - Remove duplicate Mutation and Replay tabs from `UniverseCodexCanvas.tsx`.
  - Remove top header launcher buttons from `UniverseCodexCanvas.tsx`.

- **Wave 2: Global Navigation & Shell Simplification**
  - Redesign `TopBar.tsx`: Merge branch selector, keep Inspect button, move Tour/Shortcuts/Demo/Reset into a clean `···` overflow menu.
  - Redesign `StageProgressHeader.tsx`: Implement the mobile "Stage X of 7" tracker with bottom sheet.

- **Wave 3: Stage 2 & 4 Composition Refactoring**
  - Refactor `SeedDnaViewer.tsx`: Flatten the 4 boxed cards into a two-column botanical notebook layout.
  - Refactor `WorldSelectionCanvas.tsx`: Split into a clean Selection card + a dedicated, prominent Human-Only Zones section.

- **Wave 4: Stage 3 & 5 Polish & Responsive Re-composition**
  - Collapse exploration metrics in `WorldCandidateCard.tsx`.
  - Streamline `UniverseCodexCanvas.tsx` header and strip layouts.
  - Audit and verify all viewports (1440, 1024, 768, 390) with automated Playwright tests.

---

## 18. Audit Completion Declaration

**AUDIT COMPLETE.**
- Artifact written: `.planning/phases/30-ui-composition-audit/30-01-UI-AUDIT.md`
- Codebase modifications: **0 files modified in `frontend/src` (Zero UI changes applied)**.
- System is in strict audit compliance and awaiting user review.
