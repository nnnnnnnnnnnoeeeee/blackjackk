// ============================================================================
// Card Counting Trainer Panel
// ============================================================================

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { getCountInterpretation, calculateRunningCount, calculateTrueCount } from '@/lib/blackjack/cardcounting';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useTranslation } from '@/ui/blackjack/i18n';

export const CardCountingPanel = memo(function CardCountingPanel() {
  const { t } = useTranslation();
  const cardCountingEnabled = useGameStore(s => s.cardCountingEnabled);
  const toggleCardCounting = useGameStore(s => s.toggleCardCounting);
  
  // Extract primitive values to avoid infinite loops
  // Create a stable string key from face-up cards
  const cardKey = useGameStore(s => {
    if (!s.cardCountingEnabled) return '';
    const dealerCards = s.gameState.dealerHand.cards.filter(c => c.faceUp).map(c => `${c.rank}${c.suit}`).sort().join(',');
    const playerCards = s.gameState.playerHands.flatMap(h => h.cards.filter(c => c.faceUp).map(c => `${c.rank}${c.suit}`)).sort().join(',');
    return `${dealerCards}|${playerCards}`;
  });
  const shoeLength = useGameStore(s => s.gameState.shoe.length);
  const deckCount = useGameStore(s => s.gameState.config.deckCount);
  
  // Calculate card count using useMemo with primitive dependencies
  const cardCount = useMemo(() => {
    if (!cardCountingEnabled) return null;
    
    // Get fresh state for calculation (inside useMemo to avoid dependency on gameState object)
    const state = useGameStore.getState();
    
    // Calculate running count from all face-up cards seen
    const allCards = [
      ...state.gameState.dealerHand.cards.filter(c => c.faceUp),
      ...state.gameState.playerHands.flatMap(h => h.cards.filter(c => c.faceUp)),
    ];
    
    const runningCount = calculateRunningCount(allCards);
    const trueCount = calculateTrueCount(runningCount, shoeLength, deckCount);
    
    return { runningCount, trueCount };
  }, [cardCountingEnabled, cardKey, shoeLength, deckCount]);
  
  const interpretation = useMemo(() => {
    if (!cardCount) return null;
    return getCountInterpretation(cardCount.trueCount);
  }, [cardCount]);
  
  return (
    <div className="flex flex-col gap-0.5 sm:gap-1 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Label htmlFor="card-counting-toggle" className="text-[10px] sm:text-xs md:text-sm font-semibold cursor-pointer flex-shrink-0 flex items-center gap-1.5 text-white/80">
                <span className="opacity-70">🃏</span>
                {t.table.cardCounting}
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                {t.table.cardCountingHint}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Switch
          id="card-counting-toggle"
          checked={cardCountingEnabled}
          onCheckedChange={toggleCardCounting}
          className="scale-75 sm:scale-90 md:scale-100 flex-shrink-0"
        />
      </div>
      
      {cardCountingEnabled && cardCount && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-0.5 sm:space-y-1 pt-1 sm:pt-1.5 border-t border-white/10"
        >
          <div className="flex justify-between items-center text-[9px] sm:text-[10px] md:text-xs">
            <span className="text-muted-foreground">{t.table.running} :</span>
            <span className={cn(
              'font-bold',
              cardCount.runningCount > 0 ? 'text-success' : 
              cardCount.runningCount < 0 ? 'text-destructive' : 
              'text-muted-foreground'
            )}>
              {cardCount.runningCount > 0 ? '+' : ''}{cardCount.runningCount.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[9px] sm:text-[10px] md:text-xs">
            <span className="text-muted-foreground">{t.table.trueCount} :</span>
            <span className={cn(
              'font-bold',
              interpretation?.color || 'text-muted-foreground'
            )}>
              {cardCount.trueCount > 0 ? '+' : ''}{cardCount.trueCount.toFixed(1)}
            </span>
          </div>
          {interpretation && (
            <div className="text-[9px] sm:text-[10px] md:text-xs text-center pt-0.5 sm:pt-1">
              <span className={interpretation.color}>{interpretation.label}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
});
