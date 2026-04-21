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
    <div className="w-full bg-black/60 border-y border-white/5 py-1.5 overflow-hidden">
      <div className="flex items-center justify-center gap-2">
        <Sparkles size={12} className="text-primary animate-pulse" />
        <span className="text-[10px] font-heading text-white/70">
            {activity.text}
        </span>
      </div>
    </div>
  );
}
