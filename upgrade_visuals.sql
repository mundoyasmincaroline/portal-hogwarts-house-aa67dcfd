-- ============================================================
-- UPGRADE VISUALS — Colunas e Dados de Elite
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar coluna image_url se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='badges' AND COLUMN_NAME='image_url') THEN
        ALTER TABLE public.badges ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 2. Limpar e Inserir Badges de Elite
TRUNCATE TABLE public.badges CASCADE;

INSERT INTO public.badges (name, description, xp_required, icon, image_url) VALUES
('Ordem de Merlin', 'Pela excepcional coragem e distinção mágica.', 500, '🎖️', 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=400&q=80'),
('Mestre de Poções', 'Reconhecimento por habilidades avançadas em preparos.', 200, '🧪', 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&q=80'),
('Duelista de Elite', 'Venceu 50 duelos sem ser desarmado.', 350, '⚔️', 'https://images.unsplash.com/photo-1616423642775-690a424266c2?w=400&q=80'),
('Monitor Chefe', 'Destaque em liderança e conduta exemplar.', 300, '👤', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80'),
('Apanhador Lendário', 'Capturou o Pomo de Ouro em tempo recorde.', 400, '✨', 'https://images.unsplash.com/photo-1582232400901-8c7694901962?w=400&q=80');
