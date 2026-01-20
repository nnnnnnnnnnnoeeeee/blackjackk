# 🎰 Prompt d'Amélioration - Blackjack Multijoueur

## 📊 État Actuel du Projet

### ✅ Déjà Implémenté
- **Architecture** : React + TypeScript + Vite + Tailwind CSS
- **Backend** : Supabase (Auth, Postgres, Realtime)
- **Animations** : Framer Motion intégré
- **Design** : Style casino avec feutre vert, bordures dorées, disposition en arc de cercle
- **Fonctionnalités de base** :
  - ✅ Tables publiques/privées avec codes de salle (6 caractères)
  - ✅ Système de profils avec email
  - ✅ Bankroll par joueur (démarre à $1000)
  - ✅ Timers de 5 secondes pour betting et actions
  - ✅ Synchronisation Realtime via Supabase
  - ✅ API REST directe (bypass Edge Functions pour certaines actions)
  - ✅ Disposition adaptative selon nombre de joueurs (2-7)
  - ✅ Indicateurs visuels (joueur actif, timers avec badges)
  - ✅ Système de sons (useSound hook disponible)
  - ✅ Système de particules (ParticleSystem component disponible)

### 🏗️ Architecture Technique Actuelle
- **Frontend** : React 18, TypeScript, Zustand (state management)
- **Styling** : Tailwind CSS avec design system casino personnalisé
- **Animations** : Framer Motion 12.x
- **Backend** : Supabase (Postgres + Realtime + Auth)
- **Build** : Vite
- **UI Components** : shadcn/ui (Radix UI)
- **Routing** : React Router DOM
- **Notifications** : Sonner (toast)

---

## 🎨 AMÉLIORATIONS VISUELLES

### 1. Animations et Transitions
- [ ] **Animation de distribution des cartes** : Cartes volant depuis le sabot vers chaque joueur avec trajectoire réaliste
  - *Note* : Utiliser Framer Motion `animate` avec `path` pour trajectoires courbes
  - *Fichier* : `src/components/PlayingCard.tsx` - Étendre les animations existantes
- [x] **Animation de retournement des cartes** : Effet 3D de flip avec ombre portée
  - *Statut* : ✅ Déjà implémenté dans `PlayingCard.tsx` avec `rotateY`
- [ ] **Animation de mise** : Jetons qui tombent et s'empilent sur la table avec effet physique
  - *Note* : Créer composant `ChipStack.tsx` avec Framer Motion physics
  - *Intégration* : Utiliser dans `BetPanel.tsx` et `MultiplayerTable.tsx`
- [ ] **Animation de victoire/défaite** : Confettis, particules dorées pour les gains, fumée rouge pour les pertes
  - *Note* : Étendre `ParticleSystem.tsx` existant avec nouveaux effets
  - *Déclencheurs* : Dans `handleAction` après settlement
- [ ] **Transition entre phases** : Fade in/out avec texte informatif ("Phase de mise", "Distribution", "Tour du joueur X")
  - *Note* : Créer composant `PhaseTransition.tsx` avec AnimatePresence
  - *Intégration* : Dans `MultiplayerTable.tsx` lors des changements de phase
- [ ] **Animation de passage de tour** : Spotlight qui se déplace d'un joueur à l'autre
  - *Note* : Utiliser `motion.div` avec `layoutId` pour transition fluide
  - *Fichier* : `src/pages/MultiplayerTable.tsx` ligne ~800 (section joueurs)
- [ ] **Effet de "Blackjack!"** : Animation spéciale avec éclat doré et son distinctif
  - *Note* : Combiner `ParticleSystem` + animation scale + son via `useSound`
  - *Déclencheur* : Détecter `isBlackjack` dans `HandView.tsx`
- [ ] **Animation de bust** : Cartes qui explosent ou tombent avec effet de destruction
  - *Note* : Animation de rotation + translation avec Framer Motion
  - *Déclencheur* : Quand `isBusted === true` dans `HandView.tsx`

### 2. Interface Utilisateur Améliorée
- [x] **Indicateurs de statut en temps réel** : Badges animés pour "En attente", "À votre tour", "A joué"
  - *Statut* : ✅ Partiellement implémenté (badge "À VOTRE TOUR" existe)
  - [ ] Améliorer avec plus d'états et animations
- [x] **Barre de progression pour les timers** : Cercle progressif autour du compteur au lieu d'un simple nombre
  - *Statut* : ✅ Compteur numérique existe
  - [ ] Remplacer par composant circulaire avec `@radix-ui/react-progress` (déjà dans dependencies)
- [ ] **Historique des actions** : Panneau latéral montrant les dernières actions de chaque joueur
  - *Note* : Créer composant `ActionHistory.tsx` avec scroll
  - *Data* : Utiliser `table_actions` table Supabase (déjà créée)
  - *UI* : Panneau slide-in depuis la droite avec `motion.div`
