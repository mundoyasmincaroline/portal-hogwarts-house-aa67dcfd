import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Volume2, VolumeX, Menu, Castle, Wallet
} from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HouseCrest from "@/components/rpg/HouseCrest";
import MagicalGaleon from "@/components/shared/MagicalGaleon";
import { HOUSES } from "@/types/house";
import { type House } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { isSoundEnabled, toggleSound } from "@/services/core/soundService";
import { toast } from "sonner";

import Notifications from "@/components/Notifications";
import PendingApproval from "@/pages/PendingApproval";
import RulesAgreement from "@/pages/RulesAgreement";
import CharacterSelection from "@/pages/CharacterSelection";
import NotificationBanner from "@/components/NotificationBanner";
import { useAchievements } from "@/hooks/features/useAchievements";
import HouseCupWidget from "@/components/rpg/HouseCupWidget";
import DailyProphetTicker from "@/components/shared/DailyProphetTicker";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import AmbientAudio from "@/components/AmbientAudio";
import TurnSwitcher from "@/components/TurnSwitcher";
import SafeImage from "@/components/SafeImage";
import BottomNav from "@/components/BottomNav";
import { NAV_GROUPS, ADMIN_GROUP } from "@/constants/navigation";
import { AtmosphericBackground } from "@/components/shared/AtmosphericBackground";
import { MagicalClock } from "@/components/shared/MagicalClock";


// Memoized Nav Item for performance
const NavItem = memo(({ item, isActive, dmUnread, onClick }: { item: any, isActive: boolean, dmUnread: number, onClick: () => void }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden border ${
      isActive 
        ? "bg-primary/10 text-primary font-bold border-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]" 
        : "text-muted-foreground/70 hover:bg-white/5 hover:text-foreground border-transparent active:scale-95"
    }`}
  >
    {isActive && (
      <motion.div 
        layoutId="active-nav-indicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(212,175,55,0.8)]"
      />
    )}
    <span className={`relative z-10 transition-all duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]" : "group-hover:scale-110"}`}>
      {item.icon}
    </span>
    <span className="font-heading text-[11px] uppercase tracking-wider relative z-10">{item.label}</span>
    {item.label === "Mensagens" && dmUnread > 0 && (
      <span className="ml-auto min-w-[20px] h-[20px] px-1 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold relative z-10 shadow-[0_0_10px_rgba(212,175,55,0.4)]">
        {dmUnread > 9 ? "9+" : dmUnread}
      </span>
    )}
  </Link>
));

