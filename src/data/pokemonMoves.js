// ========================================================
// PokéSphere RPG Move Catalog & Generator
// Provides authentic moves with Type, Power, Accuracy, and PP
// ========================================================

export const MOVE_CATALOG = {
  // Normal
  tackle: {
    id: "tackle",
    name: "Tackle",
    type: "normal",
    power: 40,
    accuracy: 100,
    maxPp: 35,
    category: "physical",
    desc: "A full-body charge attack.",
  },
  scratch: {
    id: "scratch",
    name: "Scratch",
    type: "normal",
    power: 40,
    accuracy: 100,
    maxPp: 35,
    category: "physical",
    desc: "Sharp claws rake the target.",
  },
  "quick-attack": {
    id: "quick-attack",
    name: "Quick Attack",
    type: "normal",
    power: 40,
    accuracy: 100,
    maxPp: 30,
    category: "physical",
    desc: "Strikes with blinding speed.",
  },
  "body-slam": {
    id: "body-slam",
    name: "Body Slam",
    type: "normal",
    power: 85,
    accuracy: 100,
    maxPp: 15,
    category: "physical",
    desc: "A heavy body drop that crushes the foe.",
  },
  "hyper-beam": {
    id: "hyper-beam",
    name: "Hyper Beam",
    type: "normal",
    power: 120,
    accuracy: 90,
    maxPp: 5,
    category: "special",
    desc: "A devastating beam of pure destructive energy.",
  },

  // Fire
  ember: {
    id: "ember",
    name: "Ember",
    type: "fire",
    power: 40,
    accuracy: 100,
    maxPp: 25,
    category: "special",
    desc: "Small flames attack the target.",
  },
  "flame-wheel": {
    id: "flame-wheel",
    name: "Flame Wheel",
    type: "fire",
    power: 60,
    accuracy: 100,
    maxPp: 20,
    category: "physical",
    desc: "Cloaks user in fire and rams the target.",
  },
  flamethrower: {
    id: "flamethrower",
    name: "Flamethrower",
    type: "fire",
    power: 90,
    accuracy: 100,
    maxPp: 15,
    category: "special",
    desc: "A searing blast of intense fire.",
  },
  "fire-blast": {
    id: "fire-blast",
    name: "Fire Blast",
    type: "fire",
    power: 110,
    accuracy: 85,
    maxPp: 5,
    category: "special",
    desc: "An all-consuming blast shaped like a fire symbol.",
  },

  // Water
  "water-gun": {
    id: "water-gun",
    name: "Water Gun",
    type: "water",
    power: 40,
    accuracy: 100,
    maxPp: 25,
    category: "special",
    desc: "Squirts water forcefully at the target.",
  },
  "water-pulse": {
    id: "water-pulse",
    name: "Water Pulse",
    type: "water",
    power: 60,
    accuracy: 100,
    maxPp: 20,
    category: "special",
    desc: "Attacks with pulsing ultrasonic water waves.",
  },
  surf: {
    id: "surf",
    name: "Surf",
    type: "water",
    power: 90,
    accuracy: 100,
    maxPp: 15,
    category: "special",
    desc: "Swamps the target with a giant tidal wave.",
  },
  "hydro-pump": {
    id: "hydro-pump",
    name: "Hydro Pump",
    type: "water",
    power: 110,
    accuracy: 80,
    maxPp: 5,
    category: "special",
    desc: "Blasts huge volumes of water under high pressure.",
  },

  // Grass
  "vine-whip": {
    id: "vine-whip",
    name: "Vine Whip",
    type: "grass",
    power: 45,
    accuracy: 100,
    maxPp: 25,
    category: "physical",
    desc: "Strikes the foe with slender vines.",
  },
  "razor-leaf": {
    id: "razor-leaf",
    name: "Razor Leaf",
    type: "grass",
    power: 55,
    accuracy: 95,
    maxPp: 25,
    category: "physical",
    desc: "Cuts sharp-edged leaves to slice the foe.",
  },
  "energy-ball": {
    id: "energy-ball",
    name: "Energy Ball",
    type: "grass",
    power: 90,
    accuracy: 100,
    maxPp: 10,
    category: "special",
    desc: "Draws power from nature and fires a concentrated orb.",
  },
  "solar-beam": {
    id: "solar-beam",
    name: "Solar Beam",
    type: "grass",
    power: 120,
    accuracy: 100,
    maxPp: 10,
    category: "special",
    desc: "Absorbs sunlight and unleashes a massive ray.",
  },

  // Electric
  "thunder-shock": {
    id: "thunder-shock",
    name: "Thunder Shock",
    type: "electric",
    power: 40,
    accuracy: 100,
    maxPp: 30,
    category: "special",
    desc: "A small jolt of electricity strikes the foe.",
  },
  spark: {
    id: "spark",
    name: "Spark",
    type: "electric",
    power: 65,
    accuracy: 100,
    maxPp: 20,
    category: "physical",
    desc: "Electrically charged tackle attack.",
  },
  thunderbolt: {
    id: "thunderbolt",
    name: "Thunderbolt",
    type: "electric",
    power: 90,
    accuracy: 100,
    maxPp: 15,
    category: "special",
    desc: "A strong electrical blast crashes down on the foe.",
  },
  thunder: {
    id: "thunder",
    name: "Thunder",
    type: "electric",
    power: 110,
    accuracy: 70,
    maxPp: 10,
    category: "special",
    desc: "A wicked thunderbolt crashes down with fury.",
  },

  // Ice
  "powder-snow": {
    id: "powder-snow",
    name: "Powder Snow",
    type: "ice",
    power: 40,
    accuracy: 100,
    maxPp: 25,
    category: "special",
    desc: "Blasts frosty snow over the target.",
  },
  "ice-beam": {
    id: "ice-beam",
    name: "Ice Beam",
    type: "ice",
    power: 90,
    accuracy: 100,
    maxPp: 10,
    category: "special",
    desc: "Fires an icy beam that freezes everything.",
  },
  blizzard: {
    id: "blizzard",
    name: "Blizzard",
    type: "ice",
    power: 110,
    accuracy: 70,
    maxPp: 5,
    category: "special",
    desc: "A howling blizzard batters the foe.",
  },

  // Fighting
  "karate-chop": {
    id: "karate-chop",
    name: "Karate Chop",
    type: "fighting",
    power: 50,
    accuracy: 100,
    maxPp: 25,
    category: "physical",
    desc: "A sharp, focused chop with the hand.",
  },
  "brick-break": {
    id: "brick-break",
    name: "Brick Break",
    type: "fighting",
    power: 75,
    accuracy: 100,
    maxPp: 15,
    category: "physical",
    desc: "Swift, devastating hand strike.",
  },
  "close-combat": {
    id: "close-combat",
    name: "Close Combat",
    type: "fighting",
    power: 120,
    accuracy: 100,
    maxPp: 5,
    category: "physical",
    desc: "Fights up close without guarding.",
  },

  // Poison
  "poison-sting": {
    id: "poison-sting",
    name: "Poison Sting",
    type: "poison",
    power: 35,
    accuracy: 100,
    maxPp: 35,
    category: "physical",
    desc: "A toxic barb pierces the target.",
  },
  sludge: {
    id: "sludge",
    name: "Sludge",
    type: "poison",
    power: 65,
    accuracy: 100,
    maxPp: 20,
    category: "special",
    desc: "Unclean sludge is hurled at the foe.",
  },
  "sludge-bomb": {
    id: "sludge-bomb",
    name: "Sludge Bomb",
    type: "poison",
    power: 90,
    accuracy: 100,
    maxPp: 10,
    category: "special",
    desc: "Unleashes a toxic explosion of filth.",
  },

  // Ground
  "mud-slap": {
    id: "mud-slap",
    name: "Mud-Slap",
    type: "ground",
    power: 30,
    accuracy: 100,
    maxPp: 30,
    category: "special",
    desc: "Hurls mud in the face of the foe.",
  },
  magnitude: {
    id: "magnitude",
    name: "Magnitude",
    type: "ground",
    power: 70,
    accuracy: 100,
    maxPp: 20,
    category: "physical",
    desc: "Shakes the ground with seismic waves.",
  },
  earthquake: {
    id: "earthquake",
    name: "Earthquake",
    type: "ground",
    power: 100,
    accuracy: 100,
    maxPp: 10,
    category: "physical",
    desc: "A devastating tremor rocks the ground.",
  },

  // Flying
  gust: {
    id: "gust",
    name: "Gust",
    type: "flying",
    power: 40,
    accuracy: 100,
    maxPp: 35,
    category: "special",
    desc: "Whips up a strong whirlwind.",
  },
  "wing-attack": {
    id: "wing-attack",
    name: "Wing Attack",
    type: "flying",
    power: 60,
    accuracy: 100,
    maxPp: 35,
    category: "physical",
    desc: "Strikes the foe with spread wings.",
  },
  "air-slash": {
    id: "air-slash",
    name: "Air Slash",
    type: "flying",
    power: 75,
    accuracy: 95,
    maxPp: 15,
    category: "special",
    desc: "Slices with blades of compressed wind.",
  },

  // Psychic
  confusion: {
    id: "confusion",
    name: "Confusion",
    type: "psychic",
    power: 50,
    accuracy: 100,
    maxPp: 25,
    category: "special",
    desc: "A weak telekinetic pulse attacks the mind.",
  },
  psybeam: {
    id: "psybeam",
    name: "Psybeam",
    type: "psychic",
    power: 65,
    accuracy: 100,
    maxPp: 20,
    category: "special",
    desc: "A peculiar ray that confuses the senses.",
  },
  psychic: {
    id: "psychic",
    name: "Psychic",
    type: "psychic",
    power: 90,
    accuracy: 100,
    maxPp: 10,
    category: "special",
    desc: "Powerful telekinetic telepathy smashes the foe.",
  },

  // Bug
  "bug-bite": {
    id: "bug-bite",
    name: "Bug Bite",
    type: "bug",
    power: 60,
    accuracy: 100,
    maxPp: 20,
    category: "physical",
    desc: "The user bites the target sharply.",
  },
  "x-scissor": {
    id: "x-scissor",
    name: "X-Scissor",
    type: "bug",
    power: 80,
    accuracy: 100,
    maxPp: 15,
    category: "physical",
    desc: "Crosses scythes or claws to slash in an X shape.",
  },

  // Rock
  "rock-throw": {
    id: "rock-throw",
    name: "Rock Throw",
    type: "rock",
    power: 50,
    accuracy: 90,
    maxPp: 15,
    category: "physical",
    desc: "Hurls small boulders at the foe.",
  },
  "rock-slide": {
    id: "rock-slide",
    name: "Rock Slide",
    type: "rock",
    power: 75,
    accuracy: 90,
    maxPp: 10,
    category: "physical",
    desc: "Causes large boulders to slide down on the foe.",
  },

  // Ghost
  lick: {
    id: "lick",
    name: "Lick",
    type: "ghost",
    power: 30,
    accuracy: 100,
    maxPp: 30,
    category: "physical",
    desc: "Licks with a chilling ghostly tongue.",
  },
  "shadow-ball": {
    id: "shadow-ball",
    name: "Shadow Ball",
    type: "ghost",
    power: 80,
    accuracy: 100,
    maxPp: 15,
    category: "special",
    desc: "Hurls a shadowy blob at the target.",
  },

  // Dragon
  "dragon-breath": {
    id: "dragon-breath",
    name: "Dragon Breath",
    type: "dragon",
    power: 60,
    accuracy: 100,
    maxPp: 20,
    category: "special",
    desc: "Exhales a breath of mystical dragon fire.",
  },
  "dragon-claw": {
    id: "dragon-claw",
    name: "Dragon Claw",
    type: "dragon",
    power: 80,
    accuracy: 100,
    maxPp: 15,
    category: "physical",
    desc: "Sharp draconic claws slash the foe.",
  },

  // Steel
  "metal-claw": {
    id: "metal-claw",
    name: "Metal Claw",
    type: "steel",
    power: 50,
    accuracy: 95,
    maxPp: 35,
    category: "physical",
    desc: "Strikes with hard, steel-tipped claws.",
  },
  "iron-head": {
    id: "iron-head",
    name: "Iron Head",
    type: "steel",
    power: 80,
    accuracy: 100,
    maxPp: 15,
    category: "physical",
    desc: "Slams target with a head hard as steel.",
  },

  // Dark
  bite: {
    id: "bite",
    name: "Bite",
    type: "dark",
    power: 60,
    accuracy: 100,
    maxPp: 25,
    category: "physical",
    desc: "Bites down with vicious, sharp fangs.",
  },
  crunch: {
    id: "crunch",
    name: "Crunch",
    type: "dark",
    power: 80,
    accuracy: 100,
    maxPp: 15,
    category: "physical",
    desc: "Crunches with dark, vicious fangs.",
  },

  // Fairy
  "disarming-voice": {
    id: "disarming-voice",
    name: "Disarming Voice",
    type: "fairy",
    power: 40,
    accuracy: 100,
    maxPp: 15,
    category: "special",
    desc: "Emotional crying voice that never misses.",
  },
  moonblast: {
    id: "moonblast",
    name: "Moonblast",
    type: "fairy",
    power: 95,
    accuracy: 100,
    maxPp: 15,
    category: "special",
    desc: "Unleashes the ethereal power of the moon.",
  },
};