- [ ] **Statistiques en direct** : Affichage des statistiques de chaque joueur (mains gagnées, perdues, blackjacks)
  - *Note* : Créer composant `PlayerStats.tsx` avec badges
  - *Data* : Calculer depuis `table_actions` et `table_state`
  - *Affichage* : Sous chaque joueur dans l'arc de cercle
- [ ] **Mini-carte des joueurs** : Vue réduite de toutes les mains en haut de l'écran
  - *Note* : Composant compact `MiniHandView.tsx`
  - *Position* : Header de `MultiplayerTable.tsx`
- [ ] **Zoom sur la main active** : La main du joueur actif s'agrandit légèrement
  - *Note* : Utiliser `scale` dans `motion.div` avec `isActive` prop
  - *Fichier* : `src/pages/MultiplayerTable.tsx` ligne ~827 (Card component)
- [x] **Effet de glow** : Les joueurs actifs ont un halo lumineux autour de leur zone
  - *Statut* : ✅ `ring-4 ring-gold` existe pour joueur actif
  - [ ] Améliorer avec animation pulse continue
- [ ] **Indicateurs de mise** : Affichage visuel des mises de chaque joueur avec jetons colorés
  - *Note* : Créer composant `BetIndicator.tsx` avec chips empilés
  - *Position* : Au-dessus de chaque main de joueur
  - *Couleurs* : Basées sur le montant ($10=rouge, $25=bleu, $50=vert, $100=noir, $250+=or)

### 3. Design Casino Premium
- [x] **Texture de feutre réaliste** : Pattern de feutre de casino avec reflets subtils
  - *Statut* : ✅ Classe `.table-felt` existe dans `src/index.css`
  - [ ] Améliorer avec SVG pattern plus détaillé
- [ ] **Éclairage dynamique** : Lumière qui suit le joueur actif (effet spotlight)
  - *Note* : Utiliser `radial-gradient` CSS animé avec Framer Motion
  - *Position* : Overlay sur le background de la table
- [x] **Bordures dorées animées** : Bordures qui brillent et pulsent légèrement
  - *Statut* : ✅ Bordures dorées existent
  - [ ] Ajouter animation pulse avec `animate-pulse` Tailwind
- [x] **Ombres portées réalistes** : Cartes et jetons avec ombres qui suivent la lumière
  - *Statut* : ✅ `shadow-xl` et `shadow-2xl` utilisés
  - [ ] Améliorer avec ombres directionnelles selon position
- [ ] **Effet de profondeur** : Parallaxe subtile pour créer une sensation de 3D
  - *Note* : Utiliser `transform: translateZ()` avec perspective CSS
  - *Application* : Sur les cartes et joueurs dans l'arc de cercle
- [ ] **Particules ambiantes** : Particules de lumière flottantes en arrière-plan
  - *Note* : Étendre `ParticleSystem.tsx` avec particules continues
  - *Intensité* : Réglable dans les paramètres
- [x] **Design responsive amélioré** : Adaptation parfaite mobile/tablette/desktop avec animations adaptées
  - *Statut* : ✅ Responsive basique existe
  - [ ] Optimiser animations pour mobile (réduire complexité)
- [ ] **Thèmes de table** : Choix entre différents styles (Vegas, Monte Carlo, Macau)
  - *Note* : Créer système de thèmes avec CSS variables
  - *Storage* : Préférence utilisateur dans `profiles` table Supabase
  - *Composant* : `ThemeSelector.tsx` dans Settings

### 4. Cartes et Jetons
- [ ] **Design de cartes premium** : Cartes avec designs personnalisés, dos de cartes élégants
  - *Note* : Créer variants de design dans `PlayingCard.tsx`
  - *Assets* : SVG ou images pour dos de cartes personnalisés
- [ ] **Animation de mélange** : Visualisation du mélange du sabot avant distribution
  - *Note* : Animation de cartes qui se mélangent (visuel uniquement, pas réel)
  - *Déclencheur* : Quand `createShuffledShoe` est appelé
- [ ] **Jetons physiques** : Modèles 3D de jetons avec empilement réaliste
  - *Note* : Créer composant `Chip3D.tsx` avec CSS 3D transforms
  - *Alternative* : Utiliser images empilées avec `transform: translateY`
- [x] **Son de cartes** : Bruitage réaliste de cartes qui glissent, se retournent, s'empilent
  - *Statut* : ✅ `useSound` hook existe
  - [ ] Ajouter sons spécifiques pour chaque action (deal, flip, shuffle)
- [ ] **Effet de réflexion** : Cartes avec reflets subtils comme du vrai papier plastifié
  - *Note* : Utiliser `backdrop-filter` et gradients CSS
  - *Fichier* : `src/components/PlayingCard.tsx`
