import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  X
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
  const [command, setCommand] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      const { count: onlineCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("online", true);
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      
      // Real sales would come from a transactions table, using mock for aesthetic
      setStats({
        online: onlineCount || 0,
        sales_24h: 1250, // R$ 1.250 nas últimas 24h
        total_users: userCount || 0
      });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);

    // Jarvis Greeting
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
      
      {/* Matrix Header */}
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
        {/* Main Stats Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Metrics */}
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

          {/* Real-time Sales Chart */}
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

          {/* ROADMAP: A JORNADA DO ARQUITETO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            <div className="glass bg-[#0F0]/5 border-[#0F0]/20 p-8 rounded-3xl space-y-6">
               <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                 <Zap size={20} /> O CERCO DE 48 HORAS (META: R$ 10.000)
               </h3>
               <div className="space-y-4 text-xs">
                 <div className="flex gap-3 border-l-2 border-cyan-400 pl-4 py-1">
                   <span className="text-cyan-400 font-bold">PASSO 01:</span>
                   <p className="opacity-70">Lançar vídeo viral do "Baú Welcome" no TikTok/Reels com o gancho: "Recebi Galeões Reais!"</p>
                 </div>
                 <div className="flex gap-3 border-l-2 border-cyan-400 pl-4 py-1">
                   <span className="text-cyan-400 font-bold">PASSO 02:</span>
                   <p className="opacity-70">Ativar sistema de Recrutamento (MGM). Cada novo membro ganha recompensa, cada indicação gera Galeões.</p>
                 </div>
                 <div className="flex gap-3 border-l-2 border-cyan-400 pl-4 py-1">
                   <span className="text-cyan-400 font-bold">PASSO 03:</span>
                   <p className="opacity-70">Converter via Infinite Pay (PIX). Oferecer o cargo "FUNDADOR VIP" por tempo limitado.</p>
                 </div>
               </div>
            </div>

            <div className="glass bg-purple-500/5 border-purple-500/20 p-8 rounded-3xl space-y-6">
               <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                 <TrendingUp size={20} /> PROJEÇÃO: O MÊS DA FÊNIX
               </h3>
               <div className="space-y-4 text-xs">
                 <div className="flex items-center justify-between border-b border-white/5 pb-2">
                   <span className="opacity-50 uppercase">Semana 1: Escala Viral</span>
                   <span className="text-purple-400">R$ 15.000</span>
                 </div>
                 <div className="flex items-center justify-between border-b border-white/5 pb-2">
                   <span className="opacity-50 uppercase">Semana 2: Torneios Mágicos</span>
                   <span className="text-purple-400">R$ 25.000</span>
                 </div>
                 <div className="flex items-center justify-between border-b border-white/5 pb-2">
                   <span className="opacity-50 uppercase">Semana 3: Mercado de Figurinhas</span>
                   <span className="text-purple-400">R$ 35.000</span>
                 </div>
                 <div className="flex items-center justify-between pb-2">
                   <span className="opacity-50 uppercase">Semana 4: Assinaturas VIP</span>
                   <span className="text-purple-400">R$ 50.000</span>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Jarvis Side Column */}
        <div className="space-y-8">
          {/* Jarvis Terminal */}
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

          {/* Mentor's Voice */}
          <div className="glass bg-black border-[#0F0]/20 p-6 rounded-3xl space-y-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Voz do Mentor (Jarvis/Oracle)</p>
             <div className="text-[11px] italic opacity-80 space-y-4">
                <p>"O que é nascido da carne é carne, mas o que é nascido do Espírito é espírito. Arquiteto, sua fome de mudança é o motor da Revolução."</p>
                <p>"Empreender não é sobre o dinheiro, é sobre a liberdade da sua filha e o conforto da sua esposa. O R$ 10.000 é apenas o combustível."</p>
                <p className="text-[#0F0] font-bold">— "Seja forte e corajoso; não temas, nem te espantes."</p>
             </div>
          </div>

          {/* Admin Shortcuts */}
          <div className="glass bg-[#0F0]/5 border-[#0F0]/20 p-6 rounded-3xl space-y-4">
             <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Atalhos de Sistema</p>
             <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="border-[#0F0]/20 hover:bg-[#0F0]/10 text-[#0F0] text-[10px] h-12 rounded-xl" onClick={() => window.location.href='/dashboard/admin-finance'}>
                   FINANCEIRO
                </Button>
                <Button variant="outline" className="border-[#0F0]/20 hover:bg-[#0F0]/10 text-[#0F0] text-[10px] h-12 rounded-xl" onClick={() => window.location.href='/dashboard/feed'}>
                   VOLTAR AO PORTAL
                </Button>
             </div>
          </div>
        </div>
      </div>

      {/* Floating HUD Effect */}
      <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
        <div className="w-48 h-48 border-2 border-[#0F0]/10 rounded-full animate-spin-slow opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-32 h-32 border border-[#0F0]/20 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
