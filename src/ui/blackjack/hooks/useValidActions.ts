// ============================================================================
// Hook - Valid Actions Calculation
// ============================================================================

import { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getValidActions, isActionValid, canInsure, canSplitHand } from '@/lib/blackjack/rules';
import type { PlayerAction, GameState } from '@/lib/blackjack/types';

export interface ActionReason {
  action: PlayerAction;
  enabled: boolean;
  reason?: string;
}

/**
 * Hook to get valid actions with reasons for disabled actions
 */
export function useValidActions(): {
  validActions: PlayerAction[];
  actionReasons: ActionReason[];
  isActionEnabled: (action: PlayerAction) => boolean;
  getActionReason: (action: PlayerAction) => string | undefined;
} {
  const gameState = useGameStore((s) => s.gameState);
  const phase = gameState.phase;
  const playerHands = gameState.playerHands;
  const activeHandIndex = gameState.activeHandIndex;
  const bankroll = gameState.bankroll;
  const config = gameState.config;
  const splitCount = gameState.splitCount ?? 0; // Use splitCount from GameState
  const activeHand = playerHands[activeHandIndex];

  const validActions = useMemo(() => {
    if (phase !== 'PLAYER_TURN') return [];
    if (!activeHand) return [];
    
    // Use the existing getValidActions function from rules
    return getValidActions(gameState);
  }, [gameState, phase, activeHand]);

  const actionReasons = useMemo((): ActionReason[] => {
    const allActions: PlayerAction[] = ['hit', 'stand', 'double', 'split', 'surrender', 'insurance'];
    
    return allActions.map((action) => {
      const enabled = validActions.includes(action);
      let reason: string | undefined;

      if (!enabled && phase === 'PLAYER_TURN' && activeHand) {
        // Provide reasons for disabled actions
        if (action === 'hit') {
          if (activeHand.isStood) reason = 'Cannot hit: already stood';
          else if (activeHand.isBusted) reason = 'Cannot hit: hand is busted';
          else if (activeHand.isBlackjack) reason = 'Cannot hit: blackjack';
        } else if (action === 'stand') {
          if (activeHand.isStood) reason = 'Cannot stand: already stood';
          else if (activeHand.isBusted) reason = 'Cannot stand: hand is busted';
        } else if (action === 'double') {
          if (activeHand.isSplitAces) reason = 'Cannot double: double not allowed after splitting aces';
          else if (activeHand.cards.length !== 2) reason = 'Can only double on first two cards';
          else if (bankroll < activeHand.bet) reason = 'Insufficient bankroll for double';
          else if (activeHand.isDoubled) reason = 'Already doubled';
          else if (activeHand.isSplit && !config.allowDoubleAfterSplit) reason = 'Double after split not allowed';
          else if (!config.allowDouble) reason = 'Double not allowed';
        } else if (action === 'split') {
          if (activeHand.cards.length !== 2) reason = 'Can only split with two cards';
          else if (bankroll < activeHand.bet) reason = 'Insufficient bankroll for split';
          else if (splitCount >= config.maxSplits) reason = `Maximum splits reached (${config.maxSplits} splits allowed)`;
          else if (activeHand.isSplitAces && !config.resplitAces) reason = 'Cannot resplit aces';
          else if (!canSplitHand(activeHand, splitCount, bankroll, config)) reason = 'Cards must be same rank to split';
          else if (!config.allowSplit) reason = 'Split not allowed';
        } else if (action === 'surrender') {
          if (activeHand.cards.length !== 2) reason = 'Can only surrender on first two cards';
          else if (activeHand.isSplit) reason = 'Cannot surrender split hands';
          else if (!config.allowSurrender) reason = 'Surrender not allowed';
        } else if (action === 'insurance') {
          if (!canInsure(gameState)) {
            const dealerUpCard = gameState.dealerHand.cards.find((c) => c.faceUp);
            if (!dealerUpCard || dealerUpCard.rank !== 'A') {
              reason = 'Insurance only available when dealer shows Ace';
            } else if (gameState.insuranceBet > 0) {
              reason = 'Insurance already taken';
            }
          }
        }
      } else if (phase !== 'PLAYER_TURN') {
        reason = 'Not your turn';
      } else if (!activeHand) {
        reason = 'No active hand';
      }

      return { action, enabled, reason };
    });
  }, [validActions, phase, activeHand, bankroll, config, splitCount, gameState]);

  const isActionEnabled = useMemo(
    () => (action: PlayerAction) => validActions.includes(action),
    [validActions]
  );

  const getActionReason = useMemo(
    () => (action: PlayerAction) => {
      const reason = actionReasons.find((r) => r.action === action);
      return reason?.reason;
    },
    [actionReasons]
  );

  return {
    validActions,
    actionReasons,
    isActionEnabled,
    getActionReason,
  };
}
