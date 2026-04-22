import { create } from "zustand";
import { supabase } from "../integrations/supabase/client";
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
  // Monetização (sprint_migration_3.sql)
  galeons: number;
  vip_plan: "premium" | "vip" | "founder" | null;
  vip_expires_at: string | null;
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
  pingPresence: (path?: string) => Promise<void>;
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

  pingPresence: async (path?: string) => {
    const userId = get().user?.id;
    if (!userId) return;

    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const deviceInfo = {
      browser: navigator.userAgent.split(') ')[1]?.split(' ')[0] || 'Unknown',
      os: navigator.userAgent.match(/\(([^)]+)\)/)?.[1] || 'Unknown',
      isPWA
    };

    let sessionId = localStorage.getItem("hogwarts_session_id");
    let justInitialized = false;

    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("hogwarts_session_id", sessionId);
      await supabase.from("profiles").update({ current_session_id: sessionId } as never).eq("user_id", userId);
      justInitialized = true;
    }

    // Se acabamos de inicializar, não precisamos checar contra o DB imediatamente para evitar race conditions
    if (justInitialized) {
        await supabase
          .from("profiles")
          .update({ online: true, last_seen: new Date().toISOString() } as never)
          .eq("user_id", userId);
        return;
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
      .update({ 
        online: true, 
        last_seen: new Date().toISOString(),
        // Usamos bio temporariamente para metadata se o campo device_info não existir
        // Mas o ideal é ter o campo. Vou tentar atualizar bio com JSON se o usuário for admin monitorado
        // Para o God Mode Realtime, vamos usar o metadata do Supabase Presence depois
      } as any)
      .eq("user_id", userId);

    // Broadcast Realtime Telemetry
    const channel = supabase.channel('telemetry');
    channel.send({
      type: 'broadcast',
      event: 'heartbeat',
      payload: {
        userId,
        username: get().profile?.username,
        fullName: get().profile?.full_name,
        level: get().profile?.level,
        path: path || window.location.pathname,
        device: deviceInfo,
        timestamp: new Date().toISOString()
      }
    });
  },
}));
// Garantia Global de Zion: Se o módulo carregar, o useAuth existirá no window.
if (typeof window !== "undefined") {
  (window as any).useAuth = useAuth;
}
