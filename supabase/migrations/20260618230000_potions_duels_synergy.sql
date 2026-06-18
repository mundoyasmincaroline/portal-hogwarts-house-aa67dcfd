-- Migration: Potions and Duels Synergy

-- 1. Create the RPC for using a potion during a duel
CREATE OR REPLACE FUNCTION use_potion_in_duel(p_match uuid, p_potion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_match record;
    v_potion record;
    v_user_id uuid;
    v_is_player_a boolean;
    v_heal int := 0;
    v_shield int := 0;
    v_potion_name text;
BEGIN
    v_user_id := auth.uid();
    
    -- Get match details
    SELECT * INTO v_match FROM duel_matches WHERE id = p_match;
    IF v_match IS NULL THEN
        RAISE EXCEPTION 'Match not found';
    END IF;
    
    IF v_match.status != 'active' THEN
        RAISE EXCEPTION 'Match is not active';
    END IF;

    -- Determine player
    IF v_match.player_a = v_user_id THEN
        v_is_player_a := true;
    ELSIF v_match.player_b = v_user_id THEN
        v_is_player_a := false;
    ELSE
        RAISE EXCEPTION 'You are not in this match';
    END IF;

    -- Check if it's the player's turn
    IF v_match.current_turn != v_user_id THEN
        RAISE EXCEPTION 'It is not your turn';
    END IF;

    -- Verify the potion belongs to the user and is completed
    SELECT up.*, pr.name INTO v_potion 
    FROM user_potions up
    JOIN potion_recipes pr ON up.recipe_id = pr.id
    WHERE up.id = p_potion_id AND up.user_id = v_user_id AND up.status = 'completed';

    IF v_potion IS NULL THEN
        RAISE EXCEPTION 'Potion not found or not ready';
    END IF;

    -- Determine potion effects based on the name/slug
    v_potion_name := v_potion.name;
    
    -- Very basic effect determination based on standard potions
    IF v_potion_name ILIKE '%wiggenweld%' OR v_potion_name ILIKE '%cura%' THEN
        v_heal := 50;
    ELSIF v_potion_name ILIKE '%ararambo%' OR v_potion_name ILIKE '%escudo%' OR v_potion_name ILIKE '%proteção%' THEN
        v_shield := 30;
    ELSIF v_potion_name ILIKE '%pimenta%' THEN
        v_heal := 20;
    ELSE
        -- Default small heal for unknown potions
        v_heal := 10;
    END IF;

    -- Apply effects and switch turn
    IF v_is_player_a THEN
        UPDATE duel_matches SET
            hp_a = LEAST(hp_a + v_heal, 100),
            shield_a = shield_a + v_shield,
            current_turn = v_match.player_b,
            turn_count = turn_count + 1
        WHERE id = p_match;
    ELSE
        UPDATE duel_matches SET
            hp_b = LEAST(hp_b + v_heal, 100),
            shield_b = shield_b + v_shield,
            current_turn = v_match.player_a,
            turn_count = turn_count + 1
        WHERE id = p_match;
    END IF;

    -- Delete the used potion (consume it)
    DELETE FROM user_potions WHERE id = p_potion_id;

    -- Log the action
    INSERT INTO duel_actions (match_id, turn, player, log_text)
    VALUES (
        p_match,
        v_match.turn_count + 1,
        v_user_id,
        'Bebeu ' || v_potion_name || ' (Recuperou ' || v_heal || ' HP, Ganhou ' || v_shield || ' Escudo)'
    );

END;
$$;
