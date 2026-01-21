# 🔧 Fix : Erreur 500 Supabase lors du callback OAuth Google

## ❌ Erreur rencontrée

```
{"code":500,"error_code":"unexpected_failure","msg":"Unexpected failure, please check server logs for more information"}
```

Lors de la redirection après connexion Google, Supabase retourne une erreur 500.

---

## 🎯 Causes possibles

1. **Site URL mal configurée** dans Supabase (avec espaces ou format incorrect)
2. **Provider Google non activé** ou mal configuré dans Supabase
3. **Client ID ou Client Secret incorrects** dans Supabase
4. **Problème de configuration** dans Google Cloud Console

---

## 📋 Solution étape par étape

### Étape 1 : Vérifier la configuration Supabase

1. **Allez sur** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionnez votre projet**
3. **Allez dans** `Authentication` > `URL Configuration`

4. **Vérifiez "Site URL"** :
   - Doit être exactement : `https://blackjackk-two.vercel.app`
   - ⚠️ **PAS d'espaces avant ou après**
   - ⚠️ **PAS de slash à la fin**
   - ⚠️ **Format exact** : `https://blackjackk-two.vercel.app`

5. **Si elle est incorrecte** :
   - Supprimez tous les espaces
   - Vérifiez qu'il n'y a pas de caractères invisibles
   - Réécrivez l'URL complètement
   - Cliquez sur "Save"

### Étape 2 : Vérifier le provider Google

1. **Allez dans** `Authentication` > `Providers`
2. **Trouvez "Google"**
3. **Vérifiez** :
   - ✅ Toggle "Enable Google provider" est **ON** (vert)
   - ✅ Client ID est rempli et correct
   - ✅ Client Secret est rempli et correct

4. **Si le toggle est OFF**, activez-le et sauvegardez

5. **Si les identifiants sont incorrects** :
   - Allez dans Google Cloud Console
   - Copiez le Client ID et Client Secret
   - Collez-les dans Supabase
   - Cliquez sur "Save"

### Étape 3 : Vérifier Google Cloud Console

1. **Allez sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Allez dans** `APIs & Services` > `Credentials`
3. **Vérifiez votre OAuth client** :

   **Authorized JavaScript origins** doit contenir :
   ```
   http://localhost:8080
   https://blackjackk-two.vercel.app
   ```

   **Authorized redirect URIs** doit contenir :
   ```
   https://hiytjwwaocgjdbttmfvd.supabase.co/auth/v1/callback
   ```

4. **Si quelque chose manque**, ajoutez-le et sauvegardez

### Étape 4 : Vérifier les Redirect URLs dans Supabase

1. **Dans Supabase** > `Authentication` > `URL Configuration`
2. **Vérifiez "Redirect URLs"** contient :
   ```
   http://localhost:5173
   https://blackjackk-two.vercel.app
   ```
   ⚠️ **Sans** `/**` ou `/*` - juste les URLs de base

3. **Si elles manquent**, ajoutez-les et sauvegardez

### Étape 5 : Vérifier les logs Supabase

1. **Allez dans** Supabase Dashboard > `Logs` > `Postgres Logs` ou `API Logs`
2. **Cherchez** les erreurs récentes autour de l'heure de l'erreur 500
3. **Notez** les détails de l'erreur pour diagnostic

### Étape 6 : Réessayer après corrections

1. **Attendez 2-3 minutes** après avoir sauvegardé les changements
2. **Videz le cache du navigateur** (Ctrl+Shift+R ou Cmd+Shift+R)
3. **Réessayez** la connexion Google

---

## 🐛 Dépannage spécifique

### Problème : Site URL avec espaces

**Symptôme** : Dans l'URL du callback, le `state` contient `"site_url":"   https://..."` avec des espaces.

**Solution** :
1. Allez dans Supabase > `Authentication` > `URL Configuration`
2. **Supprimez complètement** le contenu de "Site URL"
3. **Réécrivez** exactement : `https://blackjackk-two.vercel.app`
4. **Vérifiez** qu'il n'y a pas d'espaces avant/après
5. Cliquez sur "Save"

### Problème : Provider Google désactivé

**Solution** :
1. Allez dans Supabase > `Authentication` > `Providers` > `Google`
2. Activez le toggle "Enable Google provider"
3. Vérifiez que Client ID et Secret sont remplis
4. Cliquez sur "Save"

### Problème : Client ID/Secret incorrects

**Solution** :
1. Allez dans Google Cloud Console > `Credentials`
2. Copiez le Client ID (format : `xxx.apps.googleusercontent.com`)
3. Affichez le Client Secret (cliquez sur l'œil 👁️)
4. Allez dans Supabase > `Authentication` > `Providers` > `Google`
5. Collez les identifiants exactement (sans espaces)
6. Cliquez sur "Save"

### Problème : Erreur persiste après toutes les vérifications

**Solutions** :
1. **Vérifiez les logs Supabase** pour plus de détails
2. **Désactivez puis réactivez** le provider Google dans Supabase
3. **Recréez** les identifiants OAuth dans Google Cloud Console
4. **Contactez le support Supabase** si le problème persiste

---

## ✅ Checklist de vérification

- [ ] Site URL dans Supabase = `https://blackjackk-two.vercel.app` (sans espaces)
- [ ] Redirect URLs dans Supabase contient `https://blackjackk-two.vercel.app`
- [ ] Provider Google activé dans Supabase
- [ ] Client ID correct dans Supabase (correspond à Google Cloud)
- [ ] Client Secret correct dans Supabase (correspond à Google Cloud)
- [ ] Authorized JavaScript origins dans Google Cloud contient `https://blackjackk-two.vercel.app`
- [ ] Authorized redirect URIs dans Google Cloud contient l'URL Supabase callback
- [ ] Attendu 2-3 minutes après modifications
- [ ] Cache du navigateur vidé
- [ ] Testé à nouveau

---

## 📝 Configuration correcte complète

### Supabase Dashboard

**Site URL** :
```
https://blackjackk-two.vercel.app
```

**Redirect URLs** :
```
http://localhost:5173
https://blackjackk-two.vercel.app
```

**Provider Google** :
- Enable Google provider : **ON**
- Client ID : `389330760280-13305tohnshq0epar7rdtegipbci4dm0.apps.googleusercontent.com`
- Client Secret : `[votre secret]`

### Google Cloud Console

**Authorized JavaScript origins** :
```
http://localhost:8080
https://blackjackk-two.vercel.app
```

**Authorized redirect URIs** :
```
https://hiytjwwaocgjdbttmfvd.supabase.co/auth/v1/callback
```

---

**Une fois toutes ces vérifications faites, l'erreur 500 devrait être résolue !** 🎉
