// ========================================================
// PokéSphere Battle Tower — Endless Survival Gauntlet (/tower)
// Procedural Scaling Trainers, Win Streaks, & Milestone Rewards
// ========================================================

import { useState, useRef, useEffect } from "react";
import { useGame } from "../context/GameContext.jsx";
import {
  generateTowerChallenger,
  getTowerRank,
  TOWER_RANKS,
} from "../data/battleTowerData.js";
import {
  BattleEnvironment,
  BattlePedestal,
  ElementalVfxOverlay,
} from "../components/BattleEnvironment.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import {
  IconSwords,
  IconTrophy,
  IconCrown,
  IconBackpack,
  IconParty,
  IconSparkles,
  IconCamera,
  IconArrowRight,
  IconRefresh,
} from "../components/Icons.jsx";
import { getTypeDamageMultiplier } from "../utils/typeEffectiveness.js";
import {
  getMegaEvolutionData,
  applyMegaEvolution,
} from "../data/megaEvolutionData.js";
import {
  getAnimatedBackSpriteUrl,
  getAnimatedBackShinySpriteUrl,
  getAnimatedSpriteUrl,
  getBackSpriteUrl,
  getTypeColor,
  playPokemonCry,
} from "../utils.js";
import {
  playHitSound,
  playAttackWhooshSound,
  playCriticalHitSound,
  playSuperEffectiveSound,
  playNotVeryEffectiveSound,
  playFaintSound,
  playBattleStartSound,
  playCatchSuccessJingle,
  playTowerFanfare,
  playMegaEvolutionSound,
} from "../utils/soundEffects.js";
import { triggerHaptic, HAPTIC_PATTERNS } from "../utils/haptics.js";

const STORAGE_KEY_TOWER = "pokesphere_tower_record";

