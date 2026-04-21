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
  const [activeSocial, setActiveSocial] = useState<Challenge | null>(null);
  const [socialLink, setSocialLink] = useState("");
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
    if (completedIds.has(c.id) || pendingIds.has(c.id)) { toast.info("Você já completou ou enviou este desafio!"); return; }

    if (c.question) {
      setActiveEnigma(c);
    } else if (c.type === 'social') {
      setActiveSocial(c);
      setSocialLink("");
    } else {
      toast.info("✨ Esta missão é concluída automaticamente! Realize a ação descrita e o sistema irá detectar e recompensar você.");
    }
  };

  const handleSocialSubmit = async () => {
    const c = activeSocial;
    if (!c || !user || !socialLink.trim()) return;

    if (!socialLink.includes("http")) {
      toast.error("Insira um link válido (com http/https).");
      return;
    }

    const { error } = await supabase
      .from("user_challenges")
      .insert({ 
        user_id: user.id, 
        challenge_id: c.id, 
        status: 'pending',
        proof_url: socialLink 
      } as never);

    if (error) { toast.error("Erro ao enviar: " + error.message); return; }

    toast.success("Link enviado! Aguarde a avaliação da administração mágica.");
    setPendingIds((s) => new Set([...s, c.id]));
    setActiveSocial(null);
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

    await supabase.rpc("award_xp_action", { _action: "challenge", _user_id: user.id, _xp: c.xp_reward });
    await supabase.from("house_points").insert({ house: profile.house, points: c.xp_reward, reason: `Desafio: ${c.title}`, awarded_by: user.id } as never);
    await fetchProfile(user.id);

    toast.success(`Resposta correta! +${c.xp_reward} XP! ⚡ Pontos para ${profile.house}!`);
    setCompletedIds((s) => new Set([...s, c.id]));
    setActiveEnigma(null);
  };

  const daily   = challenges.filter((c) => c.type === "daily");
  const weekly  = challenges.filter((c) => c.type === "weekly");
  const special = challenges.filter((c) => c.type === "special");
  const social  = challenges.filter((c) => c.type === "social");
  const enigmas = challenges.filter((c) => c.type === "enigma");

  const renderCard = (c: Challenge, isSpecial = false) => {
    const done = completedIds.has(c.id);
    const pending = pendingIds.has(c.id);
    const disabled = done || pending;
    
    return (
      <div key={c.id} className={`glass rounded-xl p-5 transition-transform hover:scale-[1.01] ${isSpecial ? "ring-1 ring-primary/20" : ""} ${disabled ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading text-foreground">{c.title}</h3>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-heading bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.2)] flex items-center gap-1.5">
              <img src="/medalha_ouro.png" className="w-3 h-3 object-contain" alt="xp" />
              {c.xp_reward} XP
            </span>
          </div>
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
          disabled={disabled}
          onClick={() => openChallenge(c)}
        >
          {done ? "✅ Concluído" : pending ? "⏳ Em Avaliação" : c.type === 'social' ? "Enviar Link 🔗" : c.question ? "Responder Charada 🦉" : "Automática ⚙️"}
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

      {enigmas.length > 0 && (
        <div>
          <h2 className="font-heading text-lg text-foreground mb-3">🦉 Enigmas de Hogwarts</h2>
          <p className="text-xs text-muted-foreground mb-3 -mt-1">Responda corretamente para ganhar XP instantâneo!</p>
          <div className="grid md:grid-cols-2 gap-4">{enigmas.map((c) => renderCard(c, true))}</div>
        </div>
      )}

      {social.length > 0 && (
        <div>
          <h2 className="font-heading text-lg text-foreground mb-3">📱 Embaixador de Hogwarts (Redes Sociais)</h2>
          <div className="grid md:grid-cols-2 gap-4">{social.map((c) => renderCard(c, true))}</div>
        </div>
      )}

      {activeSocial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="glass max-w-md w-full rounded-2xl p-6 relative border border-primary/20 animate-scale-in">
            <button onClick={() => setActiveSocial(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">✕</button>
            <div className="text-center mb-6">
              <span className="text-4xl">🔗</span>
              <h2 className="font-heading text-2xl text-foreground mt-2">Comprovar Missão</h2>
              <p className="text-sm text-muted-foreground mt-1">Cole abaixo o link público da sua postagem.</p>
            </div>
            <div className="space-y-4">
              <input
                type="url"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-sm"
                placeholder="https://tiktok.com/@seu_perfil/video/123"
              />
              <Button onClick={handleSocialSubmit} variant="magical" className="w-full font-heading" disabled={!socialLink.trim()}>
                Enviar para o Ministério Mágico
              </Button>
            </div>
          </div>
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
