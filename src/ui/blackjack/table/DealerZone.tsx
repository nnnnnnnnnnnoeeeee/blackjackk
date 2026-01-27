// ============================================================================
// Table Zone - Dealer Zone
// ============================================================================

import { memo } from 'react';
import { HandView } from '@/components/HandView';
import type { Hand } from '@/lib/blackjack/types';

interface DealerZoneProps {
  hand: Hand;
  isRevealed: boolean;
  result?: 'win' | 'lose' | 'push' | null;
}

export const DealerZone = memo(function DealerZone({
  hand,
  isRevealed,
  result,
}: DealerZoneProps) {
  // Always show "DEALER" label, even when no cards
  const hasCards = hand && hand.cards && hand.cards.length > 0;
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1 sm:mb-2 uppercase tracking-wider">
        Dealer
      </div>
      {hasCards ? (
        <HandView
          hand={hand}
          isDealer
          showValue={isRevealed}
          result={result || undefined}
        />
      ) : (
        <div className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px] flex items-center justify-center">
          {/* Empty state - dealer label stays visible */}
        </div>
      )}
    </div>
  );
});

export default DealerZone;
