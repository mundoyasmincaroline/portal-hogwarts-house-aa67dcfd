-- ═══════════════════════════════════════════════════════════════
-- GRINGOTTS MONETIZATION SQL — Portal Hogwarts House
-- Execute este script no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Função award_galeons ───────────────────────────────────
-- Credita Galeões ao usuário de forma segura e atômica
CREATE OR REPLACE FUNCTION award_galeons(
  _user_id UUID,
  _amount  INT,
  _reason  TEXT DEFAULT 'bonus'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET galeons = COALESCE(galeons, 0) + _amount
  WHERE user_id = _user_id;
END;
$$;

-- ── 2. Itens da Loja Gringotts ────────────────────────────────
-- Limpa itens antigos e insere catálogo completo Hogwarts
TRUNCATE TABLE store_items RESTART IDENTITY CASCADE;

INSERT INTO store_items (name, description, category, price_galeons, rarity, image_url) VALUES

-- ── MANTOS (clothing) ────────────────────────────────
('Manto da Grifinória',
 'O manto vermelho e dourado da casa dos bravos. Bordado com o leão rugindo em fio de ouro.',
 'clothing', 80, 'rare', NULL),

('Manto da Sonserina',
 'O manto verde e prata da casa dos ambiciosos. Tecido em seda com escamas de serpente bordadas.',
 'clothing', 80, 'rare', NULL),

('Manto da Corvinal',
 'O manto azul e bronze da casa dos sábios. Constelações mágicas brilham no tecido noturno.',
 'clothing', 80, 'rare', NULL),

('Manto da Lufa-Lufa',
 'O manto amarelo e preto da casa dos leais. Girassóis mágicos bordados aquecen quem veste.',
 'clothing', 80, 'rare', NULL),

('Manto Cerimonial Dourado',
 'Reservado para grandes conquistas. Fio de ouro puro tecido por elfos domésticos de Gringotts.',
 'clothing', 350, 'legendary', NULL),

('Manto das Trevas',
 'Absorve a luz ao redor. Usado pelos mais ousados nas noites de Hogwarts.',
 'clothing', 200, 'epic', NULL),

-- ── VARINHAS (wand) ───────────────────────────────────
('Varinha de Nogueira Negra',
 'Nogueira negra com núcleo de pena de fênix. Especialista em feitiços de proteção.',
 'wand', 120, 'rare', NULL),

('Varinha de Salgueiro',
 'Salgueiro com núcleo de pelo de unicórnio. Muito sensível à magia emocional.',
 'wand', 120, 'rare', NULL),

('Varinha de Carvalho Antigo',
 'Carvalho com núcleo de coração de dragão. Uma das varinhas mais poderosas conhecidas.',
 'wand', 280, 'legendary', NULL),

('Varinha de Ébano',
 'Ébano com núcleo de veela hair. Extremamente precisa em feitiços de encantamento.',
 'wand', 150, 'epic', NULL),

('Varinha de Cereja',
 'Cereja com núcleo de pelo de unicórnio. Leve e ágil, perfeita para feitiços rápidos.',
 'wand', 100, 'uncommon', NULL),

-- ── ACESSÓRIOS (accessory) ────────────────────────────
('Amuleto da Casa Grifinória',
 'Leão dourado com rubi no centro. Concede coragem extra nas decisões difíceis.',
 'accessory', 60, 'uncommon', NULL),

('Amuleto da Casa Sonserina',
 'Serpente de prata com esmeralda. Aguça o pensamento estratégico.',
 'accessory', 60, 'uncommon', NULL),

('Amuleto da Casa Corvinal',
 'Águia de bronze com safira. Aumenta a clareza mental e sabedoria.',
 'accessory', 60, 'uncommon', NULL),

('Amuleto da Casa Lufa-Lufa',
 'Texugo de âmbar com topázio. Atrai lealdade e amizades sinceras.',
 'accessory', 60, 'uncommon', NULL),

('Anel dos Fundadores',
 'Anel de ouro com o brasão unificado das quatro casas. Extremamente raro.',
 'accessory', 500, 'legendary', NULL),

('Colar do Pomo Dourado',
 'Uma miniatura do Pomo Dourado em ouro, preso em corrente encantada.',
 'accessory', 200, 'epic', NULL),

('Capa da Invisibilidade (mini)',
 'Uma versão ornamental da lendária Capa. Não torna invisível, mas impressiona.',
 'accessory', 400, 'legendary', NULL),

-- ── VASSOURAS (wand → usamos "broom") ────────────────
('Vassoura Nimbus Artesanal',
 'Réplica perfeita da lendária Nimbus. Madeira de nogueira polida, galhos de bétula.',
 'wand', 180, 'epic', NULL),

('Vassoura Saeta de Fogo',
 'A vassoura mais veloz já fabricada. Símbolo de status em qualquer torneio de Quadribol.',
 'wand', 350, 'legendary', NULL),

-- ── SKINS DE PERFIL (skin) ────────────────────────────
('Moldura Grifinória',
 'Moldura de perfil vermelha e dourada com leões rugindo nos cantos.',
 'skin', 40, 'common', NULL),

('Moldura Sonserina',
 'Moldura de perfil verde e prata com serpentes entrelaçadas.',
 'skin', 40, 'common', NULL),

('Moldura Corvinal',
 'Moldura de perfil azul e bronze com penas de corvo.',
 'skin', 40, 'common', NULL),

('Moldura Lufa-Lufa',
 'Moldura de perfil amarela e preta com flores silvestres.',
 'skin', 40, 'common', NULL),

('Moldura Auror',
 'Moldura dourada de Auror com estrelas mágicas animadas.',
 'skin', 150, 'epic', NULL),

('Moldura Bruxo das Trevas',
 'Moldura sombria com chamas negras e runas ancestrais.',
 'skin', 200, 'epic', NULL),

-- ── DECORAÇÕES (decoration) ───────────────────────────
('Mapa do Maroto (Réplica)',
 'Réplica decorativa do famoso mapa. "Solenemente juro que minhas intenções não são boas."',
 'decoration', 90, 'rare', NULL),

('Pedra Filosofal (Ornamento)',
 'Ornamento em cristal vermelho que brilha levemente. Decoração lendária para o perfil.',
 'decoration', 300, 'legendary', NULL),

('Espelho de Ojesed',
 'Mostra o que seu coração mais deseja. Decoração encantada para o perfil.',
 'decoration', 250, 'epic', NULL),

('Coruja Edwiges (Avatar)',
 'Avatar animado da famosa coruja branca. Icônico e exclusivo.',
 'decoration', 180, 'rare', NULL);

-- ── 3. Trigger: Galeões ao subir de nível ────────────────────
CREATE OR REPLACE FUNCTION on_level_up_award_galeons()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.level > OLD.level THEN
    NEW.galeons := COALESCE(NEW.galeons, 0) + (NEW.level * 15);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_level_up_galeons ON profiles;
CREATE TRIGGER trg_level_up_galeons
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.level IS DISTINCT FROM OLD.level)
  EXECUTE FUNCTION on_level_up_award_galeons();

-- ── 4. Garantir coluna galeons existe ────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS galeons INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_plan TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ DEFAULT NULL;

-- ── Confirmar execução ────────────────────────────────────────
SELECT 
  (SELECT COUNT(*) FROM store_items) AS total_items,
  'award_galeons function created' AS func_status;
