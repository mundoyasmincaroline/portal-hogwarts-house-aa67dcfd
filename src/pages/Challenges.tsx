import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  type: string;
  active: boolean;
}

export default function Challenges() {
  const { user, profile, fetchProfile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: ch } = await supabase.from("challenges").select("*").eq("active", true).order("created_at", { ascending: false });
    setChallenges(ch || []);
    if (user) {
      const { data: uc } = await supabase
        .from("user_challenges")
        .select("challenge_id, completed")
        .eq("user_id", user.id)
        .eq("completed", true);
      setCompletedIds(new Set((uc || []).map((r) => r.challenge_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const completeChallenge = async (c: Challenge) => {
    if (!user || !profile) return;
    if (completedIds.has(c.id)) { toast.info("Você já completou este desafio!"); return; }

    const { error: ucErr } = await supabase
      .from("user_challenges")
      .insert({ user_id: user.id, challenge_id: c.id, completed: true, completed_at: new Date().toISOString() } as never);
    if (ucErr) { toast.error("Erro: " + ucErr.message); return; }

    await supabase.from("profiles").update({ xp: profile.xp + c.xp_reward } as never).eq("user_id", user.id);
    await supabase.from("house_points").insert({ house: profile.house, points: c.xp_reward, reason: `Desafio: ${c.title}`, awarded_by: user.id } as never);
    await fetchProfile(user.id);

    toast.success(`+${c.xp_reward} XP! ⚡ Pontos para ${profile.house}!`);
    setCompletedIds((s) => new Set([...s, c.id]));
  };

  const daily = challenges.filter((c) => c.type === "daily");
  const weekly = challenges.filter((c) => c.type === "weekly");
  const special = challenges.filter((c) => c.type === "special");

  const renderCard = (c: Challenge, isWeekly = false) => {
    const done = completedIds.has(c.id);
    return (
      <div key={c.id} className={`glass rounded-xl p-5 transition-transform hover:scale-[1.01] ${isWeekly ? "ring-1 ring-primary/20" : ""} ${done ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading text-foreground">{c.title}</h3>
          <span className="text-xs font-heading bg-primary/20 text-primary px-2 py-1 rounded-full">{c.xp_reward} XP</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{c.description}</p>
        <Button
          variant="magical"
          size="sm"
          className="font-heading text-xs w-full"
          disabled={done}
          onClick={() => completeChallenge(c)}
        >
          {done ? "✅ Concluído" : isWeekly ? "Participar do Desafio ⚔️" : "Aceitar Desafio ⚡"}
        </Button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 text-center">
        <h1 className="font-heading text-2xl text-gold-gradient mb-2">Desafios & Missões</h1>
        <p className="text-muted-foreground text-sm">Complete desafios para ganhar XP e pontos para sua casa</p>
      </div>

      {loading && <p className="text-center text-muted-foreground text-sm py-6">Carregando desafios...</p>}

      {!loading && challenges.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🪄</div>
          <p className="text-muted-foreground text-sm">Nenhum desafio ativo no momento. Volte em breve!</p>
        </div>
      )}

      {daily.length > 0 && (
        <div>
          <h2 className="font-heading text-lg text-foreground mb-3">📅 Missões Diárias</h2>
          <div className="grid md:grid-cols-2 gap-4">{daily.map((c) => renderCard(c))}</div>
        </div>
      )}

      {weekly.length > 0 && (
        <div>
          <h2 className="font-heading text-lg text-foreground mb-3">🏆 Desafios Semanais</h2>
          <div className="grid md:grid-cols-2 gap-4">{weekly.map((c) => renderCard(c, true))}</div>
        </div>
      )}

      {special.length > 0 && (
        <div>
          <h2 className="font-heading text-lg text-foreground mb-3">✨ Eventos Especiais</h2>
          <div className="grid md:grid-cols-2 gap-4">{special.map((c) => renderCard(c, true))}</div>
        </div>
      )}
    </div>
  );
}
