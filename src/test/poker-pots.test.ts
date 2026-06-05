import { describe, it, expect } from 'vitest';
import { buildPots, distribute } from '@/lib/poker/pots';
import type { HandRank, SeatState } from '@/lib/poker/types';

const seat = (s: number, committedTotal: number, status: SeatState['status'] = 'active'): SeatState => ({
  seat: s,
  userId: `u${s}`,
  status,
  stack: 0,
  committedThisStreet: 0,
  committedTotal,
  hasActedThisStreet: true,
});

const hr = (category: number, tiebreak: number[] = []): HandRank => ({ category, tiebreak, label: 'x' });

const sum = (o: Record<number, number>) => Object.values(o).reduce((a, b) => a + b, 0);

describe('Poker - pots', () => {
  it('builds a single pot when everyone commits equally', () => {
    const pots = buildPots([seat(1, 100), seat(2, 100), seat(3, 100)]);
    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligibleSeats.sort()).toEqual([1, 2, 3]);
  });

  it('builds a main pot and a side pot for an all-in short stack', () => {
    // seat 1 all-in for 50, seats 2 & 3 commit 100.
    const pots = buildPots([seat(1, 50, 'allin'), seat(2, 100), seat(3, 100)]);
    // main: 50*3 = 150 eligible {1,2,3}; side: 50*2 = 100 eligible {2,3}
    expect(pots).toHaveLength(2);
    expect(pots[0].amount).toBe(150);
    expect(pots[0].eligibleSeats.sort()).toEqual([1, 2, 3]);
    expect(pots[1].amount).toBe(100);
    expect(pots[1].eligibleSeats.sort()).toEqual([2, 3]);
  });

  it('keeps folded players chips in the pot but not eligible to win', () => {
    const pots = buildPots([seat(1, 100, 'folded'), seat(2, 100), seat(3, 100)]);
    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligibleSeats.sort()).toEqual([2, 3]);
  });

  it('awards a single pot to the best hand', () => {
    const pots = buildPots([seat(1, 100), seat(2, 100), seat(3, 100)]);
    const won = distribute(pots, { 1: hr(5), 2: hr(6), 3: hr(2) }, 1);
    expect(won[2]).toBe(300);
    expect(sum(won)).toBe(300);
  });

  it('splits a tied pot and gives the odd chip left of the button', () => {
    const pots = buildPots([seat(1, 51), seat(2, 50)]); // pot = 101
    // seats 1 and 2 tie; button = 2 → first left of button is seat 1 → gets odd chip
    const won = distribute(pots, { 1: hr(6, [10]), 2: hr(6, [10]) }, 2);
    expect(won[1]).toBe(51);
    expect(won[2]).toBe(50);
    expect(sum(won)).toBe(101);
  });

  it('distributes main and side pots independently (chip conservation)', () => {
    const seats = [seat(1, 50, 'allin'), seat(2, 100), seat(3, 100)];
    const pots = buildPots(seats);
    // seat 1 has the best hand but is only eligible for the main pot.
    const won = distribute(pots, { 1: hr(8), 2: hr(6), 3: hr(2) }, 3);
    expect(won[1]).toBe(150); // main pot only
    expect(won[2]).toBe(100); // side pot (best among 2,3)
    expect(sum(won)).toBe(250);
    expect(sum(won)).toBe(seats.reduce((a, s) => a + s.committedTotal, 0));
  });
});
