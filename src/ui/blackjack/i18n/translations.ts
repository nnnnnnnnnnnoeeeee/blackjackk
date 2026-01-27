// ============================================================================
// Internationalization - Translations (French & English)
// ============================================================================

export type Language = 'fr' | 'en';

export interface Translations {
  // Actions
  actions: {
    hit: string;
    stand: string;
    double: string;
    split: string;
    surrender: string;
    insurance: string;
    deal: string;
    newHand: string;
    clear: string;
    rebet: string;
    allIn: string;
    placeBet: string;
  };

  // Phases
  phases: {
    betting: string;
    dealing: string;
    playerTurn: string;
    dealerTurn: string;
    settlement: string;
  };

  // Status
  status: {
    blackjack: string;
    bust: string;
    win: string;
    lose: string;
    push: string;
    surrender: string;
    yourTurn: string;
    dealerPlaying: string;
    waiting: string;
  };

  // Betting
  betting: {
    yourBet: string;
    totalBet: string;
    sideBets: string;
    minimumBet: string;
    maximumBet: string;
    insufficientBankroll: string;
    addToBet: (value: number) => string;
    betAmount: (amount: number) => string;
    placeBetButton: string;
    placeBetAria: string;
    clearButton: string;
    rebetButton: string;
    allInButton: string;
    clearBetAria: string;
    rebetLastBetAria: string;
    betAllAria: string;
    betAmountSliderAria: string;
    cannotDealMinBetAria: string;
    dealCardsAria: string;
    dealButton: string;
    minimumBetLabel: string;
    errorTitle: string;
    errorPlacingBet: string;
    rebetUnavailableTitle: string;
    rebetUnavailableDescription: string;
    totalSideBets: string;
    totalExceedsBankroll: string;
    sideBetsTitle: string;
    perfectPairsLabel: string;
    perfectPairsDescription: string;
    twentyOnePlusThreeLabel: string;
    twentyOnePlusThreeDescription: string;
  };

  // Results
  results: {
    settlement: string;
    roundResults: string;
    hand: (index: number) => string;
    bet: string;
    payout: string;
    net: string;
    totalResult: string;
    hands: (count: number) => string;
  };

  // Side Bets
  sideBets: {
    perfectPairs: string;
    twentyOnePlus3: string;
    howItWorks: string;
    perfectPairsDesc: string;
    twentyOnePlus3Desc: string;
    bet: (name: string) => string;
    clear: (name: string) => string;
  };

  // Errors
  errors: {
    actionUnavailable: string;
    cannotHit: string;
    cannotStand: string;
    cannotDouble: string;
    cannotSplit: string;
    insufficientFunds: string;
    minimumBetRequired: (amount: number) => string;
    maximumBetExceeded: (amount: number) => string;
    timeExpired: string;
    turnEnded: string;
    insufficientBankroll: string;
  };

  // Accessibility
  a11y: {
    settings: string;
    stats: string;
    strategy: string;
    dealer: string;
    opponents: string;
    yourCards: string;
    bankroll: string;
    currentBet: string;
    togglePanel: (name: string) => string;
    timeRemaining: (seconds: number) => string;
    yourTurn: string;
    notYourTurn: string;
    gamePhase: (phase: string) => string;
  };

    // Settings
    settings: {
      title: string;
      dealerRules: string;
      playerRules: string;
      sideBets: string;
      soundSettings: string;
      language: string;
      keyBindings: string;
      dealerHitsSoft17: string;
      dealerHitsSoft17Desc: string;
      doubleAfterSplit: string;
      doubleAfterSplitDesc: string;
      resplitAces: string;
      resplitAcesDesc: string;
      maxSplits: string;
      perfectPairs: string;
      perfectPairsDesc: string;
      twentyOnePlus3: string;
      twentyOnePlus3Desc: string;
      enableSounds: string;
      enableSoundsDesc: string;
      volume: string;
      keyBindingsDesc: string;
      hitKey: string;
      standKey: string;
      doubleKey: string;
      splitKey: string;
      insuranceKey: string;
      surrenderKey: string;
      clearKey: string;
      rebetKey: string;
      allInKey: string;
      dealKey: string;
      pressKey: string;
      resetToDefault: string;
    };

