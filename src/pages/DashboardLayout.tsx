import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Castle, BookOpen, User, MessageCircle, Camera, Film, Trophy,
  Shield, Swords, BookMarked, Library, ShoppingBag, ScrollText,
  Settings, LogOut, Volume2, VolumeX, RefreshCw, Menu, Users,
  Coins, Lock, Wallet, Map as MapIcon, Sparkles, Crown, Zap, X
} from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import HouseCrest from "@/components/HouseCrest";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { playMagicSound, isSoundEnabled, toggleSound } from "@/lib/sounds";
import { toast } from "sonner";

import Notifications from "@/components/Notifications";
import InterstitialAd from "@/components/InterstitialAd";
import MagicalParticles from "@/components/MagicalParticles";

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
import VipUpsellBanner from "@/components/VipUpsellBanner";
import SocialProofWatcher from "@/components/SocialProofWatcher";
import { ErrorBoundary } from "@/components/ErrorBoundary";


const NAV_ITEMS = [
  { icon: <Castle size={20} />, label: "O Castelo", path: "/dashboard" },
  { icon: <MapIcon size={20} />, label: "Mapa do Maroto", isMap: true },
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
  const [hasCharacters, setHasCharacters] = useState<boolean | null>(null);

  const [showHouseCup, setShowHouseCup] = useState(() => {
    const saved = localStorage.getItem("hp_show_house_cup");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleHouseCup = () => {
    const next = !showHouseCup;
    setShowHouseCup(next);
    localStorage.setItem("hp_show_house_cup", JSON.stringify(next));
  };

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
        setHasCharacters(false);
      }
    };
    checkChars();
  }, [user?.id]);

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

  useEffect(() => {
    if (!user || !profile) return;
    const key = `daily_login_${user.id}`;
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem(key);
    if (lastLogin === today) return;

    const awardStreak = async () => {
      const streakKey = `streak_${user.id}`;
      const lastDate = localStorage.getItem(streakKey);
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      const currentStreak = (() => {
        const saved = localStorage.getItem(`streak_count_${user.id}`);
        if (lastDate === yesterday) return (parseInt(saved || "0") + 1);
        return 1;
      })();
      
      localStorage.setItem(streakKey, today);
      localStorage.setItem(`streak_count_${user.id}`, String(currentStreak));
      localStorage.setItem(key, today);
      
      const xpBonus = Math.min(25 + (currentStreak - 1) * 5, 75);
      await supabase.rpc("award_xp_action", { _action: "daily_login", _user_id: user.id, _xp: xpBonus });

      const galeonsBonus = Math.min(5 + (currentStreak - 1) * 2, 15);
      supabase.rpc("award_galeons", { _user_id: user.id, _amount: galeonsBonus, _reason: "daily_login" }).then(() => {});
      
      const streakMsg = currentStreak > 1 ? ` 🔥 ${currentStreak} dias seguidos!` : "";
      toast.success(`☀️ Bom dia, ${profile.full_name?.split(" ")[0]}! +${xpBonus} XP pela sua presença diária!${streakMsg}`, { duration: 4000 });
    };
    awardStreak();
  }, [user, profile]);

  const handleToggleSound = () => {
    setSoundOn(toggleSound());
  };

  useEffect(() => {
    playMagicSound();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);

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
  if (!isAdmin && !profile.has_accepted_rules) return <RulesAgreement />;

  const adminSkipped = isAdmin && localStorage.getItem(`admin_skip_character_${user.id}`) === "true";

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

  if ((!profile.active_character_id || !hasCharacters) && !adminSkipped) {
    return <CharacterSelection adminMode={isAdmin} />;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const lastSeenIntro = localStorage.getItem(`intro_last_seen_${user.id}`);
  if (lastSeenIntro !== todayStr) return <CastleEntrance />;
  
  const lastSeenEncounter = localStorage.getItem(`encounter_last_seen_${user.id}`);
  if (lastSeenEncounter !== todayStr && !encounterDone) {
    return <DailyEncounter onComplete={() => {
      localStorage.setItem(`encounter_last_seen_${user.id}`, todayStr);
      setEncounterDone(true);
    }} />;
  }
  
  const house = HOUSES[profile.house as House] || HOUSES.gryffindor;
  const navItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden relative">
      <MagicalParticles house={profile.house} />
      <div className={`absolute inset-0 pointer-events-none opacity-20 z-0 transition-all duration-1000 ${
        profile.house === 'gryffindor' ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.15)_0%,transparent_50%)]' :
        profile.house === 'slytherin' ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(22,163,74,0.15)_0%,transparent_50%)]' :
        profile.house === 'ravenclaw' ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.15)_0%,transparent_50%)]' :
        'bg-[radial-gradient(circle_at_20%_20%,rgba(202,138,4,0.15)_0%,transparent_50%)]'
      }`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,1)_0%,rgba(0,0,0,1)_100%)] z-0" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <InterstitialAd />
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

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
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return item.isMap ? (
              <button key={item.label} onClick={() => { playMagicSound(); setMapOpen(true); setSidebarOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group text-white/40 hover:bg-white/5 hover:text-white">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
                   {item.icon}
                </div>
                <span className="font-heading text-[10px] tracking-widest uppercase">{item.label}</span>
              </button>
            ) : (
              <Link key={item.path} to={item.path!} onClick={() => { playMagicSound(); setSidebarOpen(false); }} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-500 group relative overflow-hidden ${isActive ? "bg-white/5 text-white border border-white/10 shadow-xl" : "text-white/40 hover:text-white hover:bg-white/[0.02]"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-white/5 group-hover:bg-white/10"}`}>
                   {item.icon}
                </div>
                <span className="font-heading text-[10px] tracking-widest uppercase relative z-10">{item.label}</span>
                {item.label === "Mensagens" && dmUnread > 0 && <span className="ml-auto px-2 py-0.5 bg-primary text-white rounded-full text-[8px] font-heading shadow-lg">{dmUnread > 9 ? "9+" : dmUnread}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-3xl space-y-6">
          <Link to="/dashboard/store" className="relative group block overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-600/10 to-transparent border border-yellow-500/20 p-4 transition-all hover:border-yellow-500/50 hover:-translate-y-1">
            <div className="flex items-center justify-between relative z-10">
               <div className="space-y-0.5">
                  <p className="text-[9px] font-heading text-yellow-500/60 uppercase tracking-widest">Saldo no Cofre</p>
                  <p className="font-heading text-xl text-white tracking-tighter">🪙 {(profile.galeons || 0).toLocaleString("pt-BR")}</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:rotate-12 transition-transform">
                  <Coins size={20} className="text-yellow-500" />
               </div>
            </div>
          </Link>

          {/* RPG Progress Section */}
          <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
             <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 text-primary font-heading text-sm shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                      {profile.level || 1}
                   </div>
                   <span className="text-[9px] font-heading text-white/60 uppercase tracking-widest">Nível Atual</span>
                </div>
                <span className="text-[8px] font-heading text-primary uppercase tracking-tighter">{(profile.xp || 0)} / {((profile.level || 1) * 1000)} XP</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                    className="h-full bg-gradient-to-r from-primary to-amber-500 shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-1000" 
                    style={{ width: `${Math.min(((profile.xp || 0) / ((profile.level || 1) * 1000)) * 100, 100)}%` }} 
                />
             </div>
             <p className="text-[7px] text-center font-heading text-white/20 uppercase tracking-[0.2em] pt-1">
                {profile.level >= 60 ? "🧙‍♂️ Grão-Mestre Bruxo" : profile.level >= 40 ? "✨ Monitor-Chefe" : profile.level >= 20 ? "📜 Estudante Veterano" : "🌱 Jovem Aprendiz"}
             </p>
          </div>

          <div className="flex items-center justify-between gap-3">
             <Link to="/dashboard/profile" className="flex items-center gap-3 group">
                <HouseCrest house={profile.house} size="sm" />
                <div className="min-w-0">
                   <p className="text-[11px] font-heading text-white truncate uppercase tracking-wider group-hover:text-primary transition-colors">{profile.full_name?.split(' ')[0]}</p>
                   <p className="text-[9px] text-white/30 truncate uppercase font-medium">{house.name}</p>
                </div>
             </Link>
             <div className="flex items-center gap-1">
                <button onClick={handleToggleSound} className="p-2 text-white/20 hover:text-white transition-colors">{soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
                <Notifications />
                <button onClick={async () => { await logout(); navigate("/"); }} className="p-2 text-white/20 hover:text-red-500 transition-colors"><LogOut size={14} /></button>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <NotificationBanner />
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground"><Menu size={20} /></button>
          <span className="font-heading text-sm text-gold-gradient">Hogwarts House</span>
        </div>
        

        <div className="flex-1 overflow-y-auto p-6 md:p-16 custom-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto pb-40">
             {showVipBanner && !profile?.vip_plan && (
               <VipUpsellBanner currentVip={profile?.vip_plan} galeons={profile?.galeons} username={profile?.username} onClose={toggleVipBanner} />
             )}
             <SocialProofWatcher />
             <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
          </div>
          <EngagementBot />
          <FilchWatcher />
          <MagicalEventSystem />
          <GlobalChallengeWatcher />
          {/* <DailyRewardSystem /> */}
          <MagicalCelebration />
          <MaraudersMap isOpen={mapOpen} onClose={() => setMapOpen(false)} />
        </div>
      </main>
    </div>
  );
}
