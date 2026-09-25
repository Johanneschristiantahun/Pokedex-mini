// ========================================================
// PokéSphere Legendary Secret Dungeons & Mythical Raids
// Seafoam Caverns, Power Plant, Victory Road, & Cerulean Cave
// ========================================================

import { MOVE_CATALOG } from "./pokemonMoves.js";

function resolveMove(moveKey) {
  const move = MOVE_CATALOG[moveKey] || MOVE_CATALOG.tackle;
  return {
    ...move,
    currentPp: move.maxPp,
  };
}

export const LEGENDARY_DUNGEONS = [
  {
    id: "seafoam-depths",
    name: "Seafoam Caverns Deep",
    region: "Route 20 Island Caverns",
    theme: "dungeon-ice",
    recommendedLevel: "Lv. 50+",
    color: "#38bdf8",
    description: "An icy labyrinth deep beneath the ocean swells where sub-zero temperatures preserve prehistoric ice crystals.",
    boss: {
      id: 144,
      name: "articuno",
      title: "The Legendary Freeze Pokémon",
      level: 50,
      maxHp: 240,
      currentHp: 240,
      types: ["ice", "flying"],
      catchRate: 3, // Very difficult
      baseExp: 261,
      moves: [
        resolveMove("blizzard"),
        resolveMove("ice-beam"),
        resolveMove("air-slash"),
        resolveMove("body-slam"),
      ],
      introQuote: "Gyaoo! A chilling frost descends as Articuno swoops down from the azure glacial ceiling!",
      faintQuote: "Articuno's crystalline wings freeze into majestic slumber...",
    },
  },
  {
    id: "power-plant-core",
    name: "Abandoned Power Plant Core",
    region: "Route 10 Power Substation",
    theme: "dungeon-electric",
    recommendedLevel: "Lv. 50+",
    color: "#facc15",
    description: "A derelict power station humming with wild electromagnetic discharges and dangerous electrical currents.",
    boss: {
      id: 145,
      name: "zapdos",
      title: "The Legendary Thunder Pokémon",
      level: 50,
      maxHp: 235,
      currentHp: 235,
      types: ["electric", "flying"],
      catchRate: 3,
      baseExp: 261,
      moves: [
        resolveMove("thunder"),
        resolveMove("thunderbolt"),
        resolveMove("wing-attack"),
        resolveMove("body-slam"),
      ],
      introQuote: "Gyaoo! Sparks arc across the dynamos as Zapdos descends with deafening lightning claps!",
      faintQuote: "The crackling electric sparks dissipate into the air...",
    },
  },
  {
    id: "victory-road-molten",
    name: "Victory Road Molten Chamber",
    region: "Mount Silver Foothills",
    theme: "dungeon-fire",
    recommendedLevel: "Lv. 50+",
    color: "#f97316",
    description: "A subterranean cavern flowing with incandescent lava rivers and scorching volcanic thermal vents.",
    boss: {
      id: 146,
      name: "moltres",
      title: "The Legendary Flame Pokémon",
      level: 50,
      maxHp: 245,
      currentHp: 245,
      types: ["fire", "flying"],
      catchRate: 3,
      baseExp: 261,
      moves: [
        resolveMove("fire-blast"),
        resolveMove("flamethrower"),
        resolveMove("air-slash"),
        resolveMove("body-slam"),
      ],
      introQuote: "Gyaoo! A searing wave of flame ignites the chamber as Moltres blazes into view!",
      faintQuote: "Moltres's searing crimson flames soften to warm embers...",
    },
  },
  {
    id: "cerulean-cave-sanctum",
    name: "Cerulean Mysterious Cave",
    region: "Northwest of Cerulean City",
    theme: "dungeon-psychic",
    recommendedLevel: "Lv. 70+",
    color: "#a855f7",
    description: "A heavily restricted cave where genetic experiments created the most terrifying psychic organism on earth.",
    boss: {
      id: 150,
      name: "mewtwo",
      title: "The Ultimate Genetic Pokémon",
      level: 70,
      maxHp: 380,
      currentHp: 380,
      types: ["psychic"],
      catchRate: 3,
      baseExp: 340,
      moves: [
        resolveMove("psychic"),
        resolveMove("shadow-ball"),
        resolveMove("hyper-beam"),
        resolveMove("close-combat"),
      ],
      introQuote: "Mewtwo's piercing psychic gaze telepathically echoes through your mind: 'Foolish trainer... you dare challenge my supremacy?!'",
      faintQuote: "Mewtwo glares with reluctant respect: '...Your human bond with Pokémon... perhaps it is not entirely flawed...'",
    },
    secretEncounter: {
      id: 151,
      name: "mew",
      title: "The Mythical Ancestor Pokémon",
      level: 40,
      maxHp: 180,
      currentHp: 180,
      types: ["psychic"],
      catchRate: 45, // Easier if discovered
      baseExp: 300,
      moves: [
        resolveMove("psychic"),
        resolveMove("energy-ball"),
        resolveMove("thunderbolt"),
        resolveMove("surf"),
      ],
      introQuote: "Mew giggles playfully, floating upside-down in a bubble of radiant pink energy!",
    },
  },
];
