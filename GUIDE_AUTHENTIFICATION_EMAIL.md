# 🔐 Guide Complet : Configuration de l'Authentification par Email

## 📋 Vue d'ensemble

Ce guide vous explique comment configurer l'authentification par email avec Supabase pour votre application Blackjack. L'authentification par email est déjà implémentée dans le code, mais vous devez configurer Supabase pour que tout fonctionne correctement.

---

## ✅ Étape 1 : Vérifier que le code est en place

Le code d'authentification est déjà implémenté dans :
- ✅ `src/pages/Login.tsx` - Page de connexion avec email/password
- ✅ `src/pages/Register.tsx` - Page d'inscription avec email/password
- ✅ `src/pages/ForgotPassword.tsx` - Réinitialisation du mot de passe
- ✅ Migrations SQL pour les profils utilisateurs

**Aucune modification de code n'est nécessaire !**

---

## 🔧 Étape 2 : Configurer Supabase Dashboard

### 2.1 Activer l'authentification par Email

1. **Allez sur** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionnez votre projet**
3. **Allez dans** `Authentication` > `Providers`
4. **Trouvez "Email"** dans la liste des providers
5. **Activez le toggle** "Enable Email provider"
6. **Vérifiez les options** :
   - ✅ "Enable Email provider" : **ON**
   - ✅ "Confirm email" : **ON** (recommandé pour la sécurité)
   - ✅ "Secure email change" : **ON** (recommandé)

### 2.2 Configurer les URLs de redirection

1. **Allez dans** `Authentication` > `URL Configuration`
2. **Configurez les URLs suivantes** :

   **Site URL** :
   ```
   http://localhost:5173
   ```
   (Pour la production, utilisez votre URL de production)

   **Redirect URLs** :
   ```
   http://localhost:5173/**
   https://votre-domaine.com/**
   ```

   Ces URLs permettent à Supabase de rediriger les utilisateurs après :
   - Confirmation d'email
   - Réinitialisation de mot de passe
   - Changement d'email

### 2.3 Configurer les emails (Optionnel mais recommandé)

#### Option A : Utiliser les emails Supabase par défaut (Gratuit)

Les emails Supabase par défaut fonctionnent mais sont limités :
- 3 emails/heure en production
- Emails génériques avec branding Supabase

**Pour activer** :
1. Allez dans `Authentication` > `Email Templates`
2. Les templates par défaut sont déjà configurés
3. Vous pouvez les personnaliser si besoin

#### Option B : Configurer un service SMTP personnalisé (Recommandé pour production)

Pour un service professionnel avec vos propres emails :

1. **Allez dans** `Project Settings` > `Auth` > `SMTP Settings`
2. **Configurez votre service SMTP** (Gmail, SendGrid, Mailgun, etc.)

   **Exemple avec Gmail** :
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: votre-email@gmail.com
   Password: [App Password Gmail]
   Sender email: votre-email@gmail.com
   Sender name: Blackjack Brilliance
   ```

   **Exemple avec SendGrid** :
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Votre API Key SendGrid]
   Sender email: noreply@votre-domaine.com
   Sender name: Blackjack Brilliance
   ```

3. **Testez l'envoi** avec le bouton "Send test email"

### 2.4 Personnaliser les templates d'email (Optionnel)

1. **Allez dans** `Authentication` > `Email Templates`
2. **Sélectionnez un template** :
   - **Confirm signup** - Email de confirmation d'inscription
   - **Magic Link** - Lien magique (si activé)
   - **Change Email Address** - Changement d'email
   - **Reset Password** - Réinitialisation de mot de passe
   - **Invite user** - Invitation d'utilisateur

3. **Personnalisez le template** :
   - Modifiez le sujet
   - Modifiez le contenu HTML
   - Ajoutez votre branding

   **Variables disponibles** :
   - `{{ .ConfirmationURL }}` - URL de confirmation
   - `{{ .Email }}` - Email de l'utilisateur
   - `{{ .Token }}` - Token de confirmation
   - `{{ .TokenHash }}` - Hash du token

---

## 🗄️ Étape 3 : Vérifier les migrations de base de données

Assurez-vous que toutes les migrations sont appliquées :

### 3.1 Vérifier les migrations appliquées

1. **Allez dans** `Database` > `Migrations`
2. **Vérifiez que ces migrations sont appliquées** :
   - ✅ `001_initial_schema.sql` - Crée la table `profiles`
   - ✅ `003_add_email_to_profiles.sql` - Ajoute les colonnes email
   - ✅ `013_fix_function_search_path.sql` - Corrige les fonctions

### 3.2 Appliquer les migrations si nécessaire

Si les migrations ne sont pas appliquées :

1. **Allez dans** `Database` > `Migrations` > `New migration`
2. **Copiez-collez le contenu** de chaque migration dans l'ordre
3. **Exécutez** chaque migration

---

## 🧪 Étape 4 : Tester l'authentification

### 4.1 Test d'inscription

1. **Lancez votre application** :
   ```bash
   npm run dev
   ```

2. **Allez sur** `http://localhost:5173/register`

