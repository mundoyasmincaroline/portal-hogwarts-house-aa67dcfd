import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Castle, BookOpen, User, MessageCircle, Camera, Film, Trophy,
  Shield, Swords, BookMarked, Library, ShoppingBag, ScrollText,
  Settings, LogOut, Volume2, VolumeX, RefreshCw, Menu, Users,
  Coins, Lock, Wallet, Map as MapIcon, Sparkles, Zap, Image as ImageIcon,
  MessageSquare, Crown, Newspaper, Coffee, GraduationCap, Train
} from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import HouseCrest from "@/components/HouseCrest";
import MagicalIcon from "@/components/MagicalIcon";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { playMagicSound, isSoundEnabled, toggleSound } from "@/lib/sounds";
import { toast } from "sonner";

import Notifications from "@/components/Notifications";
import InterstitialAd from "@/components/InterstitialAd";
import MagicalEmoji from "@/components/MagicalEmoji";

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
import HouseCupWidget from "@/components/HouseCupWidget";
import MagicalAtmosphere from "@/components/MagicalAtmosphere";
import DailyProphetTicker from "@/components/DailyProphetTicker";
import Corujoteca from "@/components/Corujoteca";
import MagicalEncounters from "@/components/MagicalEncounters";
import FilchShadow from "@/components/FilchShadow";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";


const NAV_ITEMS = [
  { icon: <MagicalIcon icon={Castle} size="xs" color="#60a5fa" />, label: "O Castelo", path: "/dashboard" },
  { icon: <MagicalIcon icon={MapIcon} size="xs" color="#f59e0b" />, label: "Mapa do Maroto", isMap: true },
  { icon: <MagicalIcon icon={BookOpen} size="xs" color="#10b981" />, label: "Guia do Maroto", path: "/dashboard/guide" },
  { icon: <MagicalIcon icon={User} size="xs" color="#a855f7" />, label: "Meu Perfil", path: "/dashboard/profile" },
  { icon: <MagicalIcon icon={MessageCircle} size="xs" color="#3b82f6" />, label: "Mensagens", path: "/dashboard/dm" },
  { icon: <MagicalIcon icon={Users} size="xs" color="#ec4899" />, label: "Amigos", path: "/dashboard/friends" },
  { icon: <MagicalIcon icon={Library} size="xs" color="#94a3b8" />, label: "Membros", path: "/dashboard/members" },
  { icon: <MagicalIcon icon={Swords} size="xs" color="#ef4444" />, label: "Chats RPG", path: "/dashboard/chats" },
  { icon: <MagicalIcon icon={Camera} size="xs" color="#f43f5e" />, label: "InstaHogwarts", path: "/dashboard/instahogwarts" },
  { icon: <MagicalIcon icon={Film} size="xs" color="#fb923c" />, label: "Hogwarts Cine", path: "/dashboard/cinema" },
  { icon: <MagicalIcon icon={Trophy} size="xs" color="#fbbf24" />, label: "Ranking", path: "/dashboard/ranking" },
  { icon: <MagicalIcon icon={Shield} size="xs" color="#10b981" />, label: "Casas", path: "/dashboard/houses" },
  { icon: <MagicalIcon icon={Zap} size="xs" color="#a855f7" />, label: "Desafios", path: "/dashboard/challenges" },
  { icon: <MagicalIcon icon={Sparkles} size="xs" color="#d4af37" />, label: "Sagas de Hogwarts", path: "/dashboard/sagas" },
  { icon: <MagicalIcon icon={Sparkles} size="xs" color="#f472b6" />, label: "Eventos Mágicos", path: "/dashboard/events" },
  { icon: <MagicalIcon icon={GraduationCap} size="xs" color="#3b82f6" />, label: "Aulas", path: "/dashboard/classes" },
  { icon: <MagicalIcon icon={ImageIcon} size="xs" color="#94a3b8" />, label: "Álbum", path: "/dashboard/album" },
  { icon: <MagicalIcon icon={ShoppingBag} size="xs" color="#f59e0b" />, label: "Loja", path: "/dashboard/shop" },
  { icon: <MagicalIcon icon={Wallet} size="xs" color="#10b981" />, label: "Carteira", path: "/dashboard/wallet" },
  { icon: <MagicalIcon icon={ScrollText} size="xs" color="#94a3b8" />, label: "Regras", path: "/dashboard/rules" },
  { icon: <MagicalIcon icon={Lock} size="xs" color="#ef4444" />, label: "Azkaban", path: "/dashboard/azkaban" },
];


