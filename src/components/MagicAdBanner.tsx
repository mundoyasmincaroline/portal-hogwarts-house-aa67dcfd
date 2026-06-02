import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

import EmojiIcon from "@/components/shared/EmojiIcon";
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
    }, 8000); // Roda a cada 8 segundos
    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[currentAdIndex];

  return (
    <div className="relative overflow-hidden glass rounded-2xl border border-primary/10 p-0.5 group mb-4">
      <div className="absolute top-2 right-2 bg-primary/20 text-primary text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-full z-10 backdrop-blur-sm border border-primary/10">
        Recomendado
      </div>
      
      <a 
        href={ad.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-card/20 hover:bg-card/40 transition-all rounded-[1.4rem] p-2"
      >
        {ad.image_url && (
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-primary/10">
            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-heading text-primary text-xs line-clamp-1 leading-tight mb-0.5">{ad.title}</h4>
          <p className="text-[10px] text-foreground/75 line-clamp-1 mb-1.5 font-serif italic">
            Oferta exclusiva no Beco Diagonal
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-primary uppercase tracking-tighter group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Ver Detalhes <EmojiIcon e="🪄" />
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}
