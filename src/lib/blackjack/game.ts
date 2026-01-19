// ============================================================================
// Game Engine - State transitions and game flow (all pure functions)
// ============================================================================

import {
  GameState,
  GameConfig,
  GamePhase,
  Hand,
  Card,
  HandResult,
  DEFAULT_CONFIG,
  PlayerAction,
} from './types';
import { createShuffledShoe, drawCard, needsReshuffle } from './deck';
import { 
  createEmptyHand, 
  addCardToHand, 
  getBestHandValue, 
  isBusted,
  isBlackjack 
} from './hand';
import {
  isActionValid,
  shouldDealerHit,
  calculatePayout,
  areAllHandsFinished,
  getNextActiveHandIndex,
  isValidBet,
} from './rules';
import { evaluatePerfectPairs, evaluate21Plus3 } from './sidebets';

// ============================================================================
// Game Initialization
// ============================================================================

/**
 * Creates the initial game state
 */
export function createInitialState(
  bankroll: number = 1000,
  config: Partial<GameConfig> = {}
): GameState {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  return {
    phase: 'BETTING',
    shoe: createShuffledShoe(fullConfig.deckCount),
    dealerHand: createEmptyHand(),
    playerHands: [],
    activeHandIndex: 0,
    bankroll,
    currentBet: 0,
    insuranceBet: 0,
    sideBets: {},
    sideBetResults: undefined,
    results: [],
    config: fullConfig,
    handHistory: [],
  };
}

/**
 * Resets the game for a new round (preserves shoe and bankroll)
 */
export function resetForNewRound(state: GameState): GameState {
  // Check if we need to reshuffle
  let newShoe = state.shoe;
  if (needsReshuffle(state.shoe, state.config.deckCount, state.config.reshuffleThreshold)) {
    newShoe = createShuffledShoe(state.config.deckCount);
  }
  
  return {
    ...state,
    phase: 'BETTING',
    shoe: newShoe,
    dealerHand: createEmptyHand(),
    playerHands: [],
    activeHandIndex: 0,
    currentBet: 0,
    insuranceBet: 0,
    sideBets: {},
    sideBetResults: undefined,
    results: [],
  };
}

// ============================================================================
// Betting Phase
// ============================================================================

/**
 * Places a bet and prepares for dealing
 */
export function placeBet(state: GameState, amount: number): GameState {
  if (state.phase !== 'BETTING') {
    throw new Error('Cannot place bet outside of BETTING phase');
  }
  
  if (!isValidBet(amount, state.bankroll, state.config)) {
    throw new Error('Invalid bet amount');
  }
  
  return {
    ...state,
    currentBet: amount,
    bankroll: state.bankroll - amount,
    playerHands: [createEmptyHand(amount)],
  };
}

// ============================================================================
// Dealing Phase
// ============================================================================

/**
 * Deals initial cards to player and dealer
 */