- [ ] **Animation de chip stacking** : Jetons qui s'empilent avec physique réaliste
  - *Note* : Composant `ChipStack.tsx` avec animation stagger
  - *Intégration* : Dans `BetPanel.tsx` et affichage des mises

---

## 🎮 AMÉLIORATIONS FONCTIONNELLES

### 5. Système de Chat et Communication
- [ ] **Chat en temps réel** : Chat textuel entre joueurs avec émojis
  - *Note* : Créer table `table_messages` dans Supabase
  - *Composant* : `ChatPanel.tsx` avec Supabase Realtime subscription
  - *UI* : Panneau slide-in depuis la droite
  - *Fichier* : Nouveau `src/components/ChatPanel.tsx`
- [ ] **Emotes/Expressions** : Boutons rapides pour "Bonne chance", "Bien joué", etc.
  - *Note* : Créer composant `EmoteButton.tsx` avec icônes Lucide
  - *Actions* : Envoyer message système via `table_actions`
  - *UI* : Barre d'emotes sous le chat
- [x] **Notifications sonores** : Sons distinctifs pour les messages, votre tour, etc.
  - *Statut* : ✅ `useSound` hook disponible
  - [ ] Ajouter sons spécifiques pour chaque événement
- [ ] **Chat vocal** : Option de chat vocal (WebRTC) pour les tables privées
  - *Note* : Intégrer WebRTC avec Supabase Realtime
  - *Composant* : `VoiceChat.tsx` avec contrôles audio
  - *Complexité* : Élevée - nécessite serveur TURN pour NAT traversal
- [ ] **Messages système** : Messages automatiques pour les événements ("Joueur X a rejoint", "Blackjack!")
  - *Note* : Utiliser `table_actions` avec `action_type: 'system_message'`
  - *Affichage* : Toast ou panneau d'événements
  - *Fichier* : Étendre `MultiplayerTable.tsx` subscribeToTable

### 6. Système de Spectateurs
- [ ] **Mode spectateur** : Permettre à des utilisateurs de regarder sans jouer
  - *Note* : Ajouter `role: 'spectator'` dans `table_players`
  - *Migration* : `ALTER TABLE table_players ADD COLUMN role TEXT DEFAULT 'player'`
  - *RLS* : Permettre SELECT pour spectateurs
- [ ] **Vue spectateur** : Vue d'ensemble avec toutes les mains visibles
  - *Note* : Mode spécial dans `MultiplayerTable.tsx` quand `role === 'spectator'`
  - *UI* : Toutes les cartes face visible, vue d'ensemble
- [ ] **Statistiques en direct** : Cotes, probabilités, recommandations affichées pour les spectateurs
  - *Note* : Utiliser `basicStrategy.ts` existant
  - *Composant* : `SpectatorStats.tsx` avec calculs en temps réel
- [ ] **Chat spectateurs** : Chat séparé pour les spectateurs
  - *Note* : Filtrer messages par `role` dans `table_messages`
  - *UI* : Panneau chat avec badge "Spectateur"

### 7. Statistiques et Historique
- [ ] **Tableau de bord personnel** : Statistiques détaillées (taux de victoire, meilleure main, etc.)
  - *Note* : Créer page `src/pages/Stats.tsx`
  - *Data* : Agréger depuis `table_actions` et `table_state`
  - *Graphiques* : Utiliser Recharts (déjà dans dependencies)
- [ ] **Historique des parties** : Replay des dernières parties avec timeline
  - *Note* : Stocker snapshots de `table_state` dans nouvelle table `game_snapshots`
  - *Composant* : `GameReplay.tsx` avec timeline interactive
  - *Storage* : JSONB avec timestamps
- [ ] **Classements** : Leaderboard global et par table
  - *Note* : Créer vue SQL `player_leaderboard` dans Supabase
  - *Page* : `src/pages/Leaderboard.tsx`
  - *Métriques* : Bankroll totale, victoires, blackjacks
- [ ] **Achievements/Badges** : Système de succès ("Premier Blackjack", "10 victoires consécutives", etc.)
  - *Note* : Table `achievements` et `user_achievements` dans Supabase
  - *Composant* : `AchievementBadge.tsx` avec animations
  - *Déclencheurs* : Edge Functions ou triggers PostgreSQL
- [ ] **Graphiques de performance** : Évolution de la bankroll, graphiques de résultats
  - *Note* : Utiliser Recharts dans `StatsDashboard.tsx` (déjà existe pour solo)
  - *Adapter* : Pour données multijoueur depuis `table_players.bankroll` historique
