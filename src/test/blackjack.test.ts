// ============================================================================
// Blackjack Game Logic Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  calculateHandValues,
  getBestHandValue,
  isSoftHand,
  isBusted,
  isBlackjack,
  canSplit,
  createHand,
  addCardToHand,
  compareHands,
} from '@/lib/blackjack/hand';
import {
  createDeck,
  createShoe,
  shuffleCards,
  drawCard,
  needsReshuffle,
} from '@/lib/blackjack/deck';
import {
  shouldDealerHit,
  calculatePayout,
  isValidBet,
} from '@/lib/blackjack/rules';
import { Card, DEFAULT_CONFIG } from '@/lib/blackjack/types';

// Helper to create cards
const card = (rank: string, suit: string = 'hearts', faceUp: boolean = true): Card => ({
  rank: rank as Card['rank'],
  suit: suit as Card['suit'],
  faceUp,
});

describe('Hand Calculations', () => {
  describe('calculateHandValues', () => {
    it('calculates simple hands correctly', () => {
      const cards = [card('5'), card('7')];
      expect(calculateHandValues(cards)).toEqual([12]);
    });

    it('calculates face cards as 10', () => {
      const cards = [card('K'), card('Q')];
      expect(calculateHandValues(cards)).toEqual([20]);
    });

    it('calculates single ace as 11', () => {
      const cards = [card('A'), card('5')];
      const values = calculateHandValues(cards);
      expect(values).toContain(16);
    });

    it('calculates ace as 1 when would bust', () => {
      const cards = [card('A'), card('10'), card('5')];
      expect(calculateHandValues(cards)).toEqual([16]);
    });

    it('handles multiple aces correctly', () => {
      const cards = [card('A'), card('A')];
      const values = calculateHandValues(cards);
      expect(values).toContain(12); // One as 11, one as 1
    });

    it('handles three aces correctly', () => {
      const cards = [card('A'), card('A'), card('A')];
      const values = calculateHandValues(cards);
      expect(values).toContain(13); // One as 11, two as 1
    });

    it('busts correctly with multiple cards', () => {
      const cards = [card('10'), card('10'), card('5')];
      expect(calculateHandValues(cards)).toEqual([25]);
    });
  });

  describe('getBestHandValue', () => {
    it('returns best non-bust value', () => {
      const cards = [card('A'), card('6')];
      expect(getBestHandValue(cards)).toBe(17);
    });

    it('returns bust value when all bust', () => {
      const cards = [card('10'), card('10'), card('5')];
      expect(getBestHandValue(cards)).toBe(25);
    });
  });

  describe('isSoftHand', () => {
    it('identifies soft hands', () => {
      const cards = [card('A'), card('6')];
      expect(isSoftHand(cards)).toBe(true);
    });

    it('identifies hard hands', () => {
      const cards = [card('10'), card('7')];
      expect(isSoftHand(cards)).toBe(false);
    });

    it('identifies hard hand when ace must be 1', () => {
      const cards = [card('A'), card('10'), card('6')];
      expect(isSoftHand(cards)).toBe(false);
    });
  });

  describe('isBlackjack', () => {
    it('detects blackjack with ace and king', () => {
      const cards = [card('A'), card('K')];
      expect(isBlackjack(cards)).toBe(true);
    });

    it('detects blackjack with ace and 10', () => {
      const cards = [card('10'), card('A')];
      expect(isBlackjack(cards)).toBe(true);
    });

    it('rejects non-blackjack 21', () => {
      const cards = [card('7'), card('7'), card('7')];
      expect(isBlackjack(cards)).toBe(false);
      expect(getBestHandValue(cards)).toBe(21);
    });

    it('rejects blackjack with more than 2 cards', () => {
      const cards = [card('A'), card('5'), card('5')];
      expect(isBlackjack(cards)).toBe(false);
    });
  });

  describe('isBusted', () => {
    it('identifies bust', () => {
      const cards = [card('10'), card('10'), card('5')];
      expect(isBusted(cards)).toBe(true);
    });

    it('identifies non-bust', () => {
      const cards = [card('10'), card('10')];
      expect(isBusted(cards)).toBe(false);
    });
  });

  describe('canSplit', () => {
    it('allows split on matching ranks', () => {
      const hand = createHand([card('8'), card('8')], 100);
      expect(canSplit(hand, 1, 0)).toBe(true);
    });

    it('allows split on matching values (10s)', () => {
      const hand = createHand([card('K'), card('10')], 100);
      expect(canSplit(hand, 1, 0)).toBe(true);
    });

    it('rejects split on non-matching', () => {
      const hand = createHand([card('8'), card('9')], 100);
      expect(canSplit(hand, 1, 0)).toBe(false);
    });

    it('rejects split when max splits reached', () => {
      const hand = createHand([card('8'), card('8')], 100);
      expect(canSplit(hand, 1, 1)).toBe(false);
    });
  });

  describe('compareHands', () => {
    it('player wins with higher value', () => {
      const player = [card('10'), card('9')];
      const dealer = [card('10'), card('7')];
      expect(compareHands(player, dealer)).toBe(1);
    });

    it('dealer wins with higher value', () => {
      const player = [card('10'), card('7')];
      const dealer = [card('10'), card('9')];
      expect(compareHands(player, dealer)).toBe(-1);
    });

    it('push on equal values', () => {
      const player = [card('10'), card('8')];
      const dealer = [card('9'), card('9')];
      expect(compareHands(player, dealer)).toBe(0);
    });

    it('player loses when busted', () => {
      const player = [card('10'), card('10'), card('5')];
      const dealer = [card('10'), card('7')];
      expect(compareHands(player, dealer)).toBe(-1);
    });

    it('player wins when dealer busts', () => {
      const player = [card('10'), card('7')];
      const dealer = [card('10'), card('10'), card('5')];
      expect(compareHands(player, dealer)).toBe(1);
    });
  });
});

