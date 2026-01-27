// ============================================================================
// Component - Action Button
// ============================================================================

import { memo, useCallback, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useReducedMotion, conditionalVariants } from '../a11y';
import type { PlayerAction } from '@/lib/blackjack/types';

interface ActionButtonProps {
  action: PlayerAction;
  label: string;
  disabled: boolean;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  shortcut?: string;
  reason?: string;
}

const ACTION_CONFIG: Record<PlayerAction, { label: string; shortcut: string }> = {
  hit: { label: 'Hit', shortcut: 'H' },
  stand: { label: 'Stand', shortcut: 'S' },
  double: { label: 'Double', shortcut: 'D' },
  split: { label: 'Split', shortcut: 'P' },
  surrender: { label: 'Surrender', shortcut: 'R' },
  insurance: { label: 'Insurance', shortcut: 'I' },
};

export const ActionButton = memo(function ActionButton({
  action,
  label,
  disabled,
  onClick,
  variant = 'secondary',
  shortcut,
  reason,
}: ActionButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        onClick();
      }
    },
    [disabled, onClick]
  );

  const hoverVariants = conditionalVariants(
    {
      scale: 1.05,
      y: -2,
    },
    prefersReducedMotion
  );

  const tapVariants = conditionalVariants(
    {
      scale: 0.95,
      y: 0,
    },
    prefersReducedMotion
  );

  const button = (
    <motion.div
      whileHover={disabled || prefersReducedMotion ? {} : hoverVariants}
      whileTap={disabled || prefersReducedMotion ? {} : tapVariants}
      style={{ position: 'relative', zIndex: 10 }}
    >
      <button
        onClick={handleClick}
        disabled={disabled}
        type="button"
        className={cn(
          'px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 rounded-lg font-semibold uppercase tracking-wider',
          'transition-all duration-200 text-xs sm:text-sm md:text-base',
          'relative z-10 w-full min-h-[48px] sm:min-h-[52px]',
          variant === 'primary' && 'btn-casino',
          variant === 'secondary' && 'btn-casino-secondary',
          variant === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive/50',
          disabled && 'opacity-50 cursor-not-allowed filter grayscale-[50%]',
          !disabled && 'cursor-pointer',
        )}
        style={{
          pointerEvents: disabled ? 'none' : 'auto',
          boxShadow: disabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
        aria-label={`${label}${disabled && reason ? `: ${reason}` : ''}${shortcut ? ` (Press ${shortcut})` : ''}`}
        aria-disabled={disabled}
        aria-describedby={disabled && reason ? `${action}-reason` : undefined}
      >
        <span className="flex items-center justify-center gap-2">
          <span>{label}</span>
          {!disabled && shortcut && (
            <span className="text-[10px] opacity-70">({shortcut})</span>
          )}
        </span>
      </button>
    </motion.div>
  );

  // Show tooltip if disabled and reason provided
  if (disabled && reason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p id={`${action}-reason`}>{reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
});

export default ActionButton;
