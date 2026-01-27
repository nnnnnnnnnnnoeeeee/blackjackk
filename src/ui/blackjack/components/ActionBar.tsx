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

export const ActionBar = memo(function ActionBar() {
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
    { action: 'hit', label: 'Hit', variant: 'secondary', shortcut: keyBindings.hit },
    { action: 'stand', label: 'Stand', variant: 'primary', shortcut: keyBindings.stand },
    { action: 'double', label: 'Double', variant: 'secondary', shortcut: keyBindings.double },
    { action: 'split', label: 'Split', variant: 'secondary', shortcut: keyBindings.split },
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

      try {
        executeAction(action);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error executing action';
        toast.error('Error', {
          description: message,
        });
      }
    },
    [executeAction, isAnimating, validActions, getActionReason]
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

  // Only show valid actions (memoized)
  const visibleActions = useMemo(
    () => ACTION_CONFIG.filter(({ action }) => validActions.includes(action)),
    [validActions]
  );

  // Responsive grid layout (memoized)
  const gridClasses = useMemo(() => {
    if (visibleActions.length === 1) return 'grid grid-cols-1';
    if (visibleActions.length === 2) return 'grid grid-cols-2 gap-2 sm:gap-3';
    if (visibleActions.length === 3) return 'grid grid-cols-3 gap-1.5 sm:gap-2';
    if (visibleActions.length === 4) return 'grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5';
    return 'flex flex-wrap justify-center gap-2 sm:gap-2.5';
  }, [visibleActions.length]);

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
      className={gridClasses}
      style={{ position: 'relative', zIndex: 10 }}
      role="toolbar"
      aria-label="Player actions"
    >
      {visibleActions.map(({ action, label, variant, shortcut }) => {
        const isDisabled = isAnimating;
        const reason = getActionReason(action);

        return (
          <ActionButton
            key={action}
            action={action}
            label={label}
            variant={variant}
            disabled={isDisabled}
            shortcut={shortcut}
            reason={reason}
            onClick={() => handleAction(action)}
          />
        );
      })}
    </motion.div>
  );
});

export default ActionBar;
