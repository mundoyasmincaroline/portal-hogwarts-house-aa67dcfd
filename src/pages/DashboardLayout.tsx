import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Castle, BookOpen, User, MessageCircle, Camera, Film, Trophy,
  Shield, Swords, BookMarked, Library, ShoppingBag, ScrollText,
  Settings, LogOut, Volume2, VolumeX, RefreshCw, Menu, Users,
  Coins, Lock, Wallet
} from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import HouseCrest from "@/components/HouseCrest";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { playMagicSound, isSoundEnabled, toggleSound } from "@/lib/sounds";
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
import { useAchievements } from "@/lib/useAchievements";
import FilchWatcher from "@/components/FilchWatcher";


const NAV_ITEMS = [
  { icon: <Castle size={20} />, label: "O Castelo", path: "/dashboard" },
  { icon: <BookOpen size={20} />, label: "Guia do Maroto", path: "/dashboard/guide" },
  { icon: <User size={20} />, label: "Meu Perfil", path: "/dashboard/profile" },
  { icon: <MessageCircle size={20} />, label: "Mensagens", path: "/dashboard/dm" },
  { icon: <Users size={20} />, label: "Amigos", path: "/dashboard/friends" },
  { icon: <Users size={20} />, label: "Membros", path: "/dashboard/members" },
  { icon: <MessageCircle size={20} />, label: "Chats RPG", path: "/dashboard/chats" },
  { icon: <Camera size={20} />, label: "InstaHogwarts", path: "/dashboard/instahogwarts" },
  { icon: <Film size={20} />, label: "Hogwarts Cine", path: "/dashboard/cinema" },
  { icon: <Trophy size={20} />, label: "Ranking", path: "/dashboard/ranking" },
  { icon: <Shield size={20} />, label: "Casas", path: "/dashboard/houses" },
  { icon: <Swords size={20} />, label: "Desafios", path: "/dashboard/challenges" },
  { icon: <BookMarked size={20} />, label: "Aulas", path: "/dashboard/classes" },
  { icon: <Library size={20} />, label: "Álbum", path: "/dashboard/album" },
  { icon: <ShoppingBag size={20} />, label: "Loja", path: "/dashboard/shop" },
  { icon: <Coins size={20} />, label: "Gringotts", path: "/dashboard/store" },
  { icon: <Wallet size={20} />, label: "Carteira", path: "/dashboard/wallet" },
  { icon: <ScrollText size={20} />, label: "Regras", path: "/dashboard/rules" },
  { icon: <Lock size={20} />, label: "Azkaban", path: "/dashboard/azkaban" },
];


const ADMIN_ITEMS = [
  { icon: <Settings size={20} />, label: "Admin", path: "/dashboard/admin" },
];

