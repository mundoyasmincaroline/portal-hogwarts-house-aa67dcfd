import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Lock, 
  Terminal, 
  HardDrive, 
  Activity, 
  Cpu, 
  ShieldCheck,
  EyeOff,
  Zap,
  Key,
  Users
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * ZionVault: O Bunker Tecnológico e Engine do Portal.
 * Protocolo Zion - Segurança, Performance e Legado.
 */
const ZionVault: React.FC = () => {
  const { profile } = useAuth();
  const [accessGranted, setAccessGranted] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [systemStatus, setSystemStatus] = useState("SECURE");

  // Acesso exclusivo Zion (Família Nuclear)
  const isFamily = (profile?.username?.toLowerCase() || '').includes('yasmin') || 
                   (profile?.username?.toLowerCase() || '').includes('carol') || 
                   profile?.username?.toLowerCase() === 'morpheus' ||
                   (profile?.full_name?.toLowerCase() || '').includes('paulo');

  const verifyPasscode = () => {
    if (passcode === "ZION2026" || profile?.username === 'morpheus') {
      setAccessGranted(true);
      toast.success("ACESSO CONCEDIDO - PROTOCOLO ZION ATIVADO");
    } else {
      toast.error("ACESSO NEGADO - INTRUSO DETECTADO");
      setSystemStatus("THREAT_DETECTED");
      setTimeout(() => setSystemStatus("SECURE"), 5000);
    }
  };

  if (!isFamily) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono text-center">
        <div className="max-w-md w-full p-8 border-2 border-red-900 bg-red-950/10 rounded-lg space-y-6">
          <ShieldAlert className="text-red-600 mx-auto animate-pulse" size={60} />
          <h1 className="text-2xl text-red-500 font-bold tracking-widest uppercase">ZONA RESTRITA: ZION</h1>
        </div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 font-mono relative overflow-hidden">
        {/* Zion Background Grid */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[180px] animate-pulse" />
        
        <div className="max-w-md w-full glass rounded-[3rem] p-1 border border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.1)] relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50" />
          <div className="relative glass-dark rounded-[2.9rem] p-12 border border-emerald-500/10 space-y-12 text-center">
            <div className="relative mx-auto w-24 h-24 group">
               <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse group-hover:bg-emerald-500/40 transition-all" />
               <div className="relative z-10 w-full h-full bg-black/80 border-2 border-emerald-500/40 rounded-[2rem] flex items-center justify-center backdrop-blur-xl shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <Cpu size={48} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
               </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-heading text-emerald-500 tracking-tighter drop-shadow-2xl uppercase">Zion Terminal</h2>
              <p className="text-[10px] text-emerald-500/40 uppercase tracking-[0.5em] font-bold">Autenticação de Segurança Nível 9</p>
            </div>

            <div className="space-y-6">
               <div className="relative group">
                  <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input 
                    type="password"
                    placeholder="PASSCODE"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="relative w-full bg-black/60 border-2 border-emerald-900/50 rounded-2xl px-6 py-5 text-emerald-500 text-center text-2xl tracking-[0.8em] font-bold outline-none focus:border-emerald-500 transition-all shadow-inner"
                  />
               </div>
               <Button 
                 variant="magical"
                 className="w-full h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-black font-heading text-xl font-bold shadow-[0_15px_40px_rgba(16,185,129,0.3)] animate-pulse-glow" 
                 onClick={verifyPasscode}
               >
                  ENTER ZION <Key size={20} className="ml-3" />
               </Button>
            </div>
            
            <p className="text-[9px] text-emerald-900 font-mono tracking-widest uppercase">Encriptação Assimétrica Ativa</p>
          </div>
        </div>
        
        {/* Scanning Effect */}
        <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500/30 shadow-[0_0_15px_#10b981] animate-scan pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-emerald-500 font-mono p-4 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <Terminal className="absolute top-10 left-10 text-emerald-900/30" size={500} />
      </div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-b border-emerald-900/30 pb-12">
          <div className="space-y-6">
            <h2 className="text-5xl md:text-8xl font-heading text-emerald-500 tracking-tighter drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">PROTOCOLO ZION</h2>
            <div className="flex flex-wrap items-center gap-8 text-[11px] font-bold tracking-[0.3em] uppercase text-emerald-900">
               <span className="flex items-center gap-3 px-4 py-1 bg-emerald-500/5 rounded-full border border-emerald-500/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> STATUS: <span className="text-emerald-500">{systemStatus}</span>
               </span>
               <span className="px-4 py-1 bg-emerald-500/5 rounded-full border border-emerald-500/10">LATENCY: <span className="text-emerald-500">0.003ms</span></span>
               <span className="px-4 py-1 bg-emerald-500/5 rounded-full border border-emerald-500/10">KERNEL: <span className="text-emerald-500">v9.1-GOLD</span></span>
            </div>
          </div>
          <div className="flex gap-6">
             <Button 
               variant="outline" 
               className="h-16 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-[2rem] px-10 uppercase text-xs font-bold glass-plaque shadow-2xl"
               onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}
             >
                <Zap size={18} className="mr-3" /> Zion Override
             </Button>
             <Button variant="outline" className="h-16 border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-[2rem] px-10 uppercase text-xs font-bold shadow-2xl">
                <Lock size={18} className="mr-3" /> Lockdown
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <MetricCard title="Membros Ativos" value="1.2k" sub="↑ 12% hoje" icon={<Users size={24} />} />
               <MetricCard title="Tráfego de Dados" value="45.2 GB" sub="ESTÁVEL" icon={<Activity size={24} />} />
               <MetricCard title="Feitiços Ativos" value="890" sub="INTEGRIDADE 100%" icon={<Zap size={24} />} />
            </div>

            <div className="glass-dark border-emerald-900/30 p-10 rounded-[2.5rem] border-l-8 border-l-emerald-500 bg-emerald-950/5 relative overflow-hidden shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent" />
               <h3 className="text-sm font-bold uppercase tracking-[0.5em] mb-10 flex items-center justify-between relative z-10">
                  <span className="flex items-center gap-4 text-emerald-500"><HardDrive size={24} /> Zion Portal Engine</span>
                  <span className="text-emerald-900 text-xs">BUILD: 220426-EXTREME</span>
               </h3>
               
               <div className="space-y-8 relative z-10">
                  <div className="p-8 bg-black/60 border border-emerald-900/30 rounded-3xl flex flex-col gap-6 shadow-inner">
                     <div className="flex justify-between text-xs font-bold">
                        <span className="text-emerald-500 tracking-[0.3em] uppercase">Portal Core Load</span>
                        <span className="text-emerald-300">24%</span>
                     </div>
                     <div className="h-3 w-full bg-emerald-950 rounded-full overflow-hidden border border-emerald-500/10">
                        <div className="h-full bg-gradient-to-r from-emerald-800 via-emerald-500 to-emerald-800 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: '24%' }}>
                           <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/shattered-island.png')] opacity-20" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="glass-dark border-emerald-500/20 p-10 rounded-[2.5rem] bg-emerald-950/10 shadow-2xl h-full border border-emerald-500/10">
               <h4 className="text-xs font-bold uppercase tracking-[0.5em] mb-8 text-emerald-500">Security Logs</h4>
               <div className="space-y-3 font-mono text-sm text-emerald-900/80">
                  <p className="text-emerald-500 animate-pulse font-bold flex gap-3">
                     <span className="text-emerald-900">[OK]</span> 
                     Mainframe Initialized...
                  </p>
                  <p className="flex gap-3">
                     <span className="text-emerald-900">[LOG]</span> 
                     Passcode verified for: {profile?.username}
                  </p>
                  <p className="text-emerald-500 animate-pulse font-bold flex gap-3">
                     <span className="text-emerald-900">[OK]</span> 
                     Protocols green. Zion Online.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .glass-dark { background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(20px); }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #065f46; }
      `}</style>
    </div>
  );
};

const MetricCard = ({ title, value, sub, icon }: { title: string, value: string, sub: string, icon: any }) => (
  <div className="bg-black/60 border border-emerald-900/30 p-5 rounded-none flex flex-col gap-2 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">{icon}</div>
    <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">{title}</p>
    <p className="text-2xl font-bold text-emerald-300 tracking-tighter">{value}</p>
    <p className="text-[8px] text-emerald-900 font-mono italic">{sub}</p>
  </div>
);

export default ZionVault;
