import { useState, useEffect } from "react";
import { Info, Sparkles } from "lucide-react";

interface MagicalAdBannerProps {
  id?: string;
  type?: 'banner' | 'square' | 'sidebar';
}

/**
 * MagicalAdBanner - Preparado para Google Ads ou Patrocínios Mágicos.
 * Design imersivo que não quebra a experiência "Monster Quality".
 */
export default function MagicalAdBanner({ id = "magical-ad-default", type = 'banner' }: MagicalAdBannerProps) {
  const [adEnabled, setAdEnabled] = useState(false);

  useEffect(() => {
    // Aqui você integraria o script do Google Ads (adsbygoogle)
    // Se quiser habilitar agora, mude para true ou use uma variável de ambiente
    // setAdEnabled(true);
  }, []);

  return (
    <div className={`relative group my-8 ${type === 'banner' ? 'w-full' : 'w-auto'}`}>
      <div className="absolute -top-3 left-6 z-20 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
        <Info size={10} className="text-muted-foreground" />
        <span className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Publicidade Mágica</span>
      </div>

      <div className={`glass rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/5 via-black/40 to-white/5 overflow-hidden shadow-2xl relative min-h-[120px] flex items-center justify-center`}>
        {/* Camada de Imersão */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none" />
        
        {adEnabled ? (
          <div className="w-full flex justify-center">
            {/* O Google Ads injetaria o código aqui */}
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-SEU_ID_AQUI"
                 data-ad-slot="SEU_SLOT_AQUI"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-8 text-center animate-in fade-in zoom-in duration-1000">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <Sparkles size={32} className="text-primary/40 relative z-10" />
            </div>
            <div>
              <h4 className="font-heading text-lg text-white/30 uppercase tracking-widest">Patrocínio Bruxo</h4>
              <p className="text-xs text-muted-foreground/40 font-serif italic max-w-md">
                "Este espaço está reservado para as grandes guildas e mercadores de Diagon Alley. Interessado em conjurar sua marca aqui?"
              </p>
            </div>
          </div>
        )}

        {/* Efeito de Shimmer Mágico */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      </div>
    </div>
  );
}
