// ============================================================================
// Component - Turn Indicator (Multijoueur)
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion, conditionalVariants } from '../a11y';

interface TurnIndicatorProps {
  isActive: boolean;
  label?: string;
  className?: string;
}

export const TurnIndicator = memo(function TurnIndicator({
  isActive,
  label = '⭐',
  className,
}: TurnIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();

  const pulseVariants = conditionalVariants(
    {
      animate: {
        opacity: [1, 0.5, 1],
        scale: [1, 1.1, 1],
      },
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    prefersReducedMotion
  );

  if (!isActive) return null;

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : pulseVariants}
      animate={prefersReducedMotion ? undefined : 'animate'}
      className={cn('text-xs font-bold text-primary', className)}
      role="status"
      aria-live="polite"
      aria-label={isActive ? 'Your turn' : undefined}
    >
      {label}
    </motion.div>
  );
});

export default TurnIndicator;
