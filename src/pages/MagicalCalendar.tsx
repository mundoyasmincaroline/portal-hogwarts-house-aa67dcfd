import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Cake, Calendar, Star, Wand2 } from "lucide-react";
import MagicalDashboardHeader from "@/components/shared/MagicalDashboardHeader";
import EmojiIcon from "@/components/shared/EmojiIcon";
import { motion } from "framer-motion";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function MagicalCalendar() {
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBirthdays = async () => {
      const { data } = await supabase.from('characters_birthdays').select('*').order('birth_date');
      if (data) {
        // Sort by month and day manually because birth_date has years that differ
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.birth_date);
          const dateB = new Date(b.birth_date);
          if (dateA.getMonth() !== dateB.getMonth()) {
            return dateA.getMonth() - dateB.getMonth();
          }
          return dateA.getDate() - dateB.getDate();
        });
        setBirthdays(sorted);
      }
      setLoading(false);
    };
    fetchBirthdays();
  }, []);

  const currentMonth = new Date().getMonth();

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-1000 px-4 sm:px-6">
      <MagicalDashboardHeader />
      
      <div className="space-y-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl sm:text-6xl font-heading text-gold-gradient tracking-tighter drop-shadow-[0_10px_20px_rgba(212,175,55,0.3)]">
              Calendário Mágico
            </h1>
            <p className="text-foreground/85 text-sm sm:text-base italic uppercase tracking-[0.28em] font-light">
              Registros ancestrais de nascimentos lendários
            </p>
          </div>
          <div className="w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Buscar personagem..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-primary/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-all text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 glass rounded-2xl animate-pulse" />
          ))
        ) : (
          MONTH_NAMES.map((month, index) => {
            const monthBirthdays = birthdays.filter(b => 
              new Date(b.birth_date).getMonth() === index && 
              (searchTerm === "" || b.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            const isCurrentMonth = index === currentMonth;

            return (
              <motion.div
                key={month}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden glass border-white/5 h-full ${isCurrentMonth ? 'ring-2 ring-primary/50 shadow-[0_0_30px_rgba(212,175,55,0.2)]' : ''}`}>
                  <div className={`p-4 font-heading text-xl flex items-center justify-between border-b border-white/5 ${isCurrentMonth ? 'bg-primary/10 text-primary' : 'text-foreground/80'}`}>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} />
                      {month}
                    </div>
                    {isCurrentMonth && (
                      <span className="text-[10px] bg-primary/20 px-2 py-0.5 rounded-full animate-pulse">ATUAL</span>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {monthBirthdays.length > 0 ? (
                      monthBirthdays.map((b) => (
                        <div key={b.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                              b.house === 'gryffindor' ? 'bg-red-900/20 border-red-500/30 text-red-400' :
                              b.house === 'slytherin' ? 'bg-green-900/20 border-green-500/30 text-green-400' :
                              b.house === 'ravenclaw' ? 'bg-blue-900/20 border-blue-500/30 text-blue-400' :
                              b.house === 'hufflepuff' ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400' :
                              'bg-zinc-800/20 border-zinc-500/30 text-zinc-400'
                            }`}>
                              {new Date(b.birth_date).getDate()}
                            </div>
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">{b.name}</span>
                          </div>
                          <Cake size={14} className="text-foreground/20 group-hover:text-primary/50 transition-all group-hover:scale-110" />
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-foreground/40 italic py-4 text-center">Nenhum registro histórico neste mês</p>
                    )}
                  </div>

                  {isCurrentMonth && (
                    <div className="absolute -right-4 -bottom-4 text-primary/5 rotate-12 scale-150 pointer-events-none">
                      <Star size={100} fill="currentColor" />
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Fun curiosities section */}
      <div className="glass rounded-3xl p-8 border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 text-primary/10">
          <Wand2 size={80} />
        </div>
        <h3 className="font-heading text-2xl text-primary mb-6 flex items-center gap-2">
          <EmojiIcon e="✨" /> Curiosidades das Comemorações
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <h4 className="font-heading text-sm text-primary">Hagrid & Bolos de Rocha</h4>
              <p className="text-xs text-foreground/70 leading-relaxed">Rubeus Hagrid costuma celebrar presenteando amigos com seus famosos "bolos de rocha" — cuidado com os dentes ao morder!</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <h4 className="font-heading text-sm text-primary">Dumbledore & Doces Trouxas</h4>
              <p className="text-xs text-foreground/70 leading-relaxed">O Diretor prefere comemorações discretas, geralmente acompanhadas de sorvete de limão ou outros doces exóticos do mundo trouxa.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <h4 className="font-heading text-sm text-primary">A Gemialidades Weasley</h4>
              <p className="text-xs text-foreground/70 leading-relaxed">Fred e George celebram aniversários com fogos de artifício que formam dragões e sapos de chocolate gigantes.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <h4 className="font-heading text-sm text-primary">O Baile da Morte</h4>
              <p className="text-xs text-foreground/70 leading-relaxed">Fantasmas celebram aniversários de morte (Deathdays) com comida podre, cujo aroma é o único que conseguem "sentir".</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
