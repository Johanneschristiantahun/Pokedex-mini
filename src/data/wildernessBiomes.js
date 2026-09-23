// ========================================================
// PokéSphere Wilderness Exploration Biomes & Spawns Data
// Authentic spawn tables, level ranges, and catch rates
// ========================================================

export const WILDERNESS_BIOMES = [
  {
    id: "viridian-forest",
    name: "Viridian Forest",
    subtitle: "Dense canopy filled with early bug and grass Pokémon",
    recommendedLevel: "Lv. 3 - 8",
    color: "#22c55e",
    bgGradient: "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)",
    accentLight: "rgba(34, 197, 94, 0.15)",
    badgeColor: "#15803d",
    wildSpawns: [
      { id: 10, name: "caterpie", types: ["bug"], minLevel: 3, maxLevel: 5, weight: 25, catchRate: 255 },
      { id: 13, name: "weedle", types: ["bug", "poison"], minLevel: 3, maxLevel: 5, weight: 25, catchRate: 255 },
      { id: 16, name: "pidgey", types: ["normal", "flying"], minLevel: 4, maxLevel: 7, weight: 20, catchRate: 255 },
      { id: 43, name: "oddish", types: ["grass", "poison"], minLevel: 4, maxLevel: 7, weight: 15, catchRate: 255 },
      { id: 69, name: "bellsprout", types: ["grass", "poison"], minLevel: 4, maxLevel: 7, weight: 10, catchRate: 255 },
      { id: 25, name: "pikachu", types: ["electric"], minLevel: 5, maxLevel: 8, weight: 5, catchRate: 190 },
    ],
    lootDrops: [
      { itemKey: "poke-ball", name: "Poké Ball", weight: 35, count: 2 },
      { itemKey: "potion", name: "Potion", weight: 30, count: 1 },
      { itemKey: "oran-berry", name: "Oran Berry", weight: 25, count: 2 },
      { itemKey: "pearl", name: "Pearl", weight: 10, count: 1 },
    ],
  },
  {
    id: "mt-moon",
    name: "Mt. Moon Caverns",
    subtitle: "Dark, rocky tunnels inhabited by nocturnal and mineral Pokémon",
    recommendedLevel: "Lv. 6 - 13",
    color: "#a855f7",
    bgGradient: "linear-gradient(135deg, #3b0764 0%, #581c87 50%, #6b21a8 100%)",
    accentLight: "rgba(168, 85, 247, 0.15)",
    badgeColor: "#6b21a8",
    wildSpawns: [
      { id: 41, name: "zubat", types: ["poison", "flying"], minLevel: 6, maxLevel: 10, weight: 30, catchRate: 255 },
      { id: 74, name: "geodude", types: ["rock", "ground"], minLevel: 7, maxLevel: 11, weight: 25, catchRate: 255 },
      { id: 46, name: "paras", types: ["bug", "grass"], minLevel: 7, maxLevel: 10, weight: 20, catchRate: 190 },
      { id: 66, name: "machop", types: ["fighting"], minLevel: 8, maxLevel: 12, weight: 12, catchRate: 180 },
      { id: 35, name: "clefairy", types: ["fairy"], minLevel: 8, maxLevel: 12, weight: 8, catchRate: 150 },
      { id: 95, name: "onix", types: ["rock", "ground"], minLevel: 10, maxLevel: 13, weight: 5, catchRate: 45 },
    ],
    lootDrops: [
      { itemKey: "great-ball", name: "Great Ball", weight: 30, count: 1 },
      { itemKey: "super-potion", name: "Super Potion", weight: 30, count: 1 },
      { itemKey: "revive", name: "Revive", weight: 25, count: 1 },
      { itemKey: "moon-stone", name: "Moon Stone", weight: 5, count: 1 },
      { itemKey: "star-piece", name: "Star Piece", weight: 10, count: 1 },
    ],
  },
  {
    id: "seafoam-coast",
    name: "Seafoam Coast",
    subtitle: "Rushing tidal waves and chilly grottos for aquatic species",
    recommendedLevel: "Lv. 10 - 18",
    color: "#0ea5e9",
    bgGradient: "linear-gradient(135deg, #082f49 0%, #0369a1 50%, #0284c7 100%)",
    accentLight: "rgba(14, 165, 233, 0.15)",
    badgeColor: "#0369a1",
    wildSpawns: [
      { id: 129, name: "magikarp", types: ["water"], minLevel: 10, maxLevel: 15, weight: 30, catchRate: 255 },
      { id: 72, name: "tentacool", types: ["water", "poison"], minLevel: 11, maxLevel: 16, weight: 25, catchRate: 190 },
      { id: 60, name: "poliwag", types: ["water"], minLevel: 11, maxLevel: 16, weight: 20, catchRate: 255 },
      { id: 54, name: "psyduck", types: ["water"], minLevel: 12, maxLevel: 17, weight: 12, catchRate: 190 },
      { id: 79, name: "slowpoke", types: ["water", "psychic"], minLevel: 12, maxLevel: 17, weight: 8, catchRate: 190 },
      { id: 90, name: "shellder", types: ["water"], minLevel: 13, maxLevel: 18, weight: 5, catchRate: 190 },
    ],
    lootDrops: [
      { itemKey: "great-ball", name: "Great Ball", weight: 35, count: 2 },
      { itemKey: "super-potion", name: "Super Potion", weight: 30, count: 1 },
      { itemKey: "sitrus-berry", name: "Sitrus Berry", weight: 20, count: 2 },
      { itemKey: "water-stone", name: "Water Stone", weight: 5, count: 1 },
      { itemKey: "pearl", name: "Pearl", weight: 10, count: 2 },
    ],
  },
  {
    id: "cinnabar-volcano",
    name: "Rock Tunnel & Volcano",
    subtitle: "Blazing magma veins and cavernous paths full of fiery fighters",
    recommendedLevel: "Lv. 15 - 24",
    color: "#f97316",
    bgGradient: "linear-gradient(135deg, #431407 0%, #9a3412 50%, #c2410c 100%)",
    accentLight: "rgba(249, 115, 22, 0.15)",
    badgeColor: "#9a3412",
    wildSpawns: [
      { id: 56, name: "mankey", types: ["fighting"], minLevel: 15, maxLevel: 20, weight: 25, catchRate: 190 },
      { id: 77, name: "ponyta", types: ["fire"], minLevel: 16, maxLevel: 21, weight: 25, catchRate: 190 },
      { id: 37, name: "vulpix", types: ["fire"], minLevel: 16, maxLevel: 21, weight: 20, catchRate: 190 },
      { id: 58, name: "growlithe", types: ["fire"], minLevel: 17, maxLevel: 22, weight: 15, catchRate: 190 },
      { id: 4, name: "charmander", types: ["fire"], minLevel: 18, maxLevel: 23, weight: 10, catchRate: 45 },
      { id: 105, name: "marowak", types: ["ground"], minLevel: 19, maxLevel: 24, weight: 5, catchRate: 75 },
    ],
    lootDrops: [
      { itemKey: "ultra-ball", name: "Ultra Ball", weight: 25, count: 1 },
      { itemKey: "hyper-potion", name: "Hyper Potion", weight: 30, count: 1 },
      { itemKey: "fire-stone", name: "Fire Stone", weight: 5, count: 1 },
      { itemKey: "nugget", name: "Nugget", weight: 15, count: 1 },
      { itemKey: "rare-candy", name: "Rare Candy", weight: 25, count: 1 },
    ],
  },
  {
    id: "power-plant",
    name: "Abandoned Power Plant",
    subtitle: "Humming generators and electric discharges attracting high-voltage species",
    recommendedLevel: "Lv. 20 - 30",
    color: "#eab308",
    bgGradient: "linear-gradient(135deg, #422006 0%, #713f12 50%, #854d0e 100%)",
    accentLight: "rgba(234, 179, 8, 0.15)",
    badgeColor: "#713f12",
    wildSpawns: [
      { id: 100, name: "voltorb", types: ["electric"], minLevel: 20, maxLevel: 26, weight: 30, catchRate: 190 },
      { id: 81, name: "magnemite", types: ["electric", "steel"], minLevel: 20, maxLevel: 26, weight: 30, catchRate: 190 },
      { id: 88, name: "grimer", types: ["poison"], minLevel: 21, maxLevel: 27, weight: 15, catchRate: 190 },
      { id: 109, name: "koffing", types: ["poison"], minLevel: 21, maxLevel: 27, weight: 15, catchRate: 190 },
      { id: 125, name: "electabuzz", types: ["electric"], minLevel: 23, maxLevel: 29, weight: 7, catchRate: 45 },
      { id: 26, name: "raichu", types: ["electric"], minLevel: 25, maxLevel: 30, weight: 3, catchRate: 75 },
    ],
    lootDrops: [
      { itemKey: "ultra-ball", name: "Ultra Ball", weight: 35, count: 2 },
      { itemKey: "max-potion", name: "Max Potion", weight: 25, count: 1 },
      { itemKey: "thunder-stone", name: "Thunder Stone", weight: 5, count: 1 },
      { itemKey: "rare-candy", name: "Rare Candy", weight: 20, count: 1 },
      { itemKey: "master-ball", name: "Master Ball", weight: 1, count: 1 }, // Ultra rare jackpot!
      { itemKey: "star-piece", name: "Star Piece", weight: 14, count: 1 },
    ],
  },
];

