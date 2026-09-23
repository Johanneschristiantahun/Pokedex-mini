import {
  SPRITE_BASE_URL,
  ANIMATED_SPRITE_URL,
  OFFICIAL_ARTWORK_URL,
  CRIES_BASE_URL,
} from "./config.js";

// Official 18 Pokemon Type Colors & Theme Palettes
export const TYPE_COLORS = {
  normal: { primary: "#A8A77A", bg: "#f7f7f3", text: "#FFFFFF" },
  fire: { primary: "#EE8130", bg: "#fef3eb", text: "#FFFFFF" },
  water: { primary: "#6390F0", bg: "#eff4fe", text: "#FFFFFF" },
  electric: { primary: "#F7D02C", bg: "#fefde8", text: "#222222" },
  grass: { primary: "#7AC74C", bg: "#f2faee", text: "#FFFFFF" },
  ice: { primary: "#96D9D6", bg: "#f3fbfb", text: "#222222" },
  fighting: { primary: "#C22E28", bg: "#faeceb", text: "#FFFFFF" },
  poison: { primary: "#A33EA1", bg: "#f8ecf8", text: "#FFFFFF" },
  ground: { primary: "#E2BF65", bg: "#fcf8ee", text: "#FFFFFF" },
  flying: { primary: "#A98FF3", bg: "#f6f3fe", text: "#FFFFFF" },
  psychic: { primary: "#F95587", bg: "#feeff4", text: "#FFFFFF" },
  bug: { primary: "#A6B91A", bg: "#f7f9e8", text: "#FFFFFF" },
  rock: { primary: "#B6A136", bg: "#f8f6ec", text: "#FFFFFF" },
  ghost: { primary: "#735797", bg: "#f2eff6", text: "#FFFFFF" },
  dragon: { primary: "#6F35FC", bg: "#f1ebfe", text: "#FFFFFF" },
  steel: { primary: "#B7B7CE", bg: "#f6f6f9", text: "#222222" },
  dark: { primary: "#705746", bg: "#f2efed", text: "#FFFFFF" },
  fairy: { primary: "#D685AD", bg: "#fbf2f6", text: "#FFFFFF" },
};

// In-Memory Fast Cache for Instant 0ms Load
export const genDataCache = {};
export const pokemonDetailCache = {};

export function getIdFromUrl(url) {
  if (!url) return "1";
  const parts = url.toString().split("/").filter(Boolean);
  return parts[parts.length - 1];
}

export function formatPokemonId(id) {
  const num = parseInt(id, 10);
  if (isNaN(num)) return "#000";
  return "#" + num.toString().padStart(3, "0");
}

export function capitalize(name) {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Fallback static sprite
export function getSpriteUrl(id) {
  return `${SPRITE_BASE_URL}/${id}.png`;
}

// Moving animated showdown GIF
export function getAnimatedSpriteUrl(id) {
  return `${ANIMATED_SPRITE_URL}/${id}.gif`;
}

// Moving animated showdown Shiny GIF
export function getAnimatedShinySpriteUrl(id) {
  return `${ANIMATED_SPRITE_URL}/shiny/${id}.gif`;
}

// Moving animated showdown BACK GIF
export function getAnimatedBackSpriteUrl(id) {
  return `${ANIMATED_SPRITE_URL}/back/${id}.gif`;
}

// Moving animated showdown Shiny BACK GIF
export function getAnimatedBackShinySpriteUrl(id) {
  return `${ANIMATED_SPRITE_URL}/back/shiny/${id}.gif`;
}

// Fallback static back sprite
export function getBackSpriteUrl(id) {
  return `${SPRITE_BASE_URL}/back/${id}.png`;
}

// High-res official artwork
export function getArtworkUrl(id) {
  return `${OFFICIAL_ARTWORK_URL}/${id}.png`;
}

// High-res official shiny artwork
export function getArtworkShinyUrl(id) {
  return `${OFFICIAL_ARTWORK_URL}/shiny/${id}.png`;
}

// Official cry audio URL
export function getCryUrl(id) {
  return `${CRIES_BASE_URL}/${id}.ogg`;
}

// Audio Manager Singleton: stops previous cry so sounds never overlap
let currentCryAudio = null;

import { getMasterMute } from "./utils/soundEffects.js";

export function playPokemonCry(id) {
  if (getMasterMute()) return;

  try {
    if (currentCryAudio) {
      currentCryAudio.pause();
      currentCryAudio.currentTime = 0;
    }
    const audio = new Audio(getCryUrl(id));
    audio.volume = 0.5;
    currentCryAudio = audio;
    audio.play().catch(() => {});
  } catch {
    // Audio playback not supported in environment
  }
}

export function stopPokemonCry() {
  if (currentCryAudio) {
    currentCryAudio.pause();
    currentCryAudio.currentTime = 0;
  }
}

// Get primary color of type
export function getTypeColor(typeName) {
  const clean = (typeName || "").toLowerCase();
  return (
    TYPE_COLORS[clean] || {
      primary: "#777777",
      bg: "#f5f5f5",
      text: "#FFFFFF",
    }
  );
}
