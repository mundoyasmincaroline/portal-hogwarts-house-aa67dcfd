import React, { useState } from "react";
import { 
  ShieldAlert, 
  Zap, 
  RotateCcw, 
  Heart, 
  LayoutDashboard, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Users,
  Trophy,
  Lock,
  Globe
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * GodDashboard: O Centro de Comando Omnipresente do Arquiteto.
 * Unifica os 4 núcleos: Zion, Revolution, Reload e Família.
 */
const GodDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeNucleus, setActiveNucleus] = useState<string | null>(null);

  const isArchitect = profile?.username === 'morpheus';

  if (!isArchitect) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center space-y-4">
           <Lock size={60} className="text-red-600 mx-auto animate-pulse" />
           <h1 className="text-red-500 font-heading text-4xl">ACESSO NEGADO</h1>
           <p className="text-red-900 font-serif italic">"Apenas o Arquiteto pode ver a totalidade do sistema."</p>
        </div>
      </div>
    );
  }

  const nuclei = [
    { 
      id: 'zion', 
      name: 'ZION', 
      desc: 'Segurança & Infraestrutura', 
      icon: <ShieldCheck size={40} />, 
      color: 'emerald', 
      path: '/dashboard/zion' 
    },
    { 
      id: 'revolution', 
      name: 'REVOLUTION', 
      desc: 'Escala & Monetização', 
      icon: <TrendingUp size={40} />, 
      color: 'amber', 
      path: '/dashboard/revolution' 
    },
    { 
      id: 'reload', 
      name: 'RELOAD', 
      desc: 'Estabilidade & Reset', 
      icon: <RefreshCw size={40} />, 
      color: 'blue', 
      path: '#' 
    },
    { 
      id: 'family', 
      name: 'FAMÍLIA', 
      desc: 'Conexão & Afeto', 
      icon: <Heart size={40} />, 
      color: 'pink', 
      path: '/dashboard/decisions' 
    }
  ];

  const handleReload = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Iniciando PROTOCOLO RELOAD... Limpando cache mágico.',
        success: 'REALIDADE REINICIADA. Portal estável e limpo.',
        error: 'Falha no Reload.',
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-heading p-6 md:p-12 relative overflow-hidden">
      {/* Estética God Mode */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-pink-500 opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        <header className="flex justify-between items-end border-b border-white/10 pb-8">
           <div>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.5em] mb-2 font-bold">God Mode Activated</p>
              <h1 className="text-5xl md:text-7xl font-heading tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white/70 to-white/30">
                Omnipresença
              </h1>
           </div>
           <div className="text-right hidden md:block">
              <p className="text-xs text-white/60 font-serif italic">"Onde houver dados, haverá controle."</p>
              <p className="text-[10px] text-emerald-500 font-bold mt-1">SISTEMA OPERACIONAL V7.0</p>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {nuclei.map((n) => (
             <div 
              key={n.id}
              onClick={() => n.id === 'reload' ? handleReload() : navigate(n.path)}
              className={`group relative glass-dark border-${n.color}-500/20 p-10 rounded-[2.5rem] cursor-pointer hover:border-${n.color}-500/50 transition-all shadow-2xl overflow-hidden`}
             >
                {/* Glow Background */}
                <div className={`absolute -right-10 -top-10 w-40 h-40 bg-${n.color}-500/5 blur-[60px] group-hover:bg-${n.color}-500/20 transition-all`} />
                
                <div className="relative z-10 flex flex-col gap-6">
                   <div className={`text-${n.color}-500 group-hover:scale-110 transition-transform duration-500`}>
                      {n.icon}
                   </div>
                   <div>
                      <h3 className={`text-2xl font-bold tracking-widest text-${n.color}-400 group-hover:text-white transition-colors`}>{n.name}</h3>
                      <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">{n.desc}</p>
                   </div>
                   <div className="flex items-center gap-2 text-[10px] text-white/20 font-bold uppercase mt-4">
                      ACESSAR NÚCLEO <ArrowRight size={12} />
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
           <div className="glass-dark p-6 rounded-3xl border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest">
                 <Globe size={14} /> STATUS MUNDIAL
              </div>
              <p className="text-emerald-500 font-bold">PORTAL OPERACIONAL</p>
              <div className="h-1 w-full bg-white/5"><div className="h-full bg-emerald-500" style={{width: '98%'}} /></div>
           </div>
           <div className="glass-dark p-6 rounded-3xl border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest">
                 <Users size={14} /> ENGAJAMENTO BFF
              </div>
              <p className="text-pink-500 font-bold">YASMIN & ANITA: ATIVAS</p>
              <div className="h-1 w-full bg-white/5"><div className="h-full bg-pink-500" style={{width: '100%'}} /></div>
           </div>
           <div className="glass-dark p-6 rounded-3xl border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest">
                 <Zap size={14} /> MONETIZAÇÃO
              </div>
              <p className="text-amber-500 font-bold">FLUXO GRINGOTTS: ALTO</p>
              <div className="h-1 w-full bg-white/5"><div className="h-full bg-amber-500" style={{width: '85%'}} /></div>
           </div>
        </div>
      </div>

      <style>{`
        .glass-dark {
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};

export default GodDashboard;
