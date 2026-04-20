-- Adicionar coluna relationship_status nos personagens
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'single'
    CHECK (relationship_status IN ('single', 'paired'));

-- Atualizar personagens que já têm par para 'paired'
UPDATE characters SET relationship_status = 'paired' WHERE pair_character_id IS NOT NULL;

-- RLS na tabela friendships — garantir que usuários podem inserir e ler seus próprios relacionamentos
-- (necessário para o botão Adicionar Amigo funcionar)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own friendships"   ON friendships;
DROP POLICY IF EXISTS "Users can insert own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can insert own friendships"
  ON friendships FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- RLS na tabela dm_messages — garantir envio e recebimento de DMs
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own dms"   ON dm_messages;
DROP POLICY IF EXISTS "Users can send dms"       ON dm_messages;
DROP POLICY IF EXISTS "Users can update own dms" ON dm_messages;

CREATE POLICY "Users can view own dms"
  ON dm_messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send dms"
  ON dm_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own dms"
  ON dm_messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- Verificação
SELECT 'characters.relationship_status' AS verificacao, COUNT(*) > 0 AS ok
  FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'relationship_status'
UNION ALL
SELECT 'friendships RLS ativo', rowsecurity FROM pg_tables WHERE tablename = 'friendships'
UNION ALL
SELECT 'dm_messages RLS ativo', rowsecurity FROM pg_tables WHERE tablename = 'dm_messages';
