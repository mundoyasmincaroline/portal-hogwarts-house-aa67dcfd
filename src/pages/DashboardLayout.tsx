import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Castle, BookOpen, User, MessageCircle, Camera, Film, Trophy,
  Shield, Swords, BookMarked, Library, ShoppingBag, ScrollText,
  Settings, LogOut, Volume2, VolumeX, RefreshCw, Menu, Users,
  Coins, Lock, Wallet, Map as MapIcon, Sparkles
} from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import HouseCrest from "@/components/HouseCrest";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { playMagicSound, isSoundEnabled, toggleSound } from "@/lib/sounds";
import { toast } from "sonner";

import Notifications from "@/components/Notifications";
import InterstitialAd from "@/components/InterstitialAd";

import CastleEntrance from "@/pages/CastleEntrance";
import EngagementBot from "@/components/EngagementBot";
import MagicalCelebration from "@/components/MagicalCelebration";

import PendingApproval from "@/pages/PendingApproval";
import RulesAgreement from "@/pages/RulesAgreement";
import CharacterSelection from "@/pages/CharacterSelection";
import DailyEncounter from "@/components/DailyEncounter";
import NotificationBanner from "@/components/NotificationBanner";
import { useAchievements } from "@/lib/useAchievements";
import FilchWatcher from "@/components/FilchWatcher";
import MagicalEventSystem from "@/components/MagicalEventSystem";
import MagicalPartyOverlay from "@/components/MagicalPartyOverlay";
import GlobalChallengeWatcher from "@/components/GlobalChallengeWatcher";
import DailyRewardSystem from "@/components/DailyRewardSystem";
import MaraudersMap from "@/components/MaraudersMap";
// import MagicalActivityFeed from "@/components/MagicalActivityFeed";
// import TimedMysteryChest from "@/components/TimedMysteryChest";


