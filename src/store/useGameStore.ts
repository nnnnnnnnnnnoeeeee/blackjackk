// ============================================================================
// Blackjack Game Store - Zustand with persistence
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  GameState, 
  GameStats, 
  GameConfig,
  PlayerAction,
  DEFAULT_CONFIG,
  INITIAL_STATS,
} from '@/lib/blackjack/types';
import {
  createInitialState,
  resetForNewRound,
  startRound,
  executeAction,
  playDealerTurn,
  settleHands,
} from '@/lib/blackjack/game';
import { getValidActions } from '@/lib/blackjack/rules';

interface GameStore {
  // State
  gameState: GameState;
  stats: GameStats;
  isAnimating: boolean;
  
  // Actions
  placeBet: (amount: number) => void;
  action: (action: PlayerAction) => void;
  finishRound: () => Promise<void>;
  newRound: () => void;
  resetGame: () => void;
  updateConfig: (config: Partial<GameConfig>) => void;
  
  // Selectors (computed)
  getValidActions: () => PlayerAction[];
  canBet: () => boolean;
}

// Debounced localStorage write
let saveTimeout: NodeJS.Timeout | null = null;
const debouncedSave = (fn: () => void) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(fn, 500);
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      gameState: createInitialState(1000),
      stats: INITIAL_STATS,
      isAnimating: false,
      
      // Place a bet and deal cards
      placeBet: (amount: number) => {
        const { gameState } = get();
        if (gameState.phase !== 'BETTING') return;
        
        try {
          const newState = startRound(gameState, amount);
          set({ gameState: newState });
          
          // If player has blackjack, automatically finish round after delay
          if (newState.phase === 'DEALER_TURN') {
            get().finishRound();
          }
        } catch (error) {
          console.error('Error placing bet:', error);
        }
      },
      
      // Execute a player action
      action: (action: PlayerAction) => {
        const { gameState } = get();
        if (gameState.phase !== 'PLAYER_TURN') return;
        
        try {
          const newState = executeAction(gameState, action);
          set({ gameState: newState });
          
          // If moved to dealer turn, finish round
          if (newState.phase === 'DEALER_TURN') {
            get().finishRound();
          }
        } catch (error) {
          console.error('Error executing action:', error);
        }
      },
      
      // Finish round (dealer plays, settle)
      finishRound: async () => {
        const { gameState, stats } = get();
        if (gameState.phase !== 'DEALER_TURN') return;
        
        set({ isAnimating: true });
        
        // Small delay for animation
        await new Promise(r => setTimeout(r, 500));
        
        try {
          // Play dealer turn
          const afterDealer = playDealerTurn(gameState);
          
          // Settle hands
          const finalState = settleHands(afterDealer);
          
          // Update stats
          const newStats = { ...stats };
          newStats.handsPlayed += finalState.playerHands.length;
          
          for (const result of finalState.results) {
            const hand = finalState.playerHands[result.handIndex];
            const wagered = hand?.bet || 0;
            const netResult = result.payout - wagered;
            
            newStats.totalWagered += wagered;
            newStats.totalWon += result.payout;
            
            switch (result.result) {
              case 'win':
                newStats.handsWon++;
                if (netResult > newStats.biggestWin) newStats.biggestWin = netResult;
                break;
              case 'blackjack':
                newStats.handsWon++;
                newStats.blackjacks++;
                if (netResult > newStats.biggestWin) newStats.biggestWin = netResult;
                break;
              case 'lose':
                newStats.handsLost++;
                if (hand?.isBusted) newStats.busts++;
                if (wagered > newStats.biggestLoss) newStats.biggestLoss = wagered;
                break;
              case 'push':
                newStats.handsPushed++;
                break;
              case 'surrender':
                newStats.handsLost++;
                break;
            }
          }
          
          set({ 
            gameState: finalState, 
            stats: newStats,
            isAnimating: false,
          });
        } catch (error) {
          console.error('Error finishing round:', error);
          set({ isAnimating: false });
        }
      },
      
      // Start a new round
      newRound: () => {
        const { gameState } = get();
        if (gameState.phase !== 'SETTLEMENT') return;
        
        const newState = resetForNewRound(gameState);
        set({ gameState: newState });
      },
      
      // Reset entire game
      resetGame: () => {
        set({
          gameState: createInitialState(1000),
          stats: INITIAL_STATS,
          isAnimating: false,
        });
      },
      
      // Update game configuration
      updateConfig: (config: Partial<GameConfig>) => {
        const { gameState } = get();
        const newConfig = { ...gameState.config, ...config };
        set({
          gameState: {
            ...gameState,
            config: newConfig,
          },
        });
      },
      
      // Get valid actions for current state
      getValidActions: () => {
        const { gameState } = get();
        return getValidActions(gameState);
      },
      
      // Can place a bet
      canBet: () => {
        const { gameState } = get();
        return gameState.phase === 'BETTING' && gameState.bankroll >= gameState.config.minBet;
      },
    }),
    {
      name: 'blackjack-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        gameState: {
          ...state.gameState,
          // Don't persist transient state
          phase: 'BETTING' as const,
          dealerHand: { cards: [], bet: 0, isDoubled: false, isSplit: false, isStood: false, isBusted: false, isBlackjack: false },
          playerHands: [],
          activeHandIndex: 0,
          currentBet: 0,
          insuranceBet: 0,
          results: [],
        },
        stats: state.stats,
      }),
    }
  )
);

// Selectors for performance
export const selectPhase = (state: GameStore) => state.gameState.phase;
export const selectBankroll = (state: GameStore) => state.gameState.bankroll;
export const selectCurrentBet = (state: GameStore) => state.gameState.currentBet;
export const selectDealerHand = (state: GameStore) => state.gameState.dealerHand;
export const selectPlayerHands = (state: GameStore) => state.gameState.playerHands;
export const selectActiveHandIndex = (state: GameStore) => state.gameState.activeHandIndex;
export const selectResults = (state: GameStore) => state.gameState.results;
export const selectConfig = (state: GameStore) => state.gameState.config;
export const selectStats = (state: GameStore) => state.stats;
export const selectIsAnimating = (state: GameStore) => state.isAnimating;
