// ========================================================
// PokéSphere Game Boy Link Cable PvP Arena & Trade Station (/link)
// Real-time peer communication across browser tabs using BroadcastChannel API
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
  IconSparkles,
  IconRefresh,
  IconCheck,
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
  const [peerId] = useState(() => `peer_${Math.random().toString(36).slice(2, 8)}`);

  // Channel & Connected Peers
  const [channel, setChannel] = useState(null);
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
    setChannel(bc);

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
        setBattleDialogue(`Link Battle started with ${data.trainerName}! Choose your move!`);
        playBattleStartSound();
      }

      if (data.type === "BATTLE_MOVE" && data.targetId === peerId) {
        // Receive opponent move
        handleReceiveOpponentMoveRef.current?.(data.move, data.damage);
      }

      if (data.type === "PEER_DISCONNECT") {
        setRemotePeers((prev) => prev.filter((p) => p.id !== data.senderId));
        if (activeDuelPeerRef.current && activeDuelPeerRef.current.id === data.senderId) {
          setBattleDialogue("Opponent disconnected from the Link Cable session!");
          setTimeout(() => {
            alert("Opponent closed their tab or disconnected. Returning to lobby.");
            setMode("LOBBY");
            setActiveDuelPeer(null);
          }, 1000);
        }
      }

      if (data.type === "BATTLE_FORFEIT" && data.targetId === peerId) {
        setBattleDialogue(`${data.trainerName || "Opponent"} has forfeited the match!`);
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
    };
  }, [peerId, trainer.name, team]);

  // Handle Initiating Challenge
  function handleSendChallenge(remotePeer) {
    if (!channel) return;
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

    channel.postMessage({
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
    if (!channel || !incomingChallenge) return;

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

    channel.postMessage({
      type: "CHALLENGE_ACCEPTED",
      senderId: peerId,
      targetId: incomingChallenge.senderId,
      trainerName: trainer.name || "Challenger",
      roster: battleTeam,
    });

    setIncomingChallenge(null);
    setMode("BATTLE");
    setIsMyTurn(false); // Guest waits for Host's first move
    setBattleDialogue(`Link Battle connected! Waiting for ${incomingChallenge.trainerName}'s first attack...`);
    playBattleStartSound();
  }

  // Active Battlers
  const myMon = myRoster[myActiveIdx] || team[0];
  const oppMon = oppRoster[oppActiveIdx];

  // Send Attack
  function handleExecuteMove(move) {
    if (!isMyTurn || !myMon || !oppMon || !channel || !activeDuelPeer) return;

    setIsMyTurn(false);
    setBattleDialogue(`${myMon.nickname.toUpperCase()} used ${move.name.toUpperCase()}!`);
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
      channel.postMessage({
        type: "BATTLE_MOVE",
        senderId: peerId,
        targetId: activeDuelPeer.id,
        move: move,
        damage: finalDmg,
      });

      if (nextOppHp <= 0) {
        // Opponent mon fainted
        const nextOppAlive = nextOppRoster.findIndex((p, idx) => idx > oppActiveIdx && p.currentHp > 0);
        if (nextOppAlive !== -1) {
          setOppActiveIdx(nextOppAlive);
          setBattleDialogue(`${oppMon.nickname.toUpperCase()} fainted! Opponent sent out next Pokémon.`);
        } else {
          // We won!
          setBattleDialogue(`All opponent Pokémon fainted! You emerged victorious in the Link Cable Duel!`);
          playCatchSuccessJingle();
          setTimeout(() => setMode("VICTORY"), 2000);
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

    setBattleDialogue(`Opponent's ${oppMon.nickname.toUpperCase()} used ${move.name.toUpperCase()} dealing ${damage} damage!`);

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
          setBattleDialogue(`${myMon.nickname.toUpperCase()} fainted! Go, ${nextMyRoster[nextAlive].nickname.toUpperCase()}!`);
          setIsMyTurn(true);
        } else {
          setBattleDialogue("All your Pokémon fainted! Defeated in Link Cable Duel.");
          setTimeout(() => setMode("DEFEAT"), 2000);
        }
      } else {
        setIsMyTurn(true);
        setBattleDialogue(`It's your turn! What will ${myMon.nickname.toUpperCase()} do?`);
      }
    }, 700);
  }

  useEffect(() => {
    handleReceiveOpponentMoveRef.current = handleReceiveOpponentMove;
  });

  function handleForfeit() {
    if (window.confirm("Are you sure you want to forfeit this Link Battle and return to the lobby?")) {
      if (channel && activeDuelPeer) {
        channel.postMessage({
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
        <div className="link-hero-banner">
          <div className="link-cable-plug-icon">
            <IconSwords size={32} />
          </div>
          <h1 className="link-title">Game Boy Link Cable PvP Arena</h1>
          <p className="link-subtitle">
            Battle your Pokémon team live in real-time across two browser tabs or windows using the BroadcastChannel API!
          </p>
        </div>

        {/* Multi-Tab Testing Helper Banner */}
        <div className="link-instructions-box">
          <h4 className="instructions-title">💡 How to Test Multi-Tab PvP Duel:</h4>
          <ol className="instructions-list">
            <li>Duplicate this tab or open <code>/#/link</code> in a second browser window side-by-side.</li>
            <li>Both tabs will automatically discover each other via Link Cable heartbeat.</li>
            <li>Click <strong>"Issue PvP Challenge"</strong> on Tab 1, and click <strong>"Accept Challenge"</strong> on Tab 2!</li>
          </ol>
        </div>

        {/* Incoming Challenge Alert */}
        {incomingChallenge && (
          <div className="incoming-challenge-card">
            <IconSparkles size={24} className="incoming-challenge-icon" />
            <div className="incoming-challenge-body">
              <h3 className="incoming-challenge-title">
                {incomingChallenge.trainerName} has challenged you to a Link Duel!
              </h3>
              <p className="incoming-challenge-subtitle">3 vs 3 Pokémon tactical battle.</p>
            </div>
            <button
              type="button"
              onClick={handleAcceptChallenge}
              className="btn-accept-challenge"
            >
              <IconCheck size={18} />
              <span>Accept Duel</span>
            </button>
          </div>
        )}

        {/* Discovered Peers Grid */}
        <div className="peers-panel">
          <div className="peers-panel-header">
            <span className="peers-count-label">
              Active Link Cable Peers Detected: {remotePeers.length}
            </span>
            <span className="my-peer-tag">Your ID: {peerId}</span>
          </div>

          <div className="peers-grid">
            {remotePeers.map((peer) => (
              <div key={peer.id} className="peer-card">
                <div className="peer-card-header">
                  <span className="peer-status-dot"></span>
                  <h3 className="peer-trainer-name">{peer.name}</h3>
                </div>

                <div className="peer-team-roster">
                  {peer.teamSummary.map((m, idx) => (
                    <div key={idx} className="peer-mon-chip">
                      <img
                        src={getAnimatedSpriteUrl(m.id)}
                        alt={m.name}
                        className="peer-mon-sprite"
                      />
                      <span className="peer-mon-name">{capitalize(m.name)} (Lv.{m.level})</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleSendChallenge(peer)}
                  className="btn-send-challenge"
                  disabled={mode === "CHALLENGING"}
                >
                  <IconSwords size={16} />
                  <span>{mode === "CHALLENGING" ? "Invitation Sent..." : "Issue PvP Challenge"}</span>
                </button>
              </div>
            ))}

            {remotePeers.length === 0 && (
              <div className="empty-peers-notice">
                <IconRefresh size={32} className="spin-refresh-icon" />
                <p>Waiting for a second tab to connect...</p>
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, "_blank")}
                  className="btn-open-second-tab"
                >
                  Open Second Tab in New Window
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
          <div className="battle-top-hud">
            <div className="hud-chamber-badge">
              <IconSwords size={16} style={{ marginRight: 6 }} />
              <span>Link Duel VS {activeDuelPeer.name}</span>
            </div>
            <div className="hud-actions-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className={`turn-turn-indicator ${isMyTurn ? "indicator-my-turn" : "indicator-waiting"}`}>
                {isMyTurn ? "🟢 YOUR TURN" : "⏳ OPPONENT'S TURN"}
              </span>
              <button
                type="button"
                onClick={handleForfeit}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#f87171",
                  cursor: "pointer",
                }}
                title="Forfeit duel and return to lobby"
              >
                Forfeit
              </button>
            </div>
          </div>

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

          <div className="battle-dialogue-banner">
            <p className="dialogue-text">{battleDialogue}</p>
          </div>

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
                <span>Opponent is selecting their move over Link Cable...</span>
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
        <h1 className="result-title">{mode === "VICTORY" ? "LINK DUEL VICTORY!" : "LINK DUEL DEFEAT"}</h1>
        <p className="result-desc">
          {mode === "VICTORY"
            ? "Congratulations! You proved your tactical mastery over your Link Cable rival!"
            : "Good match! Refine your team composition and battle again!"}
        </p>
        <button
          type="button"
          onClick={() => setMode("LOBBY")}
          className="btn-return-lobby"
        >
          Return to Link Cable Lobby
        </button>
      </div>
    </div>
  );
}