- [ ] **Statistiques de stratégie** : Analyse des décisions prises vs stratégie optimale
  - *Note* : Comparer actions dans `table_actions` avec `basicStrategy.ts`
  - *Composant* : `StrategyAnalysis.tsx` avec pourcentages

### 8. Options de Table Avancées
- [ ] **Règles personnalisables** : Créateur peut définir les règles (H17/S17, DAS, etc.)
  - *Note* : Utiliser `config JSONB` dans `tables` (déjà existe)
  - *UI* : Formulaire dans `Lobby.tsx` lors de la création
  - *Composant* : `TableRulesEditor.tsx`
- [ ] **Limites de mise** : Définir les mises min/max par table
  - *Note* : Ajouter `min_bet` et `max_bet` dans `tables`
  - *Validation* : Dans `handleAction('bet')` dans `MultiplayerTable.tsx`
- [x] **Nombre de decks** : Choix du nombre de jeux (1-8 decks)
  - *Statut* : ✅ `createShuffledShoe(deckCount)` existe
  - [ ] Exposer dans UI de création de table
- [x] **Temps de réflexion** : Personnaliser le temps alloué par action (5-30 secondes)
  - *Statut* : ✅ Timer configurable (actuellement 5s fixe)
  - [ ] Ajouter slider dans création de table
- [ ] **Mode rapide** : Tables avec timers réduits pour joueurs expérimentés
  - *Note* : Table avec `game_speed: 'fast'` (timer 3s)
  - *Badge* : Afficher "⚡ Rapide" dans lobby
- [ ] **Mode tournoi** : Système de tournois avec élimination progressive
  - *Note* : Nouvelle table `tournaments` avec structure complexe
  - *Composant* : `TournamentBracket.tsx`
  - *Complexité* : Très élevée
- [x] **Tables privées avec mot de passe** : En plus du code de salle
  - *Statut* : ✅ Code de salle existe
  - [ ] Ajouter option mot de passe supplémentaire

### 9. Système de Bankroll et Économie
- [x] **Système de crédits virtuels** : Crédits gagnés/perdus avec historique
  - *Statut* : ✅ Bankroll dans `table_players` existe
  - [ ] Ajouter historique des transactions
- [ ] **Recharge de bankroll** : Système pour recharger sa bankroll (virtuel ou réel)
  - *Note* : Table `transactions` avec `type: 'recharge'`
  - *UI* : Modal `RechargeModal.tsx` dans profil
  - *Intégration* : Stripe pour paiements réels (optionnel)
- [ ] **Transferts entre joueurs** : Possibilité de transférer des crédits
  - *Note* : Edge Function `transfer_credits` avec validation
  - *UI* : Bouton dans profil joueur
- [ ] **Historique des transactions** : Journal complet des gains/pertes
  - *Note* : Table `transactions` avec `user_id`, `amount`, `type`, `table_id`
  - *Page* : `src/pages/TransactionHistory.tsx`
- [ ] **Limites de mise intelligentes** : Suggestions basées sur la bankroll
  - *Note* : Calculer dans `BetPanel.tsx` selon bankroll actuel
  - *UI* : Badges "Recommandé" sur boutons de mise

---

## 🚀 AMÉLIORATIONS TECHNIQUES

### 10. Performance et Optimisation
- [ ] **Lazy loading des composants** : Chargement progressif pour meilleures performances
  - *Note* : Utiliser `React.lazy()` et `Suspense` pour composants lourds
  - *Candidats* : `StatsDashboard`, `ParticleSystem`, `ChatPanel`
- [x] **Optimisation des animations** : Utilisation de CSS transforms et GPU acceleration
  - *Statut* : ✅ Framer Motion utilise GPU
  - [ ] Vérifier `will-change` CSS sur éléments animés
- [ ] **Compression des données** : Réduction de la taille des payloads Realtime
  - *Note* : Compresser `state_json` avant stockage (optionnel)
  - *Alternative* : Ne stocker que les différences (deltas)
- [ ] **Cache intelligent** : Mise en cache des états de table pour récupération rapide
  - *Note* : Utiliser Zustand persist ou localStorage pour cache local
  - *Invalidation* : Basée sur `updated_at` timestamp
- [x] **Debouncing des actions** : Éviter les actions multiples accidentelles
  - *Statut* : ✅ Partiellement (timers empêchent actions rapides)
  - [ ] Ajouter debounce explicite sur `handleAction`
- [ ] **Service Worker** : Support offline et notifications push
  - *Note* : Créer `public/sw.js` avec Workbox
  - *Notifications* : Push API pour "Votre tour" même si tab fermée

### 11. Sécurité et Anti-Triche
- [x] **Validation serveur renforcée** : Toutes les actions validées côté serveur
  - *Statut* : ✅ Actions via API REST avec validation
  - [ ] Migrer toutes les actions vers Edge Functions pour sécurité maximale
