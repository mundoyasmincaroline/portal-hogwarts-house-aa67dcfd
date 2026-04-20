/**
 * FilchWatcher — Monitor de inatividade do Filch.
 * Roda silenciosamente no DashboardLayout.
 * Verifica o campo last_seen do perfil e aplica penalidades escalonadas.
 */
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const DAY_MS = 86_400_000;

export default function FilchWatcher() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) return;

    const checkInactivity = async () => {
      const lastSeen = profile.last_seen ? new Date(profile.last_seen).getTime() : Date.now();
      const inactiveDays = Math.floor((Date.now() - lastSeen) / DAY_MS);

      if (inactiveDays < 3) return; // Nenhuma ação necessária

      // Check if already in azkaban
      const { data: azk } = await supabase
        .from("azkaban_status")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (azk) {
        // Already in azkaban — redirect
        const releaseAt = new Date(azk.release_at).getTime();
        if (Date.now() < releaseAt) {
          navigate("/dashboard/azkaban");
        } else {
          // Release from azkaban
          await supabase.from("azkaban_status").update({ active: false } as never).eq("id", azk.id);
        }
        return;
      }

      const key = `filch_last_check_${user.id}`;
      const lastCheck = localStorage.getItem(key);
      const today = new Date().toDateString();
      if (lastCheck === today) return; // Already warned today
      localStorage.setItem(key, today);

      if (inactiveDays >= 10) {
        // Send to Azkaban — 1 hour
        const releaseAt = new Date(Date.now() + 3600_000).toISOString();
        await supabase.from("azkaban_status").insert({
          user_id: user.id,
          active: true,
          reason: `Inatividade de ${inactiveDays} dias`,
          xp_penalty: 150,
          release_at: releaseAt,
        } as never);
        // Apply XP penalty
        await supabase.rpc("award_xp_action", { _action: "azkaban_penalty", _user_id: user.id, _xp: -150 });
        toast(
          <div className="text-center">
            <div className="text-4xl mb-2">⛓️</div>
            <p className="font-heading text-lg text-blue-400">O Filch te enviou para Azkaban!</p>
            <p className="text-xs text-muted-foreground mt-1">Inatividade de {inactiveDays} dias. -150 XP. Duração: 1 hora.</p>
          </div>,
          { duration: 10000 }
        );
        setTimeout(() => navigate("/dashboard/azkaban"), 3000);
      } else if (inactiveDays >= 7) {
        // Final warning + XP penalty
        await supabase.rpc("award_xp_action", { _action: "inactivity_penalty", _user_id: user.id, _xp: -75 });
        toast(
          <div className="text-center">
            <div className="text-3xl mb-1">🧹</div>
            <p className="font-heading text-base text-red-400">⚠️ Aviso Final do Filch!</p>
            <p className="text-xs text-muted-foreground mt-1">Você perdeu 75 XP por inatividade de {inactiveDays} dias. Próximo passo: Azkaban!</p>
          </div>,
          { duration: 8000 }
        );
      } else if (inactiveDays >= 5) {
        // First XP penalty
        await supabase.rpc("award_xp_action", { _action: "inactivity_penalty", _user_id: user.id, _xp: -30 });
        toast(
          <div className="text-center">
            <div className="text-3xl mb-1">🧹</div>
            <p className="font-heading text-base text-orange-400">Penalidade por Inatividade!</p>
            <p className="text-xs text-muted-foreground mt-1">Você perdeu 30 XP. {inactiveDays} dias sem atividade. Continue assim e Filch vai te levar para Azkaban!</p>
          </div>,
          { duration: 6000 }
        );
      } else if (inactiveDays >= 3) {
        // Just a warning, no penalty
        toast(
          <div className="text-center">
            <div className="text-3xl mb-1">🧹</div>
            <p className="font-heading text-base text-yellow-400">Filch está de olho em você!</p>
            <p className="text-xs text-muted-foreground mt-1">{inactiveDays} dias sem atividade. Continue participando para evitar penalidades!</p>
          </div>,
          { duration: 5000 }
        );
      }
    };

    // Run check after initial load
    const timer = setTimeout(checkInactivity, 3000);
    return () => clearTimeout(timer);
  }, [user?.id, profile?.last_seen]);

  return null;
}
