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
      { icon: <MagicalIcon icon={BookOpen} size="xs" color="#10b981" />, label: "Guia do Maroto", path: "/dashboard/guide" },
      { icon: <MagicalIcon icon={Users} size="xs" color="#ec4899" />, label: "Amigos", path: "/dashboard/friends" },
      { icon: <MagicalIcon icon={Library} size="xs" color="#94a3b8" />, label: "Membros", path: "/dashboard/members" },
    ]
  },
  {
    title: "Atividades",
    items: [
      { icon: <MagicalIcon icon={Swords} size="xs" color="#ef4444" />, label: "Duelos", path: "/dashboard/duels" },
      { icon: <MagicalIcon icon={MessageCircle} size="xs" color="#3b82f6" />, label: "Chats RPG", path: "/dashboard/chats" },
      { icon: <MagicalIcon icon={Camera} size="xs" color="#f43f5e" />, label: "InstaHogwarts", path: "/dashboard/instahogwarts" },
      { icon: <MagicalIcon icon={Zap} size="xs" color="#a855f7" />, label: "Desafios", path: "/dashboard/challenges" },
      { icon: <MagicalIcon icon={Sparkles} size="xs" color="#f472b6" />, label: "Eventos", path: "/dashboard/events" },
      { icon: <MagicalIcon icon={GraduationCap} size="xs" color="#3b82f6" />, label: "Aulas", path: "/dashboard/classes" },
      { icon: <MagicalIcon icon={Sparkles} size="xs" color="#fbbf24" />, label: "Aulas Canon", path: "/dashboard/canon-lessons" },
    ]
  },
  {
    title: "Economia & Itens",
    items: [
      { icon: <MagicalIcon icon={ImageIcon} size="xs" color="#94a3b8" />, label: "Álbum", path: "/dashboard/album" },
      { icon: <MagicalIcon icon={ShoppingBag} size="xs" color="#f59e0b" />, label: "Loja", path: "/dashboard/store" },
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
    ]
  }
];

export const ADMIN_GROUP = {
  title: "Administração",
  items: [
    { icon: <MagicalEmoji emoji="⚙️" size="xs" />, label: "Painel Admin", path: "/dashboard/admin" },
    { icon: <MagicalEmoji emoji="💰" size="xs" />, label: "Gestão Financeira", path: "/dashboard/admin/finance" },
  ]
};
