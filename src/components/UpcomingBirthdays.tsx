import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Cake, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmojiIcon from "@/components/shared/EmojiIcon";

export function UpcomingBirthdays() {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcoming = async () => {
      const { data } = await supabase.from('characters_birthdays').select('*');
      if (data) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        // Get characters with birthdays in the next 7 days
        const nextSevenDays = data.filter(char => {
          const charDate = new Date(char.birth_date);
          const charMonth = charDate.getMonth();
          const charDay = charDate.getDate();

          // Simple check for birthdays in current month after today
          if (charMonth === currentMonth && charDay >= currentDay && charDay <= currentDay + 7) {
            return true;
          }
          
          // Check for month rollover
          if (charMonth === (currentMonth + 1) % 12) {
            const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
            const remainingDays = daysInMonth - currentDay;
            if (remainingDays < 7 && charDay <= (7 - remainingDays)) {
              return true;
            }
          }

          return false;
        }).sort((a, b) => {
          const dateA = new Date(a.birth_date);
          const dateB = new Date(b.birth_date);
          return dateA.getDate() - dateB.getDate();
        });

        setUpcoming(nextSevenDays.slice(0, 3));
      }
    };

    fetchUpcoming();
  }, []);

  if (upcoming.length === 0) return null;

  return (
    <Card className="glass p-6 border-white/5 space-y-4 bg-gradient-to-br from-white/5 to-transparent">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-heading font-black uppercase tracking-[0.4em] text-primary/80 flex items-center gap-2">
            <Calendar size={12} className="text-primary" />
            Próximas Festas
          </h3>
          <p className="text-[9px] text-foreground/50 font-serif italic">No calendário do castelo</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/calendario-magico')}
          className="text-[9px] font-bold uppercase text-primary/60 hover:text-primary transition-colors"
        >
          Ver Tudo
        </button>
      </div>

      <div className="space-y-3">
        {upcoming.map((char) => (
          <div key={char.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border ${
              char.house === 'gryffindor' ? 'bg-red-900/20 border-red-500/20' :
              char.house === 'slytherin' ? 'bg-green-900/20 border-green-500/20' :
              char.house === 'ravenclaw' ? 'bg-blue-900/20 border-blue-500/20' :
              char.house === 'hufflepuff' ? 'bg-yellow-900/20 border-yellow-500/20' :
              'bg-zinc-800/20 border-zinc-500/20'
            }`}>
              <EmojiIcon e={char.house === 'none' ? '✨' : '🎂'} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-heading text-foreground/90 group-hover:text-primary transition-colors">{char.name}</p>
              <p className="text-[10px] text-foreground/40 font-serif">
                {new Date(char.birth_date).getDate()} de {
                  ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][new Date(char.birth_date).getMonth()]
                }
              </p>
            </div>
            <Cake size={12} className="text-primary/30 group-hover:text-primary transition-all group-hover:scale-110" />
          </div>
        ))}
      </div>
    </Card>
  );
}
