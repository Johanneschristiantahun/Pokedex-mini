// ========================================================
// PokéSphere Official Kanto Gym Leader Arena & Challenge Hub
// Face-to-Face POV Multi-Pokémon Trainer Battles,
// 8 Official Gym Leaders, Kanto Badges, and Victory Ceremonies
// ========================================================

import { useState, useRef } from "react";
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
  IconX,
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

// Elemental Move VFX Overlay Component
function ElementalVfxOverlay({ type }) {
  if (!type) return null;
  const t = type.toLowerCase();

  if (t === "fire") {
    return (
      <div className="elemental-vfx fire-vfx" aria-hidden="true">
        <span className="vfx-particle flame-1">🔥</span>
        <span className="vfx-particle flame-2">💥</span>
        <span className="vfx-particle flame-3">🔥</span>
      </div>
    );
  }
  if (t === "water") {
    return (
      <div className="elemental-vfx water-vfx" aria-hidden="true">
        <span className="vfx-particle water-1">🌊</span>
        <span className="vfx-particle water-2">💧</span>
        <span className="vfx-particle water-3">🌊</span>
      </div>
    );
  }
  if (t === "electric") {
    return (
      <div className="elemental-vfx electric-vfx" aria-hidden="true">
        <span className="vfx-particle spark-1">⚡</span>
        <span className="vfx-particle spark-2">⚡</span>
        <span className="vfx-particle spark-3">⚡</span>
      </div>
    );
  }
  if (t === "grass" || t === "bug") {
    return (
      <div className="elemental-vfx grass-vfx" aria-hidden="true">
        <span className="vfx-particle leaf-1">🍃</span>
        <span className="vfx-particle leaf-2">🌿</span>
        <span className="vfx-particle leaf-3">🍃</span>
      </div>
    );
  }
  if (t === "psychic" || t === "ghost") {
    return (
      <div className="elemental-vfx psychic-vfx" aria-hidden="true">
        <div className="psychic-ring ring-1"></div>
        <div className="psychic-ring ring-2"></div>
        <span className="vfx-particle psychic-orb">🔮</span>
      </div>
    );
  }
  if (t === "rock" || t === "ground") {
    return (
      <div className="elemental-vfx rock-vfx" aria-hidden="true">
        <span className="vfx-particle rock-1">🪨</span>
        <span className="vfx-particle rock-2">💥</span>
        <span className="vfx-particle rock-3">🪨</span>
      </div>
    );
  }
  if (t === "ice") {
    return (
      <div className="elemental-vfx ice-vfx" aria-hidden="true">
        <span className="vfx-particle ice-1">❄️</span>
        <span className="vfx-particle ice-2">✨</span>
        <span className="vfx-particle ice-3">❄️</span>
      </div>
    );
  }
  // Default / Normal / Fighting
  return (
    <div className="elemental-vfx normal-vfx" aria-hidden="true">
      <div className="vfx-slash-blade"></div>
    </div>
  );
}

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
  const [elementalVfx, setElementalVfx] = useState(null);
  const [leaderDamagePopup, setLeaderDamagePopup] = useState(null);
  const [playerDamagePopup, setPlayerDamagePopup] = useState(null);

  // Victory Rewards
  const [victoryData, setVictoryData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Intro transition timer ref
  const vsTimeoutRef = useRef(null);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function pushLog() {}

  // Active Leader Mon and Player Mon
  const activeLeaderMon = leaderRoster[activeLeaderIndex] || null;
  const activePlayerMon = team[activePartyIndex] || null;

  // ------------------------------------------------------
  // Battle Sequence Startup Helper
  // ------------------------------------------------------
  function startBattleSequence(leader, freshLeaderTeam, firstAliveIndex) {
    const targetLeader = leader || selectedLeader;
    const targetTeam = freshLeaderTeam || leaderRoster;
    const firstMon = targetTeam[0];
    const playerMon = team[firstAliveIndex !== undefined ? firstAliveIndex : activePartyIndex];

    setViewMode("BATTLE");
    setBattleSubMenu("BUSY");
    setBattleDialogue(`Gym Leader ${targetLeader.name} sent out ${firstMon.nickname.toUpperCase()}!`);
    pushLog(`Gym Leader ${targetLeader.name} sent out ${firstMon.nickname}!`);
    playPokemonCry(firstMon.id);

    setTimeout(() => {
      setBattleDialogue(`Go! ${playerMon.nickname.toUpperCase()}!`);
      pushLog(`Trainer ${trainer.name} sent out ${playerMon.nickname}!`);
      playPokemonCry(playerMon.id);

      setTimeout(() => {
        setBattleDialogue(`What will ${playerMon.nickname.toUpperCase()} do?`);
        setBattleSubMenu("MENU");
      }, 1100);
    }, 1400);
  }

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

    if (vsTimeoutRef.current) clearTimeout(vsTimeoutRef.current);
    vsTimeoutRef.current = setTimeout(() => {
      startBattleSequence(leader, freshLeaderTeam, firstAliveIndex);
    }, 2800);
  }

  function handleSkipVsIntro() {
    if (vsTimeoutRef.current) clearTimeout(vsTimeoutRef.current);
    startBattleSequence(selectedLeader, leaderRoster, activePartyIndex);
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
    setElementalVfx({ target: "leader", type: move.type });
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
        setElementalVfx(null);
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

    setLeaderAnim("anim-wild-lunge");
    setElementalVfx({ target: "player", type: chosenMove.type });
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
        setElementalVfx(null);
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

    const wasFainted = (activePlayerMon?.currentHp || 0) <= 0;

    setBattleSubMenu("BUSY");
    setBattleDialogue(`Come back, ${activePlayerMon?.nickname || "partner"}! Go, ${targetMon.nickname.toUpperCase()}!`);
    pushLog(`${trainer.name} switched to ${targetMon.nickname}!`);
    setActivePartyIndex(newIndex);
    playPokemonCry(targetMon.id);

    // Opponent only gets a free attack on tactical switches, not when player was forced to switch after fainted
    setTimeout(() => {
      if (!wasFainted && activeLeaderMon && activeLeaderMon.currentHp > 0) {
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
  // RENDER VIEW 2: DRAMATIC VS SCREEN ANIME CLASH (ZERO OVERLAP)
  // ========================================================
  if (viewMode === "VS_INTRO" && selectedLeader) {
    return (
      <div className="gym-vs-screen-overlay">
        {/* Dynamic diagonal speedlines background */}
        <div className="vs-speedlines-bg" aria-hidden="true"></div>

        <div className="vs-screen-container">
          {/* ==================================================== */}
          {/* LEFT HALF: CHALLENGER (TRAINER RED)                  */}
          {/* ==================================================== */}
          <div className="vs-half vs-player-side">
            <div className="vs-half-inner">
              {/* Challenger Dossier Card */}
              <div className="vs-trainer-dossier-card">
                <div className="vs-role-badge challenger-role">
                  <span className="role-dot"></span>
                  <span>KANTO LEAGUE CHALLENGER</span>
                </div>
                <h2 className="vs-trainer-hero-name">{trainer.name || "Trainer Red"}</h2>
                <div className="vs-trainer-meta-row">
                  <span className="meta-tag">TRAINER ID: #00151</span>
                  <span className="meta-tag badges-held-tag">
                    {trainer.badges?.length || 0} / 8 BADGES
                  </span>
                </div>

                {/* Party Roster Display (6 slots) */}
                <div className="vs-party-showcase">
                  <span className="party-showcase-label">CHALLENGE TEAM</span>
                  <div className="party-icons-cluster">
                    {team.slice(0, 6).map((mon) => (
                      <div
                        key={mon.instanceId}
                        className="vs-party-slot"
                        title={`${mon.nickname} (Lv.${mon.level})`}
                      >
                        <img
                          src={mon.sprites?.animated || mon.sprites?.front}
                          alt={mon.nickname}
                          className="vs-party-slot-img"
                        />
                        <span className="vs-party-slot-lvl">Lv.{mon.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trainer Red Character Artwork */}
              <div className="vs-player-character-anchor">
                <img
                  src="https://play.pokemonshowdown.com/sprites/trainers/red.png"
                  alt="Trainer Red"
                  className="vs-player-hero-sprite"
                  onError={(e) => {
                    if (activePlayerMon) {
                      e.target.src = getAnimatedSpriteUrl(activePlayerMon.id);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* CENTER: 3D METALLIC GOLD ANIME "VS" EMBLEM & LIGHTNING */}
          {/* ==================================================== */}
          <div className="vs-center-emblem">
            <div className="vs-lightning-divider"></div>
            <div className="vs-clash-core">
              <span className="vs-lightning-spark spark-left">⚡</span>
              <div className="vs-letters-wrap">
                <span className="vs-letter-v">V</span>
                <span className="vs-letter-s">S</span>
              </div>
              <span className="vs-lightning-spark spark-right">⚡</span>
            </div>
            <div className="vs-arena-location-pill">
              <span>{selectedLeader.city.toUpperCase()} GYM</span>
            </div>
            {/* Interactive Skip / Fast Forward Button */}
            <button
              type="button"
              onClick={handleSkipVsIntro}
              className="btn-vs-skip-action"
              title="Skip intro and start battle immediately"
            >
              <span>START BATTLE ➔</span>
            </button>
          </div>

          {/* ==================================================== */}
          {/* RIGHT HALF: OFFICIAL KANTO GYM LEADER                */}
          {/* ==================================================== */}
          <div
            className="vs-half vs-leader-side"
            style={{
              "--leader-theme": selectedLeader.themeColor,
            }}
          >
            <div className="vs-half-inner vs-leader-inner">
              {/* Leader Dossier Card (Left side of right half - NEVER OVERLAPPING SPRITE) */}
              <div className="vs-leader-dossier-card">
                <div className="vs-role-badge leader-role">
                  <span className="role-dot leader-dot"></span>
                  <span>
                    GYM #{selectedLeader.order} &bull; {selectedLeader.specialtyType.toUpperCase()} LEADER
                  </span>
                </div>
                <h2 className="vs-leader-hero-name">{selectedLeader.name}</h2>
                <p className="vs-leader-hero-title">{selectedLeader.title}</p>

                {/* Dedicated Badge Showcase Stand */}
                <div className="vs-badge-pedestal-mount">
                  <div className="badge-orbit-glow"></div>
                  <GymBadgeIcon badgeId={selectedLeader.badge.id} size={52} />
                  <div className="badge-pedestal-info">
                    <span className="badge-pedestal-award-label">SANCTIONED AWARD</span>
                    <span className="badge-pedestal-title">{selectedLeader.badge.name}</span>
                  </div>
                </div>

                <div className="vs-leader-quote-bubble">
                  <span>"{selectedLeader.dialogue.intro}"</span>
                </div>
              </div>

              {/* Gym Leader Full Character Sprite (Far Right of right half) */}
              <div className="vs-leader-character-anchor">
                <img
                  src={selectedLeader.spriteUrl}
                  alt={selectedLeader.name}
                  className="vs-leader-hero-sprite"
                />
              </div>
            </div>
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
      Math.min(100, Math.round(((activePlayerMon.currentHp || 0) / activePlayerMon.maxHp) * 100))
    );
    const leaderHpPercent = Math.max(
      0,
      Math.min(100, Math.round((activeLeaderMon.currentHp / activeLeaderMon.maxHp) * 100))
    );

    const playerHpColor =
      playerHpPercent > 50 ? "#22c55e" : playerHpPercent > 20 ? "#eab308" : "#ef4444";
    const leaderHpColor =
      leaderHpPercent > 50 ? "#22c55e" : leaderHpPercent > 20 ? "#eab308" : "#ef4444";

    const playerExpPercent = Math.min(
      100,
      Math.round(
        ((activePlayerMon.exp || 0) /
          (activePlayerMon.expToNextLevel || Math.pow(activePlayerMon.level + 1, 3))) *
          100
      )
    );

    // Available medicine in inventory
    const availableMedicine = Object.entries(inventory)
      .filter(([key, qty]) => qty > 0 && !key.includes("ball"))
      .map(([key, count]) => ({ key, count }));

    return (
      <div className="gym-battle-outer-wrap">
        <div
          className={`rpg-battle-arena-window gym-arena-theme ${
            screenShake ? "camera-screen-shake" : ""
          }`}
        >
          {/* Top Arena Header Bar */}
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
              title="Surrender and return to Gym Circuit Lobby"
            >
              Forfeit Match
            </button>
          </div>

          {/* 3D Battle Arena Environment */}
          <BattleEnvironment biomeId={selectedLeader.arenaTheme || "gym-rock"}>
            {/* ==================================================== */}
            {/* OPPONENT SIDE (GYM LEADER POKÉMON + LEADER HUD) */}
            {/* ==================================================== */}
            <div className="rpg-opponent-area">
              {/* Floating Gym Leader HUD */}
              <div className="rpg-hud-card wild-hud gym-hud-card">
                <div className="hud-gym-leader-sub">
                  Gym Leader {selectedLeader.name}
                </div>
                <div className="hud-header">
                  <span className="hud-name">
                    {capitalize(activeLeaderMon.nickname || activeLeaderMon.name)}
                  </span>
                  <span className="hud-level">Lv.{activeLeaderMon.level}</span>
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

                <div className="hud-types">
                  {activeLeaderMon.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>

                <div className="hud-hp-block">
                  <span className="hud-hp-label">HP</span>
                  <div className="hud-hp-track">
                    <div
                      className="hud-hp-fill"
                      style={{
                        width: `${leaderHpPercent}%`,
                        backgroundColor: leaderHpColor,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="hud-hp-number">
                  {activeLeaderMon.currentHp} / {activeLeaderMon.maxHp}
                </div>
              </div>

              {/* Gym Leader Pokémon 3D Pedestal & Sprite */}
              <BattlePedestal biomeId={selectedLeader.arenaTheme || "gym-rock"} isPlayer={false}>
                {/* Slash VFX Hit */}
                {slashVfxOnLeader && <div className="vfx-energy-slash"></div>}

                {/* Elemental Move Particle VFX */}
                {elementalVfx?.target === "leader" && (
                  <ElementalVfxOverlay type={elementalVfx.type} />
                )}

                {/* Floating Damage Popup */}
                {leaderDamagePopup && (
                  <div
                    className={`floating-damage-number ${
                      leaderDamagePopup.isCrit ? "crit-damage" : ""
                    } ${leaderDamagePopup.isSuper ? "super-damage" : ""}`}
                  >
                    {leaderDamagePopup.isCrit && <span className="crit-label">CRITICAL! </span>}
                    {leaderDamagePopup.isSuper && (
                      <span className="super-label">SUPER EFFECTIVE! </span>
                    )}
                    -{leaderDamagePopup.damage} HP
                  </div>
                )}

                <img
                  src={getAnimatedSpriteUrl(activeLeaderMon.id)}
                  alt={activeLeaderMon.name}
                  className={`wild-battler-sprite ${leaderAnim}`}
                  onError={(e) => {
                    e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${activeLeaderMon.id}.png`;
                  }}
                />
              </BattlePedestal>
            </div>

            {/* ==================================================== */}
            {/* PLAYER SIDE (OVER-THE-SHOULDER BACK SPRITE + HUD) */}
            {/* ==================================================== */}
            <div className="rpg-player-area">
              {/* Player Pokémon 3D Pedestal & Back Sprite */}
              <BattlePedestal biomeId={selectedLeader.arenaTheme || "gym-rock"} isPlayer={true}>
                {/* Slash Hit on Player */}
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

                <img
                  src={getAnimatedBackSpriteUrl(activePlayerMon.id)}
                  alt={activePlayerMon.name}
                  className={`player-battler-back-sprite ${playerAnim}`}
                  onError={(e) => {
                    e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${activePlayerMon.id}.png`;
                  }}
                />
              </BattlePedestal>

              {/* Player Floating HUD */}
              <div className="rpg-hud-card player-hud gym-hud-card">
                <div className="hud-header">
                  <span className="hud-name">{activePlayerMon.nickname}</span>
                  <span className="hud-level">Lv.{activePlayerMon.level}</span>
                </div>

                {/* 6 Party Balls Status */}
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

                <div className="hud-types">
                  {activePlayerMon.types?.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>

                <div className="hud-hp-block">
                  <span className="hud-hp-label">HP</span>
                  <div className="hud-hp-track">
                    <div
                      className="hud-hp-fill"
                      style={{
                        width: `${playerHpPercent}%`,
                        backgroundColor: playerHpColor,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="hud-hp-number">
                  {activePlayerMon.currentHp} / {activePlayerMon.maxHp}
                </div>

                {/* EXP Gauge */}
                <div className="hud-exp-row">
                  <span className="exp-label">EXP</span>
                  <div className="hud-exp-track">
                    <div
                      className="hud-exp-fill"
                      style={{ width: `${playerExpPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </BattleEnvironment>

          {/* ==================================================== */}
          {/* RETRO ACTION DIALOGUE BOX (Classic RPG Narration)        */}
          {/* ==================================================== */}
          <div className="rpg-dialogue-box-container">
            <div className="rpg-dialogue-text">
              <span className="dialogue-arrow">▶</span>{" "}
              {battleDialogue || `What will ${activePlayerMon.nickname.toUpperCase()} do?`}
            </div>
          </div>

          {/* ==================================================== */}
          {/* RPG COMMAND HUB & MENU SELECTION (4 Classic Commands)     */}
          {/* ==================================================== */}
          <div className="rpg-command-panel">
            {/* 1. Main 4 Commands Screen */}
            {battleSubMenu === "MENU" && (
              <div className="rpg-commands-grid">
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("FIGHT")}
                  className="rpg-cmd-btn cmd-fight"
                >
                  <IconSwords size={20} />
                  <span>FIGHT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBattleSubMenu("BAG")}
                  className="rpg-cmd-btn cmd-bag"
                >
                  <IconBackpack size={20} />
                  <span>BAG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBattleSubMenu("SWITCH")}
                  className="rpg-cmd-btn cmd-pokemon"
                >
                  <IconParty size={20} />
                  <span>POKÉMON</span>
                </button>

                <button
                  type="button"
                  onClick={handleForfeitBattle}
                  className="rpg-cmd-btn cmd-run"
                >
                  <IconCross size={20} />
                  <span>FORFEIT</span>
                </button>
              </div>
            )}

            {/* 2. Moves 2x2 Selection Grid with PP */}
            {battleSubMenu === "FIGHT" && (
              <div className="rpg-moves-wrapper">
                <div className="moves-2x2-grid">
                  {playerMoves.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlayerSelectMove(m)}
                      disabled={m.currentPp <= 0}
                      className={`rpg-move-btn ${m.currentPp <= 0 ? "move-no-pp" : ""}`}
                    >
                      <div className="move-name-row">
                        <span className="move-name">{m.name}</span>
                        <TypeBadge type={m.type} size="sm" />
                      </div>
                      <div className="move-stats-row">
                        <span className="move-power">PWR: {m.power}</span>
                        <span className="move-pp">
                          PP: <strong>{m.currentPp}</strong>/{m.maxPp}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("MENU")}
                  className="btn-cancel-moves"
                >
                  &lsaquo; Back to Commands
                </button>
              </div>
            )}

            {/* 3. In-Battle Bag Drawer (Medicine & No-Steal Rule) */}
            {battleSubMenu === "BAG" && (
              <div className="rpg-bag-drawer">
                <div className="bag-tabs-header">
                  <span>Available Medicine & Potions:</span>
                  <button
                    type="button"
                    onClick={() => setBattleSubMenu("MENU")}
                    className="btn-close-subdrawer"
                  >
                    <IconX size={16} />
                  </button>
                </div>
                <div className="bag-items-grid">
                  {availableMedicine.length === 0 ? (
                    <div className="empty-pocket-msg">No medicine or potions in Bag!</div>
                  ) : (
                    availableMedicine.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleUseBagItem(item.key)}
                        className="bag-item-card"
                      >
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.key}.png`}
                          alt={item.key}
                          className="item-sprite-sm"
                        />
                        <span className="item-label">
                          {capitalize(item.key.replace(/-/g, " "))}
                        </span>
                        <span className="item-qty">x{item.count}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. In-Battle Pokémon Switcher Drawer */}
            {battleSubMenu === "SWITCH" && (
              <div className="rpg-party-drawer">
                <div className="party-drawer-header">
                  <span>Select Pokémon to Send Out:</span>
                  {activePlayerMon?.currentHp > 0 && (
                    <button
                      type="button"
                      onClick={() => setBattleSubMenu("MENU")}
                      className="btn-close-subdrawer"
                    >
                      <IconX size={16} />
                    </button>
                  )}
                </div>
                <div className="party-members-grid">
                  {team.map((pokemon, idx) => {
                    const isCurrent = idx === activePartyIndex;
                    const isFainted = (pokemon.currentHp || 0) <= 0;
                    return (
                      <button
                        key={pokemon.instanceId}
                        type="button"
                        disabled={isCurrent || isFainted}
                        onClick={() => handleSwitchPokemon(idx)}
                        className={`party-switch-card ${isCurrent ? "current-leader" : ""} ${
                          isFainted ? "fainted-pokemon" : ""
                        }`}
                      >
                        <img
                          src={pokemon.sprites?.animated || pokemon.sprites?.front}
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

            {/* 5. Busy indicator */}
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
