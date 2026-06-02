// ============================================================================
// Supabase Client Configuration
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In production (Vercel), these will be set via environment variables
// In development, they should be in .env file
// Create a dummy client if variables are missing to allow solo mode
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const isPlaceholder = url.includes('votre-projet.supabase.co') || url.includes('placeholder');

if (isPlaceholder) {
  console.warn(
    'Missing or invalid Supabase environment variables. Multiplayer will not work. Solo mode is still available.'
  );
  // Clear any stuck tokens in localStorage from previous attempts
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    // Ignore localStorage errors (e.g., in incognito)
  }
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: !isPlaceholder,
    autoRefreshToken: !isPlaceholder,
    detectSessionInUrl: !isPlaceholder,
  },
  global: {
    fetch: isPlaceholder 
      ? async (...args) => {
          console.warn('[Supabase Mock] Intercepted request in Guest Mode:', args[0]);
          // Provide fake responses to keep the client happy without network errors
          return new Response(JSON.stringify({ user: null, session: null }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      : fetch
  }
});