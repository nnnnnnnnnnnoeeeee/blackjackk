// ============================================================================
// Component - Phase Banner
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { phaseText } from '@/lib/casinoTheme';
import { useReducedMotion, conditionalVariants } from '../a11y';
import type { GamePhase } from '@/lib/blackjack/types';

interface PhaseBannerProps {
  phase: GamePhase;
  activeHandIndex?: number;
  totalHands?: number;
  className?: string;
}

export const PhaseBanner = memo(function PhaseBanner({
  phase,
  activeHandIndex,
  totalHands,
  className,
}: PhaseBannerProps) {
  const prefersReducedMotion = useReducedMotion();

  // Don't render anything during BETTING phase
  if (phase === 'BETTING') {
    return null;
  }

  const getPhaseText = (): string => {
    if (phase === 'PLAYER_TURN' && totalHands && totalHands > 1 && activeHandIndex !== undefined) {
      return `Your Turn - Hand ${activeHandIndex + 1}/${totalHands}`;
    }
    return phaseText[phase] || '';
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'BETTING':
        return 'bg-primary/20 border-primary/50 text-primary';
      case 'DEALING':
        return 'bg-muted/50 border-muted text-muted-foreground';
      case 'PLAYER_TURN':
        return 'bg-success/20 border-success/50 text-success';
      case 'DEALER_TURN':
        return 'bg-warning/20 border-warning/50 text-warning';
      case 'SETTLEMENT':
        return 'bg-accent/20 border-accent/50 text-accent';
      default:
        return 'bg-card/50 border-border text-foreground';
    }
  };

  const variants = conditionalVariants(
    {
      initial: { opacity: 0, y: -10 },
      animate: { opacity: 1, y: 0 },
    },
    prefersReducedMotion
  );

  const pulseVariants = conditionalVariants(
    {
      animate: {
        scale: [1, 1.2, 1],
      },
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    prefersReducedMotion
  );

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      key={phase}
      className={cn('text-center mb-1 sm:mb-1.5 md:mb-2 w-full px-1', className)}
      role="status"
      aria-live="polite"
      aria-label={`Game phase: ${getPhaseText()}`}
    >
      <div
        className={cn(
          'inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full',
          'backdrop-blur-sm border transition-colors duration-300 max-w-full',
          getPhaseColor()
        )}
      >
        <motion.div
          variants={prefersReducedMotion ? undefined : pulseVariants}
          animate={prefersReducedMotion ? undefined : 'animate'}
          className={cn(
            'w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full flex-shrink-0',
            phase === 'BETTING' && 'bg-primary',
            phase === 'DEALING' && 'bg-muted-foreground',
            phase === 'PLAYER_TURN' && 'bg-success',
            phase === 'DEALER_TURN' && 'bg-warning',
            phase === 'SETTLEMENT' && 'bg-accent',
          )}
          aria-hidden="true"
        />
        <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold uppercase tracking-wider truncate">
          {getPhaseText()}
        </span>
      </div>
    </motion.div>
  );
});

export default PhaseBanner;
