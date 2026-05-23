import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Volume2, VolumeX, Menu, Castle
} from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import HouseCrest from "@/components/HouseCrest";
import MagicalGaleon from "@/components/MagicalGaleon";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { isSoundEnabled, toggleSound } from "@/lib/sounds";
import { toast } from "sonner";

import Notifications from "@/components/Notifications";
import PendingApproval from "@/pages/PendingApproval";
import RulesAgreement from "@/pages/RulesAgreement";
import CharacterSelection from "@/pages/CharacterSelection";
import NotificationBanner from "@/components/NotificationBanner";
import { useAchievements } from "@/lib/useAchievements";
import HouseCupWidget from "@/components/HouseCupWidget";
import DailyProphetTicker from "@/components/DailyProphetTicker";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import AmbientAudio from "@/components/AmbientAudio";
import TurnSwitcher from "@/components/TurnSwitcher";
import SafeImage from "@/components/SafeImage";
import { NAV_GROUPS, ADMIN_GROUP } from "@/constants/navigation";

// Memoized Nav Item for performance
const NavItem = memo(({ item, isActive, dmUnread, onClick }: { item: any, isActive: boolean, dmUnread: number, onClick: () => void }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden ${
      isActive 
        ? "bg-primary/10 text-primary font-bold border border-primary/20 shadow-[inset_0_0_20px_rgba(212,175,55,0.05)]" 
        : "text-muted-foreground/80 hover:bg-secondary/40 hover:text-foreground"
    }`}
  >
    {isActive && (
      <motion.div 
        layoutId="active-nav-glow"
        className="absolute inset-0 bg-primary/5 blur-sm"
      />
    )}
    <span className={`relative z-10 transition-transform group-hover:scale-110 duration-300 ${isActive ? "scale-110" : ""}`}>{item.icon}</span>
    <span className="font-heading text-xs relative z-10">{item.label}</span>
    {item.label === "Mensagens" && dmUnread > 0 && (
      <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-bold relative z-10 animate-pulse">
        {dmUnread > 9 ? "9+" : dmUnread}
      </span>
    )}
  </Link>
));

export default function DashboardLayout() {
  const { user, profile, isAdmin, isLoading, logout, pingPresence } = useAuth();
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

  // Busca personagens uma única vez quando o usuário muda
  useEffect(() => {
    if (!user) { setHasCharacters(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const { count } = await supabase
          .from("characters")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        if (!cancelled) setHasCharacters((count ?? 0) > 0);
      } catch {
        if (!cancelled) setHasCharacters(false);
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
    if (!user) return;
    pingPresence();
    const interval = setInterval(pingPresence, 60000); 
    return () => clearInterval(interval);
  }, [user, pingPresence]);

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
  if (!profile) {
    return null;
  }

  // Verificações de acesso e onboarding
  if (!profile.approved && !isAdmin) return <PendingApproval />;
  if (!isAdmin && !profile.has_accepted_rules) return <RulesAgreement />;

  const adminSkipped = isAdmin && user && localStorage.getItem(`admin_skip_character_${user.id}`) === "true";

  // Só bloqueia se hasCharacters for explicitamente false (carregou e viu que não tem)
  // E se não houver um personagem ativo no perfil
  if (hasCharacters === false && !profile.active_character_id && !adminSkipped) {
    return <CharacterSelection adminMode={isAdmin} />;
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
      <AmbientAudio />

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

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 bg-card border-r border-border/40 flex flex-col transition-all duration-500 ease-in-out md:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-[20px_0_60px_rgba(0,0,0,0.9)]" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-border/30">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-primary/20 p-2.5 rounded-xl text-primary transition-transform group-hover:rotate-12 duration-300"><Castle size={24} /></div>
            <span className="font-heading text-xl text-gold-gradient leading-tight tracking-tighter">Hogwarts<br/>House</span>
          </Link>
        </div>


        <nav className="flex-1 p-3 space-y-6 overflow-y-auto scrollbar-hide">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className="px-3 text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-border" />
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

        <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm">
          <Link to="/dashboard/store" className="flex items-center justify-between px-4 py-3 mb-2 rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-amber-600/20 via-yellow-900/40 to-black hover:border-yellow-300 transition-all group">
            <div className="flex items-center gap-2">
              <MagicalGaleon size="xs" />
              <span className="text-[11px] text-yellow-400/90 font-heading uppercase tracking-wider">Galeões</span>
            </div>
            <span className="font-heading text-lg text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
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
        <header className="md:hidden flex items-center justify-between px-4 h-18 border-b border-white/5 bg-card/60 backdrop-blur-2xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="touch-target w-12 h-12 -ml-2 text-muted-foreground hover:text-primary active:scale-90 transition-all rounded-2xl hover:bg-primary/10 border border-transparent active:border-primary/20"
            >
              <Menu size={24} />
            </button>
            <span className="font-heading text-lg text-gold-gradient tracking-tighter">Hogwarts House</span>
          </div>
          <div className="flex items-center gap-3">
             <Notifications />
              <Link to="/dashboard/profile" className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-[0_0_20px_rgba(212,175,55,0.25)] active:scale-95 transition-all">
                <SafeImage src={profile?.avatar_url} alt={profile?.full_name || "Avatar"} className="w-full h-full object-cover" />
              </Link>
          </div>
        </header>


        <div className="flex-1 overflow-y-auto relative scroll-smooth contain-strict">
          <DailyProphetTicker />
          <div className="page-container">
            <div className="mb-8">
              <HouseCupWidget />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="pb-24 md:pb-20"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
          <PWAInstallPrompt />
        </div>
      </main>
    </div>
  );
}