export default function DashboardLayout() {
  const { user, profile, isAdmin, isLoading, logout, pingPresence } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [encounterDone, setEncounterDone] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [dmUnread, setDmUnread] = useState(0);
  const [hasCharacters, setHasCharacters] = useState<boolean | null>(null); // null = still loading

  // Auto-conquistas baseadas em XP e nível
  useAchievements(user?.id, profile?.xp ?? 0, profile?.level ?? 1);

  // Verificar se usuário tem personagens (pega membros antigos sem ficha)
  useEffect(() => {
    if (!user) return;
    const checkChars = async () => {
      const { count } = await supabase
        .from("characters")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setHasCharacters((count ?? 0) > 0);
    };
    checkChars();
  }, [user?.id]);

  // DM unread badge
  useEffect(() => {
    if (!user) return;
    const countUnread = async () => {
      const { count } = await supabase
        .from("dm_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);
      setDmUnread(count || 0);
    };
    countUnread();
    const ch = supabase.channel("dm_unread_badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages" }, countUnread)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Daily login streak — concede XP uma vez por dia
  useEffect(() => {
    if (!user || !profile) return;
    const key = `daily_login_${user.id}`;
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem(key);
    if (lastLogin === today) return; // já ganhou hoje

    const awardStreak = async () => {
      const streakKey = `streak_${user.id}`;
      const lastDate = localStorage.getItem(streakKey);
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      // Calcular streak atual
      const currentStreak = (() => {
        const saved = localStorage.getItem(`streak_count_${user.id}`);
        if (lastDate === yesterday) return (parseInt(saved || "0") + 1);
        return 1;
      })();
      
      localStorage.setItem(streakKey, today);
      localStorage.setItem(`streak_count_${user.id}`, String(currentStreak));
      localStorage.setItem(key, today);
      
      // XP escalona com o streak (máx 7 dias = 75 XP)
      const xpBonus = Math.min(25 + (currentStreak - 1) * 5, 75);
      await supabase.rpc("award_xp_action", { _action: "daily_login", _user_id: user.id, _xp: xpBonus });
      
      const streakMsg = currentStreak > 1 ? ` 🔥 ${currentStreak} dias seguidos!` : "";
      toast.success(`☀️ Bom dia, ${profile.full_name?.split(" ")[0]}! +${xpBonus} XP pela sua presença diária!${streakMsg}`, { duration: 4000 });
      
      // Check level-up: refetch profile after xp
      setTimeout(async () => {
        const { data: fresh } = await supabase.from("profiles").select("level, xp").eq("user_id", user.id).single();
        if (fresh && fresh.level > (profile.level || 1)) {
          toast(
            <div className="text-center">
              <div className="text-3xl mb-1">⚡</div>
              <p className="font-heading text-primary font-bold">NÍVEL {fresh.level}!</p>
              <p className="text-xs text-muted-foreground">Você subiu de nível, bruxo(a)!</p>
            </div>,
            { duration: 6000 }
          );
        }
      }, 2000);
    };
    awardStreak();
  }, [user, profile]);

  const handleToggleSound = () => {
    setSoundOn(toggleSound());
  };

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
  }

  // Admin also goes through character selection, but can skip (canCancel)
  const adminSkipped = isAdmin && localStorage.getItem(`admin_skip_character_${user.id}`) === "true";

  // Se ainda está verificando personagens, aguarda
  if (hasCharacters === null) return null;

  // Redireciona para seleção de personagem se:
  // 1. Não tem active_character_id, OU
  // 2. Não tem personagens reais na tabela (membros antigos sem ficha)
  if ((!profile.active_character_id || !hasCharacters) && !adminSkipped) {
    return <CharacterSelection adminMode={isAdmin} />;
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
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg text-primary">
              <Castle size={24} />
            </div>
            <span className="font-heading text-lg text-gold-gradient leading-tight">Hogwarts<br/>House</span>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    isActive ? "bg-primary/10 text-primary font-bold border border-primary/20" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">{item.icon}</span>
                  <span className="font-heading text-sm">{item.label}</span>
                  {item.label === "Guia do Maroto" && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                  {item.label === "Mensagens" && dmUnread > 0 && (
                    <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
                      {dmUnread > 9 ? "9+" : dmUnread}
                    </span>
                  )}
                </Link>
              );
          })}
        </nav>

        <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm relative z-50">
          {/* Saldo de Galeões */}
          <Link to="/dashboard/store" className="flex items-center justify-between px-3 py-2 mb-2 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-900/20 to-amber-900/10 hover:border-yellow-400/50 transition-all group">
            <span className="text-[11px] text-yellow-400/80 font-heading group-hover:text-yellow-400">🪙 Galeões</span>
            <span className="font-heading text-sm text-yellow-400">{((profile as any).galeons || 0).toLocaleString("pt-BR")}</span>
          </Link>
          {/* VIP upgrade CTA — só para não-VIPs */}
          {!(profile as any).vip_plan && (
            <Link to="/dashboard/store"
              className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-900/30 to-violet-900/20 hover:border-purple-400/60 hover:from-purple-900/50 transition-all group animate-pulse-glow">
              <span className="text-base">👑</span>
              <span className="text-[11px] text-purple-300 font-heading group-hover:text-purple-200 flex-1">Ativar VIP</span>
              <span className="text-[9px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full font-heading">R$9,90</span>
            </Link>
          )}
          {/* Badge VIP ativo */}
          {(profile as any).vip_plan && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl border border-yellow-500/40 bg-gradient-to-r from-yellow-900/20 to-amber-900/10">
              <span className="text-base">✨</span>
              <span className="text-[11px] text-yellow-400 font-heading capitalize">{(profile as any).vip_plan} Ativo</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-1 w-full flex-wrap">
            <Link to="/dashboard/profile" className="flex items-center gap-2 max-w-[120px] hover:bg-secondary/50 p-1.5 rounded-lg transition-colors cursor-pointer group">
              <div className="relative shrink-0">
                <HouseCrest house={profile.house} size="sm" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${isUserOnline(profile) ? "bg-green-500" : "bg-muted-foreground"}`} title={isUserOnline(profile) ? "Online" : "Offline"} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-tight font-heading truncate text-foreground group-hover:text-primary transition-colors" title={profile.full_name}>{profile.full_name}</p>
                <p className="text-[10px] leading-tight text-muted-foreground truncate">{house.name}</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={async () => {
                  await supabase.from("profiles").update({ active_character_id: null } as never).eq("user_id", user.id);
                  useAuth.setState((state) => ({ profile: state.profile ? { ...state.profile, active_character_id: null } : null }));
                }} 
                className="p-1.5 text-muted-foreground hover:bg-secondary/80 hover:text-primary rounded-md transition-colors" 
                title="Trocar Personagem"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={handleToggleSound}
                className="p-1.5 text-muted-foreground hover:bg-secondary/80 hover:text-primary rounded-md transition-colors"
                title={soundOn ? "Desativar Som" : "Ativar Som"}
              >
                {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <div className="scale-90 origin-center"><Notifications /></div>
              <button 
                onClick={async () => { await logout(); navigate("/"); }} 
                className="p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-md transition-colors"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
          <div className="mt-3 text-center opacity-40">
            <p className="text-[9px] text-muted-foreground/60 text-center px-2 font-mono uppercase tracking-widest">Mundo Yasmin</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <NotificationBanner />
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <Menu size={20} />
          </button>
          <span className="font-heading text-sm text-gold-gradient">Hogwarts House</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
          <EngagementBot />
          <FilchWatcher />
        </div>
      </main>
    </div>
  );
}





