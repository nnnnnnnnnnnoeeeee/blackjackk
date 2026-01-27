// ============================================================================
// Casino Theme - Centralized design tokens and utilities
// ============================================================================

/**
 * Centralized casino theme configuration
 * Provides consistent colors, spacing, and styles across the application
 */

export const casinoTheme = {
  // Colors
  colors: {
    felt: {
      base: 'hsl(160 84% 8%)',
      light: 'hsl(160 60% 12%)',
      dark: 'hsl(160 84% 6%)',
    },
    gold: {
      primary: 'hsl(43 74% 49%)',
      light: 'hsl(43 74% 55%)',
      dark: 'hsl(43 74% 40%)',
      glow: 'hsl(43 74% 49% / 0.4)',
    },
    success: {
      base: 'hsl(142 71% 45%)',
      glow: 'hsl(142 71% 45% / 0.4)',
    },
    destructive: {
      base: 'hsl(0 72% 51%)',
      glow: 'hsl(0 72% 51% / 0.4)',
    },
    warning: {
      base: 'hsl(38 92% 50%)',
      glow: 'hsl(38 92% 50% / 0.4)',
    },
  },

  // Spacing (responsive)
  spacing: {
    card: {
      mobile: { min: 50, max: 65 },
      tablet: { min: 65, max: 75 },
      desktop: { min: 70, max: 100 },
    },
    chip: {
      mobile: 44,
      tablet: 52,
      desktop: 48,
    },
    button: {
      mobile: { minHeight: 44, padding: 'px-4 py-2.5' },
      tablet: { minHeight: 48, padding: 'px-5 py-3' },
      desktop: { minHeight: 48, padding: 'px-6 py-3' },
    },
  },

  // Breakpoints (matching Tailwind)
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1280,
  },

  // Shadows
  shadows: {
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    chip: '0 4px 8px rgba(0, 0, 0, 0.2)',
    button: '0 2px 4px rgba(0, 0, 0, 0.1)',
    table: 'inset 0 0 100px rgba(0, 0, 0, 0.3), 0 10px 40px rgba(0, 0, 0, 0.2)',
    glow: {
      gold: '0 0 20px hsl(43 74% 49% / 0.4), 0 0 40px hsl(43 74% 49% / 0.2)',
      success: '0 0 20px hsl(142 71% 45% / 0.4), 0 0 40px hsl(142 71% 45% / 0.2)',
      destructive: '0 0 20px hsl(0 72% 51% / 0.4), 0 0 40px hsl(0 72% 51% / 0.2)',
    },
  },

  // Transitions
  transitions: {
    fast: 'duration-150 ease-out',
    normal: 'duration-200 ease-out',
    slow: 'duration-300 ease-out',
  },

  // Typography
  typography: {
    heading: {
      mobile: 'text-lg',
      tablet: 'text-xl',
      desktop: 'text-2xl',
    },
    body: {
      mobile: 'text-sm',
      tablet: 'text-base',
      desktop: 'text-base',
    },
    badge: {
      mobile: 'text-xs',
      tablet: 'text-sm',
      desktop: 'text-sm',
    },
  },

  // Z-index layers
  zIndex: {
    modal: 100,
    tooltip: 50,
    dock: 40,
    header: 30,
    card: 10,
    base: 1,
  },

  // Animations
  animations: {
    duration: {
      fast: 150,
      normal: 200,
      slow: 300,
      slower: 500,
    },
    easing: {
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Safe area (iOS notch, Android bars)
  safeArea: {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
  },
} as const;

/**
 * Utility function to get responsive classes
 */
export const getResponsiveClasses = (breakpoint: 'mobile' | 'tablet' | 'desktop') => {
  const base = {
    mobile: 'sm:',
    tablet: 'md:',
    desktop: 'lg:',
  };
  return base[breakpoint];
};

/**
 * Utility function to check if current viewport matches breakpoint
 */
export const useBreakpoint = () => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < casinoTheme.breakpoints.mobile) return 'mobile';
  if (width < casinoTheme.breakpoints.tablet) return 'tablet';
  if (width < casinoTheme.breakpoints.desktop) return 'laptop';
  return 'desktop';
};

/**
 * Phase display text mapping (English)
 */
export const phaseText = {
  BETTING: 'Place Your Bet',
  DEALING: 'Dealing...',
  PLAYER_TURN: 'Your Turn',
  DEALER_TURN: 'Dealer Playing',
  SETTLEMENT: 'Settlement',
} as const;

/**
 * Result text mapping
 */
export const resultText = {
  win: 'WIN',
  lose: 'LOSE',
  push: 'PUSH',
  blackjack: 'BLACKJACK 3:2!',
  surrender: 'SURRENDER',
} as const;
