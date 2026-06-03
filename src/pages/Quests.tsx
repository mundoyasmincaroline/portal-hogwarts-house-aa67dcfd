import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Map, Sparkles, Coins, Lock } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Quest = {
  id: string;
  slug: string;
  title: string;
  description: string;
  region: string;
  difficulty: number;
  min_level: number;
  xp_reward: number;
  galeon_reward: number;
  cover_url: string | null;
};

type Step = {
  id: string;
  quest_id: string;
  step_order: number;
  title: string;
  description: string;
  narrative: string;
  action_hint: string | null;
  xp_reward: number;
  galeon_reward: number;
};

type UserQuest = {
  quest_id: string;
  current_step: number;
  completed: boolean;
};

const regionColor: Record<string, string> = {
  floresta: "bg-green-900/40 border-green-500/30 text-green-300",
  beco: "bg-purple-900/40 border-purple-500/30 text-purple-300",
  hogsmeade: "bg-amber-900/40 border-amber-500/30 text-amber-300",
  castelo: "bg-blue-900/40 border-blue-500/30 text-blue-300",
};

export default function Quests() {
  const user = useAuth((s) => s.user);
  const profile = useAuth((s) => s.profile);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [steps, setSteps] = useState<Record<string, Step[]>>({});
  const [mine, setMine] = useState<Record<string, UserQuest>>({});
  const [loading, setLoading] = useState(true);
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: q } = await supabase
      .from("quests")
      .select("*")
      .eq("active", true)
      .order("difficulty");
    const list = (q || []) as Quest[];
    setQuests(list);

    if (list.length) {
      const { data: s } = await supabase
        .from("quest_steps")
        .select("*")
        .in("quest_id", list.map((x) => x.id))
        .order("step_order");
      const sm: Record<string, Step[]> = {};
      (s || []).forEach((row: any) => (sm[row.quest_id] ||= []).push(row));
      setSteps(sm);
    }
    if (user) {
      const { data: uq } = await supabase
        .from("user_quests")
        .select("quest_id,current_step,completed")
        .eq("user_id", user.id);
      const m: Record<string, UserQuest> = {};
      (uq || []).forEach((r: any) => (m[r.quest_id] = r));
      setMine(m);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const start = async (id: string) => {
    const { error } = await supabase.rpc("start_quest", { p_quest_id: id });
    if (error) {
      const m = error.message.toLowerCase();
      toast.error(
        m.includes("rls") || m.includes("permission") ? "Você não tem permissão para iniciar esta quest."
        : m.includes("duplicate") || m.includes("already") ? "Esta quest já foi iniciada."
        : m.includes("level") ? "Seu nível ainda não é suficiente para esta quest."
        : "Não foi possível iniciar agora. Tente novamente."
      );
    } else {
      toast.success("Aventura iniciada! 🗺️");
      load();
    }
  };

  const advance = async (id: string) => {
    const { data, error } = await supabase.rpc("complete_quest_step", { p_quest_id: id });
    if (error) {
      const m = error.message.toLowerCase();
      toast.error(
        m.includes("rls") || m.includes("permission") ? "Você não tem permissão para esta etapa."
        : m.includes("not found") ? "Etapa não encontrada."
        : "Não foi possível concluir a etapa. Tente novamente."
      );
    } else {
      toast.success((data as any)?.completed ? "🏆 Quest concluída!" : "Etapa concluída!");
      load();
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      <header className="text-center space-y-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-primary flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <Map className="w-7 h-7 sm:w-9 sm:h-9" /> Aventuras & Quests
          </h1>
          <p className="text-muted-foreground mt-2">
            Embarque em missões pela Floresta Proibida, Beco Diagonal, Hogsmeade e além.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button 
            variant={filterRegion === "all" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilterRegion("all")}
            className="rounded-full"
          >
            Todos
          </Button>
          {Object.keys(regionColor).map(r => (
            <Button 
              key={r}
              variant={filterRegion === r ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFilterRegion(r)}
              className="rounded-full capitalize"
            >
              {r}
            </Button>
          ))}
          <Button 
            variant={showCompleted ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowCompleted(!showCompleted)}
            className="rounded-full ml-4"
          >
            {showCompleted ? "Ocultar Concluídas" : "Ver Concluídas"}
          </Button>
        </div>
      </header>

      {loading && <p className="text-center text-muted-foreground">Carregando...</p>}

      {quests
        .filter(q => filterRegion === "all" || q.region === filterRegion)
        .filter(q => showCompleted || !mine[q.id]?.completed)
        .map((q) => {
        const myProg = mine[q.id];
        const qSteps = steps[q.id] || [];
        const userLevel = (profile as any)?.level ?? 0;
        const locked = !user || userLevel < (q.min_level || 0);
        const total = qSteps.length || 1;
        const progress = myProg ? Math.min(100, ((myProg.completed ? total : myProg.current_step - 1) / total) * 100) : 0;
        const currentStep = qSteps.find((s) => s.step_order === (myProg?.current_step || 1));

        return (
          <Card key={q.id} className={`p-6 border-primary/30 space-y-4 transition-all hover:border-primary/50 ${locked ? "opacity-60 grayscale-[0.5]" : "bg-card/60 shadow-lg"}`}>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-heading text-2xl text-primary">{q.title}</h2>
                  <Badge variant="outline" className={regionColor[q.region] || ""}>
                    {q.region}
                  </Badge>
                  <Badge variant="outline">Dificuldade {q.difficulty}/5</Badge>
                </div>
                <p className="text-muted-foreground mt-1">{q.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1 text-primary">
                    <Sparkles className="w-4 h-4" /> +{q.xp_reward} XP
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Coins className="w-4 h-4" /> +{q.galeon_reward} Galeões
                  </span>
                  <span className="text-muted-foreground">Nível mínimo: {q.min_level}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {!myProg && (
                  <Button
                    onClick={() => start(q.id)}
                    disabled={locked}
                    title={locked && user ? `Requer nível ${q.min_level}` : undefined}
                  >
                    {!user ? (
                      <><Lock className="w-4 h-4 mr-1" /> Entre</>
                    ) : locked ? (
                      <><Lock className="w-4 h-4 mr-1" /> Nível {q.min_level}</>
                    ) : (
                      "Iniciar"
                    )}
                  </Button>
                )}
                {myProg?.completed && (
                  <Badge className="bg-primary text-primary-foreground">Concluída <EmojiIcon e="✨" /></Badge>
                )}
              </div>
            </div>

            {myProg && (
              <div className="space-y-3 border-t border-primary/10 pt-3">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">
                  {myProg.completed ? `Etapas: ${total}/${total}` : `Etapa ${myProg.current_step} de ${total}`}
                </p>
                {!myProg.completed && currentStep && (
                  <div className="bg-background/40 rounded p-3 space-y-2">
                    <p className="font-heading text-primary">{currentStep.title}</p>
                    <p className="text-sm italic text-muted-foreground">{currentStep.narrative}</p>
                    <p className="text-sm">{currentStep.description}</p>
                    {currentStep.action_hint && (
                      <p className="text-xs text-primary/80">💡 {currentStep.action_hint}</p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => advance(q.id)}>
                        Concluir etapa (+{currentStep.xp_reward} XP)
                      </Button>
                      {currentStep.description.toLowerCase().includes("poção") && (
                        <Button size="sm" variant="outline" onClick={() => window.location.href='/dashboard/potions'}>
                          <EmojiIcon e="🧪" /> Laboratório
                        </Button>
                      )}
                      {currentStep.description.toLowerCase().includes("estufa") && (
                        <Button size="sm" variant="outline" onClick={() => window.location.href='/dashboard/greenhouse'}>
                          <EmojiIcon e="🌿" /> Estufa
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}