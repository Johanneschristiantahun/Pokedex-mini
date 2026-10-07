// ========================================================
// PokéDex Mini Official Trainer Passport (Apple Wallet Pass Style)
// Clean, minimalist Apple ID / Wallet Pass design
// Powered by QR Server Public API
// ========================================================

import { useGame } from "../context/GameContext.jsx";
import GymBadgeIcon from "./GymBadgeIcons.jsx";
import { IconCross, IconCrown, IconPokeball } from "./Icons.jsx";
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
      trainer: trainer.name || "Trainer Red",
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

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}&color=111827&bgcolor=ffffff&margin=4`;

  return (
    <div className="passport-modal-backdrop" onClick={onClose}>
      <div
        className="passport-card-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pass Header */}
        <div className="passport-card-header">
          <div className="passport-header-title-wrap">
            <div className="passport-icon-pill">
              <IconPokeball size={16} />
            </div>
            <div>
              <span className="passport-title-text">Trainer Pass</span>
              <span className="passport-region-subtext">Kanto Region</span>
            </div>
          </div>

          <div className="passport-header-actions">
            <span className="passport-id-tag">#00151</span>
            <button
              type="button"
              onClick={onClose}
              className="btn-passport-close"
              aria-label="Close Trainer Pass"
            >
              <IconCross size={15} />
            </button>
          </div>
        </div>

        {/* Trainer Profile Row */}
        <div className="passport-profile-card">
          <div className="passport-avatar-box">
            <img
              src="https://play.pokemonshowdown.com/sprites/trainers/red.png"
              alt={trainer.name || "Trainer"}
              className="passport-avatar-img"
            />
          </div>

          <div className="passport-profile-details">
            <div className="passport-name-row">
              <h2 className="passport-trainer-name">{trainer.name || "Trainer Red"}</h2>
              {isChampion ? (
                <span className="passport-champion-pill">
                  <IconCrown size={12} />
                  <span>Champion</span>
                </span>
              ) : (
                <span className="passport-rank-pill">Trainer</span>
              )}
            </div>
            <p className="passport-license-note">Indigo Plateau Certified</p>
          </div>
        </div>

        {/* Apple 3-Metric Summary Strip */}
        <div className="passport-stats-strip">
          <div className="passport-stat-item">
            <span className="stat-item-label">Balance</span>
            <span className="stat-item-value money-color">
              ₽ {trainer.money.toLocaleString()}
            </span>
          </div>
          <div className="passport-stat-divider"></div>
          <div className="passport-stat-item">
            <span className="stat-item-label">Badges</span>
            <span className="stat-item-value">{earnedBadgesCount} / 8</span>
          </div>
          <div className="passport-stat-divider"></div>
          <div className="passport-stat-item">
            <span className="stat-item-label">Party</span>
            <span className="stat-item-value">{team.length} / 6</span>
          </div>
        </div>

        {/* Gym Badges Section */}
        <div className="passport-section">
          <div className="passport-section-header">
            <span className="passport-section-title">Gym Badges</span>
            <span className="passport-section-count">{earnedBadgesCount} of 8</span>
          </div>
          <div className="passport-badges-row">
            {KANTO_BADGE_KEYS.map((k) => {
              const owned = hasBadge(k);
              return (
                <div
                  key={k}
                  className={`passport-badge-slot ${owned ? "badge-owned" : "badge-missing"}`}
                  title={`${capitalize(k)} Badge`}
                >
                  <GymBadgeIcon badgeId={k} size={28} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Party Section */}
        <div className="passport-section">
          <div className="passport-section-header">
            <span className="passport-section-title">Active Party</span>
            <span className="passport-section-count">{team.length} Pokémon</span>
          </div>
          <div className="passport-party-grid">
            {team.map((member, idx) => (
              <div key={member.instanceId || idx} className="passport-mon-chip">
                <img
                  src={getAnimatedSpriteUrl(member.id)}
                  alt={member.name}
                  className="passport-mon-sprite"
                />
                <div className="passport-mon-meta">
                  <span className="passport-mon-name">
                    {member.nickname || capitalize(member.name)}
                  </span>
                  <span className="passport-mon-lvl">Lv. {member.level}</span>
                </div>
              </div>
            ))}
            {team.length === 0 && (
              <div className="passport-empty-party">
                <span>No Pokémon currently in party</span>
              </div>
            )}
          </div>
        </div>

        {/* Pass Barcode / QR Code Strip */}
        <div className="passport-qr-strip">
          <div className="passport-qr-img-wrap">
            <img
              src={qrCodeUrl}
              alt="Trainer Pass QR Code"
              className="passport-qr-image"
            />
          </div>
          <div className="passport-qr-info">
            <span className="passport-qr-heading">Pass Verification</span>
            <p className="passport-qr-subtext">
              Scan to inspect battle roster and trainer credentials.
            </p>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="passport-card-footer">
          <span>Pokémon League Pass • Kanto</span>
        </div>
      </div>
    </div>
  );
}
