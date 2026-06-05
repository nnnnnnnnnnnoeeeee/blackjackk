// ============================================================================
// Poker Engine - Game state machine (No-Limit Texas Hold'em)
// ============================================================================
//
// Immutable transitions. The server (edge functions) is authoritative; these
// pure functions compute the next public state. Hole cards are returned
// separately by startHand and only merged into public state at showdown.
//
// `amount` convention for bet/raise = the TOTAL committedThisStreet the player
// wants to reach after the action ("raise to"), not the increment.

import { draw, shuffledDeck } from './deck';
import { evaluate7 } from './handEval';
import { buildPots, distribute } from './pots';
import { isBettingRoundClosed, legalActions } from './betting';
import type {
  Card,
  HandRank,
  PokerAction,
  PokerConfig,
  PokerPublicState,
  SeatState,
  Street,
} from './types';

// ---- helpers ---------------------------------------------------------------

function clone(state: PokerPublicState): PokerPublicState {
  return {
    ...state,
    blinds: { ...state.blinds },
    communityCards: [...state.communityCards],
    seats: state.seats.map((s) => ({ ...s, holeCards: s.holeCards ? [...s.holeCards] : undefined })),
    results: state.results ? state.results.map((r) => ({ ...r })) : undefined,
  };
}

function sortedSeats(state: PokerPublicState): SeatState[] {
  return [...state.seats].sort((a, b) => a.seat - b.seat);
}

/** First seat clockwise from `fromSeat` (exclusive) matching `pred`, else null. */
function nextSeatMatching(
  state: PokerPublicState,
  fromSeat: number,
  pred: (s: SeatState) => boolean,
): number | null {
  const sorted = sortedSeats(state);
  const n = sorted.length;
  if (n === 0) return null;
  let startIdx = sorted.findIndex((s) => s.seat === fromSeat);
  if (startIdx < 0) startIdx = -1;
  for (let i = 1; i <= n; i++) {
    const s = sorted[(startIdx + i + n) % n];
    if (pred(s)) return s.seat;
  }
  return null;
}

const isPlayable = (s: SeatState) => s.userId !== null && s.stack > 0 && s.status !== 'empty';

function commit(seat: SeatState, amount: number): number {
  const real = Math.min(amount, seat.stack);
  seat.stack -= real;
  seat.committedThisStreet += real;
  seat.committedTotal += real;
  if (seat.stack === 0 && (seat.status === 'active')) seat.status = 'allin';
  return real;
}

// ---- creation --------------------------------------------------------------

export function createInitialState(
  players: Array<{ seat: number; userId: string | null; stack: number }>,
  cfg: PokerConfig,
): PokerPublicState {
  const seats: SeatState[] = players.map((p) => ({
    seat: p.seat,
    userId: p.userId,
    status: p.userId && p.stack > 0 ? 'active' : 'empty',
    stack: p.stack,
    committedThisStreet: 0,
    committedTotal: 0,
    hasActedThisStreet: false,
  }));

  return {
    phase: 'waiting',
    handNo: 0,
    buttonSeat: seats.length ? Math.min(...seats.map((s) => s.seat)) : 0,
    blinds: { sb: cfg.smallBlind, bb: cfg.bigBlind },
    communityCards: [],
    seats,
    betToCall: 0,
    minRaise: cfg.bigBlind,
    currentTurnSeat: null,
    lastAggressorSeat: null,
  };
}

// ---- start a hand ----------------------------------------------------------

export function startHand(
  prev: PokerPublicState,
  cfg: PokerConfig,
  deckSeed?: number,
): { state: PokerPublicState; deck: Card[]; hole: Record<number, Card[]> } {
  const state = clone(prev);

  // Reset seats for the new hand.
  for (const s of state.seats) {
    if (s.userId && s.stack > 0) s.status = 'active';
    else if (s.userId) s.status = 'out';
    else s.status = 'empty';
    s.committedThisStreet = 0;
    s.committedTotal = 0;
    s.hasActedThisStreet = false;
    s.holeCards = undefined;
  }

  const active = state.seats.filter((s) => s.status === 'active');
  if (active.length < 2) {
    throw new Error('Need at least 2 players with chips to start a hand');
  }

  // Rotate button to the next active seat.
  const button = nextSeatMatching(state, prev.buttonSeat, (s) => s.status === 'active');
  state.buttonSeat = button ?? active[0].seat;

  const headsUp = active.length === 2;
  const sbSeat = headsUp
    ? state.buttonSeat
    : nextSeatMatching(state, state.buttonSeat, (s) => s.status === 'active')!;
  const bbSeat = nextSeatMatching(state, sbSeat, (s) => s.status === 'active')!;

  const sb = state.seats.find((s) => s.seat === sbSeat)!;
  const bb = state.seats.find((s) => s.seat === bbSeat)!;
  commit(sb, cfg.smallBlind);
  commit(bb, cfg.bigBlind);

  state.betToCall = Math.max(...state.seats.map((s) => s.committedThisStreet));
  state.minRaise = cfg.bigBlind;
  state.lastAggressorSeat = bbSeat;

  // Deal 2 hole cards to each active seat (deal order starts left of button).
  let deck = shuffledDeck(deckSeed);
  const hole: Record<number, Card[]> = {};
  const dealOrder: number[] = [];
  let cur = sbSeat;
  for (let i = 0; i < active.length; i++) {
    dealOrder.push(cur);
    cur = nextSeatMatching(state, cur, (s) => s.status === 'active')!;
  }
  for (const seat of dealOrder) {
    const [cards, rest] = draw(deck, 2);
    hole[seat] = cards;
    deck = rest;
  }

  // First to act preflop.
  state.currentTurnSeat = headsUp
    ? state.buttonSeat
    : nextSeatMatching(state, bbSeat, (s) => s.status === 'active');

  state.phase = 'preflop';
  state.communityCards = [];
  state.handNo = prev.handNo + 1;
  state.results = undefined;

  return { state, deck, hole };
}

