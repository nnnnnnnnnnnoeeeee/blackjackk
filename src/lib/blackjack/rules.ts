// ============================================================================
// Game Rules - Pure functions for action validation and dealer logic
// ============================================================================

import { GameConfig, GameState, Hand, PlayerAction } from './types';
import { getBestHandValue, isSoftHand, isBusted, isBlackjack, canSplit } from './hand';

/**
 * Checks if an action is valid for the current game state
 */
export function isActionValid(
  state: GameState,
  action: PlayerAction
): boolean {
  if (state.phase !== 'PLAYER_TURN') return false;
  
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return false;
  
  // Can't act on finished hands
  if (hand.isStood || hand.isBusted) return false;
  
  switch (action) {
    case 'hit':
      return canHit(hand);
    case 'stand':
      return canStand(hand);
    case 'double':
      return canDouble(hand, state.bankroll, state.config);
    case 'split':
      return canSplitHand(hand, state.splitCount, state.bankroll, state.config);
    case 'surrender':
      return canSurrender(hand, state.config);
    case 'insurance':
      return canInsure(state);
    default:
      return false;
  }
}

/**
 * Gets all valid actions for the current state
 */
export function getValidActions(state: GameState): PlayerAction[] {
  const actions: PlayerAction[] = [];
  
  if (state.phase !== 'PLAYER_TURN') return actions;
  
  const allActions: PlayerAction[] = ['hit', 'stand', 'double', 'split', 'surrender', 'insurance'];
  
  for (const action of allActions) {
    if (isActionValid(state, action)) {
      actions.push(action);
    }
  }
  
  return actions;
}

/**
 * Can always hit if hand is not stood or busted
 * Special rule: Cannot hit after splitting aces (only one card dealt)
 */
export function canHit(hand: Hand): boolean {
  if (hand.isSplitAces) return false; // Cannot hit after splitting aces
  return !hand.isStood && !hand.isBusted && !hand.isBlackjack;
}

/**
 * Can always stand if hand is not finished
 */
export function canStand(hand: Hand): boolean {
  return !hand.isStood && !hand.isBusted;
}

/**
 * Can double only on first two cards (or after split if allowed)
 */
export function canDouble(hand: Hand, bankroll: number, config: GameConfig): boolean {
  if (!config.allowDouble) return false;
  if (hand.isDoubled || hand.isStood || hand.isBusted) return false;
  if (hand.cards.length !== 2) return false;
  if (bankroll < hand.bet) return false; // Need to match the bet
  
  // Special rule: Cannot double after splitting aces
  if (hand.isSplitAces) return false;
  
  // If this is a split hand, check if double after split is allowed
  if (hand.isSplit && !config.allowDoubleAfterSplit) return false;
  
  return true;
}

/**
 * Can split if same value cards and haven't exceeded max splits
 */
/**
 * Can split if same value cards and haven't exceeded max splits
 * Uses splitCount from GameState instead of playerHands.length
 */
export function canSplitHand(
  hand: Hand,
  splitCount: number, // Use splitCount from GameState
  bankroll: number,
  config: GameConfig
): boolean {
  if (!config.allowSplit) return false;
  if (hand.isStood || hand.isBusted) return false;
  if (bankroll < hand.bet) return false; // Need to match the bet
  if (splitCount >= config.maxSplits) return false; // Check split limit
  
  return canSplit(hand, config.maxSplits, splitCount, config.resplitAces);
}

/**
 * Can surrender only on first two cards
 */
export function canSurrender(hand: Hand, config: GameConfig): boolean {
  if (!config.allowSurrender) return false;
  if (hand.isStood || hand.isBusted || hand.isSplit) return false;
  return hand.cards.length === 2;
}

/**
 * Can take insurance when dealer shows an ace
 */
export function canInsure(state: GameState): boolean {
  if (!state.config.allowInsurance) return false;
  if (state.insuranceBet > 0) return false; // Already took insurance
  
  const dealerUpCard = state.dealerHand.cards.find(c => c.faceUp);
  if (!dealerUpCard || dealerUpCard.rank !== 'A') return false;
  
  // Can only take insurance before any action
  const hand = state.playerHands[0];
  if (!hand || hand.cards.length !== 2) return false;
  
  // Must have enough bankroll for half the bet
  return state.bankroll >= state.currentBet / 2;
}

