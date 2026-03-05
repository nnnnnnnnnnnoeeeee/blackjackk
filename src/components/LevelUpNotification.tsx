// ============================================================================
// Level Up Notification
// ============================================================================

import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, selectPendingLevelUp } from '@/store/useGameStore';
import { LEVEL_NAMES } from '@/lib/blackjack/types';

export const LevelUpNotification = memo(function LevelUpNotification() {
  const pendingLevelUp = useGameStore(selectPendingLevelUp);
  const clearLevelUp = useGameStore((s) => s.clearLevelUp);

  useEffect(() => {
    if (pendingLevelUp !== null) {
      const t = setTimeout(clearLevelUp, 3500);
      return () => clearTimeout(t);
    }
  }, [pendingLevelUp, clearLevelUp]);

  const levelName = pendingLevelUp !== null
    ? LEVEL_NAMES[pendingLevelUp] ?? LEVEL_NAMES[LEVEL_NAMES.length - 1]
    : '';

  return (
    <AnimatePresence>
      {pendingLevelUp !== null && (
        <motion.div
          key="levelup"
          initial={{ y: -80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
        >
          <div className="px-6 py-3 rounded-2xl border-2 border-primary shadow-2xl bg-card/95 backdrop-blur-md text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
              Niveau supérieur !
            </div>
            <div className="text-xl font-bold text-primary">
              ★ Niveau {pendingLevelUp + 1}
            </div>
            <div className="text-sm text-foreground/80 mt-0.5">{levelName}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default LevelUpNotification;
