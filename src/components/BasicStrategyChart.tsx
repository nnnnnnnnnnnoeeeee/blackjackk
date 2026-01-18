// ============================================================================
// Basic Strategy Chart Component
// ============================================================================

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { getBasicStrategyRecommendation } from '@/lib/blackjack/basicStrategy';
import { Card as CardType } from '@/lib/blackjack/types';
import { useGameStore } from '@/store/useGameStore';
import { cn } from '@/lib/utils';

const DEALER_CARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
const PLAYER_HANDS = [
  { label: '5-8', value: '8' },
  { label: '9', value: '9' },
  { label: '10', value: '10' },
  { label: '11', value: '11' },
  { label: '12', value: '12' },
  { label: '13-16', value: '16' },
  { label: '17+', value: '17' },
  { label: 'A,2', value: 'A2' },
  { label: 'A,3', value: 'A3' },
  { label: 'A,4', value: 'A4' },
  { label: 'A,5', value: 'A5' },
  { label: 'A,6', value: 'A6' },
  { label: 'A,7', value: 'A7' },
  { label: 'A,8+', value: 'A8' },
  { label: '2,2', value: '22' },
  { label: '3,3', value: '33' },
  { label: '4,4', value: '44' },
  { label: '5,5', value: '55' },
  { label: '6,6', value: '66' },
  { label: '7,7', value: '77' },
  { label: '8,8', value: '88' },
  { label: '9,9', value: '99' },
  { label: '10,10', value: '1010' },
  { label: 'A,A', value: 'AA' },
];

const ACTION_COLORS: Record<string, string> = {
  'H': 'bg-blue-500',
  'S': 'bg-green-500',
  'D': 'bg-yellow-500',
  'P': 'bg-purple-500',
  'DS': 'bg-orange-500',
  'DH': 'bg-pink-500',
  'RH': 'bg-red-500',
  'RS': 'bg-red-600',
};

const ACTION_LABELS: Record<string, string> = {
  'H': 'Hit',
  'S': 'Stand',
  'D': 'Double',
  'P': 'Split',
  'DS': 'D/S',
  'DH': 'D/H',
  'RH': 'R/H',
  'RS': 'R/S',
};

export const BasicStrategyChart = memo(function BasicStrategyChart() {
  const gameState = useGameStore(s => s.gameState);
  const currentHand = gameState.playerHands[gameState.activeHandIndex];
  const dealerUpcard = gameState.dealerHand.cards[0];
  
  const recommendation = useMemo(() => {
    if (!currentHand || !dealerUpcard || currentHand.cards.length === 0) {
      return null;
    }
    
    const canDouble = gameState.phase === 'PLAYER_TURN' && currentHand.cards.length === 2;
    const canSplit = currentHand.cards.length === 2 && 
                     currentHand.cards[0].rank === currentHand.cards[1].rank;
    
    return getBasicStrategyRecommendation(
      currentHand.cards,
      dealerUpcard,
      canDouble,
      canSplit,
      false // Surrender not implemented
    );
  }, [currentHand, dealerUpcard, gameState.phase]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stratégie de Base</CardTitle>
        <CardDescription>
          Guide de stratégie optimale pour le blackjack
        </CardDescription>
        {recommendation && (
          <Badge className="mt-2 w-fit">
            Recommandation: {ACTION_LABELS[recommendation.action]} - {recommendation.explanation}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-11 gap-1 mb-2">
              <div className="font-semibold text-sm p-2">Votre main</div>
              {DEALER_CARDS.map(card => (
                <div key={card} className="font-semibold text-xs text-center p-2 bg-muted rounded">
                  {card === 'A' ? 'A' : card === '10' ? '10' : card}
                </div>
              ))}
            </div>
            
            {/* Rows */}
            {PLAYER_HANDS.map(hand => (
              <div key={hand.value} className="grid grid-cols-11 gap-1 mb-1">
                <div className="text-xs font-medium p-2 bg-muted rounded flex items-center">
                  {hand.label}
                </div>
                {DEALER_CARDS.map(dealerCard => {
                  // Get strategy action (simplified lookup)
                  const action = getActionForHand(hand.value, dealerCard);
                  return (
                    <motion.div
                      key={`${hand.value}-${dealerCard}`}
                      className={cn(
                        "text-xs text-white font-semibold p-2 rounded text-center flex items-center justify-center",
                        ACTION_COLORS[action] || 'bg-gray-500',
                        recommendation && 
                        currentHand && 
                        dealerUpcard &&
                        matchesRecommendation(hand.value, dealerCard, currentHand.cards, dealerUpcard) &&
                        "ring-2 ring-primary ring-offset-2"
                      )}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.1 }}
                    >
                      {ACTION_LABELS[action] || action}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span>Hit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Stand</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span>Double</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-purple-500 rounded" />
            <span>Split</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

function getActionForHand(handValue: string, dealerCard: string): string {
  // Simplified lookup - in production, use the actual BASIC_STRATEGY from basicStrategy.ts
  const strategy: Record<string, Record<string, string>> = {
    '8': { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
    '9': { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
    '10': { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'H', 'A': 'H' },
    '11': { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'D', 'A': 'D' },
    '12': { '2': 'H', '3': 'H', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
    '16': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'RH', '10': 'RH', 'A': 'RH' },
    '17': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
    'A2': { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
    'A6': { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
    'A7': { '2': 'S', '3': 'DS', '4': 'DS', '5': 'DS', '6': 'DS', '7': 'S', '8': 'S', '9': 'H', '10': 'H', 'A': 'H' },
    'A8': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
    '22': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
    '55': { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'H', 'A': 'H' },
    '88': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', 'A': 'P' },
    'AA': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', 'A': 'P' },
  };
  
  return strategy[handValue]?.[dealerCard] || 'H';
}

function matchesRecommendation(
  handValue: string, 
  dealerCard: string, 
  playerCards: CardType[], 
  dealerUpcard: CardType
): boolean {
  // Simplified check - in production, use actual recommendation logic
  return false; // Placeholder
}
