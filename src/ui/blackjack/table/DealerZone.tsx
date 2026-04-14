// ============================================================================
// Table Zone - Dealer Zone
// ============================================================================

import { memo } from 'react';
import { HandView } from '@/components/HandView';
import { getBestHandValue } from '@/lib/blackjack/hand';
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
  const hasCards = hand && hand.cards && hand.cards.length > 0;

  // Upcard = first face-up card visible to the player
  const upcard = hand.cards.find((c) => c.faceUp);
  const upcardLabel = upcard
    ? (['J', 'Q', 'K'].includes(upcard.rank) ? '10' : upcard.rank === 'A' ? 'As' : upcard.rank)
    : null;

  // When revealed, show full hand value
  const revealedValue = isRevealed && hasCards ? getBestHandValue(hand.cards) : null;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Dealer
        </span>
        {/* Upcard hint — visible during player turn */}
        {!isRevealed && upcardLabel && (
          <span className="text-xs font-bold text-warning bg-warning/15 border border-warning/40 rounded px-1.5 py-0.5">
            montre {upcardLabel}
          </span>
        )}
        {/* Full value when revealed */}
        {revealedValue !== null && (
          <span className="text-xs font-bold text-foreground bg-secondary/80 border border-border rounded px-1.5 py-0.5">
            {revealedValue}
          </span>
        )}
      </div>
      {hasCards ? (
        <HandView
          hand={hand}
          isDealer
          showValue={isRevealed}
          result={result || undefined}
        />
      ) : (
        <div className="min-h-[130px] sm:min-h-[160px] flex items-center justify-center" />
      )}
    </div>
  );
});

export default DealerZone;
