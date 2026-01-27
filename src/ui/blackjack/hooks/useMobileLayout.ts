// ============================================================================
// Hook - Mobile Layout Detection & Safe Area
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export interface MobileLayoutInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  dockHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
}

/**
 * Hook to detect device type and measure layout dimensions
 */
export function useMobileLayout(): MobileLayoutInfo {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [dockHeight, setDockHeight] = useState(0);
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);
  const [safeAreaLeft, setSafeAreaLeft] = useState(0);
  const [safeAreaRight, setSafeAreaRight] = useState(0);

  const updateLayout = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setIsMobile(width < 640);
    setIsTablet(width >= 640 && width < 1024);
    setIsDesktop(width >= 1024);

    // Measure safe area insets (iOS notch, Android bars)
    const computedStyle = getComputedStyle(document.documentElement);
    const safeAreaTopValue = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0',
      10
    );
    const safeAreaBottomValue = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0',
      10
    );
    const safeAreaLeftValue = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0',
      10
    );
    const safeAreaRightValue = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0',
      10
    );

    setSafeAreaTop(safeAreaTopValue);
    setSafeAreaBottom(safeAreaBottomValue);
    setSafeAreaLeft(safeAreaLeftValue);
    setSafeAreaRight(safeAreaRightValue);

    // Measure dock height dynamically
    const dockElement = document.querySelector('[data-dock="bottom"]');
    if (dockElement) {
      setDockHeight(dockElement.getBoundingClientRect().height);
    } else {
      // Fallback: estimate dock height based on device
      setDockHeight(isMobile ? 200 : 150);
    }
  }, [isMobile]);

  useEffect(() => {
    updateLayout();

    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);

    // Update dock height when DOM changes
    const observer = new MutationObserver(updateLayout);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-dock'],
    });

    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
      observer.disconnect();
    };
  }, [updateLayout]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    dockHeight,
    safeAreaTop,
    safeAreaBottom,
    safeAreaLeft,
    safeAreaRight,
  };
}
