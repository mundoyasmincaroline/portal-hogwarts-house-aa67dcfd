import { useState, useEffect, memo } from "react";
import { useAuth } from "@/lib/auth";
import { Sparkles } from "lucide-react";

const DynamicGreeting = memo(() => {
  const { profile } = useAuth();
  const [greeting, setGreeting] = useState({ title: "", desc: "", img: "", bg: "" });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting({
        title: "Bom dia!",
        desc: "O Salão Principal cheira a panquecas e café quente.",
        img: "/src/assets/hogwarts_morning.webp",
        bg: "from-amber-500/20 to-orange-500/10"
      });
    } else if (hour >= 12 && hour < 18) {
      setGreeting({
        title: "Boa tarde!",
        desc: "As aulas de poções estão a todo vapor.",
        img: "/src/assets/hogwarts_afternoon.webp",
        bg: "from-amber-700/20 to-yellow-600/10"
      });
    } else {
      setGreeting({
        title: "Boa noite!",
        desc: "Cuidado com os corredores escuros, os monitores estão rondando.",
        img: "/src/assets/hogwarts_night.webp",
        bg: "from-blue-900/40 to-indigo-900/20"
      });
    }
  }, []);

  if (!profile) return null;

  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-8 mb-8 glass bg-gradient-to-br ${greeting.bg} border-primary/20 shadow-2xl group`}>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img src={greeting.img} alt="Hogwarts" className="w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-110 transition-transform duration-[3000ms]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
      </div>
      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-2">
          <Sparkles size={12} className="text-primary animate-pulse" />
          <span className="text-[10px] font-heading uppercase tracking-widest text-primary">Mensagem do Dia</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-gold-gradient mb-1 tracking-tighter">
          {greeting.title}, {profile.full_name.split(' ')[0]}!
        </h2>
        <p className="text-base sm:text-lg text-foreground/80 font-serif italic max-w-xl">"{greeting.desc}"</p>
      </div>
    </div>
  );
});

export default DynamicGreeting;