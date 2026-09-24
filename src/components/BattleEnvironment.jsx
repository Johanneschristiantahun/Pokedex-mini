// ========================================================
// PokéSphere RPG Battle Environment Component
// Multi-layered, biome-specific scenic backdrops,
// atmospheric animated particles, and authentic 3D battle pedestals
// ========================================================

export function BattleEnvironment({
  biomeId,
  children,
}) {
  return (
    <div className={`rpg-battlefield-stage biome-theme-${biomeId}`}>
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
    <div className="env-scenery-wrap forest-scenery">
      <svg
        className="env-svg-scenery"
        viewBox="0 0 800 360"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="40%" stopColor="#0f766e" />
            <stop offset="75%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>
          <linearGradient id="sunbeam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sky Base */}
        <rect width="800" height="360" fill="url(#forestSky)" />

        {/* Sunbeams / God Rays */}
        <polygon points="120,0 260,0 480,360 280,360" fill="url(#sunbeam)" />
        <polygon points="450,0 560,0 720,360 580,360" fill="url(#sunbeam)" />

        {/* Distant Foggy Tree Silhouette Layer 1 */}
        <path
          d="M0,230 L50,190 L90,225 L140,180 L190,220 L250,175 L310,215 L380,170 L440,210 L500,165 L570,215 L640,180 L700,220 L760,175 L800,210 L800,360 L0,360 Z"
          fill="#065f46"
          opacity="0.55"
        />

        {/* Midground Pine Trees Layer 2 */}
        <path
          d="M0,250 L40,210 L70,240 L120,195 L170,245 L220,190 L280,240 L340,185 L400,235 L470,180 L540,240 L600,195 L670,245 L730,190 L800,240 L800,360 L0,360 Z"
          fill="#047857"
          opacity="0.8"
        />

        {/* Deep Forest Floor Ridge */}
        <path
          d="M0,280 Q200,255 400,275 T800,265 L800,360 L0,360 Z"
          fill="#14532d"
        />

        {/* Overhanging Foreground Foliage & Vines */}
        <path
          d="M-20,-10 Q120,80 240,10 Q320,70 420,-10 Q500,60 620,0 Q700,80 820,-10 L820,-20 L-20,-20 Z"
          fill="#022c22"
          opacity="0.85"
        />
        <path
          d="M180,0 Q190,70 185,110 M360,0 Q370,60 365,95 M580,0 Q575,80 580,120"
          stroke="#064e3b"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.75"
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
      <span className="particle particle-leaf leaf-1">🍃</span>
      <span className="particle particle-leaf leaf-2">🌿</span>
      <span className="particle particle-leaf leaf-3">🍃</span>
      <span className="particle particle-leaf leaf-4">🌿</span>
      <span className="particle particle-leaf leaf-5">🍃</span>
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
      <span className="particle particle-spark spark-1">⚡</span>
      <span className="particle particle-spark spark-2">⚡</span>
      <span className="particle particle-spark spark-3">⚡</span>
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

export function BattlePedestal({
  biomeId,
  isPlayer = false,
  children,
}) {
  return (
    <div className={`rpg-battle-pedestal-root ${isPlayer ? "pedestal-player-side" : "pedestal-wild-side"}`}>
      {/* 3D Styled Raised Platform Base */}
      <div className={`pedestal-3d-base pedestal-theme-${biomeId} ${isPlayer ? "pedestal-front" : "pedestal-back"}`}>
        <div className="pedestal-surface">
          <div className="pedestal-rim"></div>
          <div className="pedestal-texture"></div>
        </div>
        <div className="pedestal-depth-lip"></div>
        <div className="pedestal-ground-shadow"></div>
      </div>

      {/* Battler Sprite & VFX Anchored on Pedestal */}
      <div className="pedestal-content-mount">
        {children}
      </div>
    </div>
  );
}
