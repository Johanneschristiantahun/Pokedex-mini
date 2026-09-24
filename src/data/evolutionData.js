// ========================================================
// PokéSphere Official Evolution Database
// Level-up triggers & Stone Evolutions with baseStats & typing
// ========================================================

export const LEVEL_UP_EVOLUTIONS = {
  // Starters
  bulbasaur: {
    minLevel: 16,
    targetId: 2,
    targetName: "ivysaur",
    types: ["grass", "poison"],
    baseStats: { hp: 60, attack: 62, defense: 63, spAttack: 80, spDefense: 80, speed: 60 },
  },
  ivysaur: {
    minLevel: 32,
    targetId: 3,
    targetName: "venusaur",
    types: ["grass", "poison"],
    baseStats: { hp: 80, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80 },
  },
  charmander: {
    minLevel: 16,
    targetId: 5,
    targetName: "charmeleon",
    types: ["fire"],
    baseStats: { hp: 58, attack: 64, defense: 58, spAttack: 80, spDefense: 65, speed: 80 },
  },
  charmeleon: {
    minLevel: 36,
    targetId: 6,
    targetName: "charizard",
    types: ["fire", "flying"],
    baseStats: { hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 },
  },
  squirtle: {
    minLevel: 16,
    targetId: 8,
    targetName: "wartortle",
    types: ["water"],
    baseStats: { hp: 59, attack: 63, defense: 80, spAttack: 65, spDefense: 80, speed: 58 },
  },
  wartortle: {
    minLevel: 36,
    targetId: 9,
    targetName: "blastoise",
    types: ["water"],
    baseStats: { hp: 79, attack: 83, defense: 100, spAttack: 85, spDefense: 105, speed: 78 },
  },

  // Bugs & Early Birds
  caterpie: {
    minLevel: 7,
    targetId: 11,
    targetName: "metapod",
    types: ["bug"],
    baseStats: { hp: 50, attack: 20, defense: 55, spAttack: 25, spDefense: 25, speed: 30 },
  },
  metapod: {
    minLevel: 10,
    targetId: 12,
    targetName: "butterfree",
    types: ["bug", "flying"],
    baseStats: { hp: 60, attack: 45, defense: 50, spAttack: 90, spDefense: 80, speed: 70 },
  },
  weedle: {
    minLevel: 7,
    targetId: 14,
    targetName: "kakuna",
    types: ["bug", "poison"],
    baseStats: { hp: 45, attack: 25, defense: 50, spAttack: 25, spDefense: 25, speed: 35 },
  },
  kakuna: {
    minLevel: 10,
    targetId: 15,
    targetName: "beedrill",
    types: ["bug", "poison"],
    baseStats: { hp: 65, attack: 90, defense: 40, spAttack: 45, spDefense: 80, speed: 75 },
  },
  pidgey: {
    minLevel: 18,
    targetId: 17,
    targetName: "pidgeotto",
    types: ["normal", "flying"],
    baseStats: { hp: 63, attack: 60, defense: 55, spAttack: 50, spDefense: 50, speed: 71 },
  },
  pidgeotto: {
    minLevel: 36,
    targetId: 18,
    targetName: "pidgeot",
    types: ["normal", "flying"],
    baseStats: { hp: 83, attack: 80, defense: 75, spAttack: 70, spDefense: 70, speed: 101 },
  },
  rattata: {
    minLevel: 20,
    targetId: 20,
    targetName: "raticate",
    types: ["normal"],
    baseStats: { hp: 55, attack: 81, defense: 60, spAttack: 50, spDefense: 70, speed: 97 },
  },
  spearow: {
    minLevel: 20,
    targetId: 22,
    targetName: "fearow",
    types: ["normal", "flying"],
    baseStats: { hp: 65, attack: 90, defense: 65, spAttack: 61, spDefense: 61, speed: 100 },
  },
  ekans: {
    minLevel: 22,
    targetId: 24,
    targetName: "arbok",
    types: ["poison"],
    baseStats: { hp: 60, attack: 95, defense: 69, spAttack: 65, spDefense: 79, speed: 80 },
  },
  sandshrew: {
    minLevel: 22,
    targetId: 28,
    targetName: "sandslash",
    types: ["ground"],
    baseStats: { hp: 75, attack: 100, defense: 110, spAttack: 45, spDefense: 55, speed: 65 },
  },
  zubat: {
    minLevel: 22,
    targetId: 42,
    targetName: "golbat",
    types: ["poison", "flying"],
    baseStats: { hp: 75, attack: 80, defense: 70, spAttack: 65, spDefense: 75, speed: 90 },
  },
  oddish: {
    minLevel: 21,
    targetId: 44,
    targetName: "gloom",
    types: ["grass", "poison"],
    baseStats: { hp: 60, attack: 65, defense: 70, spAttack: 85, spDefense: 75, speed: 40 },
  },
  paras: {
    minLevel: 24,
    targetId: 47,
    targetName: "parasect",
    types: ["bug", "grass"],
    baseStats: { hp: 60, attack: 95, defense: 80, spAttack: 60, spDefense: 80, speed: 30 },
  },
  venonat: {
    minLevel: 31,
    targetId: 49,
    targetName: "venomoth",
    types: ["bug", "poison"],
    baseStats: { hp: 70, attack: 65, defense: 60, spAttack: 90, spDefense: 75, speed: 90 },
  },
  diglett: {
    minLevel: 26,
    targetId: 51,
    targetName: "dugtrio",
    types: ["ground"],
    baseStats: { hp: 35, attack: 100, defense: 50, spAttack: 50, spDefense: 70, speed: 120 },
  },
  meowth: {
    minLevel: 28,
    targetId: 53,
    targetName: "persian",
    types: ["normal"],
    baseStats: { hp: 65, attack: 70, defense: 60, spAttack: 65, spDefense: 65, speed: 115 },
  },
  psyduck: {
    minLevel: 33,
    targetId: 55,
    targetName: "golduck",
    types: ["water"],
    baseStats: { hp: 80, attack: 82, defense: 78, spAttack: 95, spDefense: 80, speed: 85 },
  },
  mankey: {
    minLevel: 28,
    targetId: 57,
    targetName: "primeape",
    types: ["fighting"],
    baseStats: { hp: 65, attack: 105, defense: 60, spAttack: 60, spDefense: 70, speed: 95 },
  },
  poliwag: {
    minLevel: 25,
    targetId: 61,
    targetName: "poliwhirl",
    types: ["water"],
    baseStats: { hp: 65, attack: 65, defense: 65, spAttack: 50, spDefense: 50, speed: 90 },
  },
  abra: {
    minLevel: 16,
    targetId: 64,
    targetName: "kadabra",
    types: ["psychic"],
    baseStats: { hp: 40, attack: 35, defense: 30, spAttack: 120, spDefense: 70, speed: 105 },
  },
  machop: {
    minLevel: 28,
    targetId: 67,
    targetName: "machoke",
    types: ["fighting"],
    baseStats: { hp: 80, attack: 100, defense: 70, spAttack: 50, spDefense: 60, speed: 45 },
  },
  bellsprout: {
    minLevel: 21,
    targetId: 70,
    targetName: "weepinbell",
    types: ["grass", "poison"],
    baseStats: { hp: 65, attack: 90, defense: 50, spAttack: 85, spDefense: 45, speed: 55 },
  },
  geodude: {
    minLevel: 25,
    targetId: 75,
    targetName: "graveler",
    types: ["rock", "ground"],
    baseStats: { hp: 55, attack: 95, defense: 115, spAttack: 45, spDefense: 45, speed: 35 },
  },
  ponyta: {
    minLevel: 40,
    targetId: 78,
    targetName: "rapidash",
    types: ["fire"],
    baseStats: { hp: 65, attack: 100, defense: 70, spAttack: 80, spDefense: 80, speed: 105 },
  },
  slowpoke: {
    minLevel: 37,
    targetId: 80,
    targetName: "slowbro",
    types: ["water", "psychic"],
    baseStats: { hp: 95, attack: 75, defense: 110, spAttack: 100, spDefense: 80, speed: 30 },
  },
  magnemite: {
    minLevel: 30,
    targetId: 82,
    targetName: "magneton",
    types: ["electric", "steel"],
    baseStats: { hp: 50, attack: 60, defense: 95, spAttack: 120, spDefense: 70, speed: 70 },
  },
  doduo: {
    minLevel: 31,
    targetId: 85,
    targetName: "dodrio",
    types: ["normal", "flying"],
    baseStats: { hp: 60, attack: 110, defense: 70, spAttack: 60, spDefense: 60, speed: 110 },
  },
  seel: {
    minLevel: 34,
    targetId: 87,
    targetName: "dewgong",
    types: ["water", "ice"],
    baseStats: { hp: 90, attack: 70, defense: 80, spAttack: 70, spDefense: 95, speed: 70 },
  },
  grimer: {
    minLevel: 38,
    targetId: 89,
    targetName: "muk",
    types: ["poison"],
    baseStats: { hp: 105, attack: 105, defense: 75, spAttack: 65, spDefense: 100, speed: 50 },
  },
  gastly: {
    minLevel: 25,
    targetId: 93,
    targetName: "haunter",
    types: ["ghost", "poison"],
    baseStats: { hp: 45, attack: 50, defense: 45, spAttack: 115, spDefense: 55, speed: 95 },
  },
  drowzee: {
    minLevel: 26,
    targetId: 97,
    targetName: "hypno",
    types: ["psychic"],
    baseStats: { hp: 85, attack: 73, defense: 70, spAttack: 73, spDefense: 115, speed: 67 },
  },
  krabby: {
    minLevel: 28,
    targetId: 99,
    targetName: "kingler",
    types: ["water"],
    baseStats: { hp: 55, attack: 130, defense: 115, spAttack: 50, spDefense: 50, speed: 75 },
  },
  voltorb: {
    minLevel: 30,
    targetId: 101,
    targetName: "electrode",
    types: ["electric"],
    baseStats: { hp: 60, attack: 50, defense: 70, spAttack: 80, spDefense: 80, speed: 150 },
  },
  cubone: {
    minLevel: 28,
    targetId: 105,
    targetName: "marowak",
    types: ["ground"],
    baseStats: { hp: 60, attack: 80, defense: 110, spAttack: 50, spDefense: 80, speed: 45 },
  },
  koffing: {
    minLevel: 35,
    targetId: 110,
    targetName: "weezing",
    types: ["poison"],
    baseStats: { hp: 65, attack: 90, defense: 120, spAttack: 85, spDefense: 70, speed: 60 },
  },
  rhyhorn: {
    minLevel: 42,
    targetId: 112,
    targetName: "rhydon",
    types: ["ground", "rock"],
    baseStats: { hp: 105, attack: 130, defense: 120, spAttack: 45, spDefense: 45, speed: 40 },
  },
  horsea: {
    minLevel: 32,
    targetId: 117,
    targetName: "seadra",
    types: ["water"],
    baseStats: { hp: 55, attack: 65, defense: 95, spAttack: 95, spDefense: 45, speed: 85 },
  },
  goldeen: {
    minLevel: 33,
    targetId: 119,
    targetName: "seaking",
    types: ["water"],
    baseStats: { hp: 80, attack: 92, defense: 65, spAttack: 65, spDefense: 80, speed: 68 },
  },
  magikarp: {
    minLevel: 20,
    targetId: 130,
    targetName: "gyarados",
    types: ["water", "flying"],
    baseStats: { hp: 95, attack: 125, defense: 79, spAttack: 60, spDefense: 100, speed: 81 },
  },
  omanyte: {
    minLevel: 40,
    targetId: 139,
    targetName: "omastar",
    types: ["rock", "water"],
    baseStats: { hp: 70, attack: 60, defense: 125, spAttack: 115, spDefense: 70, speed: 55 },
  },
  kabuto: {
    minLevel: 40,
    targetId: 141,
    targetName: "kabutops",
    types: ["rock", "water"],
    baseStats: { hp: 60, attack: 115, defense: 105, spAttack: 65, spDefense: 70, speed: 80 },
  },
  dratini: {
    minLevel: 30,
    targetId: 148,
    targetName: "dragonair",
    types: ["dragon"],
    baseStats: { hp: 61, attack: 84, defense: 65, spAttack: 70, spDefense: 70, speed: 70 },
  },
  dragonair: {
    minLevel: 55,
    targetId: 149,
    targetName: "dragonite",
    types: ["dragon", "flying"],
    baseStats: { hp: 91, attack: 134, defense: 95, spAttack: 100, spDefense: 100, speed: 80 },
  },
};

