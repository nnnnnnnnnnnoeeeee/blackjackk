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
        return 'BLACKJACK 3:2!';
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
      {/* Label - Only show for player hands (dealer label is handled by DealerZone) */}
      {!isDealer && (
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Player
        </div>
      )}
      
      {/* Cards container with spotlight effect for active hand - Responsive */}
      <motion.div 
        className={cn(
          'relative flex items-center justify-center min-h-[100px] sm:min-h-[120px] md:min-h-[140px]',
          'p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl transition-all duration-300',
          'max-w-full overflow-hidden',
          isActive && !isDealer && 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background',
          getResultStyles(),
        )}
        animate={isActive && !isDealer ? {
          boxShadow: [
            '0 0 0px rgba(212, 175, 55, 0)',
            '0 0 40px rgba(212, 175, 55, 0.3)',
            '0 0 0px rgba(212, 175, 55, 0)',
          ],
        } : {}}
        transition={isActive && !isDealer ? {
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        } : {}}
        style={isActive && !isDealer ? {
          background: `
            radial-gradient(
              ellipse 800px 400px at center,
              rgba(255, 255, 255, 0.05) 0%,
              transparent 70%
            )
          `,
        } : {}}
      >
        <div className="flex -space-x-6 sm:-space-x-8 md:-space-x-10 max-w-full overflow-x-auto px-2">
          <AnimatePresence>
            {cards.map((card, index) => (
              <PlayingCard
                key={`${card.rank}-${card.suit}-${index}`}
                card={card}
                index={index}
                className="transform hover:translate-y-[-4px] transition-transform flex-shrink-0"
              />
            ))}
          </AnimatePresence>
        </div>
        
        {/* Result overlay with premium animations */}
        <AnimatePresence mode="wait">
          {resultText && (
            <motion.div
              key={resultText}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                ...(result === 'win' || result === 'blackjack' ? {
                  boxShadow: [
                    '0 0 0px rgba(34, 197, 94, 0)',
                    '0 0 30px rgba(34, 197, 94, 0.8)',
                    '0 0 0px rgba(34, 197, 94, 0)',
                  ],
                } : {}),
              }}
              exit={{ 
                scale: 0, 
                opacity: 0,
                boxShadow: '0 0 0px rgba(34, 197, 94, 0)',
              }}
              transition={{
                scale: {
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                },
                opacity: { duration: 0.3 },
                boxShadow: result === 'win' || result === 'blackjack' ? {
                  duration: 1.5,
                  repeat: 2,
                } : {},
              }}
              className={cn(
                'absolute inset-0 flex items-center justify-center',
                'bg-background/80 backdrop-blur-sm rounded-xl',
                'pointer-events-none', // Don't block clicks
                result === 'win' || result === 'blackjack' ? 'glow-success' : '',
                result === 'lose' ? 'glow-destructive' : '',
              )}
            >
              <motion.span
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  delay: 0.1,
                }}
                className={cn(
                  'text-lg sm:text-xl font-bold uppercase tracking-wider text-shadow-md',
                  result === 'win' || result === 'blackjack' ? 'text-success' : '',
                  result === 'lose' ? 'text-destructive' : '',
                  result === 'push' ? 'text-warning' : '',
                )}
              >
                {resultText}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
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
