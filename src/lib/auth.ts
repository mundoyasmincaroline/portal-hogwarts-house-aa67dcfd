import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type House = "gryffindor" | "slytherin" | "ravenclaw" | "hufflepuff";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  age: number;
  birth_date: string | null;
  house: House;
  level: number;
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
}

export function isUserOnline(profile: Partial<Profile> | null): boolean {
  if (!profile) return false;
  if (!profile.last_seen) return !!profile.online;
  // Consider online if last_seen is within the last 2 minutes (120000 ms)
  const lastSeenDate = new Date(profile.last_seen).getTime();
  const now = new Date().getTime();
  return (now - lastSeenDate) < 120000;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    username: string;
    age: number;
    house: House;
    avatarUrl?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  fetchProfile: (userId: string) => Promise<void>;
  checkAdmin: (userId: string) => Promise<boolean>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  pingPresence: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,

  init: async () => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ user: session.user, isAuthenticated: true });
        setTimeout(async () => {
          await get().fetchProfile(session.user.id);
          const admin = await get().checkAdmin(session.user.id);
          set({ isAdmin: admin, isLoading: false });
          get().pingPresence();
        }, 0);
      } else {
        set({ user: null, profile: null, isAuthenticated: false, isAdmin: false, isLoading: false });
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ user: session.user, isAuthenticated: true });
      await get().fetchProfile(session.user.id);
      const admin = await get().checkAdmin(session.user.id);
      set({ isAdmin: admin, isLoading: false });
      get().pingPresence();
    } else {
      set({ isLoading: false });
    }
  },

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) set({ profile: data as unknown as Profile });
  },

  checkAdmin: async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  logout: async () => {
    const userId = get().user?.id;
    if (userId) {
      await supabase.from("profiles").update({ online: false } as never).eq("user_id", userId);
    }
    await supabase.auth.signOut();
    localStorage.removeItem("hogwarts_session_id");
    set({ user: null, profile: null, isAuthenticated: false, isAdmin: false });
  },

  register: async ({ email, password, fullName, username, age, house, avatarUrl }) => {
    if (age < 13 || age > 17) {
      return { success: false, error: "Apenas bruxos de 13 a 17 anos podem se matricular." };
    }
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName, username, age, house, avatar_url: avatarUrl || null },
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  updateProfile: async (updates) => {
    const userId = get().user?.id;
    if (!userId) return { success: false, error: "Não autenticado" };
    const { error } = await supabase
      .from("profiles")
      .update(updates as never)
      .eq("user_id", userId);
    if (error) return { success: false, error: error.message };

    // RPG Vivo: Dar XP automático por atualizar o perfil usando RPC para evitar soma no frontend
    const currentProfile = get().profile;
    if (currentProfile) {
      await supabase.rpc('award_xp_action', { _action: 'profile_update', _user_id: userId, _xp: 2 });
    }

    await get().fetchProfile(userId);
    return { success: true };
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  pingPresence: async () => {
    const userId = get().user?.id;
    if (!userId) return;

    let sessionId = localStorage.getItem("hogwarts_session_id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("hogwarts_session_id", sessionId);
      await supabase.from("profiles").update({ current_session_id: sessionId } as never).eq("user_id", userId);
    }

    const { data: prof } = await supabase.from("profiles").select("current_session_id").eq("user_id", userId).single();
    
    if (prof?.current_session_id && prof.current_session_id !== sessionId) {
      // Foi logado em outro dispositivo
      await supabase.auth.signOut();
      localStorage.removeItem("hogwarts_session_id");
      set({ user: null, profile: null, isAuthenticated: false, isAdmin: false });
      window.location.href = "/login?kicked=true";
      return;
    }

    await supabase
      .from("profiles")
      .update({ online: true, last_seen: new Date().toISOString() } as never)
      .eq("user_id", userId);
  },
}));
