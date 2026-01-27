// ============================================================================
// Component - Card Wrapper (Responsive)
// ============================================================================

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '../hooks';

interface CardProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export const Card = memo(function Card({ children, className, compact }: CardProps) {
  const { isMobile } = useMobileLayout();
  const isCompact = compact || (isMobile && window.innerWidth < 400);

  return (
    <div
      className={cn(
        'playing-card',
        isCompact && 'min-w-[45px] max-w-[55px] text-[0.65rem]',
        className
      )}
    >
      {children}
    </div>
  );
});

export default Card;
