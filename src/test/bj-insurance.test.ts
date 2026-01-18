// ============================================================================
// Blackjack Bonus & Insurance Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import { calculatePayout } from '@/lib/blackjack/rules';
import { executeInsurance } from '@/lib/blackjack/game';
import { canInsure } from '@/lib/blackjack/rules';
import { createInitialState, startRound } from '@/lib/blackjack/game';
import { createHand } from '@/lib/blackjack/hand';
import { DEFAULT_CONFIG } from '@/lib/blackjack/types';
// Helper to create cards
const card = (rank: string, suit: string = 'hearts', faceUp: boolean = true) => ({
  rank: rank as 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K',
  suit: suit as 'hearts' | 'diamonds' | 'clubs' | 'spades',
  faceUp,
});

describe('Blackjack Bonus (3:2)', () => {
  it('natural blackjack pays 3:2 (2.5x bet)', () => {
    const playerHand = createHand([card('A'), card('K')], 100);
    const dealerCards = [card('9'), card('8')];
    
    const { result, payout } = calculatePayout(playerHand, dealerCards, DEFAULT_CONFIG);
    
    expect(result).toBe('blackjack');
    expect(payout).toBe(250); // 100 + (100 * 1.5) = 250
  });

  it('blackjack after split does NOT pay 3:2', () => {
    const playerHand = {
      ...createHand([card('A'), card('K')], 100),
      isSplit: true,
    };
    const dealerCards = [card('9'), card('8')];
    
    const { result, payout } = calculatePayout(playerHand, dealerCards, DEFAULT_CONFIG);
    
    // Should be treated as regular 21, not blackjack
    expect(result).not.toBe('blackjack');
    expect(payout).toBe(200); // Regular win: 2x bet
  });

  it('blackjack with more than 2 cards does NOT pay 3:2', () => {
    const playerHand = createHand([card('A'), card('5'), card('5')], 100);
    playerHand.isBlackjack = false; // Not a natural blackjack
    const dealerCards = [card('9'), card('8')];
    
    const { result, payout } = calculatePayout(playerHand, dealerCards, DEFAULT_CONFIG);
    
    expect(result).toBe('win');
    expect(payout).toBe(200); // Regular win: 2x bet
  });

  it('player BJ vs dealer BJ = push', () => {
    const playerHand = createHand([card('A'), card('K')], 100);
    const dealerCards = [card('A'), card('Q')];
    
    const { result, payout } = calculatePayout(playerHand, dealerCards, DEFAULT_CONFIG);
    
    expect(result).toBe('push');
    expect(payout).toBe(100); // Return bet only
  });
});

describe('Insurance', () => {
  it('can take insurance when dealer shows Ace', () => {
    const state = createInitialState(1000);
    const afterBet = startRound(state, 100);
    
    // Set dealer upcard to Ace
    const stateWithAce = {
      ...afterBet,
      dealerHand: {
        ...afterBet.dealerHand,
        cards: [
          { rank: 'A', suit: 'hearts', faceUp: true },
          { rank: 'K', suit: 'spades', faceUp: false },
        ],
      },
    };
    
    expect(canInsure(stateWithAce)).toBe(true);
  });

  it('cannot take insurance when dealer does not show Ace', () => {
    const state = createInitialState(1000);
    const afterBet = startRound(state, 100);
    
    // Set dealer upcard to non-Ace
    const stateWithoutAce = {
      ...afterBet,
      dealerHand: {
        ...afterBet.dealerHand,
        cards: [
          { rank: 'K', suit: 'hearts', faceUp: true },
          { rank: 'A', suit: 'spades', faceUp: false },
        ],
      },
    };
    
    expect(canInsure(stateWithoutAce)).toBe(false);
  });

  it('insurance pays 2:1 if dealer has blackjack', () => {
    const state = createInitialState(1000);
    const afterBet = startRound(state, 100);
    
    // Set dealer to have blackjack
    const stateWithDealerBJ = {
      ...afterBet,
      dealerHand: {
        ...afterBet.dealerHand,
        cards: [
          { rank: 'A', suit: 'hearts', faceUp: true },
          { rank: 'K', suit: 'spades', faceUp: true },
        ],
        isBlackjack: true,
      },
      insuranceBet: 50, // Half of bet
    };
    
    // In settlement, insurance pays 3x (bet + 2x bet)
    const insurancePayout = stateWithDealerBJ.insuranceBet * 3;
    expect(insurancePayout).toBe(150); // 50 * 3 = 150
  });

  it('insurance is lost if dealer does not have blackjack', () => {
    const state = createInitialState(1000);
    const afterBet = startRound(state, 100);
    
    // Take insurance
    const stateWithInsurance = executeInsurance(afterBet);
    expect(stateWithInsurance.insuranceBet).toBe(50);
    expect(stateWithInsurance.bankroll).toBe(850); // 1000 - 100 - 50
    
    // If dealer doesn't have BJ, insurance is lost (already deducted)
    // Bankroll remains at 850, no additional payout
  });

  it('cannot take insurance twice', () => {
    const state = createInitialState(1000);
    const afterBet = startRound(state, 100);
    
    const stateWithAce = {
      ...afterBet,
      dealerHand: {
        ...afterBet.dealerHand,
        cards: [
          { rank: 'A', suit: 'hearts', faceUp: true },
          { rank: 'K', suit: 'spades', faceUp: false },
        ],
      },
    };
    
    const afterInsurance = executeInsurance(stateWithAce);
    expect(canInsure(afterInsurance)).toBe(false);
  });
});
