import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useImmersion } from "@/hooks/core/useImmersion";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, Castle } from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HouseCrest from "@/components/rpg/HouseCrest";
import MagicalGaleon from "@/components/shared/MagicalGaleon";
import { HOUSES } from "@/types/house";
import { type House } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import Notifications from "@/components/Notifications";
import PendingApproval from "@/pages/PendingApproval";
import RulesAgreement from "@/pages/RulesAgreement";
import CharacterSelection from "@/pages/CharacterSelection";
import CastleEntrance from "@/pages/CastleEntrance";
import NotificationBanner from "@/components/NotificationBanner";
import { useAchievements } from "@/hooks/features/useAchievements";
import TurnSwitcher from "@/components/TurnSwitcher";
import SafeImage from "@/components/SafeImage";
import BottomNav from "@/components/BottomNav";
import { NAV_GROUPS, ADMIN_GROUP } from "@/constants/navigation";
import { AtmosphericBackground } from "@/components/shared/AtmosphericBackground";
import { MagicalClock } from "@/components/shared/MagicalClock";
import MagicalParticles from "@/components/MagicalParticles";
import AmbientAudio from "@/components/AmbientAudio";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import DailyRPSlot from "@/components/DailyRPSlot";
import MagicalCelebration from "@/components/MagicalCelebration";
import LevelUpCeremony from "@/components/LevelUpCeremony";
import HouseGhost from "@/components/HouseGhost";
import MagicalMentor from "@/components/shared/MagicalMentor";
import { BirthdayGlobalCelebration } from "@/components/BirthdayGlobalCelebration";
import { prefetchRoute } from "@/lib/routePrefetch";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { initOneSignal, loginToOneSignal } from "@/lib/onesignal";