// Map each type to their tier 1 and tier 2 signature moves
const TYPE_SIGNATURE_MOVES = {
  normal: ["quick-attack", "body-slam"],
  fire: ["ember", "flamethrower"],
  water: ["water-gun", "surf"],
  grass: ["vine-whip", "razor-leaf"],
  electric: ["thunder-shock", "thunderbolt"],
  ice: ["powder-snow", "ice-beam"],
  fighting: ["karate-chop", "brick-break"],
  poison: ["poison-sting", "sludge-bomb"],
  ground: ["mud-slap", "earthquake"],
  flying: ["gust", "wing-attack"],
  psychic: ["confusion", "psychic"],
  bug: ["bug-bite", "x-scissor"],
  rock: ["rock-throw", "rock-slide"],
  ghost: ["lick", "shadow-ball"],
  dragon: ["dragon-breath", "dragon-claw"],
  steel: ["metal-claw", "iron-head"],
  dark: ["bite", "crunch"],
  fairy: ["disarming-voice", "moonblast"],
};

/**
 * Generate 4 authentic RPG moves for any Pokémon based on its types & level.
 */
export function getPokemonMoves(pokemon) {
  if (!pokemon) return [];

  const types = (pokemon.types || ["normal"]).map((t) => (typeof t === "string" ? t.toLowerCase() : t?.type?.name || "normal"));
  const primaryType = types[0] || "normal";
  const secondaryType = types[1] || primaryType;
  const level = pokemon.level || 5;

  const moveKeys = [];

  // Slot 1: Basic Physical Normal move
  if (pokemon.name?.toLowerCase().includes("char") || pokemon.name?.toLowerCase().includes("cat") || pokemon.name?.toLowerCase().includes("meow")) {
    moveKeys.push("scratch");
  } else {
    moveKeys.push("tackle");
  }

  // Slot 2: Primary Type Signature Move
  const primarySigs = TYPE_SIGNATURE_MOVES[primaryType] || TYPE_SIGNATURE_MOVES.normal;
  moveKeys.push(primarySigs[0]);

  // Slot 3: Secondary Type Signature or Advanced Primary
  if (secondaryType !== primaryType && TYPE_SIGNATURE_MOVES[secondaryType]) {
    moveKeys.push(TYPE_SIGNATURE_MOVES[secondaryType][0]);
  } else if (level >= 18) {
    moveKeys.push(primarySigs[1]);
  } else {
    moveKeys.push("quick-attack");
  }

  // Slot 4: High-tier Move or Utility
  if (level >= 25 && primarySigs[1] && !moveKeys.includes(primarySigs[1])) {
    moveKeys.push(primarySigs[1]);
  } else if (!moveKeys.includes("quick-attack")) {
    moveKeys.push("quick-attack");
  } else {
    moveKeys.push("body-slam");
  }

  // Deduplicate and fallback
  const uniqueKeys = Array.from(new Set(moveKeys));
  while (uniqueKeys.length < 4) {
    const filler = ["quick-attack", "bite", "body-slam", "tackle"].find((k) => !uniqueKeys.includes(k));
    uniqueKeys.push(filler || "tackle");
  }

  return uniqueKeys.slice(0, 4).map((k) => {
    const m = MOVE_CATALOG[k] || MOVE_CATALOG.tackle;
    return {
      ...m,
      currentPp: m.maxPp,
    };
  });
}

/**
 * Pick a suitable move for wild opponent
 */
export function pickWildMove(wildPokemon) {
  const moves = getPokemonMoves(wildPokemon);
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex] || MOVE_CATALOG.tackle;
}
