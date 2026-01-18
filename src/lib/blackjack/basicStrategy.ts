// ============================================================================
// Basic Strategy Chart - Optimal play decisions
// ============================================================================

import { Card, Rank } from './types';
import { getBestHandValue } from './hand';

export type StrategyAction = 'H' | 'S' | 'D' | 'P' | 'DS' | 'DH' | 'RH' | 'RS';

export interface StrategyRecommendation {
  action: StrategyAction;
  explanation: string;
}

// Basic Strategy Chart
// Rows: Player hand value or pair
// Columns: Dealer upcard value
const BASIC_STRATEGY: Record<string, Record<string, StrategyAction>> = {
  // Hard totals (no Ace or Ace counted as 1)
  '5': { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '6': { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '7': { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '8': { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '9': { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '10': { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'H', 'A': 'H' },
  '11': { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'D', 'A': 'D' },
  '12': { '2': 'H', '3': 'H', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '13': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '14': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '15': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'RH', 'A': 'H' },
  '16': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'RH', '10': 'RH', 'A': 'RH' },
  '17': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  '18': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  '19': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  '20': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  '21': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  
  // Soft totals (Ace counted as 11)
  'A2': { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  'A3': { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  'A4': { '2': 'H', '3': 'H', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  'A5': { '2': 'H', '3': 'H', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  'A6': { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  'A7': { '2': 'S', '3': 'DS', '4': 'DS', '5': 'DS', '6': 'DS', '7': 'S', '8': 'S', '9': 'H', '10': 'H', 'A': 'H' },
  'A8': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  'A9': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  
  // Pairs
  'AA': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', 'A': 'P' },
  '22': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '33': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '44': { '2': 'H', '3': 'H', '4': 'H', '5': 'P', '6': 'P', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '55': { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'H', 'A': 'H' },
  '66': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '77': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '88': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', 'A': 'P' },
  '99': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'S', '8': 'P', '9': 'P', '10': 'S', 'A': 'S' },
  '1010': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
};

const ACTION_EXPLANATIONS: Record<StrategyAction, string> = {
  'H': 'Hit - Tirer une carte',
  'S': 'Stand - Rester avec votre main',
  'D': 'Double - Doubler la mise et tirer une carte',
  'P': 'Split - Séparer en deux mains',
  'DS': 'Double ou Stand - Double si autorisé, sinon Stand',
  'DH': 'Double ou Hit - Double si autorisé, sinon Hit',
  'RH': 'Surrender ou Hit - Surrender si autorisé, sinon Hit',
  'RS': 'Surrender ou Stand - Surrender si autorisé, sinon Stand',
};

/**
 * Get basic strategy recommendation for current hand
 */
export function getBasicStrategyRecommendation(
  playerCards: Card[],
  dealerUpcard: Card,
  canDouble: boolean = true,
  canSplit: boolean = true,
  canSurrender: boolean = false
): StrategyRecommendation | null {
  if (playerCards.length === 0 || !dealerUpcard) return null;
  
  const playerValue = getBestHandValue(playerCards);
  const dealerValue = dealerUpcard.rank === 'A' ? 'A' : 
                     ['10', 'J', 'Q', 'K'].includes(dealerUpcard.rank) ? '10' : 
                     dealerUpcard.rank;
  
  // Check for pair
  if (playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank) {
    const pairKey = playerCards[0].rank + playerCards[1].rank;
    const action = BASIC_STRATEGY[pairKey]?.[dealerValue];
    if (action && canSplit && action === 'P') {
      return {
        action: 'P',
        explanation: ACTION_EXPLANATIONS['P'],
      };
    }
  }
  
  // Check for soft hand (Ace counted as 11)
  const hasAce = playerCards.some(c => c.rank === 'A');
  const softValue = hasAce && playerValue <= 21 && playerCards.length === 2;
  
  if (softValue && playerValue >= 13 && playerValue <= 20) {
    const softKey = `A${playerValue - 11}`;
    const action = BASIC_STRATEGY[softKey]?.[dealerValue];
    if (action) {
      // Convert DS/DH/RS/RH to actual actions based on availability
      let finalAction: StrategyAction = action;
      if (action === 'DS' && canDouble) finalAction = 'D';
      else if (action === 'DS') finalAction = 'S';
      else if (action === 'DH' && canDouble) finalAction = 'D';
      else if (action === 'DH') finalAction = 'H';
      else if (action === 'RS' && canSurrender) finalAction = 'S';
      else if (action === 'RS') finalAction = 'S';
      else if (action === 'RH' && canSurrender) finalAction = 'H';
      else if (action === 'RH') finalAction = 'H';
      
      return {
        action: finalAction,
        explanation: ACTION_EXPLANATIONS[action],
      };
    }
  }
  
  // Hard total
  const hardKey = playerValue.toString();
  const action = BASIC_STRATEGY[hardKey]?.[dealerValue];
  if (action) {
    // Convert DS/DH/RS/RH to actual actions
    let finalAction: StrategyAction = action;
    if (action === 'D' && !canDouble) finalAction = 'H';
    else if (action === 'DS' && canDouble) finalAction = 'D';
    else if (action === 'DS') finalAction = 'S';
    else if (action === 'DH' && canDouble) finalAction = 'D';
    else if (action === 'DH') finalAction = 'H';
    else if (action === 'RS' && canSurrender) finalAction = 'S';
    else if (action === 'RS') finalAction = 'S';
    else if (action === 'RH' && canSurrender) finalAction = 'H';
    else if (action === 'RH') finalAction = 'H';
    
    return {
      action: finalAction,
      explanation: ACTION_EXPLANATIONS[action],
    };
  }
  
  return null;
}
