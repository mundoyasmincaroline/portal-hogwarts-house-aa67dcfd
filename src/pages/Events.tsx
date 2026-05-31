import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Timer, CheckCircle2, Lock, Clock, Trophy, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import MagicalEmoji from "@/components/shared/MagicalEmoji";

type MagicalEvent = {
  id: string;
  name: string;
  start: string;
  end: string;
  type: string;
  xp: number;
  galeons: number;
  audience: string;
  description: string;
  riddles?: { q: string; a: string }[];
  isSpecial?: boolean;
};
const getEventsForToday = (_celebrations: any[]): MagicalEvent[] => [];

export default function Events() {
  const { user, profile } = useAuth();
  const [dailyEvents, setDailyEvents] = useState<MagicalEvent[]>([]);
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1;
        
        // Buscar aniversários de OCs no banco
        const { data: ocBirthdays } = await supabase
            .from("characters")
            .select("full_name, birthday")
            .filter("birthday", "not.is", null);

        const activeCelebrations = (ocBirthdays || []).filter(c => {
            const d = new Date((c as any).birthday);
            return d.getDate() === day && (d.getMonth() + 1) === month;
        }).map(c => ({ name: c.full_name, type: "oc_birthday" }));

        const events = getEventsForToday(activeCelebrations);
        
        // Plot Twist: Checar aniversário do usuário para a lista
        if (profile?.birth_date) {
            const bday = new Date(profile.birth_date);
            if (today.getDate() === bday.getDate() && today.getMonth() === bday.getMonth()) {
                events.push({
                    id: "birthday",
                    name: "🎈 Sua Festa de Aniversário!",
                    start: "00:00",
                    end: "23:59",
                    type: "spells",
                    xp: 1000,
                    galeons: 200,
                    audience: "all",
                    description: `Parabéns pelo seu dia, ${profile.full_name}! Hogwarts preparou um presente especial para você.`,
                    riddles: [{ q: "Você está pronto para o seu presente? (Diga: sim!)", a: "sim" }],
                    isSpecial: true
                });
            }
        }
        setDailyEvents(events);
        if (user) loadHistory();
    };

    loadEvents();
  }, [user, profile?.id]);

  const loadHistory = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from("user_challenges")
      .select("challenge_id")
      .eq("user_id", user?.id)
      .like("challenge_id", `event_${today}%`)
      .eq("completed", true);
    
    if (data) {
      setCompletedToday(data.map(d => d.challenge_id.split('_').pop() || ""));
    }
    setLoading(false);
  };

  const getEventStatus = (event: MagicalEvent) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', hour12: false });
    
    if (completedToday.includes(event.id)) return "completed";
    if (timeStr >= event.start && timeStr <= event.end) return "active";
    if (timeStr < event.start) return "upcoming";
    return "past";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 pb-20 px-2 sm:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br from-indigo-950 via-background to-black border border-primary/20 p-6 sm:p-12 text-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1510137600163-2729bc6959a6?q=80&w=2000')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1">
            Programação Diária
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-heading text-gold-gradient">Eventos Mágicos</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Participe dos desafios globais em horários específicos para ganhar recompensas épicas e fortalecer seu legado em Hogwarts.
          </p>
        </div>
      </div>

      {/* Grid de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dailyEvents.map((event) => {
          const status = getEventStatus(event);
          const isCompleted = status === "completed";
          const isActive = status === "active";
          const isUpcoming = status === "upcoming";
          const isPast = status === "past" && !isCompleted;

          return (
            <div 
              key={event.id}
              className={`relative group rounded-2xl sm:rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${
                isActive ? "border-primary shadow-[0_0_30px_hsl(var(--primary)/0.3)] bg-primary/5 -translate-y-2" :
                isCompleted ? "border-green-500/30 bg-green-500/5 opacity-80" :
                isPast ? "border-muted/20 bg-secondary/10 opacity-60 grayscale" :
                "border-border/50 bg-card/50"
              }`}
            >
              {/* Overlay de Status */}
              <div className="p-8 space-y-6 flex flex-col h-full">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${isActive ? "bg-primary text-primary-foreground animate-pulse" : "bg-secondary text-muted-foreground"}`}>
                    {isCompleted ? <CheckCircle2 size={24} className="text-green-500" /> : <Timer size={24} />}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground">Horário</p>
                    <p className={`text-lg font-heading ${isActive ? "text-primary" : "text-foreground"}`}>{event.start}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-heading text-white mb-2">{event.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <MagicalEmoji emoji={event.audience === "all" ? "👥" : event.audience === "canons" ? "📜" : "🎭"} size="xs" />
                    {isActive && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-[10px] text-primary uppercase font-bold animate-pulse">
                            <Zap size={10} /> Ativo Agora
                        </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {event.description}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <div className="flex-1 bg-black/40 p-2 rounded-xl text-center border border-primary/10">
                    <p className="text-[10px] text-muted-foreground uppercase">XP</p>
                    <p className="text-base font-heading text-primary">+{event.xp}</p>
                  </div>
                  <div className="flex-1 bg-black/40 p-2 rounded-xl text-center border border-yellow-500/10">
                    <p className="text-[10px] text-muted-foreground uppercase">🪙</p>
                    <p className="text-base font-heading text-yellow-500">+{event.galeons}</p>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  {isCompleted ? (
                    <div className="w-full py-3 bg-green-500/20 text-green-500 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 border border-green-500/30">
                      <CheckCircle2 size={16} /> Concluído
                    </div>
                  ) : isActive ? (
                    <Button variant="magical" className="w-full py-6 rounded-xl group">
                      Participar do Evento <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : isUpcoming ? (
                    <div className="w-full py-3 bg-secondary/50 text-muted-foreground rounded-xl text-center text-sm font-heading flex items-center justify-center gap-2 border border-border/50">
                      <Clock size={16} /> Aguardando Horário
                    </div>
                  ) : (
                    <div className="w-full py-3 bg-secondary/20 text-muted-foreground/50 rounded-xl text-center text-sm font-heading flex items-center justify-center gap-2 border border-transparent">
                      <Lock size={16} /> Evento Encerrado
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Adicional */}
      <div className="glass rounded-[2rem] p-8 border border-primary/20 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0">
          <Trophy size={40} />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
            <h3 className="text-xl font-heading text-white">Recompensas Acumulativas</h3>
            <p className="text-muted-foreground text-sm">
                Ao participar de todos os eventos do dia, você aumenta suas chances de desbloquear conquistas ocultas no seu perfil. Bruxo VIPs recebem bônus de até 100% nas recompensas.
            </p>
        </div>
        <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 rounded-xl px-8" onClick={() => window.location.href = '/dashboard/store'}>
            Ver Benefícios VIP
        </Button>
      </div>
    </div>
  );
}
