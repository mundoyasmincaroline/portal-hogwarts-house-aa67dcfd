-- SCRIPT DE TESTE FINAL (V4)
DO $$
DECLARE
    target_user_id UUID;
    oc_id UUID := gen_random_uuid();
    canon_id UUID := gen_random_uuid();
BEGIN
    SELECT user_id INTO target_user_id FROM public.profiles LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum usuário encontrado.';
    END IF;

    -- Criar personagem OC
    INSERT INTO public.characters (
        id, user_id, full_name, character_type, house, age, blood_status, wand, 
        personality, history, background, age_category, gender
    )
    VALUES (
        oc_id,
        target_user_id,
        'Teste Original (OC)',
        'oc',
        'gryffindor',
        16,
        'Mestiço',
        'Azevinho, 11 polegadas',
        'Leal.',
        'História de teste.',
        'Background de teste.',
        'student',
        'male'
    )
    ON CONFLICT DO NOTHING;

    -- Criar personagem Canon
    INSERT INTO public.characters (
        id, user_id, full_name, character_type, house, age, blood_status, wand, 
        canon_portrayed_by, age_category, gender
    )
    VALUES (
        canon_id,
        target_user_id,
        'Harry Potter (Teste)',
        'canon',
        'gryffindor',
        17,
        'Mestiço',
        'Azevinho, 11 polegadas',
        'Daniel Radcliffe',
        'student',
        'male'
    )
    ON CONFLICT DO NOTHING;

    -- Registrar reserva (fornecendo ambos os campos por segurança)
    INSERT INTO public.canon_claims (canon_name, user_id, claimed_by)
    VALUES ('Harry Potter (Teste)', target_user_id, target_user_id)
    ON CONFLICT DO NOTHING;

    UPDATE public.profiles SET active_character_id = oc_id WHERE user_id = target_user_id;

    RAISE NOTICE 'Sucesso absoluto! Tudo pronto.';
END $$;
