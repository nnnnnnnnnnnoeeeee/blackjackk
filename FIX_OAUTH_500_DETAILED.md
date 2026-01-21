# 🔧 Fix Détaillé : Erreur 500 OAuth Google (user_agent: got)

## 🔍 Diagnostic des logs Supabase

D'après les logs, l'erreur 500 se produit avec :
- **Path** : `/auth/v1/callback`
- **User Agent** : `got (https://github.com/sindresorhus/got)`
- **Signification** : C'est une requête **interne de Supabase** vers Google, pas directement depuis votre navigateur

Cela indique que **Supabase ne peut pas communiquer avec Google** pour valider le token OAuth.

---

## 🎯 Causes probables (par ordre de probabilité)

### 1. ⚠️ Client Secret incorrect ou avec espaces (MOST LIKELY)

Le Client Secret dans Supabase doit être **exactement identique** à celui de Google Cloud Console.

**Solution** :
1. Allez dans Google Cloud Console > `Credentials`
2. Cliquez sur votre OAuth client
3. Cliquez sur l'**œil 👁️** pour afficher le Client Secret
4. **Copiez-le complètement** (sans espaces avant/après)
5. Allez dans Supabase > `Authentication` > `Providers` > `Google`
6. **Supprimez complètement** le Client Secret actuel
7. **Collez le nouveau** (vérifiez qu'il n'y a pas d'espaces)
8. Cliquez sur "Save"
9. **Attendez 2-3 minutes**

### 2. ⚠️ API Google+ non activée

Google OAuth nécessite que certaines APIs soient activées.

**Solution** :
1. Allez dans Google Cloud Console > `APIs & Services` > `Library`
2. Cherchez et **activez** ces APIs :
   - ✅ **Google+ API** (si disponible)
   - ✅ **Google Identity Services API**
   - ✅ **People API**
3. Attendez quelques minutes pour la propagation

### 3. ⚠️ Client ID incorrect

Le Client ID doit correspondre exactement.

**Solution** :
1. Vérifiez que le Client ID dans Supabase correspond **exactement** à celui de Google Cloud
2. Format attendu : `389330760280-13305tohnshq0epar7rdtegipbci4dm0.apps.googleusercontent.com`
3. Pas d'espaces avant/après

### 4. ⚠️ Problème avec le state parameter

Le `state` dans l'URL du callback peut contenir des caractères qui causent des problèmes.

**Solution** :
1. Vérifiez que `detectSessionInUrl: true` est dans `supabaseClient.ts` ✅ (déjà fait)
2. Essayez de **vider le cache du navigateur** complètement
3. Essayez en **navigation privée**

---

## 🔧 Solution étape par étape (à suivre dans l'ordre)

### Étape 1 : Vérifier et corriger le Client Secret

1. **Google Cloud Console** :
   - Allez dans `Credentials`
   - Cliquez sur votre OAuth client
   - Cliquez sur l'œil 👁️ pour voir le Client Secret
   - **Copiez-le** (sans espaces)

2. **Supabase Dashboard** :
   - Allez dans `Authentication` > `Providers` > `Google`
   - **Supprimez complètement** le champ "Client Secret"
   - **Collez le nouveau** Client Secret
   - Vérifiez visuellement qu'il n'y a pas d'espaces
   - Cliquez sur "Save"

3. **Attendez 2-3 minutes**

### Étape 2 : Vérifier les APIs Google

1. Allez dans Google Cloud Console > `APIs & Services` > `Library`
2. Cherchez "Google Identity Services API"
3. Si elle n'est pas activée, **activez-la**
4. Attendez quelques minutes

### Étape 3 : Désactiver/Réactiver le provider

1. Dans Supabase > `Authentication` > `Providers` > `Google`
2. **Désactivez** le toggle "Enable Google provider"
3. Cliquez sur "Save"
4. **Attendez 30 secondes**
5. **Réactivez** le toggle
6. **Re-vérifiez** les identifiants (Client ID et Secret)
7. Cliquez sur "Save"
8. **Attendez 2-3 minutes**

### Étape 4 : Tester à nouveau

1. **Videz le cache du navigateur** (Ctrl+Shift+R ou Cmd+Shift+R)
2. Essayez la connexion Google
3. Si ça ne fonctionne toujours pas, vérifiez les **nouveaux logs** dans Supabase

---

## 🐛 Dépannage avancé

### Vérifier les logs détaillés dans Supabase

1. Allez dans Supabase > `Logs` > `API Logs`
2. Cliquez sur une erreur 500 récente
3. Regardez le **message d'erreur complet** dans `event_message`
4. Cherchez des indices comme :
   - `invalid_client`
   - `invalid_grant`
   - `unauthorized_client`
   - `access_denied`

### Recréer les identifiants OAuth

Si rien ne fonctionne, recréez les identifiants :

1. **Google Cloud Console** :
   - Allez dans `Credentials`
   - Créez un **nouveau** OAuth 2.0 Client ID
   - Configurez les mêmes URLs :
     - Authorized JavaScript origins : `http://localhost:8080`, `https://blackjackk-two.vercel.app`
     - Authorized redirect URIs : `https://hiytjwwaocgjdbttmfvd.supabase.co/auth/v1/callback`
   - Copiez le nouveau Client ID et Secret

2. **Supabase** :
   - Allez dans `Authentication` > `Providers` > `Google`
   - Remplacez les identifiants par les nouveaux
   - Sauvegardez

---

## ✅ Checklist finale

- [ ] Client Secret copié depuis Google Cloud (avec l'œil 👁️)
- [ ] Client Secret collé dans Supabase **sans espaces**
- [ ] Client ID correspond exactement
- [ ] Google Identity Services API activée dans Google Cloud
- [ ] Provider Google désactivé puis réactivé dans Supabase
- [ ] Attendu 2-3 minutes après modifications
- [ ] Cache du navigateur vidé
- [ ] Testé en navigation privée
- [ ] Vérifié les nouveaux logs Supabase pour détails

---

## 📞 Si le problème persiste

1. **Vérifiez les logs Supabase** pour le message d'erreur exact
2. **Contactez le support Supabase** avec :
   - Les logs d'erreur complets
   - La configuration de votre OAuth client (sans le secret)
   - Le timestamp des erreurs

---

**Le problème est très probablement le Client Secret avec des espaces ou incorrect. Commencez par l'Étape 1 !** 🎯
