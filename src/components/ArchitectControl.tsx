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
  Settings
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

  const isArchitect = profile?.username === 'morpheus';

  if (!isArchitect) return null;

  const triggerGlobalEffect = (effect: string, icon: string) => {
    toast(`EFEITO GLOBAL ATIVADO: ${effect} ${icon}`, {
      description: "Todos os bruxos no portal sentirão a mudança agora.",
      style: { background: '#000', border: '1px solid #eab308', color: '#eab308' }
    });
    // Aqui no futuro integraríamos com um canal do Supabase Realtime para mudar o CSS globalmente
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
          <div className="absolute top-14 right-0 w-64 glass p-6 rounded-3xl border-amber-500/30 bg-black/90 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-heading text-amber-500 text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
               <ShieldAlert size={14} /> Architect God Mode
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
               <ControlBtn icon={<CloudSnow size={16} />} label="Neve" onClick={() => triggerGlobalEffect("Neve", "❄️")} />
               <ControlBtn icon={<Flame size={16} />} label="Fogos" onClick={() => triggerGlobalEffect("Fogos de Artifício", "🎆")} />
               <ControlBtn icon={<Music size={16} />} label="Música" onClick={() => triggerGlobalEffect("Ambiente Mágico", "🎵")} />
               <ControlBtn icon={<Ghost size={16} />} label="Fantasmas" onClick={() => triggerGlobalEffect("Aparições", "👻")} />
               <ControlBtn icon={<Sun size={16} />} label="Dia" onClick={() => triggerGlobalEffect("Luz do Sol", "☀️")} />
               <ControlBtn icon={<Zap size={16} />} label="Tempestade" onClick={() => triggerGlobalEffect("Raios", "⚡")} />
               <ControlBtn icon={<ShieldAlert size={16} />} label="ZION BUNKER" onClick={() => triggerGlobalEffect("Bunker de Zion Ativado. Portal Selado.", "🛡️")} />
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
    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-950/20 border border-amber-900/30 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all gap-1 group"
  >
    <span className="text-amber-500 group-hover:scale-125 transition-transform">{icon}</span>
    <span className="text-[8px] text-amber-600 uppercase font-bold">{label}</span>
  </button>
);

export default ArchitectControl;
