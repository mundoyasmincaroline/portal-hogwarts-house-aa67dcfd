import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

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
    <div className={`relative overflow-hidden rounded-[2rem] md:rounded-[4rem] p-6 md:p-10 text-center my-6 md:my-10 group border-2 md:border-4 shadow-[0_30px_90px_rgba(0,0,0,0.5)] transition-all duration-1000 hover:scale-[1.02] ${bgStyle} ${highlightedUser.house === 'slytherin' ? 'border-green-500/40' : 'border-primary/40'}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dust.png')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-black/50 transition-opacity duration-1000 group-hover:bg-black/30" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full mb-6">
           <Sparkles size={12} className="text-yellow-400 animate-pulse" />
           <h2 className="font-heading text-xs text-gold-gradient uppercase tracking-[0.3em] font-bold">{highlightTitle}</h2>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 text-left">
          <div className="relative shrink-0 group/avatar">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse scale-125" />
            <div className="w-32 h-32 rounded-[3.5rem] border-4 border-white/30 overflow-hidden shadow-2xl relative z-10 group-hover/avatar:rotate-6 transition-transform duration-700">
              <img 
                src={highlightedUser.avatar_url || "/default_avatar.png"} 
                alt={highlightedUser.username}
                className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-4xl font-heading text-white drop-shadow-lg tracking-tight">@{highlightedUser.username}</p>
              <p className="text-sm text-yellow-400 font-bold uppercase tracking-widest mt-1 opacity-80">{highlightedUser.house || 'Bruxo Errante'}</p>
            </div>
            
            <div className="flex gap-4">
              <div className="px-5 py-2 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md">
                 <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Poder Acumulado</p>
                 <p className="text-2xl font-heading text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.4)]">{highlightedUser.xp} XP</p>
              </div>
              
              <div className="px-5 py-2 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md">
                 <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Nível Atual</p>
                 <p className="text-2xl font-heading text-white">{Math.floor((highlightedUser.xp || 0) / 1000) + 1}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/5 w-full">
           <p className="text-[10px] text-white/30 italic font-serif leading-relaxed">
             "O destino favorece os corajosos e os que buscam a sabedoria. Este bruxo provou seu valor no castelo hoje."
           </p>
        </div>
      </div>
    </div>
  );
}
