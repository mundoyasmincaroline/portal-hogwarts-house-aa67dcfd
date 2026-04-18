import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import EnigmaModal from "@/components/EnigmaModal";

interface Challenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  type: string;
  active: boolean;
  question?: string;
  correct_answer?: string;
}

export default function Challenges() {
  const { user, profile, fetchProfile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [activeEnigma, setActiveEnigma] = useState<Challenge | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const { data: ch } = await supabase.from("challenges").select("*").eq("active", true).order("created_at", { ascending: false });
    setChallenges(ch || []);
    if (user) {
      const { data: uc } = await supabase
        .from("user_challenges")
        .select("challenge_id, status, progress")
        .eq("user_id", user.id);
      
        const comp = new Set<string>();
        const pend = new Set<string>();
        const prog: Record<string, number> = {};
        (uc || []).forEach(r => {
          if (r.status === 'approved' || r.status === 'completed') comp.add(r.challenge_id);
          if (r.status === 'pending') pend.add(r.challenge_id);
          prog[r.challenge_id] = r.progress || 0;
        });
        setCompletedIds(comp);
        setPendingIds(pend);
        setUserProgress(prog);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const openChallenge = (c: Challenge) => {
    if (!user || !profile) return;
    if (completedIds.has(c.id)) { toast.info("Você já completou este desafio!"); return; }

    if (c.question) {
      setActiveEnigma(c);
    } else {
      toast.info("✨ Esta missão é concluída automaticamente! Realize a ação descrita e o sistema irá detectar e recompensar você.");
    }
  };

  const handleEnigmaAnswer = async (answerInput: string) => {
    const c = activeEnigma;
    if (!c || !user || !profile) return;

    if (answerInput.trim().toLowerCase() !== c.correct_answer?.trim().toLowerCase()) {
      toast.error("Resposta incorreta! A magia falhou. Aguarde o cooldown para tentar novamente.");
      setActiveEnigma(null);
      return;
    }

    // Quiz is auto-approved
    const { error: ucErr } = await supabase
      .from("user_challenges")
      .insert({ user_id: user.id, challenge_id: c.id, completed: true, status: 'approved', completed_at: new Date().toISOString() } as never);
    if (ucErr) { toast.error("Erro: " + ucErr.message); return; }

    await supabase.from("profiles").update({ xp: profile.xp + c.xp_reward } as never).eq("user_id", user.id);
    await supabase.from("house_points").insert({ house: profile.house, points: c.xp_reward, reason: `Desafio: ${c.title}`, awarded_by: user.id } as never);
    await fetchProfile(user.id);

    toast.success(`Resposta correta! +${c.xp_reward} XP! ⚡ Pontos para ${profile.house}!`);
    setCompletedIds((s) => new Set([...s, c.id]));
    setActiveEnigma(null);
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
        
        {c.question ? (
          <div className="mb-4 space-y-1">
            <p className="text-xs text-muted-foreground text-center italic">Enigma Mágico disponível</p>
          </div>
        ) : (
          <div className="mb-4 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso</span>
              <span>{userProgress[c.id] || 0}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${userProgress[c.id] || 0}%` }} />
            </div>
          </div>
        )}

        <Button
          variant="magical"
          size="sm"
          className="font-heading text-xs w-full"
          disabled={done}
          onClick={() => completeChallenge(c)}
        >
          {done ? "✅ Concluído" : c.question ? "Responder Charada 🦉" : "Concluir Missão ⚡"}
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

      {activeEnigma && (
        <EnigmaModal 
          isOpen={!!activeEnigma} 
          onClose={() => setActiveEnigma(null)} 
          question={activeEnigma.question || ""} 
          onAnswer={handleEnigmaAnswer} 
        />
      )}
    </div>
  );
}
