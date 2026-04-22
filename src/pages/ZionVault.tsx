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
                   profile?.username === 'morpheus';

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-mono relative overflow-hidden">
        <div className="max-w-sm w-full glass-dark p-10 rounded-3xl border border-emerald-500/20 relative z-10 space-y-8">
          <div className="text-center">
            <Cpu className="text-emerald-500 mx-auto mb-4 animate-spin-slow" size={48} />
            <h2 className="text-emerald-500 text-xl font-bold tracking-[0.3em] uppercase">Zion Terminal</h2>
          </div>
          <div className="space-y-4">
             <input 
              type="password"
              placeholder="PASSCODE"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-black/80 border border-emerald-900/50 rounded-xl px-4 py-4 text-emerald-500 text-center tracking-[1em] outline-none"
             />
             <Button className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-black font-bold" onClick={verifyPasscode}>
                ENTER ZION
             </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-emerald-500 font-mono p-4 md:p-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <Terminal className="absolute top-10 left-10 text-emerald-900/30" size={300} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-emerald-900/50 pb-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-heading text-emerald-500 tracking-tighter">PROTOCOLO ZION</h2>
            <div className="flex items-center gap-6 text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-900">
               <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> STATUS: {systemStatus}
               </span>
               <span>LATENCY: 0.003ms</span>
            </div>
          </div>
          <div className="flex gap-4">
             <Button 
               variant="outline" 
               className="border-primary/40 text-primary hover:bg-primary/10 rounded-xl px-8 uppercase text-[10px] font-bold glass-plaque"
               onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}
             >
                <Zap size={16} className="mr-2" /> Zion Override
             </Button>
             <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl px-8 uppercase text-[10px] font-bold">
                <Lock size={16} className="mr-2" /> Lockdown
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <MetricCard title="Membros Ativos" value="1.2k" sub="↑ 12% hoje" icon={<Users size={16} />} />
               <MetricCard title="Tráfego de Dados" value="45.2 GB" sub="Estável" icon={<Activity size={16} />} />
               <MetricCard title="Feitiços Ativos" value="890" sub="Integridade 100%" icon={<Zap size={16} />} />
            </div>

            <div className="glass-dark border-emerald-900/30 p-8 rounded-none border-l-4 border-l-emerald-500 bg-emerald-950/5">
               <h3 className="text-xs font-bold uppercase tracking-[0.4em] mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-3"><HardDrive size={18} /> Zion Portal Engine</span>
                  <span className="text-emerald-900 text-[10px]">BUILD: 220426-EXTREME</span>
               </h3>
               
               <div className="space-y-4">
                  <div className="p-4 bg-black/60 border border-emerald-900/20 flex flex-col gap-3">
                     <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-emerald-500 tracking-widest">PORTAL LOAD</span>
                        <span className="text-emerald-300">24%</span>
                     </div>
                     <div className="h-1.5 w-full bg-emerald-950">
                        <div className="h-full bg-emerald-500" style={{ width: '24%' }} />
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="glass-dark border-emerald-500/20 p-8 rounded-none bg-emerald-950/10">
               <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Security Logs</h4>
               <div className="max-h-[200px] overflow-y-auto space-y-1 font-mono text-[11px] text-emerald-900 custom-scrollbar">
                  <p className="text-emerald-500 animate-pulse">[OK] Mainframe Initialized...</p>
                  <p>[LOG] Passcode verified for: {profile?.username}</p>
                  <p className="text-emerald-500 animate-pulse">[OK] Protocols green.</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .glass-dark { background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px); }
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
