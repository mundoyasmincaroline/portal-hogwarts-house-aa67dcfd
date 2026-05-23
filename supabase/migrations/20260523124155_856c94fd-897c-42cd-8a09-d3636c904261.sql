-- Adiciona coluna de efeitos se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'store_items' AND column_name = 'effects') THEN
        ALTER TABLE public.store_items ADD COLUMN effects JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Limpa itens de teste para evitar duplicidade
DELETE FROM public.store_items WHERE id LIKE 'wand_%' OR id LIKE 'broom_%' OR id LIKE 'pet_%' OR id LIKE 'book_%' OR id LIKE 'item_%' OR id LIKE 'pack_%';

-- Insere catálogo canônico completo (raridades restritas a: common, rare, legendary)
INSERT INTO public.store_items (id, name, description, category, price_galeons, image_url, rarity, is_active, is_featured, effects) VALUES
-- Varinhas
('wand_holly_phoenix', 'Varinha de Azevinho e Fênix', 'Azevinho com núcleo de pena de fênix. Escolheu Harry Potter.', 'wand', 1200, 'https://images.unsplash.com/photo-1632733711679-5292d6997782?w=800&q=80', 'rare', true, true, '{"spell_power": 15, "xp_bonus": 5}'),
('wand_elder', 'Varinha das Varinhas', 'A varinha mais poderosa, feita de sabugueiro e pelo de testrálio.', 'wand', 15000, 'https://portal-hogwarts.lovable.app/legendary_elder_wand_cinematic_1776814022237.png', 'legendary', true, true, '{"spell_power": 50, "xp_bonus": 20, "level_up": 1}'),
('wand_vine_dragon', 'Varinha de Videira e Dragão', 'Videira com núcleo de fibra de coração de dragão. Escolheu Hermione Granger.', 'wand', 1100, '', 'rare', true, false, '{"intelligence": 10, "xp_bonus": 5}'),

-- Vassouras
('broom_nimbus_2000', 'Nimbus 2000', 'A vassoura de corrida mais rápida de sua época.', 'accessory', 2500, 'https://images.unsplash.com/photo-1598124146163-36819847286d?w=800&q=80', 'rare', true, true, '{"quidditch_speed": 20}'),
('broom_firebolt', 'Firebolt', 'Cabo de freixo polido, aerodinâmica suprema. Usada por Harry Potter.', 'accessory', 8000, '', 'legendary', true, true, '{"quidditch_speed": 50, "xp_bonus": 10}'),

-- Pets
('pet_owl_hedwig', 'Coruja de Neve (Edwiges)', 'Uma companheira leal e silenciosa.', 'pet', 3000, 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&q=80', 'rare', true, true, '{"delivery_speed": 10, "xp_bonus": 2}'),
('pet_cat_crookshanks', 'Bichento', 'Metade Amasso, muito inteligente e caçador de ratos.', 'pet', 1500, '', 'rare', true, false, '{"detection": 15}'),
('pet_toad_neville', 'Trevo (Sapo)', 'Sempre se perdendo, mas um animal clássico de Hogwarts.', 'pet', 500, '', 'common', true, false, '{"luck": 5}'),

-- Itens de RPG / Level Up
('book_advanced_potions', 'Livros de Poções Avançadas', 'Pertenceu ao Príncipe Mestiço. Contém anotações valiosas.', 'potion', 2000, '', 'rare', true, true, '{"xp_reward": 500, "level_up_chance": 10}'),
('item_marauders_map', 'Mapa do Maroto', 'Eu juro solenemente não fazer nada de bom.', 'accessory', 10000, '', 'legendary', true, true, '{"visibility_hidden": true, "xp_bonus": 15}'),

-- Colecionáveis
('pack_stickers_standard', 'Pacote de Figurinhas Comum', 'Contém 3 figurinhas aleatórias para seu álbum.', 'upgrade', 150, 'https://portal-hogwarts.lovable.app/legendary_chest_3d_1776816744823.png', 'common', true, false, '{"grant_stickers": 3}'),
('pack_stickers_deluxe', 'Pacote de Figurinhas Deluxe', 'Contém 5 figurinhas com alta chance de Raras.', 'upgrade', 500, 'https://portal-hogwarts.lovable.app/legendary_chest_3d_1776816744823.png', 'rare', true, true, '{"grant_stickers": 5, "rarity_boost": true}');

-- Habilita RLS se não estiver
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (evita erro se já existir)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Store items are viewable by everyone') THEN
        CREATE POLICY "Store items are viewable by everyone" ON public.store_items FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Função para aplicar efeitos
CREATE OR REPLACE FUNCTION public.apply_item_effects()
RETURNS TRIGGER AS $$
DECLARE
    item_effects JSONB;
    xp_to_add INTEGER;
BEGIN
    SELECT effects INTO item_effects FROM public.store_items WHERE id = NEW.item_id;
    
    IF item_effects ? 'xp_reward' THEN
        xp_to_add := (item_effects->>'xp_reward')::INTEGER;
        UPDATE public.profiles 
        SET xp = COALESCE(xp, 0) + xp_to_add
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS trigger_apply_item_effects ON public.user_items;
CREATE TRIGGER trigger_apply_item_effects
AFTER INSERT ON public.user_items
FOR EACH ROW
EXECUTE FUNCTION public.apply_item_effects();
