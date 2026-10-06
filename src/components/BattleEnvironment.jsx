import {
  ParticleFlame,
  ParticleWaterDrop,
  ParticleLeaf,
  ParticleLightning,
  ParticleRock,
  ParticleOrb,
  ParticleSnowflake,
  ParticleBurst,
} from "./Icons";

// ========================================================
// PokéDex Mini RPG Battle Environment Component
// Multi-layered, biome-specific scenic backdrops,
// atmospheric animated particles, and authentic 3D battle pedestals
// ========================================================

// Elemental Move VFX Overlay Component
export function ElementalVfxOverlay({ type }) {
  if (!type) return null;
  const t = type.toLowerCase();

  if (t === "fire") {
    return (
      <div className="elemental-vfx fire-vfx" aria-hidden="true">
        <span className="vfx-particle flame-1"><ParticleFlame size={28} /></span>
        <span className="vfx-particle flame-2"><ParticleBurst size={28} /></span>
        <span className="vfx-particle flame-3"><ParticleFlame size={28} /></span>
      </div>
    );
  }
  if (t === "water") {
    return (
      <div className="elemental-vfx water-vfx" aria-hidden="true">
        <span className="vfx-particle water-1"><ParticleWaterDrop size={28} /></span>
        <span className="vfx-particle water-2"><ParticleWaterDrop size={22} /></span>
        <span className="vfx-particle water-3"><ParticleWaterDrop size={28} /></span>
      </div>
    );
  }
  if (t === "electric") {
    return (
      <div className="elemental-vfx electric-vfx" aria-hidden="true">
        <span className="vfx-particle spark-1"><ParticleLightning size={26} /></span>
        <span className="vfx-particle spark-2"><ParticleLightning size={26} /></span>
        <span className="vfx-particle spark-3"><ParticleLightning size={26} /></span>
      </div>
    );
  }
  if (t === "grass" || t === "bug") {
    return (
      <div className="elemental-vfx grass-vfx" aria-hidden="true">
        <span className="vfx-particle leaf-1"><ParticleLeaf size={26} /></span>
        <span className="vfx-particle leaf-2"><ParticleLeaf size={22} /></span>
        <span className="vfx-particle leaf-3"><ParticleLeaf size={26} /></span>
      </div>
    );
  }
  if (t === "psychic" || t === "ghost") {
    return (
      <div className="elemental-vfx psychic-vfx" aria-hidden="true">
        <div className="psychic-ring ring-1"></div>
        <div className="psychic-ring ring-2"></div>
        <span className="vfx-particle psychic-orb"><ParticleOrb size={28} /></span>
      </div>
    );
  }
  if (t === "rock" || t === "ground") {
    return (
      <div className="elemental-vfx rock-vfx" aria-hidden="true">
        <span className="vfx-particle rock-1"><ParticleRock size={26} /></span>
        <span className="vfx-particle rock-2"><ParticleBurst size={26} /></span>
        <span className="vfx-particle rock-3"><ParticleRock size={26} /></span>
      </div>
    );
  }
  if (t === "ice") {
    return (
      <div className="elemental-vfx ice-vfx" aria-hidden="true">
        <span className="vfx-particle ice-1"><ParticleSnowflake size={26} /></span>
        <span className="vfx-particle ice-2"><ParticleSnowflake size={20} /></span>
        <span className="vfx-particle ice-3"><ParticleSnowflake size={26} /></span>
      </div>
    );
  }

  return (
    <div className="elemental-vfx normal-vfx" aria-hidden="true">
      <div className="vfx-slash-blade"></div>
    </div>
  );
}

export function BattleEnvironment({
  biomeId,
  cameraMode = "isometric",
  children,
}) {
  return (
    <div className={`rpg-battlefield-stage biome-theme-${biomeId} camera-mode-${cameraMode}`}>
      {/* 1. Scenic Environmental Layer (Sky, Horizon, Scenery) */}
      <div className="env-backdrop-layer">
        {biomeId === "viridian-forest" && <ViridianForestBackdrop />}
        {biomeId === "mt-moon" && <MtMoonBackdrop />}
        {biomeId === "seafoam-coast" && <SeafoamCoastBackdrop />}
        {biomeId === "cinnabar-volcano" && <VolcanoBackdrop />}
        {biomeId === "kanto-power-plant" && <PowerPlantBackdrop />}
        {biomeId.startsWith("gym") && <GymArenaBackdrop gymId={biomeId} />}
      </div>

      {/* 2. Atmospheric Ambient Particle FX (Leaves, Embers, Sparkles, etc.) */}
      <div className="env-particles-layer" aria-hidden="true">
        {biomeId === "viridian-forest" && <ForestLeavesParticles />}
        {biomeId === "mt-moon" && <CavernGlintParticles />}
        {biomeId === "seafoam-coast" && <SeafoamWaveParticles />}
        {biomeId === "cinnabar-volcano" && <VolcanoEmbersParticles />}
        {biomeId === "kanto-power-plant" && <PowerPlantSparksParticles />}
        {biomeId.startsWith("gym") && <GymArenaSpotlightsParticles />}
      </div>

      {/* 3. Perspective Ground Plane & Floor Terrain */}
      <div className={`env-ground-plane ground-type-${biomeId}`}>
        <div className="ground-terrain-texture"></div>
      </div>

      {/* 4. Foreground Battle Stage Content (Pedestals, Sprites, HUDs) */}
      <div className="env-actors-stage">
        {children}
      </div>
    </div>
  );
}

