import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useSound } from "@/hooks/useSound";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, Coins, Crown, Wand2, Shirt, Gem, Sparkles, Star, ExternalLink, Check, Flame, Gift, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoreItemVisual from "@/components/StoreItemVisual";
import SafeImage from "@/components/SafeImage";
import MagicalGaleon from "@/components/MagicalGaleon";

// ─── Config ────────────────────────────────────────────────────────────
// Tudo via supabase.rpc() — sem CORS, server-side via pg_net
// ────────────────────────────────────────────────────────────


// ─── Tipos ────────────────────────────────────────────────
interface StoreItem {
  id: string; name: string; description: string; category: string;
  price_galeons: number; image_url: string; rarity: string;
  is_featured: boolean;
}

// ─── Pacotes de Galeões ────────────────────────────────────
const GALEON_PACKAGES = [
  { id: "bolsinha",  name: "Bolsinha de Galeões",     galeons: 100,  price_brl: 4.90,  icon: "💰", image_url: "/monster_quality_galeon.png", color: "from-amber-800/40 to-amber-900/40", border: "border-amber-600/40", glow: "group-hover:shadow-[0_0_20px_rgba(217,119,6,0.3)]" },
  { id: "saco",      name: "Saco de Galeões",          galeons: 300,  price_brl: 12.90, icon: "🪙", image_url: "/monster_quality_galeon.png", color: "from-amber-700/50 to-yellow-800/40", border: "border-yellow-500/50", glow: "group-hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]", badge: "Mais Popular" },
  { id: "starter",   name: "Pacote do Fundador",      galeons: 2000, price_brl: 47.90, icon: "✨", image_url: "/monster_quality_galeon.png", color: "from-purple-600/50 to-amber-600/50", border: "border-purple-400/70", glow: "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]", badge: "OFERTA ÚNICA" },
  { id: "tesouro",   name: "Tesouro de Gringotts",     galeons: 1500, price_brl: 44.90, icon: "👑", image_url: "/monster_quality_galeon.png", color: "from-yellow-500/60 to-amber-600/50", border: "border-yellow-400/70", glow: "group-hover:shadow-[0_0_35px_rgba(250,204,21,0.6)]", badge: "Melhor Valor" },
  { id: "cofre",     name: "Cofre Lendário",           galeons: 4000, price_brl: 99.90, icon: "🏆", image_url: "/monster_quality_galeon.png", color: "from-yellow-400/70 to-amber-500/60", border: "border-yellow-300/80", glow: "group-hover:shadow-[0_0_45px_rgba(253,224,71,0.7)]", badge: "Lendário" },
];

