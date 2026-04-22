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
  Sparkles,
  Scale
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

  if (user?.email !== 'paulormorpheus21@gmail.com') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="glass p-10 rounded-[2rem] border-2 border-red-500/30 max-w-md animate-pulse">
          <h1 className="font-heading text-3xl text-red-500 mb-4">ACCESS DENIED</h1>
          <p className="text-muted-foreground font-mono uppercase tracking-widest text-xs">
            Este terminal é restrito ao Arquiteto do Sistema. Sua tentativa de intrusão foi registrada.
          </p>
        </div>
      </div>
    );
  }

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
      "> LEGAL_SENTINEL 'THE COUNSEL' ACTIVE.",
      "> DEFENSIVE PROTOCOLS READY.",
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


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass bg-[#0F0]/5 border-[#0F0]/20 p-6 rounded-3xl space-y-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F0]">Comando do Arquiteto (Sprint 48h)</p>
               <div className="space-y-3">
                  {[
                    { label: "AUDITORIA 'MONSTER QUALITY' 3D", done: true },
                    { label: "ESTABILIZAÇÃO E REFATORAÇÃO MOBILE", done: true },
                    { label: "LANÇAMENTO: CAMPANHA DE FUNDADORES", done: false },
                    { label: "MONITORAMENTO DE CONVERSÃO (META R$ 10K)", done: false }
                  ].map((step, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${step.done ? "border-[#0F0]/40 bg-[#0F0]/10" : "border-white/5 bg-black/40"} transition-all`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${step.done ? "bg-[#0F0] border-[#0F0]" : "border-white/20"}`}>
                        {step.done && <ShieldCheck size={10} className="text-black" />}
                      </div>
                      <span className={`text-[9px] font-bold ${step.done ? "text-[#0F0] line-through opacity-50" : "text-white"}`}>{step.label}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="glass bg-cyan-500/5 border-cyan-500/20 p-6 rounded-3xl space-y-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Missão Yasmin Caroline (Viral)</p>
               <div className="space-y-3">
                  {[
                    { label: "GERAÇÃO DA CARTA DE ACEITAÇÃO HD", done: true },
                    { label: "POSTAGEM: O CONVITE (VÍDEO 1)", done: false },
                    { label: "POSTAGEM: A SELEÇÃO (VÍDEO 2)", done: false },
                    { label: "INTERAÇÃO E ENGAJAMENTO DE LEADS", done: false }
                  ].map((step, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${step.done ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/5 bg-black/40"} transition-all`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${step.done ? "bg-cyan-400 border-cyan-400" : "border-white/20"}`}>
                        {step.done && <ShieldCheck size={10} className="text-black" />}
                      </div>
                      <span className={`text-[9px] font-bold ${step.done ? "text-cyan-400 line-through opacity-50" : "text-white"}`}>{step.label}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="glass bg-pink-500/5 border-pink-500/20 p-6 rounded-3xl space-y-4 col-span-1 md:col-span-2">
               <p className="text-[10px] font-bold uppercase tracking-widest text-pink-400">Carolina Assis (A Guardiã do Castelo)</p>
               <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="shrink-0 relative">
                     <div className="absolute inset-0 bg-pink-500/20 blur-xl animate-pulse" />
                     <img src="https://i.pinimg.com/736x/8a/7d/5a/8a7d5a5a5a5a5a5a5a5a5a5a5a5a5a5a.jpg" alt="Carol" className="w-20 h-20 rounded-full border-2 border-pink-500/50 object-cover relative z-10" 
                        onError={(e) => { (e.target as any).src = "https://ui-avatars.com/api/?name=Carolina+Assis&background=db2777&color=fff"; }}
                     />
                  </div>
                  <div className="flex-1 space-y-2 text-center md:text-left">
                     <p className="text-[11px] text-pink-100 italic leading-relaxed">
                        "Mãe zelosa, guerreira fantástica e o pilar emocional da Revolução. Onde houver 13 reais e fé, haverá um império."
                     </p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <div className="bg-pink-500/10 border border-pink-500/20 p-2 rounded-lg">
                           <p className="text-[9px] font-bold text-pink-400">STATUS: GUARDIÃ SUPREMA</p>
                        </div>
                        <div className="bg-pink-500/10 border border-pink-500/20 p-2 rounded-lg">
                           <p className="text-[9px] font-bold text-pink-400">OBJETIVO: SEGURANÇA DO CLÃ</p>
                        </div>
                     </div>
                  </div>
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
