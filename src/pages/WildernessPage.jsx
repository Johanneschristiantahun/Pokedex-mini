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
  getAnimatedBackSpriteUrl,
  getAnimatedBackShinySpriteUrl,
  getBackSpriteUrl,
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
  playAttackWhooshSound,
  playCriticalHitSound,
  playSuperEffectiveSound,
  playNotVeryEffectiveSound,
  playFaintSound,
} from "../utils/soundEffects.js";
import { getPokemonMoves, pickWildMove } from "../data/pokemonMoves.js";
import { getTypeDamageMultiplier } from "../utils/typeEffectiveness.js";
import {
  BattleEnvironment,
  BattlePedestal,
  ElementalVfxOverlay,
} from "../components/BattleEnvironment.jsx";
import WeatherWidget from "../components/WeatherWidget.jsx";
import { getWeatherDamageMultiplier } from "../utils/weatherApi.js";
import {
  IconTrees,
  IconPokeball,
  IconSparkles,
  IconBackpack,
  IconParty,
  IconArrowLeft,
  IconX,
  IconCheck,
  IconHeart,
  IconGear,
  IconCamera,
  IconBook,
} from "../components/Icons.jsx";

const BALL_KEYS = ["poke-ball", "great-ball", "ultra-ball", "master-ball"];
const MEDICINE_KEYS = [
  "potion",
  "super-potion",
  "hyper-potion",
  "max-potion",
  "oran-berry",
  "sitrus-berry",
  "revive",
];

function checkEscapeSuccess(playerSpeed, wildSpeed) {
  return playerSpeed >= wildSpeed || Math.random() < 0.7;
}

