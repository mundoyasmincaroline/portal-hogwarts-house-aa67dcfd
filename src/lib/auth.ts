// Simple auth context (will be replaced by Supabase auth later)
import { create } from "zustand";
import { type UserProfile, MOCK_USER, MOCK_MEMBERS } from "./store";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (data: Partial<UserProfile>) => boolean;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: (username: string, password: string) => {
    // Admin login
    if (username === "mundoyasmincaroline" && password === "hogwarts2024") {
      set({ user: MOCK_USER, isAuthenticated: true });
      return true;
    }
    // Member login
    const member = MOCK_MEMBERS.find((m) => m.username === username);
    if (member) {
      set({ user: member, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null, isAuthenticated: false }),
  register: (data: Partial<UserProfile>) => {
    // Mock registration - will be replaced by Supabase
    const newUser: UserProfile = {
      id: Math.random().toString(36).slice(2),
      fullName: data.fullName || "",
      username: data.username || "",
      age: data.age || 13,
      house: data.house || "gryffindor",
      level: 0,
      xp: 0,
      xpToNext: 100,
      bio: "",
      avatar: null,
      role: "member",
      badges: [],
      joinedAt: new Date().toISOString(),
      approved: false,
      online: true,
    };
    set({ user: newUser, isAuthenticated: true });
    return true;
  },
}));
