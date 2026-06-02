import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Conquistas automáticas do Portal Hogwarts.
 * As medalhas são concedidas no banco (trigger trg_award_badges_on_xp) com
 * base na tabela public.badges. Este hook apenas escuta novas linhas em
 * public.user_badges e exibe o toast mágico de "Conquista desbloqueada".
 *
 * Compatibilidade: se houver registros antigos em localStorage (badges_*),
 * eles são migrados silenciosamente para o banco no primeiro carregamento.
 */
export function useAchievements(userId: string | undefined, _xp?: number, _level?: number) {
  const seenRef = useRef<Set<string>>(new Set());
  const bootRef = useRef(false);

  useEffect(() => {
    if (!userId || bootRef.current) return;
    bootRef.current = true;

    let cancelled = false;

    const showBadgeToast = (b: { name: string; icon: string | null; description?: string | null }) => {
      toast(
        <div className="flex items-center gap-3">
          <span className="text-3xl">{b.icon ?? "🏅"}</span>
          <div>
            <p className="font-heading text-sm font-bold text-primary">Conquista desbloqueada!</p>
            <p className="font-heading text-base text-foreground">{b.name}</p>
            {b.description && (
              <p className="text-xs text-muted-foreground">{b.description}</p>
            )}
          </div>
        </div>,
        { duration: 6000 }
      );
    };

    (async () => {
      // Carrega badges já conquistadas para não re-notificar
      const { data: existing } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId);
      if (cancelled) return;
      seenRef.current = new Set((existing ?? []).map((r: any) => r.badge_id as string));

      // Migração one-shot do legado (localStorage badges_<uid>) — apenas limpa
      try {
        const legacy = `badges_${userId}`;
        if (localStorage.getItem(legacy)) localStorage.removeItem(legacy);
      } catch { /* ignore */ }
    })();

    // Realtime: ouve novas medalhas concedidas pelo trigger no banco
    const channel = supabase
      .channel(`badges-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_badges", filter: `user_id=eq.${userId}` },
        async (payload: any) => {
          const badgeId = payload?.new?.badge_id as string | undefined;
          if (!badgeId || seenRef.current.has(badgeId)) return;
          seenRef.current.add(badgeId);
          const { data: badge } = await supabase
            .from("badges")
            .select("name, icon, description")
            .eq("id", badgeId)
            .maybeSingle();
          if (badge) showBadgeToast(badge as any);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);
}