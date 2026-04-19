-- SCRIPT DE CORREÇÃO ADMIN E RESET DE FICHAS DA YASMIN

-- 1. Aprovar a conta do Paulo automaticamente e aceitar regras
UPDATE public.profiles
SET 
  approved = true, 
  has_accepted_rules = true
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'paulormorpheus21@gmail.com');

-- 1.1 Limpar cargos antigos do Paulo (para evitar duplicatas ou erros)
DELETE FROM public.user_roles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'paulormorpheus21@gmail.com');

-- 1.2 Garantir que o Paulo ganhe o selo de Administrador Master no banco de funções (user_roles)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'paulormorpheus21@gmail.com';


-- 2. Deletar as fichas da conta que excedeu o limite (Yasmin)
DELETE FROM public.characters
WHERE user_id IN (
    SELECT user_id 
    FROM public.characters 
    GROUP BY user_id 
    HAVING COUNT(*) > 2
);
