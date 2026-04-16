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
  house: House;
  level: number;
  xp: number;
  xp_to_next: number;
  bio: string;
  avatar_url: string | null;
  approved: boolean;
  online: boolean;
  created_at: string;
  updated_at: string;
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
  }) => Promise<{ success: boolean; error?: string }>;
  fetchProfile: (userId: string) => Promise<void>;
  checkAdmin: (userId: string) => Promise<boolean>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,

  init: async () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          set({ user: session.user, isAuthenticated: true });
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(async () => {
            await get().fetchProfile(session.user.id);
            const admin = await get().checkAdmin(session.user.id);
            set({ isAdmin: admin, isLoading: false });
          }, 0);
        } else {
          set({ user: null, profile: null, isAuthenticated: false, isAdmin: false, isLoading: false });
        }
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ user: session.user, isAuthenticated: true });
      await get().fetchProfile(session.user.id);
      const admin = await get().checkAdmin(session.user.id);
      set({ isAdmin: admin, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) {
      set({ profile: data as unknown as Profile });
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
    await supabase.auth.signOut();
    set({ user: null, profile: null, isAuthenticated: false, isAdmin: false });
  },

  register: async ({ email, password, fullName, username, age, house }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
          age,
          house,
        },
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },
}));