const MONSTER_QUALITY_ITEMS: StoreItem[] = [
  // WANDS
  { id: "mq_wand_elder", name: "Varinha das Varinhas", category: "wand", price_galeons: 5000, image_url: "/items/monster_quality_wand_elder.png", rarity: "legendary", is_featured: true, description: "A varinha mais poderosa já fabricada, feita de sabugueiro e núcleo de pelo de testrálio." },
  { id: "mq_wand_ebony", name: "Varinha de Ébano", category: "wand", price_galeons: 2500, image_url: "/items/dark_wand_1776713338782.png", rarity: "rare", is_featured: false, description: "Ébano é uma madeira preta e impressionante, com um brilho quase metálico." },
  { id: "mq_wand_holly", name: "Varinha de Azevinho", category: "wand", price_galeons: 1200, image_url: "/items/ancient_wand.png", rarity: "uncommon", is_featured: false, description: "Uma das madeiras de varinha mais raras e protetoras." },
  
  // CLOTHING
  { id: "mq_cloth_founder", name: "Robe Azul-Safira", category: "clothing", price_galeons: 3500, image_url: "/robe_safira.png", rarity: "legendary", is_featured: true, description: "Robe cerimonial usado pelos antigos fundadores, com bordados de ouro puro." },
  { id: "mq_cloth_crimson", name: "Manto Carmesim", category: "clothing", price_galeons: 2800, image_url: "/robe_carmesim.png", rarity: "legendary", is_featured: true, description: "Um manto imponente que emana uma aura de autoridade e coragem." },
  { id: "mq_cloth_stealth", name: "Capa de Invisibilidade", category: "clothing", price_galeons: 10000, image_url: "/items/monster_quality_invisibility_cloak.png", rarity: "legendary", is_featured: true, description: "Tecida com fios de seminviso, esta capa torna o usuário indetectável." },

  // POTIONS (Alquimia Emocional do Arquiteto)
  { id: "mq_potion_euphoria", name: "Poção de Euforia", category: "potion", price_galeons: 500, image_url: "/items/monster_quality_potion_luck.png", rarity: "rare", is_featured: true, description: "Induz um estado de ALEGRIA absoluta. Concede +20% de bônus de XP em todas as atividades." },
  { id: "mq_potion_rage", name: "Poção de Ódio Puro", category: "potion", price_galeons: 800, image_url: "/items/monster_quality_potion_luck.png", rarity: "rare", is_featured: true, description: "Desperta a RAIVA latente. Aumenta o dano de feitiços ofensivos em 50% nos duelos." },
  { id: "mq_potion_peace", name: "Elixir da Paz", category: "potion", price_galeons: 300, image_url: "/items/monster_quality_potion_luck.png", rarity: "uncommon", is_featured: false, description: "Acalma a alma e restaura a mana instantaneamente. Retorna ao estado NEUTRO." },
  { id: "mq_potion_sorrow", name: "Extrato de Melancolia", category: "potion", price_galeons: 400, image_url: "/items/monster_quality_potion_luck.png", rarity: "rare", is_featured: false, description: "Induz o estado de TRISTEZA profunda. Fortalece o escudo mágico e a defesa em 40%." },
  { id: "mq_potion_dragon", name: "Sangue de Dragão", category: "potion", price_galeons: 1500, image_url: "/items/monster_quality_potion_luck.png", rarity: "rare", is_featured: false, description: "Uma poção poderosa que amplifica a força vital e resistência mágica." },
  { id: "mq_potion_luck", name: "Felix Felicis", category: "potion", price_galeons: 4000, image_url: "/items/monster_quality_potion_luck.png", rarity: "legendary", is_featured: true, description: "A Sorte Líquida. Por um tempo limitado, todas as suas ações serão bem-sucedidas." },
  { id: "mq_potion_truth", name: "Veritaserum", category: "potion", price_galeons: 2000, image_url: "/items/monster_quality_potion_luck.png", rarity: "rare", is_featured: false, description: "O mais poderoso soro da verdade conhecido no mundo bruxo." },

  // ACCESSORIES
  { id: "mq_item_ring", name: "Anel de Gaunt", category: "accessory", price_galeons: 6000, image_url: "/items/amuleto_premium.png", rarity: "legendary", is_featured: false, description: "Um anel antigo com uma pedra misteriosa encravada." },

  // HORCRUXES (OSTENTAÇÃO)
  { id: "mq_horcrux_diary", name: "Diário de Tom Riddle", category: "accessory", price_galeons: 15000, image_url: "/items/sorting_hat_1776713390223.png", rarity: "legendary", is_featured: true, description: "Uma das relíquias mais sombrias. Somente para bruxos que buscam o controle absoluto." },
  { id: "mq_horcrux_locket", name: "Medalhão de Slytherin", category: "accessory", price_galeons: 12000, image_url: "/items/amuleto_premium.png", rarity: "legendary", is_featured: true, description: "Um artefato que emana uma aura de superioridade e poder antigo." },

  // WAND POWER (UPGRADES)
  { id: "mq_upgrade_core", name: "Núcleo de Fibra de Coração de Dragão", category: "upgrade", price_galeons: 2500, image_url: "/items/amuleto_premium.png", rarity: "rare", is_featured: false, description: "Aumenta o dano dos feitiços e a precisão da varinha." },
  { id: "mq_upgrade_phoenix", name: "Pena de Fênix Real", category: "upgrade", price_galeons: 3500, image_url: "/items/purple_particles_1776713472689.png", rarity: "rare", is_featured: true, description: "Concede maior versatilidade e regeneração mágica." },

  // SPECIAL SPELLS
  { id: "mq_spell_patronus", name: "Expecto Patronum", category: "spell", price_galeons: 8000, image_url: "/items/purple_particles_1776713472689.png", rarity: "legendary", is_featured: true, description: "A defesa suprema contra Dementores. O brilho da sua alma manifestado." },
  { id: "mq_spell_avada", name: "Avada Kedavra", category: "spell", price_galeons: 25000, image_url: "/items/dark_wand_1776713338782.png", rarity: "legendary", is_featured: true, description: "O feitiço proibido. Dano instantâneo e poder absoluto sobre a vida." },

  // INGREDIENTS
  { id: "mq_ing_mandrake", name: "Raiz de Mandrágora", category: "potion", price_galeons: 800, image_url: "/items/monster_quality_sorting_hat.png", rarity: "uncommon", is_featured: false, description: "Essencial para poções de cura severas." },
  { id: "mq_ing_lacewing", name: "Hemeróbios Secos", category: "potion", price_galeons: 500, image_url: "/items/monster_quality_potion_luck.png", rarity: "common", is_featured: false, description: "Base para a Poção Polissuco." },
  { id: "mq_ing_unicorn", name: "Sangue de Unicórnio", category: "potion", price_galeons: 3500, image_url: "/items/monster_quality_potion_luck.png", rarity: "legendary", is_featured: true, description: "Uma vida amaldiçoada para quem o bebe. Mas mantém você vivo mesmo no limiar da morte." },
  { id: "mq_item_sword", name: "Espada de Gryffindor", category: "accessory", price_galeons: 20000, image_url: "/items/monster_quality_gryffindor_sword.png", rarity: "legendary", is_featured: true, description: "Feita de prata pura por duendes. Absorve o que a fortalece." },
  { id: "mq_item_firebolt", name: "Vassoura Firebolt", category: "accessory", price_galeons: 50000, image_url: "/items/monster_quality_firebolt.png", rarity: "legendary", is_featured: true, description: "A vassoura de corrida mais rápida do mundo. Aerodinâmica perfeita e cabo de freixo polido." },
  { id: "mq_item_snitch", name: "Pomo de Ouro Místico", category: "accessory", price_galeons: 15000, image_url: "/items/monster_quality_golden_snitch.png", rarity: "legendary", is_featured: true, description: "Brilha com um ouro eterno. Abre ao toque de quem o capturou." },
  { id: "mq_item_founder", name: "Emblema dos Fundadores", category: "accessory", price_galeons: 10000, image_url: "/items/coroa_premium.png", rarity: "legendary", is_featured: true, description: "O símbolo máximo de autoridade e tradição mágica." },
  { id: "mq_item_chest_epic", name: "Baú de Relíquias Épicas", category: "upgrade", price_galeons: 1500, image_url: "/legendary_chest_3d.png", rarity: "legendary", is_featured: true, description: "Contém um item aleatório de raridade Rara ou Lendária. Sorte pura." },
  
  // -- NEW 50 ITEMS START --
  // WANDS (Extra)
  { id: "mq_wand_oak", name: "Varinha de Carvalho", category: "wand", price_galeons: 800, image_url: "/items/birch_wand_1776713360535.png", rarity: "common", is_featured: false, description: "Uma varinha para tempos bons e ruins, amiga de bruxos com força e coragem." },
  { id: "mq_wand_vine", name: "Varinha de Videira", category: "wand", price_galeons: 950, image_url: "/items/olive_wand_1776713314829.png", rarity: "common", is_featured: false, description: "Atraída por personalidades que buscam um propósito maior." },
  { id: "mq_wand_cedar", name: "Varinha de Cedro", category: "wand", price_galeons: 1100, image_url: "/items/varinha_premium.png", rarity: "uncommon", is_featured: false, description: "O onde quer que haja uma varinha de cedro, há um bruxo perspicaz." },
  { id: "mq_wand_maple", name: "Varinha de Bordo", category: "wand", price_galeons: 1300, image_url: "/items/ancient_wand.png", rarity: "uncommon", is_featured: false, description: "Frequentemente escolhida por viajantes e exploradores natos." },
  { id: "mq_wand_walnut", name: "Varinha de Nogueira", category: "wand", price_galeons: 2200, image_url: "/items/dark_wand_1776713338782.png", rarity: "rare", is_featured: false, description: "Bruxos altamente inteligentes devem ser testados pela nogueira primeiro." },
  
  // CLOTHING (Extra)
  { id: "mq_cloth_student_new", name: "Uniforme de Gala", category: "clothing", price_galeons: 1200, image_url: "/robe_safira.png", rarity: "uncommon", is_featured: false, description: "Para os bailes e cerimônias oficiais do castelo." },
  { id: "mq_cloth_quidditch", name: "Roupas de Quadribol", category: "clothing", price_galeons: 1800, image_url: "/items/manto_premium.png", rarity: "rare", is_featured: false, description: "Aerodinâmica e proteção reforçada para buscadores de elite." },
  { id: "mq_cloth_night", name: "Manto da Noite Eterna", category: "clothing", price_galeons: 4500, image_url: "/items/invisibility_cloak_1776713411406.png", rarity: "legendary", is_featured: true, description: "Dizem que foi costurado com as sombras de uma noite sem lua." },
  { id: "mq_cloth_dragon_hide", name: "Colete de Couro de Dragão", category: "clothing", price_galeons: 6000, image_url: "/robe_carmesim.png", rarity: "legendary", is_featured: true, description: "Resistência mágica suprema contra feitiços de fogo e impacto." },
  
  // POTIONS (Extra)
  { id: "mq_potion_polyjuice", name: "Poção Polissuco", category: "potion", price_galeons: 2000, image_url: "/items/monster_quality_potion_luck.png", rarity: "rare", is_featured: false, description: "Permite que o usuário assuma a forma física de outra pessoa." },
  { id: "mq_potion_amortentia", name: "Amortentia", category: "potion", price_galeons: 3000, image_url: "/items/monster_quality_potion_luck.png", rarity: "rare", is_featured: false, description: "A poção do amor mais poderosa do mundo. Cuidado com o que deseja." },
  { id: "mq_potion_draught", name: "Poção do Morto-Vivo", category: "potion", price_galeons: 2500, image_url: "/items/monster_quality_potion_luck.png", rarity: "rare", is_featured: false, description: "Um sono tão profundo que se assemelha à morte." },
  
  // ACCESSORIES (Extra)
  { id: "mq_acc_spectres", name: "Espectrografas", category: "accessory", price_galeons: 750, image_url: "/items/gold_glasses_1776713376677.png", rarity: "uncommon", is_featured: false, description: "Para ver Zonzóbulos que flutuam pelos seus ouvidos." },
  { id: "mq_acc_remembrall", name: "Lembrol", category: "accessory", price_galeons: 600, image_url: "/items/amuleto_premium.png", rarity: "common", is_featured: false, description: "A fumaça fica vermelha se você esqueceu algo. Pena que não diz o quê." },
  { id: "mq_acc_glasses", name: "Óculos de Meia-Lua", category: "accessory", price_galeons: 1500, image_url: "/items/gold_glasses_1776713376677.png", rarity: "rare", is_featured: false, description: "Dão um ar de sabedoria professoral ao portador." },
  { id: "mq_acc_time_turner", name: "Vira-Tempo", category: "accessory", price_galeons: 20000, image_url: "/items/amuleto_premium.png", rarity: "legendary", is_featured: true, description: "Controle as horas. Use com extrema cautela." },
  { id: "mq_acc_map", name: "Mapa do Maroto", category: "accessory", price_galeons: 15000, image_url: "/items/amuleto_premium.png", rarity: "legendary", is_featured: true, description: "Eu juro solenemente não fazer nada de bom." },
  
  // MORE... (To reach 50+)
  { id: "mq_item_deluminator", name: "Desiluminador", category: "accessory", price_galeons: 8000, image_url: "/items/amuleto_premium.png", rarity: "legendary", is_featured: false, description: "Apague as luzes ou encontre o caminho de volta para quem você ama." },
  { id: "mq_item_pensieve", name: "Penseira de Pedra", category: "upgrade", price_galeons: 12000, image_url: "/items/amuleto_premium.png", rarity: "legendary", is_featured: true, description: "Reviva memórias with detalhes perfeitos." },
  { id: "mq_item_goblet", name: "Cálice de Fogo (Réplica)", category: "accessory", price_galeons: 5000, image_url: "/items/amuleto_premium.png", rarity: "rare", is_featured: false, description: "Um item de decoração imponente para o seu dormitório." },
  { id: "mq_item_broom_stick", name: "Nimbus 2000", category: "accessory", price_galeons: 10000, image_url: "/items/amuleto_premium.png", rarity: "rare", is_featured: false, description: "Um clássico da velocidade e elegância." },
  { id: "mq_item_broom_nimbus2001", name: "Nimbus 2001", category: "accessory", price_galeons: 25000, image_url: "/items/amuleto_premium.png", rarity: "legendary", is_featured: false, description: "Superior em cada detalhe, a escolha dos Slytherins competitivos." },
  { id: "mq_spell_sectum", name: "Sectumsempra", category: "spell", price_galeons: 15000, image_url: "/items/purple_particles_1776713472689.png", rarity: "legendary", is_featured: false, description: "Para inimigos. Um feitiço que corta profundamente." },
  { id: "mq_spell_crucio", name: "Cruciatus", category: "spell", price_galeons: 20000, image_url: "/items/purple_particles_1776713472689.png", rarity: "legendary", is_featured: false, description: "Dor insuportável. Uma das Maldições Imperdoáveis." },
  { id: "mq_spell_imperio", name: "Imperius", category: "spell", price_galeons: 20000, image_url: "/items/purple_particles_1776713472689.png", rarity: "legendary", is_featured: false, description: "Controle total sobre a vontade do outro." },
  { id: "mq_potion_wit", name: "Poção para Aguçar a Inteligência", category: "potion", price_galeons: 1200, image_url: "/items/monster_quality_potion_luck.png", rarity: "uncommon", is_featured: false, description: "Para aqueles momentos de estudo intenso na biblioteca." },
  { id: "mq_potion_shrink", name: "Poção para Encolher", category: "potion", price_galeons: 1000, image_url: "/items/monster_quality_potion_luck.png", rarity: "uncommon", is_featured: false, description: "Faz as coisas ficarem pequenas. Útil em situações criativas." },
  { id: "mq_acc_ear_plugs", name: "Protetores de Ouvido de Mandrágora", category: "accessory", price_galeons: 400, image_url: "/items/amuleto_premium.png", rarity: "common", is_featured: false, description: "Evita que você desmaie com o grito das mandrágoras." },
  { id: "mq_acc_telescope", name: "Telescópio de Latão", category: "accessory", price_galeons: 2000, image_url: "/items/amuleto_premium.png", rarity: "rare", is_featured: false, description: "Para observar as estrelas da Torre de Astronomia." },
  { id: "mq_item_snuffbox", name: "Caixa de Rapé de Prata", category: "accessory", price_galeons: 1500, image_url: "/items/amuleto_premium.png", rarity: "rare", is_featured: false, description: "Um item de colecionador com gravuras mágicas." },
  { id: "mq_item_mirror", name: "Espelho de Ojesed (Miniatura)", category: "accessory", price_galeons: 4000, image_url: "/items/amuleto_premium.png", rarity: "rare", is_featured: false, description: "Mostra não sua face, mas o desejo mais profundo do seu coração." },
  { id: "mq_upgrade_potion_kit", name: "Kit de Poções Avançado", category: "upgrade", price_galeons: 5000, image_url: "/items/monster_quality_potion_luck.png", rarity: "rare", is_featured: false, description: "Melhora o sucesso na criação de poções complexas." },
  { id: "mq_upgrade_book_spells", name: "Livro Padrão de Feitiços (Ano 7)", category: "upgrade", price_galeons: 3000, image_url: "/items/ancient_wand.png", rarity: "rare", is_featured: false, description: "Aumenta o repertório de feitiços de defesa." },
  { id: "mq_cloth_cloak_winter", name: "Manto de Inverno Forrado", category: "clothing", price_galeons: 1000, image_url: "/items/manto_premium.png", rarity: "uncommon", is_featured: false, description: "Para as visitas a Hogsmeade em dias de neve." },
  { id: "mq_cloth_boots", name: "Botas de Dragão (Resistentes)", category: "clothing", price_galeons: 2500, image_url: "/robe_carmesim.png", rarity: "rare", is_featured: false, description: "Indestrutíveis e extremamente confortáveis para longas caminhadas." },
  { id: "mq_acc_gloves", name: "Luvas de Pele de Dragão", category: "accessory", price_galeons: 1200, image_url: "/items/manto_premium.png", rarity: "uncommon", is_featured: false, description: "Proteção essencial para Herbologia e Trato das Criaturas Mágicas." },
  { id: "mq_acc_scarf", name: "Cachecol da Casa (Seda Mística)", category: "accessory", price_galeons: 500, image_url: "/items/manto_premium.png", rarity: "common", is_featured: false, description: "Aquece automaticamente quando a temperatura cai." },
  { id: "mq_item_golden_egg", name: "Ovo de Ouro do Torneio", category: "accessory", price_galeons: 10000, image_url: "/items/monster_quality_golden_snitch.png", rarity: "legendary", is_featured: false, description: "Grita quando aberto fora d'água. Esconde um segredo." },
];

