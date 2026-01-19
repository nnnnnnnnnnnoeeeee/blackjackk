# 🔧 Correction du problème de création de table

## Problème identifié

L'erreur "Edge Function returned a non-2xx status code" lors de la création d'une table est généralement causée par :

1. **Permissions RLS** : L'Edge Function utilisait la clé `anon` au lieu de `service_role`
2. **Gestion d'erreurs** : Les erreurs n'étaient pas correctement remontées au client
3. **Authentification** : Le token utilisateur n'était pas correctement vérifié

## ✅ Corrections apportées

### 1. Edge Function `create_table`

- ✅ Utilise maintenant `SUPABASE_SERVICE_ROLE_KEY` pour contourner RLS
- ✅ Vérifie toujours l'authentification de l'utilisateur via le token
- ✅ Meilleure gestion des erreurs avec messages détaillés
- ✅ Logs pour faciliter le débogage

### 2. Page Lobby

- ✅ Vérifie la session avant d'appeler l'Edge Function
- ✅ Meilleure gestion des erreurs avec détails
- ✅ Messages d'erreur plus informatifs

## 🚀 Redéployer l'Edge Function

### Option 1 : Via Supabase CLI (Recommandé)

```bash
# Depuis le répertoire du projet
supabase functions deploy create_table
```

### Option 2 : Via le Dashboard Supabase

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions**
4. Cliquez sur `create_table`
5. Cliquez sur **Deploy** ou **Update**
6. Copiez-collez le contenu de `supabase/functions/create_table/index.ts`
7. Cliquez sur **Deploy**

## 🔍 Vérifier que ça fonctionne

1. **Ouvrez la console du navigateur** (F12)
2. **Essayez de créer une table**
3. **Vérifiez les logs** :
   - Si vous voyez des erreurs dans la console, notez-les
   - Les logs de l'Edge Function apparaîtront dans le dashboard Supabase

## 🐛 Dépannage

### Erreur : "Service role key not configured"

**Solution** : L'Edge Function a besoin de la variable d'environnement `SUPABASE_SERVICE_ROLE_KEY`

1. Allez dans **Edge Functions** → **Settings**
2. Ajoutez la variable d'environnement :
   - **Name** : `SUPABASE_SERVICE_ROLE_KEY`
   - **Value** : Votre clé service_role (trouvable dans Settings → API)

### Erreur : "Unauthorized"

**Solution** : Vérifiez que vous êtes bien connecté

1. Vérifiez que vous êtes connecté (vous devriez voir votre email dans le header)
2. Si non, reconnectez-vous via `/login`
3. Essayez à nouveau de créer une table

### Erreur : "Failed to create table"

**Solution** : Vérifiez les logs de l'Edge Function

1. Allez dans **Edge Functions** → `create_table` → **Logs**
2. Regardez les erreurs détaillées
3. Vérifiez que les migrations SQL sont bien exécutées

## 📝 Checklist

- [ ] L'Edge Function `create_table` est redéployée avec les nouvelles modifications
- [ ] La variable `SUPABASE_SERVICE_ROLE_KEY` est configurée dans les Edge Functions
- [ ] Vous êtes connecté avec un compte valide
- [ ] Les migrations SQL sont exécutées (notamment `001_initial_schema.sql`)

## 🎯 Test

1. Allez sur `/lobby`
2. Entrez un nom de table
3. Cliquez sur "Créer"
4. Vous devriez être redirigé vers `/table/[id]`

Si ça ne fonctionne toujours pas, ouvrez la console (F12) et partagez les erreurs que vous voyez.