  // Common
  common: {
    back: string;
    newRound: string;
    startOver: string;
    outOfChips: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
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

    // Settings
    settings: {
      title: 'Game Settings',
      dealerRules: 'Dealer Rules',
      playerRules: 'Player Rules',
      sideBets: 'Side Bets',
      soundSettings: 'Sound Settings',
      language: 'Language',
      keyBindings: 'Keyboard Shortcuts',
      dealerHitsSoft17: 'Dealer Hits Soft 17 (H17)',
      dealerHitsSoft17Desc: 'When OFF: Dealer stands on all 17s (S17)',
      doubleAfterSplit: 'Double After Split (DAS)',
      doubleAfterSplitDesc: 'Allow doubling on hands created by splitting',
      resplitAces: 'Resplit Aces',
      resplitAcesDesc: 'Allow resplitting aces (up to max splits)',
      maxSplits: 'Max Splits',
      perfectPairs: 'Perfect Pairs',
      perfectPairsDesc: 'Bet on matching pairs in your initial hand',
      twentyOnePlus3: '21+3',
      twentyOnePlus3Desc: 'Bet on poker hand with your 2 cards + dealer upcard',
      enableSounds: 'Enable Sounds',
      enableSoundsDesc: 'Play sound effects during gameplay',
      volume: 'Volume',
      keyBindingsDesc: 'Customize keyboard shortcuts for game actions',
      hitKey: 'Hit',
      standKey: 'Stand',
      doubleKey: 'Double',
      splitKey: 'Split',
      insuranceKey: 'Insurance',
      surrenderKey: 'Surrender',
      clearKey: 'Clear',
      rebetKey: 'Rebet',
      allInKey: 'All In',
      dealKey: 'Deal',
      pressKey: 'Press a key',
      resetToDefault: 'Reset to Default',
    },

    // Common
    common: {
      back: 'Back',
      newRound: 'New Hand',
      startOver: 'Start Over ($1,000)',
      outOfChips: 'Out of chips!',
    },
  },

