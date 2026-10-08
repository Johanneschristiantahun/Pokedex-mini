// ========================================================
// PokéDex Mini Legendary Secret Dungeons & Mythical Raids (/dungeons)
// Seafoam Caverns, Power Plant, Victory Road, & Cerulean Cave
// Epic Raid Encounters, Mega Evolution, and Master Ball Catches
// ========================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import { LEGENDARY_DUNGEONS } from "../data/legendaryRaids.js";
import {
  BattleEnvironment,
  BattlePedestal,
  ElementalVfxOverlay,
} from "../components/BattleEnvironment.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import {
  IconCamera,
  IconShield,
  IconCrown,
  IconSparkles,
  IconParty,
  IconArrowRight,
  IconPokeball,
} from "../components/Icons.jsx";
import { getTypeDamageMultiplier } from "../utils/typeEffectiveness.js";
import {
  getMegaEvolutionData,
  applyMegaEvolution,
} from "../data/megaEvolutionData.js";
import {
  capitalize,
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
  playMegaEvolutionSound,
  playLegendaryRoar,
} from "../utils/soundEffects.js";
import { triggerHaptic, HAPTIC_PATTERNS } from "../utils/haptics.js";

const STORAGE_KEY_DUNGEONS = "pokesphere_dungeons_cleared";

