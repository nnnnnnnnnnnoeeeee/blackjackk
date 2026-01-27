// ============================================================================
// Component - Timer Badge (Multijoueur)
// ============================================================================

import { memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useReducedMotion, conditionalVariants } from '../a11y';

interface TimerBadgeProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  color?: 'gold' | 'red' | 'green' | 'primary' | 'success' | 'destructive';
  showText?: boolean;
  onExpire?: () => void;
  className?: string;
}

export const TimerBadge = memo(function TimerBadge({
  timeLeft,
  totalTime,
  size = 60,
  strokeWidth = 6,
  color = 'gold',
  showText = true,
  onExpire,
  className,
}: TimerBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const progress = (timeLeft / totalTime) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isLowTime = timeLeft <= 3;

  const colorClasses = {
    gold: 'text-primary stroke-primary',
    red: 'text-destructive stroke-destructive',
    green: 'text-success stroke-success',
    primary: 'text-primary stroke-primary',
    success: 'text-success stroke-success',
    destructive: 'text-destructive stroke-destructive',
  };

  const bgColorClasses = {
    gold: 'bg-primary/20',
    red: 'bg-destructive/20',
    green: 'bg-success/20',
    primary: 'bg-primary/20',
    success: 'bg-success/20',
    destructive: 'bg-destructive/20',
  };

  // Toast notification when time expires
  useEffect(() => {
    if (timeLeft === 0 && onExpire) {
      toast.warning('Time expired', {
        description: 'Your turn has ended',
      });
      onExpire();
    }
  }, [timeLeft, onExpire]);

  const pulseVariants = conditionalVariants(
    {
      animate: {
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
      },
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    prefersReducedMotion
  );

  const progressVariants = conditionalVariants(
    {
      animate: { strokeDashoffset: offset },
      transition: { duration: 1, ease: 'linear' },
    },
    prefersReducedMotion
  );

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      role="timer"
      aria-valuenow={timeLeft}
      aria-valuemin={0}
      aria-valuemax={totalTime}
      aria-label={`Time remaining: ${timeLeft} seconds`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={colorClasses[color]}
          variants={prefersReducedMotion ? undefined : progressVariants}
          animate={prefersReducedMotion ? undefined : 'animate'}
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'font-bold text-lg',
              colorClasses[color],
              isLowTime && !prefersReducedMotion && 'animate-pulse'
            )}
          >
            {timeLeft}
          </span>
        </div>
      )}
      {/* Pulse effect when time is low */}
      {isLowTime && (
        <motion.div
          className={cn('absolute inset-0 rounded-full', bgColorClasses[color])}
          variants={prefersReducedMotion ? undefined : pulseVariants}
          animate={prefersReducedMotion ? undefined : 'animate'}
        />
      )}
    </div>
  );
});

export default TimerBadge;
