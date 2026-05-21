import { useState, useEffect } from "react";
import { Heart, Sparkles } from "lucide-react";


const MEMORIES = [
  {
    id: "dumbledore_memorial",
    image: "/memories/monster_quality_dumbledore_memorial.png",
    quote: "A felicidade pode ser encontrada mesmo nas horas mais sombrias, se alguém se lembrar de acender a luz.",
    context: "O Adeus ao Diretor"
  },
  {
    id: "first_arrival",
    image: "/memories/monster_quality_first_arrival.png",
    quote: "Não é todo dia que se descobre que é um bruxo.",
    context: "A Primeira Travessia"
  }
];


export default function MagicalMemories() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % MEMORIES.length);
    }, 15000); // Muda a cada 15 segundos
    return () => clearInterval(interval);
  }, []);

  const memory = MEMORIES[current];

  return (
    <div className="glass rounded-2xl sm:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-black/80 to-purple-900/20 overflow-hidden relative group shadow-2xl">
        <div 
          key={memory.id}
          className="relative aspect-[16/9] w-full animate-fade-in"
        >

          <img src={memory.image} alt={memory.context} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[5s]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-8 space-y-3">
             <div className="flex items-center gap-2">
               <Heart className="text-red-500 fill-red-500 animate-pulse" size={14} />
               <span className="text-[10px] font-heading text-white/50 uppercase tracking-widest">{memory.context}</span>
             </div>
             <p className="text-lg sm:text-xl md:text-2xl font-serif text-white italic leading-relaxed drop-shadow-lg">
               "{memory.quote}"
             </p>
             <div className="pt-2">
               <span className="text-[9px] bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-white/40 uppercase tracking-[0.2em]">Memória Eterna</span>
             </div>
          </div>
        </div>
      
      {/* Interactive Sparkle Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 right-4 animate-spin-slow">
           <Sparkles className="text-yellow-500/30" size={24} />
        </div>
      </div>
    </div>
  );
}
