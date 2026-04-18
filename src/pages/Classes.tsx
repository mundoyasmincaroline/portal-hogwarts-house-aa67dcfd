import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, BookOpen, Star, AlertCircle } from "lucide-react";

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
  }, [user, profile]);

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
    const [start, end] = timeSlot.split(' - ').map(s => s.trim());
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(sh, sm, 0);
    
    const endTime = new Date();
    endTime.setHours(eh, em, 0);
    
    return now >= startTime && now <= endTime;
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

    // Award XP
    await supabase.from("profiles").update({ xp: profile.xp + cls.xp_reward }).eq("user_id", user.id);
    
    setAttendedMap(prev => ({ ...prev, [cls.id]: true }));
    toast.success(\? Mais \ XP! Você assistiu à aula de \ com sucesso!\);
  };

  if (loading) return <div className="text-center py-10">Consultando pergaminhos...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 text-center">
        <h1 className="font-heading text-3xl text-gold-gradient mb-2">Horário de Aulas</h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto mb-4">
          Você é um aluno do <strong>{studentYear}º Ano</strong>. Estamos na <strong>Semana {currentRotation}</strong> do rodízio.
          Participe das aulas no horário exato para ganhar XP.
        </p>
        <div className="flex items-center justify-center gap-2 text-primary">
          <Clock className="w-4 h-4" />
          <span className="font-bold">{currentDay}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {classes.length === 0 ? (
          <div className="col-span-full glass rounded-xl p-8 text-center border-border">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Você não tem aulas programadas para hoje.</p>
          </div>
        ) : (
          classes.map(cls => {
            const active = isClassActive(cls.time_slot);
            const attended = attendedMap[cls.id];
            
            return (
              <div key={cls.id} className={\glass rounded-xl p-5 border-l-4 transition-all \\}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-heading text-lg text-foreground flex items-center gap-2">
                      {cls.title}
                      {cls.is_optional && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase font-sans">Opcional</span>}
                    </h3>
                    <p className="text-sm text-muted-foreground">{cls.professor}</p>
                  </div>
                  <div className="bg-background/80 px-2 py-1 rounded text-xs font-mono text-primary border border-border">
                    {cls.time_slot}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1 text-sm text-yellow-500 font-bold">
                    <Star className="w-4 h-4" />
                    +{cls.xp_reward} XP
                  </div>

                  {attended ? (
                    <Button variant="secondary" size="sm" disabled className="text-green-500">
                      Presença Confirmada
                    </Button>
                  ) : (
                    <Button 
                      variant={active ? "magical" : "secondary"} 
                      size="sm"
                      onClick={() => attendClass(cls)}
                    >
                      {active ? "Participar da Aula" : "Fora do Horário"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="glass rounded-xl p-4 bg-primary/5 border-primary/20 flex gap-3">
        <AlertCircle className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">
          <strong>Aviso:</strong> A porta da sala só se abre durante o horário marcado. Se você tentar entrar antes ou depois, o zelador Filch não vai deixar!
        </p>
      </div>
    </div>
  );
}
