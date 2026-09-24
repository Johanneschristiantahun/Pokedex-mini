// ========================================================
// PokéSphere Pro Comparison Tool (/compare)
// Head-to-Head Side-by-Side Dual Pokémon Analyzer
// Interactive Stats Diffs, Type Matchup Matrix, & Movepools
// ========================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import {
  capitalize,
  formatPokemonId,
  getAnimatedSpriteUrl,
  getAnimatedShinySpriteUrl,
  getArtworkUrl,
  getArtworkShinyUrl,
  playPokemonCry,
  pokemonDetailCache,
} from "../utils.js";
import { getTypeDamageMultiplier } from "../utils/typeEffectiveness.js";
import {
  IconScale,
  IconSparkles,
  IconVolume,
  IconParty,
  IconArrowLeft,
  IconCheck,
  IconX,
  IconSwords,
  IconBook,
} from "../components/Icons.jsx";
import { API_BASE_URL } from "../config.js";

// Preset popular rivalries
const POPULAR_RIVALRIES = [
  { name: "Starters Clash", a: "charizard", b: "blastoise" },
  { name: "Electric Line", a: "pikachu", b: "raichu" },
  { name: "Psychic vs Ghost", a: "alakazam", b: "gengar" },
  { name: "Legendary Myth", a: "mewtwo", b: "mew" },
  { name: "Kanto Titans", a: "dragonite", b: "gyarados" },
  { name: "Heavyweights", a: "snorlax", b: "machamp" },
];

const STAT_CONFIG = [
  { key: "hp", label: "HP", max: 255 },
  { key: "attack", label: "Attack", max: 190 },
  { key: "defense", label: "Defense", max: 230 },
  { key: "special-attack", label: "Sp. Atk", max: 194 },
  { key: "special-defense", label: "Sp. Def", max: 230 },
  { key: "speed", label: "Speed", max: 200 },
];

