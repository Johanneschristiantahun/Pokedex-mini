export const API_BASE_URL = "https://pokeapi.co/api/v2";

export const SPRITE_BASE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

// Animated showdown GIFs (moving Pokemon!)
export const ANIMATED_SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown";

// High-res official artwork
export const OFFICIAL_ARTWORK_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

// Official Pokemon sound effects (cries)
export const CRIES_BASE_URL =
  "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest";

// Item Sprites
export const ITEM_SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

// 9 Generations definition with offsets and counts
export const GENERATIONS = [
  { id: 1, name: "Gen 1 (Kanto)", offset: 0, limit: 151, region: "Kanto" },
  { id: 2, name: "Gen 2 (Johto)", offset: 151, limit: 100, region: "Johto" },
  { id: 3, name: "Gen 3 (Hoenn)", offset: 251, limit: 135, region: "Hoenn" },
  { id: 4, name: "Gen 4 (Sinnoh)", offset: 386, limit: 107, region: "Sinnoh" },
  { id: 5, name: "Gen 5 (Unova)", offset: 493, limit: 156, region: "Unova" },
  { id: 6, name: "Gen 6 (Kalos)", offset: 649, limit: 72, region: "Kalos" },
  { id: 7, name: "Gen 7 (Alola)", offset: 721, limit: 88, region: "Alola" },
  { id: 8, name: "Gen 8 (Galar)", offset: 809, limit: 96, region: "Galar" },
  { id: 9, name: "Gen 9 (Paldea)", offset: 905, limit: 120, region: "Paldea" },
];
