import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import SafeImage from "./SafeImage";
import HouseCrest from "./HouseCrest";


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
    <div className={`relative overflow-hidden rounded-[2.5rem] p-8 text-center my-8 group shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-700 hover:scale-[1.02] border border-white/5 ${bgStyle}`}>
      {/* Cinematic Auras */}
      <div className="absolute inset-0 bg-black/50 transition-colors duration-1000 group-hover:bg-black/30" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-[80px] group-hover:bg-white/10 transition-all duration-1000" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-1000" />
      
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md">
          <Sparkles size={12} className="text-yellow-400 animate-pulse" />
          <h2 className="font-heading text-xs text-gold-gradient tracking-[0.2em] uppercase font-bold">{highlightTitle}</h2>
        </div>
        
        <div className="flex flex-col items-center gap-5">
          <div className="relative group/avatar">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover/avatar:bg-primary/40 transition-all duration-700 scale-125" />
            <div className="relative w-28 h-28 rounded-full border-4 border-primary/30 overflow-hidden shadow-2xl transition-transform duration-700 group-hover/avatar:scale-110">
              <SafeImage 
                src={highlightedUser.avatar_url} 
                alt={highlightedUser.username}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover/avatar:scale-125"
                fallbackText={highlightedUser.username}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-card border border-primary/40 p-1.5 rounded-xl shadow-xl transform rotate-12">
               <HouseCrest house={highlightedUser.house} size="sm" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-heading text-foreground drop-shadow-lg tracking-tighter">@{highlightedUser.username}</p>
            <p className="text-[10px] text-primary/80 font-heading uppercase tracking-[0.4em] font-bold">Membro de Elite</p>
          </div>

          <div className="px-6 py-2 bg-black/40 rounded-2xl text-[11px] font-heading uppercase tracking-widest text-foreground backdrop-blur-md border border-white/5 shadow-inner">
             <span className="text-primary font-bold">{highlightedUser.xp.toLocaleString('pt-BR')}</span> XP Acumulados
          </div>
        </div>
      </div>
    </div>
  );
}
