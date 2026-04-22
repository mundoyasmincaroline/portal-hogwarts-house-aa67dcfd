-- 🕶️ REVOLUTION UPDATES: SPRINT MODE
-- Ativa o bônus de 2x recompensas para o crescimento viral

INSERT INTO public.site_settings (setting_key, setting_value) VALUES
('is_sprint_active', '{"active": false, "end_date": null, "multiplier": 2}'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Função para verificar se o sprint está ativo
CREATE OR REPLACE FUNCTION public.is_sprint_active()
RETURNS BOOLEAN AS $$
DECLARE
    is_active BOOLEAN;
BEGIN
    SELECT (setting_value->>'active')::BOOLEAN INTO is_active
    FROM public.site_settings
    WHERE setting_key = 'is_sprint_active';
    RETURN COALESCE(is_active, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajustar funções de recompensa para considerar o Sprint
CREATE OR REPLACE FUNCTION public.award_xp_action(_action TEXT, _user_id UUID, _xp INTEGER)
RETURNS VOID AS $$
DECLARE
    multiplier INTEGER := 1;
BEGIN
    IF public.is_sprint_active() THEN
        multiplier := 2;
    END IF;

    UPDATE public.profiles
    SET xp = xp + (_xp * multiplier)
    WHERE user_id = _user_id;

    -- Lógica de Level Up simplificada aqui ou via trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
