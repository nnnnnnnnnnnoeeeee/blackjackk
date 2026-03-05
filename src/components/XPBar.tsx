// ============================================================================
// XP Progress Bar
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectXPSystem } from '@/store/useGameStore';
import { LEVEL_NAMES, getXPProgress } from '@/lib/blackjack/types';
import { cn } from '@/lib/utils';

export const XPBar = memo(function XPBar({ className }: { className?: string }) {
  const xpSystem = useGameStore(selectXPSystem);
  const { current, needed, pct } = getXPProgress(xpSystem.xp);
  const levelName = LEVEL_NAMES[xpSystem.level] ?? LEVEL_NAMES[LEVEL_NAMES.length - 1];
  const isMaxLevel = needed === 0;

  return (
    <div className={cn('flex items-center gap-2 w-full', className)}>
      {/* Level badge */}
      <div className="flex-shrink-0 text-center">
        <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground">Niv.</div>
        <div className="text-[10px] sm:text-xs font-bold text-primary leading-none">{xpSystem.level + 1}</div>
      </div>

      {/* Bar + label */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[8px] sm:text-[9px] text-muted-foreground truncate">{levelName}</span>
          {!isMaxLevel && (
            <span className="text-[8px] sm:text-[9px] text-muted-foreground flex-shrink-0 ml-1">
              {current}/{needed}
            </span>
          )}
        </div>
        <div className="h-1 sm:h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
            initial={false}
            animate={{ width: isMaxLevel ? '100%' : `${pct * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
});

export default XPBar;
