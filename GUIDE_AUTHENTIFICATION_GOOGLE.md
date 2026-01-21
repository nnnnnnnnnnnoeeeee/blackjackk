# 🔐 Guide Complet : Configuration de l'Authentification Google OAuth

## 📋 Vue d'ensemble

Ce guide vous explique comment configurer l'authentification Google OAuth avec Supabase pour permettre aux utilisateurs de se connecter avec leur compte Google.

---

## 🎯 Étape 1 : Créer un projet Google Cloud

### 1.1 Accéder à Google Cloud Console

1. **Allez sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Connectez-vous** avec votre compte Google
3. **Créez un nouveau projet** ou sélectionnez un projet existant :
   - Cliquez sur le sélecteur de projet en haut
   - Cliquez sur "New Project"
   - Nommez-le (ex: "Blackjack Brilliance")
   - Cliquez sur "Create"

### 1.2 Activer l'API Google+

1. **Dans le menu**, allez dans `APIs & Services` > `Library`
2. **Recherchez** "Google+ API"
3. **Cliquez sur** "Google+ API"
4. **Cliquez sur** "Enable" pour activer l'API

---

## 🔑 Étape 2 : Créer les identifiants OAuth 2.0

### 2.1 Configurer l'écran de consentement OAuth

1. **Allez dans** `APIs & Services` > `OAuth consent screen`
2. **Sélectionnez** "External" (pour les utilisateurs en dehors de votre organisation)
3. **Remplissez les informations** :
   - **App name** : Blackjack Brilliance (ou votre nom d'app)
   - **User support email** : Votre email
   - **Developer contact information** : Votre email
4. **Cliquez sur** "Save and Continue"
5. **Scopes** : Laissez par défaut, cliquez sur "Save and Continue"
6. **Test users** : Ajoutez votre email pour tester, cliquez sur "Save and Continue"
7. **Summary** : Vérifiez et cliquez sur "Back to Dashboard"

### 2.2 Créer les identifiants OAuth 2.0

1. **Allez dans** `APIs & Services` > `Credentials`
2. **Cliquez sur** "Create Credentials" > "OAuth client ID"
3. **Sélectionnez** "Web application"
4. **Remplissez les informations** :

   **Name** :
   ```
   Blackjack Brilliance Web Client
   ```

   **Authorized JavaScript origins** :
   ```
   http://localhost:5173
   https://votre-domaine.com
   ```
   (Ajoutez votre URL de production quand vous déployez)

   **Authorized redirect URIs** :
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   ```
   ⚠️ **Important** : Remplacez `votre-projet` par votre ID de projet Supabase

5. **Cliquez sur** "Create"
6. **Copiez les identifiants** :
   - **Client ID** : `xxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret** : `xxxxxxxxxxxxx`
   - ⚠️ **Gardez ces informations secrètes !**

---

## ⚙️ Étape 3 : Configurer Supabase

### 3.1 Activer le provider Google dans Supabase

1. **Allez sur** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionnez votre projet**
3. **Allez dans** `Authentication` > `Providers`
4. **Trouvez "Google"** dans la liste des providers
5. **Activez le toggle** "Enable Google provider"
6. **Remplissez les champs** :
   - **Client ID (for OAuth)** : Collez votre Client ID Google
   - **Client Secret (for OAuth)** : Collez votre Client Secret Google
7. **Cliquez sur** "Save"

### 3.2 Vérifier les URLs de redirection

1. **Allez dans** `Authentication` > `URL Configuration`
2. **Vérifiez que** "Redirect URLs" contient :
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   ```
   (Cette URL est automatiquement ajoutée par Supabase)

---

## 💻 Étape 4 : Mettre à jour le code

### 4.1 Ajouter le bouton Google dans Login.tsx

Le code sera mis à jour pour ajouter un bouton "Se connecter avec Google".

### 4.2 Ajouter le bouton Google dans Register.tsx

Le code sera mis à jour pour ajouter un bouton "S'inscrire avec Google".

---

## 🧪 Étape 5 : Tester l'authentification Google

### 5.1 Test de connexion avec Google

1. **Lancez votre application** :
   ```bash
   npm run dev
   ```

2. **Allez sur** `http://localhost:5173/login`

3. **Cliquez sur** "Se connecter avec Google"

4. **Sélectionnez votre compte Google**

5. **Autorisez l'application** si demandé

6. **Vous devriez être redirigé** vers `/lobby` et connecté

### 5.2 Vérifier la création du profil

1. **Allez dans** Supabase Dashboard > `Authentication` > `Users`
2. **Vérifiez** qu'un nouvel utilisateur a été créé avec :
   - Email Google
   - Provider : Google
   - Email vérifié automatiquement

3. **Allez dans** `Database` > `Table Editor` > `profiles`
4. **Vérifiez** qu'un profil a été créé automatiquement

---

## 🔒 Étape 6 : Configuration pour la production

### 6.1 Mettre à jour les URLs dans Google Cloud

1. **Retournez dans** Google Cloud Console > `Credentials`
2. **Modifiez votre OAuth client**
3. **Ajoutez** vos URLs de production :
   - **Authorized JavaScript origins** :
     ```
     https://votre-domaine.com
     ```
   - **Authorized redirect URIs** reste le même (Supabase gère la redirection)

### 6.2 Publier l'écran de consentement

1. **Allez dans** `OAuth consent screen`
2. **Cliquez sur** "Publish App"
3. **Confirmez** la publication

⚠️ **Note** : En mode "Testing", seuls les utilisateurs de test peuvent se connecter. Pour la production, vous devez publier l'app.

---

## 🐛 Dépannage

### Problème : "redirect_uri_mismatch"

**Solution** :
1. Vérifiez que l'URL de redirection dans Google Cloud est exactement :
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   ```
2. Vérifiez que vous avez utilisé le bon ID de projet Supabase

### Problème : "Error 400: invalid_request"

**Solutions** :
1. Vérifiez que le Client ID et Client Secret sont corrects dans Supabase
2. Vérifiez que le provider Google est activé dans Supabase
3. Vérifiez que l'API Google+ est activée dans Google Cloud

### Problème : "Access blocked: This app's request is invalid"

**Solutions** :
1. Vérifiez que votre email est dans la liste des "Test users" (mode Testing)
2. Publiez l'app si vous êtes en production
3. Vérifiez que l'écran de consentement est correctement configuré

### Problème : Le profil n'est pas créé automatiquement

**Solutions** :
1. Vérifiez que la migration `001_initial_schema.sql` est appliquée
2. Vérifiez que le trigger `on_auth_user_created` existe
3. Vérifiez les logs dans Supabase Dashboard > `Logs`

---

## ✅ Checklist finale

- [ ] Projet Google Cloud créé
- [ ] API Google+ activée
- [ ] Écran de consentement OAuth configuré
- [ ] Identifiants OAuth 2.0 créés (Client ID + Secret)
- [ ] URLs de redirection configurées dans Google Cloud
- [ ] Provider Google activé dans Supabase
- [ ] Client ID et Secret ajoutés dans Supabase
- [ ] Bouton Google ajouté dans Login.tsx
- [ ] Bouton Google ajouté dans Register.tsx
- [ ] Test de connexion Google réussi
- [ ] Profil créé automatiquement
- [ ] URLs de production configurées (si déployé)
- [ ] App publiée dans Google Cloud (pour production)

---

## 📚 Ressources supplémentaires

- [Documentation Supabase OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Une fois toutes ces étapes complétées, l'authentification Google sera entièrement fonctionnelle !** 🎉
