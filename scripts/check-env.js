#!/usr/bin/env node

// ============================================================================
// Script de vérification d'environnement — 100% synchrone, ne bloque jamais
// ============================================================================

import { existsSync, readFileSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const ENV_TEMPLATE = join(rootDir, 'env.template');
const ENV_FILE = join(rootDir, '.env');

console.log('🔍 Vérification de la configuration...');

// 1. Créer .env depuis env.template s'il est absent
if (!existsSync(ENV_FILE)) {
  if (existsSync(ENV_TEMPLATE)) {
    console.log('📝 Création automatique du fichier .env depuis env.template...');
    copyFileSync(ENV_TEMPLATE, ENV_FILE);
  } else {
    console.log('⚠️  Fichier env.template introuvable, impossible de créer .env.');
  }
}

// 2. Lire les variables du .env
let url = '';
let key = '';
if (existsSync(ENV_FILE)) {
  const content = readFileSync(ENV_FILE, 'utf-8');
  const urlMatch = content.match(/^VITE_SUPABASE_URL=(.+)$/m);
  const keyMatch = content.match(/^VITE_SUPABASE_ANON_KEY=(.+)$/m);
  if (urlMatch) url = urlMatch[1].trim();
  if (keyMatch) key = keyMatch[1].trim();
}

// 3. Vérification des valeurs (sans appel réseau)
const isPlaceholderUrl = !url || url.includes('votre-projet') || url.includes('placeholder');
const isPlaceholderKey = !key || key.includes('votre_cle') || key.includes('placeholder');

if (isPlaceholderUrl || isPlaceholderKey) {
  console.log('\n⚠️  Variables Supabase non configurées.');
  console.log('   💡 Mode Solo disponible sans configuration.');
  console.log('   💡 Pour le mode multijoueur, lancez: npm run setup:env\n');
} else {
  console.log('✅ Variables Supabase détectées.\n');
}

console.log('🚀 Démarrage du serveur...\n');
