// ============================================================================
// Game Controls - Hit, Stand, Double, Split buttons
// ============================================================================

import { memo, useCallback, useEffect, useMemo, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectIsAnimating } from '@/store/useGameStore';
import { PlayerAction } from '@/lib/blackjack/types';
import { canInsure } from '@/lib/blackjack/rules';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[ActionButton] Clicked', { action, label, disabled });
    if (!disabled) {
      console.log('[ActionButton] Calling onClick handler');
      onClick();
    } else {
      console.warn('[ActionButton] Button is disabled, ignoring click');
    }
  }, [action, label, disabled, onClick]);

  return (
    <motion.div
      whileHover={disabled ? {} : { 
        scale: 1.05, 
        y: -2,
        transition: { duration: 0.2 }
      }}
      whileTap={disabled ? {} : { 
        scale: 0.95, 
        y: 0,
        transition: { duration: 0.1 }
      }}
      style={{ position: 'relative', zIndex: 10 }}
    >
      <button
        onClick={handleClick}
        disabled={disabled}
        type="button"
        className={cn(
          'px-4 sm:px-6 py-3 rounded-lg font-semibold uppercase tracking-wider',
          'transition-all duration-200 text-sm sm:text-base',
          'relative z-10',
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
        aria-label={`${label}${disabled ? ' (non disponible)' : ''}`}
        title={disabled ? 'Action non disponible' : label}
      >
        {label}
      </button>
    </motion.div>
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
  { action: 'insurance', label: 'Insurance', variant: 'secondary', shortcut: 'I' },
];

export const Controls = memo(function Controls() {
  const executeAction = useGameStore(s => s.action);
  const isAnimating = useGameStore(selectIsAnimating);
  
  // Get only the values we need to determine valid actions
  const gameState = useGameStore(s => s.gameState);
  const phase = gameState.phase;
  const playerHands = gameState.playerHands;
  const activeHandIndex = gameState.activeHandIndex;
  const bankroll = gameState.bankroll;
  const config = gameState.config;
  const dealerHand = gameState.dealerHand;
  const insuranceBet = gameState.insuranceBet;
  const currentBet = gameState.currentBet;
  
  // Get active hand properties as primitives to use as stable dependencies
  const activeHand = playerHands[activeHandIndex];
  const handCardsLength = activeHand?.cards.length ?? 0;
  const handIsStood = activeHand?.isStood ?? false;
  const handIsBusted = activeHand?.isBusted ?? false;
  const handIsBlackjack = activeHand?.isBlackjack ?? false;
  const handIsSplit = activeHand?.isSplit ?? false;
  const handBet = activeHand?.bet ?? 0;
  const handCard1Rank = activeHand?.cards[0]?.rank;
  const handCard2Rank = activeHand?.cards[1]?.rank;
  
  // Memoize valid actions calculation to avoid infinite loops
  // Calculate valid actions only when relevant state changes
  const validActions = useMemo(() => {
    console.log('[Controls] Calculating validActions', { phase, activeHand: !!activeHand, handCardsLength, handIsStood, handIsBusted, handIsBlackjack });
    
    if (phase !== 'PLAYER_TURN') {
      console.log('[Controls] Not player turn, returning empty array');
      return [];
    }
    
    if (!activeHand) {
      console.log('[Controls] No active hand, returning empty array');
      return [];
    }
    
    const actions: PlayerAction[] = [];
    
    if (!handIsStood && !handIsBusted && !handIsBlackjack) {
      actions.push('hit', 'stand');
      
      if (handCardsLength === 2 && bankroll >= handBet) {
        if (config.allowDouble && (!handIsSplit || config.allowDoubleAfterSplit)) {
          actions.push('double');
        }
        if (config.allowSplit && playerHands.length - 1 < config.maxSplits) {
          const canSplit = handCard1Rank === handCard2Rank || 
            (['10', 'J', 'Q', 'K'].includes(handCard1Rank || '') && ['10', 'J', 'Q', 'K'].includes(handCard2Rank || ''));
          if (canSplit) {
            actions.push('split');
          }
        }
        if (config.allowSurrender && !handIsSplit) {
          actions.push('surrender');
        }
      }
    }
    
    // Insurance is available separately (before any action, dealer shows Ace)
    if (canInsure(gameState)) {
      actions.push('insurance');
    }
    
    console.log('[Controls] Valid actions calculated:', actions);
    return actions;
  }, [gameState, phase, handCardsLength, handIsStood, handIsBusted, handIsBlackjack, handIsSplit, handBet, handCard1Rank, handCard2Rank, activeHandIndex, bankroll, playerHands.length, config.allowDouble, config.allowDoubleAfterSplit, config.allowSplit, config.maxSplits, config.allowSurrender]);
  
  const handleAction = useCallback((action: PlayerAction) => {
    console.log('[Controls] handleAction called', { action, isAnimating, validActions });
    
    if (isAnimating) {
      console.warn('[Controls] Blocked: isAnimating is true');
      return;
    }
    
    if (!validActions.includes(action)) {
      console.warn('[Controls] Blocked: action not in validActions', { action, validActions });
      toast.error('Action non disponible', {
        description: `Vous ne pouvez pas ${action === 'hit' ? 'tirer' : action === 'stand' ? 'rester' : action === 'double' ? 'doubler' : 'séparer'} maintenant.`,
      });
      return;
    }
    
    try {
      console.log('[Controls] Executing action:', action);
      executeAction(action);
    } catch (error) {
      console.error('[Controls] Error executing action:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'action';
      toast.error('Erreur', {
        description: message,
      });
    }
  }, [executeAction, isAnimating, validActions]);
  
  // Keyboard shortcuts (H/S/D/P/I/Space/Enter/Esc) - Complete keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (isAnimating) return;
      
      const key = e.key.toUpperCase();
      
      // Action shortcuts
      const actionConfig = ACTION_CONFIG.find(a => a.shortcut === key);
      if (actionConfig && validActions.includes(actionConfig.action)) {
        e.preventDefault();
        handleAction(actionConfig.action);
        return;
      }
      
      // Additional shortcuts
      if (key === ' ' || key === 'ENTER') {
        // Space or Enter for primary action (usually Stand or Deal)
        e.preventDefault();
        if (validActions.includes('stand')) {
          handleAction('stand');
        }
      }
      
      if (key === 'ESCAPE') {
        // Esc to cancel/close (could be used for modals in future)
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [validActions, handleAction, isAnimating]);
  
  console.log('[Controls] Render', { 
    validActions, 
    isAnimating, 
    phase, 
    activeHand: !!activeHand,
    disabledStates: ACTION_CONFIG.map(a => ({ 
      action: a.action, 
      disabled: !validActions.includes(a.action) || isAnimating 
    }))
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap justify-center gap-2 sm:gap-3"
      style={{ position: 'relative', zIndex: 10 }}
    >
      {ACTION_CONFIG.map(({ action, label, variant }) => {
        const isDisabled = !validActions.includes(action) || isAnimating;
        console.log(`[Controls] Rendering ${action} button`, { isDisabled, inValidActions: validActions.includes(action), isAnimating });
        return (
          <ActionButton
            key={action}
            action={action}
            label={label}
            variant={variant}
            disabled={isDisabled}
            onClick={() => handleAction(action)}
          />
        );
      })}
    </motion.div>
  );
});

export default Controls;
