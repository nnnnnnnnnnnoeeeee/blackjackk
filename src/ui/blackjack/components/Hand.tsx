// ============================================================================
// Component - Hand Wrapper (Responsive with Scroll)
// ============================================================================

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HandProps {
  children: ReactNode;
  className?: string;
  cardCount?: number;
}

export const Hand = memo(function Hand({ children, className, cardCount = 0 }: HandProps) {
  const needsScroll = cardCount > 4;

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        needsScroll && 'overflow-x-auto pb-2 -mx-2 px-2',
        className
      )}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(212, 175, 55, 0.3) transparent',
      }}
    >
      {children}
    </div>
  );
});

export default Hand;
