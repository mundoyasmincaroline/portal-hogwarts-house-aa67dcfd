import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, isUserOnline } from "@/lib/auth";
import HouseCrest from "@/components/HouseCrest";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { playMagicSound } from "@/lib/sounds";
import { toast } from "sonner";

import Notifications from "@/components/Notifications";
import InterstitialAd from "@/components/InterstitialAd";
import GrandOpeningFireworks from "@/components/GrandOpeningFireworks";
import CastleEntrance from "@/pages/CastleEntrance";
import EngagementBot from "@/components/EngagementBot";

import PendingApproval from "@/pages/PendingApproval";
import RulesAgreement from "@/pages/RulesAgreement";
import CharacterSelection from "@/pages/CharacterSelection";
import DailyEncounter from "@/components/DailyEncounter";
import NotificationBanner from "@/components/NotificationBanner";

const NAV_ITEMS = [
  { icon: "🏰", label: "O Castelo", path: "/dashboard" },
  { icon: "📖", label: "Guia do Maroto", path: "/dashboard/guide" },
  { icon: "👤", label: "Meu Perfil", path: "/dashboard/profile" },
  { icon: "💬", label: "Chats RPG", path: "/dashboard/chats" },
  { icon: "📸", label: "InstaHogwarts", path: "/dashboard/instahogwarts" },
  { icon: "🍿", label: "Hogwarts Flix", path: "/dashboard/cinema" },
  { icon: "🏆", label: "Ranking", path: "/dashboard/ranking" },
  { icon: "🏰", label: "Casas", path: "/dashboard/houses" },
  { icon: "⚔️", label: "Desafios", path: "/dashboard/challenges" },
  { icon: "📚", label: "Aulas", path: "/dashboard/classes" },
  { icon: "📖", label: "Álbum", path: "/dashboard/album" },
  { icon: "🛍️", label: "Loja", path: "/dashboard/shop" },
  { icon: "📜", label: "Regras", path: "/dashboard/rules" },
];

const ADMIN_ITEMS = [
  { icon: "⚙️", label: "Admin", path: "/dashboard/admin" },
];

export default function DashboardLayout() {
  const { user, profile, isAdmin, isLoading, logout, pingPresence } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [encounterDone, setEncounterDone] = useState(false);

  useEffect(() => {
    playMagicSound();
    
    // Morpheus Security Protocol Alert
    setTimeout(() => {
      toast(
        <div className="font-mono text-green-500 bg-black p-1 w-full">
          <p className="font-bold border-b border-green-500/50 mb-1 flex justify-between">
            <span>&gt; MORPHEUS_PROTOCOL</span>
            <span className="text-red-500">ACTIVE</span>
          </p>
          <p className="text-xs">&gt; System Secured & Encrypted.</p>
          <p className="text-xs">&gt; Tracking all unauthorized access...</p>
        </div>,
        { duration: 5000, className: "bg-black border border-green-500 rounded-none p-0" }
      );
    }, 1500);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);

  // Heartbeat de presença + offline ao sair
  useEffect(() => {
    if (!user) return;
    pingPresence();
    const interval = setInterval(pingPresence, 30000);
    const handleBeforeUnload = () => {
      navigator.sendBeacon &&
        supabase.from("profiles").update({ online: false } as never).eq("user_id", user.id);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      supabase.from("profiles").update({ online: false } as never).eq("user_id", user.id);
    };
  }, [user, pingPresence]);

  // Sistema de Recrutamento (Referral)
  useEffect(() => {
    const processReferral = async () => {
      if (!user || !profile) return;
      
      // 1. Registra o convite se o usuário acabou de se cadastrar com um código
      const pendingRef = localStorage.getItem("pending_referral");
      if (pendingRef) {
        const { data: inviter } = await supabase.from("profiles").select("user_id").eq("username", pendingRef).single();
        if (inviter) {
          await supabase.from("referrals").insert({
            inviter_id: inviter.user_id,
            invited_id: user.id
          } as never);
        }
        localStorage.removeItem("pending_referral");
      }

      // 2. Anti-Burla: Se chegou no Nível 2, conclui o convite
      if (profile.level >= 2) {
        const { data: ref } = await supabase.from("referrals").select("status").eq("invited_id", user.id).maybeSingle();
        if (ref && ref.status === 'pending') {
          await supabase.rpc("complete_referral_action", { _invited_id: user.id });
        }
      }
    };
    processReferral();
  }, [user, profile]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl animate-float mb-4">⚡</div>
          <p className="font-heading text-muted-foreground">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;
  

  if (!profile.approved && !isAdmin) return <PendingApproval />;
  
  if (!isAdmin) {
    if (!profile.has_accepted_rules) return <RulesAgreement />;
    if (!profile.active_character_id) return <CharacterSelection />;
  }
  const today = new Date().toISOString().split('T')[0];
  const lastSeenIntro = localStorage.getItem(`intro_last_seen_${user.id}`);
  const shouldShowIntro = lastSeenIntro !== today;

  if (shouldShowIntro) return <CastleEntrance />;
  
  const lastSeenEncounter = localStorage.getItem(`encounter_last_seen_${user.id}`);
  const shouldShowEncounter = lastSeenEncounter !== today && !encounterDone;

  if (shouldShowEncounter) {
    return <DailyEncounter onComplete={() => {
      localStorage.setItem(`encounter_last_seen_${user.id}`, today);
      setEncounterDone(true);
    }} />;
  }
  
  const house = HOUSES[profile.house as House] || HOUSES.gryffindor;
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <GrandOpeningFireworks />
      <InterstitialAd />
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-heading text-lg text-gold-gradient">Hogwarts House</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    playMagicSound();
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                    isActive ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-heading text-sm">{item.label}</span>
                  {item.label === "Guia do Maroto" && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </Link>
              );
          })}
        </nav>

                <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:bg-secondary/50 p-1.5 rounded-lg transition-colors cursor-pointer group">
              <div className="relative">
                <HouseCrest house={profile.house} size="sm" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${isUserOnline(profile) ? "bg-green-500" : "bg-muted-foreground"}`} title={isUserOnline(profile) ? "Online" : "Offline"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading truncate text-foreground group-hover:text-primary transition-colors">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{house.name}</p>
              </div>
            </Link>
            <button 
              onClick={async () => {
                await supabase.from("profiles").update({ active_character_id: null } as never).eq("user_id", user.id);
                useAuth.setState((state) => ({ profile: state.profile ? { ...state.profile, active_character_id: null } : null }));
              }} 
              className="text-muted-foreground hover:text-primary text-base ml-1 transition-colors" 
              title="Trocar Personagem"
            >
              🔄
            </button>
            <Notifications />
            <button onClick={async () => { await logout(); navigate("/"); }} className="text-muted-foreground hover:text-destructive text-xs ml-1">
              Sair
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className="text-[10px] text-muted-foreground/40 text-center px-4">Grupo Portal Matrix 2026 - Mundo Yasmin Caroline</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <NotificationBanner />
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="text-xl">☰</button>
          <span className="font-heading text-sm text-gold-gradient">Hogwarts House</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
          <EngagementBot />
        </div>
      </main>
    </div>
  );
}





