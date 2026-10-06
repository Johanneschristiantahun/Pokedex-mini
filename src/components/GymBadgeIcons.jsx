// ========================================================
// PokéDex Mini Official Kanto Gym Badge Vector SVG Icons
// 8 Authentic Gym Badges with metallic gradients,
// bevel highlights, and locked silhouette states
// ========================================================

/**
 * 1. Boulder Badge (Pewter Gym - Brock)
 * Octagonal bedrock stone prism
 */
export function BoulderBadge({ size = 32, isLocked = false, className = "" }) {
  if (isLocked) {
    return <LockedBadgeBase size={size} shape="boulder" className={className} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`gym-badge-svg badge-boulder ${className}`}
      aria-label="Boulder Badge"
    >
      <defs>
        <linearGradient id="boulderBase" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d6d3d1" />
          <stop offset="50%" stopColor="#a8a29e" />
          <stop offset="100%" stopColor="#78716c" />
        </linearGradient>
        <linearGradient id="boulderFacet" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5f5f4" />
          <stop offset="100%" stopColor="#a8a29e" />
        </linearGradient>
      </defs>
      {/* Outer Octagon */}
      <polygon
        points="20,4 44,4 60,20 60,44 44,60 20,60 4,44 4,20"
        fill="url(#boulderBase)"
        stroke="#44403c"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Inner Raised Octagon */}
      <polygon
        points="24,14 40,14 50,24 50,40 40,50 24,50 14,40 14,24"
        fill="url(#boulderFacet)"
        stroke="#57534e"
        strokeWidth="2"
      />
      {/* Gem Highlight */}
      <polygon points="24,14 40,14 36,22 28,22" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/**
 * 2. Cascade Badge (Cerulean Gym - Misty)
 * Cerulean crystal teardrop
 */
export function CascadeBadge({ size = 32, isLocked = false, className = "" }) {
  if (isLocked) {
    return <LockedBadgeBase size={size} shape="teardrop" className={className} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`gym-badge-svg badge-cascade ${className}`}
      aria-label="Cascade Badge"
    >
      <defs>
        <linearGradient id="cascadeGrad" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="cascadeShine" x1="16" y1="12" x2="32" y2="40">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Teardrop Body */}
      <path
        d="M32,4 C32,4 56,34 56,46 C56,54.8 45.2,60 32,60 C18.8,60 8,54.8 8,46 C8,34 32,4 32,4 Z"
        fill="url(#cascadeGrad)"
        stroke="#0c4a6e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Inner Cyan Core */}
      <path
        d="M32,12 C32,12 48,36 48,46 C48,51 40,54 32,54 C24,54 16,51 16,46 C16,36 32,12 32,12 Z"
        fill="#7dd3fc"
        opacity="0.5"
      />
      {/* Glass Highlight */}
      <path
        d="M32,14 C32,14 22,34 20,44 C19,42 19,39 21,34 C25,24 32,14 32,14 Z"
        fill="url(#cascadeShine)"
      />
    </svg>
  );
}

/**
 * 3. Thunder Badge (Vermilion Gym - Lt. Surge)
 * Eight-pointed golden sunburst with orange core
 */
export function ThunderBadge({ size = 32, isLocked = false, className = "" }) {
  if (isLocked) {
    return <LockedBadgeBase size={size} shape="star" className={className} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`gym-badge-svg badge-thunder ${className}`}
      aria-label="Thunder Badge"
    >
      <defs>
        <linearGradient id="thunderGold" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <radialGradient id="thunderCore" cx="32" cy="32" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="70%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
      </defs>
      {/* 8-Point Star Rays */}
      <polygon
        points="32,2 40,20 60,16 48,32 60,48 40,44 32,62 24,44 4,48 16,32 4,16 24,20"
        fill="url(#thunderGold)"
        stroke="#854d0e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Center Orange Core Disk */}
      <circle cx="32" cy="32" r="13" fill="url(#thunderCore)" stroke="#7c2d12" strokeWidth="2" />
      {/* Center Golden Pin */}
      <circle cx="32" cy="32" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
      <circle cx="30" cy="30" r="1.5" fill="#ffffff" />
    </svg>
  );
}

/**
 * 4. Rainbow Badge (Celadon Gym - Erika)
 * Stylized bloom with vibrant colored petal arcs
 */