const ADMIN_ITEMS = [
  { icon: <MagicalEmoji emoji="⚙️" size="xs" />, label: "Admin", path: "/dashboard/admin" },
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

  // Auto-conquistas baseadas em XP e nível
  useAchievements(user?.id, profile?.xp ?? 0, profile?.level ?? 1);

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

  if (!user || !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-4">🔮</div>
          <p className="font-heading text-muted-foreground text-lg">Despertando sua magia...</p>
          <p className="text-xs text-muted-foreground/50 mt-2">Se esta tela persistir por muito tempo, verifique sua conexão.</p>
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
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl animate-float mb-4">⚡</div>
          <p className="font-heading text-muted-foreground">Carregando personagens...</p>
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
    <div className="flex h-screen bg-black overflow-hidden relative">
      <MagicalAtmosphere />
      <AmbientSoundController currentPath={location.pathname} />

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
              return item.isMap ? (
                <button
                  key={item.label}
                  onClick={() => {
                    playMagicSound();
                    setMapOpen(true);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                >
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">{item.icon}</span>
                  <span className="font-heading text-sm">{item.label}</span>
                </button>
              ) : (
                <Link
                  key={item.path}
                  to={item.path!}
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
          <Link to="/dashboard/store" className="flex items-center justify-between px-4 py-3 mb-2 rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-amber-600/20 via-yellow-900/40 to-black hover:border-yellow-300 transition-all group shadow-[0_0_15px_rgba(251,191,36,0.1)] hover:shadow-[0_0_25px_rgba(251,191,36,0.2)]">
            <div className="flex items-center gap-2">
              <MagicalGaleon size="xs" />
              <span className="text-[11px] text-yellow-400/90 font-heading group-hover:text-yellow-300 uppercase tracking-wider">Galeões</span>
            </div>
            <span className="font-heading text-lg text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">{((profile as any).galeons || 0).toLocaleString("pt-BR")}</span>
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
                  window.location.reload();
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
        

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <DailyProphetTicker />
          
          <div className="p-4 md:p-8">
            {/* House Cup Progress Bar - Monster Quality Engine */}
            <div className="mb-6">
              <HouseCupWidget />
            </div>
          {/* <MagicalActivityFeed /> */}
          <div className="mt-2 md:mt-0 pb-10">
             <Outlet />
          </div>
          <EngagementBot />
          <FilchWatcher />
          <MagicalEventSystem />
          {/* Magical Party Overlay – show only when active */}
          {false && <MagicalPartyOverlay />}
          <GlobalChallengeWatcher />
          <DailyRewardSystem />
          <MagicalCelebration />
          {/* <TimedMysteryChest /> */}
          <MaraudersMap isOpen={mapOpen} onClose={() => setMapOpen(false)} />
          <Corujoteca />
          <MagicalEncounters />
          <FilchShadow />
      <PWAInstallPrompt />
        </div>
      </div>
    </main>
  </div>
  );
}

function AmbientSoundController({ currentPath }: { currentPath: string }) {
  const [audio] = useState(new Audio());
  
  useEffect(() => {
    if (!isSoundEnabled()) {
      audio.pause();
      return;
    }

    let url = "";
    if (currentPath === "/dashboard") url = "https://cdn.pixabay.com/download/audio/2022/01/18/audio_2d8f6d6d4a.mp3?filename=fireplace-6818.mp3";
    else if (currentPath.includes("album") || currentPath.includes("guide")) url = "https://www.soundjay.com/misc/sounds/page-flip-01a.mp3";
    else if (currentPath.includes("store") || currentPath.includes("shop")) url = "https://www.soundjay.com/misc/sounds/coins-spilled-1.mp3";
    else if (currentPath.includes("azkaban") || currentPath.includes("challenges")) url = "https://www.soundjay.com/nature/sounds/wind-cave-1.mp3";
    
    if (url) {
      audio.src = url;
      audio.loop = true;
      audio.volume = 0.15;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [currentPath, isSoundEnabled()]);

  return null;
}

