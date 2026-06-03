-- 1. Restrict Storage Listing
DROP POLICY IF EXISTS "Authenticated can view avatars list" ON storage.objects;
CREATE POLICY "Users can only list their own avatars" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Revoke and selective Grant for functions
-- First, revoke from everyone except service_role for all functions in public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated, anon, public', r.nspname, r.proname, r.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role', r.nspname, r.proname, r.args);
    END LOOP;
END $$;

-- 3. Grant back to authenticated for specific USER-FACING functions
DO $$
DECLARE
    func_names text[] := ARRAY[
        'join_club', 'buy_store_item', 'vault_deposit', 'start_quest', 'declare_inheritance',
        'propose_alliance', 'accept_alliance', 'respond_item_trade', 'cancel_marketplace_listing',
        'vault_claim_interest', 'forfeit_duel', 'brew_potion', 'claim_battle_pass_reward',
        'propose_item_trade', 'complete_ministry_mission', 'complete_daily_mission', 'complete_quest_step',
        'create_family', 'craft_wand', 'open_vault', 'join_guild', 'create_guild', 'harvest_plot',
        'create_horcrux', 'claim_rp_slot', 'join_family', 'grant_merit', 'stamp_active_character',
        'leave_family', 'create_marketplace_listing', 'water_plot', 'ascend_to_legend', 'sell_stock',
        'add_relation', 'repay_bank_loan', 'apply_item_effects', 'join_faction', 'award_xp_action',
        'train_creature', 'plant_seed', 'request_mentorship', 'complete_referral_action', 'accept_duel',
        'travel_to', 'join_tournament', 'vote_ugc', 'buy_marketplace_listing', 'feed_creature',
        'adopt_creature', 'start_quidditch_match', 'toggle_insta_like', 'quidditch_score', 'collect_potion'
    ];
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = ANY(func_names)
    ) LOOP
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated', r.nspname, r.proname, r.args);
    END LOOP;
END $$;