function WildernessPage() {
  const {
    team,
    box,
    getItemCount,
    addLoot,
    catchWildPokemon,
    gainExpToLeader,
    addMoney,
    updatePokemonHp,
    setTeamLeader,
    applyItemToPokemon,
  } = useGame();

  const [selectedBiome, setSelectedBiome] = useState(WILDERNESS_BIOMES[0]);
  const [encounterCount, setEncounterCount] = useState(0);
  const [isSearchingGrass, setIsSearchingGrass] = useState(false);
  const [activeTileIndex, setActiveTileIndex] = useState(null);

  // Spontaneous Loot Notification
  const [lootNotice, setLootNotice] = useState(null);

  // Live Real-World Weather State
  const [currentWeather, setCurrentWeather] = useState(null);

  // Active Encounter State
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [battleState, setBattleState] = useState("MENU"); // "MENU" | "MOVES" | "BAG" | "PARTY" | "ANIMATING" | "VICTORY" | "DEFEATED" | "CAUGHT"
  const [playerMoves, setPlayerMoves] = useState([]);
  const [battleDialogue, setBattleDialogue] = useState("");
  const [battleHistory, setBattleHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // In-Battle Bag Drawer Tab: "balls" | "medicine"
  const [bagTab, setBagTab] = useState("balls");

  // Catching Ball Animation
  const [throwingBallKey, setThrowingBallKey] = useState(null);
  const [wobbleState, setWobbleState] = useState(0);

  // VFX States
  const [playerAnim, setPlayerAnim] = useState(""); // "" | "anim-player-lunge" | "anim-player-hit" | "anim-faint-slide"
  const [wildAnim, setWildAnim] = useState(""); // "" | "anim-wild-lunge" | "anim-wild-hit" | "anim-faint-slide"
  const [screenShake, setScreenShake] = useState(false);
  const [slashVfxOnWild, setSlashVfxOnWild] = useState(false);
  const [slashVfxOnPlayer, setSlashVfxOnPlayer] = useState(false);
  const [elementalVfx, setElementalVfx] = useState(null); // { target: "wild" | "player", type: string }
  const [wildDamagePopup, setWildDamagePopup] = useState(null);
  const [playerDamagePopup, setPlayerDamagePopup] = useState(null);

  // Modern Arena View & Combat Settings (Matching 2.5D Mobile Screenshot)
  const [cameraMode, setCameraMode] = useState("isometric"); // "isometric" | "classic"
  const [battleSpeed, setBattleSpeed] = useState(1); // 1 | 2
  const [turnNumber, setTurnNumber] = useState(1);

  // Result state
  const [expResult, setExpResult] = useState(null);

  const leaderPokemon = team[0] || null;

  function pushLog(text) {
    setBattleHistory((prev) => [...prev.slice(-15), text]);
  }

  // Handle Grass Rustle Exploration
  function handleExploreGrass(tileIndex = null) {
    if (!leaderPokemon) {
      alert("You need at least 1 Pokémon in your party before entering the tall grass!");
      return;
    }
    const aliveMon = team.find((p) => (p.currentHp || 0) > 0);
    if (!aliveMon) {
      alert("All Pokémon in your party have fainted! Visit the Pokémon Center in Town to heal your team before exploring.");
      return;
    }
    if (activeEncounter) return;

    // If current leader is fainted, auto-switch to the first living team member
    let currentBattler = leaderPokemon;
    if ((leaderPokemon.currentHp || 0) <= 0) {
      setTeamLeader(aliveMon.instanceId);
      currentBattler = aliveMon;
    }

    playGrassRustleSound();
    setIsSearchingGrass(true);
    setActiveTileIndex(tileIndex);

    setTimeout(() => {
      setIsSearchingGrass(false);
      setActiveTileIndex(null);

      // Roll: 70% Wild Pokémon, 20% Item Drop, 10% Wind
      const roll = Math.random();

      if (roll < 0.7) {
        const wild = rollWildEncounter(selectedBiome.id);
        setActiveEncounter(wild);
        setPlayerMoves(getPokemonMoves(currentBattler));
        setBattleState("MENU");
        setBattleDialogue(`Wild ${capitalize(wild.name)} appeared!`);
        setBattleHistory([`Wild ${capitalize(wild.name)} (Lv. ${wild.level}) emerged from the brush!`]);

        if (wild.isShiny) {
          pushLog("A rare and glittering SHINY Pokémon appeared!");
        }

        playPokemonCry(wild.id);
        setEncounterCount((c) => c + 1);
      } else if (roll < 0.9) {
        const loot = rollLootDrop(selectedBiome.id);
        addLoot(loot.itemKey, loot.count);
        setLootNotice({
          itemKey: loot.itemKey,
          name: loot.name,
          count: loot.count,
        });
        setTimeout(() => setLootNotice(null), 4500);
      } else {
        setLootNotice({
          empty: true,
          message: "The wind rustled through the tall grass... Nothing stirred.",
        });
        setTimeout(() => setLootNotice(null), 3000);
      }
    }, 450);
  }

  // Handle Dismiss Battle / Continue
  function handleDismissBattle() {
    setActiveEncounter(null);
    setBattleState("MENU");
    setPlayerAnim("");
    setWildAnim("");
    setThrowingBallKey(null);
    setWobbleState(0);
    setExpResult(null);
    setWildDamagePopup(null);
    setPlayerDamagePopup(null);
    setSlashVfxOnWild(false);
    setSlashVfxOnPlayer(false);
  }

  // Combat Turn Execution Engine
  function handleExecuteMove(move) {
    if (!activeEncounter || battleState === "ANIMATING" || !leaderPokemon) return;
    if (move.currentPp <= 0) {
      setBattleDialogue(`No PP left for ${move.name.toUpperCase()}!`);
      return;
    }

    // Deduct 1 PP
    setPlayerMoves((prev) =>
      prev.map((m) => (m.id === move.id ? { ...m, currentPp: Math.max(0, m.currentPp - 1) } : m))
    );

    setBattleState("ANIMATING");

    const playerSpeed = leaderPokemon.speed || 45;
    const wildSpeed = activeEncounter.speed || 35;
    const playerFirst = playerSpeed >= wildSpeed;

    if (playerFirst) {
      // Player attacks first -> Wild attacks second (if alive)
      executePlayerAttack(move, () => {
        executeWildAttack(() => {
          setTurnNumber((t) => t + 1);
          setBattleDialogue(`What will ${leaderPokemon.nickname.toUpperCase()} do?`);
          setBattleState("MENU");
        });
      });
    } else {
      // Wild attacks first -> Player attacks second (if alive)
      executeWildAttack(() => {
        executePlayerAttack(move, () => {
          setTurnNumber((t) => t + 1);
          setBattleDialogue(`What will ${leaderPokemon.nickname.toUpperCase()} do?`);
          setBattleState("MENU");
        });
      });
    }
  }

  // 1. Player Attack Phase
  function executePlayerAttack(move, onComplete) {
    if (!leaderPokemon || !activeEncounter) return;

    setBattleDialogue(`${leaderPokemon.nickname.toUpperCase()} used ${move.name.toUpperCase()}!`);
    pushLog(`${leaderPokemon.nickname} used ${move.name}!`);

    setPlayerAnim(cameraMode === "isometric" ? "anim-player-lunge-isometric" : "anim-player-lunge");
    setElementalVfx({ target: "wild", type: move.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setPlayerAnim("");

      // Calculate Damage
      const isCrit = Math.random() < 0.08;
      const typeMult = getTypeDamageMultiplier(move.type, activeEncounter.types);
      const weatherMult = getWeatherDamageMultiplier(move.type, currentWeather?.pokemonWeather);
      const baseAtk = leaderPokemon.attack || 40;
      const wildDef = activeEncounter.defense || 35;

      const baseDmg =
        Math.floor(
          (((2 * leaderPokemon.level) / 5 + 2) * move.power * (baseAtk / wildDef)) / 50
        ) + 2;
      const variance = 0.85 + Math.random() * 0.3;
      const finalDmg = Math.max(
        1,
        Math.floor(baseDmg * (isCrit ? 1.5 : 1.0) * typeMult * weatherMult * variance)
      );

      // Trigger Visual Hit FX on Wild
      setSlashVfxOnWild(true);
      setWildAnim("anim-wild-hit");
      setScreenShake(true);

      if (isCrit) {
        playCriticalHitSound();
      } else if (typeMult > 1) {
        playSuperEffectiveSound();
      } else if (typeMult < 1 && typeMult > 0) {
        playNotVeryEffectiveSound();
      } else {
        playHitSound();
      }

      setWildDamagePopup({ damage: finalDmg, isCrit, isSuper: typeMult > 1 });

      const nextWildHp = Math.max(0, activeEncounter.currentHp - finalDmg);
      setActiveEncounter((prev) => ({ ...prev, currentHp: nextWildHp }));

      setTimeout(() => {
        setSlashVfxOnWild(false);
        setElementalVfx(null);
        setWildAnim("");
        setScreenShake(false);
        setWildDamagePopup(null);

        // Update dialogue with outcome
        if (typeMult > 1) {
          setBattleDialogue("It's super effective!");
          pushLog("It was super effective!");
        } else if (typeMult < 1 && typeMult > 0) {
          setBattleDialogue("It's not very effective...");
          pushLog("It was not very effective.");
        } else if (isCrit) {
          setBattleDialogue("A critical hit!");
          pushLog("A critical hit!");
        } else {
          setBattleDialogue(`Wild ${capitalize(activeEncounter.name)} took ${finalDmg} damage!`);
        }

        setTimeout(() => {
          if (nextWildHp <= 0) {
            // Wild Pokémon Faints!
            setWildAnim("anim-faint-slide");
            playFaintSound();
            playPokemonCry(activeEncounter.id);
            setBattleDialogue(`Wild ${capitalize(activeEncounter.name)} fainted!`);
            pushLog(`Wild ${capitalize(activeEncounter.name)} fainted!`);

            // Award EXP & Money
            const expReward = activeEncounter.expReward || 45;
            const moneyReward = activeEncounter.moneyReward || 120;
            const res = gainExpToLeader(expReward);
            addMoney(moneyReward);

            setExpResult({
              expGained: expReward,
              moneyGained: moneyReward,
              levelUpInfo: res?.didLevelUp ? res : null,
            });

            setTimeout(() => {
              setBattleState("VICTORY");
            }, 850);
          } else {
            if (onComplete) onComplete();
          }
        }, 650);
      }, 450);
    }, 350);
  }

  // 2. Wild Counter-Attack Phase
  function executeWildAttack(onComplete) {
    if (!activeEncounter || !leaderPokemon) return;

    const wildMove = pickWildMove(activeEncounter);
    setBattleDialogue(`Wild ${capitalize(activeEncounter.name)} used ${wildMove.name.toUpperCase()}!`);
    pushLog(`Wild ${capitalize(activeEncounter.name)} used ${wildMove.name}!`);

    setWildAnim(cameraMode === "isometric" ? "anim-wild-lunge-isometric" : "anim-wild-lunge");
    setElementalVfx({ target: "player", type: wildMove.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setWildAnim("");

      // Enemy Damage Calculation against Player
      const isCrit = Math.random() < 0.06;
      const typeMult = getTypeDamageMultiplier(wildMove.type, leaderPokemon.types);
      const weatherMult = getWeatherDamageMultiplier(wildMove.type, currentWeather?.pokemonWeather);
      const enemyAtk = activeEncounter.attack || 35;
      const playerDef = leaderPokemon.defense || 40;

      const baseDmg =
        Math.floor(
          (((2 * activeEncounter.level) / 5 + 2) * wildMove.power * (enemyAtk / playerDef)) / 50
        ) + 2;
      const variance = 0.85 + Math.random() * 0.3;
      const finalDmg = Math.max(
        2,
        Math.floor(baseDmg * (isCrit ? 1.5 : 1.0) * typeMult * weatherMult * variance)
      );

      // Trigger Visual Hit FX on Player
      setSlashVfxOnPlayer(true);
      setPlayerAnim("anim-player-hit");
      setScreenShake(true);

      if (isCrit) {
        playCriticalHitSound();
      } else {
        playHitSound();
      }

      setPlayerDamagePopup({ damage: finalDmg, isCrit });

      const newPlayerHp = Math.max(0, (leaderPokemon.currentHp || 0) - finalDmg);
      updatePokemonHp(leaderPokemon.instanceId, newPlayerHp);

      setTimeout(() => {
        setSlashVfxOnPlayer(false);
        setElementalVfx(null);
        setPlayerAnim("");
        setScreenShake(false);
        setPlayerDamagePopup(null);

        setBattleDialogue(`${leaderPokemon.nickname.toUpperCase()} took ${finalDmg} damage!`);
        pushLog(`${leaderPokemon.nickname} took ${finalDmg} damage!`);

        setTimeout(() => {
          if (newPlayerHp <= 0) {
            // Player Leader Faints!
            setPlayerAnim("anim-faint-slide");
            playFaintSound();
            playPokemonCry(leaderPokemon.id);
            setBattleDialogue(`${leaderPokemon.nickname.toUpperCase()} fainted!`);
            pushLog(`${leaderPokemon.nickname} fainted!`);

            // Check if another party member is still alive
            const hasAliveTeammate = team.some(
              (p) => p.instanceId !== leaderPokemon.instanceId && (p.currentHp || 0) > 0
            );

            setTimeout(() => {
              if (hasAliveTeammate) {
                setBattleDialogue(`${leaderPokemon.nickname.toUpperCase()} fainted! Choose your next Pokémon!`);
                setBattleState("PARTY");
              } else {
                setBattleDialogue("All your Pokémon have fainted!");
                setBattleState("DEFEATED");
              }
            }, 850);
          } else {
            if (onComplete) onComplete();
          }
        }, 650);
      }, 450);
    }, 350);
  }

  // 3. Catch Action (Throw Poké Ball)
  function handleThrowBall(ballKey) {
    if (!activeEncounter || battleState === "ANIMATING") return;

    const ballCount = getItemCount(ballKey);
    if (ballCount <= 0) return;

    setThrowingBallKey(ballKey);
    setBattleState("ANIMATING");
    setWobbleState(0);

    playBallThrowSound();
    setBattleDialogue(`Threw a ${ballKey.replace("-", " ").toUpperCase()}!`);
    pushLog(`Threw a ${ballKey.replace("-", " ").toUpperCase()}!`);

    const catchResult = catchWildPokemon(activeEncounter, ballKey);

    setTimeout(() => {
      // Shake 1
      setWobbleState(1);
      playBallWobbleSound();

      setTimeout(() => {
        if (!catchResult.success && catchResult.shakes === 0) {
          // Break out immediately
          setThrowingBallKey(null);
          setWobbleState(0);
          setBattleDialogue(catchResult.message);
          pushLog(catchResult.message);

          // Wild counter-attacks after break out!
          setTimeout(() => {
            executeWildAttack(() => {
              setBattleDialogue(`What will ${leaderPokemon.nickname.toUpperCase()} do?`);
              setBattleState("MENU");
            });
          }, 800);
          return;
        }

        // Shake 2
        setWobbleState(2);
        playBallWobbleSound();

        setTimeout(() => {
          if (!catchResult.success && catchResult.shakes === 1) {
            setThrowingBallKey(null);
            setWobbleState(0);
            setBattleDialogue(catchResult.message);
            pushLog(catchResult.message);

            setTimeout(() => {
              executeWildAttack(() => {
                setBattleDialogue(`What will ${leaderPokemon.nickname.toUpperCase()} do?`);
                setBattleState("MENU");
              });
            }, 800);
            return;
          }

          // Shake 3
          setWobbleState(3);
          playBallWobbleSound();

          setTimeout(() => {
            if (catchResult.success) {
              // CAUGHT!
              setBattleState("CAUGHT");
              setWobbleState(3);
              setBattleDialogue(catchResult.message);
              pushLog(catchResult.message);
            } else {
              setThrowingBallKey(null);
              setWobbleState(0);
              setBattleDialogue(catchResult.message);
              pushLog(catchResult.message);

              setTimeout(() => {
                executeWildAttack(() => {
                  setBattleDialogue(`What will ${leaderPokemon.nickname.toUpperCase()} do?`);
                  setBattleState("MENU");
                });
              }, 800);
            }
          }, 600);
        }, 600);
      }, 600);
    }, 700);
  }

  // 4. Use Healing Item on Active Leader Mid-Battle
  function handleUseItem(itemKey) {
    if (!activeEncounter || battleState === "ANIMATING" || !leaderPokemon) return;

    const res = applyItemToPokemon(itemKey, leaderPokemon.instanceId);
    if (!res.success) {
      setBattleDialogue(res.message);
      return;
    }

    playItemUseSound();
    setBattleDialogue(res.message);
    pushLog(res.message);

    // Using an item consumes the turn; wild Pokémon counter-attacks
    setBattleState("ANIMATING");
    setTimeout(() => {
      executeWildAttack(() => {
        setBattleDialogue(`What will ${leaderPokemon.nickname.toUpperCase()} do?`);
        setBattleState("MENU");
      });
    }, 750);
  }

  // 5. Mid-Battle Switch Pokémon Partner
  function handleSwitchPokemon(targetPokemon) {
    if (!activeEncounter || battleState === "ANIMATING") return;
    if (targetPokemon.instanceId === leaderPokemon?.instanceId) {
      setBattleDialogue(`${targetPokemon.nickname} is already in battle!`);
      return;
    }
    if ((targetPokemon.currentHp || 0) <= 0) {
      setBattleDialogue(`${targetPokemon.nickname} has no will to fight (Fainted)!`);
      return;
    }

    const previousWasFainted = (leaderPokemon?.currentHp || 0) <= 0;

    setTeamLeader(targetPokemon.instanceId);
    setPlayerMoves(getPokemonMoves(targetPokemon));
    playPokemonCry(targetPokemon.id);

    setBattleDialogue(
      previousWasFainted
        ? `Go, ${targetPokemon.nickname}!`
        : `Come back, ${leaderPokemon?.nickname}! Go, ${targetPokemon.nickname}!`
    );
    pushLog(`Switched out to ${targetPokemon.nickname}!`);

    if (previousWasFainted) {
      // Clean switch after faint: player can immediately select their action
      setBattleState("MENU");
      setBattleDialogue(`What will ${targetPokemon.nickname.toUpperCase()} do?`);
    } else {
      // Wild Pokémon takes opportunity turn upon mid-battle tactical switch
      setBattleState("ANIMATING");
      setTimeout(() => {
        executeWildAttack(() => {
          setBattleDialogue(`What will ${targetPokemon.nickname.toUpperCase()} do?`);
          setBattleState("MENU");
        });
      }, 850);
    }
  }

  // 6. Run Away Action
  function handleRunAway() {
    if (!activeEncounter || battleState === "ANIMATING") return;

    const playerSpeed = leaderPokemon?.speed || 40;
    const wildSpeed = activeEncounter.speed || 35;

    // Guaranteed escape if faster, or 70% chance
    if (checkEscapeSuccess(playerSpeed, wildSpeed)) {
      playRunSound();
      setBattleDialogue("Got away safely!");
      pushLog("Got away safely!");
      setBattleState("ANIMATING");
      setTimeout(() => {
        handleDismissBattle();
      }, 750);
    } else {
      setBattleDialogue("Can't escape!");
      pushLog("Can't escape!");
      setBattleState("ANIMATING");
      setTimeout(() => {
        executeWildAttack(() => {
          setBattleDialogue(`What will ${leaderPokemon?.nickname.toUpperCase()} do?`);
          setBattleState("MENU");
        });
      }, 750);
    }
  }

  // Available items in inventory
  const availableBalls = BALL_KEYS.map((k) => ({
    key: k,
    count: getItemCount(k),
  })).filter((b) => b.count > 0);

  const availableMedicine = MEDICINE_KEYS.map((k) => ({
    key: k,
    count: getItemCount(k),
  })).filter((m) => m.count > 0);

  // Health percentages & colors
  const wildHp = activeEncounter?.currentHp ?? 100;
  const wildMaxHp = activeEncounter?.maxHp ?? 100;
  const wildHpPercent = Math.max(0, Math.min(100, Math.round((wildHp / wildMaxHp) * 100)));
  const wildHpColor = wildHpPercent > 50 ? "#22c55e" : wildHpPercent > 20 ? "#eab308" : "#ef4444";

  const playerHp = leaderPokemon?.currentHp ?? 100;
  const playerMaxHp = leaderPokemon?.maxHp ?? 100;
  const playerHpPercent = Math.max(0, Math.min(100, Math.round((playerHp / playerMaxHp) * 100)));
  const playerHpColor = playerHpPercent > 50 ? "#22c55e" : playerHpPercent > 20 ? "#eab308" : "#ef4444";

  const wildTheme = getTypeColor(activeEncounter?.types?.[0]);

  return (
    <div className="wilderness-container">
      {/* Page Header */}
      <div className="wilderness-header-card">
        <div className="wilderness-header-left">
          <div className="wilderness-badge-pill">
            <IconTrees size={16} /> Wilderness Expedition
          </div>
          <div className="wilderness-header-text">
            <h2>Wilderness Expedition</h2>
            <p>Explore biomes, encounter wild Pokémon face-to-face, grind EXP, and catch companions with Poké Balls!</p>
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

      {/* Live Real-World Weather Banner */}
      {!activeEncounter && (
        <WeatherWidget
          onWeatherChange={setCurrentWeather}
          className="wilderness-weather-bar"
        />
      )}

      {/* Exploration Meadow (Tall Grass Field) */}
      {!activeEncounter && (
        <div
          className="meadow-zone-card"
          style={{
            "--biome-gradient": selectedBiome.bgGradient,
            "--biome-color": selectedBiome.color,
          }}
        >
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

      {/* ======================================================== */}
      {/* FACE-TO-FACE POV RPG TURN-BASED BATTLE ARENA MODAL      */}
      {/* ======================================================== */}
      {activeEncounter && (
        <div className="rpg-battle-modal-backdrop">
          <div
            className={`rpg-battle-arena-window ${screenShake ? "camera-screen-shake" : ""}`}
            style={{
              "--wild-primary": wildTheme.primary,
              "--wild-bg": wildTheme.bg,
              "--biome-color": selectedBiome.color,
            }}
          >
            {/* ======================================================== */}
            {/* MODERN 2.5D ARENA TOP HUD (MATCHING REFERENCE SCREENSHOT) */}
            {/* ======================================================== */}
            <div className="modern-arena-top-bar">
              {/* Left Group: Controls & Player HUD */}
              <div className="modern-top-left-cluster">
                {/* Quick Action Circle Controls */}
                <div className="modern-quick-controls">
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal((prev) => !prev)}
                    className="btn-modern-circle-ctrl"
                    title="Battle Log & Settings"
                  >
                    <IconGear size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBattleSpeed((s) => (s === 1 ? 2 : 1))}
                    className={`btn-modern-circle-ctrl ${battleSpeed === 2 ? "ctrl-active" : ""}`}
                    title="Toggle Battle Speed (1x / 2x Turbo)"
                  >
                    {battleSpeed === 2 ? "2x" : "1x"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCameraMode((m) => (m === "isometric" ? "classic" : "isometric"))
                    }
                    className={`btn-modern-circle-ctrl ${
                      cameraMode === "isometric" ? "ctrl-active" : ""
                    }`}
                    title="Toggle Camera Angle (2.5D Arena / Classic POV)"
                  >
                    <IconCamera size={16} />
                  </button>
                </div>

                {/* Player Status Card */}
                {leaderPokemon && (
                  <div className="modern-status-card player-status-card">
                    <div className="modern-status-header">
                      <span className="modern-status-name">
                        {leaderPokemon.nickname || leaderPokemon.name}
                      </span>
                      <span className="modern-status-lvl">lv. {leaderPokemon.level}</span>
                      <span
                        className="modern-type-pill"
                        style={{
                          backgroundColor:
                            getTypeColor(leaderPokemon.types?.[0] || "normal").primary,
                        }}
                      >
                        {leaderPokemon.types?.[0] || "Normal"}
                      </span>
                    </div>

                    {/* Slanted Neon Parallelogram HP Bar */}
                    <div className="modern-slanted-hp-container">
                      <div className="modern-slanted-hp-track">
                        <div
                          className="modern-slanted-hp-fill"
                          style={{
                            width: `${playerHpPercent}%`,
                            boxShadow: `0 0 10px ${playerHpColor}88`,
                            background:
                              playerHpPercent > 50
                                ? "linear-gradient(90deg, #06b6d4 0%, #10b981 100%)"
                                : playerHpPercent > 20
                                ? "linear-gradient(90deg, #f59e0b 0%, #eab308 100%)"
                                : "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                          }}
                        ></div>
                      </div>
                      <span className="modern-slanted-hp-text">
                        {leaderPokemon.currentHp} / {leaderPokemon.maxHp}
                      </span>
                    </div>

                    <div className="modern-status-footer">
                      <span className="modern-ability-badge">
                        {leaderPokemon.ability?.name
                          ? capitalize(leaderPokemon.ability.name)
                          : leaderPokemon.types?.[0]?.toLowerCase() === "fire"
                          ? "Blaze"
                          : leaderPokemon.types?.[0]?.toLowerCase() === "water"
                          ? "Torrent"
                          : leaderPokemon.types?.[0]?.toLowerCase() === "grass"
                          ? "Overgrow"
                          : "Inner Focus"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Center Turn Counter Badge */}
              <div className="modern-turn-badge" title={`Battle Turn ${turnNumber}`}>
                <span className="turn-badge-label">TURN</span>
                <span className="turn-badge-number">{turnNumber}</span>
              </div>

              {/* Right Group: Opponent HUD & Vertical Action Dock */}
              <div className="modern-top-right-cluster">
                {/* Opponent Status Card */}
                <div className="modern-status-card opponent-status-card">
                  <div className="modern-status-header">
                    <span
                      className="modern-type-pill"
                      style={{
                        backgroundColor:
                          getTypeColor(activeEncounter.types?.[0] || "normal").primary,
                      }}
                    >
                      {activeEncounter.types?.[0] || "Normal"}
                    </span>
                    <span className="modern-status-name">
                      {capitalize(activeEncounter.name)}
                    </span>
                    <span className="modern-status-lvl">lv. {activeEncounter.level}</span>
                    {activeEncounter.isShiny && (
                      <span className="hud-shiny-star" title="Shiny!">
                        <IconSparkles size={13} />
                      </span>
                    )}
                  </div>

                  {/* Slanted Neon Parallelogram HP Bar */}
                  <div className="modern-slanted-hp-container">
                    <div className="modern-slanted-hp-track">
                      <div
                        className="modern-slanted-hp-fill"
                        style={{
                          width: `${wildHpPercent}%`,
                          boxShadow: `0 0 10px ${wildHpColor}88`,
                          background:
                            wildHpPercent > 50
                              ? "linear-gradient(90deg, #06b6d4 0%, #10b981 100%)"
                              : wildHpPercent > 20
                              ? "linear-gradient(90deg, #f59e0b 0%, #eab308 100%)"
                              : "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                        }}
                      ></div>
                    </div>
                    <span className="modern-slanted-hp-text">
                      {activeEncounter.currentHp} / {activeEncounter.maxHp}
                    </span>
                  </div>

                  <div className="modern-status-footer">
                    <span className="modern-ability-badge">???</span>
                  </div>
                </div>

                {/* Vertical Action Dock */}
                <div className="modern-vertical-action-dock">
                  <button
                    type="button"
                    onClick={() =>
                      setBattleState((s) => (s === "PARTY" ? "MENU" : "PARTY"))
                    }
                    className="btn-dock-action"
                    title="Switch Pokémon / Party Reserves"
                  >
                    <IconParty size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBattleState((s) => (s === "BAG" ? "MENU" : "BAG"))}
                    className="btn-dock-action"
                    title="Bag & Items"
                  >
                    <IconBackpack size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRunAway}
                    className="btn-dock-action"
                    title="Flee safely"
                  >
                    <IconArrowLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal((prev) => !prev)}
                    className="btn-dock-action"
                    title="Battle Log"
                  >
                    <IconBook size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 2.5D ISOMETRIC ARENA STAGE (FACE-TO-FACE MATCHING REF)   */}
            {/* ======================================================== */}
            <BattleEnvironment biomeId={selectedBiome.id} cameraMode={cameraMode}>
              {/* Distance: Opponent Platform (Upper-Right Midground) */}
              <div className="rpg-opponent-area">
                <BattlePedestal
                  biomeId={selectedBiome.id}
                  isPlayer={false}
                  cameraMode={cameraMode}
                >
                  {/* Impact Slash VFX on Wild */}
                  {slashVfxOnWild && <div className="vfx-energy-slash"></div>}

                  {/* Elemental Move Particle VFX */}
                  {elementalVfx?.target === "wild" && (
                    <ElementalVfxOverlay type={elementalVfx.type} />
                  )}

                  {/* Floating Damage Popup on Wild */}
                  {wildDamagePopup && (
                    <div
                      className={`floating-damage-number ${
                        wildDamagePopup.isCrit ? "crit-damage" : ""
                      } ${wildDamagePopup.isSuper ? "super-damage" : ""}`}
                    >
                      {wildDamagePopup.isCrit && <span className="crit-label">CRITICAL! </span>}
                      {wildDamagePopup.isSuper && (
                        <span className="super-label">SUPER EFFECTIVE! </span>
                      )}
                      -{wildDamagePopup.damage} HP
                    </div>
                  )}

                  {/* Thrown Poké Ball Overlay */}
                  {throwingBallKey && (
                    <div className={`rpg-pokeball-wobble wobble-${wobbleState}`}>
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${throwingBallKey}.png`}
                        alt="Poké Ball"
                        className="thrown-ball-img"
                      />
                    </div>
                  )}

                  {/* Caught Stamp */}
                  {battleState === "CAUGHT" && (
                    <div className="rpg-caught-stamp">
                      <IconCheck size={28} />
                      <span>CAUGHT!</span>
                    </div>
                  )}

                  {/* Wild Pokémon Animated Sprite */}
                  <img
                    src={
                      activeEncounter.isShiny
                        ? getAnimatedShinySpriteUrl(activeEncounter.id)
                        : getAnimatedSpriteUrl(activeEncounter.id)
                    }
                    alt={activeEncounter.name}
                    className={`wild-battler-isometric-sprite ${wildAnim} ${
                      throwingBallKey ? "sprite-shrunk-in-ball" : ""
                    }`}
                    onError={(e) => {
                      e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${activeEncounter.id}.png`;
                    }}
                  />
                </BattlePedestal>
              </div>

              {/* Foreground: Player Leader Platform (Lower-Left 3D Arena Mount) */}
              {leaderPokemon && (
                <div className="rpg-player-area">
                  <BattlePedestal
                    biomeId={selectedBiome.id}
                    isPlayer={true}
                    cameraMode={cameraMode}
                  >
                    {/* Impact Slash VFX on Player */}
                    {slashVfxOnPlayer && <div className="vfx-energy-slash"></div>}

                    {/* Elemental Move Particle VFX */}
                    {elementalVfx?.target === "player" && (
                      <ElementalVfxOverlay type={elementalVfx.type} />
                    )}

                    {/* Floating Damage Popup on Player */}
                    {playerDamagePopup && (
                      <div
                        className={`floating-damage-number player-damage-tag ${
                          playerDamagePopup.isCrit ? "crit-damage" : ""
                        }`}
                      >
                        {playerDamagePopup.isCrit && <span className="crit-label">CRITICAL! </span>}
                        -{playerDamagePopup.damage} HP
                      </div>
                    )}

                    {/* Player Battler Sprite */}
                    {cameraMode === "isometric" ? (
                      <img
                        src={
                          leaderPokemon.isShiny
                            ? getAnimatedShinySpriteUrl(leaderPokemon.id)
                            : getAnimatedSpriteUrl(leaderPokemon.id)
                        }
                        alt={leaderPokemon.name}
                        className={`player-battler-isometric-sprite ${playerAnim}`}
                        onError={(e) => {
                          e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${leaderPokemon.id}.png`;
                        }}
                      />
                    ) : (
                      <img
                        src={
                          leaderPokemon.isShiny
                            ? getAnimatedBackShinySpriteUrl(leaderPokemon.id)
                            : getAnimatedBackSpriteUrl(leaderPokemon.id)
                        }
                        alt={leaderPokemon.name}
                        className={`player-battler-back-sprite ${playerAnim}`}
                        onError={(e) => {
                          e.target.src = getBackSpriteUrl(leaderPokemon.id);
                        }}
                      />
                    )}
                  </BattlePedestal>
                </div>
              )}
            </BattleEnvironment>

            {/* Floating Action Dialogue Banner */}
            {battleDialogue && (
              <div className="modern-battle-announcement">
                <span className="dialogue-arrow">▶</span> {battleDialogue}
              </div>
            )}

            {/* ======================================================== */}
            {/* MODERN BOTTOM COMMAND DECK & MOVE CAPSULE PILLS          */}
            {/* ======================================================== */}
            <div className="modern-bottom-deck">
              <div className="modern-moves-strip">
                {playerMoves.map((m) => {
                  const moveTheme = getTypeColor(m.type);
                  const isOutOfPp = m.currentPp <= 0;
                  const typeMult = getTypeDamageMultiplier(m.type, activeEncounter.types);
                  const isSuperEffective = typeMult > 1;

                  const categoryLabel =
                    m.category === "special" ? "SP" : m.category === "status" ? "STAT" : "PHY";
                  const categoryClass =
                    m.category === "special"
                      ? "category-special"
                      : m.category === "status"
                      ? "category-status"
                      : "category-physical";

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleExecuteMove(m)}
                      disabled={isOutOfPp || battleState === "ANIMATING"}
                      className={`modern-move-pill ${
                        isSuperEffective ? "move-advantage-super" : ""
                      }`}
                      title={`${m.name} (${m.type}) - PWR: ${m.power || "-"}, ACC: ${
                        m.accuracy || "-"
                      }%`}
                    >
                      <span className={`move-category-badge ${categoryClass}`}>
                        {categoryLabel}
                      </span>
                      <span className="modern-move-title">{m.name}</span>
                      <span
                        className="modern-move-type"
                        style={{ backgroundColor: moveTheme.primary }}
                      >
                        {m.type}
                      </span>
                      <span className="modern-move-pp">
                        PP {m.currentPp}/{m.maxPp}
                      </span>
                      {isSuperEffective && (
                        <span
                          className="super-advantage-arrow"
                          title="Super Effective against target!"
                        >
                          ⬆
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Big Circular Monster / Actions Button */}
              <button
                type="button"
                onClick={() =>
                  setBattleState((s) => (s === "PARTY" ? "MENU" : "PARTY"))
                }
                className="btn-monster-action"
                title="View Team Party & Reserves"
              >
                <IconParty size={20} />
                <span>Monster</span>
              </button>
            </div>


              {/* 3. In-Battle Bag Drawer (Balls & Medicine) */}
              {battleState === "BAG" && (
                <div className="rpg-bag-drawer">
                  <div className="bag-tabs-header">
                    <button
                      type="button"
                      onClick={() => setBagTab("balls")}
                      className={`bag-tab-btn ${bagTab === "balls" ? "active" : ""}`}
                    >
                      <IconPokeball size={16} /> Poké Balls
                    </button>
                    <button
                      type="button"
                      onClick={() => setBagTab("medicine")}
                      className={`bag-tab-btn ${bagTab === "medicine" ? "active" : ""}`}
                    >
                      <IconHeart size={16} /> Medicine & Berries
                    </button>
                    <button
                      type="button"
                      onClick={() => setBattleState("MENU")}
                      className="btn-close-subdrawer"
                    >
                      <IconX size={16} />
                    </button>
                  </div>

                  {bagTab === "balls" && (
                    <div className="bag-items-grid">
                      {availableBalls.length === 0 ? (
                        <div className="empty-pocket-msg">No Poké Balls in Bag!</div>
                      ) : (
                        availableBalls.map((b) => (
                          <button
                            key={b.key}
                            type="button"
                            onClick={() => handleThrowBall(b.key)}
                            className="bag-item-card"
                          >
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${b.key}.png`}
                              alt={b.key}
                              className="item-sprite-sm"
                            />
                            <span className="item-label">{b.key.replace("-", " ").toUpperCase()}</span>
                            <span className="item-qty">x{b.count}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {bagTab === "medicine" && (
                    <div className="bag-items-grid">
                      {availableMedicine.length === 0 ? (
                        <div className="empty-pocket-msg">No Medicine or Berries in Bag!</div>
                      ) : (
                        availableMedicine.map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => handleUseItem(m.key)}
                            className="bag-item-card"
                          >
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${m.key}.png`}
                              alt={m.key}
                              className="item-sprite-sm"
                            />
                            <span className="item-label">{m.key.replace("-", " ").toUpperCase()}</span>
                            <span className="item-qty">x{m.count}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 4. In-Battle Pokémon Switcher Modal */}
              {battleState === "PARTY" && (
                <div className="rpg-party-drawer">
                  <div className="party-drawer-header">
                    <span>
                      {(leaderPokemon?.currentHp || 0) <= 0
                        ? "Your Pokémon fainted! Select a teammate:"
                        : "Select Pokémon Partner to Switch:"}
                    </span>
                    {(!leaderPokemon || (leaderPokemon.currentHp || 0) > 0) && (
                      <button
                        type="button"
                        onClick={() => setBattleState("MENU")}
                        className="btn-close-subdrawer"
                      >
                        <IconX size={16} />
                      </button>
                    )}
                  </div>
                  <div className="party-members-grid">
                    {team.map((pokemon, idx) => {
                      const isCurrent = idx === 0;
                      const isFainted = (pokemon.currentHp || 0) <= 0;
                      return (
                        <button
                          key={pokemon.instanceId}
                          type="button"
                          disabled={isCurrent || isFainted}
                          onClick={() => handleSwitchPokemon(pokemon)}
                          className={`party-switch-card ${isCurrent ? "current-leader" : ""} ${
                            isFainted ? "fainted-pokemon" : ""
                          }`}
                        >
                          <img
                            src={pokemon.sprites?.static}
                            alt={pokemon.name}
                            className="party-switch-sprite"
                          />
                          <div className="party-switch-info">
                            <span className="switch-name">{pokemon.nickname}</span>
                            <span className="switch-level">Lv.{pokemon.level}</span>
                            <span className="switch-hp">
                              HP: {pokemon.currentHp}/{pokemon.maxHp}
                            </span>
                          </div>
                          {isCurrent && <span className="current-tag">ACTIVE</span>}
                          {isFainted && <span className="faint-tag">FAINTED</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Victory Screen */}
              {battleState === "VICTORY" && expResult && (
                <div className="rpg-result-card result-victory">
                  <h3>Victory! Wild Pokémon Defeated</h3>
                  <div className="rewards-summary">
                    <span className="reward-pill">+<strong>{expResult.expGained}</strong> EXP</span>
                    <span className="reward-pill">+₽<strong>{expResult.moneyGained}</strong></span>
                  </div>
                  {expResult.levelUpInfo && (
                    <div className="level-up-fanfare">
                      <IconSparkles size={16} />
                      <span>
                        {expResult.levelUpInfo.pokemonName} grew to Level {expResult.levelUpInfo.newLevel}! Max HP is now {expResult.levelUpInfo.newHp}!
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleDismissBattle}
                    className="btn-rpg-finish"
                  >
                    Continue Journey
                  </button>
                </div>
              )}

              {/* 6. Caught Screen */}
              {battleState === "CAUGHT" && (
                <div className="rpg-result-card result-caught">
                  <h3>Gotcha! {capitalize(activeEncounter.name)} was caught!</h3>
                  <p>Safely added to your collection! Check your Team / PC Storage Box.</p>
                  <button
                    type="button"
                    onClick={handleDismissBattle}
                    className="btn-rpg-finish"
                  >
                    Continue Journey
                  </button>
                </div>
              )}

              {/* 7. Defeated Screen */}
              {battleState === "DEFEATED" && (
                <div className="rpg-result-card result-defeated">
                  <h3>{leaderPokemon?.nickname} has fainted!</h3>
                  <p>Your active Pokémon ran out of HP! What will you do?</p>
                  <div className="defeated-actions">
                    {team.some((p) => (p.currentHp || 0) > 0) && (
                      <button
                        type="button"
                        onClick={() => setBattleState("PARTY")}
                        className="btn-rpg-finish"
                      >
                        Switch Partner
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDismissBattle}
                      className="btn-rpg-retreat"
                    >
                      Retreat to Pokémon Center
                    </button>
                  </div>
                </div>
              )}

            {/* Optional Collapsible Battle History Modal */}
            {showHistoryModal && (
              <div className="rpg-history-modal-overlay">
                <div className="rpg-history-card">
                  <div className="history-header">
                    <h4>Battle Log History</h4>
                    <button
                      type="button"
                      onClick={() => setShowHistoryModal(false)}
                      className="history-close-btn"
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                  <div className="history-entries-list">
                    {battleHistory.map((entry, index) => (
                      <div key={index} className="history-row">
                        &rsaquo; {entry}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WildernessPage;
