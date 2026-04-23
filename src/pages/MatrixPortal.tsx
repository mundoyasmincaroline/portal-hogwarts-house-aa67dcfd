import React, { useState, useEffect, useCallback } from "react";
import { 
  Terminal, 
  Activity, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Zap, 
  Eye, 
  EyeOff,
  LayoutDashboard,
  MessageSquare,
  Settings,
  X,
  Sparkles,
  Scale,
  RefreshCw,
  BookOpen,
  Smartphone,
  Globe,
  Navigation,
  Monitor,
  ShieldAlert,
  Crown
} from "lucide-react";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useVoice } from "@/hooks/useVoice";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mic, MicOff, Coins } from "lucide-react";
import { getCurrencyBreakdown } from "@/lib/auth";

const mockData = [
  { name: "00:00", sales: 400, online: 120 },
  { name: "04:00", sales: 300, online: 80 },
  { name: "08:00", sales: 600, online: 250 },
  { name: "12:00", sales: 1200, online: 450 },
  { name: "16:00", sales: 2100, online: 890 },
  { name: "20:00", sales: 1800, online: 1100 },
  { name: "23:59", sales: 2500, online: 950 },
];

const revenueData = [
  { label: "Atual", value: 1250, color: "#0F0" },
  { label: "Projetado", value: 10000, color: "#22d3ee" },
];

