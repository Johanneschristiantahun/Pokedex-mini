import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import {
  IconPokeball,
  IconPencil,
  IconCheck,
  IconChevronUp,
  IconChevronDown,
} from "../components/Icons.jsx";
import { playHealingJingle } from "../utils/soundEffects.js";
import { capitalize, getTypeColor, formatPokemonId, getAnimatedSpriteUrl } from "../utils.js";
import { calculateExpNeeded } from "../utils/pokemonFactory.js";
import GymBadgeIcon from "../components/GymBadgeIcons.jsx";

const KANTO_BADGES = [
  { id: "boulder", name: "Boulder Badge", leader: "Brock" },
  { id: "cascade", name: "Cascade Badge", leader: "Misty" },
  { id: "thunder", name: "Thunder Badge", leader: "Lt. Surge" },
  { id: "rainbow", name: "Rainbow Badge", leader: "Erika" },
  { id: "soul", name: "Soul Badge", leader: "Koga" },
  { id: "marsh", name: "Marsh Badge", leader: "Sabrina" },
  { id: "volcano", name: "Volcano Badge", leader: "Blaine" },
  { id: "earth", name: "Earth Badge", leader: "Giovanni" },
];

function TeamPage() {
  const {
    trainer,
    team,
    box,
    getItemCount,
    healAllPokemon,
    applyItemToPokemon,
    renamePokemon,
    removeFromTeam,
    setTeamLeader,
    movePokemonInTeam,
    depositToBox,
    withdrawFromBox,
    releaseFromBox,
    setTrainerName,
    resetGameSession,
    hallOfFame,
  } = useGame();

  const [activeTab, setActiveTab] = useState("party"); // "party" | "box"
  const [notification, setNotification] = useState(null);
  const [isHealing, setIsHealing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newNick, setNewNick] = useState("");
  const [isEditingTrainerName, setIsEditingTrainerName] = useState(false);
  const [trainerNameInput, setTrainerNameInput] = useState(trainer.name);

  const potionCount = getItemCount("potion");

  function showToast(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  function handleHealCenter() {
    setIsHealing(true);
    playHealingJingle();
    healAllPokemon();
    setTimeout(() => {
      setIsHealing(false);
      showToast("Nurse Joy: All your Pokémon are restored to full health!");
    }, 1000);
  }

  function handleUsePotion(instanceId) {
    const res = applyItemToPokemon("potion", instanceId);
    showToast(res.message);
  }

  function handleRelease(instanceId) {
    const target = team.find((p) => p.instanceId === instanceId);
    if (!target) return;
    const confirmRelease = window.confirm(
      `Are you sure you want to release ${target.nickname} back into the wild?`
    );
    if (confirmRelease) {
      const res = removeFromTeam(instanceId);
      showToast(res.message);
    }
  }

  function handleStartRename(p) {
    setEditingId(p.instanceId);
    setNewNick(p.nickname);
  }

  function handleSaveRename(instanceId) {
    renamePokemon(instanceId, newNick);
    setEditingId(null);
    showToast("Nickname updated!");
  }

  function handleSaveTrainerName() {
    setTrainerName(trainerNameInput);
    setIsEditingTrainerName(false);
    showToast("Trainer name updated!");
  }

  function handleResetJourney() {
    const confirmed = window.confirm(
      "Are you sure you want to start a new journey? This will reset your active party, money, and bag items to initial starter state!"
    );
    if (confirmed) {
      resetGameSession();
      showToast("New journey started! You can now choose your starter again.");
    }
  }

  // Create array of 6 slots (filled + empty)
  const partySlots = Array.from({ length: 6 }).map((_, index) => team[index] || null);

  return (
    <div className="team-page">
      {/* Toast Notification */}
      {notification && <div className="toast-notification">{notification}</div>}

      {/* Clean Top Header & Utility Bar */}
      <div className="team-page-header">
        <div className="team-header-identity">
          <div className="team-title-row">
            <h1 className="team-page-title">Party & Storage</h1>
            {isEditingTrainerName ? (
              <div className="trainer-name-inline-edit">
                <input
                  type="text"
                  value={trainerNameInput}
                  onChange={(e) => setTrainerNameInput(e.target.value)}
                  maxLength={16}
                  className="trainer-name-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTrainerName}
                  className="btn-save-trainer-name"
                  title="Save Name"
                >
                  <IconCheck size={13} />
                </button>
              </div>
            ) : (
              <span className="trainer-name-pill">
                <span>Trainer: <strong>{trainer.name.replace(/^Trainer\s+/i, "") || trainer.name}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setTrainerNameInput(trainer.name.replace(/^Trainer\s+/i, "") || trainer.name);
                    setIsEditingTrainerName(true);
                  }}
                  className="btn-rename-trainer-icon"
                  title="Edit Trainer Name"
                >
                  <IconPencil size={11} />
                </button>
              </span>
            )}
          </div>
          <p className="team-page-subtitle">
            Manage your active roster and Pokémon storage.
          </p>
        </div>

        <div className="team-header-utilities">
          <button
            type="button"
            onClick={handleHealCenter}
            disabled={isHealing || team.length === 0}
            className={`btn-heal-team ${isHealing ? "healing" : ""}`}
            title="Restore party to full health"
          >
            {isHealing ? "Restoring…" : "Heal Party"}
          </button>

          <span className="potion-stock-badge">
            Potions: <strong>{potionCount}</strong>
          </span>

          <Link to="/bag" className="btn-team-header-bag">
            Bag
          </Link>
        </div>
      </div>

      {/* Team vs PC Storage Box Tab Switcher */}
      <div className="team-storage-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("party")}
          className={`storage-tab-btn ${activeTab === "party" ? "active" : ""}`}
        >
          Active Party ({team.length}/6)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("box")}
          className={`storage-tab-btn ${activeTab === "box" ? "active" : ""}`}
        >
          Storage Box ({box.length})
        </button>
      </div>

      {/* TAB 1: ACTIVE PARTY (6 SLOTS) */}
      {activeTab === "party" && (
        <div className="party-tab-content">
          {/* 6 Party Slots Grid */}
          <div className="party-grid">
            {partySlots.map((pokemon, slotIndex) => {
              if (!pokemon) {
                // Empty Slot
                return (
                  <div key={`empty-${slotIndex}`} className="empty-party-slot">
                    <div className="empty-slot-icon">
                      <IconPokeball size={28} />
                    </div>
                    <h4>Empty Slot</h4>
                    <p>Select Pokémon from PokéDex or catch in Wilderness.</p>
                    <div className="empty-slot-btn-group">
                      <Link to="/" className="btn-browse-dex">
                        Add from PokéDex
                      </Link>
                      <Link to="/wilderness" className="btn-browse-wilderness">
                        Wilderness
                      </Link>
                    </div>
                  </div>
                );
              }

              // Filled Slot
              const isLeader = slotIndex === 0;
              const primaryType = pokemon.types[0] || "normal";
              const theme = getTypeColor(primaryType);
              const hpPercent = Math.max(
                0,
                Math.round((pokemon.currentHp / pokemon.maxHp) * 100)
              );

              let hpColor = "#38a169"; // Green
              if (hpPercent <= 20) hpColor = "#e53e3e"; // Red
              else if (hpPercent <= 50) hpColor = "#dd6b20"; // Orange

              const isFainted = pokemon.currentHp <= 0;

              return (
                <div
                  key={pokemon.instanceId}
                  className={`party-card ${isLeader ? "party-card-leader" : ""} ${
                    isFainted ? "party-card-fainted" : ""
                  }`}
                  style={{
                    "--slot-accent": theme.primary,
                    "--slot-bg": theme.bg,
                  }}
                >
                  {/* Card Header */}
                  <div className="party-card-top">
                    <div className="slot-pill-group">
                      <div className="slot-pill">
                        {isLeader ? "Leader" : `Slot #${slotIndex + 1}`}
                      </div>
                      {pokemon.isStarter && (
                        <span className="starter-partner-pill">
                          Partner
                        </span>
                      )}
                    </div>

                    <div className="card-top-right-group">
                      {/* Slot Reorder Controls */}
                      {team.length > 1 && (
                        <div className="slot-order-controls">
                          <button
                            type="button"
                            onClick={() => movePokemonInTeam(pokemon.instanceId, -1)}
                            disabled={slotIndex === 0}
                            className="btn-slot-order"
                            title="Move Pokémon Up / Left"
                            aria-label="Move Pokémon up in party"
                          >
                            <IconChevronUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => movePokemonInTeam(pokemon.instanceId, 1)}
                            disabled={slotIndex === team.length - 1}
                            className="btn-slot-order"
                            title="Move Pokémon Down / Right"
                            aria-label="Move Pokémon down in party"
                          >
                            <IconChevronDown size={12} />
                          </button>
                        </div>
                      )}
                      <div className="level-pill">Lv. {pokemon.level}</div>
                    </div>
                  </div>

                  {/* Sprite Showcase */}
                  <div className="party-sprite-box">
                    <img
                      src={pokemon.sprites.animated}
                      alt={pokemon.name}
                      className={`party-animated-sprite ${isFainted ? "sprite-fainted" : ""}`}
                      onError={(e) => {
                        e.target.src = pokemon.sprites.static;
                      }}
                    />
                  </div>

                  {/* Identification */}
                  <div className="party-info">
                    {editingId === pokemon.instanceId ? (
                      <div className="inline-rename-box">
                        <input
                          type="text"
                          value={newNick}
                          onChange={(e) => setNewNick(e.target.value)}
                          maxLength={14}
                          className="rename-input"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(pokemon.instanceId)}
                          className="btn-save-nick"
                          title="Save nickname"
                        >
                          <IconCheck size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="nickname-display-row">
                        <h4 className="party-nickname">{pokemon.nickname}</h4>
                        <button
                          type="button"
                          onClick={() => handleStartRename(pokemon)}
                          className="btn-rename-icon"
                          title="Rename Pokémon"
                        >
                          <IconPencil size={13} />
                        </button>
                      </div>
                    )}
                    <span className="party-species-name">
                      {capitalize(pokemon.name)} ({formatPokemonId(pokemon.id)})
                    </span>

                    <div className="party-types-row">
                      {pokemon.types.map((t) => (
                        <TypeBadge key={t} type={t} size="sm" />
                      ))}
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="party-hp-section">
                    <div className="hp-label-row">
                      <span className="hp-tag">HP</span>
                      <span className="hp-values">
                        {pokemon.currentHp} / {pokemon.maxHp}
                      </span>
                    </div>
                    <div className="hp-track">
                      <div
                        className="hp-fill"
                        style={{
                          width: `${hpPercent}%`,
                          backgroundColor: hpColor,
                        }}
                      ></div>
                    </div>
                    {isFainted && <span className="fainted-tag">FAINTED</span>}
                  </div>

                  {/* EXP Progress Bar */}
                  {(() => {
                    const currentLevelBase = calculateExpNeeded(pokemon.level);
                    const nextLevelTarget =
                      pokemon.expToNextLevel || calculateExpNeeded(pokemon.level + 1);
                    const currentExp = pokemon.exp || currentLevelBase;
                    const expRange = Math.max(1, nextLevelTarget - currentLevelBase);
                    const expPercent = Math.min(
                      100,
                      Math.max(
                        0,
                        Math.round(
                          ((currentExp - currentLevelBase) / expRange) * 100
                        )
                      )
                    );

                    return (
                      <div className="party-exp-section">
                        <div className="exp-label-row">
                          <span className="exp-tag">EXP</span>
                          <span className="exp-values">
                            {currentExp.toLocaleString()} / {nextLevelTarget.toLocaleString()}
                          </span>
                        </div>
                        <div
                          className="exp-track"
                          title={`${expPercent}% towards Lv. ${pokemon.level + 1}`}
                        >
                          <div
                            className="exp-fill"
                            style={{ width: `${expPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Stats Preview (5 stats) */}
                  <div className="party-mini-stats">
                    <span>Atk: <strong>{pokemon.attack}</strong></span>
                    <span>Def: <strong>{pokemon.defense}</strong></span>
                    <span>Sp.A: <strong>{pokemon.spAttack || "—"}</strong></span>
                    <span>Sp.D: <strong>{pokemon.spDefense || "—"}</strong></span>
                    <span>Spd: <strong>{pokemon.speed}</strong></span>
                  </div>

                  {/* Moveset Badges */}
                  {pokemon.moves && pokemon.moves.length > 0 && (
                    <div className="party-moves-list">
                      {pokemon.moves.map((m, mIdx) => (
                        <span key={mIdx} className="mini-move-tag">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Toolbar */}
                  <div className="party-actions-toolbar">
                    <button
                      type="button"
                      onClick={() => handleUsePotion(pokemon.instanceId)}
                      disabled={pokemon.currentHp >= pokemon.maxHp || potionCount <= 0}
                      className="btn-action-potion"
                      title="Restore 20 HP with Potion"
                    >
                      Potion (+20)
                    </button>

                    {!isLeader && (
                      <button
                        type="button"
                        onClick={() => setTeamLeader(pokemon.instanceId)}
                        className="btn-action-leader"
                        title="Set as party leader"
                      >
                        Set Leader
                      </button>
                    )}

                    {team.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = depositToBox(pokemon.instanceId);
                          if (res.success) showToast(res.message);
                        }}
                        className="btn-action-deposit"
                        title="Move to Storage Box"
                      >
                        To Box
                      </button>
                    )}

                    {team.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRelease(pokemon.instanceId)}
                        className="btn-action-release"
                        title="Release Pokémon"
                      >
                        Release
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trainer Badges & League Progress Showcase Panel */}
          <div className="trainer-league-summary-card">
            <div className="trainer-summary-header">
              <span className="case-title">
                Gym Badges ({trainer.badges?.length || 0}/8)
              </span>
              <Link to="/gym" className="case-gym-link">
                Challenge Gyms &rarr;
              </Link>
            </div>
            <div className="badge-case-slots-grid">
              {KANTO_BADGES.map((b) => {
                const isOwned = (trainer.badges || []).includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`badge-slot-cell ${isOwned ? "slot-unlocked" : "slot-locked"}`}
                    title={`${b.name} - ${isOwned ? "Earned!" : "Defeat " + b.leader + " to earn"}`}
                  >
                    <GymBadgeIcon badgeId={b.id} size={28} isLocked={!isOwned} />
                    <span className="badge-slot-caption">{b.name.replace(" Badge", "")}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hall of Fame Inductions Showcase Panel */}
          {hallOfFame && hallOfFame.length > 0 && (
            <div className="trainer-hof-panel">
              <div className="hof-panel-header">
                <div className="hof-header-left">
                  <span className="case-title">
                    Hall of Fame ({hallOfFame.length})
                  </span>
                </div>
                <Link to="/league" className="case-gym-link">
                  Indigo Plateau &rarr;
                </Link>
              </div>
              <div className="hof-entries-list">
                {hallOfFame.map((entry) => (
                  <div key={entry.id} className="hof-record-card">
                    <div className="hof-record-meta">
                      <span className="hof-record-date">
                        {entry.date}
                      </span>
                      <span className="hof-record-champ">Champion: <strong>{entry.trainerName}</strong></span>
                    </div>
                    <div className="hof-record-sprites">
                      {entry.team?.map((mon, mIdx) => (
                        <div
                          key={mIdx}
                          className="hof-mon-thumbnail"
                          title={`${mon.nickname} (Lv. ${mon.level})`}
                        >
                          <img
                            src={getAnimatedSpriteUrl(mon.id)}
                            alt={mon.name}
                            className="hof-thumb-img"
                          />
                          <span className="hof-thumb-lvl">Lv.{mon.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PC STORAGE BOX */}
      {activeTab === "box" && (
        <div className="pc-box-container">
          <div className="pc-box-header">
            <div>
              <h3>Storage Box</h3>
              <p>{box.length} Pokémon stored</p>
            </div>
          </div>

          {box.length === 0 ? (
            <div className="pc-box-empty-box">
              <IconPokeball size={36} className="pc-empty-icon" />
              <h4>Storage Box is Empty</h4>
              <p>Catch wild Pokémon in the Wilderness or deposit party members to store them here.</p>
              <Link to="/wilderness" className="btn-primary">
                Wilderness
              </Link>
            </div>
          ) : (
            <div className="pc-box-grid">
              {box.map((p) => {
                const primaryType = p.types?.[0] || "normal";
                const theme = getTypeColor(primaryType);

                return (
                  <div
                    key={p.instanceId}
                    className="pc-box-card"
                    style={{
                      "--box-card-accent": theme.primary,
                      "--box-card-bg": theme.bg,
                    }}
                  >
                    <div className="pc-card-header">
                      <span className="pc-card-id">#{formatPokemonId(p.id)}</span>
                      <span className="pc-card-level">Lv. {p.level}</span>
                    </div>

                    <div className="pc-card-sprite-box">
                      <img
                        src={p.sprites?.animated || p.sprites?.static}
                        alt={p.name}
                        className="pc-card-sprite"
                        onError={(e) => {
                          e.target.src =
                            p.sprites?.static ||
                            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
                        }}
                      />
                    </div>

                    <h4 className="pc-card-name">{p.nickname}</h4>
                    <span className="pc-card-species">{capitalize(p.name)}</span>

                    <div className="pc-card-types">
                      {p.types?.map((t) => (
                        <TypeBadge key={t} type={t} size="sm" />
                      ))}
                    </div>

                    <div className="pc-card-stats-mini">
                      <span>HP {p.currentHp}/{p.maxHp}</span>
                      <span>Atk {p.attack}</span>
                    </div>

                    <div className="pc-card-actions">
                      <button
                        type="button"
                        onClick={() => {
                          const res = withdrawFromBox(p.instanceId);
                          showToast(res.message);
                        }}
                        disabled={team.length >= 6}
                        className="btn-pc-withdraw"
                      >
                        {team.length >= 6 ? "Party Full" : "Withdraw"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to release ${p.nickname}?`
                            )
                          ) {
                            const res = releaseFromBox(p.instanceId);
                            showToast(res.message);
                          }
                        }}
                        className="btn-pc-release"
                      >
                        Release
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Danger Zone / Reset Journey */}
      <div className="team-footer-zone">
        <button
          type="button"
          onClick={handleResetJourney}
          className="btn-reset-journey"
          title="Restart game session from the beginning"
        >
          Reset Save Data
        </button>
      </div>
    </div>
  );
}

export default TeamPage;
