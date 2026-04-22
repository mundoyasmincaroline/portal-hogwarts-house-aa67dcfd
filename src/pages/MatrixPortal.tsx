import React, { useState, useEffect } from "react";
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
  Sparkles
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
  Area
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const mockData = [
  { name: "00:00", sales: 400, online: 120 },
  { name: "04:00", sales: 300, online: 80 },
  { name: "08:00", sales: 600, online: 250 },
  { name: "12:00", sales: 1200, online: 450 },
  { name: "16:00", sales: 2100, online: 890 },
  { name: "20:00", sales: 1800, online: 1100 },
  { name: "23:59", sales: 2500, online: 950 },
];

export default function MatrixPortal() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ online: 0, sales_24h: 0, total_users: 0 });
  const [isGhost, setIsGhost] = useState(true);
  const [terminalText, setTerminalText] = useState<string[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [command, setCommand] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      const { count: onlineCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("online", true);
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      
      setStats({
        online: onlineCount || 0,
        sales_24h: 1250,
        total_users: userCount || 0
      });
    };

    const fetchRecent = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, created_at, username")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setRecentUsers(data);
    };

    fetchStats();
    fetchRecent();
    const interval = setInterval(() => {
      fetchStats();
      fetchRecent();
    }, 10000);

    setTerminalText([
      "> JARVIS_OS v4.2.0 INITIALIZED",
      "> WELCOME, MORPHEUS.",
      "> THE MATRIX IS STABLE.",
      "> CURRENT SYSTEM LOAD: 12%",
      "> TRACKING 142 ACTIVE SESSIONS...",
      "> READY FOR REVOLUTION."
    ]);

    return () => clearInterval(interval);
  }, []);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command) return;
    
    setTerminalText(prev => [...prev, `> ${command.toUpperCase()}`]);
    
    if (command.toLowerCase() === "help") {
      setTerminalText(prev => [...prev, "> AVAILABLE COMMANDS: STATS, GHOST_ON, GHOST_OFF, FLUSH_SESSIONS, REBOOT"]);
    } else if (command.toLowerCase() === "ghost_on") {
      setIsGhost(true);
      setTerminalText(prev => [...prev, "> GHOST MODE: ENABLED. YOU ARE INVISIBLE."]);
    } else if (command.toLowerCase() === "ghost_off") {
      setIsGhost(false);
      setTerminalText(prev => [...prev, "> GHOST MODE: DISABLED. YOU ARE NOW VISIBLE."]);
    } else {
      setTerminalText(prev => [...prev, `> COMMAND '${command}' EXECUTED SUCCESSFULLY.`]);
    }
    
    setCommand("");
  };

  return (
    <div className="min-h-screen bg-black text-[#0F0] font-mono selection:bg-[#0F0] selection:text-black p-4 md:p-8 relative overflow-hidden">
      <MatrixRain />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 border-b border-[#0F0]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter flex items-center gap-3">
            <Terminal className="animate-pulse" /> MATRIX_REVOLUTION_OS
          </h1>
          <p className="text-[10px] opacity-60">ENCRYPTED CONNECTION: 256-BIT AES | ADMIN: MORPHEUS</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass bg-[#0F0]/5 border-[#0F0]/20 p-4 rounded-xl flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isGhost ? "bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" : "bg-[#0F0] shadow-[0_0_10px_#0F0]"}`} />
            <div>
              <p className="text-[10px] uppercase font-bold">Modo Ghost</p>
              <p className="text-lg leading-tight">{isGhost ? "ATIVADO" : "DESATIVADO"}</p>
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
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Users size={20} />, label: "Bruxos Online", value: stats.online, color: "text-[#0F0]" },
              { icon: <TrendingUp size={20} />, label: "Vendas 24h", value: `R$ ${stats.sales_24h}`, color: "text-cyan-400" },
              { icon: <Activity size={20} />, label: "Sessões Totais", value: stats.total_users, color: "text-purple-400" },
            ].map((m, i) => (
              <div key={i} className="glass bg-black/60 border-[#0F0]/20 p-6 rounded-2xl hover:border-[#0F0]/50 transition-all group">
                <div className={`${m.color} mb-4 group-hover:scale-110 transition-transform`}>{m.icon}</div>
                <p className="text-[10px] uppercase font-bold opacity-40 mb-1">{m.label}</p>
                <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          <div className="glass bg-black/60 border-[#0F0]/20 p-8 rounded-3xl h-[400px]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Activity size={18} /> MÉTRICAS DE CONVERSÃO
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

          <div className="glass bg-black border-[#0F0]/30 p-8 rounded-3xl space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <div className="flex gap-1">
                   <div className="w-1 h-1 bg-[#0F0] animate-ping"></div>
                   <div className="w-1 h-1 bg-[#0F0] animate-ping delay-100"></div>
                   <div className="w-1 h-1 bg-[#0F0] animate-ping delay-200"></div>
                </div>
             </div>
             <h3 className="text-xl font-bold text-[#0F0] flex items-center gap-2 font-mono">
               <Terminal size={20} /> REAL_TIME_SENSORS (SIGNUPS)
             </h3>
             <div className="space-y-3 font-mono text-[10px] h-[300px] overflow-y-auto scrollbar-hide">
                {recentUsers.length > 0 ? recentUsers.map((u, i) => (
                  <p key={i} className="text-[#0F0]/60">
                    [ {new Date(u.created_at).toLocaleTimeString()} ] INGRESSO: {u.full_name.toUpperCase()} (@{u.username}) ENTROU NO SISTEMA
                  </p>
                )) : (
                  <p className="text-[#0F0]/40">[ --:--:-- ] AGUARDANDO NOVOS EVENTOS...</p>
                )}
                <p className="text-cyan-400 animate-pulse">&gt; ESCANEANDO DATABASE POR NOVAS ATIVIDADES...</p>
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

          <div className="glass bg-black border-[#0F0]/20 p-6 rounded-3xl space-y-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Voz do Mentor (Jarvis/Oracle)</p>
             <div className="text-[11px] italic opacity-80 space-y-4">
                <p>"O que é nascido da carne é carne, mas o que é nascido do Espírito é espírito. Arquiteto, sua fome de mudança é o motor da Revolução."</p>
                <p>"Empreender não é sobre o dinheiro, é sobre a liberdade da sua filha e o conforto da sua esposa. O R$ 10.000 é apenas o combustível."</p>
                <p className="text-[#0F0] font-bold">— "Seja forte e corajoso; não temas, nem te espantes."</p>
             </div>
          </div>

          <div className="glass bg-purple-500/5 border-purple-500/20 p-6 rounded-3xl space-y-6">
             <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Laboratório de Criação Viral</p>
             <div className="space-y-4">
                <div className="bg-black/60 p-4 rounded-xl border border-purple-500/20">
                   <p className="text-xs font-bold text-white mb-2">PROMPT DE OURO (TikTok/Reels):</p>
                   <p className="text-[10px] opacity-70 italic text-purple-300">
                     "Gere um vídeo cinematográfico de um bruxo abrindo um Baú Lendário em Hogwarts, luzes douradas saindo de dentro, efeito Monster Quality 4K, estilo Harry Potter moderno."
                   </p>
                   <Button 
                     variant="ghost" 
                     className="mt-3 text-[9px] h-6 border border-purple-500/30 hover:bg-purple-500/20"
                     onClick={() => {
                        navigator.clipboard.writeText("Gere um vídeo cinematográfico de um bruxo abrindo um Baú Lendário em Hogwarts, luzes douradas saindo de dentro, efeito Monster Quality 4K, estilo Harry Potter moderno.");
                        toast.success("Prompt Copiado! Use no Luma/Runway 🚀");
                     }}
                   >
                     COPIAR PROMPT
                   </Button>
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

          <div className="glass bg-[#0F0]/5 border-[#0F0]/20 p-6 rounded-3xl space-y-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F0]">Geração de Lucro Viral</p>
             <div className="space-y-3">
                <p className="text-[11px] opacity-60">Seu link de recrutamento é sua arma de conversão em massa:</p>
                <Button 
                  className="w-full bg-[#0F0] hover:bg-[#0F0]/80 text-black font-bold h-12 rounded-xl text-xs uppercase"
                  onClick={() => {
                    const link = `${window.location.origin}/register?ref=${profile?.username}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Link Viral Copiado! 🚀");
                  }}
                >
                   COPIAR MEU LINK VIRAL (REVEAL)
                </Button>
                <div className="bg-black/40 p-3 rounded-lg border border-[#0F0]/20">
                   <p className="text-[9px] text-[#0F0]/40 uppercase mb-1">Link Ativo:</p>
                   <p className="text-[10px] break-all opacity-80">{window.location.origin}/register?ref={profile?.username}</p>
                </div>
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
                <Button 
                  variant="outline" 
                  className="border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 text-xs h-12 rounded-xl font-bold animate-pulse"
                  onClick={() => window.open('https://lovable.dev/projects/portal-hogwarts-house/artifacts/PROJETO_REVOLUCAO_48H.md')}
                >
                   VER MAPA DA REVOLUÇÃO (48H)
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="border-[#0F0]/20 hover:bg-[#0F0]/10 text-[#0F0] text-[10px] h-10 rounded-xl" onClick={() => window.location.href='/dashboard/admin-finance'}>
                     FINANCEIRO
                  </Button>
                  <Button variant="outline" className="border-[#0F0]/20 hover:bg-[#0F0]/10 text-[#0F0] text-[10px] h-10 rounded-xl" onClick={() => window.location.href='/dashboard/feed'}>
                     VOLTAR
                  </Button>
                </div>
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
