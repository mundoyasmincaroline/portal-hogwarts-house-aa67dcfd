import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gubokmpoihpoiecvngnm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1Ym9rbXBvaWhwb2llY3ZuZ25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzAwODksImV4cCI6MjA5MTg0NjA4OX0.hUx-5aatUnDoHANsm0nAyPmtgij_Es9UWUL67gqKVL8'
);

const items = [
  { id: 'ae858210-7d71-4995-8c8e-2f338137e749', name: 'Robe Carmesim da Coragem', desc: 'Seda de acromântula tingida em vermelho profundo com fios de ouro entrelaçados. Um manto digno dos mais bravos.', url: '/items/emerald_robe.png' },
  { id: 'b33312ef-7775-4a44-b6bb-539eaff2af15', name: 'Robe das Sombras Esmeralda', desc: 'Robe de seda verde-esmeralda com detalhes em prata. Elegância e poder em cada fio.', url: '/items/emerald_robe.png' },
  { id: 'ea9946a5-b1d3-41a9-9403-fcd5da5f2d22', name: 'Robe Azul-Safira do Conhecimento', desc: 'Manto flutuante adornado com constelações estelares que brilham suavemente no escuro. Pura sabedoria.', url: '/items/emerald_robe.png' },
  { id: 'ea0d497b-55e0-46b5-a0a8-e0060ca53b12', name: 'Robe Dourado da Lealdade', desc: 'Tecido radiante banhado em pó de ouro e luz solar. Exala calor mágico e protege contra azarações.', url: '/items/emerald_robe.png' },
  { id: '8b1d305a-aa80-4218-bb5d-73338e390565', name: 'Robe Cerimonial do Fundador', desc: 'O mais prestigioso robe do castelo. Costurado por duendes com fios de prata pura e magia ancestral.', url: '/items/emerald_robe.png' },
  { id: '1f213f12-d413-48ae-9e27-ca99a57d6118', name: 'Capa do Baile de Inverno', desc: 'Um tecido que imita o gelo eterno e as estrelas do céu noturno. Perfeição em forma de vestimenta.', url: '/items/invisibility_cloak_1776713411406.png' },
  { id: '26e7da2e-7c6c-425d-b533-3b90b867bac9', name: 'Varinha Rúnica Ancestral', desc: 'Madeira escura entalhada com runas brilhantes. Um artefato de poder formidável moldado por magia antiga.', url: '/items/ancient_wand.png' },
  { id: '968f70b6-a4a8-4f4a-ab11-7ff8329e41b9', name: 'Varinha de Oliveira Sagrada', desc: 'Esculpida do galho de uma oliveira milenar e núcleo de pena de fênix. Confere feitiços ágeis e precisos.', url: '/items/olive_wand_1776713314829.png' },
  { id: 'd8df1783-596a-45e5-ba29-5336cce19d05', name: 'Varinha das Trevas Encantada', desc: 'Entalhada em madeira negra com núcleo de corda de coração de dragão. Uma aura sombria a envolve constantemente.', url: '/items/dark_wand_1776713338782.png' },
  { id: 'a21da022-8a5c-4e49-855f-b05e45dfefd6', name: 'Varinha de Vidoeiro Prateada', desc: 'Madeira clara com veias prateadas pulsantes de magia. Potencializa feitiços de cura e proteção.', url: '/items/birch_wand_1776713360535.png' },
  { id: '20582fc8-7146-4d5e-a03a-643a9c237e28', name: 'Óculos Dourados da Visão Verdadeira', desc: 'Armação de ouro maciço infundida com feitiços reveladores. Enxergue a magia oculta em todos os lugares.', url: '/items/gold_glasses_1776713376677.png' },
  { id: 'd4536519-8ba5-4728-a9a1-3180020a5b7f', name: 'O Chapéu Seletor Animado', desc: 'A relíquia milenar dos fundadores. Este chapéu interage com o ambiente e murmura feitiços esquecidos.', url: '/items/sorting_hat_1776713390223.png' },
  { id: '782c735e-2ea0-465f-9bed-357c72ca8da4', name: 'Capa da Invisibilidade Lendária', desc: 'Tecida a partir das sombras e do vazio. Oculta o usuário de qualquer olhar mortal ou mágico.', url: '/items/invisibility_cloak_1776713411406.png' },
  { id: 'a22d7d14-e35c-4dc2-93f3-bb268d357b84', name: 'Coruja Mecânica de Ouro', desc: 'Maravilha da engenharia bruxa. Olhos de âmbar sábios e penas de ouro. Uma companhia de prestígio absoluto.', url: '/items/golden_owl_1776713424659.png' },
  { id: '489b2266-8879-4dc1-ae52-dee7f2fc8eaf', name: 'Moldura VIP Diamante Celestial', desc: 'Um aro feito de diamantes astrais que emite um brilho pulsante e luxuoso ao redor da sua foto.', url: '/items/vip_frame_1776713437249.png' },
  { id: '5be5b8c6-6372-4802-b256-0fbcdfd99e4d', name: 'Partículas Arcanas do Caos', desc: 'Esferas mágicas de energia roxa que flutuam ao redor do seu perfil, emitindo uma aura de puro poder.', url: '/items/purple_particles_1776713472689.png' },
  { id: '6cc0e433-6aaf-453f-b8b2-849c315154a8', name: 'Nome em Ouro Cintilante', desc: 'As letras do seu nome forjadas em ouro puro mágico, faiscando e chamando atenção de todos no portal.', url: '/items/golden_name_1776713522997.png' },
  { id: 'ccd8aa59-997f-4e89-9065-57fca94e46d6', name: 'Castelo Encantado à Meia-Noite', desc: 'Um plano de fundo animado. O majestoso castelo debaixo de uma lua cheia gigante com estrelas cadentes.', url: '/items/night_castle_1776713609293.png' }
];

async function updateDB() {
  for (const item of items) {
    const { error } = await supabase.from('store_items')
      .update({ name: item.name, description: item.desc, image_url: item.url })
      .eq('id', item.id);
    if (error) console.error("Error updating", item.name, error);
    else console.log("Updated", item.name);
  }
}
updateDB();
