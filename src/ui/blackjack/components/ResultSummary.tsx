// ============================================================================
// Component - Result Summary
// ============================================================================

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { SettlementResult } from '@/lib/blackjack/types';

interface ResultSummaryProps {
  results: Array<{
    handIndex: number;
    bet: number;
    payout: number;
    result: SettlementResult;
  }>;
  className?: string;
}

export const ResultSummary = memo(function ResultSummary({
  results,
  className,
}: ResultSummaryProps) {
  if (results.length === 0) return null;

  const totalNet = results.reduce((sum, r) => sum + (r.payout - r.bet), 0);
  const isWin = totalNet > 0;
  const isLoss = totalNet < 0;
  const isPush = totalNet === 0;

  return (
    <div className={cn('text-center', className)}>
      {results.length === 1 ? (
        // Single hand summary
        <div>
          <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-1">
            Result
          </div>
          <div
            className={cn(
              'text-lg sm:text-xl font-bold',
              isWin && 'text-success glow-success',
              isLoss && 'text-destructive glow-destructive',
              isPush && 'text-warning'
            )}
          >
            {totalNet > 0 ? '+' : ''}${totalNet}
          </div>
        </div>
      ) : (
        // Multiple hands summary
        <div>
          <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-1">
            Total Result
          </div>
          <div
            className={cn(
              'text-xl sm:text-2xl font-bold',
              isWin && 'text-success glow-success',
              isLoss && 'text-destructive glow-destructive',
              isPush && 'text-warning'
            )}
          >
            {totalNet > 0 ? '+' : ''}${totalNet}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {results.length} hand{results.length > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
});

export default ResultSummary;