export function RainbowBadge({ size = 32, isLocked = false, className = "" }) {
  if (isLocked) {
    return <LockedBadgeBase size={size} shape="circle" className={className} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`gym-badge-svg badge-rainbow ${className}`}
      aria-label="Rainbow Badge"
    >
      <defs>
        <radialGradient id="rainbowCenter" cx="32" cy="32" r="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </radialGradient>
      </defs>
      {/* Outer Silver Ring */}
      <circle cx="32" cy="32" r="28" fill="#e2e8f0" stroke="#475569" strokeWidth="3" />

      {/* Flower Petals */}
      {/* Top: Red */}
      <path d="M32,32 L26,7 A26,26 0 0,1 38,7 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
      {/* Top-Right: Orange */}
      <path d="M32,32 L38,7 A26,26 0 0,1 51,16 Z" fill="#f97316" stroke="#9a3412" strokeWidth="1" />
      {/* Right: Yellow */}
      <path d="M32,32 L51,16 A26,26 0 0,1 57,32 Z" fill="#eab308" stroke="#854d0e" strokeWidth="1" />
      {/* Bottom-Right: Green */}
      <path d="M32,32 L57,32 A26,26 0 0,1 48,49 Z" fill="#22c55e" stroke="#166534" strokeWidth="1" />
      {/* Bottom: Cyan */}
      <path d="M32,32 L48,49 A26,26 0 0,1 32,58 Z" fill="#06b6d4" stroke="#155e75" strokeWidth="1" />
      {/* Bottom-Left: Blue */}
      <path d="M32,32 L32,58 A26,26 0 0,1 16,49 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth="1" />
      {/* Left: Purple */}
      <path d="M32,32 L16,49 A26,26 0 0,1 7,32 Z" fill="#8b5cf6" stroke="#5b21b6" strokeWidth="1" />
      {/* Top-Left: Pink */}
      <path d="M32,32 L7,32 A26,26 0 0,1 26,7 Z" fill="#ec4899" stroke="#9d174d" strokeWidth="1" />

      {/* Central Golden Core */}
      <circle cx="32" cy="32" r="11" fill="url(#rainbowCenter)" stroke="#a16207" strokeWidth="2" />
      <circle cx="30" cy="30" r="3" fill="#ffffff" opacity="0.7" />
    </svg>
  );
}

/**
 * 5. Soul Badge (Fuchsia Gym - Koga)
 * Magenta / fuchsia ninja heart droplet
 */
export function SoulBadge({ size = 32, isLocked = false, className = "" }) {
  if (isLocked) {
    return <LockedBadgeBase size={size} shape="heart" className={className} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`gym-badge-svg badge-soul ${className}`}
      aria-label="Soul Badge"
    >
      <defs>
        <linearGradient id="soulGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="50%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      {/* Heart Shape */}
      <path
        d="M32,58 C32,58 6,40 6,22 C6,11 15,4 25,6 C28,7 30,9 32,12 C34,9 36,7 39,6 C49,4 58,11 58,22 C58,40 32,58 32,58 Z"
        fill="url(#soulGrad)"
        stroke="#581c87"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Inner Gem Inset */}
      <path
        d="M32,46 C32,46 16,32 16,22 C16,15 21,11 27,13 C29,14 31,16 32,18 C33,16 35,14 37,13 C43,11 48,15 48,22 C48,32 32,46 32,46 Z"
        fill="#fdf4ff"
        opacity="0.35"
      />
      {/* Shine Reflection */}
      <circle cx="24" cy="18" r="3" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}

/**
 * 6. Marsh Badge (Saffron Gym - Sabrina)
 * Concentric golden psychic circle / round shield
 */
