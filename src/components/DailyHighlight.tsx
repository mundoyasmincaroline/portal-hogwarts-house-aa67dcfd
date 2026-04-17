import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function DailyHighlight() {
  const [highlightedUser, setHighlightedUser] = useState<any>(null);

  useEffect(() => {
    // In a real app, this would be computed by a cron job or complex query.
    // We mock the top user for the day.
    const fetchTopUser = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('xp', { ascending: false })
        .limit(1)
        .single();
      
      setHighlightedUser(data);
    };

    fetchTopUser();
  }, []);

  if (!highlightedUser) return null;

  // Premium static images based on house
  const houseImages: Record<string, string> = {
    gryffindor: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1000",
    slytherin: "https://images.unsplash.com/photo-1500322969630-a26ab6eb64cc?auto=format&fit=crop&q=80&w=1000",
    ravenclaw: "https://images.unsplash.com/photo-1464639351491-a172c2aa2911?auto=format&fit=crop&q=80&w=1000",
    hufflepuff: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=1000",
  };

  const bgImage = houseImages[highlightedUser.house] || houseImages.gryffindor;

  return (
    <div className="relative overflow-hidden rounded-2xl glass p-6 text-center my-6 group">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 transition-transform duration-1000 group-hover:scale-105" 
        style={{ backgroundImage: `url(${bgImage})` }} 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      
      <div className="relative z-10">
        <h2 className="font-heading text-2xl text-gold-gradient mb-2 drop-shadow-md">✨ Aluno Destaque do Dia ✨</h2>
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden shadow-[0_0_15px_rgba(var(--primary),0.5)]">
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
