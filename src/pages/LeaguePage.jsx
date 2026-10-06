// ========================================================
// PokéDex Mini Indigo Plateau & Pokémon League Championship
// 5-Chamber Gauntlet: Lorelei, Bruno, Agatha, Lance, & Champion Blue
// 8-Badge Victory Road Gatekeeper & Hall of Fame Induction
// ========================================================

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import { INDIGO_ELITE_FOUR } from "../data/leagueTrainers.js";
import GymBadgeIcon from "../components/GymBadgeIcons.jsx";
import {
  BattleEnvironment,
  BattlePedestal,
  ElementalVfxOverlay,
} from "../components/BattleEnvironment.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import {
  IconTrophy,
  IconCrown,
  IconSwords,
  IconCross,
  IconBackpack,
  IconParty,
  IconCheck,
  IconCamera,
  IconArrowRight,
  IconShield,
} from "../components/Icons.jsx";
import { getTypeDamageMultiplier } from "../utils/typeEffectiveness.js";
import {
  capitalize,
  getAnimatedBackSpriteUrl,
  getAnimatedBackShinySpriteUrl,
  getAnimatedSpriteUrl,
  getAnimatedShinySpriteUrl,
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
  playEvolutionJingle,
} from "../utils/soundEffects.js";

const KANTO_BADGE_KEYS = [
  "boulder",
  "cascade",
  "thunder",
  "rainbow",
  "soul",
  "marsh",
  "volcano",
  "earth",
];

function pickTrainerMove(moves = []) {
  if (!moves || moves.length === 0) {
    return { name: "Tackle", type: "normal", power: 40 };
  }
  const idx = Math.floor(Math.random() * moves.length);
  return moves[idx] || moves[0];
}

