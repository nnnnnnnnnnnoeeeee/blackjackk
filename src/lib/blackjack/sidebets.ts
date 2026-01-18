// ============================================================================
// Side Bets Logic - Perfect Pairs & 21+3
// ============================================================================

import { Card, Suit } from './types';

export type PerfectPairTier = 'none' | 'mixed' | 'colored' | 'perfect';
export type TwentyOnePlus3Hand = 'none' | 'flush' | 'straight' | 'threeOfAKind' | 'straightFlush' | 'suitedTrips';

export interface PerfectPairResult {
  tier: PerfectPairTier;
  win: boolean;
  payoutMultiplier: number;
}

export interface TwentyOnePlus3Result {
  handType: TwentyOnePlus3Hand;
  win: boolean;
  payoutMultiplier: number;
}

/**
 * Evaluates Perfect Pairs side bet
 * Mixed Pair: same rank, different colors -> 5:1
 * Colored Pair: same rank, same color -> 10:1
 * Perfect Pair: same rank, same suit -> 25:1
 */
export function evaluatePerfectPairs(
  playerCards: [Card, Card],
  payouts: { mixed: number; colored: number; perfect: number } = {
    mixed: 5,
    colored: 10,
    perfect: 25,
  }
): PerfectPairResult {
  const [card1, card2] = playerCards;

  // Must be same rank
  if (card1.rank !== card2.rank) {
    return { tier: 'none', win: false, payoutMultiplier: 0 };
  }

  // Perfect pair: same rank, same suit
  if (card1.suit === card2.suit) {
    return { tier: 'perfect', win: true, payoutMultiplier: payouts.perfect };
  }

  // Colored pair: same rank, same color
  const suitColors: Record<Suit, 'red' | 'black'> = {
    hearts: 'red',
    diamonds: 'red',
    clubs: 'black',
    spades: 'black',
  };

  if (suitColors[card1.suit] === suitColors[card2.suit]) {
    return { tier: 'colored', win: true, payoutMultiplier: payouts.colored };
  }

  // Mixed pair: same rank, different colors
  return { tier: 'mixed', win: true, payoutMultiplier: payouts.mixed };
}

/**
 * Gets numeric value for rank (for straight calculation)
 */
function getRankValue(rank: string): number {
  if (rank === 'A') return 1;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return parseInt(rank, 10);
}

/**
 * Evaluates 21+3 side bet (combines 2 player cards + dealer upcard)
 * Flush: all same suit -> 5:1
 * Straight: consecutive ranks -> 10:1
 * Three of a Kind: all same rank -> 30:1
 * Straight Flush: consecutive ranks, same suit -> 40:1
 * Suited Trips: all same rank, same suit -> 100:1
 */
export function evaluate21Plus3(
  playerCards: [Card, Card],
  dealerUpCard: Card,
  payouts: {
    flush: number;
    straight: number;
    threeOfAKind: number;
    straightFlush: number;
    suitedTrips: number;
  } = {
    flush: 5,
    straight: 10,
    threeOfAKind: 30,
    straightFlush: 40,
    suitedTrips: 100,
  }
): TwentyOnePlus3Result {
  const allCards = [playerCards[0], playerCards[1], dealerUpCard];
  const ranks = allCards.map(c => c.rank);
  const suits = allCards.map(c => c.suit);

  // Check for three of a kind (all same rank)
  const allSameRank = ranks[0] === ranks[1] && ranks[1] === ranks[2];
  
  // Check for same suit
  const allSameSuit = suits[0] === suits[1] && suits[1] === suits[2];

  // Suited Trips: all same rank AND same suit
  if (allSameRank && allSameSuit) {
    return { handType: 'suitedTrips', win: true, payoutMultiplier: payouts.suitedTrips };
  }

  // Three of a Kind: all same rank
  if (allSameRank) {
    return { handType: 'threeOfAKind', win: true, payoutMultiplier: payouts.threeOfAKind };
  }

  // Check for straight (consecutive ranks)
  const values = allCards.map(c => getRankValue(c.rank)).sort((a, b) => a - b);
  const isStraight =
    (values[1] === values[0] + 1 && values[2] === values[1] + 1) ||
    // Handle A-2-3 and Q-K-A straights
    (values[0] === 1 && values[1] === 2 && values[2] === 3) ||
    (values[0] === 12 && values[1] === 13 && values[2] === 1);

  // Straight Flush: consecutive ranks AND same suit
  if (isStraight && allSameSuit) {
    return { handType: 'straightFlush', win: true, payoutMultiplier: payouts.straightFlush };
  }

  // Straight: consecutive ranks
  if (isStraight) {
    return { handType: 'straight', win: true, payoutMultiplier: payouts.straight };
  }

  // Flush: all same suit
  if (allSameSuit) {
    return { handType: 'flush', win: true, payoutMultiplier: payouts.flush };
  }

  return { handType: 'none', win: false, payoutMultiplier: 0 };
}
