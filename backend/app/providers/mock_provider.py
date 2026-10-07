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
        "index": 1,
        "title": "Lost Civilization",
        "archetype": "Lost Civilization (Archaeological / Mythic)",
        "concept": "Classical high-technology or mystical civilization submerged millennia ago due to cataclysm.",
        "aesthetic": "Ancient monumental architecture, drowned marble columns, golden gears, silent grand halls submerged in deep blue waters.",
        "core_tension": "Decoding the technology of ancestors before deep-sea pressure compromises the ruins or greedy surface scavengers locate it.",
        "trade_offs": "Deep historical lore and archaeological mystery; less biological weirdness.",
        "key_visual": "A lone child in a copper diving bell illuminating a 40-foot marble library archway covered in barnacles.",
        "divergence_archetype": "familiar",
        "exploration_profile": {
            "seed_fidelity": 92,
            "novelty": 54,
            "conceptual_distance": 28,
            "feasibility": 88,
            "summary": "Direct, mythic realization of submerged ruins with high historical grounding.",
        },
        "emphasized_potential_labels": [
            "Child Protagonist",
            "Forgotten Sunken Metropolis",
            "Abyssal Marine Environment",
        ],
    },
    {
        "id": "world-2",
        "index": 2,
        "title": "Bio-City",
        "archetype": "Bio-City (Symbiotic / Ecological)",
        "concept": "A living city grown from modified coral, bioluminescent siphonophores, and abyssal organisms.",
        "aesthetic": "Organic curves, pulsing cyan and amber glow, underwater breathable air bubbles, living architecture.",
        "core_tension": "The child discovers that the city is dying because surface runoff is poisoning the coral nervous system.",
        "trade_offs": "High visual novelty and strong ecological theme; requires explaining biological survival mechanics.",
        "key_visual": "Towering coral spires pulsing with turquoise light inside an atmospheric pressure bubble amidst deep sea trenches.",
        "divergence_archetype": "radical",
        "exploration_profile": {
            "seed_fidelity": 68,
            "novelty": 94,
            "conceptual_distance": 82,
            "feasibility": 72,
            "summary": "Radical symbiotic mutation transforming urban decay into living, breathing coral nervous systems.",
        },
        "emphasized_potential_labels": [
            "Ancient Symbiotic Technology",
            "Sentient Deep-Sea Ecosystem",
        ],
    },
    {
        "id": "world-3",
        "index": 3,
        "title": "Time Capsule",
        "archetype": "Time Capsule (Retro-Futuristic / Cold War)",
        "concept": "A sealed 1960s experimental geodesic research sanctuary submerged during nuclear paranoia and forgotten for generations.",
        "aesthetic": "Analog dials, rusting titanium domes, vacuum tubes, amber monitors, mid-century warning signs.",
        "core_tension": "Automated defense protocols treat the child as an intruder, and isolated descendants believe the surface remains incinerated.",
        "trade_offs": "Grounded human drama and psychological tension; smaller physical scale.",
        "key_visual": "Rusted titanium airlock door opening into an eerie hallway lined with flickering vacuum tubes and faded safety posters.",
        "divergence_archetype": "inverse",
        "exploration_profile": {
            "seed_fidelity": 58,
            "novelty": 82,
            "conceptual_distance": 88,
            "feasibility": 65,
            "summary": "Conceptual subversion flipping oceanic fantasy into claustrophobic retro-futuristic paranoia.",
        },
        "emphasized_potential_labels": [
            "Archaeological Scavenger Conflict",
            "Surface Ecological Rupture",
        ],
    },
]


CANONICAL_SEED_TEXT = "A child discovers a forgotten city beneath the ocean."