// ─── Planos VIP ────────────────────────────────────────────
const VIP_PLANS = [
  {
    id: "premium", name: "Estudante Premium", icon: "✨", price_brl: 9.90, image_url: "/vip_coroa.png",
    color: "from-blue-900/60 to-indigo-900/40", border: "border-blue-400/50", textColor: "text-blue-300", glow: "hover:shadow-[0_0_30px_rgba(96,165,250,0.3)]",
    benefits: ["+50% XP em todas as atividades", "Badge exclusivo ✨ no perfil", "Acesso a salas Premium", "Nome com brilho especial"],
    galeons_monthly: 0,
  },
  {
    id: "vip", name: "Auror VIP", icon: "🥇", price_brl: 19.90, image_url: "/vip_coroa.png",
    color: "from-purple-900/60 to-fuchsia-900/40", border: "border-purple-400/60", textColor: "text-purple-300", glow: "hover:shadow-[0_0_40px_rgba(192,132,252,0.4)]",
    benefits: ["Tudo do Premium", "+200 Galeões todo mês", "Nome dourado em todo portal", "Skin exclusiva de Auror", "Acesso antecipado a eventos"],
    galeons_monthly: 200,
    badge: "MAIS ESCOLHIDO"
  },
  {
    id: "founder", name: "Fundador Hogwarts", icon: "👑", price_brl: 39.90, image_url: "/vip_coroa.png",
    color: "from-yellow-700/60 to-amber-900/50", border: "border-yellow-400/70", textColor: "text-yellow-300", glow: "hover:shadow-[0_0_50px_rgba(251,191,36,0.5)]",
    benefits: ["Tudo do VIP", "+500 Galeões todo mês", "Acesso ao Conselho Secreto", "Título permanente 👑 Fundador", "Participação em decisões do portal"],
    galeons_monthly: 500,
    badge: "STATUS MÁXIMO"
  },
];

// ─── Raridade ─────────────────────────────────────────────
const RARITY = {
  common:    { label: "Comum",    cls: "text-gray-400 border-gray-600/30 bg-gray-900/40",     glow: "group-hover:shadow-[0_0_15px_rgba(156,163,175,0.15)]" },
  rare:      { label: "Raro",     cls: "text-blue-400 border-blue-500/40 bg-blue-900/30",  glow: "group-hover:shadow-[0_0_25px_rgba(96,165,250,0.3)]" },
  legendary: { label: "Lendário", cls: "text-yellow-400 border-yellow-400/50 bg-yellow-900/40", glow: "group-hover:shadow-[0_0_40px_rgba(251,191,36,0.5)]" },
};

const TABS = [
  { id: "featured", label: "🔥 Exclusivos", icon: Flame, color: "from-orange-500 to-red-500" },
  { id: "galeons",  label: "🪙 Galeões",    icon: Coins, color: "from-yellow-400 to-amber-600" },
  { id: "vip",      label: "👑 VIP",        icon: Crown, color: "from-purple-500 to-indigo-600" },
  { id: "wand",     label: "🪄 Varinhas",   icon: Wand2, color: "from-amber-700 to-yellow-900" },
  { id: "spell",    label: "📜 Feitiços",   icon: Sparkles, color: "from-blue-400 to-indigo-600" },
  { id: "potion",   label: "🧪 Poções",     icon: Gem, color: "from-emerald-400 to-teal-700" },
  { id: "clothing", label: "👗 Roupas",     icon: Shirt, color: "from-rose-400 to-pink-700" },
  { id: "upgrade",  label: "⚡ Upgrades",   icon: Zap, color: "from-cyan-400 to-blue-700" },
  { id: "bank",     label: "🏦 Banco",      icon: Landmark, color: "from-emerald-600 to-green-900" },
];

import { Landmark, ArrowRightLeft } from "lucide-react";
import MagicalSicle from "@/components/MagicalSicle";
import MagicalKnut from "@/components/MagicalKnut";
import { getCurrencyBreakdown } from "@/lib/auth";

