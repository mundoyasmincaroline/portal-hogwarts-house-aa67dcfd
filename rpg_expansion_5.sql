-- EXPANSÃO 5: Missões Sociais e Loja Borgin & Burkes

-- 1. Preparar a tabela de missões do usuário para receber Comprovações (Links)
ALTER TABLE public.user_challenges ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- 2. Inserir Missões Especiais de Redes Sociais
INSERT INTO public.challenges (title, description, xp_reward, type, active) VALUES
('Embaixador do TikTok', 'Faça um vídeo no TikTok falando sobre o Portal Hogwarts House. Envie o link para validação.', 500, 'social', true),
('Bruxo do Instagram', 'Poste uma foto do seu personagem ou álbum no Feed do Instagram marcando o portal.', 300, 'social', true),
('Stories Mágico', 'Poste um Story no Instagram com a tela do portal e adicione o link.', 150, 'social', true),
('Profeta Diário no YouTube', 'Grave um vídeo para o YouTube apresentando as novidades do portal para novos alunos.', 1000, 'social', true);

-- 3. Abastecer a Loja Borgin & Burkes (Insígnias e Emojis Raros)
-- Certifique-se de que a tabela badges existe (foi criada em scripts anteriores, se não, isso falhará. Assumindo que existe pelo código do EmojiShop.tsx)
INSERT INTO public.badges (name, description, icon, xp_required) VALUES
('Marca Negra', 'Apenas para bruxos com tendências à magia das trevas.', '💀', 200),
('Vira-Tempo', 'Para aqueles que queriam que o dia tivesse 48 horas.', '⏳', 350),
('Relíquias da Morte', 'O mestre da morte.', '👁️‍🗨️', 500),
('Pomo de Ouro', 'O apanhador mais rápido do castelo.', '✨', 150),
('Cálice de Fogo', 'O campeão do torneio tribruxo.', '🔥', 300),
('Chapéu Seletor', 'O sábio conselheiro.', '🎩', 100),
('Coruja Edwiges', 'A mensageira fiel.', '🦉', 250),
('Fênix Fawkes', 'Renasce das cinzas.', '🦅', 400);