CANONICAL_SEED_POTENTIAL = [
    {
        "label": "Child Protagonist",
        "category": "explicit",
        "confidence": 1.0,
        "source_evidence": "A child",
        "user_status": "pending",
    },
    {
        "label": "Accidental Discovery",
        "category": "explicit",
        "confidence": 1.0,
        "source_evidence": "discovers",
        "user_status": "pending",
    },
    {
        "label": "Forgotten Sunken Metropolis",
        "category": "explicit",
        "confidence": 1.0,
        "source_evidence": "forgotten city",
        "user_status": "pending",
    },
    {
        "label": "Abyssal Marine Environment",
        "category": "explicit",
        "confidence": 1.0,
        "source_evidence": "beneath the ocean",
        "user_status": "pending",
    },
    {
        "label": "Symbiotic Living Architecture",
        "category": "inferred",
        "confidence": 0.88,
        "source_evidence": "deep ocean survival implies non-terrestrial engineering",
        "user_status": "pending",
    },
    {
        "label": "Surface Ecological Rupture",
        "category": "inferred",
        "confidence": 0.75,
        "source_evidence": "abandoned/forgotten status implies rupture between surface and deep",
        "user_status": "pending",
    },
    {
        "label": "Sentient Bioluminescent Ecology",
        "category": "inferred",
        "confidence": 0.82,
        "source_evidence": "deep-sea fauna adaptation around artificial habitat",
        "user_status": "pending",
    },
    {
        "label": "Ancient Technological Heritage",
        "category": "inferred",
        "confidence": 0.78,
        "source_evidence": "city built to withstand extreme hydro-static pressure",
        "user_status": "pending",
    },
    {
        "label": "Who built the submerged sanctuary?",
        "category": "open",
        "confidence": 0.95,
        "source_evidence": "forgotten city origin",
        "user_status": "pending",
    },
    {
        "label": "What power source maintains breathable pressure bubbles?",
        "category": "open",
        "confidence": 0.90,
        "source_evidence": "survival mechanism beneath the ocean",
        "user_status": "pending",
    },
    {
        "label": "Was abandonment forced by cataclysm or voluntary migration?",
        "category": "open",
        "confidence": 0.85,
        "source_evidence": "why it became forgotten",
        "user_status": "pending",
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

    async def extract_potential(
        self, seed: str, dna: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        normalized = seed.strip().lower().rstrip(".")
        if "forgotten city" in normalized and "ocean" in normalized:
            return [dict(item) for item in CANONICAL_SEED_POTENTIAL]

        # Dynamic fallback for arbitrary seeds
        themes = dna.get("themes", []) if isinstance(dna, dict) else []
        entities = dna.get("entities", []) if isinstance(dna, dict) else []
        words = [w for w in seed.split() if len(w) > 3][:4]

        results = []
        for w in words:
            results.append({
                "label": w.capitalize(),
                "category": "explicit",
                "confidence": 0.95,
                "source_evidence": w,
                "user_status": "pending",
            })
        for t in themes[:3]:
            results.append({
                "label": f"Thematic: {t}",
                "category": "inferred",
                "confidence": 0.80,
                "source_evidence": f"theme {t}",
                "user_status": "pending",
            })
        for e in entities[:2]:
            results.append({
                "label": f"Role of {e}",
                "category": "inferred",
                "confidence": 0.75,
                "source_evidence": f"entity {e}",
                "user_status": "pending",
            })
        if not themes and not entities:
            anchor = words[0] if words else "seed"
            results.append({
                "label": f"Emergent dynamic around {anchor}",
                "category": "inferred",
                "confidence": 0.78,
                "source_evidence": f"inferred from {anchor}",
                "user_status": "pending",
            })
        results.append({
            "label": f"What was the catalytic origin of this world?",
            "category": "open",
            "confidence": 0.90,
            "source_evidence": "catalytic premise",
            "user_status": "pending",
        })
        results.append({
            "label": f"What hidden force prevents resolution?",
            "category": "open",
            "confidence": 0.85,
            "source_evidence": "core tension",
            "user_status": "pending",
        })
        return results

    async def generate_worlds(
        self, dna: Dict[str, Any], potential_items: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        raw_seed = (dna.get("raw_seed") or "").strip().lower().rstrip(".")
        if not raw_seed or ("forgotten city" in raw_seed and "ocean" in raw_seed):
            # Deterministically return canonical demo fixtures
            return [dict(w) for w in CANONICAL_WORLDS]

        # Extract accepted items if provided
        accepted_labels = []
        if potential_items:
            accepted_labels = [
                item["label"] for item in potential_items
                if item.get("user_status") == "accepted"
            ]

        premise = dna.get("premise", "An uncharted world of mysterious origins.")
        tone = dna.get("tone", "Atmospheric and evocative")
        themes = dna.get("themes", ["Discovery", "Survival", "Mystery"])
        lead_theme = themes[0] if themes else "Discovery"

        w1_pot = accepted_labels[:2] if accepted_labels else [lead_theme]
        w2_pot = accepted_labels[1:3] if len(accepted_labels) > 1 else accepted_labels[:1]
        w3_pot = accepted_labels[2:4] if len(accepted_labels) > 2 else (accepted_labels[-1:] if accepted_labels else [])

        return [
            {
                "id": "world-1",
                "index": 1,
                "title": f"The Grounded Expanse: {lead_theme}",
                "archetype": f"{lead_theme} (Classical / Grounded)",
                "concept": f"A faithful, evocative expansion of the core premise: {premise}",
                "aesthetic": f"Grounded, rich textures, resonant {tone.lower()} atmosphere.",
                "core_tension": "Preserving traditional continuity while unraveling the central conflict.",
                "trade_offs": "High narrative accessibility and grounding; lower paradigm subversion.",
                "key_visual": f"A panoramic vista illuminating the focal anchor of {premise.lower()}.",
                "divergence_archetype": "familiar",
                "exploration_profile": {
                    "seed_fidelity": 90,
                    "novelty": 55,
                    "conceptual_distance": 30,
                    "feasibility": 85,
                    "summary": "Familiar archetype maximizing direct adherence to the original seed premise.",
                },
                "emphasized_potential_labels": w1_pot,
            },
            {
                "id": "world-2",
                "index": 2,
                "title": "The Metamorphic Nexus",
                "archetype": "Symbiotic Paradigm Shift",
                "concept": f"A radical biological and metaphysical transformation of {premise.lower()}.",
                "aesthetic": "Bioluminescent veins, shimmering crystalline architectures, living organic matter.",
                "core_tension": "The price of radical symbiosis threatens individual human identity.",
                "trade_offs": "Extreme visual and conceptual novelty; requires adapting to unconventional physics.",
                "key_visual": "A towering morphogenetic structure breathing in sync with the atmospheric tide.",
                "divergence_archetype": "radical",
                "exploration_profile": {
                    "seed_fidelity": 65,
                    "novelty": 95,
                    "conceptual_distance": 80,
                    "feasibility": 70,
                    "summary": "Radical archetype transforming premises into an expansive symbiotic ecosystem.",
                },
                "emphasized_potential_labels": w2_pot,
            },
            {
                "id": "world-3",
                "index": 3,
                "title": "The Inverted Sanctuary",
                "archetype": "Subversive Reality Reversal",
                "concept": "An inverse subversion of assumptions: what appeared as safe sanctuary is the ultimate containment crucible.",
                "aesthetic": "Harsh monochromatic brutalism, inverted geometry, stark high-contrast chiaroscuro.",
                "core_tension": "Breaking through the illusion of reality without triggering systemic annihilation.",
                "trade_offs": "Intense psychological stakes and philosophical depth; challenging tonal barrier.",
                "key_visual": "A solitary observer staring upward into a mirror sky that reflects an empty abyss.",
                "divergence_archetype": "inverse",
                "exploration_profile": {
                    "seed_fidelity": 55,
                    "novelty": 85,
                    "conceptual_distance": 92,
                    "feasibility": 60,
                    "summary": "Inverse archetype challenging assumptions through conceptual mirror subversion.",
                },
                "emphasized_potential_labels": w3_pot,
            },
        ]

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

    async def unfold_universe(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Unfold the entire universe (World Bible, Characters, Relationships, Scenes) for the selected world."""
        raw_seed = (context.get("raw_seed") or context.get("seed") or "").strip().lower().rstrip(".")
        selected_world = context.get("selected_world") or {}
        world_title = (selected_world.get("title") or "").strip().lower()

        # Deterministic fixtures for canonical ocean seed: "a child discovers a forgotten city beneath the ocean"
        is_canonical_seed = (raw_seed == "a child discovers a forgotten city beneath the ocean")

        if is_canonical_seed and "lost civilization" in world_title:
            return {
                "world_bible": {
                    "geography": "A sunken cyclopean basalt plateau 4,000m beneath the southern sea, surrounded by towering obsidian monoliths.",
                    "physics_rules": "Ancient gravimetric wards maintain dry breathable pockets inside carved stone temples beneath crushing hydrostatic pressure.",
                    "history_timeline": [
                        {"era": "The Cataclysm (Year -1200)", "event": "The Precursor empire sank beneath the waves following the collapse of the mantle conduit."},
                        {"era": "The Silent Sleep (Year -1200 to -50)", "event": "Automaton guardians maintained dormant basalt scriptoriums in stasis."},
                        {"era": "The Rediscovery (Year 0)", "event": "First submersible probes breached the outer perimeter wards."},
                    ],
                    "factions": [
                        {"name": "Keepers of the Drowned Archive", "role": "Order of preservationist scholars", "agenda": "Decipher ancient tablets without triggering self-destruct wards."},
                        {"name": "Trench Scavengers", "role": "Mercenary salvage crews", "agenda": "Pry gravimetric power cores from temple pillars for surface black markets."},
                    ],
                    "canon_facts": [
                        "The architecture is carved from seamless black basalt that does not erode in saltwater.",
                        "Luminescent runes flicker when sentient beings enter temple halls.",
                        "The city's central reservoir contains the preserved memories of the Precursors.",
                    ],
                    "key_locations": [
                        {
                            "name": "The Obsidian Archive",
                            "description": "A subterranean library carved from reflective black volcanic glass where thousands of engraved titanium scrolls rest in vacuum niches.",
                            "visual_prompt": "Cinematic shot inside an ancient submerged monolithic obsidian library, towering black basalt pillars inscribed with glowing turquoise hieroglyphs, dry breathable atmospheric bubble, dust motes floating in light beams, dramatic shadows, 8k resolution",
                        },
                        {
                            "name": "The Sunken Plaza of Kings",
                            "description": "A vast sunken courtyard lined with colossal statues of ancient sovereigns wearing ceremonial diving helmets.",
                            "visual_prompt": "Wide angle deep sea landscape, enormous ancient basalt statues of crowned kings standing on a sunken ocean courtyard, searchlights from underwater submersibles cutting through dark water, schools of deep-sea fish, epic scale, photorealistic",
                        },
                    ],
                    "visual_style_prompt": "Monolithic ancient architectural style, black polished basalt, turquoise and cyan glowing runes, deep shadows, atmospheric mist within dry cavernous temples, ancient mystery.",
                },
                "characters": [
                    {
                        "name": "Matthew Voss",
                        "role": "Lead Relic Diver",
                        "archetype": "Veteran Explorer",
                        "motivation": "Recover the Precursor chronometer to prove the ancient civilization's existence",
                        "core_conflict": "Hunted by salvage syndicates eager to monetize his discoveries",
                        "visual_prompt": "Weathered deep-sea explorer with salt-and-pepper beard, retro-futuristic pressurized brass diving helmet held under arm, determined eyes, dramatic key light, cinematic portrait",
                    },
                    {
                        "name": "Archon Theron",
                        "role": "Automaton Archivist",
                        "archetype": "Ancient Machine Custodian",
                        "motivation": "Protect the central memory reservoir from cognitive corruption",
                        "core_conflict": "Its core logic matrix is degrading after a millennium of solitary vigil",
                        "visual_prompt": "Ancient mechanical automaton with ornate bronze and obsidian plating, glowing turquoise ocular lenses, ancient script engraved across chassis, standing poised and timeless, atmospheric lighting",
                    },
                    {
                        "name": "Lyra",
                        "role": "Archaeologist & Cartographer",
                        "archetype": "Scholarly Cryptographer",
                        "motivation": "Translate the final inscription of the Drowned Archive before water breaches the seal",
                        "core_conflict": "Torn between scholarly ethics and Matthew's urgent evacuation demands",
                        "visual_prompt": "Intelligent young woman in waterproof expedition field jumpsuit, holding an illuminated holographic translation slate, intense analytical gaze, volumetric blue cavern lighting",
                    },
                ],
                "relationships": [
                    {
                        "source_character_name": "Matthew Voss",
                        "target_character_name": "Lyra",
                        "relation_type": "Expedition Partners",
                        "dynamic_description": "Matthew provides survival intuition and diving expertise while Lyra deciphers navigational runes.",
                    },
                    {
                        "source_character_name": "Matthew Voss",
                        "target_character_name": "Archon Theron",
                        "relation_type": "Tense Parley",
                        "dynamic_description": "Theron views Matthew as a potential looter, while Matthew attempts to convince Theron to share the archive.",
                    },
                    {
                        "source_character_name": "Lyra",
                        "target_character_name": "Archon Theron",
                        "relation_type": "Intellectual Reverence",
                        "dynamic_description": "Theron recognizes Lyra's linguistic aptitude and grants her conditional access to the sacred scrolls.",
                    },
                ],
                "scenes": [
                    {
                        "scene_number": 1,
                        "title": "Unlocking the Basalt Vault",
                        "location_setting": "The Obsidian Archive outer threshold",
                        "characters_involved": ["Matthew Voss", "Lyra"],
                        "dramatic_question": "Will Lyra input the correct runic cipher before the structural pressure seal collapses?",
                        "conflict_narrative": "A warning tremor shakes the vault as saltwater seeps through ceiling fractures; the cipher glyphs begin to re-align.",
                        "pivotal_outcome": "The massive stone door slides open into a dry, breathless hall of golden archives.",
                        "visual_prompt": "Dramatic underwater ruin scene, two divers in heavy gear standing before an immense basalt portal covered in glowing glyphs, bubbles rising in searchlight beams, cinematic composition",
                    },
                    {
                        "scene_number": 2,
                        "title": "The Archivist's Judgment",
                        "location_setting": "The Central Memory Scriptorium",
                        "characters_involved": ["Matthew Voss", "Archon Theron"],
                        "dramatic_question": "Can Matthew prove pure intent before Theron's defense wards incinerate the chamber?",
                        "conflict_narrative": "Theron activates ancient gravimetric defenses, lifting heavy stone slabs into mid-air around the intruders.",
                        "pivotal_outcome": "Matthew lowers his pulse-torch and offers a lost precursor relic, pacifying the ancient guardian.",
                        "visual_prompt": "Tense confrontation in a dry submerged temple, an imposing obsidian automaton facing a cautious deep-sea diver, floating stone fragments suspended by antigravity fields, cinematic",
                    },
                ],
            }

        elif is_canonical_seed and "time capsule" in world_title:
            return {
                "world_bible": {
                    "geography": "A modular geodesic dome colony anchored on a volcanic undersea ridge at 2,800m depth.",
                    "physics_rules": "Closed-loop atmospheric scrubbers and fusion thermal taps; pressure differentials require airlock cycling between sectors.",
                    "history_timeline": [
                        {"era": "Project Aegis Seal (Year 1982)", "event": "Four hundred scientists and families sealed themselves inside during a suspected surface apocalypse."},
                        {"era": "The Silent Decades (Year 2005)", "event": "All surface radio transmissions ceased, cementing isolationist dogmatism."},
                        {"era": "The Crack (Year 2038)", "event": "Sector 4's outer bulkhead cracked, forcing contact with uncharted trench phenomena."},
                    ],
                    "factions": [
                        {"name": "Preservation Council", "role": "Ruling civic hierarchy", "agenda": "Maintain strict resource rationing and enforce total surface quarantine."},
                        {"name": "Resurfacing Pact", "role": "Underground dissident network", "agenda": "Repair long-range radio antennas and prepare ascent submersibles."},
                    ],
                    "canon_facts": [
                        "No citizen born after 1982 has ever seen the sky or natural sunlight.",
                        "Hydroponic yeast paste and algae rations are strictly controlled by biometric cards.",
                        "The colony's emergency protocols forbid opening exterior airlocks under penalty of exile.",
                    ],
                    "key_locations": [
                        {
                            "name": "Sector 4 Hydroponics",
                            "description": "A multi-tiered spherical greenhouse dome bathed in artificial violet ultraviolet grow-lamps, sustaining the colony's fragile food supply.",
                            "visual_prompt": "Interior of an expansive retro-futuristic geodesic underwater greenhouse, rows of vertical hydroponic greens illuminated by vibrant magenta and purple grow lights, condensation dripping down reinforced curved glass windows overlooking dark ocean, 8k cinematic",
                        },
                        {
                            "name": "The Sub-level Radio Bunker",
                            "description": "A cramped, dust-covered comms station filled with Cold War vacuum-tube monitors and listening arrays, long abandoned by council decree.",
                            "visual_prompt": "Moody retro-futuristic control room with glowing CRT green-phosphor monitors, reel-to-reel tape machines, cluttered workbenches with wire bundles, dramatic shadows and flickering indicator lights, high detail",
                        },
                    ],
                    "visual_style_prompt": "Retro-futuristic Cold War underwater colony, industrial steel and geodesic glass, green-phosphor CRT displays, moody ultraviolet and amber emergency lighting, atmospheric tension.",
                },
                "characters": [
                    {
                        "name": "Commander Robert Sterling",
                        "role": "Station Director",
                        "archetype": "Authoritarian Administrator",
                        "motivation": "Maintain structural integrity and order at all costs",
                        "core_conflict": "Haunted by the secret that surface radiation cleared twenty years ago",
                        "visual_prompt": "Stern senior commander in crisp 1980s military-style naval tunic with station insignia, tired weathered expression, standing before tactical radar screens, retro lighting",
                    },
                    {
                        "name": "Dr. Clara Chen",
                        "role": "Chief Ecologist",
                        "archetype": "Empathetic Scientist",
                        "motivation": "Prevent the collapse of the hydroponic oxygen cycle",
                        "core_conflict": "Sympathetic to the young generation's yearning for open skies",
                        "visual_prompt": "Intelligent woman in white laboratory coat over utility jumpsuit, checking plant culture vials under purple grow lights, thoughtful and compassionate expression, cinematic",
                    },
                    {
                        "name": "Jax",
                        "role": "Comm Technician",
                        "archetype": "Rebellious Technician",
                        "motivation": "Transmit a distress beacon to the surface world",
                        "core_conflict": "Branded a saboteur by the Preservation Council",
                        "visual_prompt": "Young rebellious tech in grease-stained jumpsuit with headphones around neck, holding a soldering iron, sharp observant expression, dim workshop setting",
                    },
                ],
                "relationships": [
                    {
                        "source_character_name": "Commander Robert Sterling",
                        "target_character_name": "Dr. Clara Chen",
                        "relation_type": "Uneasy Alliance",
                        "dynamic_description": "Robert depends on Clara to keep the population fed, while Clara demands greater transparency from the Council.",
                    },
                    {
                        "source_character_name": "Commander Robert Sterling",
                        "target_character_name": "Jax",
                        "relation_type": "Interrogation Dynamic",
                        "dynamic_description": "Robert views Jax as an existential threat to stability, while Jax knows the Council is lying about the outside world.",
                    },
                    {
                        "source_character_name": "Dr. Clara Chen",
                        "target_character_name": "Jax",
                        "relation_type": "Protector and Protégé",
                        "dynamic_description": "Clara discreetly supplies Jax with spare vacuum tubes and shielding components for his clandestine radio.",
                    },
                ],
                "scenes": [
                    {
                        "scene_number": 1,
                        "title": "The Static Transmission",
                        "location_setting": "The Sub-level Radio Bunker",
                        "characters_involved": ["Dr. Clara Chen", "Jax"],
                        "dramatic_question": "Will Jax decrypt the surface broadcast before Council security breaches the door?",
                        "conflict_narrative": "A faint, crackling audio signal emerges from an ancient radio frequency as emergency lockdown sirens blare in the corridor outside.",
                        "pivotal_outcome": "The audio resolves into a human voice broadcasting from a surface beacon, confirming the sky is alive.",
                        "visual_prompt": "Tense scene inside a dark retro bunker with green CRT monitors, a young technician with headphones listening intently while an anxious scientist keeps watch at a reinforced hatch, cinematic",
                    },
                    {
                        "scene_number": 2,
                        "title": "Containment Crisis in Sector 4",
                        "location_setting": "Sector 4 Hydroponics airlock threshold",
                        "characters_involved": ["Commander Robert Sterling", "Jax"],
                        "dramatic_question": "Can Robert quell Jax's rebellion without destroying the colony's only food dome?",
                        "conflict_narrative": "Jax barricades himself inside the hydroponics control tower, threatening to open the dome shutters to the outer ocean.",
                        "pivotal_outcome": "Sterling lays down his sidearm and reveals the sealed council logs, admitting the truth about the surface.",
                        "visual_prompt": "Dramatic showdown inside a towering violet-lit greenhouse dome, armed guards standing down while an older commander confronts a young rebel at the central airlock, cinematic",
                    },
                ],
            }

        # Default fixture (Bio-City archetype for canonical ocean seed or generic fallback)
        return {
            "world_bible": {
                "geography": "Continental abyssal shelf at 3,400m depth, anchored around a towering biogenic coral caldera.",
                "physics_rules": "Bioluminescent enzyme metabolism replaces combustion; high ambient pressure neutralized by gelatinous fluid membranes.",
                "history_timeline": [
                    {"era": "The Seeding Era (Year -300)", "event": "Geneticists engineered deep-sea corals to synthesize atmospheric oxygen and siphon methane."},
                    {"era": "The Great Submersion (Year 0)", "event": "Coastal civilizations fell; the coral metropolis reached self-sustaining equilibrium."},
                    {"era": "The Current Bloom (Year 140)", "event": "Benthic currents shifted, triggering rapid spore reproduction across the southern trench."},
                ],
                "factions": [
                    {"name": "Reef Callers", "role": "Symbiotic biological caretakers", "agenda": "Expand the living coral lattice to engulf foreign incursions."},
                    {"name": "Siphon Engineers", "role": "Mechanical geothermal harvesters", "agenda": "Divert volcanic vents for industrial pressure turbines."},
                ],
                "canon_facts": [
                    "No synthetic metals exist; all structural beams are calcified exoskeleton alloys.",
                    "Communication travels via bioluminescent frequency flashes across nerve tendrils.",
                    "The city's core siphonophore has a rudimentary collective consciousness.",
                ],
                "key_locations": [
                    {
                        "name": "The Bioluminescent Spire",
                        "description": "A 400-meter calcified coral spire that pulses with cerulean light, serving as the city's respiratory organ and central transit spine.",
                        "visual_prompt": "Cinematic wide angle, an immense bioluminescent living coral spire rising through pitch-black abyssal ocean depths, emitting vivid cyan and indigo pulses, miniature submarine pods gliding along translucent organic corridors, Unreal Engine 5 volumetric lighting, 8k resolution",
                    },
                    {
                        "name": "The Nursery Trench",
                        "description": "A thermal crevasse where embryonic respiratory pods incubate in mineral-rich geothermal vents.",
                        "visual_prompt": "Cinematic macro shot of deep-sea organic pods glowing warm amber and gold along a volcanic hydrothermal vent, tendrils of steam diffusing in midnight-blue seawater, hyper-detailed, photorealistic macro photography",
                    },
                ],
                "visual_style_prompt": "Deep abyssal biopunk aesthetic, bioluminescent cyan, indigo, and emerald hues, translucent organic membranes, calcified marine architecture, dark volumetric ocean depths with suspended marine snow.",
            },
            "characters": [
                {
                    "name": "Dr. Althea Thorne",
                    "role": "Chief Symbiologist",
                    "archetype": "Visionary Scientist",
                    "motivation": "Decipher the collective consciousness of the benthic siphonophore",
                    "core_conflict": "Believes the reef is waking up and demanding human assimilation",
                    "visual_prompt": "Portrait of a middle-aged female oceanographer in organic breathing suit with bioluminescent nerve-fiber accents, intense focused gaze, reflections of cyan coral lights in helmet visor, photorealistic",
                },
                {
                    "name": "Sentry Unit Nereus",
                    "role": "Grafted Deep Guard",
                    "archetype": "Reluctant Protector",
                    "motivation": "Defend the nursery pods from invasive trench scavengers",
                    "core_conflict": "His neural implants are gradually being consumed by living coral tissue",
                    "visual_prompt": "Intimidating cyborg deep-sea guard with weathered bronze diving rig grafted into bioluminescent calcified coral armor, holding a harpoon projector, dark water atmosphere, cinematic lighting",
                },
                {
                    "name": "Kaelen",
                    "role": "Sub-surface Diver",
                    "archetype": "Pragmatic Scavenger",
                    "motivation": "Locate his family's lost research vessel sunken in the outer rift",
                    "core_conflict": "Distrusts the Reef Callers' zealotry and fears total biological assimilation",
                    "visual_prompt": "A young agile deep-sea scout in streamlined diving gear with neon-amber trim, holding a sonar scanner, surrounded by drifting plankton in murky deep ocean, sharp focus",
                },
            ],
            "relationships": [
                {
                    "source_character_name": "Dr. Althea Thorne",
                    "target_character_name": "Sentry Unit Nereus",
                    "relation_type": "Symbiotic Bond",
                    "dynamic_description": "Althea monitors Nereus's biological graft progression while Nereus enforces Althea's research cordons.",
                },
                {
                    "source_character_name": "Dr. Althea Thorne",
                    "target_character_name": "Kaelen",
                    "relation_type": "Philosophical Friction",
                    "dynamic_description": "Althea urges Kaelen to surrender to the reef's harmony, while Kaelen resists any loss of personal autonomy.",
                },
                {
                    "source_character_name": "Sentry Unit Nereus",
                    "target_character_name": "Kaelen",
                    "relation_type": "Guarded Camaraderie",
                    "dynamic_description": "Nereus secretly guides Kaelen through trench hazards despite formal orders to restrict civilian perimeter access.",
                },
            ],
            "scenes": [
                {
                    "scene_number": 1,
                    "title": "Awakening of the Deep Spire",
                    "location_setting": "The Bioluminescent Spire central atrium",
                    "characters_involved": ["Dr. Althea Thorne", "Sentry Unit Nereus"],
                    "dramatic_question": "Will Althea risk bio-resonance overload to commune with the awakening spire?",
                    "conflict_narrative": "A harmonic shockwave pulses from the spire's heart as Althea initiates neural contact, causing Nereus's defensive protocols to trigger.",
                    "pivotal_outcome": "The spire syncs with Althea's bio-signature, revealing coordinates to the forbidden trench floor.",
                    "visual_prompt": "Cinematic moment where a female scientist touches a glowing coral node as massive rings of blue light ripple through a water-filled chamber, guarded by a coral-clad sentry, dramatic lighting, 8k",
                },
                {
                    "scene_number": 2,
                    "title": "Breach at the Nursery Trench",
                    "location_setting": "The Nursery Trench perimeter",
                    "characters_involved": ["Sentry Unit Nereus", "Kaelen"],
                    "dramatic_question": "Can Nereus and Kaelen seal the thermal fissure before the embryonic pods freeze?",
                    "conflict_narrative": "A tectonic tremor cracks the outer geothermal conduit, threatening to expose the vulnerable nursery pods to frigid abyssal currents.",
                    "pivotal_outcome": "Kaelen risks his submersible to patch the fissure, earning Nereus's unreserved trust.",
                    "visual_prompt": "High-tension underwater action scene, a scout submersible firing sealant ropes into a glowing thermal volcanic crack while a massive armored diver holds a collapsing coral arch, bubbles and heat distortion, cinematic",
                },
            ],
        }
