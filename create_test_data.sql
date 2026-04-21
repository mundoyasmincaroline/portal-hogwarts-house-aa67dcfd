-- SCRIPT PARA CRIAR DADOS DE TESTE (USUÁRIO FAKE E PERSONAGENS)
-- ATENÇÃO: Execute este script apenas no Editor SQL do Supabase.

-- 1. Criar um usuário de teste no Auth (se não existir)
-- Nota: O Supabase Auth geralmente requer chamadas via API, mas podemos inserir no public.profiles
-- para simular um usuário que já existe ou criar via SQL se tivermos permissão de superuser (não recomendado).
-- Aqui vamos criar apenas os dados na tabela public para teste de estrutura.

DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- ID fixo para teste
    oc_id UUID := gen_random_uuid();
    canon_id UUID := gen_random_uuid();
BEGIN
    -- Garantir que o perfil de teste existe
    INSERT INTO public.profiles (user_id, full_name, username, house, age, approved, has_accepted_rules)
    VALUES (test_user_id, 'Bruxo de Teste', 'test_wizard', 'gryffindor', 15, true, true)
    ON CONFLICT (user_id) DO UPDATE SET approved = true, has_accepted_rules = true;

    -- 2. Criar personagem OC
    INSERT INTO public.characters (id, user_id, full_name, character_type, house, age, blood_status, wand, personality, history)
    VALUES (
        oc_id,
        test_user_id,
        'Harry Teste OC',
        'oc',
        'gryffindor',
        15,
        'Mestiço',
        'Azevinho, 11 polegadas, Pena de Fênix',
        'Corajoso e persistente.',
        'Um bruxo criado para testar as fronteiras da magia no portal.'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. Criar personagem Canon
    INSERT INTO public.characters (id, user_id, full_name, character_type, house, age, blood_status, wand)
    VALUES (
        canon_id,
        test_user_id,
        'Hermione Granger (Teste)',
        'canon',
        'gryffindor',
        15,
        'Nascida-trouxa',
        'Videira, 10 polegadas, Fibra de Coração de Dragão'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 4. Registrar reserva de Canon
    INSERT INTO public.canon_claims (character_id, canon_name, claimed_by)
    VALUES (canon_id, 'Hermione Granger', test_user_id)
    ON CONFLICT (canon_name) DO NOTHING;

    RAISE NOTICE 'Dados de teste criados com sucesso para o usuário %', test_user_id;
END $$;