// ---- apply a player action -------------------------------------------------

export function applyAction(
  prev: PokerPublicState,
  seat: number,
  action: PokerAction,
  amount: number | undefined,
  cfg: PokerConfig,
): PokerPublicState {
  const legal = legalActions(prev, seat);
  if (!legal.includes(action)) {
    throw new Error(`Illegal action "${action}" for seat ${seat}`);
  }

  const state = clone(prev);
  const s = state.seats.find((x) => x.seat === seat)!;
  const toCall = state.betToCall - s.committedThisStreet;

  const reopen = () => {
    for (const o of state.seats) {
      if (o.seat !== seat && o.status === 'active') o.hasActedThisStreet = false;
    }
  };

  switch (action) {
    case 'fold':
      s.status = 'folded';
      s.hasActedThisStreet = true;
      break;

    case 'check':
      s.hasActedThisStreet = true;
      break;

    case 'call':
      commit(s, toCall);
      s.hasActedThisStreet = true;
      break;

    case 'bet': {
      const target = amount ?? 0;
      if (target < cfg.bigBlind && target < s.committedThisStreet + s.stack) {
        throw new Error(`Bet must be at least the big blind (${cfg.bigBlind})`);
      }
      const need = target - s.committedThisStreet;
      if (need > s.stack) throw new Error('Bet exceeds stack');
      commit(s, need);
      state.minRaise = s.committedThisStreet - state.betToCall;
      state.betToCall = s.committedThisStreet;
      state.lastAggressorSeat = seat;
      reopen();
      s.hasActedThisStreet = true;
      break;
    }

    case 'raise': {
      const target = amount ?? 0;
      const isAllIn = target >= s.committedThisStreet + s.stack;
      const minTarget = state.betToCall + state.minRaise;
      if (!isAllIn && target < minTarget) {
        throw new Error(`Raise must be to at least ${minTarget}`);
      }
      const need = target - s.committedThisStreet;
      if (need > s.stack) throw new Error('Raise exceeds stack');
      const increment = target - state.betToCall;
      commit(s, need);
      if (increment >= state.minRaise) {
        state.minRaise = increment;
        reopen();
      }
      state.betToCall = Math.max(state.betToCall, s.committedThisStreet);
      state.lastAggressorSeat = seat;
      s.hasActedThisStreet = true;
      break;
    }

    case 'allin': {
      commit(s, s.stack);
      const target = s.committedThisStreet;
      if (target > state.betToCall) {
        const increment = target - state.betToCall;
        if (increment >= state.minRaise) {
          state.minRaise = increment;
          reopen();
        }
        state.betToCall = target;
        state.lastAggressorSeat = seat;
      }
      s.hasActedThisStreet = true;
      break;
    }
  }

  // Advance turn (or close the round).
  if (isBettingRoundClosed(state)) {
    state.currentTurnSeat = null;
  } else {
    state.currentTurnSeat = nextSeatMatching(
      state,
      seat,
      (x) => x.status === 'active' && (!x.hasActedThisStreet || x.committedThisStreet < state.betToCall),
    );
  }

  return state;
}

// ---- advance to the next street -------------------------------------------

const NEXT_STREET: Record<string, PokerPublicState['phase']> = {
  preflop: 'flop',
  flop: 'turn',
  turn: 'river',
  river: 'showdown',
};

export function advanceStreet(
  prev: PokerPublicState,
  deck: Card[],
): { state: PokerPublicState; deck: Card[] } {
  const state = clone(prev);
  let working = [...deck];

  // Reset street betting.
  for (const s of state.seats) {
    s.committedThisStreet = 0;
    if (s.status === 'active') s.hasActedThisStreet = false;
  }
  state.betToCall = 0;
  state.minRaise = state.blinds.bb;
  state.lastAggressorSeat = null;

  const next = NEXT_STREET[state.phase] ?? 'showdown';
  if (state.phase === 'preflop') {
    const [c, rest] = draw(working, 3);
    state.communityCards = [...state.communityCards, ...c];
    working = rest;
  } else if (state.phase === 'flop' || state.phase === 'turn') {
    const [c, rest] = draw(working, 1);
    state.communityCards = [...state.communityCards, ...c];
    working = rest;
  }
  state.phase = next;

  // First to act postflop = first active seat left of the button.
  state.currentTurnSeat =
    next === 'showdown'
      ? null
      : nextSeatMatching(state, state.buttonSeat, (s) => s.status === 'active');

  return { state, deck: working };
}

// ---- showdown / payout -----------------------------------------------------

export function runShowdown(
  prev: PokerPublicState,
  hole: Record<number, Card[]>,
): PokerPublicState {
  const state = clone(prev);

  const pots = buildPots(state.seats);
  const showdownHands: Record<number, HandRank> = {};

  for (const s of state.seats) {
    if ((s.status === 'active' || s.status === 'allin') && hole[s.seat]) {
      s.holeCards = [...hole[s.seat]]; // reveal
      showdownHands[s.seat] = evaluate7([...hole[s.seat], ...state.communityCards]);
    }
  }

  const won = distribute(pots, showdownHands, state.buttonSeat);

  const results = Object.entries(won).map(([seatStr, amountWon]) => {
    const seat = Number(seatStr);
    return { seat, amountWon, handLabel: showdownHands[seat]?.label ?? '' };
  });

  for (const s of state.seats) {
    if (won[s.seat]) s.stack += won[s.seat];
  }

  state.results = results;
  state.phase = 'payout';
  state.currentTurnSeat = null;
  return state;
}

export type { Street };
