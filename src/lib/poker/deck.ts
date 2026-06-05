// ============================================================================
// Poker Engine - Deck (52 cards, seedable shuffle)
// ============================================================================

import type { Card, Rank, Suit } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/** Build an ordered 52-card deck. */
export function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/** Small deterministic PRNG (mulberry32) so tests can use a seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Return a shuffled 52-card deck. If `seed` is provided the shuffle is
 * deterministic (used by tests); otherwise it uses Math.random.
 */
export function shuffledDeck(seed?: number): Card[] {
  const deck = freshDeck();
  const rng = seed === undefined ? Math.random : mulberry32(seed);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Draw `n` cards off the top. Returns [drawn, remaining]. Pure. */
export function draw(deck: Card[], n: number): [Card[], Card[]] {
  if (n > deck.length) {
    throw new Error(`Cannot draw ${n} cards from a deck of ${deck.length}`);
  }
  return [deck.slice(0, n), deck.slice(n)];
}
