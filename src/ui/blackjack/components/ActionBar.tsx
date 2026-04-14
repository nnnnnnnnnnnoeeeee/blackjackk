// ============================================================================
// Component - Action Bar (Player Actions)
// ============================================================================

import { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectConfig } from '@/store/useGameStore';
import { useValidActions } from '../hooks';
import { useHotkeys } from '../a11y';
import { useReducedMotion, conditionalVariants } from '../a11y';
import { ActionButton } from './ActionButton';
import { toast } from 'sonner';
import type { PlayerAction } from '@/lib/blackjack/types';

interface ActionBarProps {
  /** Called with the player's action right before it's executed (only for valid actions). Used by coach mode. */
  onBeforeAction?: (action: PlayerAction) => void;
}

export const ActionBar = memo(function ActionBar({ onBeforeAction }: ActionBarProps) {
  const executeAction = useGameStore((s) => s.action);
  const isAnimating = useGameStore((s) => s.isAnimating);
  const config = useGameStore(selectConfig);
  const { validActions, getActionReason } = useValidActions();
  const prefersReducedMotion = useReducedMotion();

  // Get key bindings from config, fallback to defaults
  const keyBindings = config.keyBindings || {
    hit: 'H',
    stand: 'S',
    double: 'D',
    split: 'P',
    insurance: 'I',
    surrender: 'R',
    enter: 'Enter',
    space: ' ',
  };

  const ACTION_CONFIG: Array<{
    action: PlayerAction;
    label: string;
    variant: 'primary' | 'secondary' | 'danger';
    shortcut: string;
  }> = useMemo(() => [
    { action: 'hit',       label: 'Hit',       variant: 'primary',   shortcut: keyBindings.hit },
    { action: 'stand',     label: 'Stand',     variant: 'danger',    shortcut: keyBindings.stand },
    { action: 'double',    label: 'Double',    variant: 'secondary', shortcut: keyBindings.double },
    { action: 'split',     label: 'Split',     variant: 'secondary', shortcut: keyBindings.split },
    { action: 'insurance', label: 'Insurance', variant: 'secondary', shortcut: keyBindings.insurance },
  ], [keyBindings]);

  const handleAction = useCallback(
    (action: PlayerAction) => {
      if (isAnimating) {
        return;
      }

      if (!validActions.includes(action)) {
        const reason = getActionReason(action);
        toast.error('Action unavailable', {
          description: reason || `You cannot ${action} now.`,
        });
        return;
      }

      // Coach mode hook — fires before executing so the state is still pre-action
      onBeforeAction?.(action);

      try {
        executeAction(action);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error executing action';
        toast.error('Error', {
          description: message,
        });
      }
    },
    [executeAction, isAnimating, validActions, getActionReason, onBeforeAction]
  );

  // Setup keyboard shortcuts using custom key bindings
  useHotkeys(
    [
      ...ACTION_CONFIG.map(({ action, shortcut }) => ({
        key: shortcut,
        handler: () => handleAction(action),
        enabled: validActions.includes(action) && !isAnimating,
        scope: 'action-bar',
      })),
      {
        key: keyBindings.enter,
        handler: () => {
          if (validActions.includes('stand')) {
            handleAction('stand');
          }
        },
        enabled: validActions.includes('stand') && !isAnimating,
        scope: 'action-bar',
      },
      {
        key: keyBindings.space,
        handler: () => {
          if (validActions.includes('stand')) {
            handleAction('stand');
          }
        },
        enabled: validActions.includes('stand') && !isAnimating,
        scope: 'action-bar',
      },
    ],
    'action-bar'
  );

  // Show all actions; disable the ones not currently valid so the player understands what exists
  const visibleActions = ACTION_CONFIG;

  // Primary = hit + stand (full row each). Secondary = rest (3-col row below).
  const primaryActions = visibleActions.filter((a) => a.action === 'hit' || a.action === 'stand');
  const secondaryActions = visibleActions.filter((a) => a.action !== 'hit' && a.action !== 'stand');

  const variants = conditionalVariants(
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    prefersReducedMotion
  );

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-2 sm:gap-2.5 w-full"
      style={{ position: 'relative', zIndex: 10 }}
      role="toolbar"
      aria-label="Player actions"
    >
      {/* Primary row: HIT + STAND */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {primaryActions.map(({ action, label, variant, shortcut }) => (
          <ActionButton
            key={action}
            action={action}
            label={label}
            variant={variant}
            disabled={!validActions.includes(action) || isAnimating}
            shortcut={shortcut}
            reason={getActionReason(action)}
            onClick={() => handleAction(action)}
          />
        ))}
      </div>

      {/* Secondary row: DOUBLE + SPLIT + INSURANCE */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {secondaryActions.map(({ action, label, variant, shortcut }) => (
          <ActionButton
            key={action}
            action={action}
            label={label}
            variant={variant}
            disabled={!validActions.includes(action) || isAnimating}
            shortcut={shortcut}
            reason={getActionReason(action)}
            onClick={() => handleAction(action)}
          />
        ))}
      </div>
    </motion.div>
  );
});

export default ActionBar;
