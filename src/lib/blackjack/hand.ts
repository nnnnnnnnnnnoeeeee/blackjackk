// ============================================================================
// Hand Calculations - Pure functions for hand evaluation
// ============================================================================

import { Card, Hand, Rank } from './types';

/**
 * Gets the numeric value of a card rank
 * Returns [minValue, maxValue] for aces (1 or 11)
 */
export function getCardValue(rank: Rank): number {
  if (rank === 'A') return 11; // We'll handle soft/hard in hand calculation
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

/**
 * Calculates all possible hand values (accounting for aces)
 * Returns sorted array of valid values (<= 21), or [lowest bust value] if all bust
 */
export function calculateHandValues(cards: Card[]): number[] {
  const faceUpCards = cards.filter(c => c.faceUp);
  
  if (faceUpCards.length === 0) return [0];
  
  // Count aces and sum non-ace cards
  let aceCount = 0;
  let sum = 0;
  
  for (const card of faceUpCards) {
    if (card.rank === 'A') {
      aceCount++;
    } else {
      sum += getCardValue(card.rank);
    }
  }
  
  // Generate all possible values with aces
  const values: number[] = [];
  
  // Try all combinations of ace values (1 or 11)
  for (let highAces = aceCount; highAces >= 0; highAces--) {
    const lowAces = aceCount - highAces;
    const total = sum + (highAces * 11) + (lowAces * 1);
    values.push(total);
  }
  
  // Filter to unique valid values, sorted
  const validValues = [...new Set(values)]
    .filter(v => v <= 21)
    .sort((a, b) => b - a); // Highest first
  
  // If no valid values, return the lowest bust value
  if (validValues.length === 0) {
    const lowestBust = Math.min(...values);
    return [lowestBust];
  }
  
  return validValues;
}

/**
 * Gets the best (highest non-bust) hand value
 */
export function getBestHandValue(cards: Card[]): number {
  const values = calculateHandValues(cards);
  return values[0]; // Already sorted highest first, valid values prioritized
}

/**
 * Checks if hand is soft (contains an ace counted as 11)
 */
export function isSoftHand(cards: Card[]): boolean {
  const faceUpCards = cards.filter(c => c.faceUp);
  const hasAce = faceUpCards.some(c => c.rank === 'A');
  
  if (!hasAce) return false;
  
  const values = calculateHandValues(cards);
  const bestValue = values[0];
  
  // If we can count an ace as 11 without busting, it's soft
  // Calculate sum treating all aces as 1
  const hardSum = faceUpCards.reduce((sum, card) => {
    if (card.rank === 'A') return sum + 1;
    return sum + getCardValue(card.rank);
  }, 0);
  
  // If best value is 10 more than hard sum, we're using an ace as 11
  return bestValue === hardSum + 10 && bestValue <= 21;
}

/**
 * Checks if hand is busted (over 21)
 */
export function isBusted(cards: Card[]): boolean {
  return getBestHandValue(cards) > 21;
}

/**
 * Checks if hand is a natural blackjack (A + 10-value in first 2 cards)
 */
export function isBlackjack(cards: Card[]): boolean {
  const faceUpCards = cards.filter(c => c.faceUp);
  
  if (faceUpCards.length !== 2) return false;
  
  const hasAce = faceUpCards.some(c => c.rank === 'A');
  const hasTen = faceUpCards.some(c => ['10', 'J', 'Q', 'K'].includes(c.rank));
  
  return hasAce && hasTen;
}

/**
 * Formats hand value for display (e.g., "17" or "17 (soft)")
 */
export function formatHandValue(cards: Card[]): string {
  const value = getBestHandValue(cards);
  const soft = isSoftHand(cards);
  
  if (value > 21) return `${value} BUST`;
  if (isBlackjack(cards)) return 'BLACKJACK';
  
  return soft ? `${value} (soft)` : `${value}`;
}

/**
 * Checks if a hand can be split
 */
export function canSplit(
  hand: Hand, 
  maxSplits: number, 
  currentSplitCount: number,
  resplitAces: boolean = false
): boolean {
  if (hand.cards.length !== 2) return false;
  if (currentSplitCount >= maxSplits) return false;
  
  const [card1, card2] = hand.cards;
  
  // Check if both cards are aces
  const isAcePair = card1.rank === 'A' && card2.rank === 'A';
  
  // If resplit aces is disabled and this is already a split hand with aces, can't resplit
  if (!resplitAces && hand.isSplit && isAcePair) {
    return false;
  }
  
  // Can split if same rank OR same value (e.g., 10-J)
  return card1.rank === card2.rank || 
    (getCardValue(card1.rank) === getCardValue(card2.rank) && 
     getCardValue(card1.rank) === 10);
}

/**
 * Creates an empty hand
 */
export function createEmptyHand(bet: number = 0): Hand {
  return {
    cards: [],
    bet,
    isDoubled: false,
    isSplit: false,
    isStood: false,
    isBusted: false,
    isBlackjack: false,
  };
}

/**
 * Creates a hand from cards
 */
export function createHand(cards: Card[], bet: number = 0): Hand {
  return {
    cards,
    bet,
    isDoubled: false,
    isSplit: false,
    isStood: false,
    isBusted: isBusted(cards),
    isBlackjack: isBlackjack(cards),
  };
}

/**
 * Adds a card to a hand (immutable)
 */
export function addCardToHand(hand: Hand, card: Card): Hand {
  const newCards = [...hand.cards, card];
  return {
    ...hand,
    cards: newCards,
    isBusted: isBusted(newCards),
    isBlackjack: isBlackjack(newCards),
  };
}

/**
 * Compares two hands and returns result
 * Returns: 1 if hand1 wins, -1 if hand2 wins, 0 if push
 */
export function compareHands(hand1Cards: Card[], hand2Cards: Card[]): -1 | 0 | 1 {
  const value1 = getBestHandValue(hand1Cards);
  const value2 = getBestHandValue(hand2Cards);
  const bust1 = value1 > 21;
  const bust2 = value2 > 21;
  
  if (bust1 && bust2) return 0;
  if (bust1) return -1;
  if (bust2) return 1;
  
  if (value1 > value2) return 1;
  if (value2 > value1) return -1;
  return 0;
}
