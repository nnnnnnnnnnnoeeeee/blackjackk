# 🎰 Guide de Configuration - Blackjack Brilliance

## 📋 Prérequis

- Node.js 18+ ou Bun
- Un compte Supabase (gratuit)

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/blackjack-brilliance.git
cd blackjack-brilliance
```

### 2. Installer les dépendances

```bash
npm install
# ou
bun install
```

### 3. Configurer les variables d'environnement

Copiez le fichier template et créez votre `.env` :

```bash
cp env.template .env
```

Puis éditez le fichier `.env` avec vos vraies clés Supabase (voir étape suivante).

### 4. Obtenir et configurer les clés Supabase

1. **Connectez-vous** à [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionnez votre projet** (ou créez-en un nouveau)
3. **Allez dans** `Settings` > `API`
4. **Copiez** :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 5. Configurer la base de données

#### Appliquer les migrations

1. **Via le Dashboard Supabase** :
   - Allez dans `Database` > `Migrations`
   - Cliquez sur `New migration`
   - Copiez-collez le contenu de chaque fichier dans `supabase/migrations/` dans l'ordre :
     - `001_initial_schema.sql`
     - `002_enable_realtime.sql`
     - `003_add_email_to_profiles.sql`
     - `008_add_room_code.sql`
     - `010_fix_profiles_rls_and_private_tables.sql`
     - `011_allow_join_private_tables_by_code.sql`
     - `012_add_table_messages.sql`
     - `013_fix_function_search_path.sql`

2. **Via Supabase CLI** (si installé) :
   ```bash
   supabase db push
   ```

#### Activer Realtime

1. Allez dans `Database` > `Replication`
2. Activez Realtime pour les tables suivantes :
   - `table_state`
   - `tables`
   - `table_players`
   - `table_messages`

### 6. Lancer l'application

```bash
npm run dev
# ou
bun run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🎮 Modes de jeu

### Mode Solo
- Fonctionne **sans configuration Supabase**
- Toutes les fonctionnalités solo sont disponibles

### Mode Multijoueur
- Nécessite **Supabase configuré**
- Créez un compte ou connectez-vous
- Créez ou rejoignez une table

## 🔒 Sécurité

- ⚠️ **Ne jamais commiter** le fichier `.env` avec vos vraies clés
- ✅ Le fichier `.env` est déjà dans `.gitignore`
- ✅ Utilisez `.env.example` comme modèle

## 🐛 Dépannage

### "Missing Supabase environment variables"
- Vérifiez que le fichier `.env` existe à la racine du projet
- Vérifiez que les variables commencent par `VITE_`
- Redémarrez le serveur de développement

### Erreurs de connexion Supabase
- Vérifiez que l'URL et la clé sont correctes
- Vérifiez que votre projet Supabase est actif
- Vérifiez les migrations ont été appliquées

### Mode multijoueur ne fonctionne pas
- Vérifiez que Realtime est activé pour les bonnes tables
- Vérifiez que les migrations sont à jour
- Vérifiez la console du navigateur pour les erreurs

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)
