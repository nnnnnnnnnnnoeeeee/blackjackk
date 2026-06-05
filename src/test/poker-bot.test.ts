import { describe, it, expect } from 'vitest';
import { decideBotAction, handStrength } from '@/lib/poker/bot';
import type { Card, PokerPublicState, Rank, Suit, SeatState } from '@/lib/poker/types';

const SUIT: Record<string, Suit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };
const C = (s: string): Card => ({ rank: s.slice(0, -1) as Rank, suit: SUIT[s.slice(-1)] });
const H = (...s: string[]): Card[] => s.map(C);

const mkSeat = (p: Partial<SeatState> & { seat: number }): SeatState => ({
  userId: `u${p.seat}`, status: 'active', stack: 1000,
  committedThisStreet: 0, committedTotal: 0, hasActedThisStreet: false, ...p,
});

const mkState = (p: Partial<PokerPublicState>): PokerPublicState => ({
  phase: 'preflop', handNo: 1, buttonSeat: 1, blinds: { sb: 5, bb: 10 },
  communityCards: [], seats: [], betToCall: 0, minRaise: 10,
  currentTurnSeat: 2, lastAggressorSeat: null, ...p,
});

describe('Poker - bot AI', () => {
  it('rates premium hands stronger than trash', () => {
    expect(handStrength(H('As', 'Ah'), [])).toBeGreaterThan(handStrength(H('7d', '2c'), []));
    const quads = handStrength(H('As', 'Ah'), H('Ad', 'Ac', '9h'));
    const highCard = handStrength(H('Kd', '4c'), H('2h', '7s', '9c'));
    expect(quads).toBeGreaterThan(highCard);
  });

  it('always returns a legal action', () => {
    const state = mkState({
      betToCall: 10, currentTurnSeat: 2,
      seats: [mkSeat({ seat: 1, committedThisStreet: 10 }), mkSeat({ seat: 2 })],
    });
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const d = decideBotAction(state, 2, H('7d', '2c'), diff, () => 0.99);
      expect(['fold', 'call', 'raise', 'allin']).toContain(d.action);
    }
  });

  it('does not fold a monster to a bet', () => {
    const state = mkState({
      betToCall: 10, currentTurnSeat: 2,
      seats: [mkSeat({ seat: 1, committedThisStreet: 10 }), mkSeat({ seat: 2 })],
    });
    const d = decideBotAction(state, 2, H('As', 'Ah'), 'hard', () => 0.0);
    expect(d.action).not.toBe('fold');
  });

  it('can check for free with a weak hand instead of folding', () => {
    const state = mkState({
      phase: 'flop', betToCall: 0, currentTurnSeat: 2, communityCards: H('2h', '7s', '9c'),
      seats: [mkSeat({ seat: 1, hasActedThisStreet: true }), mkSeat({ seat: 2 })],
    });
    const d = decideBotAction(state, 2, H('3d', '4c'), 'medium', () => 0.99);
    expect(['check', 'call']).toContain(d.action);
  });

  it('respects all-in-only situations (short stack)', () => {
    const state = mkState({
      betToCall: 50, currentTurnSeat: 2,
      seats: [mkSeat({ seat: 1, committedThisStreet: 50 }), mkSeat({ seat: 2, stack: 20 })],
    });
    const d = decideBotAction(state, 2, H('As', 'Ks'), 'hard', () => 0.0);
    expect(['allin', 'fold']).toContain(d.action);
  });
});
