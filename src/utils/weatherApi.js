// ========================================================
// PokéSphere Live Real-World Weather Engine
// Powered by Open-Meteo Public Meteorological API
// Connects real-world atmospheric conditions to Pokémon battle mechanics
// ========================================================

export const WEATHER_PRESETS = [
  { id: "auto", name: "Auto-Detect My GPS", lat: null, lon: null },
  { id: "pallet", name: "Pallet Town (Tokyo Plains)", lat: 35.6762, lon: 139.6503 },
  { id: "cerulean", name: "Cerulean City (Waterfalls)", lat: 35.2500, lon: 139.1500 },
  { id: "cinnabar", name: "Cinnabar Island (Volcanic)", lat: 33.1167, lon: 139.8000 },
  { id: "seafoam", name: "Seafoam Caverns (Freezing)", lat: 36.7000, lon: 137.5000 },
  { id: "indigo", name: "Indigo Plateau (High Altitude)", lat: 36.3500, lon: 138.6000 },
];

export const POKEMON_WEATHER_STATES = {
  CLEAR: {
    id: "clear",
    label: "Clear Skies",
    icon: "☀️",
    color: "#f59e0b",
    bgClass: "weather-clear",
    description: "Standard atmospheric conditions. Normal elemental effectiveness.",
    buffType: null,
    nerfType: null,
  },
  SUNNY: {
    id: "sunny",
    label: "Harsh Sunlight",
    icon: "🔥",
    color: "#ef4444",
    bgClass: "weather-sunny",
    description: "Intense solar rays! Fire moves deal +50% damage; Water moves deal -50%.",
    buffType: "fire",
    nerfType: "water",
  },
  RAIN: {
    id: "rain",
    label: "Heavy Rain",
    icon: "🌧️",
    color: "#3b82f6",
    bgClass: "weather-rain",
    description: "Pouring rainstorm! Water moves deal +50% damage; Fire moves deal -50%.",
    buffType: "water",
    nerfType: "fire",
  },
  SNOW: {
    id: "snow",
    label: "Hail & Blizzard",
    icon: "❄️",
    color: "#06b6d4",
    bgClass: "weather-snow",
    description: "Freezing blizzard! Ice Pokémon gain +50% Defense.",
    buffType: "ice",
    nerfType: null,
  },
  SANDSTORM: {
    id: "sandstorm",
    label: "Swirling Sandstorm",
    icon: "🌪️",
    color: "#d97706",
    bgClass: "weather-sandstorm",
    description: "Fierce desert sands! Rock Pokémon gain +50% Sp. Def.",
    buffType: "rock",
    nerfType: null,
  },
  THUNDERSTORM: {
    id: "thunderstorm",
    label: "Thunderstorm Surge",
    icon: "⚡",
    color: "#eab308",
    bgClass: "weather-thunder",
    description: "Atmospheric lightning charge! Electric moves deal +50% damage.",
    buffType: "electric",
    nerfType: null,
  },
};

// Map WMO (World Meteorological Organization) weather codes to Pokemon weather
export function mapWmoCodeToPokemonWeather(code, tempC) {
  // 0: Clear sky, 1: Mainly clear
  if (code === 0 || code === 1) {
    if (tempC >= 28) return POKEMON_WEATHER_STATES.SUNNY;
    return POKEMON_WEATHER_STATES.CLEAR;
  }
  // 2, 3: Partly cloudy, Overcast
  if (code === 2 || code === 3) {
    if (tempC >= 30) return POKEMON_WEATHER_STATES.SUNNY;
    return POKEMON_WEATHER_STATES.CLEAR;
  }
  // 45, 48: Fog
  if (code === 45 || code === 48) {
    return POKEMON_WEATHER_STATES.CLEAR;
  }
  // 51, 53, 55, 61, 63, 65, 80, 81, 82: Drizzle & Rain
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
    return POKEMON_WEATHER_STATES.RAIN;
  }
  // 71, 73, 75, 77, 85, 86: Snow / Grains
  if ([71, 73, 75, 77, 85, 86].includes(code) || tempC <= 1) {
    return POKEMON_WEATHER_STATES.SNOW;
  }
  // 95, 96, 99: Thunderstorms
  if ([95, 96, 99].includes(code)) {
    return POKEMON_WEATHER_STATES.THUNDERSTORM;
  }

  return POKEMON_WEATHER_STATES.CLEAR;
}

// Fetch live weather from Open-Meteo API
export async function fetchLiveWeather(lat, lon) {
  try {
    const targetLat = lat ?? 35.6762;
    const targetLon = lon ?? 139.6503;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

    const data = await res.json();
    const current = data.current || {};
    const tempC = Math.round(current.temperature_2m ?? 22);
    const code = current.weather_code ?? 0;
    const windSpeed = current.wind_speed_10m ?? 8;
    const humidity = current.relative_humidity_2m ?? 50;

    const pokemonWeather = mapWmoCodeToPokemonWeather(code, tempC);

    return {
      success: true,
      tempC,
      humidity,
      windSpeed,
      wmoCode: code,
      pokemonWeather,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  } catch (err) {
    console.warn("Weather fetch failed, falling back to Clear weather:", err);
    return {
      success: false,
      tempC: 24,
      humidity: 55,
      windSpeed: 10,
      wmoCode: 0,
      pokemonWeather: POKEMON_WEATHER_STATES.CLEAR,
      timestamp: "--:--",
    };
  }
}

// Calculate weather battle damage multiplier
export function getWeatherDamageMultiplier(moveType, pokemonWeather) {
  if (!pokemonWeather || !pokemonWeather.id) return 1.0;

  if (pokemonWeather.buffType === moveType) {
    return 1.5; // +50% Boost
  }
  if (pokemonWeather.nerfType === moveType) {
    return 0.5; // -50% Weakened
  }
  return 1.0;
}
