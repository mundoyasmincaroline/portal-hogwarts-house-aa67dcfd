import { useState, useEffect, useMemo, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Castle, BookOpen, User, MessageCircle, Camera, Trophy,
  Shield, Swords, Library, ShoppingBag, ScrollText,
  LogOut, Volume2, VolumeX, Menu, Users,
  Lock, Wallet, Sparkles, Zap, Image as ImageIcon,
  GraduationCap
} from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import HouseCrest from "@/components/HouseCrest";
import MagicalIcon from "@/components/MagicalIcon";
import MagicalEmoji from "@/components/MagicalEmoji";
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

const NAV_GROUPS = [
  {
    title: "Mundo Bruxo",
    items: [
      { icon: <MagicalIcon icon={Castle} size="xs" color="#60a5fa" />, label: "O Castelo", path: "/dashboard" },
      { icon: <MagicalIcon icon={BookOpen} size="xs" color="#10b981" />, label: "Guia do Maroto", path: "/dashboard/guide" },
      { icon: <MagicalIcon icon={Users} size="xs" color="#ec4899" />, label: "Amigos", path: "/dashboard/friends" },
      { icon: <MagicalIcon icon={Library} size="xs" color="#94a3b8" />, label: "Membros", path: "/dashboard/members" },
    ]
  },
  {
    title: "Atividades",
    items: [
      { icon: <MagicalIcon icon={Swords} size="xs" color="#ef4444" />, label: "Chats RPG", path: "/dashboard/chats" },
      { icon: <MagicalIcon icon={Camera} size="xs" color="#f43f5e" />, label: "InstaHogwarts", path: "/dashboard/instahogwarts" },
      { icon: <MagicalIcon icon={Zap} size="xs" color="#a855f7" />, label: "Desafios", path: "/dashboard/challenges" },
      { icon: <MagicalIcon icon={Sparkles} size="xs" color="#f472b6" />, label: "Eventos", path: "/dashboard/events" },
      { icon: <MagicalIcon icon={GraduationCap} size="xs" color="#3b82f6" />, label: "Aulas", path: "/dashboard/classes" },
    ]
  },
  {
    title: "Economia & Itens",
    items: [
      { icon: <MagicalIcon icon={ImageIcon} size="xs" color="#94a3b8" />, label: "Álbum", path: "/dashboard/album" },
      { icon: <MagicalIcon icon={ShoppingBag} size="xs" color="#f59e0b" />, label: "Loja", path: "/dashboard/store" },
      { icon: <MagicalIcon icon={Wallet} size="xs" color="#10b981" />, label: "Carteira", path: "/dashboard/wallet" },
    ]
  },
  {
    title: "Hogwarts",
    items: [
      { icon: <MagicalIcon icon={Trophy} size="xs" color="#fbbf24" />, label: "Ranking", path: "/dashboard/ranking" },
      { icon: <MagicalIcon icon={Shield} size="xs" color="#10b981" />, label: "Casas", path: "/dashboard/houses" },
      { icon: <MagicalIcon icon={ScrollText} size="xs" color="#94a3b8" />, label: "Regras", path: "/dashboard/rules" },
      { icon: <MagicalIcon icon={Lock} size="xs" color="#ef4444" />, label: "Azkaban", path: "/dashboard/azkaban" },
    ]
  }
];

const ADMIN_GROUP = {
  title: "Administração",
  items: [
    { icon: <MagicalEmoji emoji="⚙️" size="xs" />, label: "Painel Admin", path: "/dashboard/admin" },
    { icon: <MagicalEmoji emoji="💰" size="xs" />, label: "Gestão Financeira", path: "/dashboard/admin/finance" },
  ]
};

