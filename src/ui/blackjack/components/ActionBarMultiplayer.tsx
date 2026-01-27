// ============================================================================
// Component - Action Bar Multiplayer (Adapted for Multiplayer)
// ============================================================================

import { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion, conditionalVariants } from '../a11y';
import { ActionButton } from './ActionButton';
import { TimerBadge } from './TimerBadge';
import { TurnIndicator } from './TurnIndicator';
import { toast } from 'sonner';
import type { PlayerAction, Hand } from '@/lib/blackjack/types';
import { getLabel } from '../i18n';

interface ActionBarMultiplayerProps {
  actions: Array<{
    action: PlayerAction;
    label: string;
    enabled: boolean;
    reason?: string;
  }>;
  onAction: (action: PlayerAction) => void;
  actionTimeLeft?: number;
  isAnimating?: boolean;
  soundEnabled?: boolean;
  soundVolume?: number;
}

const ACTION_CONFIG: Array<{
  action: PlayerAction;
  variant: 'primary' | 'secondary' | 'danger';
  shortcut: string;
}> = [
  { action: 'hit', variant: 'secondary', shortcut: 'H' },
  { action: 'stand', variant: 'primary', shortcut: 'S' },
  { action: 'double', variant: 'secondary', shortcut: 'D' },
  { action: 'split', variant: 'secondary', shortcut: 'P' },
  { action: 'insurance', variant: 'secondary', shortcut: 'I' },
];

export const ActionBarMultiplayer = memo(function ActionBarMultiplayer({
  actions,
  onAction,
  actionTimeLeft,
  isAnimating = false,
  soundEnabled = false,
  soundVolume = 0.5,
}: ActionBarMultiplayerProps) {
  const prefersReducedMotion = useReducedMotion();

  const handleAction = useCallback(
    (action: PlayerAction) => {
      if (isAnimating) {
        return;
      }

      const actionConfig = actions.find((a) => a.action === action);
      if (!actionConfig || !actionConfig.enabled) {
        const reason = actionConfig?.reason;
        toast.error(getLabel('action_unavailable'), {
          description: reason || `You cannot ${action} now.`,
        });
        return;
      }

      try {
        onAction(action);
      } catch (error) {
        const message = error instanceof Error ? error.message : `Error executing ${action}`;
        toast.error(getLabel('error_title'), {
          description: message,
        });
        console.error('[ActionBarMultiplayer] Error:', error);
      }
    },
    [actions, isAnimating, onAction]
  );

  const enabledActions = useMemo(
    () => actions.filter((a) => a.enabled),
    [actions]
  );

  const variants = conditionalVariants(
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    prefersReducedMotion
  );

  if (actions.length === 0) {
    return null;
  }

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border w-full max-w-md mx-auto"
    >
      {/* Header with timer and turn indicator */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <TurnIndicator isActive={true} label="⭐" />
          <span className="text-base font-bold text-primary animate-pulse">
            {getLabel('your_turn')}
          </span>
        </div>
        {actionTimeLeft !== undefined && actionTimeLeft > 0 && (
          <TimerBadge
            timeLeft={actionTimeLeft}
            totalTime={10}
            size={40}
            color="red"
            showText={true}
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {ACTION_CONFIG.map((config) => {
          const actionData = actions.find((a) => a.action === config.action);
          if (!actionData) return null;

          return (
            <ActionButton
              key={config.action}
              action={config.action}
              label={actionData.label}
              disabled={!actionData.enabled || isAnimating}
              onClick={() => handleAction(config.action)}
              variant={config.variant}
              shortcut={config.shortcut}
              reason={actionData.reason}
            />
          );
        })}
      </div>
    </motion.div>
  );
});
