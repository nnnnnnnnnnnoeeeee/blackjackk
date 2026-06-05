// ============================================================================
// Poker Engine - Betting rules (No-Limit)
// ============================================================================

import type { PokerAction, PokerPublicState, SeatState } from './types';

function seatOf(state: PokerPublicState, seat: number): SeatState | undefined {
  return state.seats.find((s) => s.seat === seat);
}

/** Chips needed to call (capped at the seat's stack). */
export function callAmount(state: PokerPublicState, seat: number): number {
  const s = seatOf(state, seat);
  if (!s) return 0;
  return Math.max(0, Math.min(state.betToCall - s.committedThisStreet, s.stack));
}

/** The minimum total committedThisStreet a legal raise must reach. */
export function minRaiseTo(state: PokerPublicState, seat: number): number {
  return state.betToCall + state.minRaise;
}

/** Legal actions for `seat` right now. Empty if it is not their turn. */
export function legalActions(state: PokerPublicState, seat: number): PokerAction[] {
  const s = seatOf(state, seat);
  if (!s || s.status !== 'active' || state.currentTurnSeat !== seat) return [];

  const toCall = state.betToCall - s.committedThisStreet;
  const actions: PokerAction[] = ['fold'];

  if (toCall <= 0) {
    actions.push('check');
    if (s.stack > 0) {
      actions.push('bet');
      actions.push('allin');
    }
  } else if (s.stack > toCall) {
    actions.push('call');
    actions.push('raise');
    actions.push('allin');
  } else if (s.stack > 0) {
    // Stack can't cover a full call → only an all-in call is possible.
    actions.push('allin');
  }

  return actions;
}

/** True when the current betting round is complete. */
export function isBettingRoundClosed(state: PokerPublicState): boolean {
  const notFolded = state.seats.filter(
    (s) => s.status === 'active' || s.status === 'allin',
  );
  if (notFolded.length <= 1) return true;

  const active = state.seats.filter((s) => s.status === 'active');
  if (active.length === 0) return true; // everyone remaining is all-in

  return active.every(
    (s) => s.hasActedThisStreet && s.committedThisStreet === state.betToCall,
  );
}

/** Number of players still in the hand (not folded / out). */
export function inHandCount(state: PokerPublicState): number {
  return state.seats.filter((s) => s.status === 'active' || s.status === 'allin').length;
}
