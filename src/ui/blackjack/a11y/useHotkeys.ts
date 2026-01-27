// ============================================================================
// Accessibility - Keyboard Hotkeys Management
// ============================================================================

import { useEffect, useCallback, useRef } from 'react';

export type HotkeyHandler = (event: KeyboardEvent) => void;

export interface HotkeyConfig {
  key: string;
  handler: HotkeyHandler;
  enabled?: boolean;
  preventDefault?: boolean;
  scope?: string;
}

/**
 * Hook for managing keyboard shortcuts with scope support
 * Prevents conflicts between different parts of the app
 */
export function useHotkeys(
  hotkeys: HotkeyConfig[],
  scope?: string
) {
  const handlersRef = useRef<Map<string, HotkeyHandler>>(new Map());
  const enabledRef = useRef<Map<string, boolean>>(new Map());

  // Update handlers ref when hotkeys change
  useEffect(() => {
    handlersRef.current.clear();
    enabledRef.current.clear();

    hotkeys.forEach(({ key, handler, enabled = true }) => {
      const normalizedKey = key.toUpperCase();
      handlersRef.current.set(normalizedKey, handler);
      enabledRef.current.set(normalizedKey, enabled);
    });
  }, [hotkeys]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toUpperCase();
      const handler = handlersRef.current.get(key);
      const isEnabled = enabledRef.current.get(key) ?? false;

      if (handler && isEnabled) {
        const config = hotkeys.find((h) => h.key.toUpperCase() === key);
        
        // Check scope if specified
        if (config?.scope && scope && config.scope !== scope) {
          return;
        }

        if (config?.preventDefault !== false) {
          event.preventDefault();
        }
        
        handler(event);
      }
    },
    [hotkeys, scope]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Predefined hotkey configurations for blackjack actions
 */
export const BLACKJACK_HOTKEYS = {
  HIT: { key: 'H', label: 'Hit' },
  STAND: { key: 'S', label: 'Stand' },
  DOUBLE: { key: 'D', label: 'Double' },
  SPLIT: { key: 'P', label: 'Split' },
  INSURANCE: { key: 'I', label: 'Insurance' },
  ENTER: { key: 'Enter', label: 'Stand' },
  SPACE: { key: ' ', label: 'Stand' },
} as const;