export default function GringottsStore() {
  const { profile, user, fetchProfile } = useAuth();
  const { playSound } = useSound();
  const [tab, setTab] = useState("featured");
  const [items, setItems] = useState<StoreItem[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 45, seconds: 30 });
  const [buying, setBuying] = useState<string|null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string|null>(null);

  // Deep Linking: Auto-scroll para item específico via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get("item");
    if (itemId && !loading) {
      setTimeout(() => {
        const element = document.getElementById(`item-${itemId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-yellow-500', 'animate-pulse');
          setTimeout(() => element.classList.remove('ring-4', 'ring-yellow-500', 'animate-pulse'), 3000);
        }
      }, 500);
    }
  }, [loading, tab]);

  // Timer Dinâmico (Sincronizado com a Urgência Global)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { loadStore(); }, [user?.id]);

  const loadStore = async () => {
    const { data } = await supabase.from("store_items").select("*").eq("is_active", true).order("price_galeons");
    
    // Mesclar itens do banco com os itens Monster Quality hardcoded
    const dbItems = data || [];
    const allItems = [...MONSTER_QUALITY_ITEMS, ...dbItems];
    
    // Remover duplicatas por ID caso existam no banco
    const uniqueItems = allItems.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    
    setItems(uniqueItems);
    if (user) {
      const { data: myItems } = await supabase.from("user_items").select("item_id").eq("user_id", user.id);
      setOwned((myItems || []).map(i => i.item_id));
    }
    setLoading(false);
  };

  // ── Detectar retorno de pagamento na URL ─────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderNsu = params.get("order_nsu");
    const transactionNsu = params.get("transaction_nsu");
    const slug = params.get("slug");

    if (orderNsu && transactionNsu && slug) {
      window.history.replaceState({}, "", window.location.pathname);
      verifyAndCreditPayment(orderNsu, transactionNsu, slug);
    }
  }, []);

  const verifyAndCreditPayment = async (orderNsu: string, transactionNsu: string, slug: string) => {
    try {
      toast.info("🔍 Verificando seu pagamento...");
      const { data, error } = await supabase.rpc("verify_infinitepay_payment", {
        p_order_nsu:       orderNsu,
        p_transaction_nsu: transactionNsu,
        p_slug:            slug,
      });
      if (error) throw new Error(error.message);
      if (data?.success) {
        if (data.type === "vip") toast.success(`🎉 Plano ${data.plan?.toUpperCase()} ativado! Bem-vindo ao VIP!`, { duration: 6000 });
        else toast.success(`🎉 ${data.galeons} Galeões adicionados à sua conta!`, { duration: 6000 });
        setPendingOrderId(null);
        setTimeout(() => window.location.reload(), 1500);
      } else if (data?.message === "Já processado") {
        toast.info("✅ Pagamento já confirmado anteriormente!");
        setPendingOrderId(null);
      } else {
        setPendingOrderId(orderNsu);
        toast.warning("⏳ Pagamento ainda sendo processado. Clique em 'Verificar novamente' em alguns instantes.", { duration: 10000 });
      }
    } catch (err: any) {
      console.warn("Erro na verificação:", err.message);
      setPendingOrderId(orderNsu);
      toast.info("✅ Pagamento recebido! Clique em 'Verificar novamente' para liberar seus Galeões.", { duration: 10000 });
    }
  };

  // ── Gerar Link (2 etapas) ───────────────────
  const createInfinitePayLink = async (orderId: string, amountBrl: number, description: string, userEmail: string, userName: string): Promise<string | null> => {
    try {
      const { data: started, error: startErr } = await supabase.rpc("start_payment_request", {
        p_order_id: orderId, p_amount_brl: amountBrl, p_description: description, p_user_id: user?.id, p_user_email: userEmail, p_user_name: userName,
      });
      if (startErr || !started?.success) return null;
      const requestId: number = started.request_id;
      for (let attempt = 1; attempt <= 4; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: result } = await supabase.rpc("get_payment_link", { p_request_id: requestId, p_order_id: orderId });
        if (result?.ready && result?.payment_url) return result.payment_url;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // ── Comprar Galeões ───────────────────────────────────────
  const buyGaleons = async (pkg: typeof GALEON_PACKAGES[0]) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    setBuying(pkg.id);
    try {
      const { data: order, error } = await supabase.from("galeon_orders").insert({
        user_id: user.id, package_id: pkg.id, amount_brl: pkg.price_brl, galeons: pkg.galeons, status: "pending",
      } as never).select("id").single();
      if (error) throw error;
      const description = `${pkg.name} — ${pkg.galeons} Galeões`;
      toast.info("⏳ Gerando link de pagamento...");
      const payUrl = await createInfinitePayLink(order.id, pkg.price_brl, description, user.email ?? "", profile.full_name);
      if (!payUrl) throw new Error("Não foi possível gerar link de pagamento.");
      toast.info("💳 Redirecionando...");
      setTimeout(() => { window.location.href = payUrl; }, 800);
    } catch (e: any) { toast.error(e.message || "Erro ao processar."); }
    finally { setBuying(null); }
  };

  // ── Câmbio Mágico ──────────────────────────────────
  const exchangeCurrency = async (fromType: 'galeon' | 'sicle', toType: 'sicle' | 'knut', amountFrom: number) => {
    if (!user || !profile) return;
    const currentTotal = profile.galeons || 0;
    
    // 1 Galeão = 493 Nuques | 1 Sicle = 29 Nuques
    let nuquesToDeduct = 0;
    let nuquesToAdd = 0;
    let label = "";

    if (fromType === 'galeon' && toType === 'sicle') {
      nuquesToDeduct = amountFrom * 493;
      // 1 Galeão deveria dar 17 Sicles (17 * 29 = 493 Nuques)
      nuquesToAdd = amountFrom * 17 * 29; 
      // Aplicando taxa de 2% (Gringotts Profit)
      nuquesToAdd = Math.floor(nuquesToAdd * 0.98);
      label = `${amountFrom} Galeões por Sicles`;
    } else if (fromType === 'sicle' && toType === 'knut') {
      nuquesToDeduct = amountFrom * 29;
      nuquesToAdd = amountFrom * 29; // Sicle para Nuque é 1:29
      nuquesToAdd = Math.floor(nuquesToAdd * 0.98);
      label = `${amountFrom} Sicles por Nuques`;
    }

    if (currentTotal < nuquesToDeduct) return toast.error("Saldo insuficiente para o câmbio!");

    setBuying("exchange");
    try {
      const { error } = await supabase.from("profiles").update({ 
        galeons: currentTotal - nuquesToDeduct + nuquesToAdd 
      } as never).eq("user_id", user.id);
      
      if (error) throw error;
      toast.success(`✨ Câmbio realizado: ${label}. Taxa de Gringotts aplicada.`);
      await fetchProfile(user.id);
    } catch (e: any) {
      toast.error("Erro no câmbio: " + e.message);
    } finally {
      setBuying(null);
    }
  };

  // ── Comprar Item ──────────────────────────────────
  const buyItem = async (item: StoreItem) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    const bal = profile?.galeons ?? 0;
    if (bal < item.price_galeons) return toast.error(`Galeões insuficientes! Você tem ${bal} Galeões.`);
    
    const isElite = item.price_galeons >= 1000;
    const isVerified = (profile as any).is_verified;

    if (isElite && !isVerified) {
      toast.error("ITEM DE ELITE: Este item requer Verificação de Identidade (Selo Azul) para ser adquirido.", {
        description: "Vá ao seu perfil para solicitar a verificação."
      });
      return;
    }

    setBuying(item.id);
    try {
      // Bypass FK para itens 3D injetados localmente
      if (item.id.startsWith("3d_") || item.id.startsWith("mq_")) {
        const { error: deduct } = await supabase.from("profiles").update({ galeons: bal - item.price_galeons } as never).eq("user_id", user.id);
        if (deduct) throw deduct;
        
        // Registrar item para o usuário
        await supabase.from("user_items").insert({ user_id: user.id, item_id: item.id } as never);
        
        setOwned(prev => [...prev, item.id]);
        toast.success(`✅ "${item.name}" adicionado ao inventário!`);
        setBuying(null);
        return;
      }

      const { error: deduct } = await supabase.from("profiles").update({ galeons: bal - item.price_galeons } as never).eq("user_id", user.id);
      if (deduct) throw deduct;
      const { error: ins } = await supabase.from("user_items").insert({ user_id: user.id, item_id: item.id } as never);
      if (ins) {
        await supabase.from("profiles").update({ galeons: bal } as never).eq("user_id", user.id);
        throw ins;
      }
      setOwned(prev => [...prev, item.id]);
      toast.success(`✅ "${item.name}" adicionado ao inventário!`);
    } catch (e: any) { toast.error("Erro: " + (e.message || "Tente novamente.")); }
    finally { setBuying(null); }
  };

  // ── Assinar VIP ───────────────────────────────────────────
  const buyVip = async (plan: typeof VIP_PLANS[0]) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    setBuying(plan.id);
    try {
      const { data: order, error } = await supabase.from("galeon_orders").insert({
        user_id: user.id, package_id: `vip_${plan.id}`, amount_brl: plan.price_brl, galeons: 0, status: "pending",
      } as never).select("id").single();
      if (error) throw error;
      const description = `VIP ${plan.name} (1 mês)`;
      toast.info("⏳ Gerando link de pagamento...");
      const payUrl = await createInfinitePayLink(order.id, plan.price_brl, description, user.email ?? "", profile.full_name);
      if (!payUrl) throw new Error("Erro ao gerar link.");
      toast.info("💳 Redirecionando...");
      setTimeout(() => { window.location.href = payUrl; }, 800);
    } catch (e: any) { toast.error(e.message || "Erro ao ativar VIP."); }
    finally { setBuying(null); }
  };

  // ── Vender Item (Liquidez Mágica) ──────────────────
  const sellItem = async (itemId: string) => {
    if (!user || !profile) return;
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const sellPrice = Math.floor(item.price_galeons * 0.5); // Gringotts paga 50%
    const userBal = profile.galeons || 0;

    setBuying(`sell-${itemId}`);
    try {
      // 1. Remover o item do inventário
      const { data: userItem } = await supabase
        .from("user_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .limit(1)
        .maybeSingle();

      if (!userItem) throw new Error("Item não encontrado no inventário.");

      const { error: delErr } = await supabase
        .from("user_items")
        .delete()
        .eq("id", userItem.id);

      if (delErr) throw delErr;

      // 2. Adicionar Galeões
      const { error: addErr } = await supabase
        .from("profiles")
        .update({ galeons: userBal + sellPrice } as never)
        .eq("user_id", user.id);

      if (addErr) throw addErr;

      toast.success(`💰 Item vendido! +${sellPrice} Galeões adicionados ao cofre.`, {
        description: "Gringotts agradece a preferência."
      });
      
      setOwned(prev => {
        const index = prev.indexOf(itemId);
        if (index > -1) {
          const next = [...prev];
          next.splice(index, 1);
          return next;
        }
        return prev;
      });
      
      await fetchProfile(user.id);
    } catch (e: any) {
      toast.error("Erro na venda: " + e.message);
    } finally {
      setBuying(null);
    }
  };

  // ── Abrir Baú (Lógica Funcional) ──────────────────
  const handleOpenChest = async (chestItemId: string) => {
    if (!user || !profile) return;
    
    // 1. Verificar se possui o baú
    const { data: hasChest } = await supabase
      .from("user_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_id", chestItemId)
      .limit(1)
      .maybeSingle();

    if (!hasChest) return toast.error("Você não possui este baú no inventário!");

    setBuying(chestItemId);
    playMagicSound();

    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          // Pequeno delay para suspense cinematográfico
          await new Promise(r => setTimeout(r, 2000));

          // 2. Sortear um item (Lógica do Chapéu Seletor de Itens)
          // Filtramos itens que não sejam o próprio baú e que sejam raros/lendários
          const pool = items.filter(i => 
            !i.id.includes("chest") && 
            (i.rarity === "legendary" || i.rarity === "rare")
          );
          
          if (pool.length === 0) throw new Error("Cofre vazio!");
          
          const wonItem = pool[Math.floor(Math.random() * pool.length)];

          // 3. Consumir o baú (Remover uma instância)
          const { error: delErr } = await supabase
            .from("user_items")
            .delete()
            .eq("id", hasChest.id);
          
          if (delErr) throw delErr;

          // 4. Adicionar o prêmio
          const { error: insErr } = await supabase
            .from("user_items")
            .insert({ user_id: user.id, item_id: wonItem.id } as never);
          
          if (insErr) throw insErr;

          // 5. Atualizar estado local
          setOwned(prev => {
            const next = prev.filter(id => id !== chestItemId);
            return [...next, wonItem.id];
          });

          resolve(wonItem);
        } catch (err) {
          reject(err);
        }
      }),
      {
        loading: '🪄 Conjurando abertura do cofre...',
        success: (item: any) => `✨ VOCÊ GANHOU: ${item.name}! Verifique seu inventário.`,
        error: 'A magia falhou ao abrir o baú.',
      }
    );
    
    setBuying(null);
  };

  const galeons = profile?.galeons ?? 0;
  const currentVip = profile?.vip_plan;
  const filteredItems = items.filter(i => i.category === tab);
  const featuredItems = items.filter(i => i.is_featured || i.rarity === 'legendary').slice(0, 12);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4 sm:px-6">
      
      {/* ── SUPER HERO BANNER: MONSTER QUALITY ── */}
      <div className="relative overflow-hidden rounded-[3rem] border border-yellow-500/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] group min-h-[420px] flex items-center mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-black to-blue-950 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/25 via-transparent to-transparent pointer-events-none animate-pulse" />
        
        {/* Animated Dust/Magic Particles */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-yellow-400 rounded-full opacity-40 animate-float" style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }} />
          ))}
        </div>

        <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547756536-cde3673fa2e5?q=80&w=2000')" }} />
        
        <div className="relative z-10 p-8 sm:p-14 lg:p-20 flex flex-col md:flex-row items-center justify-between w-full gap-10">
          <div className="flex-1 text-left space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-md border border-yellow-500/40 rounded-full px-5 py-2">
              <Sparkles size={14} className="text-yellow-500 animate-spin-slow" />
              <span className="text-xs font-heading text-yellow-500 uppercase tracking-[0.2em] font-bold">Mercado de Relíquias Ancestrais</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-heading text-gold-gradient drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] leading-tight tracking-tighter">
              GRINGOTTS<br/><span className="text-white/90">VAULT</span>
            </h1>
            
            <p className="text-yellow-100/70 text-lg md:text-xl max-w-xl leading-relaxed font-serif italic border-l-2 border-yellow-500/50 pl-6">
              "Onde o ouro brilha mais que o sol e a magia sussurra segredos ancestrais. Somente para os bruxos mais ambiciosos de Hogwarts."
            </p>
            
            <div className="flex gap-4">
              <Button variant="magical" size="lg" className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-black border-none font-bold text-lg px-10 py-7 rounded-2xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(234,179,8,0.4)]" onClick={() => setTab("featured")}>
                Explorar Exclusivos <Flame className="ml-2 animate-bounce" size={20} />
              </Button>
            </div>
          </div>
          
          <div className="w-full md:w-96 glass bg-black/60 border border-yellow-500/30 rounded-[3rem] p-10 text-center backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="absolute inset-0 bg-yellow-500/5 blur-3xl rounded-full" />
            <p className="text-yellow-500/80 text-[11px] font-heading uppercase tracking-[0.3em] mb-8 font-bold">Chave do Cofre Ativa</p>
            
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full animate-pulse" />
              <div className="text-6xl font-heading text-yellow-400 mb-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] relative z-10">
                {galeons.toLocaleString("pt-BR")}
              </div>
            </div>
            
            <p className="text-sm text-yellow-100/50 mb-10 font-serif uppercase tracking-widest">Galeões Disponíveis</p>
            <Button variant="outline" className="w-full h-14 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 rounded-2xl font-bold tracking-widest text-xs" onClick={() => setTab("galeons")}>
              RECARREGAR COFRE <MagicalGaleon size="xs" className="ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── FLASH SALE COUNTDOWN ── */}
      <div className="glass rounded-[2rem] p-8 border-2 border-red-500/30 bg-gradient-to-r from-red-950/40 via-black to-red-950/40 flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in zoom-in duration-700 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30 shadow-inner animate-pulse">
            <Flame size={32} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-heading text-2xl text-red-100 tracking-tight">OFERTA DE LANÇAMENTO</h3>
            <p className="text-sm text-red-200/60 font-serif italic">Descontos de até 70% em itens selecionados. A oferta expira em breve!</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          {[
            { val: timeLeft.days.toString().padStart(2, '0'), label: "DIAS" },
            { val: timeLeft.hours.toString().padStart(2, '0'), label: "HORAS" },
            { val: timeLeft.minutes.toString().padStart(2, '0'), label: "MIN" },
            { val: timeLeft.seconds.toString().padStart(2, '0'), label: "SEG" }
          ].map((t, i) => (
            <div key={i} className="glass bg-black/60 border border-red-500/30 w-16 h-20 md:w-20 md:h-24 rounded-2xl flex flex-col items-center justify-center backdrop-blur-xl">
              <span className="text-2xl md:text-3xl font-heading text-red-500 tabular-nums">{t.val}</span>
              <span className="text-[8px] text-red-200/40 font-bold uppercase tracking-widest">{t.label}</span>
            </div>
          ))}
        </div>
        
        <Button variant="plaque" className="h-16 px-10 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 border-none shadow-xl hover:scale-105 active:scale-95 transition-all">
          PEGAR OFERTA AGORA!
        </Button>
      </div>

      {pendingOrderId && (
        <div className="glass rounded-[2rem] p-6 border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-900/40 to-black/60 flex flex-col sm:flex-row items-center gap-6 animate-pulse-glow shadow-2xl">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center text-4xl shadow-inner">⏳</div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-heading text-yellow-400 text-xl tracking-tight">Magia em Processamento</p>
            <p className="text-sm text-yellow-200/60 font-serif">Seus Galeões estão sendo transportados pelos duendes. Clique para confirmar a chegada.</p>
          </div>
          <Button variant="magical" size="lg" className="px-8 rounded-xl" onClick={() => verifyAndCreditPayment(pendingOrderId, "", "")}>
            🔍 Verificar Agora
          </Button>
        </div>
      )}

      {/* ── MEUS ITENS: HORIZONTAL SCROLL ── */}
      {owned.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="flex items-center justify-between px-4">
            <h3 className="font-heading text-2xl text-foreground flex items-center gap-3">
              <ShoppingBag size={24} className="text-primary" /> Meu Baú de Relíquias
            </h3>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{owned.length} ITENS ADQUIRIDOS</span>
          </div>
          
          <div className="relative group">
            <div className="flex overflow-x-auto gap-6 pb-8 pt-2 px-4 no-scrollbar scroll-smooth">
              {items.filter(i => owned.includes(i.id)).map(item => (
                <div key={`owned-${item.id}`} className="shrink-0 w-48 glass bg-white/5 border border-white/10 rounded-[2rem] p-4 group/item hover:border-primary/50 transition-all">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-black/40 mb-4 relative">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain group-hover/item:scale-110 transition-transform" />
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <div className="bg-green-500/20 text-green-400 p-1.5 rounded-full border border-green-500/30">
                        <Check size={10} />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white text-center truncate mb-1">{item.name}</h4>
                  <p className="text-[8px] text-muted-foreground text-center uppercase tracking-widest mb-4">{item.category}</p>
                  
                  <div className="flex gap-2">
                    {item.id.includes("chest") ? (
                      <Button variant="magical" size="xs" className="w-full h-8 text-[9px]" onClick={() => handleOpenChest(item.id)} disabled={!!buying}>
                        ABRIR 🎁
                      </Button>
                    ) : item.category === "potion" && item.id.startsWith("mq_potion_") ? (
                      <Button variant="magical" size="xs" className="w-full h-8 text-[9px] bg-emerald-600 hover:bg-emerald-500" onClick={async () => {
                        if (!user) return;
                        setBuying(item.id);
                        try {
                          const moodMap: Record<string, string> = {
                            mq_potion_euphoria: "alegre",
                            mq_potion_rage: "raiva",
                            mq_potion_peace: "neutro",
                            mq_potion_sorrow: "triste"
                          };
                          const newMood = moodMap[item.id] || "neutro";
                          
                          // 1. Atualizar Humor
                          await supabase.from("profiles").update({ 
                            mood: newMood, 
                            mood_power: 100 
                          } as any).eq("user_id", user.id);
                          
                          // 2. Remover Poção (Consumir)
                          const { data: itemToDelete } = await supabase.from("user_items").select("id").eq("user_id", user.id).eq("item_id", item.id).limit(1).single();
                          if (itemToDelete) await supabase.from("user_items").delete().eq("id", itemToDelete.id);
                          
                          toast.success(`✨ Você consumiu ${item.name}! Seu estado emocional agora é: ${newMood.toUpperCase()}.`);
                          setOwned(prev => {
                            const index = prev.indexOf(item.id);
                            const next = [...prev];
                            next.splice(index, 1);
                            return next;
                          });
                          await fetchProfile(user.id);
                        } catch (e: any) {
                          toast.error("Erro ao consumir: " + e.message);
                        } finally {
                          setBuying(null);
                        }
                      }} disabled={!!buying}>
                        CONSUMIR ✨
                      </Button>
                    ) : (
                      <Button variant="outline" size="xs" className="w-full h-8 text-[9px] border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => sellItem(item.id)} disabled={!!buying}>
                        VENDER 💰
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Scroll indicators */}
            <div className="absolute left-0 top-0 bottom-8 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}

      {/* ── CATEGORY NAVIGATION: MONSTER STYLE ── */}
      <div className="relative z-40 flex justify-center py-6 mb-8">
        <div className="glass p-2.5 rounded-full border border-white/10 inline-flex flex-wrap justify-center gap-2 bg-black/60 backdrop-blur-3xl shadow-2xl">
          {TABS.map(t => {
            const isActive = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => { playMagicSound(); setTab(t.id); }}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-full text-xs font-bold font-heading transition-all duration-500 relative overflow-hidden group ${
                  isActive 
                    ? `bg-gradient-to-r ${t.color} text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] border-t border-white/20` 
                    : "bg-transparent text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
                }`}>
                {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                <Icon size={18} className={`${isActive ? "animate-pulse" : "group-hover:scale-110 transition-transform"}`} />
                <span className="tracking-widest uppercase">{t.label.split(' ')[1] || t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── ABA: DESTAQUES / EXCLUSIVOS ── */}
      {tab === "featured" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-block p-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-2">
              <div className="px-4 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest">Tesouros de Dumbledore</div>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading text-foreground flex items-center justify-center gap-4">
              <Flame className="text-orange-500 animate-pulse" size={32} /> Artefatos Lendários
            </h2>
            <p className="text-muted-foreground text-lg font-serif">Itens de raridade absoluta. Forjados nas chamas do conhecimento, estas peças são únicas no mundo bruxo.</p>
          </div>

          {/* FEATURED MEGA CARD */}
          <div className="relative group rounded-[3.5rem] overflow-hidden border-2 border-yellow-500/30 bg-gradient-to-br from-amber-950 via-black to-blue-900/40 p-1 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547756536-cde3673fa2e5?q=80&w=2000')] bg-cover opacity-10 mix-blend-overlay group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative glass rounded-[3.2rem] p-10 md:p-16 flex flex-col lg:flex-row items-center gap-14 backdrop-blur-md">
              
              <div className="relative shrink-0 w-full max-w-sm">
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full animate-pulse" />
                <div className="relative z-10 aspect-square rounded-[3rem] overflow-hidden border-2 border-white/10 shadow-2xl group-hover:rotate-3 transition-transform duration-700">
                  <img src="/robe_safira.png" alt="Robe Azul-Safira" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 inset-x-0 text-center">
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">Raridade: Única</span>
                  </div>
                </div>
                {/* Floating particles around image */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400/20 blur-xl rounded-full animate-bounce" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400/20 blur-xl rounded-full animate-pulse" />
              </div>
              
              <div className="flex-1 space-y-8 text-center lg:text-left">
                <div className="space-y-4">
                  <h3 className="text-4xl md:text-6xl font-heading text-gold-gradient drop-shadow-lg">Robe Azul-Safira do Conhecimento Ancestral</h3>
                  <p className="text-blue-100/70 text-lg font-serif italic leading-relaxed">
                    "Diz a lenda que este manto foi tecido com fios de memórias de bruxos sábios. Ao vesti-lo, a clareza mental do portador atinge níveis inimagináveis."
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div className="glass bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Poder Mágico</p>
                    <p className="text-xl font-heading text-blue-400">+45 MANA</p>
                  </div>
                  <div className="glass bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Prestígio</p>
                    <p className="text-xl font-heading text-yellow-400">NÍVEL 20</p>
                  </div>
                  <div className="glass bg-white/5 border border-white/10 p-4 rounded-2xl text-center col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Estoque</p>
                    <p className="text-xl font-heading text-red-400">2 UNIDADES</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8 pt-4">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Investimento Mágico</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl text-muted-foreground/40 line-through flex items-center gap-1">
                        <MagicalGaleon size="xs" /> 5.000
                      </span>
                      <span className="text-5xl font-heading text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] flex items-center gap-2">
                        <MagicalGaleon size="sm" /> 3.500
                      </span>
                    </div>
                  </div>
                  <Button size="lg" variant="plaque" className="w-full sm:w-auto h-16 px-12 rounded-2xl text-lg shadow-[0_15px_35px_-10px_rgba(234,179,8,0.4)]" onClick={() => buyItem({ id: "mq_cloth_founder", name: "Robe Azul-Safira", category: "clothing", price_galeons: 3500, image_url: "/robe_safira.png" })}>
                    Adquirir Relíquia <Sparkles className="ml-2 group-hover:rotate-12 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* GRID DE DESTAQUES SECUNDÁRIOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredItems.map(item => {
              const isOwned = owned.includes(item.id);
              const canAfford = galeons >= item.price_galeons;
              return (
                <div key={item.id} className="group relative glass rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/5 to-black/40 overflow-hidden flex flex-col hover:-translate-y-3 transition-all duration-500 shadow-xl hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                    <StoreItemVisual imageUrl={item.image_url} name={item.name} category={item.category} isOwned={isOwned} />
                    
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-[9px] uppercase tracking-widest px-3 py-1 backdrop-blur-md w-fit">Lendário</Badge>
                      {item.price_galeons > 3000 && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-[8px] uppercase tracking-widest px-2 py-0.5 backdrop-blur-md animate-pulse w-fit">Apenas {Math.floor(Math.random() * 5) + 1} em estoque</Badge>
                      )}
                    </div>

                    <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      {!isOwned && (
                        <Button variant="magical" size="sm" onClick={() => buyItem(item)} disabled={!canAfford} className="rounded-xl px-6 py-4 shadow-2xl">
                          Ver Detalhes
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1 relative z-20 text-center -mt-10">
                    <div className="glass bg-black/40 border border-white/10 rounded-2xl p-4 backdrop-blur-xl mb-4 group-hover:border-yellow-500/50 transition-colors">
                      <h4 className="font-heading text-lg text-foreground mb-1 line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-yellow-500/80 mb-2">Item Especial</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl font-heading text-yellow-400 flex items-center gap-1">
                          <MagicalGaleon size="xs" /> {item.price_galeons.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <Button variant={isOwned ? "outline" : "plaque"} size="sm" 
                      className={`w-full rounded-xl h-12 font-bold ${isOwned ? 'border-green-500/30 text-green-400' : ''}`}
                      onClick={() => !isOwned && buyItem(item)} disabled={isOwned || !canAfford}>
                      {isOwned ? "Já é seu" : "Adquirir Agora"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* LOOT BOX: MONSTER QUALITY UI */}
          <div className="glass rounded-[3rem] border-2 border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-black to-indigo-950/40 p-10 md:p-16 relative overflow-hidden group shadow-[0_30px_70px_-20px_rgba(168,85,247,0.3)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[120px] -z-10" />
            
            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full animate-bounce" />
                <div className="w-48 h-48 bg-gradient-to-b from-purple-500/20 to-transparent rounded-[2.5rem] flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform duration-700 shadow-2xl relative z-10 backdrop-blur-sm">
                  <Gift size={100} className="text-purple-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]" />
                </div>
                <div className="absolute -bottom-4 inset-x-0 w-fit mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold border border-white/20 px-6 py-2 animate-bounce rounded-full shadow-2xl uppercase tracking-widest">Sorte Mística</div>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-6">
                <h2 className="text-4xl md:text-5xl font-heading text-purple-100 tracking-tight">Cofre Misterioso de Gringotts</h2>
                <p className="text-purple-200/60 text-lg font-serif max-w-2xl leading-relaxed">
                  Uma chance única de obter itens que nem o ouro pode comprar. O destino sorri para os corajosos que ousam girar a chave do mistério.
                </p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-4">
                  <div className="text-left">
                    <p className="text-5xl font-heading text-yellow-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] flex items-center gap-3">
                      <MagicalGaleon size="sm" /> 50
                    </p>
                  </div>
                  <Button 
                    variant="plaque" 
                    className="h-20 px-12 text-2xl rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 border-none shadow-[0_15px_40px_rgba(124,58,237,0.4)] transition-all active:scale-95 group"
                    onClick={() => {
                        const chestId = "mq_item_chest_epic";
                        if (owned.includes(chestId)) {
                          handleOpenChest(chestId);
                        } else {
                          if (galeons < 1500) return toast.error("Galeões insuficientes para comprar este baú!");
                          buyItem(items.find(i => i.id === chestId) || MONSTER_QUALITY_ITEMS.find(i => i.id === chestId)!);
                        }
                    }}
                  >
                    {owned.includes("mq_item_chest_epic") ? "Abrir Baú ✨" : "Comprar Baú 🛒"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA: GALEÕES ── */}
      {tab === "galeons" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-6xl font-heading text-foreground flex items-center justify-center gap-4">
              <Coins className="text-yellow-400 animate-pulse" size={40} /> Câmbio Gringotts
            </h2>
            <p className="text-muted-foreground text-lg font-serif italic">"Onde cada moeda conta uma história e cada baú guarda uma fortuna."</p>
          </div>
          {/* Featured Items - Cinematic Horizontal Scroll */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-heading text-yellow-500 flex items-center gap-2">
              <Sparkles size={20} className="animate-pulse" /> DESTAQUES DE GRINGOTTS
            </h2>
            <div className="h-px flex-1 mx-6 bg-gradient-to-r from-yellow-500/30 to-transparent" />
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
            {items.filter(i => i.is_featured).map((item) => (
              <div 
                key={item.id}
                className="shrink-0 w-[300px] snap-center glass bg-gradient-to-br from-yellow-900/20 to-black border-yellow-500/30 rounded-3xl p-6 relative group hover:border-yellow-400 transition-all"
              >
                <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-4 relative">
                  <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                  <div className="absolute top-3 right-3">
                    <span className="bg-yellow-500 text-black text-[9px] font-bold px-3 py-1 rounded-full shadow-lg">DESTAQUE</span>
                  </div>
                </div>
                <h3 className="font-heading text-lg text-white mb-1">{item.name}</h3>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-4 italic leading-relaxed h-10">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MagicalGaleon size="xs" />
                    <span className="font-heading text-yellow-400 text-lg">{item.price_galeons}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="magical" 
                    className="h-10 px-6 rounded-xl font-bold shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                    onClick={() => handleBuyItem(item)}
                    disabled={owned.includes(item.id)}
                  >
                    {owned.includes(item.id) ? "ADQUIRIDO" : "COMPRAR"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-12">
            {GALEON_PACKAGES.map((pkg, i) => (
              <div key={pkg.id}
                className={`group glass rounded-[2.5rem] p-1 border-2 ${pkg.border} bg-gradient-to-br ${pkg.color} relative transition-all duration-700 hover:-translate-y-4 ${pkg.glow} flex flex-col shadow-2xl`}>
                <div className="glass h-full bg-black/40 backdrop-blur-2xl rounded-[2.3rem] p-8 flex flex-col items-center text-center relative overflow-hidden border border-white/5">
                  {pkg.badge && (
                    <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[9px] font-bold uppercase tracking-[0.3em] py-2 shadow-lg">
                      {pkg.badge}
                    </div>
                  )}
                  
                  <div className="w-28 h-28 mb-6 mt-4 relative rounded-3xl overflow-hidden border-2 border-yellow-500/30 group-hover:scale-110 transition-transform duration-700 shadow-2xl">
                    <SafeImage src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 opacity-60 group-hover:opacity-100" />
                    <div className="absolute inset-0 flex items-center justify-center text-5xl drop-shadow-[0_0_20px_rgba(251,191,36,0.9)]">{pkg.icon}</div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  <h3 className="font-heading text-xl text-white mb-2 group-hover:text-yellow-400 transition-colors">{pkg.name}</h3>
                  <p className="text-4xl font-heading text-yellow-400 font-bold mb-2 drop-shadow-lg flex items-center gap-2">
                    <MagicalGaleon size="xs" /> {pkg.galeons}
                  </p>
                  <p className="text-[10px] text-yellow-500/50 uppercase tracking-[0.2em] mb-10 flex-1 font-bold">
                    Câmbio Premium Gringotts
                  </p>

                  <Button variant={pkg.badge ? "magical" : "outline"} className={`w-full h-14 font-bold text-sm rounded-2xl shadow-xl transition-all ${!pkg.badge && 'border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10'}`} disabled={buying === pkg.id} onClick={() => buyGaleons(pkg)}>
                    {buying === pkg.id ? "⏳ ..." : `R$ ${pkg.price_brl.toFixed(2).replace(".", ",")}`}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA: BANCO (CÂMBIO) ── */}
      {tab === "bank" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-6xl font-heading text-foreground flex items-center justify-center gap-4">
              <Landmark className="text-emerald-500 animate-pulse" size={40} /> Banco Gringotts
            </h2>
            <p className="text-muted-foreground text-lg font-serif">"Fortunas convertidas com a precisão dos duendes. Taxas administrativas de 2% aplicadas a cada transação."</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Galeão -> Sicles */}
            <div className="glass rounded-[2.5rem] p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-black flex flex-col items-center text-center group">
              <div className="flex items-center gap-4 mb-6">
                <MagicalGaleon size="md" />
                <ArrowRightLeft className="text-emerald-500 animate-pulse" />
                <MagicalSicle size="md" />
              </div>
              <h3 className="font-heading text-2xl text-white mb-2">Câmbio de Ouro para Prata</h3>
              <p className="text-sm text-muted-foreground mb-8 font-serif italic">Converta seus Galeões Premium em Sicles para compras do dia a dia.</p>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                {[1, 5, 10, 50].map(amount => (
                  <Button key={amount} variant="outline" className="h-16 rounded-xl border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400 font-bold" onClick={() => exchangeCurrency('galeon', 'sicle', amount)}>
                    {amount} {amount === 1 ? 'Galeão' : 'Galeões'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sicles -> Nuques */}
            <div className="glass rounded-[2.5rem] p-8 border border-orange-500/30 bg-gradient-to-br from-orange-950/20 to-black flex flex-col items-center text-center group">
              <div className="flex items-center gap-4 mb-6">
                <MagicalSicle size="md" />
                <ArrowRightLeft className="text-orange-500 animate-pulse" />
                <MagicalKnut size="md" />
              </div>
              <h3 className="font-heading text-2xl text-white mb-2">Câmbio de Prata para Bronze</h3>
              <p className="text-sm text-muted-foreground mb-8 font-serif italic">Troque seus Sicles por Nuques para pequenos consumíveis e gorjetas.</p>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                {[10, 50, 100, 500].map(amount => (
                  <Button key={amount} variant="outline" className="h-16 rounded-xl border-orange-500/20 hover:bg-orange-500/10 text-orange-400 font-bold" onClick={() => exchangeCurrency('sicle', 'knut', amount)}>
                    {amount} {amount === 1 ? 'Sicle' : 'Sicles'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/10 max-w-2xl mx-auto text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Taxa de Custo Gringotts</p>
            <p className="text-sm text-foreground">
              Cada transação de câmbio contribui para a manutenção da segurança dos cofres de Hogwarts. <br/>
              <span className="text-emerald-400 font-bold">Taxa Atual: 2%</span>
            </p>
          </div>
        </div>
      )}

      {/* ── ABA: VIP ── */}
      {tab === "vip" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-6xl font-heading text-foreground flex items-center justify-center gap-4">
              <Crown className="text-yellow-400 animate-pulse" size={40} /> Clube de Elite
            </h2>
            <p className="text-muted-foreground text-lg font-serif">A elite de Hogwarts. Desbloqueie prestígio, poder e exclusividade absoluta com nossos planos VIP.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto items-end">
            {VIP_PLANS.map((plan, i) => (
              <div key={plan.id}
                className={`group glass rounded-[3.5rem] p-1 border-2 ${plan.border} bg-gradient-to-br ${plan.color} relative flex flex-col transition-all duration-700 hover:-translate-y-4 ${plan.glow} ${i === 1 ? 'md:-translate-y-10 md:scale-110 shadow-[0_40px_100px_-20px_rgba(168,85,247,0.4)] z-10' : 'shadow-2xl'}`}>
                
                <div className="glass h-full bg-black/60 backdrop-blur-3xl rounded-[3.3rem] p-10 flex flex-col relative overflow-hidden border border-white/5">
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-current opacity-10 blur-[100px] rounded-full pointer-events-none" style={{ color: plan.textColor.split('-')[1] }} />
                  
                  {plan.badge && (
                    <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white text-[9px] font-bold uppercase tracking-[0.4em] py-2.5 text-center shadow-lg">
                      {plan.badge}
                    </div>
                  )}

                  <div className="w-full h-44 mb-8 mt-4 relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-700">
                    <SafeImage src={plan.image_url} alt={plan.name} className="w-full h-full object-cover opacity-40 mix-blend-screen" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center text-7xl drop-shadow-[0_0_25px_currentColor] animate-pulse" style={{ color: plan.textColor.split('-')[1] }}>{plan.icon}</div>
                  </div>

                  <h3 className={`font-heading text-3xl mb-3 ${plan.textColor} tracking-tighter`}>{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-10">
                    <span className={`font-heading text-5xl font-bold ${plan.textColor} drop-shadow-lg`}>R$ {plan.price_brl.toFixed(2).replace(".", ",")}</span>
                    <span className="text-sm text-muted-foreground pb-2 opacity-60">/mês</span>
                  </div>

                  <ul className="space-y-5 flex-1 mb-12 relative z-10">
                    {plan.benefits.map(b => (
                      <li key={b} className="flex items-start gap-4 text-sm text-white/70 font-serif leading-relaxed">
                        <div className={`p-1.5 rounded-full bg-current opacity-20 shrink-0 mt-0.5`} style={{ color: plan.textColor.split('-')[1] }}>
                           <Check size={12} className={plan.textColor} />
                        </div>
                        {b}
                      </li>
                    ))}
                    {plan.galeons_monthly > 0 && (
                      <li className="flex items-center gap-4 text-base font-heading text-yellow-400 mt-8 pt-6 border-t border-white/10 animate-pulse">
                         <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                           <MagicalGaleon size="sm" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-yellow-500/50 uppercase tracking-widest">Mesada Real</span>
                          <span>+{plan.galeons_monthly} Galeões/mês</span>
                        </div>
                      </li>
                    )}
                  </ul>

                  <Button size="lg" className={`w-full h-16 rounded-2xl font-bold text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                      currentVip === plan.id ? "bg-green-600/20 text-green-400 border-2 border-green-500/50" : ""
                    }`} 
                    variant={currentVip === plan.id ? "outline" : "plaque"}
                    disabled={buying === plan.id || currentVip === plan.id}
                    onClick={() => buyVip(plan)}>
                    {buying === plan.id ? "✨ Processando..." : currentVip === plan.id ? "Status Ativo ✅" : "Assinar agora"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABAS DE ITENS: MONSTER GRID ── */}
      {["clothing","wand","spell","potion","upgrade"].includes(tab) && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-heading text-foreground mb-4 uppercase tracking-tighter">
              Vitrine: {TABS.find(t => t.id === tab)?.label}
            </h2>
            <p className="text-muted-foreground font-serif">Explore nossa coleção curada de itens mágicos. Cada peça possui propriedades únicas e história milenar.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="glass aspect-[3/4] rounded-[2rem] animate-pulse bg-white/5" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="glass rounded-[3rem] p-24 text-center max-w-3xl mx-auto border-2 border-dashed border-white/10 bg-black/20">
              <div className="w-32 h-32 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
                <ShoppingBag size={56} className="text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-3xl font-heading mb-4 text-white/80">Cofre em Manutenção</h3>
              <p className="text-muted-foreground text-lg font-serif">Os duendes de Gringotts estão reabastecendo esta seção com itens lendários. Volte em breve para descobrir as novidades.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {filteredItems.map(item => {
                const rar = RARITY[item.rarity as keyof typeof RARITY] || RARITY.common;
                const isOwned = owned.includes(item.id);
                const canAfford = galeons >= item.price_galeons;
                const isLegendary = item.rarity === "legendary";

                return (
                  <div key={item.id}
                    className={`group glass rounded-[2rem] border overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-4 ${rar.cls} ${rar.glow} ${
                      isLegendary ? "bg-gradient-to-br from-yellow-900/20 via-black/40 to-transparent ring-1 ring-yellow-500/20" : ""
                    }`}>
                    <div className="relative aspect-square overflow-hidden bg-black/60 group-hover:bg-black/40 transition-colors">
                      <StoreItemVisual
                        imageUrl={item.image_url}
                        name={item.name}
                        category={item.category}
                        isOwned={isOwned}
                      />
                      <div className={`absolute top-3 right-3 text-[9px] font-bold tracking-widest px-3 py-1.5 rounded-full border ${rar.cls} backdrop-blur-xl shadow-2xl z-20 uppercase`}>
                        {rar.label}
                      </div>
                      
                      {isLegendary && (
                        <div className="absolute top-3 left-3 z-20">
                          <Sparkles className="text-yellow-400 animate-pulse" size={16} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                    </div>

                    <div className="p-6 flex flex-col flex-1 relative">
                      <h4 className={`font-heading text-base leading-tight mb-2 transition-colors ${isLegendary ? 'text-yellow-400' : 'text-white'}`}>{item.name}</h4>
                      <p className="text-[11px] text-white/50 flex-1 mb-5 leading-relaxed line-clamp-3 font-serif">{item.description}</p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                           <span className="font-heading text-yellow-400 text-base drop-shadow-md flex items-center gap-1">
                             <MagicalGaleon size="xs" /> {item.price_galeons.toLocaleString()}
                           </span>
                        </div>
                        <Button size="sm" variant={isOwned ? "outline" : "magical"}
                          disabled={isOwned || buying === item.id || (!canAfford && !isOwned)}
                          onClick={() => !isOwned && buyItem(item)}
                          className={`text-[10px] px-5 h-9 rounded-xl font-bold uppercase tracking-widest transition-all ${isOwned ? 'border-green-500/40 text-green-400 bg-green-500/10' : ''}`}>
                          {isOwned ? "No Baú" : !canAfford ? "Saldo Insuficiente" : buying === item.id ? "..." : "Comprar"}
                        </Button>
                      </div>
                      
                      {!isOwned && !canAfford && (
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-red-950 via-red-900/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform flex flex-col items-center justify-end z-30 backdrop-blur-md border-t border-red-500/30">
                          <p className="text-[10px] text-red-100 font-bold text-center tracking-widest uppercase flex items-center gap-1 justify-center">
                            Faltam <MagicalGaleon size="xs" /> {(item.price_galeons - galeons).toLocaleString()}
                          </p>
                          <button onClick={() => setTab("galeons")} className="text-[9px] text-yellow-400 hover:underline mt-1 font-bold uppercase tracking-widest">Recarregar agora</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
