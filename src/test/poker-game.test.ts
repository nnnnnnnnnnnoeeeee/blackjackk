import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  startHand,
  applyAction,
  advanceStreet,
  runShowdown,
} from '@/lib/poker/game';
import { isBettingRoundClosed, inHandCount } from '@/lib/poker/betting';
import { DEFAULT_POKER_CONFIG, type PokerPublicState } from '@/lib/poker/types';

const cfg = DEFAULT_POKER_CONFIG; // sb 5 / bb 10
const players3 = [
  { seat: 1, userId: 'u1', stack: 1000 },
  { seat: 2, userId: 'u2', stack: 1000 },
  { seat: 3, userId: 'u3', stack: 1000 },
];

const stackSum = (s: PokerPublicState) => s.seats.reduce((a, x) => a + x.stack, 0);
const liveSum = (s: PokerPublicState) => s.seats.reduce((a, x) => a + x.stack + x.committedTotal, 0);
const seat = (s: PokerPublicState, n: number) => s.seats.find((x) => x.seat === n)!;

describe('Poker - hand flow', () => {
  it('starts a 3-handed hand with blinds, button and first actor correct', () => {
    const init = createInitialState(players3, cfg);
    const { state, hole } = startHand(init, cfg, 42);

    expect(state.phase).toBe('preflop');
    expect(state.handNo).toBe(1);
    expect(state.buttonSeat).toBe(2);     // rotated from seat 1
    expect(seat(state, 3).committedThisStreet).toBe(5);  // SB
    expect(seat(state, 1).committedThisStreet).toBe(10); // BB
    expect(state.betToCall).toBe(10);
    expect(state.currentTurnSeat).toBe(2); // UTG (left of BB)
    expect(Object.keys(hole)).toHaveLength(3);
    expect(hole[1]).toHaveLength(2);
    expect(liveSum(state)).toBe(3000);
  });

  it('awards the pot when everyone folds to one player', () => {
    const init = createInitialState(players3, cfg);
    let { state } = startHand(init, cfg, 1);

    state = applyAction(state, 2, 'fold', undefined, cfg); // UTG folds
    state = applyAction(state, 3, 'fold', undefined, cfg); // SB folds
    expect(inHandCount(state)).toBe(1);
    expect(isBettingRoundClosed(state)).toBe(true);
    expect(state.currentTurnSeat).toBeNull();

    const final = runShowdown(state, {}); // no cards needed, uncontested
    expect(seat(final, 1).stack).toBe(1005); // BB had committed 10, wins 15
    expect(stackSum(final)).toBe(3000);
    // winner's hole cards are NOT revealed on a muck
    expect(seat(final, 1).holeCards).toBeUndefined();
  });

  it('plays a full checked-down hand to showdown and conserves chips', () => {
    const init = createInitialState(players3, cfg);
    const started = startHand(init, cfg, 7);
    let state = started.state;
    let deck = started.deck;
    const hole = started.hole;

    // Preflop: UTG calls, SB calls, BB checks.
    state = applyAction(state, 2, 'call', undefined, cfg);
    state = applyAction(state, 3, 'call', undefined, cfg);
    state = applyAction(state, 1, 'check', undefined, cfg);
    expect(isBettingRoundClosed(state)).toBe(true);
    expect(liveSum(state)).toBe(3000);

    // Flop, turn, river: everyone checks. Order = left of button (2) → 3,1,2.
    for (const _street of ['flop', 'turn', 'river']) {
      ({ state, deck } = advanceStreet(state, deck));
      state = applyAction(state, 3, 'check', undefined, cfg);
      state = applyAction(state, 1, 'check', undefined, cfg);
      state = applyAction(state, 2, 'check', undefined, cfg);
      expect(isBettingRoundClosed(state)).toBe(true);
    }
    expect(state.communityCards).toHaveLength(5);

    ({ state, deck } = advanceStreet(state, deck)); // -> showdown
    expect(state.phase).toBe('showdown');

    const final = runShowdown(state, hole);
    expect(final.phase).toBe('payout');
    expect(stackSum(final)).toBe(3000); // pot of 30 redistributed
    expect((final.results ?? []).reduce((a, r) => a + r.amountWon, 0)).toBe(30);
  });

  it('applies the heads-up blind rule (button is SB, acts first preflop)', () => {
    const init = createInitialState(
      [
        { seat: 1, userId: 'u1', stack: 1000 },
        { seat: 2, userId: 'u2', stack: 1000 },
      ],
      cfg,
    );
    const { state } = startHand(init, cfg, 3);
    expect(state.buttonSeat).toBe(2);
    expect(seat(state, 2).committedThisStreet).toBe(5);  // button posts SB
    expect(seat(state, 1).committedThisStreet).toBe(10); // BB
    expect(state.currentTurnSeat).toBe(2);               // button acts first preflop
  });

  it('runs an all-in preflop to the river and conserves chips', () => {
    const init = createInitialState(
      [
        { seat: 1, userId: 'u1', stack: 1000 },
        { seat: 2, userId: 'u2', stack: 1000 },
      ],
      cfg,
    );
    const started = startHand(init, cfg, 99);
    let state = started.state;
    let deck = started.deck;
    const hole = started.hole;

    state = applyAction(state, 2, 'allin', undefined, cfg); // button/SB shoves
    state = applyAction(state, 1, 'allin', undefined, cfg); // BB calls all-in
    expect(isBettingRoundClosed(state)).toBe(true);

    // Deal out the board to showdown.
    let guard = 0;
    while (state.phase !== 'showdown' && guard++ < 6) {
      ({ state, deck } = advanceStreet(state, deck));
    }
    expect(state.phase).toBe('showdown');
    expect(state.communityCards).toHaveLength(5);

    const final = runShowdown(state, hole);
    expect(stackSum(final)).toBe(2000); // all chips accounted for
  });
});
