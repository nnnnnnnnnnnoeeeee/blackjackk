// ============================================================================
// Blackjack Engine - Server-side game logic
// Adapted from src/lib/blackjack for Edge Functions
// ============================================================================

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
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

export interface GameState {
  phase: 'waiting' | 'betting' | 'playing' | 'settling';
  shoe: Card[];
  dealerHand: Hand;
  playerHands: Record<number, Hand[]>; // seat -> hands[]
  activeSeat: number | null;
  currentRound: number;
  sideBets: Record<string, any>;
  sideBetResults: any;
}

// Create a shuffled shoe
export function createShuffledShoe(deckCount: number): Card[] {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const shoe: Card[] = [];
  for (let i = 0; i < deckCount; i++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        shoe.push({ suit, rank, faceUp: false });
      }
    }
  }
  
  // Fisher-Yates shuffle
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  
  return shoe;
}

// Draw a card from shoe
export function drawCard(shoe: Card[], faceUp: boolean = true): [Card, Card[]] {
  if (shoe.length === 0) {
    throw new Error('Shoe is empty');
  }
  const card = { ...shoe[0], faceUp };
  const newShoe = shoe.slice(1);
  return [card, newShoe];
}

// Calculate hand value
export function getBestHandValue(cards: Card[]): number {
  let value = 0;
  let aces = 0;
  
  for (const card of cards) {
    if (card.rank === 'A') {
      aces++;
      value += 11;
    } else if (['J', 'Q', 'K'].includes(card.rank)) {
      value += 10;
    } else {
      value += parseInt(card.rank);
    }
  }
  
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

// Check if hand is busted
export function isBusted(cards: Card[]): boolean {
  return getBestHandValue(cards) > 21;
}

// Check if hand is blackjack
export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && getBestHandValue(cards) === 21;
}

// Create empty hand
export function createEmptyHand(): Hand {
  return {
    cards: [],
    bet: 0,
    isDoubled: false,
    isSplit: false,
    isStood: false,
    isBusted: false,
    isBlackjack: false,
  };
}

// Add card to hand
export function addCardToHand(hand: Hand, card: Card): Hand {
  const newCards = [...hand.cards, card];
  const value = getBestHandValue(newCards);
  
  return {
    ...hand,
    cards: newCards,
    isBusted: value > 21,
    isBlackjack: isBlackjack(newCards),
  };
}
