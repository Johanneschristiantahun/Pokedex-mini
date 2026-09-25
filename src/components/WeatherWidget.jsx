// ========================================================
// PokéSphere Live Real-World Weather Banner & Selector
// Powered by Open-Meteo Public Meteorological API
// ========================================================

import { useState, useEffect } from "react";
import {
  WEATHER_PRESETS,
  fetchLiveWeather,
  POKEMON_WEATHER_STATES,
} from "../utils/weatherApi.js";
import { IconSparkles, IconRefresh } from "./Icons.jsx";

export default function WeatherWidget({ onWeatherChange, className = "" }) {
  const [selectedPresetId, setSelectedPresetId] = useState("pallet");
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGpsActive, setIsGpsActive] = useState(false);

  async function loadWeather(presetId) {
    setIsLoading(true);

    if (presetId === "auto") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            setIsGpsActive(true);
            const res = await fetchLiveWeather(pos.coords.latitude, pos.coords.longitude);
            setWeatherData(res);
            setIsLoading(false);
            if (onWeatherChange) onWeatherChange(res);
          },
          async () => {
            // Geolocation denied, fallback to Pallet Town
            setIsGpsActive(false);
            const res = await fetchLiveWeather(35.6762, 139.6503);
            setWeatherData(res);
            setIsLoading(false);
            if (onWeatherChange) onWeatherChange(res);
          }
        );
        return;
      }
    }

    setIsGpsActive(false);
    const preset = WEATHER_PRESETS.find((p) => p.id === presetId) || WEATHER_PRESETS[1];
    const res = await fetchLiveWeather(preset.lat, preset.lon);
    setWeatherData(res);
    setIsLoading(false);
    if (onWeatherChange) onWeatherChange(res);
  }

  useEffect(() => {
    loadWeather(selectedPresetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPresetId]);

  const pWeather = weatherData?.pokemonWeather || POKEMON_WEATHER_STATES.CLEAR;

  return (
    <div className={`weather-widget-bar ${className}`}>
      <div className="weather-widget-left">
        <span className="weather-live-badge">
          <span className="live-pulse-dot"></span>
          <span>LIVE WEATHER API</span>
        </span>
        {isGpsActive && <span className="weather-gps-indicator">🛰️ GPS</span>}

        <select
          value={selectedPresetId}
          onChange={(e) => setSelectedPresetId(e.target.value)}
          className="weather-preset-select"
          title="Select Real-World Atmospheric Location or Auto-Detect GPS"
        >
          {WEATHER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => loadWeather(selectedPresetId)}
          className="weather-refresh-btn"
          title="Refresh Live Meteorological Data"
        >
          <IconRefresh size={13} className={isLoading ? "spin-refresh-icon" : ""} />
        </button>
      </div>

      <div className="weather-widget-right">
        {isLoading ? (
          <span className="weather-loading-text">Querying Open-Meteo satellite...</span>
        ) : (
          <div className="weather-stats-cluster">
            <span className="weather-condition-pill" style={{ borderColor: pWeather.color }}>
              <span className="weather-icon">{pWeather.icon}</span>
              <span className="weather-temp">{weatherData?.tempC}°C</span>
              <strong className="weather-name">{pWeather.label}</strong>
            </span>

            <span className="weather-tactical-tag">
              <IconSparkles size={12} style={{ marginRight: 4 }} />
              {pWeather.description}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
