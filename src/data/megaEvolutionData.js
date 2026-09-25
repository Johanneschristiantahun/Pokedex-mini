// ========================================================
// PokéSphere Mega Evolution Catalog & Multipliers
// Official Gen 6+ Mega Evolutions for iconic Kanto Pokémon
// ========================================================

export const MEGA_EVOLUTIONS = {
  charizard: {
    baseId: 6,
    megaId: 10034,
    formName: "Mega Charizard X",
    slug: "charizard-megax",
    types: ["fire", "dragon"],
    ability: "Tough Claws",
    boost: {
      attack: 1.35,
      defense: 1.25,
      spAttack: 1.2,
      spDefense: 1.1,
      speed: 1.15,
    },
    frontSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/10034.gif",
    backSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/10034.gif",
    artwork: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10034.png",
    description: "Bathed in blue flames, its draconic powers awaken with unstoppable ferocity.",
  },
  blastoise: {
    baseId: 9,
    megaId: 10036,
    formName: "Mega Blastoise",
    slug: "blastoise-mega",
    types: ["water"],
    ability: "Mega Launcher",
    boost: {
      attack: 1.2,
      defense: 1.3,
      spAttack: 1.45,
      spDefense: 1.25,
      speed: 1.05,
    },
    frontSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/10036.gif",
    backSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/10036.gif",
    artwork: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10036.png",
    description: "The giant shell cannon on its back fires water shells powerful enough to pierce steel.",
  },
  venusaur: {
    baseId: 3,
    megaId: 10033,
    formName: "Mega Venusaur",
    slug: "venusaur-mega",
    types: ["grass", "poison"],
    ability: "Thick Fat",
    boost: {
      attack: 1.2,
      defense: 1.35,
      spAttack: 1.35,
      spDefense: 1.35,
      speed: 1.05,
    },
    frontSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/10033.gif",
    backSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/10033.gif",
    artwork: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10033.png",
    description: "A gigantic, fragrant flower blooms on its back, granting tremendous natural resilience.",
  },
  gengar: {
    baseId: 94,
    megaId: 10038,
    formName: "Mega Gengar",
    slug: "gengar-mega",
    types: ["ghost", "poison"],
    ability: "Shadow Tag",
    boost: {
      attack: 1.1,
      defense: 1.2,
      spAttack: 1.5,
      spDefense: 1.2,
      speed: 1.3,
    },
    frontSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/10038.gif",
    backSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/10038.gif",
    artwork: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10038.png",
    description: "Sinks halfway into alternate dimensions, trapping foes in phantom shadows.",
  },
  alakazam: {
    baseId: 65,
    megaId: 10037,
    formName: "Mega Alakazam",
    slug: "alakazam-mega",
    types: ["psychic"],
    ability: "Trace",
    boost: {
      attack: 1.0,
      defense: 1.2,
      spAttack: 1.55,
      spDefense: 1.25,
      speed: 1.35,
    },
    frontSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/10037.gif",
    backSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/10037.gif",
    artwork: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10037.png",
    description: "Five levitating silver spoons channel psychic waves of astronomical magnitude.",
  },
  gyarados: {
    baseId: 130,
    megaId: 10041,
    formName: "Mega Gyarados",
    slug: "gyarados-mega",
    types: ["water", "dark"],
    ability: "Mold Breaker",
    boost: {
      attack: 1.45,
      defense: 1.3,
      spAttack: 1.15,
      spDefense: 1.3,
      speed: 1.05,
    },
    frontSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/10041.gif",
    backSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/10041.gif",
    artwork: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10041.png",
    description: "Pressurized water jets propel it through oceans like a destructive torpedo.",
  },
  mewtwo: {
    baseId: 150,
    megaId: 10044,
    formName: "Mega Mewtwo Y",
    slug: "mewtwo-megay",
    types: ["psychic"],
    ability: "Insomnia",
    boost: {
      attack: 1.3,
      defense: 1.15,
      spAttack: 1.6,
      spDefense: 1.35,
      speed: 1.4,
    },
    frontSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/10044.gif",
    backSprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/10044.gif",
    artwork: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10044.png",
    description: "Its condensed brainpower grants psychic telekinesis that can effortlessly shatter skyscrapers.",
  },
};

/**
 * Check if a Pokémon instance can Mega Evolve
 */
export function getMegaEvolutionData(pokemon) {
  if (!pokemon) return null;
  const nameKey = (pokemon.name || "").toLowerCase();
  return MEGA_EVOLUTIONS[nameKey] || null;
}

/**
 * Apply Mega Evolution stat boost and form transform to active instance during battle
 */
export function applyMegaEvolution(pokemon) {
  const megaData = getMegaEvolutionData(pokemon);
  if (!megaData) return pokemon;

  return {
    ...pokemon,
    isMega: true,
    megaFormName: megaData.formName,
    types: megaData.types,
    ability: megaData.ability,
    attack: Math.round(pokemon.attack * (megaData.boost.attack || 1.25)),
    defense: Math.round(pokemon.defense * (megaData.boost.defense || 1.2)),
    spAttack: Math.round((pokemon.spAttack || pokemon.attack) * (megaData.boost.spAttack || 1.3)),
    spDefense: Math.round((pokemon.spDefense || pokemon.defense) * (megaData.boost.spDefense || 1.2)),
    speed: Math.round(pokemon.speed * (megaData.boost.speed || 1.15)),
    sprites: {
      ...pokemon.sprites,
      animated: megaData.frontSprite,
      backAnimated: megaData.backSprite,
      artwork: megaData.artwork,
    },
  };
}
