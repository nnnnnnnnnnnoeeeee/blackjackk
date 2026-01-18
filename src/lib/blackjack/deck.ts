// ============================================================================
// Deck Management - Pure functions for shoe creation and shuffling
// ============================================================================

import { Card, Suit, Rank } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/**
 * Creates a single deck of 52 cards
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: true });
    }
  }
  
  return deck;
}

/**
 * Creates a shoe with multiple decks
 */
export function createShoe(deckCount: number): Card[] {
  const shoe: Card[] = [];
  
  for (let i = 0; i < deckCount; i++) {
    shoe.push(...createDeck());
  }
  
  return shoe;
}

/**
 * Fisher-Yates shuffle - returns a new shuffled array
 */
export function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Creates a new shuffled shoe
 */
export function createShuffledShoe(deckCount: number): Card[] {
  return shuffleCards(createShoe(deckCount));
}

/**
 * Draws a card from the shoe (immutable)
 * Returns [drawnCard, remainingShoe]
 */
export function drawCard(shoe: Card[], faceUp: boolean = true): [Card, Card[]] {
  if (shoe.length === 0) {
    throw new Error('Cannot draw from empty shoe');
  }
  
  const [card, ...remaining] = shoe;
  return [{ ...card, faceUp }, remaining];
}

/**
 * Draws multiple cards from the shoe (immutable)
 * Returns [drawnCards, remainingShoe]
 */
export function drawCards(
  shoe: Card[],
  count: number,
  faceUp: boolean = true
): [Card[], Card[]] {
  if (shoe.length < count) {
    throw new Error(`Cannot draw ${count} cards from shoe with ${shoe.length} cards`);
  }
  
  const drawn = shoe.slice(0, count).map(c => ({ ...c, faceUp }));
  const remaining = shoe.slice(count);
  
  return [drawn, remaining];
}

/**
 * Checks if shoe needs reshuffling based on threshold
 */
export function needsReshuffle(
  shoe: Card[],
  deckCount: number,
  threshold: number
): boolean {
  const totalCards = deckCount * 52;
  const remainingRatio = shoe.length / totalCards;
  return remainingRatio < threshold;
}

/**
 * Gets the number of cards remaining in the shoe
 */
export function getCardsRemaining(shoe: Card[]): number {
  return shoe.length;
}

/**
 * Gets penetration percentage (how far into the shoe we are)
 */
export function getPenetration(shoe: Card[], deckCount: number): number {
  const totalCards = deckCount * 52;
  return ((totalCards - shoe.length) / totalCards) * 100;
}
