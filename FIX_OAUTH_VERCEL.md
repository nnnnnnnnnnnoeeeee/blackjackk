# 🔧 Fix : Authentification Google OAuth sur Vercel

## ❌ Problème

Quand vous vous connectez avec Google sur Vercel, le site plante avec une erreur de connexion ou une page blanche.

## 🎯 Causes possibles

1. **URL Vercel non configurée** dans Google Cloud Console
2. **URL Vercel non configurée** dans Supabase
3. **Problème de gestion du callback OAuth** après redirection

---

## 📋 Solution étape par étape

### Étape 1 : Trouver votre URL Vercel

Votre application Vercel a une URL comme :
```
https://votre-app.vercel.app
```
ou un domaine personnalisé :
```
https://votre-domaine.com
```

**Notez cette URL exacte** (avec `https://`).

---

### Étape 2 : Configurer Google Cloud Console

1. **Allez sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Sélectionnez votre projet**
3. **Allez dans** `APIs & Services` > `Credentials`
4. **Trouvez** votre OAuth 2.0 Client ID
5. **Cliquez sur** l'icône ✏️ (modifier)
6. **Dans "Authorized JavaScript origins"**, ajoutez :
   ```
   https://votre-app.vercel.app
   ```
   (Ajoutez aussi votre domaine personnalisé si vous en avez un)

   ⚠️ **Important** :
   - Ajoutez **les deux** : localhost ET Vercel
   - Format exact : `https://votre-app.vercel.app` (pas de slash à la fin)

