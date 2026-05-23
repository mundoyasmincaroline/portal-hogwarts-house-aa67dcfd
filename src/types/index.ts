import { Database } from "@/integrations/supabase/types";

export type House = Database["public"]["Enums"]["house_type"];

export interface HouseData {
  name: string;
  id: House;
  points: number;
  motto: string;
  description: string;
  colors: { primary: string; secondary: string };
  traits: string[];
  members: number;
}

export const HOUSES: Record<House, HouseData> = {
  gryffindor: {
    name: "Grifinória",
    id: "gryffindor",
    points: 1250,
    motto: "Coragem acima de tudo",
    description: "A casa dos corajosos e destemidos. Valorizamos a bravura, a determinação e a nobreza de espírito.",
    colors: { primary: "hsl(0, 70%, 45%)", secondary: "hsl(43, 80%, 55%)" },
    traits: ["Coragem", "Bravura", "Determinação", "Nobreza"],
    members: 24,
  },
  slytherin: {
    name: "Sonserina",
    id: "slytherin",
    points: 1180,
    motto: "A grandeza nos espera",
    description: "A casa dos ambiciosos e astutos. Valorizamos a determinação, a leadership e a sagacidade.",
    colors: { primary: "hsl(145, 45%, 30%)", secondary: "hsl(200, 10%, 70%)" },
    traits: ["Ambição", "Astúcia", "Liderança", "Sagacidade"],
    members: 22,
  },
  ravenclaw: {
    name: "Corvinal",
    id: "ravenclaw",
    points: 1320,
    motto: "Sabedoria sem limites é o maior tesouro",
    description: "A casa dos sábios e criativos. Valorizamos o conhecimento, a inteligência e a originalidade.",
    colors: { primary: "hsl(215, 60%, 40%)", secondary: "hsl(30, 50%, 50%)" },
    traits: ["Sabedoria", "Criatividade", "Inteligência", "Originalidade"],
    members: 20,
  },
  hufflepuff: {
    name: "Lufa-Lufa",
    id: "hufflepuff",
    points: 1100,
    motto: "Lealdade e trabalho árduo",
    description: "A casa dos leais e justos. Valorizamos a dedicação, a paciência e a lealdade.",
    colors: { primary: "hsl(48, 80%, 55%)", secondary: "hsl(0, 0%, 15%)" },
    traits: ["Lealdade", "Dedicação", "Paciência", "Justiça"],
    members: 18,
  },
};

export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
export const LEVEL_NAMES = ["Trouxa", "Primeiro Ano", "Segundo Ano", "Terceiro Ano", "Quarto Ano", "Quinto Ano", "Sexto Ano", "Sétimo Ano", "Auror Iniciante", "Auror", "Auror Sênior", "Mestre das Artes"];

export function getLevelFromXP(xp: number): { level: number; name: string; current: number; next: number; progress: number } {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
    else break;
  }
  const current = LEVEL_THRESHOLDS[level] || 0;
  const next = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level] + 1000;
  const progress = ((xp - current) / (next - current)) * 100;
  return { level, name: LEVEL_NAMES[level], current, next, progress: Math.min(progress, 100) };
}

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  age: number;
  house: House;
  level: number;
  xp: number;
  xpToNext: number;
  bio: string;
  avatar: string | null;
  role: "member" | "moderator" | "admin";
  badges: string[];
  joinedAt: string;
  approved: boolean;
  online: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  age: number;
  birth_date: string | null;
  house: House;
  level: number;
  blood_status: string | null;
  xp: number;
  xp_to_next: number;
  bio: string;
  avatar_url: string | null;
  approved: boolean;
  active_character_id: string | null;
  has_accepted_rules: boolean;
  online: boolean;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
  galeons: number;
  vip_plan: "premium" | "vip" | "founder" | null;
  vip_expires_at: string | null;
  blood_locked: boolean;
  current_session_id: string | null;
}

export interface Character {
  id: string;
  full_name: string;
  avatar_url: string | null;
  house: string | null;
  character_type: string | null;
  level: number | null;
  user_id?: string;
  xp?: number | null;
}

export interface PostAuthor {
  full_name: string;
  username: string;
  house: House;
  avatar_url?: string | null;
  vip_plan?: string | null;
}

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  music_url?: string;
  created_at: string;
  author?: PostAuthor;
  reactions: { emoji: string; count: number; mine: boolean }[];
  comments: { id: string; user_id: string; content: string; created_at: string; author?: PostAuthor }[];
  showComments?: boolean;
}

export interface Sticker {
  id: string;
  character_name: string;
  rarity: "bronze" | "silver" | "gold";
  image_url: string;
  level_required: number;
}

export interface StoreItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  price_galeons: number;
  image_url: string;
  rarity?: string;
  is_featured?: boolean;
  effects?: Record<string, any>;
}

export interface Order {
  id: string;
  package_id: string;
  amount_brl: number;
  galeons: number;
  status: string;
  created_at: string;
  paid_at?: string;
}

export interface SeasonalEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  event_type: string;
  house_points_bonus: number;
  xp_multiplier: number;
  active: boolean;
}
