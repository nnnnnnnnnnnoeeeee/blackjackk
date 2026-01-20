#!/usr/bin/env node

/**
 * Script de configuration automatique
 * Vérifie et configure l'environnement avant le démarrage
 * Intègre la configuration interactive des clés Supabase
 */

import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const ENV_TEMPLATE = join(rootDir, 'env.template');
const ENV_FILE = join(rootDir, '.env');
const NODE_MODULES = join(rootDir, 'node_modules');
const PACKAGE_JSON = join(rootDir, 'package.json');

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
  return key && key.length > 50 && key.startsWith('eyJ');
}

function hasValidKeys(envContent) {
  const hasValidUrl = envContent.match(/VITE_SUPABASE_URL=https:\/\/[^.]+\.[^.]+\.[^.]+\/[^/]*/);
  const hasValidKey = envContent.match(/VITE_SUPABASE_ANON_KEY=eyJ[a-zA-Z0-9_-]+/);
  return hasValidUrl && hasValidKey;
}

async function configureSupabaseKeys() {
  console.log('\n🔑 Configuration des clés Supabase\n');
  console.log('Le mode multijoueur nécessite vos clés Supabase pour fonctionner.\n');
  
  console.log('📋 Instructions pour obtenir vos clés :');
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
    console.log('\n✅ Clés Supabase configurées avec succès !\n');
    return true;
  } catch (error) {
    console.log('\n❌ Erreur lors de l\'écriture du fichier .env:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Vérification de la configuration...\n');

  // Vérifier qu'on est dans le bon répertoire (package.json doit exister)
  if (!existsSync(PACKAGE_JSON)) {
    console.log('❌ Erreur: package.json introuvable !');
    console.log(`   Répertoire recherché: ${rootDir}`);
    console.log('   Assurez-vous d\'être dans le répertoire racine du projet.\n');
    process.exit(1);
  }

  // 1. Vérifier si node_modules existe, sinon installer automatiquement
  if (!existsSync(NODE_MODULES)) {
    console.log('📦 Les dépendances ne sont pas installées.');
    console.log('   Installation automatique en cours...\n');
    try {
      execSync('npm install', { 
        cwd: rootDir, 
        stdio: 'inherit',
        encoding: 'utf-8'
      });
      console.log('\n✅ Dépendances installées avec succès !\n');
    } catch (error) {
      console.log('\n❌ Erreur lors de l\'installation des dépendances.');
      console.log('   Veuillez exécuter manuellement: npm install\n');
      process.exit(1);
    }
  }

  // 2. Vérifier si .env existe, sinon le créer depuis env.template
  if (!existsSync(ENV_FILE)) {
    if (existsSync(ENV_TEMPLATE)) {
      console.log('📝 Création du fichier .env depuis env.template...');
      copyFileSync(ENV_TEMPLATE, ENV_FILE);
      console.log('✅ Fichier .env créé !\n');
    } else {
      console.log('❌ Fichier env.template introuvable !');
      process.exit(1);
    }
  }

  // 3. Vérifier si les clés Supabase sont configurées
  let needsConfiguration = false;
  try {
    const envContent = readFileSync(ENV_FILE, 'utf-8');
    
    if (envContent.includes('votre-projet.supabase.co') || envContent.includes('votre_cle_anon_ici')) {
      needsConfiguration = true;
    } else if (!hasValidKeys(envContent)) {
      needsConfiguration = true;
    } else {
      console.log('✅ Configuration .env détectée\n');
    }
  } catch (error) {
    needsConfiguration = true;
  }

  // 4. Si les clés ne sont pas configurées, proposer de les configurer
  if (needsConfiguration) {
    console.log('⚠️  Les clés Supabase ne sont pas configurées.\n');
    console.log('   💡 Le mode solo fonctionne sans clés Supabase.');
    console.log('   💡 Le mode multijoueur nécessite vos clés Supabase.\n');
    
    const configure = await question('Voulez-vous configurer vos clés Supabase maintenant ? (O/n): ');
    
    if (configure.toLowerCase() !== 'n' && configure.toLowerCase() !== 'non') {
      const success = await configureSupabaseKeys();
      if (!success) {
        console.log('⚠️  Configuration annulée. Le mode solo reste disponible.\n');
      }
    } else {
      console.log('\n💡 Vous pouvez configurer les clés plus tard avec: npm run setup:env\n');
      console.log('💡 Ou éditer manuellement le fichier .env\n');
    }
  }

  rl.close();
  console.log('🚀 Démarrage du serveur de développement...\n');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  rl.close();
  process.exit(1);
});