/**
 * Rolls an encounter in a given biome based on spawn weights.
 * Includes a 1:50 (2%) chance to spawn as a Shiny!
 */
export function rollWildEncounter(biomeId) {
  const biome = WILDERNESS_BIOMES.find((b) => b.id === biomeId) || WILDERNESS_BIOMES[0];

  const totalWeight = biome.wildSpawns.reduce((sum, s) => sum + s.weight, 0);
  let randomVal = Math.random() * totalWeight;

  let selectedSpecies = biome.wildSpawns[0];
  for (const spawn of biome.wildSpawns) {
    if (randomVal <= spawn.weight) {
      selectedSpecies = spawn;
      break;
    }
    randomVal -= spawn.weight;
  }

  // Random level between minLevel and maxLevel
  const level = Math.floor(
    Math.random() * (selectedSpecies.maxLevel - selectedSpecies.minLevel + 1) +
      selectedSpecies.minLevel
  );

  // 1:50 chance for Shiny Pokémon (2%)
  const isShiny = Math.random() < 0.02;

  // Base Max HP calculated roughly from level
  const maxHp = Math.floor(20 + level * 3.5 + Math.random() * 5);

  return {
    ...selectedSpecies,
    level,
    isShiny,
    maxHp,
    currentHp: maxHp,
    expReward: Math.floor(level * 18 + Math.random() * 10),
    moneyReward: Math.floor(level * 25 + Math.random() * 30),
  };
}

/**
 * Rolls a loot drop when exploring tall grass.
 */
export function rollLootDrop(biomeId) {
  const biome = WILDERNESS_BIOMES.find((b) => b.id === biomeId) || WILDERNESS_BIOMES[0];
  const totalWeight = biome.lootDrops.reduce((sum, d) => sum + d.weight, 0);
  let randomVal = Math.random() * totalWeight;

  for (const drop of biome.lootDrops) {
    if (randomVal <= drop.weight) {
      return drop;
    }
    randomVal -= drop.weight;
  }

  return biome.lootDrops[0];
}
