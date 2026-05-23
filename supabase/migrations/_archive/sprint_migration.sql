-- ============================================================
-- MIGRATION: Portal Hogwarts — Sprint Completo (SAFE VERSION)
-- Pode ser executado múltiplas vezes sem erro
-- ============================================================

-- 1. Colunas extras nos personagens
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS pair_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS canon_era TEXT,
  ADD COLUMN IF NOT EXISTS canon_portrayed_by TEXT;

-- 2. Flag de sala desativada
ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE;

-- Inserir sala Hogwarts Meet SEM ON CONFLICT (evita erro de constraint inexistente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM channels WHERE name = 'Hogwarts Meet') THEN
    INSERT INTO channels (name, description, category, allowed_houses, is_admin_only, is_premium)
    VALUES ('Hogwarts Meet', 'Encontros em vídeo mágicos! Reúna-se com outros bruxos em tempo real.', 'RPG', NULL, FALSE, TRUE);
  END IF;
END $$;

-- 3. Tabela de follows de personagens no InstaHogwarts
CREATE TABLE IF NOT EXISTS insta_character_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  followed_char_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_user_id, followed_char_id)
);

ALTER TABLE insta_character_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read char follows" ON insta_character_follows;
DROP POLICY IF EXISTS "Users manage own char follows" ON insta_character_follows;

CREATE POLICY "Anyone can read char follows"
  ON insta_character_follows FOR SELECT USING (TRUE);

CREATE POLICY "Users manage own char follows"
  ON insta_character_follows FOR ALL USING (follower_user_id = auth.uid());

-- 4. Tabela de status do Azkaban
CREATE TABLE IF NOT EXISTS azkaban_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  reason TEXT,
  xp_penalty INTEGER DEFAULT 0,
  release_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE azkaban_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own azkaban status" ON azkaban_status;
DROP POLICY IF EXISTS "Anyone can insert azkaban"    ON azkaban_status;
DROP POLICY IF EXISTS "Anyone can update azkaban"    ON azkaban_status;

CREATE POLICY "Users read own azkaban status"
  ON azkaban_status FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert azkaban"
  ON azkaban_status FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can update azkaban"
  ON azkaban_status FOR UPDATE USING (TRUE);

-- 5. Campo last_seen no profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Trigger para atualizar last_seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_last_seen_trigger ON profiles;
CREATE TRIGGER profiles_last_seen_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- 6. Índices de performance (IF NOT EXISTS evita erro de duplicata)
CREATE INDEX IF NOT EXISTS idx_azkaban_user_active   ON azkaban_status(user_id, active);
CREATE INDEX IF NOT EXISTS idx_char_follows_user      ON insta_character_follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_char_follows_char      ON insta_character_follows(followed_char_id);
CREATE INDEX IF NOT EXISTS idx_characters_pair        ON characters(pair_character_id);

-- 7. Coluna rarity nos badges
ALTER TABLE badges
  ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common';

-- Atualizar raridade dos badges existentes (seguro mesmo se rodar de novo)
UPDATE badges SET rarity = 'legendary' WHERE xp_required >= 500;
UPDATE badges SET rarity = 'rare'      WHERE xp_required >= 200 AND xp_required < 500;
UPDATE badges SET rarity = 'common'    WHERE xp_required < 200;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- Resultado esperado: todas as linhas com ok = true
-- ============================================================
SELECT 'characters.pair_character_id' AS verificacao,
       COUNT(*) > 0 AS ok
  FROM information_schema.columns
  WHERE table_name = 'characters' AND column_name = 'pair_character_id'
UNION ALL
SELECT 'channels.is_disabled',
       COUNT(*) > 0
  FROM information_schema.columns
  WHERE table_name = 'channels' AND column_name = 'is_disabled'
UNION ALL
SELECT 'insta_character_follows',
       COUNT(*) > 0
  FROM information_schema.tables
  WHERE table_name = 'insta_character_follows'
UNION ALL
SELECT 'azkaban_status',
       COUNT(*) > 0
  FROM information_schema.tables
  WHERE table_name = 'azkaban_status'
UNION ALL
SELECT 'profiles.last_seen',
       COUNT(*) > 0
  FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name = 'last_seen'
UNION ALL
SELECT 'badges.rarity',
       COUNT(*) > 0
  FROM information_schema.columns
  WHERE table_name = 'badges' AND column_name = 'rarity'
UNION ALL
SELECT 'channels.Hogwarts Meet',
       COUNT(*) > 0
  FROM channels
  WHERE name = 'Hogwarts Meet';