export default function DashboardLayout() {
  const { user, profile, isAdmin, isLoading, logout, pingPresence } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [dmUnread, setDmUnread] = useState(0);
  const [hasCharacters, setHasCharacters] = useState<boolean | null>(null);

  useAchievements(user?.id, profile?.xp ?? 0, profile?.level ?? 1);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { count } = await supabase.from("characters").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      setHasCharacters((count ?? 0) > 0);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const countUnread = async () => {
      const { count } = await supabase.from("dm_messages").select("*", { count: "exact", head: true }).eq("receiver_id", user.id).eq("read", false);
      setDmUnread(count || 0);
    };
    countUnread();
    const ch = (supabase.channel("dm_unread_badge") as any)
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages" }, countUnread)
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
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    pingPresence();
    const interval = setInterval(pingPresence, 60000); // 1 minute is enough for presence
    return () => {
      clearInterval(interval);
      // Don't force offline on every tiny re-render or layout shift, only on true unmount if possible
      // but in SPA, layout stays. We rely on last_seen.
    };
  }, [user, pingPresence]);

  if (isLoading || hasCharacters === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl animate-float mb-4">⚡</div>
          <p className="font-heading text-muted-foreground">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (profile && !profile.approved && !isAdmin) return <PendingApproval />;
  if (profile && !isAdmin && !profile.has_accepted_rules) return <RulesAgreement />;

  const adminSkipped = isAdmin && user && localStorage.getItem(`admin_skip_character_${user.id}`) === "true";


  if ((!profile.active_character_id || !hasCharacters) && !adminSkipped) {
    return <CharacterSelection adminMode={isAdmin} />;
  }

  const house = useMemo(() => HOUSES[profile.house as House] || HOUSES.gryffindor, [profile.house]);
  const groups = useMemo(() => isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS, [isAdmin]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <AmbientAudio />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 z-30 md:hidden" onClick={closeSidebar} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg text-primary"><Castle size={24} /></div>
            <span className="font-heading text-lg text-gold-gradient leading-tight">Hogwarts<br/>House</span>
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
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
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
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Mobile Profile & DM shortcuts in sidebar if needed, but they are already at the bottom */}
          <div className="pt-2">
            <Link
              to="/dashboard/profile"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                location.pathname === "/dashboard/profile" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground/80 hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              <MagicalIcon icon={User} size="xs" color="#a855f7" />
              <span className="font-heading text-xs">Meu Perfil</span>
            </Link>
            <Link
              to="/dashboard/dm"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group mt-1 ${
                location.pathname === "/dashboard/dm" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground/80 hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              <MagicalIcon icon={MessageCircle} size="xs" color="#3b82f6" />
              <span className="font-heading text-xs">Mensagens</span>
              {dmUnread > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-bold animate-pulse">
                  {dmUnread}
                </span>
              )}
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm">
          <Link to="/dashboard/store" className="flex items-center justify-between px-4 py-3 mb-2 rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-amber-600/20 via-yellow-900/40 to-black hover:border-yellow-300 transition-all group">
            <div className="flex items-center gap-2">
              <MagicalGaleon size="xs" />
              <span className="text-[11px] text-yellow-400/90 font-heading uppercase tracking-wider">Galeões</span>
            </div>
            <span className="font-heading text-lg text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
              {(profile.galeons || 0).toLocaleString("pt-BR")}
            </span>
          </Link>

          {profile.vip_plan && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl border border-yellow-500/40 bg-gradient-to-r from-yellow-900/20 to-amber-900/10">
              <span className="text-base">✨</span>
              <span className="text-[11px] text-yellow-400 font-heading capitalize">{profile.vip_plan} Ativo</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-1 w-full flex-wrap">
            <Link to="/dashboard/profile" className="flex items-center gap-2 max-w-[120px] hover:bg-secondary/50 p-1.5 rounded-lg transition-colors group">
              <div className="relative shrink-0">
                <HouseCrest house={profile.house} size="sm" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${isUserOnline(profile) ? "bg-green-500" : "bg-muted-foreground"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-tight font-heading truncate text-foreground group-hover:text-primary" title={profile.full_name}>{profile.full_name}</p>
                <p className="text-[10px] leading-tight text-muted-foreground truncate">{house.name}</p>
              </div>
            </Link>

            <div className="flex items-center gap-1 shrink-0">
              <TurnSwitcher />
              <button
                onClick={() => setSoundOn(toggleSound())}
                className="p-1.5 text-muted-foreground hover:bg-secondary/80 hover:text-primary rounded-md"
                title={soundOn ? "Desativar Som" : "Ativar Som"}
              >{soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
              <div className="scale-90 origin-center"><Notifications /></div>
              <button
                onClick={async () => { await logout(); navigate("/"); }}
                className="p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-md"
                title="Sair"
              ><LogOut size={14} /></button>
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

        <div className="flex-1 overflow-y-auto relative scroll-smooth">
          <DailyProphetTicker />
          <div className="page-container">
            <div className="mb-8">
              <HouseCupWidget />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="pb-20"
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
