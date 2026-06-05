// ============================================================================
// Poker Engine - Bot AI (heuristic, 3 difficulty levels)
// ============================================================================
//
// Pure decision function for a computer player. Always returns a LEGAL action
// (falls back through raise -> call/check -> fold). Uses a hand-strength
// estimate (preflop ranking, postflop best-of-7 category) plus difficulty
// thresholds and a little randomness so bots are not deterministic.

import { legalActions, minRaiseTo } from './betting';
import { evaluate7 } from './handEval';
import { RANK_VALUE, type Card, type PokerAction, type PokerPublicState } from './types';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotDecision { action: PokerAction; amount?: number }

/** 0..1 estimate of how strong a starting hand / made hand is. */
export function handStrength(hole: Card[], community: Card[]): number {
  if (hole.length < 2) return 0;

  if (community.length === 0) {
    // Preflop: simple ranking from the two hole cards.
    const [a, b] = hole;
    const va = RANK_VALUE[a.rank];
    const vb = RANK_VALUE[b.rank];
    const hi = Math.max(va, vb);
    const lo = Math.min(va, vb);
    let score = (hi + lo) / 28; // 0..1 by raw card value
    if (a.rank === b.rank) score += 0.30;             // pocket pair
    if (a.suit === b.suit) score += 0.08;             // suited
    const gap = Math.abs(va - vb);
    if (gap === 1) score += 0.06;                       // connected
    else if (gap === 2) score += 0.03;
    if (hi >= 13) score += 0.05;                        // has an Ace/King
    return Math.max(0, Math.min(1, score));
  }

  // Postflop: normalize the made-hand category (0..8) and refine high card.
  const rank = evaluate7([...hole, ...community]);
  const base = rank.category / 8;
  const kicker = (rank.tiebreak[0] ?? 0) / 14 * 0.06;
  return Math.max(0, Math.min(1, base + kicker));
}

/** Decide a legal action for `seat`. */
export function decideBotAction(
  state: PokerPublicState,
  seat: number,
  hole: Card[],
  difficulty: BotDifficulty,
  rng: () => number = Math.random,
): BotDecision {
  const legal = legalActions(state, seat);
  if (legal.length === 0) return { action: 'check' };

  const me = state.seats.find((s) => s.seat === seat)!;
  const toCall = Math.max(0, state.betToCall - me.committedThisStreet);
  const pot = state.seats.reduce((a, s) => a + s.committedTotal, 0);
  const s = handStrength(hole, state.communityCards);
  const r = rng();

  // Difficulty profiles: [foldBelow, raiseAbove, aggression, bluffChance]
  const profile = {
    easy: { foldBelow: 0.12, raiseAbove: 0.82, aggression: 0.35, bluff: 0.02 },
    medium: { foldBelow: 0.32, raiseAbove: 0.70, aggression: 0.55, bluff: 0.06 },
    hard: { foldBelow: 0.40, raiseAbove: 0.66, aggression: 0.70, bluff: 0.12 },
  }[difficulty];

  const maxTo = me.committedThisStreet + me.stack;
  const want = (fracOfPot: number): number => {
    const target = state.betToCall + Math.max(state.blinds.bb, Math.round(pot * fracOfPot));
    return Math.max(minRaiseTo(state, seat), Math.min(maxTo, target));
  };
  const aggress = (fracOfPot: number): BotDecision => {
    const target = want(fracOfPot);
    if (target >= maxTo) return legal.includes('allin') ? { action: 'allin' } : pick(['call', 'check']);
    if (legal.includes('raise')) return { action: 'raise', amount: target };
    if (legal.includes('bet')) return { action: 'bet', amount: target };
    return legal.includes('allin') ? { action: 'allin' } : pick(['call', 'check']);
  };
  const pick = (prefs: PokerAction[]): BotDecision => {
    for (const a of prefs) if (legal.includes(a)) return { action: a };
    return { action: legal[0] };
  };

  // No bet to face: check, or bet when strong / bluffing.
  if (toCall === 0) {
    if (s >= profile.raiseAbove || r < profile.bluff) return aggress(0.6);
    if (s >= 0.55 && r < profile.aggression) return aggress(0.5);
    return pick(['check', 'call']);
  }

  // Facing a bet: use pot odds + strength.
  const potOdds = toCall / (pot + toCall);
  if (s >= profile.raiseAbove && r < profile.aggression) return aggress(0.75);
  if (s < profile.foldBelow && s < potOdds && r > profile.bluff) return pick(['fold']);
  if (s < potOdds * 0.8 && r > profile.bluff) return pick(['fold', 'check']);
  return pick(['call', 'allin', 'check', 'fold']);
}