export default function LeaguePage() {
  const {
    trainer,
    team,
    hasBadge,
    givePartyExp,
    updatePokemonHp,
    inventory,
    applyItemToPokemon,
    healAllPokemon,
    recordHallOfFame,
  } = useGame();

  // Badge Gate check
  const [devBypass, setDevBypass] = useState(false);
  const earnedBadgesCount = KANTO_BADGE_KEYS.filter((k) => hasBadge(k)).length;
  const isGateUnlocked = earnedBadgesCount >= 8 || devBypass;

  // Flow State: "LOBBY" | "VS_INTRO" | "BATTLE" | "CHAMBER_CLEARED" | "HALL_OF_FAME"
  const [flowState, setFlowState] = useState("LOBBY");
  const [chamberIndex, setChamberIndex] = useState(0);

  // Active Opponent
  const activeOpponent = INDIGO_ELITE_FOUR[chamberIndex] || INDIGO_ELITE_FOUR[0];

  // Battle Roster & State
  const [leaderRoster, setLeaderRoster] = useState([]);
  const [activeLeaderIndex, setActiveLeaderIndex] = useState(0);
  const [activePartyIndex, setActivePartyIndex] = useState(0);

  // Submenus
  const [battleSubMenu, setBattleSubMenu] = useState("MENU"); // MENU, FIGHT, BAG, SWITCH, BUSY
  const [battleDialogue, setBattleDialogue] = useState("");

  // Camera & Visuals
  const [cameraMode, setCameraMode] = useState("isometric");
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [turnNumber, setTurnNumber] = useState(1);

  // VFX
  const [playerAnim, setPlayerAnim] = useState("");
  const [leaderAnim, setLeaderAnim] = useState("");
  const [screenShake, setScreenShake] = useState(false);
  const [slashVfxOnLeader, setSlashVfxOnLeader] = useState(false);
  const [slashVfxOnPlayer, setSlashVfxOnPlayer] = useState(false);
  const [elementalVfx, setElementalVfx] = useState(null);
  const [leaderDamagePopup, setLeaderDamagePopup] = useState(null);
  const [playerDamagePopup, setPlayerDamagePopup] = useState(null);

  // Hall of Fame Slide index
  const [hofSlideIndex, setHofSlideIndex] = useState(0);

  const introTimeoutRef = useRef(null);

  // Active Battlers
  const activePlayerMon = team[activePartyIndex] || team[0];
  const activeLeaderMon = leaderRoster[activeLeaderIndex];

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    };
  }, []);

  // Cycle Hall of Fame Spotlight
  useEffect(() => {
    if (flowState !== "HALL_OF_FAME") return;
    const interval = setInterval(() => {
      setHofSlideIndex((prev) => (prev + 1) % (team.length || 1));
    }, 3200);
    return () => clearInterval(interval);
  }, [flowState, team.length]);

  // Start Chamber Challenge
  function handleEnterChamber(index) {
    const opp = INDIGO_ELITE_FOUR[index];
    if (!opp) return;

    // First find alive pokemon in team
    const firstAliveIndex = team.findIndex((p) => (p.currentHp || 0) > 0);
    if (firstAliveIndex === -1) {
      alert("All your Pokémon have fainted! Visit the Pokémon Center or use Revives first!");
      return;
    }

    setChamberIndex(index);
    setActivePartyIndex(firstAliveIndex);

    // Deep clone team roster
    const clonedRoster = opp.team.map((m) => ({
      ...m,
      currentHp: m.maxHp,
    }));
    setLeaderRoster(clonedRoster);
    setActiveLeaderIndex(0);
    setTurnNumber(1);

    // Start VS Intro
    setFlowState("VS_INTRO");
    playBattleStartSound();

    introTimeoutRef.current = setTimeout(() => {
      setFlowState("BATTLE");
      setBattleDialogue(opp.dialogue.intro);
      playPokemonCry(clonedRoster[0].id);
      setTimeout(() => {
        setBattleDialogue(`What will ${team[firstAliveIndex].nickname.toUpperCase()} do?`);
        setBattleSubMenu("MENU");
      }, 2500);
    }, 2800);
  }

  // Handle Player Selecting Move
  function handleSelectMove(move) {
    if (battleSubMenu === "BUSY" || !activePlayerMon || !activeLeaderMon) return;
    setBattleSubMenu("BUSY");

    const playerSpeed = activePlayerMon.speed || 45;
    const leaderSpeed = activeLeaderMon.speed || 45;
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
        if ((activePlayerMon.currentHp || 0) > 0) {
          executePlayerAttack(move, () => {
            setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
            setBattleSubMenu("MENU");
          });
        }
      });
    }
  }

  // Player Attack Phase
  function executePlayerAttack(move, onComplete) {
    if (!activePlayerMon || !activeLeaderMon) return;

    setBattleDialogue(`${activePlayerMon.nickname.toUpperCase()} used ${move.name.toUpperCase()}!`);
    setPlayerAnim(cameraMode === "isometric" ? "anim-isometric-lunge" : "anim-player-lunge");
    setElementalVfx({ target: "leader", type: move.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setPlayerAnim("");

      const isCrit = Math.random() < 0.1;
      const typeMult = getTypeDamageMultiplier(move.type, activeLeaderMon.types);
      const baseAtk = activePlayerMon.attack || 45;
      const leaderDef = activeLeaderMon.defense || 45;

      const baseDmg =
        Math.floor(
          (((2 * activePlayerMon.level) / 5 + 2) * move.power * (baseAtk / leaderDef)) / 50
        ) + 2;
      const variance = 0.85 + Math.random() * 0.3;
      const finalDmg = Math.max(1, Math.floor(baseDmg * (isCrit ? 1.5 : 1.0) * typeMult * variance));

      setSlashVfxOnLeader(true);
      setLeaderAnim("anim-wild-hit");
      setScreenShake(true);

      if (isCrit) playCriticalHitSound();
      else if (typeMult > 1) playSuperEffectiveSound();
      else if (typeMult < 1 && typeMult > 0) playNotVeryEffectiveSound();
      else playHitSound();

      setLeaderDamagePopup({ damage: finalDmg, isCrit, isSuper: typeMult > 1 });

      const nextLeaderHp = Math.max(0, activeLeaderMon.currentHp - finalDmg);
      const updated = [...leaderRoster];
      updated[activeLeaderIndex] = {
        ...activeLeaderMon,
        currentHp: nextLeaderHp,
      };
      setLeaderRoster(updated);

      setTimeout(() => {
        setSlashVfxOnLeader(false);
        setLeaderAnim("");
        setElementalVfx(null);
        setScreenShake(false);
        setLeaderDamagePopup(null);

        if (typeMult > 1) {
          setBattleDialogue("It's super effective!");
        } else if (typeMult < 1 && typeMult > 0) {
          setBattleDialogue("It's not very effective...");
        } else if (isCrit) {
          setBattleDialogue("A critical hit!");
        } else {
          setBattleDialogue(`${activeOpponent.name}'s ${activeLeaderMon.nickname.toUpperCase()} took ${finalDmg} damage!`);
        }

        setTimeout(() => {
          if (nextLeaderHp <= 0) {
            handleLeaderPokemonFaint(onComplete);
          } else {
            if (onComplete) onComplete(true);
          }
        }, 1000);
      }, 700);
    }, 450);
  }

  // Opponent Attack Phase
  function executeLeaderAttack(onComplete) {
    if (!activeLeaderMon || !activePlayerMon) return;

    const chosenMove = pickTrainerMove(activeLeaderMon.moves);
    setBattleDialogue(`${activeOpponent.name}'s ${activeLeaderMon.nickname.toUpperCase()} used ${chosenMove.name.toUpperCase()}!`);
    setLeaderAnim(cameraMode === "isometric" ? "anim-isometric-wild-lunge" : "anim-wild-lunge");
    setElementalVfx({ target: "player", type: chosenMove.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setLeaderAnim("");

      const isCrit = Math.random() < 0.08;
      const typeMult = getTypeDamageMultiplier(chosenMove.type, activePlayerMon.types);
      const leaderAtk = activeLeaderMon.attack || 50;
      const playerDef = activePlayerMon.defense || 45;

      const baseDmg =
        Math.floor(
          (((2 * activeLeaderMon.level) / 5 + 2) * chosenMove.power * (leaderAtk / playerDef)) / 50
        ) + 2;
      const variance = 0.85 + Math.random() * 0.3;
      const finalDmg = Math.max(1, Math.floor(baseDmg * (isCrit ? 1.5 : 1.0) * typeMult * variance));

      setSlashVfxOnPlayer(true);
      setPlayerAnim("anim-player-hit");
      setScreenShake(true);

      if (isCrit) playCriticalHitSound();
      else if (typeMult > 1) playSuperEffectiveSound();
      else if (typeMult < 1 && typeMult > 0) playNotVeryEffectiveSound();
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

        if (typeMult > 1) {
          setBattleDialogue("The foe's attack was super effective!");
        } else if (isCrit) {
          setBattleDialogue("A critical strike on your Pokémon!");
        } else {
          setBattleDialogue(`${activePlayerMon.nickname} took ${finalDmg} damage!`);
        }

        setTimeout(() => {
          if (nextPlayerHp <= 0) {
            handlePlayerPokemonFaint();
          } else {
            setTurnNumber((t) => t + 1);
            if (onComplete) onComplete();
          }
        }, 1000);
      }, 700);
    }, 450);
  }

  // Leader Pokemon Fainted
  function handleLeaderPokemonFaint(onComplete) {
    playFaintSound();
    setLeaderAnim("anim-wild-faint");
    setBattleDialogue(`${activeOpponent.name}'s ${activeLeaderMon.nickname.toUpperCase()} fainted!`);

    const expReward = Math.round(activeLeaderMon.level * 45);
    givePartyExp(expReward, activePlayerMon.instanceId);

    setTimeout(() => {
      setLeaderAnim("");

      // Find next alive pokemon in leader roster
      const nextAliveIndex = leaderRoster.findIndex(
        (m, idx) => idx > activeLeaderIndex && (m.currentHp || 0) > 0
      );

      if (nextAliveIndex !== -1) {
        setActiveLeaderIndex(nextAliveIndex);
        const nextMon = leaderRoster[nextAliveIndex];
        playPokemonCry(nextMon.id);

        const remainingCount = leaderRoster.filter((m) => (m.currentHp || 0) > 0).length;
        if (remainingCount === 1) {
          setBattleDialogue(`${activeOpponent.name}: "${activeOpponent.dialogue.lastPokemon}"`);
        } else {
          setBattleDialogue(`${activeOpponent.name} sent out ${nextMon.nickname.toUpperCase()}!`);
        }

        setTimeout(() => {
          setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
          setBattleSubMenu("MENU");
          if (onComplete) onComplete(false);
        }, 1800);
      } else {
        // Chamber Boss Defeated!
        handleChamberVictory();
      }
    }, 1200);
  }

  // Player Pokemon Fainted
  function handlePlayerPokemonFaint() {
    playFaintSound();
    setPlayerAnim("anim-player-faint");
    setBattleDialogue(`${activePlayerMon.nickname.toUpperCase()} fainted!`);

    setTimeout(() => {
      setPlayerAnim("");

      const nextAliveIndex = team.findIndex(
        (p, idx) => idx !== activePartyIndex && (p.currentHp || 0) > 0
      );

      if (nextAliveIndex !== -1) {
        setBattleDialogue("Choose your next Pokémon to send into battle!");
        setBattleSubMenu("SWITCH");
      } else {
        // Total wipeout
        setBattleDialogue(`All your Pokémon have fainted! You blacked out and returned to the Indigo reception...`);
        setTimeout(() => {
          healAllPokemon();
          setFlowState("LOBBY");
        }, 2600);
      }
    }, 1200);
  }

  // Chamber Defeated
  function handleChamberVictory() {
    setBattleDialogue(activeOpponent.dialogue.defeat);

    setTimeout(() => {
      if (chamberIndex < INDIGO_ELITE_FOUR.length - 1) {
        // Proceed to next chamber corridor
        playCatchSuccessJingle();
        setFlowState("CHAMBER_CLEARED");
      } else {
        // DEFEATED CHAMPION BLUE -> INDUCTION CEREMONY!
        playEvolutionJingle();
        recordHallOfFame(team);
        setFlowState("HALL_OF_FAME");
      }
    }, 2400);
  }

  // Switch Active Pokemon
  function handleSwitchPokemon(index) {
    if (index === activePartyIndex || (team[index].currentHp || 0) <= 0) return;
    setBattleSubMenu("BUSY");
    setActivePartyIndex(index);
    const chosen = team[index];
    playPokemonCry(chosen.id);
    setBattleDialogue(`Go, ${chosen.nickname.toUpperCase()}!`);

    setTimeout(() => {
      executeLeaderAttack(() => {
        setBattleDialogue(`What will ${chosen.nickname.toUpperCase()} do?`);
        setBattleSubMenu("MENU");
      });
    }, 1200);
  }

  // Use Item in Battle
  function handleUseBagItem(itemKey) {
    const res = applyItemToPokemon(itemKey, activePlayerMon.instanceId);
    if (!res.success) {
      alert(res.message);
      return;
    }
    setBattleSubMenu("BUSY");
    setBattleDialogue(`Used ${itemKey.replace(/-/g, " ").toUpperCase()}! ${res.message}`);

    setTimeout(() => {
      executeLeaderAttack(() => {
        setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
        setBattleSubMenu("MENU");
      });
    }, 1400);
  }

  // ========================================================
  // RENDER: 1. GATEKEEPER BARRIER (If < 8 Badges)
  // ========================================================
  if (!isGateUnlocked) {
    return (
      <div className="league-page-container">
        <div className="league-gate-hero">
          <div className="gatekeeper-avatar-wrap">
            <img
              src="https://play.pokemonshowdown.com/sprites/trainers/officer.png"
              alt="Victory Road Gatekeeper"
              className="gatekeeper-sprite"
            />
          </div>

          <div className="gate-dialogue-box">
            <span className="gatekeeper-name">Victory Road Guard</span>
            <p className="gatekeeper-speech">
              "HALT! Beyond this gate lies the sacred <strong>Indigo Plateau</strong>, where only the strongest trainers in Kanto may challenge the Elite Four and the Pokémon League Champion!
              <br /><br />
              Regulations state that only trainers who have conquered all <strong>8 Official Kanto Gym Badges</strong> may pass! You currently hold <strong>{earnedBadgesCount} / 8 Badges</strong>."
            </p>
          </div>

          {/* Badge Checklist */}
          <div className="gate-badge-matrix">
            <h3 className="gate-matrix-title">Required Kanto Badges:</h3>
            <div className="gate-badges-grid">
              {KANTO_BADGE_KEYS.map((bKey) => {
                const earned = hasBadge(bKey);
                return (
                  <div
                    key={bKey}
                    className={`gate-badge-slot ${earned ? "slot-earned" : "slot-locked"}`}
                  >
                    <GymBadgeIcon badgeId={bKey} isLocked={!earned} size={44} />
                    <span className="slot-badge-name">{capitalize(bKey)}</span>
                    <span className={`slot-status ${earned ? "status-ok" : "status-no"}`}>
                      {earned ? "Earned" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gate-action-buttons">
            <Link to="/gym" className="btn-return-gyms">
              <IconSwords size={18} />
              <span>Challenge Missing Gym Leaders ({8 - earnedBadgesCount} Remaining)</span>
            </Link>

            {/* Dev bypass for rapid testing */}
            <button
              type="button"
              onClick={() => setDevBypass(true)}
              className="btn-dev-bypass"
              title="Tester Mode: Bypass gatekeeper check to test Elite Four and Hall of Fame directly"
            >
              <IconShield size={16} />
              <span>Bypass Gatekeeper (Dev Pass for Review)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: 2. HALL OF FAME INDUCTION CEREMONY
  // ========================================================
  if (flowState === "HALL_OF_FAME") {
    const featuredMon = team[hofSlideIndex] || team[0];

    return (
      <div className="league-page-container">
        <div className="hall-of-fame-ceremony">
          {/* Golden Celebration Aura */}
          <div className="hof-gold-vortex"></div>

          <div className="hof-header-banner">
            <div className="hof-crown-badge">
              <IconCrown size={36} />
            </div>
            <h1 className="hof-title">KANTO HALL OF FAME</h1>
            <p className="hof-subtitle">
              New League Champion Crowned: <strong>{trainer.name.toUpperCase()}</strong>
            </p>
          </div>

          {/* Professor Oak Commendation */}
          <div className="oak-commendation-card">
            <img
              src="https://play.pokemonshowdown.com/sprites/trainers/oak.png"
              alt="Professor Oak"
              className="oak-sprite"
            />
            <div className="oak-speech-wrap">
              <span className="oak-name">Professor Oak</span>
              <p className="oak-quote">
                "{trainer.name}! You did it! You have climbed to the pinnacle of Pokémon training! Your passion, resilience, and the deep bond with your Pokémon have triumphed over the Elite Four and the Champion! Let your names be engraved here for all eternity!"
              </p>
            </div>
          </div>

          {/* Cycling Pedestal of Champions */}
          {featuredMon && (
            <div className="hof-pedestal-chamber">
              <div className="hof-spotlight"></div>
              <div className="hof-pedestal-platform">
                <img
                  src={
                    featuredMon.isShiny
                      ? getAnimatedShinySpriteUrl(featuredMon.id)
                      : getAnimatedSpriteUrl(featuredMon.id)
                  }
                  alt={featuredMon.name}
                  className="hof-featured-sprite"
                />
              </div>

              <div className="hof-featured-details">
                <span className="hof-mon-level">Lv. {featuredMon.level}</span>
                <h2 className="hof-mon-name">
                  {featuredMon.nickname || capitalize(featuredMon.name)}
                </h2>
                <div className="hof-types-row">
                  {featuredMon.types?.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
                <span className="hof-indicator">
                  Champion Roster: {hofSlideIndex + 1} of {team.length}
                </span>
              </div>
            </div>
          )}

          {/* Team Snapshot Roster */}
          <div className="hof-roster-overview">
            <h3 className="hof-roster-title">The Championship Team</h3>
            <div className="hof-roster-grid">
              {team.map((member, idx) => (
                <div
                  key={member.instanceId || idx}
                  className={`hof-roster-card ${idx === hofSlideIndex ? "roster-card-active" : ""}`}
                  onClick={() => setHofSlideIndex(idx)}
                >
                  <img
                    src={getAnimatedSpriteUrl(member.id)}
                    alt={member.name}
                    className="hof-card-sprite"
                  />
                  <span className="hof-card-name">
                    {member.nickname || capitalize(member.name)}
                  </span>
                  <span className="hof-card-lvl">Lv. {member.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate Action */}
          <div className="hof-actions">
            <Link to="/team" className="btn-hof-view-team">
              <IconTrophy size={18} />
              <span>View Hall of Fame Trophy in My Team</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setFlowState("LOBBY");
                setChamberIndex(0);
              }}
              className="btn-hof-restart"
            >
              <span>Return to Indigo Plateau Lobby</span>
              <IconArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: 3. CHAMBER CLEARED ANTECHAMBER
  // ========================================================
  if (flowState === "CHAMBER_CLEARED") {
    const defeated = INDIGO_ELITE_FOUR[chamberIndex];
    const nextOpponent = INDIGO_ELITE_FOUR[chamberIndex + 1];

    return (
      <div className="league-page-container">
        <div className="chamber-cleared-card">
          <div className="cleared-header">
            <IconCheck size={32} className="cleared-check-icon" />
            <h2 className="cleared-title">{defeated.chamberName} Cleared!</h2>
            <p className="cleared-quote">"{defeated.dialogue.defeat}"</p>
          </div>

          {/* Recovery Center Desk */}
          <div className="antechamber-services">
            <div className="service-card">
              <IconCross size={20} className="service-icon" />
              <div>
                <h4 className="service-name">Indigo Plateau Medical Center</h4>
                <p className="service-desc">
                  Heal and restore all your Pokémon to maximum HP before entering the next chamber.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  healAllPokemon();
                  alert("All Pokémon in your party have been fully healed!");
                }}
                className="btn-heal-party-league"
              >
                Restore Party
              </button>
            </div>
          </div>

          {/* Next Chamber Preview */}
          {nextOpponent && (
            <div className="next-opponent-preview">
              <span className="preview-label">Next Chamber Awaits:</span>
              <div className="preview-card">
                <img
                  src={nextOpponent.spriteUrl}
                  alt={nextOpponent.name}
                  className="preview-trainer-sprite"
                />
                <div>
                  <h3 className="preview-trainer-name">{nextOpponent.name}</h3>
                  <span className="preview-trainer-title">{nextOpponent.title}</span>
                  <span className="preview-trainer-recom">{nextOpponent.recommendedLevel}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEnterChamber(chamberIndex + 1)}
                className="btn-advance-chamber"
              >
                <span>Enter {nextOpponent.chamberName}</span>
                <IconArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: 4. VS INTRO CUTSCENE
  // ========================================================
  if (flowState === "VS_INTRO") {
    return (
      <div className="vs-intro-overlay">
        <div className="vs-intro-stage">
          <div className="vs-trainer-box left-challenger">
            <img
              src="https://play.pokemonshowdown.com/sprites/trainers/red.png"
              alt="Trainer Red"
              className="vs-sprite"
            />
            <h2 className="vs-trainer-name">{trainer.name}</h2>
            <span className="vs-trainer-title">Kanto Challenger</span>
          </div>

          <div className="vs-lightning-divider">
            <span className="vs-huge-text">VS</span>
          </div>

          <div className="vs-trainer-box right-leader">
            <img
              src={activeOpponent.spriteUrl}
              alt={activeOpponent.name}
              className="vs-sprite"
            />
            <h2 className="vs-trainer-name">{activeOpponent.name}</h2>
            <span className="vs-trainer-title">{activeOpponent.title}</span>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: 5. ACTIVE BATTLE ARENA (2.5D Isometric Engine)
  // ========================================================
  if (flowState === "BATTLE") {
    const isPlayerShiny = Boolean(activePlayerMon?.isShiny);
    const playerBackSprite = isPlayerShiny
      ? getAnimatedBackShinySpriteUrl(activePlayerMon.id) || getBackSpriteUrl(activePlayerMon.id)
      : getAnimatedBackSpriteUrl(activePlayerMon.id) || getBackSpriteUrl(activePlayerMon.id);

    const leaderFrontSprite = getAnimatedSpriteUrl(activeLeaderMon.id);

    const playerHpPercent = Math.max(
      0,
      Math.min(100, Math.round(((activePlayerMon.currentHp || 0) / activePlayerMon.maxHp) * 100))
    );
    const leaderHpPercent = Math.max(
      0,
      Math.min(100, Math.round(((activeLeaderMon.currentHp || 0) / activeLeaderMon.maxHp) * 100))
    );

    return (
      <div className="league-page-container">
        {/* Battle Arena Container */}
        <div className={`battle-stage-container arena-${activeOpponent.arenaTheme} ${screenShake ? "screen-shake" : ""}`}>
          {/* Top HUD Controls: Camera, Turn, Speed */}
          <div className="battle-top-hud">
            <div className="hud-chamber-badge">
              <IconCrown size={15} style={{ marginRight: 6 }} />
              <span>
                Chamber {chamberIndex + 1}/5: {activeOpponent.name} ({activeOpponent.chamberName})
              </span>
            </div>

            <div className="hud-actions-right">
              <span className="hud-turn-badge">Turn {turnNumber}</span>
              {/* Camera Mode Toggle */}
              <button
                type="button"
                className="btn-camera-toggle"
                onClick={() => {
                  setCameraMode((prev) =>
                    prev === "isometric" ? "firstperson" : prev === "firstperson" ? "broadcast" : "isometric"
                  );
                }}
                title="Toggle Battle Camera (Isometric / POV / Broadcast)"
              >
                <IconCamera size={14} />
                <span className="camera-label">{cameraMode.toUpperCase()}</span>
              </button>

              {/* Battle Speed */}
              <button
                type="button"
                className="btn-speed-toggle"
                onClick={() => setBattleSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}
              >
                {battleSpeed}x
              </button>
            </div>
          </div>

          {/* 3D Battle Arena Viewport */}
          <div className={`battle-viewport camera-${cameraMode}`}>
            <BattleEnvironment arenaTheme={activeOpponent.arenaTheme} />

            {/* OPPONENT / LEADER SIDE */}
            <div className="arena-battler-slot slot-opponent">
              <BattlePedestal theme={activeOpponent.arenaTheme} isOpponent={true} />

              {/* Opponent Pokemon Sprite */}
              <div className={`battler-sprite-wrap ${leaderAnim}`}>
                <img
                  src={leaderFrontSprite}
                  alt={activeLeaderMon.name}
                  className="battle-sprite-mon opponent-mon-sprite"
                />
                {slashVfxOnLeader && <div className="slash-vfx-flash"></div>}
                {leaderDamagePopup && (
                  <div
                    className={`damage-popup-float ${leaderDamagePopup.isCrit ? "crit-hit" : ""} ${
                      leaderDamagePopup.isSuper ? "super-hit" : ""
                    }`}
                  >
                    -{leaderDamagePopup.damage}
                  </div>
                )}
              </div>

              {/* Opponent Status Card */}
              <div className="battle-status-card status-opponent">
                <div className="status-header">
                  <span className="battler-name">{activeLeaderMon.nickname}</span>
                  <span className="battler-level">Lv. {activeLeaderMon.level}</span>
                </div>
                <div className="status-hp-bar">
                  <div
                    className={`hp-fill ${
                      leaderHpPercent < 20 ? "hp-danger" : leaderHpPercent < 50 ? "hp-warning" : "hp-healthy"
                    }`}
                    style={{ width: `${leaderHpPercent}%` }}
                  ></div>
                </div>
                <div className="status-roster-dots">
                  {leaderRoster.map((mon, idx) => (
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
              <BattlePedestal theme={activeOpponent.arenaTheme} isOpponent={false} />

              <div className={`battler-sprite-wrap ${playerAnim}`}>
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

              {/* Player Status Card */}
              <div className="battle-status-card status-player">
                <div className="status-header">
                  <span className="battler-name">{activePlayerMon.nickname}</span>
                  <span className="battler-level">Lv. {activePlayerMon.level}</span>
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
                  {activePlayerMon.currentHp || 0} / {activePlayerMon.maxHp} HP
                </div>
              </div>
            </div>

            {/* Elemental VFX Overlay */}
            {elementalVfx && (
              <ElementalVfxOverlay
                target={elementalVfx.target}
                type={elementalVfx.type}
              />
            )}
          </div>

          {/* Battle Dialogue Box */}
          <div className="battle-dialogue-banner">
            <p className="dialogue-text">{battleDialogue}</p>
          </div>

          {/* Action Menu / Fight Deck */}
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
              </div>
            )}

            {/* FIGHT DECK */}
            {battleSubMenu === "FIGHT" && (
              <div className="moves-deck-grid">
                {activePlayerMon.moves?.map((m) => {
                  const mult = getTypeDamageMultiplier(m.type, activeLeaderMon.types);
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

            {/* BAG SUBMENU */}
            {battleSubMenu === "BAG" && (
              <div className="battle-bag-tray">
                <span className="bag-title">Use Item on Active Pokémon:</span>
                <div className="battle-bag-items">
                  {Object.entries(inventory)
                    .filter(([key, count]) => count > 0 && !key.includes("ball") && !key.includes("stone"))
                    .map(([key, count]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleUseBagItem(key)}
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

            {/* SWITCH SUBMENU */}
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
                        <span className="switch-hp">
                          {member.currentHp || 0}/{member.maxHp} HP
                        </span>
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
  // RENDER: 6. LOBBY (Indigo Plateau Chamber Gate selection)
  // ========================================================
  return (
    <div className="league-page-container">
      {/* Indigo Plateau Hero Banner */}
      <div className="league-lobby-header">
        <div className="league-header-text">
          <div className="league-title-row">
            <IconCrown size={28} className="league-crown-icon" />
            <h1 className="league-title">Indigo Plateau</h1>
          </div>
          <p className="league-subtitle">
            The Apex of Kanto Trainers — Conquer the 4 Elite Masters and claim the Championship!
          </p>
        </div>

        {/* Quick Party Restore */}
        <div className="lobby-actions-bar">
          <button
            type="button"
            onClick={() => {
              healAllPokemon();
              alert("All Pokémon in your party have been fully healed at the Indigo Center desk!");
            }}
            className="btn-lobby-heal"
          >
            <IconCross size={16} />
            <span>Full Party Recovery Desk</span>
          </button>
        </div>
      </div>

      {/* 5 Chamber Gauntlet Cards */}
      <div className="chambers-gauntlet-list">
        {INDIGO_ELITE_FOUR.map((opp, idx) => (
          <div
            key={opp.id}
            className={`chamber-card ${idx === 4 ? "chamber-champion" : ""}`}
          >
            <div className="chamber-order-pill">
              {idx === 4 ? "CHAMPIONSHIP" : `CHAMBER ${idx + 1}`}
            </div>

            <div className="chamber-trainer-wrap">
              <img
                src={opp.spriteUrl}
                alt={opp.name}
                className="chamber-trainer-sprite"
              />
            </div>

            <div className="chamber-details">
              <span className="chamber-location">{opp.chamberName}</span>
              <h3 className="chamber-name">{opp.name}</h3>
              <span className="chamber-title">{opp.title}</span>
              <span className="chamber-level-tag">{opp.recommendedLevel}</span>

              {/* Team preview sprites */}
              <div className="chamber-team-preview">
                {opp.team.map((mon, mIdx) => (
                  <img
                    key={mIdx}
                    src={getAnimatedSpriteUrl(mon.id)}
                    alt={mon.name}
                    className="chamber-team-mini-sprite"
                    title={mon.nickname}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleEnterChamber(idx)}
              className="btn-enter-chamber"
            >
              <span>Challenge {opp.name}</span>
              <IconSwords size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
