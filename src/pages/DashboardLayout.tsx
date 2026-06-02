import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useImmersion } from "@/hooks/core/useImmersion";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Volume2, VolumeX, Menu, Castle } from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HouseCrest from "@/components/rpg/HouseCrest";
import MagicalGaleon from "@/components/shared/MagicalGaleon";
import { HOUSES } from "@/types/house";
import { type House } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { isSoundEnabled, toggleSound } from "@/services/core/soundService";
import Notifications from "@/components/Notifications";
import PendingApproval from "@/pages/PendingApproval";
import RulesAgreement from "@/pages/RulesAgreement";
import CharacterSelection from "@/pages/CharacterSelection";
import NotificationBanner from "@/components/NotificationBanner";
import { useAchievements } from "@/hooks/features/useAchievements";
import TurnSwitcher from "@/components/TurnSwitcher";
import SafeImage from "@/components/SafeImage";
import BottomNav from "@/components/BottomNav";
import { NAV_GROUPS, ADMIN_GROUP } from "@/constants/navigation";
import { AtmosphericBackground } from "@/components/shared/AtmosphericBackground";
import { MagicalClock } from "@/components/shared/MagicalClock";
import AmbientAudio from "@/components/AmbientAudio";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const NavItem = memo(({ item, isActive, dmUnread, onClick }: { item: any, isActive: boolean, dmUnread: number, onClick: () => void }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden border ${
      isActive 
        ? "bg-primary/10 text-primary font-bold border-primary/30 shadow-[0_0_25px_rgba(212,175,55,0.15)]" 
        : "text-muted-foreground/60 hover:bg-white/5 hover:text-foreground border-transparent active:scale-95"
    }`}
  >
    {isActive && (
      <motion.div 
        layoutId="active-nav-indicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-primary rounded-r-full shadow-[0_0_15px_rgba(212,175,55,0.9)]"
      />
    )}
    <span className={`relative z-10 transition-all duration-500 ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" : "group-hover:scale-110 group-hover:text-primary/80"}`}>
      {item.icon}
    </span>
    <span className={`font-heading text-[10px] uppercase tracking-[0.15em] relative z-10 transition-all duration-300 ${isActive ? "text-primary" : "group-hover:translate-x-1"}`}>
      {item.label}
    </span>
    {item.label === "Mensagens" && dmUnread > 0 && (
      <span className="ml-auto min-w-[20px] h-[20px] px-1 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-black relative z-10 shadow-[0_0_15px_rgba(212,175,55,0.5)] animate-pulse">
        {dmUnread > 9 ? "9+" : dmUnread}
      </span>
    )}
  </Link>
));

export default function DashboardLayout() {
  const { user, profile, isAdmin, isLoading, isAuthenticated, logout, pingPresence } = useAuth();
  const { cast } = useImmersion();
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

  useEffect(() => {
    if (sidebarOpen) cast('door');
  }, [sidebarOpen, cast]);

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
          if (!cancelled) setHasCharacters(null);
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
    if (!user || !isAuthenticated) return;
    pingPresence();
    const interval = setInterval(pingPresence, 45000); 
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

  if (!profile || !isAuthenticated) return null;
  if (!profile.approved && !isAdmin) return <ProtectedRoute adminOnly={false}><PendingApproval /></ProtectedRoute>;
  if (!isAdmin && !profile.has_accepted_rules) return <ProtectedRoute adminOnly={false}><RulesAgreement /></ProtectedRoute>;
  // Admin pode pular a seleção de personagem via flag persistido em localStorage
  const adminSkippedCharacter = isAdmin && user && typeof window !== "undefined" && localStorage.getItem(`admin_skip_character_${user.id}`) === "true";
  if (hasCharacters === false && !profile.active_character_id && !adminSkippedCharacter) return <ProtectedRoute adminOnly={false}><CharacterSelection adminMode={isAdmin} /></ProtectedRoute>;

  return (
    <div className="flex h-screen overflow-hidden relative bg-black">
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

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-[85vw] max-w-[280px] md:w-64 bg-card/45 backdrop-blur-3xl border-r border-primary/15 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-[20px_0_80px_rgba(0,0,0,0.95)]" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-primary/10">
          <Link to="/dashboard" className="flex items-center gap-4 group">
            <div className="bg-primary/20 p-3 rounded-2xl text-primary transition-all group-hover:rotate-[360deg] group-hover:scale-110 duration-1000 shadow-[0_0_20px_rgba(212,175,55,0.2)]"><Castle size={28} /></div>
            <span className="font-heading text-2xl text-gold-gradient leading-tight tracking-tighter drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] group-hover:scale-105 transition-transform duration-700">Hogwarts<br/><span className="text-sm tracking-[0.3em] font-black uppercase opacity-70">House</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-6 overflow-y-auto sidebar-scroll">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className="px-4 text-[9px] font-heading font-black uppercase tracking-[0.4em] text-primary/30 mb-4 flex items-center gap-4">
                <span className="w-8 h-[1px] bg-gradient-to-r from-primary/40 to-transparent" />
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

        <div className="p-5 border-t border-primary/10 bg-black/20 backdrop-blur-2xl">
          <Link 
            to="/dashboard/store" 
            className="flex items-center justify-between px-5 py-4 mb-4 rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-amber-600/10 via-yellow-900/30 to-black/80 hover:border-yellow-400/60 hover:-translate-y-1 transition-all group overflow-hidden relative shadow-2xl"
          >
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 relative z-10">
              <MagicalGaleon size="xs" className="animate-pulse" />
              <span className="text-[10px] text-yellow-400/80 font-heading uppercase tracking-[0.2em]">Tesouro</span>
            </div>
            <span className="font-heading text-xl text-yellow-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] relative z-10">
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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <NotificationBanner />

        {/* Hamburger mobile (visível somente em telas pequenas) */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
          className="md:hidden fixed top-3 left-3 z-30 w-10 h-10 rounded-xl bg-card/70 backdrop-blur-md border border-primary/20 flex items-center justify-center text-primary shadow-lg active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <div className="flex-1 overflow-y-auto relative scroll-smooth contain-strict pb-safe custom-scrollbar">
          <div className="page-container px-3 sm:px-6 pt-4 sm:pt-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <MagicalClock />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                onViewportEnter={() => cast('whoosh', { haptic: false, volume: 0.3 })}
                initial={{ opacity: 0, y: 15, scale: 0.98, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -15, scale: 0.98, filter: "blur(12px)" }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="pb-32 md:pb-24"
              >
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <BottomNav />
      </main>
    </div>
  );
}
