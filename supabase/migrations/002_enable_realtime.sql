-- ============================================================================
-- Enable Realtime for Blackjack Multijoueur Tables
-- ============================================================================

-- Activer la publication Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE table_state;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE table_players;

-- Note: Si la publication n'existe pas, elle sera créée automatiquement
-- Sinon, utilisez cette commande pour créer la publication :
-- CREATE PUBLICATION supabase_realtime FOR TABLE table_state, tables, table_players;
