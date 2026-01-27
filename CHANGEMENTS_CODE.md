# 📝 Tous les Codes - Migration vers Autre Version

Ce fichier contient **TOUS** les codes ajoutés/modifiés qui ne sont pas sur GitHub, organisés par catégories et prêts à être appliqués à une autre version du projet.

---

## 📋 Table des Matières

1. [Scripts et Configuration](#1-scripts-et-configuration)
2. [Nouveaux Composants UI](#2-nouveaux-composants-ui)
3. [Hooks Personnalisés](#3-hooks-personnalisés)
4. [Layout Components](#4-layout-components)
5. [Table Zones](#5-table-zones)
6. [Accessibilité (a11y)](#6-accessibilité-a11y)
7. [Internationalisation (i18n)](#7-internationalisation-i18n)
8. [Tokens et Thème](#8-tokens-et-thème)
9. [Composant Principal NewTable](#9-composant-principal-newtable)
10. [Fichiers Supprimés](#10-fichiers-supprimés)

---

## 1. Scripts et Configuration

### 1.1 Script de Suppression de Table Multijoueur

**Fichier** : `scripts/delete-last-table.js`

```javascript
// ============================================================================
// Script pour supprimer la dernière table multijoueur créée
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis .env
try {
  const envPath = join(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        // Retirer les guillemets si présents
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (key && cleanValue) {
          envVars[key] = cleanValue;
        }
      }
    }
  });
  
  if (envVars.VITE_SUPABASE_URL) {
    process.env.VITE_SUPABASE_URL = envVars.VITE_SUPABASE_URL;
  }
  if (envVars.VITE_SUPABASE_ANON_KEY) {
    process.env.VITE_SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
  }
  
  console.log('✅ Fichier .env chargé');
} catch (error) {
  console.warn('⚠️  Impossible de charger .env:', error.message);
  console.warn('   Utilisation des variables d\'environnement système');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erreur : Variables d\'environnement Supabase manquantes');
  console.error('Veuillez définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
  console.error('Ou créez un fichier .env avec ces variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteLastTable() {
  try {
    console.log('🔍 Recherche de la dernière table créée...');
    
    // Récupérer la dernière table créée (triée par created_at DESC)
    const { data: tables, error: fetchError } = await supabase
      .from('tables')
      .select('id, name, status, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!tables || tables.length === 0) {
      console.log('✅ Aucune table trouvée dans la base de données');
      return;
    }
    
    const lastTable = tables[0];
    console.log(`📋 Table trouvée :`);
    console.log(`   - ID: ${lastTable.id}`);
    console.log(`   - Nom: ${lastTable.name}`);
    console.log(`   - Statut: ${lastTable.status}`);
    console.log(`   - Créée le: ${new Date(lastTable.created_at).toLocaleString('fr-FR')}`);
    
    // Supprimer la table (cascade supprimera aussi table_players et table_state)
    console.log('\n🗑️  Suppression de la table...');
    const { error: deleteError } = await supabase
      .from('tables')
      .delete()
      .eq('id', lastTable.id);
    
    if (deleteError) {
      throw deleteError;
    }
    
    console.log('✅ Table supprimée avec succès !');
    console.log('   (Les joueurs et l\'état associés ont également été supprimés)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression :', error.message);
    if (error.details) {
      console.error('   Détails :', error.details);
    }
    if (error.hint) {
      console.error('   Indice :', error.hint);
    }
    process.exit(1);
  }
}

deleteLastTable();
```

### 1.2 Modification de `package.json`

**Ajout dans la section `scripts`** :

```json
{
  "scripts": {
    "delete:last-table": "node scripts/delete-last-table.js"
  }
}
```

### 1.3 Configuration Vite - Version Simplifiée (Recommandée)

**Fichier** : `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
// Version simplifiée sans lovable-tagger pour éviter les problèmes de démarrage
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

## 2. Nouveaux Composants UI

### Structure des fichiers

Tous les nouveaux composants UI sont dans `src/ui/blackjack/components/` :

- `ActionBar.tsx` - Barre d'actions pour le joueur
- `ActionBarMultiplayer.tsx` - Barre d'actions multijoueur
- `ActionButton.tsx` - Bouton d'action individuel
- `BetComposer.tsx` - Composant de composition de mise
- `BetComposerMultiplayer.tsx` - Composant de mise multijoueur
- `Card.tsx` - Carte de jeu stylisée
- `ChipSelector.tsx` - Sélecteur de jetons
- `Hand.tsx` - Affichage d'une main
- `HandResultCard.tsx` - Carte de résultat d'une main
- `PhaseBanner.tsx` - Bannière de phase de jeu
- `ResultSummary.tsx` - Résumé des résultats
- `SettlementSheet.tsx` - Feuille de règlement
- `SideBetToggle.tsx` - Toggle pour les paris latéraux
- `TimerBadge.tsx` - Badge de timer
- `TurnIndicator.tsx` - Indicateur de tour

**Fichier d'export** : `src/ui/blackjack/components/index.ts`

```typescript
// ============================================================================
// Components - Exports
// ============================================================================

export { PhaseBanner } from './PhaseBanner';
export { ActionButton } from './ActionButton';
export { ActionBar } from './ActionBar';
export { ActionBarMultiplayer } from './ActionBarMultiplayer';
export { ChipSelector } from './ChipSelector';
export { SideBetToggle } from './SideBetToggle';
export { BetComposer } from './BetComposer';
export { BetComposerMultiplayer } from './BetComposerMultiplayer';
export { Card } from './Card';
export { Hand } from './Hand';
export { HandResultCard } from './HandResultCard';
export { ResultSummary } from './ResultSummary';
export { SettlementSheet } from './SettlementSheet';
export { TurnIndicator } from './TurnIndicator';
export { TimerBadge } from './TimerBadge';
```

**⚠️ Note** : Les fichiers complets de chaque composant doivent être copiés depuis le projet source. Ce sont des composants React complexes avec beaucoup de code.

---

## 3. Hooks Personnalisés

### 3.1 Structure des Hooks

Tous les hooks sont dans `src/ui/blackjack/hooks/` :

- `useBetValidation.ts` - Validation des mises
- `useMobileLayout.ts` - Détection du layout mobile
- `useSettlementEffects.ts` - Effets visuels de règlement
- `useValidActions.ts` - Actions valides du joueur

**Fichier d'export** : `src/ui/blackjack/hooks/index.ts`

```typescript
// ============================================================================
// Hooks - Exports
// ============================================================================

export { useValidActions, type ActionReason } from './useValidActions';
export { useBetValidation, type BetValidationResult } from './useBetValidation';
export { useSettlementEffects, type ParticleType } from './useSettlementEffects';
export { useMobileLayout, type MobileLayoutInfo } from './useMobileLayout';
```

### 3.2 Hook useMobileLayout.ts

**Fichier** : `src/ui/blackjack/hooks/useMobileLayout.ts`

```typescript
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
```

**⚠️ Note** : Les autres hooks (`useBetValidation.ts`, `useSettlementEffects.ts`, `useValidActions.ts`) doivent être copiés depuis le projet source car ils sont trop longs pour être inclus ici.

---

## 4. Layout Components

### Structure des fichiers

Tous les composants de layout sont dans `src/ui/blackjack/layout/` :

- `TableShell.tsx` - Coquille principale de la table
- `HeaderBar.tsx` - Barre d'en-tête
- `BottomActionDock.tsx` - Dock d'actions en bas
- `SidePanelDock.tsx` - Dock de panneaux latéraux

**Fichier d'export** : `src/ui/blackjack/layout/index.ts`

```typescript
// ============================================================================
// Layout - Exports
// ============================================================================

export { TableShell } from './TableShell';
export { HeaderBar } from './HeaderBar';
export { BottomActionDock } from './BottomActionDock';
export { SidePanelDock } from './SidePanelDock';
```

**⚠️ Note** : Les fichiers complets de chaque composant de layout doivent être copiés depuis le projet source.

---

## 5. Table Zones

### Structure des fichiers

Tous les composants de zones de table sont dans `src/ui/blackjack/table/` :

- `DealerZone.tsx` - Zone du croupier
- `PlayerZone.tsx` - Zone du joueur
- `CenterPotZone.tsx` - Zone centrale (pot)
- `OpponentsZone.tsx` - Zone des adversaires (multijoueur)

**Fichier d'export** : `src/ui/blackjack/table/index.ts`

```typescript
// ============================================================================
// Table Zones - Exports
// ============================================================================

export { DealerZone } from './DealerZone';
export { PlayerZone } from './PlayerZone';
export { CenterPotZone } from './CenterPotZone';
export { OpponentsZone } from './OpponentsZone';
```

**⚠️ Note** : Les fichiers complets de chaque zone doivent être copiés depuis le projet source.

---

## 6. Accessibilité (a11y)

### Structure des fichiers

Tous les fichiers d'accessibilité sont dans `src/ui/blackjack/a11y/` :

- `motion.ts` - Support du mouvement réduit
- `useHotkeys.ts` - Gestion des raccourcis clavier
- `useFocusTrap.ts` - Piège de focus pour modals

**Fichier d'export** : `src/ui/blackjack/a11y/index.ts`

```typescript
// ============================================================================
// Accessibility - Exports
// ============================================================================

export { useReducedMotion, conditionalVariants, conditionalTransition } from './motion';
export { useHotkeys, BLACKJACK_HOTKEYS, type HotkeyConfig, type HotkeyHandler } from './useHotkeys';
export { useFocusTrap } from './useFocusTrap';
```

### 6.1 motion.ts

**Fichier** : `src/ui/blackjack/a11y/motion.ts`

```typescript
// ============================================================================
// Accessibility - Motion & Reduced Motion Support
// ============================================================================

import { useEffect, useState } from 'react';
import type { Variants } from 'framer-motion';

/**
 * Hook to detect if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation variants that respect reduced motion preference
 * If reduced motion is enabled, animations are simplified to fade only
 */
export function conditionalVariants(
  variants: Variants,
  prefersReducedMotion: boolean
): Variants {
  if (prefersReducedMotion) {
    // Return simplified variants with only opacity transitions
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return variants;
}

/**
 * Returns transition config that respects reduced motion
 */
export function conditionalTransition(
  transition: { duration?: number; delay?: number },
  prefersReducedMotion: boolean
) {
  if (prefersReducedMotion) {
    return {
      duration: 0.1, // Very fast transition
      delay: 0,
    };
  }
  return transition;
}
```

### 6.2 useHotkeys.ts

**Fichier** : `src/ui/blackjack/a11y/useHotkeys.ts`

```typescript
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
```

### 6.3 useFocusTrap.ts

**Fichier** : `src/ui/blackjack/a11y/useFocusTrap.ts`

```typescript
// ============================================================================
// Accessibility - Focus Trap for Modals and Dialogs
// ============================================================================

import { useEffect, useRef } from 'react';

/**
 * Hook to trap focus within a container (e.g., modal, dialog)
 * Ensures keyboard navigation stays within the container
 */
export function useFocusTrap(
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement>
) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => {
          // Filter out hidden elements
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }
      );
    };

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) return;

    // Focus the first element
    const firstElement = focusableElements[0];
    firstElement.focus();

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      );

      if (event.shiftKey) {
        // Shift + Tab: go to previous element
        if (currentIndex === 0) {
          event.preventDefault();
          focusableElements[focusableElements.length - 1].focus();
        }
      } else {
        // Tab: go to next element
        if (currentIndex === focusableElements.length - 1) {
          event.preventDefault();
          focusableElements[0].focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      
      // Restore focus to previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, containerRef]);
}
```

---

## 7. Internationalisation (i18n)

### Structure des fichiers

Tous les fichiers i18n sont dans `src/ui/blackjack/i18n/` :

- `labels.ts` - Labels centralisés en anglais
- `index.ts` - Export

**Fichier d'export** : `src/ui/blackjack/i18n/index.ts`

```typescript
// ============================================================================
// Internationalization - Exports
// ============================================================================

export { labels, getLabel } from './labels';
```

### 7.1 labels.ts

**Fichier** : `src/ui/blackjack/i18n/labels.ts`

```typescript
// ============================================================================
// Internationalization - Labels (English)
// ============================================================================

/**
 * Centralized labels for blackjack UI components
 * All labels are in English for consistency
 */

export const labels = {
  // Actions
  actions: {
    hit: 'Hit',
    stand: 'Stand',
    double: 'Double',
    split: 'Split',
    surrender: 'Surrender',
    insurance: 'Insurance',
    deal: 'Deal',
    newHand: 'New Hand',
    clear: 'Clear',
    rebet: 'Rebet',
    allIn: 'All In',
    placeBet: 'Place Bet',
  },

  // Phases
  phases: {
    betting: 'Place Your Bet',
    dealing: 'Dealing...',
    playerTurn: 'Your Turn',
    dealerTurn: 'Dealer Playing',
    settlement: 'Settlement',
  },

  // Status
  status: {
    blackjack: 'BLACKJACK',
    bust: 'BUST',
    win: 'WIN',
    lose: 'LOSE',
    push: 'PUSH',
    surrender: 'SURRENDER',
    yourTurn: 'Your Turn',
    dealerPlaying: 'Dealer playing...',
    waiting: 'Waiting...',
  },

  // Betting
  betting: {
    yourBet: 'Your Bet',
    totalBet: 'Total Bet',
    sideBets: 'Side Bets',
    minimumBet: 'Minimum bet',
    maximumBet: 'Maximum bet',
    insufficientBankroll: 'Insufficient bankroll',
    addToBet: (value: number) => `Add $${value} to bet`,
    betAmount: (amount: number) => `Bet: $${amount}`,
    placeBetButton: 'Place Bet',
    placeBetAria: 'Place bet',
    clearButton: 'Clear',
    rebetButton: 'Rebet',
    allInButton: 'All In',
    clearBetAria: 'Clear bet',
    rebetLastBetAria: 'Rebet last bet',
    betAllAria: 'Bet all',
    betAmountSliderAria: 'Bet amount slider',
    cannotDealMinBetAria: 'Cannot deal: minimum bet not met',
    dealCardsAria: 'Deal cards',
    dealButton: 'Deal',
    minimumBetLabel: 'Minimum bet',
    errorTitle: 'Error',
    errorPlacingBet: 'Error placing bet',
    rebetUnavailableTitle: 'Rebet unavailable',
    rebetUnavailableDescription: 'Previous bet amount is invalid',
    totalSideBets: 'Total Side Bets',
    totalExceedsBankroll: 'Total exceeds bankroll',
    sideBetsTitle: 'Side Bets',
    perfectPairsLabel: 'Perfect Pairs',
    perfectPairsDescription: 'Win if your first 2 cards form a pair',
    twentyOnePlusThreeLabel: '21+3',
    twentyOnePlusThreeDescription: 'Your 2 cards + dealer\'s card = poker hand',
  },

  // Results
  results: {
    settlement: 'Settlement',
    roundResults: 'Round results',
    hand: (index: number) => `Hand ${index + 1}`,
    bet: 'Bet',
    payout: 'Payout',
    net: 'Net',
    totalResult: 'Total Result',
    hands: (count: number) => `${count} hand${count > 1 ? 's' : ''}`,
  },

  // Side Bets
  sideBets: {
    perfectPairs: 'Perfect Pairs',
    twentyOnePlus3: '21+3',
    howItWorks: 'How it works',
    perfectPairsDesc: 'Win if your first 2 cards form a pair',
    twentyOnePlus3Desc: 'Your 2 cards + dealer\'s card = poker hand',
    bet: (name: string) => `${name} Bet`,
    clear: (name: string) => `Clear ${name} bet`,
  },

  // Errors
  errors: {
    actionUnavailable: 'Action unavailable',
    cannotHit: 'Cannot hit: already stood',
    cannotStand: 'Cannot stand: already stood',
    cannotDouble: 'Can only double on first two cards',
    cannotSplit: 'Can only split with two cards',
    insufficientFunds: 'Insufficient bankroll',
    minimumBetRequired: (amount: number) => `Minimum bet is $${amount}`,
    maximumBetExceeded: (amount: number) => `Maximum bet is $${amount}`,
    timeExpired: 'Time expired',
    turnEnded: 'Your turn has ended',
    insufficientBankroll: 'Insufficient bankroll',
  },

  // Accessibility
  a11y: {
    settings: 'Settings',
    stats: 'Stats',
    strategy: 'Strategy',
    dealer: 'Dealer',
    opponents: 'Opponents',
    yourCards: 'Your Cards',
    bankroll: 'Bankroll',
    currentBet: 'Current bet',
    togglePanel: (name: string) => `Toggle ${name} panel`,
    timeRemaining: (seconds: number) => `Time remaining: ${seconds} seconds`,
    yourTurn: 'Your turn',
    notYourTurn: 'Not your turn',
    gamePhase: (phase: string) => `Game phase: ${phase}`,
  },
} as const;

// Helper function to get labels with dot notation
export function getLabel(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = labels;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to direct key lookup for backward compatibility
      const flatLabels: Record<string, string> = {
        your_bet: labels.betting.yourBet,
        clear_button: labels.actions.clear,
        rebet_button: labels.actions.rebet,
        all_in_button: labels.actions.allIn,
        clear_bet_aria: labels.betting.clearBetAria,
        rebet_last_bet_aria: labels.betting.rebetLastBetAria,
        bet_all_aria: labels.betting.betAllAria,
        bet_amount_slider_aria: labels.betting.betAmountSliderAria,
        cannot_deal_min_bet_aria: labels.betting.cannotDealMinBetAria,
        deal_cards_aria: labels.betting.dealCardsAria,
        deal_button: labels.betting.dealButton,
        minimum_bet: labels.betting.minimumBetLabel,
        error_title: labels.errors.actionUnavailable,
        error_placing_bet: labels.betting.errorPlacingBet,
        rebet_unavailable_title: labels.betting.rebetUnavailableTitle,
        rebet_unavailable_description: labels.betting.rebetUnavailableDescription,
        total_side_bets: labels.betting.totalSideBets,
        total_exceeds_bankroll: labels.betting.totalExceedsBankroll,
        side_bets_title: labels.betting.sideBetsTitle,
        perfect_pairs_label: labels.betting.perfectPairsLabel,
        perfect_pairs_description: labels.betting.perfectPairsDescription,
        twenty_one_plus_three_label: labels.betting.twentyOnePlusThreeLabel,
        twenty_one_plus_three_description: labels.betting.twentyOnePlusThreeDescription,
        place_bet_button: labels.betting.placeBetButton,
        place_bet_aria: labels.betting.placeBetAria,
        your_turn: labels.status.yourTurn,
        action_unavailable: labels.errors.actionUnavailable,
        insufficient_bankroll: labels.errors.insufficientBankroll,
      };
      return flatLabels[key] || key;
    }
  }

  if (typeof value === 'function' && params) {
    return value(params as any);
  }

  return typeof value === 'string' ? value : key;
}
```

---

## 8. Tokens et Thème

### 8.1 tokens.ts

**Fichier** : `src/ui/blackjack/tokens.ts`

```typescript
// ============================================================================
// Design Tokens - Extended from casinoTheme.ts
// ============================================================================

import { casinoTheme } from '@/lib/casinoTheme';

/**
 * Extended design tokens for blackjack UI components
 * Re-exports casinoTheme and adds additional tokens
 */
export const tokens = {
  ...casinoTheme,

  // Additional z-index layers
  zIndex: {
    ...casinoTheme.zIndex,
    overlay: 200,
    toast: 150,
    dropdown: 60,
  },

  // Card spacing (negative margins for overlap effect)
  cardSpacing: {
    mobile: '-space-x-6',
    tablet: '-space-x-8',
    desktop: '-space-x-10',
  },

  // Compact mode breakpoint (very small screens)
  compactBreakpoint: 400,
} as const;

export default tokens;
```

### 8.2 Index Principal

**Fichier** : `src/ui/blackjack/index.ts`

```typescript
// ============================================================================
// Blackjack UI - Main Exports
// ============================================================================

export * from './a11y';
export * from './hooks';
export * from './i18n';
export { tokens } from './tokens';
```

---

## 9. Composant Principal NewTable

**Fichier** : `src/components/NewTable.tsx`

**⚠️ Note** : Ce fichier est très long (383 lignes). Il doit être copié depuis le projet source. Il utilise tous les nouveaux composants UI et remplace l'ancien composant `Table.tsx`.

**Structure principale** :
- Utilise `TableShell`, `HeaderBar`, `BottomActionDock`
- Utilise `DealerZone`, `PlayerZone`, `CenterPotZone`
- Utilise `ActionBar`, `BetComposer`, `SettlementSheet`
- Gère les panels flottants (Settings, Stats, Strategy)
- Gère les effets de particules et sons

---

## 10. Fichiers Supprimés

Les fichiers suivants ont été supprimés car ils étaient obsolètes :

- `FIXES_APPLIED.md`
- `FIXES_LAYOUT.md`
- `IMPLEMENTATION_COMPLETE.md`
- `IMPLEMENTATION_STATUS.md`
- `MIGRATION_COMPLETE.md`
- `FIX_OAUTH_500_DETAILED.md`
- `FIX_OAUTH_ERROR_500.md`
- `FIX_OAUTH_INTERMITTENT.md`
- `FIX_OAUTH_VERCEL.md`
- `MULTIPLAYER_IMPROVEMENTS_PROMPT.md`
- `PROMPT_UX_UI_ADAPTE.md`
- `DEBUG_BUTTONS.md`
- `TEST_GUIDE_UX_PREVIEW.md`
- `QUICK_START_TEST.md`
- `ACCES_NOUVELLE_UI.md`
- `README_UX_UI.md`
- `UX_IMPROVEMENTS_SUMMARY.md`
- `src/App.css` (non utilisé)
- `bun.lockb` (projet utilise npm)

---

## 📋 Instructions d'Application

### Pour appliquer ces changements à une autre version :

1. **Créer la structure de dossiers** :
   ```
   src/ui/blackjack/
   ├── a11y/
   ├── components/
   ├── hooks/
   ├── i18n/
   ├── layout/
   └── table/
   ```

2. **Copier tous les fichiers** :
   - Copier tous les fichiers depuis le projet source vers le nouveau projet
   - Respecter la structure de dossiers exacte

3. **Modifier `package.json`** :
   - Ajouter le script `"delete:last-table": "node scripts/delete-last-table.js"`

4. **Modifier `vite.config.ts`** :
   - Utiliser la version simplifiée (section 1.3)

5. **Créer le script** :
   - Créer `scripts/delete-last-table.js` avec le code de la section 1.1

6. **Tester** :
   ```bash
   npm run dev
   npm run delete:last-table
   ```

---

## ⚠️ Important

**Ce document liste tous les fichiers et leur structure, mais les fichiers complets doivent être copiés depuis le projet source** car ils sont trop longs pour être inclus ici. Les fichiers listés avec leur code complet sont :

- ✅ `scripts/delete-last-table.js`
- ✅ `vite.config.ts` (version simplifiée)
- ✅ `src/ui/blackjack/hooks/useMobileLayout.ts`
- ✅ `src/ui/blackjack/a11y/motion.ts`
- ✅ `src/ui/blackjack/a11y/useHotkeys.ts`
- ✅ `src/ui/blackjack/a11y/useFocusTrap.ts`
- ✅ `src/ui/blackjack/i18n/labels.ts`
- ✅ `src/ui/blackjack/tokens.ts`
- ✅ Tous les fichiers d'export (`index.ts`)

**Les autres fichiers doivent être copiés depuis le projet source.**