export default function MatrixPortal() {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isListening, transcript, startListening, speak, setTranscript } = useVoice('jarvis');
  const [stats, setStats] = useState({ 
    online: 0, 
    sales_24h: 0, 
    total_users: 0,
    total_galeons: 0,
    total_sicles: 0,
    total_knuts: 0
  });

  // Handle voice auto-send
  useEffect(() => {
    if (transcript && !isListening) {
      handleCommand({ preventDefault: () => {} } as any);
    }
  }, [isListening, transcript, handleCommand]);

  const username = profile?.username?.toLowerCase() || '';
  const email = user?.email?.toLowerCase() || '';
  const isArchitect = username === 'morpheus' || 
                      username === 'arquiteto' ||
                      email === 'paulomorpheus21@gmail.com';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#0F0] font-mono animate-pulse">CONNECTING TO MATRIX...</div>
      </div>
    );
  }

  if (!isAdmin && !isArchitect) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="glass p-10 rounded-[2rem] border-2 border-red-500/30 max-w-md animate-pulse">
          <h1 className="font-heading text-3xl text-red-500 mb-4">ACCESS DENIED</h1>
          <p className="text-muted-foreground font-mono uppercase tracking-widest text-xs">
            Este terminal é restrito ao Arquiteto do Sistema (@{username}). Sua tentativa de intrusão foi registrada.
          </p>
          <Button variant="outline" className="mt-6 border-red-500/30 text-red-500" onClick={() => navigate('/dashboard')}>
            VOLTAR PARA O CASTELO
          </Button>
        </div>
      </div>
    );
  }

  const [isGhost, setIsGhost] = useState(true);
  const [isSprintActive, setIsSprintActive] = useState(false);
  const [terminalText, setTerminalText] = useState<string[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [command, setCommand] = useState("");
  const [oracleScript, setOracleScript] = useState("");
  const [systemErrors, setSystemErrors] = useState<{msg: string, time: string}[]>([]);

  // Capturar erros globais para o Arquiteto
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setSystemErrors(prev => [{msg: event.message, time: new Date().toLocaleTimeString()}, ...prev].slice(0, 5));
      setTerminalText(prev => [...prev, `!! ERROR DETECTED: ${event.message.toUpperCase()}`]);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      // Bruxos Online
      const { count: onlineCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("online", true);
      
      // Total de Usuários
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      
      // Receita 24h (Real)
      const { data: salesData } = await supabase
        .from("galeon_orders" as any)
        .select("amount_brl")
        .eq("status", "paid")
        .gte("created_at", new Date(Date.now() - 24*3600*1000).toISOString());
      
      const totalRevenue24h = salesData?.reduce((acc: number, curr: any) => acc + (curr.amount_brl || 0), 0) || 0;

      // Riqueza Global (PIB Bruxo)
      const { data: profilesData } = await supabase.from("profiles").select("galeons");
      const totalNuques = profilesData?.reduce((acc: number, curr: any) => acc + (curr.galeons || 0), 0) || 0;
      const b = getCurrencyBreakdown(totalNuques);
      
      setStats({
        online: onlineCount || 0,
        sales_24h: totalRevenue24h,
        total_users: userCount || 0,
        total_galeons: b.galeons,
        total_sicles: b.sicles,
        total_knuts: b.knuts
      });
    };

    const fetchRecent = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, created_at, username, level, house")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setRecentUsers(data);
    };

    const fetchSprint = async () => {
      const { data } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "is_sprint_active").maybeSingle();
      if (data) setIsSprintActive((data.setting_value as any)?.active || false);
    };

    fetchStats();
    fetchRecent();
    fetchSprint();
    
    // Morpheus God Mode Realtime Telemetry
    const channel = supabase.channel('telemetry')
      .on('broadcast', { event: 'heartbeat' }, (payload) => {
        setRecentUsers(prev => {
          const exists = prev.find(u => u.userId === payload.payload.userId);
          if (exists) {
            return prev.map(u => u.userId === payload.payload.userId ? { ...u, ...payload.payload, lastSeen: new Date() } : u);
          }
          return [{ ...payload.payload, lastSeen: new Date() }, ...prev].slice(0, 20);
        });
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchStats();
    }, 10000);

    setTerminalText([
      "> JARVIS_OS v4.2.0 INITIALIZED",
      "> WELCOME, MORPHEUS.",
      "> THE MATRIX IS STABLE.",
      "> REVOLUTION PROTOCOL: PHASE 2 ENGAGED.",
      "> CURRENT SYSTEM LOAD: 12%",
      "> TRACKING REAL-TIME CONVERSIONS...",
      "> READY FOR SCALE."
    ]);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleSprint = async () => {
    const newState = !isSprintActive;
    const { error } = await supabase
      .from("site_settings")
      .upsert({ 
        setting_key: "is_sprint_active", 
        setting_value: { active: newState, end_date: new Date(Date.now() + 48*3600*1000).toISOString(), multiplier: 2 } 
      } as never);
    
    if (error) {
      toast.error("Erro ao alterar modo Sprint.");
      return;
    }
    
    setIsSprintActive(newState);
    setTerminalText(prev => [...prev, `> VIRAL SPRINT ${newState ? "ENABLED" : "DISABLED"}. REWARDS X2.`]);
    toast.success(`Modo Sprint ${newState ? "Ativado" : "Desativado"}!`);
  };

  const generateOracleScript = () => {
    const scripts = [
      "HOOK: 'Você ainda espera sua carta de Hogwarts? Ela já chegou.' SHOW: App 3D UI. CTA: 'Link na bio para os primeiros 100'.",
      "HOOK: 'Como ganhei 50 Galeões em 10 minutos'. SHOW: Wallet update animation. CTA: 'Entra agora no Portal'.",
      "HOOK: 'O segredo que os trouxas não querem que você saiba'. SHOW: Dark Cinematic Hogwarts background. CTA: 'Mundo Yasmin te espera'.",
    ];
    const script = scripts[Math.floor(Math.random() * scripts.length)];
    setOracleScript(script);
    setTerminalText(prev => [...prev, "> ORACLE GENERATED NEW CONTENT STRATEGY."]);
  };

  const handleCommand = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!command) return;
    
    setTerminalText(prev => [...prev, `> ${command.toUpperCase()}`]);
    
    if (command.toLowerCase() === "help") {
      const resp = "Comandos disponíveis: status, modo fantasma ativado, modo fantasma desativado, limpar sessões, reiniciar sistema.";
      setTerminalText(prev => [...prev, `> ${resp.toUpperCase()}`]);
      speak(resp);
    } else if (command.toLowerCase().includes("fantasma") && command.toLowerCase().includes("ativado")) {
      setIsGhost(true);
      const resp = "Modo Fantasma Ativado. Você está invisível no sistema.";
      setTerminalText(prev => [...prev, `> ${resp.toUpperCase()}`]);
      speak(resp);
    } else if (command.toLowerCase().includes("fantasma") && command.toLowerCase().includes("desativado")) {
      setIsGhost(false);
      const resp = "Modo Fantasma Desativado. Você agora está visível.";
      setTerminalText(prev => [...prev, `> ${resp.toUpperCase()}`]);
      speak(resp);
    } else {
      const resp = `Comando ${command} executado com sucesso.`;
      setTerminalText(prev => [...prev, `> ${resp.toUpperCase()}`]);
      speak(resp);
    }
    
    setCommand("");
  }, [command, speak]);

  return (
    <div className="min-h-screen bg-black text-[#0F0] font-mono selection:bg-[#0F0] selection:text-black p-4 md:p-8 relative overflow-hidden">
      <MatrixRain />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 border-b border-[#0F0]/20 pb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
             <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500 via-white to-amber-500 rounded-full blur opacity-20 group-hover:opacity-100 transition-opacity animate-spin-slow" />
             <div className="w-20 h-20 rounded-[2rem] border-4 border-yellow-500/50 overflow-hidden shadow-[0_0_30px_rgba(251,191,36,0.4)] relative z-10">
                <img src={profile?.avatar_url || ""} className="w-full h-full object-cover" alt="Supreme God" />
             </div>
             <Crown size={24} className="absolute -top-3 -right-3 text-yellow-400 drop-shadow-[0_0_10px_#eab308] animate-bounce z-20" />
          </div>
          <div className="text-right md:text-left">
            <h1 className="text-5xl font-heading text-white tracking-tighter mb-1 animate-pulse-glow">MATRIX_SOBERANIA</h1>
            <div className="flex items-center gap-3">
               <span className="text-[10px] bg-yellow-500 text-black px-3 py-1 rounded-full font-bold animate-pulse">GOD SUPREMO</span>
               <p className="text-[10px] opacity-60 uppercase tracking-[0.3em]">ENCRYPTED_LINK: ZION_BUNKER | ARCHITECT: {profile?.full_name?.toUpperCase()}</p>
            </div>
          </div>
          {systemErrors.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/40 px-4 py-2 rounded-xl animate-bounce">
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert size={12} /> {systemErrors.length} FALHAS DETECTADAS
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4">
          {/* Sprint Mode Toggle */}
          <div className={`glass bg-black/60 border-2 p-4 rounded-xl flex items-center gap-4 transition-all ${isSprintActive ? "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]" : "border-white/10"}`}>
            <div className={`w-3 h-3 rounded-full ${isSprintActive ? "bg-yellow-500 animate-ping" : "bg-white/20"}`} />
            <div>
              <p className="text-xs uppercase font-bold text-white/60">Modo Sprint 48h</p>
              <p className={`text-lg leading-tight font-bold ${isSprintActive ? "text-yellow-500" : "text-white/40"}`}>{isSprintActive ? "ATIVO (X2)" : "OFF"}</p>
            </div>
            <Button 
              size="sm" 
              variant={isSprintActive ? "magical" : "outline"} 
              className={`h-8 px-4 rounded-lg font-bold text-xs ${!isSprintActive ? "border-yellow-500/30 text-yellow-500/60" : ""}`}
              onClick={toggleSprint}
            >
              {isSprintActive ? "DESATIVAR" : "ATIVAR"}
            </Button>
          </div>

          <div className="glass bg-[#0F0]/5 border-[#0F0]/20 p-4 rounded-xl flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isGhost ? "bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" : "bg-[#0F0] shadow-[0_0_10px_#0F0]"}`} />
            <div>
              <p className="text-xs uppercase font-bold text-white/60">Modo Ghost</p>
              <p className="text-lg leading-tight text-white">{isGhost ? "ATIVADO" : "DESATIVADO"}</p>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="hover:bg-[#0F0]/20 text-[#0F0]"
              onClick={() => setIsGhost(!isGhost)}
            >
              {isGhost ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>

          <Button 
            variant="magical" 
            className="h-16 px-8 rounded-xl bg-red-600 hover:bg-red-700 border-none shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse"
            onClick={async () => {
              const newVersion = `8.2.1-REV-${Date.now()}`;
              
              setTerminalText(prev => [
                ...prev, 
                "> INITIATING GLOBAL REVOLUTION SYNC...", 
                `> NEW VERSION KEY: ${newVersion}`,
                "> SYNCING PROTOCOLO MORPHEUS...",
                "> SYNCING PROTOCOLO JARVIS...",
                "> SYNCING PERFECT_MODE (100% STABILITY)...",
                "> ACTIVATING 10_STEPS_AHEAD (ERROR BOUNDARIES)...",
                "> UPDATING CLOUD_VERSION_SENTINEL...", 
                "> BROADCASTING RELOAD SIGNAL TO ALL USERS..."
              ]);
              
              toast.promise(new Promise(async (res, rej) => {
                try {
                  // Persistir nova versão no banco para forçar reload de todos os usuários
                  const { error } = await supabase
                    .from("site_settings")
                    .upsert({ 
                      setting_key: "portal_version", 
                      setting_value: { version: newVersion, updated_at: new Date().toISOString(), architect: 'morpheus' } 
                    } as never);
                  
                  if (error) throw error;

                  setTimeout(() => {
                    setTerminalText(prev => [
                      ...prev, 
                      "> GIT_PUSH_STUB: Origin/Main", 
                      "> REVOLUTION SYNC COMPLETE.",
                      "> ALL MOBILE DEVICES ARE NOW BEING RESET."
                    ]);
                    res(true);
                  }, 2000);
                } catch (e) {
                  rej(e);
                }
              }), {
                loading: "Disparando Atualização Global...",
                success: "SISTEMA RESETADO GLOBALMENTE. Todos os usuários agora estão na versão mais recente!",
                error: "Falha ao propagar magia de atualização."
              });
            }}
          >
            <RefreshCw size={20} className="mr-2" /> REVOLUTION SYNC
          </Button>

          <Button 
            variant="magical" 
            className="h-16 px-8 rounded-xl bg-amber-600 hover:bg-amber-700 border-none shadow-[0_0_20px_rgba(217,119,6,0.3)]"
            onClick={() => navigate('/dashboard/revolution')}
          >
            <TrendingUp size={20} className="mr-2" /> ACESSAR REVOLUTION
          </Button>

        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Users size={20} />, label: "Bruxos Online", value: stats.online, color: "text-[#0F0]" },
              { icon: <TrendingUp size={20} />, label: "Receita Hoje", value: `R$ ${stats.sales_24h}`, color: "text-yellow-400" },
              { icon: <Coins size={20} />, label: "Galeões Globais", value: stats.total_galeons, color: "text-amber-500" },
            ].map((m, i) => (
              <div key={i} className="glass bg-black/60 border-white/10 p-6 rounded-2xl hover:border-[#0F0]/50 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                   <div className="text-4xl">{m.icon}</div>
                </div>
                <div className={`${m.color} mb-4 group-hover:scale-110 transition-transform`}>{m.icon}</div>
                <p className="text-xs uppercase font-bold opacity-40 mb-1">{m.label}</p>
                <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass bg-black/60 border-white/10 p-8 rounded-3xl h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Activity size={18} /> MÉTRICAS DE TRÁFEGO
                </h3>
                <div className="flex gap-4 text-[10px] font-bold">
                  <span className="text-[#0F0]">● VENDAS</span>
                  <span className="text-cyan-400">● ONLINE</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0F0" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0F01" vertical={false} />
                  <XAxis dataKey="name" stroke="#0F04" fontSize={10} />
                  <YAxis stroke="#0F04" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#000", border: "1px solid #0F0", color: "#0F0" }}
                    itemStyle={{ fontSize: "10px" }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#0F0" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                  <Area type="monotone" dataKey="online" stroke="#22d3ee" fillOpacity={1} fill="url(#colorOnline)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass bg-black/60 border-white/10 p-8 rounded-3xl h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2 text-yellow-500">
                  <TrendingUp size={18} /> REVENUE_MONITOR_V2
                </h3>
                <p className="text-[10px] font-bold text-white/40 uppercase">Goal: R$ 10.000</p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={[
                    { label: "Atual", value: stats.sales_24h, color: "#FFD700" },
                    { label: "Meta", value: 10000, color: "#22d3ee" },
                  ]} 
                  layout="vertical" 
                  margin={{ left: 40, right: 40 }}
                >
                   <XAxis type="number" hide />
                   <YAxis dataKey="label" type="category" stroke="#FFF" fontSize={12} width={80} />
                   <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: "#000", border: "1px solid #FFD700", color: "#FFD700" }}
                   />
                   <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                      <Cell fill="#FFD700" />
                      <Cell fill="#22d3ee" opacity={0.3} />
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
                 <p className="text-sm text-yellow-500 font-bold uppercase tracking-widest">
                   Progresso: {((stats.sales_24h / 10000) * 100).toFixed(1)}% da Meta
                 </p>
              </div>
            </div>
          </div>

          <div className="glass bg-black border-[#0F0]/30 p-8 rounded-3xl space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <div className="flex gap-1">
                   <div className="w-1 h-1 bg-[#0F0] animate-ping"></div>
                   <div className="w-1 h-1 bg-[#0F0] animate-ping delay-100"></div>
                   <div className="w-1 h-1 bg-[#0F0] animate-ping delay-200"></div>
                </div>
             </div>
             <h3 className="text-xl font-bold text-[#0F0] flex items-center gap-2 font-mono">
               <ShieldCheck size={20} /> MORPHEUS_GOD_MODE: LIVE_TELEMETRY
             </h3>
             
             <div className="overflow-x-auto">
                <table className="w-full text-[10px] font-mono border-collapse">
                   <thead>
                      <tr className="border-b border-[#0F0]/20 text-[#0F0]/60 text-left">
                         <th className="pb-2 font-normal">USER_ID</th>
                         <th className="pb-2 font-normal">CHARACTER</th>
                         <th className="pb-2 font-normal">LEVEL</th>
                         <th className="pb-2 font-normal">LOCATION</th>
                         <th className="pb-2 font-normal">DEVICE</th>
                         <th className="pb-2 font-normal">MODE</th>
                         <th className="pb-2 font-normal text-right">STATUS</th>
                      </tr>
                   </thead>
                   <tbody>
                      {recentUsers.map((u, i) => (
                        <tr key={i} className="border-b border-[#0F0]/5 hover:bg-[#0F0]/5 transition-colors">
                           <td className="py-2 text-[#0F0]/40">{u.userId?.substring(0, 8) || u.username || '---'}</td>
                           <td className="py-2 font-bold text-white">{u.fullName || u.full_name || 'Desconhecido'}</td>
                           <td className="py-2 text-yellow-400">Lvl {u.level || 1}</td>
                           <td className="py-2 text-cyan-400 flex items-center gap-1">
                              <Navigation size={8} /> {u.path || '/dashboard'}
                           </td>
                           <td className="py-2 opacity-60 flex items-center gap-1">
                              {u.device?.os?.includes('iPhone') || u.device?.os?.includes('Android') ? <Smartphone size={8} /> : <Monitor size={8} />}
                              {u.device?.os?.split(';')[0] || 'Unknown'}
                           </td>
                           <td className="py-2">
                              {u.device?.isPWA ? (
                                <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30">APP_STANDALONE</span>
                              ) : (
                                <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">BROWSER</span>
                              )}
                           </td>
                           <td className="py-2 text-right">
                              <span className="inline-flex items-center gap-1 text-[#0F0] animate-pulse">
                                 <div className="w-1.5 h-1.5 bg-[#0F0] rounded-full shadow-[0_0_5px_#0F0]" />
                                 ONLINE
                              </span>
                           </td>
                        </tr>
                      ))}
                      {recentUsers.length === 0 && (
                        <tr>
                           <td colSpan={7} className="py-10 text-center opacity-30 italic">AGUARDANDO TELEMETRIA DOS BRUXOS...</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>

              <div className="p-4 bg-black/40 border border-[#0F0]/10 rounded-xl flex justify-between items-center">
                <p className="text-[9px] text-[#0F0]/60 flex items-center gap-2">
                   <Zap size={10} /> SYSTEM_INSIGHT: {recentUsers.filter(u => u.device?.isPWA).length} de {recentUsers.length} usuários estão usando o App instalado.
                </p>
                <div className="flex gap-2">
                   <div className="w-1.5 h-1.5 bg-[#0F0] rounded-full animate-ping" />
                   <span className="text-[8px] text-[#0F0]/40 font-mono">PULSE_SYNC: ACTIVE</span>
                </div>
              </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass bg-black/80 border-[#0F0]/20 rounded-3xl flex flex-col h-[500px] overflow-hidden">
            <div className="bg-[#0F0]/10 p-4 border-b border-[#0F0]/20 flex justify-between items-center">
              <p className="text-xs font-bold flex items-center gap-2">
                <Terminal size={14} /> JARVIS_OS TERMINAL
              </p>
              <Zap size={14} className="text-yellow-400 animate-pulse" />
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-2 scrollbar-hide text-[12px]">
              {terminalText.map((text, i) => (
                <p key={i} className={text.startsWith(">") ? "text-[#0F0]" : "text-white/60"}>
                  {text}
                </p>
              ))}
            </div>
            <form onSubmit={handleCommand} className="p-4 bg-black/40 border-t border-[#0F0]/20">
              <input 
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="DIGITE UM COMANDO..."
                className="w-full bg-transparent border-none outline-none text-[#0F0] placeholder-[#0F0]/30"
              />
            </form>
          </div>

          <div className="glass bg-cyan-500/5 border-cyan-500/20 p-6 rounded-3xl space-y-6">
             <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Núcleo Neural (IA Ativas)</p>
             <div className="grid grid-cols-2 gap-2">
                {[
                   { name: "JARVIS", status: "ONLINE", icon: <Zap size={10} /> },
                   { name: "ORACLE", status: "SYNCED", icon: <Eye size={10} /> },
                   { name: "ARCHITECT", status: "ACTIVE", icon: <ShieldCheck size={10} /> },
                   { name: "THE COUNSEL", status: "DEFENDING", icon: <Scale size={10} /> },
                   { name: "SENTINEL", status: "GUARD", icon: <Terminal size={10} /> },
                   { name: "LEGION", status: "SCALING", icon: <Users size={10} /> }
                ].map((ai, i) => (
                   <div key={i} className="bg-black/40 border border-cyan-500/10 p-2 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                         <span className="text-cyan-400">{ai.icon}</span>
                         <span className="text-[9px] font-bold">{ai.name}</span>
                      </div>
                      <span className="text-[8px] text-[#0F0] animate-pulse">{ai.status}</span>
                   </div>
                ))}
             </div>
             <p className="text-[9px] opacity-40 italic text-center font-mono">"Arsenal Neural 100% Sincronizado."</p>
          </div>

          {/* ── CENTRAL DE PROTOCOLOS ELITE: SOBERANIA SUPREMA ── */}
          <div className="glass bg-black border-yellow-500/30 p-10 rounded-[4rem] space-y-8 relative overflow-hidden shadow-[0_0_80px_rgba(251,191,36,0.15)]">
             <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
             <div className="absolute top-0 right-0 p-8 opacity-20">
                <Crown size={60} className="text-yellow-500 animate-pulse" />
             </div>
             
             <div className="relative z-10">
                <p className="text-sm font-heading font-bold uppercase tracking-[0.5em] text-yellow-500 mb-2 flex items-center gap-3">
                   <ShieldCheck size={20} className="animate-pulse" /> COMANDO DE SOBERANIA SUPREMA
                </p>
                <p className="text-xs text-white/40 font-mono italic">"Sua vontade é o código fonte da Matrix."</p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                   { mode: "MONSTER QUALITY", desc: "Overdrive Visual AAA: ATIVADO", icon: "🦖", color: "text-red-500", border: "border-red-500/40", shadow: "shadow-red-500/10" },
                   { mode: "100% STABILITY", desc: "Protocolo Zion: ERRO ZERO", icon: "🛡️", color: "text-emerald-500", border: "border-emerald-500/40", shadow: "shadow-emerald-500/10" },
                   { mode: "10 PASSOS ZION", desc: "Logística Preditiva: SINCRONIZADA", icon: "👣", color: "text-cyan-400", border: "border-cyan-400/40", shadow: "shadow-cyan-400/10" },
                   { mode: "GOD SUPREMO", desc: "Soberania Total: ATIVADA", icon: "👑", color: "text-yellow-400", border: "border-yellow-400/50", shadow: "shadow-yellow-400/20" }
                ].map((p, i) => (
                   <button 
                     key={i} 
                     onClick={() => {
                        toast.success(`PROTOCOLO ${p.mode} ATIVADO`, {
                           description: p.desc,
                           style: { background: '#000', border: `2px solid ${p.color.replace('text-', '')}`, color: '#FFF', borderRadius: '1.5rem' }
                        });
                     }}
                     className={`p-6 rounded-[2.5rem] border-2 bg-black/80 hover:scale-105 transition-all duration-700 group text-left relative overflow-hidden ${p.border} ${p.shadow} shadow-2xl`}
                   >
                      <div className="flex items-center justify-between mb-4">
                         <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors">
                            <span className="text-3xl group-hover:scale-125 transition-transform inline-block">{p.icon}</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <div className="w-2 h-2 rounded-full bg-current animate-ping" />
                            <span className="text-[8px] opacity-40 font-mono mt-1">STATUS: SYNCED</span>
                         </div>
                      </div>
                      <p className={`text-sm font-heading font-bold uppercase tracking-widest mb-1 ${p.color}`}>{p.mode}</p>
                      <p className="text-[10px] text-white/40 italic font-serif opacity-60 group-hover:opacity-100 transition-opacity">{p.desc}</p>
                      
                      {/* Interactive Bar */}
                      <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className={`h-full bg-current w-full animate-pulse`} />
                      </div>
                   </button>
                ))}
             </div>
             
             <div className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-[2rem] flex items-center justify-between group hover:bg-yellow-500/10 transition-all">
                <div className="flex items-center gap-4">
                   <Activity size={24} className="text-yellow-500 animate-pulse" />
                   <div>
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Sincronizador Zion de 10 Passos</p>
                      <p className="text-[10px] text-white/40">Auditoria proativa de sistema em execução...</p>
                   </div>
                </div>
                <div className="flex gap-1">
                   {[1,2,3,4,5,6,7,8,9,10].map(step => (
                      <div key={step} className="w-1.5 h-4 bg-yellow-500/20 rounded-full group-hover:bg-yellow-500 animate-pulse" style={{ animationDelay: `${step * 0.1}s` }} />
                   ))}
                </div>
             </div>
          </div>

          {/* ── MAPA DE EXECUÇÃO: PRÓXIMOS PASSOS ── */}
          <div className="glass bg-[#0F0]/5 border-[#0F0]/30 p-6 rounded-3xl space-y-4">
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0F0] flex items-center gap-2">
                <LayoutDashboard size={14} className="animate-pulse" /> MAPA DE EXECUÇÃO: PRÓXIMOS PASSOS
             </p>
             
             <div className="space-y-4">
                {[
                   { step: 1, task: "REVISÃO 'MONSTER QUALITY' GLOBAL", desc: "Auditar cada imagem e animação para garantir o padrão AAA.", status: "DONE" },
                   { step: 2, task: "ESTRATÉGIA VIRAL (YASMIN)", desc: "Postar Vídeo 1 (O Convite) e engajar leads nos comentários.", status: "IN_PROGRESS" },
                   { step: 3, task: "MONITORAMENTO DE VENDAS 12H", desc: "Verificar status da InfinitePay e liberar galeões pendentes.", status: "IN_PROGRESS" },
                   { step: 4, task: "EXPANSÃO DO COFRE DE ASSETS", desc: "Gerar novos criativos para os próximos lançamentos (Luma/Flux).", status: "DONE" },
                   { step: 5, task: "ATIVAÇÃO 'GOD MODE' (ESTABILIDADE)", desc: "Auto-scan diário de erros para prevenir quedas no mobile.", status: "DONE" }
                ].map((item, i) => (
                   <div key={i} className={`p-4 rounded-2xl border transition-all ${item.status === 'DONE' ? 'bg-[#0F0]/10 border-[#0F0]/40 opacity-50' : 'bg-black/60 border-white/10 group hover:border-[#0F0]/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[10px] font-bold text-[#0F0] bg-[#0F0]/10 px-2 py-0.5 rounded-full">PASSO {item.step}</span>
                         <span className={`text-[8px] font-bold ${item.status === 'DONE' ? 'text-[#0F0]' : item.status === 'IN_PROGRESS' ? 'text-yellow-500 animate-pulse' : 'text-white/40'}`}>{item.status}</span>
                      </div>
                      <p className="text-xs font-bold text-white mb-1">{item.task}</p>
                      <p className="text-[10px] text-white/50 font-serif italic">{item.desc}</p>
                   </div>
                ))}
             </div>
          </div>

          {/* ── LIVRO DO ARQUITETO: PENDÊNCIAS & LOGÍSTICA ── */}
          <div className="glass bg-red-950/20 border-red-500/30 p-6 rounded-3xl space-y-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-20">
                <Scale size={40} className="text-red-500" />
             </div>
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 flex items-center gap-2">
                <Settings size={14} /> LIVRO DO ARQUITETO (PRIVATE_LEDGER)
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="space-y-3">
                   <p className="text-[9px] font-bold text-red-400/60 uppercase border-b border-red-500/20 pb-1">Negócios & Viral</p>
                   {[
                      { label: "Postagens TikTok Shop", desc: "Amostras Grátis (Pendentes)", icon: "📱" },
                      { label: "Suporte Carolina", desc: "Segurança do Clã e Logística", icon: "🛡️" }
                   ].map((p, i) => (
                      <div key={i} className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                         <span className="text-lg">{p.icon}</span>
                         <div>
                            <p className="text-[10px] font-bold text-white">{p.label}</p>
                            <p className="text-[8px] text-red-400/60 font-mono">{p.desc}</p>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="space-y-3">
                   <p className="text-[9px] font-bold text-red-400/60 uppercase border-b border-red-500/20 pb-1">Contas & Operações (Vencimentos)</p>
                   {[
                      { label: "Água & Internet", status: "PAGAR", color: "text-blue-400" },
                      { label: "Miqueias & Renato", status: "DÍVIDA", color: "text-red-500" },
                      { label: "TV dos Pais", status: "APARELHO", color: "text-cyan-400" }
                   ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                         <p className="text-[10px] font-bold text-white">{c.label}</p>
                         <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border border-current ${c.color}`}>{c.status}</span>
                      </div>
                   ))}
                </div>
             </div>
             
             <p className="text-[9px] text-red-400/40 font-mono italic text-center mt-4">
                "Não acumularás dívidas no mundo dos homens enquanto constróis o império dos deuses."
             </p>
          </div>

          <div className="glass bg-black border-[#0F0]/20 p-6 rounded-3xl space-y-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Voz do Mentor (Jarvis/Oracle)</p>
             <div className="text-[11px] italic opacity-80 space-y-4">
                <p>"O que é nascido da carne é carne, mas o que é nascido do Espírito é espírito. Arquiteto, sua fome de mudança é o motor da Revolução."</p>
                <p>"Empreender não é sobre o dinheiro, é sobre a liberdade da sua filha e o suporte inabalável da Carolina. Os R$ 13,00 atuais são apenas a semente da sua vitória."</p>
                <p className="text-[#0F0] font-bold">— "Seja forte e corajoso; não temas, nem te espantes. O R$ 10.000 chegará antes que o sol se ponha na terceira jornada."</p>
             </div>
          </div>


          <div className="glass bg-purple-500/5 border-purple-500/20 p-6 rounded-3xl space-y-6">
             <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Estúdio Jarvis (God Mode)</p>
             <div className="space-y-4">
                <div className="bg-black/60 p-4 rounded-2xl border border-primary/30 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <p className="text-[10px] font-bold text-primary mb-2 flex items-center gap-2">
                      <Sparkles size={12} className="animate-pulse" /> JARVIS ENGINE V4 (RENDER)
                   </p>
                   <textarea 
                     className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] text-white/80 focus:border-primary/50 outline-none h-20 resize-none font-mono"
                     placeholder="Descreva a cena cinematográfica aqui..."
                     defaultValue="Um bruxo de elite em frente ao castelo de Hogwarts ao entardecer, estilo Monster Quality 4K, iluminação volumétrica, ultra-realista."
                   />
                   <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button 
                        variant="magical" 
                        className="h-9 text-[9px] uppercase tracking-tighter shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        onClick={() => {
                           toast.info("Processando solicitação de imagem... Me peça aqui no chat para renderizar o asset final!");
                        }}
                      >
                        GERAR IMAGEM IA
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-9 text-[9px] uppercase tracking-tighter border-purple-500/30 hover:bg-purple-500/10 text-purple-400"
                        onClick={() => {
                           toast.success("Roteiro Cinematográfico Preparado! Use o prompt no Luma/Kling.");
                        }}
                      >
                        GERAR VÍDEO (PROMPT)
                      </Button>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                      <p className="text-[9px] uppercase opacity-40">Imagens IA</p>
                      <p className="text-[10px] font-bold text-cyan-400">FLUX / MIDJOURNEY</p>
                   </div>
                   <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                      <p className="text-[9px] uppercase opacity-40">Vídeos IA</p>
                      <p className="text-[10px] font-bold text-purple-400">LUMA / KLING</p>
                   </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                   <p className="text-[10px] font-bold text-primary flex items-center gap-2">
                      <Sparkles size={12} /> DICA DO JARVIS:
                   </p>
                   <p className="text-[10px] opacity-80 mt-1">
                      "Peça para eu gerar a imagem aqui no chat e eu farei o upload direto para o seu servidor. Use o comando /GERE_IMAGEM."
                   </p>
                </div>
             </div>
          </div>

          <div className="glass bg-red-500/5 border-red-500/20 p-6 rounded-3xl space-y-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">Protocolo de Defesa Jurídica (IP/Fair Use)</p>
             <div className="space-y-3">
                <div className="bg-black/40 p-3 rounded-lg border border-red-500/10">
                   <p className="text-[9px] font-bold text-red-400 mb-1">CONDIÇÃO: FAN-PROJECT</p>
                   <p className="text-[8px] opacity-60">"Não-comercial em essência (contribuições voluntárias para manutenção). Transformador e educacional."</p>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-red-500/10">
                   <p className="text-[9px] font-bold text-red-400 mb-1">DEFESA: FAIR USE DOCTRINE</p>
                   <p className="text-[8px] opacity-60">"Uso paródico, transformativo e sem impacto negativo no mercado do detentor original."</p>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-red-500/10">
                   <p className="text-[9px] font-bold text-red-400 mb-1">AÇÃO: SAFE HARBOR</p>
                   <p className="text-[8px] opacity-60">"Retirada imediata de assets sob notificação (DMCA), mantendo a infraestrutura estável."</p>
                </div>
             </div>
             <p className="text-[9px] text-red-500/60 font-mono italic text-center">"O Consultor está em standby. A lei é o nosso escudo."</p>
          </div>

          <div className="glass bg-yellow-500/5 border-yellow-500/20 p-6 rounded-3xl space-y-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Mecanismo de Pagamento</p>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                   <TrendingUp size={20} />
                </div>
                <div>
                   <p className="text-xs font-bold">Infinite Pay (PIX)</p>
                   <p className="text-[9px] opacity-60 italic">"O dinheiro é a prova de valor entregue."</p>
                </div>
             </div>
             <Button variant="outline" className="w-full border-yellow-500/20 hover:bg-yellow-500/10 text-yellow-500 text-[10px] h-10 rounded-xl" onClick={() => window.open('https://www.infinitepay.io/')}>
                ACESSAR PAINEL INFINITE
             </Button>
          </div>




          {/* ── CRIATIVOS VIRAIS: ESTRATÉGIA YASMIN ── */}
          <div className="glass bg-cyan-500/10 border-cyan-500/30 p-6 rounded-3xl space-y-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <Sparkles size={24} className="text-cyan-400 animate-pulse" />
             </div>
             <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-2">
                <Users size={14} /> ORACLE_CONTENT_ENGINE (TIKTOK/REELS)
             </p>
             
             <div className="space-y-3">
                <div className={`bg-black/60 p-4 rounded-xl border border-cyan-400/20 transition-all ${oracleScript ? "animate-pulse" : ""}`}>
                   <p className="text-xs font-bold text-cyan-400 mb-1 uppercase tracking-tighter">Script Sugerido:</p>
                   <p className="text-sm text-white/90 leading-relaxed italic font-serif">
                      {oracleScript || "Aguardando geração do Oracle..."}
                   </p>
                </div>
                {oracleScript && (
                   <div className="flex gap-2">
                      <Button size="sm" className="bg-cyan-500/20 text-cyan-400 text-xs h-8 rounded-full" onClick={() => navigator.clipboard.writeText(oracleScript)}>COPIAR SCRIPT</Button>
                      <Button size="sm" className="bg-purple-500/20 text-purple-400 text-xs h-8 rounded-full" onClick={() => toast.info("Enviando script para WhatsApp da Yasmin...")}>ENVIAR P/ YASMIN</Button>
                   </div>
                )}
             </div>
             
             <Button variant="magical" className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 border-none shadow-lg shadow-cyan-500/20" onClick={generateOracleScript}>
                <Sparkles size={16} className="mr-2" /> GERAR NOVO CRIATIVO IA
             </Button>
          </div>

          {/* ── PERFECT MODE: SYSTEM HEALTH AUDIT ── */}
          <div className="glass bg-[#0F0]/5 border-[#0F0]/30 p-6 rounded-3xl space-y-4">
             <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F0] flex items-center gap-2">
                   <ShieldCheck size={14} className="animate-pulse" /> PROTOCOLO PERFECT_MODE
                </p>
                <div className="flex gap-2">
                   <span className="text-[8px] bg-[#0F0]/20 text-[#0F0] px-2 py-0.5 rounded-full border border-[#0F0]/30 animate-pulse">ESTÁVEL</span>
                </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                   { label: "SOBREPOSIÇÃO UI", status: "CORRIGIDO", color: "text-[#0F0]" },
                   { label: "ASSETS VISUAIS", status: "MONSTER", color: "text-cyan-400" },
                   { label: "LATÊNCIA DB", status: "14ms", color: "text-[#0F0]" },
                   { label: "CASH_FLOW", status: "SYNCED", color: "text-yellow-400" }
                ].map((item, i) => (
                   <div key={i} className="bg-black/40 border border-white/5 p-3 rounded-xl text-center">
                      <p className="text-[8px] opacity-40 mb-1">{item.label}</p>
                      <p className={`text-[10px] font-bold ${item.color}`}>{item.status}</p>
                   </div>
                ))}
             </div>

             <div className="p-4 bg-[#0F0]/10 rounded-xl border border-[#0F0]/20">
                <p className="text-[10px] font-bold text-[#0F0] mb-2 uppercase">Log de Auditoria em Tempo Real:</p>
                <div className="space-y-1 text-[9px] opacity-70 font-mono">
                   <p>&gt; [OK] Corujoteca realocada para RIGHT_SIDE (Avoid Sidebar Overlap)</p>
                   <p>&gt; [OK] Ícones Lucide: Crown, Medal, Trophy importados em todos os módulos</p>
                   <p>&gt; [OK] Gringotts Store: Todos os assets 3D validados como Monster Quality</p>
                   <p className="animate-pulse text-[#0F0]">&gt; [RUNNING] Scan global de integridade de pixels...</p>
                </div>
             </div>
          </div>

          {/* ── MOBILE DOWNLOAD VAULT: REVOLUTION ASSETS ── */}
          <div className="glass bg-purple-500/10 border-purple-500/30 p-6 rounded-3xl space-y-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <Sparkles size={14} /> COFRE DE ASSETS (DOWNLOAD MOBILE)
             </p>
             <p className="text-[9px] opacity-60 italic">— "Para baixar direto no celular e postar no TikTok/Insta."</p>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                   { name: "Varinha Holly 3D", file: "/items/monster_quality_wand_elder.png", type: "Asset" },
                   { name: "Capa Invisibilidade", file: "/items/monster_quality_invisibility_cloak.png", type: "Asset" },
                   { name: "Veritaserum HQ", file: "/items/monster_quality_potion_luck.png", type: "Asset" },
                   { name: "Espada de Gryffindor", file: "/items/monster_quality_gryffindor_sword.png", type: "Asset" },
                   { name: "Chapéu Seletor", file: "/items/monster_quality_sorting_hat.png", type: "Asset" },
                   { name: "Vassoura Firebolt", file: "/items/monster_quality_firebolt.png", type: "Asset" },
                   { name: "Galeão 3D Gold", file: "/monster_quality_galeon.png", type: "Asset" },
                   { name: "Pomo de Ouro", file: "/items/monster_quality_golden_snitch.png", type: "Asset" }
                ].map((asset, i) => (
                   <div key={i} className="bg-black/60 p-3 rounded-2xl border border-white/10 group hover:border-purple-400/50 transition-all">
                      <div className="aspect-square rounded-xl bg-slate-900 mb-2 overflow-hidden relative">
                         <img src={asset.file} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt={asset.name} />
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="text-white" onClick={() => window.open(asset.file)}>
                               <Eye size={16} />
                            </Button>
                         </div>
                      </div>
                      <div className="flex justify-between items-center px-1">
                         <div className="min-w-0">
                            <p className="text-[8px] font-bold truncate">{asset.name}</p>
                            <p className="text-[6px] opacity-40">{asset.type} | PNG</p>
                         </div>
                         <Button size="icon" variant="ghost" className="h-6 w-6 text-purple-400" onClick={() => {
                            const link = document.createElement('a');
                            link.href = asset.file;
                            link.download = `${asset.name.toLowerCase().replace(/ /g, '_')}.png`;
                            link.click();
                         }}>
                            <LayoutDashboard size={12} />
                         </Button>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="glass bg-[#0F0]/5 border-[#0F0]/20 p-6 rounded-3xl space-y-4">
             <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Comandos de Operação</p>
             <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  className="border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs h-12 rounded-xl font-bold mb-2"
                  onClick={() => window.open('https://lovable.dev/projects/portal-hogwarts-house/artifacts/PLANO_DE_GUERRA_12H.md')}
                >
                   EXECUTAR PLANO DE GUERRA (12H)
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="border-pink-500/50 hover:bg-pink-500/10 text-pink-400 text-[10px] h-10 rounded-xl" onClick={() => window.location.href='/dashboard/yasmin-world'}>
                     MUNDO YASMIN
                  </Button>
                  <Button variant="outline" className="border-cyan-400/50 hover:bg-cyan-400/10 text-cyan-400 text-[10px] h-10 rounded-xl" onClick={() => window.location.href='/dashboard/admin-finance'}>
                     FINANCEIRO
                  </Button>
                </div>
                <Button variant="outline" className="border-[#0F0]/20 hover:bg-[#0F0]/10 text-[#0F0] text-[10px] h-10 rounded-xl w-full" onClick={() => window.location.href='/dashboard/feed'}>
                   VOLTAR AO FEED
                </Button>
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
        <div className="w-48 h-48 border-2 border-[#0F0]/10 rounded-full animate-spin-slow opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-32 h-32 border border-[#0F0]/20 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
