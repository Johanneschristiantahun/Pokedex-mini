// ========================================================
// PokéSphere Official Kanto Gym Leader Arena & Challenge Hub
// Face-to-Face POV Multi-Pokémon Trainer Battles,
// 8 Official Gym Leaders, Kanto Badges, and Victory Ceremonies
// ========================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import { KANTO_GYM_LEADERS } from "../data/gymLeaders.js";
import GymBadgeIcon from "../components/GymBadgeIcons.jsx";
import { BattleEnvironment, BattlePedestal } from "../components/BattleEnvironment.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import {
  IconSwords,
  IconCross,
  IconBackpack,
  IconParty,
  IconCoin,
  IconSparkles,
  IconCheck,
} from "../components/Icons.jsx";
import { getTypeDamageMultiplier } from "../utils/typeEffectiveness.js";
import {
  capitalize,
  getAnimatedBackSpriteUrl,
  getAnimatedSpriteUrl,
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
} from "../utils/soundEffects.js";

function pickGymLeaderMove(moves = []) {
  if (!moves || moves.length === 0) {
    return { name: "Tackle", type: "normal", power: 40 };
  }
  const idx = Math.floor(Math.random() * moves.length);
  return moves[idx] || moves[0];
}

export default function GymPage() {
  const {
    trainer,
    team,
    hasBadge,
    awardBadge,
    givePartyExp,
    updatePokemonHp,
    inventory,
    applyItemToPokemon,
    healAllPokemon,
  } = useGame();

  // Screen View: "CIRCUIT" (Leader list) | "VS_INTRO" | "BATTLE" | "VICTORY_MODAL"
  const [viewMode, setViewMode] = useState("CIRCUIT");
  const [selectedLeader, setSelectedLeader] = useState(null);

  // Active Battle States
  const [leaderRoster, setLeaderRoster] = useState([]);
  const [activeLeaderIndex, setActiveLeaderIndex] = useState(0);
  const [activePartyIndex, setActivePartyIndex] = useState(0);

  // Sub-menu in battle: "MENU" | "FIGHT" | "BAG" | "SWITCH" | "BUSY"
  const [battleSubMenu, setBattleSubMenu] = useState("MENU");
  const [battleDialogue, setBattleDialogue] = useState("");

  // Animation & Visual FX
  const [playerAnim, setPlayerAnim] = useState("");
  const [leaderAnim, setLeaderAnim] = useState("");
  const [screenShake, setScreenShake] = useState(false);
  const [slashVfxOnLeader, setSlashVfxOnLeader] = useState(false);
  const [slashVfxOnPlayer, setSlashVfxOnPlayer] = useState(false);
  const [leaderDamagePopup, setLeaderDamagePopup] = useState(null);
  const [playerDamagePopup, setPlayerDamagePopup] = useState(null);

  // Victory Rewards
  const [victoryData, setVictoryData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function pushLog() {}

  // Active Leader Mon and Player Mon
  const activeLeaderMon = leaderRoster[activeLeaderIndex] || null;
  const activePlayerMon = team[activePartyIndex] || null;

  // ------------------------------------------------------
  // 1. START GYM CHALLENGE: VS SCREEN INTRO
  // ------------------------------------------------------
  function handleSelectLeader(leader) {
    if (team.length === 0) {
      showToast("You need at least 1 Pokémon in your party to challenge a Gym!");
      return;
    }

    // Check if team has at least 1 conscious Pokémon
    const firstAliveIndex = team.findIndex((p) => (p.currentHp || 0) > 0);
    if (firstAliveIndex === -1) {
      showToast("All your Pokémon have fainted! Visit the Pokémon Center in My Team first.");
      return;
    }

    setSelectedLeader(leader);
    // Clone leader team with fresh full HP
    const freshLeaderTeam = leader.team.map((mon) => ({
      ...mon,
      currentHp: mon.maxHp,
      moves: mon.moves.map((m) => ({ ...m, currentPp: m.maxPp })),
    }));

    setLeaderRoster(freshLeaderTeam);
    setActiveLeaderIndex(0);
    setActivePartyIndex(firstAliveIndex);
    setViewMode("VS_INTRO");
    playBattleStartSound();

    // Trigger Gym Leader First Mon Cry after VS Banner
    setTimeout(() => {
      setViewMode("BATTLE");
      setBattleSubMenu("BUSY");
      const firstMon = freshLeaderTeam[0];
      setBattleDialogue(`Gym Leader ${leader.name} sent out ${firstMon.nickname.toUpperCase()}!`);
      pushLog(`Gym Leader ${leader.name} sent out ${firstMon.nickname}!`);
      playPokemonCry(firstMon.id);

      setTimeout(() => {
        const playerMon = team[firstAliveIndex];
        setBattleDialogue(`Go! ${playerMon.nickname.toUpperCase()}!`);
        pushLog(`Trainer ${trainer.name} sent out ${playerMon.nickname}!`);
        playPokemonCry(playerMon.id);

        setTimeout(() => {
          setBattleDialogue(`What will ${playerMon.nickname.toUpperCase()} do?`);
          setBattleSubMenu("MENU");
        }, 1100);
      }, 1400);
    }, 2400);
  }

  // ------------------------------------------------------
  // 2. TURN-BASED COMBAT INITIATIVE & MOVE EXECUTION
  // ------------------------------------------------------
  function handlePlayerSelectMove(move) {
    if (battleSubMenu === "BUSY" || !activePlayerMon || !activeLeaderMon) return;

    if (move.currentPp <= 0) {
      setBattleDialogue("There is no PP left for this move!");
      return;
    }

    // Deduct PP
    move.currentPp -= 1;
    setBattleSubMenu("BUSY");

    const playerSpeed = activePlayerMon.speed || 45;
    const leaderSpeed = activeLeaderMon.speed || 40;
    const playerFirst = playerSpeed >= leaderSpeed;

    if (playerFirst) {
      executePlayerAttack(move, (leaderStillAlive) => {
        if (leaderStillAlive) {
          executeLeaderAttack(() => {
            setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
            setBattleSubMenu("MENU");
          });
        }
      });
    } else {
      executeLeaderAttack(() => {
        // Check if player survived
        if ((activePlayerMon.currentHp || 0) > 0) {
          executePlayerAttack(move, () => {
            setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
            setBattleSubMenu("MENU");
          });
        }
      });
    }
  }

  // 2a. Player Attack Phase
  function executePlayerAttack(move, onComplete) {
    if (!activePlayerMon || !activeLeaderMon) return;

    setBattleDialogue(`${activePlayerMon.nickname.toUpperCase()} used ${move.name.toUpperCase()}!`);
    pushLog(`${activePlayerMon.nickname} used ${move.name}!`);
    setPlayerAnim("anim-player-lunge");
    playAttackWhooshSound();

    setTimeout(() => {
      setPlayerAnim("");

      // Calculate Damage
      const isCrit = Math.random() < 0.09;
      const typeMult = getTypeDamageMultiplier(move.type, activeLeaderMon.types);
      const baseAtk = activePlayerMon.attack || 40;
      const leaderDef = activeLeaderMon.defense || 38;

      const baseDmg =
        Math.floor(
          (((2 * activePlayerMon.level) / 5 + 2) * move.power * (baseAtk / leaderDef)) / 50
        ) + 2;
      const variance = 0.85 + Math.random() * 0.3;
      const finalDmg = Math.max(
        1,
        Math.floor(baseDmg * (isCrit ? 1.5 : 1.0) * typeMult * variance)
      );

      // Trigger Visual Hit FX on Leader Mon
      setSlashVfxOnLeader(true);
      setLeaderAnim("anim-wild-hit");
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

      setLeaderDamagePopup({ damage: finalDmg, isCrit, isSuper: typeMult > 1 });

      const nextLeaderHp = Math.max(0, activeLeaderMon.currentHp - finalDmg);
      const updatedRoster = [...leaderRoster];
      updatedRoster[activeLeaderIndex] = {
        ...activeLeaderMon,
        currentHp: nextLeaderHp,
      };
      setLeaderRoster(updatedRoster);

      setTimeout(() => {
        setSlashVfxOnLeader(false);
        setLeaderAnim("");
        setScreenShake(false);
        setLeaderDamagePopup(null);

        if (typeMult > 1) {
          setBattleDialogue("It's super effective!");
          pushLog("It's super effective!");
        } else if (typeMult < 1 && typeMult > 0) {
          setBattleDialogue("It's not very effective...");
          pushLog("It's not very effective...");
        } else if (isCrit) {
          setBattleDialogue("A critical hit!");
          pushLog("A critical hit!");
        } else {
          setBattleDialogue(`Leader's ${activeLeaderMon.nickname.toUpperCase()} took ${finalDmg} damage!`);
        }

        setTimeout(() => {
          if (nextLeaderHp <= 0) {
            handleLeaderPokemonFaint(onComplete);
          } else {
            if (onComplete) onComplete(true);
          }
        }, 1100);
      }, 700);
    }, 450);
  }

  // 2b. Gym Leader Counter-Attack Phase
  function executeLeaderAttack(onComplete) {
    if (!activeLeaderMon || !activePlayerMon) return;

    // Pick a move from leader's pool
    const chosenMove = pickGymLeaderMove(activeLeaderMon.moves);

    setBattleDialogue(`Leader's ${activeLeaderMon.nickname.toUpperCase()} used ${chosenMove.name.toUpperCase()}!`);
    pushLog(`Leader's ${activeLeaderMon.nickname} used ${chosenMove.name}!`);

    setLeaderAnim("anim-wild-lunge-forward");
    playAttackWhooshSound();

    setTimeout(() => {
      setLeaderAnim("");

      // Damage calculation
      const isCrit = Math.random() < 0.08;
      const typeMult = getTypeDamageMultiplier(chosenMove.type, activePlayerMon.types);
      const leaderAtk = activeLeaderMon.attack || 40;
      const playerDef = activePlayerMon.defense || 40;

      const baseDmg =
        Math.floor(
          (((2 * activeLeaderMon.level) / 5 + 2) * chosenMove.power * (leaderAtk / playerDef)) / 50
        ) + 2;
      const variance = 0.85 + Math.random() * 0.3;
      const finalDmg = Math.max(
        1,
        Math.floor(baseDmg * (isCrit ? 1.5 : 1.0) * typeMult * variance)
      );

      // Hit visual on player
      setSlashVfxOnPlayer(true);
      setPlayerAnim("anim-player-hit");
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

      setPlayerDamagePopup({ damage: finalDmg, isCrit, isSuper: typeMult > 1 });

      const nextPlayerHp = Math.max(0, (activePlayerMon.currentHp || 0) - finalDmg);
      updatePokemonHp(activePlayerMon.instanceId, nextPlayerHp);

      setTimeout(() => {
        setSlashVfxOnPlayer(false);
        setPlayerAnim("");
        setScreenShake(false);
        setPlayerDamagePopup(null);

        if (typeMult > 1) {
          setBattleDialogue("It's super effective against your Pokémon!");
          pushLog("Super effective on your Pokémon!");
        } else if (isCrit) {
          setBattleDialogue("A critical hit landed on your Pokémon!");
        } else {
          setBattleDialogue(`${activePlayerMon.nickname.toUpperCase()} took ${finalDmg} damage!`);
        }

        setTimeout(() => {
          if (nextPlayerHp <= 0) {
            handlePlayerPokemonFaint();
          } else {
            if (onComplete) onComplete();
          }
        }, 1100);
      }, 700);
    }, 450);
  }

  // ------------------------------------------------------
  // 3. FAINT & ROTATION HANDLING (Gym Leader & Player)
  // ------------------------------------------------------
  function handleLeaderPokemonFaint() {
    setLeaderAnim("anim-faint-slide");
    playFaintSound();
    playPokemonCry(activeLeaderMon.id);
    setBattleDialogue(`Leader's ${activeLeaderMon.nickname.toUpperCase()} fainted!`);
    pushLog(`Leader's ${activeLeaderMon.nickname} fainted!`);

    setTimeout(() => {
      setLeaderAnim("");
      const nextIndex = activeLeaderIndex + 1;

      if (nextIndex < leaderRoster.length) {
        // Leader has another Pokémon!
        const nextMon = leaderRoster[nextIndex];
        const isLastMon = nextIndex === leaderRoster.length - 1;

        if (isLastMon && selectedLeader.dialogue.lastPokemon) {
          setBattleDialogue(`${selectedLeader.name}: "${selectedLeader.dialogue.lastPokemon}"`);
          pushLog(`${selectedLeader.name}: "${selectedLeader.dialogue.lastPokemon}"`);
        } else {
          setBattleDialogue(`${selectedLeader.name}: "Good effort, ${activeLeaderMon.nickname}! Go, ${nextMon.nickname.toUpperCase()}!"`);
          pushLog(`${selectedLeader.name} sent out ${nextMon.nickname}!`);
        }

        setTimeout(() => {
          setActiveLeaderIndex(nextIndex);
          playPokemonCry(nextMon.id);
          setBattleDialogue(`Gym Leader ${selectedLeader.name} sent out ${nextMon.nickname.toUpperCase()}!`);

          setTimeout(() => {
            setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
            setBattleSubMenu("MENU");
          }, 1200);
        }, 1600);
      } else {
        // ALL LEADER POKÉMON FAINTED -> GYM VICTORY!
        handleGymVictory();
      }
    }, 1100);
  }

  function handlePlayerPokemonFaint() {
    setPlayerAnim("anim-faint-slide");
    playFaintSound();
    playPokemonCry(activePlayerMon.id);
    setBattleDialogue(`${activePlayerMon.nickname.toUpperCase()} fainted!`);
    pushLog(`${activePlayerMon.nickname} fainted!`);

    setTimeout(() => {
      setPlayerAnim("");

      // Check if player has other conscious Pokémon in party
      const nextAvailableIndex = team.findIndex(
        (p, idx) => idx !== activePartyIndex && (p.currentHp || 0) > 0
      );

      if (nextAvailableIndex !== -1) {
        setBattleDialogue(`Choose your next Pokémon to send into battle!`);
        setBattleSubMenu("SWITCH");
      } else {
        // ALL PLAYER POKÉMON FAINTED -> BLACKOUT / DEFEAT
        setBattleDialogue(`${trainer.name} is out of usable Pokémon! ${trainer.name} blacked out!`);
        pushLog(`${trainer.name} lost the Gym Battle!`);

        setTimeout(() => {
          alert(`All your Pokémon fainted! You rushed back to the Pokémon Center to recover.`);
          healAllPokemon();
          setViewMode("CIRCUIT");
          setBattleSubMenu("MENU");
        }, 2200);
      }
    }, 1200);
  }

  // ------------------------------------------------------
  // 4. GYM VICTORY & BADGE AWARD CEREMONY
  // ------------------------------------------------------
  function handleGymVictory() {
    const isNewBadge = !hasBadge(selectedLeader.badge.id);
    awardBadge(selectedLeader.badge.id, selectedLeader.prizeMoney);
    playCatchSuccessJingle();

    const expTotal = selectedLeader.team.length * 190;
    const leveledUp = givePartyExp(expTotal);

    setVictoryData({
      leader: selectedLeader,
      badge: selectedLeader.badge,
      isNewBadge,
      prizeMoney: selectedLeader.prizeMoney,
      expGained: expTotal,
      leveledUp,
    });

    setBattleDialogue(`${selectedLeader.name}: "${selectedLeader.dialogue.defeat}"`);
    pushLog(`${trainer.name} defeated Gym Leader ${selectedLeader.name}!`);

    setTimeout(() => {
      setViewMode("VICTORY_MODAL");
    }, 1800);
  }

  // ------------------------------------------------------
  // 5. IN-BATTLE ACTIONS: SWITCH & USE POTION & NO-STEAL RULE
  // ------------------------------------------------------
  function handleSwitchPokemon(newIndex) {
    if (newIndex === activePartyIndex) {
      setBattleDialogue("That Pokémon is already in battle!");
      return;
    }

    const targetMon = team[newIndex];
    if (!targetMon || (targetMon.currentHp || 0) <= 0) {
      setBattleDialogue("That Pokémon has no energy left to battle!");
      return;
    }

    setBattleSubMenu("BUSY");
    setBattleDialogue(`Come back, ${activePlayerMon.nickname}! Go, ${targetMon.nickname.toUpperCase()}!`);
    pushLog(`${trainer.name} switched to ${targetMon.nickname}!`);
    setActivePartyIndex(newIndex);
    playPokemonCry(targetMon.id);

    // Opponent gets a free attack on switch turn if opponent is alive
    setTimeout(() => {
      if (activeLeaderMon && activeLeaderMon.currentHp > 0) {
        executeLeaderAttack(() => {
          setBattleDialogue(`What will ${targetMon.nickname.toUpperCase()} do?`);
          setBattleSubMenu("MENU");
        });
      } else {
        setBattleDialogue(`What will ${targetMon.nickname.toUpperCase()} do?`);
        setBattleSubMenu("MENU");
      }
    }, 1200);
  }

  function handleUseBagItem(itemKey) {
    // Official Pokémon Rule: Cannot throw Poké Balls at Gym Leaders!
    if (itemKey.includes("ball")) {
      setBattleDialogue(`${selectedLeader.name} blocked the Poké Ball! Don't be a thief!`);
      pushLog(`${selectedLeader.name} blocked the Poké Ball!`);
      setBattleSubMenu("MENU");
      return;
    }

    // Medicine / Potions
    if (itemKey.includes("potion") || itemKey === "fresh-water") {
      const result = applyItemToPokemon(itemKey, activePlayerMon.instanceId);
      setBattleDialogue(result.message);
      pushLog(result.message);
      setBattleSubMenu("BUSY");

      setTimeout(() => {
        // Gym Leader attacks after potion use
        executeLeaderAttack(() => {
          setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
          setBattleSubMenu("MENU");
        });
      }, 1000);
      return;
    }

    setBattleDialogue("You cannot use that item in an official Gym match!");
  }

  function handleForfeitBattle() {
    const confirmForfeit = window.confirm(
      "Are you sure you want to forfeit this Gym Match? You will return to the Gym Lobby."
    );
    if (confirmForfeit) {
      setViewMode("CIRCUIT");
      setBattleSubMenu("MENU");
    }
  }

  // Active Moves with fallback
  const playerMoves = activePlayerMon?.moves || [
    { name: "Tackle", type: "normal", power: 40, maxPp: 35, currentPp: 35 },
    { name: "Quick Attack", type: "normal", power: 40, maxPp: 30, currentPp: 30 },
  ];

  // ========================================================
  // RENDER VIEW 1: KANTO GYM CIRCUIT LOBBY
  // ========================================================
  if (viewMode === "CIRCUIT") {
    const earnedCount = KANTO_GYM_LEADERS.filter((l) => hasBadge(l.badge.id)).length;

    return (
      <div className="gym-circuit-container">
        {toastMessage && <div className="toast-notification">{toastMessage}</div>}

        {/* Hero Header */}
        <div className="gym-hero-banner">
          <div className="gym-hero-badge-pill">
            <IconSwords size={16} />
            <span>Kanto Pokémon League Circuit</span>
          </div>
          <h1 className="gym-hero-title">Official Gym Leader Challenge</h1>
          <p className="gym-hero-subtitle">
            Defeat all 8 Gym Leaders, collect the official Kanto Badges, and qualify
            for the Pokémon League Championship at the Indigo Plateau!
          </p>

          {/* League Progress Bar */}
          <div className="gym-progress-card">
            <div className="gym-progress-header">
              <span className="progress-label">Kanto League Badges</span>
              <span className="progress-counter">
                <strong>{earnedCount}</strong> / 8 Badges Earned
              </span>
            </div>
            <div className="gym-progress-track">
              <div
                className="gym-progress-fill"
                style={{ width: `${(earnedCount / 8) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 8 Gym Leaders Grid */}
        <div className="gym-leaders-grid">
          {KANTO_GYM_LEADERS.map((leader, index) => {
            const isEarned = hasBadge(leader.badge.id);
            const isPreviousEarned = index === 0 || hasBadge(KANTO_GYM_LEADERS[index - 1].badge.id);
            const isCurrentTarget = !isEarned && isPreviousEarned;

            return (
              <div
                key={leader.id}
                className={`gym-leader-card ${
                  isEarned
                    ? "card-badge-earned"
                    : isCurrentTarget
                    ? "card-current-target"
                    : "card-locked-circuit"
                }`}
              >
                {/* Header Strip */}
                <div
                  className="leader-card-header"
                  style={{
                    background: `linear-gradient(135deg, ${leader.themeColor}33, transparent)`,
                    borderBottom: `2px solid ${leader.themeColor}55`,
                  }}
                >
                  <div className="leader-order-tag">Gym #{leader.order}</div>
                  <TypeBadge type={leader.specialtyType} size="sm" />
                </div>

                {/* Leader Portrait & Badge Preview */}
                <div className="leader-portrait-box">
                  <div className="leader-badge-display">
                    <GymBadgeIcon
                      badgeId={leader.badge.id}
                      size={44}
                      isLocked={!isEarned}
                    />
                    <span className="badge-preview-name">{leader.badge.name}</span>
                  </div>

                  <div className="leader-sprite-wrapper">
                    <img
                      src={leader.spriteUrl}
                      alt={leader.name}
                      className="leader-showdown-sprite"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Leader Meta */}
                <div className="leader-meta-content">
                  <h3 className="leader-name">{leader.name}</h3>
                  <p className="leader-title">{leader.title}</p>
                  <span className="leader-city">{leader.city}</span>

                  <div className="leader-specs-row">
                    <div className="spec-item">
                      <span className="spec-label">Level</span>
                      <span className="spec-val">{leader.recommendedLevel}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Prize</span>
                      <span className="spec-val prize-val">₽ {leader.prizeMoney.toLocaleString()}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Team</span>
                      <span className="spec-val">{leader.team.length} Pokémon</span>
                    </div>
                  </div>

                  {/* Intro Quote */}
                  <blockquote className="leader-quote">
                    "{leader.dialogue.intro}"
                  </blockquote>

                  {/* Action Button */}
                  <div className="leader-action-box">
                    {isEarned ? (
                      <button
                        type="button"
                        onClick={() => handleSelectLeader(leader)}
                        className="btn-gym-action btn-gym-rematch"
                      >
                        <IconSparkles size={16} />
                        <span>Rematch Gym Leader</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectLeader(leader)}
                        className="btn-gym-action btn-gym-challenge"
                      >
                        <IconSwords size={16} />
                        <span>Challenge {leader.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER VIEW 2: DRAMATIC VS SCREEN ANIME CLASH
  // ========================================================
  if (viewMode === "VS_INTRO" && selectedLeader) {
    return (
      <div className="gym-vs-screen-overlay">
        <div className="vs-screen-container">
          {/* Left Player Side */}
          <div className="vs-half vs-player-side">
            <div className="vs-trainer-info">
              <span className="vs-tag">Challenger</span>
              <h2 className="vs-name">{trainer.name}</h2>
              <div className="vs-team-preview">
                {team.map((mon) => (
                  <img
                    key={mon.instanceId}
                    src={mon.sprites.animated || mon.sprites.front}
                    alt={mon.nickname}
                    className="vs-party-icon"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Giant Clashing VS Badge */}
          <div className="vs-center-emblem">
            <div className="vs-lightning-effect"></div>
            <span className="vs-text">VS</span>
            <div className="vs-subtext">{selectedLeader.city.toUpperCase()}</div>
          </div>

          {/* Right Gym Leader Side */}
          <div
            className="vs-half vs-leader-side"
            style={{
              background: `linear-gradient(135deg, ${selectedLeader.themeColor}44, #0f172a 90%)`,
            }}
          >
            <div className="vs-leader-info">
              <span className="vs-tag">Gym Leader</span>
              <h2 className="vs-name">{selectedLeader.name}</h2>
              <p className="vs-title">{selectedLeader.title}</p>
              <div className="vs-badge-slot">
                <GymBadgeIcon badgeId={selectedLeader.badge.id} size={50} />
              </div>
            </div>
            <img
              src={selectedLeader.spriteUrl}
              alt={selectedLeader.name}
              className="vs-leader-full-sprite"
            />
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER VIEW 3: MULTI-POKÉMON FACE-TO-FACE BATTLE SCENE
  // ========================================================
  if (viewMode === "BATTLE" && selectedLeader && activePlayerMon && activeLeaderMon) {
    const playerHpPercent = Math.max(
      0,
      Math.min(100, ((activePlayerMon.currentHp || 0) / activePlayerMon.maxHp) * 100)
    );
    const leaderHpPercent = Math.max(
      0,
      Math.min(100, (activeLeaderMon.currentHp / activeLeaderMon.maxHp) * 100)
    );

    return (
      <div className={`gym-battle-container ${screenShake ? "camera-screen-shake" : ""}`}>
        {/* Top Arena HUD Bar */}
        <div className="gym-top-match-bar">
          <div className="match-gym-title">
            <GymBadgeIcon badgeId={selectedLeader.badge.id} size={24} />
            <span>
              {selectedLeader.city} Gym &bull; Leader {selectedLeader.name}
            </span>
          </div>

          <button
            type="button"
            onClick={handleForfeitBattle}
            className="btn-gym-forfeit"
            title="Surrender and return to Gym Lobby"
          >
            Forfeit Match
          </button>
        </div>

        {/* 3D Battle Arena Environment */}
        <BattleEnvironment biomeId={selectedLeader.arenaTheme || "gym-rock"}>
          {/* ==================================================== */}
          {/* OPPONENT SIDE (GYM LEADER POKÉMON + LEADER HUD) */}
          {/* ==================================================== */}
          <div className="battle-opponent-anchor">
            {/* Gym Leader Multi-Pokémon Floating HUD */}
            <div className="gym-leader-hud-card">
              <div className="hud-header-row">
                <div className="hud-name-box">
                  <span className="hud-pokemon-name">
                    {capitalize(activeLeaderMon.name)}
                  </span>
                  <span className="hud-pokemon-level">Lv.{activeLeaderMon.level}</span>
                </div>
                {/* 6 Pokéballs Roster Status */}
                <div className="leader-party-balls-row" title="Gym Leader Reserve Pokémon">
                  {leaderRoster.map((mon, idx) => (
                    <span
                      key={idx}
                      className={`ball-dot ${
                        mon.currentHp <= 0
                          ? "ball-fainted"
                          : idx === activeLeaderIndex
                          ? "ball-active"
                          : "ball-alive"
                      }`}
                    >
                      ●
                    </span>
                  ))}
                </div>
              </div>

              {/* HP Bar */}
              <div className="hud-hp-track">
                <div
                  className={`hud-hp-fill ${
                    leaderHpPercent < 25
                      ? "hp-critical"
                      : leaderHpPercent < 50
                      ? "hp-warning"
                      : "hp-healthy"
                  }`}
                  style={{ width: `${leaderHpPercent}%` }}
                ></div>
              </div>

              <div className="hud-sub-stats">
                <div className="hud-type-pills">
                  {activeLeaderMon.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
                <span className="hud-hp-numbers">
                  {activeLeaderMon.currentHp} / {activeLeaderMon.maxHp} HP
                </span>
              </div>
            </div>

            {/* Gym Leader Pokémon 3D Pedestal & Sprite */}
            <BattlePedestal biomeId={selectedLeader.arenaTheme || "gym-rock"} isPlayer={false}>
              <div className={`wild-sprite-anchor ${leaderAnim}`}>
                {/* Slash VFX Hit */}
                {slashVfxOnLeader && <div className="vfx-slash-energy"></div>}

                {/* Floating Damage Popup */}
                {leaderDamagePopup && (
                  <div
                    className={`damage-popup-text ${
                      leaderDamagePopup.isCrit ? "popup-crit" : ""
                    } ${leaderDamagePopup.isSuper ? "popup-super" : ""}`}
                  >
                    -{leaderDamagePopup.damage}
                  </div>
                )}

                <img
                  src={getAnimatedSpriteUrl(activeLeaderMon.id)}
                  alt={activeLeaderMon.name}
                  className="battle-actor-sprite sprite-leader-active"
                />
              </div>
            </BattlePedestal>
          </div>

          {/* ==================================================== */}
          {/* PLAYER SIDE (OVER-THE-SHOULDER BACK SPRITE + HUD) */}
          {/* ==================================================== */}
          <div className="battle-player-anchor">
            {/* Player Floating HUD */}
            <div className="player-hud-card">
              <div className="hud-header-row">
                <div className="hud-name-box">
                  <span className="hud-pokemon-name">
                    {activePlayerMon.nickname}
                  </span>
                  <span className="hud-pokemon-level">Lv.{activePlayerMon.level}</span>
                </div>
                <div className="player-party-balls-row" title="Your Active Party Reserves">
                  {team.map((mon, idx) => (
                    <span
                      key={mon.instanceId}
                      className={`ball-dot ${
                        (mon.currentHp || 0) <= 0
                          ? "ball-fainted"
                          : idx === activePartyIndex
                          ? "ball-active"
                          : "ball-alive"
                      }`}
                    >
                      ●
                    </span>
                  ))}
                </div>
              </div>

              {/* HP Bar */}
              <div className="hud-hp-track">
                <div
                  className={`hud-hp-fill ${
                    playerHpPercent < 25
                      ? "hp-critical"
                      : playerHpPercent < 50
                      ? "hp-warning"
                      : "hp-healthy"
                  }`}
                  style={{ width: `${playerHpPercent}%` }}
                ></div>
              </div>

              <div className="hud-sub-stats">
                <div className="hud-type-pills">
                  {activePlayerMon.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
                <span className="hud-hp-numbers">
                  {activePlayerMon.currentHp} / {activePlayerMon.maxHp} HP
                </span>
              </div>
            </div>

            {/* Player Pokémon 3D Pedestal & Showdown Back Sprite */}
            <BattlePedestal biomeId={selectedLeader.arenaTheme || "gym-rock"} isPlayer={true}>
              <div className={`player-sprite-anchor ${playerAnim}`}>
                {/* Slash Hit on Player */}
                {slashVfxOnPlayer && <div className="vfx-slash-energy"></div>}

                {/* Floating Damage Popup on Player */}
                {playerDamagePopup && (
                  <div
                    className={`damage-popup-text ${
                      playerDamagePopup.isCrit ? "popup-crit" : ""
                    }`}
                  >
                    -{playerDamagePopup.damage}
                  </div>
                )}

                <img
                  src={getAnimatedBackSpriteUrl(activePlayerMon.id)}
                  alt={activePlayerMon.name}
                  className="battle-actor-sprite sprite-player-back"
                />
              </div>
            </BattlePedestal>
          </div>
        </BattleEnvironment>

        {/* ==================================================== */}
        {/* RETRO ACTION DIALOGUE & 4-COMMAND RPG HUB */}
        {/* ==================================================== */}
        <div className="rpg-battle-bottom-deck">
          {/* Retro Narrative Dialogue Box */}
          <div className="rpg-dialogue-screen">
            <p className="rpg-narrative-text">{battleDialogue}</p>
          </div>

          {/* Action Command Hub */}
          <div className="rpg-command-deck">
            {/* SUB-MENU: 4 MAIN BUTTONS */}
            {battleSubMenu === "MENU" && (
              <div className="rpg-main-menu-grid">
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("FIGHT")}
                  className="rpg-cmd-btn btn-cmd-fight"
                >
                  <IconSwords size={20} />
                  <span>FIGHT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBattleSubMenu("BAG")}
                  className="rpg-cmd-btn btn-cmd-bag"
                >
                  <IconBackpack size={20} />
                  <span>BAG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBattleSubMenu("SWITCH")}
                  className="rpg-cmd-btn btn-cmd-party"
                >
                  <IconParty size={20} />
                  <span>POKÉMON</span>
                </button>

                <button
                  type="button"
                  onClick={handleForfeitBattle}
                  className="rpg-cmd-btn btn-cmd-run"
                >
                  <IconCross size={20} />
                  <span>FORFEIT</span>
                </button>
              </div>
            )}

            {/* SUB-MENU: FIGHT 4 MOVES */}
            {battleSubMenu === "FIGHT" && (
              <div className="rpg-moves-deck">
                <div className="moves-2x2-grid">
                  {playerMoves.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayerSelectMove(m)}
                      disabled={m.currentPp <= 0}
                      className="rpg-move-action-btn"
                    >
                      <div className="move-title-row">
                        <span className="move-btn-name">{m.name}</span>
                        <TypeBadge type={m.type} size="sm" />
                      </div>
                      <div className="move-pp-row">
                        <span className="move-pp-label">PP</span>
                        <span className={`move-pp-val ${m.currentPp === 0 ? "pp-empty" : ""}`}>
                          {m.currentPp} / {m.maxPp}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("MENU")}
                  className="btn-rpg-back-sub"
                >
                  &larr; Back
                </button>
              </div>
            )}

            {/* SUB-MENU: BAG (MEDICINE & NO-STEAL RULE) */}
            {battleSubMenu === "BAG" && (
              <div className="rpg-bag-deck">
                <div className="bag-items-list-row">
                  {Object.entries(inventory)
                    .filter(([, qty]) => qty > 0)
                    .map(([key, qty]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleUseBagItem(key)}
                        className="bag-item-action-pill"
                      >
                        <span className="bag-item-name">{capitalize(key.replace(/-/g, " "))}</span>
                        <span className="bag-item-qty">x{qty}</span>
                      </button>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("MENU")}
                  className="btn-rpg-back-sub"
                >
                  &larr; Back
                </button>
              </div>
            )}

            {/* SUB-MENU: MID-BATTLE PARTY SWITCH */}
            {battleSubMenu === "SWITCH" && (
              <div className="rpg-switch-deck">
                <div className="switch-team-scroll">
                  {team.map((mon, idx) => (
                    <button
                      key={mon.instanceId}
                      type="button"
                      onClick={() => handleSwitchPokemon(idx)}
                      disabled={idx === activePartyIndex || (mon.currentHp || 0) <= 0}
                      className={`switch-mon-card ${
                        idx === activePartyIndex ? "switch-mon-current" : ""
                      } ${(mon.currentHp || 0) <= 0 ? "switch-mon-fainted" : ""}`}
                    >
                      <img
                        src={mon.sprites.animated || mon.sprites.front}
                        alt={mon.nickname}
                        className="switch-mon-icon"
                      />
                      <div className="switch-mon-meta">
                        <span className="switch-mon-name">{mon.nickname}</span>
                        <span className="switch-mon-hp">
                          {mon.currentHp} / {mon.maxHp} HP
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("MENU")}
                  className="btn-rpg-back-sub"
                >
                  &larr; Back
                </button>
              </div>
            )}

            {/* SUB-MENU: BUSY ANIMATION WAIT */}
            {battleSubMenu === "BUSY" && (
              <div className="rpg-busy-indicator">
                <span className="busy-dot dot-1">●</span>
                <span className="busy-dot dot-2">●</span>
                <span className="busy-dot dot-3">●</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER VIEW 4: GOLD BADGE VICTORY CEREMONY MODAL
  // ========================================================
  if (viewMode === "VICTORY_MODAL" && victoryData) {
    return (
      <div className="gym-victory-modal-overlay">
        <div className="gym-victory-card">
          <div className="victory-confetti-sparkles">
            <IconSparkles size={28} className="confetti-icon icon-1" />
            <IconSparkles size={28} className="confetti-icon icon-2" />
          </div>

          {/* Glowing Animated Badge Icon */}
          <div className="victory-badge-presentation">
            <div className="badge-sunburst-halo"></div>
            <GymBadgeIcon badgeId={victoryData.badge.id} size={96} className="victory-spinning-badge" />
          </div>

          <span className="victory-kanto-pill">KANTO POKÉMON LEAGUE</span>
          <h2 className="victory-title">
            {victoryData.isNewBadge ? "BADGE EARNED!" : "VICTORY ACHIEVED!"}
          </h2>
          <h3 className="victory-badge-name">{victoryData.badge.name}</h3>

          <p className="victory-desc">{victoryData.badge.description}</p>

          <div className="victory-quote-card">
            <p className="quote-body">"{victoryData.leader.dialogue.defeat}"</p>
            <span className="quote-author">&mdash; Gym Leader {victoryData.leader.name}</span>
          </div>

          {/* Rewards Row */}
          <div className="victory-rewards-row">
            <div className="reward-pill">
              <IconCoin size={18} className="money-coin-svg" />
              <span>+₽ {victoryData.prizeMoney.toLocaleString()}</span>
            </div>
            <div className="reward-pill">
              <IconSparkles size={18} />
              <span>+{victoryData.expGained} EXP Shared</span>
            </div>
          </div>

          {/* Leveled Up Alerts */}
          {victoryData.leveledUp && victoryData.leveledUp.length > 0 && (
            <div className="victory-levelups-box">
              {victoryData.leveledUp.map((lvl, i) => (
                <div key={i} className="levelup-row">
                  <IconCheck size={14} />
                  <span>{lvl.name} grew to Level {lvl.newLevel}!</span>
                </div>
              ))}
            </div>
          )}

          <div className="victory-modal-actions">
            <button
              type="button"
              onClick={() => {
                setViewMode("CIRCUIT");
                setSelectedLeader(null);
                setVictoryData(null);
              }}
              className="btn-victory-confirm"
            >
              Return to Gym Circuit
            </button>
            <Link to="/team" className="btn-victory-badge-case">
              View Kanto Badge Case
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
