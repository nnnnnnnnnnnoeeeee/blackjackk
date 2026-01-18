// ============================================================================
// Side Bets Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import { evaluatePerfectPairs, evaluate21Plus3 } from '@/lib/blackjack/sidebets';
import { Card } from '@/lib/blackjack/types';

const card = (rank: string, suit: string = 'hearts', faceUp: boolean = true): Card => ({
  rank: rank as Card['rank'],
  suit: suit as Card['suit'],
  faceUp,
});

describe('Perfect Pairs', () => {
  it('detects perfect pair (same rank, same suit)', () => {
    const result = evaluatePerfectPairs(
      [card('8', 'hearts'), card('8', 'hearts')],
      { mixed: 5, colored: 10, perfect: 25 }
    );
    
    expect(result.tier).toBe('perfect');
    expect(result.win).toBe(true);
    expect(result.payoutMultiplier).toBe(25);
  });

  it('detects colored pair (same rank, same color)', () => {
    const result = evaluatePerfectPairs(
      [card('8', 'hearts'), card('8', 'diamonds')],
      { mixed: 5, colored: 10, perfect: 25 }
    );
    
    expect(result.tier).toBe('colored');
    expect(result.win).toBe(true);
    expect(result.payoutMultiplier).toBe(10);
  });

  it('detects mixed pair (same rank, different colors)', () => {
    const result = evaluatePerfectPairs(
      [card('8', 'hearts'), card('8', 'clubs')],
      { mixed: 5, colored: 10, perfect: 25 }
    );
    
    expect(result.tier).toBe('mixed');
    expect(result.win).toBe(true);
    expect(result.payoutMultiplier).toBe(5);
  });

  it('returns no win for non-pair', () => {
    const result = evaluatePerfectPairs(
      [card('8', 'hearts'), card('9', 'hearts')],
      { mixed: 5, colored: 10, perfect: 25 }
    );
    
    expect(result.tier).toBe('none');
    expect(result.win).toBe(false);
    expect(result.payoutMultiplier).toBe(0);
  });
});

describe('21+3', () => {
  it('detects flush (all same suit)', () => {
    const result = evaluate21Plus3(
      [card('8', 'hearts'), card('5', 'hearts')],
      card('K', 'hearts'),
      { flush: 5, straight: 10, threeOfAKind: 30, straightFlush: 40, suitedTrips: 100 }
    );
    
    expect(result.handType).toBe('flush');
    expect(result.win).toBe(true);
    expect(result.payoutMultiplier).toBe(5);
  });

  it('detects straight (consecutive ranks)', () => {
    const result = evaluate21Plus3(
      [card('5', 'hearts'), card('6', 'diamonds')],
      card('7', 'clubs'),
      { flush: 5, straight: 10, threeOfAKind: 30, straightFlush: 40, suitedTrips: 100 }
    );
    
    expect(result.handType).toBe('straight');
    expect(result.win).toBe(true);
    expect(result.payoutMultiplier).toBe(10);
  });

  it('detects three of a kind (all same rank)', () => {
    const result = evaluate21Plus3(
      [card('8', 'hearts'), card('8', 'diamonds')],
      card('8', 'clubs'),
      { flush: 5, straight: 10, threeOfAKind: 30, straightFlush: 40, suitedTrips: 100 }
    );
    
    expect(result.handType).toBe('threeOfAKind');
    expect(result.win).toBe(true);
    expect(result.payoutMultiplier).toBe(30);
  });

  it('detects straight flush (consecutive + same suit)', () => {
    const result = evaluate21Plus3(
      [card('5', 'hearts'), card('6', 'hearts')],
      card('7', 'hearts'),
      { flush: 5, straight: 10, threeOfAKind: 30, straightFlush: 40, suitedTrips: 100 }
    );
    
    expect(result.handType).toBe('straightFlush');
    expect(result.win).toBe(true);
    expect(result.payoutMultiplier).toBe(40);
  });

  it('detects suited trips (all same rank + suit)', () => {
    const result = evaluate21Plus3(
      [card('8', 'hearts'), card('8', 'hearts')],
      card('8', 'hearts'),
      { flush: 5, straight: 10, threeOfAKind: 30, straightFlush: 40, suitedTrips: 100 }
    );
    
    expect(result.handType).toBe('suitedTrips');
    expect(result.win).toBe(true);
    expect(result.payoutMultiplier).toBe(100);
  });

  it('returns no win for losing hand', () => {
    const result = evaluate21Plus3(
      [card('2', 'hearts'), card('5', 'diamonds')],
      card('K', 'clubs'),
      { flush: 5, straight: 10, threeOfAKind: 30, straightFlush: 40, suitedTrips: 100 }
    );
    
    expect(result.handType).toBe('none');
    expect(result.win).toBe(false);
    expect(result.payoutMultiplier).toBe(0);
  });
});