- [ ] **Détection de patterns suspects** : Détection de comportements anormaux
  - *Note* : Edge Function `detect_cheating` avec analyse de patterns
  - *Métriques* : Temps de réponse, actions impossibles, etc.
- [ ] **Rate limiting** : Limitation du nombre d'actions par seconde
  - *Note* : Middleware dans Edge Functions ou PostgreSQL triggers
  - *Limite* : 1 action par seconde par joueur
- [ ] **Logs d'audit** : Enregistrement de toutes les actions pour audit
  - *Note* : Table `audit_logs` avec toutes les actions
  - *Trigger* : PostgreSQL trigger sur `table_actions`
- [x] **Chiffrement des communications** : Toutes les données chiffrées en transit
  - *Statut* : ✅ HTTPS + Supabase utilise TLS
- [ ] **Vérification d'intégrité** : Vérification que l'état client correspond au serveur
  - *Note* : Hash de `state_json` stocké séparément
  - *Validation* : Comparer hash avant chaque action

### 12. Realtime et Synchronisation
- [ ] **Optimistic updates** : Mise à jour immédiate de l'UI avec rollback si erreur
  - *Note* : Mettre à jour `gameState` local avant réponse serveur
  - *Rollback* : Si erreur, restaurer depuis `table_state`
- [ ] **Reconciliation d'état** : Résolution automatique des conflits d'état
  - *Note* : Comparer timestamps et fusionner intelligemment
  - *Stratégie* : Serveur fait foi, client se synchronise
- [ ] **Indicateurs de connexion** : Badge montrant la qualité de connexion de chaque joueur
  - *Note* : Utiliser `navigator.connection` API
  - *Composant* : `ConnectionIndicator.tsx` avec couleurs (vert/jaune/rouge)
- [ ] **Reconnexion automatique** : Reconnexion transparente en cas de perte de connexion
  - *Note* : Détecter déconnexion Supabase et reconnecter
  - *État* : Sauvegarder état local pendant reconnexion
- [x] **Synchronisation des timers** : Timers synchronisés entre tous les clients
  - *Statut* : ✅ Timers côté client (pas synchronisés)
  - [ ] Implémenter timers serveur avec broadcast Realtime
- [ ] **Queue d'actions** : File d'attente pour les actions en cas de latence
  - *Note* : Queue locale avec `queueMicrotask`
  - *Affichage* : Indicateur "Envoi..." pendant latence

---

## 🎯 AMÉLIORATIONS D'EXPÉRIENCE UTILISATEUR

### 13. Onboarding et Tutoriel
- [ ] **Tutoriel interactif multijoueur** : Guide pas à pas pour nouveaux joueurs
  - *Note* : Étendre `Tutorial.tsx` existant avec étapes multijoueur
  - *Détection* : Si `tutorialCompleted === false` et première table
- [ ] **Tooltips contextuels** : Explications au survol des éléments
  - *Note* : Utiliser `@radix-ui/react-tooltip` (déjà dans dependencies)
  - *Cibles* : Boutons d'action, timers, badges de statut
- [ ] **Mode démo** : Table de démonstration pour tester sans risque
  - *Note* : Table spéciale `demo_table` avec bankroll infinie
  - *Badge* : "DÉMO" dans lobby
- [ ] **FAQ intégrée** : Section d'aide accessible depuis la table
  - *Note* : Composant `HelpPanel.tsx` avec accordion
  - *Contenu* : Règles, stratégie, FAQ multijoueur
- [ ] **Vidéo tutoriel** : Vidéo explicative intégrée
  - *Note* : Embed YouTube ou vidéo locale
  - *Position* : Dans `HelpPanel.tsx`

### 14. Accessibilité
- [ ] **Support clavier complet** : Toutes les actions accessibles au clavier
  - *Note* : Ajouter `onKeyDown` handlers sur tous les boutons
  - *Raccourcis* : H=Hit, S=Stand, D=Double, P=Split
- [ ] **Lecteur d'écran** : Compatibilité avec les lecteurs d'écran
  - *Note* : Ajouter `aria-label` et `role` sur tous les éléments interactifs
  - *Test* : Avec NVDA ou VoiceOver
- [ ] **Contraste amélioré** : Mode haut contraste pour malvoyants
  - *Note* : Classe CSS `.high-contrast` avec variables override
  - *Toggle* : Dans Settings
- [ ] **Taille de police ajustable** : Contrôles pour ajuster la taille du texte
  - *Note* : CSS variable `--font-size-base` avec slider
  - *Storage* : Préférence dans localStorage
- [x] **Indicateurs visuels et sonores** : Alternatives pour tous les feedbacks
  - *Statut* : ✅ Toasts visuels + sons disponibles
  - [ ] Ajouter options pour désactiver sons
