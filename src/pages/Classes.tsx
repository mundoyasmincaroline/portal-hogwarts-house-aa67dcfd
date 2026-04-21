import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, BookOpen, Star, AlertCircle, Wand2, Scroll as ScrollIcon, GraduationCap } from "lucide-react";

interface SchoolClass {
  id: string;
  title: string;
  professor: string;
  day_of_week: string;
  time_slot: string;
  target_years: string;
  week_rotation: number;
  xp_reward: number;
  is_optional: boolean;
}

export default function Classes() {
  const { profile, user } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [attendedMap, setAttendedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const days = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
  const currentDay = days[now.getDay()];
  
  const getWeekRotation = () => {
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = (now.getTime() - start.getTime());
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNum = Math.floor(diff / oneWeek);
    return (weekNum % 3) + 1;
  };
  const currentRotation = getWeekRotation();

  const getStudentYear = (level: number) => {
    if (level <= 10) return 1;
    if (level <= 20) return 2;
    if (level <= 30) return 3;
    if (level <= 40) return 4;
    if (level <= 50) return 5;
    if (level <= 60) return 6;
    return 7;
  };

  const studentYear = profile ? getStudentYear(profile.level) : 1;

  useEffect(() => {
    if (user && profile) loadClasses();
  }, [user, profile]);

  const loadClasses = async () => {
    const { data: classData } = await supabase
      .from("classes")
      .select("*")
      .eq("day_of_week", currentDay)
      .eq("week_rotation", currentRotation)
      .order("time_slot");

    if (classData) {
      const filtered = classData.filter(c => {
        if (c.target_years === 'ALL') return true;
        if (c.target_years.includes('-')) {
          const [min, max] = c.target_years.split('-').map(Number);
          return studentYear >= min && studentYear <= max;
        }
        return studentYear === parseInt(c.target_years);
      });
      setClasses(filtered);

      const today = new Date();
      today.setHours(0,0,0,0);
      const { data: attData } = await supabase
        .from("class_attendance")
        .select("class_id")
        .eq("user_id", user!.id)
        .gte("attended_at", today.toISOString());
      
      const map: Record<string, boolean> = {};
      attData?.forEach(a => map[a.class_id] = true);
      setAttendedMap(map);
    }
    setLoading(false);
  };

  const isClassActive = (timeSlot: string) => {
    try {
      const normalized = timeSlot.replace(/\s/g, '');
      const [start, end] = normalized.split('-');
      if (!start || !end) return false;
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return false;
      const startTime = new Date();
      startTime.setHours(sh, sm, 0, 0);
      const endTime = new Date();
      endTime.setHours(eh, em, 0, 0);
      return now >= startTime && now <= endTime;
    } catch (error) {
      return false;
    }
  };

  const attendClass = async (cls: SchoolClass) => {
    if (!user || !profile) return;
    if (!isClassActive(cls.time_slot)) {
      toast.error("Você não pode entrar nesta aula agora. As portas estão trancadas!");
      return;
    }
    if (attendedMap[cls.id]) {
      toast.error("Você já participou desta aula hoje!");
      return;
    }
    const { error } = await supabase.from("class_attendance").insert({
      user_id: user.id,
      class_id: cls.id
    });
    if (error) {
      toast.error("Erro ao registrar presença: " + error.message);
      return;
    }
    await supabase.rpc("award_xp_action", { _action: "class", _user_id: user.id, _xp: cls.xp_reward });
    setAttendedMap(prev => ({ ...prev, [cls.id]: true }));
    toast.success(`✨ Mais ${cls.xp_reward} XP! Você assistiu à aula de ${cls.title} com sucesso!`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="font-heading text-primary animate-pulse uppercase tracking-widest text-xs">Consultando pergaminhos...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 px-4">
      {/* ── HEADER MAGICAL ── */}
      <div className="relative pt-12 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="inline-flex p-4 bg-primary/20 rounded-2xl text-primary mb-6 animate-float border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
            <GraduationCap size={48} />
        </div>
        <h1 className="font-heading text-5xl md:text-7xl text-gold-gradient mb-4 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">Horário de Aulas</h1>
        <div className="flex flex-wrap justify-center gap-4 text-xs font-heading tracking-widest uppercase mb-8">
            <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-white/60 flex items-center gap-2">
                <ScrollIcon size={14} className="text-primary" /> {studentYear}º Ano
            </span>
            <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-white/60 flex items-center gap-2">
                <Clock size={14} className="text-primary" /> Semana {currentRotation}
            </span>
            <span className="px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-primary flex items-center gap-2 animate-pulse">
                <Wand2 size={14} /> Hoje: {currentDay}
            </span>
        </div>
      </div>

      {/* ── CLASSES GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {classes.length === 0 ? (
          <div className="col-span-full glass rounded-[3rem] p-16 text-center border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
            <BookOpen className="w-20 h-20 mx-auto text-white/10 mb-6 transition-transform group-hover:scale-110 duration-500" />
            <h2 className="text-2xl font-heading text-white/40 mb-2">Pátio Silencioso</h2>
            <p className="text-muted-foreground font-serif italic">Você não tem aulas programadas para hoje. Aproveite para explorar o castelo.</p>
          </div>
        ) : (
          classes.map(cls => {
            const active = isClassActive(cls.time_slot);
            const attended = attendedMap[cls.id];
            
            return (
              <div key={cls.id} className={`group relative glass rounded-[2.5rem] p-8 border transition-all duration-500 overflow-hidden ${
                  active 
                  ? 'border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(var(--primary),0.1)] scale-[1.02]' 
                  : 'border-white/5 bg-white/[0.02] opacity-80 hover:opacity-100'
              }`}>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ScrollIcon size={120} className="-rotate-12 translate-x-10 -translate-y-10" />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="font-heading text-2xl text-white group-hover:text-primary transition-colors">
                                {cls.title}
                            </h3>
                            <p className="text-sm font-serif italic text-white/40">Prof. {cls.professor}</p>
                        </div>
                        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-heading tracking-widest uppercase border ${
                            active ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]' : 'bg-black/40 text-white/40 border-white/10'
                        }`}>
                            {cls.time_slot}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 py-4 border-y border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-heading text-white/30 uppercase tracking-widest mb-1">Recompensa</span>
                            <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-lg">
                                <Star className="w-5 h-5 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                +{cls.xp_reward} XP
                            </div>
                        </div>
                        <div className="w-px h-10 bg-white/5" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-heading text-white/30 uppercase tracking-widest mb-1">Status</span>
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${active ? 'text-green-400' : 'text-white/20'}`}>
                                {attended ? 'CONCLUÍDO' : active ? 'PORTAS ABERTAS' : 'INDISPONÍVEL'}
                            </span>
                        </div>
                    </div>

                    <div className="pt-2">
                        {attended ? (
                            <Button variant="secondary" className="w-full h-14 rounded-2xl bg-green-500/10 text-green-500 border-green-500/20 cursor-default">
                                PRESENÇA CONFIRMADA ✅
                            </Button>
                        ) : (
                            <Button 
                                variant={active ? "magical" : "secondary"} 
                                className={`w-full h-14 rounded-2xl text-sm font-heading tracking-widest transition-all duration-300 ${active ? 'hover:scale-[1.03] shadow-lg' : 'opacity-50'}`}
                                onClick={() => attendClass(cls)}
                            >
                                {active ? "ENTRAR NA SALA ✨" : "FORA DO HORÁRIO"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Animated Light Streaks if active */}
                {active && !attended && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-shimmer" />
                    </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── FOOTER NOTICE ── */}
      <div className="glass rounded-[2.5rem] p-8 border-primary/20 bg-primary/5 flex items-center gap-6 max-w-2xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-10 translate-x-10" />
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/30">
            <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
            <p className="text-xs font-heading text-primary uppercase tracking-widest">Aviso do Zelador</p>
            <p className="text-sm text-white/60 leading-relaxed font-serif italic">
                "A porta da sala só se abre durante o horário marcado. Se você tentar entrar antes ou depois, o zelador Filch não vai deixar!"
            </p>
        </div>
      </div>
    </div>
  );
}