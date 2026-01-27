# 📋 Ce Qui Reste À Faire

## ✅ Ce Qui Est Déjà Fait

- ✅ Tous les composants UI créés (Phase 1-9 complètes)
- ✅ Route `/ux-preview` fonctionnelle pour tester
- ✅ Hooks et logique métier extraits
- ✅ Accessibilité de base implémentée
- ✅ Système i18n créé
- ✅ Performance optimisée

---

## 🎯 Ce Qui Reste À Faire

### 1. Migration de la Page Principale (PRIORITÉ HAUTE)

**Fichier** : `src/pages/Index.tsx`

**Actuellement** : Utilise l'ancien composant `<Table />`

**À faire** : Migrer pour utiliser les nouveaux composants
- Remplacer `<Table />` par `<TableShell>` avec les nouveaux composants
- Utiliser `BetComposer` au lieu de `BetPanel`
- Utiliser `ActionBar` au lieu de `Controls`
- Utiliser `PhaseBanner` au lieu de `GameStatusBar`
- Utiliser `SettlementSheet` pour les résultats

**Avantages** :
- Interface moderne et cohérente
- Meilleure accessibilité
- Design responsive amélioré

---

### 2. Migration MultiplayerTable (PRIORITÉ MOYENNE)

**Fichier** : `src/pages/MultiplayerTable.tsx`

**Actuellement** : Utilise les anciens composants
- `BetPanel` → Remplacer par `BetComposer`
- `Controls` → Remplacer par `ActionBar`
- `CircularTimer` → Remplacer par `TimerBadge`
- Section adversaires → Utiliser `OpponentsZone`
- Indicateur de tour → Utiliser `TurnIndicator`

**À faire** :
- Intégrer `OpponentsZone` pour afficher les adversaires
- Intégrer `TimerBadge` pour le timer
- Intégrer `TurnIndicator` pour indiquer le tour actif
- Utiliser `SidePanelDock` pour les panels latéraux (chat, stats)

---

### 3. Améliorations d'Accessibilité (PRIORITÉ BASSE)

**À compléter** :
- [ ] Vérifier tous les ARIA labels dans les anciens composants
- [ ] Ajouter `aria-describedby` partout où nécessaire
- [ ] Vérifier les contrastes de couleurs (WCAG AA)
- [ ] Tester avec un screen reader complet
- [ ] Vérifier le focus trap dans tous les modals

**Fichiers à vérifier** :
- `src/components/Table.tsx`
- `src/components/BetPanel.tsx`
- `src/components/Controls.tsx`
- `src/pages/MultiplayerTable.tsx`

---

### 4. Uniformisation Labels EN (PRIORITÉ BASSE)

**À faire** :
- [ ] Remplacer tous les labels FR dans `Table.tsx` par les labels EN
- [ ] Remplacer tous les labels FR dans `BetPanel.tsx` par les labels EN
- [ ] Remplacer tous les labels FR dans `Controls.tsx` par les labels EN
- [ ] Utiliser le système `labels` de `src/ui/blackjack/i18n/labels.ts`

**Exemples** :
- "Placez votre mise" → "Place Your Bet"
- "Votre tour" → "Your Turn"
- "Croupier" → "Dealer"
- "Adversaires" → "Opponents"

---

### 5. Nettoyage et Suppression Anciens Composants (APRÈS MIGRATION)

**Une fois la migration complète** :

**À supprimer** (si plus utilisés) :
- [ ] `src/components/GameStatusBar.tsx` → Remplacé par `PhaseBanner`
- [ ] `src/components/CircularTimer.tsx` → Remplacé par `TimerBadge`
- [ ] Vérifier si `BetPanel.tsx` peut être supprimé (si complètement remplacé)
- [ ] Vérifier si `Controls.tsx` peut être supprimé (si complètement remplacé)

**⚠️ Attention** : Ne supprimer que si 100% sûr qu'ils ne sont plus utilisés nulle part !

---

### 6. Tests Finaux (PRIORITÉ MOYENNE)

**À tester** :
- [ ] Tester toutes les phases du jeu sur `/ux-preview`
- [ ] Tester sur mobile (responsive)
- [ ] Tester sur tablet
- [ ] Tester sur desktop
- [ ] Tester keyboard navigation complète
- [ ] Tester avec reduced motion activé
- [ ] Tester avec screen reader
- [ ] Tester performance (pas de lag)

---

## 🎯 Plan d'Action Recommandé

### Étape 1 : Migration Page Principale (1-2h)
1. Modifier `Index.tsx` pour utiliser `TableShell`
2. Tester toutes les fonctionnalités
3. Corriger les bugs éventuels

### Étape 2 : Migration MultiplayerTable (2-3h)
1. Intégrer `OpponentsZone`
2. Intégrer `TimerBadge` et `TurnIndicator`
3. Remplacer `BetPanel` et `Controls`
4. Tester le multijoueur

### Étape 3 : Polish et Tests (1-2h)
1. Uniformiser les labels EN
2. Améliorer l'accessibilité
3. Tests finaux

### Étape 4 : Nettoyage (30min)
1. Supprimer les anciens composants non utilisés
2. Nettoyer les imports

---

## 📊 Statut Actuel

- **Composants créés** : ✅ 100%
- **Route de test** : ✅ 100%
- **Migration page principale** : ⏳ 0%
- **Migration multijoueur** : ⏳ 0%
- **Accessibilité complète** : ⚠️ 60%
- **Labels uniformisés** : ⚠️ 50%
- **Tests finaux** : ⏳ 0%

**Progression globale** : ~65% complété

---

## 🚀 Prochaine Étape Immédiate

**Recommandation** : Commencer par la migration de `Index.tsx` pour que la page principale utilise la nouvelle UI.

Voulez-vous que je commence cette migration maintenant ?

---

**Date** : 27 janvier 2025  
**Dernière mise à jour** : Après correction erreur `canSplit`
