// ============================================================================
// Blackjack Type Definitions
// ============================================================================

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface Hand {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isSplit: boolean;
  isStood: boolean;
  isBusted: boolean;
  isBlackjack: boolean;
}

export type GamePhase = 
  | 'BETTING'
  | 'DEALING'
  | 'PLAYER_TURN'
  | 'DEALER_TURN'
  | 'SETTLEMENT';

export type PlayerAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance';

export type SettlementResult = 'win' | 'lose' | 'push' | 'blackjack' | 'surrender';

export interface HandResult {
  handIndex: number;
  result: SettlementResult;
  payout: number;
}

export interface GameConfig {
  deckCount: number;
  blackjackPayout: number; // 1.5 for 3:2, 1.2 for 6:5
  dealerHitsSoft17: boolean; // H17 vs S17
  allowSplit: boolean;
  maxSplits: number;
  allowDouble: boolean;
  allowDoubleAfterSplit: boolean;
  allowSurrender: boolean;
  allowInsurance: boolean;
  minBet: number;
  maxBet: number;
  reshuffleThreshold: number; // Percentage (0-1) at which to reshuffle
}

export interface GameState {
  phase: GamePhase;
  shoe: Card[];
  dealerHand: Hand;
  playerHands: Hand[];
  activeHandIndex: number;
  bankroll: number;
  currentBet: number;
  insuranceBet: number;
  results: HandResult[];
  config: GameConfig;
}

export interface GameStats {
  handsPlayed: number;
  handsWon: number;
  handsLost: number;
  handsPushed: number;
  blackjacks: number;
  busts: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  biggestLoss: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  deckCount: 6,
  blackjackPayout: 1.5,
  dealerHitsSoft17: false, // S17 by default
  allowSplit: true,
  maxSplits: 1,
  allowDouble: true,
  allowDoubleAfterSplit: true,
  allowSurrender: false,
  allowInsurance: false,
  minBet: 10,
  maxBet: 1000,
  reshuffleThreshold: 0.25,
};

export const INITIAL_STATS: GameStats = {
  handsPlayed: 0,
  handsWon: 0,
  handsLost: 0,
  handsPushed: 0,
  blackjacks: 0,
  busts: 0,
  totalWagered: 0,
  totalWon: 0,
  biggestWin: 0,
  biggestLoss: 0,
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};
