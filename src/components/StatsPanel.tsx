// ============================================================================
// Stats Panel - Display game statistics
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectStats, selectBankroll } from '@/store/useGameStore';
import { cn } from '@/lib/utils';

interface StatItemProps {
  label: string;
  value: string | number;
  className?: string;
}

const StatItem = memo(function StatItem({ label, value, className }: StatItemProps) {
  return (
    <div className={cn('text-center', className)}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className="text-sm sm:text-base font-semibold text-foreground">
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
      className="w-full p-3 sm:p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border"
    >
      <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
        <StatItem 
          label="Bankroll" 
          value={`$${bankroll.toLocaleString()}`}
          className="min-w-[80px]"
        />
        <StatItem 
          label="Hands" 
          value={stats.handsPlayed}
        />
        <StatItem 
          label="Win Rate" 
          value={`${winRate}%`}
        />
        <StatItem 
          label="Blackjacks" 
          value={stats.blackjacks}
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
      
      {/* Reset button (small, subtle) */}
      {bankroll === 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={resetGame}
            className="btn-casino text-sm"
          >
            New Game ($1,000)
          </button>
        </div>
      )}
    </motion.div>
  );
});

export default StatsPanel;