export default function DashboardLayout() {
  const { user, profile, isAdmin, isLoading, isAuthenticated, logout, pingPresence } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [dmUnread, setDmUnread] = useState(0);
  const [hasCharacters, setHasCharacters] = useState<boolean | null>(null);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useAchievements(user?.id, profile?.xp ?? 0, profile?.level ?? 1);

  const house = useMemo(() => HOUSES[(profile?.house as House) || "gryffindor"] || HOUSES.gryffindor, [profile?.house]);
  const groups = useMemo(() => isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS, [isAdmin]);

  const adminSkipped = useMemo(() => {
    if (!isAdmin || !user) return false;
    return localStorage.getItem(`admin_skip_character_${user.id}`) === "true";
  }, [isAdmin, user]);

  // Busca personagens uma única vez quando o usuário muda
  useEffect(() => {
    if (!user) { setHasCharacters(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const { count, error } = await supabase
          .from("characters")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        if (error) {
          console.error("[DashboardLayout] character count failed:", error);
          if (!cancelled) setHasCharacters(null); // não bloqueia o dashboard em caso de erro
          return;
        }
        if (!cancelled) setHasCharacters((count ?? 0) > 0);
      } catch (err) {
        console.error("[DashboardLayout] character count threw:", err);
        if (!cancelled) setHasCharacters(null);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const countUnread = async () => {
      const { count } = await supabase.from("dm_messages").select("*", { count: "exact", head: true }).eq("receiver_id", user.id).eq("read", false);
      setDmUnread(count || 0);
    };
    countUnread();
    
    const channelId = `dm_unread:${user.id}`;
    const ch = supabase.channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages", filter: `receiver_id=eq.${user.id}` }, countUnread)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    if (!user || !profile) return;
    const key = `daily_login_${user.id}`;
    const today = new Date().toDateString();
    if (localStorage.getItem(key) === today) return;
    localStorage.setItem(key, today);
    supabase.rpc("award_xp_action", { _action: "daily_login", _user_id: user.id, _xp: 25 });
    toast.success(`☀️ Bom dia, ${profile.full_name?.split(" ")[0]}! +25 XP pela sua presença diária!`, { duration: 3500 });
  }, [user, profile]);

  useEffect(() => {
    if (!user || !isAuthenticated) return;
    
    // Ping immediately
    pingPresence();
    
    // Presence interval (every 45s, matching pingPresence debounce)
    const interval = setInterval(pingPresence, 45000); 
    
    // Visibility change listener to ping when coming back to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) pingPresence();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, isAuthenticated, pingPresence]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl animate-float mb-4">⚡</div>
          <p className="font-heading text-muted-foreground uppercase tracking-widest text-xs">Carregando portal...</p>
        </div>
      </div>
    );
  }

  // Se não carregou o perfil após o loading, algo deu errado (ou deslogou)
  if (!profile || !isAuthenticated) {
    return null;
  }

  // Verificações de acesso e onboarding
  if (!profile.approved && !isAdmin) return <ProtectedRoute adminOnly={false}><PendingApproval /></ProtectedRoute>;
  if (!isAdmin && !profile.has_accepted_rules) return <ProtectedRoute adminOnly={false}><RulesAgreement /></ProtectedRoute>;

  // Só bloqueia se hasCharacters for explicitamente false (carregou e viu que não tem)
  // E se não houver um personagem ativo no perfil
  if (hasCharacters === false && !profile.active_character_id && !adminSkipped) {
    return <ProtectedRoute adminOnly={false}><CharacterSelection adminMode={isAdmin} /></ProtectedRoute>;
  }

  // Se ainda está carregando os personagens (hasCharacters === null), mas já passou do isLoading do auth,
  // mostra um loader menor para não dar flash de tela preta
  if (hasCharacters === null && !profile.active_character_id && !adminSkipped) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-4xl animate-pulse text-primary/40">✨</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <AtmosphericBackground />

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 z-30 md:hidden backdrop-blur-sm" 
            onClick={closeSidebar} 
          />
        )}
      </AnimatePresence>

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-[85vw] max-w-[280px] md:w-64 bg-card/98 backdrop-blur-2xl border-r border-border/60 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-[20px_0_60px_rgba(0,0,0,0.9)]" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-border/30">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-primary/20 p-2.5 rounded-xl text-primary transition-transform group-hover:rotate-12 duration-300"><Castle size={24} /></div>
            <span className="font-heading text-xl text-gold-gradient leading-tight tracking-tighter drop-shadow-[0_0_10px_rgba(212,175,55,0.3)] group-hover:scale-105 transition-transform duration-500">Hogwarts<br/>House</span>
          </Link>
        </div>


        <nav className="flex-1 p-3 space-y-6 overflow-y-auto sidebar-scroll">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className="px-3 text-[9px] font-heading font-black uppercase tracking-[0.3em] text-primary/40 mb-3 flex items-center gap-3">
                <span className="w-6 h-[1px] bg-gradient-to-r from-primary/30 to-transparent" />
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item: any) => (
                  <NavItem 
                    key={item.path} 
                    item={item} 
                    isActive={location.pathname === item.path} 
                    dmUnread={dmUnread}
                    onClick={closeSidebar}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border/40 bg-card/80 backdrop-blur-sm">
          <Link 
            to="/dashboard/store" 
            className="flex items-center justify-between px-4 py-3 mb-2 rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-amber-600/20 via-yellow-900/40 to-black hover:border-yellow-300 transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 relative z-10">
              <MagicalGaleon size="xs" />
              <span className="text-[11px] text-yellow-400/90 font-heading uppercase tracking-wider">Galeões</span>
            </div>
            <span className="font-heading text-lg text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] relative z-10">
              {(profile?.galeons || 0).toLocaleString("pt-BR")}
            </span>
          </Link>

          <div className="flex items-center justify-between gap-1 w-full pt-1">
            <Link to="/dashboard/profile" className="flex items-center gap-2 min-w-0 max-w-[140px] hover:bg-primary/5 p-2 rounded-xl transition-all group border border-transparent hover:border-primary/10">
              <div className="relative shrink-0 transition-transform group-hover:scale-105">
                <HouseCrest house={profile?.house} size="sm" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${isUserOnline(profile) ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-muted-foreground"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-tight font-heading truncate text-foreground group-hover:text-primary transition-colors">{profile?.full_name || "Bruxo"}</p>
                <p className="text-[10px] leading-tight text-muted-foreground/60 truncate uppercase tracking-tighter">{house.name}</p>
              </div>
            </Link>

            <div className="flex items-center gap-0.5 shrink-0">
              <TurnSwitcher />
              <AmbientAudio />
              <button
                onClick={() => setSoundOn(toggleSound())}
                className="touch-target w-9 h-9 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all active:scale-90"
                title={soundOn ? "Desativar Som" : "Ativar Som"}
              >{soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
              <Notifications />
              <button
                onClick={async () => { await logout(); navigate("/"); }}
                className="touch-target w-9 h-9 text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-xl transition-all active:scale-90"
                title="Sair"
              ><LogOut size={16} /></button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <NotificationBanner />
        <header className="md:hidden flex items-center justify-between px-3 sm:px-5 h-16 border-b border-white/5 bg-card/60 backdrop-blur-3xl sticky top-0 z-[60] shadow-xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary active:scale-90 transition-all rounded-xl bg-white/5 border border-white/5"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <span className="font-heading text-xs sm:text-sm text-gold-gradient tracking-tight leading-none">Hogwarts</span>
              <span className="text-[7px] sm:text-[8px] text-primary/60 uppercase tracking-[0.2em] font-black">Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
              <Link to="/dashboard/wallet" className="h-9 px-3 sm:px-4 rounded-xl border border-primary/20 bg-primary/10 text-primary flex items-center gap-1.5 sm:gap-2 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                <MagicalGaleon size="xs" />
                <span className="font-heading text-[10px] sm:text-xs tracking-tight">{(profile?.galeons || 0).toLocaleString("pt-BR")}</span>
              </Link>
             <Notifications />
              <Link to="/dashboard/profile" className="w-9 h-9 rounded-lg overflow-hidden border border-primary/30 active:scale-95 transition-all">
                <SafeImage src={profile?.avatar_url} alt={profile?.full_name || "Avatar"} className="w-full h-full object-cover" />
              </Link>
          </div>
        </header>


        <div className="flex-1 overflow-y-auto relative scroll-smooth contain-strict pb-safe custom-scrollbar">
          <div className="page-container px-3 sm:px-6 pt-4 sm:pt-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <MagicalClock />
            </div>

            
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="pb-32 md:pb-24"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <BottomNav />
        <PWAInstallPrompt />
      </main>
    </div>
  );
}
