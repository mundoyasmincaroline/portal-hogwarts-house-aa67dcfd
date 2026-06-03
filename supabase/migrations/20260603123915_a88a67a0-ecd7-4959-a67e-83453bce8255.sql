-- Add more chapters
INSERT INTO public.story_chapters (slug, title, summary, content, arc, chapter_order, requires_level, rewards_xp, rewards_galeons, cover_emoji) VALUES
('o-desafio-do-torneio', 'O Desafio do Torneio', 'A glória eterna espera pelo campeão.', 'O Cálice de Fogo brilha intensamente no Salão Principal. Seu nome voou para fora em uma chama azul. O silêncio é ensurdecedor.

Três tarefas esperam por você. A primeira envolve enfrentar um dragão. O que você sente ao olhar para as chamas?', 'main', 5, 10, 300, 200, '🏆'),
('a-camara-dos-segredos', 'A Câmara dos Segredos', 'O herdeiro voltou.', 'Paredes pichadas com sangue, gatos petrificados. O mistério envolve Hogwarts novamente. Você encontra a entrada na cabana de Murta que Geme.

O cano leva para baixo, para a escuridão profunda. Você está pronto para enfrentar o que rasteja no escuro?', 'main', 6, 12, 500, 500, '🐍');

-- Add choices for the new chapters
INSERT INTO public.story_choices (chapter_id, label, outcome_text, next_chapter_slug, xp_bonus, display_order)
SELECT id, 'Uso meu conhecimento em feitiços de proteção.', 'Você se sente seguro sob sua cúpula mágica.', NULL, 50, 1 FROM public.story_chapters WHERE slug = 'o-desafio-do-torneio';

INSERT INTO public.story_choices (chapter_id, label, outcome_text, next_chapter_slug, xp_bonus, display_order)
SELECT id, 'Confio na minha vassoura e na minha velocidade.', 'O vento corta seu rosto enquanto você mergulha!', NULL, 100, 2 FROM public.story_chapters WHERE slug = 'o-desafio-do-torneio';

INSERT INTO public.story_choices (chapter_id, label, outcome_text, next_chapter_slug, xp_bonus, display_order)
SELECT id, 'Desço sozinho. Eu não preciso de ajuda.', 'A coragem faz seu peito estufar, mas o medo é real.', NULL, 150, 1 FROM public.story_chapters WHERE slug = 'a-camara-dos-segredos';

INSERT INTO public.story_choices (chapter_id, label, outcome_text, next_chapter_slug, xp_bonus, display_order)
SELECT id, 'Procuro por um aliado confiável antes de descer.', 'A união faz a força, até mesmo no escuro.', NULL, 50, 2 FROM public.story_chapters WHERE slug = 'a-camara-dos-segredos';
