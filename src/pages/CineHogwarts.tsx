import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CineHogwarts() {
  const { isAdmin } = useAuth();
  const [cinemaConfig, setCinemaConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    const fetchCinema = async () => {
      const { data } = await supabase.from("system_settings").select("value").eq("key", "cinema_config").single();
      if (data) {
        const val = data.value as { url?: string; title?: string; active?: boolean };
        setCinemaConfig(val);
        setEditUrl(val.url || "");
        setEditTitle(val.title || "");
      }
      setLoading(false);
    };
    fetchCinema();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Arrumando as poltronas mágicas...</div>;
  }

  const saveCinema = async () => {
    const newValue = { url: editUrl, title: editTitle, active: true };
    await supabase.from("system_settings").upsert({ key: "cinema_config", value: newValue } as never);
    setCinemaConfig(newValue);
    setEditMode(false);
    toast.success("Cinema atualizado com sucesso!");
  };

  if (!cinemaConfig || !cinemaConfig.active || !cinemaConfig.url) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-1000">
        {isAdmin && (
          <div className="relative group bg-black/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl flex flex-wrap gap-4 items-center">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-heading text-xs">MOD</div>
            <Input 
              placeholder="Título do Evento" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)} 
              className="flex-1 bg-white/5 border-white/10 text-white min-w-[200px]"
            />
            <Input 
              placeholder="URL do YouTube" 
              value={editUrl} 
              onChange={(e) => setEditUrl(e.target.value)} 
              className="flex-1 bg-white/5 border-white/10 text-white min-w-[200px]"
            />
            <Button variant="magical" onClick={saveCinema} className="px-8 shadow-lg shadow-primary/20">Abrir Portais 📽️</Button>
          </div>
        )}

        <div className="relative group overflow-hidden bg-black/60 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.8)] p-20 text-center min-h-[600px] flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black pointer-events-none" />
          
          <div className="relative z-10 space-y-8 max-w-xl">
             <div className="w-32 h-32 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center mx-auto shadow-2xl animate-float group-hover:border-primary/40 transition-colors duration-700">
                <span className="text-6xl drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">📽️</span>
             </div>
             
             <div className="space-y-4">
                <h1 className="font-heading text-5xl text-white tracking-tighter italic uppercase">Hogwarts Cinema</h1>
                <p className="text-[10px] font-heading text-primary uppercase tracking-[0.6em] animate-pulse">A Cortina está Fechada</p>
             </div>

             <div className="bg-white/[0.03] backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                <p className="text-sm text-white/40 font-serif italic leading-loose">
                   "O grande salão de cinema aguarda o próximo encantamento. No momento, as poltronas mágicas estão vazias e o silêncio domina a tela."
                </p>
             </div>

             <div className="pt-8 flex flex-col items-center gap-4">
                <p className="text-[9px] font-heading text-white/10 uppercase tracking-[0.4em]">Próxima Sessão: Em Breve</p>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-ping" />
             </div>
          </div>
          
          {/* Light Beams */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-primary/20 to-transparent -rotate-12 opacity-20" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-primary/20 to-transparent rotate-12 opacity-20" />
        </div>
      </div>
    );
  }

  // Convert youtube URL to embed URL
  let embedUrl = cinemaConfig.url;
  if (embedUrl.includes("youtube.com/watch?v=")) {
    embedUrl = embedUrl.replace("watch?v=", "embed/");
  } else if (embedUrl.includes("youtu.be/")) {
    embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/");
  }

  if (embedUrl.includes("youtube.com/embed/")) {
    embedUrl += embedUrl.includes("?") ? "&autoplay=1" : "?autoplay=1";
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
      {isAdmin && (
        <div className="relative group bg-black/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl flex flex-wrap gap-4 items-center z-50">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-heading text-xs">MOD</div>
          <Input 
            placeholder="Título" 
            value={editTitle} 
            onChange={(e) => setEditTitle(e.target.value)} 
            className="flex-1 bg-white/5 border-white/10 text-white min-w-[150px]"
          />
          <Input 
            placeholder="URL YouTube" 
            value={editUrl} 
            onChange={(e) => setEditUrl(e.target.value)} 
            className="flex-1 bg-white/5 border-white/10 text-white min-w-[150px]"
          />
          <Button variant="magical" onClick={saveCinema}>Atualizar ✨</Button>
          <Button variant="destructive" onClick={async () => {
             const newValue = { url: "", title: "", active: false };
             await supabase.from("system_settings").upsert({ key: "cinema_config", value: newValue } as never);
             setCinemaConfig(newValue);
          }} className="rounded-xl">Desligar 💀</Button>
        </div>
      )}

      {/* Cinema Header - MONSTER QUALITY */}
      <div className="relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-2xl p-10 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[100px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <p className="text-[10px] font-heading text-primary uppercase tracking-[0.5em] mb-2 animate-pulse">Sessão Exclusiva de Hogwarts</p>
          <h1 className="font-heading text-4xl text-white tracking-tighter uppercase italic leading-none drop-shadow-2xl">
            🎬 {cinemaConfig.title || "Cinema Mágico"} 🍿
          </h1>
          <p className="text-sm text-white/30 font-serif italic max-w-lg mx-auto">
            "Acomode-se com seus amigos e deixe que a luz mágica conte uma história..."
          </p>
        </div>
      </div>

      {/* Projection Screen - MONSTER QUALITY */}
      <div className="relative group/screen">
        {/* Cinematic Glow */}
        <div className="absolute -inset-10 bg-primary/5 blur-[100px] opacity-0 group-hover/screen:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        {/* Frame Structure */}
        <div className="relative z-10 bg-black rounded-[4rem] p-4 md:p-8 border-[1px] border-white/10 shadow-[0_100px_150px_rgba(0,0,0,1)] overflow-hidden">
           {/* Inner Shadow Frame */}
           <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-20 pointer-events-none" />
           
           <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-black ring-1 ring-white/5">
             <iframe 
               src={embedUrl} 
               title={cinemaConfig.title}
               className="absolute top-0 left-0 w-full h-full"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
               allowFullScreen
             ></iframe>
           </div>

           {/* Light Reflectors */}
           <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-20 bg-primary/10 blur-3xl opacity-50" />
        </div>

        {/* Floor Reflection Effect */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-t from-transparent via-primary/5 to-transparent blur-3xl opacity-20 pointer-events-none" />
      </div>
      
      {/* Footer Info - MONSTER QUALITY */}
      <div className="max-w-xl mx-auto bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 text-center space-y-4">
        <div className="flex justify-center gap-6">
           <div className="text-center">
              <p className="text-[8px] font-heading text-white/20 uppercase tracking-widest mb-1">Status</p>
              <p className="text-[10px] font-heading text-green-400 uppercase tracking-widest">Ao Vivo ⚡</p>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div className="text-center">
              <p className="text-[8px] font-heading text-white/20 uppercase tracking-widest mb-1">Qualidade</p>
              <p className="text-[10px] font-heading text-white uppercase tracking-widest italic">4K Mágico</p>
           </div>
        </div>
        <p className="text-[10px] font-serif text-white/30 italic">
          "A magia do cinema une todos os bruxos em silêncio e deslumbramento."
        </p>
      </div>
    </div>
  );
}
