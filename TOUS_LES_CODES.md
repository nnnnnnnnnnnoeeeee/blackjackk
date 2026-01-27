# 📚 Tous les Codes du Projet - Documentation Complète

Ce fichier contient la liste complète de tous les fichiers de code du projet Blackjack Brilliance, organisés par catégories avec leur chemin complet et leur description.

---

## 📋 Table des Matières

1. [Configuration du Projet](#1-configuration-du-projet)
2. [Point d'Entrée](#2-point-dentrée)
3. [Composants Principaux](#3-composants-principaux)
4. [Pages](#4-pages)
5. [Composants UI (shadcn/ui)](#5-composants-ui-shadcnui)
6. [Nouveaux Composants UI Blackjack](#6-nouveaux-composants-ui-blackjack)
7. [Layout Components](#7-layout-components)
8. [Table Zones](#8-table-zones)
9. [Hooks Personnalisés](#9-hooks-personnalisés)
10. [Accessibilité (a11y)](#10-accessibilité-a11y)
11. [Internationalisation (i18n)](#11-internationalisation-i18n)
12. [Moteur de Jeu Blackjack](#12-moteur-de-jeu-blackjack)
13. [Store (Zustand)](#13-store-zustand)
14. [Utilitaires](#14-utilitaires)
15. [Tests](#15-tests)
16. [Scripts](#16-scripts)
17. [Configuration Supabase](#17-configuration-supabase)

---

## 1. Configuration du Projet

### 1.1 Fichiers de Configuration

- **`package.json`** - Dépendances et scripts npm
- **`vite.config.ts`** - Configuration Vite (serveur de développement)
- **`tsconfig.json`** - Configuration TypeScript principale
- **`tsconfig.app.json`** - Configuration TypeScript pour l'application
- **`tsconfig.node.json`** - Configuration TypeScript pour Node.js
- **`tailwind.config.ts`** - Configuration Tailwind CSS
- **`postcss.config.js`** - Configuration PostCSS
- **`eslint.config.js`** - Configuration ESLint
- **`vitest.config.ts`** - Configuration Vitest (tests)
- **`components.json`** - Configuration shadcn/ui
- **`vercel.json`** - Configuration Vercel (déploiement)
- **`index.html`** - Point d'entrée HTML

### 1.2 Variables d'Environnement

- **`env.template`** - Template pour les variables d'environnement
- **`.env`** - Variables d'environnement (non versionné)

---

## 2. Point d'Entrée

### 2.1 `src/main.tsx`

Point d'entrée React de l'application.

```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### 2.2 `src/App.tsx`

Composant racine de l'application avec routing.

```typescript
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ModeSelection from "./pages/ModeSelection";
import Game from "./pages/Game";
import Lobby from "./pages/Lobby";
import MultiplayerTable from "./pages/MultiplayerTable";
import UxPreview from "./pages/UxPreview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/mode-selection" element={<ModeSelection />} />
          <Route path="/game" element={<Game />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/table/:id" element={<MultiplayerTable />} />
          <Route path="/ux-preview" element={<UxPreview />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

### 2.3 `src/index.css`

Styles globaux et thème Tailwind.

---

## 3. Composants Principaux

### 3.1 Composants de Jeu

- **`src/components/Table.tsx`** - Table de jeu principale (ancienne version)
- **`src/components/NewTable.tsx`** - Table de jeu principale (nouvelle version avec nouveaux composants UI)
- **`src/components/BetPanel.tsx`** - Panneau de mise
- **`src/components/Controls.tsx`** - Contrôles du jeu (Hit, Stand, Double, Split)
- **`src/components/HandView.tsx`** - Affichage d'une main de cartes
- **`src/components/PlayingCard.tsx`** - Carte individuelle
- **`src/components/GameStatusBar.tsx`** - Barre de statut du jeu
- **`src/components/ChipStack.tsx`** - Pile de jetons
- **`src/components/CircularTimer.tsx`** - Timer circulaire

### 3.2 Composants d'Information

- **`src/components/StatsPanel.tsx`** - Panneau de statistiques
- **`src/components/StatsDashboard.tsx`** - Tableau de bord des statistiques
- **`src/components/CardCountingPanel.tsx`** - Panneau de comptage de cartes
- **`src/components/SettingsPanel.tsx`** - Panneau de paramètres
- **`src/components/BasicStrategyChart.tsx`** - Graphique de stratégie de base
- **`src/components/Tutorial.tsx`** - Tutoriel interactif

### 3.3 Composants Multijoueur

- **`src/components/ChatPanel.tsx`** - Panneau de chat multijoueur
- **`src/components/NavLink.tsx`** - Lien de navigation

### 3.4 Composants Visuels

- **`src/components/ParticleSystem.tsx`** - Système de particules pour effets visuels

---

## 4. Pages

### 4.1 Pages d'Authentification

- **`src/pages/Index.tsx`** - Page d'accueil avec redirection automatique
- **`src/pages/Login.tsx`** - Page de connexion
- **`src/pages/Register.tsx`** - Page d'inscription
- **`src/pages/ForgotPassword.tsx`** - Page de mot de passe oublié
- **`src/pages/ResetPassword.tsx`** - Page de réinitialisation de mot de passe

### 4.2 Pages de Jeu

- **`src/pages/ModeSelection.tsx`** - Sélection du mode de jeu (Solo/Multijoueur)
- **`src/pages/Game.tsx`** - Page de jeu solo
- **`src/pages/Lobby.tsx`** - Lobby multijoueur (liste des tables)
- **`src/pages/MultiplayerTable.tsx`** - Table multijoueur
- **`src/pages/UxPreview.tsx`** - Aperçu de l'interface utilisateur
- **`src/pages/NotFound.tsx`** - Page 404

---

## 5. Composants UI (shadcn/ui)

Tous les composants shadcn/ui sont dans `src/components/ui/` :

### Composants de Base
- `accordion.tsx` - Accordéon
- `alert.tsx` - Alerte
- `alert-dialog.tsx` - Dialogue d'alerte
- `aspect-ratio.tsx` - Ratio d'aspect
- `avatar.tsx` - Avatar
- `badge.tsx` - Badge
- `breadcrumb.tsx` - Fil d'Ariane
- `button.tsx` - Bouton
- `calendar.tsx` - Calendrier
- `card.tsx` - Carte
- `carousel.tsx` - Carrousel
- `chart.tsx` - Graphique
- `checkbox.tsx` - Case à cocher
- `collapsible.tsx` - Collapsible
- `command.tsx` - Commande
- `context-menu.tsx` - Menu contextuel
- `dialog.tsx` - Dialogue
- `drawer.tsx` - Tiroir
- `dropdown-menu.tsx` - Menu déroulant
- `form.tsx` - Formulaire
- `hover-card.tsx` - Carte au survol
- `input.tsx` - Champ de saisie
- `input-otp.tsx` - Saisie OTP
- `label.tsx` - Étiquette
- `menubar.tsx` - Barre de menu
- `navigation-menu.tsx` - Menu de navigation
- `pagination.tsx` - Pagination
- `popover.tsx` - Popover
- `progress.tsx` - Barre de progression
- `radio-group.tsx` - Groupe de boutons radio
- `resizable.tsx` - Redimensionnable
- `scroll-area.tsx` - Zone de défilement
- `select.tsx` - Sélecteur
- `separator.tsx` - Séparateur
- `sheet.tsx` - Feuille
- `sidebar.tsx` - Barre latérale
- `skeleton.tsx` - Squelette
- `slider.tsx` - Curseur
- `sonner.tsx` - Notifications Sonner
- `switch.tsx` - Interrupteur
- `table.tsx` - Tableau
- `tabs.tsx` - Onglets
- `textarea.tsx` - Zone de texte
- `toast.tsx` - Toast
- `toaster.tsx` - Conteneur de toasts
- `toggle.tsx` - Toggle
- `toggle-group.tsx` - Groupe de toggles
- `tooltip.tsx` - Infobulle
- `use-toast.ts` - Hook pour les toasts

---

## 6. Nouveaux Composants UI Blackjack

Tous les nouveaux composants sont dans `src/ui/blackjack/components/` :

### 6.1 Composants Principaux

- **`ActionBar.tsx`** - Barre d'actions pour le joueur (Hit, Stand, Double, Split)
- **`ActionBarMultiplayer.tsx`** - Barre d'actions multijoueur
- **`ActionButton.tsx`** - Bouton d'action individuel
- **`BetComposer.tsx`** - Composant de composition de mise
- **`BetComposerMultiplayer.tsx`** - Composant de mise multijoueur
- **`Card.tsx`** - Carte de jeu stylisée
- **`ChipSelector.tsx`** - Sélecteur de jetons
- **`Hand.tsx`** - Affichage d'une main
- **`HandResultCard.tsx`** - Carte de résultat d'une main
- **`PhaseBanner.tsx`** - Bannière de phase de jeu
- **`ResultSummary.tsx`** - Résumé des résultats
- **`SettlementSheet.tsx`** - Feuille de règlement
- **`SideBetToggle.tsx`** - Toggle pour les paris latéraux
- **`TimerBadge.tsx`** - Badge de timer
- **`TurnIndicator.tsx`** - Indicateur de tour

### 6.2 Fichier d'Export

**`src/ui/blackjack/components/index.ts`**

```typescript
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

---

## 7. Layout Components

Tous les composants de layout sont dans `src/ui/blackjack/layout/` :

- **`TableShell.tsx`** - Coquille principale de la table
- **`HeaderBar.tsx`** - Barre d'en-tête avec informations du jeu
- **`BottomActionDock.tsx`** - Dock d'actions en bas de l'écran
- **`SidePanelDock.tsx`** - Dock de panneaux latéraux

**Fichier d'export** : `src/ui/blackjack/layout/index.ts`

```typescript
export { TableShell } from './TableShell';
export { HeaderBar } from './HeaderBar';
export { BottomActionDock } from './BottomActionDock';
export { SidePanelDock } from './SidePanelDock';
```

---

## 8. Table Zones

Tous les composants de zones de table sont dans `src/ui/blackjack/table/` :

- **`DealerZone.tsx`** - Zone du croupier
- **`PlayerZone.tsx`** - Zone du joueur
- **`CenterPotZone.tsx`** - Zone centrale (pot et informations)
- **`OpponentsZone.tsx`** - Zone des adversaires (multijoueur)

**Fichier d'export** : `src/ui/blackjack/table/index.ts`

```typescript
export { DealerZone } from './DealerZone';
export { PlayerZone } from './PlayerZone';
export { CenterPotZone } from './CenterPotZone';
export { OpponentsZone } from './OpponentsZone';
```

---

## 9. Hooks Personnalisés

### 9.1 Hooks Blackjack

Tous les hooks sont dans `src/ui/blackjack/hooks/` :

- **`useBetValidation.ts`** - Validation des mises
- **`useMobileLayout.ts`** - Détection du layout mobile et safe area
- **`useSettlementEffects.ts`** - Effets visuels de règlement (particules, sons)
- **`useValidActions.ts`** - Calcul des actions valides du joueur

**Fichier d'export** : `src/ui/blackjack/hooks/index.ts`

```typescript
export { useValidActions, type ActionReason } from './useValidActions';
export { useBetValidation, type BetValidationResult } from './useBetValidation';
export { useSettlementEffects, type ParticleType } from './useSettlementEffects';
export { useMobileLayout, type MobileLayoutInfo } from './useMobileLayout';
```

### 9.2 Hooks Généraux

- **`src/hooks/useSound.ts`** - Hook pour les effets sonores
- **`src/hooks/use-toast.ts`** - Hook pour les notifications toast
- **`src/hooks/use-mobile.tsx`** - Hook de détection mobile

---

## 10. Accessibilité (a11y)

Tous les fichiers d'accessibilité sont dans `src/ui/blackjack/a11y/` :

- **`motion.ts`** - Support du mouvement réduit (prefers-reduced-motion)
- **`useHotkeys.ts`** - Gestion des raccourcis clavier avec scope
- **`useFocusTrap.ts`** - Piège de focus pour modals et dialogues

**Fichier d'export** : `src/ui/blackjack/a11y/index.ts`

```typescript
export { useReducedMotion, conditionalVariants, conditionalTransition } from './motion';
export { useHotkeys, BLACKJACK_HOTKEYS, type HotkeyConfig, type HotkeyHandler } from './useHotkeys';
export { useFocusTrap } from './useFocusTrap';
```

---

## 11. Internationalisation (i18n)

Tous les fichiers i18n sont dans `src/ui/blackjack/i18n/` :

- **`labels.ts`** - Labels centralisés en anglais pour tous les composants
- **`index.ts`** - Export

**Fichier d'export** : `src/ui/blackjack/i18n/index.ts`

```typescript
export { labels, getLabel } from './labels';
```

---

## 12. Moteur de Jeu Blackjack

Tous les fichiers du moteur de jeu sont dans `src/lib/blackjack/` :

### 12.1 Fichiers Principaux

- **`types.ts`** - Types TypeScript pour le jeu
- **`deck.ts`** - Gestion du sabot de cartes
- **`hand.ts`** - Calculs de main (valeur, blackjack, bust)
- **`rules.ts`** - Règles du jeu (validation actions, dealer, payout)
- **`game.ts`** - Logique de jeu et transitions d'état
- **`basicStrategy.ts`** - Stratégie de base du blackjack
- **`cardcounting.ts`** - Comptage de cartes (Hi-Lo)
- **`sidebets.ts`** - Paris latéraux (Perfect Pairs, 21+3)

### 12.2 Fichier d'Export

**`src/lib/blackjack/index.ts`**

```typescript
export * from './types';
export * from './deck';
export * from './hand';
export * from './rules';
export * from './game';
```

---

## 13. Store (Zustand)

### 13.1 Store Principal

**`src/store/useGameStore.ts`** - Store Zustand avec persistance pour l'état du jeu

**Fonctionnalités principales** :
- Gestion de l'état du jeu (phase, mains, mises, etc.)
- Statistiques persistantes
- Configuration du jeu
- Actions du joueur
- Comptage de cartes
- Historique des mains

**Selectors optimisés** :
- `selectPhase`
- `selectDealerHand`
- `selectPlayerHands`
- `selectActiveHandIndex`
- `selectResults`
- `selectCurrentBet`
- `selectBankroll`
- `selectConfig`

---

## 14. Utilitaires

### 14.1 Utilitaires Généraux

- **`src/lib/utils.ts`** - Fonction `cn()` pour fusionner les classes Tailwind

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 14.2 Thème Casino

- **`src/lib/casinoTheme.ts`** - Tokens de design centralisés (couleurs, espacements, ombres, etc.)

**Contenu principal** :
- Couleurs (felt, gold, success, destructive, warning)
- Espacements (cartes, jetons, boutons)
- Breakpoints (mobile, tablet, desktop)
- Ombres (cartes, jetons, boutons, glow)
- Transitions
- Typographie
- Z-index layers

### 14.3 Tokens Blackjack

- **`src/ui/blackjack/tokens.ts`** - Tokens étendus pour les composants UI blackjack

```typescript
import { casinoTheme } from '@/lib/casinoTheme';

export const tokens = {
  ...casinoTheme,
  zIndex: {
    ...casinoTheme.zIndex,
    overlay: 200,
    toast: 150,
    dropdown: 60,
  },
  cardSpacing: {
    mobile: '-space-x-6',
    tablet: '-space-x-8',
    desktop: '-space-x-10',
  },
  compactBreakpoint: 400,
} as const;
```

### 14.4 Client Supabase

- **`src/lib/supabaseClient.ts`** - Configuration du client Supabase

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

### 14.5 Index Principal Blackjack UI

**`src/ui/blackjack/index.ts`**

```typescript
export * from './a11y';
export * from './hooks';
export * from './i18n';
export { tokens } from './tokens';
```

---

## 15. Tests

Tous les tests sont dans `src/test/` :

- **`setup.ts`** - Configuration des tests
- **`blackjack.test.ts`** - Tests du moteur de jeu blackjack
- **`game-flow.test.ts`** - Tests des scénarios de jeu complets
- **`rules-config.test.ts`** - Tests des règles et configurations
- **`cardcounting.test.ts`** - Tests du comptage de cartes
- **`sidebets.test.ts`** - Tests des paris latéraux
- **`bj-insurance.test.ts`** - Tests de l'assurance
- **`example.test.ts`** - Tests d'exemple

---

## 16. Scripts

Tous les scripts sont dans `scripts/` :

- **`setup.js`** - Script de configuration initiale (installe dépendances, crée .env)
- **`setup-env.js`** - Script de configuration des variables d'environnement Supabase
- **`delete-last-table.js`** - Script pour supprimer la dernière table multijoueur créée

---

## 17. Configuration Supabase

### 17.1 Migrations

Toutes les migrations sont dans `supabase/migrations/` :

- `001_initial_schema.sql` - Schéma initial (tables, RLS)
- `002_enable_realtime.sql` - Activation Realtime
- `003_add_email_to_profiles.sql` - Ajout email aux profils
- `004_fix_table_players_rls.sql` - Correction RLS table_players
- `005_fix_table_players_rls_recursion.sql` - Correction récursion RLS
- `006_fix_table_state_rls.sql` - Correction RLS table_state
- `007_add_table_delete_policy.sql` - Politique de suppression
- `008_add_room_code.sql` - Ajout code de salle
- `009_add_public_private_tables.sql` - Tables publiques/privées
- `010_fix_profiles_rls_and_private_tables.sql` - Correction RLS profils et tables privées
- `011_allow_join_private_tables_by_code.sql` - Autoriser rejoindre tables privées par code
- `012_add_table_messages.sql` - Table de messages
- `013_fix_function_search_path.sql` - Correction search path des fonctions

### 17.2 Edge Functions

Toutes les fonctions Edge sont dans `supabase/functions/` :

- **`_shared/blackjack-engine.ts`** - Moteur de jeu partagé
- **`create_table/index.ts`** - Création de table
- **`join_table/index.ts`** - Rejoindre une table
- **`player_action/index.ts`** - Action du joueur
- **`start_round/index.ts`** - Démarrer un round
- **`dealer_play_and_settle/index.ts`** - Jouer le croupier et régler
- **`deno.json`** - Configuration Deno

### 17.3 Configuration

- **`supabase/config.toml`** - Configuration Supabase locale

---

## 📊 Statistiques du Projet

### Nombre de Fichiers par Catégorie

- **Pages** : 11 fichiers
- **Composants Principaux** : 17 fichiers
- **Composants UI (shadcn/ui)** : 49 fichiers
- **Nouveaux Composants UI Blackjack** : 15 fichiers
- **Layout Components** : 4 fichiers
- **Table Zones** : 4 fichiers
- **Hooks** : 7 fichiers
- **Accessibilité** : 3 fichiers
- **Internationalisation** : 2 fichiers
- **Moteur de Jeu** : 8 fichiers
- **Store** : 1 fichier
- **Utilitaires** : 4 fichiers
- **Tests** : 8 fichiers
- **Scripts** : 3 fichiers
- **Migrations Supabase** : 13 fichiers
- **Edge Functions** : 6 fichiers

**Total** : ~155 fichiers de code

---

## 🔗 Structure des Imports

### Imports Principaux

```typescript
// Composants UI Blackjack
import { ActionBar, BetComposer, SettlementSheet } from '@/ui/blackjack/components';
import { TableShell, HeaderBar, BottomActionDock } from '@/ui/blackjack/layout';
import { DealerZone, PlayerZone, CenterPotZone } from '@/ui/blackjack/table';

// Hooks
import { useMobileLayout, useValidActions } from '@/ui/blackjack/hooks';
import { useHotkeys, useFocusTrap } from '@/ui/blackjack/a11y';

// Moteur de Jeu
import { 
  createShuffledShoe, 
  drawCard,
  addCardToHand,
  isBlackjack,
  isBusted,
  getBestHandValue
} from '@/lib/blackjack';

// Store
import { useGameStore } from '@/store/useGameStore';

// Utilitaires
import { cn } from '@/lib/utils';
import { tokens } from '@/ui/blackjack/tokens';
import { labels } from '@/ui/blackjack/i18n';
```

---

## 📝 Notes Importantes

1. **Nouveaux Composants UI** : Les composants dans `src/ui/blackjack/` sont la nouvelle architecture UI qui remplace progressivement les anciens composants dans `src/components/`.

2. **Store** : Le store Zustand (`useGameStore.ts`) est le seul état global de l'application. Il gère tout l'état du jeu et persiste dans localStorage.

3. **Moteur de Jeu** : Le moteur de jeu dans `src/lib/blackjack/` est pur (sans dépendances React) et facilement testable.

4. **Accessibilité** : Tous les nouveaux composants respectent les standards d'accessibilité WCAG avec support du mouvement réduit, navigation clavier, et focus trap.

5. **Internationalisation** : Tous les labels sont centralisés dans `src/ui/blackjack/i18n/labels.ts` pour faciliter les traductions futures.

6. **Tests** : Les tests couvrent le moteur de jeu, les règles, et les scénarios de jeu complets.

---

## 🚀 Utilisation

Pour utiliser ce projet :

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement** :
   ```bash
   cp env.template .env
   # Éditer .env avec vos clés Supabase
   ```

3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

4. **Lancer les tests** :
   ```bash
   npm run test
   ```

5. **Build de production** :
   ```bash
   npm run build
   ```

---

**Document créé le** : Janvier 2025
**Version du projet** : 2.0
**Dernière mise à jour** : Janvier 2025
