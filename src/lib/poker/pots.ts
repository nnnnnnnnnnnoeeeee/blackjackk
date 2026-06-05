// ============================================================================
// Poker Engine - Pots (main + side pots, distribution)
// ============================================================================

import { compareHands } from './handEval';
import type { HandRank, Pot, SeatState } from './types';

/**
 * Build the main pot and any side pots from each seat's committedTotal.
 * Folded players' chips stay in the pots but those seats are not eligible to win.
 */
export function buildPots(seats: SeatState[]): Pot[] {
  const contributors = seats
    .filter((s) => s.committedTotal > 0)
    .map((s) => ({ seat: s.seat, amount: s.committedTotal, folded: s.status === 'folded' }));

  if (contributors.length === 0) return [];

  const levels = [...new Set(contributors.map((c) => c.amount))].sort((a, b) => a - b);

  const pots: Pot[] = [];
  let prev = 0;
  for (const level of levels) {
    const layer = level - prev;
    const inLayer = contributors.filter((c) => c.amount >= level);
    const amount = layer * inLayer.length;
    if (amount > 0) {
      const eligibleSeats = inLayer.filter((c) => !c.folded).map((c) => c.seat);
      pots.push({ amount, eligibleSeats });
    }
    prev = level;
  }

  // Merge consecutive pots that have the same eligible set (cosmetic, keeps it tidy).
  const merged: Pot[] = [];
  for (const pot of pots) {
    const last = merged[merged.length - 1];
    if (last && sameSeats(last.eligibleSeats, pot.eligibleSeats)) {
      last.amount += pot.amount;
    } else {
      merged.push({ ...pot, eligibleSeats: [...pot.eligibleSeats] });
    }
  }
  return merged;
}

function sameSeats(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

/**
 * Distribute pots to the best eligible hand(s). Splits ties evenly; odd chips go
 * to the first winner left of the button. Returns seat -> chips won.
 * `showdownHands` must contain a HandRank for every non-folded eligible seat
 * (except pots with a single eligible seat, which win uncontested).
 */
export function distribute(
  pots: Pot[],
  showdownHands: Record<number, HandRank>,
  buttonSeat: number,
): Record<number, number> {
  const won: Record<number, number> = {};
  const add = (seat: number, amount: number) => {
    won[seat] = (won[seat] ?? 0) + amount;
  };

  // Order winners so the first seat left of the button comes first (odd-chip rule).
  const orderKey = (seat: number) => (seat > buttonSeat ? seat - buttonSeat : seat - buttonSeat + 100);

  for (const pot of pots) {
    if (pot.eligibleSeats.length === 0) continue;
    if (pot.eligibleSeats.length === 1) {
      add(pot.eligibleSeats[0], pot.amount);
      continue;
    }

    let best: HandRank | null = null;
    let winners: number[] = [];
    for (const seat of pot.eligibleSeats) {
      const hand = showdownHands[seat];
      if (!hand) continue;
      if (best === null) {
        best = hand;
        winners = [seat];
      } else {
        const cmp = compareHands(hand, best);
        if (cmp > 0) {
          best = hand;
          winners = [seat];
        } else if (cmp === 0) {
          winners.push(seat);
        }
      }
    }

    if (winners.length === 0) continue;
    winners.sort((a, b) => orderKey(a) - orderKey(b));

    const share = Math.floor(pot.amount / winners.length);
    let remainder = pot.amount - share * winners.length;
    for (const seat of winners) {
      add(seat, share);
      if (remainder > 0) {
        add(seat, 1);
        remainder--;
      }
    }
  }

  return won;
}
