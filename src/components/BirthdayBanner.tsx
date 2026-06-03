import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { reward } from "@/services/core/rewardService";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Cake, Sparkles, Wand2, Calendar } from "lucide-react";
import EmojiIcon from "@/components/shared/EmojiIcon";
import { motion, AnimatePresence } from "framer-motion";

export default function BirthdayBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [birthdayChars, setBirthdayChars] = useState<any[]>([]);
  const [birthdayMembers, setBirthdayMembers] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const fetchBirthdays = async () => {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const { data: chars } = await supabase.from('characters_birthdays').select('*');
      const { data: members } = await supabase.from('profiles').select('full_name, house, birth_date').not('birth_date', 'is', null);
      
      if (chars) {
        const todaysChars = chars.filter(char => {
          const charStr = char.birth_date.split('-');
          return parseInt(charStr[1]) === month && parseInt(charStr[2]) === day;
        });
        setBirthdayChars(todaysChars.map(c => {
          c.age = today.getFullYear() - new Date(c.birth_date).getFullYear();
          return c;
        }));
      }

      if (members) {
        const todaysMembers = members.filter(m => {
          const mStr = m.birth_date.split('-');
          return parseInt(mStr[1]) === month && parseInt(mStr[2]) === day;
        });
        setBirthdayMembers(todaysMembers);
      }
    };

    fetchBirthdays();
  }, []);

  const handleWishHappyBirthday = async (name: string, isCharacter: boolean) => {
    if (!user || isPosting) return;
    setIsPosting(true);
    
    try {
      const message = isCharacter 
        ? `✨ Comemorando o aniversário de ${name} hoje no Castelo! 🎉🎂 #AniversarioMagico`
        : `🎈 Parabéns pelo seu aniversário, ${name}! Que seu dia seja repleto de magia! 🪄🍰`;

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: message,
      } as any);

      if (error) {
        toast.error("Erro ao enviar felicitações.");
        return;
      }

      toast.success("Felicitações enviadas ao Salão Principal! ✨");
      await reward(user.id, 'post');
    } finally {
      setIsPosting(false);
    }
  };

  if (birthdayChars.length === 0 && birthdayMembers.length === 0) return null;

  return (
    <div className="space-y-4 mb-6 relative">
      <AnimatePresence>
        {birthdayMembers.map((m, i) => (
          <motion.div 
            key={`m-${i}`} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/20 p-4 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Cake size={60} />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
              <div className="relative">
                <div className="text-5xl animate-bounce">
                  <EmojiIcon e="🎈" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles size={16} className="text-primary animate-pulse" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="font-heading text-xl text-primary drop-shadow-md">Parabéns, {m.full_name}!</h3>
                <p className="text-xs text-foreground/80 leading-relaxed max-w-md">
                  Hoje é o aniversário do nosso membro mágico! Mande felicitações para a casa de 
                  <span className={`ml-1 font-bold uppercase ${
                    m.house === 'gryffindor' ? 'text-red-400' :
                    m.house === 'slytherin' ? 'text-green-400' :
                    m.house === 'ravenclaw' ? 'text-blue-400' :
                    'text-yellow-400'
                  }`}> {m.house}</span>!
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Button 
                  onClick={() => handleWishHappyBirthday(m.full_name, false)}
                  disabled={isPosting}
                  variant="magical" 
                  size="sm"
                  className="rounded-full px-6 h-9 text-[10px] uppercase font-bold tracking-widest"
                >
                  <Wand2 size={12} className="mr-2" />
                  Felicitar
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard/calendario-magico')}
                  variant="outline" 
                  size="sm"
                  className="rounded-full px-4 h-9 text-[9px] uppercase font-bold border-primary/20 hover:bg-primary/10"
                >
                  <Calendar size={12} className="mr-2" />
                  Ver Calendário
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {birthdayChars.map((c, i) => (
          <motion.div 
            key={`c-${i}`} 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group relative bg-gradient-to-br from-background/80 to-primary/5 border border-primary/20 p-5 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wand2 size={120} />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl animate-float">
                  <EmojiIcon e="🎂" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-background border border-primary/30 rounded-full p-1.5 shadow-lg">
                  <div className={`w-4 h-4 rounded-full ${
                    c.house === 'gryffindor' ? 'bg-red-600' :
                    c.house === 'slytherin' ? 'bg-green-600' :
                    c.house === 'ravenclaw' ? 'bg-blue-600' :
                    c.house === 'hufflepuff' ? 'bg-yellow-600' :
                    'bg-zinc-600'
                  }`} />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                  <h3 className="font-heading text-xl text-primary drop-shadow-sm">{c.name}</h3>
                  <span className="text-[10px] uppercase font-bold text-foreground/40 tracking-widest">({c.age} Anos)</span>
                </div>
                <p className="text-xs text-foreground/70 italic font-serif">
                  "Hoje os corredores celebram o nascimento de uma lenda bruxa."
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border border-white/5 uppercase font-bold tracking-tighter ${
                    c.house === 'gryffindor' ? 'bg-red-900/40 text-red-200' :
                    c.house === 'slytherin' ? 'bg-green-900/40 text-green-200' :
                    c.house === 'ravenclaw' ? 'bg-blue-900/40 text-blue-200' :
                    'bg-yellow-900/40 text-yellow-200'
                  }`}>
                    Casa: {c.house}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => handleWishHappyBirthday(c.name, true)}
                  disabled={isPosting}
                  variant="magical" 
                  size="sm"
                  className="rounded-full px-8 h-10 text-[10px] uppercase font-black"
                >
                  <Sparkles size={12} className="mr-2" />
                  Comemorar
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard/calendario-magico')}
                  variant="ghost" 
                  size="sm"
                  className="text-[9px] uppercase font-bold opacity-60 hover:opacity-100"
                >
                  Calendário
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
