// ============================================================================
// Hook - Bet Validation
// ============================================================================

import { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import type { GameConfig } from '@/lib/blackjack/types';

export interface BetValidationResult {
  isValid: boolean;
  error?: string;
  minBet: number;
  maxBet: number;
  canAfford: boolean;
}

/**
 * Hook to validate bet amounts
 */
export function useBetValidation() {
  const bankroll = useGameStore((s) => s.gameState.bankroll);
  const config = useGameStore((s) => s.gameState.config);

  const validateBet = useMemo(
    () => (amount: number): BetValidationResult => {
      const minBet = config.minBet;
      const maxBet = Math.min(config.maxBet, bankroll);
      const canAfford = amount <= bankroll;

      if (amount < minBet) {
        return {
          isValid: false,
          error: `Minimum bet is $${minBet}`,
          minBet,
          maxBet,
          canAfford,
        };
      }

      if (amount > config.maxBet) {
        return {
          isValid: false,
          error: `Maximum bet is $${config.maxBet}`,
          minBet,
          maxBet,
          canAfford,
        };
      }

      if (!canAfford) {
        return {
          isValid: false,
          error: `Insufficient bankroll. You have $${bankroll.toLocaleString()}`,
          minBet,
          maxBet,
          canAfford,
        };
      }

      return {
        isValid: true,
        minBet,
        maxBet,
        canAfford,
      };
    },
    [bankroll, config]
  );

  const validateSideBet = useMemo(
    () => (
      amount: number,
      sideBetConfig: { minBet: number; maxBet: number; enabled: boolean },
      totalBets: number
    ): BetValidationResult => {
      if (!sideBetConfig.enabled) {
        return {
          isValid: false,
          error: 'Side bet is not enabled',
          minBet: sideBetConfig.minBet,
          maxBet: sideBetConfig.maxBet,
          canAfford: false,
        };
      }

      const canAfford = totalBets <= bankroll;

      if (amount < sideBetConfig.minBet) {
        return {
          isValid: false,
          error: `Minimum side bet is $${sideBetConfig.minBet}`,
          minBet: sideBetConfig.minBet,
          maxBet: sideBetConfig.maxBet,
          canAfford,
        };
      }

      if (amount > sideBetConfig.maxBet) {
        return {
          isValid: false,
          error: `Maximum side bet is $${sideBetConfig.maxBet}`,
          minBet: sideBetConfig.minBet,
          maxBet: sideBetConfig.maxBet,
          canAfford,
        };
      }

      if (!canAfford) {
        return {
          isValid: false,
          error: `Total bets exceed bankroll. You have $${bankroll.toLocaleString()}`,
          minBet: sideBetConfig.minBet,
          maxBet: sideBetConfig.maxBet,
          canAfford,
        };
      }

      return {
        isValid: true,
        minBet: sideBetConfig.minBet,
        maxBet: sideBetConfig.maxBet,
        canAfford,
      };
    },
    [bankroll]
  );

  return {
    validateBet,
    validateSideBet,
    minBet: config.minBet,
    maxBet: config.maxBet,
    bankroll,
  };
}
