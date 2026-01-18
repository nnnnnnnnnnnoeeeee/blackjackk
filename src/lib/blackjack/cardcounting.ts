// ============================================================================
// Card Counting Logic - Hi-Lo System
// ============================================================================

import { Card, Rank } from './types';

/**
 * Hi-Lo card counting values:
 * 2-6: +1
 * 7-9: 0
 * 10-A: -1
 */
export function getCardValue(rank: Rank): number {
  if (['2', '3', '4', '5', '6'].includes(rank)) return 1;
  if (['7', '8', '9'].includes(rank)) return 0;
  if (['10', 'J', 'Q', 'K', 'A'].includes(rank)) return -1;
  return 0;
}

/**
 * Calculates running count from a sequence of cards
 */
export function calculateRunningCount(cards: Card[]): number {
  return cards
    .filter(c => c.faceUp)
    .reduce((count, card) => count + getCardValue(card.rank), 0);
}

/**
 * Calculates true count approximation
 * True count = running count / decks remaining
 */
export function calculateTrueCount(
  runningCount: number,
  cardsRemaining: number,
  deckCount: number
): number {
  const totalCards = deckCount * 52;
  const decksRemaining = Math.max(0.5, cardsRemaining / 52); // Minimum 0.5 decks
  return runningCount / decksRemaining;
}

/**
 * Gets count interpretation for display
 */
export function getCountInterpretation(trueCount: number): {
  label: string;
  color: string;
  advantage: string;
} {
  if (trueCount >= 2) {
    return {
      label: 'Advantage',
      color: 'text-success',
      advantage: 'Player',
    };
  }
  if (trueCount >= 1) {
    return {
      label: 'Neutral+',
      color: 'text-warning',
      advantage: 'Slight Player',
    };
  }
  if (trueCount >= -1) {
    return {
      label: 'Neutral',
      color: 'text-muted-foreground',
      advantage: 'Even',
    };
  }
  return {
    label: 'Disadvantage',
    color: 'text-destructive',
    advantage: 'House',
  };
}
