INSERT INTO public.badges (name, description, icon, xp_required) VALUES
('Mestre das Varinhas', 'Uma insígnia dada apenas aos feiticeiros mais habilidosos.', '🪄', 500),
('Apanhador de Ouro', 'Raro como o próprio pomo de ouro.', '🟡', 800),
('Espírito do Castelo', 'Para aqueles que conhecem todos os segredos de Hogwarts.', '🏰', 1200),
('Protetor Sombrio', 'Astuto e enigmático, sempre observando das sombras.', '🐍', 1500),
('Herói da Luz', 'A luz da esperança nas horas mais sombrias.', '✨', 1500),
('Coroa de Cristal', 'Realeza entre os bruxos.', '👑', 3000)
ON CONFLICT DO NOTHING;
