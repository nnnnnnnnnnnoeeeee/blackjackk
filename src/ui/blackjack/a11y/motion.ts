// ============================================================================
// Accessibility - Motion & Reduced Motion Support
// ============================================================================

import { useEffect, useState } from 'react';
import type { Variants } from 'framer-motion';

/**
 * Hook to detect if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation variants that respect reduced motion preference
 * If reduced motion is enabled, animations are simplified to fade only
 */
export function conditionalVariants(
  variants: Variants,
  prefersReducedMotion: boolean
): Variants {
  if (prefersReducedMotion) {
    // Return simplified variants with only opacity transitions
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return variants;
}

/**
 * Returns transition config that respects reduced motion
 */
export function conditionalTransition(
  transition: { duration?: number; delay?: number },
  prefersReducedMotion: boolean
) {
  if (prefersReducedMotion) {
    return {
      duration: 0.1, // Very fast transition
      delay: 0,
    };
  }
  return transition;
}
