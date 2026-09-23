// ========================================================
// PokéSphere 8-bit / Chiptune Retro Audio Synthesizer
// Pure Web Audio API — zero external files, 0ms lag, 100% offline
// ========================================================

let audioContext = null;
let isMasterMuted = false;

if (typeof window !== "undefined") {
  try {
    isMasterMuted = localStorage.getItem("pokesphere_sound_muted") === "true";
  } catch {}
}

export function setMasterMute(muted) {
  isMasterMuted = Boolean(muted);
  try {
    localStorage.setItem("pokesphere_sound_muted", isMasterMuted.toString());
  } catch {}
}

export function getMasterMute() {
  return isMasterMuted;
}

function getAudioContext() {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

// Helper: Play an 8-bit synthesizer tone
function playTone({ freq, type = "square", duration = 0.1, startTime = 0, gain = 0.15 }) {
  if (isMasterMuted) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    // ADSR-like volume envelope
    gainNode.gain.setValueAtTime(gain, ctx.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration + 0.05);
  } catch (err) {
    console.debug("Audio play error:", err);
  }
}

// 1. Pokémon Center Healing Station (Classic 6-note arpeggio)
export function playHealingJingle() {
  if (isMasterMuted) return;

  // Notes: B4, B4, B4, E5, G#5, B5
  const notes = [
    { freq: 493.88, duration: 0.12, time: 0.0 },
    { freq: 493.88, duration: 0.12, time: 0.15 },
    { freq: 493.88, duration: 0.12, time: 0.30 },
    { freq: 659.25, duration: 0.20, time: 0.45 },
    { freq: 830.61, duration: 0.20, time: 0.68 },
    { freq: 987.77, duration: 0.45, time: 0.90 },
  ];

  notes.forEach((n) => {
    playTone({
      freq: n.freq,
      type: "triangle",
      duration: n.duration,
      startTime: n.time,
      gain: 0.2,
    });
  });
}

// 2. Poké Mart Cash Register / Coin Sound (B5 -> E6)
export function playMartBuySound() {
  if (isMasterMuted) return;
  playTone({ freq: 987.77, type: "sine", duration: 0.08, startTime: 0.0, gain: 0.18 });
  playTone({ freq: 1318.51, type: "sine", duration: 0.22, startTime: 0.08, gain: 0.22 });
}

// 3. Item Applied on Pokémon (Sweet Plink chime)
export function playItemUseSound() {
  if (isMasterMuted) return;
  playTone({ freq: 659.25, type: "triangle", duration: 0.1, startTime: 0.0, gain: 0.15 });
  playTone({ freq: 830.61, type: "triangle", duration: 0.25, startTime: 0.1, gain: 0.2 });
}

// 4. Level Up Fanfare (C5 -> G5 -> C6 -> E6 -> G6)
export function playLevelUpSound() {
  if (isMasterMuted) return;

  const notes = [
    { freq: 523.25, duration: 0.1, time: 0.0 },
    { freq: 783.99, duration: 0.1, time: 0.1 },
    { freq: 1046.5, duration: 0.12, time: 0.2 },
    { freq: 1318.51, duration: 0.15, time: 0.33 },
    { freq: 1567.98, duration: 0.4, time: 0.48 },
  ];

  notes.forEach((n) => {
    playTone({
      freq: n.freq,
      type: "square",
      duration: n.duration,
      startTime: n.time,
      gain: 0.16,
    });
  });
}

// 5. Evolution Jingle (Triumphant chord)
export function playEvolutionJingle() {
  if (isMasterMuted) return;

  const notes = [
    { freq: 440.0, duration: 0.15, time: 0.0 },
    { freq: 554.37, duration: 0.15, time: 0.15 },
    { freq: 659.25, duration: 0.15, time: 0.30 },
    { freq: 880.0, duration: 0.5, time: 0.45 },
  ];

  notes.forEach((n) => {
    playTone({
      freq: n.freq,
      type: "triangle",
      duration: n.duration,
      startTime: n.time,
      gain: 0.2,
    });
  });
}

// 6. Subtle UI Blip
export function playButtonBlip() {
  if (isMasterMuted) return;
  playTone({ freq: 880.0, type: "sine", duration: 0.04, startTime: 0.0, gain: 0.08 });
}

// 7. Grass Rustle Sound (swish in tall grass)
export function playGrassRustleSound() {
  if (isMasterMuted) return;
  playTone({ freq: 240, type: "triangle", duration: 0.06, startTime: 0.0, gain: 0.1 });
  playTone({ freq: 360, type: "sine", duration: 0.08, startTime: 0.04, gain: 0.12 });
  playTone({ freq: 180, type: "triangle", duration: 0.06, startTime: 0.08, gain: 0.08 });
}

// 8. Ball Throw Sound (swoosh curve)
export function playBallThrowSound() {
  if (isMasterMuted) return;
  playTone({ freq: 300, type: "sine", duration: 0.08, startTime: 0.0, gain: 0.15 });
  playTone({ freq: 520, type: "sine", duration: 0.10, startTime: 0.06, gain: 0.18 });
  playTone({ freq: 780, type: "sine", duration: 0.12, startTime: 0.14, gain: 0.12 });
}

// 9. Ball Wobble / Shake Click
export function playBallWobbleSound() {
  if (isMasterMuted) return;
  playTone({ freq: 440, type: "triangle", duration: 0.07, startTime: 0.0, gain: 0.18 });
  playTone({ freq: 660, type: "sine", duration: 0.05, startTime: 0.03, gain: 0.12 });
}

// 10. Catch Success Jingle (Iconic Catch Fanfare: G4 -> A4 -> B4 -> C5 -> G5)
export function playCatchSuccessJingle() {
  if (isMasterMuted) return;
  const notes = [
    { freq: 392.00, duration: 0.12, time: 0.0 },   // G4
    { freq: 440.00, duration: 0.12, time: 0.12 },  // A4
    { freq: 493.88, duration: 0.14, time: 0.24 },  // B4
    { freq: 523.25, duration: 0.20, time: 0.38 },  // C5
    { freq: 783.99, duration: 0.50, time: 0.58 },  // G5 (triumph hold)
  ];

  notes.forEach((n) => {
    playTone({
      freq: n.freq,
      type: "square",
      duration: n.duration,
      startTime: n.time,
      gain: 0.16,
    });
  });
}

// 11. Combat Hit Impact Sound
export function playHitSound() {
  if (isMasterMuted) return;
  playTone({ freq: 160, type: "square", duration: 0.08, startTime: 0.0, gain: 0.25 });
  playTone({ freq: 110, type: "triangle", duration: 0.12, startTime: 0.05, gain: 0.2 });
}

// 12. Wild Pokémon Faint Sound
export function playFaintSound() {
  if (isMasterMuted) return;
  playTone({ freq: 380, type: "triangle", duration: 0.12, startTime: 0.0, gain: 0.18 });
  playTone({ freq: 280, type: "triangle", duration: 0.14, startTime: 0.10, gain: 0.18 });
  playTone({ freq: 180, type: "sine", duration: 0.25, startTime: 0.22, gain: 0.2 });
}

// 13. Run Away / Escape Sound
export function playRunSound() {
  if (isMasterMuted) return;
  playTone({ freq: 620, type: "sine", duration: 0.07, startTime: 0.0, gain: 0.15 });
  playTone({ freq: 480, type: "sine", duration: 0.07, startTime: 0.08, gain: 0.15 });
  playTone({ freq: 340, type: "sine", duration: 0.12, startTime: 0.16, gain: 0.12 });
}

