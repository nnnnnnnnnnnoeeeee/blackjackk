// ============================================================================
// Poker Engine - Types (No-Limit Texas Hold'em)
// ============================================================================
//
// Pure types, no React, no I/O. Mirrors the structure of src/lib/blackjack.
// The authoritative copy of the engine logic lives in
// supabase/functions/_shared/poker-engine.ts and must stay equivalent.

import type { Rank, Suit } from '@/lib/blackjack/types';

export type { Rank, Suit };

/** A playing card. Visibility is handled by game state, not the card itself. */
export interface Card {
  rank: Rank;
  suit: Suit;
}

/** Numeric value of a rank, Ace high (14). Ace-low for the wheel is handled in handEval. */
export const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  J: 11, Q: 12, K: 13, A: 14,
};

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type SeatStatus = 'active' | 'folded' | 'allin' | 'out' | 'empty';
export type PokerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';

export interface SeatState {
  seat: number;
  userId: string | null;
  status: SeatStatus;
  stack: number;                 // remaining chips
  committedThisStreet: number;   // chips committed on the current street
  committedTotal: number;        // chips committed this hand (drives side pots)
  hasActedThisStreet: boolean;   // had a chance to act since last raise
  holeCards?: Card[];            // only present for the local player or at showdown
}

export interface Pot {
  amount: number;
  eligibleSeats: number[];       // seats that may win this (sub)pot
}

export interface PokerConfig {
  smallBlind: number;
  bigBlind: number;
  actionTimerSec: number;
  maxPlayers: number;
}

export const DEFAULT_POKER_CONFIG: PokerConfig = {
  smallBlind: 5,
  bigBlind: 10,
  actionTimerSec: 20,
  maxPlayers: 8,
};

export interface ShowdownResult {
  seat: number;
  amountWon: number;
  handLabel: string;
}

/**
 * PUBLIC poker state. This is what lives in table_state.state_json and is
 * readable by every seated player. It must NEVER contain another player's
 * unrevealed hole cards (those live in poker_hole_cards, owner-readable only).
 */
export interface PokerPublicState {
  phase: 'waiting' | Street | 'payout';
  handNo: number;
  buttonSeat: number;
  blinds: { sb: number; bb: number };
  communityCards: Card[];        // 0 / 3 / 4 / 5
  seats: SeatState[];
  betToCall: number;             // highest committedThisStreet this street
  minRaise: number;              // minimum raise increment
  currentTurnSeat: number | null;
  lastAggressorSeat: number | null;
  turnDeadline?: number;         // epoch ms; when the current turn auto-acts
  results?: ShowdownResult[];    // set at payout
}

/** Hand category ranking (higher = better). */
export const HAND_CATEGORY = {
  HIGH_CARD: 0,
  ONE_PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
} as const;

export const HAND_CATEGORY_LABEL: Record<number, string> = {
  0: 'High Card',
  1: 'One Pair',
  2: 'Two Pair',
  3: 'Three of a Kind',
  4: 'Straight',
  5: 'Flush',
  6: 'Full House',
  7: 'Four of a Kind',
  8: 'Straight Flush',
};

export interface HandRank {
  category: number;     // HAND_CATEGORY value
  tiebreak: number[];   // compared element-by-element after category
  label: string;        // human-readable category label
}
