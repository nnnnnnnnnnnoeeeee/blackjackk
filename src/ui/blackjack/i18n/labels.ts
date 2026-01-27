// ============================================================================
// Internationalization - Labels (English)
// ============================================================================

/**
 * Centralized labels for blackjack UI components
 * All labels are in English for consistency
 */

export const labels = {
  // Actions
  actions: {
    hit: 'Hit',
    stand: 'Stand',
    double: 'Double',
    split: 'Split',
    surrender: 'Surrender',
    insurance: 'Insurance',
    deal: 'Deal',
    newHand: 'New Hand',
    clear: 'Clear',
    rebet: 'Rebet',
    allIn: 'All In',
    placeBet: 'Place Bet',
  },

  // Phases
  phases: {
    betting: 'Place Your Bet',
    dealing: 'Dealing...',
    playerTurn: 'Your Turn',
    dealerTurn: 'Dealer Playing',
    settlement: 'Settlement',
  },

  // Status
  status: {
    blackjack: 'BLACKJACK',
    bust: 'BUST',
    win: 'WIN',
    lose: 'LOSE',
    push: 'PUSH',
    surrender: 'SURRENDER',
    yourTurn: 'Your Turn',
    dealerPlaying: 'Dealer playing...',
    waiting: 'Waiting...',
  },

  // Betting
  betting: {
    yourBet: 'Your Bet',
    totalBet: 'Total Bet',
    sideBets: 'Side Bets',
    minimumBet: 'Minimum bet',
    maximumBet: 'Maximum bet',
    insufficientBankroll: 'Insufficient bankroll',
    addToBet: (value: number) => `Add $${value} to bet`,
    betAmount: (amount: number) => `Bet: $${amount}`,
    placeBetButton: 'Place Bet',
    placeBetAria: 'Place bet',
    clearButton: 'Clear',
    rebetButton: 'Rebet',
    allInButton: 'All In',
    clearBetAria: 'Clear bet',
    rebetLastBetAria: 'Rebet last bet',
    betAllAria: 'Bet all',
    betAmountSliderAria: 'Bet amount slider',
    cannotDealMinBetAria: 'Cannot deal: minimum bet not met',
    dealCardsAria: 'Deal cards',
    dealButton: 'Deal',
    minimumBetLabel: 'Minimum bet',
    errorTitle: 'Error',
    errorPlacingBet: 'Error placing bet',
    rebetUnavailableTitle: 'Rebet unavailable',
    rebetUnavailableDescription: 'Previous bet amount is invalid',
    totalSideBets: 'Total Side Bets',
    totalExceedsBankroll: 'Total exceeds bankroll',
    sideBetsTitle: 'Side Bets',
    perfectPairsLabel: 'Perfect Pairs',
    perfectPairsDescription: 'Win if your first 2 cards form a pair',
    twentyOnePlusThreeLabel: '21+3',
    twentyOnePlusThreeDescription: 'Your 2 cards + dealer\'s card = poker hand',
  },

  // Results
  results: {
    settlement: 'Settlement',
    roundResults: 'Round results',
    hand: (index: number) => `Hand ${index + 1}`,
    bet: 'Bet',
    payout: 'Payout',
    net: 'Net',
    totalResult: 'Total Result',
    hands: (count: number) => `${count} hand${count > 1 ? 's' : ''}`,
  },

  // Side Bets
  sideBets: {
    perfectPairs: 'Perfect Pairs',
    twentyOnePlus3: '21+3',
    howItWorks: 'How it works',
    perfectPairsDesc: 'Win if your first 2 cards form a pair',
    twentyOnePlus3Desc: 'Your 2 cards + dealer\'s card = poker hand',
    bet: (name: string) => `${name} Bet`,
    clear: (name: string) => `Clear ${name} bet`,
  },

  // Errors
  errors: {
    actionUnavailable: 'Action unavailable',
    cannotHit: 'Cannot hit: already stood',
    cannotStand: 'Cannot stand: already stood',
    cannotDouble: 'Can only double on first two cards',
    cannotSplit: 'Can only split with two cards',
    insufficientFunds: 'Insufficient bankroll',
    minimumBetRequired: (amount: number) => `Minimum bet is $${amount}`,
    maximumBetExceeded: (amount: number) => `Maximum bet is $${amount}`,
    timeExpired: 'Time expired',
    turnEnded: 'Your turn has ended',
    insufficientBankroll: 'Insufficient bankroll',
  },

  // Accessibility
  a11y: {
    settings: 'Settings',
    stats: 'Stats',
    strategy: 'Strategy',
    dealer: 'Dealer',
    opponents: 'Opponents',
    yourCards: 'Your Cards',
    bankroll: 'Bankroll',
    currentBet: 'Current bet',
    togglePanel: (name: string) => `Toggle ${name} panel`,
    timeRemaining: (seconds: number) => `Time remaining: ${seconds} seconds`,
    yourTurn: 'Your turn',
    notYourTurn: 'Not your turn',
    gamePhase: (phase: string) => `Game phase: ${phase}`,
  },
} as const;

// Helper function to get labels with dot notation
export function getLabel(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = labels;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to direct key lookup for backward compatibility
      const flatLabels: Record<string, string> = {
        your_bet: labels.betting.yourBet,
        clear_button: labels.actions.clear,
        rebet_button: labels.actions.rebet,
        all_in_button: labels.actions.allIn,
        clear_bet_aria: labels.betting.clearBetAria,
        rebet_last_bet_aria: labels.betting.rebetLastBetAria,
        bet_all_aria: labels.betting.betAllAria,
        bet_amount_slider_aria: labels.betting.betAmountSliderAria,
        cannot_deal_min_bet_aria: labels.betting.cannotDealMinBetAria,
        deal_cards_aria: labels.betting.dealCardsAria,
        deal_button: labels.betting.dealButton,
        minimum_bet: labels.betting.minimumBetLabel,
        error_title: labels.errors.actionUnavailable,
        error_placing_bet: labels.betting.errorPlacingBet,
        rebet_unavailable_title: labels.betting.rebetUnavailableTitle,
        rebet_unavailable_description: labels.betting.rebetUnavailableDescription,
        total_side_bets: labels.betting.totalSideBets,
        total_exceeds_bankroll: labels.betting.totalExceedsBankroll,
        side_bets_title: labels.betting.sideBetsTitle,
        perfect_pairs_label: labels.betting.perfectPairsLabel,
        perfect_pairs_description: labels.betting.perfectPairsDescription,
        twenty_one_plus_three_label: labels.betting.twentyOnePlusThreeLabel,
        twenty_one_plus_three_description: labels.betting.twentyOnePlusThreeDescription,
        place_bet_button: labels.betting.placeBetButton,
        place_bet_aria: labels.betting.placeBetAria,
        your_turn: labels.status.yourTurn,
        action_unavailable: labels.errors.actionUnavailable,
        insufficient_bankroll: labels.errors.insufficientBankroll,
      };
      return flatLabels[key] || key;
    }
  }

  if (typeof value === 'function' && params) {
    return value(params as any);
  }

  return typeof value === 'string' ? value : key;
}
