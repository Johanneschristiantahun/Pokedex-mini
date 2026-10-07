// ========================================================
// PokéDex Mini Link Battle (/link)
// Real-time peer battle arena across browser tabs using BroadcastChannel API
// Apple-inspired minimalist lobby, real-time sync, and battle arena
// ========================================================

import { useState, useEffect, useRef } from "react";
import { useGame } from "../context/GameContext.jsx";
import {
  BattleEnvironment,
  BattlePedestal,
  ElementalVfxOverlay,
} from "../components/BattleEnvironment.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import {
  IconSwords,
  IconCheck,
  IconX,
  IconExternalLink,
  IconTrophy,
  IconShield,
} from "../components/Icons.jsx";
import { getTypeDamageMultiplier } from "../utils/typeEffectiveness.js";
import {
  getAnimatedSpriteUrl,
  getAnimatedBackSpriteUrl,
  getBackSpriteUrl,
  capitalize,
} from "../utils.js";
import {
  playHitSound,
  playAttackWhooshSound,
  playCriticalHitSound,
  playSuperEffectiveSound,
  playFaintSound,
  playBattleStartSound,
  playCatchSuccessJingle,
} from "../utils/soundEffects.js";

const LINK_CHANNEL_NAME = "pokesphere_link_channel";

export default function LinkBattlePage() {
  const { trainer, team } = useGame();

  // Tab Unique Peer ID
  const [peerId] = useState(() => `peer_${Math.random().toString(36).slice(2, 7)}`);

  // Channel & Connected Peers
  const channelRef = useRef(null);
  const [remotePeers, setRemotePeers] = useState([]);
  const [activeDuelPeer, setActiveDuelPeer] = useState(null);

  // Mode: "LOBBY" | "CHALLENGING" | "BATTLE" | "VICTORY" | "DEFEAT"
  const [mode, setMode] = useState("LOBBY");
  const [incomingChallenge, setIncomingChallenge] = useState(null);

  // Active Battler State
  const [myRoster, setMyRoster] = useState([]);
  const [myActiveIdx, setMyActiveIdx] = useState(0);

  const [oppRoster, setOppRoster] = useState([]);
  const [oppActiveIdx, setOppActiveIdx] = useState(0);

  // Battle Turn & VFX
  const [battleDialogue, setBattleDialogue] = useState("");
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [playerAnim, setPlayerAnim] = useState("");
  const [oppAnim, setOppAnim] = useState("");
  const [elementalVfx, setElementalVfx] = useState(null);
  const [screenShake, setScreenShake] = useState(false);
  const [slashVfxFlash, setSlashVfxFlash] = useState(false);

  const handleReceiveOpponentMoveRef = useRef(null);
  const activeDuelPeerRef = useRef(activeDuelPeer);

  useEffect(() => {
    activeDuelPeerRef.current = activeDuelPeer;
  }, [activeDuelPeer]);

  // Initialize BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const bc = new BroadcastChannel(LINK_CHANNEL_NAME);
    channelRef.current = bc;

    // Announce presence
    bc.postMessage({
      type: "PEER_ANNOUNCE",
      senderId: peerId,
      trainerName: trainer.name || "Challenger",
      teamSummary: team.slice(0, 3).map((p) => ({ id: p.id, name: p.name, level: p.level })),
    });

    bc.onmessage = (event) => {
      const data = event.data;
      if (!data || data.senderId === peerId) return;

      if (data.type === "PEER_ANNOUNCE") {
        setRemotePeers((prev) => {
          const filtered = prev.filter((p) => p.id !== data.senderId);
          return [
            ...filtered,
            {
              id: data.senderId,
              name: data.trainerName,
              teamSummary: data.teamSummary || [],
              lastSeen: Date.now(),
            },
          ];
        });
        // Respond back with our info so new tab discovers us
        bc.postMessage({
          type: "PEER_HEARTBEAT_ACK",
          senderId: peerId,
          trainerName: trainer.name || "Challenger",
          teamSummary: team.slice(0, 3).map((p) => ({ id: p.id, name: p.name, level: p.level })),
        });
      }

      if (data.type === "PEER_HEARTBEAT_ACK") {
        setRemotePeers((prev) => {
          const filtered = prev.filter((p) => p.id !== data.senderId);
          return [
            ...filtered,
            {
              id: data.senderId,
              name: data.trainerName,
              teamSummary: data.teamSummary || [],
              lastSeen: Date.now(),
            },
          ];
        });
      }

      if (data.type === "CHALLENGE_INVITE" && data.targetId === peerId) {
        setIncomingChallenge({
          senderId: data.senderId,
          trainerName: data.trainerName,
          roster: data.roster,
        });
      }

      if (data.type === "CHALLENGE_ACCEPTED" && data.targetId === peerId) {
        // Start battle as Host
        setActiveDuelPeer({ id: data.senderId, name: data.trainerName });
        setOppRoster(data.roster);
        setOppActiveIdx(0);
        setMode("BATTLE");
        setIsMyTurn(true);
        setBattleDialogue(`Battle started with ${data.trainerName}! Select your opening move.`);
        playBattleStartSound();
      }

      if (data.type === "BATTLE_MOVE" && data.targetId === peerId) {
        handleReceiveOpponentMoveRef.current?.(data.move, data.damage);
      }

      if (data.type === "PEER_DISCONNECT") {
        setRemotePeers((prev) => prev.filter((p) => p.id !== data.senderId));
        if (activeDuelPeerRef.current && activeDuelPeerRef.current.id === data.senderId) {
          setBattleDialogue("Opponent disconnected from the Link session.");
          setTimeout(() => {
            alert("Opponent closed their tab or disconnected. Returning to lobby.");
            setMode("LOBBY");
            setActiveDuelPeer(null);
          }, 1000);
        }
      }

      if (data.type === "BATTLE_FORFEIT" && data.targetId === peerId) {
        setBattleDialogue(`${data.trainerName || "Opponent"} has forfeited the match.`);
        setTimeout(() => {
          setMode("VICTORY");
        }, 1200);
      }
    };

    function handleBeforeUnload() {
      bc.postMessage({
        type: "PEER_DISCONNECT",
        senderId: peerId,
      });
    }
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Periodic heartbeat every 4 seconds
    const interval = setInterval(() => {
      bc.postMessage({
        type: "PEER_ANNOUNCE",
        senderId: peerId,
        trainerName: trainer.name || "Challenger",
        teamSummary: team.slice(0, 3).map((p) => ({ id: p.id, name: p.name, level: p.level })),
      });
      // Purge stale peers > 10s
      setRemotePeers((prev) => prev.filter((p) => Date.now() - p.lastSeen < 10000));
    }, 4000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
      clearInterval(interval);
      bc.close();
      channelRef.current = null;
    };
  }, [peerId, trainer.name, team]);

  // Handle Initiating Challenge
  function handleSendChallenge(remotePeer) {
    if (!channelRef.current) return;
    const battleTeam = team.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      nickname: p.nickname || p.name,
      level: p.level,
      maxHp: p.maxHp,
      currentHp: p.maxHp,
      attack: p.attack,
      defense: p.defense,
      speed: p.speed,
      types: p.types,
      moves: p.moves || [{ name: "Tackle", type: "normal", power: 40 }],
    }));

    setMyRoster(battleTeam);
    setMyActiveIdx(0);

    channelRef.current.postMessage({
      type: "CHALLENGE_INVITE",
      senderId: peerId,
      targetId: remotePeer.id,
      trainerName: trainer.name || "Challenger",
      roster: battleTeam,
    });

    setMode("CHALLENGING");
  }

  // Handle Accepting Challenge
  function handleAcceptChallenge() {
    if (!channelRef.current || !incomingChallenge) return;

    const battleTeam = team.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      nickname: p.nickname || p.name,
      level: p.level,
      maxHp: p.maxHp,
      currentHp: p.maxHp,
      attack: p.attack,
      defense: p.defense,
      speed: p.speed,
      types: p.types,
      moves: p.moves || [{ name: "Tackle", type: "normal", power: 40 }],
    }));

    setMyRoster(battleTeam);
    setMyActiveIdx(0);

    setOppRoster(incomingChallenge.roster);
    setOppActiveIdx(0);

    setActiveDuelPeer({ id: incomingChallenge.senderId, name: incomingChallenge.trainerName });

    channelRef.current.postMessage({
      type: "CHALLENGE_ACCEPTED",
      senderId: peerId,
      targetId: incomingChallenge.senderId,
      trainerName: trainer.name || "Challenger",
      roster: battleTeam,
    });

    setIncomingChallenge(null);
    setMode("BATTLE");
    setIsMyTurn(false);
    setBattleDialogue(`Connected to ${incomingChallenge.trainerName}. Waiting for opponent's first attack...`);
    playBattleStartSound();
  }

  function handleDeclineChallenge() {
    setIncomingChallenge(null);
  }

  // Active Battlers
  const myMon = myRoster[myActiveIdx] || team[0];
  const oppMon = oppRoster[oppActiveIdx];

  // Send Attack
  function handleExecuteMove(move) {
    if (!isMyTurn || !myMon || !oppMon || !channelRef.current || !activeDuelPeer) return;

    setIsMyTurn(false);
    setBattleDialogue(`${myMon.nickname} used ${move.name}!`);
    setPlayerAnim("anim-player-lunge");
    setElementalVfx({ target: "leader", type: move.type });
    playAttackWhooshSound();

    setTimeout(() => {
      setPlayerAnim("");

      const isCrit = Math.random() < 0.1;
      const typeMult = getTypeDamageMultiplier(move.type, oppMon.types);
      const baseAtk = myMon.attack || 50;
      const oppDef = oppMon.defense || 50;

      const baseDmg = Math.floor((((2 * myMon.level) / 5 + 2) * move.power * (baseAtk / oppDef)) / 50) + 2;
      const finalDmg = Math.max(1, Math.floor(baseDmg * (isCrit ? 1.5 : 1.0) * typeMult));

      if (isCrit) playCriticalHitSound();
      else if (typeMult > 1) playSuperEffectiveSound();
      else playHitSound();

      // Update local view of opponent
      const nextOppHp = Math.max(0, oppMon.currentHp - finalDmg);
      const nextOppRoster = [...oppRoster];
      nextOppRoster[oppActiveIdx] = { ...oppMon, currentHp: nextOppHp };
      setOppRoster(nextOppRoster);

      // Broadcast move to remote tab
      channelRef.current.postMessage({
        type: "BATTLE_MOVE",
        senderId: peerId,
        targetId: activeDuelPeer.id,
        move: move,
        damage: finalDmg,
      });

      if (nextOppHp <= 0) {
        const nextOppAlive = nextOppRoster.findIndex((p, idx) => idx > oppActiveIdx && p.currentHp > 0);
        if (nextOppAlive !== -1) {
          setOppActiveIdx(nextOppAlive);
          setBattleDialogue(`${oppMon.nickname} fainted! Opponent sent out next Pokémon.`);
        } else {
          setBattleDialogue(`All opponent Pokémon fainted! You won the battle!`);
          playCatchSuccessJingle();
          setTimeout(() => setMode("VICTORY"), 1800);
        }
      } else {
        setBattleDialogue(`Waiting for opponent's response...`);
      }
    }, 700);
  }

  // Receive Attack from remote peer
  function handleReceiveOpponentMove(move, damage) {
    setOppAnim("anim-wild-hit");
    setSlashVfxFlash(true);
    setScreenShake(true);
    playHitSound();

    setBattleDialogue(`Opponent's ${oppMon.nickname} used ${move.name} dealing ${damage} damage!`);

    setTimeout(() => {
      setOppAnim("");
      setSlashVfxFlash(false);
      setScreenShake(false);

      const nextMyHp = Math.max(0, myMon.currentHp - damage);
      const nextMyRoster = [...myRoster];
      nextMyRoster[myActiveIdx] = { ...myMon, currentHp: nextMyHp };
      setMyRoster(nextMyRoster);

      if (nextMyHp <= 0) {
        playFaintSound();
        const nextAlive = nextMyRoster.findIndex((p) => p.currentHp > 0);
        if (nextAlive !== -1) {
          setMyActiveIdx(nextAlive);
          setBattleDialogue(`${myMon.nickname} fainted! Go, ${nextMyRoster[nextAlive].nickname}!`);
          setIsMyTurn(true);
        } else {
          setBattleDialogue("All your Pokémon fainted. Defeated in Link Battle.");
          setTimeout(() => setMode("DEFEAT"), 1800);
        }
      } else {
        setIsMyTurn(true);
        setBattleDialogue(`Your turn. Choose a move for ${myMon.nickname}.`);
      }
    }, 700);
  }

  useEffect(() => {
    handleReceiveOpponentMoveRef.current = handleReceiveOpponentMove;
  });

  function handleForfeit() {
    if (window.confirm("Forfeit this Link Battle and return to the lobby?")) {
      if (channelRef.current && activeDuelPeer) {
        channelRef.current.postMessage({
          type: "BATTLE_FORFEIT",
          senderId: peerId,
          targetId: activeDuelPeer.id,
          trainerName: trainer.name || "Challenger",
        });
      }
      setMode("LOBBY");
      setActiveDuelPeer(null);
    }
  }

  // ========================================================
  // RENDER: LOBBY
  // ========================================================
  if (mode === "LOBBY" || mode === "CHALLENGING") {
    return (
      <div className="link-page-container">
        {/* Apple Style Header */}
        <div className="link-header-banner">
          <div className="link-header-info">
            <h1 className="link-title">Link Battle</h1>
            <p className="link-subtitle">
              Real-time peer battles across browser windows using local channel sync.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.open(window.location.href, "_blank")}
            className="btn-link-action"
            title="Open in new window to battle yourself"
          >
            <IconExternalLink size={14} />
            <span>Open Second Tab</span>
          </button>
        </div>

        {/* Live Channel Status Card */}
        <div className="link-status-card">
          <div className="link-status-pill">
            <span className="status-live-dot"></span>
            <span>Link Channel Active • ID: {peerId}</span>
          </div>
          <p className="link-guide-text">
            Open this page in a second tab or window side-by-side to initiate a 3v3 live battle.
          </p>
        </div>

        {/* Incoming Challenge Alert */}
        {incomingChallenge && (
          <div className="incoming-challenge-card">
            <div className="incoming-challenge-content">
              <span className="incoming-badge">Duel Invite</span>
              <h3 className="incoming-challenge-title">
                {incomingChallenge.trainerName} wants to battle
              </h3>
              <p className="incoming-challenge-desc">3 vs 3 Pokémon team duel</p>
            </div>

            <div className="incoming-challenge-actions">
              <button
                type="button"
                onClick={handleAcceptChallenge}
                className="btn-accept-duel"
              >
                <IconCheck size={15} />
                <span>Accept</span>
              </button>
              <button
                type="button"
                onClick={handleDeclineChallenge}
                className="btn-decline-duel"
              >
                <IconX size={15} />
                <span>Decline</span>
              </button>
            </div>
          </div>
        )}

        {/* Peers Lobby Panel */}
        <div className="peers-panel">
          <div className="peers-panel-header">
            <h2 className="peers-panel-title">
              Available Challengers
              <span className="peers-count-badge">{remotePeers.length}</span>
            </h2>
          </div>

          <div className="peers-grid">
            {remotePeers.map((peer) => (
              <div key={peer.id} className="peer-card">
                <div className="peer-card-header">
                  <div className="peer-identity">
                    <span className="peer-status-dot"></span>
                    <h3 className="peer-trainer-name">{peer.name}</h3>
                  </div>
                  <span className="peer-tag">Ready</span>
                </div>

                <div className="peer-team-roster">
                  {peer.teamSummary.map((m, idx) => (
                    <div key={idx} className="peer-mon-chip" title={`${capitalize(m.name)} (Lv.${m.level})`}>
                      <img
                        src={getAnimatedSpriteUrl(m.id)}
                        alt={m.name}
                        className="peer-mon-sprite"
                      />
                      <span className="peer-mon-name">{capitalize(m.name)}</span>
                      <span className="peer-mon-lvl">Lv.{m.level}</span>
                    </div>
                  ))}
                  {peer.teamSummary.length === 0 && (
                    <span className="peer-empty-team">No team loaded</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSendChallenge(peer)}
                  className="btn-send-challenge"
                  disabled={mode === "CHALLENGING"}
                >
                  <IconSwords size={15} />
                  <span>{mode === "CHALLENGING" ? "Waiting for response..." : "Challenge"}</span>
                </button>
              </div>
            ))}

            {remotePeers.length === 0 && (
              <div className="empty-peers-notice">
                <div className="radar-pulse-ring">
                  <span className="radar-core"></span>
                </div>
                <h3 className="empty-peers-title">Searching for nearby trainers...</h3>
                <p className="empty-peers-desc">
                  Open another tab or window to start a match. Both instances will automatically discover each other.
                </p>
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, "_blank")}
                  className="btn-open-second-tab"
                >
                  <IconExternalLink size={14} />
                  <span>Launch Second Tab</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: BATTLE
  // ========================================================
  if (mode === "BATTLE" && myMon && oppMon) {
    const myHpPercent = Math.max(0, Math.min(100, Math.round((myMon.currentHp / myMon.maxHp) * 100)));
    const oppHpPercent = Math.max(0, Math.min(100, Math.round((oppMon.currentHp / oppMon.maxHp) * 100)));

    return (
      <div className="link-page-container">
        <div className={`battle-stage-container arena-gym-champion ${screenShake ? "screen-shake" : ""}`}>
          {/* Top HUD */}
          <div className="battle-top-hud">
            <div className="hud-chamber-badge">
              <IconSwords size={15} />
              <span>Link Duel • VS {activeDuelPeer?.name}</span>
            </div>
            <div className="hud-actions-right">
              <span className={`turn-turn-indicator ${isMyTurn ? "indicator-my-turn" : "indicator-waiting"}`}>
                <span className="turn-dot" />
                {isMyTurn ? "Your Turn" : "Opponent's Turn"}
              </span>
              <button
                type="button"
                onClick={handleForfeit}
                className="btn-battle-forfeit"
                title="Forfeit duel and return to lobby"
              >
                Forfeit
              </button>
            </div>
          </div>

          {/* Isometric Battle Stage */}
          <div className="battle-viewport camera-isometric">
            <BattleEnvironment arenaTheme="gym-champion" />

            {/* OPPONENT */}
            <div className="arena-battler-slot slot-opponent">
              <BattlePedestal theme="gym-champion" isOpponent={true} />
              <div className={`battler-sprite-wrap ${oppAnim}`}>
                <img
                  src={getAnimatedSpriteUrl(oppMon.id)}
                  alt={oppMon.name}
                  className="battle-sprite-mon opponent-mon-sprite"
                />
                {slashVfxFlash && <div className="slash-vfx-flash"></div>}
              </div>
              <div className="battle-status-card status-opponent">
                <div className="status-header">
                  <span className="battler-name">{oppMon.nickname}</span>
                  <span className="battler-level">Lv. {oppMon.level}</span>
                </div>
                <div className="status-hp-bar">
                  <div
                    className={`hp-fill ${oppHpPercent < 25 ? "hp-danger" : oppHpPercent < 55 ? "hp-warning" : "hp-healthy"}`}
                    style={{ width: `${oppHpPercent}%` }}
                  ></div>
                </div>
                <div className="status-hp-text">{oppMon.currentHp} / {oppMon.maxHp} HP</div>
              </div>
            </div>

            {/* PLAYER */}
            <div className="arena-battler-slot slot-player">
              <BattlePedestal theme="gym-champion" isOpponent={false} />
              <div className={`battler-sprite-wrap ${playerAnim}`}>
                <img
                  src={getAnimatedBackSpriteUrl(myMon.id) || getBackSpriteUrl(myMon.id)}
                  alt={myMon.nickname}
                  className="battle-sprite-mon player-mon-sprite"
                />
              </div>
              <div className="battle-status-card status-player">
                <div className="status-header">
                  <span className="battler-name">{myMon.nickname}</span>
                  <span className="battler-level">Lv. {myMon.level}</span>
                </div>
                <div className="status-hp-bar">
                  <div
                    className={`hp-fill ${myHpPercent < 25 ? "hp-danger" : myHpPercent < 55 ? "hp-warning" : "hp-healthy"}`}
                    style={{ width: `${myHpPercent}%` }}
                  ></div>
                </div>
                <div className="status-hp-text">{myMon.currentHp} / {myMon.maxHp} HP</div>
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

          {/* Controls Tray */}
          <div className="battle-controls-tray">
            {isMyTurn ? (
              <div className="moves-deck-grid">
                {(myMon.moves || []).map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => handleExecuteMove(m)}
                    className="move-pill-card"
                  >
                    <div className="move-pill-header">
                      <span className="move-name">{m.name}</span>
                      <TypeBadge type={m.type} size="xs" />
                    </div>
                    <div className="move-pill-footer">
                      <span className="move-power">Pow {m.power || 40}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="waiting-remote-turn">
                <span>Opponent is selecting their move...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: VICTORY / DEFEAT
  // ========================================================
  return (
    <div className="link-page-container">
      <div className={`link-result-card ${mode === "VICTORY" ? "result-victory" : "result-defeat"}`}>
        <div className="link-result-icon-wrap">
          {mode === "VICTORY" ? (
            <IconTrophy size={48} className="result-icon-victory" />
          ) : (
            <IconShield size={48} className="result-icon-defeat" />
          )}
        </div>
        <h1 className="result-title">{mode === "VICTORY" ? "Victory" : "Defeat"}</h1>
        <p className="result-desc">
          {mode === "VICTORY"
            ? "Congratulations! You proved your team's tactical strength in the Link Battle."
            : "Good match. Refine your lineup and challenge your rival again."}
        </p>
        <button
          type="button"
          onClick={() => setMode("LOBBY")}
          className="btn-return-lobby"
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
}
