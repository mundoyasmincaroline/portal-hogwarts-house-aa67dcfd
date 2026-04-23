import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function DynamicGreeting() {
  const { profile, isAdmin } = useAuth();
  const [greeting, setGreeting] = useState({ title: "", desc: "", img: "", bg: "" });

  useEffect(() => {
    const hour = new Date().getHours();
    const isArquiteto = isAdmin && (profile?.username === 'morpheus' || profile?.username === 'Arquiteto');

    if (isArquiteto) {
      setGreeting({
        title: "Bem-vindo, Arquiteto",
        desc: "Os pilares de Hogwarts tremem diante da sua presença. O código flui sob seu comando.",
        img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000",
        bg: "from-primary/30 via-purple-900/20 to-black"
      });
      return;
    }

    if (hour >= 5 && hour < 12) {
      setGreeting({
        title: "Bom dia",
        desc: "O Salão Principal cheira a panquecas e café quente.",
        img: "https://images.unsplash.com/photo-1547756536-cde3673fa2e5?q=80&w=2000",
        bg: "from-amber-500/20 to-orange-500/10"
      });
    } else if (hour >= 12 && hour < 18) {
      setGreeting({
        title: "Boa tarde",
        desc: "As aulas de poções estão a todo vapor.",
        img: "https://images.unsplash.com/photo-1515542641795-06ed223c38d8?q=80&w=2000",
        bg: "from-amber-700/20 to-yellow-600/10"
      });
    } else {
      setGreeting({
        title: "Boa noite",
        desc: "Cuidado com os corredores escuros, os monitores estão rondando.",
        img: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=2000",
        bg: "from-blue-900/40 to-indigo-900/20"
      });
    }
  }, [isAdmin, profile]);

  if (!profile) return null;

  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-8 mb-8 glass border border-white/10 shadow-2xl transition-all duration-700 group hover:scale-[1.01] ${greeting.bg}`}>
      <div className="absolute inset-0 z-0">
        <img src={greeting.img} alt="Hogwarts" className="w-full h-full object-cover opacity-30 mix-blend-overlay scale-110 group-hover:scale-100 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-primary/60 font-bold mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Sincronia Mística Estável
          </div>
          <h2 className="text-3xl md:text-4xl font-heading text-gold-gradient tracking-tighter drop-shadow-2xl">
            {greeting.title}, {(profile.full_name || "Bruxo").split(' ')[0]}!
          </h2>
          <p className="text-sm text-muted-foreground font-serif italic max-w-md">{greeting.desc}</p>
        </div>
        
        {isAdmin && (
          <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl backdrop-blur-md">
            <p className="text-[9px] text-primary uppercase tracking-[0.3em] font-bold">Nível de Acesso: Arcanista Supremo</p>
          </div>
        )}
      </div>
    </div>
  );
}
