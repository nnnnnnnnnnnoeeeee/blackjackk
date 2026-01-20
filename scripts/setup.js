#!/usr/bin/env node

/**
 * Script de configuration automatique
 * Vérifie et configure l'environnement avant le démarrage
 */

import { existsSync, copyFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const ENV_TEMPLATE = join(rootDir, 'env.template');
const ENV_FILE = join(rootDir, '.env');
const NODE_MODULES = join(rootDir, 'node_modules');
const PACKAGE_JSON = join(rootDir, 'package.json');

console.log('🔍 Vérification de la configuration...\n');

// Vérifier qu'on est dans le bon répertoire (package.json doit exister)
if (!existsSync(PACKAGE_JSON)) {
  console.log('❌ Erreur: package.json introuvable !');
  console.log(`   Répertoire recherché: ${rootDir}`);
  console.log(`   Script exécuté depuis: ${__dirname}`);
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
    console.log('⚠️  IMPORTANT: Éditez le fichier .env et remplissez vos clés Supabase:');
    console.log('   1. Allez sur https://supabase.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Allez dans Settings > API');
    console.log('   4. Copiez l\'URL et la clé "anon public" dans .env\n');
  } else {
    console.log('❌ Fichier env.template introuvable !');
    process.exit(1);
  }
  } else {
    // Vérifier si .env contient les valeurs par défaut
    try {
      const envContent = readFileSync(ENV_FILE, 'utf-8');
      if (envContent.includes('votre-projet.supabase.co') || envContent.includes('votre_cle_anon_ici')) {
        console.log('⚠️  Le fichier .env contient encore les valeurs par défaut !');
        console.log('   Mode solo disponible, mais mode multijoueur nécessite vos clés Supabase.');
        console.log('   Pour configurer: Éditez .env avec vos clés depuis https://supabase.com/dashboard\n');
      } else {
        // Vérifier que les variables sont définies
        const hasUrl = envContent.includes('VITE_SUPABASE_URL=') && !envContent.match(/VITE_SUPABASE_URL=\s*$/m);
        const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=') && !envContent.match(/VITE_SUPABASE_ANON_KEY=\s*$/m);
        
        if (!hasUrl || !hasKey) {
          console.log('⚠️  Le fichier .env semble incomplet.');
          console.log('   Mode solo disponible, mais mode multijoueur nécessite vos clés Supabase.\n');
        } else {
          console.log('✅ Configuration .env détectée\n');
        }
      }
    } catch (error) {
      // Si on ne peut pas lire .env, continuer quand même (mode solo fonctionne sans)
      console.log('⚠️  Impossible de lire le fichier .env');
      console.log('   Mode solo disponible, mais mode multijoueur nécessite vos clés Supabase.\n');
    }
  }

console.log('🚀 Démarrage du serveur de développement...\n');
