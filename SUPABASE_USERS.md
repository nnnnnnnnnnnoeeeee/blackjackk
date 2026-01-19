# 📧 Voir les utilisateurs dans Supabase

Ce guide vous explique comment voir la liste des emails des utilisateurs qui se connectent à votre application.

## 🔍 Méthode 1 : Via le Dashboard Supabase (Le plus simple)

### Étape 1 : Accéder à Authentication
1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **Authentication**
4. Cliquez sur **Users**

### Étape 2 : Voir la liste des utilisateurs
Vous verrez maintenant :
- **Email** de chaque utilisateur
- **ID** unique (UUID)
- **Date de création** du compte
- **Dernière connexion**
- **Email vérifié** (oui/non)
- **Statut** (actif/inactif)

### Actions disponibles
- ✅ **Voir les détails** : Cliquez sur un utilisateur pour voir plus d'informations
- ✅ **Rechercher** : Utilisez la barre de recherche pour trouver un utilisateur spécifique
- ✅ **Filtrer** : Filtrez par statut, email vérifié, etc.
- ✅ **Exporter** : Exportez la liste en CSV (bouton en haut à droite)

## 🔍 Méthode 2 : Via SQL Editor (Pour les requêtes avancées)

### Étape 1 : Ouvrir SQL Editor
1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Cliquez sur **New Query**

### Étape 2 : Exécuter des requêtes

#### Voir tous les utilisateurs avec leur email
```sql
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at,
  confirmed_at IS NOT NULL as is_verified
FROM auth.users
ORDER BY created_at DESC;
```

#### Voir uniquement les emails
```sql
SELECT email
FROM auth.users
ORDER BY email;
```

#### Voir les utilisateurs actifs (qui se sont connectés récemment)
```sql
SELECT 
  email,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE last_sign_in_at IS NOT NULL
ORDER BY last_sign_in_at DESC;
```

#### Compter le nombre total d'utilisateurs
```sql
SELECT COUNT(*) as total_users
FROM auth.users;
```

#### Voir les utilisateurs créés aujourd'hui
```sql
SELECT email, created_at
FROM auth.users
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

## 🔍 Méthode 3 : Via l'API Supabase (Pour intégration)

Si vous voulez afficher les utilisateurs dans votre application, vous pouvez utiliser l'API Supabase avec la clé `service_role` (⚠️ **NE JAMAIS EXPOSER CETTE CLÉ AU CLIENT**).

### Exemple avec Node.js
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Service role key, pas anon key
);

// Lister tous les utilisateurs
const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

if (error) {
  console.error('Error:', error);
} else {
  users.users.forEach(user => {
    console.log(user.email);
  });
}
```

## 📊 Statistiques utiles

### Requête SQL pour obtenir des statistiques
```sql
-- Statistiques générales
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as verified_users,
  COUNT(CASE WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN 1 END) as active_last_7_days,
  COUNT(CASE WHEN last_sign_in_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_last_30_days
FROM auth.users;
```

## 🔒 Sécurité

⚠️ **Important** :
- La table `auth.users` est protégée par Row Level Security (RLS)
- Seuls les administrateurs peuvent y accéder via le dashboard
- Ne partagez **JAMAIS** votre clé `service_role` publiquement
- Utilisez toujours la clé `anon` pour le client frontend

## 📝 Notes

- Les emails sont stockés dans `auth.users.email`
- Les profils utilisateurs (username, avatar) sont dans `public.profiles`
- Pour voir les profils complets, joignez les deux tables :

```sql
SELECT 
  u.email,
  u.created_at,
  p.username,
  p.avatar_url
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

## 🎯 Cas d'usage

### Voir qui joue actuellement
```sql
SELECT DISTINCT
  u.email,
  tp.table_id,
  t.name as table_name
FROM auth.users u
JOIN public.table_players tp ON u.id = tp.user_id
JOIN public.tables t ON tp.table_id = t.id
WHERE t.status = 'playing'
ORDER BY u.email;
```

### Voir l'historique des connexions
```sql
SELECT 
  email,
  last_sign_in_at,
  created_at,
  CASE 
    WHEN last_sign_in_at IS NULL THEN 'Jamais connecté'
    WHEN last_sign_in_at > NOW() - INTERVAL '1 day' THEN 'Connecté aujourd\'hui'
    WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN 'Connecté cette semaine'
    ELSE 'Inactif'
  END as status
FROM auth.users
ORDER BY last_sign_in_at DESC NULLS LAST;
```
