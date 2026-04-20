import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

interface Sticker {
  id: string;
  character_name: string;
  rarity: "bronze" | "silver" | "gold";
  image_url: string;
  level_required: number;
}

const RARITY_COST = { bronze: 20, silver: 50, gold: 100 };
const RARITY_ORDER = { bronze: 0, silver: 1, gold: 2 };

export default function StickerAlbum() {
  const { profile, user, fetchProfile } = useAuth();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [userStickers, setUserStickers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeRarity, setActiveRarity] = useState<"all" | "bronze" | "silver" | "gold">("all");
  const [completedBanner, setCompletedBanner] = useState(false);

  useEffect(() => { loadAlbum(); }, [user]);

  const loadAlbum = async () => {
    if (!user) return;
    const { data: allStickers } = await supabase.from("stickers").select("*").order("level_required", { ascending: true });
    const { data: myStickers } = await supabase.from("user_stickers").select("sticker_id").eq("user_id", user.id);
    setStickers((allStickers as Sticker[]) || []);
    const myMap: Record<string, boolean> = {};
    if (myStickers) myStickers.forEach(s => myMap[s.sticker_id] = true);
    setUserStickers(myMap);
    setLoading(false);

    // Check álbum completo
    if (allStickers && myStickers && allStickers.length > 0 && myStickers.length >= allStickers.length) {
      setCompletedBanner(true);
    }
  };

  const buySticker = async (sticker: Sticker) => {
    if (!user || !profile) return;
    const cost = RARITY_COST[sticker.rarity];
    if (profile.xp < cost) { toast.error(`Você precisa de ${cost} XP para esta figurinha!`); return; }

    setBuyingId(sticker.id);
    try {
      const { error: xpErr } = await supabase.rpc("award_xp_action", { _action: "buy_sticker", _user_id: user.id, _xp: -cost });
      if (xpErr) throw xpErr;
      const { error: insertErr } = await supabase.from("user_stickers").insert({ user_id: user.id, sticker_id: sticker.id } as never);
      if (insertErr) throw insertErr;

      const newMap = { ...userStickers, [sticker.id]: true };
      setUserStickers(newMap);
      await fetchProfile(user.id);

      toast.success(`✨ Figurinha de ${sticker.character_name} desbloqueada! -${cost} XP`);

      // Verificar se completou o álbum inteiro
      if (Object.keys(newMap).length >= stickers.length) {
        setCompletedBanner(true);
        // Bonus XP por completar
        await supabase.rpc("award_xp_action", { _action: "album_complete", _user_id: user.id, _xp: 500 });
        setTimeout(() => {
          toast(
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <p className="font-heading text-xl text-yellow-400 font-bold">ÁLBUM COMPLETO!</p>
              <p className="text-sm text-muted-foreground">Você é uma lenda de Hogwarts! +500 XP de bônus!</p>
            </div>,
            { duration: 8000 }
          );
        }, 500);
      }
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setBuyingId(null);
    }
  };

  const owned = Object.keys(userStickers).length;
  const total = stickers.length;
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;

  const bronzeOwned = stickers.filter(s => s.rarity === "bronze" && userStickers[s.id]).length;
  const silverOwned = stickers.filter(s => s.rarity === "silver" && userStickers[s.id]).length;
  const goldOwned   = stickers.filter(s => s.rarity === "gold"   && userStickers[s.id]).length;
  const bronzeTotal = stickers.filter(s => s.rarity === "bronze").length;
  const silverTotal = stickers.filter(s => s.rarity === "silver").length;
  const goldTotal   = stickers.filter(s => s.rarity === "gold").length;

  const filtered = stickers
    .filter(s => activeRarity === "all" || s.rarity === activeRarity)
    .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);

  if (loading) return <div className="text-center py-10 text-muted-foreground animate-pulse">Abrindo a vitrine mágica...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="glass rounded-3xl p-8 text-center relative overflow-hidden border border-primary/20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?q=80&w=2070')] bg-cover bg-center opacity-10" />
        <div className="relative z-10">
          <h1 className="font-heading text-4xl md:text-5xl text-gold-gradient mb-3 drop-shadow-lg">
            {completedBanner ? "🏆 Álbum Completo! 🏆" : "Álbum de Figurinhas"}
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Colecione figurinhas usando XP. Ouro e Prata brilham com magia!
          </p>

          {/* Saldo XP */}
          <div className="mt-4 inline-flex items-center gap-3 bg-secondary/50 backdrop-blur-md px-6 py-3 rounded-xl border border-border/50">
            <span className="text-sm text-muted-foreground uppercase tracking-widest">Saldo:</span>
            <span className="font-heading text-2xl text-primary">{profile?.xp || 0} XP</span>
          </div>
        </div>
      </div>

      {/* Barra de progresso geral */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-heading text-foreground flex items-center gap-2">
            <Trophy size={18} className="text-primary" /> Progresso da Coleção
          </span>
          <span className="font-heading text-primary text-lg">{owned}/{total} ({pct}%)</span>
        </div>
        <div className="h-4 bg-secondary rounded-full overflow-hidden border border-border/50">
          <div
            className={`h-full transition-all duration-1000 ease-out rounded-full ${
              pct === 100
                ? "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 animate-pulse"
                : pct >= 66
                ? "bg-gradient-to-r from-primary to-primary/60"
                : "bg-primary/70"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Stats por raridade */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          {[
            { label: "Bronze", owned: bronzeOwned, total: bronzeTotal, color: "text-amber-600", bg: "bg-amber-900/20 border-amber-700/40" },
            { label: "Prata", owned: silverOwned, total: silverTotal, color: "text-slate-300", bg: "bg-slate-700/20 border-slate-400/30" },
            { label: "Ouro", owned: goldOwned, total: goldTotal, color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-400/30" },
          ].map(r => (
            <div key={r.label} className={`rounded-xl p-3 text-center border ${r.bg}`}>
              <p className={`font-heading text-xl ${r.color}`}>{r.owned}/{r.total}</p>
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <div className="h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                <div className={`h-full ${r.color.replace("text-", "bg-")} transition-all`} style={{ width: r.total > 0 ? `${(r.owned / r.total) * 100}%` : "0%" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Banner álbum completo */}
        {completedBanner && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-900/40 via-yellow-700/20 to-yellow-900/40 border border-yellow-400 text-center animate-pulse">
            <p className="font-heading text-yellow-400 text-lg">🏆 LENDA DE HOGWARTS 🏆</p>
            <p className="text-xs text-yellow-300/80">Você completou o álbum completo! Um feito histórico no castelo.</p>
          </div>
        )}
      </div>

      {/* Filtros de raridade */}
      <div className="flex gap-3 flex-wrap">
        {(["all", "gold", "silver", "bronze"] as const).map(r => (
          <button
            key={r}
            onClick={() => setActiveRarity(r)}
            className={`px-4 py-2 rounded-full text-sm font-heading transition-all border ${
              activeRarity === r
                ? r === "gold" ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
                  : r === "silver" ? "bg-slate-300/20 border-slate-300 text-slate-300"
                  : r === "bronze" ? "bg-amber-700/20 border-amber-600 text-amber-600"
                  : "bg-primary/20 border-primary text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {r === "all" ? "✨ Todas" : r === "gold" ? "🥇 Ouro" : r === "silver" ? "🥈 Prata" : "🥉 Bronze"}
            <span className="ml-1 text-xs opacity-70">
              ({r === "all" ? `${owned}/${total}` : r === "gold" ? `${goldOwned}/${goldTotal}` : r === "silver" ? `${silverOwned}/${silverTotal}` : `${bronzeOwned}/${bronzeTotal}`})
            </span>
          </button>
        ))}
      </div>

      {/* Grid de figurinhas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filtered.map(s => {
          const unlocked = userStickers[s.id];
          const isGold = s.rarity === "gold";
          const isSilver = s.rarity === "silver";
          const cost = RARITY_COST[s.rarity];
          const levelOk = profile ? profile.level >= s.level_required : false;
          const xpOk = profile ? profile.xp >= cost : false;

          let rarityStyle = "border-amber-700/50 from-amber-900/40 to-background shadow-lg shadow-amber-900/20";
          if (isSilver) rarityStyle = "border-slate-300/80 from-slate-700/40 to-background shadow-xl shadow-white/10";
          if (isGold) rarityStyle = "border-yellow-400 from-yellow-600/40 to-background shadow-2xl shadow-yellow-500/30 ring-1 ring-yellow-400/50";

          return (
            <div
              key={s.id}
              className={`relative aspect-[3/4] rounded-2xl flex flex-col overflow-hidden border-2 transition-all duration-500 group ${
                unlocked ? rarityStyle : "border-border/50 bg-secondary/10 hover:border-primary/50"
              }`}
            >
              {/* Imagem */}
              <div className="absolute inset-0 z-0">
                {s.image_url && !failedImages[s.id] ? (
                  <img
                    src={s.image_url}
                    alt={s.character_name}
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImages(prev => ({ ...prev, [s.id]: true }))}
                    className={`w-full h-full object-cover object-top transition-all duration-700 ${
                      unlocked ? "opacity-90 group-hover:scale-105" : "opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60"
                    }`}
                  />
                ) : (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${
                    isGold ? "from-yellow-900/60 to-background" : isSilver ? "from-slate-700/60 to-background" : "from-amber-900/60 to-background"
                  }`}>
                    <span className="text-4xl">🧙</span>
                    <span className={`font-heading text-5xl font-bold select-none ${
                      isGold ? "text-yellow-400/40" : isSilver ? "text-slate-300/40" : "text-amber-600/40"
                    }`}>{s.character_name.charAt(0)}</span>
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  unlocked ? "from-background via-background/50 to-transparent" : "from-background via-background/80 to-background/30"
                }`} />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-sm ${
                    isGold ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/50"
                    : isSilver ? "bg-slate-300/20 text-slate-300 border border-slate-300/50"
                    : "bg-amber-700/20 text-amber-600 border border-amber-700/50"
                  }`}>
                    {s.rarity === "gold" ? "🥇" : s.rarity === "silver" ? "🥈" : "🥉"} {s.rarity}
                  </span>
                  {unlocked
                    ? <span className="text-xl drop-shadow-md">✨</span>
                    : <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md ${levelOk ? "bg-background/80 text-primary" : "bg-destructive/20 text-destructive"}`}>
                        Nv.{s.level_required}
                      </span>
                  }
                </div>

                <div className="mt-auto space-y-3">
                  <h3 className={`font-heading text-sm leading-tight text-center drop-shadow-md ${
                    unlocked && isGold ? "text-yellow-400" : unlocked ? "text-foreground" : "text-muted-foreground group-hover:text-foreground transition-colors"
                  }`}>
                    {unlocked ? s.character_name : "???"}
                  </h3>

                  {!unlocked && (
                    <Button
                      variant="magical"
                      className="w-full h-9 text-xs font-heading"
                      disabled={!levelOk || !xpOk || buyingId === s.id}
                      onClick={() => buySticker(s)}
                    >
                      {buyingId === s.id ? "Comprando..." : !levelOk ? `Nv.${s.level_required} req.` : !xpOk ? `${cost} XP req.` : `Comprar ${cost} XP`}
                    </Button>
                  )}
                </div>
              </div>

              {/* Brilho ouro */}
              {unlocked && isGold && (
                <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.15),transparent_60%)] animate-pulse" />
              )}

              {/* Cadeado nas bloqueadas */}
              {!unlocked && !levelOk && (
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-background/30">
                  <span className="text-2xl opacity-50">🔒</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}