export function MarshBadge({ size = 32, isLocked = false, className = "" }) {
  if (isLocked) {
    return <LockedBadgeBase size={size} shape="circle" className={className} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`gym-badge-svg badge-marsh ${className}`}
      aria-label="Marsh Badge"
    >
      <defs>
        <linearGradient id="marshGold" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
      {/* Outer Golden Disk */}
      <circle cx="32" cy="32" r="28" fill="url(#marshGold)" stroke="#713f12" strokeWidth="3" />
      {/* Inner Groove */}
      <circle cx="32" cy="32" r="20" fill="#facc15" stroke="#854d0e" strokeWidth="2.5" />
      {/* Center Concentric Core */}
      <circle cx="32" cy="32" r="10" fill="#fef08a" stroke="#a16207" strokeWidth="2" />
      {/* Highlight Arc */}
      <path
        d="M16,22 A20,20 0 0,1 46,18"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

/**
 * 7. Volcano Badge (Cinnabar Gym - Blaine)
 * Crimson / amber volcanic flame diamond
 */
export function VolcanoBadge({ size = 32, isLocked = false, className = "" }) {
  if (isLocked) {
    return <LockedBadgeBase size={size} shape="flame" className={className} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`gym-badge-svg badge-volcano ${className}`}
      aria-label="Volcano Badge"
    >
      <defs>
        <linearGradient id="volcanoFire" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>
      {/* Outer Flame Diamond */}
      <path
        d="M32,4 C32,4 56,22 56,42 C56,53 45,60 32,60 C19,60 8,53 8,42 C8,22 32,4 32,4 Z"
        fill="url(#volcanoFire)"
        stroke="#7c2d12"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Inner Yellow Core */}
      <path
        d="M32,20 C32,20 46,32 46,44 C46,50 40,54 32,54 C24,54 18,50 18,44 C18,32 32,20 32,20 Z"
        fill="#fef08a"
        stroke="#ea580c"
        strokeWidth="1.5"
      />
      {/* Center White Hot Core */}
      <path
        d="M32,32 C32,32 38,38 38,45 C38,48 35,50 32,50 C29,50 26,48 26,45 C26,38 32,32 32,32 Z"
        fill="#ffffff"
      />
    </svg>
  );
}

/**
 * 8. Earth Badge (Viridian Gym - Giovanni)
 * Emerald plant feather / laurel spike plume
 */
export function EarthBadge({ size = 32, isLocked = false, className = "" }) {
  if (isLocked) {
    return <LockedBadgeBase size={size} shape="earth" className={className} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`gym-badge-svg badge-earth ${className}`}
      aria-label="Earth Badge"
    >
      <defs>
        <linearGradient id="earthGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>
      {/* Feather Spike Plume */}
      <path
        d="M32,4 L40,24 L56,22 L44,38 L54,54 L32,46 L10,54 L20,38 L8,22 L24,24 Z"
        fill="url(#earthGrad)"
        stroke="#064e3b"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Inner Central Ridge */}
      <polygon
        points="32,12 36,28 44,28 36,38 42,48 32,42 22,48 28,38 20,28 28,28"
        fill="#bbf7d0"
        stroke="#15803d"
        strokeWidth="1.5"
      />
      {/* Stem Pin */}
      <line x1="32" y1="12" x2="32" y2="58" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Generic Silhouette / Locked Badge
 */
function LockedBadgeBase({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`gym-badge-svg badge-locked ${className}`}
      aria-label="Locked Badge"
    >
      <circle cx="32" cy="32" r="26" fill="#292524" stroke="#44403c" strokeWidth="2.5" strokeDasharray="4 3" />
      {/* Engraved Padlock Symbol */}
      <rect x="23" y="30" width="18" height="15" rx="3" fill="#57534e" />
      <path d="M26,30 L26,24 C26,20.7 28.7,18 32,18 C35.3,18 38,20.7 38,24 L38,30" stroke="#78716c" strokeWidth="2.5" />
      <circle cx="32" cy="37" r="2" fill="#1c1917" />
    </svg>
  );
}

/**
 * Universal GymBadgeIcon Component
 */
export default function GymBadgeIcon({
  badgeId,
  size = 32,
  isLocked = false,
  className = "",
}) {
  switch (badgeId) {
    case "boulder":
      return <BoulderBadge size={size} isLocked={isLocked} className={className} />;
    case "cascade":
      return <CascadeBadge size={size} isLocked={isLocked} className={className} />;
    case "thunder":
      return <ThunderBadge size={size} isLocked={isLocked} className={className} />;
    case "rainbow":
      return <RainbowBadge size={size} isLocked={isLocked} className={className} />;
    case "soul":
      return <SoulBadge size={size} isLocked={isLocked} className={className} />;
    case "marsh":
      return <MarshBadge size={size} isLocked={isLocked} className={className} />;
    case "volcano":
      return <VolcanoBadge size={size} isLocked={isLocked} className={className} />;
    case "earth":
      return <EarthBadge size={size} isLocked={isLocked} className={className} />;
    default:
      return <LockedBadgeBase size={size} className={className} />;
  }
}
