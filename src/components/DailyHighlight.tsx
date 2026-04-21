import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function DailyHighlight() {
  const [highlightedUser, setHighlightedUser] = useState<any>(null);
  const [highlightTitle, setHighlightTitle] = useState("✨ Aluno Destaque do Dia ✨");

  useEffect(() => {
    // In a real app, this would be computed by a cron job or complex query.
    // We mock the top user for the day.
    const fetchTopUser = async () => {
      const categories = [
        { title: "🏆 O Mais Rico de Hogwarts 🏆", orderBy: "xp", asc: false },
        { title: "🌱 Novato Promissor 🌱", orderBy: "created_at", asc: false },
        { title: "⚡ Veterano do Castelo ⚡", orderBy: "xp", asc: false },
        { title: "🔮 Monitor Ativo 🔮", orderBy: "last_seen", asc: false },
      ];
      
      const selectedCat = categories[Math.floor(Math.random() * categories.length)];
      setHighlightTitle(selectedCat.title);
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('approved', true)
        .order(selectedCat.orderBy, { ascending: selectedCat.asc })
        .limit(10);
      
      if (data && data.length > 0) {
        setHighlightedUser(data[Math.floor(Math.random() * data.length)]);
      }
    };

    fetchTopUser();
  }, []);

  if (!highlightedUser) return null;

  // Premium static gradients based on house
  const houseStyles: Record<string, string> = {
    gryffindor: "bg-gradient-to-br from-red-900 via-red-800 to-yellow-600",
    slytherin: "bg-gradient-to-br from-green-900 via-green-800 to-gray-400",
    ravenclaw: "bg-gradient-to-br from-blue-900 via-blue-800 to-gray-300",
    hufflepuff: "bg-gradient-to-br from-yellow-700 via-yellow-600 to-black",
  };

  const bgStyle = houseStyles[highlightedUser.house] || houseStyles.gryffindor;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-center my-6 group ${bgStyle}`}>
      <div className="absolute inset-0 bg-black/40 transition-opacity duration-1000 group-hover:bg-black/20" />
      
      <div className="relative z-10">
        <h2 className="font-heading text-xl text-gold-gradient mb-4 drop-shadow-md">{highlightTitle}</h2>
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden shadow-[0_0_15px_hsl(var(--primary)/0.5)]">
            <img 
              src={highlightedUser.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${highlightedUser.username}`} 
              alt={highlightedUser.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">@{highlightedUser.username}</p>
            <p className="text-sm text-primary capitalize">{highlightedUser.house}</p>
          </div>
          <div className="px-4 py-1 bg-secondary/80 rounded-full text-xs font-bold text-foreground backdrop-blur-sm border border-primary/20">
            {highlightedUser.xp} XP Acumulados
          </div>
        </div>
      </div>
    </div>
  );
}