7. **Dans "Authorized redirect URIs"**, vérifiez que vous avez :
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   ```
   (Cette URL reste la même, c'est Supabase qui gère la redirection)

8. **Cliquez sur** "Save"

---

### Étape 3 : Configurer Supabase (CRUCIAL)

⚠️ **C'est ici que se trouve le problème !** Supabase doit savoir quelle URL utiliser pour la redirection.

1. **Allez sur** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionnez votre projet**
3. **Allez dans** `Authentication` > `URL Configuration`

4. **Dans "Site URL"**, mettez votre URL Vercel (PAS localhost) :
   ```
   https://blackjackk-two.vercel.app
   ```
   ⚠️ **Important** : C'est cette URL qui sera utilisée pour les redirections OAuth !

5. **Dans "Redirect URLs"**, ajoutez :
   ```
   https://blackjackk-two.vercel.app/**
   ```
   (Le `/**` permet toutes les routes)

   Vous devriez avoir les deux :
   ```
   http://localhost:5173/**
   https://blackjackk-two.vercel.app/**
   ```

6. **Cliquez sur** "Save"

⚠️ **Note importante** : 
- Si vous testez en localhost, changez temporairement "Site URL" vers `http://localhost:5173`
- Pour la production sur Vercel, "Site URL" doit être `https://blackjackk-two.vercel.app`
- Vous pouvez garder les deux dans "Redirect URLs" pour que ça fonctionne partout

---

### Étape 4 : Vérifier les variables d'environnement sur Vercel

1. **Allez sur** [Vercel Dashboard](https://vercel.com/dashboard)
2. **Sélectionnez votre projet**
3. **Allez dans** `Settings` > `Environment Variables`
4. **Vérifiez** que vous avez :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé anon Supabase

5. **Si elles n'existent pas**, ajoutez-les :
   - Cliquez sur "Add New"
   - Ajoutez chaque variable
   - Sélectionnez tous les environnements (Production, Preview, Development)

6. **Redéployez** votre application après avoir ajouté les variables

---

### Étape 5 : Vérifier le code (déjà correct)

Le code utilise déjà `window.location.origin` qui s'adapte automatiquement :
```typescript
redirectTo: `${window.location.origin}/lobby`
```

Cela fonctionne en localhost ET sur Vercel automatiquement.

---

### Étape 6 : Tester

1. **Attendez 1-2 minutes** après avoir sauvegardé les configurations
2. **Allez sur** votre URL Vercel : `https://votre-app.vercel.app/login`
3. **Cliquez sur** "Se connecter avec Google"
4. **Sélectionnez** votre compte Google
5. **Vous devriez être redirigé** vers `/lobby` et connecté ✅

---

## 🐛 Dépannage supplémentaire

### Problème : Le site plante toujours après connexion Google

**Solution** : Vérifiez que le callback OAuth est géré correctement.

Le code devrait déjà gérer cela avec `detectSessionInUrl: true` dans `supabaseClient.ts`, mais vérifions :

1. **Vérifiez** que `src/lib/supabaseClient.ts` contient :
   ```typescript
   export const supabase = createClient(url, key, {
     auth: {
       persistSession: true,
       autoRefreshToken: true,
       detectSessionInUrl: true, // ← Important pour OAuth
     },
   });
   ```

2. **Vérifiez** que `src/pages/Index.tsx` ou `src/App.tsx` écoute les changements d'auth :
   ```typescript
   supabase.auth.onAuthStateChange((_event, session) => {
     // Gère les changements d'authentification
   });
   ```

### Problème : Erreur "redirect_uri_mismatch" sur Vercel

**Solution** :
1. Vérifiez que l'URL Vercel est dans "Authorized JavaScript origins" (pas dans redirect URIs)
2. La seule URL dans "Authorized redirect URIs" doit être : `https://votre-projet.supabase.co/auth/v1/callback`

### Problème : Le token apparaît dans l'URL mais ne se connecte pas

**Solution** :
1. Vérifiez que `detectSessionInUrl: true` est dans `supabaseClient.ts`
2. Vérifiez que vous avez un listener `onAuthStateChange` quelque part dans votre app
3. Vérifiez les logs Vercel pour voir s'il y a des erreurs

### Problème : Redirection vers localhost:3000 au lieu de Vercel

**Symptôme** : Après connexion Google, vous êtes redirigé vers `http://localhost:3000/#access_token=...` au lieu de votre URL Vercel.

**Cause** : La "Site URL" dans Supabase est configurée avec `localhost:3000` au lieu de votre URL Vercel.

**Solution** :
1. **Allez dans** Supabase Dashboard > `Authentication` > `URL Configuration`
2. **Changez "Site URL"** de `http://localhost:3000` vers :
   ```
   https://blackjackk-two.vercel.app
   ```
3. **Vérifiez "Redirect URLs"** contient :
   ```
   https://blackjackk-two.vercel.app/**
   ```
4. **Cliquez sur "Save"**
5. **Attendez 1-2 minutes** pour que les changements soient appliqués
6. **Réessayez** la connexion Google sur Vercel

⚠️ **Important** : La "Site URL" dans Supabase détermine où Supabase redirige après OAuth. Elle doit correspondre à votre environnement de production (Vercel), pas à localhost.

---

## ✅ Checklist pour Vercel

- [ ] URL Vercel ajoutée dans Google Cloud > Credentials > Authorized JavaScript origins
- [ ] URL Supabase callback dans Google Cloud > Credentials > Authorized redirect URIs
- [ ] Site URL configuré dans Supabase > Authentication > URL Configuration
- [ ] Redirect URLs configurées dans Supabase (localhost ET Vercel)
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Application redéployée sur Vercel après changements
- [ ] Test de connexion Google réussi sur Vercel

---

## 📝 Exemple de configuration complète

### Google Cloud Console

**Authorized JavaScript origins** :
```
http://localhost:5173
https://votre-app.vercel.app
```

**Authorized redirect URIs** :
```
https://hiytjwwaocgjdbttmfvd.supabase.co/auth/v1/callback
```

### Supabase Dashboard

**Site URL** :
```
https://votre-app.vercel.app
```

**Redirect URLs** :
```
http://localhost:5173/**
https://votre-app.vercel.app/**
```

---

**Une fois toutes ces étapes complétées, l'authentification Google devrait fonctionner sur Vercel !** 🎉
