import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Music, Pizza, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import SafeImage from "./SafeImage";
import { Badge } from "@/components/ui/badge";

export default function MagicalPartyOverlay() {
  const [activeParty, setActiveParty] = useState<any>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    loadActiveParty();
    // Realtime listener para ativação de festas
    const channel = supabase
      .channel("site_events_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_events" }, () => {
        loadActiveParty();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadActiveParty = async () => {
    const { data } = await supabase.from("site_events").select("*").eq("active", true).single();
    setActiveParty(data);
  };

  if (!activeParty) return null;

  if (minimized) {
    return (
      <button 
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-[60] bg-primary text-primary-foreground p-4 rounded-full shadow-2xl animate-bounce hover:scale-110 transition-transform border-4 border-white/20"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="glass w-full max-w-4xl rounded-[3rem] overflow-hidden border border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.4)] relative">
        <button onClick={() => setMinimized(true)} className="absolute top-6 right-6 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex flex-col md:flex-row h-full max-h-[85vh] overflow-y-auto md:overflow-hidden">
          {/* Foto da Festa */}
          <div className="w-full md:w-1/2 relative h-64 md:h-auto">
            <SafeImage src={activeParty.image_url} alt={activeParty.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 space-y-2">
                <Badge variant="magical" className="animate-pulse px-3 py-1 text-sm bg-primary/80 border-none">ACONTECENDO AGORA 🚀</Badge>
                <h2 className="text-4xl font-heading text-white drop-shadow-lg">{activeParty.title}</h2>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="w-full md:w-1/2 p-8 md:p-12 space-y-8 bg-gradient-to-br from-indigo-950/20 to-black flex flex-col justify-center">
            <div className="space-y-4">
                <p className="text-lg text-primary-foreground/90 font-serif leading-relaxed italic">
                "{activeParty.description}"
                </p>
                
                <div className="flex flex-wrap gap-4 pt-4">
                    {activeParty.music_url && (
                        <a href={activeParty.music_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs text-white hover:bg-white/20 transition-colors border border-white/10">
                            <Music size={14} className="text-primary" /> Ouvir Playlist da Festa <ExternalLink size={12} />
                        </a>
                    )}
                </div>
            </div>

            {/* Menu da Festa */}
            {activeParty.foods && activeParty.foods.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-heading text-primary uppercase tracking-widest flex items-center gap-2">
                        <Pizza size={14} /> Banquete da Staff
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {activeParty.foods.map((food: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-secondary/50 rounded-lg text-xs text-muted-foreground border border-border/50">
                                {food}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-4 flex flex-col gap-3">
                <Button variant="magical" size="lg" className="w-full py-8 rounded-2xl text-lg font-bold shadow-xl" onClick={() => setMinimized(true)}>
                    ENTRAR NO SALÃO PRINCIPAL ✨
                </Button>
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-tighter opacity-50">
                    O Portal está em festa! Aproveite o momento com a comunidade.
                </p>
            </div>
          </div>
        </div>

        {/* Efeitos Visuais (Partículas) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
                <div 
                    key={i} 
                    className="absolute w-2 h-2 bg-primary/30 rounded-full animate-ping"
                    style={{ 
                        top: `${Math.random() * 100}%`, 
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${3 + Math.random() * 4}s`
                    }}
                />
            ))}
        </div>
      </div>
    </div>
  );
}
