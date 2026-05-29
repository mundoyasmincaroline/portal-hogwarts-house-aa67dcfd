import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StickerVisual from "@/components/StickerVisual";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { shareContent, buildAlbumShareText } from "@/lib/share";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

interface Sticker {
  id: string;
  character_name: string;
  rarity: "bronze" | "silver" | "gold";
  image_url: string;
  level_required: number;
}

export default function ProfileAlbum({ userId }: { userId: string }) {
  const { user } = useAuth();
  const isMe = user?.id === userId;
  const [allStickers, setAllStickers] = useState<Sticker[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "owned" | "missing">("all");

  useEffect(() => { loadMyStickers(); }, [userId]);

  const loadMyStickers = async () => {
    setLoading(true);
    const [ownedRes, allRes] = await Promise.all([
      supabase.from("user_stickers").select("*, stickers(*)").eq("user_id", userId),
      supabase.from("stickers").select("*").order("rarity", { ascending: false }).order("character_name"),
    ]);
    const owned = new Set<string>((ownedRes.data || []).map((d: any) => d.sticker_id));
    setOwnedIds(owned);
    setAllStickers((allRes.data as Sticker[]) || []);
    setLoading(false);
  };

  const handleShare = async () => {
    const text = buildAlbumShareText(ownedIds.size, allStickers.length, allStickers.filter(s => s.rarity === "gold" && ownedIds.has(s.id)).length);
    const res = await shareContent({ title: "Meu Álbum Mágico de Hogwarts", text });
    if (res === "copied") toast.success("✨ Progresso do álbum copiado!");
    else if (res === "failed") toast.error("Não foi possível compartilhar.");
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground animate-pulse">Lendo as páginas do álbum...</div>;

  if (allStickers.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center border border-border/50">
        <div className="text-4xl mb-4 opacity-50">📖</div>
        <p className="text-muted-foreground text-sm">O álbum mágico ainda está sendo encadernado...</p>
      </div>
    );
  }

  const ownedCount = ownedIds.size;
  const total = allStickers.length;
  const isComplete = ownedCount >= total;
  const pct = total > 0 ? Math.round((ownedCount / total) * 100) : 0;

  const ownedList = allStickers.filter(s => ownedIds.has(s.id));
  const goldCount   = ownedList.filter(s => s.rarity === "gold").length;
  const silverCount = ownedList.filter(s => s.rarity === "silver").length;
  const bronzeCount = ownedList.filter(s => s.rarity === "bronze").length;

  const order = { gold: 0, silver: 1, bronze: 2 };
  const visible = [...allStickers]
    .filter(s => filter === "all" || (filter === "owned" ? ownedIds.has(s.id) : !ownedIds.has(s.id)))
    .sort((a, b) => order[a.rarity] - order[b.rarity] || a.character_name.localeCompare(b.character_name));

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
          <span className="font-heading text-primary">{ownedCount}/{total} ({pct}%)</span>
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
        <div className="flex gap-2 flex-wrap mb-3">
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

        <div className="flex flex-wrap items-center gap-2">
          {(["all","owned","missing"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] font-heading uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background/40 text-muted-foreground border-border hover:border-primary/40"
              }`}>
              {f === "all" ? `Todas (${total})` : f === "owned" ? `Conquistadas (${ownedCount})` : `Faltando (${total - ownedCount})`}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-[10px] rounded-full" onClick={handleShare}>
              <Share2 size={12} className="mr-1.5" /> Compartilhar
            </Button>
            {isMe && (
              <Link to="/dashboard/album">
                <Button size="sm" variant="plaque" className="h-8 text-[10px] rounded-full">Abrir Álbum</Button>
              </Link>
            )}
            {!isMe && (
              <Link to="/dashboard/trades">
                <Button size="sm" variant="plaque" className="h-8 text-[10px] rounded-full">Trocar</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Grid de figurinhas — álbum estilo Copa, mostra TUDO */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {visible.map(s => {
          const unlocked = ownedIds.has(s.id);
          const isGold = s.rarity === "gold";
          const isSilver = s.rarity === "silver";

          let rarityStyle = "border-amber-700/50 from-amber-900/40 to-background";
          if (isSilver) rarityStyle = "border-slate-300/80 from-slate-700/40 to-background shadow-white/10";
          if (isGold)   rarityStyle = "border-yellow-400 from-yellow-600/40 to-background ring-1 ring-yellow-400/50 shadow-yellow-500/30";
          if (!unlocked) rarityStyle = "border-dashed border-white/10 from-black/60 to-background/40";

          return (
              <div key={s.id} className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 group transition-all duration-300 hover:scale-105 bg-gradient-to-b ${rarityStyle} shadow-lg ${!unlocked ? "opacity-60 hover:opacity-90" : ""}`}>
              <div className="absolute inset-0 z-0">
                  <StickerVisual name={s.character_name} rarity={s.rarity} unlocked={unlocked} imageUrl={s.image_url} failedImage={failed[s.id]} />
                {s.image_url && !failed[s.id] && unlocked ? (
                  <img
                    src={s.image_url}
                    alt={s.character_name}
                    referrerPolicy="no-referrer"
                      width={1024}
                      height={1024}
                      loading="lazy"
                      decoding="async"
                    onError={() => setFailed(p => ({ ...p, [s.id]: true }))}
                    className="w-full h-full object-cover object-top opacity-85 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                  />
                  ) : null}
                {s.image_url && !failed[s.id] && !unlocked && (
                  <img
                    src={s.image_url}
                    alt=""
                    aria-hidden
                    referrerPolicy="no-referrer"
                    width={1024}
                    height={1024}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed(p => ({ ...p, [s.id]: true }))}
                    className="w-full h-full object-cover object-top opacity-20 grayscale brightness-50"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between p-2">
                <span className={`self-start text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full ${
                  isGold ? "bg-yellow-400/20 text-yellow-400" : isSilver ? "bg-slate-300/20 text-slate-300" : "bg-amber-700/20 text-amber-600"
                }`}>
                  {s.rarity === "gold" ? "🥇" : s.rarity === "silver" ? "🥈" : "🥉"}
                </span>
                <div className="text-center space-y-0.5">
                  <h3 className={`font-heading text-[11px] drop-shadow-md leading-tight ${
                    !unlocked ? "text-white/40" : isGold ? "text-yellow-400" : "text-foreground"
                  }`}>
                    {s.character_name}
                  </h3>
                  {!unlocked && (
                    <p className="text-[7px] uppercase tracking-widest text-white/30 font-heading">Faltando</p>
                  )}
                </div>
              </div>

              {isGold && unlocked && (
                <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.15),transparent_60%)] animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