export function dealInitialCards(state: GameState): GameState {
  if (state.phase !== 'BETTING' || state.currentBet === 0) {
    throw new Error('Cannot deal without a bet');
  }
  
  // Ensure playerHands exists and has at least one hand
  if (!state.playerHands || state.playerHands.length === 0) {
    throw new Error('Cannot deal without a player hand');
  }
  
  // Ensure shoe has enough cards (at least 4 for initial deal)
  if (!state.shoe || !Array.isArray(state.shoe) || state.shoe.length < 4) {
    throw new Error('Shoe does not have enough cards. Please reshuffle.');
  }
  
  let shoe = [...state.shoe];
  let playerCards: Card[] = [];
  let dealerCards: Card[] = [];
  
  // Deal in casino order: player, dealer, player, dealer (hole card face down)
  let card: Card;
  
  [card, shoe] = drawCard(shoe, true);
  playerCards.push(card);
  
  [card, shoe] = drawCard(shoe, true);
  dealerCards.push(card);
  
  [card, shoe] = drawCard(shoe, true);
  playerCards.push(card);
  
  [card, shoe] = drawCard(shoe, false); // Dealer hole card face down
  dealerCards.push(card);
  
  const existingHand = state.playerHands[0];
  const playerHand: Hand = {
    ...existingHand,
    cards: playerCards,
    isBlackjack: isBlackjack(playerCards),
  };
  
  const dealerHand: Hand = {
    ...createEmptyHand(),
    cards: dealerCards,
    isBlackjack: isBlackjack(dealerCards),
  };
  
  // Evaluate side bets after initial deal
  let sideBetResults = state.sideBetResults;
  if (state.sideBets.perfectPairs || state.sideBets.twentyOnePlus3) {
    sideBetResults = {};
    
    // Evaluate Perfect Pairs
    if (state.sideBets.perfectPairs && playerCards.length === 2) {
      const ppResult = evaluatePerfectPairs(
        [playerCards[0], playerCards[1]],
        state.config.perfectPairs.payouts
      );
      sideBetResults.perfectPairs = {
        bet: state.sideBets.perfectPairs,
        tier: ppResult.tier,
        payout: ppResult.win ? state.sideBets.perfectPairs * (ppResult.payoutMultiplier + 1) : 0,
      };
    }
    
    // Evaluate 21+3
    if (state.sideBets.twentyOnePlus3 && playerCards.length === 2 && dealerCards.length >= 1) {
      const dealerUpCard = dealerCards.find(c => c.faceUp) || dealerCards[0];
      const t21Result = evaluate21Plus3(
        [playerCards[0], playerCards[1]],
        dealerUpCard,
        state.config.twentyOnePlus3.payouts
      );
      sideBetResults.twentyOnePlus3 = {
        bet: state.sideBets.twentyOnePlus3,
        handType: t21Result.handType,
        payout: t21Result.win ? state.sideBets.twentyOnePlus3 * (t21Result.payoutMultiplier + 1) : 0,
      };
    }
  }
  
  // Determine next phase
  let nextPhase: GamePhase = 'PLAYER_TURN';
  
  // If player has blackjack, skip to dealer turn (for potential dealer BJ check)
  if (playerHand.isBlackjack) {
    nextPhase = 'DEALER_TURN';
  }
  
  return {
    ...state,
    phase: nextPhase,
    shoe,
    dealerHand,
    playerHands: [playerHand],
    activeHandIndex: 0,
    sideBetResults,
  };
}

// ============================================================================
// Player Actions
// ============================================================================

/**
 * Executes a player action
 */
