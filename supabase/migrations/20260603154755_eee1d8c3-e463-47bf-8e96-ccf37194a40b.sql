-- Remover a restrição de check de gênero que causava o erro
ALTER TABLE public.characters DROP CONSTRAINT IF EXISTS characters_gender_check;

-- Aumentar o tamanho do campo gênero para suportar outros valores
ALTER TABLE public.characters ALTER COLUMN gender TYPE varchar(50);

-- Garantir que campos de texto importantes não tenham limites pequenos de caracteres (já são text, mas alguns podem ser varchar(100))
-- full_name já é varchar(100), vamos deixar como está pois é um nome.
-- Outros campos já são 'text' de acordo com a inspeção anterior.

-- Adicionar 'non-binary' e 'other' como possibilidades implícitas ao remover a constraint anterior.
-- Se no futuro quisermos uma nova constraint mais abrangente:
-- ALTER TABLE public.characters ADD CONSTRAINT characters_gender_check CHECK (gender IN ('male', 'female', 'non-binary', 'other', 'not_specified'));
