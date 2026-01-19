# 🚀 Guide de Déploiement sur Vercel

Ce guide vous explique comment déployer l'application Blackjack sur Vercel pour permettre le multijoueur.

## 📋 Prérequis

1. **Compte Vercel** : Créez un compte sur [vercel.com](https://vercel.com)
2. **Compte Supabase** : Votre projet Supabase doit être configuré avec :
   - Les migrations SQL exécutées
   - Les Edge Functions déployées
   - Realtime activé

## 🔧 Étape 1 : Préparer le projet

### 1.1 Vérifier le build local

```bash
npm run build
```

Si le build fonctionne, vous verrez un dossier `dist/` créé.

### 1.2 Vérifier les variables d'environnement

Créez un fichier `.env.example` pour référence :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

## 🌐 Étape 2 : Déployer sur Vercel

### Option A : Déploiement via l'interface Vercel (Recommandé)

1. **Connecter votre repository GitHub**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "Add New Project"
   - Importez votre repository GitHub

2. **Configurer le projet**
   - **Framework Preset** : Vite
   - **Root Directory** : `./` (par défaut)
   - **Build Command** : `npm run build` (déjà configuré dans `vercel.json`)
   - **Output Directory** : `dist` (déjà configuré dans `vercel.json`)
   - **Install Command** : `npm install` (par défaut)

3. **Ajouter les variables d'environnement**
   - Dans la section "Environment Variables", ajoutez :
     ```
     VITE_SUPABASE_URL=https://hiytjwwaocgjdbttmfvd.supabase.co
     VITE_SUPABASE_ANON_KEY=votre_anon_key_ici
     ```
   - ⚠️ **Important** : Remplacez `votre_anon_key_ici` par votre vraie clé anonyme Supabase

4. **Déployer**
   - Cliquez sur "Deploy"
   - Attendez que le build se termine (environ 1-2 minutes)

### Option B : Déploiement via CLI Vercel

1. **Installer Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Se connecter**
   ```bash
   vercel login
   ```

3. **Déployer**
   ```bash
   vercel
   ```
   
   Suivez les instructions :
   - Link to existing project? **N** (première fois)
   - Project name? **blackjack-brilliance** (ou votre choix)
   - Directory? **./**
   - Override settings? **N**

4. **Ajouter les variables d'environnement**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Déployer en production**
   ```bash
   vercel --prod
   ```

## ✅ Étape 3 : Vérifier le déploiement

### 3.1 Vérifier que l'application fonctionne

1. Ouvrez l'URL fournie par Vercel (ex: `https://votre-projet.vercel.app`)
2. Vérifiez que la page se charge correctement
3. Testez le mode Solo pour vérifier que le jeu fonctionne

### 3.2 Vérifier le multijoueur

1. **Créer un compte**
   - Cliquez sur "Mode Multijoueur"
   - Créez un compte avec email/password

2. **Tester le lobby**
   - Vous devriez voir la page `/lobby`
   - Créez une table ou rejoignez-en une

3. **Tester avec plusieurs joueurs**
   - Ouvrez l'application dans plusieurs onglets/navigateurs
   - Connectez-vous avec différents comptes
   - Rejoignez la même table
   - Vérifiez que les actions sont synchronisées en temps réel

## 🔍 Étape 4 : Vérifier Supabase

### 4.1 Vérifier les Edge Functions

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions**
4. Vérifiez que les 5 fonctions sont déployées :
   - `create_table`
   - `join_table`
   - `start_round`
   - `player_action`
   - `dealer_play_and_settle`

### 4.2 Vérifier Realtime

1. Dans le dashboard Supabase, allez dans **Database > Replication**
2. Vérifiez que Realtime est activé pour :
   - `table_state`
   - `tables`
   - `table_players`

### 4.3 Vérifier les migrations SQL

1. Allez dans **SQL Editor**
2. Vérifiez que les tables existent :
   - `profiles`
   - `tables`
   - `table_players`
   - `table_state`
   - `table_actions`

## 🐛 Dépannage

### Problème : "Missing Supabase environment variables"

**Solution** : Vérifiez que les variables d'environnement sont bien configurées dans Vercel :
- Allez dans **Project Settings > Environment Variables**
- Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont présentes
- Redéployez après avoir ajouté les variables

### Problème : "Cannot connect to Supabase"

**Solution** : 
- Vérifiez que votre URL Supabase est correcte
- Vérifiez que votre clé anonyme est correcte
- Vérifiez que votre projet Supabase est actif

### Problème : Le multijoueur ne fonctionne pas

**Solution** :
1. Vérifiez que les Edge Functions sont déployées
2. Vérifiez que Realtime est activé
3. Ouvrez la console du navigateur (F12) pour voir les erreurs
4. Vérifiez les logs Supabase dans le dashboard

### Problème : Les actions ne se synchronisent pas

**Solution** :
- Vérifiez que Realtime est bien activé pour les tables
- Vérifiez que les Edge Functions retournent les bonnes données
- Vérifiez les logs dans le dashboard Supabase

## 📝 Checklist finale

Avant de partager l'URL avec d'autres joueurs :

- [ ] L'application se charge correctement
- [ ] Le mode Solo fonctionne
- [ ] La création de compte fonctionne
- [ ] Le login fonctionne
- [ ] Le lobby s'affiche
- [ ] La création de table fonctionne
- [ ] La jonction à une table fonctionne
- [ ] Les actions se synchronisent en temps réel
- [ ] Plusieurs joueurs peuvent jouer ensemble

## 🎮 Partager avec d'autres joueurs

Une fois déployé, partagez simplement l'URL Vercel avec vos amis :
```
https://votre-projet.vercel.app
```

Ils pourront :
1. Ouvrir l'URL dans leur navigateur
2. Créer un compte
3. Rejoindre votre table ou créer la leur
4. Jouer ensemble en temps réel !

## 🔒 Sécurité

- ⚠️ Ne partagez **jamais** votre clé `service_role` Supabase
- ✅ Utilisez uniquement la clé `anon` dans les variables d'environnement
- ✅ Les Edge Functions utilisent la clé `service_role` côté serveur (sécurisée)

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Vite Configuration](https://vitejs.dev/config/)