3. **Remplissez le formulaire** :
   - Nom d'utilisateur
   - Email valide
   - Mot de passe (minimum 6 caractères)

4. **Cliquez sur "S'inscrire"**

5. **Vérifiez votre boîte email** :
   - Vous devriez recevoir un email de confirmation
   - Cliquez sur le lien de confirmation

6. **Connectez-vous** avec vos identifiants

### 4.2 Test de connexion

1. **Allez sur** `http://localhost:5173/login`

2. **Entrez vos identifiants** :
   - Email
   - Mot de passe

3. **Cliquez sur "Se connecter"**

4. **Vous devriez être redirigé** vers `/lobby`

### 4.3 Test de réinitialisation de mot de passe

1. **Allez sur** `http://localhost:5173/forgot-password`

2. **Entrez votre email**

3. **Vérifiez votre boîte email** pour le lien de réinitialisation

---

## 🔒 Étape 5 : Configuration de sécurité (Recommandé)

### 5.1 Activer la protection contre les mots de passe compromis

1. **Allez dans** `Authentication` > `Policies` > `Email`
2. **Activez** "Prevent use of leaked passwords"
   - ⚠️ Nécessite un plan Pro ou supérieur

### 5.2 Configurer les limites de taux (Rate Limiting)

1. **Allez dans** `Authentication` > `Rate Limits`
2. **Configurez les limites** :
   - **Sign up** : 5 tentatives / heure
   - **Sign in** : 5 tentatives / heure
   - **Password reset** : 3 tentatives / heure

### 5.3 Activer la protection contre les attaques

1. **Allez dans** `Authentication` > `Attack Protection`
2. **Activez** :
   - ✅ "Enable captcha protection" (recommandé)
   - ✅ "Enable rate limiting" (déjà activé)

---

## 🌐 Étape 6 : Configuration pour la production

### 6.1 Mettre à jour les URLs

1. **Allez dans** `Authentication` > `URL Configuration`
2. **Remplacez** `http://localhost:5173` par votre URL de production :
   ```
   https://votre-domaine.com
   ```

### 6.2 Configurer un service SMTP professionnel

Pour la production, utilisez un service SMTP dédié :
- **SendGrid** (recommandé)
- **Mailgun**
- **Amazon SES**
- **Postmark**

### 6.3 Vérifier les variables d'environnement

Assurez-vous que `.env` contient :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

---

## 📝 Étape 7 : Vérifier le flux complet

### Flux d'inscription

1. ✅ Utilisateur remplit le formulaire d'inscription
2. ✅ `supabase.auth.signUp()` est appelé
3. ✅ Supabase envoie un email de confirmation
4. ✅ Utilisateur clique sur le lien dans l'email
5. ✅ Email confirmé, utilisateur peut se connecter
6. ✅ Un profil est créé automatiquement dans `profiles` (via trigger)

### Flux de connexion

1. ✅ Utilisateur entre email/password
2. ✅ `supabase.auth.signInWithPassword()` est appelé
3. ✅ Session créée si identifiants valides
4. ✅ Redirection vers `/lobby`

### Flux de réinitialisation

1. ✅ Utilisateur demande réinitialisation
2. ✅ `supabase.auth.resetPasswordForEmail()` est appelé
3. ✅ Email avec lien de réinitialisation envoyé
4. ✅ Utilisateur clique sur le lien
5. ✅ Nouveau mot de passe défini

---

## 🐛 Dépannage

### Problème : Les emails ne sont pas reçus

**Solutions** :
1. Vérifiez les spams
2. Vérifiez la configuration SMTP dans Supabase
3. Vérifiez les logs dans `Authentication` > `Logs`
4. En développement local, utilisez Inbucket (port 54324)

### Problème : Erreur "Email already registered"

**Solution** : L'utilisateur existe déjà, utilisez "Mot de passe oublié"

### Problème : Erreur "Invalid login credentials"

**Solutions** :
1. Vérifiez que l'email est confirmé
2. Vérifiez que le mot de passe est correct
3. Vérifiez les logs Supabase pour plus de détails

### Problème : Redirection après confirmation ne fonctionne pas

**Solutions** :
1. Vérifiez les URLs de redirection dans `URL Configuration`
2. Assurez-vous que l'URL inclut `/**` pour toutes les routes
3. Vérifiez que `site_url` est correctement configuré

---

## ✅ Checklist finale

- [ ] Email provider activé dans Supabase
- [ ] URLs de redirection configurées
- [ ] Service SMTP configuré (ou emails par défaut activés)
- [ ] Templates d'email personnalisés (optionnel)
- [ ] Migrations de base de données appliquées
- [ ] Test d'inscription réussi
- [ ] Test de connexion réussi
- [ ] Test de réinitialisation réussi
- [ ] Configuration de sécurité activée
- [ ] URLs de production configurées (si déployé)

---

## 📚 Ressources supplémentaires

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Configuration Email Supabase](https://supabase.com/docs/guides/auth/auth-email)
- [Templates d'email Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

---

**Une fois toutes ces étapes complétées, l'authentification par email sera entièrement fonctionnelle !** 🎉
