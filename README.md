# ♠ Blackjack Brilliance

Un jeu de Blackjack moderne et élégant, développé avec React, TypeScript et Tailwind CSS. Interface "casino premium" avec animations fluides, feedback clair et règles conformes aux standards du casino.

## 🎮 Fonctionnalités

### Règles du Jeu
- **6 decks** (sabot de 312 cartes)
- **S17** (Stand on Soft 17) par défaut
- **Blackjack 3:2** (paiement 1.5x)
- **Actions disponibles** : Hit, Stand, Double, Split
- **Split** : Jusqu'à 1 split par défaut
- **Double après split** : Autorisé par défaut
- **Assurance** : Disponible (optionnelle)
- **Reshuffle** : À 25% du sabot restant

### Interface Utilisateur
- **Design casino premium** : Feutrine verte avec accents dorés
- **Animations fluides** : Distributions de cartes, transitions d'état
- **Feedback visuel** : Indicateurs de phase, résultats clairs
- **Multi-mains** : Support des splits avec indicateurs de main active
- **Statistiques** : Suivi des parties, taux de victoire, blackjacks
- **Responsive** : Optimisé pour mobile et desktop
- **Accessibilité** : Navigation clavier, aria-labels, focus visible

### Raccourcis Clavier
- **H** : Hit (Tirer)
- **S** : Stand (Rester)
- **D** : Double (Doubler)
- **P** : Split (Séparer)

## 🚀 Installation et Développement

