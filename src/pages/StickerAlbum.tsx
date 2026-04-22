import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy, Sparkles, Gift, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StickerVisual from "@/components/StickerVisual";
import MagicalEmoji from "@/components/MagicalEmoji";

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

  if (loading) return <div className="text-center py-20 text-muted-foreground animate-pulse font-heading text-xl">Revelando o Álbum Encantado...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      {/* ── HEADER MONSTER QUALITY ── */}
      <div className="relative glass rounded-[3rem] p-10 md:p-16 text-center overflow-hidden border border-yellow-500/20 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-black to-blue-900/40 opacity-60 z-0" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?q=80&w=2070')] bg-cover bg-center opacity-10 group-hover:scale-105 transition-transform duration-1000" />
        
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-4 bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-full px-6 py-2 shadow-2xl">
            <MagicalEmoji emoji="✨" size="xs" glowColor="rgba(234, 179, 8, 0.5)" />
            <span className="text-[10px] font-heading text-yellow-500 uppercase tracking-[0.3em] font-bold">Relíquias de Hogwarts</span>
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl text-gold-gradient mb-3 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            {completedBanner ? "🏆 ÁLBUM LENDÁRIO 🏆" : "Álbum de Figurinhas"}
          </h1>
          <p className="text-yellow-100/70 text-lg max-w-2xl mx-auto font-serif italic">
            "Cada carta conta uma história, cada herói guarda um segredo. Complete sua coleção e torne-se uma lenda viva de Hogwarts."
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="inline-flex items-center gap-4 bg-zinc-900/60 backdrop-blur-xl px-8 py-4 rounded-2xl border border-yellow-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group/xp">
              <MagicalEmoji emoji="⚡" size="sm" glowColor="rgba(234, 179, 8, 0.6)" className="group-hover/xp:rotate-12" />
              <div className="text-left">
                <p className="text-[10px] text-yellow-500/60 uppercase font-bold tracking-widest">Saldo de Magia</p>
                <p className="font-heading text-3xl text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">{profile?.xp || 0} XP</p>
              </div>
            </div>
            
            <Button variant="plaque" size="lg" className="h-20 px-12 rounded-2xl shadow-[0_15px_35px_-10px_rgba(234,179,8,0.4)]" onClick={openSurprisePack} disabled={openingPack || (profile?.xp ?? 0) < 80}>
               Abrir Pacote Místico (80 XP) <Gift className="ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── REVEAL ANIMATION ── */}
      {openingPack && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-10 p-4" onClick={packPhase === "reveal" ? closePack : undefined}>
          {packPhase === "shaking" && (
            <div className="relative group cursor-pointer animate-float flex flex-col items-center">
              <div className="absolute inset-0 bg-purple-500/30 blur-[100px] rounded-full animate-pulse" />
              <MagicalEmoji emoji="🎁" size="2xl" glowColor="rgba(168, 85, 247, 0.6)" className="animate-bounce" />
              <div className="mt-8 text-center space-y-2">
                <p className="font-heading text-3xl text-purple-400 animate-pulse uppercase tracking-widest">Invocando Magia...</p>
                <p className="text-sm text-purple-200/40 font-serif italic">O destino está sendo escrito nas estrelas</p>
              </div>
              {/* Magic Particles */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                 {[...Array(12)].map((_, i) => (
                    <div key={i} className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`
                    }} />
                 ))}
              </div>
            </div>
          )}
          {packPhase === "reveal" && packReveal && (
            <div className="relative flex flex-col items-center gap-8 max-w-sm w-full animate-in zoom-in-50 duration-700">
              <div className="absolute inset-0 bg-white/5 blur-[120px] rounded-full -z-10" />
              
              <div className="text-center space-y-2 mb-4">
                <div className={`inline-block px-6 py-2 rounded-full text-xs font-bold uppercase tracking-[0.3em] backdrop-blur-md shadow-2xl border ${
                    packReveal.rarity === "gold" ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/50"
                    : packReveal.rarity === "silver" ? "bg-slate-300/20 text-slate-200 border-slate-300/50"
                    : "bg-amber-700/20 text-amber-500 border-amber-700/50"
                }`}>
                    {packReveal.rarity === "gold" ? "🥇 Relíquia Lendária" : packReveal.rarity === "silver" ? "🥈 Carta Incomum" : "🥉 Carta Comum"}
                </div>
              </div>

              <div className={`relative w-72 h-[420px] rounded-[2.5rem] overflow-hidden border-4 shadow-[0_0_100px_rgba(0,0,0,0.8)] group transition-all duration-1000 ${
                packReveal.rarity === "gold" ? "border-yellow-400 shadow-yellow-400/30 ring-4 ring-yellow-400/20"
                : packReveal.rarity === "silver" ? "border-slate-300 shadow-white/10 ring-2 ring-slate-300/10"
                : "border-amber-800 shadow-amber-900/20"
              }`}>
                {/* Holographic Overlays */}
                {packReveal.rarity === "gold" && (
                    <div className="absolute inset-0 z-20 bg-gradient-to-tr from-yellow-400/20 via-transparent to-white/20 mix-blend-overlay animate-pulse pointer-events-none" />
                )}
                
                <div className="absolute inset-0 z-0">
                    {packReveal.image_url ? (
                    <img src={packReveal.image_url} alt={packReveal.character_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary text-8xl font-heading opacity-20">{packReveal.character_name.charAt(0)}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
                
                <div className="absolute bottom-10 inset-x-0 text-center z-30 px-6">
                    <h3 className="font-heading text-4xl text-white drop-shadow-2xl mb-2">{packReveal.character_name}</h3>
                    <div className="h-1 w-12 bg-current mx-auto opacity-50 rounded-full" style={{ color: packReveal.rarity === 'gold' ? '#facc15' : packReveal.rarity === 'silver' ? '#cbd5e1' : '#92400e' }} />
                </div>
              </div>

              <div className="text-center space-y-6">
                <div className="space-y-2">
                    <h2 className="font-heading text-4xl text-white drop-shadow-lg">¡Nova Figurinha!</h2>
                    <p className="text-muted-foreground font-serif italic text-lg">"Uma adição magnífica ao seu álbum."</p>
                </div>
                <Button variant="plaque" size="lg" className="w-full h-16 text-xl rounded-2xl shadow-2xl" onClick={closePack}>
                    Adicionar à Coleção
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STATS & PROGRESS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-[2.5rem] p-10 space-y-8 border border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10 group-hover:opacity-20 transition-opacity" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                    <h3 className="font-heading text-2xl text-foreground flex items-center gap-3">
                        <Trophy size={28} className="text-yellow-500" /> Domínio da Coleção
                    </h3>
                    <p className="text-muted-foreground text-sm font-serif">Seu progresso total através das eras de Hogwarts</p>
                </div>
                <div className="text-center sm:text-right">
                    <p className="font-heading text-5xl text-primary drop-shadow-md">{pct}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{owned} de {total} CARTAS</p>
                </div>
            </div>

            <div className="relative h-6 bg-black/40 rounded-full overflow-hidden border border-white/10 p-1">
                <div className={`h-full transition-all duration-1500 ease-out rounded-full relative overflow-hidden ${
                    pct === 100 ? "bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-600" : "bg-gradient-to-r from-primary to-blue-600"
                }`} style={{ width: `${pct}%` }}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-4">
                {[
                    { label: "Bronze", owned: bronzeOwned, total: bronzeTotal, color: "text-amber-600", bg: "bg-amber-950/20 border-amber-800/30", icon: "🥉" },
                    { label: "Prata", owned: silverOwned, total: silverTotal, color: "text-slate-200", bg: "bg-slate-800/20 border-slate-400/20", icon: "🥈" },
                    { label: "Ouro", owned: goldOwned, total: goldTotal, color: "text-yellow-400", bg: "bg-yellow-950/20 border-yellow-500/30", icon: "🥇" },
                ].map(r => (
                    <div key={r.label} className={`rounded-[2rem] p-6 text-center border-2 backdrop-blur-sm transition-transform hover:scale-105 ${r.bg}`}>
                        <div className="text-3xl mb-3">{r.icon}</div>
                        <p className={`font-heading text-3xl mb-1 ${r.color}`}>{r.owned}<span className="text-lg opacity-40">/{r.total}</span></p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">{r.label}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="glass rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center gap-8 border border-white/5 bg-gradient-to-t from-black/40 to-white/5 relative group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 group-hover:scale-110 transition-transform duration-1000" />
            <MagicalEmoji icon={RefreshCw} size="md" glowColor="rgba(255, 255, 255, 0.2)" className="group-hover:rotate-180 transition-transform duration-1000" />
            <div className="space-y-3 relative z-10">
                <h3 className="font-heading text-2xl text-foreground">Mercado de Trocas</h3>
                <p className="text-sm text-muted-foreground font-serif italic">"Um Galeão por uma história, uma carta por um amigo."</p>
            </div>
            <Button variant="plaque" className="w-full h-14 rounded-2xl border-white/10" onClick={() => navigate("/dashboard/trades")}>
                Acessar Mercado 🏪
            </Button>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Trocas seguras auditadas por Gringotts</p>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="flex justify-center py-4">
          <div className="glass p-2 rounded-full border border-white/5 bg-black/40 backdrop-blur-2xl inline-flex flex-wrap gap-3">
            {(["all", "gold", "silver", "bronze"] as const).map(r => (
            <button key={r} onClick={() => setActiveRarity(r)}
                className={`px-8 py-3 rounded-full text-xs font-bold font-heading transition-all duration-500 relative overflow-hidden group ${
                activeRarity === r
                    ? r === "gold" ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20"
                    : r === "silver" ? "bg-slate-200 text-black shadow-lg shadow-white/10"
                    : r === "bronze" ? "bg-amber-700 text-white shadow-lg shadow-amber-900/20"
                    : "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}>
                <span className="relative z-10 uppercase tracking-widest">
                    {r === "all" ? "✨ Todas" : r === "gold" ? "🥇 Ouro" : r === "silver" ? "🥈 Prata" : "🥉 Bronze"}
                </span>
                {activeRarity === r && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
            </button>
            ))}
          </div>
      </div>

      {/* ── GRID MONSTER QUALITY ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {filtered.map(s => {
          const unlocked = userStickers[s.id];
          const isGold = s.rarity === "gold";
          const isSilver = s.rarity === "silver";
          const cost = RARITY_COST[s.rarity];
          const levelOk = profile ? profile.level >= s.level_required : false;
          const xpOk = profile ? profile.xp >= cost : false;

          let rarityStyle = "border-amber-900/40 bg-gradient-to-b from-amber-950/20 to-black";
          if (isSilver) rarityStyle = "border-slate-300/20 bg-gradient-to-b from-slate-900/40 to-black shadow-[0_0_20px_rgba(255,255,255,0.05)]";
          if (isGold) rarityStyle = "border-yellow-400/30 bg-gradient-to-b from-yellow-900/20 to-black shadow-[0_0_30px_rgba(251,191,36,0.15)] ring-1 ring-yellow-400/20";

          return (
            <div key={s.id}
              className={`relative aspect-[3/4.5] rounded-[2.5rem] flex flex-col overflow-hidden border-2 transition-all duration-700 group ${
                unlocked ? rarityStyle : "border-white/5 bg-secondary/5 hover:border-white/20"
              } ${unlocked && isGold ? 'hover:shadow-[0_0_40px_rgba(251,191,36,0.3)]' : ''}`}
            >
              <div className="absolute inset-0 z-0 overflow-hidden">
                <div className={`absolute inset-0 transition-transform duration-1000 ${unlocked ? 'group-hover:scale-110' : ''}`}>
                    <StickerVisual
                    name={s.character_name}
                    rarity={s.rarity}
                    unlocked={unlocked}
                    imageUrl={s.image_url}
                    failedImage={failedImages[s.id]}
                    />
                    {s.image_url && !failedImages[s.id] && (
                    <img src={s.image_url} alt={s.character_name} referrerPolicy="no-referrer"
                        onError={() => setFailedImages(prev => ({ ...prev, [s.id]: true }))}
                        className={`w-full h-full object-cover object-top transition-all duration-1000 ${
                        unlocked ? "opacity-80" : "opacity-20 grayscale brightness-50"
                        }`}
                    />
                    )}
                </div>
                
                {/* Holographic Flash for Unlocked Cards */}
                {unlocked && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none z-10" />
                )}
                
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  unlocked ? "from-black via-black/40 to-transparent" : "from-black/90 via-black/60 to-transparent"
                } z-10`} />
              </div>

              <div className="relative z-20 h-full flex flex-col justify-between p-6">
                <div className="flex justify-between items-start">
                  <div className={`text-[9px] uppercase font-bold tracking-[0.2em] px-3 py-1.5 rounded-full border backdrop-blur-xl shadow-lg ${
                    isGold ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/50"
                    : isSilver ? "bg-slate-300/20 text-slate-200 border-slate-300/50"
                    : "bg-amber-900/40 text-amber-500 border-amber-800/50"
                  }`}>
                    {s.rarity}
                  </div>
                  {!unlocked && (
                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border ${levelOk ? 'bg-primary/20 text-primary border-primary/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        NV.{s.level_required}
                    </div>
                  )}
                </div>

                <div className="mt-auto space-y-4">
                  <div className="text-center">
                    <h3 className={`font-heading text-lg leading-tight transition-colors duration-500 ${
                        unlocked ? isGold ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "text-white" : "text-white/20 group-hover:text-white/40"
                    }`}>
                        {unlocked ? s.character_name : "Desconhecido"}
                    </h3>
                    {unlocked && isGold && <div className="text-[8px] text-yellow-500/60 uppercase tracking-[0.4em] font-bold mt-1">Artefato Lendário</div>}
                  </div>

                  {!unlocked && (
                    <Button variant="plaque" className="w-full h-12 text-[10px] font-heading uppercase tracking-widest rounded-xl shadow-xl transition-all active:scale-95"
                      disabled={!levelOk || !xpOk || buyingId === s.id} onClick={() => buySticker(s)}>
                      {buyingId === s.id ? "..." : !levelOk ? `Bloqueado` : !xpOk ? `Faltam XP` : `Comprar ${cost} XP`}
                    </Button>
                  )}
                  
                  {unlocked && (
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                         <div className="h-1 w-8 bg-current opacity-20 rounded-full" style={{ color: isGold ? '#facc15' : isSilver ? '#e2e8f0' : '#b45309' }} />
                         <span className="text-[10px] text-white/40 font-heading uppercase tracking-widest">Coletado</span>
                         <div className="h-1 w-8 bg-current opacity-20 rounded-full" style={{ color: isGold ? '#facc15' : isSilver ? '#e2e8f0' : '#b45309' }} />
                    </div>
                  )}
                </div>
              </div>

              {unlocked && isGold && (
                <div className="absolute inset-0 z-30 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.1),transparent_70%)] animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {completedBanner && (
        <div className="glass rounded-[3rem] p-12 text-center border-2 border-yellow-400 bg-gradient-to-r from-yellow-900/40 via-black/60 to-yellow-900/40 shadow-[0_0_80px_rgba(251,191,36,0.3)] animate-pulse-glow">
            <h2 className="font-heading text-5xl text-yellow-400 mb-4 tracking-tighter">🏆 LENDA DE HOGWARTS 🏆</h2>
            <p className="text-xl text-yellow-100/70 font-serif italic max-w-2xl mx-auto leading-relaxed">
                "Você reuniu todos os fragmentos da história. Seu nome agora ecoa pelos corredores do castelo como o maior colecionador de todos os tempos."
            </p>
            <div className="mt-8 flex justify-center gap-4">
                <div className="bg-yellow-400 text-black px-8 py-3 rounded-full font-heading font-bold uppercase tracking-widest shadow-2xl">Título Desbloqueado</div>
            </div>
        </div>
      )}
    </div>
  );
}