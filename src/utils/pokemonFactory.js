import {
  getAnimatedSpriteUrl,
  getSpriteUrl,
  getArtworkUrl,
  capitalize,
} from "../utils.js";

// Official Pokemon Stat Formulas
export function calculateHp(baseHp, level) {
  // HP = floor((2 * BaseHP * Level) / 100) + Level + 10
  return Math.floor((2 * baseHp * level) / 100) + level + 10;
}

export function calculateStat(baseStat, level) {
  // Stat = floor((2 * BaseStat * Level) / 100) + 5
  return Math.floor((2 * baseStat * level) / 100) + 5;
}

// EXP needed to reach next level (Medium-Fast Growth Formula: n^3)
export function calculateExpNeeded(level) {
  return Math.floor(Math.pow(level, 3));
}

// Starter templates for new game onboarding
export const STARTER_POKEMON = [
  {
    id: 1,
    name: "bulbasaur",
    genus: "Seed Pokémon",
    type: "grass",
    types: ["grass", "poison"],
    description: "A strange seed was planted on its back at birth. The plant sprouts and grows with this Pokémon.",
    baseStats: { hp: 45, attack: 49, defense: 49, spAttack: 65, spDefense: 65, speed: 45 },
    starterMoves: [
      { name: "Tackle", type: "normal", power: 40, accuracy: 100, pp: 35, maxPp: 35 },
      { name: "Vine Whip", type: "grass", power: 45, accuracy: 100, pp: 25, maxPp: 25 },
      { name: "Growl", type: "normal", power: 0, accuracy: 100, pp: 40, maxPp: 40 },
    ],
  },
  {
    id: 4,
    name: "charmander",
    genus: "Lizard Pokémon",
    type: "fire",
    types: ["fire"],
    description: "The flame that burns at the tip of its tail is an indication of its emotions and vitality.",
    baseStats: { hp: 39, attack: 52, defense: 43, spAttack: 60, spDefense: 50, speed: 65 },
    starterMoves: [
      { name: "Scratch", type: "normal", power: 40, accuracy: 100, pp: 35, maxPp: 35 },
      { name: "Ember", type: "fire", power: 40, accuracy: 100, pp: 25, maxPp: 25 },
      { name: "Growl", type: "normal", power: 0, accuracy: 100, pp: 40, maxPp: 40 },
    ],
  },
  {
    id: 7,
    name: "squirtle",
    genus: "Tiny Turtle Pokémon",
    type: "water",
    types: ["water"],
    description: "After birth, its back swells and hardens into a shell. Powerfully sprays foam from its mouth.",
    baseStats: { hp: 44, attack: 48, defense: 65, spAttack: 50, spDefense: 64, speed: 43 },
    starterMoves: [
      { name: "Tackle", type: "normal", power: 40, accuracy: 100, pp: 35, maxPp: 35 },
      { name: "Water Gun", type: "water", power: 40, accuracy: 100, pp: 25, maxPp: 25 },
      { name: "Tail Whip", type: "normal", power: 0, accuracy: 100, pp: 30, maxPp: 30 },
    ],
  },
  {
    id: 25,
    name: "pikachu",
    genus: "Mouse Pokémon",
    type: "electric",
    types: ["electric"],
    description: "When several of these Pokémon gather, their electricity could build and cause lightning storms.",
    baseStats: { hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
    starterMoves: [
      { name: "Quick Attack", type: "normal", power: 40, accuracy: 100, pp: 30, maxPp: 30 },
      { name: "Thunder Shock", type: "electric", power: 40, accuracy: 100, pp: 30, maxPp: 30 },
      { name: "Tail Whip", type: "normal", power: 0, accuracy: 100, pp: 30, maxPp: 30 },
    ],
  },
];

// Evolution Stone Map for authentic Pokémon stone evolutions
export const EVOLUTION_STONE_MAP = {
  "pikachu": {
    "thunder-stone": {
      id: 26,
      name: "raichu",
      types: ["electric"],
      baseStats: { hp: 60, attack: 90, defense: 55, spAttack: 90, spDefense: 80, speed: 110 },
    },
  },
  "eevee": {
    "fire-stone": {
      id: 136,
      name: "flareon",
      types: ["fire"],
      baseStats: { hp: 65, attack: 130, defense: 60, spAttack: 95, spDefense: 110, speed: 65 },
    },
    "water-stone": {
      id: 134,
      name: "vaporeon",
      types: ["water"],
      baseStats: { hp: 130, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 65 },
    },
    "thunder-stone": {
      id: 135,
      name: "jolteon",
      types: ["electric"],
      baseStats: { hp: 65, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 130 },
    },
  },
  "vulpix": {
    "fire-stone": {
      id: 38,
      name: "ninetales",
      types: ["fire"],
      baseStats: { hp: 73, attack: 76, defense: 75, spAttack: 81, spDefense: 100, speed: 100 },
    },
  },
  "gloom": {
    "leaf-stone": {
      id: 45,
      name: "vileplume",
      types: ["grass", "poison"],
      baseStats: { hp: 75, attack: 80, defense: 85, spAttack: 110, spDefense: 90, speed: 50 },
    },
  },
  "clefairy": {
    "moon-stone": {
      id: 36,
      name: "clefable",
      types: ["fairy"],
      baseStats: { hp: 95, attack: 70, defense: 73, spAttack: 95, spDefense: 90, speed: 60 },
    },
  },
  "jigglypuff": {
    "moon-stone": {
      id: 40,
      name: "wigglytuff",
      types: ["normal", "fairy"],
      baseStats: { hp: 140, attack: 70, defense: 45, spAttack: 85, spDefense: 50, speed: 45 },
    },
  },
};

// Recalculates stats for a Pokemon when it levels up or evolves
export function recalculatePokemonStats(pokemon, newLevel, newBaseStats = null) {
  const baseStats = newBaseStats || pokemon.baseStats;
  const newMaxHp = calculateHp(baseStats.hp, newLevel);
  const hpDiff = newMaxHp - pokemon.maxHp;
  const newCurrentHp = Math.min(newMaxHp, Math.max(0, pokemon.currentHp + hpDiff));

  return {
    ...pokemon,
    level: newLevel,
    baseStats: baseStats,
    maxHp: newMaxHp,
    currentHp: newCurrentHp,
    attack: calculateStat(baseStats.attack, newLevel),
    defense: calculateStat(baseStats.defense, newLevel),
    spAttack: calculateStat(baseStats.spAttack, newLevel),
    spDefense: calculateStat(baseStats.spDefense, newLevel),
    speed: calculateStat(baseStats.speed, newLevel),
    exp: calculateExpNeeded(newLevel),
    expToNextLevel: calculateExpNeeded(newLevel + 1),
  };
}

// Factory: Converts raw PokéAPI data into a dynamic PokemonInstance object
export function createPokemonInstance(rawPokemon, level = 5, nickname = null) {
  const baseHp = rawPokemon.stats?.find(s => s.stat.name === "hp")?.base_stat || rawPokemon.baseStats?.hp || 40;
  const baseAtk = rawPokemon.stats?.find(s => s.stat.name === "attack")?.base_stat || rawPokemon.baseStats?.attack || 40;
  const baseDef = rawPokemon.stats?.find(s => s.stat.name === "defense")?.base_stat || rawPokemon.baseStats?.defense || 40;
  const baseSpAtk = rawPokemon.stats?.find(s => s.stat.name === "special-attack")?.base_stat || rawPokemon.baseStats?.spAttack || 40;
  const baseSpDef = rawPokemon.stats?.find(s => s.stat.name === "special-defense")?.base_stat || rawPokemon.baseStats?.spDefense || 40;
  const baseSpd = rawPokemon.stats?.find(s => s.stat.name === "speed")?.base_stat || rawPokemon.baseStats?.speed || 40;

  const maxHp = calculateHp(baseHp, level);
  const types = rawPokemon.types?.map(t => typeof t === "string" ? t : t.type.name) || ["normal"];

  // Default starter moves if none provided
  const moves = rawPokemon.starterMoves || [
    { name: "Tackle", type: "normal", power: 40, accuracy: 100, pp: 35, maxPp: 35 },
    { name: "Quick Attack", type: "normal", power: 40, accuracy: 100, pp: 30, maxPp: 30 },
  ];

  return {
    instanceId: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    id: rawPokemon.id,
    name: rawPokemon.name.toLowerCase(),
    nickname: nickname && nickname.trim() ? nickname.trim() : capitalize(rawPokemon.name),
    level: level,
    types: types,
    sprites: {
      animated: getAnimatedSpriteUrl(rawPokemon.id),
      static: getSpriteUrl(rawPokemon.id),
      artwork: getArtworkUrl(rawPokemon.id),
      backAnimated: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/${rawPokemon.id}.gif`,
    },
    baseStats: {
      hp: baseHp,
      attack: baseAtk,
      defense: baseDef,
      spAttack: baseSpAtk,
      spDefense: baseSpDef,
      speed: baseSpd,
    },
    maxHp: maxHp,
    currentHp: maxHp,
    attack: calculateStat(baseAtk, level),
    defense: calculateStat(baseDef, level),
    spAttack: calculateStat(baseSpAtk, level),
    spDefense: calculateStat(baseSpDef, level),
    speed: calculateStat(baseSpd, level),
    exp: calculateExpNeeded(level),
    expToNextLevel: calculateExpNeeded(level + 1),
    moves: moves,
    status: null, // null | "burn" | "paralysis" | "sleep" | "poison" | "fainted"
    caughtDate: new Date().toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  };
}
