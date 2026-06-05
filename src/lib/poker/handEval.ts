// ============================================================================
// Poker Engine - Hand Evaluation (best 5 of 7)
// ============================================================================
//
// evaluate7 returns a comparable HandRank. compareHands gives a total order and
// detects exact ties (needed for split pots). Ace counts high (14) and also low
// for the wheel (A-2-3-4-5).

import { RANK_VALUE, HAND_CATEGORY, HAND_CATEGORY_LABEL, type Card, type HandRank } from './types';

/** Evaluate a 5-card hand. */
function evaluate5(cards: Card[]): HandRank {
  if (cards.length !== 5) {
    throw new Error('evaluate5 requires exactly 5 cards');
  }

  const values = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);

  // Count occurrences per rank value.
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);

  // Groups sorted by (count desc, value desc) — the basis for most tiebreaks.
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const countsDesc = groups.map((g) => g[1]);

  // Straight detection (distinct values, 5 consecutive). Handle the wheel.
  const distinct = [...new Set(values)].sort((a, b) => b - a);
  let straightHigh = 0;
  if (distinct.length === 5) {
    if (distinct[0] - distinct[4] === 4) {
      straightHigh = distinct[0];
    } else if (
      distinct[0] === 14 && distinct[1] === 5 && distinct[2] === 4 &&
      distinct[3] === 3 && distinct[4] === 2
    ) {
      straightHigh = 5; // wheel: A-2-3-4-5, the 5 is the high card
    }
  }

  const mk = (category: number, tiebreak: number[]): HandRank => ({
    category,
    tiebreak,
    label: HAND_CATEGORY_LABEL[category],
  });

  if (isFlush && straightHigh > 0) return mk(HAND_CATEGORY.STRAIGHT_FLUSH, [straightHigh]);
  if (countsDesc[0] === 4) {
    const quad = groups[0][0];
    const kicker = groups[1][0];
    return mk(HAND_CATEGORY.FOUR_OF_A_KIND, [quad, kicker]);
  }
  if (countsDesc[0] === 3 && countsDesc[1] === 2) {
    return mk(HAND_CATEGORY.FULL_HOUSE, [groups[0][0], groups[1][0]]);
  }
  if (isFlush) return mk(HAND_CATEGORY.FLUSH, values);
  if (straightHigh > 0) return mk(HAND_CATEGORY.STRAIGHT, [straightHigh]);
  if (countsDesc[0] === 3) {
    const trip = groups[0][0];
    const kickers = groups.slice(1).map((g) => g[0]).sort((a, b) => b - a);
    return mk(HAND_CATEGORY.THREE_OF_A_KIND, [trip, ...kickers]);
  }
  if (countsDesc[0] === 2 && countsDesc[1] === 2) {
    const highPair = Math.max(groups[0][0], groups[1][0]);
    const lowPair = Math.min(groups[0][0], groups[1][0]);
    const kicker = groups[2][0];
    return mk(HAND_CATEGORY.TWO_PAIR, [highPair, lowPair, kicker]);
  }
  if (countsDesc[0] === 2) {
    const pair = groups[0][0];
    const kickers = groups.slice(1).map((g) => g[0]).sort((a, b) => b - a);
    return mk(HAND_CATEGORY.ONE_PAIR, [pair, ...kickers]);
  }
  return mk(HAND_CATEGORY.HIGH_CARD, values);
}

/** All k-combinations of an array (k small). */
function combinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  const combo: T[] = [];
  const recurse = (start: number) => {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      recurse(i + 1);
      combo.pop();
    }
  };
  recurse(0);
  return result;
}

/** Compare two HandRanks. >0 if a beats b, <0 if b beats a, 0 if exact tie. */
export function compareHands(a: HandRank, b: HandRank): number {
  if (a.category !== b.category) return a.category - b.category;
  const len = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let i = 0; i < len; i++) {
    const av = a.tiebreak[i] ?? 0;
    const bv = b.tiebreak[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/** Evaluate the best 5-card hand out of 5, 6 or 7 cards. */
export function evaluate7(cards: Card[]): HandRank {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error('evaluate7 requires 5 to 7 cards');
  }
  if (cards.length === 5) return evaluate5(cards);

  let best: HandRank | null = null;
  for (const combo of combinations(cards, 5)) {
    const rank = evaluate5(combo);
    if (best === null || compareHands(rank, best) > 0) best = rank;
  }
  return best as HandRank;
}
