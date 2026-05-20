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
  // Monetização (sprint_migration_3.sql)
  galeons: number;
  vip_plan: "premium" | "vip" | "founder" | null;
  vip_expires_at: string | null;
  blood_locked: boolean;
}

export const isUserOnline = (profile: Partial<Profile> | null): boolean => {
  if (!profile) return false;
  if (profile.online === true) return true;
  if (!profile.last_seen) return false;
  const lastSeenDate = new Date(profile.last_seen).getTime();
  return (Date.now() - lastSeenDate) < 180000; // 3 minutes buffer
};

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
    try {
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({ user: session.user, isAuthenticated: true });
          setTimeout(async () => {
            try {
              await get().fetchProfile(session.user.id);
              const admin = await get().checkAdmin(session.user.id);
              set({ isAdmin: admin, isLoading: false });
              get().pingPresence();
            } catch (err) {
              console.error("Erro ao carregar perfil no onAuthStateChange:", err);
              set({ isLoading: false });
            }
          }, 0);
        } else {
          set({ user: null, profile: null, isAuthenticated: false, isAdmin: false, isLoading: false });
        }
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user, isAuthenticated: true });
        try {
          await get().fetchProfile(session.user.id);
          const admin = await get().checkAdmin(session.user.id);
          set({ isAdmin: admin });
        } catch (err) {
          console.error("Erro ao carregar dados iniciais:", err);
        }
        set({ isLoading: false });
        get().pingPresence();
      } else {
        set({ isLoading: false });
      }
    } catch (globalErr) {
      console.error("Erro global no Auth Init:", globalErr);
      set({ isLoading: false });
    }
  },

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      if (data) set({ profile: data as unknown as Profile });
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
    }
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

    // Use debouncing logic inside create to avoid too many writes
    const now = new Date();
    const lastPing = (get() as any)._lastPingAt;
    if (lastPing && (now.getTime() - lastPing.getTime()) < 45000) {
      return;
    }
    set({ _lastPingAt: now } as any);

    let sessionId = localStorage.getItem("hogwarts_session_id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("hogwarts_session_id", sessionId);
      await supabase.from("profiles").update({ current_session_id: sessionId } as never).eq("user_id", userId);
    }

    await supabase
      .from("profiles")
      .update({ online: true, last_seen: now.toISOString() } as never)
      .eq("user_id", userId);
  },
}));
