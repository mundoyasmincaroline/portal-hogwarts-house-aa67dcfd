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
  const [totalStickers, setTotalStickers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  useEffect(() => { loadMyStickers(); }, [userId]);

  const loadMyStickers = async () => {
    setLoading(true);
    const [{ data }, { count }] = await Promise.all([
      supabase.from("user_stickers").select("*, stickers(*)").eq("user_id", userId),
      supabase.from("stickers").select("*", { count: "exact", head: true }),
    ]);

    if (data) {
      const myStickers = data.map(d => d.stickers as unknown as Sticker).filter(Boolean);
      setStickers(myStickers);
    }
    setTotalStickers(count || 0);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground animate-pulse">Lendo as páginas do álbum...</div>;

  if (stickers.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center border border-border/50">
        <div className="text-4xl mb-4 opacity-50">📖</div>
        <p className="text-muted-foreground text-sm">Nenhuma figurinha mágica na coleção ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">Compre figurinhas no Álbum usando XP!</p>
      </div>
    );
  }

  const goldCount   = stickers.filter(s => s.rarity === "gold").length;
  const silverCount = stickers.filter(s => s.rarity === "silver").length;
  const bronzeCount = stickers.filter(s => s.rarity === "bronze").length;
  const isComplete  = totalStickers > 0 && stickers.length >= totalStickers;
  const pct = totalStickers > 0 ? Math.round((stickers.length / totalStickers) * 100) : 0;

  // Sort: gold first, then silver, then bronze
  const sorted = [...stickers].sort((a, b) => {
    const order = { gold: 0, silver: 1, bronze: 2 };
    return order[a.rarity] - order[b.rarity];
  });

  return (
    <div className="space-y-5">
      {/* Topo com stats de ostentação */}
      <div className={`glass rounded-2xl p-4 border ${isComplete ? "border-yellow-400 bg-yellow-900/10" : "border-primary/20"}`}>
        {isComplete && (
          <div className="text-center mb-3 animate-pulse">
            <p className="font-heading text-yellow-400 text-lg">🏆 ÁLBUM COMPLETO! LENDA DE HOGWARTS 🏆</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-heading text-foreground">Coleção</span>
            {isComplete && <span className="text-xs bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 px-2 py-0.5 rounded-full font-heading">COMPLETO ✨</span>}
          </div>
          <span className="font-heading text-primary">{stickers.length}/{totalStickers} ({pct}%)</span>
        </div>

        {/* Barra de progresso */}
        <div className="h-3 bg-secondary rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isComplete
                ? "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500"
                : "bg-gradient-to-r from-primary to-primary/60"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Raridade badges */}
        <div className="flex gap-2 flex-wrap">
          {goldCount > 0 && (
            <span className="text-xs bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 px-2 py-1 rounded-full font-heading">
              🥇 {goldCount} Ouro
            </span>
          )}
          {silverCount > 0 && (
            <span className="text-xs bg-slate-300/20 text-slate-300 border border-slate-300/50 px-2 py-1 rounded-full font-heading">
              🥈 {silverCount} Prata
            </span>
          )}
          {bronzeCount > 0 && (
            <span className="text-xs bg-amber-700/20 text-amber-600 border border-amber-700/50 px-2 py-1 rounded-full font-heading">
              🥉 {bronzeCount} Bronze
            </span>
          )}
        </div>
      </div>

      {/* Grid de figurinhas */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {sorted.map(s => {
          const isGold = s.rarity === "gold";
          const isSilver = s.rarity === "silver";

          let rarityStyle = "border-amber-700/50 from-amber-900/40 to-background";
          if (isSilver) rarityStyle = "border-slate-300/80 from-slate-700/40 to-background shadow-white/10";
          if (isGold)   rarityStyle = "border-yellow-400 from-yellow-600/40 to-background ring-1 ring-yellow-400/50 shadow-yellow-500/30";

          return (
            <div key={s.id} className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 group transition-all duration-300 hover:scale-105 bg-gradient-to-b ${rarityStyle} shadow-lg`}>
              <div className="absolute inset-0 z-0">
                {s.image_url && !failed[s.id] ? (
                  <img
                    src={s.image_url}
                    alt={s.character_name}
                    referrerPolicy="no-referrer"
                    onError={() => setFailed(p => ({ ...p, [s.id]: true }))}
                    className="w-full h-full object-cover object-top opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className={`font-heading text-4xl font-bold ${isGold ? "text-yellow-400/50" : isSilver ? "text-slate-300/50" : "text-amber-600/50"}`}>
                      {s.character_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between p-2">
                <span className={`self-start text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full ${
                  isGold ? "bg-yellow-400/20 text-yellow-400" : isSilver ? "bg-slate-300/20 text-slate-300" : "bg-amber-700/20 text-amber-600"
                }`}>
                  {s.rarity === "gold" ? "🥇" : s.rarity === "silver" ? "🥈" : "🥉"}
                </span>
                <h3 className={`font-heading text-[11px] text-center drop-shadow-md leading-tight ${isGold ? "text-yellow-400" : "text-foreground"}`}>
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
