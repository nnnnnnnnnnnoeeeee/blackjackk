// ============================================================================
// Game Flow Integration Tests - Critical scenarios
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  startRound,
  executeAction,
  playDealerTurn,
  settleHands,
  resetForNewRound,
} from '@/lib/blackjack/game';
import { Card, DEFAULT_CONFIG } from '@/lib/blackjack/types';
import { createHand } from '@/lib/blackjack/hand';

// Helper to create cards
const card = (rank: string, suit: string = 'hearts', faceUp: boolean = true): Card => ({
  rank: rank as Card['rank'],
  suit: suit as Card['suit'],
  faceUp,
});

describe('Game Flow - Critical Scenarios', () => {
  describe('Betting and Dealing', () => {
    it('places bet and deals initial cards', () => {
      const state = createInitialState(1000);
      const newState = startRound(state, 100);
      
      expect(newState.phase).toBe('PLAYER_TURN');
      expect(newState.currentBet).toBe(100);
      expect(newState.bankroll).toBe(900);
      expect(newState.playerHands).toHaveLength(1);
      expect(newState.playerHands[0].cards).toHaveLength(2);
      expect(newState.dealerHand.cards).toHaveLength(2);
      expect(newState.dealerHand.cards[0].faceUp).toBe(true);
      expect(newState.dealerHand.cards[1].faceUp).toBe(false); // Hole card
    });

    it('throws error when bet is invalid', () => {
      const state = createInitialState(100);
      expect(() => startRound(state, 200)).toThrow();
    });

    it('throws error when bet is below minimum', () => {
      const state = createInitialState(1000);
      expect(() => startRound(state, 5)).toThrow();
    });
  });

  describe('Double Down', () => {
    it('doubles bet and draws one card', () => {
      const state = createInitialState(1000);
      let newState = startRound(state, 100);
      
      // Ensure we have enough bankroll
      expect(newState.bankroll).toBeGreaterThanOrEqual(100);
      
      newState = executeAction(newState, 'double');
      
      expect(newState.playerHands[0].bet).toBe(200);
      expect(newState.playerHands[0].isDoubled).toBe(true);
      expect(newState.playerHands[0].isStood).toBe(true);
      expect(newState.playerHands[0].cards).toHaveLength(3);
      expect(newState.bankroll).toBe(800); // 900 - 100 additional
      expect(newState.phase).toBe('DEALER_TURN');
    });

    it('throws error when insufficient bankroll for double', () => {
      const state = createInitialState(100);
      let newState = startRound(state, 50);
      
      // Bankroll is now 50, but we need 50 more for double
      expect(newState.bankroll).toBe(50);
      
      // This should work, but if bankroll was less it would fail
      // Let's test with insufficient funds
      const lowBankrollState = { ...newState, bankroll: 10 };
      expect(() => executeAction(lowBankrollState, 'double')).toThrow();
    });
  });

  describe('Split', () => {
    it('splits pair and creates two hands', () => {
      const state = createInitialState(1000);
      
      // Create a state with a pair
      const hand = createHand([card('8'), card('8')], 100);
      const newState = {
        ...startRound(state, 100),
        playerHands: [hand],
        bankroll: 900,
      };
      
      const afterSplit = executeAction(newState, 'split');
      
      expect(afterSplit.playerHands).toHaveLength(2);
      expect(afterSplit.playerHands[0].isSplit).toBe(true);
      expect(afterSplit.playerHands[1].isSplit).toBe(true);
      expect(afterSplit.playerHands[0].cards).toHaveLength(2); // Original card + drawn
      expect(afterSplit.playerHands[1].cards).toHaveLength(2);
      expect(afterSplit.bankroll).toBe(800); // 900 - 100 for second hand
      expect(afterSplit.activeHandIndex).toBe(0);
    });

    it('throws error when insufficient bankroll for split', () => {
      const state = createInitialState(100);
      const hand = createHand([card('8'), card('8')], 50);
      const newState = {
        ...startRound(state, 50),
        playerHands: [hand],
        bankroll: 10, // Not enough for split
      };
      
      expect(() => executeAction(newState, 'split')).toThrow();
    });
  });

  describe('Insurance', () => {
    it('allows insurance when dealer shows ace', () => {
      const state = createInitialState(1000);
      const dealerHand = createHand([card('A'), card('K', 'spades', false)], 0);
      const playerHand = createHand([card('10'), card('10')], 100);
      
      const newState = {
        ...state,
        phase: 'PLAYER_TURN',
        dealerHand,
        playerHands: [playerHand],
        currentBet: 100,
        bankroll: 900,
      };
      
      const afterInsurance = executeAction(newState, 'insurance');
      
      expect(afterInsurance.insuranceBet).toBe(50); // Half of bet
      expect(afterInsurance.bankroll).toBe(850); // 900 - 50
    });

    it('pays insurance when dealer has blackjack', () => {
      const state = createInitialState(1000);
      const dealerHand = createHand([card('A'), card('K')], 0);
      dealerHand.isBlackjack = true;
      
      const settlementState = {
        ...state,
        phase: 'SETTLEMENT',
        dealerHand,
        playerHands: [createHand([card('10'), card('10')], 100)],
        insuranceBet: 50,
        bankroll: 850,
        results: [],
      };
      
      const settled = settleHands(settlementState);
      
      // Insurance pays 2:1, so 50 * 3 = 150
      expect(settled.bankroll).toBe(1000); // 850 + 150
    });

    it('loses insurance when dealer does not have blackjack', () => {
      const state = createInitialState(1000);
      const dealerHand = createHand([card('A'), card('6')], 0);
      
      const settlementState = {
        ...state,
        phase: 'SETTLEMENT',
        dealerHand,
        playerHands: [createHand([card('10'), card('10')], 100)],
        insuranceBet: 50,
        bankroll: 850,
        results: [],
      };
      
      const settled = settleHands(settlementState);
      
      // Insurance is lost, bankroll stays the same
      expect(settled.bankroll).toBe(850);
    });
  });

  describe('Dealer Turn', () => {
    it('dealer stands on 17 (S17)', () => {
      const state = createInitialState(1000);
      const dealerHand = createHand([card('10'), card('7')], 0);
      dealerHand.cards.forEach(c => c.faceUp = true);
      
      const dealerTurnState = {
        ...state,
        phase: 'DEALER_TURN',
        dealerHand,
        playerHands: [createHand([card('10'), card('10')], 100)],
      };
      
      const afterDealer = playDealerTurn(dealerTurnState);
      
      expect(afterDealer.phase).toBe('SETTLEMENT');
      expect(afterDealer.dealerHand.cards).toHaveLength(2); // No additional cards
    });

    it('dealer hits until 17+', () => {
      const state = createInitialState(1000);
      const dealerHand = createHand([card('10'), card('5')], 0);
      dealerHand.cards.forEach(c => c.faceUp = true);
      
      // Create a shoe with cards that will make dealer hit
      const shoe = [card('2'), card('3'), card('4')];
      
      const dealerTurnState = {
        ...state,
        phase: 'DEALER_TURN',
        dealerHand,
        playerHands: [createHand([card('10'), card('10')], 100)],
        shoe,
      };
      
      const afterDealer = playDealerTurn(dealerTurnState);
      
      expect(afterDealer.phase).toBe('SETTLEMENT');
      expect(afterDealer.dealerHand.cards.length).toBeGreaterThan(2);
    });

    it('dealer does not draw when all player hands busted', () => {
      const state = createInitialState(1000);
      const dealerHand = createHand([card('10'), card('5')], 0);
      dealerHand.cards.forEach(c => c.faceUp = true);
      
      const bustedHand = createHand([card('10'), card('10'), card('5')], 100);
      bustedHand.isBusted = true;
      
      const dealerTurnState = {
        ...state,
        phase: 'DEALER_TURN',
        dealerHand,
        playerHands: [bustedHand],
      };
      
      const afterDealer = playDealerTurn(dealerTurnState);
      
      expect(afterDealer.phase).toBe('SETTLEMENT');
      // Dealer should not draw when all hands busted
      expect(afterDealer.dealerHand.cards).toHaveLength(2);
    });
  });

  describe('Settlement', () => {
    it('settles multiple hands correctly', () => {
      const state = createInitialState(1000);
      const hand1 = createHand([card('10'), card('9')], 100);
      const hand2 = createHand([card('10'), card('8')], 100);
      const dealerHand = createHand([card('10'), card('7')], 0);
      dealerHand.cards.forEach(c => c.faceUp = true);
      
      const settlementState = {
        ...state,
        phase: 'SETTLEMENT',
        dealerHand,
        playerHands: [hand1, hand2],
        bankroll: 800, // After bets
        results: [],
      };
      
      const settled = settleHands(settlementState);
      
      expect(settled.results).toHaveLength(2);
      expect(settled.results[0].result).toBe('win');
      expect(settled.results[1].result).toBe('win');
      expect(settled.bankroll).toBe(1200); // 800 + 200 + 200
    });

    it('handles push correctly', () => {
      const state = createInitialState(1000);
      const hand = createHand([card('10'), card('8')], 100);
      const dealerHand = createHand([card('9'), card('9')], 0);
      dealerHand.cards.forEach(c => c.faceUp = true);
      
      const settlementState = {
        ...state,
        phase: 'SETTLEMENT',
        dealerHand,
        playerHands: [hand],
        bankroll: 900,
        results: [],
      };
      
      const settled = settleHands(settlementState);
      
      expect(settled.results[0].result).toBe('push');
      expect(settled.results[0].payout).toBe(100);
      expect(settled.bankroll).toBe(1000); // 900 + 100 (bet returned)
    });

    it('ensures bankroll never goes negative', () => {
      const state = createInitialState(10);
      const hand = createHand([card('10'), card('10')], 100);
      const dealerHand = createHand([card('A'), card('K')], 0);
      dealerHand.isBlackjack = true;
      dealerHand.cards.forEach(c => c.faceUp = true);
      
      // This shouldn't happen in practice, but test safety
      const settlementState = {
        ...state,
        phase: 'SETTLEMENT',
        dealerHand,
        playerHands: [hand],
        bankroll: -50, // Negative bankroll
        results: [],
      };
      
      const settled = settleHands(settlementState);
      
      expect(settled.bankroll).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reset for New Round', () => {
    it('resets game state but preserves bankroll', () => {
      const state = createInitialState(1000);
      let newState = startRound(state, 100);
      newState = executeAction(newState, 'stand');
      newState = playDealerTurn(newState);
      newState = settleHands(newState);
      
      const resetState = resetForNewRound(newState);
      
      expect(resetState.phase).toBe('BETTING');
      expect(resetState.playerHands).toHaveLength(0);
      expect(resetState.dealerHand.cards).toHaveLength(0);
      expect(resetState.currentBet).toBe(0);
      expect(resetState.results).toHaveLength(0);
      expect(resetState.bankroll).toBe(newState.bankroll); // Preserved
    });
  });
});
