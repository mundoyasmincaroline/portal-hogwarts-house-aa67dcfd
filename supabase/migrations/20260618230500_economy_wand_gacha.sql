-- Migration: Gacha Wand Crafting & Luxury Store Items

-- 1. Insert Luxury Items into store_items for Gold Sinks
INSERT INTO store_items (slug, name, description, category, rarity, price_galeons, image_url)
VALUES
('title-lord', 'Título: Lorde das Trevas', 'O título mais temido do mundo mágico. Demonstre seu poder e riqueza absolutos.', 'title', 'legendary', 10000, '/items/dark_mark.png'),
('title-order', 'Título: Herói da Ordem', 'Apenas para os bruxos mais corajosos e ricos. Uma aura de pura bondade.', 'title', 'legendary', 10000, '/items/phoenix.png'),
('aura-fire', 'Aura: Chamas Vivas', 'Sua foto de perfil ficará em chamas constantemente.', 'aura', 'epic', 5000, '/items/fire_aura.png')
ON CONFLICT (slug) DO UPDATE SET price_galeons = EXCLUDED.price_galeons;

-- 2. Update craft_wand to charge 50 Galeões and roll random Gacha stats
CREATE OR REPLACE FUNCTION craft_wand(p_wood text, p_core text, p_length numeric, p_flex text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_profile record;
    v_wand record;
    v_cost int := 50;
    v_atk int;
    v_def int;
    v_spd int;
BEGIN
    v_user_id := auth.uid();
    
    -- Check if user has enough galeons
    SELECT * INTO v_profile FROM profiles WHERE user_id = v_user_id;
    IF v_profile.galeons < v_cost THEN
        RAISE EXCEPTION 'Você precisa de % Galeões para forjar uma varinha.', v_cost;
    END IF;

    -- Deduct galeons
    UPDATE profiles SET galeons = galeons - v_cost WHERE user_id = v_user_id;

    -- Generate Gacha Stats (1 to 10 normally, 5% chance of 15, 1% chance of 20)
    -- Attack
    IF random() < 0.01 THEN v_atk := 20;
    ELSIF random() < 0.05 THEN v_atk := 15;
    ELSE v_atk := floor(random() * 10 + 1); END IF;
    
    -- Defense
    IF random() < 0.01 THEN v_def := 20;
    ELSIF random() < 0.05 THEN v_def := 15;
    ELSE v_def := floor(random() * 10 + 1); END IF;

    -- Speed
    IF random() < 0.01 THEN v_spd := 20;
    ELSIF random() < 0.05 THEN v_spd := 15;
    ELSE v_spd := floor(random() * 10 + 1); END IF;

    -- Wood/Core base bonuses
    IF p_core = 'corda de coração de dragão' THEN v_atk := v_atk + 5; END IF;
    IF p_core = 'pelo de unicórnio' THEN v_def := v_def + 5; END IF;
    IF p_core = 'crina de thestral' THEN v_spd := v_spd + 5; END IF;

    -- Upsert wand
    INSERT INTO wands (user_id, wood, core, length_inches, flexibility, bonus_attack, bonus_defense, bonus_speed)
    VALUES (v_user_id, p_wood, p_core, p_length, p_flex, v_atk, v_def, v_spd)
    ON CONFLICT (user_id) DO UPDATE SET 
        wood = EXCLUDED.wood,
        core = EXCLUDED.core,
        length_inches = EXCLUDED.length_inches,
        flexibility = EXCLUDED.flexibility,
        bonus_attack = EXCLUDED.bonus_attack,
        bonus_defense = EXCLUDED.bonus_defense,
        bonus_speed = EXCLUDED.bonus_speed,
        updated_at = now()
    RETURNING * INTO v_wand;

    -- Log transaction
    INSERT INTO currency_ledger (user_id, amount, currency_type, transaction_type, description)
    VALUES (v_user_id, -v_cost, 'galeon', 'wand_craft', 'Forja de varinha');

    RETURN row_to_json(v_wand);
END;
$$;
