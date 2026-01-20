-- ============================================================================
-- Add table_messages for chat functionality
-- ============================================================================

CREATE TABLE IF NOT EXISTS table_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_table_messages_table_id ON table_messages(table_id);
CREATE INDEX IF NOT EXISTS idx_table_messages_created_at ON table_messages(created_at DESC);

-- Enable RLS
ALTER TABLE table_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Players can view messages in their table"
  ON table_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM table_players
      WHERE table_players.table_id = table_messages.table_id
      AND table_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Players can send messages in their table"
  ON table_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM table_players
      WHERE table_players.table_id = table_messages.table_id
      AND table_players.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE table_messages;
