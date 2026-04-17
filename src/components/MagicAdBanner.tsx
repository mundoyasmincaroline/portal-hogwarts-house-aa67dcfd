import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
    <div className="relative overflow-hidden glass rounded-xl border border-primary/30 p-1 group animate-pulse-glow mb-4">
      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-bl-lg z-10">
        Recomendação Oficial
      </div>
      
      <a 
        href={ad.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex flex-col md:flex-row items-center gap-4 bg-card/40 hover:bg-card/60 transition-colors rounded-lg p-3"
      >
        {ad.image_url && (
          <div className="w-full md:w-24 h-24 rounded-md overflow-hidden shrink-0 border border-primary/20">
            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
        )}
        
        <div className="flex-1 min-w-0 text-center md:text-left">
          <h4 className="font-heading text-primary text-sm line-clamp-2 leading-tight mb-1">{ad.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            Disponível no Beco Diagonal (TikTok Shop). Estoque limitado!
          </p>
          <Button variant="magical" size="sm" className="w-full md:w-auto h-7 text-xs">
            Ver Oferta 🪄
          </Button>
        </div>
      </a>
    </div>
  );
}
