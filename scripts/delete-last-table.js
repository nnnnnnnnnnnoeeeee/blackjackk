// ============================================================================
// Script pour supprimer la dernière table multijoueur créée
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis .env
try {
  const envPath = join(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        // Retirer les guillemets si présents
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (key && cleanValue) {
          envVars[key] = cleanValue;
        }
      }
    }
  });
  
  if (envVars.VITE_SUPABASE_URL) {
    process.env.VITE_SUPABASE_URL = envVars.VITE_SUPABASE_URL;
  }
  if (envVars.VITE_SUPABASE_ANON_KEY) {
    process.env.VITE_SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
  }
  
  console.log('✅ Fichier .env chargé');
} catch (error) {
  console.warn('⚠️  Impossible de charger .env:', error.message);
  console.warn('   Utilisation des variables d\'environnement système');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erreur : Variables d\'environnement Supabase manquantes');
  console.error('Veuillez définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
  console.error('Ou créez un fichier .env avec ces variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteLastTable() {
  try {
    console.log('🔍 Recherche de la dernière table créée...');
    
    // Récupérer la dernière table créée (triée par created_at DESC)
    const { data: tables, error: fetchError } = await supabase
      .from('tables')
      .select('id, name, status, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!tables || tables.length === 0) {
      console.log('✅ Aucune table trouvée dans la base de données');
      return;
    }
    
    const lastTable = tables[0];
    console.log(`📋 Table trouvée :`);
    console.log(`   - ID: ${lastTable.id}`);
    console.log(`   - Nom: ${lastTable.name}`);
    console.log(`   - Statut: ${lastTable.status}`);
    console.log(`   - Créée le: ${new Date(lastTable.created_at).toLocaleString('fr-FR')}`);
    
    // Supprimer la table (cascade supprimera aussi table_players et table_state)
    console.log('\n🗑️  Suppression de la table...');
    const { error: deleteError } = await supabase
      .from('tables')
      .delete()
      .eq('id', lastTable.id);
    
    if (deleteError) {
      throw deleteError;
    }
    
    console.log('✅ Table supprimée avec succès !');
    console.log('   (Les joueurs et l\'état associés ont également été supprimés)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression :', error.message);
    if (error.details) {
      console.error('   Détails :', error.details);
    }
    if (error.hint) {
      console.error('   Indice :', error.hint);
    }
    process.exit(1);
  }
}

deleteLastTable();
