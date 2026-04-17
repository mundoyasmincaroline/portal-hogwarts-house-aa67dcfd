import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function BirthdayBanner() {
  const [birthdayToday, setBirthdayToday] = useState<any>(null);

  useEffect(() => {
    const fetchBirthdays = async () => {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      // PostgreSQL EXTRACT requires a bit of logic, but for simplicity, let's fetch all and filter in JS 
      // since the list of characters is small.
      const { data } = await supabase.from('characters_birthdays').select('*');
      
      if (data) {
        const birthday = data.find(char => {
          const charDate = new Date(char.birth_date);
          // Handling timezone issues by using string parts or UTC
          const charStr = char.birth_date.split('-');
          const cMonth = parseInt(charStr[1]);
          const cDay = parseInt(charStr[2]);
          return cMonth === month && cDay === day;
        });

        if (birthday) {
          // Calculate age
          const birthYear = new Date(birthday.birth_date).getFullYear();
          const currentYear = today.getFullYear();
          birthday.age = currentYear - birthYear;
          setBirthdayToday(birthday);
        }
      }
    };

    fetchBirthdays();
  }, []);

  if (!birthdayToday) return null;

  return (
    <div className="bg-gradient-to-r from-primary/30 via-secondary to-primary/30 border border-primary/50 text-foreground px-4 py-3 rounded-xl shadow-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="text-4xl animate-bounce">🎂</div>
        <div>
          <h3 className="font-heading text-lg text-primary drop-shadow-sm">Aniversário Mágico!</h3>
          <p className="text-sm">
            Hoje é o aniversário de <strong className="text-primary">{birthdayToday.name}</strong> ({birthdayToday.age} anos)! 
          </p>
        </div>
      </div>
      <div className="text-xs px-3 py-1 bg-background/50 rounded-full border border-primary/30">
        Casa: <span className="capitalize text-primary font-bold">{birthdayToday.house}</span>
      </div>
    </div>
  );
}