export default function BattleTowerPage() {
  const {
    trainer,
    team,
    updatePokemonHp,
    givePartyExp,
    inventory,
    addMoney,
    addLoot,
    applyItemToPokemon,
    healAllPokemon,
  } = useGame();

  // Persistent Tower Records
  const [towerRecord, setTowerRecord] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TOWER);
      return saved ? JSON.parse(saved) : { bestStreak: 0, totalWins: 0 };
    } catch {
      return { bestStreak: 0, totalWins: 0 };
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TOWER, JSON.stringify(towerRecord));
  }, [towerRecord]);

  // Tower Run States: "LOBBY" | "VS_INTRO" | "BATTLE" | "STREAK_VICTORY" | "DEFEAT"
  const [mode, setMode] = useState("LOBBY");
  const [currentStreak, setCurrentStreak] = useState(0);

  // Active Challenger & Battlers
  const [challenger, setChallenger] = useState(null);
  const [activeChallengerIndex, setActiveChallengerIndex] = useState(0);
  const [activePartyIndex, setActivePartyIndex] = useState(0);

  // Mega Evolution
  const [playerIsMega, setPlayerIsMega] = useState(false);
  const [megaBurstAnim, setMegaBurstAnim] = useState(false);

  // Submenus
  const [battleSubMenu, setBattleSubMenu] = useState("MENU"); // MENU, FIGHT, BAG, SWITCH, BUSY
  const [battleDialogue, setBattleDialogue] = useState("");

  // Camera & Visuals
  const [cameraMode, setCameraMode] = useState("isometric");
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [turnNumber, setTurnNumber] = useState(1);

  // VFX
  const [playerAnim, setPlayerAnim] = useState("");
  const [oppAnim, setOppAnim] = useState("");
  const [screenShake, setScreenShake] = useState(false);
  const [slashVfxOnOpp, setSlashVfxOnOpp] = useState(false);
  const [slashVfxOnPlayer, setSlashVfxOnPlayer] = useState(false);
  const [elementalVfx, setElementalVfx] = useState(null);
  const [oppDamagePopup, setOppDamagePopup] = useState(null);
  const [playerDamagePopup, setPlayerDamagePopup] = useState(null);

  const introTimerRef = useRef(null);

  const basePlayerMon = team[activePartyIndex] || team[0];
  const activePlayerMon = playerIsMega ? applyMegaEvolution(basePlayerMon) : basePlayerMon;
  const canMega = !playerIsMega && Boolean(getMegaEvolutionData(basePlayerMon));

  const activeOppMon = challenger?.team?.[activeChallengerIndex];
  const currentRank = getTowerRank(currentStreak);

  useEffect(() => {
    return () => {
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, []);

  // Start / Continue Tower Run
  function handleStartTowerChallenge() {
    const firstAliveIndex = team.findIndex((p) => (p.currentHp || 0) > 0);
    if (firstAliveIndex === -1) {
      alert("All your Pokémon have fainted! Heal your party before entering the Tower!");
      return;
    }

    const nextStreak = currentStreak + 1;
    setCurrentStreak(nextStreak);
    setActivePartyIndex(firstAliveIndex);
    setPlayerIsMega(false);

    const generated = generateTowerChallenger(nextStreak);
    setChallenger(generated);
    setActiveChallengerIndex(0);
    setTurnNumber(1);

    setMode("VS_INTRO");
    playBattleStartSound();
    triggerHaptic(HAPTIC_PATTERNS.MEDIUM);

    introTimerRef.current = setTimeout(() => {
      setMode("BATTLE");
      setBattleDialogue(`${generated.name}: "${generated.quote}"`);
      playPokemonCry(generated.team[0].id);

      setTimeout(() => {
        setBattleDialogue(`What will ${team[firstAliveIndex].nickname.toUpperCase()} do?`);
        setBattleSubMenu("MENU");
      }, 2200);
    }, 2600);
  }

  // Mega Evolution trigger
  function handleTriggerMega() {
    if (!canMega) return;
    setPlayerIsMega(true);
    setMegaBurstAnim(true);
    playMegaEvolutionSound();
    triggerHaptic(HAPTIC_PATTERNS.MEGA_EVOLUTION);

    const megaData = getMegaEvolutionData(basePlayerMon);
    setBattleDialogue(`✨ ${basePlayerMon.nickname.toUpperCase()} Mega Evolved into ${megaData.formName.toUpperCase()}!`);

    setTimeout(() => {
      setMegaBurstAnim(false);
    }, 2000);
  }

  // Player Attack
  function handleSelectMove(move) {
    if (battleSubMenu === "BUSY" || !activePlayerMon || !activeOppMon) return;
    setBattleSubMenu("BUSY");

    const playerSpeed = activePlayerMon.speed || 50;
    const oppSpeed = activeOppMon.speed || 50;
    const playerFirst = playerSpeed >= oppSpeed;

    if (playerFirst) {
      executePlayerAttack(move, (oppAlive) => {
        if (oppAlive) {
          executeOppAttack(() => {
            setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
            setBattleSubMenu("MENU");
          });
        }
      });
    } else {
      executeOppAttack(() => {
        if ((activePlayerMon.currentHp || 0) > 0) {
          executePlayerAttack(move, () => {
            setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
            setBattleSubMenu("MENU");
          });
        }
      });
    }
  }

  function executePlayerAttack(move, onComplete) {
    setBattleDialogue(`${activePlayerMon.nickname.toUpperCase()} used ${move.name.toUpperCase()}!`);
    setPlayerAnim(cameraMode === "isometric" ? "anim-isometric-lunge" : "anim-player-lunge");
    setElementalVfx({ target: "leader", type: move.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setPlayerAnim("");

      const isCrit = Math.random() < 0.1;
      const typeMult = getTypeDamageMultiplier(move.type, activeOppMon.types);
      const baseAtk = activePlayerMon.attack || 50;
      const oppDef = activeOppMon.defense || 50;

      const baseDmg =
        Math.floor(
          (((2 * activePlayerMon.level) / 5 + 2) * move.power * (baseAtk / oppDef)) / 50
        ) + 2;
      const variance = 0.85 + Math.random() * 0.3;
      const finalDmg = Math.max(1, Math.floor(baseDmg * (isCrit ? 1.5 : 1.0) * typeMult * variance));

      setSlashVfxOnOpp(true);
      setOppAnim("anim-wild-hit");
      setScreenShake(true);

      if (isCrit) {
        playCriticalHitSound();
        triggerHaptic(HAPTIC_PATTERNS.CRITICAL_HIT);
      } else if (typeMult > 1) {
        playSuperEffectiveSound();
        triggerHaptic(HAPTIC_PATTERNS.SUPER_EFFECTIVE);
      } else if (typeMult < 1 && typeMult > 0) {
        playNotVeryEffectiveSound();
        triggerHaptic(HAPTIC_PATTERNS.LIGHT);
      } else {
        playHitSound();
        triggerHaptic(HAPTIC_PATTERNS.LIGHT);
      }

      setOppDamagePopup({ damage: finalDmg, isCrit, isSuper: typeMult > 1 });

      const nextHp = Math.max(0, activeOppMon.currentHp - finalDmg);
      const updated = [...challenger.team];
      updated[activeChallengerIndex] = { ...activeOppMon, currentHp: nextHp };
      setChallenger((prev) => ({ ...prev, team: updated }));

      setTimeout(() => {
        setSlashVfxOnOpp(false);
        setOppAnim("");
        setElementalVfx(null);
        setScreenShake(false);
        setOppDamagePopup(null);

        if (typeMult > 1) setBattleDialogue("It's super effective!");
        else if (isCrit) setBattleDialogue("A critical hit!");
        else setBattleDialogue(`${activeOppMon.nickname} took ${finalDmg} damage!`);

        setTimeout(() => {
          if (nextHp <= 0) {
            handleOppFaint(onComplete);
          } else {
            if (onComplete) onComplete(true);
          }
        }, 1000);
      }, 700);
    }, 450);
  }

  function executeOppAttack(onComplete) {
    if (!activeOppMon || !activePlayerMon) return;
    const chosenMove = activeOppMon.moves[Math.floor(Math.random() * activeOppMon.moves.length)] || activeOppMon.moves[0];

    setBattleDialogue(`Foe's ${activeOppMon.nickname} used ${chosenMove.name.toUpperCase()}!`);
    setOppAnim(cameraMode === "isometric" ? "anim-isometric-wild-lunge" : "anim-wild-lunge");
    setElementalVfx({ target: "player", type: chosenMove.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setOppAnim("");

      const isCrit = Math.random() < 0.08;
      const typeMult = getTypeDamageMultiplier(chosenMove.type, activePlayerMon.types);
      const oppAtk = activeOppMon.attack || 50;
      const playerDef = activePlayerMon.defense || 50;

      const baseDmg =
        Math.floor(
          (((2 * activeOppMon.level) / 5 + 2) * chosenMove.power * (oppAtk / playerDef)) / 50
        ) + 2;
      const variance = 0.85 + Math.random() * 0.3;
      const finalDmg = Math.max(1, Math.floor(baseDmg * (isCrit ? 1.5 : 1.0) * typeMult * variance));

      setSlashVfxOnPlayer(true);
      setPlayerAnim("anim-player-hit");
      setScreenShake(true);

      if (isCrit) playCriticalHitSound();
      else if (typeMult > 1) playSuperEffectiveSound();
      else playHitSound();

      setPlayerDamagePopup({ damage: finalDmg, isCrit, isSuper: typeMult > 1 });

      const nextPlayerHp = Math.max(0, (activePlayerMon.currentHp || 0) - finalDmg);
      updatePokemonHp(activePlayerMon.instanceId, nextPlayerHp);

      setTimeout(() => {
        setSlashVfxOnPlayer(false);
        setPlayerAnim("");
        setElementalVfx(null);
        setScreenShake(false);
        setPlayerDamagePopup(null);

        if (nextPlayerHp <= 0) {
          handlePlayerFaint();
        } else {
          setTurnNumber((t) => t + 1);
          if (onComplete) onComplete();
        }
      }, 700);
    }, 450);
  }

  function handleOppFaint(onComplete) {
    playFaintSound();
    setOppAnim("anim-wild-faint");
    setBattleDialogue(`Foe's ${activeOppMon.nickname} fainted!`);

    givePartyExp(Math.round(activeOppMon.level * 40), activePlayerMon.instanceId);

    setTimeout(() => {
      setOppAnim("");

      const nextAliveIndex = challenger.team.findIndex((m, idx) => idx > activeChallengerIndex && (m.currentHp || 0) > 0);
      if (nextAliveIndex !== -1) {
        setActiveChallengerIndex(nextAliveIndex);
        const nextMon = challenger.team[nextAliveIndex];
        playPokemonCry(nextMon.id);
        setBattleDialogue(`${challenger.name} sent out ${nextMon.nickname}!`);

        setTimeout(() => {
          setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
          setBattleSubMenu("MENU");
          if (onComplete) onComplete(false);
        }, 1600);
      } else {
        // Entire challenger team defeated!
        handleTowerStreakVictory();
      }
    }, 1100);
  }

  function handleTowerStreakVictory() {
    playCatchSuccessJingle();
    triggerHaptic(HAPTIC_PATTERNS.CATCH_SUCCESS);
    setBattleDialogue(`Victory! You defeated ${challenger.name}! Streak: ${currentStreak}`);

    // Update records
    setTowerRecord((prev) => ({
      bestStreak: Math.max(prev.bestStreak, currentStreak),
      totalWins: prev.totalWins + 1,
    }));

    addMoney(challenger.prizeMoney);

    // Check for milestone bonuses every 5 streaks
    if (currentStreak % 5 === 0) {
      playTowerFanfare();
      addLoot("master-ball", 1);
      addLoot("rare-candy", 3);
    }

    setTimeout(() => {
      setMode("STREAK_VICTORY");
    }, 2000);
  }

  function handlePlayerFaint() {
    playFaintSound();
    setPlayerAnim("anim-player-faint");
    setBattleDialogue(`${activePlayerMon.nickname.toUpperCase()} fainted!`);

    setTimeout(() => {
      setPlayerAnim("");
      const nextAlive = team.findIndex((p, idx) => idx !== activePartyIndex && (p.currentHp || 0) > 0);
      if (nextAlive !== -1) {
        setBattleDialogue("Choose your next Pokémon to send in!");
        setBattleSubMenu("SWITCH");
      } else {
        // Run terminated!
        setBattleDialogue("All your Pokémon fainted! Your Battle Tower streak has ended!");
        setTimeout(() => {
          healAllPokemon();
          setMode("DEFEAT");
        }, 2200);
      }
    }, 1200);
  }

  function handleSwitchPokemon(index) {
    if (index === activePartyIndex || (team[index].currentHp || 0) <= 0) return;
    setBattleSubMenu("BUSY");
    setActivePartyIndex(index);
    setPlayerIsMega(false);
    const chosen = team[index];
    playPokemonCry(chosen.id);
    setBattleDialogue(`Go, ${chosen.nickname.toUpperCase()}!`);

    setTimeout(() => {
      executeOppAttack(() => {
        setBattleDialogue(`What will ${chosen.nickname.toUpperCase()} do?`);
        setBattleSubMenu("MENU");
      });
    }, 1200);
  }

  // ========================================================
  // RENDER: STREAK VICTORY / INTERMISSION
  // ========================================================
  if (mode === "STREAK_VICTORY") {
    const isMilestone = currentStreak % 5 === 0;

    return (
      <div className="tower-page-container">
        <div className="tower-intermission-card">
          <div className="intermission-streak-badge">
            <IconTrophy size={40} />
          </div>
          <h1 className="intermission-title">STREAK {currentStreak} CLEARED!</h1>
          <p className="intermission-subtitle">
            Rank: <strong style={{ color: currentRank.color }}>{currentRank.title}</strong>
          </p>

          {isMilestone && (
            <div className="tower-milestone-reward-box">
              <IconSparkles size={24} className="milestone-icon" />
              <div>
                <h4 className="milestone-title">🎉 Milestone Bonus Earned!</h4>
                <p className="milestone-desc">
                  +1 Master Ball & +3 Rare Candies deposited directly into your Bag!
                </p>
              </div>
            </div>
          )}

          <div className="tower-intermission-actions">
            <button
              type="button"
              onClick={handleStartTowerChallenge}
              className="btn-tower-continue"
            >
              <span>Advance to Streak {currentStreak + 1}</span>
              <IconArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                healAllPokemon();
                setMode("LOBBY");
              }}
              className="btn-tower-cashout"
            >
              <span>Cash Out & Return to Lobby</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: DEFEAT SCREEN
  // ========================================================
  if (mode === "DEFEAT") {
    return (
      <div className="tower-page-container">
        <div className="tower-defeat-card">
          <h1 className="defeat-title">STREAK ENDED</h1>
          <p className="defeat-stats">
            You achieved a streak of <strong>{currentStreak} consecutive victories</strong>!
          </p>
          <div className="defeat-record-box">
            <span>Personal Best Streak: <strong>{towerRecord.bestStreak} Wins</strong></span>
            <span>Total Tower Battles Won: <strong>{towerRecord.totalWins}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentStreak(0);
              setMode("LOBBY");
            }}
            className="btn-tower-restart"
          >
            <IconRefresh size={16} />
            <span>Return to Battle Tower Lobby</span>
          </button>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: BATTLE ARENA
  // ========================================================
  if (mode === "BATTLE" && challenger && activeOppMon) {
    const isPlayerShiny = Boolean(activePlayerMon?.isShiny);
    const playerBackSprite = isPlayerShiny
      ? getAnimatedBackShinySpriteUrl(activePlayerMon.id) || getBackSpriteUrl(activePlayerMon.id)
      : activePlayerMon.sprites?.backAnimated || getAnimatedBackSpriteUrl(activePlayerMon.id) || getBackSpriteUrl(activePlayerMon.id);

    const oppFrontSprite = getAnimatedSpriteUrl(activeOppMon.id);

    const playerHpPercent = Math.max(0, Math.min(100, Math.round(((activePlayerMon.currentHp || 0) / activePlayerMon.maxHp) * 100)));
    const oppHpPercent = Math.max(0, Math.min(100, Math.round(((activeOppMon.currentHp || 0) / activeOppMon.maxHp) * 100)));

    return (
      <div className="tower-page-container">
        <div className={`battle-stage-container arena-gym-champion ${screenShake ? "screen-shake" : ""}`}>
          <div className="battle-top-hud">
            <div className="hud-chamber-badge">
              <IconCrown size={15} style={{ marginRight: 6 }} />
              <span>Tower Streak {currentStreak} — {challenger.name}</span>
            </div>

            <div className="hud-actions-right">
              <span className="hud-turn-badge">Turn {turnNumber}</span>
              <button
                type="button"
                className="btn-camera-toggle"
                onClick={() => setCameraMode((m) => (m === "isometric" ? "firstperson" : "isometric"))}
              >
                <IconCamera size={14} />
                <span className="camera-label">{cameraMode.toUpperCase()}</span>
              </button>
              <button
                type="button"
                className="btn-speed-toggle"
                onClick={() => setBattleSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}
              >
                {battleSpeed}x
              </button>
            </div>
          </div>

          <div className={`battle-viewport camera-${cameraMode}`}>
            <BattleEnvironment arenaTheme="gym-champion" />

            {/* OPPONENT SIDE */}
            <div className="arena-battler-slot slot-opponent">
              <BattlePedestal theme="gym-champion" isOpponent={true} />

              <div className={`battler-sprite-wrap ${oppAnim}`}>
                <img
                  src={oppFrontSprite}
                  alt={activeOppMon.name}
                  className="battle-sprite-mon opponent-mon-sprite"
                />
                {slashVfxOnOpp && <div className="slash-vfx-flash"></div>}
                {oppDamagePopup && (
                  <div className={`damage-popup-float ${oppDamagePopup.isCrit ? "crit-hit" : ""}`}>
                    -{oppDamagePopup.damage}
                  </div>
                )}
              </div>

              <div className="battle-status-card status-opponent">
                <div className="status-header">
                  <span className="battler-name">{activeOppMon.nickname}</span>
                  <span className="battler-level">Lv. {activeOppMon.level}</span>
                </div>
                <div className="status-hp-bar">
                  <div
                    className={`hp-fill ${oppHpPercent < 20 ? "hp-danger" : oppHpPercent < 50 ? "hp-warning" : "hp-healthy"}`}
                    style={{ width: `${oppHpPercent}%` }}
                  ></div>
                </div>
                <div className="status-roster-dots">
                  {challenger.team.map((mon, idx) => (
                    <span
                      key={idx}
                      className={`roster-dot ${(mon.currentHp || 0) > 0 ? "dot-alive" : "dot-fainted"}`}
                    ></span>
                  ))}
                </div>
              </div>
            </div>

            {/* PLAYER SIDE */}
            <div className="arena-battler-slot slot-player">
              <BattlePedestal theme="gym-champion" isOpponent={false} />

              <div className={`battler-sprite-wrap ${playerAnim} ${megaBurstAnim ? "mega-burst-aura" : ""}`}>
                <img
                  src={playerBackSprite}
                  alt={activePlayerMon.nickname}
                  className="battle-sprite-mon player-mon-sprite"
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
                  <span className="battler-name">
                    {playerIsMega && <span className="mega-badge-tag">MEGA</span>}
                    {activePlayerMon.nickname}
                  </span>
                  <span className="battler-level">Lv. {activePlayerMon.level}</span>
                </div>
                <div className="status-hp-bar">
                  <div
                    className={`hp-fill ${playerHpPercent < 20 ? "hp-danger" : playerHpPercent < 50 ? "hp-warning" : "hp-healthy"}`}
                    style={{ width: `${playerHpPercent}%` }}
                  ></div>
                </div>
                <div className="status-hp-text">
                  {activePlayerMon.currentHp || 0} / {activePlayerMon.maxHp} HP
                </div>
              </div>
            </div>

            {elementalVfx && (
              <ElementalVfxOverlay target={elementalVfx.target} type={elementalVfx.type} />
            )}
          </div>

          <div className="battle-dialogue-banner">
            <p className="dialogue-text">{battleDialogue}</p>
          </div>

          <div className="battle-controls-tray">
            {battleSubMenu === "MENU" && (
              <div className="main-command-buttons">
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("FIGHT")}
                  className="btn-cmd btn-cmd-fight"
                >
                  <IconSwords size={20} />
                  <span>FIGHT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBattleSubMenu("BAG")}
                  className="btn-cmd btn-cmd-bag"
                >
                  <IconBackpack size={20} />
                  <span>BAG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBattleSubMenu("SWITCH")}
                  className="btn-cmd btn-cmd-switch"
                >
                  <IconParty size={20} />
                  <span>POKÉMON</span>
                </button>

                {canMega && (
                  <button
                    type="button"
                    onClick={handleTriggerMega}
                    className="btn-cmd btn-cmd-mega-trigger"
                  >
                    <IconSparkles size={20} />
                    <span>MEGA EVOLVE</span>
                  </button>
                )}
              </div>
            )}

            {/* FIGHT DECK */}
            {battleSubMenu === "FIGHT" && (
              <div className="moves-deck-grid">
                {activePlayerMon.moves?.map((m) => {
                  const mult = getTypeDamageMultiplier(m.type, activeOppMon.types);
                  const isSuper = mult >= 2;
                  const isNotVery = mult < 1 && mult > 0;

                  return (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => handleSelectMove(m)}
                      className={`move-pill-card move-type-${m.type}`}
                      style={{ borderLeftColor: getTypeColor(m.type) }}
                    >
                      <div className="move-pill-header">
                        <span className="move-name">{m.name}</span>
                        <TypeBadge type={m.type} size="xs" />
                      </div>
                      <div className="move-pill-footer">
                        <span className="move-power">Pow {m.power || "—"}</span>
                        {isSuper && <span className="tag-advantage tag-super">Super Eff!</span>}
                        {isNotVery && <span className="tag-advantage tag-weak">Resisted</span>}
                      </div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("MENU")}
                  className="btn-cancel-submenu"
                >
                  Back
                </button>
              </div>
            )}

            {/* BAG MENU */}
            {battleSubMenu === "BAG" && (
              <div className="battle-bag-tray">
                <span className="bag-title">Use Item:</span>
                <div className="battle-bag-items">
                  {Object.entries(inventory)
                    .filter(([key, count]) => count > 0 && !key.includes("ball") && !key.includes("stone"))
                    .map(([key, count]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const res = applyItemToPokemon(key, activePlayerMon.instanceId);
                          if (!res.success) alert(res.message);
                          else {
                            setBattleSubMenu("BUSY");
                            setBattleDialogue(`Used ${key.toUpperCase()}! ${res.message}`);
                            setTimeout(() => executeOppAttack(() => setBattleSubMenu("MENU")), 1200);
                          }
                        }}
                        className="battle-bag-pill"
                      >
                        <span>{key.replace(/-/g, " ").toUpperCase()}</span>
                        <span className="bag-item-qty">x{count}</span>
                      </button>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("MENU")}
                  className="btn-cancel-submenu"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* SWITCH MENU */}
            {battleSubMenu === "SWITCH" && (
              <div className="battle-switch-tray">
                <span className="switch-title">Select Pokémon to Switch In:</span>
                <div className="battle-switch-list">
                  {team.map((member, idx) => (
                    <button
                      key={member.instanceId || idx}
                      type="button"
                      disabled={idx === activePartyIndex || (member.currentHp || 0) <= 0}
                      onClick={() => handleSwitchPokemon(idx)}
                      className={`switch-mon-card ${idx === activePartyIndex ? "switch-active" : ""}`}
                    >
                      <img
                        src={getAnimatedSpriteUrl(member.id)}
                        alt={member.name}
                        className="switch-sprite"
                      />
                      <div className="switch-info">
                        <span className="switch-name">{member.nickname}</span>
                        <span className="switch-hp">{member.currentHp || 0}/{member.maxHp} HP</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("MENU")}
                  className="btn-cancel-submenu"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: TOWER LOBBY
  // ========================================================
  return (
    <div className="tower-page-container">
      <div className="tower-lobby-header">
        <div className="tower-header-text">
          <div className="tower-title-row">
            <IconTrophy size={30} className="tower-trophy-gold" />
            <h1 className="tower-title">Battle Tower Gauntlet</h1>
          </div>
          <p className="tower-subtitle">
            The endless survival proving ground — test your tactical endurance against endless trainers!
          </p>
        </div>

        <div className="tower-record-pill">
          <span className="record-label">Best Streak:</span>
          <span className="record-number">{towerRecord.bestStreak} Wins</span>
        </div>
      </div>

      <div className="tower-stats-overview-grid">
        <div className="tower-stat-card">
          <span className="tower-stat-title">Current Rank</span>
          <h2 className="tower-stat-value" style={{ color: currentRank.color }}>
            {currentRank.title}
          </h2>
          <span className="tower-stat-sub">Based on streak performance</span>
        </div>

        <div className="tower-stat-card">
          <span className="tower-stat-title">Total Battles Won</span>
          <h2 className="tower-stat-value">{towerRecord.totalWins}</h2>
          <span className="tower-stat-sub">Lifetime Tower Victories</span>
        </div>

        <div className="tower-stat-card">
          <span className="tower-stat-title">Milestone Rewards</span>
          <h2 className="tower-stat-value">Every 5 Wins</h2>
          <span className="tower-stat-sub">Master Ball & Rare Candies</span>
        </div>
      </div>

      {/* Start Button */}
      <div className="tower-start-hero">
        <button
          type="button"
          onClick={handleStartTowerChallenge}
          className="btn-start-tower-run"
        >
          <IconSwords size={22} />
          <span>Enter Battle Tower Challenge</span>
        </button>
      </div>

      {/* Milestone Ladder Table */}
      <div className="tower-ladder-card">
        <h3 className="ladder-card-title">Tower Honor Ranks & Milestones</h3>
        <div className="ladder-ranks-list">
          {TOWER_RANKS.map((r) => (
            <div key={r.title} className="ladder-rank-row">
              <span className="ladder-rank-badge" style={{ backgroundColor: r.color }}>
                Streak {r.minStreak}+
              </span>
              <span className="ladder-rank-name">{r.title}</span>
              <span className="ladder-rank-reward">
                {r.minStreak === 0 ? "Standard Rewards" : `₽ ${(r.minStreak * 2500).toLocaleString()} + Rare Candy`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
