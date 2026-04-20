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

      if (inactiveDays < 1) return; // Nenhuma ação necessária

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

      if (inactiveDays >= 5) {
        // Send to Azkaban — 24 hours
        const releaseAt = new Date(Date.now() + 86400_000).toISOString();
        await supabase.from("azkaban_status").insert({
          user_id: user.id,
          active: true,
          reason: `Inatividade severa de ${inactiveDays} dias`,
          xp_penalty: 500,
          release_at: releaseAt,
        } as never);
        await supabase.rpc("award_xp_action", { _action: "azkaban_penalty", _user_id: user.id, _xp: -500 });
        toast(
          <div className="text-center">
            <div className="text-4xl mb-2">⛓️</div>
            <p className="font-heading text-lg text-blue-400">O Filch te jogou em Azkaban!</p>
            <p className="text-xs text-muted-foreground mt-1">Inatividade inaceitável. -500 XP. Duração: 24 horas.</p>
          </div>,
          { duration: 10000 }
        );
        setTimeout(() => navigate("/dashboard/azkaban"), 3000);
      } else if (inactiveDays >= 3) {
        // Heavy penalty
        await supabase.rpc("award_xp_action", { _action: "inactivity_penalty", _user_id: user.id, _xp: -100 });
        toast(
          <div className="text-center">
            <div className="text-3xl mb-1">🧹</div>
            <p className="font-heading text-base text-red-400">⚠️ Último Aviso do Filch!</p>
            <p className="text-xs text-muted-foreground mt-1">Você perdeu 100 XP por inatividade. O próximo passo é Azkaban direto!</p>
          </div>,
          { duration: 8000 }
        );
      } else if (inactiveDays >= 2) {
        // Medium penalty
        await supabase.rpc("award_xp_action", { _action: "inactivity_penalty", _user_id: user.id, _xp: -50 });
        toast(
          <div className="text-center">
            <div className="text-3xl mb-1">🧹</div>
            <p className="font-heading text-base text-orange-400">Penalidade de Inatividade!</p>
            <p className="text-xs text-muted-foreground mt-1">Você perdeu 50 XP por não aparecer no castelo. Filch não gosta de vadiagem!</p>
          </div>,
          { duration: 6000 }
        );
      } else if (inactiveDays >= 1) {
        // Just a warning, no penalty
        toast(
          <div className="text-center">
            <div className="text-3xl mb-1">🧹</div>
            <p className="font-heading text-base text-yellow-400">Filch está te observando!</p>
            <p className="text-xs text-muted-foreground mt-1">1 dia de ausência. Não deixe a inatividade virar um hábito, ou haverá punições!</p>
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
