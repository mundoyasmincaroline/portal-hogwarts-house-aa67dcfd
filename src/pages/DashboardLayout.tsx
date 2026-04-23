import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Castle, BookOpen, User, MessageCircle, Camera, Film, Trophy,
  Shield, Swords, BookMarked, Library, ShoppingBag, ScrollText,
  Settings, LogOut, Volume2, VolumeX, RefreshCw, Menu, Users,
  Coins, Lock, Wallet, Map as MapIcon, Sparkles, Zap, Image as ImageIcon,
  MessageSquare, Crown, Newspaper, Coffee, GraduationCap, Train,
  LayoutDashboard, Heart, Gift
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import MagicalGaleon from "@/components/MagicalGaleon";

import CastleEntrance from "@/pages/CastleEntrance";
import EngagementBot from "@/components/EngagementBot";
import MagicalCelebration from "@/components/MagicalCelebration";
import AnitaPresence from "@/components/AnitaPresence";
import ProtocoloBFF from "@/components/ProtocoloBFF";
import CarolAgenda from "@/components/CarolAgenda";
import ArchitectControl from "@/components/ArchitectControl";


const NAV_ITEMS = [
  { icon: <MagicalIcon icon={Castle} size="xs" color="#60a5fa" />, label: "O Castelo", path: "/dashboard" },
  { icon: <MagicalIcon icon={MapIcon} size="xs" color="#f59e0b" />, label: "Mapa do Maroto", isMap: true },
  { icon: <MagicalIcon icon={BookOpen} size="xs" color="#10b981" />, label: "Guia do Maroto", path: "/dashboard/guide" },
  { icon: <MagicalIcon icon={User} size="xs" color="#a855f7" />, label: "Meu Perfil", path: "/dashboard/profile" },
  { icon: <MagicalIcon icon={MessageCircle} size="xs" color="#3b82f6" />, label: "Mensagens", path: "/dashboard/dm" },
  { icon: <MagicalIcon icon={Users} size="xs" color="#ec4899" />, label: "Amigos", path: "/dashboard/friends" },
  { icon: <MagicalIcon icon={Camera} size="xs" color="#f97316" />, label: "Câmera", path: "/dashboard/camera" },
  { icon: <MagicalIcon icon={Film} size="xs" color="#ef4444" />, label: "Cinema", path: "/dashboard/cinema" },
  { icon: <MagicalIcon icon={Trophy} size="xs" color="#eab308" />, label: "Torneio", path: "/dashboard/tournament" },
  { icon: <MagicalIcon icon={Shield} size="xs" color="#6366f1" />, label: "Salão", path: "/dashboard/hall" },
  { icon: <MagicalIcon icon={Swords} size="xs" color="#ef4444" />, label: "Duelo", path: "/dashboard/duel" },
  { icon: <MagicalIcon icon={BookMarked} size="xs" color="#10b981" />, label: "Aulas", path: "/dashboard/classes" },
  { icon: <MagicalIcon icon={Library} size="xs" color="#f59e0b" />, label: "Biblioteca", path: "/dashboard/library" },
  { icon: <MagicalIcon icon={ShoppingBag} size="xs" color="#a855f7" />, label: "Beco Diagonal", path: "/dashboard/store" },
  { icon: <MagicalIcon icon={ScrollText} size="xs" color="#94a3b8" />, label: "Regras", path: "/dashboard/rules" },
  { icon: <MagicalIcon icon={Lock} size="xs" color="#ef4444" />, label: "Azkaban", path: "/dashboard/azkaban" },
  { icon: <MagicalEmoji emoji="💖" size="xs" />, label: "Mundo BFF", path: "/dashboard/bff-world", isBFF: true },
  { icon: <MagicalEmoji emoji="🏆" size="xs" />, label: "Cálice das Decisões", path: "/dashboard/decisions", isFamily: true },
  { icon: <MagicalEmoji emoji="🛡️" size="xs" />, label: "Cofre de Zion", path: "/dashboard/zion", isZion: true },
];


