// ============================================================================
// Card Counting Trainer Panel
// ============================================================================

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { getCountInterpretation } from '@/lib/blackjack/cardcounting';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export const CardCountingPanel = memo(function CardCountingPanel() {
  const cardCountingEnabled = useGameStore(s => s.cardCountingEnabled);
  const toggleCardCounting = useGameStore(s => s.toggleCardCounting);
  const cardCount = useGameStore(s => s.getCardCount());
  
  const interpretation = useMemo(() => {
    if (!cardCount) return null;
    return getCountInterpretation(cardCount.trueCount);
  }, [cardCount]);
  
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-card/30 border border-border">
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Label htmlFor="card-counting-toggle" className="text-sm font-medium cursor-pointer">
                Card Counting Trainer
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                Hi-Lo system: 2-6 = +1, 7-9 = 0, 10-A = -1. True count = running count / decks remaining.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Switch
          id="card-counting-toggle"
          checked={cardCountingEnabled}
          onCheckedChange={toggleCardCounting}
        />
      </div>
      
      {cardCountingEnabled && cardCount && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-1 pt-2 border-t border-border"
        >
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Running Count:</span>
            <span className={cn(
              'font-bold',
              cardCount.runningCount > 0 ? 'text-success' : 
              cardCount.runningCount < 0 ? 'text-destructive' : 
              'text-muted-foreground'
            )}>
              {cardCount.runningCount > 0 ? '+' : ''}{cardCount.runningCount.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">True Count:</span>
            <span className={cn(
              'font-bold',
              interpretation?.color || 'text-muted-foreground'
            )}>
              {cardCount.trueCount > 0 ? '+' : ''}{cardCount.trueCount.toFixed(1)}
            </span>
          </div>
          {interpretation && (
            <div className="text-xs text-center pt-1">
              <span className={interpretation.color}>{interpretation.label}</span>
              <span className="text-muted-foreground ml-1">({interpretation.advantage})</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
});
