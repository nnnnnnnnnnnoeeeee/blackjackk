# 📧 Voir les emails et statut de vérification dans Profiles

Ce guide vous explique comment voir les emails et le statut de vérification des utilisateurs dans la table `profiles`.

## 🔧 Étape 1 : Exécuter la migration

Pour ajouter les colonnes `email` et `email_verified` à la table `profiles`, exécutez la migration :

### Via SQL Editor dans Supabase

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Cliquez sur **New Query**
5. Copiez-collez le contenu de `supabase/migrations/003_add_email_to_profiles.sql`
6. Cliquez sur **Run**

### Via Supabase CLI (si installé)

```bash
supabase migration up
```

## 📊 Étape 2 : Voir les données dans Table Editor

### Méthode 1 : Via le Dashboard Supabase

1. Allez dans **Table Editor**
2. Sélectionnez la table **profiles**
3. Vous verrez maintenant les colonnes :
   - `id` - UUID de l'utilisateur
   - `username` - Nom d'utilisateur
   - `email` - Adresse email ✅ **NOUVEAU**
   - `email_verified` - Boolean (true/false) ✅ **NOUVEAU**
   - `email_verified_at` - Date de vérification ✅ **NOUVEAU**
   - `avatar_url` - URL de l'avatar
   - `created_at` - Date de création

### Méthode 2 : Via SQL Editor

#### Voir tous les profils avec email et statut de vérification
```sql
SELECT 
  id,
  username,
  email,
  email_verified,
  email_verified_at,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
```

#### Voir uniquement les utilisateurs avec email vérifié
```sql
SELECT 
  username,
  email,
  email_verified_at,
  created_at
FROM public.profiles
WHERE email_verified = true
ORDER BY email_verified_at DESC;
```

#### Voir les utilisateurs qui n'ont pas vérifié leur email
```sql
SELECT 
  username,
  email,
  created_at
FROM public.profiles
WHERE email_verified = false OR email_verified IS NULL
ORDER BY created_at DESC;
```

#### Statistiques sur la vérification des emails
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
  COUNT(CASE WHEN email_verified = false OR email_verified IS NULL THEN 1 END) as unverified_users,
  ROUND(
    COUNT(CASE WHEN email_verified = true THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as verification_rate_percent
FROM public.profiles;
```

## 🔄 Synchronisation automatique

La migration crée des triggers qui synchronisent automatiquement :

1. **Quand un utilisateur confirme son email** → `email_verified` passe à `true` et `email_verified_at` est mis à jour
2. **Quand un utilisateur change son email** → La colonne `email` est mise à jour dans `profiles`
3. **Quand un nouvel utilisateur s'inscrit** → Le profil est créé avec l'email et le statut de vérification

## 📝 Notes importantes

- Les données existantes sont automatiquement synchronisées lors de l'exécution de la migration
- Les nouveaux utilisateurs auront automatiquement leur email dans `profiles`
- Le statut de vérification est synchronisé en temps réel via les triggers

## 🎯 Cas d'usage

### Voir qui a vérifié son email aujourd'hui
```sql
SELECT 
  username,
  email,
  email_verified_at
FROM public.profiles
WHERE DATE(email_verified_at) = CURRENT_DATE
ORDER BY email_verified_at DESC;
```

### Voir les utilisateurs actifs avec email vérifié
```sql
SELECT DISTINCT
  p.username,
  p.email,
  p.email_verified,
  u.last_sign_in_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email_verified = true
  AND u.last_sign_in_at > NOW() - INTERVAL '7 days'
ORDER BY u.last_sign_in_at DESC;
```

### Exporter la liste des emails vérifiés
```sql
SELECT email
FROM public.profiles
WHERE email_verified = true
ORDER BY email;
```
