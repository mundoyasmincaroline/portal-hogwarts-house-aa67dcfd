import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink } from "lucide-react";

export default function MagicAdBanner() {
  const [ads, setAds] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const fetchAds = async () => {
      const { data, error } = await supabase.from("ads").select("*").eq("active", true);
      if (data && !error) {
        setAds(data);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[currentAdIndex];

  return (
    <div className="relative group overflow-hidden rounded-[2rem] border border-yellow-500/30 bg-black/40 backdrop-blur-xl transition-all duration-700 hover:shadow-[0_20px_50px_rgba(234,179,8,0.2)] mb-6">
      {/* Background Cinematic */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-transparent to-blue-900/10 opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none" />
      
      <div className="absolute top-0 right-0 bg-yellow-500/10 backdrop-blur-md text-yellow-400 text-[9px] uppercase font-bold px-4 py-1.5 rounded-bl-[1.5rem] border-l border-b border-yellow-500/20 z-10 tracking-widest flex items-center gap-2">
        <Sparkles size={10} className="animate-pulse" /> Recomendação Especial
      </div>
      
      <a 
        href={ad.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex flex-col md:flex-row items-center gap-6 p-6 relative z-10"
      >
        {ad.image_url && (
          <div className="relative shrink-0 w-full md:w-32 h-32">
            <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border-2 border-yellow-500/30 shadow-2xl">
              <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </div>
        )}
        
        <div className="flex-1 min-w-0 text-center md:text-left space-y-3">
          <div className="space-y-1">
            <h4 className="font-heading text-xl text-gold-gradient line-clamp-1 drop-shadow-md">{ad.title}</h4>
            <p className="text-xs text-muted-foreground/80 line-clamp-2 font-serif italic">
              {ad.description || "Descubra as novidades mais raras do Beco Diagonal diretamente no seu feed."}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button variant="magical" size="sm" className="w-full sm:w-auto h-10 px-8 rounded-xl font-bold shadow-lg shadow-yellow-500/10">
              Ver Detalhes <ExternalLink size={14} className="ml-2" />
            </Button>
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em] font-bold">Verificado por Hogwarts</span>
          </div>
        </div>
      </a>

      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 pointer-events-none" />
    </div>
  );
}
