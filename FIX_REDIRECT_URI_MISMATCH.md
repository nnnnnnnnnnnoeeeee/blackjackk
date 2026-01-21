# 🔧 Fix : Erreur redirect_uri_mismatch avec Google OAuth

## ❌ Erreur rencontrée

```
Erreur 400: redirect_uri_mismatch
Accès bloqué : la demande de cette appli n'est pas valide
```

## 🎯 Solution rapide

L'URL de redirection dans Google Cloud Console doit correspondre **exactement** à celle de votre projet Supabase.

---

## 📋 Étapes pour corriger

### Étape 1 : Trouver votre URL Supabase exacte

1. **Allez sur** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionnez votre projet**
3. **Allez dans** `Settings` > `API`
4. **Trouvez** "Project URL" - elle ressemble à :
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
5. **Notez** la partie `xxxxxxxxxxxxx` (c'est votre Project ID)

### Étape 2 : Construire l'URL de redirection correcte

L'URL de redirection doit être :
```
https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
```

**Remplacez** `xxxxxxxxxxxxx` par votre Project ID Supabase.

**Exemple** :
Si votre Project URL est `https://hiytjwwaocgjdbttmfvd.supabase.co`
Alors l'URL de redirection doit être :
```
https://hiytjwwaocgjdbttmfvd.supabase.co/auth/v1/callback
```

### Étape 3 : Configurer dans Google Cloud Console

1. **Allez sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Sélectionnez votre projet**
3. **Allez dans** `APIs & Services` > `Credentials`
4. **Trouvez** votre OAuth 2.0 Client ID (celui que vous avez créé)
5. **Cliquez sur** l'icône ✏️ (modifier) à droite
6. **Dans "Authorized redirect URIs"**, vérifiez/modifiez :

   **Supprimez** toutes les URLs incorrectes
   
   **Ajoutez** exactement cette URL (remplacez par votre Project ID) :
   ```
   https://VOTRE_PROJECT_ID.supabase.co/auth/v1/callback
   ```

   ⚠️ **Important** :
   - L'URL doit commencer par `https://` (pas `http://`)
   - Pas d'espace avant ou après
   - Pas de slash à la fin
   - Exactement au format : `https://xxx.supabase.co/auth/v1/callback`

7. **Cliquez sur** "Save"

### Étape 4 : Vérifier dans Supabase

1. **Retournez dans** Supabase Dashboard
2. **Allez dans** `Authentication` > `URL Configuration`
3. **Vérifiez** que "Redirect URLs" contient bien :
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   ```
   (Cette URL devrait être automatiquement là)

### Étape 5 : Attendre quelques minutes

Les changements dans Google Cloud peuvent prendre **1-2 minutes** pour être pris en compte.

### Étape 6 : Réessayer

1. **Fermez** toutes les fenêtres Google OAuth ouvertes
2. **Retournez** sur votre application
3. **Cliquez** à nouveau sur "Se connecter avec Google"
4. **Ça devrait fonctionner maintenant !** ✅

---

## 🔍 Vérifications supplémentaires

### Vérifier que le Client ID est correct

1. **Dans Google Cloud Console** > `Credentials`
2. **Copiez** votre Client ID
3. **Dans Supabase** > `Authentication` > `Providers` > `Google`
4. **Vérifiez** que le Client ID correspond exactement

### Vérifier que le Client Secret est correct

1. **Dans Google Cloud Console** > `Credentials`
2. **Affichez** votre Client Secret (cliquez sur l'œil 👁️)
3. **Dans Supabase** > `Authentication` > `Providers` > `Google`
4. **Vérifiez** que le Client Secret correspond exactement

### Vérifier que le provider Google est activé

1. **Dans Supabase** > `Authentication` > `Providers`
2. **Vérifiez** que le toggle "Enable Google provider" est **ON** (vert)

---

## 🐛 Problèmes courants

### Problème : L'URL semble correcte mais ça ne marche toujours pas

**Solutions** :
1. Vérifiez qu'il n'y a pas d'espaces avant/après l'URL dans Google Cloud
2. Vérifiez que vous utilisez `https://` et non `http://`
3. Vérifiez qu'il n'y a pas de slash à la fin (`/callback` et non `/callback/`)
4. Attendez 2-3 minutes et réessayez
5. Videz le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)

### Problème : "Access blocked: This app's request is invalid"

**Solutions** :
1. Vérifiez que votre email est dans "Test users" dans `OAuth consent screen`
2. Ou publiez l'app si vous êtes en production

### Problème : L'URL change selon l'environnement

**Note** : L'URL de redirection Supabase est **toujours la même**, que vous soyez en localhost ou en production. C'est Supabase qui gère la redirection vers votre app après authentification.

---

## ✅ Checklist de vérification

- [ ] J'ai trouvé mon Project ID Supabase
- [ ] J'ai construit l'URL : `https://[PROJECT_ID].supabase.co/auth/v1/callback`
- [ ] J'ai ajouté cette URL dans Google Cloud Console > Credentials
- [ ] L'URL est exactement correcte (pas d'espace, pas de slash à la fin)
- [ ] J'ai sauvegardé dans Google Cloud Console
- [ ] J'ai attendu 1-2 minutes
- [ ] J'ai fermé toutes les fenêtres OAuth
- [ ] J'ai réessayé la connexion

---

## 📝 Exemple complet

**Si votre Project URL Supabase est** :
```
https://hiytjwwaocgjdbttmfvd.supabase.co
```

**Alors dans Google Cloud Console, ajoutez** :
```
https://hiytjwwaocgjdbttmfvd.supabase.co/auth/v1/callback
```

**Et dans Supabase** (vérification) :
- `Authentication` > `URL Configuration` > `Redirect URLs` devrait contenir :
```
https://hiytjwwaocgjdbttmfvd.supabase.co/auth/v1/callback
```

---

**Une fois corrigé, l'authentification Google devrait fonctionner !** 🎉
