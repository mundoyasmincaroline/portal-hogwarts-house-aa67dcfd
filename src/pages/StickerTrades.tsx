import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SafeImage from "@/components/SafeImage";

interface Sticker {
  id: string;
  character_name: string;
  rarity: "bronze" | "silver" | "gold";
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
  const { user, profile } = useAuth();
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
    if (!user) return;
    // Verifica se o usuário tem a figurinha desejada (se especificada)
    if (trade.wanted_sticker_id && !myStickers.find(s => s.id === trade.wanted_sticker_id)) {
      toast.error("Você não possui a figurinha pedida pelo ofertante.");
      return;
    }
    const { error } = await supabase.from("sticker_trades").update({
      status: "accepted",
      accepted_by_id: user.id,
      accepted_at: new Date().toISOString(),
    } as never).eq("id", trade.id);
    if (error) { toast.error("Erro ao aceitar troca."); return; }

    // Dar figurinha oferecida para quem aceitou
    await supabase.from("user_stickers").upsert({ user_id: user.id, sticker_id: trade.offered_sticker_id } as never);
    // Dar figurinha desejada para o ofertante (se especificada)
    if (trade.wanted_sticker_id) {
      await supabase.from("user_stickers").upsert({ user_id: trade.offerer_id, sticker_id: trade.wanted_sticker_id } as never);
    }
    toast.success("🎉 Troca realizada com sucesso! Figurinha adicionada ao seu álbum.");
    loadData();
  };

  const cancelTrade = async (tradeId: string) => {
    await supabase.from("sticker_trades").update({ status: "cancelled" } as never).eq("id", tradeId);
    toast.info("Oferta cancelada.");
    loadData();
  };

  const myTrades = trades.filter(t => t.offerer_id === user?.id);
  const otherTrades = trades.filter(t => t.offerer_id !== user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="glass rounded-3xl p-8 text-center border border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background opacity-80" />
        <div className="relative z-10">
          <h1 className="font-heading text-4xl text-foreground mb-2">🏪 Mercado de Trocas</h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Ofereça figurinhas duplicadas e encontre quem tem o que você precisa para completar o álbum!
          </p>
          <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={() => navigate("/dashboard/album")}>
            ← Voltar ao Álbum
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {(["mercado", "minhas"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-heading border transition-all ${tab === t ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            {t === "mercado" ? `🏪 Mercado (${otherTrades.length})` : `📦 Minhas Ofertas (${myTrades.length})`}
          </button>
        ))}
      </div>

      {/* Criar oferta */}
      <div className="glass rounded-2xl p-6 border border-primary/20 space-y-4">
        <h3 className="font-heading text-lg text-foreground">✨ Criar Nova Oferta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Eu ofereço:</label>
            <select
              value={offerStickerId}
              onChange={e => setOfferStickerId(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">Selecionar figurinha...</option>
              {myStickers.map(s => (
                <option key={s.id} value={s.id}>
                  {RARITY_EMOJI[s.rarity]} {s.character_name} ({s.rarity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Eu quero (opcional):</label>
            <select
              value={wantStickerId}
              onChange={e => setWantStickerId(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">Qualquer figurinha</option>
              {allStickers
                .filter(s => !myStickers.find(ms => ms.id === s.id))
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {RARITY_EMOJI[s.rarity]} {s.character_name} ({s.rarity})
                  </option>
                ))}
            </select>
          </div>
        </div>
        <Button variant="magical" onClick={createTrade} disabled={creating || !offerStickerId} className="font-heading">
          {creating ? "Publicando..." : "📮 Publicar Oferta"}
        </Button>
      </div>

      {/* Lista de trocas */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground animate-pulse">Carregando o mercado...</div>
      ) : (
        <div className="space-y-4">
          {tab === "mercado" && otherTrades.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">🏪</p>
              <p className="font-heading">O mercado está vazio no momento.</p>
              <p className="text-xs mt-1">Seja o primeiro a publicar uma oferta!</p>
            </div>
          )}
          {tab === "minhas" && myTrades.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-heading">Você não tem ofertas ativas.</p>
            </div>
          )}

          {(tab === "mercado" ? otherTrades : myTrades).map(trade => (
            <div key={trade.id} className="glass rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 border border-border hover:border-primary/30 transition-all">
              {/* Figurinha oferecida */}
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-16 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 ${RARITY_COLOR[trade.offered_sticker?.rarity || "bronze"]}`}>
                  <SafeImage
                    src={trade.offered_sticker?.image_url}
                    alt={trade.offered_sticker?.character_name || "?"}
                    className="w-full h-full object-cover object-top"
                    fallbackText={trade.offered_sticker?.character_name}
                  />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Oferece</p>
                  <p className="font-heading text-sm text-foreground">{trade.offered_sticker?.character_name}</p>
                  <p className={`text-xs font-bold ${RARITY_COLOR[trade.offered_sticker?.rarity || "bronze"].split(" ")[1]}`}>
                    {RARITY_EMOJI[trade.offered_sticker?.rarity]} {trade.offered_sticker?.rarity}
                  </p>
                </div>
              </div>

              <div className="text-2xl self-center">⇄</div>

              {/* Figurinha desejada */}
              <div className="flex items-center gap-4 flex-1">
                {trade.wanted_sticker ? (
                  <>
                    <div className={`w-16 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 ${RARITY_COLOR[trade.wanted_sticker.rarity]}`}>
                      <SafeImage
                        src={trade.wanted_sticker.image_url}
                        alt={trade.wanted_sticker.character_name}
                        className="w-full h-full object-cover object-top"
                        fallbackText={trade.wanted_sticker.character_name}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Quer</p>
                      <p className="font-heading text-sm text-foreground">{trade.wanted_sticker.character_name}</p>
                      <p className={`text-xs font-bold ${RARITY_COLOR[trade.wanted_sticker.rarity].split(" ")[1]}`}>
                        {RARITY_EMOJI[trade.wanted_sticker.rarity]} {trade.wanted_sticker.rarity}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-2xl text-muted-foreground flex-shrink-0">
                      🎲
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Quer</p>
                      <p className="text-sm text-muted-foreground italic">Qualquer figurinha</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Ofertante + ação */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-border">
                    <SafeImage
                      src={trade.offerer_profile?.avatar_url}
                      alt={trade.offerer_profile?.full_name}
                      className="w-full h-full object-cover"
                      fallbackText={trade.offerer_profile?.full_name}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">@{trade.offerer_profile?.username}</p>
                </div>
                {tab === "mercado" ? (
                  <Button
                    variant="magical"
                    size="sm"
                    className="text-xs font-heading"
                    onClick={() => acceptTrade(trade)}
                  >
                    Aceitar Troca ✨
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                    onClick={() => cancelTrade(trade.id)}
                  >
                    Cancelar ✕
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
