// ============================================================================
// Hook - Swipe Gesture Detection
// ============================================================================

import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // minimum pixels to count as swipe
}

export const useSwipeGesture = ({
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
}: SwipeHandlers) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Ignore micro-movements
      if (Math.max(absDx, absDy) < threshold) {
        touchStart.current = null;
        return;
      }

      // Prefer dominant axis
      if (absDy > absDx) {
        if (dy < 0) onSwipeUp?.();
        else onSwipeDown?.();
      } else {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      }

      touchStart.current = null;
    },
    [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, threshold]
  );

  return { onTouchStart, onTouchEnd };
};
