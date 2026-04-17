-- Adicionar colunas de quiz à tabela challenges
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS question TEXT,
ADD COLUMN IF NOT EXISTS correct_answer TEXT;

-- Adicionar política para garantir que apenas o criador/admin possa ver a resposta correta (opcional, mas bom)
-- Aqui simplificaremos: o frontend fará a validação ou podemos fazer no banco.
