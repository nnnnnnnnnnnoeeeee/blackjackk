// ============================================================================
// Layout - Side Panel Dock (Desktop)
// ============================================================================

import { memo, ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '../hooks';
import { useReducedMotion, conditionalVariants } from '../a11y';
import { ChevronRight } from 'lucide-react';

interface SidePanelDockProps {
  panels: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
    content: ReactNode;
  }>;
  className?: string;
}

export const SidePanelDock = memo(function SidePanelDock({
  panels,
  className,
}: SidePanelDockProps) {
  const { isMobile } = useMobileLayout();
  const prefersReducedMotion = useReducedMotion();
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());

  // Hide on mobile
  if (isMobile) return null;

  const togglePanel = (panelId: string) => {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      return next;
    });
  };

  const variants = conditionalVariants(
    {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    prefersReducedMotion
  );

  return (
    <div
      className={cn(
        'fixed right-4 top-1/2 -translate-y-1/2 z-[40] flex flex-col gap-2',
        className
      )}
    >
      {panels.map((panel) => {
        const isOpen = openPanels.has(panel.id);

        return (
          <div key={panel.id} className="relative">
            {/* Toggle Button */}
            <button
              onClick={() => togglePanel(panel.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-l-lg bg-card/90 backdrop-blur-sm border border-r-0 border-primary/30',
                'hover:bg-card transition-colors',
                'min-h-[44px]',
                isOpen && 'bg-card border-primary/50'
              )}
              aria-label={`Toggle ${panel.label} panel`}
              aria-expanded={isOpen}
            >
              {panel.icon && <span className="text-lg">{panel.icon}</span>}
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {panel.label}
              </span>
              <ChevronRight
                className={cn(
                  'w-4 h-4 transition-transform',
                  isOpen && 'rotate-90'
                )}
              />
            </button>

            {/* Panel Content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className={cn(
                    'absolute right-full top-0 mr-2 w-80 max-h-[60vh]',
                    'bg-card/95 backdrop-blur-md rounded-lg border border-primary/30',
                    'shadow-xl overflow-y-auto',
                    'p-4'
                  )}
                  role="complementary"
                  aria-label={`${panel.label} panel`}
                >
                  {panel.content}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
});

export default SidePanelDock;
