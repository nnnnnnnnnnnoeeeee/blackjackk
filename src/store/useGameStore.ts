// ============================================================================
// Blackjack Game Store - Zustand with persistence
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  GameState, 
  GameStats, 
  GameConfig,
  GamePhase,
  PlayerAction,
  HandHistory,
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
  dealerDrawCard,
  revealDealerCard,
} from '@/lib/blackjack/game';
import { createShuffledShoe } from '@/lib/blackjack/deck';
import { getValidActions, shouldDealerHit } from '@/lib/blackjack/rules';
import { calculateRunningCount, calculateTrueCount } from '@/lib/blackjack/cardcounting';
import { isBusted } from '@/lib/blackjack/hand';

interface GameStore {
  // State
  gameState: GameState;
  stats: GameStats;
  isAnimating: boolean;
  cardCountingEnabled: boolean;
  tutorialCompleted: boolean;
  tutorialStep: number;
  
  // Actions
  placeBet: (amount: number) => void;
  placeSideBets: (perfectPairs?: number, twentyOnePlus3?: number) => void;
  action: (action: PlayerAction) => void;
  finishRound: () => Promise<void>;
  newRound: () => void;
  resetGame: () => void;
  updateConfig: (config: Partial<GameConfig>) => void;
  toggleCardCounting: () => void;
  setTutorialStep: (step: number) => void;
  completeTutorial: () => void;
  addHandToHistory: (history: HandHistory) => void;
  
  // Selectors (computed)
  getValidActions: () => PlayerAction[];
  canBet: () => boolean;
  getCardCount: () => { runningCount: number; trueCount: number } | null;
}

// Debounced localStorage write
let saveTimeout: NodeJS.Timeout | null = null;
const debouncedSave = (fn: () => void) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(fn, 500);
};

// Validate and sanitize restored state
interface PartialGameStore {
  gameState?: Partial<GameState>;
  stats?: Partial<GameStats>;
  isAnimating?: boolean;
}