### Prérequis
- Node.js 18+ et npm
- (Recommandé) [nvm](https://github.com/nvm-sh/nvm) pour gérer Node.js
- Un compte [Supabase](https://supabase.com) (gratuit) pour le mode multijoueur

### Installation

```bash
# Cloner le repository
git clone <YOUR_GIT_URL>
cd blackjack-brilliance

# Installer les dépendances
npm install

# Lancer le serveur de développement
# Le script de setup s'exécutera automatiquement et créera .env si nécessaire
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

> 💡 **Astuce** : Le script de setup (`scripts/setup.js`) s'exécute automatiquement avant `npm run dev` et :
> - Installe automatiquement les dépendances si `node_modules` n'existe pas
> - Crée automatiquement le fichier `.env` depuis `env.template` s'il n'existe pas
> - **Configure interactivement vos clés Supabase** si elles ne sont pas configurées
> - Vous guide étape par étape pour obtenir et entrer vos clés Supabase
> - Une fois configuré, lance automatiquement l'application

### ⚙️ Configuration des Variables d'Environnement

**Configuration automatique lors de `npm run dev`** 🎯

Quand vous lancez `npm run dev` pour la première fois, le script va automatiquement :
1. Installer les dépendances si nécessaire
2. Créer le fichier `.env` depuis `env.template`
3. **Vous proposer de configurer vos clés Supabase interactivement**
4. Vous guider étape par étape pour obtenir et entrer vos clés
5. Valider les clés que vous entrez
6. Lancer l'application une fois tout configuré

**Option alternative : Configuration manuelle** ✏️

1. **Obtenez vos clés Supabase** :
   - Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
   - Sélectionnez votre projet (ou créez-en un nouveau)
   - Allez dans `Settings` > `API`
   - Copiez :
     - **Project URL** → `VITE_SUPABASE_URL`
     - **anon public** key → `VITE_SUPABASE_ANON_KEY`

2. **Éditez le fichier `.env`** (créé automatiquement ou manuellement) et remplissez les valeurs :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
   ```

3. **Configurez la base de données** :
   - Voir le fichier `SETUP.md` pour les instructions détaillées sur les migrations
   - Appliquez les migrations dans l'ordre depuis `supabase/migrations/`
   - Activez Realtime pour les tables nécessaires

> ⚠️ **Important** : Le fichier `.env` est déjà dans `.gitignore` et ne sera jamais commité. Ne partagez jamais vos clés Supabase publiquement !

> 💡 **Note** : Le mode solo fonctionne sans configuration Supabase. Seul le mode multijoueur nécessite Supabase.

### Scripts Disponibles

```bash
# Développement avec hot-reload
npm run dev

# Tests unitaires
npm run test

# Tests en mode watch
npm run test:watch

# Build de production
npm run build

# Preview du build de production
npm run preview

# Linting
npm run lint
```

## 🏗️ Architecture

### Structure du Projet

```
src/
├── components/          # Composants React UI
│   ├── BetPanel.tsx    # Panneau de mise
│   ├── Controls.tsx    # Boutons d'action (Hit/Stand/Double/Split)
│   ├── HandView.tsx    # Affichage d'une main
│   ├── PlayingCard.tsx # Carte individuelle
│   ├── StatsPanel.tsx  # Statistiques de jeu
│   ├── Table.tsx       # Table principale
│   └── ui/             # Composants shadcn/ui
├── lib/
│   └── blackjack/      # Moteur de jeu pur (sans dépendances React)
│       ├── deck.ts     # Gestion du sabot
│       ├── game.ts     # Logique de jeu et transitions d'état
│       ├── hand.ts     # Calculs de main (valeur, blackjack, etc.)
│       ├── rules.ts    # Règles (validation actions, dealer, payout)
│       └── types.ts    # Types TypeScript
├── store/
│   └── useGameStore.ts # Store Zustand avec persistance
├── test/               # Tests Vitest
│   ├── blackjack.test.ts    # Tests unitaires moteur
│   └── game-flow.test.ts    # Tests scénarios complets
└── pages/              # Pages React Router
```

### Moteur de Jeu

Le moteur de jeu (`src/lib/blackjack/`) est **pur** et **sans dépendances React** :
- Fonctions pures et immutables
- Facilement testable
- Réutilisable dans d'autres contextes

### Store (Zustand)

- **Persistance** : Sauvegarde automatique dans localStorage
- **Validation** : Vérification de l'état restauré pour éviter la corruption
- **Selectors optimisés** : Réduction des re-renders inutiles

## 🧪 Tests

Les tests couvrent :
- Calculs de main (as, blackjack, bust)
- Règles du dealer (S17/H17)
- Actions joueur (hit, stand, double, split)
- Settlement (payout, push, insurance)
- Scénarios complets de partie

```bash
# Lancer tous les tests
npm run test

# Mode watch pour développement
npm run test:watch
```

## 🎨 Personnalisation

### Configuration du Jeu

Modifiez `DEFAULT_CONFIG` dans `src/lib/blackjack/types.ts` :

```typescript
export const DEFAULT_CONFIG: GameConfig = {
  deckCount: 6,              // Nombre de decks
  blackjackPayout: 1.5,      // 3:2 = 1.5, 6:5 = 1.2
  dealerHitsSoft17: false,   // true pour H17
  allowSplit: true,
  maxSplits: 1,
  allowDouble: true,
  allowDoubleAfterSplit: true,
  allowSurrender: false,
  allowInsurance: false,
  minBet: 10,
  maxBet: 1000,
  reshuffleThreshold: 0.25,  // 25% restant
};
```

### Thème et Styles

Les couleurs et styles sont définis dans `src/index.css` avec des variables CSS :
- `--background` : Feutrine verte
- `--primary` : Or casino
- `--success` : Vert (victoire)
- `--destructive` : Rouge (défaite)

## 📦 Build de Production

```bash
npm run build
```

Les fichiers optimisés seront générés dans `dist/`.

## 🐛 Dépannage

### Erreurs de Build
- Vérifier que toutes les dépendances sont installées : `npm install`
- Vérifier la version de Node.js : `node --version` (18+)

### Tests qui échouent
- Vérifier que les dépendances de test sont installées
- Lancer `npm run test` pour voir les erreurs détaillées

### Problèmes de Persistance
- Le localStorage peut être vidé : les données seront réinitialisées
- Vérifier la console du navigateur pour les erreurs de sérialisation

## 📝 Notes Techniques

### Performance
- **Memoization** : Composants React memoizés
- **Selectors Zustand** : Sélection granulaire pour éviter re-renders
- **Animations** : Framer Motion avec optimisations

### Accessibilité
- **Navigation clavier** : Raccourcis H/S/D/P
- **ARIA labels** : Tous les boutons et éléments interactifs
- **Focus visible** : Rings de focus sur tous les éléments focusables
- **Contraste** : Respect des standards WCAG

### Compatibilité
- **Navigateurs** : Chrome, Firefox, Safari, Edge (dernières versions)
- **Mobile** : iOS Safari, Chrome Mobile
- **Responsive** : Breakpoints Tailwind (sm, md, lg)

## 📄 Licence

Ce projet est un exemple éducatif. Les règles du Blackjack sont conformes aux standards des casinos.

## 🙏 Remerciements

- [shadcn/ui](https://ui.shadcn.com/) pour les composants UI
- [Zustand](https://github.com/pmndrs/zustand) pour la gestion d'état
- [Framer Motion](https://www.framer.com/motion/) pour les animations
- [Tailwind CSS](https://tailwindcss.com/) pour le styling

---

**Jouez responsablement** 🎲
