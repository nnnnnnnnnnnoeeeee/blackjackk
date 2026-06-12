// ============================================================================
// Table Zone - Dealer Zone
// ============================================================================

import { memo } from 'react';
import { HandView } from '@/components/HandView';
import { getBestHandValue } from '@/lib/blackjack/hand';
import { useTranslation } from '@/ui/blackjack/i18n';
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
  const { t } = useTranslation();
  const hasCards = hand && hand.cards && hand.cards.length > 0;

  // Upcard = first face-up card visible to the player
  const upcard = hand.cards.find((c) => c.faceUp);
  const upcardLabel = upcard
    ? (['J', 'Q', 'K'].includes(upcard.rank) ? '10' : upcard.rank === 'A' ? 'As' : upcard.rank)
    : null;

  // When revealed, show full hand value
  const revealedValue = isRevealed && hasCards ? getBestHandValue(hand.cards) : null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {t.a11y.dealer}
        </span>
        {/* Upcard hint — visible during player turn */}
        {!isRevealed && upcardLabel && (
          <span className="text-xs font-bold text-warning bg-warning/15 border border-warning/40 rounded px-1.5 py-0.5">
            {t.table.dealerShows(upcardLabel)}
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
        /* Elegant empty state: two card-slot silhouettes so the felt never looks unfinished */
        <div className="min-h-[96px] sm:min-h-[160px] flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="w-[60px] h-[88px] sm:w-[72px] sm:h-[104px] rounded-lg border-2 border-dashed border-white/12 bg-white/[0.02] flex items-center justify-center"
              >
                <span className="text-white/15 text-2xl select-none">♠</span>
              </div>
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
            {t.table.waitingForBet}
          </span>
        </div>
      )}
    </div>
  );
});

export default DealerZone;
