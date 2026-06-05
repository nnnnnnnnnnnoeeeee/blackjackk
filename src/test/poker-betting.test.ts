import { describe, it, expect } from 'vitest';
import { legalActions, callAmount, isBettingRoundClosed } from '@/lib/poker/betting';
import type { PokerPublicState, SeatState } from '@/lib/poker/types';

const mkSeat = (p: Partial<SeatState> & { seat: number }): SeatState => ({
  userId: `u${p.seat}`,
  status: 'active',
  stack: 1000,
  committedThisStreet: 0,
  committedTotal: 0,
  hasActedThisStreet: false,
  ...p,
});

const mkState = (p: Partial<PokerPublicState>): PokerPublicState => ({
  phase: 'preflop',
  handNo: 1,
  buttonSeat: 1,
  blinds: { sb: 5, bb: 10 },
  communityCards: [],
  seats: [],
  betToCall: 0,
  minRaise: 10,
  currentTurnSeat: null,
  lastAggressorSeat: null,
  ...p,
});

describe('Poker - betting rules', () => {
  it('returns no actions when it is not the seat turn', () => {
    const state = mkState({ currentTurnSeat: 1, seats: [mkSeat({ seat: 1 }), mkSeat({ seat: 2 })] });
    expect(legalActions(state, 2)).toEqual([]);
  });

  it('facing a bet: fold/call/raise/allin', () => {
    const state = mkState({
      betToCall: 10,
      currentTurnSeat: 2,
      seats: [mkSeat({ seat: 1, committedThisStreet: 10 }), mkSeat({ seat: 2 })],
    });
    expect(legalActions(state, 2)).toEqual(['fold', 'call', 'raise', 'allin']);
    expect(callAmount(state, 2)).toBe(10);
  });

  it('no outstanding bet: fold/check/bet/allin', () => {
    const state = mkState({
      betToCall: 0,
      currentTurnSeat: 1,
      seats: [mkSeat({ seat: 1 }), mkSeat({ seat: 2 })],
    });
    expect(legalActions(state, 1)).toEqual(['fold', 'check', 'bet', 'allin']);
  });

  it('short stack facing a bet can only fold or go all-in', () => {
    const state = mkState({
      betToCall: 10,
      currentTurnSeat: 2,
      seats: [mkSeat({ seat: 1, committedThisStreet: 10 }), mkSeat({ seat: 2, stack: 4 })],
    });
    expect(legalActions(state, 2)).toEqual(['fold', 'allin']);
    expect(callAmount(state, 2)).toBe(4); // capped at stack
  });

  it('round is not closed while a player still has the option', () => {
    const state = mkState({
      betToCall: 10,
      seats: [
        mkSeat({ seat: 1, committedThisStreet: 10, hasActedThisStreet: true }),
        mkSeat({ seat: 2, committedThisStreet: 10, hasActedThisStreet: false }), // BB option
      ],
    });
    expect(isBettingRoundClosed(state)).toBe(false);
  });

  it('round is closed when all active players matched and acted', () => {
    const state = mkState({
      betToCall: 10,
      seats: [
        mkSeat({ seat: 1, committedThisStreet: 10, hasActedThisStreet: true }),
        mkSeat({ seat: 2, committedThisStreet: 10, hasActedThisStreet: true }),
      ],
    });
    expect(isBettingRoundClosed(state)).toBe(true);
  });

  it('round is closed when only one player remains', () => {
    const state = mkState({
      seats: [
        mkSeat({ seat: 1, status: 'active', hasActedThisStreet: false }),
        mkSeat({ seat: 2, status: 'folded' }),
      ],
    });
    expect(isBettingRoundClosed(state)).toBe(true);
  });
});
