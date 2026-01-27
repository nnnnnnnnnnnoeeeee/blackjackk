// ============================================================================
// Layout - Bottom Action Dock
// ============================================================================

import { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '../hooks';

interface BottomActionDockProps {
  bettingContent?: ReactNode;
  playingContent?: ReactNode;
  waitingContent?: ReactNode;
  className?: string;
}

export const BottomActionDock = memo(function BottomActionDock({
  bettingContent,
  playingContent,
  waitingContent,
  className,
}: BottomActionDockProps) {
  const { isMobile, safeAreaBottom } = useMobileLayout();

  return (
    <div
      className={cn('w-full', className)}
      data-dock="bottom"
      style={{
        paddingBottom: isMobile ? `${safeAreaBottom}px` : undefined,
      }}
    >
      <AnimatePresence mode="wait">
        {bettingContent && (
          <motion.div
            key="betting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-2xl mx-auto"
          >
            {bettingContent}
          </motion.div>
        )}

        {playingContent && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex justify-center max-w-2xl mx-auto"
          >
            {playingContent}
          </motion.div>
        )}

        {waitingContent && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-muted-foreground text-sm"
          >
            {waitingContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default BottomActionDock;
