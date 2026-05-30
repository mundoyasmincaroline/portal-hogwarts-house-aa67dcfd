import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy, Sparkles, Gift, RefreshCw, Share2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StickerVisual from "@/components/StickerVisual";
import MagicalEmoji from "@/components/MagicalEmoji";
import StickerAlbumBook from "@/components/StickerAlbumBook";
import { useStickers } from "@/hooks/features/useStickers";
import { stickerService } from "@/services/features/stickerService";
import { Sticker } from "@/types";
import { RARITY_COST, PACK_COST } from "@/constants/gameConstants";
import { shareContent, buildStickerShareText, buildAlbumShareText } from "@/lib/share";

const RARITY_ORDER = { bronze: 0, silver: 1, gold: 2 };

export default function StickerAlbum() {
  const { profile, user, fetchProfile } = useAuth();
  const { stickers, userStickers, loading, loadAlbum, buySticker: handleBuySticker } = useStickers();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeRarity, setActiveRarity] = useState<"all" | "bronze" | "silver" | "gold">("all");
  const [openingPack, setOpeningPack] = useState(false);
  const [packReveal, setPackReveal] = useState<Sticker | null>(null);
  const [packPhase, setPackPhase] = useState<"idle" | "shaking" | "reveal">("idle");
  const navigate = useNavigate();

  const handleShareSticker = async (s: Sticker) => {
    const text = buildStickerShareText(s.character_name, s.rarity, (s as any).house);
    const res = await shareContent({ title: `Figurinha: ${s.character_name}`, text });
    if (res === "copied") toast.success("✨ Link copiado! Cole nas redes sociais.");
    else if (res === "failed") toast.error("Não foi possível compartilhar.");
  };

  const handleShareAlbum = async () => {
    const text = buildAlbumShareText(owned, total, goldOwned);
    const res = await shareContent({ title: "Meu Álbum Mágico", text });
    if (res === "copied") toast.success("✨ Progresso do álbum copiado!");
    else if (res === "failed") toast.error("Não foi possível compartilhar.");
  };

  const completedBanner = useMemo(() => {
    return stickers.length > 0 && Object.keys(userStickers).length >= stickers.length;
  }, [stickers, userStickers]);

  const buySticker = async (sticker: Sticker) => {
    if (buyingId) return;
    setBuyingId(sticker.id);
    const success = await handleBuySticker(sticker);
    setBuyingId(null);

    if (success && stickers.length > 0 && (Object.keys(userStickers).length + 1) >= stickers.length) {
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
  };

  const openSurprisePack = async () => {
    if (!user || !profile || openingPack) return;

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
      // A atualização do estado agora é feita via reload no hook ou manualmente se necessário
      await loadAlbum();
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
      <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[4rem] border border-yellow-500/20 shadow-2xl group min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f02] via-[#2a1b0a] to-[#0a121a] z-0" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?q=80&w=2070')] bg-cover bg-center opacity-20 group-hover:scale-105 transition-transform duration-[4000ms] mix-blend-overlay" />
        
        <div className="relative z-10 p-6 sm:p-12 md:p-16 text-center space-y-8 w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-yellow-500/30 rounded-full px-5 py-2 shadow-2xl animate-in slide-in-from-top-4 duration-700">
              <Sparkles size={14} className="text-yellow-500 animate-pulse" />
              <span className="text-[10px] font-heading text-yellow-500 uppercase tracking-[0.4em] font-bold">Biblioteca Proibida de Hogwarts</span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-6xl md:text-8xl text-gold-gradient drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)] tracking-tighter leading-none">
              {completedBanner ? "🏆 ÁLBUM LENDÁRIO 🏆" : "Álbum de Magia"}
            </h1>
            
            <p className="text-yellow-100/60 text-sm sm:text-lg max-w-2xl mx-auto font-serif italic leading-relaxed">
              "As memórias de Hogwarts estão gravadas nestas páginas. Encontre cada fragmento e restaure o equilíbrio da magia."
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <div className="glass bg-white/5 border-primary/20 px-6 py-4 rounded-[2rem] flex items-center gap-4 shadow-2xl hover:border-primary/40 transition-all group/xp">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover/xp:rotate-12 transition-transform">
                <Zap size={24} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-primary/60 uppercase font-black tracking-widest">Poder Mágico</p>
                <p className="font-heading text-2xl sm:text-3xl text-primary drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">{profile?.xp || 0} XP</p>
              </div>
            </div>
            
            <Button 
              variant="magical" 
              size="lg" 
              className="h-20 px-12 rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(212,175,55,0.4)] w-full sm:w-auto text-xl font-heading group/btn relative overflow-hidden" 
              onClick={openSurprisePack} 
              disabled={openingPack || (profile?.xp ?? 0) < 80}
            >
               <span className="relative z-10 flex items-center gap-3">
                 Invocação Mística <Gift className="group-hover/btn:scale-110 transition-transform" />
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── REVEAL ANIMATION ── */}
      {openingPack && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-10 p-4" onClick={packPhase === "reveal" ? closePack : undefined}>
          {packPhase === "shaking" && (
            <div className="relative group cursor-pointer animate-float flex flex-col items-center">
              <div className="absolute inset-0 bg-purple-500/30 blur-[120px] rounded-full animate-pulse" />
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <MagicalEmoji emoji="🎁" size="2xl" glowColor="rgba(168, 85, 247, 0.6)" />
              </motion.div>
              <div className="mt-8 text-center space-y-2">
                <p className="font-heading text-4xl text-purple-400 animate-pulse uppercase tracking-[0.5em]">Invocando Magia...</p>
                <p className="text-lg text-purple-200/60 font-serif italic">"O destino está sendo escrito nas estrelas"</p>
              </div>
              <div className="absolute inset-0 z-0 pointer-events-none">
                 {[...Array(20)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        scale: [0, 1.5, 0],
                        y: [0, -100 - Math.random() * 200],
                        x: [0, (Math.random() - 0.5) * 300]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5 + Math.random(),
                        delay: Math.random() * 2
                      }}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full blur-[1px]" 
                      style={{
                        top: "50%",
                        left: "50%",
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
                    <StickerVisual name={packReveal.character_name} rarity={packReveal.rarity} unlocked imageUrl={packReveal.image_url} failedImage={failedImages[packReveal.id]} />
                    {packReveal.image_url && !failedImages[packReveal.id] && (
                    <img
                      src={packReveal.image_url}
                      alt={packReveal.character_name}
                      width={1024}
                      height={1024}
                      loading="eager"
                      decoding="async"
                      onError={() => setFailedImages(prev => ({ ...prev, [packReveal.id]: true }))}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
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
                <div className="flex flex-col gap-3 w-full">
                  <Button variant="plaque" size="lg" className="w-full h-14 text-base rounded-2xl shadow-2xl" onClick={(e) => { e.stopPropagation(); handleShareSticker(packReveal); }}>
                    <Share2 className="mr-2" /> Compartilhar Figurinha
                  </Button>
                  <Button variant="plaque" size="lg" className="w-full h-14 text-base rounded-2xl shadow-2xl opacity-90" onClick={closePack}>
                    Adicionar à Coleção
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STATS & PROGRESS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 space-y-8 border border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden group">
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
                    <div key={r.label} className={`rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 text-center border-2 backdrop-blur-md transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl group/card relative overflow-hidden ${r.bg}`}>
                        <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover/card:opacity-100 transition-opacity" />
                        <div className="text-4xl mb-4 relative z-10 transition-transform group-hover/card:scale-125 duration-500">{r.icon}</div>
                        <p className={`font-heading text-3xl sm:text-4xl mb-1 relative z-10 ${r.color}`}>{r.owned}<span className="text-xl opacity-40">/{r.total}</span></p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold relative z-10">{r.label}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="glass rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col items-center justify-center text-center gap-6 sm:gap-8 border border-white/5 bg-gradient-to-t from-black/40 to-white/5 relative group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 group-hover:scale-110 transition-transform duration-1000" />
            <MagicalEmoji icon={RefreshCw} size="md" glowColor="rgba(255, 255, 255, 0.2)" className="group-hover:rotate-180 transition-transform duration-1000" />
            <div className="space-y-3 relative z-10">
                <h3 className="font-heading text-2xl text-foreground">Mercado de Trocas</h3>
                <p className="text-sm text-muted-foreground font-serif italic">"Um Galeão por uma história, uma carta por um amigo."</p>
            </div>
            <Button variant="plaque" className="w-full h-14 rounded-2xl border-white/10" onClick={() => navigate("/dashboard/trades")}>
                Acessar Mercado 🏪
            </Button>
            <Button variant="outline" className="w-full h-12 rounded-2xl border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10" onClick={handleShareAlbum}>
                <Share2 size={16} className="mr-2" /> Compartilhar Álbum
            </Button>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Trocas seguras auditadas por Gringotts</p>
        </div>
      </div>

      {/* ── THE BOOK EXPERIENCE ── */}
      <StickerAlbumBook 
        stickers={filtered} 
        userStickers={userStickers} 
        onBuy={buySticker} 
        buyingId={buyingId} 
        profileLevel={profile?.level || 1}
        profileXp={profile?.xp || 0}
      />

      {/* ── FILTERS ── */}
      <div className="flex justify-center py-4">
          <div className="glass p-1.5 sm:p-2 rounded-full border border-white/5 bg-black/40 backdrop-blur-2xl inline-flex flex-wrap justify-center gap-1.5 sm:gap-3">
            {(["all", "gold", "silver", "bronze"] as const).map(r => (
            <button key={r} onClick={() => setActiveRarity(r)}
                className={`px-4 sm:px-8 py-2 sm:py-3 rounded-full text-[10px] sm:text-xs font-bold font-heading transition-all duration-500 relative overflow-hidden group ${
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

      {completedBanner && (
        <div className="glass rounded-[3rem] p-12 text-center border-2 border-yellow-400 bg-gradient-to-r from-yellow-900/40 via-black/60 to-yellow-900/40 shadow-[0_0_80px_rgba(251,191,36,0.3)] animate-pulse-glow">
            <h2 className="font-heading text-5xl text-yellow-400 mb-4 tracking-tighter">🏆 LENDA DE HOGWARTS 🏆</h2>
            <p className="text-xl text-yellow-100/70 font-serif italic max-w-2xl mx-auto leading-relaxed">
                "Você reuniu todos os fragmentos da história. Seu nome agora ecoa pelos corredores do castelo como o maior colecionador de todos os tempos."
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
                <div className="bg-yellow-400 text-black px-8 py-3 rounded-full font-heading font-bold uppercase tracking-widest shadow-2xl">Título Desbloqueado</div>
                <Button variant="plaque" className="h-12 px-8 rounded-full" onClick={handleShareAlbum}>
                    <Share2 size={16} className="mr-2" /> Compartilhar Conquista
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}