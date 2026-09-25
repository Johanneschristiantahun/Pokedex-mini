// ========================================================
// PokéSphere Battle Tower — Endless Survival Gauntlet
// Scaling difficulty tiers, trainer classes, and milestone rewards
// ========================================================

import { MOVE_CATALOG } from "./pokemonMoves.js";

function resolveMove(moveKey) {
  const move = MOVE_CATALOG[moveKey] || MOVE_CATALOG.tackle;
  return {
    ...move,
    currentPp: move.maxPp,
  };
}

export const TOWER_RANKS = [
  { minStreak: 0, title: "Bronze Challenger", color: "#b45309" },
  { minStreak: 5, title: "Silver Striker", color: "#64748b" },
  { minStreak: 10, title: "Gold Tactician", color: "#eab308" },
  { minStreak: 15, title: "Platinum Ace", color: "#06b6d4" },
  { minStreak: 21, title: "Tower Tycoon Legend", color: "#a855f7" },
];

export function getTowerRank(streak) {
  for (let i = TOWER_RANKS.length - 1; i >= 0; i--) {
    if (streak >= TOWER_RANKS[i].minStreak) {
      return TOWER_RANKS[i];
    }
  }
  return TOWER_RANKS[0];
}

export const TOWER_OPPONENT_CLASSES = [
  {
    className: "Ace Trainer Kyle",
    sprite: "https://play.pokemonshowdown.com/sprites/trainers/acetrainer.png",
    quote: "My team was bred for competitive battle perfection! Let's see your tactical skill!",
    pool: [
      { id: 18, name: "pidgeot", level: 50, moves: [resolveMove("air-slash"), resolveMove("quick-attack")] },
      { id: 59, name: "arcanine", level: 50, moves: [resolveMove("flamethrower"), resolveMove("crunch")] },
      { id: 130, name: "gyarados", level: 50, moves: [resolveMove("surf"), resolveMove("crunch")] },
      { id: 121, name: "starmie", level: 50, moves: [resolveMove("surf"), resolveMove("psychic")] },
      { id: 143, name: "snorlax", level: 50, moves: [resolveMove("body-slam"), resolveMove("earthquake")] },
    ],
  },
  {
    className: "Veteran Sean",
    sprite: "https://play.pokemonshowdown.com/sprites/trainers/veteran.png",
    quote: "Decades of battle experience flow through every command I issue. Prepare yourself!",
    pool: [
      { id: 65, name: "alakazam", level: 55, moves: [resolveMove("psychic"), resolveMove("shadow-ball")] },
      { id: 68, name: "machamp", level: 55, moves: [resolveMove("close-combat"), resolveMove("rock-slide")] },
      { id: 94, name: "gengar", level: 55, moves: [resolveMove("shadow-ball"), resolveMove("sludge-bomb")] },
      { id: 112, name: "rhydon", level: 55, moves: [resolveMove("earthquake"), resolveMove("rock-slide")] },
      { id: 131, name: "lapras", level: 55, moves: [resolveMove("ice-beam"), resolveMove("surf")] },
    ],
  },
  {
    className: "Dragon Tamer Drake",
    sprite: "https://play.pokemonshowdown.com/sprites/trainers/dragontamer.png",
    quote: "The primordial wrath of dragons cannot be tamed by ordinary trainers!",
    pool: [
      { id: 148, name: "dragonair", level: 60, moves: [resolveMove("dragon-claw"), resolveMove("thunderbolt")] },
      { id: 142, name: "aerodactyl", level: 60, moves: [resolveMove("rock-slide"), resolveMove("wing-attack")] },
      { id: 149, name: "dragonite", level: 62, moves: [resolveMove("dragon-claw"), resolveMove("fire-blast")] },
      { id: 130, name: "gyarados", level: 60, moves: [resolveMove("hydro-pump"), resolveMove("crunch")] },
      { id: 6, name: "charizard", level: 62, moves: [resolveMove("flamethrower"), resolveMove("dragon-claw")] },
    ],
  },
  {
    className: "Tower Tycoon Palmer",
    sprite: "https://play.pokemonshowdown.com/sprites/trainers/palmer.png",
    quote: "Hahaha! Excellent determination! Let's see if your bond can withstand the pinnacle of the Tower!",
    pool: [
      { id: 143, name: "snorlax", level: 75, moves: [resolveMove("body-slam"), resolveMove("earthquake"), resolveMove("crunch")] },
      { id: 149, name: "dragonite", level: 75, moves: [resolveMove("dragon-claw"), resolveMove("hyper-beam"), resolveMove("blizzard")] },
      { id: 112, name: "rhydon", level: 75, moves: [resolveMove("earthquake"), resolveMove("rock-slide"), resolveMove("iron-head")] },
      { id: 68, name: "machamp", level: 75, moves: [resolveMove("close-combat"), resolveMove("earthquake"), resolveMove("brick-break")] },
    ],
  },
];

/**
 * Generate a randomized Tower challenger scaled to current streak
 */
export function generateTowerChallenger(streak = 1) {
  let trainerClass = TOWER_OPPONENT_CLASSES[0];
  if (streak >= 21 || (streak > 0 && streak % 7 === 0)) {
    trainerClass = TOWER_OPPONENT_CLASSES[3]; // Tycoon
  } else if (streak >= 14) {
    trainerClass = TOWER_OPPONENT_CLASSES[2]; // Dragon Tamer
  } else if (streak >= 7) {
    trainerClass = TOWER_OPPONENT_CLASSES[1]; // Veteran
  }

  // Level scaling: 50 + streak
  const targetLevel = Math.min(85, 48 + streak);

  // Pick 3 unique pokemon from pool
  const shuffled = [...trainerClass.pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map((mon) => {
    const calcHp = Math.round(100 + targetLevel * 2.2);
    return {
      id: mon.id,
      name: mon.name,
      nickname: mon.name.toUpperCase(),
      level: targetLevel,
      currentHp: calcHp,
      maxHp: calcHp,
      attack: Math.round(50 + targetLevel * 1.6),
      defense: Math.round(50 + targetLevel * 1.5),
      speed: Math.round(50 + targetLevel * 1.4),
      types: mon.name === "charizard" ? ["fire", "flying"] : mon.name === "gyarados" ? ["water", "flying"] : ["normal"],
      moves: mon.moves,
    };
  });

  return {
    name: trainerClass.className,
    sprite: trainerClass.sprite,
    quote: trainerClass.quote,
    team: selected,
    streakNumber: streak,
    prizeMoney: 1500 + streak * 500,
  };
}
