import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Flame, Waves, Trees } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  status: string;
  xp_prize: number;
  galeon_prize: number;
  ends_at: string;
}
interface Trial {
  id: string;
  name: string;
  description: string | null;
  trial_type: string;
  difficulty: number;
  base_reward_galleons: number;
  base_reward_xp: number;
  order_index: number;
}

const trialIcon = (type: string) => {
  if (type === "dragon") return <Flame className="h-5 w-5 text-orange-400" />;
  if (type === "lake") return <Waves className="h-5 w-5 text-blue-400" />;
  return <Trees className="h-5 w-5 text-emerald-400" />;
};

export default function TriwizardTournament() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempting, setAttempting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: t } = await supabase
      .from("tournaments")
      .select("*")
      .eq("format", "triwizard")
      .eq("status", "active")
      .maybeSingle();
    setTournament(t as Tournament | null);
    if (t) {
      const { data: tr } = await supabase
        .from("triwizard_trials")
        .select("*")
        .eq("tournament_id", t.id)
        .order("order_index");
      setTrials((tr as Trial[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const attempt = async (id: string) => {
    setAttempting(id);
    const { data, error } = await supabase.rpc("attempt_trial", { p_trial: id });
    setAttempting(null);
    if (error) { toast.error(error.message); return; }
    const a = data as { success: boolean; score: number };
    toast[a.success ? "success" : "error"](
      a.success ? `Triunfo! +${a.score} pontos` : `Falhou na prova (+${a.score} pts).`
    );
  };

  if (loading) return <div className="p-8 text-foreground/60">Convocando juízes...</div>;
  if (!tournament) return <div className="p-8 text-foreground/60">Nenhum Torneio Tribruxo ativo no momento.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl">{tournament.name}</h1>
          <p className="text-sm text-foreground/60">{tournament.description}</p>
        </div>
      </div>

      <Card className="border-primary/40 bg-card/60">
        <CardHeader>
          <CardTitle className="font-heading">Premiação Final</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6">
          <Badge variant="secondary">🏆 {tournament.galeon_prize} Galeões</Badge>
          <Badge variant="secondary">✨ {tournament.xp_prize} XP</Badge>
          <Badge>Encerra em {new Date(tournament.ends_at).toLocaleDateString("pt-BR")}</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {trials.map((t) => (
          <Card key={t.id} className="border-border/50 bg-card/60">
            <CardHeader className="flex flex-row items-center gap-2">
              {trialIcon(t.trial_type)}
              <CardTitle className="font-heading text-lg">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/70">{t.description}</p>
              <div className="flex gap-2 text-xs">
                <Badge variant="outline">Dificuldade {t.difficulty}</Badge>
                <Badge variant="outline">+{t.base_reward_xp} XP</Badge>
                <Badge variant="outline">+{t.base_reward_galleons}G</Badge>
              </div>
              <Button
                className="w-full"
                disabled={attempting === t.id}
                onClick={() => attempt(t.id)}
              >
                {attempting === t.id ? "Enfrentando..." : "Enfrentar Prova"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}