/**
 * Determines if dealer should hit
 */
export function shouldDealerHit(dealerCards: import('./types').Card[], hitsSoft17: boolean): boolean {
  const value = getBestHandValue(dealerCards);
  
  if (value > 21) return false; // Busted
  if (value >= 18) return false; // Stand on hard 18+
  if (value < 17) return true; // Always hit below 17
  
  // Exactly 17
  if (hitsSoft17) {
    // H17: hit on soft 17
    return isSoftHand(dealerCards);
  }
  
  // S17: stand on all 17s
  return false;
}

/**
 * Calculates payout for a player hand vs dealer
 */
export function calculatePayout(
  playerHand: Hand,
  dealerCards: import('./types').Card[],
  config: GameConfig,
  dealerHasBlackjack?: boolean // Optional explicit dealer blackjack status
): { result: import('./types').SettlementResult; payout: number } {
  const playerValue = getBestHandValue(playerHand.cards);
  const dealerValue = getBestHandValue(dealerCards);
  const playerBusted = playerValue > 21;
  const dealerBusted = dealerValue > 21;
  
  // Natural blackjack: EXACTLY 2 cards, A + 10/J/Q/K, NOT from split
  // Special case: Hands from splitting aces are never natural blackjacks (even if they have 21)
  const isNaturalBlackjack = playerHand.isBlackjack && 
                             playerHand.cards.length === 2 && 
                             !playerHand.isSplit &&
                             !playerHand.isSplitAces;
  
  // Use explicit dealer blackjack status if provided, otherwise calculate from cards
  const dealerBJ = dealerHasBlackjack !== undefined 
    ? dealerHasBlackjack 
    : (isBlackjack(dealerCards) && dealerCards.length === 2);
  
  const bet = playerHand.bet;
  
  // Handle surrender
  if (playerHand.isStood && playerHand.cards.length === 2 && bet === 0) {
    // This shouldn't happen with our implementation, but safety check
    return { result: 'surrender', payout: 0 };
  }
  
  // Player busted - loses immediately
  if (playerBusted) {
    return { result: 'lose', payout: 0 };
  }
  
  // Blackjack scenarios - CHECK THIS FIRST
  // If both have natural blackjack, it's a push (equal)
  if (isNaturalBlackjack && dealerBJ) {
    // Both have natural blackjack = push (égalité)
    return { result: 'push', payout: bet };
  }
  
  if (isNaturalBlackjack) {
    // Natural blackjack pays 3:2 (bet + bet * 1.5 = 2.5x bet total)
    const payout = bet + (bet * config.blackjackPayout);
    return { result: 'blackjack', payout };
  }
  
  if (dealerBJ) {
    return { result: 'lose', payout: 0 };
  }
  
  // Dealer busted - player wins
  if (dealerBusted) {
    return { result: 'win', payout: bet * 2 };
  }
  
  // Compare hands
  if (playerValue > dealerValue) {
    return { result: 'win', payout: bet * 2 };
  }
  
  if (dealerValue > playerValue) {
    return { result: 'lose', payout: 0 };
  }
  
  // Push
  return { result: 'push', payout: bet };
}

/**
 * Checks if all player hands are finished
 */
export function areAllHandsFinished(hands: Hand[]): boolean {
  return hands.every(h => h.isStood || h.isBusted || h.isBlackjack);
}

/**
 * Gets the next active hand index, or -1 if none
 */
export function getNextActiveHandIndex(hands: Hand[], currentIndex: number): number {
  for (let i = currentIndex + 1; i < hands.length; i++) {
    const hand = hands[i];
    if (!hand.isStood && !hand.isBusted && !hand.isBlackjack) {
      return i;
    }
  }
  return -1;
}

/**
 * Validates a bet amount
 */
export function isValidBet(amount: number, bankroll: number, config: GameConfig): boolean {
  // Permet de jouer les derniers jetons même si c'est moins que minBet
  // Si le montant est égal à la bankroll totale, on permet de jouer même si < minBet
  if (amount === bankroll && amount > 0) {
    return amount <= config.maxBet;
  }
  return amount >= config.minBet && amount <= config.maxBet && amount <= bankroll;
}