export function executeAction(state: GameState, action: PlayerAction): GameState {
  if (!isActionValid(state, action)) {
    throw new Error(`Invalid action: ${action}`);
  }
  
  switch (action) {
    case 'hit':
      return executeHit(state);
    case 'stand':
      return executeStand(state);
    case 'double':
      return executeDouble(state);
    case 'split':
      return executeSplit(state);
    case 'surrender':
      return executeSurrender(state);
    case 'insurance':
      return executeInsurance(state);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function executeHit(state: GameState): GameState {
  const [card, newShoe] = drawCard(state.shoe, true);
  const handIndex = state.activeHandIndex;
  const hand = state.playerHands[handIndex];
  
  if (!hand) {
    throw new Error(`No hand at index ${handIndex}`);
  }
  
  const newHand = addCardToHand(hand, card);
  const newHands = [...state.playerHands];
  newHands[handIndex] = newHand;
  
  let newState: GameState = {
    ...state,
    shoe: newShoe,
    playerHands: newHands,
  };
  
  // If busted, move to next hand or dealer
  if (newHand.isBusted) {
    newState = moveToNextHand(newState);
  }
  
  return newState;
}

function executeStand(state: GameState): GameState {
  const handIndex = state.activeHandIndex;
  const hand = state.playerHands[handIndex];
  
  if (!hand) {
    throw new Error(`No hand at index ${handIndex}`);
  }
  
  const newHands = [...state.playerHands];
  newHands[handIndex] = { ...hand, isStood: true };
  
  const newState: GameState = {
    ...state,
    playerHands: newHands,
  };
  
  return moveToNextHand(newState);
}

function executeDouble(state: GameState): GameState {
  const handIndex = state.activeHandIndex;
  const hand = state.playerHands[handIndex];
  
  if (!hand) {
    throw new Error(`No hand at index ${handIndex}`);
  }
  
  const additionalBet = hand.bet;
  
  // Validate bankroll is sufficient
  if (state.bankroll < additionalBet) {
    throw new Error('Insufficient bankroll for double');
  }
  
  // Draw one card
  const [card, newShoe] = drawCard(state.shoe, true);
  const newHand: Hand = {
    ...addCardToHand(hand, card),
    bet: hand.bet * 2,
    isDoubled: true,
    isStood: true, // Automatically stand after double
  };
  
  const newHands = [...state.playerHands];
  newHands[handIndex] = newHand;
  
  const newState: GameState = {
    ...state,
    shoe: newShoe,
    bankroll: state.bankroll - additionalBet,
    playerHands: newHands,
  };
  
  return moveToNextHand(newState);
}

function executeSplit(state: GameState): GameState {
  const handIndex = state.activeHandIndex;
  
  // Validate inputs
  if (!Array.isArray(state.playerHands) || state.playerHands.length === 0) {
    throw new Error('Invalid state: playerHands is empty');
  }
  
  if (handIndex < 0 || handIndex >= state.playerHands.length) {
    throw new Error(`Invalid hand index: ${handIndex} (total hands: ${state.playerHands.length})`);
  }
  
  const hand = state.playerHands[handIndex];
  
  if (!hand) {
    throw new Error(`No hand at index ${handIndex}`);
  }
  
  if (!Array.isArray(hand.cards) || hand.cards.length !== 2) {
    throw new Error('Can only split hands with exactly 2 cards');
  }
  
  // Validate bankroll is sufficient for the additional bet
  if (state.bankroll < hand.bet) {
    throw new Error('Insufficient bankroll for split');
  }
  
  // Ensure shoe has enough cards (need at least 2 for split)
  // Reshuffle if needed instead of throwing error
  let shoe = [...state.shoe];
  if (!shoe || !Array.isArray(shoe) || shoe.length < 2) {
    console.warn('[executeSplit] Reshuffling shoe - not enough cards');
    shoe = createShuffledShoe(state.config.deckCount);
  }
  
  const [card1, card2] = hand.cards;
  
  // Create two new hands from the split
  const hand1: Hand = {
    ...createEmptyHand(hand.bet),
    cards: [card1],
    isSplit: true,
  };
  
  const hand2: Hand = {
    ...createEmptyHand(hand.bet),
    cards: [card2],
    isSplit: true,
  };
  
  // Draw one card for each hand
  let newCard1: Card;
  let newCard2: Card;
  
  try {
    [newCard1, shoe] = drawCard(shoe, true);
    [newCard2, shoe] = drawCard(shoe, true);
  } catch (error) {
    // If drawCard fails, reshuffle and try again
    console.warn('[executeSplit] Error drawing cards, reshuffling:', error);
    shoe = createShuffledShoe(state.config.deckCount);
    [newCard1, shoe] = drawCard(shoe, true);
    [newCard2, shoe] = drawCard(shoe, true);
  }
  
  const newHand1 = addCardToHand(hand1, newCard1);
  const newHand2 = addCardToHand(hand2, newCard2);
  
  // If a hand gets blackjack after split, it's automatically finished
  // (Note: Split blackjacks are usually not treated as natural blackjacks, but we still mark them as finished)
  const finalHand1: Hand = newHand1.isBlackjack 
    ? { ...newHand1, isStood: true }
    : newHand1;
  const finalHand2: Hand = newHand2.isBlackjack 
    ? { ...newHand2, isStood: true }
    : newHand2;
  
  // Replace current hand with two new hands
  const newHands = [...state.playerHands];
  newHands.splice(handIndex, 1, finalHand1, finalHand2);
  
  // Validate newHands array
  if (!Array.isArray(newHands) || newHands.length === 0) {
    throw new Error('Failed to create new hands array after split');
  }
  
  // Determine next active hand using simplified logic
  // First, try the first split hand (at handIndex)
  let nextActiveIndex = handIndex;
  
  // Check if first hand is finished
  if (finalHand1.isStood || finalHand1.isBusted || finalHand1.isBlackjack) {
    // First hand is finished, try second hand (at handIndex + 1)
    if (handIndex + 1 < newHands.length) {
      nextActiveIndex = handIndex + 1;
      
      // Check if second hand is also finished
      if (finalHand2.isStood || finalHand2.isBusted || finalHand2.isBlackjack) {
        // Both split hands are finished, find next available hand
        // Search from the beginning to find any active hand
        const activeIndex = newHands.findIndex(h => !h.isStood && !h.isBusted && !h.isBlackjack);
        if (activeIndex !== -1) {
          nextActiveIndex = activeIndex;
        } else {
          // No active hands found - all hands are finished
          nextActiveIndex = 0; // Fallback index
        }
      }
    } else {
      // handIndex + 1 is out of bounds, search for any active hand
      const activeIndex = newHands.findIndex(h => !h.isStood && !h.isBusted && !h.isBlackjack);
      if (activeIndex !== -1) {
        nextActiveIndex = activeIndex;
      } else {
        nextActiveIndex = 0; // Fallback
      }
    }
  }
  
  // Final validation of nextActiveIndex
  if (nextActiveIndex < 0 || nextActiveIndex >= newHands.length) {
    console.warn('[executeSplit] Invalid nextActiveIndex, resetting to 0');
    nextActiveIndex = 0;
  }
  
  // Check if all hands are finished
  const allFinished = areAllHandsFinished(newHands);
  
  const newState: GameState = {
    ...state,
    shoe,
    bankroll: state.bankroll - hand.bet, // Second hand costs another bet
    playerHands: newHands,
    activeHandIndex: nextActiveIndex,
    phase: allFinished ? 'DEALER_TURN' : 'PLAYER_TURN',
  };
  
  return newState;
}

function executeSurrender(state: GameState): GameState {
  const handIndex = state.activeHandIndex;
  const hand = state.playerHands[handIndex];
  
  if (!hand) {
    throw new Error(`No hand at index ${handIndex}`);
  }
  
  // Return half the bet
  const refund = hand.bet / 2;
  
  const newHands = [...state.playerHands];
  newHands[handIndex] = { 
    ...hand, 
    isStood: true,
    bet: 0, // Mark as surrendered by zeroing bet
  };
  
  const newState: GameState = {
    ...state,
    bankroll: state.bankroll + refund,
    playerHands: newHands,
    results: [...state.results, { handIndex, result: 'surrender', payout: refund }],
  };
  
  return moveToNextHand(newState);
}

export function executeInsurance(state: GameState): GameState {
  const insuranceAmount = state.currentBet / 2;
  
  // Validate bankroll is sufficient
  if (state.bankroll < insuranceAmount) {
    throw new Error('Insufficient bankroll for insurance');
  }
  
  // Validate insurance hasn't already been taken
  if (state.insuranceBet > 0) {
    throw new Error('Insurance already taken');
  }
  
  return {
    ...state,
    bankroll: state.bankroll - insuranceAmount,
    insuranceBet: insuranceAmount,
  };
}

/**
 * Moves to the next active hand or dealer turn
 */
function moveToNextHand(state: GameState): GameState {
  const nextIndex = getNextActiveHandIndex(state.playerHands, state.activeHandIndex);
  
  if (nextIndex === -1) {
    // All hands finished, move to dealer turn
    return {
      ...state,
      phase: 'DEALER_TURN',
    };
  }
  
  return {
    ...state,
    activeHandIndex: nextIndex,
  };
}

// ============================================================================
// Dealer Turn
// ============================================================================

/**
 * Reveals dealer hole card
 */
export function revealDealerCard(state: GameState): GameState {
  if (state.phase !== 'DEALER_TURN') {
    throw new Error('Cannot reveal dealer card outside of DEALER_TURN');
  }
  
  const newCards = state.dealerHand.cards.map(c => ({ ...c, faceUp: true }));
  
  return {
    ...state,
    dealerHand: {
      ...state.dealerHand,
      cards: newCards,
      isBlackjack: isBlackjack(newCards),
    },
  };
}

/**
 * Dealer draws one card (if needed)
 */
export function dealerDrawCard(state: GameState): GameState {
  if (state.phase !== 'DEALER_TURN') {
    throw new Error('Cannot draw dealer card outside of DEALER_TURN');
  }
  
  if (!shouldDealerHit(state.dealerHand.cards, state.config.dealerHitsSoft17)) {
    return state;
  }
  
  const [card, newShoe] = drawCard(state.shoe, true);
  const newDealerHand = addCardToHand(state.dealerHand, card);
  
  return {
    ...state,
    shoe: newShoe,
    dealerHand: newDealerHand,
  };
}

/**
 * Plays out the entire dealer turn
 */
export function playDealerTurn(state: GameState): GameState {
  if (state.phase !== 'DEALER_TURN') {
    throw new Error('Cannot play dealer turn outside of DEALER_TURN');
  }
  
  // First reveal the hole card
  let newState = revealDealerCard(state);
  
  // Check if all player hands busted - no need to draw
  const allBusted = state.playerHands.every(h => h.isBusted);
  
  if (!allBusted) {
    // Dealer draws until they should stand
    while (shouldDealerHit(newState.dealerHand.cards, newState.config.dealerHitsSoft17)) {
      newState = dealerDrawCard(newState);
    }
  }
  
  // Move to settlement
  return {
    ...newState,
    phase: 'SETTLEMENT',
    dealerHand: {
      ...newState.dealerHand,
      isBusted: isBusted(newState.dealerHand.cards),
    },
  };
}

// ============================================================================
// Settlement
// ============================================================================

/**
 * Settles all bets and calculates payouts
 */
export function settleHands(state: GameState): GameState {
  if (state.phase !== 'SETTLEMENT') {
    throw new Error('Cannot settle outside of SETTLEMENT phase');
  }
  
  const results: HandResult[] = [];
  let totalPayout = 0;
  
  // Handle insurance first (insurance pays 2:1 if dealer has blackjack)
  if (state.insuranceBet > 0) {
    if (state.dealerHand.isBlackjack) {
      // Insurance pays 2:1 (bet + 2x bet = 3x total)
      totalPayout += state.insuranceBet * 3;
    }
    // If dealer doesn't have blackjack, insurance is lost (already deducted from bankroll)
  }
  
  // Handle side bets (already evaluated in dealInitialCards, just add payouts)
  if (state.sideBetResults) {
    if (state.sideBetResults.perfectPairs) {
      totalPayout += state.sideBetResults.perfectPairs.payout;
    }
    if (state.sideBetResults.twentyOnePlus3) {
      totalPayout += state.sideBetResults.twentyOnePlus3.payout;
    }
  }
  
  // Calculate results for each hand
  for (let i = 0; i < state.playerHands.length; i++) {
    const hand = state.playerHands[i];
    
    // Skip already settled hands (surrendered)
    if (hand.bet === 0 && state.results.some(r => r.handIndex === i)) {
      const existingResult = state.results.find(r => r.handIndex === i);
      if (existingResult) {
        results.push(existingResult);
      }
      continue;
    }
    
    const { result, payout } = calculatePayout(hand, state.dealerHand.cards, state.config);
    results.push({ handIndex: i, result, payout });
    totalPayout += payout;
  }
  
  // Ensure bankroll never goes negative (safety check)
  const newBankroll = Math.max(0, state.bankroll + totalPayout);
  
  return {
    ...state,
    bankroll: newBankroll,
    results,
  };
}

// ============================================================================
// Full Game Flow Helpers
// ============================================================================

/**
 * Starts a new round with a bet
 */
export function startRound(state: GameState, bet: number): GameState {
  const afterBet = placeBet(state, bet);
  return dealInitialCards(afterBet);
}

/**
 * Completes the round after all player actions
 */
export function completeRound(state: GameState): GameState {
  if (state.phase === 'PLAYER_TURN') {
    // Shouldn't happen, but handle gracefully
    return state;
  }
  
  if (state.phase === 'DEALER_TURN') {
    const afterDealer = playDealerTurn(state);
    return settleHands(afterDealer);
  }
  
  if (state.phase === 'SETTLEMENT') {
    return settleHands(state);
  }
  
  return state;
}

/**
 * Gets summary info about the current game state
 */
export function getGameSummary(state: GameState): {
  phase: GamePhase;
  playerValue: number;
  dealerValue: number;
  dealerShowing: number;
  canAct: boolean;
  isRoundOver: boolean;
} {
  const activeHand = state.playerHands[state.activeHandIndex];
  const playerValue = activeHand ? getBestHandValue(activeHand.cards) : 0;
  
  const dealerFaceUp = state.dealerHand.cards.filter(c => c.faceUp);
  const dealerShowing = dealerFaceUp.length > 0 ? getBestHandValue(dealerFaceUp) : 0;
  const dealerValue = getBestHandValue(state.dealerHand.cards);
  
  return {
    phase: state.phase,
    playerValue,
    dealerValue: state.phase === 'SETTLEMENT' || state.phase === 'DEALER_TURN' ? dealerValue : dealerShowing,
    dealerShowing,
    canAct: state.phase === 'PLAYER_TURN' && !!activeHand && !activeHand.isStood && !activeHand.isBusted,
    isRoundOver: state.phase === 'SETTLEMENT',
  };
}
