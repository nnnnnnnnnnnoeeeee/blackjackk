// ============================================================================
// Design Tokens - Extended from casinoTheme.ts
// ============================================================================

import { casinoTheme } from '@/lib/casinoTheme';

/**
 * Extended design tokens for blackjack UI components
 * Re-exports casinoTheme and adds additional tokens
 */
export const tokens = {
  ...casinoTheme,

  // Additional z-index layers
  zIndex: {
    ...casinoTheme.zIndex,
    overlay: 200,
    toast: 150,
    dropdown: 60,
  },

  // Card spacing (negative margins for overlap effect)
  cardSpacing: {
    mobile: '-space-x-6',
    tablet: '-space-x-8',
    desktop: '-space-x-10',
  },

  // Compact mode breakpoint (very small screens)
  compactBreakpoint: 400,
} as const;

export default tokens;
