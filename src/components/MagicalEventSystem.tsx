import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Timer, Sparkles, Trophy, X, ChevronRight, Coins, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// ─── Configurações dos Eventos ───────────────────────────────────────────
const EVENT_SCHEDULE = [
  { id: "morning", name: "O Despertar da Fênix", start: "09:00", end: "09:30", type: "history", xp: 100, galeons: 10 },
  { id: "afternoon", name: "O Mistério de Gringotts", start: "15:00", end: "15:30", type: "spells", xp: 150, galeons: 25 },
  { id: "night", name: "O Enigma da Seção Reservada", start: "21:00", end: "21:30", type: "dark_arts", xp: 200, galeons: 50 },
];

const RIDDLES = {
  history: [
    { q: "Qual casa preza pela coragem?", a: "grifinoria" },
    { q: "Quem fundou a Sonserina?", a: "salazar" },
  ],
  spells: [
    { q: "Feitiço para desarmar?", a: "expelliarmus" },
    { q: "Feitiço para flutuar?", a: "wingardium leviosa" },
  ],
  dark_arts: [
    { q: "Quem matou Dumbledore?", a: "snape" },
    { q: "O que é uma Horcrux?", a: "alma" },
  ]
};

// ─── Componente Principal ──────────────────────────────────────────────────
export default function MagicalEventSystem() {
  const { user, profile, fetchProfile } = useAuth();
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [nextEventIn, setNextEventIn] = useState<string>("");
  const [showInvite, setShowInvite] = useState(false);
  const [participating, setParticipating] = useState(false);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Monitorar o relógio
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', hour12: false });
      
      // Checar se há um evento agora
      const current = EVENT_SCHEDULE.find(e => timeStr >= e.start && timeStr <= e.end);
      
      if (current && !activeEvent) {
        checkIfAlreadyDone(current);
      } else if (!current && activeEvent) {
        setActiveEvent(null);
        setShowInvite(false);
        setParticipating(false);
      }

      // Calcular próximo evento
      updateCountdown();
    }, 1000);

    return () => clearInterval(timer);
  }, [activeEvent, user]);

  const checkIfAlreadyDone = async (event: any) => {
    if (!user) return;
    const eventId = `event_${new Date().toISOString().split('T')[0]}_${event.id}`;
    const { data } = await supabase
      .from("user_challenges")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_id", eventId)
      .maybeSingle();

    if (!data) {
      setActiveEvent(event);
      setShowInvite(true);
    }
  };

  const updateCountdown = () => {
    const now = new Date();
    let next: any = null;
    
    for (const event of EVENT_SCHEDULE) {
      const [h, m] = event.start.split(":").map(Number);
      const eventDate = new Date();
      eventDate.setHours(h, m, 0, 0);
      
      if (eventDate > now) {
        next = eventDate;
        break;
      }
    }

    if (!next) { // Se todos passaram, o próximo é o primeiro de amanhã
      const [h, m] = EVENT_SCHEDULE[0].start.split(":").map(Number);
      next = new Date();
      next.setDate(next.getDate() + 1);
      next.setHours(h, m, 0, 0);
    }

    const diff = next.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setNextEventIn(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
  };

  const handleStart = () => {
    setShowInvite(false);
    setParticipating(true);
    setStep(0);
    setAnswer("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const riddles = RIDDLES[activeEvent.type as keyof typeof RIDDLES];
    const correct = riddles[step].a.toLowerCase();
    
    if (answer.toLowerCase().includes(correct)) {
      if (step + 1 < riddles.length) {
        setStep(step + 1);
        setAnswer("");
        toast.success("Correto! Próximo enigma...");
      } else {
        finishEvent();
      }
    } else {
      toast.error("Resposta incorreta! Tente novamente.");
    }
  };

  const finishEvent = async () => {
    if (!user || !profile || !activeEvent) return;
    setLoading(true);
    try {
      const eventId = `event_${new Date().toISOString().split('T')[0]}_${activeEvent.id}`;
      
      // Calcular Multiplicador VIP
      let multiplier = 1.0;
      if (profile.vip_plan === "founder") multiplier = 2.0;
      else if (profile.vip_plan === "vip") multiplier = 1.5;
      else if (profile.vip_plan === "premium") multiplier = 1.25;

      const finalXP = Math.round(activeEvent.xp * multiplier);
      const finalGaleons = Math.round(activeEvent.galeons * multiplier);

      // Salvar participação
      const { error: err } = await supabase.from("user_challenges").insert({
        user_id: user.id,
        challenge_id: eventId,
        completed: true,
        status: 'approved',
        completed_at: new Date().toISOString()
      } as never);
      if (err) throw err;

      // Recompensas
      await supabase.rpc("award_xp_action", { _action: "global_event", _user_id: user.id, _xp: finalXP });
      
      const newGaleons = (profile.galeons || 0) + finalGaleons;
      await supabase.from("profiles").update({ galeons: newGaleons } as never).eq("user_id", user.id);
      
      await fetchProfile(user.id);
      setHasCompleted(true);
      toast.success(`🔮 Desafio Concluído! +${finalXP} XP e +${finalGaleons}🪙 Galeões!`);
    } catch (e: any) {
      toast.error("Erro ao salvar progresso: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) return null;

  return (
    <>
      {/* ── Mini Countdown ── */}
      {!activeEvent && (
        <div className="fixed top-4 right-20 z-[40] hidden lg:flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/20 text-[10px] font-heading text-primary/80">
          <Timer size={12} className="animate-pulse" />
          <span>PRÓXIMO EVENTO EM: {nextEventIn}</span>
        </div>
      )}

      {/* ── Convite do Evento ── */}
      {showInvite && activeEvent && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[100] glass p-6 border-2 border-primary/40 shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <Sparkles size={24} className="animate-spin-slow" />
                </div>
                <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <h3 className="text-xl font-heading text-white mb-2">{activeEvent.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">Um evento global começou! Aceite o desafio agora para ganhar recompensas exclusivas.</p>
              
              <div className="flex gap-3 mb-6">
                <div className="flex-1 bg-secondary/50 p-2 rounded-xl text-center border border-primary/10">
                  <p className="text-[10px] text-muted-foreground uppercase">XP</p>
                  <p className="text-lg font-heading text-primary">+{activeEvent.xp}</p>
                </div>
                <div className="flex-1 bg-secondary/50 p-2 rounded-xl text-center border border-primary/10">
                  <p className="text-[10px] text-muted-foreground uppercase">Galeões</p>
                  <p className="text-lg font-heading text-yellow-500">+{activeEvent.galeons}</p>
                </div>
              </div>

              <Button variant="magical" className="w-full py-6 rounded-2xl group" onClick={handleStart}>
                Participar Agora <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              {profile.vip_plan === null && (
                <p className="text-[10px] text-center mt-4 text-muted-foreground italic">
                  Pssst! Membros VIP ganham até <span className="text-yellow-500">2x mais</span> recompensas.
                </p>
              )}
            </div>
        </div>
      )}

      {/* ── Modal do Desafio ── */}
      {participating && activeEvent && !hasCompleted && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass w-full max-w-lg rounded-[2.5rem] p-8 border border-primary/30 relative animate-in zoom-in-95 duration-300">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-heading text-primary uppercase tracking-widest mb-4">
                  <Zap size={10} /> Desafio Global Ativo
                </div>
                <h2 className="text-3xl font-heading text-white mb-2">{activeEvent.name}</h2>
                <div className="flex justify-center gap-1 mb-6">
                  {RIDDLES[activeEvent.type as keyof typeof RIDDLES].map((_, i) => (
                    <div key={i} className={`h-1.5 w-12 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-secondary"}`} />
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-secondary/30 p-6 rounded-2xl border border-border/50 text-center min-h-[120px] flex items-center justify-center">
                  <p className="text-xl font-serif italic text-primary-foreground">
                    "{RIDDLES[activeEvent.type as keyof typeof RIDDLES][step].q}"
                  </p>
                </div>

                <input 
                  autoFocus
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Sua resposta mágica..."
                  className="w-full bg-black/40 border-2 border-primary/20 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-primary/50 transition-colors text-center"
                />

                <Button type="submit" variant="magical" className="w-full py-7 rounded-2xl text-lg" disabled={!answer.trim() || loading}>
                  {loading ? "Invocando Recompensas..." : "Confirmar Resposta ✨"}
                </Button>
              </form>
              
              <button 
                onClick={() => setParticipating(false)}
                className="mt-6 w-full text-center text-muted-foreground hover:text-white transition-colors text-xs"
              >
                Desistir do desafio (você poderá tentar novamente depois)
              </button>
            </div>
        </div>
      )}

      {/* ── Sucesso ── */}
      {hasCompleted && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="text-center space-y-6 animate-in zoom-in-90 duration-500">
              <div className="w-32 h-32 mx-auto bg-primary/20 rounded-full flex items-center justify-center text-primary border-2 border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)]">
                <Trophy size={64} className="animate-bounce" />
              </div>
              <h2 className="text-4xl font-heading text-gold-gradient">VICTÓRIA MÁGICA!</h2>
              <p className="text-muted-foreground">Você provou seu valor no evento global.</p>
              
              <div className="flex gap-4 justify-center">
                <div className="glass px-6 py-3 rounded-2xl border border-primary/20">
                  <p className="text-[10px] text-muted-foreground uppercase">XP Adquirido</p>
                  <p className="text-2xl font-heading text-primary">+{Math.round(activeEvent.xp * (profile.vip_plan === 'founder' ? 2 : profile.vip_plan === 'vip' ? 1.5 : profile.vip_plan === 'premium' ? 1.25 : 1))}</p>
                </div>
                <div className="glass px-6 py-3 rounded-2xl border border-yellow-500/20">
                  <p className="text-[10px] text-muted-foreground uppercase">Galeões</p>
                  <p className="text-2xl font-heading text-yellow-500">+{Math.round(activeEvent.galeons * (profile.vip_plan === 'founder' ? 2 : profile.vip_plan === 'vip' ? 1.5 : profile.vip_plan === 'premium' ? 1.25 : 1))}</p>
                </div>
              </div>

              <Button variant="magical" size="lg" className="px-12 py-8 rounded-2xl" onClick={() => { setHasCompleted(false); setParticipating(false); setActiveEvent(null); }}>
                Continuar Jornada
              </Button>
            </div>
        </div>
      )}
    </>
  );
}
