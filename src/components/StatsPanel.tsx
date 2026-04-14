// ============================================================================
// Stats Panel - Display game statistics
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectStats, selectBankroll } from '@/store/useGameStore';
import { XPBar } from './XPBar';
import { cn } from '@/lib/utils';

interface StatItemProps {
  label: string;
  value: string | number;
  className?: string;
}

const StatItem = memo(function StatItem({ label, value, className }: StatItemProps) {
  return (
    <div className={cn('text-center flex-shrink-0', className)}>
      <div className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-foreground truncate">
        {value}
      </div>
    </div>
  );
});

export const StatsPanel = memo(function StatsPanel() {
  const stats = useGameStore(selectStats);
  const bankroll = useGameStore(selectBankroll);
  const resetGame = useGameStore(s => s.resetGame);
  
  const winRate = stats.handsPlayed > 0 
    ? ((stats.handsWon / stats.handsPlayed) * 100).toFixed(1)
    : '0.0';
  
  const netProfit = bankroll - 1000; // Starting bankroll is 1000
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full px-2 py-1 rounded-lg bg-card/20 backdrop-blur-sm border border-border/50"
    >
      <XPBar className="mb-1" />
      {/* Compact stats — 3 items max */}
      <div className="flex justify-center gap-4 sm:gap-6">
        <StatItem
          label="Mains"
          value={stats.handsPlayed}
        />
        <StatItem
          label="Win %"
          value={`${winRate}%`}
        />
        <StatItem
          label="Net"
          value={`${netProfit >= 0 ? '+' : ''}$${netProfit.toLocaleString()}`}
          className={cn(
            netProfit > 0 && 'text-success',
            netProfit < 0 && 'text-destructive',
          )}
        />
      </div>

      {bankroll === 0 && (
        <div className="mt-3 text-center">
          <button onClick={resetGame} className="btn-casino text-sm">
            New Game ($1,000)
          </button>
        </div>
      )}
    </motion.div>
  );
});

export default StatsPanel;
