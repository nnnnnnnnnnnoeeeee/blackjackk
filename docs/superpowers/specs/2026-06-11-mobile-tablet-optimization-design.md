# Optimisation Mobile / Tablette — Blackjack & Poker

**Date :** 2026-06-11
**Approche retenue :** A — Fondation mobile partagée + passe écran par écran

## Objectif

Offrir la meilleure expérience de jeu sur téléphone (portrait prioritaire) et
tablette, pour **les deux jeux** (blackjack et poker), sans casser le desktop ni
le blackjack mobile déjà fonctionnel.

## Contexte / État actuel

- **Blackjack** (`src/ui/blackjack/layout/TableShell.tsx`) : bonne base mobile —
  `useMobileLayout`, dock dynamique, safe-area, classes responsives.
- **Poker** (`src/pages/PokerTable.tsx`, `src/pages/PokerSolo.tsx`,
  `src/ui/poker/components/PokerActionBar.tsx`) : peu adapté — `min-h-screen`
  (bug barre d'adresse mobile), tailles de cartes figées (`w-9`, `w-[64px]`),
  pas de safe-area, grille de sièges étroite en portrait.
- **Pages nav** : `Lobby.tsx`, `ModeSelection.tsx`, `Login.tsx`, stats — à
  vérifier/ajuster.
- Stack : Vite + React + React Router + Tailwind (PAS Next.js). Breakpoints
  Tailwind par défaut. `useMobileLayout` : mobile <640, tablette 640–1024,
  desktop ≥1024.

## Principes transversaux (fondation partagée)

1. **Hauteur viewport dynamique** : remplacer `100vh`/`h-screen`/`min-h-screen`
   sur les écrans de jeu par `100dvh` (avec fallback `vh`) → plus de contenu
   coupé par la barre d'adresse iOS/Android.
2. **Safe-areas** : utilitaires CSS réutilisables (`env(safe-area-inset-*)`)
   appliqués au poker comme au blackjack.
3. **Cartes fluides** : taille via `clamp()` plutôt que largeurs en pixels figées
   → rétrécissement propre en portrait étroit.
4. **Cibles tactiles** : boutons d'action ≥ 44px ; désactiver
   `-webkit-tap-highlight`, sélection de texte et overscroll parasites sur les
   surfaces de jeu.

## Périmètre détaillé

### 1. Fondation mobile partagée
- Helpers CSS globaux (`src/index.css` ou équivalent) : classes `h-dvh`,
  `min-h-dvh`, safe-area, `no-tap-highlight`, `touch-target`.
- Système de taille de carte fluide réutilisable (via `PlayingCard` /
  `Card.tsx`), piloté par une variable CSS adaptée à l'orientation.

### 2. Poker (gros du travail)
- `PokerTable` + `PokerSolo` : passage `dvh` + safe-area, sièges lisibles en
  portrait, cartes communautaires et pot/timer compacts.
- `PokerActionBar` : slider de mise tactile (gros pas, raccourcis ½ / pot /
  all-in), boutons pleine largeur en bas.

### 3. Blackjack (polissage)
- Vérifier l'échelle des cartes en portrait, le dock qui ne chevauche pas la
  main, panneaux latéraux en feuille/onglet sur mobile.

### 4. Pages de navigation
- `Lobby`, `ModeSelection`, `Login`, stats : grilles et marges fluides, boutons
  tactiles.

## Approches écartées

- **B — `GameTableShell` unifié** : gros refactor touchant du blackjack
  fonctionnel, risque élevé.
- **C — passe CSS globale seule** : ne corrige pas la structure poker.

## Vérification

- Test en navigateur simulé (iPhone portrait + tablette) avec captures.
- Confirmation finale par l'utilisateur sur appareil réel.
- `npm run build` + `npm run lint` doivent rester verts.

## Hors périmètre (YAGNI)

- Pas de PWA / mode hors-ligne installable.
- Pas de refonte visuelle (couleurs, thème) — uniquement adaptation responsive.
- Pas de nouveaux breakpoints Tailwind personnalisés sauf nécessité.
