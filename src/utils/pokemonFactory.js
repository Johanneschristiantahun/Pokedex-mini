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

import {
  LEVEL_UP_EVOLUTIONS,
  STONE_EVOLUTIONS,
  checkLevelEvolution,
  checkStoneEvolution,
} from "../data/evolutionData.js";
import {
  getAnimatedShinySpriteUrl,
  getArtworkShinyUrl,
} from "../utils.js";

export {
  LEVEL_UP_EVOLUTIONS,
  STONE_EVOLUTIONS,
  checkLevelEvolution,
  checkStoneEvolution,
};

// Backward-compatible alias for existing imports
export const EVOLUTION_STONE_MAP = STONE_EVOLUTIONS;

// Evolve a Pokemon instance into its target evolution form
export function evolvePokemonInstance(pokemon, targetEvo) {
  if (!pokemon || !targetEvo) return pokemon;

  const targetId = targetEvo.targetId;
  const targetName = targetEvo.targetName.toLowerCase();
  const baseStats = targetEvo.baseStats || pokemon.baseStats;
  const level = pokemon.level || 5;

  const newMaxHp = calculateHp(baseStats.hp, level);
  const hpIncrease = Math.max(0, newMaxHp - (pokemon.maxHp || newMaxHp));
  const newCurrentHp = Math.min(newMaxHp, (pokemon.currentHp || newMaxHp) + hpIncrease);

  // If nickname was the old default species name, update to new species name
  const wasDefaultNickname =
    !pokemon.nickname ||
    pokemon.nickname.toLowerCase() === pokemon.name.toLowerCase();
  const nextNickname = wasDefaultNickname ? capitalize(targetName) : pokemon.nickname;

  const isShiny = Boolean(pokemon.isShiny);

  return {
    ...pokemon,
    id: targetId,
    name: targetName,
    nickname: nextNickname,
    types: targetEvo.types || pokemon.types,
    baseStats: baseStats,
    maxHp: newMaxHp,
    currentHp: newCurrentHp,
    attack: calculateStat(baseStats.attack, level),
    defense: calculateStat(baseStats.defense, level),
    spAttack: calculateStat(baseStats.spAttack, level),
    spDefense: calculateStat(baseStats.spDefense, level),
    speed: calculateStat(baseStats.speed, level),
    sprites: {
      animated: isShiny
        ? getAnimatedShinySpriteUrl(targetId)
        : getAnimatedSpriteUrl(targetId),
      static: getSpriteUrl(targetId),
      artwork: isShiny
        ? getArtworkShinyUrl(targetId)
        : getArtworkUrl(targetId),
      backAnimated: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/${targetId}.gif`,
    },
  };
}

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