export default function ComparePage() {
  const { team } = useGame();

  // Selected Pokemon identifiers (name or id)
  const [pokeIdA, setPokeIdA] = useState("charizard");
  const [pokeIdB, setPokeIdB] = useState("blastoise");

  // Loaded full data
  const [pokemonA, setPokemonA] = useState(null);
  const [pokemonB, setPokemonB] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState(null);
  const [errorB, setErrorB] = useState(null);

  // Shiny toggles
  const [shinyA, setShinyA] = useState(false);
  const [shinyB, setShinyB] = useState(false);

  // Search input queries
  const [searchQueryA, setSearchQueryA] = useState("");
  const [searchQueryB, setSearchQueryB] = useState("");

  // Load Pokemon A
  useEffect(() => {
    let active = true;
    async function fetchA() {
      const key = String(pokeIdA).toLowerCase();
      if (pokemonDetailCache[key]) {
        setPokemonA(pokemonDetailCache[key]);
        return;
      }
      setLoadingA(true);
      setErrorA(null);
      try {
        const res = await fetch(`${API_BASE_URL}/pokemon/${key}`);
        if (!res.ok) throw new Error("Pokémon not found");
        const data = await res.json();
        pokemonDetailCache[key] = data;
        pokemonDetailCache[data.name.toLowerCase()] = data;
        pokemonDetailCache[String(data.id)] = data;
        if (active) setPokemonA(data);
      } catch (err) {
        if (active) setErrorA(err.message);
      } finally {
        if (active) setLoadingA(false);
      }
    }
    fetchA();
    return () => {
      active = false;
    };
  }, [pokeIdA]);

  // Load Pokemon B
  useEffect(() => {
    let active = true;
    async function fetchB() {
      const key = String(pokeIdB).toLowerCase();
      if (pokemonDetailCache[key]) {
        setPokemonB(pokemonDetailCache[key]);
        return;
      }
      setLoadingB(true);
      setErrorB(null);
      try {
        const res = await fetch(`${API_BASE_URL}/pokemon/${key}`);
        if (!res.ok) throw new Error("Pokémon not found");
        const data = await res.json();
        pokemonDetailCache[key] = data;
        pokemonDetailCache[data.name.toLowerCase()] = data;
        pokemonDetailCache[String(data.id)] = data;
        if (active) setPokemonB(data);
      } catch (err) {
        if (active) setErrorB(err.message);
      } finally {
        if (active) setLoadingB(false);
      }
    }
    fetchB();
    return () => {
      active = false;
    };
  }, [pokeIdB]);

  function handleSwap() {
    const tempA = pokeIdA;
    setPokeIdA(pokeIdB);
    setPokeIdB(tempA);
    const tempShiny = shinyA;
    setShinyA(shinyB);
    setShinyB(tempShiny);
  }

  function handleSearchSubmitA(e) {
    e.preventDefault();
    if (searchQueryA.trim()) {
      setPokeIdA(searchQueryA.trim().toLowerCase());
      setSearchQueryA("");
    }
  }

  function handleSearchSubmitB(e) {
    e.preventDefault();
    if (searchQueryB.trim()) {
      setPokeIdB(searchQueryB.trim().toLowerCase());
      setSearchQueryB("");
    }
  }

  // Extract base stats map
  function extractStats(pokemon) {
    if (!pokemon) return {};
    const map = {};
    pokemon.stats.forEach((s) => {
      map[s.stat.name] = s.base_stat;
    });
    const total = Object.values(map).reduce((acc, val) => acc + val, 0);
    return { ...map, total };
  }

  const statsA = extractStats(pokemonA);
  const statsB = extractStats(pokemonB);

  // Types list
  const typesA = pokemonA ? pokemonA.types.map((t) => t.type.name) : [];
  const typesB = pokemonB ? pokemonB.types.map((t) => t.type.name) : [];

  // Matchup calculations:
  // How A's offensive types hit B
  const attackAtoB = typesA.map((type) => ({
    attackerType: type,
    multiplier: getTypeDamageMultiplier(type, typesB),
  }));

  // How B's offensive types hit A
  const attackBtoA = typesB.map((type) => ({
    attackerType: type,
    multiplier: getTypeDamageMultiplier(type, typesA),
  }));

  // Count stat wins
  let winsA = 0;
  let winsB = 0;
  if (pokemonA && pokemonB) {
    STAT_CONFIG.forEach((cfg) => {
      const valA = statsA[cfg.key] || 0;
      const valB = statsB[cfg.key] || 0;
      if (valA > valB) winsA += 1;
      else if (valB > valA) winsB += 1;
    });
  }

  return (
    <div className="compare-page-container">
      {/* Header Banner */}
      <div className="compare-header">
        <div className="compare-header-title">
          <div className="compare-title-icon">
            <IconScale size={24} />
          </div>
          <div>
            <h1 className="compare-title-text">Pro Comparison Tool</h1>
            <p className="compare-subtitle">
              Head-to-head tactical analysis: base stats, type matchups, and traits
            </p>
          </div>
        </div>

        {/* Swap Quick Action */}
        <button
          type="button"
          onClick={handleSwap}
          className="btn-swap-comparison"
          title="Swap Left and Right Pokémon"
        >
          <IconArrowLeft size={16} />
          <span>Swap Sides</span>
        </button>
      </div>

      {/* Quick Picks: Popular Rivalries & My Team */}
      <div className="compare-presets-bar">
        <div className="preset-group">
          <span className="preset-label">Iconic Duels:</span>
          <div className="preset-pills">
            {POPULAR_RIVALRIES.map((riv) => (
              <button
                key={riv.name}
                type="button"
                className={`preset-pill ${
                  (pokeIdA === riv.a && pokeIdB === riv.b) ||
                  (pokeIdA === riv.b && pokeIdB === riv.a)
                    ? "preset-pill-active"
                    : ""
                }`}
                onClick={() => {
                  setPokeIdA(riv.a);
                  setPokeIdB(riv.b);
                }}
              >
                {riv.name}
              </button>
            ))}
          </div>
        </div>

        {/* Team member quick picks */}
        {team.length > 0 && (
          <div className="preset-group">
            <span className="preset-label">
              <IconParty size={13} style={{ marginRight: 4 }} />
              From My Team:
            </span>
            <div className="preset-pills">
              {team.map((member) => (
                <button
                  key={member.instanceId}
                  type="button"
                  className="preset-team-pill"
                  onClick={() => {
                    // Fill slot A first, or slot B if A is already this member
                    if (pokeIdA !== member.name.toLowerCase()) {
                      setPokeIdA(member.name.toLowerCase());
                    } else {
                      setPokeIdB(member.name.toLowerCase());
                    }
                  }}
                  title={`Click to analyze ${member.nickname || member.name}`}
                >
                  <img
                    src={getAnimatedSpriteUrl(member.id)}
                    alt={member.name}
                    className="preset-team-sprite"
                  />
                  <span>{member.nickname || capitalize(member.name)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Dual Card Showcase */}
      <div className="compare-grid">
        {/* ================= SLOT A ================= */}
        <div className="compare-card compare-card-a">
          {/* Search Box A */}
          <form onSubmit={handleSearchSubmitA} className="compare-search-form">
            <input
              type="text"
              placeholder="Search Pokémon A (e.g. Mewtwo, 150)..."
              value={searchQueryA}
              onChange={(e) => setSearchQueryA(e.target.value)}
              className="compare-search-input"
            />
            <button type="submit" className="btn-compare-search">
              Analyze
            </button>
          </form>

          {loadingA ? (
            <div className="compare-loading-box">
              <div className="mini-spinner"></div>
              <span>Analyzing Pokémon A...</span>
            </div>
          ) : errorA ? (
            <div className="compare-error-box">
              <IconX size={20} />
              <span>{errorA}</span>
            </div>
          ) : pokemonA ? (
            <div className="compare-profile">
              <div className="compare-avatar-wrap">
                <img
                  src={
                    shinyA
                      ? getArtworkShinyUrl(pokemonA.id) || getAnimatedShinySpriteUrl(pokemonA.id)
                      : getArtworkUrl(pokemonA.id) || getAnimatedSpriteUrl(pokemonA.id)
                  }
                  alt={pokemonA.name}
                  className="compare-avatar-img"
                />

                {/* Sound Cry & Shiny Buttons */}
                <div className="compare-avatar-controls">
                  <button
                    type="button"
                    onClick={() => playPokemonCry(pokemonA.id)}
                    className="compare-cry-btn"
                    title="Play Audio Cry"
                  >
                    <IconVolume size={14} />
                    <span>Cry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShinyA((prev) => !prev)}
                    className={`compare-shiny-btn ${shinyA ? "shiny-active" : ""}`}
                    title="Toggle Shiny Artwork"
                  >
                    <IconSparkles size={14} />
                    <span>Shiny</span>
                  </button>
                </div>
              </div>

              <div className="compare-meta">
                <span className="compare-dex-id">{formatPokemonId(pokemonA.id)}</span>
                <h2 className="compare-name">{capitalize(pokemonA.name)}</h2>

                <div className="compare-types-row">
                  {typesA.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>

                <div className="compare-traits-chips">
                  <span className="trait-chip">
                    Ht: <strong>{(pokemonA.height / 10).toFixed(1)} m</strong>
                  </span>
                  <span className="trait-chip">
                    Wt: <strong>{(pokemonA.weight / 10).toFixed(1)} kg</strong>
                  </span>
                  <span className="trait-chip">
                    Exp: <strong>{pokemonA.base_experience || "—"}</strong>
                  </span>
                </div>

                <Link
                  to={`/pokemon/${pokemonA.name}`}
                  className="btn-compare-dex-link"
                >
                  <IconBook size={14} />
                  <span>Full Pokédex Entry</span>
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {/* ================= VS CENTRAL PILL ================= */}
        <div className="compare-center-vs">
          <div className="vs-badge-circle">
            <span className="vs-text">VS</span>
          </div>

          {pokemonA && pokemonB && (
            <div className="stat-summary-pill">
              <span className="summary-score score-a">{winsA}</span>
              <span className="summary-divider">:</span>
              <span className="summary-score score-b">{winsB}</span>
            </div>
          )}
        </div>

        {/* ================= SLOT B ================= */}
        <div className="compare-card compare-card-b">
          {/* Search Box B */}
          <form onSubmit={handleSearchSubmitB} className="compare-search-form">
            <input
              type="text"
              placeholder="Search Pokémon B (e.g. Gengar, 94)..."
              value={searchQueryB}
              onChange={(e) => setSearchQueryB(e.target.value)}
              className="compare-search-input"
            />
            <button type="submit" className="btn-compare-search">
              Analyze
            </button>
          </form>

          {loadingB ? (
            <div className="compare-loading-box">
              <div className="mini-spinner"></div>
              <span>Analyzing Pokémon B...</span>
            </div>
          ) : errorB ? (
            <div className="compare-error-box">
              <IconX size={20} />
              <span>{errorB}</span>
            </div>
          ) : pokemonB ? (
            <div className="compare-profile">
              <div className="compare-avatar-wrap">
                <img
                  src={
                    shinyB
                      ? getArtworkShinyUrl(pokemonB.id) || getAnimatedShinySpriteUrl(pokemonB.id)
                      : getArtworkUrl(pokemonB.id) || getAnimatedSpriteUrl(pokemonB.id)
                  }
                  alt={pokemonB.name}
                  className="compare-avatar-img"
                />

                {/* Sound Cry & Shiny Buttons */}
                <div className="compare-avatar-controls">
                  <button
                    type="button"
                    onClick={() => playPokemonCry(pokemonB.id)}
                    className="compare-cry-btn"
                    title="Play Audio Cry"
                  >
                    <IconVolume size={14} />
                    <span>Cry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShinyB((prev) => !prev)}
                    className={`compare-shiny-btn ${shinyB ? "shiny-active" : ""}`}
                    title="Toggle Shiny Artwork"
                  >
                    <IconSparkles size={14} />
                    <span>Shiny</span>
                  </button>
                </div>
              </div>

              <div className="compare-meta">
                <span className="compare-dex-id">{formatPokemonId(pokemonB.id)}</span>
                <h2 className="compare-name">{capitalize(pokemonB.name)}</h2>

                <div className="compare-types-row">
                  {typesB.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>

                <div className="compare-traits-chips">
                  <span className="trait-chip">
                    Ht: <strong>{(pokemonB.height / 10).toFixed(1)} m</strong>
                  </span>
                  <span className="trait-chip">
                    Wt: <strong>{(pokemonB.weight / 10).toFixed(1)} kg</strong>
                  </span>
                  <span className="trait-chip">
                    Exp: <strong>{pokemonB.base_experience || "—"}</strong>
                  </span>
                </div>

                <Link
                  to={`/pokemon/${pokemonB.name}`}
                  className="btn-compare-dex-link"
                >
                  <IconBook size={14} />
                  <span>Full Pokédex Entry</span>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ================= SIDE-BY-SIDE STATS COMPARISON TABLE ================= */}
      {pokemonA && pokemonB && (
        <div className="compare-stats-card">
          <div className="compare-section-header">
            <h3 className="section-title">
              <IconSwords size={18} />
              <span>Base Stats Comparison</span>
            </h3>
            <span className="section-desc">
              Higher value in green with advantage points
            </span>
          </div>

          <div className="stats-comparison-table">
            {STAT_CONFIG.map((cfg) => {
              const valA = statsA[cfg.key] || 0;
              const valB = statsB[cfg.key] || 0;
              const diff = valA - valB;
              const isWinnerA = valA > valB;
              const isWinnerB = valB > valA;
              const pctA = Math.min(100, Math.round((valA / cfg.max) * 100));
              const pctB = Math.min(100, Math.round((valB / cfg.max) * 100));

              return (
                <div key={cfg.key} className="stat-row">
                  {/* Left Side (Pokemon A) */}
                  <div className={`stat-col col-a ${isWinnerA ? "stat-winner" : ""}`}>
                    <span className="stat-val">{valA}</span>
                    {isWinnerA && diff !== 0 && (
                      <span className="stat-win-tag">+{diff}</span>
                    )}
                    <div className="stat-meter-track track-left">
                      <div
                        className="stat-meter-fill fill-a"
                        style={{ width: `${pctA}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Center Label */}
                  <div className="stat-label-col">
                    <span className="stat-cfg-label">{cfg.label}</span>
                  </div>

                  {/* Right Side (Pokemon B) */}
                  <div className={`stat-col col-b ${isWinnerB ? "stat-winner" : ""}`}>
                    <div className="stat-meter-track track-right">
                      <div
                        className="stat-meter-fill fill-b"
                        style={{ width: `${pctB}%` }}
                      ></div>
                    </div>
                    {isWinnerB && diff !== 0 && (
                      <span className="stat-win-tag">+{Math.abs(diff)}</span>
                    )}
                    <span className="stat-val">{valB}</span>
                  </div>
                </div>
              );
            })}

            {/* Total BST Row */}
            <div className="stat-row stat-row-total">
              <div
                className={`stat-col col-a ${
                  statsA.total > statsB.total ? "stat-winner" : ""
                }`}
              >
                <span className="stat-total-val">{statsA.total}</span>
                {statsA.total > statsB.total && (
                  <span className="stat-win-tag">
                    +{statsA.total - statsB.total}
                  </span>
                )}
              </div>

              <div className="stat-label-col">
                <span className="stat-total-label">BST TOTAL</span>
              </div>

              <div
                className={`stat-col col-b ${
                  statsB.total > statsA.total ? "stat-winner" : ""
                }`}
              >
                {statsB.total > statsA.total && (
                  <span className="stat-win-tag">
                    +{statsB.total - statsA.total}
                  </span>
                )}
                <span className="stat-total-val">{statsB.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TACTICAL TYPE MATCHUP MATRIX ================= */}
      {pokemonA && pokemonB && (
        <div className="compare-matchup-card">
          <div className="compare-section-header">
            <h3 className="section-title">
              <IconSparkles size={18} />
              <span>Type Matchup & Tactical Advantage</span>
            </h3>
            <span className="section-desc">
              Damage multipliers applied when attacking each other
            </span>
          </div>

          <div className="matchup-duo-grid">
            {/* A attacking B */}
            <div className="matchup-box">
              <div className="matchup-box-title">
                <span className="matchup-actor-name">{capitalize(pokemonA.name)}</span>
                <span className="matchup-vs-arrow">➔ attacking ➔</span>
                <span className="matchup-target-name">{capitalize(pokemonB.name)}</span>
              </div>

              <div className="matchup-pills-list">
                {attackAtoB.map((item) => (
                  <div key={item.attackerType} className="matchup-item-pill">
                    <TypeBadge type={item.attackerType} size="xs" />
                    <span
                      className={`multiplier-badge mult-${String(item.multiplier).replace(".", "_")}`}
                    >
                      {item.multiplier}x
                    </span>
                    <span className="multiplier-desc">
                      {item.multiplier >= 2
                        ? "Super Effective!"
                        : item.multiplier === 0
                        ? "No Effect (Immune)"
                        : item.multiplier < 1
                        ? "Not Very Effective"
                        : "Regular Effective"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* B attacking A */}
            <div className="matchup-box">
              <div className="matchup-box-title">
                <span className="matchup-actor-name">{capitalize(pokemonB.name)}</span>
                <span className="matchup-vs-arrow">➔ attacking ➔</span>
                <span className="matchup-target-name">{capitalize(pokemonA.name)}</span>
              </div>

              <div className="matchup-pills-list">
                {attackBtoA.map((item) => (
                  <div key={item.attackerType} className="matchup-item-pill">
                    <TypeBadge type={item.attackerType} size="xs" />
                    <span
                      className={`multiplier-badge mult-${String(item.multiplier).replace(".", "_")}`}
                    >
                      {item.multiplier}x
                    </span>
                    <span className="multiplier-desc">
                      {item.multiplier >= 2
                        ? "Super Effective!"
                        : item.multiplier === 0
                        ? "No Effect (Immune)"
                        : item.multiplier < 1
                        ? "Not Very Effective"
                        : "Regular Effective"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Tactical Verdict */}
          <div className="tactical-verdict-banner">
            <IconCheck size={18} className="verdict-icon" />
            <div className="verdict-text">
              <strong>Tactical Verdict: </strong>
              {statsA.total > statsB.total ? (
                <span>
                  <strong>{capitalize(pokemonA.name)}</strong> holds superior Base Stat Total ({statsA.total} vs {statsB.total}).
                </span>
              ) : statsB.total > statsA.total ? (
                <span>
                  <strong>{capitalize(pokemonB.name)}</strong> holds superior Base Stat Total ({statsB.total} vs {statsA.total}).
                </span>
              ) : (
                <span>Both Pokémon are tied in Base Stat Total ({statsA.total})!</span>
              )}{" "}
              {attackAtoB.some((m) => m.multiplier >= 2) && (
                <span>
                  {capitalize(pokemonA.name)} possesses Super Effective type coverage against {capitalize(pokemonB.name)}!
                </span>
              )}{" "}
              {attackBtoA.some((m) => m.multiplier >= 2) && (
                <span>
                  {capitalize(pokemonB.name)} also wields Super Effective STAB against {capitalize(pokemonA.name)}!
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