describe('Deck Management', () => {
  describe('createDeck', () => {
    it('creates 52 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('has 4 suits', () => {
      const deck = createDeck();
      const suits = new Set(deck.map(c => c.suit));
      expect(suits.size).toBe(4);
    });

    it('has 13 ranks', () => {
      const deck = createDeck();
      const ranks = new Set(deck.map(c => c.rank));
      expect(ranks.size).toBe(13);
    });
  });

  describe('createShoe', () => {
    it('creates correct number of cards', () => {
      const shoe = createShoe(6);
      expect(shoe).toHaveLength(312);
    });

    it('has multiple of each card', () => {
      const shoe = createShoe(6);
      const aceOfSpades = shoe.filter(
        c => c.rank === 'A' && c.suit === 'spades'
      );
      expect(aceOfSpades).toHaveLength(6);
    });
  });

  describe('shuffleCards', () => {
    it('maintains card count', () => {
      const deck = createDeck();
      const shuffled = shuffleCards(deck);
      expect(shuffled).toHaveLength(52);
    });

    it('is immutable', () => {
      const deck = createDeck();
      const original = [...deck];
      shuffleCards(deck);
      expect(deck).toEqual(original);
    });
  });

  describe('drawCard', () => {
    it('returns card and remaining shoe', () => {
      const shoe = createDeck();
      const [drawn, remaining] = drawCard(shoe);
      expect(remaining).toHaveLength(51);
      expect(drawn).toBeDefined();
    });

    it('throws on empty shoe', () => {
      expect(() => drawCard([])).toThrow();
    });
  });

  describe('needsReshuffle', () => {
    it('returns true when below threshold', () => {
      const shoe = createShoe(6).slice(0, 50); // Only 50 cards left
      expect(needsReshuffle(shoe, 6, 0.25)).toBe(true);
    });

    it('returns false when above threshold', () => {
      const shoe = createShoe(6);
      expect(needsReshuffle(shoe, 6, 0.25)).toBe(false);
    });
  });
});

