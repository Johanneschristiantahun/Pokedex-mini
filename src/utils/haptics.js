// ========================================================
// PokéSphere Mobile Haptic Vibration Feedback Helper
// Enhances tactile feedback on mobile devices during battles
// ========================================================

export function triggerHaptic(pattern = [25]) {
  if (typeof window !== "undefined" && "navigator" in window && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors if unsupported or blocked by browser policy
    }
  }
}

// Preset Haptic Patterns
export const HAPTIC_PATTERNS = {
  LIGHT: [15],
  MEDIUM: [30],
  HEAVY: [50],
  CRITICAL_HIT: [40, 20, 40],
  SUPER_EFFECTIVE: [30, 20, 30],
  FAINT: [60, 40, 60],
  MEGA_EVOLUTION: [30, 20, 30, 20, 60],
  CATCH_SHAKE: [25, 35, 25],
  CATCH_SUCCESS: [40, 30, 40, 30, 80],
};
