import { useEffect, useState } from "react";
import { Hourglass, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useImmersion } from "@/hooks/core/useImmersion";
import { toast } from "sonner";
import { cn } from "@/lib/core-utils";

const COST = 50;
const MAX_STOCK = 3;

/**
 * Cápsula de Tempo — item especial que salva a sequência se o jogador
 * pular 1 dia. Consumida automaticamente no próximo check-in.
 */
export default function StreakFreezeCard({ compact = false }: { compact?: boolean }) {
  const { user, profile, fetchProfile } = useAuth();
  const { cast } = useImmersion();
  const [freezes, setFreezes] = useState(0);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("streak_freezes")
        .eq("user_id", user.id)
        .maybeSingle();
      setFreezes(data?.streak_freezes ?? 0);
    })();
  }, [user?.id, profile?.galeons]);

  const buy = async () => {
    if (buying) return;
    setBuying(true);
    const { data, error } = await (supabase as any).rpc("buy_streak_freeze", { p_qty: 1 });
    setBuying(false);
    if (error) { toast.error(error.message); return; }
    cast("magic");
    toast.success(`⏳ Cápsula adquirida! Estoque: ${(data as any).freezes}`);
    setFreezes((data as any).freezes);
    if (user?.id) fetchProfile(user.id);
  };

  const cantAfford = (profile?.galeons ?? 0) < COST;
  const full = freezes >= MAX_STOCK;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30">
        <Hourglass size={14} className="text-cyan-300" />
        <span className="text-xs font-bold text-cyan-200">{freezes}/{MAX_STOCK}</span>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-cyan-400/30 p-5 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: "radial-gradient(circle at top right, rgba(34,211,238,0.18), transparent 60%)" }}
      />
      <header className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-2">
          <Hourglass className="text-cyan-300" size={18} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">Item especial</p>
            <h3 className="font-heading text-lg text-cyan-100">Cápsula de Tempo</h3>
          </div>
        </div>
        <span className="text-xs font-bold text-cyan-200">{freezes}/{MAX_STOCK}</span>
      </header>
      <p className="text-xs text-foreground/75 leading-relaxed mb-4 relative">
        Salva sua sequência automaticamente se você pular 1 dia.
        Consumida no próximo check-in.
      </p>
      <button
        onClick={buy}
        disabled={buying || cantAfford || full}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all relative",
          full
            ? "bg-cyan-400/10 text-cyan-300/60 cursor-not-allowed"
            : cantAfford
            ? "bg-secondary/40 text-foreground/40 cursor-not-allowed"
            : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
        )}
      >
        {buying ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {full ? "Estoque cheio" : cantAfford ? `Faltam ${COST - (profile?.galeons ?? 0)} G` : `Comprar por ${COST} G`}
      </button>
    </div>
  );
}