export const STONE_EVOLUTIONS = {
  pikachu: {
    "thunder-stone": {
      targetId: 26,
      targetName: "raichu",
      types: ["electric"],
      baseStats: { hp: 60, attack: 90, defense: 55, spAttack: 90, spDefense: 80, speed: 110 },
    },
  },
  eevee: {
    "fire-stone": {
      targetId: 136,
      targetName: "flareon",
      types: ["fire"],
      baseStats: { hp: 65, attack: 130, defense: 60, spAttack: 95, spDefense: 110, speed: 65 },
    },
    "water-stone": {
      targetId: 134,
      targetName: "vaporeon",
      types: ["water"],
      baseStats: { hp: 130, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 65 },
    },
    "thunder-stone": {
      targetId: 135,
      targetName: "jolteon",
      types: ["electric"],
      baseStats: { hp: 65, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 130 },
    },
  },
  vulpix: {
    "fire-stone": {
      targetId: 38,
      targetName: "ninetales",
      types: ["fire"],
      baseStats: { hp: 73, attack: 76, defense: 75, spAttack: 81, spDefense: 100, speed: 100 },
    },
  },
  growlithe: {
    "fire-stone": {
      targetId: 59,
      targetName: "arcanine",
      types: ["fire"],
      baseStats: { hp: 90, attack: 110, defense: 80, spAttack: 100, spDefense: 80, speed: 95 },
    },
  },
  poliwhirl: {
    "water-stone": {
      targetId: 62,
      targetName: "poliwrath",
      types: ["water", "fighting"],
      baseStats: { hp: 90, attack: 95, defense: 95, spAttack: 70, spDefense: 90, speed: 70 },
    },
  },
  shellder: {
    "water-stone": {
      targetId: 91,
      targetName: "cloyster",
      types: ["water", "ice"],
      baseStats: { hp: 50, attack: 95, defense: 180, spAttack: 85, spDefense: 45, speed: 70 },
    },
  },
  staryu: {
    "water-stone": {
      targetId: 121,
      targetName: "starmie",
      types: ["water", "psychic"],
      baseStats: { hp: 60, attack: 75, defense: 85, spAttack: 100, spDefense: 85, speed: 115 },
    },
  },
  gloom: {
    "leaf-stone": {
      targetId: 45,
      targetName: "vileplume",
      types: ["grass", "poison"],
      baseStats: { hp: 75, attack: 80, defense: 85, spAttack: 110, spDefense: 90, speed: 50 },
    },
  },
  weepinbell: {
    "leaf-stone": {
      targetId: 71,
      targetName: "victreebel",
      types: ["grass", "poison"],
      baseStats: { hp: 80, attack: 105, defense: 65, spAttack: 100, spDefense: 70, speed: 70 },
    },
  },
  exeggcute: {
    "leaf-stone": {
      targetId: 103,
      targetName: "exeggutor",
      types: ["grass", "psychic"],
      baseStats: { hp: 95, attack: 95, defense: 85, spAttack: 125, spDefense: 75, speed: 55 },
    },
  },
  clefairy: {
    "moon-stone": {
      targetId: 36,
      targetName: "clefable",
      types: ["fairy"],
      baseStats: { hp: 95, attack: 70, defense: 73, spAttack: 95, spDefense: 90, speed: 60 },
    },
  },
  jigglypuff: {
    "moon-stone": {
      targetId: 40,
      targetName: "wigglytuff",
      types: ["normal", "fairy"],
      baseStats: { hp: 140, attack: 70, defense: 45, spAttack: 85, spDefense: 50, speed: 45 },
    },
  },
  nidorina: {
    "moon-stone": {
      targetId: 31,
      targetName: "nidoqueen",
      types: ["poison", "ground"],
      baseStats: { hp: 90, attack: 92, defense: 87, spAttack: 75, spDefense: 85, speed: 76 },
    },
  },
  nidorino: {
    "moon-stone": {
      targetId: 34,
      targetName: "nidoking",
      types: ["poison", "ground"],
      baseStats: { hp: 81, attack: 102, defense: 77, spAttack: 85, spDefense: 75, speed: 85 },
    },
  },
};

// Check if a Pokémon is ready to evolve via level
export function checkLevelEvolution(pokemon) {
  if (!pokemon || !pokemon.name) return null;
  const evo = LEVEL_UP_EVOLUTIONS[pokemon.name.toLowerCase()];
  if (evo && (pokemon.level || 1) >= evo.minLevel) {
    return evo;
  }
  return null;
}

// Check if a Pokémon can evolve with a specific stone
export function checkStoneEvolution(pokemon, stoneKey) {
  if (!pokemon || !pokemon.name || !stoneKey) return null;
  const monKey = pokemon.name.toLowerCase();
  if (STONE_EVOLUTIONS[monKey] && STONE_EVOLUTIONS[monKey][stoneKey]) {
    return STONE_EVOLUTIONS[monKey][stoneKey];
  }
  return null;
}
