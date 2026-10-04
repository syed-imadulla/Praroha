from typing import Any, Dict, List
from backend.app.providers.base import AIProvider

CANONICAL_SEED_DNA: Dict[str, Any] = {
    "premise": "An innocent protagonist uncovers a submerged, lost human or non-human settlement hidden in the oceanic depths.",
    "themes": [
        "Wonder vs. danger",
        "Ancient knowledge",
        "Preservation vs. exploitation",
        "Isolation",
        "Lost history",
    ],
    "entities": [
        "The Child",
        "Submersible / Diving apparatus",
        "The Sunken City",
        "Ocean Wildlife",
        "Ancient Relics",
    ],
    "constraints": [
        "No modern surface military intervention",
        "Focus on discovery and mystery rather than warfare",
    ],
    "tone": "Awe-inspiring, melancholic, suspenseful",
    "domain_keywords": [
        "Underwater",
        "Sunken ruins",
        "Bioluminescence",
        "Ancient technology",
        "Marine exploration",
    ],
}

CANONICAL_WORLDS: List[Dict[str, Any]] = [
    {
        "id": "world-1",
        "title": "Lost Civilization",
        "archetype": "Lost Civilization (Archaeological / Mythic)",
        "concept": "Classical high-technology or mystical civilization submerged millennia ago due to cataclysm.",
        "aesthetic": "Ancient monumental architecture, drowned marble columns, golden gears, silent grand halls submerged in deep blue waters.",
        "core_tension": "Decoding the technology of ancestors before deep-sea pressure compromises the ruins or greedy surface scavengers locate it.",
        "trade_offs": "Deep historical lore and archaeological mystery; less biological weirdness.",
        "key_visual": "A lone child in a copper diving bell illuminating a 40-foot marble library archway covered in barnacles.",
    },
    {
        "id": "world-2",
        "title": "Bio-City",
        "archetype": "Bio-City (Symbiotic / Ecological)",
        "concept": "A living city grown from modified coral, bioluminescent siphonophores, and abyssal organisms.",
        "aesthetic": "Organic curves, pulsing cyan and amber glow, underwater breathable air bubbles, living architecture.",
        "core_tension": "The child discovers that the city is dying because surface runoff is poisoning the coral nervous system.",
        "trade_offs": "High visual novelty and strong ecological theme; requires explaining biological survival mechanics.",
        "key_visual": "Towering coral spires pulsing with turquoise light inside an atmospheric pressure bubble amidst deep sea trenches.",
    },
    {
        "id": "world-3",
        "title": "Time Capsule",
        "archetype": "Time Capsule (Retro-Futuristic / Cold War)",
        "concept": "A sealed 1960s experimental geodesic research sanctuary submerged during nuclear paranoia and forgotten for generations.",
        "aesthetic": "Analog dials, rusting titanium domes, vacuum tubes, amber monitors, mid-century warning signs.",
        "core_tension": "Automated defense protocols treat the child as an intruder, and isolated descendants believe the surface remains incinerated.",
        "trade_offs": "Grounded human drama and psychological tension; smaller physical scale.",
        "key_visual": "Rusted titanium airlock door opening into an eerie hallway lined with flickering vacuum tubes and faded safety posters.",
    },
]


class MockProvider(AIProvider):
    """Mock AI Provider delivering canonical demo fixtures for zero-latency, offline execution."""

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "provider": "mock",
            "model": "deterministic-fixtures-v1",
            "latency_ms": 1,
        }

    async def extract_dna(self, seed: str) -> Dict[str, Any]:
        # Return canonical DNA, including the raw input seed for provenance
        return {
            "raw_seed": seed,
            "seed_dna": CANONICAL_SEED_DNA,
        }

    async def generate_worlds(self, dna: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Return exactly three contrasting candidates
        return CANONICAL_WORLDS

    async def unfold_stage(
        self, stage: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        world_id = context.get("world_id", "world-1")
        selected_world = next(
            (w for w in CANONICAL_WORLDS if w["id"] == world_id), CANONICAL_WORLDS[0]
        )

        if stage == "bible":
            return {
                "world_id": world_id,
                "world_title": selected_world["title"],
                "geography": "Continental abyssal plain, 3,200 meters below sea level inside the Kermadec Trench.",
                "factions": [
                    {"name": "The Deep Keepers", "role": "Sub-surface guardians preserving ancient knowledge"},
                    {"name": "Surface Harvesters", "role": "Distant drilling consortiums seeking rare geothermal minerals"},
                ],
                "rules_of_physics": "Ambient pressure handled by geothermal pressure dampening fields; water is ionized for luminescence.",
            }
        elif stage == "characters":
            return {
                "world_id": world_id,
                "characters": [
                    {
                        "name": "Kiran (The Child)",
                        "role": "Protagonist",
                        "archetype": "Curious Explorer",
                        "motivation": "Recover his mother's lost research vessel",
                        "conflict": "Must choose between cataloging the ruins or protecting them from discovery",
                    },
                    {
                        "name": "Sentry Unit 7 ('Nereus')",
                        "role": "Guide / Foil",
                        "archetype": "Ancient Guardian Construct",
                        "motivation": "Maintain city equilibrium until creator return",
                        "conflict": "Power reserves dropping below critical threshold",
                    },
                ],
            }
        elif stage == "scenes":
            return {
                "world_id": world_id,
                "scenes": [
                    {
                        "title": "Scene 1: The Descent",
                        "setting": "Flooded trench entrance",
                        "conflict": "The submersible's main ballast pump fails as strange blue lights flicker in the abyss.",
                        "dramatic_question": "Will Kiran breach the airlock before the pressure crushes the cockpit?",
                    },
                    {
                        "title": "Scene 2: The Hall of Living Thought",
                        "setting": "Dry atrium inside the submerged central spire",
                        "conflict": "Nereus activates and demands identification in an extinct dialect.",
                        "dramatic_question": "Can Kiran communicate peaceful intent before defensive countermeasures engage?",
                    },
                ],
            }
        else:
            return {
                "stage": stage,
                "world_id": world_id,
                "content": f"Unfolded content for stage '{stage}' in world '{selected_world['title']}'.",
            }