- [ ] **Sous-titres pour les sons** : Transcription des événements sonores
  - *Note* : Badge texte pour chaque événement sonore
  - *Exemple* : "🔊 Son: Carte distribuée"

### 15. Personnalisation
- [ ] **Profils personnalisés** : Avatar, nom d'affichage, bio
  - *Note* : Étendre `profiles` table avec `avatar_url`, `display_name`, `bio`
  - *Upload* : Supabase Storage pour avatars
  - *Composant* : `ProfileEditor.tsx`
- [ ] **Thèmes personnalisables** : Choix de couleurs, styles de cartes
  - *Note* : Système de thèmes avec CSS variables
  - *Storage* : Préférence dans `profiles.preferences JSONB`
- [x] **Préférences de notification** : Personnalisation des alertes et sons
  - *Statut* : ✅ `useSound` avec enable/disable
  - [ ] Ajouter préférences dans Settings
- [ ] **Raccourcis clavier personnalisables** : Mapping des touches selon préférences
  - *Note* : Table `keyboard_shortcuts` ou localStorage
  - *UI* : `KeyboardShortcutsEditor.tsx`
- [ ] **Layout personnalisable** : Réorganisation des éléments de l'interface
  - *Note* : Drag & drop avec `react-resizable-panels` (déjà dans dependencies)
  - *Storage* : Layout dans localStorage

### 16. Social et Communauté
- [ ] **Liste d'amis** : Système d'amis avec invitations
  - *Note* : Table `friendships` avec `user_id`, `friend_id`, `status`
  - *Page* : `src/pages/Friends.tsx`
- [ ] **Tables d'amis** : Créer des tables réservées aux amis
  - *Note* : Option `friends_only: true` dans création de table
  - *Validation* : Vérifier amitié avant join
- [ ] **Statut en ligne** : Voir quels amis sont en ligne
  - *Note* : Table `user_presence` avec `last_seen` timestamp
  - *Subscription* : Realtime sur `user_presence`
- [ ] **Invitations** : Inviter des amis à rejoindre une table
  - *Note* : Table `invitations` avec `table_id`, `from_user_id`, `to_user_id`
  - *Notification* : Toast ou badge dans header
- [ ] **Partage de parties** : Partager des moments forts sur réseaux sociaux
  - *Note* : Générer image avec `html2canvas` ou screenshot API
  - *Share* : Web Share API
- [ ] **Guildes/Clubs** : Groupes de joueurs avec compétitions internes
  - *Note* : Tables `guilds` et `guild_members`
  - *Complexité* : Élevée

---

## 🎲 FONCTIONNALITÉS AVANCÉES

### 17. Modes de Jeu Spéciaux
- [ ] **Mode équipe** : Joueurs en équipe contre le croupier
  - *Note* : Nouveau `game_mode: 'team'` dans `tables`
  - *Logique* : Bankroll partagée, décisions collaboratives
- [ ] **Mode tournoi** : Tournois éliminatoires avec prix
  - *Note* : Table `tournaments` avec brackets
  - *Complexité* : Très élevée
- [ ] **Mode speed** : Parties ultra-rapides avec timers réduits
  - *Note* : `game_speed: 'speed'` avec timer 2s
  - *Badge* : "⚡⚡ Speed" dans lobby
- [ ] **Mode stratégie** : Tables avec recommandations de stratégie affichées
  - *Note* : Utiliser `basicStrategy.ts` existant
  - *Affichage* : Badge "Recommandé: Hit" sur chaque main
- [ ] **Mode apprentissage** : Tables avec explications des règles et stratégies
  - *Note* : Tooltips explicatifs sur chaque action
  - *Badge* : "📚 Apprentissage" dans lobby
- [ ] **Mode défi** : Défis quotidiens avec objectifs spécifiques
  - *Note* : Table `daily_challenges` avec objectifs
  - *Exemple* : "Gagner avec un blackjack"

### 18. Intégrations et Extensions
- [ ] **API publique** : API pour développeurs tiers
  - *Note* : Endpoints REST documentés avec OpenAPI
  - *Auth* : API keys dans `api_keys` table
- [ ] **Plugins** : Système de plugins pour extensions
  - *Note* : Architecture modulaire avec hooks
  - *Complexité* : Très élevée
- [ ] **Intégration streaming** : Support pour streamers (Twitch, YouTube)
  - *Note* : OAuth avec Twitch/YouTube
  - *Features* : Overlay pour stream, stats overlay
- [ ] **Widgets** : Widgets embeddables pour sites web
  - *Note* : Iframe avec API publique
  - *Customization* : Paramètres via URL
- [ ] **Mobile app** : Applications natives iOS/Android
  - *Note* : React Native avec même codebase
  - *Alternative* : PWA avec manifest
