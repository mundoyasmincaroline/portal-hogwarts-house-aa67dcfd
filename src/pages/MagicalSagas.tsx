import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Sword, Scroll, Shield, Zap, Sparkles, ChevronRight, PlayCircle } from "lucide-react";
import MagicalEmoji from "@/components/MagicalEmoji";
import HouseCrest from "@/components/HouseCrest";

const SAGAS = [
  { 
    id: 1, 
    title: "A Pedra Filosofal", 
    house: "gryffindor", 
    challenge: "O Desafio do Alçapão", 
    reward: "1.000 XP", 
    difficulty: "Iniciante",
    image: "https://images.unsplash.com/photo-1547756536-cde3673fa2e5?auto=format&fit=crop&q=80&w=800",
    color: "from-red-600/20 to-red-950/40"
  },
  { 
    id: 2, 
    title: "A Câmara Secreta", 
    house: "slytherin", 
    challenge: "O Enigma do Basilisco", 
    reward: "2.500 XP", 
    difficulty: "Intermediário",
    image: "https://images.unsplash.com/photo-1514894780037-d2ef692277bb?auto=format&fit=crop&q=80&w=800",
    color: "from-emerald-600/20 to-emerald-950/40"
  },
  { 
    id: 3, 
    title: "O Prisioneiro de Azkaban", 
    house: "gryffindor", 
    challenge: "A Prova do Patrono", 
    reward: "5.000 XP", 
    difficulty: "Avançado",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800",
    color: "from-purple-600/20 to-purple-950/40"
  },
  { 
    id: 4, 
    title: "O Cálice de Fogo", 
    house: "hufflepuff", 
    challenge: "Torneio Tribruxo", 
    reward: "10.000 XP", 
    difficulty: "Extremo",
    image: "https://images.unsplash.com/photo-1527067829737-40299c5895bb?auto=format&fit=crop&q=80&w=800",
    color: "from-yellow-600/20 to-yellow-950/40"
  },
  { 
    id: 5, 
    title: "A Ordem da Fênix", 
    house: "ravenclaw", 
    challenge: "Defesa Contra as Trevas", 
    reward: "7.500 XP", 
    difficulty: "Avançado",
    image: "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&q=80&w=800",
    color: "from-blue-600/20 to-blue-950/40"
  }
];

export default function MagicalSagas() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20">
      <div className="p-6 md:p-10 space-y-12 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
           <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-2">
             <Trophy size={14} className="text-primary animate-pulse" />
             <span className="text-[10px] font-heading text-primary uppercase tracking-widest">A Jornada do Herói · Saga Completa</span>
           </div>
           <h1 className="font-heading text-4xl md:text-6xl text-gold-gradient tracking-tighter">Sagas de Hogwarts</h1>
           <p className="text-muted-foreground font-serif italic max-w-2xl mx-auto">
             "Cada filme é um desafio. Cada desafio é uma prova de força. Você tem o que é necessário para completar a saga?"
           </p>
        </div>

        {/* Sagas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {SAGAS.map((saga) => (
             <div key={saga.id} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 shadow-2xl transition-all duration-700 hover:-translate-y-2">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                  <img src={saga.image} alt={saga.title} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-1000" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${saga.color} mix-blend-overlay`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 p-8 md:p-10 flex flex-col h-full justify-between min-h-[350px]">
                   <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] text-primary font-heading uppercase tracking-widest font-bold">Filme {saga.id}</p>
                        <h2 className="font-heading text-3xl text-white tracking-tight">{saga.title}</h2>
                      </div>
                      <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl">
                         <HouseCrest house={saga.house as any} size="sm" />
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="glass rounded-2xl p-4 border border-white/5 space-y-1">
                            <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Desafio Ativo</p>
                            <p className="text-xs text-white/80 font-serif font-bold">{saga.challenge}</p>
                         </div>
                         <div className="glass rounded-2xl p-4 border border-white/5 space-y-1 text-right">
                            <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Recompensa</p>
                            <p className="text-sm text-yellow-500 font-heading">{saga.reward}</p>
                         </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] text-white/60 uppercase tracking-widest font-bold">{saga.difficulty}</span>
                         </div>
                         <Button variant="magical" className="rounded-2xl h-12 px-8 shadow-2xl group-hover:scale-105 transition-transform">
                            Iniciar Jornada <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                         </Button>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Global Progress Section */}
        <div className="relative glass rounded-[3rem] p-10 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent text-center space-y-6">
           <div className="flex justify-center -space-x-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-black bg-zinc-900 overflow-hidden shadow-2xl">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="Membro" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-4 border-black bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shadow-2xl">
                 +842
              </div>
           </div>
           <div className="space-y-2">
             <h3 className="font-heading text-xl text-white uppercase tracking-tight">Bruxos Ativos nas Sagas</h3>
             <p className="text-xs text-muted-foreground font-serif italic max-w-md mx-auto">"A força de Hogwarts reside na coragem de seus alunos. Complete as 7 sagas para se tornar um Mestre de Magia."</p>
           </div>
           <div className="pt-4 flex justify-center gap-4">
              <div className="text-center px-6 border-r border-white/10">
                 <p className="text-2xl font-heading text-primary">87%</p>
                 <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Completaram M1</p>
              </div>
              <div className="text-center px-6">
                 <p className="text-2xl font-heading text-primary">12%</p>
                 <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Alcançaram M7</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
