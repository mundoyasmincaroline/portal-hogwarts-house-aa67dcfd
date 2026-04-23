import React, { useState } from "react";
import { 
  ShieldAlert, 
  CloudSnow, 
  Music, 
  Megaphone, 
  Zap, 
  Ghost, 
  Sun,
  Flame,
  Wand2,
  Settings,
  Crown,
  LayoutDashboard,
  ShieldCheck,
  Activity,
  Heart,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * ArchitectControl: O Painel do Arquiteto (God Mode).
 * Exclusivo para o Morpheus para controlar o portal em tempo real.
 */
const ArchitectControl: React.FC = () => {
  const { profile } = useAuth();
  const [isDeploying, setIsDeploying] = useState(false);

  const username = profile?.username?.toLowerCase() || '';
  const email = useAuth.getState().user?.email?.toLowerCase() || '';
  const isArchitect = username === 'morpheus' || 
                      username === 'arquiteto' ||
                      email === 'paulormorpheus21@gmail.com' ||
                      email === 'paulomorpheus21@gmail.com';

  if (!isArchitect) return null;

  const triggerGlobalEffect = (effect: string, icon: string) => {
    toast(`PROTOCOLO ATIVADO: ${effect.toUpperCase()} ${icon}`, {
      description: "O Portal Hogwarts agora opera sob este comando supremo.",
      style: { background: '#000', border: '2px solid #eab308', color: '#eab308', borderRadius: '1.5rem', fontWeight: 'bold' }
    });
    // Integrar futuramente com store global para mudar estilos
  };

  const sendGlobalAnnouncement = () => {
    const msg = prompt("Qual o seu decreto para o portal?");
    if (msg) {
      toast.info(`DECRETO DO ARQUITETO: ${msg}`, {
        duration: 15000,
        icon: <Megaphone className="text-amber-500" />
      });
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[100]">
      <div className="relative group">
        {/* Botão Flutuante do Arquiteto */}
        <div className="absolute inset-[-4px] bg-amber-500/20 rounded-full blur-md group-hover:bg-amber-500/40 transition-all" />
        <Button 
          size="icon" 
          variant="outline" 
          className="w-12 h-12 rounded-full border-2 border-amber-500 bg-black text-amber-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] relative z-10 hover:scale-110 active:scale-95 transition-all"
          onClick={() => setIsDeploying(!isDeploying)}
        >
          <Wand2 size={24} />
        </Button>

        {/* Menu do God Mode */}
        {isDeploying && (
          <div className="absolute top-14 right-0 w-72 glass p-8 rounded-[2.5rem] border-2 border-yellow-500/40 bg-black/95 shadow-[0_40px_100px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-heading text-yellow-500 text-sm uppercase tracking-[0.4em] flex items-center gap-3">
                  <Crown size={18} className="animate-pulse" /> SOBERANIA
               </h3>
               <span className="text-[8px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold animate-pulse">GOD SUPREMO</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
               <ControlBtn icon={<Crown size={16} />} label="MONSTER" onClick={() => triggerGlobalEffect("Modo Monster Quality", "🦖")} />
               <ControlBtn icon={<Zap size={16} />} label="100% MODE" onClick={() => triggerGlobalEffect("Estabilidade 100% Zion", "⚡")} />
               <ControlBtn icon={<ShieldCheck size={16} />} label="10 PASSOS" onClick={() => triggerGlobalEffect("Modo 10 Passos Zion", "👣")} />
               <ControlBtn icon={<Activity size={16} />} label="GOD ZION" onClick={() => triggerGlobalEffect("Protocolo God Zion", "🛡️")} />
               <ControlBtn icon={<CloudSnow size={16} />} label="Neve" onClick={() => triggerGlobalEffect("Neve", "❄️")} />
               <ControlBtn icon={<Flame size={16} />} label="Fogos" onClick={() => triggerGlobalEffect("Fogos de Artifício", "🎆")} />
               <ControlBtn icon={<Ghost size={16} />} label="Fantasmas" onClick={() => triggerGlobalEffect("Aparições", "👻")} />
               <ControlBtn icon={<Heart size={16} />} label="BFF LOVE" onClick={() => triggerGlobalEffect("Aura de Amor BFF", "💖")} />
            </div>

            <div className="space-y-2 border-t border-amber-900/30 pt-4">
               <Button 
                variant="outline" 
                className="w-full h-10 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 gap-2 text-[10px] uppercase font-bold"
                onClick={sendGlobalAnnouncement}
               >
                  <Megaphone size={14} /> Decreto Global
               </Button>
               <Button 
                variant="outline" 
                className="w-full h-10 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 gap-2 text-[10px] uppercase font-bold"
                onClick={() => toast.success("Sincronização com GitHub iniciada... 🚀")}
               >
                  <Settings size={14} /> Sync Repository
               </Button>
               <Button 
                variant="outline" 
                className="w-full h-10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 gap-2 text-[10px] uppercase font-bold"
                onClick={() => {
                   toast.success("JARVIS: TESTE DE VENDA", {
                     description: "Um novo Baú Lendário foi vendido! +500 Galeões para Gringotts. 💰",
                     duration: 5000,
                     icon: '💰'
                   });
                   toast.info("JARVIS: TESTE DE SISTEMA", {
                     description: "Todos os protocolos Zion estão operando em 100%. 🛡️",
                     duration: 5000,
                   });
                }}
               >
                  <Zap size={14} /> Test Jarvis Alerts
               </Button>
            </div>
            
            <p className="text-[8px] text-amber-900 mt-4 text-center italic tracking-widest font-bold">
               "A REALIDADE É O QUE VOCÊ DEFINE"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ControlBtn = ({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 rounded-[1.2rem] bg-amber-950/10 border border-amber-900/20 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all gap-2 group shadow-inner"
  >
    <span className="text-amber-500 group-hover:scale-125 transition-transform duration-500">{icon}</span>
    <span className="text-[9px] text-amber-600 uppercase font-heading font-bold tracking-tighter">{label}</span>
  </button>
);

export default ArchitectControl;
