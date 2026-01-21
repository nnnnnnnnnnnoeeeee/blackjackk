# 🔧 Fix : Connexion Google intermittente (redirection vers login)

## ❌ Problème

La connexion Google fonctionne parfois mais pas toujours - parfois vous êtes redirigé vers l'écran de connexion au lieu de rester connecté.

## 🎯 Causes possibles

1. **Problème de timing** : La session n'est pas encore disponible quand on vérifie l'utilisateur
2. **Callback OAuth non géré correctement** : Le hash avec `access_token` n'est pas détecté à temps
3. **Race condition** : `checkUser()` s'exécute avant que Supabase n'ait fini de traiter le callback
4. **Session non persistée** : La session n'est pas correctement sauvegardée après le callback

---

## ✅ Solution implémentée

### 1. Amélioration de la gestion du callback dans `Lobby.tsx`

- **Écoute active** de `onAuthStateChange` pour détecter immédiatement les connexions
- **Nettoyage automatique** de l'URL après détection du callback
- **Chargement des données** seulement après confirmation de la session

### 2. Amélioration de la gestion du callback dans `Index.tsx`

- **Détection améliorée** du callback OAuth (hash ET query params)
- **Redirection avec délai** pour laisser la session se stabiliser
- **Nettoyage complet** de l'URL après callback

### 3. Configuration Supabase Client

Vérifiez que `src/lib/supabaseClient.ts` contient :
```typescript
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,        // ✅ Sauvegarde la session
    autoRefreshToken: true,      // ✅ Rafraîchit automatiquement
    detectSessionInUrl: true,    // ✅ Détecte le callback OAuth
  },
});
```

---

## 🔍 Vérifications supplémentaires

### 1. Vérifier les Redirect URLs dans Supabase

1. Allez dans Supabase > `Authentication` > `URL Configuration`
2. Vérifiez que "Redirect URLs" contient :
   ```
   http://localhost:5173
   https://blackjackk-two.vercel.app
   ```
   ⚠️ **Sans** `/**` ou `/*` - juste les URLs de base

### 2. Vérifier le Site URL dans Supabase

1. Dans Supabase > `Authentication` > `URL Configuration`
2. "Site URL" doit être : `https://blackjackk-two.vercel.app`
3. Pas d'espaces avant/après

### 3. Vérifier les variables d'environnement sur Vercel

1. Allez dans Vercel > `Settings` > `Environment Variables`
2. Vérifiez que vous avez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Redéployez** après modification

---

## 🐛 Dépannage si le problème persiste

### Problème : Toujours redirigé vers login

**Solutions** :
1. **Videz le cache du navigateur** complètement
2. **Testez en navigation privée**
3. **Vérifiez les logs Supabase** pour voir s'il y a des erreurs
4. **Vérifiez la console du navigateur** pour des erreurs JavaScript

### Problème : La session se perd après rafraîchissement

**Solution** :
1. Vérifiez que `persistSession: true` est dans `supabaseClient.ts` ✅
2. Vérifiez que les cookies sont autorisés dans votre navigateur
3. Vérifiez que vous n'êtes pas en mode navigation privée permanente

### Problème : Erreurs Content-Security-Policy

Les erreurs `Unrecognized Content-Security-Policy directive 'require-trusted-types-for'` sont des **avertissements** de Google et n'empêchent pas la connexion. Elles peuvent être ignorées.

---

## ✅ Checklist de vérification

- [ ] `persistSession: true` dans `supabaseClient.ts`
- [ ] `detectSessionInUrl: true` dans `supabaseClient.ts`
- [ ] `onAuthStateChange` écouté dans `Lobby.tsx` et `Index.tsx`
- [ ] Redirect URLs correctes dans Supabase (sans wildcards)
- [ ] Site URL correcte dans Supabase
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Application redéployée sur Vercel
- [ ] Cache du navigateur vidé
- [ ] Testé en navigation privée

---

## 📝 Code modifié

### `src/pages/Lobby.tsx`
- Ajout de `onAuthStateChange` pour détecter immédiatement les connexions
- Gestion améliorée du callback OAuth

### `src/pages/Index.tsx`
- Détection améliorée du callback (hash ET query params)
- Redirection avec délai pour laisser la session se stabiliser

---

**Les modifications devraient résoudre le problème de connexion intermittente !** 🎉
