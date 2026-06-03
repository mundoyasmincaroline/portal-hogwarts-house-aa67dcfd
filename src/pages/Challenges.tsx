import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import EnigmaModal from "@/components/EnigmaModal";
import MagicalEmoji from "@/components/shared/MagicalEmoji";

import EmojiIcon from "@/components/shared/EmojiIcon";
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
    // Não trazemos correct_answer ao cliente — validação acontece via RPC validate_enigma_answer
    const { data: ch } = await supabase
      .from("challenges")
      .select("id,title,description,xp_reward,type,active,question,action_type,goal,created_at,created_by")
      .eq("active", true)
      .order("created_at", { ascending: false });
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
      const pct = userProgress[c.id] ?? 0;
      if (pct > 0) {
        toast.info(`⚙️ Progresso atual: ${pct}%. Continue agindo no portal para concluir!`);
      } else {
        toast.info("⚙️ Missão automática — execute a ação no portal e o sistema registra seu progresso em tempo real.");
      }
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

    const { data, error } = await (supabase.rpc as any)("validate_enigma_answer", {
      _challenge_id: c.id,
      _answer: answerInput,
    });
    if (error) { toast.error("Erro ao validar resposta: " + error.message); return; }
    const result = data as { success: boolean; message?: string; xp?: number };
    if (!result?.success) {
      toast.error(result?.message || "Resposta incorreta! A magia falhou.");
      setActiveEnigma(null);
      return;
    }
    // Pontos da casa (mantém side-effect que a RPC não cobre)
    await supabase.from("house_points").insert({ house: profile.house, points: c.xp_reward, reason: `Desafio: ${c.title}`, awarded_by: user.id } as never);
    await fetchProfile(user.id);
    toast.success(`Resposta correta! +${result.xp ?? c.xp_reward} XP! ⚡ Pontos para ${profile.house}!`);
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
      <div key={c.id} className={`relative glass rounded-xl p-5 transition-transform hover:scale-[1.01] overflow-hidden ${isSpecial ? "ring-1 ring-primary/20" : ""} ${disabled ? "opacity-60" : ""}`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-5 pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading text-foreground">{c.title}</h3>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-heading bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.2)] flex items-center gap-1.5">
              <MagicalEmoji emoji="⚡" size="xs" className="scale-75" />
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
            {userProgress[c.id] > 0 ? (
              <>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso</span>
                  <span>{userProgress[c.id]}%</span>
                </div>
                <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress[c.id]}%` }}
                    className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/80 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.4)]" 
                  />
                </div>
              </>
            ) : (
              <p className="text-[10px] text-muted-foreground/70 italic text-center"><EmojiIcon e="⚙️" /> Avaliação automática — concluído ao realizar a ação no portal.</p>
            )}
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
    <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-0">
      <div className="glass rounded-2xl p-5 sm:p-6 text-center">
        <h1 className="font-heading text-2xl text-gold-gradient mb-2">Desafios & Missões</h1>
        <p className="text-muted-foreground text-sm">Complete desafios para ganhar XP e pontos para sua casa</p>
      </div>

      {loading && <p className="text-center text-muted-foreground text-sm py-6">Carregando desafios...</p>}

      {!loading && challenges.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3"><EmojiIcon e="🪄" /></div>
          <p className="text-muted-foreground text-sm">Nenhum desafio ativo no momento. Volte em breve!</p>
        </div>
      )}

      {daily.length > 0 && (
        <div>
          <h2 className="font-heading text-xl text-primary mb-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
              <EmojiIcon e="📅" />
            </span> 
            Missões Diárias
          </h2>
          <div className="grid md:grid-cols-2 gap-4">{daily.map((c) => renderCard(c))}</div>
        </div>
      )}

      {weekly.length > 0 && (
        <div>
          <h2 className="font-heading text-xl text-primary mb-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
              <EmojiIcon e="🏆" />
            </span> 
            Desafios Semanais
          </h2>
          <div className="grid md:grid-cols-2 gap-4">{weekly.map((c) => renderCard(c, true))}</div>
        </div>
      )}

      {special.length > 0 && (
        <div>
          <h2 className="font-heading text-lg text-foreground mb-3"><EmojiIcon e="✨" /> Eventos Especiais</h2>
          <div className="grid md:grid-cols-2 gap-4">{special.map((c) => renderCard(c, true))}</div>
        </div>
      )}

      {enigmas.length > 0 && (
        <div>
          <h2 className="font-heading text-lg text-foreground mb-3"><EmojiIcon e="🦉" /> Enigmas de Hogwarts</h2>
          <p className="text-xs text-muted-foreground mb-3 -mt-1">Responda corretamente para ganhar XP instantâneo!</p>
          <div className="grid md:grid-cols-2 gap-4">{enigmas.map((c) => renderCard(c, true))}</div>
        </div>
      )}

      {social.length > 0 && (
        <div>
          <h2 className="font-heading text-lg text-foreground mb-3"><EmojiIcon e="📱" /> Embaixador de Hogwarts (Redes Sociais)</h2>
          <div className="grid md:grid-cols-2 gap-4">{social.map((c) => renderCard(c, true))}</div>
        </div>
      )}

      {activeSocial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="glass max-w-md w-full rounded-2xl p-6 relative border border-primary/20 animate-scale-in">
            <button onClick={() => setActiveSocial(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><EmojiIcon e="✕" /></button>
            <div className="text-center mb-6">
              <span className="text-4xl"><EmojiIcon e="🔗" /></span>
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
