// ============================================================================
// Haptics - Lightweight vibration feedback (progressive enhancement)
// ============================================================================
//
// Uses the Vibration API, which is supported on Android/Chromium browsers and
// silently ignored elsewhere (notably iOS Safari). All calls are best-effort:
// feature-detected and wrapped so a missing API or a missing user-gesture never
// throws. Patterns are intentionally short to feel premium, not annoying.

export type HapticPattern =
  | 'tap'        // light UI tap (button press)
  | 'success'    // confirmation (bet placed)
  | 'win'        // round won
  | 'blackjack'  // natural blackjack — celebratory
  | 'lose'       // round lost — single soft buzz
  | 'warning';   // invalid action / error

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  success: 20,
  win: [0, 30, 40, 30],
  blackjack: [0, 40, 50, 40, 50, 60],
  lose: [0, 90],
  warning: [0, 20, 40, 20],
};

/**
 * Trigger a haptic pulse. No-op when the Vibration API is unavailable.
 */
export function vibrate(pattern: HapticPattern): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Some browsers throw if called outside a user gesture — ignore.
  }
}
