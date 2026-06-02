import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function BirthdayBanner() {
  const [birthdayChars, setBirthdayChars] = useState<any[]>([]);
  const [birthdayMembers, setBirthdayMembers] = useState<any[]>([]);

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

  if (birthdayChars.length === 0 && birthdayMembers.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {birthdayMembers.map((m, i) => (
        <div key={`m-${i}`} className="bg-gradient-to-r from-primary/30 via-secondary to-primary/30 border border-primary/50 text-foreground px-4 py-3 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="text-4xl animate-bounce"><EmojiIcon e="🎈" /></div>
            <div>
              <h3 className="font-heading text-lg text-primary drop-shadow-sm">Parabéns, {m.full_name}!</h3>
              <p className="text-sm">
                Hoje é o aniversário do nosso membro mágico! Mande felicitações para a casa de <strong className="capitalize text-primary">{m.house}</strong>!
              </p>
            </div>
          </div>
        </div>
      ))}

      {birthdayChars.map((c, i) => (
        <div key={`c-${i}`} className="bg-gradient-to-r from-primary/30 via-secondary to-primary/30 border border-primary/50 text-foreground px-4 py-3 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="text-4xl animate-bounce"><EmojiIcon e="🎂" /></div>
            <div>
              <h3 className="font-heading text-lg text-primary drop-shadow-sm">Aniversário no Mundo Bruxo!</h3>
              <p className="text-sm">
                Hoje comemoramos o aniversário de <strong className="text-primary">{c.name}</strong> ({c.age} anos)! 
              </p>
            </div>
          </div>
          <div className="text-xs px-3 py-1 bg-background/50 rounded-full border border-primary/30">
            Casa: <span className="capitalize text-primary font-bold">{c.house}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
