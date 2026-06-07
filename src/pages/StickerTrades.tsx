import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SafeImage from "@/components/SafeImage";
import MagicalEmoji from "@/components/shared/MagicalEmoji";
import StickerVisual from "@/components/StickerVisual";

import EmojiIcon from "@/components/shared/EmojiIcon";
interface Sticker {
  id: string;
  character_name: string;
  rarity: string;
  image_url: string;
}

interface Trade {
  id: string;
  offerer_id: string;
  offered_sticker_id: string;
  wanted_sticker_id: string | null;
  status: "open" | "accepted" | "cancelled";
  created_at: string;
  offered_sticker: Sticker;
  wanted_sticker: Sticker | null;
  offerer_profile: { full_name: string; username: string; avatar_url: string | null };
}

const RARITY_COLOR: Record<string, string> = {
  gold: "border-yellow-400 text-yellow-400",
  silver: "border-slate-300 text-slate-300",
  bronze: "border-amber-600 text-amber-600",
};

const RARITY_EMOJI: Record<string, string> = { gold: "🥇", silver: "🥈", bronze: "🥉" };

export default function StickerTrades() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [myStickers, setMyStickers] = useState<Sticker[]>([]);
  const [allStickers, setAllStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"mercado" | "minhas">("mercado");

  // Criar oferta
  const [offerStickerId, setOfferStickerId] = useState<string>("");
  const [wantStickerId, setWantStickerId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    // Buscar todas as figurinhas
    const { data: all } = await supabase.from("stickers").select("*");
    setAllStickers((all as Sticker[]) || []);

    // Figurinhas que o usuário possui
    const { data: mine } = await supabase.from("user_stickers").select("sticker_id").eq("user_id", user.id);
    const myIds = (mine || []).map(s => s.sticker_id);
    setMyStickers((all || []).filter((s: Sticker) => myIds.includes(s.id)) as Sticker[]);

    // Buscar trocas abertas
    const { data: tradesData } = await supabase
      .from("sticker_trades")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (tradesData && tradesData.length > 0) {
      // Enriquecer com dados de figurinhas e perfis
      const stickerMap = Object.fromEntries((all || []).map((s: Sticker) => [s.id, s]));
      const offererIds = [...new Set(tradesData.map(t => t.offerer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", offererIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));

      const enriched: Trade[] = tradesData.map(t => ({
        ...t,
        status: t.status as Trade["status"],
        offered_sticker: stickerMap[t.offered_sticker_id],
        wanted_sticker: t.wanted_sticker_id ? stickerMap[t.wanted_sticker_id] : null,
        offerer_profile: profileMap[t.offerer_id] || { full_name: "Bruxo", username: "bruxo", avatar_url: null },
      }));
      setTrades(enriched);
    } else {
      setTrades([]);
    }
    setLoading(false);
  };

  const createTrade = async () => {
    if (!user || !offerStickerId) { toast.error("Selecione a figurinha a oferecer!"); return; }
    setCreating(true);
    const { error } = await supabase.from("sticker_trades").insert({
      offerer_id: user.id,
      offered_sticker_id: offerStickerId,
      wanted_sticker_id: wantStickerId || null,
      status: "open",
    } as never);
    if (error) { toast.error("Erro ao criar oferta: " + error.message); }
    else {
      toast.success("✨ Oferta publicada no Mercado!");
      setOfferStickerId("");
      setWantStickerId("");
      loadData();
    }
    setCreating(false);
  };

  const acceptTrade = async (trade: Trade) => {
    if (!user || acceptingId) return;
    if (trade.wanted_sticker_id && !myStickers.find(s => s.id === trade.wanted_sticker_id)) {
      toast.error("Você não possui a figurinha pedida pelo ofertante.");
      return;
    }
    setAcceptingId(trade.id);
    try {
      const { data, error } = await (supabase.rpc as any)("accept_sticker_trade", { _trade_id: trade.id });
      if (error) { toast.error("Erro ao aceitar troca: " + error.message); return; }
      const result = data as { success: boolean; message?: string };
      if (!result?.success) { toast.error(result?.message || "Não foi possível concluir a troca."); return; }
      toast.success("🎉 Troca realizada com sucesso! Figurinha adicionada ao seu álbum.");
    } finally {
      setAcceptingId(null);
      loadData();
    }
  };

  const cancelTrade = async (tradeId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("sticker_trades")
      .update({ status: "cancelled" } as never)
      .eq("id", tradeId)
      .eq("offerer_id", user.id);
    if (error) toast.error(error.message);
    else { toast.info("Oferta cancelada."); loadData(); }
  };

  const myTrades = trades.filter(t => t.offerer_id === user?.id);
  const otherTrades = trades.filter(t => t.offerer_id !== user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10 px-2 sm:px-0">
      {/* ── HEADER MONSTER QUALITY ── */}
      <div className="relative glass rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 md:p-16 text-center overflow-hidden border border-yellow-500/20 shadow-2xl group animate-in fade-in slide-in-from-top-10 duration-1000">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-black to-purple-900/40 opacity-60 z-0" />
        <div className="absolute inset-0 bg-[url('/hogwarts-castle-bg.jpg')] bg-cover bg-center opacity-10 group-hover:scale-105 transition-transform duration-1000" />
        
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-4 bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-full px-6 py-2 shadow-2xl">
            <MagicalEmoji emoji="🏪" size="xs" glowColor="rgba(234, 179, 8, 0.5)" />
            <span className="text-[10px] font-heading text-yellow-500 uppercase tracking-[0.3em] font-bold">Mercado de Relíquias</span>
          </div>
          
          <h1 className="font-heading text-3xl sm:text-5xl md:text-7xl text-gold-gradient mb-3 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            Trocas de Figurinhas
          </h1>
          <p className="text-yellow-100/95 text-lg max-w-2xl mx-auto font-serif italic">
            "No Beco Diagonal dos Colecionadores, cada troca é um pacto de honra. Encontre o que falta em seu destino."
          </p>

          <Button variant="ghost" size="sm" className="mt-4 text-xs uppercase tracking-[0.04em] sm:tracking-widest text-white/40 hover:text-white" onClick={() => navigate("/dashboard/album")}>
            ← Retornar ao Álbum Encantado
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-3 flex-wrap">
        {(["mercado", "minhas"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-heading border transition-all ${tab === t ? "bg-primary/20 border-primary text-primary" : "bg-background/70 backdrop-blur-md border-primary/30 text-foreground hover:border-primary/40"}`}
          >
            {t === "mercado" ? `🏪 Mercado (${otherTrades.length})` : `📦 Minhas Ofertas (${myTrades.length})`}
          </button>
        ))}
      </div>

      {/* ── CRIAR OFERTA MONSTER ── */}
      <div className="glass rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 border border-white/10 bg-gradient-to-br from-white/5 to-transparent shadow-2xl space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-700">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-inner">
                <MagicalEmoji emoji="✨" size="xs" />
            </div>
            <h3 className="font-heading text-2xl text-foreground tracking-tight">Publicar Oferta de Troca</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] text-primary uppercase tracking-[0.3em] font-bold mb-1 block">Minha Relíquia:</label>
            <div className="relative group">
                <select
                value={offerStickerId}
                onChange={e => setOfferStickerId(e.target.value)}
                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                <option value="">Selecionar minha figurinha...</option>
                {myStickers.map(s => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">
                    {RARITY_EMOJI[s.rarity]} {s.character_name} ({s.rarity})
                    </option>
                ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">↓</div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] text-primary uppercase tracking-[0.3em] font-bold mb-1 block">Desejo de Troca (Opcional):</label>
            <div className="relative group">
                <select
                value={wantStickerId}
                onChange={e => setWantStickerId(e.target.value)}
                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                <option value="">Qualquer figurinha</option>
                {allStickers
                    .filter(s => !myStickers.find(ms => ms.id === s.id))
                    .map(s => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">
                        {RARITY_EMOJI[s.rarity]} {s.character_name} ({s.rarity})
                    </option>
                    ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">↓</div>
            </div>
          </div>
        </div>

        <Button variant="plaque" onClick={createTrade} disabled={creating || !offerStickerId} className="w-full min-h-16 h-auto rounded-2xl text-sm sm:text-lg shadow-[0_15px_30px_-10px_rgba(234,179,8,0.3)] px-4">
          {creating ? "Invocando o Mercado..." : "📮 PUBLICAR OFERTA NO BECCO DIAGONAL"}
        </Button>
      </div>

      {/* Lista de trocas */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground animate-pulse">Carregando o mercado...</div>
      ) : (
        <div className="space-y-4">
          {tab === "mercado" && otherTrades.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3"><EmojiIcon e="🏪" /></p>
              <p className="font-heading">O mercado está vazio no momento.</p>
              <p className="text-xs mt-1">Seja o primeiro a publicar uma oferta!</p>
            </div>
          )}
          {tab === "minhas" && myTrades.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3"><EmojiIcon e="📦" /></p>
              <p className="font-heading">Você não tem ofertas ativas.</p>
            </div>
          )}

          {(tab === "mercado" ? otherTrades : myTrades).map(trade => (
            <div key={trade.id} className="glass rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col lg:flex-row items-center gap-8 border border-white/5 hover:border-primary/20 hover:shadow-[0_0_50px_rgba(234,179,8,0.1)] transition-all duration-700 group animate-in slide-in-from-left-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex flex-col items-center gap-4 flex-1 w-full">
                <p className="text-[10px] text-primary uppercase tracking-[0.4em] font-black">Eu Ofereço</p>
                <div className={`relative w-32 h-44 rounded-2xl overflow-hidden border-4 shadow-2xl transition-transform group-hover:scale-105 duration-500 ${RARITY_COLOR[trade.offered_sticker?.rarity || "bronze"]}`}>
                  {trade.offered_sticker ? (
                    <StickerVisual name={trade.offered_sticker.character_name} rarity={trade.offered_sticker.rarity as any} unlocked imageUrl={trade.offered_sticker.image_url} />
                  ) : null}
                </div>
                <p className="font-heading text-xl text-white text-center">{trade.offered_sticker?.character_name}</p>
              </div>

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(234,179,8,0.2)] group-hover:rotate-180 transition-transform duration-700">
                  <EmojiIcon e="⚡" />
                </div>
                <span className="text-[10px] text-primary/85 font-bold tracking-widest uppercase">Pacto</span>
              </div>

              <div className="flex flex-col items-center gap-4 flex-1 w-full">
                <p className="text-[10px] text-primary uppercase tracking-[0.4em] font-black">Eu Desejo</p>
                {trade.wanted_sticker ? (
                  <>
                    <div className={`relative w-32 h-44 rounded-2xl overflow-hidden border-4 shadow-2xl transition-transform group-hover:scale-105 duration-500 ${RARITY_COLOR[trade.wanted_sticker.rarity]}`}>
                      <StickerVisual name={trade.wanted_sticker.character_name} rarity={trade.wanted_sticker.rarity as any} unlocked imageUrl={trade.wanted_sticker.image_url} />
                    </div>
                    <p className="font-heading text-xl text-white text-center">{trade.wanted_sticker.character_name}</p>
                  </>
                ) : (
                  <>
                    <div className="w-32 h-44 rounded-2xl border-4 border-dashed border-white/10 flex items-center justify-center text-5xl text-white/5 flex-shrink-0 bg-white/5 shadow-inner">
                      <EmojiIcon e="❓" />
                    </div>
                    <p className="font-heading text-lg text-muted-foreground italic">Qualquer Relíquia</p>
                  </>
                )}
              </div>

              {/* Ofertante + ação */}
              <div className="flex flex-col items-end gap-4 flex-shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-white/5">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Ofertante</p>
                    <p className="text-sm font-heading text-white">@{trade.offerer_profile?.username}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shadow-xl">
                    <SafeImage
                      src={trade.offerer_profile?.avatar_url}
                      alt={trade.offerer_profile?.full_name}
                      className="w-full h-full object-cover"
                      fallbackText={trade.offerer_profile?.full_name}
                    />
                  </div>
                </div>
                {tab === "mercado" ? (
                  <Button
                    variant="plaque"
                    size="lg"
                    className="w-full md:w-auto min-h-12 h-auto px-5 sm:px-8 text-xs font-heading shadow-xl"
                    disabled={acceptingId === trade.id}
                    onClick={() => acceptTrade(trade)}
                  >
                    {acceptingId === trade.id ? "Processando..." : "ACEITAR TROCA ✨"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full md:w-auto min-h-12 h-auto px-5 sm:px-8 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 rounded-xl"
                    onClick={() => cancelTrade(trade.id)}
                  >
                    CANCELAR <EmojiIcon e="✕" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
