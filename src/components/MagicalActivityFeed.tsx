import { useState, useEffect } from "react";
import { Sparkles, ShoppingCart, Trophy, Zap, Star } from "lucide-react";

const MOCK_ACTIVITIES = [
  { id: 1, text: "Bruxo_Potter acabou de equipar uma Varinha de Fênix!", icon: <Zap size={14} className="text-yellow-400" /> },
  { id: 2, text: "@Hermione venceu Draco no Duelo das Quartas de Final!", icon: <Trophy size={14} className="text-primary" /> },
  { id: 3, text: "Alguém acaba de abrir um Baú Lendário em Gringotts!", icon: <ShoppingCart size={14} className="text-green-400" /> },
  { id: 4, text: "Slytherin assumiu a liderança do Ranking de Casas!", icon: <Star size={14} className="text-yellow-500" /> },
  { id: 5, text: "O Mapa do Maroto revelou um segredo no Salão Principal!", icon: <Sparkles size={14} className="text-purple-400" /> },
];

export default function MagicalActivityFeed() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MOCK_ACTIVITIES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activity = MOCK_ACTIVITIES[index];

  return (
    <div className="w-full bg-black/60 backdrop-blur-md border-y border-white/5 py-2 overflow-hidden relative group">
      <div className="flex items-center justify-center gap-3 animate-in slide-in-from-right-full duration-1000 key={index}">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            {activity.icon}
            <span className="text-[11px] font-heading text-white/80 tracking-wide">
                {activity.text}
            </span>
        </div>
      </div>
      
      {/* Side fades */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
    </div>
  );
}
