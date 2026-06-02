import { 
  Castle, BookOpen, User, MessageCircle, Camera, Trophy,
  Shield, Swords, Library, ShoppingBag, ScrollText,
  Users, Lock, Wallet, Sparkles, Zap, Image as ImageIcon,
  GraduationCap, Crown
} from "lucide-react";
import React from "react";
import MagicalIcon from "@/components/shared/MagicalIcon";
import MagicalEmoji from "@/components/shared/MagicalEmoji";

export const NAV_GROUPS = [
  {
    title: "Mundo Bruxo",
    items: [
      { icon: <MagicalIcon icon={Castle} size="xs" color="#60a5fa" />, label: "O Castelo", path: "/dashboard" },
      { icon: <MagicalEmoji emoji="🗺️" size="xs" />, label: "Mapa do Castelo", path: "/dashboard/castle-map" },
      { icon: <MagicalEmoji emoji="📜" size="xs" />, label: "Crônicas", path: "/dashboard/chapters" },
      { icon: <MagicalEmoji emoji="🗣️" size="xs" />, label: "Retratos Falantes", path: "/dashboard/npcs" },
      { icon: <MagicalEmoji emoji="📔" size="xs" />, label: "Diário", path: "/dashboard/diary" },
      { icon: <MagicalEmoji emoji="🔮" size="xs" />, label: "Profecias", path: "/dashboard/prophecy" },
      { icon: <MagicalIcon icon={BookOpen} size="xs" color="#10b981" />, label: "Guia do Maroto", path: "/dashboard/guide" },
      { icon: <MagicalIcon icon={Users} size="xs" color="#ec4899" />, label: "Amigos", path: "/dashboard/friends" },
      { icon: <MagicalIcon icon={Shield} size="xs" color="#a855f7" />, label: "Clubes", path: "/dashboard/clubs" },
      { icon: <MagicalIcon icon={Library} size="xs" color="#94a3b8" />, label: "Membros", path: "/dashboard/members" },
    ]
  },
  {
    title: "Atividades",
    items: [
      { icon: <MagicalIcon icon={Swords} size="xs" color="#ef4444" />, label: "Duelos", path: "/dashboard/duels" },
      { icon: <MagicalEmoji emoji="⚡" size="xs" />, label: "Duelos PvP", path: "/dashboard/duels-pvp" },
      { icon: <MagicalEmoji emoji="🧹" size="xs" />, label: "Quadribol", path: "/dashboard/quidditch" },
      { icon: <MagicalEmoji emoji="🚪" size="xs" />, label: "Sala Precisa", path: "/dashboard/room" },
      { icon: <MagicalEmoji emoji="🪄" size="xs" />, label: "Olivaras", path: "/dashboard/wand" },
      { icon: <MagicalEmoji emoji="✨" size="xs" />, label: "Patrono", path: "/dashboard/patronus" },
      { icon: <MagicalIcon icon={MessageCircle} size="xs" color="#3b82f6" />, label: "Chats RPG", path: "/dashboard/chats" },
      { icon: <MagicalIcon icon={Camera} size="xs" color="#f43f5e" />, label: "InstaHogwarts", path: "/dashboard/instahogwarts" },
      { icon: <MagicalIcon icon={Zap} size="xs" color="#a855f7" />, label: "Desafios", path: "/dashboard/challenges" },
      { icon: <MagicalIcon icon={Sparkles} size="xs" color="#f472b6" />, label: "Eventos", path: "/dashboard/events" },
      { icon: <MagicalIcon icon={Trophy} size="xs" color="#facc15" />, label: "Torneios", path: "/dashboard/tournaments" },
      { icon: <MagicalIcon icon={Trophy} size="xs" color="#ef4444" />, label: "Ranqueado", path: "/dashboard/ranked" },
      { icon: <MagicalEmoji emoji="🐉" size="xs" />, label: "Chefe Raid", path: "/dashboard/raid" },
      { icon: <MagicalEmoji emoji="⚔️" size="xs" />, label: "Guildas", path: "/dashboard/guilds" },
      { icon: <MagicalEmoji emoji="🛡️" size="xs" />, label: "Equipes de RP", path: "/dashboard/rp-teams" },
      { icon: <MagicalEmoji emoji="🎭" size="xs" />, label: "Eventos ao Vivo", path: "/dashboard/live-events" },
      { icon: <MagicalEmoji emoji="🌟" size="xs" />, label: "Reputação Social", path: "/dashboard/reputation" },
      { icon: <MagicalEmoji emoji="🗺️" size="xs" />, label: "Aventuras", path: "/dashboard/quests" },
      { icon: <MagicalEmoji emoji="🛠️" size="xs" />, label: "Oficina UGC", path: "/dashboard/world-editor" },
      { icon: <MagicalEmoji emoji="🎩" size="xs" />, label: "Chapéu Seletor", path: "/dashboard/sorting-hat" },
      { icon: <MagicalEmoji emoji="📰" size="xs" />, label: "Profeta Diário", path: "/dashboard/prophet" },
      { icon: <MagicalIcon icon={GraduationCap} size="xs" color="#3b82f6" />, label: "Aulas", path: "/dashboard/classes" },
      { icon: <MagicalIcon icon={Sparkles} size="xs" color="#fbbf24" />, label: "Aulas Canon", path: "/dashboard/canon-lessons" },
      { icon: <MagicalEmoji emoji="📖" size="xs" />, label: "Grimório", path: "/dashboard/grimoire" },
      { icon: <MagicalEmoji emoji="📜" size="xs" />, label: "N.O.M.s & Exames", path: "/dashboard/exams" },
      { icon: <MagicalEmoji emoji="⚖️" size="xs" />, label: "Disciplina", path: "/dashboard/discipline" },
      { icon: <MagicalEmoji emoji="🐉" size="xs" />, label: "Criaturas Mágicas", path: "/dashboard/creatures" },
      { icon: <MagicalEmoji emoji="🌿" size="xs" />, label: "Estufa (Herbologia)", path: "/dashboard/greenhouse" },
      { icon: <MagicalEmoji emoji="🧪" size="xs" />, label: "Laboratório de Poções", path: "/dashboard/potions" },
    ]
  },
  {
    title: "Economia & Itens",
    items: [
      { icon: <MagicalIcon icon={ImageIcon} size="xs" color="#94a3b8" />, label: "Álbum", path: "/dashboard/album" },
      { icon: <MagicalIcon icon={ShoppingBag} size="xs" color="#f59e0b" />, label: "Loja", path: "/dashboard/store" },
      { icon: <MagicalEmoji emoji="🏪" size="xs" />, label: "Hogsmeade", path: "/dashboard/hogsmeade" },
      { icon: <MagicalEmoji emoji="🛍️" size="xs" />, label: "Beco Diagonal", path: "/dashboard/diagon" },
      { icon: <MagicalEmoji emoji="🎒" size="xs" />, label: "Mochila", path: "/dashboard/inventory" },
      { icon: <MagicalEmoji emoji="🤝" size="xs" />, label: "Trocas de Itens", path: "/dashboard/item-trades" },
      { icon: <MagicalIcon icon={ShoppingBag} size="xs" color="#a855f7" />, label: "Mercado", path: "/dashboard/marketplace" },
      { icon: <MagicalEmoji emoji="🔨" size="xs" />, label: "Leilões", path: "/dashboard/auctions" },
      { icon: <MagicalEmoji emoji="🏦" size="xs" />, label: "Gringotts", path: "/dashboard/gringotts" },
      { icon: <MagicalEmoji emoji="💰" size="xs" />, label: "Cofre Gringotes", path: "/dashboard/vault" },
      { icon: <MagicalIcon icon={Wallet} size="xs" color="#10b981" />, label: "Carteira", path: "/dashboard/wallet" },
      { icon: <MagicalIcon icon={Crown} size="xs" color="#fbbf24" />, label: "Pacto Mágico", path: "/dashboard/battle-pass" },
    ]
  },
  {
    title: "Hogwarts",
    items: [
      { icon: <MagicalIcon icon={Trophy} size="xs" color="#fbbf24" />, label: "Ranking", path: "/dashboard/ranking" },
      { icon: <MagicalIcon icon={Shield} size="xs" color="#10b981" />, label: "Casas", path: "/dashboard/houses" },
      { icon: <MagicalIcon icon={ScrollText} size="xs" color="#94a3b8" />, label: "Regras", path: "/dashboard/rules" },
      { icon: <MagicalIcon icon={Lock} size="xs" color="#ef4444" />, label: "Azkaban", path: "/dashboard/azkaban" },
      { icon: <MagicalEmoji emoji="🦉" size="xs" />, label: "Coruja Postal", path: "/dashboard/settings/notifications" },
      { icon: <MagicalEmoji emoji="🏛️" size="xs" />, label: "Ministério da Magia", path: "/dashboard/ministry" },
    ]
  }
];

export const ADMIN_GROUP = {
  title: "Administração",
  items: [
    { icon: <MagicalEmoji emoji="⚙️" size="xs" />, label: "Painel Admin", path: "/dashboard/admin" },
    { icon: <MagicalEmoji emoji="🧾" size="xs" />, label: "Fichas & Canons", path: "/dashboard/admin/characters" },
    { icon: <MagicalEmoji emoji="💰" size="xs" />, label: "Gestão Financeira", path: "/dashboard/admin/finance" },
    { icon: <MagicalEmoji emoji="📊" size="xs" />, label: "Analytics", path: "/dashboard/admin/analytics" },
    { icon: <MagicalEmoji emoji="🛟" size="xs" />, label: "Central de Suporte", path: "/dashboard/admin/support" },
  ]
};
