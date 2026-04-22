-- Migração para o Sistema de Streaks (Vínculo de Fogo)
-- Adiciona colunas para rastrear a interação diária entre amigos

ALTER TABLE friendships 
  ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN friendships.streak_count IS 'Número de dias consecutivos de interação entre os amigos.';
COMMENT ON COLUMN friendships.last_interaction_at IS 'Data e hora da última interação significativa para o streak.';

-- Verificação da estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'friendships' 
AND column_name IN ('streak_count', 'last_interaction_at');
