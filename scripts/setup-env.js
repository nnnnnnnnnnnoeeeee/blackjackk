#!/usr/bin/env node

/**
 * Script interactif pour configurer les clés Supabase
 * Guide l'utilisateur étape par étape
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const ENV_FILE = join(rootDir, '.env');
const ENV_TEMPLATE = join(rootDir, 'env.template');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function validateUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co');
  } catch {
    return false;
  }
}

function validateKey(key) {
  // Clé Supabase anon commence généralement par "eyJ" (JWT base64)
  return key && key.length > 50 && key.startsWith('eyJ');
}

async function main() {
  console.log('\n🔑 Configuration des clés Supabase\n');
  console.log('Ce script va vous guider pour configurer vos clés Supabase.\n');

  // Vérifier si .env existe
  let envContent = '';
  if (existsSync(ENV_FILE)) {
    envContent = readFileSync(ENV_FILE, 'utf-8');
    
    // Vérifier si les clés sont déjà configurées
    const hasValidUrl = envContent.match(/VITE_SUPABASE_URL=https:\/\/[^.]+\.[^.]+\.[^.]+\/[^/]*/);
    const hasValidKey = envContent.match(/VITE_SUPABASE_ANON_KEY=eyJ[a-zA-Z0-9_-]+/);
    
    if (hasValidUrl && hasValidKey) {
      console.log('✅ Les clés Supabase sont déjà configurées dans .env\n');
      const overwrite = await question('Voulez-vous les remplacer ? (o/N): ');
      if (overwrite.toLowerCase() !== 'o' && overwrite.toLowerCase() !== 'oui') {
        console.log('Configuration annulée.\n');
        rl.close();
        return;
      }
    }
  } else if (existsSync(ENV_TEMPLATE)) {
    // Créer .env depuis template
    envContent = readFileSync(ENV_TEMPLATE, 'utf-8');
  } else {
    console.log('❌ Fichier env.template introuvable !\n');
    rl.close();
    process.exit(1);
  }

  console.log('\n📋 Instructions pour obtenir vos clés :');
  console.log('   1. Allez sur https://supabase.com/dashboard');
  console.log('   2. Connectez-vous à votre compte');
  console.log('   3. Sélectionnez votre projet (ou créez-en un nouveau)');
  console.log('   4. Allez dans Settings > API');
  console.log('   5. Copiez l\'URL du projet et la clé "anon public"\n');

  // Demander l'URL
  let supabaseUrl = '';
  while (!supabaseUrl || !validateUrl(supabaseUrl)) {
    supabaseUrl = await question('🔗 Entrez votre URL Supabase (https://votre-projet.supabase.co): ');
    
    if (!supabaseUrl) {
      console.log('❌ L\'URL ne peut pas être vide.\n');
      continue;
    }
    
    if (!validateUrl(supabaseUrl)) {
      console.log('❌ URL invalide. Elle doit être au format https://xxx.supabase.co\n');
      supabaseUrl = '';
    }
  }

  // Demander la clé
  let supabaseKey = '';
  while (!supabaseKey || !validateKey(supabaseKey)) {
    supabaseKey = await question('🔐 Entrez votre clé "anon public" (commence par eyJ...): ');
    
    if (!supabaseKey) {
      console.log('❌ La clé ne peut pas être vide.\n');
      continue;
    }
    
    if (!validateKey(supabaseKey)) {
      console.log('❌ Clé invalide. Elle doit commencer par "eyJ" et faire au moins 50 caractères.\n');
      supabaseKey = '';
    }
  }

  // Créer le contenu du fichier .env
  const newEnvContent = `# ============================================================================
# Configuration Supabase
# ============================================================================
# Généré automatiquement le ${new Date().toLocaleString('fr-FR')}
# ============================================================================

# URL de votre projet Supabase
VITE_SUPABASE_URL=${supabaseUrl}

# Clé publique anonyme (safe à exposer côté client)
VITE_SUPABASE_ANON_KEY=${supabaseKey}
`;

  // Écrire le fichier
  try {
    writeFileSync(ENV_FILE, newEnvContent, 'utf-8');
    console.log('\n✅ Fichier .env créé avec succès !\n');
    console.log('🚀 Vous pouvez maintenant lancer: npm run dev\n');
  } catch (error) {
    console.log('\n❌ Erreur lors de l\'écriture du fichier .env:', error.message);
    rl.close();
    process.exit(1);
  }

  rl.close();
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  rl.close();
  process.exit(1);
});
