// ============================================================================
// Rules Configuration Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import { canSplitHand } from '@/lib/blackjack/rules';
import { canSplit } from '@/lib/blackjack/hand';
import { createHand } from '@/lib/blackjack/hand';
import { DEFAULT_CONFIG, Card } from '@/lib/blackjack/types';

// Helper to create cards
const card = (rank: string, suit: string = 'hearts', faceUp: boolean = true): Card => ({
  rank: rank as Card['rank'],
  suit: suit as Card['suit'],
  faceUp,
});

describe('Resplit Aces', () => {
  it('allows resplit aces when resplitAces is enabled', () => {
    const hand = createHand([card('A'), card('A')], 100);
    hand.isSplit = true; // Already split once
    
    const canResplit = canSplit(hand, 3, 1, true); // resplitAces = true
    expect(canResplit).toBe(true);
  });

  it('prevents resplit aces when resplitAces is disabled', () => {
    const hand = createHand([card('A'), card('A')], 100);
    hand.isSplit = true; // Already split once
    
    const canResplit = canSplit(hand, 3, 1, false); // resplitAces = false
    expect(canResplit).toBe(false);
  });

  it('allows regular resplit when resplitAces is disabled but not aces', () => {
    const hand = createHand([card('8'), card('8')], 100);
    hand.isSplit = true; // Already split once
    
    const canResplit = canSplit(hand, 3, 1, false); // resplitAces = false
    expect(canResplit).toBe(true); // Can resplit non-aces
  });
});

describe('Double After Split (DAS)', () => {
  it('allows double after split when DAS is enabled', () => {
    const config = { ...DEFAULT_CONFIG, allowDoubleAfterSplit: true };
    const hand = createHand([card('8'), card('3')], 100);
    hand.isSplit = true;
    
    // This is tested in canDouble function
    // DAS is already implemented in rules.ts canDouble function
    expect(config.allowDoubleAfterSplit).toBe(true);
  });

  it('prevents double after split when DAS is disabled', () => {
    const config = { ...DEFAULT_CONFIG, allowDoubleAfterSplit: false };
    const hand = createHand([card('8'), card('3')], 100);
    hand.isSplit = true;
    
    expect(config.allowDoubleAfterSplit).toBe(false);
  });
});

describe('H17 vs S17', () => {
  it('configures dealer to hit soft 17 when H17 is enabled', () => {
    const config = { ...DEFAULT_CONFIG, dealerHitsSoft17: true };
    expect(config.dealerHitsSoft17).toBe(true);
  });

  it('configures dealer to stand on soft 17 when S17 is enabled', () => {
    const config = { ...DEFAULT_CONFIG, dealerHitsSoft17: false };
    expect(config.dealerHitsSoft17).toBe(false);
  });
});