describe('Dealer Rules', () => {
  describe('shouldDealerHit (S17 - Stand on Soft 17)', () => {
    it('hits on 16', () => {
      const cards = [card('10'), card('6')];
      expect(shouldDealerHit(cards, false)).toBe(true);
    });

    it('stands on hard 17', () => {
      const cards = [card('10'), card('7')];
      expect(shouldDealerHit(cards, false)).toBe(false);
    });

    it('stands on soft 17 (S17)', () => {
      const cards = [card('A'), card('6')];
      expect(shouldDealerHit(cards, false)).toBe(false);
    });

    it('stands on 18+', () => {
      const cards = [card('10'), card('8')];
      expect(shouldDealerHit(cards, false)).toBe(false);
    });
  });

  describe('shouldDealerHit (H17 - Hit on Soft 17)', () => {
    it('hits on soft 17 (H17)', () => {
      const cards = [card('A'), card('6')];
      expect(shouldDealerHit(cards, true)).toBe(true);
    });

    it('stands on soft 18', () => {
      const cards = [card('A'), card('7')];
      expect(shouldDealerHit(cards, true)).toBe(false);
    });
  });
});

describe('Settlement', () => {
  describe('calculatePayout', () => {
    it('pays 3:2 for blackjack', () => {
      const hand = createHand([card('A'), card('K')], 100);
      hand.isBlackjack = true;
      const dealerCards = [card('10'), card('7')];
      
      const result = calculatePayout(hand, dealerCards, DEFAULT_CONFIG);
      expect(result.result).toBe('blackjack');
      expect(result.payout).toBe(250); // 100 + 150
    });

    it('pushes on blackjack vs blackjack', () => {
      const hand = createHand([card('A'), card('K')], 100);
      hand.isBlackjack = true;
      const dealerCards = [card('A'), card('Q')];
      
      const result = calculatePayout(hand, dealerCards, DEFAULT_CONFIG);
      expect(result.result).toBe('push');
      expect(result.payout).toBe(100);
    });

    it('loses when dealer has blackjack', () => {
      const hand = createHand([card('10'), card('10')], 100);
      const dealerCards = [card('A'), card('K')];
      
      const result = calculatePayout(hand, dealerCards, DEFAULT_CONFIG);
      expect(result.result).toBe('lose');
      expect(result.payout).toBe(0);
    });

    it('pays 1:1 for regular win', () => {
      const hand = createHand([card('10'), card('9')], 100);
      const dealerCards = [card('10'), card('7')];
      
      const result = calculatePayout(hand, dealerCards, DEFAULT_CONFIG);
      expect(result.result).toBe('win');
      expect(result.payout).toBe(200);
    });

    it('wins when dealer busts', () => {
      const hand = createHand([card('10'), card('5')], 100);
      const dealerCards = [card('10'), card('10'), card('5')];
      
      const result = calculatePayout(hand, dealerCards, DEFAULT_CONFIG);
      expect(result.result).toBe('win');
      expect(result.payout).toBe(200);
    });

    it('loses when player busts', () => {
      const hand = createHand([card('10'), card('10'), card('5')], 100);
      hand.isBusted = true;
      const dealerCards = [card('10'), card('7')];
      
      const result = calculatePayout(hand, dealerCards, DEFAULT_CONFIG);
      expect(result.result).toBe('lose');
      expect(result.payout).toBe(0);
    });
  });

  describe('isValidBet', () => {
    it('accepts valid bet', () => {
      expect(isValidBet(100, 1000, DEFAULT_CONFIG)).toBe(true);
    });

    it('rejects bet below minimum', () => {
      expect(isValidBet(5, 1000, DEFAULT_CONFIG)).toBe(false);
    });

    it('rejects bet above maximum', () => {
      expect(isValidBet(2000, 5000, DEFAULT_CONFIG)).toBe(false);
    });

    it('rejects bet above bankroll', () => {
      expect(isValidBet(500, 100, DEFAULT_CONFIG)).toBe(false);
    });
  });
});