const validateState = (state: unknown): GameStore => {
  // Ensure state exists and has required properties
  if (!state || typeof state !== 'object') {
    return {
      gameState: createInitialState(1000),
      stats: INITIAL_STATS,
      isAnimating: false,
      cardCountingEnabled: false,
    };
  }
  
  const partialState = state as PartialGameStore;
  
  // If gameState is missing or invalid, create fresh state
  if (!partialState.gameState || typeof partialState.gameState !== 'object') {
    return {
      gameState: createInitialState(1000),
      stats: INITIAL_STATS,
      isAnimating: false,
      cardCountingEnabled: false,
    };
  }
  
  const gameState = partialState.gameState;
  
  // Ensure playerHands is always an array
  if (!Array.isArray(gameState.playerHands)) {
    gameState.playerHands = [];
  }
  
  // Ensure activeHandIndex is valid
  if (typeof gameState.activeHandIndex !== 'number' || 
      gameState.activeHandIndex < 0 || 
      gameState.activeHandIndex >= gameState.playerHands.length) {
    gameState.activeHandIndex = 0;
  }
  
  // Ensure dealerHand exists and is valid
  if (!gameState.dealerHand || typeof gameState.dealerHand !== 'object') {
    gameState.dealerHand = {
      cards: [],
      bet: 0,
      isDoubled: false,
      isSplit: false,
      isStood: false,
      isBusted: false,
      isBlackjack: false,
    };
  }
  
  // Ensure config exists and is valid
  if (!gameState.config || typeof gameState.config !== 'object') {
    gameState.config = DEFAULT_CONFIG;
  } else {
    // Merge with defaults to ensure all required properties exist, especially side bet configs
    gameState.config = { 
      ...DEFAULT_CONFIG, 
      ...gameState.config,
      perfectPairs: gameState.config.perfectPairs || DEFAULT_CONFIG.perfectPairs,
      twentyOnePlus3: gameState.config.twentyOnePlus3 || DEFAULT_CONFIG.twentyOnePlus3,
    };
  }
  
  // Ensure bankroll is valid (never negative)
  if (typeof gameState.bankroll !== 'number' || gameState.bankroll < 0) {
    gameState.bankroll = 1000;
  }
  
  // Ensure phase is valid
  const validPhases: GamePhase[] = ['BETTING', 'DEALING', 'PLAYER_TURN', 'DEALER_TURN', 'SETTLEMENT'];
  if (!gameState.phase || !validPhases.includes(gameState.phase)) {
    gameState.phase = 'BETTING';
  }
  
  // Ensure shoe is an array and has enough cards (at least 4 for initial deal)
  if (!Array.isArray(gameState.shoe) || gameState.shoe.length < 4) {
    gameState.shoe = createShuffledShoe(gameState.config?.deckCount || DEFAULT_CONFIG.deckCount);
  }
  
  // Ensure results is an array
  if (!Array.isArray(gameState.results)) {
    gameState.results = [];
  }
  
  // Ensure currentBet and insuranceBet are numbers
  if (typeof gameState.currentBet !== 'number') {
    gameState.currentBet = 0;
  }
  if (typeof gameState.insuranceBet !== 'number') {
    gameState.insuranceBet = 0;
  }
  
  return {
    gameState: gameState as GameState,
    stats: partialState.stats && typeof partialState.stats === 'object' 
      ? { ...INITIAL_STATS, ...partialState.stats } 
      : INITIAL_STATS,
    isAnimating: typeof partialState.isAnimating === 'boolean' ? partialState.isAnimating : false,
    tutorialCompleted: typeof partialState.tutorialCompleted === 'boolean' ? partialState.tutorialCompleted : false,
    tutorialStep: typeof partialState.tutorialStep === 'number' ? partialState.tutorialStep : 0,
    cardCountingEnabled: typeof partialState.cardCountingEnabled === 'boolean' ? partialState.cardCountingEnabled : false,
  };
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      gameState: createInitialState(1000),
      stats: INITIAL_STATS,
      isAnimating: false,
      cardCountingEnabled: false,
      tutorialCompleted: false,
      tutorialStep: 0,
      
      // Place side bets
      placeSideBets: (perfectPairs?: number, twentyOnePlus3?: number) => {
        const { gameState } = get();
        if (gameState.phase !== 'BETTING') {
          throw new Error('Cannot place side bets outside of BETTING phase');
        }
        
        let totalSideBet = 0;
        const sideBets: { perfectPairs?: number; twentyOnePlus3?: number } = {};
        
        if (perfectPairs !== undefined && perfectPairs > 0) {
          if (!gameState.config.perfectPairs.enabled) {
            throw new Error('Perfect Pairs is not enabled');
          }
          if (perfectPairs < gameState.config.perfectPairs.minBet || perfectPairs > gameState.config.perfectPairs.maxBet) {
            throw new Error(`Perfect Pairs bet must be between $${gameState.config.perfectPairs.minBet} and $${gameState.config.perfectPairs.maxBet}`);
          }
          if (perfectPairs > gameState.bankroll) {
            throw new Error('Insufficient bankroll for Perfect Pairs bet');
          }
          sideBets.perfectPairs = perfectPairs;
          totalSideBet += perfectPairs;
        }
        
        if (twentyOnePlus3 !== undefined && twentyOnePlus3 > 0) {
          if (!gameState.config.twentyOnePlus3.enabled) {
            throw new Error('21+3 is not enabled');
          }
          if (twentyOnePlus3 < gameState.config.twentyOnePlus3.minBet || twentyOnePlus3 > gameState.config.twentyOnePlus3.maxBet) {
            throw new Error(`21+3 bet must be between $${gameState.config.twentyOnePlus3.minBet} and $${gameState.config.twentyOnePlus3.maxBet}`);
          }
          if (twentyOnePlus3 > gameState.bankroll - totalSideBet) {
            throw new Error('Insufficient bankroll for 21+3 bet');
          }
          sideBets.twentyOnePlus3 = twentyOnePlus3;
          totalSideBet += twentyOnePlus3;
        }
        
        if (totalSideBet > gameState.bankroll) {
          throw new Error('Insufficient bankroll for side bets');
        }
        
        set({
          gameState: {
            ...gameState,
            bankroll: gameState.bankroll - totalSideBet,
            sideBets,
          },
        });
      },
      
      // Place a bet and deal cards
      placeBet: (amount: number) => {
        const { gameState } = get();
        console.log('[placeBet] Called with:', { amount, phase: gameState.phase, bankroll: gameState.bankroll, shoeLength: gameState.shoe?.length, isAnimating: get().isAnimating });
        
        if (gameState.phase !== 'BETTING') {
          console.warn('[placeBet] Wrong phase:', gameState.phase);
          return;
        }
        
        // Always reset isAnimating before starting a new round
        set({ isAnimating: false });
        
        try {
          // Ensure shoe has enough cards before dealing (at least 4 for initial deal)
          let currentState = { ...gameState };
          if (!currentState.shoe || !Array.isArray(currentState.shoe) || currentState.shoe.length < 4) {
            console.log('[placeBet] Reshuffling shoe');
            // Reshuffle if needed
            currentState = {
              ...currentState,
              shoe: createShuffledShoe(currentState.config.deckCount),
            };
          }
          
          console.log('[placeBet] Starting round with shoe length:', currentState.shoe.length);
          const newState = startRound(currentState, amount);
          console.log('[placeBet] Round started, new phase:', newState.phase);
          set({ gameState: newState, isAnimating: false });
          
          // If player has blackjack, automatically finish round after delay
          if (newState.phase === 'DEALER_TURN') {
            setTimeout(() => {
              get().finishRound();
            }, 1000);
          }
        } catch (error) {
          console.error('[placeBet] Error:', error);
          // Always reset isAnimating on error
          set({ isAnimating: false });
          // Re-throw to let UI components handle the error display
          throw error;
        }
      },
      
      // Execute a player action
      action: (action: PlayerAction) => {
        const { gameState } = get();
        console.log('[action] Called with:', { action, phase: gameState.phase, isAnimating: get().isAnimating });
        
        if (gameState.phase !== 'PLAYER_TURN') {
          console.warn('[action] Wrong phase:', gameState.phase);
          return;
        }
        
        if (get().isAnimating) {
          console.warn('[action] Currently animating, ignoring action');
          return;
        }
        
        try {
          const newState = executeAction(gameState, action);
          console.log('[action] Action executed, new phase:', newState.phase, 'activeHandIndex:', newState.activeHandIndex, 'hands:', newState.playerHands.length);
          
          // Validate state after action
          if (!Array.isArray(newState.playerHands) || newState.playerHands.length === 0) {
            console.error('[action] Invalid state: playerHands is empty after action');
            // Don't update state, just return
            return;
          }
          
          // Validate and fix activeHandIndex
          if (newState.activeHandIndex < 0 || newState.activeHandIndex >= newState.playerHands.length) {
            console.warn('[action] Invalid activeHandIndex, fixing:', { 
              activeHandIndex: newState.activeHandIndex, 
              handsLength: newState.playerHands.length 
            });
            
            // Find a valid active hand
            const validIndex = newState.playerHands.findIndex(h => 
              !h.isStood && !h.isBusted && !h.isBlackjack
            );
            
            if (validIndex !== -1) {
              newState.activeHandIndex = validIndex;
            } else {
              // All hands finished, move to dealer turn
              newState.activeHandIndex = 0;
              newState.phase = 'DEALER_TURN';
            }
          }
          
          // Ensure phase is valid
          if (!['BETTING', 'DEALING', 'INSURANCE', 'PLAYER_TURN', 'DEALER_TURN', 'SETTLEMENT'].includes(newState.phase)) {
            console.warn('[action] Invalid phase, resetting to PLAYER_TURN:', newState.phase);
            newState.phase = 'PLAYER_TURN';
          }
          
          set({ gameState: newState });
          
          // If moved to dealer turn, finish round
          if (newState.phase === 'DEALER_TURN') {
            console.log('[action] Phase is DEALER_TURN, calling finishRound');
            // Call finishRound immediately after state update
            // Use setTimeout to ensure state is updated before calling finishRound
            setTimeout(() => {
              const currentState = get();
              console.log('[action] Checking state before finishRound:', { phase: currentState.gameState.phase, isAnimating: currentState.isAnimating });
              if (currentState.gameState.phase === 'DEALER_TURN') {
                console.log('[action] Calling finishRound');
                currentState.finishRound().catch(err => {
                  console.error('[action] Error in finishRound:', err);
                  // Force phase to SETTLEMENT on error
                  set({
                    gameState: {
                      ...currentState.gameState,
                      phase: 'SETTLEMENT',
                    },
                    isAnimating: false,
                  });
                });
              } else {
                console.warn('[action] Phase changed before finishRound could be called:', currentState.gameState.phase);
              }
            }, 50);
          }
        } catch (error) {
          console.error('[action] Error executing action:', error);
          // Reset isAnimating to prevent UI freeze
          set({ isAnimating: false });
          // Re-throw to show error in UI (will be caught by Controls.tsx)
          throw error;
        }
      },
      
      // Finish round (dealer plays, settle)
      finishRound: async () => {
        const { gameState, stats } = get();
        console.log('[finishRound] Called, current phase:', gameState.phase);
        if (gameState.phase !== 'DEALER_TURN') {
          console.warn('[finishRound] Not in DEALER_TURN phase, current phase:', gameState.phase);
          // Ensure isAnimating is false if we're not in dealer turn
          set({ isAnimating: false });
          return;
        }
        
        set({ isAnimating: true });
        
        try {
          // Reveal dealer hole card immediately
          let currentState = revealDealerCard(gameState);
          set({ gameState: currentState });
          
          // Delay for card flip animation (0.35s + buffer)
          await new Promise(r => setTimeout(r, 500));
          
          // Check if all player hands busted - no need to draw
          const allBusted = currentState.playerHands.every(h => h.isBusted);
          
          if (!allBusted) {
            // Dealer draws cards one by one with delays for animation
            while (shouldDealerHit(currentState.dealerHand.cards, currentState.config.dealerHitsSoft17)) {
              currentState = dealerDrawCard({
                ...currentState,
                phase: 'DEALER_TURN', // Ensure phase is correct
              });
              set({ gameState: currentState });
              // Delay for card dealing animation (0.35s + buffer)
              await new Promise(r => setTimeout(r, 500));
            }
          }
          
          // Final delay to ensure all animations complete
          await new Promise(r => setTimeout(r, 300));
          
          // Finalize dealer turn state
          const afterDealer: GameState = {
            ...currentState,
            phase: 'SETTLEMENT',
            dealerHand: {
              ...currentState.dealerHand,
              isBusted: isBusted(currentState.dealerHand.cards),
            },
          };
          
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
          
          // Add to hand history
          const handHistory: HandHistory = {
            id: `hand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            playerCards: finalState.playerHands.map(h => [...h.cards]),
            dealerCards: [...finalState.dealerHand.cards],
            bets: finalState.playerHands.map(h => h.bet),
            actions: [], // Will be tracked during play
            results: finalState.results,
            totalPayout: finalState.results.reduce((sum, r) => sum + r.payout, 0),
            netResult: finalState.results.reduce((sum, r) => {
              const hand = finalState.playerHands[r.handIndex];
              return sum + (r.payout - (hand?.bet || 0));
            }, 0),
          };
          
          // Add to hand history (only if function exists)
          const store = get();
          if (store.addHandToHistory) {
            store.addHandToHistory(handHistory);
          } else {
            // Fallback: add directly to gameState
            const currentState = get();
            const updatedHistory = [...(currentState.gameState.handHistory || []), handHistory];
            // Keep only last 50 hands
            const trimmedHistory = updatedHistory.slice(-50);
            set({
              gameState: {
                ...currentState.gameState,
                handHistory: trimmedHistory,
              },
            });
          }
          
          // Ensure phase is SETTLEMENT before setting state
          const settlementState = {
            ...finalState,
            phase: 'SETTLEMENT' as const,
          };
          
          console.log('[finishRound] Setting final state:', { phase: settlementState.phase, isAnimating: false, resultsCount: settlementState.results.length });
          
          set({ 
            gameState: settlementState, 
            stats: newStats,
            isAnimating: false,
          });
          
          // Double-check that state was set correctly
          const verifyState = get();
          console.log('[finishRound] State after set:', { phase: verifyState.gameState.phase, isAnimating: verifyState.isAnimating });
          
          // Ensure phase is SETTLEMENT and isAnimating is false
          if (verifyState.gameState.phase !== 'SETTLEMENT') {
            console.error('[finishRound] ERROR: Phase is not SETTLEMENT after finishRound! Current phase:', verifyState.gameState.phase);
            // Force set to SETTLEMENT
            set({
              gameState: {
                ...verifyState.gameState,
                phase: 'SETTLEMENT',
              },
              isAnimating: false,
            });
          }
          
          // After a short delay showing results, automatically start a new round if bankroll > 0
          setTimeout(() => {
            const currentState = get();
            // Only auto-start if still in SETTLEMENT and not bankrupt
            if (currentState.gameState.phase === 'SETTLEMENT' && currentState.gameState.bankroll > 0) {
              console.log('[finishRound] Auto-starting new round after settlement');
              // Don't auto-start, let user click "New Hand" button
              // This gives them time to see the results
            }
          }, 3000);
        } catch (error) {
          console.error('Error finishing round:', error);
          // Always reset isAnimating on error and force SETTLEMENT phase
          const currentState = get();
          set({
            gameState: {
              ...currentState.gameState,
              phase: 'SETTLEMENT',
            },
            isAnimating: false, // CRITICAL: Always reset animation flag even on error
          });
        }
      },
      
      // Start a new round
      newRound: () => {
        console.log('[useGameStore] newRound called');
        const { gameState, isAnimating } = get();
        console.log('[useGameStore] Current state before reset:', { phase: gameState.phase, bankroll: gameState.bankroll, isAnimating });
        
        // Always force isAnimating to false first
        set({ isAnimating: false });
        
        if (gameState.phase !== 'SETTLEMENT') {
          console.warn('[useGameStore] newRound called but phase is not SETTLEMENT:', gameState.phase);
          // Still allow reset if we're stuck in a weird state
          if (gameState.phase === 'DEALER_TURN' || gameState.phase === 'PLAYER_TURN') {
            console.warn('[useGameStore] Force resetting from phase:', gameState.phase);
          } else {
            return;
          }
        }
        
        try {
          const newState = resetForNewRound(gameState);
          console.log('[useGameStore] New state after reset:', { phase: newState.phase, bankroll: newState.bankroll });
          set({ gameState: newState, isAnimating: false });
          console.log('[useGameStore] State updated successfully');
        } catch (error) {
          console.error('[useGameStore] Error in newRound:', error);
          set({ isAnimating: false });
          throw error;
        }
      },
      
      // Reset entire game
      resetGame: () => {
        set({
          gameState: createInitialState(1000),
          stats: INITIAL_STATS,
          isAnimating: false,
          cardCountingEnabled: false,
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
      
      // Toggle card counting trainer
      toggleCardCounting: () => {
        set({ cardCountingEnabled: !get().cardCountingEnabled });
      },
      
      // Tutorial management
      setTutorialStep: (step: number) => {
        console.log('[useGameStore] setTutorialStep called', { step });
        set({ tutorialStep: step });
      },
      
      completeTutorial: () => {
        console.log('[useGameStore] completeTutorial called');
        set({ tutorialCompleted: true, tutorialStep: 0 });
      },
      
      addHandToHistory: (history: HandHistory) => {
        const { gameState } = get();
        const updatedHistory = [...(gameState.handHistory || []), history];
        // Keep only last 50 hands
        const trimmedHistory = updatedHistory.slice(-50);
        set({
          gameState: {
            ...gameState,
            handHistory: trimmedHistory,
          },
        });
      },
      
      // Get current card count
      getCardCount: () => {
        const { gameState, cardCountingEnabled } = get();
        if (!cardCountingEnabled) return null;
        
        // Calculate running count from all face-up cards seen
        const allCards: import('./types').Card[] = [
          ...gameState.dealerHand.cards.filter(c => c.faceUp),
          ...gameState.playerHands.flatMap(h => h.cards.filter(c => c.faceUp)),
        ];
        
        const runningCount = calculateRunningCount(allCards);
        const cardsRemaining = gameState.shoe.length;
        const trueCount = calculateTrueCount(runningCount, cardsRemaining, gameState.config.deckCount);
        
        return { runningCount, trueCount };
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
          sideBets: {},
          sideBetResults: undefined,
          results: [],
        },
        stats: state.stats,
        cardCountingEnabled: state.cardCountingEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const validated = validateState(state);
          // Update state with validated values
          Object.assign(state, validated);
        }
      },
    }
  )
);

// Selectors for performance (memoized by Zustand)
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