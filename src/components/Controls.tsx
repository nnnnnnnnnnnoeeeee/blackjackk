// ============================================================================
// Game Controls - Hit, Stand, Double, Split buttons
// ============================================================================

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { PlayerAction } from '@/lib/blackjack/types';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  action: PlayerAction;
  label: string;
  disabled: boolean;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

const ActionButton = memo(function ActionButton({
  action,
  label,
  disabled,
  onClick,
  variant = 'secondary',
}: ActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 sm:px-6 py-3 rounded-lg font-semibold uppercase tracking-wider',
        'transition-all duration-200 text-sm sm:text-base',
        variant === 'primary' && 'btn-casino',
        variant === 'secondary' && 'btn-casino-secondary',
        variant === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive/50',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      aria-label={label}
    >
      {label}
    </motion.button>
  );
});

const ACTION_CONFIG: Array<{
  action: PlayerAction;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  shortcut: string;
}> = [
  { action: 'hit', label: 'Hit', variant: 'secondary', shortcut: 'H' },
  { action: 'stand', label: 'Stand', variant: 'primary', shortcut: 'S' },
  { action: 'double', label: 'Double', variant: 'secondary', shortcut: 'D' },
  { action: 'split', label: 'Split', variant: 'secondary', shortcut: 'P' },
];

export const Controls = memo(function Controls() {
  const validActions = useGameStore(s => s.getValidActions());
  const executeAction = useGameStore(s => s.action);
  const isAnimating = useGameStore(s => s.isAnimating);
  
  const handleAction = useCallback((action: PlayerAction) => {
    if (!isAnimating) {
      executeAction(action);
    }
  }, [executeAction, isAnimating]);
  
  // Keyboard shortcuts
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (isAnimating) return;
  //     const key = e.key.toUpperCase();
  //     const actionConfig = ACTION_CONFIG.find(a => a.shortcut === key);
  //     if (actionConfig && validActions.includes(actionConfig.action)) {
  //       handleAction(actionConfig.action);
  //     }
  //   };
  //   
  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [validActions, handleAction, isAnimating]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap justify-center gap-2 sm:gap-3"
    >
      {ACTION_CONFIG.map(({ action, label, variant }) => (
        <ActionButton
          key={action}
          action={action}
          label={label}
          variant={variant}
          disabled={!validActions.includes(action) || isAnimating}
          onClick={() => handleAction(action)}
        />
      ))}
    </motion.div>
  );
});

export default Controls;