const NAV_ITEMS = [
  { icon: <Castle size={20} />, label: "O Castelo", path: "/dashboard" },
  { icon: <MapIcon size={20} />, label: "Mapa do Maroto", isMap: true },
  // { icon: <Trophy size={20} />, label: "Sagas Mágicas", path: "/dashboard/sagas" },
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
  { icon: <Sparkles size={20} />, label: "Eventos Mágicos", path: "/dashboard/events" },
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
  const [mapOpen, setMapOpen] = useState(false);
  const [encounterDone, setEncounterDone] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [dmUnread, setDmUnread] = useState(0);
  const [hasCharacters, setHasCharacters] = useState<boolean | null>(null); // null = still loading

  const [showHouseCup, setShowHouseCup] = useState(() => {
    const saved = localStorage.getItem("hp_show_house_cup");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleHouseCup = () => {
    const next = !showHouseCup;
    setShowHouseCup(next);
    localStorage.setItem("hp_show_house_cup", JSON.stringify(next));
  };

  // Auto-conquistas baseadas em XP e nível
  useAchievements(user?.id, profile?.xp ?? 0, profile?.level ?? 1);

  const [showVipBanner, setShowVipBanner] = useState(() => {
    const saved = localStorage.getItem("hp_show_vip_banner");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleVipBanner = () => {
    const next = !showVipBanner;
    setShowVipBanner(next);
    localStorage.setItem("hp_show_vip_banner", JSON.stringify(next));
  };

  // Verificar se usuário tem personagens (pega membros antigos sem ficha)
  useEffect(() => {
    if (!user) return;
    const checkChars = async () => {
      try {
        const { count, error } = await supabase
          .from("characters")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        if (error) throw error;
        setHasCharacters((count ?? 0) > 0);
      } catch (err) {
        console.error("Erro ao verificar personagens:", err);
        // Em caso de erro, assume que não tem para não travar a tela
        setHasCharacters(false);
      }
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

      // 🪙 Galeões pelo login (5 base + 2 por dia de streak, máx 15)
      const galeonsBonus = Math.min(5 + (currentStreak - 1) * 2, 15);
      supabase.rpc("award_galeons", { _user_id: user.id, _amount: galeonsBonus, _reason: "daily_login" }).then(() => {});
      
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
    
    // ── MONSTER QUALITY MORPHEUS PROTOCOL ──
    setTimeout(() => {
      toast(
        <div className="relative overflow-hidden rounded-xl bg-black/90 border border-green-500/30 p-4 shadow-[0_0_30px_rgba(34,197,94,0.2)] group/morpheus">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
          <div className="relative z-10 font-mono text-[10px] space-y-2">
            <div className="flex items-center justify-between border-b border-green-500/20 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-500 font-bold tracking-tighter">MORPHEUS_PROTOCOL_v4.0</span>
              </div>
              <span className="text-green-900 bg-green-500/10 px-2 py-0.5 rounded text-[8px]">ENCRYPTED</span>
            </div>
            <div className="text-green-400/80 space-y-1">
              <p>&gt; Inicializando escudos de Hogwarts...</p>
              <p>&gt; Verificando assinaturas de magia negra... <span className="text-green-500">[LIMPO]</span></p>
              <p>&gt; Conexão segura estabelecida.</p>
            </div>
          </div>
        </div>,
        { 
          duration: 6000, 
          className: "p-0 bg-transparent border-none shadow-none",
          position: "bottom-right"
        }
      );
    }, 2000);
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
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-float">🔮</div>
          <p className="font-heading text-white/40 text-sm tracking-[0.3em] uppercase">Despertando Magia</p>
        </div>
      </div>
    );
  }
  

  if (!profile.approved && !isAdmin) return <PendingApproval />;
  
  if (!isAdmin) {
    if (!profile.has_accepted_rules) return <RulesAgreement />;
  }

  // Admin also goes through character selection, but can skip (canCancel)
  const adminSkipped = isAdmin && localStorage.getItem(`admin_skip_character_${user.id}`) === "true";

  // Se ainda está verificando personagens, aguarda
  if (hasCharacters === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin-slow">⏳</div>
          <p className="font-heading text-white/20 text-[10px] tracking-widest uppercase">Sincronizando Almas</p>
        </div>
      </div>
    );
  }

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
    <div className="flex h-screen bg-[#050505] overflow-hidden relative">
      {/* Global Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,1)_0%,rgba(0,0,0,1)_100%)] z-0" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <InterstitialAd />
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MONSTER SIDEBAR ── */}
      <aside className={`fixed md:static inset-y-0 left-0 z-[60] w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out md:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-[20px_0_100px_rgba(0,0,0,0.9)]" : "-translate-x-full"}`}>
        <div className="p-8 border-b border-white/5 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Link to="/dashboard" className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
               <Castle size={24} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            </div>
            <div className="space-y-0.5">
              <span className="font-heading text-xl text-white tracking-tighter leading-none block">HOGWARTS</span>
              <span className="font-heading text-xs text-primary tracking-[0.3em] leading-none block opacity-80">PORTAL</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
              return item.isMap ? (
                <button
                  key={item.label}
                  onClick={() => {
                    playMagicSound();
                    setMapOpen(true);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group text-white/40 hover:bg-white/5 hover:text-white"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
                     {item.icon}
                  </div>
                  <span className="font-heading text-[10px] tracking-widest uppercase">{item.label}</span>
                </button>
              ) : (
                <Link
                  key={item.path}
                  to={item.path!}
                  onClick={() => {
                    playMagicSound();
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                    isActive ? "bg-white/5 text-white border border-white/10 shadow-xl" : "text-white/40 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  {isActive && (
                     <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-white/5 group-hover:bg-white/10"}`}>
                     {item.icon}
                  </div>
                  <span className="font-heading text-[10px] tracking-widest uppercase relative z-10">{item.label}</span>
                  {item.label === "Guia do Maroto" && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                  )}
                  {item.label === "Mensagens" && dmUnread > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-primary text-white rounded-full text-[8px] font-heading shadow-lg">
                      {dmUnread > 9 ? "9+" : dmUnread}
                    </span>
                  )}
                </Link>
              );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-3xl space-y-6">
          {/* Gringotts Balance - Monster Quality */}
          <Link to="/dashboard/store" className="relative group block overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-600/10 to-transparent border border-yellow-500/20 p-4 transition-all hover:border-yellow-500/50 hover:-translate-y-1">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
               <div className="space-y-0.5">
                  <p className="text-[9px] font-heading text-yellow-500/60 uppercase tracking-widest">Saldo no Cofre</p>
                  <p className="font-heading text-xl text-white tracking-tighter drop-shadow-lg">🪙 {((profile as any).galeons || 0).toLocaleString("pt-BR")}</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:rotate-12 transition-transform">
                  <Coins size={20} className="text-yellow-500" />
               </div>
            </div>
          </Link>

          {/* User Profile Area */}
          <div className="flex items-center justify-between gap-3">
             <Link to="/dashboard/profile" className="flex items-center gap-3 group">
                <div className="relative">
                   <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                   <HouseCrest house={profile.house} size="sm" className="relative z-10" />
                   <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${isUserOnline(profile) ? "bg-green-500" : "bg-white/10"}`} />
                </div>
                <div className="min-w-0">
                   <p className="text-[11px] font-heading text-white truncate uppercase tracking-wider group-hover:text-primary transition-colors">{profile.full_name?.split(' ')[0]}</p>
                   <p className="text-[9px] text-white/30 truncate uppercase font-medium">{house.name}</p>
                </div>
             </Link>

             <div className="flex items-center gap-1">
                <button onClick={handleToggleSound} className="p-2 text-white/20 hover:text-white transition-colors">
                   {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
                <div className="scale-90 opacity-60 hover:opacity-100 transition-opacity"><Notifications /></div>
                <button onClick={async () => { await logout(); navigate("/"); }} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                   <LogOut size={14} />
                </button>
             </div>
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
        
        {/* House Cup Widget - MONSTER QUALITY 3D GLASS DESIGN */}
        <div className="px-4 md:px-12 mt-8 mb-6 relative">
          {!showHouseCup ? (
            <button 
              onClick={toggleHouseCup}
              className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl text-[10px] font-heading text-white/60 hover:text-white hover:bg-white/10 hover:scale-105 transition-all shadow-2xl animate-in slide-in-from-left-5 group"
            >
              <Trophy size={16} className="text-yellow-500 group-hover:animate-bounce" />
              <span className="tracking-[0.2em] uppercase">Visualizar Torneio das Casas</span>
            </button>
          ) : (
            <div className="px-6 py-10 md:px-12 animate-in slide-in-from-top-10 duration-1000">
              <div className="bg-black/60 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] p-10 md:p-14 relative overflow-hidden group/cup">
                {/* Background Magic Dust */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/papyros.png')] opacity-[0.02] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 mb-16">
                  <div className="flex items-center gap-10">
                    {/* Trophy Monument */}
                    <div className="relative shrink-0">
                      <div className="absolute -inset-8 bg-yellow-400/20 blur-[60px] opacity-0 group-hover/cup:opacity-100 transition-opacity duration-1000" />
                      <div className="w-28 h-28 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center shadow-2xl relative z-10 animate-float group-hover:scale-110 transition-transform duration-700">
                        <Trophy size={56} className="text-yellow-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.9)]" />
                      </div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-black/40 blur-xl rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-5xl md:text-6xl font-heading text-white tracking-tighter italic leading-none drop-shadow-2xl">Torneio de Hogwarts</h2>
                      <p className="text-[11px] font-heading text-primary uppercase tracking-[0.6em] animate-pulse">A Glória Eterna Aguarda a Sua Casa</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="hidden lg:flex items-center gap-6 px-10 py-5 bg-white/[0.03] rounded-[2.5rem] border border-white/10 shadow-inner backdrop-blur-3xl">
                      <div className="flex -space-x-4">
                        {['🦁', '🐍', '🦅', '🦡'].map((emoji, i) => (
                          <div key={i} className="w-12 h-12 rounded-[1rem] bg-black/80 border border-white/10 flex items-center justify-center text-xl shadow-2xl hover:-translate-y-2 hover:rotate-6 transition-all cursor-pointer">
                            {emoji}
                          </div>
                        ))}
                      </div>
                      <div className="h-12 w-px bg-white/10 mx-2" />
                      <div className="text-right space-y-1">
                        <p className="text-[9px] text-white/20 uppercase font-heading tracking-[0.4em]">Casa em Destaque</p>
                        <p className="text-sm font-heading text-green-400 tracking-tighter uppercase italic">Sonserina Imbatível</p>
                      </div>
                    </div>

                    <button 
                      onClick={toggleHouseCup}
                      className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-3xl flex items-center justify-center text-white/20 hover:text-white transition-all group shadow-xl"
                      title="Ocultar Painel"
                    >
                      <LogOut size={24} className="rotate-90 group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* 3D Liquid Progress Bars - MONSTER QUALITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                  {[
                    { name: "Grifinória", color: "from-red-500 via-red-600 to-red-950", accent: "bg-red-500", progress: "65%", icon: "🦁", glow: "shadow-[0_0_40px_rgba(239,68,68,0.4)]" },
                    { name: "Sonserina", color: "from-green-400 via-green-600 to-green-950", accent: "bg-green-400", progress: "82%", icon: "🐍", glow: "shadow-[0_0_40px_rgba(34,197,94,0.4)]" },
                    { name: "Corvinal", color: "from-blue-400 via-blue-600 to-blue-950", accent: "bg-blue-400", progress: "45%", icon: "🦅", glow: "shadow-[0_0_40_px_rgba(59,130,246,0.4)]" },
                    { name: "Lufa-Lufa", color: "from-yellow-400 via-amber-600 to-amber-950", accent: "bg-yellow-400", progress: "30%", icon: "🦡", glow: "shadow-[0_0_40px_rgba(245,158,11,0.4)]" }
                  ].map((house) => (
                    <div key={house.name} className="relative group/house bg-white/[0.02] rounded-[3rem] p-8 border border-white/5 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-700 hover:-translate-y-3 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover/house:opacity-100 transition-opacity duration-1000" />
                      
                      <div className="flex justify-between items-end mb-8 relative z-10">
                        <div className="space-y-1">
                          <p className="text-[9px] font-heading text-white/20 uppercase tracking-[0.4em]">{house.name}</p>
                          <span className="text-3xl drop-shadow-2xl group-hover:scale-125 transition-transform duration-700 block">{house.icon}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-2xl font-heading text-white tracking-tighter drop-shadow-lg">{house.progress}</span>
                           <p className="text-[8px] font-heading text-primary uppercase tracking-widest">Lealdade</p>
                        </div>
                      </div>
                      
                      <div className="h-5 w-full bg-black/60 rounded-full border border-white/5 p-1 relative overflow-hidden shadow-2xl backdrop-blur-3xl group-hover:scale-105 transition-transform duration-500">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${house.color} ${house.glow} transition-all duration-1000 ease-out relative overflow-hidden`}
                          style={{ width: house.progress }}
                        >
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-40" />
                          
                          {/* Liquid Pulse Effect */}
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-16 custom-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto pb-40">
             {showVipBanner ? (
               <VipUpsellBanner 
                 currentVip={profile?.vip_plan} 
                 username={profile?.full_name}
                 onClose={toggleVipBanner}
               />
             ) : !profile?.vip_plan && (
               <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                 <button 
                   onClick={toggleVipBanner}
                   className="relative group flex items-center gap-6 px-10 py-5 bg-black/40 backdrop-blur-3xl border border-purple-500/30 rounded-[2.5rem] shadow-[0_20px_50px_rgba(168,85,247,0.15)] hover:scale-105 active:scale-95 transition-all"
                 >
                   <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center border border-white/20 shadow-2xl">
                      <Crown size={28} className="text-white group-hover:rotate-12 transition-transform duration-500" />
                   </div>
                   <div className="relative z-10 text-left">
                      <p className="text-[11px] font-heading text-purple-300 uppercase tracking-[0.4em] mb-1">Status de Realeza</p>
                      <p className="text-sm font-heading text-white tracking-tight">Ascender à Elite de Hogwarts (VIP)</p>
                   </div>
                   <div className="relative z-10 ml-10 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                      →
                   </div>
                 </button>
               </div>
             )}
             <Outlet />
          </div>
          
          <EngagementBot />
          <FilchWatcher />
          <MagicalEventSystem />
          <GlobalChallengeWatcher />
          <DailyRewardSystem />
          <MagicalCelebration />
          <MaraudersMap isOpen={mapOpen} onClose={() => setMapOpen(false)} />
        </div>
      </main>
    </div>
  );
}
