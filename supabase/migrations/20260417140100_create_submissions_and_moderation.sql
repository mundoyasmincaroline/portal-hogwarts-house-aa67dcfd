-- Adicionar colunas de prova e status aos desafios dos usuários
ALTER TABLE public.user_challenges
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
ADD COLUMN IF NOT EXISTS proof TEXT;

-- Tabela para palavras proibidas (Moderação)
CREATE TABLE IF NOT EXISTS public.banned_words (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Qualquer um pode ler palavras proibidas" ON public.banned_words FOR SELECT USING (true);
CREATE POLICY "Apenas admin pode gerenciar palavras proibidas" ON public.banned_words FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Inserir algumas palavras padrão (exemplo)
INSERT INTO public.banned_words (word) VALUES
('porra'), ('caralho'), ('buceta'), ('puta')
ON CONFLICT DO NOTHING;
