import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Sticker {
  id: string;
  character_name: string;
  rarity: "bronze" | "silver" | "gold";
  image_url: string;
  level_required: number;
}

export default function ProfileAlbum({ userId }: { userId: string }) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyStickers();
  }, [userId]);

  const loadMyStickers = async () => {
    setLoading(true);
    // Buscamos os user_stickers do usuario e expandimos os dados do sticker associado
    const { data, error } = await supabase
      .from("user_stickers")
      .select("*, stickers(*)")
      .eq("user_id", userId);

    if (data) {
      // Filtrar itens nulos e mapear
      const myStickers = data.map(d => d.stickers as unknown as Sticker).filter(Boolean);
      setStickers(myStickers);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground animate-pulse">Lendo as páginas do álbum...</div>;

  if (stickers.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center border border-border/50">
        <div className="text-4xl mb-4 opacity-50 grayscale">📖</div>
        <p className="text-muted-foreground text-sm">Nenhuma figurinha mágica na coleção ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center glass px-6 py-3 rounded-xl border border-primary/20">
        <span className="text-sm font-heading text-muted-foreground">Progresso da Coleção</span>
        <span className="text-lg font-heading text-primary">{stickers.length} Figurinhas</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stickers.map(s => {
          const isGold = s.rarity === 'gold';
          const isSilver = s.rarity === 'silver';
          
          let rarityStyle = "border-amber-700/50 from-amber-900/40 to-background shadow-lg shadow-amber-900/20";
          if (isSilver) rarityStyle = "border-slate-300/80 from-slate-700/40 to-background shadow-xl shadow-white/10";
          if (isGold) rarityStyle = "border-yellow-400 from-yellow-600/40 to-background shadow-2xl shadow-yellow-500/30 ring-1 ring-yellow-400/50";

          return (
            <div key={s.id} className={`relative aspect-[3/4] rounded-2xl flex flex-col overflow-hidden border-2 transition-all duration-500 group ${rarityStyle}`}>
              <div className="absolute inset-0 z-0">
                <img 
                  src={s.image_url} 
                  alt={s.character_name} 
                  className="w-full h-full object-cover mix-blend-overlay opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
              
              <div className="relative z-10 h-full flex flex-col justify-between p-3">
                <span className={`self-start text-[8px] uppercase font-bold tracking-widest px-2 py-1 rounded-full shadow-sm ${
                  isGold ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' : 
                  isSilver ? 'bg-slate-300/20 text-slate-300 border border-slate-300/50' : 
                  'bg-amber-700/20 text-amber-600 border border-amber-700/50'
                }`}>
                  {s.rarity}
                </span>
                
                <h3 className={`font-heading text-sm text-center drop-shadow-md ${isGold ? 'text-yellow-400' : 'text-foreground'}`}>
                  {s.character_name}
                </h3>
              </div>
              
              {isGold && (
                <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.15),transparent_60%)] animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