- [ ] **Desktop app** : Application desktop avec Electron
  - *Note* : Wrapper Electron autour de l'app web
  - *Features* : Notifications natives, raccourcis système

### 19. Analytics et Insights
- [ ] **Dashboard analytique** : Statistiques détaillées pour les créateurs de table
  - *Note* : Page `src/pages/TableAnalytics.tsx`
  - *Métriques* : Joueurs actifs, durée moyenne, bankroll moyenne
- [ ] **Heatmaps** : Visualisation des zones les plus utilisées
  - *Note* : Tracking des clics avec `@vercel/analytics` ou custom
  - *Visualisation* : Overlay sur screenshot de table
- [ ] **A/B testing** : Tests de différentes configurations
  - *Note* : Système de variants avec feature flags
  - *Storage* : `feature_flags` table
- [ ] **Feedback utilisateur** : Système de feedback intégré
  - *Note* : Composant `FeedbackModal.tsx` avec formulaire
  - *Storage* : Table `user_feedback`
- [ ] **Métriques de performance** : Temps de chargement, latence, etc.
  - *Note* : Intégrer Sentry ou Datadog
  - *Dashboard* : Métriques dans Supabase Dashboard

### 20. Multilingue et Internationalisation
- [ ] **Support multilingue** : Traduction en plusieurs langues
  - *Note* : Utiliser `react-i18next` ou `next-intl`
  - *Fichiers* : `locales/fr.json`, `locales/en.json`, etc.
- [ ] **Détection automatique** : Détection de la langue du navigateur
  - *Note* : `navigator.language` avec fallback
  - *Storage* : Préférence dans `profiles.language`
- [ ] **Format de devises** : Support de différentes devises
  - *Note* : `Intl.NumberFormat` pour formatage
  - *Exemples* : $, €, £, ¥
- [ ] **Fuseaux horaires** : Affichage des heures selon fuseau horaire
  - *Note* : `date-fns-tz` (déjà `date-fns` dans dependencies)
  - *Affichage* : Timestamps localisés
- [ ] **Règles locales** : Adaptation des règles selon région
  - *Note* : Mapping région → règles dans config
  - *Exemple* : Règles européennes vs américaines

---

## 📱 AMÉLIORATIONS MOBILE

### 21. Expérience Mobile Optimisée
- [ ] **Gestes tactiles** : Swipe pour actions rapides
  - *Note* : Utiliser `react-swipeable` ou `@use-gesture/react`
  - *Gestes* : Swipe gauche=Hit, droite=Stand, haut=Double
- [ ] **Vibration** : Feedback haptique pour les événements importants
  - *Note* : `navigator.vibrate()` API
  - *Événements* : Votre tour, blackjack, bust
- [ ] **Notifications push** : Alertes quand c'est votre tour
  - *Note* : Service Worker + Push API
  - *Permissions* : Demander permission notification
- [x] **Mode portrait/paysage** : Adaptation automatique selon orientation
  - *Statut* : ✅ Responsive CSS existe
  - [ ] Optimiser layout pour portrait (joueurs en ligne)
- [ ] **Boutons agrandis** : Boutons optimisés pour le tactile
  - *Note* : Min 44x44px selon Apple HIG
  - *Classes* : `min-h-[44px] min-w-[44px]` Tailwind
- [ ] **Interface simplifiée** : Version mobile avec éléments essentiels uniquement
  - *Note* : Détecter mobile avec `useMediaQuery`
  - *Cacher* : Stats, chat (optionnel), particules

---

## 🎨 PRIORISATION SUGGÉRÉE

### Phase 1 - Essentiel (Impact élevé, Effort moyen) - 2-3 semaines
1. ✅ **Barre de progression pour les timers** - Remplacer compteur numérique par cercle progressif
2. ✅ **Chat en temps réel** - Système de chat basique avec Supabase Realtime
3. ✅ **Indicateurs de mise visuels** - Chips empilés pour chaque joueur
4. ✅ **Animation de distribution des cartes** - Trajectoires réalistes avec Framer Motion
5. ✅ **Statistiques de base** - Affichage sous chaque joueur (victoires, blackjacks)

### Phase 2 - Important (Impact élevé, Effort élevé) - 1-2 mois
1. ✅ **Historique des actions** - Panneau latéral avec dernières actions
2. ✅ **Système de spectateurs** - Mode spectateur avec vue d'ensemble
3. ✅ **Classements** - Leaderboard global et par table
4. ✅ **Personnalisation de profil** - Avatar, nom d'affichage, bio
5. ✅ **Règles personnalisables** - Créateur peut définir règles de table

