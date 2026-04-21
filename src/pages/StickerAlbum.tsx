import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy, Zap, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StickerVisual from "@/components/StickerVisual";

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
  const [openingPack, setOpeningPack] = useState(false);
  const [packReveal, setPackReveal] = useState<Sticker | null>(null);
  const [packPhase, setPackPhase] = useState<"idle" | "shaking" | "reveal">("idle");
  const navigate = useNavigate();

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

    if (allStickers && myStickers && allStickers.length > 0 && myStickers.length >= allStickers.length) {
      setCompletedBanner(true);
    }
  };

  const buySticker = async (sticker: Sticker) => {
    if (!user || !profile) return;
    const cost = RARITY_COST[sticker.rarity];
    if (profile.xp < cost) { toast.error(`Você precisa de ${cost} XP para esta figurinha! Você tem ${profile.xp} XP.`); return; }

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

      if (Object.keys(newMap).length >= stickers.length) {
        setCompletedBanner(true);
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
      toast.error("Erro ao comprar figurinha: " + (err.message || "Tente novamente."));
    } finally {
      setBuyingId(null);
    }
  };

  const openSurprisePack = async () => {
    if (!user || !profile) return;
    const PACK_COST = 80;

    if (profile.xp < PACK_COST) {
      toast.error(`Você precisa de ${PACK_COST} XP para abrir um pacote! Você tem apenas ${profile.xp} XP.`);
      return;
    }

    const locked = stickers.filter(s => !userStickers[s.id]);
    if (locked.length === 0) { toast.info("🏆 Você já tem todas as figurinhas!"); return; }

    const pool: Sticker[] = [];
    locked.forEach(s => {
      const weight = s.rarity === "gold" ? 1 : s.rarity === "silver" ? 3 : 6;
      for (let i = 0; i < weight; i++) pool.push(s);
    });
    const picked = pool[Math.floor(Math.random() * pool.length)];

    setOpeningPack(true);
    setPackPhase("shaking");
    setPackReveal(null);

    try {
      const { error: xpErr } = await supabase.rpc("award_xp_action", { _action: "buy_sticker", _user_id: user.id, _xp: -PACK_COST });
      if (xpErr) {
        toast.error("Erro ao descontar XP: " + xpErr.message);
        setOpeningPack(false);
        setPackPhase("idle");
        return;
      }

      // Check if already owns it (upsert handles duplicate)
      await supabase.from("user_stickers").upsert({ user_id: user.id, sticker_id: picked.id } as never);
      await fetchProfile(user.id);
      setUserStickers(prev => ({ ...prev, [picked.id]: true }));
      setTimeout(() => { setPackPhase("reveal"); setPackReveal(picked); }, 1500);
    } catch (err: any) {
      toast.error("Erro ao abrir o pacote: " + (err.message || "Tente novamente."));
      setOpeningPack(false);
      setPackPhase("idle");
    }
  };

  const closePack = () => { setOpeningPack(false); setPackPhase("idle"); setPackReveal(null); };
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
      {/* Header - Monster Quality */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-white/[0.08] to-black/60 backdrop-blur-3xl p-10 md:p-16 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] text-center group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?q=80&w=2070')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        
        {/* Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 space-y-6">
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full animate-pulse" />
             <div className="relative z-10 w-20 h-20 md:w-24 h-24 bg-white/5 rounded-3xl border border-white/20 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                <Trophy size={48} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
             </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="font-heading text-4xl md:text-6xl text-gold-gradient tracking-tighter drop-shadow-2xl">
              {completedBanner ? "Álbum Lendário" : "Coleção Mística"}
            </h1>
            <p className="text-xs md:text-sm font-heading text-primary uppercase tracking-[0.4em] opacity-70">Fragmentos da História de Hogwarts</p>
          </div>

          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-2xl px-8 py-4 rounded-2xl border border-white/10 shadow-2xl group/xp">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/40 group-hover/xp:scale-110 transition-transform">
               <Zap size={20} className="text-primary" />
            </div>
            <div className="text-left">
               <p className="text-[10px] font-heading text-white/40 uppercase tracking-widest">Seu Equilíbrio Máxico</p>
               <p className="font-heading text-2xl text-white">{profile?.xp || 0} XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animação de abertura de pack */}
      {openingPack && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-6" onClick={packPhase === "reveal" ? closePack : undefined}>
          {packPhase === "shaking" && (
            <>
              <div className="text-8xl animate-bounce">🎁</div>
              <p className="font-heading text-2xl text-primary animate-pulse">Abrindo o pacote...</p>
              <p className="text-xs text-muted-foreground">A magia está agindo!</p>
            </>
          )}
          {packPhase === "reveal" && packReveal && (
            <>
              <div className="text-6xl mb-2 animate-bounce">
                {packReveal.rarity === "gold" ? "🥇" : packReveal.rarity === "silver" ? "🥈" : "🥉"}
              </div>
              <div className={`relative w-48 h-64 rounded-2xl overflow-hidden border-4 shadow-2xl animate-fade-in-up ${
                packReveal.rarity === "gold" ? "border-yellow-400 shadow-yellow-400/50"
                : packReveal.rarity === "silver" ? "border-slate-300 shadow-white/20"
                : "border-amber-600 shadow-amber-900/50"
              }`}>
                {packReveal.image_url ? (
                  <img src={packReveal.image_url} alt={packReveal.character_name} className="w-full h-full object-cover object-top" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary text-6xl">{packReveal.character_name.charAt(0)}</div>
                )}
                {packReveal.rarity === "gold" && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.3),transparent_60%)] animate-pulse" />}
              </div>
              <p className="font-heading text-2xl text-foreground">{packReveal.character_name}</p>
              <p className={`text-sm font-bold uppercase tracking-widest ${
                packReveal.rarity === "gold" ? "text-yellow-400" : packReveal.rarity === "silver" ? "text-slate-300" : "text-amber-600"
              }`}>
                {packReveal.rarity === "gold" ? "🌟 FIGURINHA RARA!" : packReveal.rarity === "silver" ? "⭐ Figurinha Incomum" : "✨ Figurinha Obtida"}
              </p>
              <button onClick={closePack} className="mt-2 text-sm text-muted-foreground hover:text-foreground underline">Fechar</button>
            </>
          )}
        </div>
      )}

      {/* Surprise Pack + Market - Monster Quality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden glass rounded-[2.5rem] p-8 flex flex-col items-center gap-6 text-center border border-primary/20 shadow-xl group/pack hover:border-primary/50 transition-all">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="relative">
             <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
             <div className="relative z-10 w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center group-hover/pack:scale-110 transition-transform duration-500 shadow-2xl">
                <span className="text-4xl animate-bounce-slow">🎁</span>
             </div>
          </div>
          <div className="space-y-1 relative z-10">
            <h3 className="font-heading text-xl text-white tracking-tight">Pacote Surpresa</h3>
            <p className="text-[10px] text-white/40 font-heading uppercase tracking-widest leading-relaxed">Chance de Relíquias Raras</p>
          </div>
          <Button
            variant="magical"
            className="w-full h-14 rounded-xl font-heading text-xs tracking-[0.2em] shadow-xl shadow-primary/20 relative overflow-hidden group/btn"
            onClick={openSurprisePack}
            disabled={openingPack || (profile?.xp ?? 0) < 80}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]" />
            <span className="relative z-10">{openingPack ? "ABRINDO..." : `ABRIR PACOTE • 80 XP`}</span>
          </Button>
        </div>

        <div className="relative overflow-hidden glass rounded-[2.5rem] p-8 flex flex-col items-center gap-6 text-center border border-white/5 shadow-xl group/market hover:border-white/20 transition-all">
          <div className="relative">
             <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center group-hover/market:rotate-12 transition-transform duration-500 shadow-2xl">
                <span className="text-4xl">🔄</span>
             </div>
          </div>
          <div className="space-y-1 relative z-10">
            <h3 className="font-heading text-xl text-white tracking-tight">Mercado Místico</h3>
            <p className="text-[10px] text-white/40 font-heading uppercase tracking-widest">Troque Duplicatas</p>
          </div>
          <Button variant="outline" className="w-full h-14 rounded-xl font-heading text-xs tracking-[0.2em] border-white/10 text-white hover:bg-white/5" onClick={() => navigate("/dashboard/trades")}>
            ACESSAR MERCADO 🏪
          </Button>
        </div>
      </div>

      {/* Progress Bar - Monster Quality */}
      <div className="relative overflow-hidden glass rounded-[3rem] p-8 md:p-10 border border-white/10 shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40">
                <Trophy size={20} className="text-primary" />
             </div>
             <div className="text-left">
                <h3 className="font-heading text-xl text-white tracking-tight">Status da Coleção</h3>
                <p className="text-[10px] text-white/40 font-heading uppercase tracking-widest">Rumo ao Álbum Lendário</p>
             </div>
          </div>
          <div className="text-center md:text-right">
             <p className="font-heading text-4xl text-primary drop-shadow-2xl">{pct}%</p>
             <p className="text-[10px] text-white/40 font-heading uppercase tracking-widest">{owned} de {total} Figurinhas</p>
          </div>
        </div>

        <div className="relative">
           <div className="h-6 bg-black/40 rounded-full border border-white/5 p-1.5 overflow-hidden shadow-inner relative">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_20px_hsl(var(--primary)/0.4)] ${
                  pct === 100
                    ? "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 animate-pulse"
                    : "bg-primary"
                }`}
                style={{ width: `${pct}%` }}
              >
                 {/* Liquid Shimmer */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "BRONZE", owned: bronzeOwned, total: bronzeTotal, color: "text-amber-600", bg: "bg-amber-900/10 border-amber-900/30" },
            { label: "PRATA", owned: silverOwned, total: silverTotal, color: "text-slate-300", bg: "bg-slate-700/10 border-slate-700/30" },
            { label: "OURO", owned: goldOwned, total: goldTotal, color: "text-yellow-400", bg: "bg-yellow-900/10 border-yellow-900/30" },
          ].map(r => (
            <div key={r.label} className={`relative overflow-hidden rounded-2xl p-4 border ${r.bg} flex items-center justify-between group/stat`}>
              <div>
                 <p className="text-[9px] font-heading text-white/40 uppercase tracking-widest mb-1">{r.label}</p>
                 <p className={`font-heading text-2xl ${r.color}`}>{r.owned}/{r.total}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center font-heading text-[10px] text-white/60">
                 {r.total > 0 ? Math.round((r.owned / r.total) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>

        {completedBanner && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-yellow-500/20 border border-yellow-500/30 p-6 text-center animate-pulse-glow">
            <p className="font-heading text-yellow-400 text-xl tracking-[0.2em] mb-1">Mestre Colecionador 👑</p>
            <p className="text-[10px] text-yellow-400/60 font-heading uppercase tracking-widest">Sua lenda está completa no Salão das Figurinhas</p>
          </div>
        )}
      </div>

      {/* Filtros */}
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

      {/* Sticker Grid - Monster Quality */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-10">
        {filtered.map(s => {
          const unlocked = userStickers[s.id];
          const isGold = s.rarity === "gold";
          const isSilver = s.rarity === "silver";
          const cost = RARITY_COST[s.rarity];
          const levelOk = profile ? profile.level >= s.level_required : false;
          const xpOk = profile ? profile.xp >= cost : false;

          let rarityStyle = "border-amber-700/50 from-amber-900/40 to-black/80 shadow-2xl hover:shadow-amber-900/40";
          if (isSilver) rarityStyle = "border-slate-300/60 from-slate-700/40 to-black/80 shadow-2xl hover:shadow-slate-300/20";
          if (isGold) rarityStyle = "border-yellow-400 from-yellow-600/40 to-black/80 shadow-2xl hover:shadow-yellow-400/30 animate-pulse-glow";

          return (
            <div
              key={s.id}
              className={`relative aspect-[3/4.5] rounded-[2rem] flex flex-col overflow-hidden border-2 transition-all duration-500 group/stick ${
                unlocked ? rarityStyle : "border-white/5 bg-white/[0.02] grayscale"
              }`}
            >
              {/* Sticker Content */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <StickerVisual
                  name={s.character_name}
                  rarity={s.rarity}
                  unlocked={unlocked}
                  imageUrl={s.image_url}
                  failedImage={failedImages[s.id]}
                />
                {s.image_url && !failedImages[s.id] && (
                  <img
                    src={s.image_url}
                    alt={s.character_name}
                    className={`w-full h-full object-cover object-top transition-all duration-700 ${
                      unlocked ? "opacity-80 group-hover/stick:scale-110 group-hover/stick:rotate-1" : "opacity-20"
                    }`}
                  />
                )}
                {/* Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              </div>

              {/* Status & Info */}
              <div className="relative z-10 h-full flex flex-col justify-between p-5">
                <div className="flex justify-between items-start">
                   <div className={`px-3 py-1 rounded-full text-[8px] font-heading tracking-[0.2em] border backdrop-blur-md ${
                      isGold ? "bg-yellow-400/20 border-yellow-400/40 text-yellow-400" :
                      isSilver ? "bg-slate-300/20 border-slate-300/40 text-slate-300" :
                      "bg-amber-700/20 border-amber-700/40 text-amber-600"
                   }`}>
                      {s.rarity.toUpperCase()}
                   </div>
                   {!unlocked && (
                      <div className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center backdrop-blur-md">
                         <Lock size={12} className="text-white/40" />
                      </div>
                   )}
                </div>

                <div className="space-y-4 text-center">
                   <div className="space-y-1">
                      <p className={`font-heading text-sm tracking-tighter ${
                         unlocked ? 'text-white' : 'text-white/20'
                      }`}>
                         {unlocked ? s.character_name.toUpperCase() : "DESCONHECIDO"}
                      </p>
                      {!unlocked && (
                         <p className="text-[8px] font-heading text-white/40 tracking-[0.2em]">REQUER NÍVEL {s.level_required}</p>
                      )}
                   </div>

                   {!unlocked && (
                     <Button
                       variant="magical"
                       className="w-full h-10 rounded-xl font-heading text-[10px] tracking-widest shadow-lg"
                       disabled={!levelOk || !xpOk || buyingId === s.id}
                       onClick={() => buySticker(s)}
                     >
                        {buyingId === s.id ? "..." : levelOk && xpOk ? `COMPRAR: ${cost} XP` : levelOk ? "XP INSUFICIENTE" : "NÍVEL BAIXO"}
                     </Button>
                   )}
                </div>
              </div>

              {/* Rarity Auras */}
              {unlocked && isGold && (
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.2),transparent_70%)] animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}