import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import {
  WILDERNESS_BIOMES,
  rollWildEncounter,
  rollLootDrop,
} from "../data/wildernessBiomes.js";
import {
  capitalize,
  getAnimatedSpriteUrl,
  getAnimatedShinySpriteUrl,
  getTypeColor,
  playPokemonCry,
} from "../utils.js";
import {
  playGrassRustleSound,
  playBallThrowSound,
  playBallWobbleSound,
  playHitSound,
  playRunSound,
  playItemUseSound,
} from "../utils/soundEffects.js";
import TypeBadge from "../components/TypeBadge.jsx";
import {
  IconTrees,
  IconPokeball,
  IconSparkles,
  IconSwords,
  IconPotion,
  IconCheck,
  IconArrowLeft,
  IconX,
} from "../components/Icons.jsx";

const BALL_KEYS = ["poke-ball", "great-ball", "ultra-ball", "master-ball"];

function WildernessPage() {
  const {
    team,
    box,
    getItemCount,
    addLoot,
    catchWildPokemon,
    gainExpToLeader,
    addMoney,
  } = useGame();

  const [selectedBiome, setSelectedBiome] = useState(WILDERNESS_BIOMES[0]);
  const [encounterCount, setEncounterCount] = useState(0);
  const [isSearchingGrass, setIsSearchingGrass] = useState(false);
  const [activeTileIndex, setActiveTileIndex] = useState(null);

  // Notifications & Loot
  const [lootNotice, setLootNotice] = useState(null);

  // Active Encounter State
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [battlePhase, setBattlePhase] = useState("action"); // "action" | "throwing" | "caught" | "fled" | "victory"
  const [wobbleState, setWobbleState] = useState(0); // 0 = idle, 1, 2, 3 shakes
  const [throwingBallKey, setThrowingBallKey] = useState(null);
  const [isBallPickerOpen, setIsBallPickerOpen] = useState(false);
  const [expResult, setExpResult] = useState(null);

  const leaderPokemon = team[0] || null;

  // Add message to battle log
  function logBattle(msg) {
    setBattleLog((prev) => [...prev.slice(-6), msg]);
  }

  // Handle Grass Rustle Exploration
  function handleExploreGrass(tileIndex = null) {
    if (!leaderPokemon) {
      alert("You need at least 1 Pokémon in your party before entering the tall grass!");
      return;
    }
    if (activeEncounter) return;

    playGrassRustleSound();
    setIsSearchingGrass(true);
    setActiveTileIndex(tileIndex);

    setTimeout(() => {
      setIsSearchingGrass(false);
      setActiveTileIndex(null);

      // Roll: 70% Wild Pokémon, 20% Item Drop, 10% Nothing
      const roll = Math.random();

      if (roll < 0.7) {
        // Wild Encounter!
        const wild = rollWildEncounter(selectedBiome.id);
        setActiveEncounter(wild);
        setBattlePhase("action");
        setBattleLog([
          `Wild ${capitalize(wild.name)} (Lv. ${wild.level}) appeared from the tall grass!`,
        ]);
        if (wild.isShiny) {
          logBattle("✨ What?! A sparkling, rare SHINY Pokémon appeared!");
        }
        playPokemonCry(wild.id);
        setEncounterCount((c) => c + 1);
      } else if (roll < 0.9) {
        // Item Loot Found!
        const loot = rollLootDrop(selectedBiome.id);
        addLoot(loot.itemKey, loot.count);
        setLootNotice({
          itemKey: loot.itemKey,
          name: loot.name,
          count: loot.count,
        });
        setTimeout(() => setLootNotice(null), 4500);
      } else {
        // Nothing found
        setLootNotice({
          empty: true,
          message: "The wind rustled through the tall grass... Nothing stirred.",
        });
        setTimeout(() => setLootNotice(null), 3000);
      }
    }, 450);
  }

  // Attack Action (Reduce Wild HP to improve catch chance or gain EXP)
  function handleAttack() {
    if (!activeEncounter || battlePhase !== "action" || !leaderPokemon) return;

    playHitSound();

    // Damage Formula based on leader's level and attack
    const baseAtk = leaderPokemon.attack || 40;
    const wildDef = 35;
    const rawDmg = Math.floor(
      ((2 * leaderPokemon.level) / 5 + 2) * 35 * (baseAtk / wildDef) * (1 / 50) + 2
    );
    const variance = 0.85 + Math.random() * 0.3;
    const damage = Math.max(5, Math.floor(rawDmg * variance));

    const newHp = Math.max(0, activeEncounter.currentHp - damage);

    logBattle(`${leaderPokemon.nickname} attacked! Dealt ${damage} damage.`);

    if (newHp <= 0) {
      // Wild Pokémon faints!
      setActiveEncounter((prev) => ({ ...prev, currentHp: 0 }));
      setBattlePhase("victory");
      logBattle(`Wild ${capitalize(activeEncounter.name)} fainted!`);

      // Award EXP to leader
      const expReward = activeEncounter.expReward || 45;
      const moneyReward = activeEncounter.moneyReward || 120;
      const res = gainExpToLeader(expReward);
      addMoney(moneyReward);

      setExpResult({
        expGained: expReward,
        moneyGained: moneyReward,
        levelUpInfo: res?.didLevelUp ? res : null,
      });

      if (res?.didLevelUp) {
        logBattle(`🌟 ${leaderPokemon.nickname} grew to Level ${res.newLevel}!`);
      }
    } else {
      setActiveEncounter((prev) => ({ ...prev, currentHp: newHp }));
      const hpPercent = Math.round((newHp / activeEncounter.maxHp) * 100);
      if (hpPercent <= 30) {
        logBattle(`Wild ${capitalize(activeEncounter.name)} is weakened! It's much easier to catch!`);
      }
    }
  }

  // Throw Poké Ball Action
  function handleThrowBall(ballKey) {
    if (!activeEncounter || battlePhase !== "action") return;

    const ballCount = getItemCount(ballKey);
    if (ballCount <= 0) return;

    setIsBallPickerOpen(false);
    setThrowingBallKey(ballKey);
    setBattlePhase("throwing");
    setWobbleState(0);

    playBallThrowSound();
    logBattle(`Threw a ${ballKey.replace("-", " ").toUpperCase()}!`);

    // Ball Animation Sequence: 1 shake -> 2 shake -> 3 shake -> catch / break
    const catchResult = catchWildPokemon(activeEncounter, ballKey);

    setTimeout(() => {
      // Shake 1
      setWobbleState(1);
      playBallWobbleSound();

      setTimeout(() => {
        if (!catchResult.success && catchResult.shakes === 0) {
          // Immediate Break out!
          setBattlePhase("action");
          setThrowingBallKey(null);
          setWobbleState(0);
          logBattle(catchResult.message);
          return;
        }

        // Shake 2
        setWobbleState(2);
        playBallWobbleSound();

        setTimeout(() => {
          if (!catchResult.success && catchResult.shakes === 1) {
            // Break out after 1 shake!
            setBattlePhase("action");
            setThrowingBallKey(null);
            setWobbleState(0);
            logBattle(catchResult.message);
            return;
          }

          // Shake 3
          setWobbleState(3);
          playBallWobbleSound();

          setTimeout(() => {
            if (catchResult.success) {
              // CAUGHT! Click!
              setBattlePhase("caught");
              setWobbleState(3);
              logBattle(catchResult.message);
              if (catchResult.sentToBox) {
                logBattle("Party full! Pokémon was safely sent to PC Storage Box.");
              }
            } else {
              // Break out after 2 shakes!
              setBattlePhase("action");
              setThrowingBallKey(null);
              setWobbleState(0);
              logBattle(catchResult.message);
            }
          }, 600);
        }, 600);
      }, 600);
    }, 700);
  }

  // Feed Berry Action (Calm the wild Pokémon)
  function handleFeedBerry() {
    if (!activeEncounter || battlePhase !== "action") return;
    const berryCount = getItemCount("oran-berry");
    if (berryCount <= 0) {
      alert("You don't have any Oran Berries in your Bag!");
      return;
    }

    playItemUseSound();
    // Slightly boost catch rate
    setActiveEncounter((prev) => ({
      ...prev,
      catchRate: Math.min(255, (prev.catchRate || 190) + 25),
    }));
    logBattle(`Fed an Oran Berry to wild ${capitalize(activeEncounter.name)}! It looks calmer and friendly.`);
  }

  // Run Away Action
  function handleRunAway() {
    playRunSound();
    setBattlePhase("fled");
    logBattle("Got away safely!");
    setTimeout(() => {
      setActiveEncounter(null);
      setBattlePhase("action");
      setThrowingBallKey(null);
      setWobbleState(0);
      setExpResult(null);
    }, 700);
  }

  // Close Battle Screen after Victory or Catch
  function handleDismissBattle() {
    setActiveEncounter(null);
    setBattlePhase("action");
    setThrowingBallKey(null);
    setWobbleState(0);
    setExpResult(null);
  }

  // Available Poké Balls in inventory
  const availableBalls = BALL_KEYS.map((key) => ({
    key,
    count: getItemCount(key),
  })).filter((b) => b.count > 0);

  const primaryType = activeEncounter ? activeEncounter.types?.[0] || "normal" : "normal";
  const wildTheme = getTypeColor(primaryType);

  const wildHpPercent = activeEncounter
    ? Math.max(0, Math.round((activeEncounter.currentHp / activeEncounter.maxHp) * 100))
    : 100;

  let wildHpColor = "#22c55e";
  if (wildHpPercent <= 25) wildHpColor = "#ef4444";
  else if (wildHpPercent <= 50) wildHpColor = "#f97316";

  return (
    <div className="wilderness-page">
      {/* Page Header */}
      <div className="wilderness-header-banner">
        <div className="wilderness-header-info">
          <div className="wilderness-title-row">
            <IconTrees size={28} className="wilderness-header-icon" />
            <div>
              <h2>Wilderness Expedition</h2>
              <p>Explore biomes, encounter wild Pokémon, grind EXP, and catch companions with Poké Balls!</p>
            </div>
          </div>
        </div>

        <div className="wilderness-header-meta">
          <span className="party-status-pill">
            <IconPokeball size={14} /> Party: <strong>{team.length}/6</strong>
          </span>
          <span className="box-status-pill">
            PC Box: <strong>{box.length} stored</strong>
          </span>
          <span className="encounter-status-pill">
            Encounters: <strong>{encounterCount}</strong>
          </span>
        </div>
      </div>

      {/* Biome Selection Deck */}
      <div className="biome-deck-section">
        <span className="section-label">Select Exploration Region:</span>
        <div className="biome-cards-grid">
          {WILDERNESS_BIOMES.map((biome) => {
            const isSelected = selectedBiome.id === biome.id;
            return (
              <button
                key={biome.id}
                type="button"
                onClick={() => {
                  if (activeEncounter) {
                    if (!window.confirm("You are currently in an encounter! Escape and change biomes?")) return;
                    handleDismissBattle();
                  }
                  setSelectedBiome(biome);
                }}
                className={`biome-card ${isSelected ? "biome-card-active" : ""}`}
                style={{
                  "--biome-color": biome.color,
                  "--biome-gradient": biome.bgGradient,
                }}
              >
                <div className="biome-card-inner">
                  <span className="biome-name">{biome.name}</span>
                  <span className="biome-level-badge">{biome.recommendedLevel}</span>
                  <p className="biome-desc">{biome.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loot / Discovery Notification Banner */}
      {lootNotice && (
        <div className={`loot-notice-banner ${lootNotice.empty ? "loot-empty" : "loot-found"}`}>
          {lootNotice.empty ? (
            <span>{lootNotice.message}</span>
          ) : (
            <div className="loot-content">
              <IconSparkles size={16} className="loot-sparkle" />
              <span>
                Found <strong>{lootNotice.count}x {lootNotice.name}</strong> glistening in the tall grass! (Added to Bag)
              </span>
              <Link to="/bag" className="loot-bag-link">
                View Bag
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Exploration Meadow (Tall Grass Field) */}
      {!activeEncounter && (
        <div className="wilderness-meadow-zone">
          <div className="meadow-header">
            <div className="meadow-title-group">
              <h3>{selectedBiome.name} — Tall Grass Zone</h3>
              <span className="meadow-subtitle">Click the grass patches or the button below to search for Pokémon</span>
            </div>
            <button
              type="button"
              onClick={() => handleExploreGrass()}
              disabled={isSearchingGrass}
              className={`btn-explore-grass ${isSearchingGrass ? "searching" : ""}`}
            >
              <IconTrees size={18} />
              <span>{isSearchingGrass ? "Rustling Grass…" : "Search Tall Grass"}</span>
            </button>
          </div>

          {/* Interactive Tall Grass Tile Grid */}
          <div className="tall-grass-grid">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                onClick={() => handleExploreGrass(idx)}
                className={`tall-grass-tile ${activeTileIndex === idx ? "tile-rustling" : ""}`}
                title="Search this grass patch"
              >
                <div className="grass-blade grass-blade-1"></div>
                <div className="grass-blade grass-blade-2"></div>
                <div className="grass-blade grass-blade-3"></div>
                <div className="grass-blade grass-blade-4"></div>
              </div>
            ))}
          </div>

          {/* Biome Habitat Species Preview */}
          <div className="habitat-spawns-preview">
            <span className="spawns-preview-label">Native Species spotted in this biome:</span>
            <div className="habitat-spawns-list">
              {selectedBiome.wildSpawns.map((s) => (
                <div key={s.id} className="habitat-spawn-pill">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.id}.png`}
                    alt={s.name}
                    className="spawn-preview-sprite"
                  />
                  <span>{capitalize(s.name)}</span>
                  <span className="spawn-level-tag">Lv.{s.minLevel}-{s.maxLevel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wild Encounter & Catch Arena Modal / Screen */}
      {activeEncounter && (
        <div className="wild-arena-modal-backdrop">
          <div
            className="wild-arena-card"
            style={{
              "--wild-primary": wildTheme.primary,
              "--wild-bg": wildTheme.bg,
            }}
          >
            {/* Arena Top Nav / Biome Indicator */}
            <div className="arena-top-bar">
              <span className="arena-biome-tag">
                <IconTrees size={14} /> {selectedBiome.name}
              </span>
              <button
                type="button"
                onClick={handleRunAway}
                className="arena-close-btn"
                title="Run Away safely"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Split Screen Battle Stage */}
            <div className="battle-stage-wrapper">
              {/* Opponent (Wild Pokémon) Field */}
              <div className="stage-side stage-opponent">
                <div className="wild-info-card">
                  <div className="wild-header-row">
                    <h4 className="wild-name">{capitalize(activeEncounter.name)}</h4>
                    <span className="wild-level-tag">Lv. {activeEncounter.level}</span>
                    {activeEncounter.isShiny && (
                      <span className="wild-shiny-tag" title="Extremely Rare Sparkling Shiny!">
                        <IconSparkles size={12} /> SHINY
                      </span>
                    )}
                  </div>

                  <div className="wild-types-row">
                    {activeEncounter.types?.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </div>

                  {/* Wild HP Bar */}
                  <div className="wild-hp-bar-wrap">
                    <div className="wild-hp-meta">
                      <span>HP</span>
                      <span>{activeEncounter.currentHp} / {activeEncounter.maxHp}</span>
                    </div>
                    <div className="hp-track">
                      <div
                        className="hp-fill"
                        style={{
                          width: `${wildHpPercent}%`,
                          backgroundColor: wildHpColor,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="wild-sprite-arena-box">
                  {/* Catching Ball Animation Overlay */}
                  {battlePhase === "throwing" && throwingBallKey && (
                    <div className={`pokeball-throw-animation wobble-${wobbleState}`}>
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${throwingBallKey}.png`}
                        alt="Poké Ball"
                        className="thrown-ball-img"
                      />
                    </div>
                  )}

                  {/* Caught Victory Badge */}
                  {battlePhase === "caught" && (
                    <div className="caught-stamp-overlay">
                      <IconCheck size={28} />
                      <span>CAUGHT!</span>
                    </div>
                  )}

                  {/* Wild Sprite */}
                  <img
                    src={
                      activeEncounter.isShiny
                        ? getAnimatedShinySpriteUrl(activeEncounter.id)
                        : getAnimatedSpriteUrl(activeEncounter.id)
                    }
                    alt={activeEncounter.name}
                    className={`wild-showdown-sprite ${
                      battlePhase === "throwing" ? "sprite-being-caught" : ""
                    } ${activeEncounter.currentHp <= 0 ? "sprite-fainted" : ""}`}
                    onError={(e) => {
                      e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${activeEncounter.id}.png`;
                    }}
                  />
                </div>
              </div>

              {/* Player Active Leader Field */}
              {leaderPokemon && (
                <div className="stage-side stage-player">
                  <div className="player-sprite-arena-box">
                    <img
                      src={
                        leaderPokemon.sprites?.backAnimated ||
                        leaderPokemon.sprites?.animated ||
                        leaderPokemon.sprites?.static
                      }
                      alt={leaderPokemon.name}
                      className="player-showdown-sprite"
                      onError={(e) => {
                        e.target.src = leaderPokemon.sprites?.static;
                      }}
                    />
                  </div>

                  <div className="player-info-card">
                    <div className="player-header-row">
                      <h4 className="player-pokemon-name">{leaderPokemon.nickname}</h4>
                      <span className="player-level-tag">Lv. {leaderPokemon.level}</span>
                    </div>

                    <div className="player-hp-bar-wrap">
                      <div className="player-hp-meta">
                        <span>HP</span>
                        <span>{leaderPokemon.currentHp} / {leaderPokemon.maxHp}</span>
                      </div>
                      <div className="hp-track">
                        <div
                          className="hp-fill"
                          style={{
                            width: `${Math.round((leaderPokemon.currentHp / leaderPokemon.maxHp) * 100)}%`,
                            backgroundColor: "#22c55e",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Battle Text Console Log */}
            <div className="battle-console-log">
              {battleLog.map((log, index) => (
                <div key={index} className="log-line">
                  &rsaquo; {log}
                </div>
              ))}
            </div>

            {/* Post-Battle Victory Screen */}
            {battlePhase === "victory" && expResult && (
              <div className="battle-result-banner banner-victory">
                <h4>Victory! Wild Pokémon Defeated</h4>
                <div className="result-stats-row">
                  <span>EXP Gained: <strong>+{expResult.expGained}</strong></span>
                  <span>PokéDollars: <strong>+₽{expResult.moneyGained}</strong></span>
                </div>
                {expResult.levelUpInfo && (
                  <div className="level-up-toast">
                    <IconSparkles size={16} />
                    <span>
                      {expResult.levelUpInfo.pokemonName} leveled up to Lv. {expResult.levelUpInfo.newLevel}! Max HP is now {expResult.levelUpInfo.newHp}!
                    </span>
                  </div>
                )}
                <button type="button" onClick={handleDismissBattle} className="btn-dismiss-battle">
                  Continue Exploring
                </button>
              </div>
            )}

            {/* Post-Catch Screen */}
            {battlePhase === "caught" && (
              <div className="battle-result-banner banner-caught">
                <h4>Gotcha! {capitalize(activeEncounter.name)} was caught!</h4>
                <p>
                  Added to your collection! Check your{" "}
                  <Link to="/team" className="result-inline-link">
                    Team / PC Storage Box
                  </Link>
                  .
                </p>
                <button type="button" onClick={handleDismissBattle} className="btn-dismiss-battle">
                  Continue Exploring
                </button>
              </div>
            )}

            {/* Battle Actions Control Bar */}
            {battlePhase === "action" && (
              <div className="arena-actions-bar">
                {/* 1. Attack / Fight */}
                <button
                  type="button"
                  onClick={handleAttack}
                  className="btn-arena-action btn-arena-fight"
                  title="Attack to weaken the wild Pokémon's HP"
                >
                  <IconSwords size={18} />
                  <span>Fight</span>
                </button>

                {/* 2. Catch / Throw Poké Ball */}
                <button
                  type="button"
                  onClick={() => setIsBallPickerOpen((prev) => !prev)}
                  className="btn-arena-action btn-arena-ball"
                  title="Throw a Poké Ball from your Bag"
                >
                  <IconPokeball size={18} />
                  <span>Catch ({availableBalls.reduce((s, b) => s + b.count, 0)})</span>
                </button>

                {/* 3. Feed Berry */}
                <button
                  type="button"
                  onClick={handleFeedBerry}
                  className="btn-arena-action btn-arena-berry"
                  title="Feed an Oran Berry to calm the wild Pokémon"
                >
                  <IconPotion size={18} />
                  <span>Berry ({getItemCount("oran-berry")})</span>
                </button>

                {/* 4. Run Away */}
                <button
                  type="button"
                  onClick={handleRunAway}
                  className="btn-arena-action btn-arena-run"
                  title="Flee the encounter safely"
                >
                  <IconArrowLeft size={18} />
                  <span>Run</span>
                </button>
              </div>
            )}

            {/* Poké Ball Selector Dropup Drawer */}
            {isBallPickerOpen && battlePhase === "action" && (
              <div className="ball-picker-drawer">
                <div className="ball-picker-header">
                  <span>Choose Poké Ball from Bag:</span>
                  <button
                    type="button"
                    onClick={() => setIsBallPickerOpen(false)}
                    className="ball-picker-close"
                  >
                    <IconX size={14} />
                  </button>
                </div>

                {availableBalls.length === 0 ? (
                  <div className="ball-picker-empty">
                    <span>You have no Poké Balls left in your Bag!</span>
                    <Link to="/bag" className="btn-buy-balls-link">
                      Go to Poké Mart
                    </Link>
                  </div>
                ) : (
                  <div className="ball-options-list">
                    {availableBalls.map((b) => (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => handleThrowBall(b.key)}
                        className="ball-option-btn"
                      >
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${b.key}.png`}
                          alt={b.key}
                          className="ball-sprite-sm"
                        />
                        <div className="ball-meta">
                          <strong className="ball-name">
                            {b.key.replace("-", " ").toUpperCase()}
                          </strong>
                          <span className="ball-count">Qty: {b.count}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WildernessPage;
