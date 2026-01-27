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
  isSplitAces: boolean; // True if this hand came from splitting aces (special rules apply)
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

export interface PerfectPairsConfig {
  enabled: boolean;
  minBet: number;
  maxBet: number;
  payouts: {
    mixed: number;
    colored: number;
    perfect: number;
  };
}

export interface TwentyOnePlus3Config {
  enabled: boolean;
  minBet: number;
  maxBet: number;
  payouts: {
    flush: number;
    straight: number;
    threeOfAKind: number;
    straightFlush: number;
    suitedTrips: number;
  };
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
  resplitAces: boolean;
  minBet: number;
  maxBet: number;
  reshuffleThreshold: number; // Percentage (0-1) at which to reshuffle
  perfectPairs: PerfectPairsConfig;
  twentyOnePlus3: TwentyOnePlus3Config;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
}

export interface SideBetResults {
  perfectPairs?: {
    bet: number;
    tier: 'none' | 'mixed' | 'colored' | 'perfect';
    payout: number;
  };
  twentyOnePlus3?: {
    bet: number;
    handType: 'none' | 'flush' | 'straight' | 'threeOfAKind' | 'straightFlush' | 'suitedTrips';
    payout: number;
  };
}

export interface HandHistory {
  id: string;
  timestamp: number;
  playerCards: Card[][];
  dealerCards: Card[];
  bets: number[];
  actions: Array<{ handIndex: number; action: PlayerAction; timestamp: number }>;
  results: HandResult[];
  totalPayout: number;
  netResult: number;
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
  sideBets: {
    perfectPairs?: number;
    twentyOnePlus3?: number;
  };
  sideBetResults?: SideBetResults;
  results: HandResult[];
  config: GameConfig;
  handHistory?: HandHistory[]; // Last 50 hands
  splitCount: number; // Global counter for splits in current round (0-4 max)
}

export interface CardCountingStats {
  runningCount: number;
  trueCount: number;
  cardsSeen: number;
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
  cardCounting?: CardCountingStats;
}

export const DEFAULT_CONFIG: GameConfig = {
  deckCount: 6,
  blackjackPayout: 1.5,
  dealerHitsSoft17: false, // S17 by default
  allowSplit: true,
  maxSplits: 4, // Allow up to 4 splits (5 hands max)
  allowDouble: true,
  allowDoubleAfterSplit: true,
  allowSurrender: false,
  allowInsurance: true,
  resplitAces: false, // No resplit aces by default
  minBet: 10,
  maxBet: 1000,
  reshuffleThreshold: 0.25,
  perfectPairs: {
    enabled: false,
    minBet: 5,
    maxBet: 500,
    payouts: {
      mixed: 5,
      colored: 10,
      perfect: 25,
    },
  },
  twentyOnePlus3: {
    enabled: false,
    minBet: 5,
    maxBet: 500,
    payouts: {
      flush: 5,
      straight: 10,
      threeOfAKind: 30,
      straightFlush: 40,
      suitedTrips: 100,
    },
  },
  soundEnabled: false, // OFF by default
  soundVolume: 0.5, // 50% volume
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