import EmojiIcon from "@/components/shared/EmojiIcon";
const NavItem = memo(({ item, isActive, dmUnread, onClick }: { item: any, isActive: boolean, dmUnread: number, onClick: () => void }) => (
  <Link
    to={item.path}
    onClick={onClick}
    onMouseEnter={() => prefetchRoute(item.path)}
    onTouchStart={() => prefetchRoute(item.path)}
    onFocus={() => prefetchRoute(item.path)}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden border ${
      isActive 
        ? "bg-primary/15 text-primary font-bold border-primary/40 shadow-[0_0_25px_rgba(212,175,55,0.18)]" 
        : "text-foreground/85 hover:bg-white/10 hover:text-foreground border-transparent active:scale-95"
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
    <span className={`font-heading text-[11px] uppercase tracking-[0.14em] relative z-10 transition-all duration-300 ${isActive ? "text-primary" : "group-hover:translate-x-1"}`}>
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
  const [dmUnread, setDmUnread] = useState(0);
  const [hasCharacters, setHasCharacters] = useState<boolean | null>(null);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  useAchievements(user?.id, profile?.xp ?? 0, profile?.level ?? 1);
  const house = useMemo(() => HOUSES[(profile?.house as House) || "gryffindor"] || HOUSES.gryffindor, [profile?.house]);
  const groups = useMemo(() => isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS, [isAdmin]);

  useEffect(() => {
    if (sidebarOpen) cast('door');
  }, [sidebarOpen, cast]);

  // Faz upload do avatar pendente do cadastro (precisa de sessão ativa para passar pelo RLS do storage)
  useEffect(() => {
    if (!user?.id) return;
    const raw = localStorage.getItem("pending_avatar_upload");
    if (!raw) return;
    (async () => {
      try {
        const { dataUrl, name } = JSON.parse(raw);
        if (!dataUrl) { localStorage.removeItem("pending_avatar_upload"); return; }
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const mimeToExt: Record<string, string> = {
          "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
        };
        const ext = mimeToExt[blob.type] || (name?.split(".").pop() || "jpg").toLowerCase();
        const path = `${user.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg", cacheControl: "3600" });
        if (upErr) {
          console.error("Pending avatar upload failed:", upErr);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        await supabase.from("profiles").update({ avatar_url: `${publicUrl}?t=${Date.now()}` } as any).eq("user_id", user.id);
      } catch (err) { console.error("Pending avatar processing error:", err); }
      finally { localStorage.removeItem("pending_avatar_upload"); }
    })();
  }, [user?.id]);

  // OneSignal Init and Login
  useEffect(() => {
    if (user?.id) {
      loginToOneSignal(user.id);
    }
  }, [user?.id]);

  // 🎁 Starter pack para novos usuários (auto-claim 1x: +200 galeões, +50 XP)
  useEffect(() => {
    if (!user?.id) return;
    const key = `starter_claimed_${user.id}`;
    if (localStorage.getItem(key)) return;
    (async () => {
      try {
        const { data } = await supabase.rpc("claim_starter_pack" as any, { _user_id: user.id });
        const r = data as any;
        if (r?.ok) {
          const { toast } = await import("sonner");
          toast.success(`🎁 Bem-vindo! +${r.galeons} galeões e +${r.xp} XP para começar sua jornada!`, { duration: 6000 });
        }
      } catch (e) {
        console.warn("starter_pack failed", e);
      } finally {
        localStorage.setItem(key, "1");
      }
    })();
  }, [user?.id]);
  
  // Faz upload da identidade facial pendente do cadastro
  useEffect(() => {
    if (!user?.id) return;
    const { setFaciallyValidated } = useAuth.getState();
    const dataUrl = localStorage.getItem("pending_facial_id");
    if (!dataUrl) return;
    (async () => {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const path = `${user.id}/identity.jpg`;
        const { error: upErr } = await supabase.storage
          .from("facial-ids")
          .upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
        if (upErr) {
          console.error("Pending facial ID upload failed:", upErr);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from("facial-ids").getPublicUrl(path);
        await supabase.from("profiles").update({ 
          facial_identity_url: publicUrl,
          facial_verification_enabled: true 
        } as any).eq("user_id", user.id);
        setFaciallyValidated(true);
      } catch (err) { console.error("Pending facial ID processing error:", err); }
      finally { localStorage.removeItem("pending_facial_id"); }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user) { setHasCharacters(null); return; }
    let cancelled = false;
    const run = async () => {
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
    };
    run();
    const ch = supabase
      .channel(`dash-characters-${user.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters", filter: `user_id=eq.${user.id}` },
        () => { run(); }
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const countUnread = async () => {
      const { count } = await supabase.from("dm_messages").select("*", { count: "exact", head: true }).eq("receiver_id", user.id).eq("read", false);
      setDmUnread(count || 0);
    };
    countUnread();
    
    const channelId = `dm_unread:${user.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
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
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl animate-float mb-4"><EmojiIcon e="⚡" /></div>
          <p className="font-heading text-muted-foreground uppercase tracking-widest text-xs">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!profile || !isAuthenticated) return null;
  if (!profile.approved && !isAdmin) return <ProtectedRoute adminOnly={false}><PendingApproval /></ProtectedRoute>;
  if (!isAdmin && !profile.has_accepted_rules) return <ProtectedRoute adminOnly={false}><RulesAgreement /></ProtectedRoute>;
  // Admin nunca é obrigado a criar ficha — pode acessar o portal livremente
  // BLOCKER FIX: gate por OR + tratar null (erro de fetch) como sem personagem para não vazar usuário pro dashboard quebrado
  if (!isAdmin && (hasCharacters !== true || !profile.active_character_id)) {
    return <ProtectedRoute adminOnly={false}><CharacterSelection adminMode={isAdmin} /></ProtectedRoute>;
  }
  // Cena cinematográfica de entrada no castelo — exibida uma única vez após a primeira ficha
  if (!isAdmin && profile.active_character_id && (profile as any).has_seen_intro === false) {
    return <ProtectedRoute adminOnly={false}><CastleEntrance /></ProtectedRoute>;
  }

  return (
    <div className="flex h-dvh-screen overflow-hidden relative bg-black">
      <AtmosphericBackground />
      <MagicalParticles />

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

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-[85vw] max-w-[280px] md:w-64 bg-gradient-to-b from-[#1a0f05]/95 via-[#0f0a05]/90 to-[#0a0604]/95 backdrop-blur-3xl border-r border-primary/30 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:translate-x-0 shadow-[8px_0_40px_rgba(0,0,0,0.6)] ${sidebarOpen ? "translate-x-0 shadow-[20px_0_80px_rgba(0,0,0,0.95)]" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-primary/10">
          <Link to="/dashboard" className="flex items-center gap-4 group">
            <div className="bg-primary/20 p-3 rounded-2xl text-primary transition-all group-hover:rotate-[360deg] group-hover:scale-110 duration-1000 shadow-[0_0_20px_rgba(212,175,55,0.2)]"><Castle size={28} /></div>
            <span className="font-heading text-2xl text-gold-gradient leading-tight tracking-tighter drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] group-hover:scale-105 transition-transform duration-700">Hogwarts<br/><span className="text-sm tracking-[0.3em] font-black uppercase opacity-70">House</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-6 overflow-y-auto sidebar-scroll">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className="px-4 text-[10px] font-heading font-black uppercase tracking-[0.35em] text-primary/70 mb-4 flex items-center gap-3">
                <span className="w-6 h-[1px] bg-gradient-to-r from-primary/60 to-transparent" />
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

        <div className="p-5 border-t border-primary/10 bg-black/20 backdrop-blur-2xl relative z-50">
          <Link 
            to="/dashboard/store" 
            className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 mb-4 rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-amber-600/10 via-yellow-900/30 to-black/80 hover:border-yellow-400/60 hover:-translate-y-1 transition-all group overflow-hidden relative shadow-2xl"
          >
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 sm:gap-3 relative z-10 min-w-0">
              <MagicalGaleon size="xs" className="animate-pulse shrink-0" />
              <span className="text-[9px] sm:text-[10px] text-yellow-400/80 font-heading uppercase tracking-[0.1em] sm:tracking-[0.2em] truncate">Tesouro</span>
            </div>
            <span className="font-heading text-lg sm:text-xl text-yellow-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] relative z-10 ml-2">
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
                <p className="text-[10px] leading-tight text-foreground/65 truncate uppercase tracking-tighter">{house.name}</p>
              </div>
            </Link>
            <div className="flex items-center gap-0.5 shrink-0">
              <TurnSwitcher />
              <AmbientAudio />
              <Notifications />
              <button
                onClick={async () => { await logout(); navigate("/"); }}
                className="touch-target w-10 h-10 text-foreground/85 hover:bg-destructive/25 hover:text-destructive rounded-xl transition-all active:scale-90"
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

        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div
            className="page-container pt-14 sm:pt-8"
            style={{
              paddingLeft: "max(0.75rem, env(safe-area-inset-left, 0px))",
              paddingRight: "max(0.75rem, env(safe-area-inset-right, 0px))",
            }}
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <MagicalClock />
            </div>

            <div className="mb-6">
              <DailyRPSlot />
            </div>

            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pb-bottom-nav md:pb-24"
            >
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </motion.div>
          </div>
        </div>
        <BottomNav />
      </main>
      <MagicalCelebration />
      <LevelUpCeremony />
      <HouseGhost />
      <MagicalMentor />
      <BirthdayGlobalCelebration />
      <PWAInstallPrompt />
    </div>

  );
}
