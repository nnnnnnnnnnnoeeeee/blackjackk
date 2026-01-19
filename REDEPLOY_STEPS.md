# 🚀 Étapes pour redéployer l'Edge Function create_table

## ✅ Étape 1 : Vérifier que les variables sont configurées

Vous avez déjà configuré :
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` ← **Important pour contourner RLS**
- ✅ `SUPABASE_DB_URL`

## 📝 Étape 2 : Redéployer l'Edge Function

### Option A : Via le Dashboard Supabase (Le plus simple)

1. **Allez sur** [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Sélectionnez votre projet**
3. **Allez dans** **Edge Functions** (menu de gauche)
4. **Cliquez sur** `create_table`
5. **Cliquez sur** le bouton **"Edit"** ou **"Update"** (en haut à droite)
6. **Copiez-collez** le contenu complet du fichier `supabase/functions/create_table/index.ts`
7. **Cliquez sur** **"Deploy"** ou **"Save"**

### Option B : Via Supabase CLI

```bash
# Assurez-vous d'être dans le répertoire du projet
cd /Users/gabinfulcrand/Downloads/blackjack-brilliance-main

# Redéployer la fonction
supabase functions deploy create_table
```

## ✅ Étape 3 : Tester

1. **Allez sur votre application** (localhost:8080 ou votre URL Vercel)
2. **Connectez-vous** avec votre compte
3. **Allez sur** `/lobby`
4. **Entrez un nom de table** (ex: "Ma Table")
5. **Cliquez sur** "Créer"
6. **Vous devriez être redirigé** vers `/table/[id]`

## 🐛 Si ça ne fonctionne toujours pas

### Vérifier les logs

1. **Dashboard Supabase** → **Edge Functions** → `create_table`
2. **Cliquez sur** **"Logs"**
3. **Regardez les erreurs** récentes
4. **Partagez-les** pour qu'on puisse diagnostiquer

### Vérifier la console du navigateur

1. **Ouvrez la console** (F12)
2. **Essayez de créer une table**
3. **Regardez les erreurs** dans la console
4. **Notez le message d'erreur exact**

## 📋 Checklist

- [ ] Variables d'environnement configurées (✅ fait)
- [ ] Edge Function `create_table` redéployée avec le nouveau code
- [ ] Test de création de table effectué
- [ ] Logs vérifiés si erreur

## 🎯 Résultat attendu

Après le redéploiement, quand vous créez une table :
- ✅ La table est créée dans la base de données
- ✅ Vous êtes ajouté comme premier joueur (seat 1)
- ✅ L'état de la table est initialisé
- ✅ Vous êtes redirigé vers la page de la table
