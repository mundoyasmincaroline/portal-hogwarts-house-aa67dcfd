import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function DynamicGreeting() {
  const { profile } = useAuth();
  const [greeting, setGreeting] = useState({ title: "", desc: "", img: "", bg: "" });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting({
        title: "Bom dia!",
        desc: "O Salão Principal cheira a panquecas e café quente.",
        img: "https://images.unsplash.com/photo-1544463403-f11dd252cbe9?q=80&w=800&auto=format&fit=crop",
        bg: "from-amber-500/20 to-orange-500/10"
      });
    } else if (hour >= 12 && hour < 18) {
      setGreeting({
        title: "Boa tarde!",
        desc: "As aulas de poções estão a todo vapor.",
        img: "https://images.unsplash.com/photo-1579781403261-fcfcb16e14fb?q=80&w=800&auto=format&fit=crop",
        bg: "from-amber-700/20 to-yellow-600/10"
      });
    } else {
      setGreeting({
        title: "Boa noite!",
        desc: "Cuidado com os corredores escuros, os monitores estão rondando.",
        img: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=800&auto=format&fit=crop",
        bg: "from-blue-900/40 to-indigo-900/20"
      });
    }
  }, []);

  if (!profile) return null;

  return (
    <div className={elative overflow-hidden rounded-2xl p-6 mb-6 glass bg-gradient-to-br \}>
      <div className="absolute inset-0 z-0">
        <img src={greeting.img} alt="Hogwarts" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
      </div>
      <div className="relative z-10">
        <h2 className="text-2xl font-heading text-gold-gradient mb-1">
          {greeting.title}, {profile.full_name.split(' ')[0]}!
        </h2>
        <p className="text-sm text-muted-foreground">{greeting.desc}</p>
      </div>
    </div>
  );
}
