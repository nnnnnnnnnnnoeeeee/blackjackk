# 🚀 Déploiement Rapide sur Vercel

## Méthode la plus simple (5 minutes)

### 1. Préparer votre code
```bash
# Assurez-vous que tout est commité
git add .
git commit -m "Ready for deployment"
git push
```

### 2. Aller sur Vercel
1. Ouvrez [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Connectez votre repository GitHub
4. Sélectionnez le repository `blackjack-brilliance-main`

### 3. Configurer Vercel
- **Framework Preset** : Vite (détecté automatiquement)
- **Root Directory** : `./`
- **Build Command** : `npm run build` (déjà dans vercel.json)
- **Output Directory** : `dist` (déjà dans vercel.json)

### 4. Ajouter les variables d'environnement
Dans la section **"Environment Variables"**, ajoutez :

```
VITE_SUPABASE_URL = https://hiytjwwaocgjdbttmfvd.supabase.co
VITE_SUPABASE_ANON_KEY = votre_clé_anon_supabase
```

⚠️ **Important** : Remplacez `votre_clé_anon_supabase` par votre vraie clé depuis le dashboard Supabase :
- Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
- Sélectionnez votre projet
- Allez dans **Settings > API**
- Copiez la **anon/public** key

### 5. Déployer
Cliquez sur **"Deploy"** et attendez 1-2 minutes.

### 6. Vérifier
Une fois déployé, vous recevrez une URL comme :
```
https://blackjack-brilliance-xxx.vercel.app
```

Testez :
- ✅ La page se charge
- ✅ Mode Solo fonctionne
- ✅ Mode Multijoueur fonctionne (créer un compte, rejoindre une table)

## ✅ Checklist Supabase (à faire AVANT le déploiement)

Assurez-vous que sur Supabase :

- [ ] Les migrations SQL sont exécutées (`001_initial_schema.sql` et `002_enable_realtime.sql`)
- [ ] Les 5 Edge Functions sont déployées :
  - `create_table`
  - `join_table`
  - `start_round`
  - `player_action`
  - `dealer_play_and_settle`
- [ ] Realtime est activé pour `table_state`, `tables`, `table_players`

## 🎮 Partager avec vos amis

Une fois déployé, envoyez simplement l'URL Vercel à vos amis :
```
https://votre-projet.vercel.app
```

Ils pourront :
1. Ouvrir l'URL
2. Créer un compte
3. Rejoindre votre table ou créer la leur
4. Jouer ensemble !

## 🐛 Problèmes courants

**"Missing Supabase environment variables"**
→ Vérifiez que les variables sont bien ajoutées dans Vercel et redéployez

**Le multijoueur ne fonctionne pas**
→ Vérifiez que les Edge Functions sont déployées sur Supabase

**Les actions ne se synchronisent pas**
→ Vérifiez que Realtime est activé dans Supabase

## 📚 Documentation complète

Pour plus de détails, consultez `DEPLOY_VERCEL.md`
