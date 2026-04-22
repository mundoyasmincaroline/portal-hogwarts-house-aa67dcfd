import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, Play, Volume2 } from "lucide-react";
import { toast } from "sonner";

export default function MagicAdBanner() {
  const [ads, setAds] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

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
    }, 12000); // Mais tempo para ler/ver
    return () => clearInterval(interval);
  }, [ads.length]);

  const handleAdClick = async (ad: any) => {
    // Rastrear clique (Morpheus Analytics)
    const { data: current } = await supabase.from("ads").select("clicks").eq("id", ad.id).single();
    const clicks = (current?.clicks || 0) + 1;
    await supabase.from("ads").update({ clicks } as never).eq("id", ad.id);
    
    // Efeito sonoro mágico
    const audio = new Audio("https://www.soundjay.com/misc/sounds/magic-chime-01.mp3");
    audio.volume = 0.2;
    audio.play().catch(() => {});
    
    toast.info(`🪄 Transportando para o Beco Diagonal: ${ad.title}`);
  };

  if (ads.length === 0) return null;

  const ad = ads[currentAdIndex];
  const isVideo = ad.image_url?.includes(".mp4") || ad.image_url?.includes("tiktok.com");

  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] border-2 border-yellow-500/20 bg-black/60 backdrop-blur-3xl transition-all duration-700 hover:border-yellow-500/50 hover:shadow-[0_20px_60px_rgba(234,179,8,0.3)] mb-8">
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {isVideo ? (
          <video 
            src={ad.image_url} 
            autoPlay 
            muted 
            loop 
            className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-50 transition-all duration-1000"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-black to-blue-900/30 opacity-60" />
            <img 
              src={ad.image_url} 
              alt="" 
              className="w-full h-full object-cover opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-10000" 
            />
          </>
        )}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-20 mix-blend-multiply" />
      </div>

      {/* Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-float opacity-40" style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 2}s`
          }} />
        ))}
      </div>
      
      <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-600/20 to-transparent backdrop-blur-md text-yellow-400 text-[10px] uppercase font-bold px-6 py-2.5 rounded-bl-[2rem] border-l border-b border-yellow-500/20 z-10 tracking-[0.2em] flex items-center gap-3">
        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
        PROMOÇÃO PROFETA DIÁRIO
      </div>
      
      <a 
        href={ad.link} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={() => handleAdClick(ad)}
        className="flex flex-col md:flex-row items-center gap-8 p-8 relative z-10"
      >
        <div className="relative shrink-0 w-full md:w-40 h-40 group-hover:rotate-2 transition-transform duration-500">
          <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
          <div className="relative z-10 w-full h-full rounded-[2rem] overflow-hidden border-4 border-yellow-500/30 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            {isVideo ? (
               <div className="w-full h-full bg-black flex items-center justify-center">
                 <Play size={40} className="text-yellow-500/50" />
               </div>
            ) : (
               <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {isVideo && (
               <div className="absolute bottom-3 right-3 p-1.5 bg-black/60 rounded-full border border-white/10">
                 <Volume2 size={12} className="text-white/60" />
               </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0 text-center md:text-left space-y-4">
          <div className="space-y-2">
            <h4 className="font-heading text-3xl md:text-4xl text-gold-gradient drop-shadow-lg leading-none">{ad.title}</h4>
            <p className="text-sm md:text-base text-yellow-100/60 font-serif italic leading-relaxed line-clamp-2">
              "{ad.description || "Uma oportunidade única revelada pelas estrelas. Adquira este artefato antes que o feitiço expire."}"
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Button variant="plaque" className="w-full sm:w-auto h-14 px-10 rounded-2xl text-lg bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 border-none shadow-[0_10px_30px_rgba(234,179,8,0.4)] hover:scale-105 active:scale-95 transition-all">
              INVOCAR OFERTA <ExternalLink size={18} className="ml-2 animate-pulse" />
            </Button>
            <div className="flex flex-col items-center sm:items-start">
               <span className="text-[10px] text-yellow-500/40 uppercase tracking-[0.3em] font-bold">Verificado pelo</span>
               <span className="text-xs text-yellow-500/60 font-heading tracking-widest">MINISTÉRIO DA MAGIA</span>
            </div>
          </div>
        </div>
      </a>

      {/* Cinematic Scanner Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent h-20 -translate-y-full group-hover:animate-scan pointer-events-none" />
    </div>
  );
}
