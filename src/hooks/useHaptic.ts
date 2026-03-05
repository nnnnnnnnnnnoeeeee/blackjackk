// ============================================================================
// Hook - Haptic Feedback (mobile vibrations)
// ============================================================================

const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

const vibrate = (pattern: number | number[]) => {
  if (isSupported) {
    navigator.vibrate(pattern);
  }
};

export const useHaptic = () => ({
  cardDeal: () => vibrate(18),
  win: () => vibrate([40, 20, 60]),
  blackjack: () => vibrate([50, 30, 50, 30, 120]),
  lose: () => vibrate(90),
  bust: () => vibrate([180, 40, 80]),
  buttonPress: () => vibrate(12),
  push: () => vibrate([20, 20, 20]),
});
