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
  const [answerInput, setAnswerInput] = useState("");
  const [submittingProof, setSubmittingProof] = useState<string | null>(null);
  const [proofInput, setProofInput] = useState("");

  const load = useCallback(async () => {
    const { data: ch } = await supabase.from("challenges").select("*").eq("active", true).order("created_at", { ascending: false });
    setChallenges(ch || []);
    if (user) {
      const { data: uc } = await supabase
        .from("user_challenges")
        .select("challenge_id, status")
        .eq("user_id", user.id);
      
      const comp = new Set<string>();
      const pend = new Set<string>();
      (uc || []).forEach(r => {
        if (r.status === 'approved' || r.status === 'completed') comp.add(r.challenge_id);
        if (r.status === 'pending') pend.add(r.challenge_id);
      });
      setCompletedIds(comp);
      setPendingIds(pend);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const completeChallenge = async (c: Challenge) => {
    if (!user || !profile) return;
    if (completedIds.has(c.id)) { toast.info("Você já completou este desafio!"); return; }

    if (c.question) {
      if (answeringId !== c.id) {
        setAnsweringId(c.id);
        setAnswerInput("");
        return;
      }
      if (answerInput.trim().toLowerCase() !== c.correct_answer?.trim().toLowerCase()) {
        toast.error("Resposta incorreta! Tente novamente.");
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

      toast.success(`+${c.xp_reward} XP! ⚡ Pontos para ${profile.house}!`);
      setCompletedIds((s) => new Set([...s, c.id]));
      setAnsweringId(null);
    } else {
      // Normal task needs proof
      if (submittingProof !== c.id) {
        setSubmittingProof(c.id);
        setProofInput("");
        return;
      }
      if (!proofInput.trim()) {
        toast.error("Por favor, forneça uma comprovação (texto ou link).");
        return;
      }

      const { error: ucErr } = await supabase
        .from("user_challenges")
        .insert({ user_id: user.id, challenge_id: c.id, completed: false, status: 'pending', proof: proofInput, completed_at: new Date().toISOString() } as never);
      if (ucErr) { toast.error("Erro: " + ucErr.message); return; }

      toast.success("Comprovação enviada! XP será creditado após aprovação da moderação. 🦉");
      setPendingIds((s) => new Set([...s, c.id]));
      setSubmittingProof(null);
    }
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
        
        {answeringId === c.id && !done && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-heading text-primary">{c.question}</p>
            <input 
              type="text" 
              className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none border border-border"
              placeholder="Sua resposta..."
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="w-1/2 text-xs" onClick={() => setAnsweringId(null)}>Cancelar</Button>
              <Button variant="magical" size="sm" className="w-1/2 text-xs" onClick={() => completeChallenge(c)}>Enviar</Button>
            </div>
          </div>
        )}

        {submittingProof === c.id && !done && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-heading text-primary">Comprovação da Tarefa</p>
            <textarea 
              className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none border border-border min-h-[60px]"
              placeholder="Cole o link ou digite como você completou..."
              value={proofInput}
              onChange={(e) => setProofInput(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="w-1/2 text-xs" onClick={() => setSubmittingProof(null)}>Cancelar</Button>
              <Button variant="magical" size="sm" className="w-1/2 text-xs" onClick={() => completeChallenge(c)}>Enviar para Análise</Button>
            </div>
          </div>
        )}

        {answeringId !== c.id && submittingProof !== c.id && (
          <Button
            variant="magical"
            size="sm"
            className="font-heading text-xs w-full"
            disabled={done || pendingIds.has(c.id)}
            onClick={() => completeChallenge(c)}
          >
            {done ? "✅ Concluído" : pendingIds.has(c.id) ? "⏳ Em Análise" : (c.question ? "Responder Charada 🦉" : "Enviar Comprovação ⚡")}
          </Button>
        )}
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