### Phase 3 - Nice to Have (Impact moyen, Effort variable) - 2-3 mois
1. ✅ **Thèmes de table multiples** - Vegas, Monte Carlo, Macau
2. ✅ **Mode tournoi** - Système de tournois avec brackets
3. ✅ **Système d'amis** - Liste d'amis, invitations, tables d'amis
4. ✅ **Achievements/Badges** - Système de succès avec animations
5. ✅ **Historique avec replay** - Replay des parties avec timeline

---

## 🛠️ CONSIDÉRATIONS TECHNIQUES SPÉCIFIQUES AU PROJET

### Stack Actuel
- **Frontend** : React 18 + TypeScript + Vite
- **State** : Zustand (local) + Supabase Realtime (sync)
- **Styling** : Tailwind CSS avec design system casino
- **Animations** : Framer Motion 12.x
- **Backend** : Supabase (Postgres + Realtime + Auth + Storage)
- **UI Components** : shadcn/ui (Radix UI primitives)
- **Routing** : React Router DOM v6
- **Notifications** : Sonner (toast)

### Architecture Recommandée pour Nouvelles Features

#### Chat System
```typescript
// Nouvelle table Supabase
CREATE TABLE table_messages (
  id UUID PRIMARY KEY,
  table_id UUID REFERENCES tables(id),
  user_id UUID REFERENCES auth.users(id),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// Composant React
src/components/ChatPanel.tsx
- Utilise Supabase Realtime subscription
- Scroll automatique vers dernier message
- Emojis picker intégré
```

#### Spectator Mode
```typescript
// Migration Supabase
ALTER TABLE table_players 
ADD COLUMN role TEXT DEFAULT 'player' CHECK (role IN ('player', 'spectator'));

// Modifications MultiplayerTable.tsx
- Détecter role === 'spectator'
- Afficher toutes les cartes face visible
- Masquer contrôles d'action
```

#### Statistics System
```typescript
// Vue SQL pour statistiques
CREATE VIEW player_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE result = 'win') as wins,
  COUNT(*) FILTER (WHERE result = 'lose') as losses,
  COUNT(*) FILTER (WHERE is_blackjack = true) as blackjacks
FROM table_actions
GROUP BY user_id;

// Composant
src/components/PlayerStats.tsx
- Utilise vue SQL
- Affiche badges sous chaque joueur
```

### Patterns de Code Recommandés

#### Pour Nouvelles Animations
```typescript
// Utiliser Framer Motion avec variants
const cardDealVariants = {
  hidden: { x: -200, y: -200, rotate: -90, opacity: 0 },
  visible: { x: 0, y: 0, rotate: 0, opacity: 1 }
};

// Dans composant
<motion.div
  variants={cardDealVariants}
  initial="hidden"
  animate="visible"
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
```

#### Pour Realtime Subscriptions
```typescript
// Pattern existant dans MultiplayerTable.tsx
const channel = supabase
  .channel(`table_${id}`)
  .on('postgres_changes', { ... }, (payload) => {
    // Mettre à jour state
  })
  .subscribe();
```

#### Pour Nouvelles Tables Supabase
```sql
-- Toujours inclure RLS
ALTER TABLE nouvelle_table ENABLE ROW LEVEL SECURITY;

-- Policy pour lecture
CREATE POLICY "Users can read..."
ON nouvelle_table FOR SELECT
USING (auth.uid() = user_id OR ...);

-- Policy pour écriture
CREATE POLICY "Users can insert..."
ON nouvelle_table FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 📝 NOTES FINALES

### Fichiers Clés du Projet
- **Multiplayer Table** : `src/pages/MultiplayerTable.tsx` (1067 lignes)
- **Lobby** : `src/pages/Lobby.tsx`
- **Game Logic** : `src/lib/blackjack/game.ts`
- **Components** : `src/components/PlayingCard.tsx`, `HandView.tsx`
- **Supabase Config** : `src/lib/supabaseClient.ts`
- **Migrations** : `supabase/migrations/`

### Points d'Attention
1. **Performance** : Le fichier `MultiplayerTable.tsx` est volumineux (1067 lignes) - considérer split en sous-composants
2. **State Management** : Mélange de Zustand (solo) et Supabase Realtime (multi) - harmoniser si possible
3. **Edge Functions** : Certaines actions utilisent API REST directe - migrer vers Edge Functions pour sécurité
4. **Type Safety** : `GameState` interface pourrait être plus strict (utiliser types depuis `blackjack/types.ts`)

### Prochaines Étapes Recommandées
1. **Refactoring** : Split `MultiplayerTable.tsx` en composants plus petits
2. **Tests** : Ajouter tests pour logique multijoueur
3. **Documentation** : Documenter l'API et les patterns
4. **Performance** : Profiler et optimiser les re-renders

**Dernière mise à jour** : 2024
**Version** : 2.0 (Adapté au projet actuel)
**État** : ✅ Fonctionnel avec améliorations suggérées
