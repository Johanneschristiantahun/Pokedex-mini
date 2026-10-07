// ========================================================
// PokéDex Mini Comparison Tool (/compare)
// Apple-inspired side-by-side Dual Pokémon Analyzer
// Responsive desktop & mobile comparison, base stats, & matchups
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
  IconSparkles,
  IconVolume,
  IconParty,
  IconArrowLeft,
  IconX,
  IconSwords,
  IconBook,
  IconSearch,
} from "../components/Icons.jsx";
import { API_BASE_URL } from "../config.js";

// Preset iconic rivalries
const POPULAR_RIVALRIES = [
  { name: "Charizard vs Blastoise", a: "charizard", b: "blastoise" },
  { name: "Pikachu vs Raichu", a: "pikachu", b: "raichu" },
  { name: "Alakazam vs Gengar", a: "alakazam", b: "gengar" },
  { name: "Mewtwo vs Mew", a: "mewtwo", b: "mew" },
  { name: "Dragonite vs Gyarados", a: "dragonite", b: "gyarados" },
  { name: "Snorlax vs Machamp", a: "snorlax", b: "machamp" },
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

  // Matchup calculations
  const attackAtoB = typesA.map((type) => ({
    attackerType: type,
    multiplier: getTypeDamageMultiplier(type, typesB),
  }));

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
        <div className="compare-header-info">
          <h1 className="compare-title-text">Compare</h1>
          <p className="compare-subtitle">
            Side-by-side analysis of base stats, combat matchups, and traits.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSwap}
          className="btn-swap-comparison"
          title="Swap Left and Right Pokémon"
        >
          <IconArrowLeft size={15} />
          <span>Swap Sides</span>
        </button>
      </div>

      {/* Quick Picks / Iconic Matchups Bar */}
      <div className="compare-presets-bar">
        <div className="preset-group">
          <span className="preset-label">Iconic Matchups:</span>
          <div className="preset-pills">
            {POPULAR_RIVALRIES.map((riv) => {
              const isActive =
                (pokeIdA === riv.a && pokeIdB === riv.b) ||
                (pokeIdA === riv.b && pokeIdB === riv.a);
              return (
                <button
                  key={riv.name}
                  type="button"
                  className={`preset-pill ${isActive ? "preset-pill-active" : ""}`}
                  onClick={() => {
                    setPokeIdA(riv.a);
                    setPokeIdB(riv.b);
                  }}
                >
                  {riv.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Team member quick picks */}
        {team.length > 0 && (
          <div className="preset-group">
            <span className="preset-label">
              <IconParty size={13} style={{ marginRight: 4 }} />
              From Party:
            </span>
            <div className="preset-pills">
              {team.map((member) => (
                <button
                  key={member.instanceId}
                  type="button"
                  className="preset-team-pill"
                  onClick={() => {
                    if (pokeIdA !== member.name.toLowerCase()) {
                      setPokeIdA(member.name.toLowerCase());
                    } else {
                      setPokeIdB(member.name.toLowerCase());
                    }
                  }}
                  title={`Select ${member.nickname || member.name}`}
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

      {/* ================= CONTENDERS SHOWCASE (RESPONSIVE SIDE-BY-SIDE) ================= */}
      <div className="compare-grid">
        {/* SLOT A */}
        <div className="compare-card compare-card-a">
          <form onSubmit={handleSearchSubmitA} className="compare-search-form">
            <div className="compare-search-input-wrap">
              <IconSearch size={14} className="compare-search-icon" />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={searchQueryA}
                onChange={(e) => setSearchQueryA(e.target.value)}
                className="compare-search-input"
              />
              {searchQueryA && (
                <button
                  type="button"
                  onClick={() => setSearchQueryA("")}
                  className="compare-search-clear-btn"
                  aria-label="Clear search"
                >
                  <IconX size={13} />
                </button>
              )}
            </div>
          </form>

          {loadingA ? (
            <div className="compare-loading-box">
              <div className="mini-spinner"></div>
              <span>Loading...</span>
            </div>
          ) : errorA ? (
            <div className="compare-error-box">
              <IconX size={16} />
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

                <div className="compare-avatar-controls">
                  <button
                    type="button"
                    onClick={() => playPokemonCry(pokemonA.id)}
                    className="compare-ctrl-btn"
                    title="Play Audio Cry"
                  >
                    <IconVolume size={13} />
                    <span>Cry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShinyA((prev) => !prev)}
                    className={`compare-ctrl-btn ${shinyA ? "ctrl-active" : ""}`}
                    title="Toggle Shiny Variant"
                  >
                    <IconSparkles size={13} />
                    <span>Shiny</span>
                  </button>
                </div>
              </div>

              <div className="compare-meta">
                <span className="compare-dex-id">{formatPokemonId(pokemonA.id)}</span>
                <h2 className="compare-name">{capitalize(pokemonA.name)}</h2>

                <div className="compare-types-row">
                  {typesA.map((t) => (
                    <TypeBadge key={t} type={t} size="xs" />
                  ))}
                </div>

                <div className="compare-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Height</span>
                    <span className="spec-val">{(pokemonA.height / 10).toFixed(1)} m</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Weight</span>
                    <span className="spec-val">{(pokemonA.weight / 10).toFixed(1)} kg</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Base Exp</span>
                    <span className="spec-val">{pokemonA.base_experience || "—"}</span>
                  </div>
                </div>

                <Link
                  to={`/pokemon/${pokemonA.name}`}
                  className="btn-compare-dex-link"
                >
                  <IconBook size={13} />
                  <span>Pokédex Entry</span>
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {/* CENTER VS PILL */}
        <div className="compare-center-vs">
          <div className="vs-badge-circle">VS</div>
          {pokemonA && pokemonB && (
            <div className="stat-summary-pill" title="Stat Wins (A : B)">
              <span className="summary-score score-a">{winsA}</span>
              <span className="summary-divider">:</span>
              <span className="summary-score score-b">{winsB}</span>
            </div>
          )}
        </div>

        {/* SLOT B */}
        <div className="compare-card compare-card-b">
          <form onSubmit={handleSearchSubmitB} className="compare-search-form">
            <div className="compare-search-input-wrap">
              <IconSearch size={14} className="compare-search-icon" />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={searchQueryB}
                onChange={(e) => setSearchQueryB(e.target.value)}
                className="compare-search-input"
              />
              {searchQueryB && (
                <button
                  type="button"
                  onClick={() => setSearchQueryB("")}
                  className="compare-search-clear-btn"
                  aria-label="Clear search"
                >
                  <IconX size={13} />
                </button>
              )}
            </div>
          </form>

          {loadingB ? (
            <div className="compare-loading-box">
              <div className="mini-spinner"></div>
              <span>Loading...</span>
            </div>
          ) : errorB ? (
            <div className="compare-error-box">
              <IconX size={16} />
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

                <div className="compare-avatar-controls">
                  <button
                    type="button"
                    onClick={() => playPokemonCry(pokemonB.id)}
                    className="compare-ctrl-btn"
                    title="Play Audio Cry"
                  >
                    <IconVolume size={13} />
                    <span>Cry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShinyB((prev) => !prev)}
                    className={`compare-ctrl-btn ${shinyB ? "ctrl-active" : ""}`}
                    title="Toggle Shiny Variant"
                  >
                    <IconSparkles size={13} />
                    <span>Shiny</span>
                  </button>
                </div>
              </div>

              <div className="compare-meta">
                <span className="compare-dex-id">{formatPokemonId(pokemonB.id)}</span>
                <h2 className="compare-name">{capitalize(pokemonB.name)}</h2>

                <div className="compare-types-row">
                  {typesB.map((t) => (
                    <TypeBadge key={t} type={t} size="xs" />
                  ))}
                </div>

                <div className="compare-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Height</span>
                    <span className="spec-val">{(pokemonB.height / 10).toFixed(1)} m</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Weight</span>
                    <span className="spec-val">{(pokemonB.weight / 10).toFixed(1)} kg</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Base Exp</span>
                    <span className="spec-val">{pokemonB.base_experience || "—"}</span>
                  </div>
                </div>

                <Link
                  to={`/pokemon/${pokemonB.name}`}
                  className="btn-compare-dex-link"
                >
                  <IconBook size={13} />
                  <span>Pokédex Entry</span>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ================= BASE STATS SPEC SHEET ================= */}
      {pokemonA && pokemonB && (
        <div className="compare-stats-card">
          <div className="compare-section-header">
            <h3 className="section-title">
              <IconSwords size={18} />
              <span>Base Stats</span>
            </h3>
            <span className="section-desc">
              Higher value highlighted in green with advantage differential
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
                  {/* Left Side (A) */}
                  <div className={`stat-col col-a ${isWinnerA ? "stat-winner" : ""}`}>
                    {isWinnerA && diff !== 0 && (
                      <span className="stat-win-tag">+{diff}</span>
                    )}
                    <span className="stat-val">{valA}</span>
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

                  {/* Right Side (B) */}
                  <div className={`stat-col col-b ${isWinnerB ? "stat-winner" : ""}`}>
                    <div className="stat-meter-track track-right">
                      <div
                        className="stat-meter-fill fill-b"
                        style={{ width: `${pctB}%` }}
                      ></div>
                    </div>
                    <span className="stat-val">{valB}</span>
                    {isWinnerB && diff !== 0 && (
                      <span className="stat-win-tag">+{Math.abs(diff)}</span>
                    )}
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
                {statsA.total > statsB.total && (
                  <span className="stat-win-tag">
                    +{statsA.total - statsB.total}
                  </span>
                )}
                <span className="stat-total-val">{statsA.total}</span>
              </div>

              <div className="stat-label-col">
                <span className="stat-total-label">Total BST</span>
              </div>

              <div
                className={`stat-col col-b ${
                  statsB.total > statsA.total ? "stat-winner" : ""
                }`}
              >
                <span className="stat-total-val">{statsB.total}</span>
                {statsB.total > statsA.total && (
                  <span className="stat-win-tag">
                    +{statsB.total - statsA.total}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= COMBAT MATCHUP MATRIX ================= */}
      {pokemonA && pokemonB && (
        <div className="compare-matchup-card">
          <div className="compare-section-header">
            <h3 className="section-title">
              <IconSparkles size={18} />
              <span>Combat Matchups</span>
            </h3>
            <span className="section-desc">
              Direct type offensive multipliers applied when attacking
            </span>
          </div>

          <div className="matchup-duo-grid">
            {/* A attacking B */}
            <div className="matchup-box">
              <div className="matchup-box-title">
                <span>{capitalize(pokemonA.name)} Attacks</span>
              </div>

              <div className="matchup-pills-list">
                {attackAtoB.map((item) => (
                  <div key={item.attackerType} className="matchup-item-pill">
                    <TypeBadge type={item.attackerType} size="xs" />
                    <span
                      className={`multiplier-badge mult-${String(item.multiplier).replace(".", "_")}`}
                    >
                      {item.multiplier}×
                    </span>
                    <span className="multiplier-desc">
                      {item.multiplier >= 2
                        ? "Super Effective"
                        : item.multiplier === 0
                        ? "No Effect (Immune)"
                        : item.multiplier < 1
                        ? "Not Very Effective"
                        : "Effective"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* B attacking A */}
            <div className="matchup-box">
              <div className="matchup-box-title">
                <span>{capitalize(pokemonB.name)} Attacks</span>
              </div>

              <div className="matchup-pills-list">
                {attackBtoA.map((item) => (
                  <div key={item.attackerType} className="matchup-item-pill">
                    <TypeBadge type={item.attackerType} size="xs" />
                    <span
                      className={`multiplier-badge mult-${String(item.multiplier).replace(".", "_")}`}
                    >
                      {item.multiplier}×
                    </span>
                    <span className="multiplier-desc">
                      {item.multiplier >= 2
                        ? "Super Effective"
                        : item.multiplier === 0
                        ? "No Effect (Immune)"
                        : item.multiplier < 1
                        ? "Not Very Effective"
                        : "Effective"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= APPLE KEY TAKEAWAYS CARDS ================= */}
          <div className="compare-takeaways-grid">
            {/* Takeaway 1: Stat Total */}
            <div className="takeaway-card">
              <span className="takeaway-label">Base Stat Leader</span>
              <p className="takeaway-content">
                {statsA.total > statsB.total ? (
                  <>
                    <strong>{capitalize(pokemonA.name)}</strong> leads with{" "}
                    <strong>{statsA.total}</strong> BST (+{statsA.total - statsB.total} advantage).
                  </>
                ) : statsB.total > statsA.total ? (
                  <>
                    <strong>{capitalize(pokemonB.name)}</strong> leads with{" "}
                    <strong>{statsB.total}</strong> BST (+{statsB.total - statsA.total} advantage).
                  </>
                ) : (
                  <>Both Pokémon are evenly matched with {statsA.total} BST.</>
                )}
              </p>
            </div>

            {/* Takeaway 2: Type Coverage */}
            <div className="takeaway-card">
              <span className="takeaway-label">Type Matchup</span>
              <p className="takeaway-content">
                {attackAtoB.some((m) => m.multiplier >= 2) && attackBtoA.some((m) => m.multiplier >= 2) ? (
                  <>Both Pokémon possess Super Effective (2×) moves against each other.</>
                ) : attackAtoB.some((m) => m.multiplier >= 2) ? (
                  <>
                    <strong>{capitalize(pokemonA.name)}</strong> wields a Super Effective type advantage.
                  </>
                ) : attackBtoA.some((m) => m.multiplier >= 2) ? (
                  <>
                    <strong>{capitalize(pokemonB.name)}</strong> wields a Super Effective type advantage.
                  </>
                ) : (
                  <>Standard neutral matchup with no direct type vulnerabilities.</>
                )}
              </p>
            </div>

            {/* Takeaway 3: Speed Priority */}
            <div className="takeaway-card">
              <span className="takeaway-label">Speed Priority</span>
              <p className="takeaway-content">
                {(statsA.speed || 0) > (statsB.speed || 0) ? (
                  <>
                    <strong>{capitalize(pokemonA.name)}</strong> strikes first with {statsA.speed} Speed (+{(statsA.speed || 0) - (statsB.speed || 0)}).
                  </>
                ) : (statsB.speed || 0) > (statsA.speed || 0) ? (
                  <>
                    <strong>{capitalize(pokemonB.name)}</strong> strikes first with {statsB.speed} Speed (+{(statsB.speed || 0) - (statsA.speed || 0)}).
                  </>
                ) : (
                  <>Identical Speed stat ({statsA.speed}) — speed ties decided by priority.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
