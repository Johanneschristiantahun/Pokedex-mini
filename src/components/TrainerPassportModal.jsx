// ========================================================
// PokéSphere Official Trainer Passport & QR Code Card
// Generates official Kanto League Trainer Card with QR sharing
// Powered by QR Server Public API
// ========================================================

import { useGame } from "../context/GameContext.jsx";
import GymBadgeIcon from "./GymBadgeIcons.jsx";
import { IconCross, IconCrown, IconParty } from "./Icons.jsx";
import { getAnimatedSpriteUrl, capitalize } from "../utils.js";

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

export default function TrainerPassportModal({ isOpen, onClose }) {
  const { trainer, team, hasBadge, hallOfFame } = useGame();

  if (!isOpen) return null;

  const earnedBadgesCount = KANTO_BADGE_KEYS.filter((b) => hasBadge(b)).length;
  const isChampion = hallOfFame && hallOfFame.length > 0;

  // Build QR payload data
  const qrData = encodeURIComponent(
    JSON.stringify({
      trainer: trainer.name,
      badges: earnedBadgesCount,
      champion: isChampion,
      team: team.map((p) => ({
        id: p.id,
        name: p.name,
        lvl: p.level,
        shiny: Boolean(p.isShiny),
      })),
    })
  );

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}&color=1e1b4b&bgcolor=ffffff&margin=4`;

  return (
    <div className="passport-modal-backdrop" onClick={onClose}>
      <div
        className="passport-card-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-passport-close"
          aria-label="Close Trainer Passport"
        >
          <IconCross size={18} />
        </button>

        {/* Passport Header */}
        <div className="passport-card-header">
          <div className="passport-header-emblem">
            <IconCrown size={22} className="passport-crown-icon" />
            <span className="passport-league-text">POKÉMON LEAGUE OFFICIAL PASSPORT</span>
          </div>
          <span className="passport-region-badge">KANTO REGION</span>
        </div>

        {/* Main Body */}
        <div className="passport-body-grid">
          {/* Left Column: Trainer Identity */}
          <div className="passport-identity-col">
            <div className="passport-avatar-box">
              <img
                src="https://play.pokemonshowdown.com/sprites/trainers/red.png"
                alt="Trainer Red"
                className="passport-avatar-img"
              />
              {isChampion && <span className="passport-champ-stamp">CHAMPION</span>}
            </div>

            <div className="passport-meta-info">
              <div className="meta-field">
                <span className="meta-label">TRAINER NAME</span>
                <span className="meta-value">{trainer.name || "Trainer Red"}</span>
              </div>
              <div className="meta-field">
                <span className="meta-label">ID NO.</span>
                <span className="meta-value">#00151</span>
              </div>
              <div className="meta-field">
                <span className="meta-label">POKÉDOLLARS</span>
                <span className="meta-value money-color">
                  ₽ {trainer.money.toLocaleString()}
                </span>
              </div>
              <div className="meta-field">
                <span className="meta-label">BADGES WON</span>
                <span className="meta-value">{earnedBadgesCount} / 8 BADGES</span>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code & Team Lineup */}
          <div className="passport-qr-col">
            <div className="passport-qr-box">
              <img
                src={qrCodeUrl}
                alt="Trainer QR Code"
                className="passport-qr-image"
              />
              <span className="qr-caption">Scan to Battle / Inspect Team</span>
            </div>

            {/* Badges Matrix */}
            <div className="passport-badges-tray">
              <span className="tray-label">OFFICIAL GYM BADGES</span>
              <div className="passport-badges-row">
                {KANTO_BADGE_KEYS.map((k) => {
                  const owned = hasBadge(k);
                  return (
                    <div
                      key={k}
                      className={`passport-badge-slot ${owned ? "badge-owned" : "badge-missing"}`}
                      title={k.toUpperCase()}
                    >
                      <GymBadgeIcon badgeId={k} size={28} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Party Roster Showcase */}
        <div className="passport-party-strip">
          <div className="party-strip-header">
            <IconParty size={15} />
            <span>ACTIVE BATTLE ROSTER</span>
          </div>
          <div className="passport-party-grid">
            {team.map((member, idx) => (
              <div key={member.instanceId || idx} className="passport-mon-pill">
                <img
                  src={getAnimatedSpriteUrl(member.id)}
                  alt={member.name}
                  className="passport-mon-sprite"
                />
                <div className="passport-mon-info">
                  <span className="mon-name">{member.nickname || capitalize(member.name)}</span>
                  <span className="mon-lvl">Lv. {member.level}</span>
                </div>
              </div>
            ))}
            {team.length === 0 && (
              <span className="empty-party-note">No Pokémon in party yet.</span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="passport-footer">
          <span className="passport-serial">
            VERIFIED BY INDIGO PLATEAU LEAGUE COMMISSION • {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}