function getRandomBossMove(moves) {
  if (!moves || moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

export default function DungeonPage() {
  const {
    team,
    addToTeam,
    addToBox,
    inventory,
    addLoot,
    applyItemToPokemon,
    givePartyExp,
    updatePokemonHp,
    healAllPokemon,
  } = useGame();

  const [storedLocation, setStoredLocation] = useState("TEAM");

  // Cleared Dungeons tracking
  const [clearedDungeons, setClearedDungeons] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DUNGEONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DUNGEONS, JSON.stringify(clearedDungeons));
  }, [clearedDungeons]);

  // Mode: "HUB" | "BATTLE" | "CATCH_SUCCESS"
  const [mode, setMode] = useState("HUB");
  const [activeDungeonIndex, setActiveDungeonIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Active Battlers
  const selectedDungeon = LEGENDARY_DUNGEONS[activeDungeonIndex] || LEGENDARY_DUNGEONS[0];
  const [activePartyIndex, setActivePartyIndex] = useState(0);
  const [bossMon, setBossMon] = useState(null);

  // Submenu
  const [battleSubMenu, setBattleSubMenu] = useState("MENU"); // MENU, FIGHT, BAG, SWITCH, BALL, BUSY
  const [battleDialogue, setBattleDialogue] = useState("");

  // Mega Evolution State for current battle
  const [playerIsMega, setPlayerIsMega] = useState(false);
  const [megaBurstAnim, setMegaBurstAnim] = useState(false);

  // Camera & Visuals
  const [cameraMode, setCameraMode] = useState("isometric");
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [turnNumber, setTurnNumber] = useState(1);

  // Animations & FX
  const [playerAnim, setPlayerAnim] = useState("");
  const [bossAnim, setBossAnim] = useState("");
  const [screenShake, setScreenShake] = useState(false);
  const [slashVfxOnBoss, setSlashVfxOnBoss] = useState(false);
  const [slashVfxOnPlayer, setSlashVfxOnPlayer] = useState(false);
  const [elementalVfx, setElementalVfx] = useState(null);
  const [bossDamagePopup, setBossDamagePopup] = useState(null);
  const [playerDamagePopup, setPlayerDamagePopup] = useState(null);

  // Catching ball animation state
  const [thrownBall, setThrownBall] = useState(null); // { type, shakes: 0..3, success: bool }

  // Derive active player Pokémon (apply temporary Mega Evolution if activated)
  const basePlayerMon = team[activePartyIndex] || team[0];
  const activePlayerMon = playerIsMega ? applyMegaEvolution(basePlayerMon) : basePlayerMon;
  const canMega = !playerIsMega && Boolean(getMegaEvolutionData(basePlayerMon));

  // Enter Dungeon Raid
  function handleEnterDungeon(index) {
    if (team.length === 0) {
      showToast("You need at least 1 Pokémon in your party to enter a raid!");
      return;
    }
    let firstAliveIndex = team.findIndex((p) => (p.currentHp || 0) > 0);
    if (firstAliveIndex === -1) {
      healAllPokemon();
      firstAliveIndex = 0;
      showToast("Party restored to full health for the expedition!");
    }

    setActiveDungeonIndex(index);
    setActivePartyIndex(firstAliveIndex);
    setPlayerIsMega(false);

    const dung = LEGENDARY_DUNGEONS[index];
    const initialBoss = {
      ...dung.boss,
      currentHp: dung.boss.maxHp,
    };
    setBossMon(initialBoss);
    setTurnNumber(1);

    // Instant, seamless entry into battle
    setMode("BATTLE");
    setBattleSubMenu("MENU");
    setBattleDialogue(`Legendary Boss ${initialBoss.name} appeared! What will ${team[firstAliveIndex]?.nickname || team[firstAliveIndex]?.name} do?`);
    playBattleStartSound();
    playLegendaryRoar();
    triggerHaptic(HAPTIC_PATTERNS.HEAVY);
    playPokemonCry(initialBoss.id);
  }

  // Trigger Mega Evolution in Battle
  function handleTriggerMega() {
    if (!canMega) return;
    setPlayerIsMega(true);
    setMegaBurstAnim(true);
    playMegaEvolutionSound();
    triggerHaptic(HAPTIC_PATTERNS.MEGA_EVOLUTION);

    const megaData = getMegaEvolutionData(basePlayerMon);
    setBattleDialogue(`Resonance Key Stone activated! ${basePlayerMon.nickname.toUpperCase()} Mega Evolved into ${megaData.formName.toUpperCase()}!`);

    setTimeout(() => {
      setMegaBurstAnim(false);
    }, 2000);
  }

  // Handle Player Selecting Move
  function handleSelectMove(move) {
    if (battleSubMenu === "BUSY" || !activePlayerMon || !bossMon) return;
    setBattleSubMenu("BUSY");

    const playerSpeed = activePlayerMon.speed || 50;
    const bossSpeed = 80;
    const playerFirst = playerSpeed >= bossSpeed;

    if (playerFirst) {
      executePlayerAttack(move, (bossAlive) => {
        if (bossAlive) {
          executeBossAttack(() => {
            setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
            setBattleSubMenu("MENU");
          });
        }
      });
    } else {
      executeBossAttack(() => {
        if ((activePlayerMon.currentHp || 0) > 0) {
          executePlayerAttack(move, () => {
            setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
            setBattleSubMenu("MENU");
          });
        }
      });
    }
  }

  // Player Attack
  function executePlayerAttack(move, onComplete) {
    setBattleDialogue(`${activePlayerMon.nickname.toUpperCase()} used ${move.name.toUpperCase()}!`);
    setPlayerAnim(cameraMode === "isometric" ? "anim-isometric-lunge" : "anim-player-lunge");
    setElementalVfx({ target: "leader", type: move.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setPlayerAnim("");

      const isCrit = Math.random() < 0.12;
      const typeMult = getTypeDamageMultiplier(move.type, bossMon.types);
      const baseAtk = activePlayerMon.attack || 50;
      const bossDef = 70;

      const baseDmg =
        Math.floor(
          (((2 * activePlayerMon.level) / 5 + 2) * move.power * (baseAtk / bossDef)) / 50
        ) + 2;
      const variance = 0.85 + Math.random() * 0.3;
      const finalDmg = Math.max(1, Math.floor(baseDmg * (isCrit ? 1.5 : 1.0) * typeMult * variance));

      setSlashVfxOnBoss(true);
      setBossAnim("anim-wild-hit");
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

      setBossDamagePopup({ damage: finalDmg, isCrit, isSuper: typeMult > 1 });

      const nextHp = Math.max(0, bossMon.currentHp - finalDmg);
      setBossMon((prev) => ({ ...prev, currentHp: nextHp }));

      setTimeout(() => {
        setSlashVfxOnBoss(false);
        setBossAnim("");
        setElementalVfx(null);
        setScreenShake(false);
        setBossDamagePopup(null);

        if (typeMult > 1) setBattleDialogue("It's super effective on the Legendary Pokémon!");
        else if (isCrit) setBattleDialogue("A devastating critical strike!");
        else setBattleDialogue(`${bossMon.name.toUpperCase()} took ${finalDmg} damage!`);

        setTimeout(() => {
          if (nextHp <= 0) {
            handleBossFaint();
          } else {
            if (onComplete) onComplete(true);
          }
        }, 1000);
      }, 700);
    }, 450);
  }

  // Boss Attack
  function executeBossAttack(onComplete) {
    if (!bossMon || !activePlayerMon) return;
    const chosenMove = getRandomBossMove(bossMon.moves) || bossMon.moves[0];

    setBattleDialogue(`The Legendary ${bossMon.name.toUpperCase()} used ${chosenMove.name.toUpperCase()}!`);
    setBossAnim(cameraMode === "isometric" ? "anim-isometric-wild-lunge" : "anim-wild-lunge");
    setElementalVfx({ target: "player", type: chosenMove.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setBossAnim("");

      const isCrit = Math.random() < 0.1;
      const typeMult = getTypeDamageMultiplier(chosenMove.type, activePlayerMon.types);
      const bossAtk = 85;
      const playerDef = activePlayerMon.defense || 50;

      const baseDmg =
        Math.floor(
          (((2 * bossMon.level) / 5 + 2) * chosenMove.power * (bossAtk / playerDef)) / 50
        ) + 4;
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

  // Throw Pokéball at Legendary Boss
  function handleThrowBall(ballType) {
    if ((inventory[ballType] || 0) <= 0) {
      setBattleDialogue(`No ${ballType.replace(/-/g, " ")} left in your Bag!`);
      return;
    }

    setBattleSubMenu("BUSY");
    addLoot(ballType, -1);

    setBattleDialogue(`Threw a ${ballType.replace(/-/g, " ").toUpperCase()} at ${bossMon.name.toUpperCase()}!`);
    setThrownBall({ type: ballType, stage: "THROW" });
    triggerHaptic(HAPTIC_PATTERNS.MEDIUM);

    setTimeout(() => {
      // Calculate catch success
      let isSuccess = false;
      if (ballType === "master-ball") {
        isSuccess = true;
      } else {
        const hpPercent = bossMon.currentHp / bossMon.maxHp;
        let ballBonus = 1.0;
        if (ballType === "great-ball") ballBonus = 1.5;
        if (ballType === "ultra-ball") ballBonus = 2.5;

        // Base catch formula for legendaries
        const catchProbability = Math.max(0.04, (1 - hpPercent * 0.75) * 0.25 * ballBonus);
        isSuccess = Math.random() < catchProbability;
      }

      // Wobble sequence
      let shakes = 0;
      const wobbleInterval = setInterval(() => {
        shakes += 1;
        triggerHaptic(HAPTIC_PATTERNS.CATCH_SHAKE);
        setThrownBall({ type: ballType, stage: `SHAKE_${shakes}` });

        if (shakes >= 3 || (!isSuccess && shakes >= 2)) {
          clearInterval(wobbleInterval);

          setTimeout(() => {
            if (isSuccess) {
              // Captured!
              setThrownBall(null);
              playCatchSuccessJingle();
              triggerHaptic(HAPTIC_PATTERNS.CATCH_SUCCESS);
              handleCaptureSuccess();
            } else {
              // Broke free
              setThrownBall(null);
              playFaintSound();
              setBattleDialogue(`Oh no! The Legendary ${bossMon.name.toUpperCase()} broke free!`);

              setTimeout(() => {
                executeBossAttack(() => {
                  setBattleDialogue(`What will ${activePlayerMon.nickname.toUpperCase()} do?`);
                  setBattleSubMenu("MENU");
                });
              }, 1200);
            }
          }, 800);
        }
      }, 700);
    }, 1000);
  }

  // Capture Success
  function handleCaptureSuccess() {
    const legendaryData = {
      id: bossMon.id,
      name: bossMon.name,
      level: bossMon.level,
      types: bossMon.types,
      currentHp: bossMon.maxHp,
      maxHp: bossMon.maxHp,
      attack: 90,
      defense: 85,
      speed: 85,
      moves: bossMon.moves,
    };

    if (team.length < 6) {
      addToTeam(legendaryData);
      setStoredLocation("TEAM");
      setBattleDialogue(`Gotcha! ${bossMon.name.toUpperCase()} joined your active party!`);
    } else {
      addToBox(legendaryData, bossMon.level);
      setStoredLocation("BOX");
      setBattleDialogue(`Party is full! ${bossMon.name.toUpperCase()} was transferred to PC Storage Box!`);
    }

    if (!clearedDungeons.includes(selectedDungeon.id)) {
      setClearedDungeons((prev) => [...prev, selectedDungeon.id]);
    }

    givePartyExp(3000, activePlayerMon.instanceId);

    setTimeout(() => {
      setMode("CATCH_SUCCESS");
    }, 2000);
  }

  // Boss Fainted
  function handleBossFaint() {
    playFaintSound();
    setBossAnim("anim-wild-faint");
    setBattleDialogue(selectedDungeon.boss.faintQuote);

    if (!clearedDungeons.includes(selectedDungeon.id)) {
      setClearedDungeons((prev) => [...prev, selectedDungeon.id]);
    }

    givePartyExp(3500, activePlayerMon.instanceId);

    setTimeout(() => {
      setBossAnim("");
      setMode("HUB");
    }, 2500);
  }

  // Player Fainted
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
        setBattleDialogue("All your Pokémon have fainted! You safely fled from the dungeon...");
        setTimeout(() => {
          healAllPokemon();
          setMode("HUB");
        }, 2200);
      }
    }, 1200);
  }

  // Switch Active Pokémon
  function handleSwitchPokemon(index) {
    if (index === activePartyIndex || (team[index].currentHp || 0) <= 0) return;
    setBattleSubMenu("BUSY");
    setActivePartyIndex(index);
    setPlayerIsMega(false); // Reset mega on switch
    const chosen = team[index];
    playPokemonCry(chosen.id);
    setBattleDialogue(`Go, ${chosen.nickname.toUpperCase()}!`);

    setTimeout(() => {
      executeBossAttack(() => {
        setBattleDialogue(`What will ${chosen.nickname.toUpperCase()} do?`);
        setBattleSubMenu("MENU");
      });
    }, 1200);
  }

  // ========================================================
  // RENDER: CATCH SUCCESS BANNER
  // ========================================================
  if (mode === "CATCH_SUCCESS") {
    return (
      <div className="dungeon-page-container">
        <div className="dungeon-catch-card">
          <div className="catch-sparkle-ring">
            <IconSparkles size={48} />
          </div>
          <h1 className="catch-title">LEGENDARY POKÉMON CAUGHT!</h1>
          <p className="catch-subtitle">
            You successfully subdued and captured the mythical <strong>{capitalize(bossMon.name)}</strong>!
            {storedLocation === "BOX" ? (
              <span style={{ display: "block", marginTop: "10px", color: "#38bdf8", fontWeight: 600, fontSize: "0.95rem" }}>
                Active Party is full (6/6). {capitalize(bossMon.name)} was transferred safely to your PC Storage Box!
              </span>
            ) : (
              <span style={{ display: "block", marginTop: "10px", color: "#4ade80", fontWeight: 600, fontSize: "0.95rem" }}>
                {capitalize(bossMon.name)} joined your active battle party!
              </span>
            )}
          </p>

          <div className="captured-mon-showcase">
            <img
              src={getAnimatedSpriteUrl(bossMon.id)}
              alt={bossMon.name}
              className="captured-mon-sprite"
            />
            <div className="captured-mon-meta">
              <span className="captured-mon-level">Lv. {bossMon.level}</span>
              <h2 className="captured-mon-name">{capitalize(bossMon.name)}</h2>
              <div className="captured-types-row">
                {bossMon.types.map((t) => (
                  <TypeBadge key={t} type={t} size="sm" />
                ))}
              </div>
            </div>
          </div>

          <div className="catch-actions">
            <Link to="/team" className="btn-catch-view-team">
              <IconParty size={18} />
              <span>Inspect in My Team / PC Box</span>
            </Link>
            <button
              type="button"
              onClick={() => setMode("HUB")}
              className="btn-catch-return"
            >
              <span>Return to Dungeons Hub</span>
              <IconArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: BATTLE ARENA
  // ========================================================
  if (mode === "BATTLE") {
    const isPlayerShiny = Boolean(activePlayerMon?.isShiny);
    const playerBackSprite = isPlayerShiny
      ? getAnimatedBackShinySpriteUrl(activePlayerMon.id) || getBackSpriteUrl(activePlayerMon.id)
      : activePlayerMon.sprites?.backAnimated || getAnimatedBackSpriteUrl(activePlayerMon.id) || getBackSpriteUrl(activePlayerMon.id);

    const bossFrontSprite = getAnimatedSpriteUrl(bossMon.id);

    const playerHpPercent = Math.max(0, Math.min(100, Math.round(((activePlayerMon.currentHp || 0) / activePlayerMon.maxHp) * 100)));
    const bossHpPercent = Math.max(0, Math.min(100, Math.round(((bossMon.currentHp || 0) / bossMon.maxHp) * 100)));

    return (
      <div className="dungeon-page-container">
        <div className={`battle-stage-container arena-${selectedDungeon.theme} ${screenShake ? "screen-shake" : ""}`}>
          {/* Top HUD */}
          <div className="battle-top-hud">
            <div className="hud-chamber-badge">
              <IconShield size={15} style={{ marginRight: 6 }} />
              <span>{selectedDungeon.name} — {selectedDungeon.boss.title}</span>
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

          {/* Viewport */}
          <div className={`battle-viewport camera-${cameraMode}`}>
            <BattleEnvironment arenaTheme={selectedDungeon.theme} />

            {/* BOSS / OPPONENT SIDE */}
            <div className="arena-battler-slot slot-opponent">
              <BattlePedestal theme={selectedDungeon.theme} isOpponent={true} />

              <div className={`battler-sprite-wrap ${bossAnim}`}>
                {thrownBall ? (
                  <div className={`thrown-pokeball-anim ${thrownBall.stage}`}>
                    <IconPokeball size={44} className="thrown-ball-icon" />
                  </div>
                ) : (
                  <img
                    src={bossFrontSprite}
                    alt={bossMon.name}
                    className="battle-sprite-mon opponent-mon-sprite boss-scaled"
                  />
                )}
                {slashVfxOnBoss && <div className="slash-vfx-flash"></div>}
                {bossDamagePopup && (
                  <div className={`damage-popup-float ${bossDamagePopup.isCrit ? "crit-hit" : ""}`}>
                    -{bossDamagePopup.damage}
                  </div>
                )}
              </div>

              {/* Boss Raid Bar */}
              <div className="battle-status-card status-opponent boss-raid-bar">
                <div className="status-header">
                  <span className="battler-name">
                    <IconCrown size={14} style={{ display: "inline-block", verticalAlign: "text-bottom", marginRight: 4 }} />
                    {bossMon.name.toUpperCase()}
                  </span>
                  <span className="battler-level">Lv. {bossMon.level}</span>
                </div>
                <div className="status-hp-bar raid-hp-bar">
                  <div
                    className={`hp-fill ${bossHpPercent < 25 ? "hp-danger" : bossHpPercent < 55 ? "hp-warning" : "hp-healthy"}`}
                    style={{ width: `${bossHpPercent}%` }}
                  ></div>
                </div>
                <div className="boss-title-caption">{selectedDungeon.boss.title}</div>
              </div>
            </div>

            {/* PLAYER SIDE */}
            <div className="arena-battler-slot slot-player">
              <BattlePedestal theme={selectedDungeon.theme} isOpponent={false} />

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

              {/* Player Status Card */}
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

          {/* Dialogue Banner */}
          <div className="battle-dialogue-banner">
            <p className="dialogue-text">{battleDialogue}</p>
          </div>

          {/* Battle Command Deck */}
          <div className="battle-controls-tray">
            {battleSubMenu === "MENU" && (
              <div className="main-command-buttons">
                <button
                  type="button"
                  onClick={() => setBattleSubMenu("FIGHT")}
                  className="btn-cmd btn-cmd-fight"
                >
                  FIGHT
                </button>

                <button
                  type="button"
                  onClick={() => setBattleSubMenu("BALL")}
                  className="btn-cmd btn-cmd-ball"
                >
                  CATCH
                </button>

                <button
                  type="button"
                  onClick={() => setBattleSubMenu("BAG")}
                  className="btn-cmd btn-cmd-bag"
                >
                  BAG
                </button>

                <button
                  type="button"
                  onClick={() => setBattleSubMenu("SWITCH")}
                  className="btn-cmd btn-cmd-switch"
                >
                  POKÉMON
                </button>

                {/* MEGA EVOLUTION TRIGGER */}
                {canMega && (
                  <button
                    type="button"
                    onClick={handleTriggerMega}
                    className="btn-cmd btn-cmd-mega-trigger"
                    title="Awaken Mega Evolution for this battle"
                  >
                    MEGA EVOLVE
                  </button>
                )}
              </div>
            )}

            {/* FIGHT DECK */}
            {battleSubMenu === "FIGHT" && (
              <div className="moves-deck-grid">
                {activePlayerMon.moves?.map((m) => {
                  const mult = getTypeDamageMultiplier(m.type, bossMon.types);
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

            {/* POKEBALLS CATCH DECK */}
            {battleSubMenu === "BALL" && (
              <div className="battle-ball-tray">
                <span className="bag-title">Select Pokéball to Capture Legendary Boss:</span>
                <div className="battle-ball-items">
                  {["master-ball", "ultra-ball", "great-ball", "poke-ball"].map((ballKey) => {
                    const count = inventory[ballKey] || 0;
                    return (
                      <button
                        key={ballKey}
                        type="button"
                        disabled={count <= 0}
                        onClick={() => handleThrowBall(ballKey)}
                        className={`battle-ball-pill ball-${ballKey}`}
                      >
                        <IconPokeball size={16} />
                        <span>{ballKey.replace(/-/g, " ").toUpperCase()}</span>
                        <span className="ball-count-tag">x{count}</span>
                      </button>
                    );
                  })}
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

            {/* BAG MENU */}
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
                        onClick={() => {
                          const res = applyItemToPokemon(key, activePlayerMon.instanceId);
                          if (!res.success) {
                            setBattleDialogue(res.message);
                          } else {
                            setBattleSubMenu("BUSY");
                            setBattleDialogue(`Used ${key.toUpperCase()}! ${res.message}`);
                            setTimeout(() => executeBossAttack(() => setBattleSubMenu("MENU")), 1200);
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
  // RENDER: DUNGEON HUB (Apple Reference Design)
  // ========================================================
  return (
    <div className="apple-hub-container">
      {toastMessage && <div className="game-toast-pill">{toastMessage}</div>}

      <div className="apple-hub-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="apple-hub-title">Dungeons &amp; Raids</h1>
          <p className="apple-hub-subtitle">
            Explore legendary sanctuaries across Kanto and battle mythical Pokémon in these challenging expeditions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            healAllPokemon();
            showToast("Party Pokémon restored to full health.");
          }}
          className="apple-btn-secondary"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color, #e5e5e5)', padding: '10px 20px', borderRadius: '980px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)' }}
        >
          Restore Party
        </button>
      </div>

      <div className="apple-grid-2">
        {LEGENDARY_DUNGEONS.map((dung, idx) => {
          const isCleared = clearedDungeons.includes(dung.id);
          return (
            <div
              key={dung.id}
              className="apple-card"
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {/* Optional ambient glow using the dungeon's color */}
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: dung.color, opacity: 0.1, filter: 'blur(40px)', borderRadius: '50%' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {dung.region}
                </span>
                {isCleared ? (
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#34c759', color: 'white', padding: '4px 10px', borderRadius: '8px' }}>Captured</span>
                ) : (
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '8px' }}>{dung.recommendedLevel}</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <img
                  src={getAnimatedSpriteUrl(dung.boss.id)}
                  alt={dung.boss.name}
                  style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
                />
                <div>
                  <h3 className="apple-card-title" style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{dung.name}</h3>
                  <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Boss: {capitalize(dung.boss.name)} • Lv. {dung.boss.level || 70}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {dung.boss.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </div>
                </div>
              </div>

              <p className="apple-card-subtitle" style={{ marginBottom: '24px', flex: 1 }}>
                {dung.description}
              </p>

              <button
                type="button"
                onClick={() => handleEnterDungeon(idx)}
                className="apple-btn-primary"
                style={{ width: '100%', background: dung.color, boxShadow: `0 4px 14px ${dung.color}40` }}
              >
                Enter Expedition
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
