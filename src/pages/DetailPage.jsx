import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import TypeBadge from "../components/TypeBadge.jsx";
import { API_BASE_URL } from "../config.js";
import { useGame } from "../context/GameContext.jsx";
import {
  capitalize,
  formatPokemonId,
  playPokemonCry,
  stopPokemonCry,
  getAnimatedSpriteUrl,
  getAnimatedShinySpriteUrl,
  getArtworkUrl,
  getArtworkShinyUrl,
  getTypeColor,
  pokemonDetailCache,
} from "../utils.js";
import { calculateDefensiveMatchups } from "../utils/typeEffectiveness.js";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconParty,
  IconCheck,
  IconVolume,
  IconSparkles,
  IconPalette,
  IconMic,
  IconSquare,
} from "../components/Icons.jsx";

// Memory cache for evolution chains
const evoChainCache = {};

function parseEvolutionChain(chain) {
  if (!chain) return [];
  const stages = [];

  function traverse(node, fromName = null, condition = null) {
    if (!node || !node.species) return;
    const parts = node.species.url.split("/").filter(Boolean);
    const speciesId = parseInt(parts[parts.length - 1], 10);

    stages.push({
      name: node.species.name,
      id: speciesId,
      from: fromName,
      condition: condition,
    });

    if (node.evolves_to && node.evolves_to.length > 0) {
      node.evolves_to.forEach((child) => {
        const detail = child.evolution_details?.[0];
        let cond = "";
        if (detail?.min_level) {
          cond = `Lv. ${detail.min_level}`;
        } else if (detail?.item?.name) {
          cond = capitalize(detail.item.name.replace(/-/g, " "));
        } else if (detail?.held_item?.name) {
          cond = `Hold ${capitalize(detail.held_item.name.replace(/-/g, " "))}`;
        } else if (detail?.trigger?.name === "trade") {
          cond = detail.trade_species
            ? `Trade for ${capitalize(detail.trade_species.name)}`
            : "Trade";
        } else if (detail?.min_happiness) {
          cond = "High Friendship";
        } else if (detail?.time_of_day) {
          cond = capitalize(detail.time_of_day);
        } else if (detail?.location?.name) {
          cond = capitalize(detail.location.name.replace(/-/g, " "));
        } else if (detail?.known_move?.name) {
          cond = `Learn ${capitalize(detail.known_move.name.replace(/-/g, " "))}`;
        } else if (detail?.trigger?.name) {
          cond = capitalize(detail.trigger.name.replace(/-/g, " "));
        }
        traverse(child, node.species.name, cond);
      });
    }
  }

  traverse(chain);
  return stages;
}

