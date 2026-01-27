// ============================================================================
// Component - Settlement Sheet (Mobile Bottom Sheet / Desktop Dialog)
// ============================================================================

import { memo } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '../hooks';
import { useTranslation } from '../i18n';
import { HandResultCard } from './HandResultCard';
import { ResultSummary } from './ResultSummary';
import type { HandResult } from '@/lib/blackjack/types';

interface SettlementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: HandResult[];
  playerHands: Array<{ bet: number }>;
  insuranceBet?: number;
  insuranceResult?: { won: boolean; amount: number };
  sideBetResults?: {
    perfectPairs?: { bet: number; payout: number; tier?: string };
    twentyOnePlus3?: { bet: number; payout: number; handType?: string };
  };
  onNewHand: () => void;
}

export const SettlementSheet = memo(function SettlementSheet({
  open,
  onOpenChange,
  results,
  playerHands,
  insuranceBet,
  insuranceResult,
  sideBetResults,
  onNewHand,
}: SettlementSheetProps) {
  const { isMobile } = useMobileLayout();
  const { t } = useTranslation();
  
  // Note: Radix UI Dialog/Sheet components already handle focus trap automatically

  const handleNewHand = () => {
    onNewHand();
    onOpenChange(false);
  };

  const content = (
    <div className="space-y-4">
      {/* Insurance Result */}
      {insuranceBet && insuranceBet > 0 && insuranceResult && (
        <div className="rounded-lg p-3 border-2 bg-muted/20 border-muted/50">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Insurance
          </div>
          <div
            className={cn(
              'text-base font-semibold',
              insuranceResult.won ? 'text-success' : 'text-destructive'
            )}
          >
            {insuranceResult.won
              ? `+$${(insuranceBet * 2).toFixed(0)}`
              : `-$${insuranceBet.toFixed(0)}`}
          </div>
        </div>
      )}

      {/* Side Bets Results */}
      {sideBetResults && (
        <div className="space-y-2">
          {sideBetResults.perfectPairs && (
            <div className="rounded-lg p-3 border-2 bg-card/40 border-primary/20">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Perfect Pairs {sideBetResults.perfectPairs.tier && `(${sideBetResults.perfectPairs.tier})`}
              </div>
              <div
                className={cn(
                  'text-sm font-semibold',
                  sideBetResults.perfectPairs.payout > 0
                    ? 'text-success'
                    : 'text-destructive'
                )}
              >
                {sideBetResults.perfectPairs.payout > 0
                  ? `+$${sideBetResults.perfectPairs.payout.toFixed(0)}`
                  : `-$${sideBetResults.perfectPairs.bet.toFixed(0)}`}
              </div>
            </div>
          )}
          {sideBetResults.twentyOnePlus3 && (
            <div className="rounded-lg p-3 border-2 bg-card/40 border-primary/20">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                21+3 {sideBetResults.twentyOnePlus3.handType && `(${sideBetResults.twentyOnePlus3.handType})`}
              </div>
              <div
                className={cn(
                  'text-sm font-semibold',
                  sideBetResults.twentyOnePlus3.payout > 0
                    ? 'text-success'
                    : 'text-destructive'
                )}
              >
                {sideBetResults.twentyOnePlus3.payout > 0
                  ? `+$${sideBetResults.twentyOnePlus3.payout.toFixed(0)}`
                  : `-$${sideBetResults.twentyOnePlus3.bet.toFixed(0)}`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hand Results */}
      <div className="space-y-3">
        {results.map((result, index) => {
          const hand = playerHands[result.handIndex];
          return (
            <HandResultCard
              key={index}
              handIndex={result.handIndex}
              bet={hand?.bet || 0}
              payout={result.payout}
              result={result.result}
            />
          );
        })}
      </div>

      {/* Summary */}
      <ResultSummary
        results={results.map((r) => ({
          handIndex: r.handIndex,
          bet: playerHands[r.handIndex]?.bet || 0,
          payout: r.payout,
          result: r.result,
        }))}
        className="pt-4 border-t-2 border-primary/20"
      />

      {/* New Hand Button */}
      <button
        onClick={handleNewHand}
        className="btn-casino glow-gold w-full mt-4"
        aria-label={t.common.newRound}
      >
        {t.common.newRound}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[80vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settlement-title"
          aria-describedby="settlement-description"
        >
          <SheetHeader>
            <SheetTitle id="settlement-title">{t.results.settlement}</SheetTitle>
            <SheetDescription id="settlement-description">{t.results.roundResults}</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settlement-title"
        aria-describedby="settlement-description"
      >
        <DialogHeader>
          <DialogTitle id="settlement-title">{t.results.settlement}</DialogTitle>
          <DialogDescription id="settlement-description">{t.results.roundResults}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
});

export default SettlementSheet;
