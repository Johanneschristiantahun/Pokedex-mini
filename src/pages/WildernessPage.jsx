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
import TypeBadge from "../components/TypeBadge.jsx";

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

export default function WildernessPage() {
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
    healAllPokemon,
  } = useGame();

  const [selectedBiome, setSelectedBiome] = useState(WILDERNESS_BIOMES[0]);
  const [encounterCount, setEncounterCount] = useState(0);
  const [isSearchingGrass, setIsSearchingGrass] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Spontaneous Loot Notification
  const [lootNotice, setLootNotice] = useState(null);

  // Live Real-World Weather State
  const [currentWeather, setCurrentWeather] = useState(null);

  // Active Encounter State
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [battleState, setBattleState] = useState("MENU"); // "MENU" | "MOVES" | "CATCH" | "BAG" | "PARTY" | "ANIMATING" | "VICTORY" | "DEFEATED" | "CAUGHT"
  const [playerMoves, setPlayerMoves] = useState([]);
  const [battleDialogue, setBattleDialogue] = useState("");
  const [turnNumber, setTurnNumber] = useState(1);

  // Catching Ball Animation
  const [throwingBallKey, setThrowingBallKey] = useState(null);
  const [wobbleState, setWobbleState] = useState(0);

  // VFX States
  const [playerAnim, setPlayerAnim] = useState("");
  const [wildAnim, setWildAnim] = useState("");
  const [screenShake, setScreenShake] = useState(false);
  const [slashVfxOnWild, setSlashVfxOnWild] = useState(false);
  const [slashVfxOnPlayer, setSlashVfxOnPlayer] = useState(false);
  const [elementalVfx, setElementalVfx] = useState(null);
  const [wildDamagePopup, setWildDamagePopup] = useState(null);
  const [playerDamagePopup, setPlayerDamagePopup] = useState(null);

  // Result state
  const [expResult, setExpResult] = useState(null);

  const leaderPokemon = team[0] || null;

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Handle Grass Rustle Exploration
  function handleExploreGrass() {
    if (team.length === 0) {
      showToast("You need at least 1 Pokémon in your party before exploring!");
      return;
    }
    let aliveMon = team.find((p) => (p.currentHp || 0) > 0);
    if (!aliveMon) {
      healAllPokemon();
      aliveMon = team[0];
      showToast("Party restored to full health for exploration!");
    }
    if (activeEncounter) return;

    let currentBattler = leaderPokemon;
    if ((leaderPokemon.currentHp || 0) <= 0) {
      setTeamLeader(aliveMon.instanceId);
      currentBattler = aliveMon;
    }

    playGrassRustleSound();
    setIsSearchingGrass(true);

    setTimeout(() => {
      setIsSearchingGrass(false);

      const roll = Math.random();

      if (roll < 0.75) {
        const wild = rollWildEncounter(selectedBiome.id);
        setActiveEncounter(wild);
        setPlayerMoves(getPokemonMoves(currentBattler));
        setBattleState("MENU");
        setTurnNumber(1);
        setBattleDialogue(`Wild ${capitalize(wild.name)} appeared! What will ${currentBattler.nickname || currentBattler.name} do?`);

        playPokemonCry(wild.id);
        setEncounterCount((c) => c + 1);
      } else if (roll < 0.92) {
        const loot = rollLootDrop(selectedBiome.id);
        addLoot(loot.itemKey, loot.count);
        setLootNotice({
          itemKey: loot.itemKey,
          name: loot.name,
          count: loot.count,
        });
        setTimeout(() => setLootNotice(null), 4000);
      } else {
        setLootNotice({
          empty: true,
          message: "A gentle breeze swept through the tall grass. Nothing stirred.",
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
    setElementalVfx(null);
  }

  // Combat Turn Execution Engine
  function handleExecuteMove(move) {
    if (!activeEncounter || battleState === "ANIMATING" || !leaderPokemon) return;
    if (move.currentPp <= 0) {
      setBattleDialogue(`No PP left for ${move.name.toUpperCase()}!`);
      return;
    }

    setPlayerMoves((prev) =>
      prev.map((m) => (m.id === move.id ? { ...m, currentPp: Math.max(0, m.currentPp - 1) } : m))
    );

    setBattleState("ANIMATING");

    const playerSpeed = leaderPokemon.speed || 45;
    const wildSpeed = activeEncounter.speed || 35;
    const playerFirst = playerSpeed >= wildSpeed;

    if (playerFirst) {
      executePlayerAttack(move, () => {
        executeWildAttack(() => {
          setTurnNumber((t) => t + 1);
          setBattleDialogue(`What will ${leaderPokemon.nickname || leaderPokemon.name} do?`);
          setBattleState("MENU");
        });
      });
    } else {
      executeWildAttack(() => {
        executePlayerAttack(move, () => {
          setTurnNumber((t) => t + 1);
          setBattleDialogue(`What will ${leaderPokemon.nickname || leaderPokemon.name} do?`);
          setBattleState("MENU");
        });
      });
    }
  }

  // 1. Player Attack Phase
  function executePlayerAttack(move, onComplete) {
    if (!leaderPokemon || !activeEncounter) return;

    setBattleDialogue(`${leaderPokemon.nickname || leaderPokemon.name} used ${move.name.toUpperCase()}!`);
    setPlayerAnim("anim-player-lunge");
    setElementalVfx({ target: "wild", type: move.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setPlayerAnim("");

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

        if (typeMult > 1) {
          setBattleDialogue("It's super effective!");
        } else if (typeMult < 1 && typeMult > 0) {
          setBattleDialogue("It's not very effective...");
        } else if (isCrit) {
          setBattleDialogue("A critical hit!");
        } else {
          setBattleDialogue(`Wild ${capitalize(activeEncounter.name)} took ${finalDmg} damage.`);
        }

        setTimeout(() => {
          if (nextWildHp <= 0) {
            setWildAnim("anim-faint-slide");
            playFaintSound();
            playPokemonCry(activeEncounter.id);
            setBattleDialogue(`Wild ${capitalize(activeEncounter.name)} fainted!`);

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
    setWildAnim("anim-wild-lunge");
    setElementalVfx({ target: "player", type: wildMove.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setWildAnim("");

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

        setBattleDialogue(`${leaderPokemon.nickname || leaderPokemon.name} took ${finalDmg} damage.`);

        setTimeout(() => {
          if (newPlayerHp <= 0) {
            setPlayerAnim("anim-faint-slide");
            playFaintSound();
            playPokemonCry(leaderPokemon.id);
            setBattleDialogue(`${leaderPokemon.nickname || leaderPokemon.name} fainted!`);

            const hasAliveTeammate = team.some(
              (p) => p.instanceId !== leaderPokemon.instanceId && (p.currentHp || 0) > 0
            );

            setTimeout(() => {
              if (hasAliveTeammate) {
                setBattleDialogue(`${leaderPokemon.nickname || leaderPokemon.name} fainted! Choose your next Pokémon.`);
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
    if (ballCount <= 0) {
      setBattleDialogue(`No ${ballKey.replace("-", " ")} left in your Bag!`);
      return;
    }

    setThrowingBallKey(ballKey);
    setBattleState("ANIMATING");
    setWobbleState(0);

    playBallThrowSound();
    setBattleDialogue(`Threw a ${ballKey.replace("-", " ").toUpperCase()}!`);

    const catchResult = catchWildPokemon(activeEncounter, ballKey);

    setTimeout(() => {
      // Shake 1
      setWobbleState(1);
      playBallWobbleSound();

      setTimeout(() => {
        if (!catchResult.success && catchResult.shakes === 0) {
          setThrowingBallKey(null);
          setWobbleState(0);
          setBattleDialogue(catchResult.message);

          setTimeout(() => {
            executeWildAttack(() => {
              setBattleDialogue(`What will ${leaderPokemon.nickname || leaderPokemon.name} do?`);
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

            setTimeout(() => {
              executeWildAttack(() => {
                setBattleDialogue(`What will ${leaderPokemon.nickname || leaderPokemon.name} do?`);
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
              setBattleState("CAUGHT");
              setWobbleState(3);
              setBattleDialogue(catchResult.message);
            } else {
              setThrowingBallKey(null);
              setWobbleState(0);
              setBattleDialogue(catchResult.message);

              setTimeout(() => {
                executeWildAttack(() => {
                  setBattleDialogue(`What will ${leaderPokemon.nickname || leaderPokemon.name} do?`);
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

    setBattleState("ANIMATING");
    setTimeout(() => {
      executeWildAttack(() => {
        setBattleDialogue(`What will ${leaderPokemon.nickname || leaderPokemon.name} do?`);
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
      setBattleDialogue(`${targetPokemon.nickname} has fainted and cannot fight!`);
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

    if (previousWasFainted) {
      setBattleState("MENU");
      setBattleDialogue(`What will ${targetPokemon.nickname.toUpperCase()} do?`);
    } else {
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

    if (checkEscapeSuccess(playerSpeed, wildSpeed)) {
      playRunSound();
      setBattleDialogue("Got away safely!");
      setBattleState("ANIMATING");
      setTimeout(() => {
        handleDismissBattle();
      }, 750);
    } else {
      setBattleDialogue("Can't escape!");
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

  // Health percentages
  const wildHp = activeEncounter?.currentHp ?? 100;
  const wildMaxHp = activeEncounter?.maxHp ?? 100;
  const wildHpPercent = Math.max(0, Math.min(100, Math.round((wildHp / wildMaxHp) * 100)));

  const playerHp = leaderPokemon?.currentHp ?? 100;
  const playerMaxHp = leaderPokemon?.maxHp ?? 100;
  const playerHpPercent = Math.max(0, Math.min(100, Math.round((playerHp / playerMaxHp) * 100)));

  // Back sprite for player
  const playerBackSprite = leaderPokemon
    ? leaderPokemon.isShiny
      ? getAnimatedBackShinySpriteUrl(leaderPokemon.id) || getBackSpriteUrl(leaderPokemon.id)
      : leaderPokemon.sprites?.backAnimated || getAnimatedBackSpriteUrl(leaderPokemon.id) || getBackSpriteUrl(leaderPokemon.id)
    : "";

  const wildFrontSprite = activeEncounter
    ? activeEncounter.isShiny
      ? getAnimatedShinySpriteUrl(activeEncounter.id)
      : getAnimatedSpriteUrl(activeEncounter.id)
    : "";

  return (
    <div className="wilderness-container">
      {toastMessage && <div className="game-toast-pill">{toastMessage}</div>}

      {/* ======================================================== */}
      {/* 1. LOBBY VIEW (WHEN NOT IN BATTLE)                      */}
      {/* ======================================================== */}
      {!activeEncounter && (
        <>
          <div className="apple-hub-container">
            <div className="apple-hub-header" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 className="apple-hub-title">Wilderness</h1>
                <p className="apple-hub-subtitle">
                  Explore natural habitats across Kanto, encounter wild Pokémon, and collect resources.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '980px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  Party: <span style={{ color: '#0071e3' }}>{team.length} / 6</span>
                </span>
                <span style={{ background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '980px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  PC Storage: <span style={{ color: '#0071e3' }}>{box.length}</span>
                </span>
                <span style={{ background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '980px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  Encounters: <span style={{ color: '#0071e3' }}>{encounterCount}</span>
                </span>
              </div>
            </div>

            {/* Loot / Discovery Notification Banner */}
            {lootNotice && (
              <div style={{ background: lootNotice.empty ? 'rgba(0,0,0,0.03)' : 'rgba(52, 199, 89, 0.1)', border: lootNotice.empty ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(52, 199, 89, 0.3)', padding: '16px 24px', borderRadius: '12px', marginBottom: '32px', color: lootNotice.empty ? 'var(--text-secondary)' : '#248a3d', fontWeight: 500 }}>
                {lootNotice.empty ? (
                  <span>{lootNotice.message}</span>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      Found <strong>{lootNotice.count}x {lootNotice.name}</strong>! Added to Bag.
                    </span>
                    <Link to="/bag" style={{ color: '#248a3d', textDecoration: 'underline', fontWeight: 600 }}>
                      View Bag
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Exploration Regions</h3>
              <div className="apple-grid-3">
                {WILDERNESS_BIOMES.map((biome) => {
                  const isSelected = selectedBiome.id === biome.id;
                  return (
                    <button
                      key={biome.id}
                      type="button"
                      onClick={() => setSelectedBiome(biome)}
                      className="apple-card"
                      style={{ cursor: 'pointer', textAlign: 'left', padding: '20px', border: isSelected ? `2px solid ${biome.color}` : '2px solid transparent', boxShadow: isSelected ? `0 4px 16px ${biome.color}30` : '0 2px 12px rgba(0,0,0,0.04)', opacity: isSelected ? 1 : 0.7 }}
                    >
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{biome.name}</h4>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: biome.color, background: `${biome.color}20`, padding: '2px 8px', borderRadius: '6px', marginBottom: '8px', display: 'inline-block' }}>{biome.recommendedLevel}</span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{biome.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Biome Explorer Zone */}
            <div className="apple-card" style={{ position: 'relative', overflow: 'hidden', padding: '40px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: selectedBiome.bgGradient, opacity: 0.1, zIndex: 0 }}></div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{selectedBiome.name}</h3>
                    <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{selectedBiome.subtitle}</span>
                  </div>
                  <WeatherWidget onWeatherChange={setCurrentWeather} />
                </div>

                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Native Species</span>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {selectedBiome.wildSpawns.map((s) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-primary)', padding: '8px 16px 8px 8px', borderRadius: '980px', border: '1px solid var(--border-color)' }}>
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.id}.png`}
                          alt={s.name}
                          style={{ width: '40px', height: '40px' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{capitalize(s.name)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lv. {s.minLevel}-{s.maxLevel}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={handleExploreGrass}
                    disabled={isSearchingGrass}
                    className="apple-btn-primary"
                    style={{ fontSize: '1.1rem', padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '12px', background: selectedBiome.color, boxShadow: `0 4px 14px ${selectedBiome.color}50` }}
                  >
                    {isSearchingGrass ? (
                      <>
                        <div className="spinner-border" style={{ width: '1.2rem', height: '1.2rem', borderWidth: '0.15em' }}></div>
                        Searching Tall Grass…
                      </>
                    ) : (
                      "Search Tall Grass"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 2. BATTLE ARENA (WHEN IN ENCOUNTER)                      */}
      {/* ======================================================== */}
      {activeEncounter && (
        <div className={`battle-stage-container ${screenShake ? "screen-shake" : ""}`}>
          {/* Top HUD */}
          <div className="battle-top-hud">
            <div className="hud-chamber-badge">
              <span>{selectedBiome.name} • Wild Encounter</span>
            </div>

            <div className="hud-actions-right">
              <span className="hud-turn-badge">Turn {turnNumber}</span>
              <button
                type="button"
                onClick={handleRunAway}
                className="btn-camera-toggle"
                disabled={battleState === "ANIMATING"}
              >
                Flee
              </button>
            </div>
          </div>

          {/* Arena Viewport */}
          <div className="battle-viewport">
            <BattleEnvironment biomeId={selectedBiome.id} />

            {/* OPPONENT SLOT */}
            <div className="arena-battler-slot slot-opponent">
              <BattlePedestal biomeId={selectedBiome.id} isOpponent={true} />

              <div className={`battler-sprite-wrap ${wildAnim}`}>
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

                <img
                  src={wildFrontSprite}
                  alt={activeEncounter.name}
                  className={`battle-sprite-mon opponent-mon-sprite ${
                    throwingBallKey ? "sprite-shrunk-in-ball" : ""
                  }`}
                  onError={(e) => {
                    e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${activeEncounter.id}.png`;
                  }}
                />
                {slashVfxOnWild && <div className="slash-vfx-flash"></div>}
                {wildDamagePopup && (
                  <div className={`damage-popup-float ${wildDamagePopup.isCrit ? "crit-hit" : ""}`}>
                    -{wildDamagePopup.damage}
                  </div>
                )}
              </div>

              <div className="battle-status-card status-opponent">
                <div className="status-header">
                  <span className="battler-name">
                    {capitalize(activeEncounter.name)}
                    {activeEncounter.isShiny && <span className="shiny-star"> ★</span>}
                  </span>
                  <span className="battler-level">Lv. {activeEncounter.level}</span>
                </div>
                <div className="status-types-row">
                  {activeEncounter.types?.map((t) => (
                    <TypeBadge key={t} type={t} size="xs" />
                  ))}
                </div>
                <div className="status-hp-bar">
                  <div
                    className={`hp-fill ${
                      wildHpPercent < 20 ? "hp-danger" : wildHpPercent < 50 ? "hp-warning" : "hp-healthy"
                    }`}
                    style={{ width: `${wildHpPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* PLAYER SLOT */}
            {leaderPokemon && (
              <div className="arena-battler-slot slot-player">
                <BattlePedestal biomeId={selectedBiome.id} isOpponent={false} />

                <div className={`battler-sprite-wrap ${playerAnim}`}>
                  <img
                    src={playerBackSprite}
                    alt={leaderPokemon.name}
                    className="battle-sprite-mon player-mon-sprite"
                    onError={(e) => {
                      e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${leaderPokemon.id}.png`;
                    }}
                  />
                  {slashVfxOnPlayer && <div className="slash-vfx-flash"></div>}
                  {playerDamagePopup && (
                    <div className="damage-popup-float player-damage">
                      -{playerDamagePopup.damage}
                    </div>
                  )}
                </div>

                <div className="battle-status-card status-player">
                  <div className="status-header">
                    <span className="battler-name">{leaderPokemon.nickname || leaderPokemon.name}</span>
                    <span className="battler-level">Lv. {leaderPokemon.level}</span>
                  </div>
                  <div className="status-types-row">
                    {leaderPokemon.types?.map((t) => (
                      <TypeBadge key={t} type={t} size="xs" />
                    ))}
                  </div>
                  <div className="status-hp-bar">
                    <div
                      className={`hp-fill ${
                        playerHpPercent < 20 ? "hp-danger" : playerHpPercent < 50 ? "hp-warning" : "hp-healthy"
                      }`}
                      style={{ width: `${playerHpPercent}%` }}
                    ></div>
                  </div>
                  <div className="status-hp-text">
                    {leaderPokemon.currentHp || 0} / {leaderPokemon.maxHp} HP
                  </div>
                </div>
              </div>
            )}

            {elementalVfx && (
              <ElementalVfxOverlay target={elementalVfx.target} type={elementalVfx.type} />
            )}
          </div>

          {/* Dialogue Banner */}
          <div className="battle-dialogue-banner">
            <p className="dialogue-text">{battleDialogue}</p>
          </div>

          {/* Controls Tray */}
          <div className="battle-controls-tray">
            {/* 1. MAIN COMMAND MENU */}
            {battleState === "MENU" && (
              <div className="main-command-buttons">
                <button
                  type="button"
                  onClick={() => setBattleState("MOVES")}
                  className="btn-cmd btn-cmd-fight"
                >
                  FIGHT
                </button>

                <button
                  type="button"
                  onClick={() => setBattleState("CATCH")}
                  className="btn-cmd btn-cmd-ball"
                >
                  CATCH
                </button>

                <button
                  type="button"
                  onClick={() => setBattleState("BAG")}
                  className="btn-cmd btn-cmd-bag"
                >
                  BAG
                </button>

                <button
                  type="button"
                  onClick={() => setBattleState("PARTY")}
                  className="btn-cmd btn-cmd-switch"
                >
                  POKÉMON
                </button>
              </div>
            )}

            {/* 2. FIGHT: MOVES DECK */}
            {battleState === "MOVES" && (
              <div className="moves-deck-grid">
                {playerMoves.map((m) => {
                  const mult = getTypeDamageMultiplier(m.type, activeEncounter.types);
                  const isSuper = mult >= 2;
                  const isNotVery = mult < 1 && mult > 0;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleExecuteMove(m)}
                      disabled={m.currentPp <= 0}
                      className={`move-pill-card move-type-${m.type}`}
                      style={{ borderLeftColor: getTypeColor(m.type).primary }}
                    >
                      <div className="move-pill-header">
                        <span className="move-name">{m.name}</span>
                        <TypeBadge type={m.type} size="xs" />
                      </div>
                      <div className="move-pill-footer">
                        <span className="move-power">Pow {m.power || "—"}</span>
                        <span className="move-pp">PP {m.currentPp}/{m.maxPp}</span>
                        {isSuper && <span className="tag-advantage tag-super">Super Eff!</span>}
                        {isNotVery && <span className="tag-advantage tag-weak">Resisted</span>}
                      </div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setBattleState("MENU")}
                  className="btn-cancel-submenu"
                >
                  Back
                </button>
              </div>
            )}

            {/* 3. CATCH: POKÉ BALLS TRAY */}
            {battleState === "CATCH" && (
              <div className="battle-bag-tray">
                <span className="bag-title">Select Poké Ball:</span>
                <div className="battle-bag-items">
                  {availableBalls.length === 0 ? (
                    <div className="empty-pocket-msg">No Poké Balls in Bag!</div>
                  ) : (
                    availableBalls.map((b) => (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => handleThrowBall(b.key)}
                        className="battle-bag-pill"
                      >
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${b.key}.png`}
                          alt={b.key}
                          className="item-sprite-sm"
                        />
                        <span>{b.key.replace("-", " ").toUpperCase()}</span>
                        <span className="bag-item-qty">x{b.count}</span>
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setBattleState("MENU")}
                  className="btn-cancel-submenu"
                >
                  Back
                </button>
              </div>
            )}

            {/* 4. BAG: MEDICINE TRAY */}
            {battleState === "BAG" && (
              <div className="battle-bag-tray">
                <span className="bag-title">Use Medicine / Berry:</span>
                <div className="battle-bag-items">
                  {availableMedicine.length === 0 ? (
                    <div className="empty-pocket-msg">No Medicine or Berries in Bag!</div>
                  ) : (
                    availableMedicine.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => handleUseItem(m.key)}
                        className="battle-bag-pill"
                      >
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${m.key}.png`}
                          alt={m.key}
                          className="item-sprite-sm"
                        />
                        <span>{m.key.replace("-", " ").toUpperCase()}</span>
                        <span className="bag-item-qty">x{m.count}</span>
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setBattleState("MENU")}
                  className="btn-cancel-submenu"
                >
                  Back
                </button>
              </div>
            )}

            {/* 5. POKÉMON: PARTY SWITCHER */}
            {battleState === "PARTY" && (
              <div className="battle-switch-tray">
                <span className="switch-title">Switch Pokémon:</span>
                <div className="battle-switch-list">
                  {team.map((member, idx) => {
                    const isCurrent = idx === 0;
                    const isFainted = (member.currentHp || 0) <= 0;
                    return (
                      <button
                        key={member.instanceId || idx}
                        type="button"
                        disabled={isCurrent || isFainted}
                        onClick={() => handleSwitchPokemon(member)}
                        className={`switch-mon-card ${isCurrent ? "switch-active" : ""}`}
                      >
                        <img
                          src={getAnimatedSpriteUrl(member.id)}
                          alt={member.name}
                          className="switch-sprite"
                        />
                        <div className="switch-info">
                          <span className="switch-name">{member.nickname || member.name}</span>
                          <span className="switch-hp">
                            {member.currentHp || 0}/{member.maxHp} HP
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setBattleState("MENU")}
                  className="btn-cancel-submenu"
                >
                  Back
                </button>
              </div>
            )}
          </div>

          {/* OUTCOME OVERLAYS */}
          {battleState === "VICTORY" && expResult && (
            <div className="battle-result-overlay">
              <div className="rpg-result-card result-victory">
                <h3>Wild Pokémon Defeated</h3>
                <div className="rewards-summary">
                  <span className="reward-pill">+<strong>{expResult.expGained}</strong> EXP</span>
                  <span className="reward-pill">+₽<strong>{expResult.moneyGained}</strong></span>
                </div>
                {expResult.levelUpInfo && (
                  <div className="level-up-fanfare">
                    <span>
                      {expResult.levelUpInfo.pokemonName} grew to Level {expResult.levelUpInfo.newLevel}!
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
            </div>
          )}

          {battleState === "CAUGHT" && (
            <div className="battle-result-overlay">
              <div className="rpg-result-card result-caught">
                <h3>Caught!</h3>
                <p>
                  Wild {capitalize(activeEncounter.name)} was safely caught and added to your collection.
                </p>
                <button
                  type="button"
                  onClick={handleDismissBattle}
                  className="btn-rpg-finish"
                >
                  Continue Journey
                </button>
              </div>
            </div>
          )}

          {battleState === "DEFEATED" && (
            <div className="battle-result-overlay">
              <div className="rpg-result-card result-defeated">
                <h3>{leaderPokemon?.nickname || leaderPokemon?.name} Fainted</h3>
                <p>All battle-ready Pokémon have fainted!</p>
                <div className="defeated-actions">
                  <button
                    type="button"
                    onClick={() => {
                      healAllPokemon();
                      handleDismissBattle();
                      showToast("Team rested and restored to full health.");
                    }}
                    className="btn-rpg-retreat"
                  >
                    Retreat to Pokémon Center
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
