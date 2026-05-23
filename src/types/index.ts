import { Database } from "@/integrations/supabase/types";

export type House = Database["public"]["Enums"]["house_type"];

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
