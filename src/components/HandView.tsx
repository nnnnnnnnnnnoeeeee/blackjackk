// ============================================================================
// Hand View Component - Displays a player or dealer hand
// ============================================================================

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand } from '@/lib/blackjack/types';
import { formatHandValue, getBestHandValue } from '@/lib/blackjack/hand';
import { PlayingCard } from './PlayingCard';
import { cn } from '@/lib/utils';

interface HandViewProps {
  hand: Hand;
  isDealer?: boolean;
  isActive?: boolean;
  showValue?: boolean;
  result?: 'win' | 'lose' | 'push' | 'blackjack' | 'surrender' | null;
  className?: string;
}

export const HandView = memo(function HandView({
  hand,
  isDealer = false,
  isActive = false,
  showValue = true,
  result = null,
  className,
}: HandViewProps) {
  const { cards, isBlackjack, isBusted } = hand;
  const valueDisplay = formatHandValue(cards);
  const value = getBestHandValue(cards);
  
  const getResultStyles = () => {
    if (!result) return '';
    switch (result) {
      case 'blackjack':
      case 'win':
        return 'glow-success';
      case 'lose':
        return 'glow-destructive';
      case 'push':
        return 'border-warning';
      default:
        return '';
    }
  };
  
  const getResultText = () => {
    if (!result) return null;
    switch (result) {
      case 'blackjack':
        return 'BLACKJACK!';
      case 'win':
        return 'WIN';
      case 'lose':
        return isBusted ? 'BUST' : 'LOSE';
      case 'push':
        return 'PUSH';
      case 'surrender':
        return 'SURRENDER';
      default:
        return null;
    }
  };
  
  const resultText = getResultText();
  
  return (
    <div className={cn('relative flex flex-col items-center gap-2', className)}>
      {/* Label */}
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        {isDealer ? 'Dealer' : 'Player'}
      </div>
      
      {/* Cards container */}
      <motion.div 
        className={cn(
          'relative flex items-center justify-center min-h-[100px] sm:min-h-[120px]',
          'p-2 rounded-xl transition-all duration-300',
          isActive && !isDealer && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          getResultStyles(),
        )}
      >
        <div className="flex -space-x-8 sm:-space-x-10">
          <AnimatePresence>
            {cards.map((card, index) => (
              <PlayingCard
                key={`${card.rank}-${card.suit}-${index}`}
                card={card}
                index={index}
                className="transform hover:translate-y-[-4px] transition-transform"
              />
            ))}
          </AnimatePresence>
        </div>
        
        {/* Result overlay */}
        {resultText && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-background/80 backdrop-blur-sm rounded-xl',
            )}
          >
            <span className={cn(
              'text-lg sm:text-xl font-bold uppercase tracking-wider text-shadow-md',
              result === 'win' || result === 'blackjack' ? 'text-success' : '',
              result === 'lose' ? 'text-destructive' : '',
              result === 'push' ? 'text-warning' : '',
            )}>
              {resultText}
            </span>
          </motion.div>
        )}
      </motion.div>
      
      {/* Score badge */}
      {showValue && cards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'score-badge',
            isBlackjack && 'blackjack',
            isBusted && 'bust',
          )}
        >
          {valueDisplay}
        </motion.div>
      )}
    </div>
  );
});

export default HandView;