function DetailPage() {
  const { name } = useParams();
  const { team, addToTeam } = useGame();

  const [pokemon, setPokemon] = useState(
    () => pokemonDetailCache[name.toLowerCase()] || null
  );
  const [species, setSpecies] = useState(null);
  const [evoChain, setEvoChain] = useState([]);
  const [useArtwork, setUseArtwork] = useState(true);
  const [isShiny, setIsShiny] = useState(false);
  const [isLoading, setIsLoading] = useState(
    () => !pokemonDetailCache[name.toLowerCase()]
  );
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [teamNotice, setTeamNotice] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadPokemonData() {
      if (!pokemonDetailCache[name.toLowerCase()]) {
        setIsLoading(true);
      }
      setError(null);

      try {
        let coreData = pokemonDetailCache[name.toLowerCase()];
        if (!coreData) {
          const res = await fetch(`${API_BASE_URL}/pokemon/${name.toLowerCase()}`);
          if (!res.ok) {
            throw new Error(`No Pokémon named "${name}" found. Please check spelling.`);
          }
          coreData = await res.json();
          pokemonDetailCache[name.toLowerCase()] = coreData;
        }

        let speciesData = null;
        let evoSteps = [];
        try {
          const speciesRes = await fetch(coreData.species.url);
          if (speciesRes.ok) {
            speciesData = await speciesRes.json();
            if (speciesData?.evolution_chain?.url) {
              const evoUrl = speciesData.evolution_chain.url;
              if (evoChainCache[evoUrl]) {
                evoSteps = evoChainCache[evoUrl];
              } else {
                const evoRes = await fetch(evoUrl);
                if (evoRes.ok) {
                  const evoData = await evoRes.json();
                  evoSteps = parseEvolutionChain(evoData.chain);
                  evoChainCache[evoUrl] = evoSteps;
                }
              }
            }
          }
        } catch {
          // Non-blocking for extra lore/evolution data
        }

        if (isCurrent) {
          setPokemon(coreData);
          setSpecies(speciesData);
          setEvoChain(evoSteps);
        }
      } catch (err) {
        if (isCurrent) {
          setError(err.message);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadPokemonData();

    return () => {
      isCurrent = false;
      stopPokemonCry();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [name]);

  // Extract English Pokédex description
  const flavorText =
    species?.flavor_text_entries
      ?.find((f) => f.language.name === "en")
      ?.flavor_text?.replace(/[\f\n\r]/g, " ") || "";

  const genus =
    species?.genera?.find((g) => g.language.name === "en")?.genus || "Pokémon";

  // Text-to-Speech handler
  function handleSpeakDex() {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${pokemon.name}. The ${genus}. ${flavorText}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  // Real Add to Team handler
  function handleAddToTeamClick() {
    if (!pokemon) return;
    const result = addToTeam(pokemon, 5);
    setTeamNotice(result);
    setTimeout(() => setTeamNotice(null), 4000);
  }

  if (isLoading) {
    return (
      <div className="detail-loading-box">
        <div className="pokeball-spinner"></div>
        <p className="status">Accessing Pokédex database for {name}…</p>
      </div>
    );
  }

  if (error || !pokemon) {
    return (
      <div className="detail-error-box">
        <p className="status status-error">
          <IconAlertTriangle size={18} /> {error || "Pokémon not found."}
        </p>
        <Link to="/" className="btn-primary">
          <IconArrowLeft size={16} />
          <span>Back to PokéDex</span>
        </Link>
      </div>
    );
  }

  const primaryType = pokemon.types[0]?.type?.name || "normal";
  const theme = getTypeColor(primaryType);
  const isAlreadyInTeam = team.some((p) => p.name === pokemon.name);

  // Total base stat calculation
  const totalStats = pokemon.stats.reduce((acc, curr) => acc + curr.base_stat, 0);

  // Artwork vs Animated sprite (with Shiny support)
  const artworkNormal =
    pokemon.sprites.other?.["official-artwork"]?.front_default ||
    getArtworkUrl(pokemon.id);
  const artworkShiny =
    pokemon.sprites.other?.["official-artwork"]?.front_shiny ||
    getArtworkShinyUrl(pokemon.id);
  const animatedNormal = getAnimatedSpriteUrl(pokemon.id);
  const animatedShiny = getAnimatedShinySpriteUrl(pokemon.id);

  const displayImgUrl = useArtwork
    ? isShiny
      ? artworkShiny
      : artworkNormal
    : isShiny
    ? animatedShiny
    : animatedNormal;

  const fallbackImgUrl = isShiny
    ? pokemon.sprites.front_shiny || artworkNormal
    : artworkNormal;

  // Defensive Matchups calculation
  const matchups = calculateDefensiveMatchups(pokemon.types);

  return (
    <div
      className="detail-page"
      style={{
        "--type-primary": theme.primary,
        "--type-bg": theme.bg,
      }}
    >
      {/* Quick Prev / Next Pager Bar */}
      <div className="detail-pager-bar">
        {pokemon.id > 1 ? (
          <Link
            to={`/pokemon/${pokemon.id - 1}`}
            className="pager-btn pager-prev"
            title={`Go to #${(pokemon.id - 1).toString().padStart(3, "0")}`}
          >
            <IconArrowLeft size={15} />
            <span className="pager-num">#{formatPokemonId(pokemon.id - 1)}</span>
            <span className="pager-text">Prev</span>
          </Link>
        ) : (
          <div className="pager-btn pager-disabled">
            <IconArrowLeft size={15} />
            <span>Start</span>
          </div>
        )}

        <div className="pager-current-pill">
          <span className="pager-current-id">{formatPokemonId(pokemon.id)}</span>
          <span className="pager-current-name">{capitalize(pokemon.name)}</span>
        </div>

        {pokemon.id < 1025 ? (
          <Link
            to={`/pokemon/${pokemon.id + 1}`}
            className="pager-btn pager-next"
            title={`Go to #${(pokemon.id + 1).toString().padStart(3, "0")}`}
          >
            <span className="pager-text">Next</span>
            <span className="pager-num">#{formatPokemonId(pokemon.id + 1)}</span>
            <IconArrowRight size={15} />
          </Link>
        ) : (
          <div className="pager-btn pager-disabled">
            <span>End</span>
            <IconArrowRight size={15} />
          </div>
        )}
      </div>

      <div className="detail-header-nav">
        <Link to="/" className="back-link">
          <IconArrowLeft size={16} />
          <span>Back to PokéDex</span>
        </Link>
        <div className="detail-header-actions">
          <button
            type="button"
            onClick={handleAddToTeamClick}
            className={`btn-add-team-active ${isAlreadyInTeam ? "already-in-team" : ""}`}
          >
            {isAlreadyInTeam ? (
              <>
                <IconCheck size={16} />
                <span>In Party (Add Copy)</span>
              </>
            ) : (
              <>
                <IconParty size={16} />
                <span>Add to My Team</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => playPokemonCry(pokemon.id)}
            className="btn-cry-audio"
          >
            <IconVolume size={16} />
            <span>Play Cry</span>
          </button>
        </div>
      </div>

      {teamNotice && (
        <div
          className={`team-notice-banner ${
            teamNotice.success ? "notice-success" : "notice-warning"
          }`}
        >
          {teamNotice.success ? (
            <IconSparkles size={16} />
          ) : (
            <IconAlertTriangle size={16} />
          )}{" "}
          {teamNotice.message}{" "}
          {teamNotice.success && (
            <Link to="/team" className="notice-link">
              <span>View My Team</span>
              <IconArrowRight size={14} />
            </Link>
          )}
        </div>
      )}

      <div className="detail-card">
        {/* Top Identification */}
        <div className="detail-identity">
          <span className="detail-id">{formatPokemonId(pokemon.id)}</span>
          <h2 className="detail-name">{capitalize(pokemon.name)}</h2>
          <span className="detail-genus">{genus}</span>

          <div className="detail-types">
            {pokemon.types.map((t) => (
              <TypeBadge key={t.type.name} type={t.type.name} size="lg" />
            ))}
          </div>
        </div>

        {/* Visual Showcase with Artwork / Showdown & Shiny Mode */}
        <div className="detail-visual-wrapper">
          <div className="image-toggle-bar">
            <div className="toggle-group-left">
              <button
                type="button"
                onClick={() => setUseArtwork(true)}
                className={`toggle-btn ${useArtwork ? "active" : ""}`}
              >
                <IconPalette size={15} />
                <span>Official Artwork</span>
              </button>
              <button
                type="button"
                onClick={() => setUseArtwork(false)}
                className={`toggle-btn ${!useArtwork ? "active" : ""}`}
              >
                <IconSparkles size={15} />
                <span>Animated Showdown</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsShiny((prev) => !prev)}
              className={`toggle-btn btn-shiny-toggle ${isShiny ? "shiny-active" : ""}`}
              title={isShiny ? "Click to switch to Normal Color" : "Click to view Shiny Color Variant"}
            >
              <IconSparkles size={15} className="shiny-spark-icon" />
              <span>{isShiny ? "✨ Shiny Variant" : "Shiny Form"}</span>
            </button>
          </div>

          <div className={`detail-image-box ${isShiny ? "image-box-shiny" : ""}`}>
            <img
              key={`${pokemon.id}-${useArtwork}-${isShiny}`}
              src={displayImgUrl}
              alt={`${pokemon.name} ${isShiny ? "shiny" : "regular"}`}
              className={useArtwork ? "artwork-img" : "animated-img"}
              onError={(e) => {
                e.target.src = fallbackImgUrl;
              }}
            />
            {isShiny && (
              <span className="shiny-pill-overlay">
                <IconSparkles size={13} /> Shiny Variant
              </span>
            )}
          </div>
        </div>

        {/* Lore / Description with Text to Speech */}
        {flavorText && (
          <div className="detail-lore-box">
            <div className="lore-header">
              <h3>Pokédex Lore</h3>
              <button
                type="button"
                onClick={handleSpeakDex}
                className={`btn-tts ${isSpeaking ? "speaking" : ""}`}
                title="Listen to Pokédex Voice"
              >
                {isSpeaking ? (
                  <>
                    <IconSquare size={16} />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <IconMic size={16} />
                    <span>Listen Pokédex Voice</span>
                  </>
                )}
              </button>
            </div>
            <p className="lore-text">"{flavorText}"</p>
          </div>
        )}

        {/* Physical Bio Metrics */}
        <div className="detail-metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Height</span>
            <span className="metric-val">{pokemon.height / 10} m</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Weight</span>
            <span className="metric-val">{pokemon.weight / 10} kg</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Base EXP</span>
            <span className="metric-val">{pokemon.base_experience || "—"}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Abilities</span>
            <span className="metric-val">
              {pokemon.abilities
                .map((a) => capitalize(a.ability.name))
                .join(", ")}
            </span>
          </div>
        </div>

        {/* Evolution Chain Visualizer */}
        <div className="detail-evolution-section">
          <div className="section-title-wrap">
            <h3>Evolutionary Line</h3>
            <span className="section-hint">Click any stage to view Pokédex data</span>
          </div>

          {evoChain.length <= 1 ? (
            <div className="evo-empty-state">
              <span className="evo-empty-text">This Pokémon does not evolve.</span>
            </div>
          ) : (
            <div className="evo-chain-wrapper">
              {evoChain.map((evo, index) => {
                const isCurrent =
                  evo.name.toLowerCase() === pokemon.name.toLowerCase();
                return (
                  <div key={evo.name} className="evo-step-item">
                    {index > 0 && (
                      <div className="evo-transition-arrow">
                        <span className="evo-condition-badge">
                          {evo.condition || "Evolution"}
                        </span>
                        <IconArrowRight size={18} className="evo-arrow-svg" />
                      </div>
                    )}
                    <Link
                      to={`/pokemon/${evo.name}`}
                      className={`evo-node-card ${
                        isCurrent ? "evo-node-current" : ""
                      }`}
                      title={
                        isCurrent
                          ? `Currently viewing ${capitalize(evo.name)}`
                          : `Inspect ${capitalize(evo.name)}`
                      }
                    >
                      <div className="evo-node-sprite-box">
                        <img
                          src={getAnimatedSpriteUrl(evo.id)}
                          alt={evo.name}
                          className="evo-node-sprite"
                          onError={(e) => {
                            e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`;
                          }}
                        />
                      </div>
                      <span className="evo-node-id">#{formatPokemonId(evo.id)}</span>
                      <strong className="evo-node-name">{capitalize(evo.name)}</strong>
                      {isCurrent && <span className="evo-current-badge">Current</span>}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Defensive Type Matchups */}
        <div className="detail-matchups-section">
          <div className="section-title-wrap">
            <h3>Defensive Type Matchups</h3>
            <span className="section-hint">Damage multipliers taken from attacking move types</span>
          </div>

          <div className="matchups-container">
            {matchups.weaknesses4x.length > 0 && (
              <div className="matchup-category-card match-weak-4x">
                <div className="matchup-header">
                  <span className="matchup-multiplier tag-red">×4</span>
                  <span className="matchup-title">Extreme Weakness</span>
                </div>
                <div className="matchup-type-list">
                  {matchups.weaknesses4x.map((item) => (
                    <TypeBadge key={item.type} type={item.type} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {matchups.weaknesses2x.length > 0 && (
              <div className="matchup-category-card match-weak-2x">
                <div className="matchup-header">
                  <span className="matchup-multiplier tag-orange">×2</span>
                  <span className="matchup-title">Weakness</span>
                </div>
                <div className="matchup-type-list">
                  {matchups.weaknesses2x.map((item) => (
                    <TypeBadge key={item.type} type={item.type} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {matchups.resistances05x.length > 0 && (
              <div className="matchup-category-card match-resist-05x">
                <div className="matchup-header">
                  <span className="matchup-multiplier tag-green">½×</span>
                  <span className="matchup-title">Resistant</span>
                </div>
                <div className="matchup-type-list">
                  {matchups.resistances05x.map((item) => (
                    <TypeBadge key={item.type} type={item.type} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {matchups.resistances025x.length > 0 && (
              <div className="matchup-category-card match-resist-025x">
                <div className="matchup-header">
                  <span className="matchup-multiplier tag-emerald">¼×</span>
                  <span className="matchup-title">Super Resistant</span>
                </div>
                <div className="matchup-type-list">
                  {matchups.resistances025x.map((item) => (
                    <TypeBadge key={item.type} type={item.type} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {matchups.immunities0x.length > 0 && (
              <div className="matchup-category-card match-immune">
                <div className="matchup-header">
                  <span className="matchup-multiplier tag-purple">0×</span>
                  <span className="matchup-title">Immunity</span>
                </div>
                <div className="matchup-type-list">
                  {matchups.immunities0x.map((item) => (
                    <TypeBadge key={item.type} type={item.type} size="sm" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Base Stats Breakdown */}
        <div className="detail-stats-section">
          <div className="stats-header">
            <h3>Base Combat Stats</h3>
            <span className="stats-total">
              BST: <strong>{totalStats}</strong>
            </span>
          </div>

          <div className="stat-bars-container">
            {pokemon.stats.map((s) => {
              const val = s.base_stat;
              const maxStat = 255;
              const percent = Math.min(100, Math.round((val / maxStat) * 100));

              let barColor = "#e53e3e";
              if (val >= 90) barColor = "#38a169";
              else if (val >= 60) barColor = "#dd6b20";

              return (
                <div key={s.stat.name} className="stat-row">
                  <span className="stat-title">
                    {capitalize(s.stat.name.replace("-", " "))}
                  </span>
                  <span className="stat-num">{val}</span>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: barColor,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailPage;
