// ============================================================================
// Component - Hand Result Card
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion, conditionalVariants } from '../a11y';
import type { SettlementResult } from '@/lib/blackjack/types';

interface HandResultCardProps {
  handIndex: number;
  bet: number;
  payout: number;
  result: SettlementResult;
  className?: string;
}

const RESULT_COLORS: Record<SettlementResult, { bg: string; text: string; border: string }> = {
  win: {
    bg: 'bg-success/20',
    text: 'text-success',
    border: 'border-success/50',
  },
  lose: {
    bg: 'bg-destructive/20',
    text: 'text-destructive',
    border: 'border-destructive/50',
  },
  push: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    border: 'border-warning/50',
  },
  blackjack: {
    bg: 'bg-primary/20',
    text: 'text-primary',
    border: 'border-primary/50',
  },
  surrender: {
    bg: 'bg-muted/20',
    text: 'text-muted-foreground',
    border: 'border-muted/50',
  },
};

const RESULT_LABELS: Record<SettlementResult, string> = {
  win: 'WIN',
  lose: 'LOSE',
  push: 'PUSH',
  blackjack: 'BLACKJACK 3:2!',
  surrender: 'SURRENDER',
};

export const HandResultCard = memo(function HandResultCard({
  handIndex,
  bet,
  payout,
  result,
  className,
}: HandResultCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const colors = RESULT_COLORS[result];
  const netResult = payout - bet;

  const variants = conditionalVariants(
    {
      initial: { opacity: 0, y: -10, scale: 0.9 },
      animate: { opacity: 1, y: 0, scale: 1 },
    },
    prefersReducedMotion
  );

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      className={cn(
        'rounded-lg p-3 sm:p-4 border-2 backdrop-blur-sm',
        colors.bg,
        colors.border,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Hand {handIndex + 1}
        </div>
        <div
          className={cn(
            'px-2 py-1 rounded-full text-xs font-bold uppercase',
            colors.bg,
            colors.text,
            colors.border,
            'border'
          )}
        >
          {RESULT_LABELS[result]}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Bet:</span>
          <span className="font-semibold">${bet}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Payout:</span>
          <span className="font-semibold">${payout}</span>
        </div>
        <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t border-current/20">
          <span>Net:</span>
          <span className={cn(colors.text, netResult > 0 && 'glow-success', netResult < 0 && 'glow-destructive')}>
            {netResult > 0 ? '+' : ''}${netResult}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

export default HandResultCard;
