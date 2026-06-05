# Graph Report - blackjackk  (2026-06-05)

## Corpus Check
- 232 files · ~112,844 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1389 nodes · 2709 edges · 106 communities (96 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2c86c740`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 117 edges
2. `useGameStore` - 27 edges
3. `useTranslation()` - 24 edges
4. `📚 Tous les Codes du Projet - Documentation Complète` - 23 edges
5. `Button` - 20 edges
6. `PlayerAction` - 20 edges
7. `compilerOptions` - 20 edges
8. `Card` - 19 edges
9. `useReducedMotion()` - 17 edges
10. `Hand` - 15 edges

## Surprising Connections (you probably didn't know these)
- `CategoryPill()` --calls--> `cn()`  [EXTRACTED]
  src/components/AchievementsPanel.tsx → src/lib/utils.ts
- `PlayingCardProps` --references--> `Card`  [EXTRACTED]
  src/components/PlayingCard.tsx → src/lib/blackjack/types.ts
- `AlertDialogHeader()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts
- `AlertDialogFooter()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts
- `BreadcrumbSeparator()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/breadcrumb.tsx → src/lib/utils.ts

## Import Cycles
- 3-file cycle: `src/components/NewTable.tsx -> src/ui/blackjack/components/index.ts -> src/ui/blackjack/components/SettlementSheet.tsx -> src/components/NewTable.tsx`

## Communities (106 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (17): ForgotPassword, Game, Index, Lobby, Login, ModeSelection, MultiplayerTable, NotFound (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (19): SUIT_COLORS, SUIT_SYMBOLS, PlayingCard, PlayingCardProps, PokerActionBar, HapticPattern, PATTERNS, vibrate() (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (12): Architecture, Backend (Supabase), Commands, Core Game Engine (`src/lib/blackjack/`), Data Flow, Environment, graphify, Key Configuration (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (51): corsHeaders, corsHeaders, corsHeaders, corsHeaders, advanceStreet(), applyAction(), buildPots(), callAmount() (+43 more)

### Community 4 - "Community 4"
Cohesion: 0.27
Nodes (7): getAchievementProgress(), BetValidationResult, useBetValidation(), MobileLayoutInfo, useMobileLayout(), ModeSelection(), useGameStore

### Community 6 - "Community 6"
Cohesion: 0.32
Nodes (7): getLabel(), labels, Language, Translations, TranslationContext, TranslationContextValue, TranslationProvider()

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (10): KeyBindings, ChatPanelProps, Message, KeyBindingConfig, KeyBindingConfigProps, useTranslation(), MultiplayerTable(), PokerLobby() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (18): Suit, Game, decideBotAction(), handStrength(), combinations(), compareHands(), evaluate5(), evaluate7() (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (78): createDeck(), createShoe(), createShuffledShoe(), drawCard(), needsReshuffle(), RANKS, shuffleCards(), SUITS (+70 more)

### Community 12 - "Community 12"
Cohesion: 0.04
Nodes (55): dependencies, canvas-confetti, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, framer-motion (+47 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (28): useIsMobile(), Separator, Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction (+20 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (22): HandResult, CoachSession, Particle, ParticleSystem, ParticleSystemProps, SettlementSheet, SettlementSheetProps, useHaptic() (+14 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (31): 10. Fichiers Supprimés, 1.1 Script de Suppression de Table Multijoueur, 1.2 Modification de `package.json`, 1.3 Configuration Vite - Version Simplifiée (Recommandée), 1. Scripts et Configuration, 2. Nouveaux Composants UI, 3.1 Structure des Hooks, 3.2 Hook useMobileLayout.ts (+23 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (29): Accessibilité, 🏗️ Architecture, ♠ Blackjack Brilliance, 📦 Build de Production, Compatibilité, ⚙️ Configuration des Variables d'Environnement, Configuration du Jeu, 🐛 Dépannage (+21 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (14): Tutorial, TUTORIAL_STEPS, TutorialStep, Table, Card, CardContent, CardDescription, CardFooter (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): 1.1 Accéder à Google Cloud Console, 1.2 Activer l'API Google+, 2.1 Configurer l'écran de consentement OAuth, 2.2 Créer les identifiants OAuth 2.0, 3.1 Activer le provider Google dans Supabase, 3.2 Vérifier les URLs de redirection, 4.1 Ajouter le bouton Google dans Login.tsx, 4.2 Ajouter le bouton Google dans Register.tsx (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (18): UnlockedAchievement, CardCountingStats, GameConfig, GameState, GameStats, HandHistory, INITIAL_STATS, INITIAL_XP (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (20): corsHeaders, shouldDealerHit(), corsHeaders, getNextActiveSeat(), handleBet(), handleDouble(), handleHit(), handleSplit() (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (16): CircularTimer(), CircularTimerProps, NavLink, NavLinkCompatProps, cn(), Checkbox, DialogFooter(), HoverCardContent (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom (+15 more)

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+14 more)

### Community 24 - "Community 24"
Cohesion: 0.10
Nodes (20): 1. Cloner le projet, 2. Installer les dépendances, 3. Configurer les variables d'environnement, 4. Obtenir et configurer les clés Supabase, 5. Configurer la base de données, 6. Lancer l'application, Activer Realtime, Appliquer les migrations (+12 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (14): ACTION_EXPLANATIONS, BASIC_STRATEGY, getBasicStrategyRecommendation(), StrategyAction, StrategyRecommendation, ACTION_COLORS, ACTION_LABELS, BasicStrategyChart (+6 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (14): PerfectPairsConfig, TwentyOnePlus3Config, BetComposer, BetComposerMultiplayer, BetComposerMultiplayerProps, CHIP_VALUES, ChipButton, ChipButtonProps (+6 more)

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (16): BetPanel, CHIP_VALUES, ChipButton, ChipButtonProps, ParticleType, SettlementEffects, useSettlementEffects(), PlayingSound (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.19
Nodes (13): inHandCount(), advanceStreet(), applyAction(), clone(), commit(), createInitialState(), NEXT_STREET, nextSeatMatching() (+5 more)

### Community 29 - "Community 29"
Cohesion: 0.23
Nodes (11): useReducedMotion(), ActionBar, ACTION_CONFIG, ActionBarMultiplayer, ACTION_STYLE, ActionButton, TimerBadge, TimerBadgeProps (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (13): Achievement, ACHIEVEMENTS, checkNewAchievements(), TIER_COLORS, TIER_GRADIENTS, AchievementNotification, AchievementNotificationProps, AchievementCard (+5 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (13): getLevelFromXP(), getXPProgress(), COLORS, StatsDashboard, StatItem, StatItemProps, StatsPanel, XPBar (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (16): 1. Migration de la Page Principale (PRIORITÉ HAUTE), 2. Migration MultiplayerTable (PRIORITÉ MOYENNE), 3. Améliorations d'Accessibilité (PRIORITÉ BASSE), 4. Uniformisation Labels EN (PRIORITÉ BASSE), 5. Nettoyage et Suppression Anciens Composants (APRÈS MIGRATION), 6. Tests Finaux (PRIORITÉ MOYENNE), ✅ Ce Qui Est Déjà Fait, 📋 Ce Qui Reste À Faire (+8 more)

### Community 34 - "Community 34"
Cohesion: 0.14
Nodes (14): PlayerAction, ActionBarProps, ActionBarMultiplayerProps, ActionButtonProps, ACTION_LABELS, CoachFeedback, CoachFeedbackData, CoachFeedbackProps (+6 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (12): SettingsPanel, AccordionContent, AccordionItem, AccordionTrigger, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.19
Nodes (9): GamePhase, GameStatusBar, GameStatusBarProps, PhaseBanner, PhaseBannerProps, HeaderBarProps, casinoTheme, phaseText (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.26
Nodes (10): PokerActionBarProps, callAmount(), isBettingRoundClosed(), legalActions(), minRaiseTo(), seatOf(), BotDecision, PokerAction (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.19
Nodes (14): configureSupabaseKeys(), __dirname, ENV_FILE, ENV_TEMPLATE, __filename, hasValidKeys(), main(), NODE_MODULES (+6 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (12): ButtonProps, buttonVariants, Calendar(), CalendarProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem (+4 more)

### Community 42 - "Community 42"
Cohesion: 0.19
Nodes (9): Card, CardProps, ChipStack(), ChipStackProps, getChipColor(), getChipLabel(), Hand, HandProps (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.19
Nodes (7): NewTable, EMOJI_REACTIONS, PRESET_PHRASES, QuickChatBar(), QuickChatBarProps, UseTableChatOptions, supabase

### Community 44 - "Community 44"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.23
Nodes (11): useToast(), Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.15
Nodes (12): A. Operating rules (read first, obey throughout), Agent Build Spec — Multiplayer Poker (No-Limit Texas Hold'em), B. Scope (decisions are final — implement exactly), C. Reuse map (study these before writing each layer), D. THE critical constraint — hole-card privacy (implement exactly), E. Pure engine — `src/lib/poker/` (Milestone 1), F. Server — migration + edge functions (Milestones 2–3), G. Tests (write alongside each engine file — Milestone 1 gate) (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (12): 10. Accessibilité (a11y), 11. Internationalisation (i18n), 15. Tests, 16. Scripts, 7. Layout Components, 8. Table Zones, Nombre de Fichiers par Catégorie, 📝 Notes Importantes (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, baseUrl, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.17
Nodes (12): scripts, build, build:dev, delete:last-table, dev, lint, predev, preview (+4 more)

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 52 - "Community 52"
Cohesion: 0.31
Nodes (7): conditionalTransition(), conditionalVariants(), useFocusTrap(), BLACKJACK_HOTKEYS, HotkeyConfig, HotkeyHandler, useHotkeys()

### Community 53 - "Community 53"
Cohesion: 0.24
Nodes (7): BottomActionDock, BottomActionDockProps, HeaderBar, SidePanelDock, SidePanelDockProps, TableShell, TableShellProps

### Community 54 - "Community 54"
Cohesion: 0.18
Nodes (10): background_color, categories, description, display, icons, name, orientation, short_name (+2 more)

### Community 55 - "Community 55"
Cohesion: 0.24
Nodes (10): __dirname, ENV_FILE, ENV_TEMPLATE, __filename, main(), question(), rl, rootDir (+2 more)

### Community 56 - "Community 56"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 57 - "Community 57"
Cohesion: 0.18
Nodes (9): Command, CommandDialogProps, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.29
Nodes (5): buildPots(), distribute(), sameSeats(), HandRank, Pot

### Community 59 - "Community 59"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.42
Nodes (5): calculateRunningCount(), calculateTrueCount(), getCardValue(), getCountInterpretation(), CardCountingPanel

### Community 62 - "Community 62"
Cohesion: 0.28
Nodes (7): SettlementResult, HandResultCard, HandResultCardProps, RESULT_COLORS, RESULT_LABELS, ResultSummary, ResultSummaryProps

### Community 63 - "Community 63"
Cohesion: 0.28
Nodes (7): MessageBubble(), TableChat(), TableChatProps, ChatMessage, useTableChat(), ScrollArea, ScrollBar

### Community 64 - "Community 64"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 65 - "Community 65"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 66 - "Community 66"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 67 - "Community 67"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 68 - "Community 68"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 69 - "Community 69"
Cohesion: 0.25
Nodes (7): buildCommand, devCommand, framework, headers, installCommand, outputDirectory, rewrites

### Community 70 - "Community 70"
Cohesion: 0.38
Nodes (6): draw(), freshDeck(), mulberry32(), RANKS, shuffledDeck(), SUITS

### Community 71 - "Community 71"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 72 - "Community 72"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, strict, imports, supabase

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (5): __dirname, ENV_FILE, ENV_TEMPLATE, __filename, rootDir

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (6): 14.1 Utilitaires Généraux, 14.2 Thème Casino, 14.3 Tokens Blackjack, 14.4 Client Supabase, 14.5 Index Principal Blackjack UI, 14. Utilitaires

### Community 75 - "Community 75"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (3): __dirname, __filename, supabase

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (5): 3.1 Composants de Jeu, 3.2 Composants d'Information, 3.3 Composants Multijoueur, 3.4 Composants Visuels, 3. Composants Principaux

### Community 78 - "Community 78"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 79 - "Community 79"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 80 - "Community 80"
Cohesion: 0.50
Nodes (4): 17.1 Migrations, 17.2 Edge Functions, 17.3 Configuration, 17. Configuration Supabase

### Community 81 - "Community 81"
Cohesion: 0.50
Nodes (4): 2.1 `src/main.tsx`, 2.2 `src/App.tsx`, 2.3 `src/index.css`, 2. Point d'Entrée

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 84 - "Community 84"
Cohesion: 0.67
Nodes (3): 12.1 Fichiers Principaux, 12.2 Fichier d'Export, 12. Moteur de Jeu Blackjack

### Community 85 - "Community 85"
Cohesion: 0.67
Nodes (3): 1.1 Fichiers de Configuration, 1.2 Variables d'Environnement, 1. Configuration du Projet

### Community 86 - "Community 86"
Cohesion: 0.67
Nodes (3): 4.1 Pages d'Authentification, 4.2 Pages de Jeu, 4. Pages

### Community 87 - "Community 87"
Cohesion: 0.67
Nodes (3): 6.1 Composants Principaux, 6.2 Fichier d'Export, 6. Nouveaux Composants UI Blackjack

### Community 88 - "Community 88"
Cohesion: 0.67
Nodes (3): 9.1 Hooks Blackjack, 9.2 Hooks Généraux, 9. Hooks Personnalisés

## Knowledge Gaps
- **646 isolated node(s):** `PreToolUse`, `allow`, `$schema`, `style`, `rsc` (+641 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 21` to `Community 1`, `Community 7`, `Community 11`, `Community 13`, `Community 14`, `Community 17`, `Community 25`, `Community 26`, `Community 27`, `Community 29`, `Community 30`, `Community 31`, `Community 34`, `Community 35`, `Community 37`, `Community 38`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 50`, `Community 51`, `Community 53`, `Community 56`, `Community 57`, `Community 59`, `Community 60`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 65`, `Community 66`, `Community 67`, `Community 68`, `Community 71`, `Community 78`, `Community 79`, `Community 82`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `PokerPublicState` connect `Community 38` to `Community 1`, `Community 10`, `Community 28`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 7` to `Community 1`, `Community 35`, `Community 4`, `Community 41`, `Community 11`, `Community 44`, `Community 13`, `Community 14`, `Community 17`, `Community 25`, `Community 63`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `PreToolUse`, `allow`, `$schema` to the rest of the system?**
  _646 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._