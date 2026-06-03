import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, BookOpen, Star, AlertCircle, GraduationCap } from "lucide-react";
import AcademicProgressCard from "@/components/AcademicProgressCard";

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
  const [submittingClass, setSubmittingClass] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [nextClassCountdown, setNextClassCountdown] = useState<string>("");

  // Time & Date calculations
  const now = new Date();
  const days = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
  const currentDay = days[now.getDay()];
  
  // Calculate Week Rotation (1, 2 or 3)
  const getWeekRotation = () => {
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = (now.getTime() - start.getTime());
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNum = Math.floor(diff / oneWeek);
    return (weekNum % 3) + 1;
  };
  const currentRotation = getWeekRotation();

  // Calculate student year
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
  }, [user, profile, currentRotation, currentDay]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (classes.length === 0) return;
      
      const upcoming = classes
        .filter(c => {
          const [start] = c.time_slot.split("-");
          const [h, m] = start.split(":").map(Number);
          const startTime = new Date();
          startTime.setHours(h, m, 0, 0);
          return startTime > new Date();
        })
        .sort((a, b) => {
          const [aStart] = a.time_slot.split("-");
          const [bStart] = b.time_slot.split("-");
          return aStart.localeCompare(bStart);
        });

      if (upcoming.length > 0) {
        const [start] = upcoming[0].time_slot.split("-");
        const [h, m] = start.split(":").map(Number);
        const startTime = new Date();
        startTime.setHours(h, m, 0, 0);
        
        const diff = startTime.getTime() - new Date().getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        setNextClassCountdown(`${hours}h ${mins}m ${secs}s`);
      } else {
        setNextClassCountdown("Sem mais aulas hoje");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [classes]);

  const loadClasses = async () => {
    // Fetch classes for current day and rotation
    const { data: classData } = await supabase
      .from("classes")
      .select("*")
      .eq("day_of_week", currentDay)
      .eq("week_rotation", currentRotation)
      .order("time_slot");

    if (classData) {
      // Filter by user year
      const filtered = classData.filter(c => {
        if (c.target_years === 'ALL') return true;
        if (c.target_years.includes('-')) {
          const [min, max] = c.target_years.split('-').map(Number);
          return studentYear >= min && studentYear <= max;
        }
        return studentYear === parseInt(c.target_years);
      });
      setClasses(filtered);

      // Fetch today's attendances
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
      // Normaliza o texto removendo espaços em branco para evitar erros se o admin digitar "14:00-15:00"
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
      // Falha silenciosa caso o admin tenha digitado o horário num formato incorreto
      return false;
    }
  };

  const attendClass = async (cls: SchoolClass) => {
    if (!user || !profile || submittingClass === cls.id) return;
    
    if (!isClassActive(cls.time_slot)) {
      toast.error("Você não pode entrar nesta aula agora. As portas estão trancadas!");
      return;
    }

    if (attendedMap[cls.id]) {
      toast.error("Você já participou desta aula hoje!");
      return;
    }

    setSubmittingClass(cls.id);
    try {
      const { error } = await supabase.from("class_attendance").insert({
        user_id: user.id,
        class_id: cls.id
      });
      if (error) { toast.error("Erro ao registrar presença: " + error.message); return; }

      const { error: xpErr } = await supabase.rpc("award_xp_action", { _action: "class", _user_id: user.id, _xp: cls.xp_reward });
      if (xpErr) { toast.error("Erro ao ganhar XP: " + xpErr.message); return; }

      setAttendedMap(prev => ({ ...prev, [cls.id]: true }));
      toast.success(`✨ Mais ${cls.xp_reward} XP! Você assistiu à aula de ${cls.title} com sucesso!`);
    } finally {
      setSubmittingClass(null);
    }
  };

  if (loading) return <div className="text-center py-10">Consultando pergaminhos...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 pb-20 px-2 sm:px-0">
      {/* ── CINEMATIC HEADER (THE SCROLL) ── */}
      <div className="relative glass rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 md:p-16 text-center overflow-hidden border border-primary/20 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-amber-900/20 opacity-80" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-20 pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/20 backdrop-blur-xl border border-primary/30 rounded-full px-6 py-2">
            <GraduationCap className="w-4 h-4 text-primary animate-float" />
            <span className="text-[10px] font-heading text-primary uppercase tracking-widest font-bold">Ministério da Magia</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading text-gold-gradient drop-shadow-2xl">Horário de Aulas</h1>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
            <div className="glass px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <Star className="text-yellow-500 w-4 h-4" />
              <p className="text-xs font-serif italic text-white/80">
                Aluno do <span className="text-white font-bold">{studentYear}º Ano</span>
              </p>
            </div>
            <div className="glass px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <Clock className="text-primary w-4 h-4" />
              <p className="text-xs font-serif italic text-white/80">
                Semana <span className="text-white font-bold">{currentRotation}</span> do Rodízio
              </p>
            </div>
            {nextClassCountdown && (
              <div className="glass px-6 py-3 rounded-2xl border border-primary/20 flex items-center gap-3 bg-primary/5">
                <Clock className="text-primary w-4 h-4 animate-pulse" />
                <p className="text-xs font-serif italic text-white/80">
                  Próxima Aula: <span className="text-primary font-bold font-mono">{nextClassCountdown}</span>
                </p>
              </div>
            )}
          </div>
          
          <div className="pt-4 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/50" />
              <span className="font-heading text-primary uppercase tracking-[0.3em] text-[10px] font-bold">{currentDay}</span>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
            
            {classes.some(c => isClassActive(c.time_slot) && !attendedMap[c.id]) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/20 border border-primary/40 px-4 py-1.5 rounded-full"
              >
                <p className="text-[10px] font-heading text-primary uppercase tracking-widest animate-pulse">
                  ⚡ Aula em andamento! Entre na sala agora.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="relative group max-w-md mx-auto w-full">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary/40 group-focus-within:text-primary transition-colors">
          <BookOpen size={18} />
        </div>
        <input
          type="text"
          placeholder="Procurar matéria ou professor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-serif italic text-white"
        />
      </div>

      {/* ── CLASSES GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.filter(c => 
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          c.professor.toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 ? (
          <div className="col-span-full relative glass rounded-2xl sm:rounded-[3rem] p-12 sm:p-24 text-center border border-white/5 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                 <BookOpen size={40} className="text-white/20" />
              </div>
              <p className="text-muted-foreground font-serif italic text-lg italic">
                {searchTerm ? `"Nenhum pergaminho encontrado para '${searchTerm}'..."` : `"Não há aulas programadas para hoje em seus pergaminhos."`}
              </p>
            </div>
          </div>
        ) : (
          classes
            .filter(c => 
              c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
              c.professor.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(cls => {
            const active = isClassActive(cls.time_slot);
            const attended = attendedMap[cls.id];
            
            return (
              <div key={cls.id} className="relative group/card">
                {/* Active Aura */}
                {active && !attended && (
                  <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-[2.5rem] animate-pulse pointer-events-none" />
                )}

                <div className={`relative glass rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 border transition-all duration-500 overflow-hidden flex flex-col h-full ${
                  active && !attended
                    ? "border-primary/50 bg-gradient-to-br from-primary/10 via-black to-black shadow-[0_20px_50px_rgba(212,175,55,0.2)]" 
                    : "border-white/10 bg-black/40 hover:border-white/30"
                }`}>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                  
                  <div className="relative z-10 flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <h3 className={`font-heading text-xl transition-colors ${active ? "text-primary shadow-primary" : "text-white"}`}>
                           {cls.title}
                         </h3>
                         {cls.is_optional && (
                           <span className="bg-white/5 border border-white/10 text-white/40 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest">Opcional</span>
                         )}
                      </div>
                      <p className="text-sm font-serif italic text-muted-foreground">Professor(a) {cls.professor}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-mono tracking-widest border transition-all ${
                      active ? "bg-primary/20 border-primary/40 text-primary animate-pulse" : "bg-white/5 border-white/10 text-white/40"
                    }`}>
                      {cls.time_slot}
                    </div>
                  </div>

                  <div className="relative z-10 mt-auto flex items-center justify-between pt-8 border-t border-white/5">
                    <div className="flex items-center gap-2 group/xp">
                      <div className="w-8 h-8 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20 group-hover/xp:scale-110 transition-transform">
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="text-left">
                         <p className="text-sm font-heading text-yellow-500 leading-none">+{cls.xp_reward}</p>
                         <p className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">Pontos XP</p>
                      </div>
                    </div>

                    {attended ? (
                      <div className="flex items-center gap-2 px-6 py-2 bg-green-500/10 border border-green-500/30 rounded-2xl">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                         <span className="text-[9px] font-heading text-green-400 uppercase tracking-widest">Presença Confirmada</span>
                      </div>
                    ) : (
                      <Button 
                        variant={active ? "magical" : "secondary"} 
                        size="sm"
                        disabled={submittingClass === cls.id || !active}
                        onClick={() => attendClass(cls)}
                        className={`px-8 rounded-2xl h-12 shadow-2xl transition-all duration-500 ${active ? "scale-105" : "opacity-50"}`}
                      >
                        {submittingClass === cls.id ? "Entrando..." : active ? "Participar Agora ✨" : "Porta Trancada"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── FOOTER ADVISORY ── */}
      <AcademicProgressCard />

      <div className="relative glass rounded-[2rem] p-8 border border-red-900/20 bg-red-950/5 group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex gap-6 items-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-inner group-hover:rotate-12 transition-transform">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-1">
            <h4 className="font-heading text-red-500/80 uppercase tracking-widest text-xs font-bold">Protocolo de Disciplina</h4>
            <p className="text-sm font-serif italic text-muted-foreground leading-relaxed">
              "A porta da sala só se abre durante o horário marcado. Se você tentar entrar antes ou depois, o zelador <span className="text-red-400 font-bold not-italic">Argus Filch</span> não terá piedade em barrar sua entrada!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}