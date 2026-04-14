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
import type { CoachSession } from '@/components/NewTable';

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
  coachSession?: CoachSession;
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
  coachSession,
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

      {/* Coach Mode Session Summary */}
      {coachSession && coachSession.totalDecisions > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-warning/30">
          <div className="text-xs uppercase tracking-wider text-warning font-bold mb-2 flex items-center gap-1.5">
            <span>🎓</span> Mode Entraîneur
          </div>
          {/* Accuracy bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Précision stratégique</span>
              <span className={cn(
                'font-bold',
                coachSession.correctDecisions / coachSession.totalDecisions >= 0.9
                  ? 'text-success'
                  : coachSession.correctDecisions / coachSession.totalDecisions >= 0.7
                  ? 'text-warning'
                  : 'text-destructive',
              )}>
                {Math.round((coachSession.correctDecisions / coachSession.totalDecisions) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  coachSession.correctDecisions / coachSession.totalDecisions >= 0.9
                    ? 'bg-success'
                    : coachSession.correctDecisions / coachSession.totalDecisions >= 0.7
                    ? 'bg-warning'
                    : 'bg-destructive',
                )}
                style={{
                  width: `${Math.round((coachSession.correctDecisions / coachSession.totalDecisions) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {coachSession.correctDecisions}/{coachSession.totalDecisions} décisions correctes
            </p>
          </div>

          {/* Last mistakes (max 3) */}
          {coachSession.mistakes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">
                Erreurs récentes ({coachSession.mistakes.length}) :
              </p>
              {coachSession.mistakes.slice(-3).reverse().map((m, i) => (
                <div key={i} className="text-xs rounded-lg px-2.5 py-1.5 bg-destructive/10 border border-destructive/20">
                  <span className="font-medium text-foreground">{m.handSummary}</span>
                  {' — '}
                  <span className="text-muted-foreground">
                    joué <span className="text-destructive capitalize">{m.playerAction}</span>
                    , optimal <span className="text-warning capitalize">{m.optimalAction}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
