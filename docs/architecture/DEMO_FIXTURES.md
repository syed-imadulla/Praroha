# Seed Unfold — Canonical Demo Fixtures

To ensure rock-solid, zero-latency demonstrations and offline development capability, Seed Unfold maintains canonical fixture data for testing and presentations.

---

## 1. Canonical Demo Seed

> **Seed**: *"A child discovers a forgotten city beneath the ocean."*

### Seed DNA Extraction (Deterministic Fixture)
- **Core Premise**: An innocent protagonist uncovers an submerged, lost human or non-human settlement hidden in the oceanic depths.
- **Themes**: Wonder vs. danger, ancient knowledge, preservation vs. exploitation, isolation, lost history.
- **Entities**: The Child, Submersible/Diving apparatus, The Sunken City, Ocean Wildlife, Ancient Relics.
- **Constraints**: No modern surface military intervention; focus on discovery and mystery rather than warfare.
- **Tone**: Awe-inspiring, melancholic, suspenseful.
- **Domain Keywords**: Underwater, sunken ruins, bioluminescence, ancient technology, marine exploration.

---

## 2. The Three Demo Worlds

The branching engine expands this seed into **exactly three** distinct, creative directions:

### World 1: Lost Civilization (Archaeological / Mythic)
- **Concept**: Classical high-technology or mystical civilization submerged millennia ago due to cataclysm.
- **Aesthetic**: Ancient monumental architecture, drowned marble columns, golden gears, silent grand halls submerged in deep blue waters.
- **Core Tension**: Decoding the technology of ancestors before deep-sea pressure compromises the ruins or greedy surface scavengers locate it.
- **Trade-offs**: Deep historical lore and archeological mystery; less biological weirdness.

### World 2: Bio-City (Symbiotic / Ecological)
- **Concept**: A living city grown from modified coral, bioluminescent siphonophores, and abyssal organisms.
- **Aesthetic**: Organic curves, pulsing cyan and amber glow, underwater breathable air bubbles, living architecture.
- **Core Tension**: The child discovers that the city is dying because surface runoff is poisoning the coral nervous system.
- **Trade-offs**: High visual novelty and strong ecological theme; requires explaining biological survival mechanics.

### World 3: Time Capsule (Retro-Futuristic / Cold War)
- **Concept**: A sealed 1960s experimental geodesic research sanctuary submerged during a nuclear paranoia crisis and forgotten for generations.
- **Aesthetic**: Analog dials, rusting titanium domes, vacuum tubes, amber monitors, mid-century propaganda posters.
- **Core Tension**: Automated defense protocols still treat the child as an intruder, and isolated descendants believe the surface is still incinerated.
- **Trade-offs**: Grounded human drama and psychological tension; smaller physical scale.

---

## 3. Fixture Role & Usage
- These fixtures act as deterministic fallbacks when external LLM APIs timeout or exceed quotas during live hackathon demos.
- They serve as regression test fixtures for lineage graph rendering and UI testing.
- They are fixtures, not system limits: any arbitrary seed entered by the user produces dynamically generated worlds and DNA.
