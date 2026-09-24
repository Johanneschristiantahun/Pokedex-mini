import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import TypeBadge from "../components/TypeBadge.jsx";
import {
  IconPokeball,
  IconCross,
  IconHeart,
  IconPotion,
  IconCrown,
  IconPencil,
  IconCheck,
  IconBackpack,
  IconPlus,
  IconSparkles,
  IconRefresh,
  IconChevronUp,
  IconChevronDown,
  IconTrees,
  IconParty,
} from "../components/Icons.jsx";
import { playHealingJingle } from "../utils/soundEffects.js";
import { capitalize, getTypeColor, formatPokemonId } from "../utils.js";
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

      {/* Trainer Dashboard Header */}
      <div className="trainer-dashboard-card">
        <div className="trainer-profile">
          <div className="trainer-avatar-box">
            <IconPokeball size={26} className="trainer-avatar-icon" />
          </div>
          <div className="trainer-meta">
            {isEditingTrainerName ? (
              <div className="trainer-name-edit-box">
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
                  title="Save Trainer Name"
                >
                  <IconCheck size={14} />
                </button>
              </div>
            ) : (
              <div className="trainer-name-display-row">
                <h2 className="trainer-name">{trainer.name}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setTrainerNameInput(trainer.name);
                    setIsEditingTrainerName(true);
                  }}
                  className="btn-rename-trainer-icon"
                  title="Change Trainer Name"
                >
                  <IconPencil size={13} />
                </button>
              </div>
            )}
            <div className="trainer-badges-row">
              <span className="trainer-title-badge">Pokémon Trainer</span>
              <span className="trainer-money-badge">
                ₽ {trainer.money.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Pokémon Center Healing Station */}
        <div className="pokemon-center-box">
          <div className="center-info">
            <div className="center-header-row">
              <IconCross size={18} className="center-cross-icon" />
              <h4>Pokémon Center Station</h4>
            </div>
            <p>Restore full HP and cure status conditions for all 6 party members.</p>
          </div>
          <button
            type="button"
            onClick={handleHealCenter}
            disabled={isHealing || team.length === 0}
            className={`btn-heal-all ${isHealing ? "healing-pulse" : ""}`}
          >
            <IconHeart size={16} />
            <span>{isHealing ? "Restoring HP…" : "Heal All Team (Free)"}</span>
          </button>
        </div>

        {/* Kanto Gym Badges Showcase Case */}
        <div className="trainer-badge-case-panel">
          <div className="badge-case-header">
            <span className="case-title">
              Official Kanto League Badges ({trainer.badges?.length || 0}/8)
            </span>
            <Link to="/gym" className="case-gym-link">
              Challenge Gym Leaders &rarr;
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
                  <GymBadgeIcon badgeId={b.id} size={32} isLocked={!isOwned} />
                  <span className="badge-slot-caption">{b.name.replace(" Badge", "")}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team vs PC Storage Box Tab Switcher */}
      <div className="team-storage-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("party")}
          className={`storage-tab-btn ${activeTab === "party" ? "active" : ""}`}
        >
          <IconParty size={16} />
          <span>Active Party ({team.length}/6)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("box")}
          className={`storage-tab-btn ${activeTab === "box" ? "active" : ""}`}
        >
          <IconPokeball size={16} />
          <span>PC Storage Box ({box.length} stored)</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE PARTY (6 SLOTS) */}
      {activeTab === "party" && (
        <>
          {/* Party Status Bar */}
          <div className="party-header-bar">
            <h3>
              Active Party <span>({team.length} / 6 Pokémon)</span>
            </h3>
            <div className="party-header-actions">
              <span className="potion-stock-badge">
                <IconPotion size={15} />
                <span>Potions: <strong>{potionCount}</strong></span>
              </span>
              <Link to="/bag" className="btn-open-bag" title="Open Bag to use other medicine or candies">
                <IconBackpack size={15} />
                <span>Trainer Bag</span>
              </Link>
            </div>
          </div>

          {/* 6 Party Slots Grid */}
          <div className="party-grid">
            {partySlots.map((pokemon, slotIndex) => {
              if (!pokemon) {
                // Empty Slot
                return (
                  <div key={`empty-${slotIndex}`} className="empty-party-slot">
                    <div className="empty-slot-icon">
                      <IconPokeball size={32} />
                    </div>
                    <h4>Slot #{slotIndex + 1}: Empty</h4>
                    <p>Add Pokémon from PokéDex, catch in Wilderness, or withdraw from PC Box.</p>
                    <div className="empty-slot-btn-group">
                      <Link to="/" className="btn-browse-dex">
                        <IconPlus size={14} />
                        <span>PokéDex</span>
                      </Link>
                      <Link to="/wilderness" className="btn-browse-wilderness">
                        <IconTrees size={14} />
                        <span>Wilderness</span>
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
                        {isLeader ? (
                          <>
                            <IconCrown size={14} />
                            <span>Leader (#1)</span>
                          </>
                        ) : (
                          <span>Slot #{slotIndex + 1}</span>
                        )}
                      </div>
                      {pokemon.isStarter && (
                        <span className="starter-partner-pill" title="Your first companion from Professor Oak">
                          <IconSparkles size={11} />
                          <span>Partner</span>
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
                      <IconPotion size={14} />
                      <span>Potion (+20)</span>
                    </button>

                    {!isLeader && (
                      <button
                        type="button"
                        onClick={() => setTeamLeader(pokemon.instanceId)}
                        className="btn-action-leader"
                        title="Set as party leader"
                      >
                        <IconCrown size={14} />
                        <span>Leader</span>
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
                        title="Move to PC Storage Box"
                      >
                        <span>To PC Box</span>
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
        </>
      )}

      {/* TAB 2: PC STORAGE BOX (BILL'S PC) */}
      {activeTab === "box" && (
        <div className="pc-box-container">
          <div className="pc-box-header">
            <div>
              <h3>Bill's PC — Pokémon Storage Box</h3>
              <p>Reserve Pokémon caught from Wilderness expeditions or saved from the party.</p>
            </div>
            <span className="pc-box-count-badge">
              <strong>{box.length}</strong> Stored
            </span>
          </div>

          {box.length === 0 ? (
            <div className="pc-box-empty-box">
              <IconPokeball size={44} className="pc-empty-icon" />
              <h4>PC Storage Box is Empty!</h4>
              <p>Catch wild Pokémon in the Wilderness or deposit party members to store them here.</p>
              <Link to="/wilderness" className="btn-primary">
                <IconTrees size={16} />
                <span>Go to Wilderness</span>
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
                      <span className="pc-card-id">{formatPokemonId(p.id)}</span>
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
                      <span>HP: {p.currentHp}/{p.maxHp}</span>
                      <span>Atk: {p.attack}</span>
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
                        title={team.length >= 6 ? "Party Full (6/6)" : "Withdraw to Active Party"}
                      >
                        <IconPlus size={14} />
                        <span>Withdraw</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to release ${p.nickname} back into the wild?`
                            )
                          ) {
                            const res = releaseFromBox(p.instanceId);
                            showToast(res.message);
                          }
                        }}
                        className="btn-pc-release"
                        title="Release Pokémon"
                      >
                        <IconCross size={14} />
                        <span>Release</span>
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
          <IconRefresh size={14} />
          <span>New Journey / Reset Save Data</span>
        </button>
      </div>
    </div>
  );
}

export default TeamPage;