export default function DashboardLayout() {
  const { user, profile, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadDMs, setUnreadDMs] = useState(0);

  useEffect(() => {
    if (user) {
      countUnread();
      const ch = supabase.channel(`dm_unread_badge_${Date.now()}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages" }, countUnread)
        .subscribe();
      
      // PROTOCOLO JARVIS: Monitoramento Global Realtime para o Arquiteto
      let jarvisChannel: any = null;
      if (profile?.username === 'morpheus') {
        jarvisChannel = supabase
          .channel(`jarvis-monitor_${Date.now()}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, payload => {
            toast.info("NOVO MEMBRO DETECTADO", {
              description: `Um novo bruxo (${payload.new.full_name}) acaba de cruzar os portões de Hogwarts.`,
              duration: 10000,
            });
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
            if (payload.new.title?.includes('Venda') || payload.new.title?.includes('Galeões')) {
              toast.success("TRANSAÇÃO CONCLUÍDA", {
                description: payload.new.message,
                duration: 15000,
                icon: '💰'
              });
            }
          })
          .subscribe();
      }

      return () => { 
        if (ch) supabase.removeChannel(ch); 
        if (jarvisChannel) supabase.removeChannel(jarvisChannel);
      };
    }
  }, [user?.id]);

  async function countUnread() {
    if (!user) return;
    const { count } = await supabase.from("dm_messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("read", false);
    setUnreadDMs(count || 0);
  }

  // Daily login streak — concede XP uma vez por dia e Processa Indicações Pendentes
  useEffect(() => {
    if (!user) return;
    const lastLogin = localStorage.getItem(`last_login_${user.id}`);
    const today = new Date().toISOString().split("T")[0];

    if (lastLogin !== today) {
      localStorage.setItem(`last_login_${user.id}`, today);
      supabase.rpc("increment_xp", { amount: 10, user_id: user.id }).then(() => {
        toast.success("Bônus diário!", { description: "Você ganhou +10 XP por visitar Hogwarts hoje! ✨" });
      });
    }

    // Processamento de Indicação (Protocolo Viral)
    const processReferral = async () => {
      const pendingRef = localStorage.getItem("pending_referral");
      if (pendingRef && user) {
        try {
          console.log("REVOLUTION REFERRAL: Processando convite de:", pendingRef);
          
          // 1. Vincular o usuário ao inviter via RPC
          const { data, error } = await supabase.rpc("complete_referral_action", { 
            _invited_id: user.id 
          });

          if (error) {
            console.warn("Referral already processed or error:", error.message);
          } else {
            toast.success("MAGIA DE RECRUTAMENTO!", {
              description: `Você entrou via convite de @${pendingRef}! Recompensas creditadas para ambos.`,
              icon: "🤝"
            });
          }
          
          // Limpar para não processar de novo
          localStorage.removeItem("pending_referral");
        } catch (err) {
          console.error("Erro ao processar indicação:", err);
        }
      }
    };

    processReferral();
  }, [user]);

  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (profile && profile.has_seen_intro === false) {
      setShowWelcome(true);
    }
  }, [profile]);

  const claimWelcomeGift = async () => {
    if (!user || !profile) return;
    
    try {
      // 1. Dar 500 Galeões (246500 Nuques)
      const currentGaleons = profile.galeons || 0;
      const newTotal = currentGaleons + 246500;
      
      const { error: gErr } = await supabase
        .from("profiles")
        .update({ galeons: newTotal } as any)
        .eq("user_id", user.id);
      
      if (gErr) throw gErr;

      // 2. Dar o Baú Épico
      await supabase.from("user_items").insert({ 
        user_id: user.id, 
        item_id: "mq_item_chest_epic" 
      } as any);

      // 3. Marcar como visto para não repetir
      await updateProfile({ has_seen_intro: true });
      
      setShowWelcome(false);
      toast.success("BÔNUS DE BOAS-VINDAS RESGATADO!", {
        description: "500 Galeões e 1 Baú Épico foram adicionados ao seu cofre! 🏰✨",
        duration: 8000
      });
    } catch (err: any) {
      toast.error("Erro ao resgatar presente: " + err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    // Migração de URL: Detecta se o usuário está no endereço antigo da Lovable
    if (window.location.hostname.includes('lovable.app')) {
      toast.info("NOVA VERSÃO DISPONÍVEL", {
        description: "Você está acessando via link temporário. Por favor, utilize o domínio oficial para garantir que todas as funções (como PWA e Pagamentos) funcionem corretamente.",
        duration: 20000,
      });
    }
  }, []);

  if (!user) return null;

  const currentHouse = (Object.values(HOUSES) as any[]).find((h) => h.id === profile?.house) || Object.values(HOUSES)[0];

  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex flex-col md:flex-row">
      <InterstitialAd />
      <MagicalCelebration />
      
      {/* ── SIDEBAR (Escritório do Arquiteto) ── */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40
        w-72 bg-card/60 backdrop-blur-3xl border-r border-white/5
        transition-all duration-700 ease-in-out shadow-[20px_0_50px_rgba(0,0,0,0.5)]
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Glow de fundo da Sidebar */}
        <div className={`absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-b from-primary/20 via-transparent to-transparent`} />
        
        <div className="flex flex-col h-full relative z-10">
          {/* Perfil e Casa */}
          <div className="p-8 border-b border-white/5 bg-gradient-to-br from-primary/10 via-transparent to-transparent relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700`} />
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="relative group/avatar">
                <div className={`absolute inset-0 bg-gradient-to-br ${currentHouse?.color || 'from-primary/20'} blur-lg opacity-20 group-hover/avatar:opacity-60 transition-opacity duration-500`} />
                <div className="w-16 h-16 rounded-2xl overflow-hidden relative border-2 border-white/10 shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105">
                  <img 
                    src={profile?.avatar_url || "/default_avatar.png"} 
                    alt="Perfil" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-lg text-white truncate drop-shadow-md">{profile?.full_name || "Bruxo"}</h3>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Online em {currentHouse?.name || "Hogwarts"}</p>
                </div>
              </div>
            </div>

            {/* Status do Bruxo - Monster Plaques */}
            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
              <div className="glass-light p-3 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <MagicalGaleon size="xs" />
                  <span className="text-[10px] font-heading text-white/40 uppercase tracking-tighter">Galeões</span>
                </div>
                <p className="text-sm font-bold text-white">{(profile?.currency || profile?.galeons || 0).toLocaleString("pt-BR")}</p>
              </div>
              <div className="glass-light p-3 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={12} className="text-primary animate-pulse" />
                  <span className="text-[10px] font-heading text-white/40 uppercase tracking-tighter">Nível</span>
                </div>
                <p className="text-sm font-bold text-white">{(profile?.xp || 0) / 100 >> 0 || 1}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4 px-2">
              <button 
                onClick={toggleSound}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground"
                title="Sons mágicos"
              >
                {isSoundEnabled() ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <Notifications />
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                title="Sair de Hogwarts"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Navegação */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.path || "#"}
                onClick={() => {
                  if (item.isMap) {
                    toast.info("O Mapa do Maroto requer uma senha mágica...", {
                      description: "Tente dizer: 'Eu juro solenemente não fazer nada de bom'",
                    });
                  }
                  setSidebarOpen(false);
                  playMagicSound();
                }}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative
                  ${location.pathname === item.path 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]" 
                    : "hover:bg-primary/5 text-muted-foreground hover:text-foreground border border-transparent"}
                  ${item.isBFF ? "bg-pink-500/5 hover:bg-pink-500/10 text-pink-500/70 hover:text-pink-500" : ""}
                  ${item.isFamily ? "bg-amber-500/5 hover:bg-amber-500/10 text-amber-500/70 hover:text-amber-500" : ""}
                  ${item.isZion ? "bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500/70 hover:text-emerald-500" : ""}
                `}
              >
                <div className={`transition-transform duration-300 group-hover:scale-110 ${location.pathname === item.path ? "scale-110" : ""}`}>
                  {item.icon}
                </div>
                <span className="font-heading text-sm tracking-wide">{item.label}</span>
                {item.label === "Mensagens" && unreadDMs > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce shadow-lg">
                    {unreadDMs}
                  </span>
                )}
                {item.label === "Mundo BFF" && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span>
                )}
                {item.label === "Cálice das Decisões" && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-bounce shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                )}
                {item.label === "Cofre de Zion" && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                )}
                {item.label === "Guia do Maroto" && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
                
                {/* Indicador Ativo */}
                {location.pathname === item.path && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </Link>
            ))}

            {/* PAINEL DE ADMINISTRAÇÃO (ZION ACCESS) */}
            {(profile?.is_admin || profile?.username === 'morpheus') && (
              <Link
                to="/dashboard/admin"
                onClick={() => { setSidebarOpen(false); playMagicSound(); }}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group mt-4 border border-yellow-500/40 bg-yellow-500/10 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:scale-[1.02]`}
              >
                <div className="transition-transform duration-300 group-hover:rotate-12">
                  <MagicalIcon icon={Crown} size="xs" color="#eab308" />
                </div>
                <span className="font-heading text-sm tracking-wide font-bold">SALA DO DIRETOR</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              </Link>
            )}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-6 border-t border-border bg-background/40">
             <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Hogwarts OS</span>
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-emerald-500/70 uppercase tracking-widest font-bold">v7.2.1</span>
             </div>
          </div>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Monster Quality Cinematic Layers */}
        <div className="absolute inset-0 z-0 bg-[url('/hogwarts_bg.png')] bg-fixed bg-cover bg-center grayscale opacity-10" />
        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-black/90 to-blue-950/20" />
        
        <div className="flex-1 relative z-10 flex flex-col bg-transparent">
          
          {/* Header Mobile */}
          <header className="md:hidden h-16 flex items-center justify-between px-6 border-b border-border sticky top-0 z-30 bg-background/80 backdrop-blur-md">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
               <HouseCrest house={profile?.house} size="sm" />
               <span className="font-heading text-sm text-gold-gradient tracking-widest">HOGWARTS</span>
            </div>
            <Notifications />
          </header>

          {/* Renderização das Páginas */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
             <div className="p-4 md:p-8 max-w-7xl mx-auto w-full min-h-full">
                <Outlet />
             </div>
          </div>

          <EngagementBot />
          <AnitaPresence />
          <ProtocoloBFF />
          <CarolAgenda />
          <ArchitectControl />
        </div>
      </div>

      {/* ── WELCOME GIFT MODAL (CINEMATIC) ── */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-md bg-gradient-to-br from-amber-950 via-black to-blue-950 border-yellow-500/30 text-white rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_80px_rgba(234,179,8,0.3)] border-none">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618501275376-7eb3e284f3cc?q=80&w=1000')] opacity-10 mix-blend-overlay pointer-events-none" />
          
          <div className="relative p-8 space-y-6 text-center">
             <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto border border-yellow-500/30 shadow-inner animate-bounce mt-4">
                <Gift size={48} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
             </div>
             
             <div className="space-y-2">
                <h2 className="text-3xl font-heading text-gold-gradient tracking-tighter">BEM-VINDO A HOGWARTS</h2>
                <p className="text-sm text-yellow-100/60 font-serif italic">"O Ministério da Magia preparou um kit inicial para sua jornada acadêmica."</p>
             </div>

             <div className="grid grid-cols-2 gap-4 py-4">
                <div className="glass bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2">
                   <MagicalGaleon size="sm" />
                   <p className="text-lg font-heading text-yellow-400">500 Galeões</p>
                   <p className="text-[8px] uppercase tracking-widest text-white/40">Unidade Base</p>
                </div>
                <div className="glass bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2">
                   <ShoppingBag size={20} className="text-purple-400" />
                   <p className="text-lg font-heading text-purple-400">Baú Épico</p>
                   <p className="text-[8px] uppercase tracking-widest text-white/40">Relíquia Surpresa</p>
                </div>
             </div>

             <Button 
               variant="plaque" 
               className="w-full h-16 rounded-2xl text-lg shadow-2xl animate-pulse-glow"
               onClick={claimWelcomeGift}
             >
               RESGATAR MEUS PRESENTES ✨
             </Button>
             
             <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] pb-4">Toque para aceitar sua herança mágica</p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