  fr: {
    // Actions
    actions: {
      hit: 'Tirer',
      stand: 'Rester',
      double: 'Doubler',
      split: 'Séparer',
      surrender: 'Abandonner',
      insurance: 'Assurance',
      deal: 'Distribuer',
      newHand: 'Nouvelle Main',
      clear: 'Effacer',
      rebet: 'Remiser',
      allIn: 'Tout Miser',
      placeBet: 'Placer la Mise',
    },

    // Phases
    phases: {
      betting: 'Placez Votre Mise',
      dealing: 'Distribution...',
      playerTurn: 'Votre Tour',
      dealerTurn: 'Tour du Croupier',
      settlement: 'Règlement',
    },

    // Status
    status: {
      blackjack: 'BLACKJACK',
      bust: 'DÉPASSÉ',
      win: 'GAGNÉ',
      lose: 'PERDU',
      push: 'ÉGALITÉ',
      surrender: 'ABANDON',
      yourTurn: 'Votre Tour',
      dealerPlaying: 'Le croupier joue...',
      waiting: 'En attente...',
    },

    // Betting
    betting: {
      yourBet: 'Votre Mise',
      totalBet: 'Mise Totale',
      sideBets: 'Paris Supplémentaires',
      minimumBet: 'Mise minimale',
      maximumBet: 'Mise maximale',
      insufficientBankroll: 'Fonds insuffisants',
      addToBet: (value: number) => `Ajouter $${value} à la mise`,
      betAmount: (amount: number) => `Mise : $${amount}`,
      placeBetButton: 'Placer la Mise',
      placeBetAria: 'Placer la mise',
      clearButton: 'Effacer',
      rebetButton: 'Remiser',
      allInButton: 'Tout Miser',
      clearBetAria: 'Effacer la mise',
      rebetLastBetAria: 'Remiser la dernière mise',
      betAllAria: 'Tout miser',
      betAmountSliderAria: 'Curseur de montant de mise',
      cannotDealMinBetAria: 'Impossible de distribuer : mise minimale non atteinte',
      dealCardsAria: 'Distribuer les cartes',
      dealButton: 'Distribuer',
      minimumBetLabel: 'Mise minimale',
      errorTitle: 'Erreur',
      errorPlacingBet: 'Erreur lors du placement de la mise',
      rebetUnavailableTitle: 'Remise indisponible',
      rebetUnavailableDescription: 'Le montant de la mise précédente est invalide',
      totalSideBets: 'Total des Paris Supplémentaires',
      totalExceedsBankroll: 'Le total dépasse les fonds disponibles',
      sideBetsTitle: 'Paris Supplémentaires',
      perfectPairsLabel: 'Paires Parfaites',
      perfectPairsDescription: 'Gagnez si vos 2 premières cartes forment une paire',
      twentyOnePlusThreeLabel: '21+3',
      twentyOnePlusThreeDescription: 'Vos 2 cartes + la carte du croupier = main de poker',
    },

    // Results
    results: {
      settlement: 'Règlement',
      roundResults: 'Résultats du tour',
      hand: (index: number) => `Main ${index + 1}`,
      bet: 'Mise',
      payout: 'Gains',
      net: 'Net',
      totalResult: 'Résultat Total',
      hands: (count: number) => `${count} main${count > 1 ? 's' : ''}`,
    },

    // Side Bets
    sideBets: {
      perfectPairs: 'Paires Parfaites',
      twentyOnePlus3: '21+3',
      howItWorks: 'Comment ça marche',
      perfectPairsDesc: 'Gagnez si vos 2 premières cartes forment une paire',
      twentyOnePlus3Desc: 'Vos 2 cartes + la carte du croupier = main de poker',
      bet: (name: string) => `Pari ${name}`,
      clear: (name: string) => `Effacer le pari ${name}`,
    },

    // Errors
    errors: {
      actionUnavailable: 'Action indisponible',
      cannotHit: 'Impossible de tirer : déjà resté',
      cannotStand: 'Impossible de rester : déjà resté',
      cannotDouble: 'On ne peut doubler qu\'avec les deux premières cartes',
      cannotSplit: 'On ne peut séparer qu\'avec deux cartes',
      insufficientFunds: 'Fonds insuffisants',
      minimumBetRequired: (amount: number) => `La mise minimale est de $${amount}`,
      maximumBetExceeded: (amount: number) => `La mise maximale est de $${amount}`,
      timeExpired: 'Temps écoulé',
      turnEnded: 'Votre tour est terminé',
      insufficientBankroll: 'Fonds insuffisants',
    },

    // Accessibility
    a11y: {
      settings: 'Paramètres',
      stats: 'Statistiques',
      strategy: 'Stratégie',
      dealer: 'Croupier',
      opponents: 'Adversaires',
      yourCards: 'Vos Cartes',
      bankroll: 'Fonds',
      currentBet: 'Mise actuelle',
      togglePanel: (name: string) => `Basculer le panneau ${name}`,
      timeRemaining: (seconds: number) => `Temps restant : ${seconds} secondes`,
      yourTurn: 'Votre tour',
      notYourTurn: 'Ce n\'est pas votre tour',
      gamePhase: (phase: string) => `Phase du jeu : ${phase}`,
    },

    // Settings
    settings: {
      title: 'Paramètres du Jeu',
      dealerRules: 'Règles du Croupier',
      playerRules: 'Règles du Joueur',
      sideBets: 'Paris Supplémentaires',
      soundSettings: 'Paramètres Audio',
      language: 'Langue',
      keyBindings: 'Raccourcis Clavier',
      dealerHitsSoft17: 'Le Croupier Tire sur 17 Doux (H17)',
      dealerHitsSoft17Desc: 'Quand DÉSACTIVÉ : Le croupier reste sur tous les 17 (S17)',
      doubleAfterSplit: 'Doubler Après Séparation (DAS)',
      doubleAfterSplitDesc: 'Permettre de doubler sur les mains créées par séparation',
      resplitAces: 'Re-séparer les As',
      resplitAcesDesc: 'Permettre de re-séparer les as (jusqu\'au nombre max de séparations)',
      maxSplits: 'Séparations Max',
      perfectPairs: 'Paires Parfaites',
      perfectPairsDesc: 'Parier sur des paires correspondantes dans votre main initiale',
      twentyOnePlus3: '21+3',
      twentyOnePlus3Desc: 'Parier sur une main de poker avec vos 2 cartes + la carte visible du croupier',
      enableSounds: 'Activer les Sons',
      enableSoundsDesc: 'Jouer des effets sonores pendant le jeu',
      volume: 'Volume',
      keyBindingsDesc: 'Personnaliser les raccourcis clavier pour les actions du jeu',
      hitKey: 'Tirer',
      standKey: 'Rester',
      doubleKey: 'Doubler',
      splitKey: 'Séparer',
      insuranceKey: 'Assurance',
      surrenderKey: 'Abandonner',
      clearKey: 'Effacer',
      rebetKey: 'Rejouer',
      allInKey: 'Tout Miser',
      dealKey: 'Distribuer',
      pressKey: 'Appuyez sur une touche',
      resetToDefault: 'Réinitialiser',
    },

    // Common
    common: {
      back: 'Retour',
      newRound: 'Nouvelle Main',
      startOver: 'Recommencer ($1,000)',
      outOfChips: 'Plus de jetons !',
    },
  },
};
