// Gen 6+ Official 18-Type Effectiveness Table
// Provides defensive damage multiplier calculations for single & dual-type Pokémon.

export const ALL_POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

// Map of [attackerType][defenderType] = damageMultiplier (defaults to 1 if omitted)
export const ATTACK_MULTIPLIERS = {
  normal: {
    rock: 0.5,
    ghost: 0,
    steel: 0.5,
  },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: {
    fire: 2,
    water: 0.5,
    grass: 0.5,
    ground: 2,
    rock: 2,
    dragon: 0.5,
  },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: {
    fighting: 2,
    poison: 2,
    psychic: 0.5,
    dark: 0,
    steel: 0.5,
  },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: {
    normal: 0,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
  },
  dragon: {
    dragon: 2,
    steel: 0.5,
    fairy: 0,
  },
  dark: {
    fighting: 0.5,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
    fairy: 0.5,
  },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
};

/**
 * Calculates defensive multipliers against all 18 attacking types.
 *
 * @param {Array<string|object>} defenderTypes - Array of type names or PokéAPI type objects
 * @returns {object} {
 *   weaknesses4x: [{ type: string, multiplier: 4 }],
 *   weaknesses2x: [{ type: string, multiplier: 2 }],
 *   resistances05x: [{ type: string, multiplier: 0.5 }],
 *   resistances025x: [{ type: string, multiplier: 0.25 }],
 *   immunities0x: [{ type: string, multiplier: 0 }],
 *   neutral: [{ type: string, multiplier: 1 }]
 * }
 */
export function calculateDefensiveMatchups(defenderTypes = []) {
  const normalizedTypes = (defenderTypes || [])
    .map((t) => {
      if (typeof t === "string") return t.toLowerCase();
      if (t && typeof t === "object" && t.type?.name) return t.type.name.toLowerCase();
      if (t && typeof t === "object" && t.name) return t.name.toLowerCase();
      return null;
    })
    .filter(Boolean);

  if (normalizedTypes.length === 0) {
    return {
      weaknesses4x: [],
      weaknesses2x: [],
      resistances05x: [],
      resistances025x: [],
      immunities0x: [],
      neutral: [],
    };
  }

  const result = {
    weaknesses4x: [],
    weaknesses2x: [],
    resistances05x: [],
    resistances025x: [],
    immunities0x: [],
    neutral: [],
  };

  ALL_POKEMON_TYPES.forEach((attackerType) => {
    let multiplier = 1;

    for (const defType of normalizedTypes) {
      const typeChart = ATTACK_MULTIPLIERS[attackerType];
      if (typeChart && typeChart[defType] !== undefined) {
        multiplier *= typeChart[defType];
      }
    }

    const item = { type: attackerType, multiplier };

    if (multiplier >= 4) {
      result.weaknesses4x.push(item);
    } else if (multiplier >= 2) {
      result.weaknesses2x.push(item);
    } else if (multiplier === 0) {
      result.immunities0x.push(item);
    } else if (multiplier <= 0.25) {
      result.resistances025x.push(item);
    } else if (multiplier <= 0.5) {
      result.resistances05x.push(item);
    } else {
      result.neutral.push(item);
    }
  });

  return result;
}

export function getTypeDamageMultiplier(attackType, defenderTypes = []) {
  if (!attackType) return 1.0;
  const chart = ATTACK_MULTIPLIERS[attackType.toLowerCase()];
  if (!chart) return 1.0;
  let mult = 1.0;
  const list = Array.isArray(defenderTypes) ? defenderTypes : [defenderTypes];
  for (const defType of list) {
    if (!defType) continue;
    const val = chart[defType.toLowerCase()];
    if (val !== undefined) {
      mult *= val;
    }
  }
  return mult;
}