// ========================================================
// 1. BIOME SCENIC BACKDROPS (SVG Vector Landscapes)
// ========================================================

function ViridianForestBackdrop() {
  return (
    <div className="env-scenery-wrap forest-scenery anime-forest-theme">
      <svg
        className="env-svg-scenery"
        viewBox="0 0 800 360"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="animeSky" x1="0" y1="0" x2="0" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#7dd3fc" />
            <stop offset="80%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <linearGradient id="sunbeam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="canopyDeep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="35%" stopColor="#10b981" />
            <stop offset="85%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="canopyLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="40%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="treeTrunkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="40%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <linearGradient id="animeLawn" x1="0" y1="200" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="35%" stopColor="#22c55e" />
            <stop offset="80%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
        </defs>

        {/* 1. Clear Anime Sky */}
        <rect width="800" height="230" fill="url(#animeSky)" />

        {/* 2. Soft Distant Rolling Mountains */}
        <path
          d="M0,170 Q160,110 320,155 T640,140 Q720,130 800,165 L800,230 L0,230 Z"
          fill="#059669"
          opacity="0.4"
        />
        <path
          d="M0,185 Q220,135 440,175 T800,160 L800,230 L0,230 Z"
          fill="#10b981"
          opacity="0.55"
        />

        {/* 3. Sunbeams Streaming Through Canopies */}
        <polygon points="120,0 220,0 360,250 200,250" fill="url(#sunbeam)" />
        <polygon points="480,0 560,0 680,250 560,250" fill="url(#sunbeam)" />

        {/* 4. Left Major Tree Trunk & Fluffy Cloud Canopy */}
        <path
          d="M120,140 Q130,190 115,240 L165,240 Q150,190 145,140 Z"
          fill="url(#treeTrunkGrad)"
        />
        <ellipse cx="140" cy="110" rx="90" ry="60" fill="url(#canopyDeep)" />
        <ellipse cx="85" cy="125" rx="65" ry="45" fill="url(#canopyDeep)" />
        <ellipse cx="195" cy="120" rx="65" ry="45" fill="url(#canopyDeep)" />
        <ellipse cx="130" cy="85" rx="75" ry="50" fill="url(#canopyLight)" />
        <ellipse cx="90" cy="100" rx="45" ry="35" fill="url(#canopyLight)" opacity="0.9" />
        <ellipse cx="170" cy="95" rx="55" ry="38" fill="url(#canopyLight)" opacity="0.9" />

        {/* 5. Center-Right Midground Tree */}
        <path
          d="M590,150 Q595,190 585,235 L625,235 Q615,190 610,150 Z"
          fill="url(#treeTrunkGrad)"
        />
        <ellipse cx="600" cy="125" rx="80" ry="55" fill="url(#canopyDeep)" />
        <ellipse cx="545" cy="135" rx="60" ry="40" fill="url(#canopyDeep)" />
        <ellipse cx="655" cy="135" rx="60" ry="40" fill="url(#canopyDeep)" />
        <ellipse cx="595" cy="100" rx="65" ry="45" fill="url(#canopyLight)" />

        {/* 6. Far-Right Canopy Layer */}
        <ellipse cx="760" cy="115" rx="85" ry="60" fill="url(#canopyDeep)" />
        <ellipse cx="740" cy="95" rx="65" ry="45" fill="url(#canopyLight)" />

        {/* 7. Vibrant Anime Meadow Ground */}
        <path
          d="M0,215 Q200,195 400,210 T800,205 L800,360 L0,360 Z"
          fill="url(#animeLawn)"
        />

        {/* 8. Midground Wildflower Dots & Shrub Foliage */}
        <path d="M260,225 Q290,205 320,225 Z" fill="#4ade80" />
        <path d="M370,220 Q400,202 430,220 Z" fill="#34d399" />
        <path d="M660,228 Q690,210 720,228 Z" fill="#4ade80" />

        {/* Yellow Wildflowers */}
        <circle cx="280" cy="222" r="3.5" fill="#fde047" />
        <circle cx="290" cy="224" r="3" fill="#fde047" />
        <circle cx="285" cy="227" r="2.5" fill="#fde047" />
        <circle cx="390" cy="216" r="3.5" fill="#fde047" />
        <circle cx="400" cy="218" r="3" fill="#fde047" />
        <circle cx="685" cy="223" r="3.5" fill="#fde047" />
        <circle cx="695" cy="226" r="3" fill="#fde047" />

        {/* Pink Wildflowers */}
        <circle cx="310" cy="224" r="3" fill="#f472b6" />
        <circle cx="415" cy="218" r="3" fill="#f472b6" />
        <circle cx="670" cy="226" r="3" fill="#f472b6" />

        {/* 9. Soft foreground grass blades & light streaks */}
        <path
          d="M-10,340 Q150,330 300,345 T600,335 Q700,345 810,335 L810,360 L-10,360 Z"
          fill="#14532d"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}

function MtMoonBackdrop() {
  return (
    <div className="env-scenery-wrap cavern-scenery">
      <svg
        className="env-svg-scenery"
        viewBox="0 0 800 360"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cavernVault" x1="0" y1="0" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="35%" stopColor="#2e1065" />
            <stop offset="70%" stopColor="#3b0764" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>
          <radialGradient id="crystalGlowCyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="crystalGlowPurple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e879f9" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#c026d3" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#701a75" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="800" height="360" fill="url(#cavernVault)" />

        {/* Ambient Moon Crystal Radiance */}
        <circle cx="200" cy="180" r="160" fill="url(#crystalGlowCyan)" />
        <circle cx="620" cy="140" r="180" fill="url(#crystalGlowPurple)" />

        {/* Ceiling Stalactites Layer */}
        <path
          d="M0,0 L25,75 L45,0 L80,110 L105,0 L150,85 L180,0 L240,120 L270,0 L340,65 L370,0 L430,135 L470,0 L530,90 L570,0 L630,125 L670,0 L730,70 L760,0 L800,95 L800,0 Z"
          fill="#0f172a"
        />

        {/* Distant Cavern Rock Formations */}
        <path
          d="M0,230 Q120,180 240,210 Q380,165 520,200 Q660,170 800,215 L800,360 L0,360 Z"
          fill="#312e81"
          opacity="0.4"
        />

        {/* Glowing Amethyst & Cyan Lunar Crystals */}
        <polygon points="190,175 205,130 218,170 210,185" fill="#38bdf8" />
        <polygon points="208,180 220,140 230,178" fill="#7dd3fc" />
        <polygon points="615,150 635,95 650,148 638,165" fill="#f0abfc" />
        <polygon points="635,160 650,115 662,158" fill="#e879f9" />

        {/* Midground Jagged Rock Ridge */}
        <path
          d="M0,265 L60,240 L130,260 L210,225 L290,260 L380,230 L480,265 L570,220 L660,255 L750,225 L800,250 L800,360 L0,360 Z"
          fill="#1e1b4b"
          opacity="0.75"
        />
      </svg>
    </div>
  );
}

function SeafoamCoastBackdrop() {
  return (
    <div className="env-scenery-wrap coast-scenery">
      <svg
        className="env-svg-scenery"
        viewBox="0 0 800 360"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="coastalSky" x1="0" y1="0" x2="0" y2="220" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="45%" stopColor="#38bdf8" />
            <stop offset="85%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <linearGradient id="seaWater" x1="0" y1="200" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="40%" stopColor="#0369a1" />
            <stop offset="70%" stopColor="#075985" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>
        </defs>

        {/* Coastal Sky */}
        <rect width="800" height="210" fill="url(#coastalSky)" />

        {/* Distant Sea Clouds */}
        <ellipse cx="160" cy="80" rx="90" ry="24" fill="#ffffff" opacity="0.45" />
        <ellipse cx="210" cy="70" rx="60" ry="30" fill="#ffffff" opacity="0.5" />
        <ellipse cx="580" cy="95" rx="120" ry="26" fill="#ffffff" opacity="0.4" />
        <ellipse cx="640" cy="85" rx="75" ry="32" fill="#ffffff" opacity="0.45" />

        {/* Distant Island Silhouette */}
        <path
          d="M480,205 Q540,165 620,185 Q680,175 740,205 Z"
          fill="#075985"
          opacity="0.6"
        />

        {/* Ocean Surface */}
        <rect y="200" width="800" height="160" fill="url(#seaWater)" />

        {/* Rolling Ocean Wave Surf 1 */}
        <path
          d="M0,225 Q100,215 200,225 T400,225 T600,225 T800,225 L800,245 Q700,235 600,245 T400,245 T200,245 T0,245 Z"
          fill="#38bdf8"
          opacity="0.75"
        />

        {/* Rolling Ocean Wave Surf 2 with White Foam */}
        <path
          d="M0,250 Q120,238 240,250 T480,250 T720,250 T800,250 L800,270 Q680,260 560,270 T320,270 T0,270 Z"
          fill="#7dd3fc"
          opacity="0.8"
        />
        <path
          d="M0,250 Q120,238 240,250 T480,250 T720,250 T800,250"
          stroke="#ffffff"
          strokeWidth="3"
          fill="none"
          opacity="0.85"
        />

        {/* Sandy Shoreline Ridge */}
        <path
          d="M0,285 Q220,270 440,285 T800,275 L800,360 L0,360 Z"
          fill="#ca8a04"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}

function VolcanoBackdrop() {
  return (
    <div className="env-scenery-wrap volcano-scenery">
      <svg
        className="env-svg-scenery"
        viewBox="0 0 800 360"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="volcanoSky" x1="0" y1="0" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#450a0a" />
            <stop offset="35%" stopColor="#7f1d1d" />
            <stop offset="70%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>
          <radialGradient id="magmaGlow" cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#ea580c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7c2d12" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="800" height="360" fill="url(#volcanoSky)" />

        {/* Rising Magma Chamber Ambient Glow */}
        <rect y="120" width="800" height="240" fill="url(#magmaGlow)" />

        {/* Jagged Volcanic Peaks / Stalactites */}
        <path
          d="M0,0 L35,80 L70,0 L120,110 L160,0 L230,90 L280,0 L370,130 L420,0 L500,95 L550,0 L630,115 L680,0 L750,75 L800,0 L800,0 Z"
          fill="#1c1917"
        />

        {/* Distant Scorched Mountains */}
        <path
          d="M0,230 L80,170 L190,225 L320,160 L450,230 L580,165 L700,220 L800,175 L800,360 L0,360 Z"
          fill="#7f1d1d"
          opacity="0.5"
        />

        {/* Molten Lava Vein Rivers Running Down Rock Crags */}
        <path
          d="M180,180 Q200,220 190,260 Q180,300 210,340"
          stroke="#f97316"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          filter="drop-shadow(0 0 8px #f97316)"
        />
        <path
          d="M580,170 Q560,215 575,255 Q590,295 570,340"
          stroke="#ea580c"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          filter="drop-shadow(0 0 10px #f97316)"
        />

        {/* Basalt Ridge Foreground */}
        <path
          d="M0,265 L90,235 L190,260 L300,230 L420,265 L540,225 L660,260 L760,230 L800,255 L800,360 L0,360 Z"
          fill="#292524"
        />
      </svg>
    </div>
  );
}

function PowerPlantBackdrop() {
  return (
    <div className="env-scenery-wrap plant-scenery">
      <svg
        className="env-svg-scenery"
        viewBox="0 0 800 360"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="plantSky" x1="0" y1="0" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#090d16" />
            <stop offset="45%" stopColor="#0f172a" />
            <stop offset="80%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <radialGradient id="electricGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#eab308" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="800" height="360" fill="url(#plantSky)" />

        {/* Generator Ambient Electric Core Glow */}
        <circle cx="220" cy="180" r="140" fill="url(#electricGlow)" />
        <circle cx="600" cy="160" r="160" fill="url(#electricGlow)" />

        {/* Industrial Girders & Overhead Conduit Pipes */}
        <rect x="0" y="0" width="800" height="24" fill="#0f172a" />
        <rect x="180" y="0" width="18" height="360" fill="#1e293b" opacity="0.6" />
        <rect x="580" y="0" width="18" height="360" fill="#1e293b" opacity="0.6" />

        {/* High Voltage Transformer Cylinders */}
        <rect x="150" y="110" width="80" height="150" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="190" cy="150" r="22" fill="#0369a1" />
        <circle cx="190" cy="150" r="12" fill="#facc15" />

        <rect x="560" y="90" width="90" height="170" rx="8" fill="#1e293b" stroke="#facc15" strokeWidth="2" />
        <circle cx="605" cy="140" r="26" fill="#ca8a04" />
        <circle cx="605" cy="140" r="14" fill="#fef08a" />

        {/* Hazard Caution Diagonal Stripes Banner */}
        <path
          d="M0,260 L800,260 L800,274 L0,274 Z"
          fill="#eab308"
        />
        <path
          d="M20,260 L34,274 M60,260 L74,274 M100,260 L114,274 M140,260 L154,274 M180,260 L194,274 M220,260 L234,274 M260,260 L274,274 M300,260 L314,274 M340,260 L354,274 M380,260 L394,274 M420,260 L434,274 M460,260 L474,274 M500,260 L514,274 M540,260 L554,274 M580,260 L594,274 M620,260 L634,274 M660,260 L674,274 M700,260 L714,274 M740,260 L754,274 M780,260 L794,274"
          stroke="#0f172a"
          strokeWidth="6"
        />
      </svg>
    </div>
  );
}

// ========================================================
// 2. ATMOSPHERIC AMBIENT PARTICLE FX (Pure CSS, 0 Lag)
// ========================================================

function ForestLeavesParticles() {
  return (
    <div className="env-particles-container">
      <span className="particle particle-leaf leaf-1"><ParticleLeaf size={14} /></span>
      <span className="particle particle-leaf leaf-2"><ParticleLeaf size={12} /></span>
      <span className="particle particle-leaf leaf-3"><ParticleLeaf size={14} /></span>
      <span className="particle particle-leaf leaf-4"><ParticleLeaf size={12} /></span>
      <span className="particle particle-leaf leaf-5"><ParticleLeaf size={14} /></span>
    </div>
  );
}

function CavernGlintParticles() {
  return (
    <div className="env-particles-container">
      <span className="particle particle-glint glint-1">✦</span>
      <span className="particle particle-glint glint-2">✧</span>
      <span className="particle particle-glint glint-3">✦</span>
      <span className="particle particle-glint glint-4">✧</span>
    </div>
  );
}

function SeafoamWaveParticles() {
  return (
    <div className="env-particles-container">
      <span className="particle particle-bubble bubble-1">○</span>
      <span className="particle particle-bubble bubble-2">◦</span>
      <span className="particle particle-bubble bubble-3">○</span>
      <span className="particle particle-bubble bubble-4">◦</span>
    </div>
  );
}

function VolcanoEmbersParticles() {
  return (
    <div className="env-particles-container">
      <span className="particle particle-ember ember-1">•</span>
      <span className="particle particle-ember ember-2">●</span>
      <span className="particle particle-ember ember-3">•</span>
      <span className="particle particle-ember ember-4">●</span>
      <span className="particle particle-ember ember-5">•</span>
    </div>
  );
}

function PowerPlantSparksParticles() {
  return (
    <div className="env-particles-container">
      <span className="particle particle-spark spark-1"><ParticleLightning size={14} /></span>
      <span className="particle particle-spark spark-2"><ParticleLightning size={14} /></span>
      <span className="particle particle-spark spark-3"><ParticleLightning size={14} /></span>
    </div>
  );
}

function GymArenaBackdrop({ gymId = "gym-rock" }) {
  // Thematic colors and styling for all 8 Kanto Gym Leaders
  const accentColors = {
    "gym-rock": { primary: "#78716c", glow: "#d6d3d1", beam: "#e7e5e4", floorA: "#44403c", floorB: "#292524", line: "#a8a29e" },
    "gym-water": { primary: "#0284c7", glow: "#38bdf8", beam: "#bae6fd", floorA: "#0369a1", floorB: "#0c4a6e", line: "#7dd3fc" },
    "gym-electric": { primary: "#ca8a04", glow: "#facc15", beam: "#fef08a", floorA: "#854d0e", floorB: "#422006", line: "#fde047" },
    "gym-grass": { primary: "#15803d", glow: "#4ade80", beam: "#bbf7d0", floorA: "#166534", floorB: "#14532d", line: "#86efac" },
    "gym-poison": { primary: "#7e22ce", glow: "#c084fc", beam: "#f3e8ff", floorA: "#6b21a8", floorB: "#3b0764", line: "#d8b4fe" },
    "gym-psychic": { primary: "#db2777", glow: "#f472b6", beam: "#fce7f3", floorA: "#be185d", floorB: "#500724", line: "#fbcfe8" },
    "gym-fire": { primary: "#c2410c", glow: "#fb923c", beam: "#ffedd5", floorA: "#9a3412", floorB: "#431407", line: "#fdba74" },
    "gym-ground": { primary: "#a16207", glow: "#fde047", beam: "#fef9c3", floorA: "#713f12", floorB: "#292524", line: "#fde047" },
  };

  const currentTheme = accentColors[gymId] || {
    primary: "#2563eb",
    glow: "#60a5fa",
    beam: "#dbeafe",
    floorA: "#1e293b",
    floorB: "#0f172a",
    line: "#93c5fd",
  };

  return (
    <div className="env-scenery-wrap gym-arena-scenery">
      <svg
        className="env-svg-scenery"
        viewBox="0 0 800 360"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gymDomeSky" x1="0" y1="0" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#050811" />
            <stop offset="35%" stopColor="#0b1120" />
            <stop offset="70%" stopColor="#111827" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>

          {/* Left Main Spotlight Beam */}
          <linearGradient id="leftSpotlight" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={currentTheme.beam} stopOpacity="0.45" />
            <stop offset="60%" stopColor={currentTheme.glow} stopOpacity="0.18" />
            <stop offset="100%" stopColor={currentTheme.glow} stopOpacity="0" />
          </linearGradient>

          {/* Right Main Spotlight Beam */}
          <linearGradient id="rightSpotlight" x1="1" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={currentTheme.beam} stopOpacity="0.45" />
            <stop offset="60%" stopColor={currentTheme.glow} stopOpacity="0.18" />
            <stop offset="100%" stopColor={currentTheme.glow} stopOpacity="0" />
          </linearGradient>

          {/* Center Arena Beam */}
          <linearGradient id="centerBeam" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="70%" stopColor={currentTheme.glow} stopOpacity="0.08" />
            <stop offset="100%" stopColor={currentTheme.glow} stopOpacity="0" />
          </linearGradient>

          {/* Stadium Truss Glow */}
          <linearGradient id="trussGlow" x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={currentTheme.primary} stopOpacity="0.2" />
            <stop offset="50%" stopColor={currentTheme.glow} stopOpacity="0.8" />
            <stop offset="100%" stopColor={currentTheme.primary} stopOpacity="0.2" />
          </linearGradient>

          {/* Court Perspective Surface Gradient */}
          <linearGradient id="courtFloorGrad" x1="0" y1="230" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={currentTheme.floorB} />
            <stop offset="50%" stopColor={currentTheme.floorA} />
            <stop offset="100%" stopColor={currentTheme.floorB} />
          </linearGradient>
        </defs>

        {/* 1. Stadium Arena Dome Sky */}
        <rect width="800" height="360" fill="url(#gymDomeSky)" />

        {/* 2. High Stadium Ceiling Steel Trusses */}
        <path
          d="M0,35 Q400,-15 800,35 L800,60 Q400,10 0,60 Z"
          fill="#111827"
          stroke="#374151"
          strokeWidth="1.5"
        />
        <path
          d="M0,42 Q400,-5 800,42"
          stroke="url(#trussGlow)"
          strokeWidth="3.5"
        />

        {/* Floodlight Fixtures */}
        <rect x="60" y="28" width="80" height="15" rx="3" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" />
        <circle cx="75" cy="43" r="6" fill="#ffffff" filter="drop-shadow(0 0 10px #ffffff)" />
        <circle cx="100" cy="43" r="6" fill="#ffffff" filter="drop-shadow(0 0 10px #ffffff)" />
        <circle cx="125" cy="43" r="6" fill="#ffffff" filter="drop-shadow(0 0 10px #ffffff)" />

        <rect x="660" y="28" width="80" height="15" rx="3" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" />
        <circle cx="675" cy="43" r="6" fill="#ffffff" filter="drop-shadow(0 0 10px #ffffff)" />
        <circle cx="700" cy="43" r="6" fill="#ffffff" filter="drop-shadow(0 0 10px #ffffff)" />
        <circle cx="725" cy="43" r="6" fill="#ffffff" filter="drop-shadow(0 0 10px #ffffff)" />

        {/* Crossing Volumetric Spotlight Beams */}
        <polygon points="100,43 10,360 480,360" fill="url(#leftSpotlight)" />
        <polygon points="700,43 320,360 790,360" fill="url(#rightSpotlight)" />
        <polygon points="380,0 420,0 520,360 280,360" fill="url(#centerBeam)" />

        {/* 3. Upper Spectator Tier Silhouettes & Flash Flashes */}
        <path
          d="M0,165 Q400,155 800,165 L800,230 Q400,220 0,230 Z"
          fill="#030712"
          opacity="0.95"
        />

        {/* Spectator camera flashes */}
        <circle cx="90" cy="185" r="2" fill="#ffffff" opacity="0.8" />
        <circle cx="150" cy="195" r="2.5" fill="#fef08a" opacity="0.7" />
        <circle cx="210" cy="180" r="1.5" fill="#38bdf8" opacity="0.8" />
        <circle cx="280" cy="190" r="2" fill="#ffffff" opacity="0.9" />
        <circle cx="340" cy="182" r="1.5" fill="#ffffff" opacity="0.6" />
        <circle cx="460" cy="182" r="2" fill="#fbcfe8" opacity="0.75" />
        <circle cx="520" cy="192" r="1.5" fill="#ffffff" opacity="0.85" />
        <circle cx="590" cy="180" r="2.5" fill="#fde047" opacity="0.7" />
        <circle cx="670" cy="195" r="1.5" fill="#ffffff" opacity="0.8" />
        <circle cx="730" cy="185" r="2" fill="#38bdf8" opacity="0.7" />

        {/* Midground Championship Banners */}
        <polygon points="155,75 185,75 185,150 170,140 155,150" fill={currentTheme.primary} opacity="0.85" />
        <polygon points="615,75 645,75 645,150 630,140 615,150" fill={currentTheme.primary} opacity="0.85" />

        {/* 4. Giant Pokémon League Emblem in Center Field */}
        <g opacity="0.32" transform="translate(400, 150)">
          <circle cx="0" cy="0" r="70" stroke={currentTheme.glow} strokeWidth="4.5" fill="none" />
          <path d="M-70,0 L70,0" stroke={currentTheme.glow} strokeWidth="6" />
          <circle cx="0" cy="0" r="22" fill="#0b1120" stroke={currentTheme.glow} strokeWidth="4.5" />
          <circle cx="0" cy="0" r="10" fill={currentTheme.glow} />
        </g>

        {/* 5. Stadium Court Boundary Wall */}
        <path
          d="M0,225 Q400,210 800,225 L800,250 Q400,235 0,250 Z"
          fill="#1f2937"
          stroke="#374151"
          strokeWidth="2"
        />
        <line x1="0" y1="238" x2="800" y2="238" stroke={currentTheme.glow} strokeWidth="2" opacity="0.6" />

        {/* 6. Realistic 3D Stadium Court Floor Markings */}
        {/* Outer Perspective Boundary Lines */}
        <line x1="120" y1="245" x2="20" y2="360" stroke={currentTheme.line} strokeWidth="2.5" opacity="0.45" />
        <line x1="680" y1="245" x2="780" y2="360" stroke={currentTheme.line} strokeWidth="2.5" opacity="0.45" />

        {/* Center Court Circle in Perspective (Pokéball Court Design) */}
        <ellipse cx="400" cy="295" rx="140" ry="45" stroke={currentTheme.line} strokeWidth="3" fill="none" opacity="0.5" />
        <ellipse cx="400" cy="295" rx="45" ry="15" stroke={currentTheme.line} strokeWidth="2.5" fill={currentTheme.floorB} opacity="0.6" />
        <line x1="260" y1="295" x2="540" y2="295" stroke={currentTheme.line} strokeWidth="3" opacity="0.55" />
      </svg>
    </div>
  );
}

function GymArenaSpotlightsParticles() {
  return (
    <div className="env-particles-container">
      <span className="particle particle-spark spark-1">✧</span>
      <span className="particle particle-spark spark-2">✦</span>
      <span className="particle particle-spark spark-3">✧</span>
      <span className="particle particle-spark spark-4">✦</span>
    </div>
  );
}

// ========================================================
// 3. AUTHENTIC 3D BATTLE PEDESTALS (Raised Terrain Bases)
// ========================================================

const PLAYER_GRASS_PATH =
  "M 295.0,55.0 Q 295.0,55.0 305.3,59.7 Q 305.3,59.7 291.6,63.5 Q 291.6,63.5 300.6,69.2 Q 300.6,69.2 281.6,71.5 Q 281.6,71.5 288.5,78.3 Q 288.5,78.3 265.5,78.7 Q 265.5,78.7 263.4,84.6 Q 263.4,84.6 244.2,84.7 Q 244.2,84.7 239.3,91.3 Q 239.3,91.3 218.6,89.2 Q 218.6,89.2 210.1,96.4 Q 210.1,96.4 190.0,92.0 Q 190.0,92.0 176.4,96.7 Q 176.4,96.7 160.0,93.0 Q 160.0,93.0 143.3,97.6 Q 143.3,97.6 130.0,92.0 Q 130.0,92.0 109.9,96.4 Q 109.9,96.4 101.4,89.2 Q 101.4,89.2 82.2,90.5 Q 82.2,90.5 75.8,84.7 Q 75.8,84.7 54.6,85.3 Q 54.6,85.3 54.5,78.7 Q 54.5,78.7 31.5,78.3 Q 31.5,78.3 38.4,71.5 Q 38.4,71.5 22.0,68.8 Q 22.0,68.8 28.4,63.5 Q 28.4,63.5 11.9,59.8 Q 11.9,59.8 25.0,55.0 Q 25.0,55.0 9.2,50.1 Q 9.2,50.1 28.4,46.5 Q 28.4,46.5 22.0,41.2 Q 22.0,41.2 38.4,38.5 Q 38.4,38.5 33.8,32.2 Q 33.8,32.2 54.5,31.3 Q 54.5,31.3 52.7,24.0 Q 52.7,24.0 75.8,25.3 Q 75.8,25.3 82.2,19.5 Q 82.2,19.5 101.4,20.8 Q 101.4,20.8 110.8,14.5 Q 110.8,14.5 130.0,18.0 Q 130.0,18.0 143.0,11.4 Q 143.0,11.4 160.0,17.0 Q 160.0,17.0 176.4,13.3 Q 176.4,13.3 190.0,18.0 Q 190.0,18.0 209.2,14.5 Q 209.2,14.5 218.6,20.8 Q 218.6,20.8 240.8,17.8 Q 240.8,17.8 244.2,25.3 Q 244.2,25.3 263.4,25.4 Q 263.4,25.4 265.5,31.3 Q 265.5,31.3 286.2,32.2 Q 286.2,32.2 281.6,38.5 Q 281.6,38.5 303.3,40.5 Q 303.3,40.5 291.6,46.5 Q 291.6,46.5 305.3,50.3 Q 305.3,50.3 295.0,55.0 Z";

const WILD_GRASS_PATH =
  "M 200.0,40.0 Q 200.0,40.0 207.2,43.6 Q 207.2,43.6 196.9,46.5 Q 196.9,46.5 202.4,50.9 Q 202.4,50.9 187.9,52.5 Q 187.9,52.5 190.9,57.8 Q 190.9,57.8 173.6,57.7 Q 173.6,57.7 169.7,62.1 Q 169.7,62.1 155.0,61.7 Q 155.0,61.7 148.3,66.3 Q 148.3,66.3 133.3,64.1 Q 133.3,64.1 123.3,69.0 Q 123.3,69.0 110.0,65.0 Q 110.0,65.0 97.2,67.6 Q 97.2,67.6 86.7,64.1 Q 86.7,64.1 71.7,66.3 Q 71.7,66.3 65.0,61.7 Q 65.0,61.7 47.9,63.2 Q 47.9,63.2 46.4,57.7 Q 46.4,57.7 32.3,56.9 Q 32.3,56.9 32.1,52.5 Q 32.1,52.5 17.6,50.9 Q 17.6,50.9 23.1,46.5 Q 23.1,46.5 8.9,43.8 Q 8.9,43.8 20.0,40.0 Q 20.0,40.0 12.8,36.4 Q 12.8,36.4 23.1,33.5 Q 23.1,33.5 17.6,29.1 Q 17.6,29.1 32.1,27.5 Q 32.1,27.5 29.1,22.2 Q 29.1,22.2 46.4,22.3 Q 46.4,22.3 50.3,17.9 Q 50.3,17.9 65.0,18.3 Q 65.0,18.3 71.7,13.7 Q 71.7,13.7 86.7,15.9 Q 86.7,15.9 96.7,11.0 Q 96.7,11.0 110.0,15.0 Q 110.0,15.0 122.8,12.4 Q 122.8,12.4 133.3,15.9 Q 133.3,15.9 148.3,13.7 Q 148.3,13.7 155.0,18.3 Q 155.0,18.3 172.1,16.8 Q 172.1,16.8 173.6,22.3 Q 173.6,22.3 187.7,23.1 Q 187.7,23.1 187.9,27.5 Q 187.9,27.5 202.4,29.1 Q 202.4,29.1 196.9,33.5 Q 196.9,33.5 211.1,36.2 Q 211.1,36.2 200.0,40.0 Z";

function GrassPedestalSvg({ isPlayer }) {
  if (isPlayer) {
    return (
      <svg
        className="pedestal-grass-svg player-grass-svg"
        viewBox="0 0 320 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="playerGrassLawn" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="45%" stopColor="#22c55e" />
            <stop offset="85%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
          <radialGradient id="playerGrassSunlight" cx="45%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Soft Ambient Ground Shadow */}
        <ellipse cx="160" cy="62" rx="148" ry="40" fill="rgba(0,0,0,0.38)" />
        {/* Outer Jagged Grass Blades Rim */}
        <path d={PLAYER_GRASS_PATH} fill="#15803d" stroke="#14532d" strokeWidth="2.5" />
        {/* Inner Vibrant Green Turf Lawn */}
        <ellipse cx="160" cy="55" rx="128" ry="34" fill="url(#playerGrassLawn)" />
        {/* Center Sunlight Dapple */}
        <ellipse cx="150" cy="50" rx="90" ry="22" fill="url(#playerGrassSunlight)" />
      </svg>
    );
  }

  return (
    <svg
      className="pedestal-grass-svg wild-grass-svg"
      viewBox="0 0 220 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="wildGrassLawn" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="88%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>
        <radialGradient id="wildGrassSunlight" cx="45%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Soft Ground Shadow */}
      <ellipse cx="110" cy="46" rx="98" ry="28" fill="rgba(0,0,0,0.36)" />
      {/* Outer Jagged Grass Blades Rim */}
      <path d={WILD_GRASS_PATH} fill="#15803d" stroke="#14532d" strokeWidth="2" />
      {/* Inner Vibrant Green Turf Lawn */}
      <ellipse cx="110" cy="40" rx="84" ry="22" fill="url(#wildGrassLawn)" />
      {/* Center Sunlight Dapple */}
      <ellipse cx="104" cy="36" rx="55" ry="14" fill="url(#wildGrassSunlight)" />
    </svg>
  );
}

export function BattlePedestal({
  biomeId,
  isPlayer = false,
  cameraMode = "isometric",
  children,
}) {
  const isGrassTheme =
    !biomeId ||
    biomeId === "viridian-forest" ||
    biomeId === "route-1" ||
    biomeId === "route-2" ||
    biomeId === "gym-grass";

  return (
    <div
      className={`rpg-battle-pedestal-root ${
        isPlayer ? "pedestal-player-side" : "pedestal-wild-side"
      } ${cameraMode === "isometric" ? "pedestal-isometric" : "pedestal-classic"}`}
    >
      {/* 3D Styled Raised Platform Base */}
      {isGrassTheme ? (
        <div className="pedestal-grass-3d-wrap">
          <GrassPedestalSvg isPlayer={isPlayer} />
        </div>
      ) : (
        <div
          className={`pedestal-3d-base pedestal-theme-${biomeId} ${
            isPlayer ? "pedestal-front" : "pedestal-back"
          }`}
        >
          <div className="pedestal-surface">
            <div className="pedestal-rim"></div>
            <div className="pedestal-texture"></div>
          </div>
          <div className="pedestal-depth-lip"></div>
          <div className="pedestal-ground-shadow"></div>
        </div>
      )}

      {/* Battler Sprite & VFX Anchored on Pedestal */}
      <div className="pedestal-content-mount">{children}</div>
    </div>
  );
}
