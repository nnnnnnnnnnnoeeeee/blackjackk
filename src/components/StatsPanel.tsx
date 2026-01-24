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
      className="w-full p-1 sm:p-1.5 md:p-2 rounded-lg bg-card/30 backdrop-blur-sm border border-border"
    >
      <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 md:gap-2">
        <StatItem 
          label="Bankroll" 
          value={`$${bankroll.toLocaleString()}`}
          className="min-w-[70px] sm:min-w-[80px] md:min-w-[90px]"
        />
        <StatItem 
          label="Hands" 
          value={stats.handsPlayed}
          className="min-w-[50px] sm:min-w-[60px]"
        />
        <StatItem 
          label="Win Rate" 
          value={`${winRate}%`}
          className="min-w-[60px] sm:min-w-[70px]"
        />
        <StatItem 
          label="BJ" 
          value={stats.blackjacks}
          className="min-w-[40px] sm:min-w-[50px]"
        />
        <StatItem 
          label="Net" 
          value={`${netProfit >= 0 ? '+' : ''}$${netProfit.toLocaleString()}`}
          className={cn(
            'min-w-[70px] sm:min-w-[80px] md:min-w-[90px]',
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
