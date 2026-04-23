import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, Play, Volume2, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function MagicAdBanner() {
  const { profile } = useAuth();
  const [ads, setAds] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isHiddenByVip, setIsHiddenByVip] = useState(false);
  const isVip = !!profile?.vip_plan;
  const [isSprintActive, setIsSprintActive] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      const { data, error } = await supabase.from("ads").select("*").eq("active", true);
      if (data && !error) {
        setAds(data);
      }
    };

    const fetchSprint = async () => {
      const { data } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "is_sprint_active").maybeSingle();
      if (data) setIsSprintActive((data.setting_value as any)?.active || false);
    };

    fetchAds();
    fetchSprint();
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

  if (ads.length === 0 || isHiddenByVip) return null;

  const ad = ads[currentAdIndex];
  const isVideo = ad.image_url?.includes(".mp4") || ad.image_url?.includes("tiktok.com");

  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] border-2 border-yellow-500/20 bg-black/60 backdrop-blur-3xl transition-all duration-700 hover:border-yellow-500/50 hover:shadow-[0_20px_60px_rgba(234,179,8,0.3)] mb-8">
      {/* VIP Hidden Toggle */}
      {isVip && (
        <button 
          onClick={() => setIsHiddenByVip(true)}
          className="absolute top-2 left-2 z-30 p-2 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 text-white/40 hover:text-white"
          title="Ocultar (Poder VIP)"
        >
          <EyeOff size={14} />
        </button>
      )}

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
      
      {isSprintActive && (
        <div className="absolute top-0 left-0 bg-yellow-500 text-black text-[8px] font-bold px-3 py-1 rounded-br-2xl z-20 animate-pulse shadow-lg">
           REVOLUTION SPRINT: RECOMPENSAS 2X ATIVAS
        </div>
      )}
      
      <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-600/20 to-transparent backdrop-blur-md text-yellow-400 text-[10px] uppercase font-bold px-6 py-2.5 rounded-bl-[2rem] border-l border-b border-yellow-500/20 z-10 tracking-[0.2em] flex items-center gap-3">
        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
        PROMOÇÃO PROFETA DIÁRIO
      </div>
      
      <a 
        href={ad.link} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={() => handleAdClick(ad)}
        className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 p-6 lg:p-12 relative z-10"
      >
        <div className="relative shrink-0 w-full lg:w-64 h-40 lg:h-64 group-hover:rotate-1 transition-transform duration-500">
          <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
          <div className="relative z-10 w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-yellow-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.7)]">
            {isVideo ? (
               <div className="w-full h-full bg-black flex items-center justify-center">
                 <Play size={64} className="text-yellow-500/50" />
               </div>
            ) : (
               <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            {isVideo && (
               <div className="absolute bottom-6 right-6 p-3 bg-black/60 rounded-full border border-white/10">
                 <Volume2 size={18} className="text-white/60" />
               <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(234,179,8,0.5)]" />
        </div>
        
        <div className="flex-1 min-w-0 text-center md:text-left space-y-4">
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-heading text-2xl md:text-3xl text-gold-gradient flex items-center justify-center md:justify-start gap-3 mb-2">
              {!isStandalone ? "Soberania Mobile 📱" : "Corujas Reais 🦉"}
            </h3>
            <p className="text-sm md:text-lg text-yellow-100/70 font-serif italic leading-tight">
              {!isStandalone 
                ? "Para viver a experiência 'Monster Quality' em tela cheia, instale o portal no seu celular agora."
                : "Não perca eventos, duelos e convocações urgentes do Ministério. Ative as notificações push."}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-10">
            <div className="w-full sm:w-auto relative group/btn">
              <Button variant="plaque" className="relative w-full sm:w-auto h-16 lg:h-20 px-8 lg:px-16 rounded-[2.5rem] text-lg lg:text-2xl bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 border-none shadow-[0_25px_50px_rgba(234,179,8,0.5)] hover:scale-105 active:scale-95 transition-all">
                INVOCAR OFERTA <ExternalLink size={20} className="ml-4 animate-pulse lg:w-6 lg:h-6" />
              </Button>
            </div>
            <div className="flex flex-col items-center sm:items-start opacity-80">
               <span className="text-[9px] lg:text-[11px] text-yellow-500 uppercase tracking-[0.5em] font-bold">Verificado pelo</span>
               <span className="text-sm lg:text-lg text-yellow-500 font-heading tracking-[0.3em] font-bold">MINISTÉRIO DA MAGIA</span>
            </div>
          </div>
        </div>
      </a>

      {/* Cinematic Scanner Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent h-20 -translate-y-full group-hover:animate-scan pointer-events-none" />
    </div>
  );
}

