# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (port 8080), auto-runs setup script first
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all tests once (Vitest)
npm run test:watch   # Tests in watch mode
npm run preview      # Preview production build
```

Run a single test file:
```bash
npx vitest run src/test/blackjack.test.ts
```

## Architecture

This is a React/TypeScript blackjack game with both solo and real-time multiplayer modes.

### Core Game Engine (`src/lib/blackjack/`)
Pure TypeScript functions with no React dependencies — immutable state transitions. Start here to understand game logic:
- `types.ts` — All interfaces (`Card`, `Hand`, `GameState`, `GameConfig`, etc.)
- `game.ts` — State machine transitions (BETTING → DEALING → PLAYER_TURN → DEALER_TURN → SETTLEMENT)
- `rules.ts` — Action validation, dealer logic, payout calculations
- `hand.ts` — Hand value calculation, soft/hard ace handling
- `deck.ts` — 6-deck shoe management, shuffle, draw
- `basicStrategy.ts` / `cardcounting.ts` / `sidebets.ts` — Optional features

### State Management (`src/store/useGameStore.ts`)
Zustand store with localStorage persistence. Provides action methods (`placeBet`, `action`, `finishRound`, `newRound`) and computed selectors (`getValidActions`, `getCardCount`). Validates restored state on load to prevent corruption.

### Data Flow
```
User interaction → React component → useGameStore action → game engine function → new GameState → store re-renders
```

### UI Structure
- `src/pages/` — Route-level pages (Game, Login, Lobby, MultiplayerTable, etc.)
- `src/components/` — General UI components (Table, BetPanel, Controls, StatsPanel, etc.)
- `src/ui/blackjack/` — Domain-specific blackjack UI with sub-directories:
  - `components/` — Action buttons, betting, hand/card display, timers
  - `layout/` — TableShell (main container), HeaderBar, BottomActionDock, SidePanelDock
  - `hooks/` — Custom hooks for game interactions
  - `i18n/` — French/English translations
  - `a11y/` — Accessibility utilities

### Backend (Supabase)
- Auth: email/password + Google OAuth
- Database: PostgreSQL (migrations in `supabase/migrations/`)
- Realtime: WebSocket subscriptions for multiplayer table sync
- Solo mode works entirely offline without Supabase

### Routing (`src/App.tsx`)
React Router v6 — public routes (login, register) and protected routes (game, lobby, multiplayer table).

## Key Configuration

Default game rules (in `types.ts`): 6-deck shoe, S17, 3:2 blackjack payout, splits up to 4 times, reshuffle at 25% remaining, min bet 10 / max 1000.

Keyboard defaults: `H`=Hit, `S`=Stand, `D`=Double, `P`=Split (configurable via `src/components/KeyBindingConfig.tsx`).

## Environment

Copy `env.template` to `.env` and fill in Supabase credentials. See `SETUP.md` for database migration instructions.
