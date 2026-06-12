// ============================================================================
// Layout - Header Bar
// ============================================================================

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PhaseBanner } from '../components/PhaseBanner';
import { useTranslation } from '../i18n';
import type { GamePhase } from '@/lib/blackjack/types';

interface HeaderBarProps {
  bankroll: number;
  phase: GamePhase;
  activeHandIndex?: number;
  totalHands?: number;
  settingsButton?: ReactNode;
  statsButton?: ReactNode;
  strategyButton?: ReactNode;
  className?: string;
}

export const HeaderBar = memo(function HeaderBar({
  bankroll,
  phase,
  activeHandIndex,
  totalHands,
  settingsButton,
  statsButton,
  strategyButton,
  className,
}: HeaderBarProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1 sm:mb-1.5 md:mb-2 gap-2">
        {/* On phones the fixed Back button occupies the top-left corner */}
        <h1 className="pl-24 sm:pl-0 text-sm sm:text-base md:text-lg lg:text-xl font-bold text-primary text-shadow-md flex-shrink-0">
          ♠ Blackjack
        </h1>
        <div className="text-right flex-shrink-0 min-w-0">
          <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider block">
            {t.table.bankrollLabel}
          </span>
          <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-foreground truncate">
            ${bankroll.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Phase Banner - Always visible */}
      <PhaseBanner
        phase={phase}
        activeHandIndex={activeHandIndex}
        totalHands={totalHands}
      />
    </div>
  );
});

export default HeaderBar;
