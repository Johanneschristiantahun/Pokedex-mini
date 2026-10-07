import { useState, useEffect, useRef } from "react";
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
  getAnimatedBackSpriteUrl,
  getAnimatedBackShinySpriteUrl,
  getBackSpriteUrl,
  getArtworkUrl,
  getArtworkShinyUrl,
  getModel3dUrl,
  getModel3dShinyUrl,
  getTypeColor,
  pokemonDetailCache,
} from "../utils.js";
import { calculateDefensiveMatchups } from "../utils/typeEffectiveness.js";
import { fetchPokemonTcgCards } from "../utils/tcgApi.js";
import { speakPokemonEntry, stopSpeaking } from "../utils/speech.js";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconVolume,
  IconSparkles,
  IconMic,
  IconSquare,
  IconRefresh,
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
  const { team, addToTeam, addToBox } = useGame();

  const [pokemon, setPokemon] = useState(
    () => pokemonDetailCache[name.toLowerCase()] || null
  );
  const [species, setSpecies] = useState(null);
  const [evoChain, setEvoChain] = useState([]);
  const [viewMode, setViewMode] = useState("animated");
  const [isShiny, setIsShiny] = useState(false);
  const [spriteAngle, setSpriteAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoRotate3d, setIsAutoRotate3d] = useState(true);
  const [model3dError, setModel3dError] = useState(false);
  const dragStartRef = useRef({ x: 0, startAngle: 0 });
  const modelViewerRef = useRef(null);

  function handlePointerDown(e) {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      startAngle: spriteAngle,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    let newAngle = dragStartRef.current.startAngle + deltaX * 0.8;
    newAngle = Math.max(0, Math.min(180, newAngle));
    setSpriteAngle(newAngle);
  }

  function handlePointerUp(e) {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function handleToggleSpin180() {
    setSpriteAngle((prev) => (prev >= 90 ? 0 : 180));
  }

  const [isLoading, setIsLoading] = useState(
    () => !pokemonDetailCache[name.toLowerCase()]
  );
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [teamNotice, setTeamNotice] = useState(null);

  // Pokemon TCG API States
  const [tcgCards, setTcgCards] = useState([]);
  const [isLoadingTcg, setIsLoadingTcg] = useState(false);
  const [inspectTcgCard, setInspectTcgCard] = useState(null);

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

        // Concurrently fetch TCG cards for this Pokémon
        setIsLoadingTcg(true);
        fetchPokemonTcgCards(coreData.id)
          .then((cards) => {
            if (isCurrent) setTcgCards(cards);
          })
          .catch(() => {
            if (isCurrent) setTcgCards([]);
          })
          .finally(() => {
            if (isCurrent) setIsLoadingTcg(false);
          });

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
      stopSpeaking();
    };
  }, [name]);

  // Extract English Pokédex description
  const flavorText =
    species?.flavor_text_entries
      ?.find((f) => f.language.name === "en")
      ?.flavor_text?.replace(/[\f\n\r]/g, " ") || "";

  const genus =
    species?.genera?.find((g) => g.language.name === "en")?.genus || "Pokémon";

  // Dexter Pokédex Text-to-Speech handler
  function handleSpeakDex() {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const types = (pokemon?.types || []).map((t) => t.type.name);
    const success = speakPokemonEntry(
      {
        name: capitalize(pokemon.name),
        types,
        description: flavorText || `The ${genus}.`,
      },
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );

    if (!success) {
      alert("Text-to-speech is not supported in this browser.");
    }
  }

  // Real Add to Team handler
  function handleAddToTeamClick() {
    if (!pokemon) return;
    const result = addToTeam(pokemon, 5);
    setTeamNotice(result);
    setTimeout(() => setTeamNotice(null), 4000);
  }

  // Direct PC Box Deposit handler
  function handleAddToBoxClick() {
    if (!pokemon) return;
    const result = addToBox(pokemon, 5);
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

  // Artwork vs Animated sprite vs 3D (with Shiny support)
  const artworkNormal =
    pokemon.sprites.other?.["official-artwork"]?.front_default ||
    getArtworkUrl(pokemon.id);
  const artworkShiny =
    pokemon.sprites.other?.["official-artwork"]?.front_shiny ||
    getArtworkShinyUrl(pokemon.id);
  const animatedNormal = getAnimatedSpriteUrl(pokemon.id);
  const animatedShiny = getAnimatedShinySpriteUrl(pokemon.id);
  const animatedBackNormal =
    getAnimatedBackSpriteUrl(pokemon.id) || getBackSpriteUrl(pokemon.id);
  const animatedBackShiny =
    getAnimatedBackShinySpriteUrl(pokemon.id) || getBackSpriteUrl(pokemon.id);

  const fallbackImgUrl = isShiny
    ? pokemon.sprites.front_shiny || artworkNormal
    : artworkNormal;

  const currentArtworkUrl = isShiny ? artworkShiny : artworkNormal;
  const currentFrontAnimatedUrl = isShiny ? animatedShiny : animatedNormal;
  const currentBackAnimatedUrl = isShiny ? animatedBackShiny : animatedBackNormal;
  const currentModel3dUrl = isShiny
    ? getModel3dShinyUrl(pokemon.id)
    : getModel3dUrl(pokemon.id);

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
      {/* Top Navigation Bar: Back & Prev/Next Pager */}
      <div className="detail-top-nav">
        <Link to="/" className="back-link">
          <IconArrowLeft size={16} />
          <span>PokéDex</span>
        </Link>

        <div className="detail-nav-pager">
          {pokemon.id > 1 ? (
            <Link
              to={`/pokemon/${pokemon.id - 1}`}
              className="pager-nav-btn"
              title={`Previous Pokémon: #${(pokemon.id - 1).toString().padStart(3, "0")}`}
            >
              <IconArrowLeft size={14} />
              <span>#{formatPokemonId(pokemon.id - 1)}</span>
            </Link>
          ) : (
            <span className="pager-nav-btn pager-nav-disabled">
              <IconArrowLeft size={14} />
              <span>Start</span>
            </span>
          )}

          <span className="pager-nav-divider">/</span>

          {pokemon.id < 1025 ? (
            <Link
              to={`/pokemon/${pokemon.id + 1}`}
              className="pager-nav-btn"
              title={`Next Pokémon: #${(pokemon.id + 1).toString().padStart(3, "0")}`}
            >
              <span>#{formatPokemonId(pokemon.id + 1)}</span>
              <IconArrowRight size={14} />
            </Link>
          ) : (
            <span className="pager-nav-btn pager-nav-disabled">
              <span>End</span>
              <IconArrowRight size={14} />
            </span>
          )}
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
        {/* Top Header: Identification & Primary Actions */}
        <div className="detail-header-section">
          <div className="detail-identity">
            <span className="detail-id">#{formatPokemonId(pokemon.id)}</span>
            <h1 className="detail-name">{capitalize(pokemon.name)}</h1>
            <span className="detail-genus">{genus}</span>

            <div className="detail-types">
              {pokemon.types.map((t) => (
                <TypeBadge key={t.type.name} type={t.type.name} size="md" />
              ))}
            </div>
          </div>

          <div className="detail-header-actions">
            {team.length < 6 ? (
              <button
                type="button"
                onClick={handleAddToTeamClick}
                className={`btn-team-action ${isAlreadyInTeam ? "btn-team-in-party" : "btn-team-add"}`}
              >
                {isAlreadyInTeam ? (
                  <>
                    <IconCheck size={14} />
                    <span>In Party ({team.length}/6)</span>
                  </>
                ) : (
                  <span>Add to Party ({team.length}/6)</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddToBoxClick}
                className="btn-team-action btn-team-box"
                title="Party is full (6/6). Send to Storage Box"
              >
                Deposit to Box (Party 6/6)
              </button>
            )}
            <button
              type="button"
              onClick={() => playPokemonCry(pokemon.id)}
              className="btn-cry-action"
              title="Play sound cry"
            >
              <IconVolume size={15} />
              <span>Play Cry</span>
            </button>
          </div>
        </div>

        {/* Visual Showcase with Artwork / Animated (180°) / 3D (360°) & Shiny Mode */}
        <div className="detail-visual-wrapper">
          <div className="image-toggle-bar">
            <div className="toggle-group-left">
              <button
                type="button"
                onClick={() => setViewMode("artwork")}
                className={`toggle-btn ${viewMode === "artwork" ? "active" : ""}`}
              >
                Artwork
              </button>
              <button
                type="button"
                onClick={() => setViewMode("animated")}
                className={`toggle-btn ${viewMode === "animated" ? "active" : ""}`}
              >
                Animated (180°)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`toggle-btn ${viewMode === "3d" ? "active" : ""}`}
              >
                3D (360°)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsShiny((prev) => !prev)}
              className={`toggle-btn btn-shiny-toggle ${isShiny ? "shiny-active" : ""}`}
              aria-pressed={isShiny}
              title={isShiny ? "Show normal form" : "Show shiny form"}
            >
              {isShiny ? "★ Shiny" : "Shiny"}
            </button>
          </div>

          <div className="detail-image-box">
            {/* 1. ARTWORK MODE */}
            {viewMode === "artwork" && (
              <div className="artwork-stage">
                <img
                  key={`${pokemon.id}-artwork-${isShiny}`}
                  src={currentArtworkUrl}
                  alt={`${pokemon.name} ${isShiny ? "shiny" : "regular"}`}
                  className="artwork-img"
                  onError={(e) => {
                    e.target.src = fallbackImgUrl;
                  }}
                />
              </div>
            )}

            {/* 2. ANIMATED 180° DRAG ROTATOR MODE */}
            {viewMode === "animated" && (
              <div
                className="sprite-180-stage"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div
                  className="sprite-3d-turntable"
                  style={{
                    transform: `perspective(600px) rotateY(${spriteAngle}deg)`,
                    transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <img
                    key={`${pokemon.id}-front-${isShiny}`}
                    src={currentFrontAnimatedUrl}
                    alt={`${pokemon.name} front`}
                    className="animated-img sprite-face-front"
                    style={{
                      display: spriteAngle <= 90 ? "block" : "none",
                    }}
                    onError={(e) => {
                      e.target.src = fallbackImgUrl;
                    }}
                    draggable={false}
                  />

                  <img
                    key={`${pokemon.id}-back-${isShiny}`}
                    src={currentBackAnimatedUrl}
                    alt={`${pokemon.name} back`}
                    className="animated-img sprite-face-back"
                    style={{
                      display: spriteAngle > 90 ? "block" : "none",
                      transform: "scaleX(-1)",
                    }}
                    onError={(e) => {
                      e.target.src = getBackSpriteUrl(pokemon.id);
                    }}
                    draggable={false}
                  />
                </div>

                <div className="rotator-control-bar">
                  <span className="rotator-hint">
                    {spriteAngle <= 45
                      ? "Front View (0°)"
                      : spriteAngle >= 135
                      ? "Back View (180°)"
                      : `Angled View (${Math.round(spriteAngle)}°)`}
                    {" • Drag to rotate 180°"}
                  </span>

                  <div className="rotator-angle-pills">
                    <button
                      type="button"
                      onClick={() => setSpriteAngle(0)}
                      className={`btn-angle-pill ${spriteAngle <= 45 ? "active" : ""}`}
                    >
                      Front (0°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpriteAngle(90)}
                      className={`btn-angle-pill ${spriteAngle > 45 && spriteAngle < 135 ? "active" : ""}`}
                    >
                      Profile (90°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpriteAngle(180)}
                      className={`btn-angle-pill ${spriteAngle >= 135 ? "active" : ""}`}
                    >
                      Back (180°)
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleSpin180}
                      className="btn-angle-pill btn-spin-pill"
                      title="Spin 180 degrees"
                    >
                      <IconRefresh size={12} />
                      <span>Flip 180°</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. 3D 360° ORBIT VIEWER MODE */}
            {viewMode === "3d" && (
              <div className="model-3d-stage">
                <model-viewer
                  key={`3d-${pokemon.id}-${isShiny}`}
                  ref={modelViewerRef}
                  src={currentModel3dUrl}
                  poster={currentArtworkUrl}
                  alt={`3D model of ${pokemon.name}`}
                  camera-controls
                  touch-action="pan-y"
                  auto-rotate={isAutoRotate3d ? "" : undefined}
                  rotation-per-second="25deg"
                  shadow-intensity="1"
                  exposure="1"
                  loading="eager"
                  reveal="auto"
                  onError={() => setModel3dError(true)}
                  style={{
                    width: "100%",
                    height: "260px",
                    backgroundColor: "transparent",
                    outline: "none",
                  }}
                >
                  <div slot="poster" className="model-poster-fallback">
                    <img
                      src={currentArtworkUrl}
                      alt={pokemon.name}
                      className="artwork-img"
                    />
                    <div className="model-loading-pill">Loading 3D Model…</div>
                  </div>
                </model-viewer>

                {model3dError ? (
                  <div className="rotator-control-bar">
                    <span className="rotator-hint">
                      3D model unavailable for this variant.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setModel3dError(false);
                        setViewMode("animated");
                      }}
                      className="btn-angle-pill active"
                    >
                      Switch to Animated (180°)
                    </button>
                  </div>
                ) : (
                  <div className="rotator-control-bar">
                    <span className="rotator-hint">
                      Drag to rotate 360° • Scroll to zoom
                    </span>
                    <div className="rotator-action-buttons">
                      <button
                        type="button"
                        onClick={() => setIsAutoRotate3d((prev) => !prev)}
                        className={`btn-rotator-toggle ${isAutoRotate3d ? "active" : ""}`}
                        title="Toggle automatic 360 rotation"
                      >
                        {isAutoRotate3d ? "Auto 360°: ON" : "Auto 360°: OFF"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (modelViewerRef.current) {
                            modelViewerRef.current.cameraOrbit = "0deg 75deg 105%";
                            modelViewerRef.current.resetTurntableRotation?.();
                          }
                        }}
                        className="btn-rotator-toggle"
                        title="Reset to front angle"
                      >
                        <IconRefresh size={13} />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lore / Description with Text to Speech */}
        {flavorText && (
          <div className="detail-lore-box">
            <div className="lore-header">
              <span className="lore-title">Pokédex Entry</span>
              <button
                type="button"
                onClick={handleSpeakDex}
                className={`btn-tts ${isSpeaking ? "speaking" : ""}`}
                title="Listen to Pokédex Voice"
              >
                {isSpeaking ? (
                  <>
                    <IconSquare size={14} />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <IconMic size={14} />
                    <span>Listen Voice</span>
                  </>
                )}
              </button>
            </div>
            <p className="lore-text">{flavorText}</p>
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
            <h3>Evolution</h3>
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
            <h3>Type Matchups</h3>
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
            <h3>Base Stats</h3>
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

        {/* Trading Card Game (TCG) Official Cards Gallery */}
        <div className="detail-tcg-section">
          <div className="tcg-header">
            <div>
              <h3>Trading Cards</h3>
              <p className="tcg-subtitle">
                Official Pokémon TCG collectibles
              </p>
            </div>
          </div>

          {isLoadingTcg ? (
            <div className="tcg-loading">
              <div className="pokeball-spinner" style={{ width: 28, height: 28 }}></div>
              <span>Connecting to Pokémon TCG Vault…</span>
            </div>
          ) : tcgCards.length === 0 ? (
            <div className="tcg-empty">
              <p>No trading cards found in the official archives for this entry.</p>
            </div>
          ) : (
            <div className="tcg-cards-grid">
              {tcgCards.map((card) => (
                <div
                  key={card.id}
                  className="tcg-card-item"
                  onClick={() => setInspectTcgCard(card)}
                  title="Click to inspect holographic card"
                >
                  <div className="tcg-card-img-wrap">
                    <img
                      src={card.imageSmall}
                      alt={card.name}
                      loading="lazy"
                      className="tcg-card-img"
                    />
                    <div className="tcg-card-sheen"></div>
                  </div>
                  <div className="tcg-card-info">
                    <span className="tcg-set-name">{card.setName}</span>
                    <span className="tcg-rarity">{card.rarity}</span>
                    {card.marketPriceUsd && (
                      <span className="tcg-price">
                        Est. ${Number(card.marketPriceUsd).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TCG Holographic Card Inspection Modal */}
      {inspectTcgCard && (
        <div
          className="tcg-modal-backdrop"
          onClick={() => setInspectTcgCard(null)}
        >
          <div
            className="tcg-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="tcg-modal-close"
              onClick={() => setInspectTcgCard(null)}
              aria-label="Close modal"
            >
              ✕
            </button>
            <div className="tcg-modal-grid">
              <div className="tcg-modal-holo-wrap">
                <img
                  src={inspectTcgCard.imageLarge || inspectTcgCard.imageSmall}
                  alt={inspectTcgCard.name}
                  className="tcg-large-holo-card"
                />
                <div className="tcg-holo-glare"></div>
              </div>
              <div className="tcg-modal-details">
                <span className="tcg-card-set-tag">
                  {inspectTcgCard.series} • {inspectTcgCard.setName}
                </span>
                <h2>{inspectTcgCard.name}</h2>
                <div className="tcg-detail-badges">
                  <span className="badge-rarity">{inspectTcgCard.rarity}</span>
                  {inspectTcgCard.hp && (
                    <span className="badge-hp">HP {inspectTcgCard.hp}</span>
                  )}
                  {inspectTcgCard.types?.map((t) => (
                    <span key={t} className="badge-type">{t}</span>
                  ))}
                </div>

                <div className="tcg-metadata-table">
                  <div className="meta-row">
                    <span>Card ID:</span>
                    <strong>{inspectTcgCard.id}</strong>
                  </div>
                  <div className="meta-row">
                    <span>Illustrator:</span>
                    <strong>{inspectTcgCard.artist}</strong>
                  </div>
                  <div className="meta-row">
                    <span>Release Date:</span>
                    <strong>{inspectTcgCard.releaseDate}</strong>
                  </div>
                  {inspectTcgCard.marketPriceUsd && (
                    <div className="meta-row meta-highlight">
                      <span>Market Value:</span>
                      <strong>${Number(inspectTcgCard.marketPriceUsd).toFixed(2)} USD</strong>
                    </div>
                  )}
                </div>

                <div className="tcg-inspect-hint">
                  Interactive holographic preview from Pokémon TCG official archives.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetailPage;
