// ============================================================================
// Card Counting Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  getCardValue,
  calculateRunningCount,
  calculateTrueCount,
  getCountInterpretation,
} from '@/lib/blackjack/cardcounting';
import { Card } from '@/lib/blackjack/types';

const card = (rank: string, suit: string = 'hearts', faceUp: boolean = true): Card => ({
  rank: rank as Card['rank'],
  suit: suit as Card['suit'],
  faceUp,
});

describe('Card Counting', () => {
  describe('getCardValue', () => {
    it('returns +1 for low cards (2-6)', () => {
      expect(getCardValue('2')).toBe(1);
      expect(getCardValue('3')).toBe(1);
      expect(getCardValue('4')).toBe(1);
      expect(getCardValue('5')).toBe(1);
      expect(getCardValue('6')).toBe(1);
    });

    it('returns 0 for neutral cards (7-9)', () => {
      expect(getCardValue('7')).toBe(0);
      expect(getCardValue('8')).toBe(0);
      expect(getCardValue('9')).toBe(0);
    });

    it('returns -1 for high cards (10-A)', () => {
      expect(getCardValue('10')).toBe(-1);
      expect(getCardValue('J')).toBe(-1);
      expect(getCardValue('Q')).toBe(-1);
      expect(getCardValue('K')).toBe(-1);
      expect(getCardValue('A')).toBe(-1);
    });
  });

  describe('calculateRunningCount', () => {
    it('calculates running count correctly', () => {
      const cards = [
        card('2'), // +1
        card('5'), // +1
        card('7'), // 0
        card('K'), // -1
        card('A'), // -1
      ];
      
      const count = calculateRunningCount(cards);
      expect(count).toBe(0); // +1 +1 +0 -1 -1 = 0
    });

    it('ignores face-down cards', () => {
      const cards = [
        card('2', 'hearts', true), // +1
        card('5', 'hearts', false), // ignored
        card('K', 'hearts', true), // -1
      ];
      
      const count = calculateRunningCount(cards);
      expect(count).toBe(0); // +1 -1 = 0
    });
  });

  describe('calculateTrueCount', () => {
    it('calculates true count correctly', () => {
      const runningCount = 4;
      const cardsRemaining = 104; // 2 decks
      const deckCount = 6;
      
      const trueCount = calculateTrueCount(runningCount, cardsRemaining, deckCount);
      expect(trueCount).toBeCloseTo(2.0); // 4 / 2 = 2
    });

    it('handles minimum decks remaining', () => {
      const runningCount = 2;
      const cardsRemaining = 20; // Less than 0.5 decks
      const deckCount = 6;
      
      const trueCount = calculateTrueCount(runningCount, cardsRemaining, deckCount);
      expect(trueCount).toBeLessThanOrEqual(4); // Should use minimum 0.5 decks
    });
  });

  describe('getCountInterpretation', () => {
    it('returns advantage for high true count', () => {
      const interpretation = getCountInterpretation(2.5);
      expect(interpretation.label).toBe('Advantage');
      expect(interpretation.advantage).toBe('Player');
    });

    it('returns neutral+ for slight positive count', () => {
      const interpretation = getCountInterpretation(1.2);
      expect(interpretation.label).toBe('Neutral+');
      expect(interpretation.advantage).toBe('Slight Player');
    });

    it('returns neutral for near-zero count', () => {
      const interpretation = getCountInterpretation(0.3);
      expect(interpretation.label).toBe('Neutral');
      expect(interpretation.advantage).toBe('Even');
    });

    it('returns disadvantage for negative count', () => {
      const interpretation = getCountInterpretation(-1.5);
      expect(interpretation.label).toBe('Disadvantage');
      expect(interpretation.advantage).toBe('House');
    });
  });
});
