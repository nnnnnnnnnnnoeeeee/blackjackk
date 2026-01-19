-- ============================================================================
-- Blackjack Multijoueur - Schéma Supabase
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'player_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- TABLES (Game Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'betting', 'playing', 'settling', 'finished')),
  max_players INTEGER NOT NULL DEFAULT 5 CHECK (max_players BETWEEN 2 AND 8),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB DEFAULT '{
    "deckCount": 6,
    "dealerHitsSoft17": false,
    "allowDouble": true,
    "allowSplit": true,
    "allowDoubleAfterSplit": true,
    "allowSurrender": false,
    "allowInsurance": true,
    "resplitAces": false,
    "maxSplits": 3,
    "minBet": 5,
    "maxBet": 500,
    "reshuffleThreshold": 0.25
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tables
CREATE POLICY "Anyone can view active tables"
  ON tables FOR SELECT
  USING (status != 'finished');

CREATE POLICY "Users can create tables"
  ON tables FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Table creator can update their table"
  ON tables FOR UPDATE
  USING (auth.uid() = created_by);

-- ============================================================================
-- TABLE_PLAYERS (Joueurs dans une table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS table_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat INTEGER NOT NULL CHECK (seat BETWEEN 1 AND 8),
  bankroll INTEGER NOT NULL DEFAULT 1000 CHECK (bankroll >= 0),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(table_id, seat),
  UNIQUE(table_id, user_id)
);

-- Enable RLS
ALTER TABLE table_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for table_players
CREATE POLICY "Players can view players in their table"
  ON table_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM table_players tp
      WHERE tp.table_id = table_players.table_id
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join tables"
  ON table_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player record"
  ON table_players FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave tables"
  ON table_players FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE_STATE (État du jeu)
-- ============================================================================

CREATE TABLE IF NOT EXISTS table_state (
  table_id UUID PRIMARY KEY REFERENCES tables(id) ON DELETE CASCADE,
  state_json JSONB NOT NULL DEFAULT '{
    "phase": "waiting",
    "shoe": [],
    "dealerHand": {"cards": [], "bet": 0, "isDoubled": false, "isSplit": false, "isStood": false, "isBusted": false, "isBlackjack": false},
    "playerHands": {},
    "activeSeat": null,
    "currentRound": 0,
    "sideBets": {},
    "sideBetResults": null
  }'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE table_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for table_state
CREATE POLICY "Players can view state of their table"
  ON table_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM table_players tp
      WHERE tp.table_id = table_state.table_id
      AND tp.user_id = auth.uid()
    )
  );

-- Note: Updates only via Edge Functions (no direct client updates)

-- ============================================================================
-- TABLE_ACTIONS (Historique des actions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS table_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('bet', 'hit', 'stand', 'double', 'split', 'insurance', 'surrender', 'deal', 'dealer_draw', 'settle')),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE table_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for table_actions
CREATE POLICY "Players can view actions in their table"
  ON table_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM table_players tp
      WHERE tp.table_id = table_actions.table_id
      AND tp.user_id = auth.uid()
    )
  );

-- Note: Inserts only via Edge Functions

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_table_players_table_id ON table_players(table_id);
CREATE INDEX IF NOT EXISTS idx_table_players_user_id ON table_players(user_id);
CREATE INDEX IF NOT EXISTS idx_table_actions_table_id ON table_actions(table_id);
CREATE INDEX IF NOT EXISTS idx_table_actions_created_at ON table_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_created_at ON tables(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_state_updated_at
  BEFORE UPDATE ON table_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get player count for a table
CREATE OR REPLACE FUNCTION get_table_player_count(table_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM table_players WHERE table_id = table_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is in table
CREATE OR REPLACE FUNCTION is_user_in_table(table_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM table_players
    WHERE table_id = table_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

-- Activer Realtime pour les tables nécessaires
-- Note: La publication supabase_realtime doit exister
-- Si elle n'existe pas, créez-la d'abord dans le dashboard

-- Pour activer via SQL (si la publication existe déjà) :
-- ALTER PUBLICATION supabase_realtime ADD TABLE table_state;
-- ALTER PUBLICATION supabase_realtime ADD TABLE tables;
-- ALTER PUBLICATION supabase_realtime ADD TABLE table_players;

-- ⚠️ IMPORTANT : Activez Realtime via le Dashboard pour être sûr que ça fonctionne
-- Dashboard > Database > Replication > Activer pour table_state, tables, table_players
