import { describe, it, expect } from 'vitest';
import { evaluate7, compareHands } from '@/lib/poker/handEval';
import { HAND_CATEGORY, type Card, type Rank, type Suit } from '@/lib/poker/types';

const SUIT: Record<string, Suit> = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };
const C = (s: string): Card => ({ rank: s.slice(0, -1) as Rank, suit: SUIT[s.slice(-1)] });
const H = (...s: string[]): Card[] => s.map(C);

describe('Poker - hand evaluation', () => {
  it('detects a royal flush', () => {
    const r = evaluate7(H('As', 'Ks', 'Qs', 'Js', '10s', '2h', '3d'));
    expect(r.category).toBe(HAND_CATEGORY.STRAIGHT_FLUSH);
    expect(r.tiebreak[0]).toBe(14);
  });

  it('royal flush beats a lower straight flush', () => {
    const royal = evaluate7(H('As', 'Ks', 'Qs', 'Js', '10s'));
    const sf = evaluate7(H('9s', '8s', '7s', '6s', '5s'));
    expect(compareHands(royal, sf)).toBeGreaterThan(0);
  });

  it('four of a kind beats a full house', () => {
    const quads = evaluate7(H('9h', '9d', '9c', '9s', 'Kh', '2d', '3c'));
    const boat = evaluate7(H('Kh', 'Kd', 'Kc', '2s', '2h', '4d', '5c'));
    expect(quads.category).toBe(HAND_CATEGORY.FOUR_OF_A_KIND);
    expect(boat.category).toBe(HAND_CATEGORY.FULL_HOUSE);
    expect(compareHands(quads, boat)).toBeGreaterThan(0);
  });

  it('full house beats a flush', () => {
    const boat = evaluate7(H('Kh', 'Kd', 'Kc', '2s', '2h'));
    const flush = evaluate7(H('Ah', 'Jh', '9h', '6h', '3h'));
    expect(compareHands(boat, flush)).toBeGreaterThan(0);
  });

  it('flush beats a straight', () => {
    const flush = evaluate7(H('Ah', 'Jh', '9h', '6h', '3h'));
    const straight = evaluate7(H('9c', '8d', '7h', '6s', '5c'));
    expect(flush.category).toBe(HAND_CATEGORY.FLUSH);
    expect(straight.category).toBe(HAND_CATEGORY.STRAIGHT);
    expect(compareHands(flush, straight)).toBeGreaterThan(0);
  });

  it('recognizes the wheel (A-2-3-4-5) as a 5-high straight', () => {
    const wheel = evaluate7(H('Ah', '2d', '3c', '4s', '5h', 'Kd', 'Qc'));
    expect(wheel.category).toBe(HAND_CATEGORY.STRAIGHT);
    expect(wheel.tiebreak[0]).toBe(5);
    const sixHigh = evaluate7(H('2h', '3d', '4c', '5s', '6h'));
    expect(compareHands(sixHigh, wheel)).toBeGreaterThan(0);
  });

  it('compares two pair by kicker', () => {
    const a = evaluate7(H('Ah', 'Ad', 'Kh', 'Kd', 'Qc', '2s', '3h'));
    const b = evaluate7(H('Ah', 'Ad', 'Kh', 'Kd', 'Jc', '2s', '3h'));
    expect(a.category).toBe(HAND_CATEGORY.TWO_PAIR);
    expect(compareHands(a, b)).toBeGreaterThan(0);
  });

  it('detects an exact tie (same ranks, different suits)', () => {
    const a = evaluate7(H('Ah', 'Ad', 'Kh', 'Kd', 'Qc'));
    const b = evaluate7(H('As', 'Ac', 'Ks', 'Kc', 'Qd'));
    expect(compareHands(a, b)).toBe(0);
  });

  it('picks the best 5 of 7 when the board plays', () => {
    // Board is a straight; both players' hole cards are irrelevant low cards.
    const board = H('10h', 'Jd', 'Qc', 'Ks', 'Ah');
    const a = evaluate7([...H('2c', '3d'), ...board]);
    const b = evaluate7([...H('4c', '5d'), ...board]);
    expect(a.category).toBe(HAND_CATEGORY.STRAIGHT);
    expect(compareHands(a, b)).toBe(0); // both play the board's Broadway straight
  });

  it('one pair beats high card; high card compares kickers', () => {
    const pair = evaluate7(H('Ah', 'Ad', '5c', '8s', '9h'));
    const high = evaluate7(H('Ah', 'Kd', 'Qc', 'Js', '9h'));
    expect(compareHands(pair, high)).toBeGreaterThan(0);
    const highA = evaluate7(H('Ah', 'Kd', 'Qc', 'Js', '9h'));
    const highB = evaluate7(H('Ah', 'Kd', 'Qc', 'Js', '8h'));
    expect(compareHands(highA, highB)).toBeGreaterThan(0);
  });
});
