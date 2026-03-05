// ============================================================================
// Component - Action Button (semantic color + icon per action)
// ============================================================================

import { memo, useCallback, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../a11y';
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

// Semantic config per action: class, icon, size weight
const ACTION_STYLE: Record<PlayerAction, {
  cls: string;
  icon: string;
  large?: boolean; // HIT and STAND get larger treatment
}> = {
  hit:       { cls: 'btn-action-hit',       icon: '▲', large: true },
  stand:     { cls: 'btn-action-stand',     icon: '✋', large: true },
  double:    { cls: 'btn-action-double',    icon: '×2' },
  split:     { cls: 'btn-action-split',     icon: '⟦⟧' },
  surrender: { cls: 'btn-action-secondary', icon: '↩' },
  insurance: { cls: 'btn-action-secondary', icon: '🛡' },
};

export const ActionButton = memo(function ActionButton({
  action,
  label,
  disabled,
  onClick,
  shortcut,
  reason,
}: ActionButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const style = ACTION_STYLE[action];

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) onClick();
    },
    [disabled, onClick]
  );

  const button = (
    <motion.div
      whileHover={disabled || prefersReducedMotion ? {} : { y: -2, scale: 1.03 }}
      whileTap={disabled || prefersReducedMotion ? {} : { scale: 0.95, y: 1 }}
      transition={{ duration: 0.1 }}
      style={{ position: 'relative', zIndex: 10 }}
    >
      <button
        onClick={handleClick}
        disabled={disabled}
        type="button"
        className={cn(
          style.cls,
          'w-full relative z-10',
          // Size: HIT/STAND bigger vertically
          style.large
            ? 'min-h-[56px] sm:min-h-[64px] px-4 sm:px-6 text-sm sm:text-base'
            : 'min-h-[48px] sm:min-h-[52px] px-3 sm:px-5 text-xs sm:text-sm',
        )}
        style={{ pointerEvents: disabled ? 'none' : 'auto' }}
        aria-label={`${label}${disabled && reason ? `: ${reason}` : ''}${shortcut ? ` (${shortcut})` : ''}`}
        aria-disabled={disabled}
      >
        <span className="flex flex-col items-center justify-center gap-0.5 leading-none">
          <span className={cn('text-lg sm:text-xl leading-none', !style.large && 'text-base sm:text-lg')}>
            {style.icon}
          </span>
          <span className="font-extrabold tracking-wide">{label}</span>
          {!disabled && shortcut && (
            <span className="text-[9px] opacity-60 font-normal">{shortcut}</span>
          )}
        </span>
      </button>
    </motion.div>
  );

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
