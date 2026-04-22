import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Film, 
  Utensils, 
  Users, 
  Check, 
  Flame, 
  Sparkles,
  ArrowRight,
  Heart,
  Star
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MagicalEmoji from "@/components/MagicalEmoji";

/**
 * FamilyDecisions: O Cálice das Decisões Familiares.
 * Um espaço para Morpheus, Carol e Yasmin decidirem o futuro da semana.
 */
const FamilyDecisions: React.FC = () => {
  const { profile, user } = useAuth();
  const [votes, setVotes] = useState({
    movie: { 'Divertida Mente 2': 0, 'Harry Potter': 0, 'Deadpool & Wolverine': 0 },
    food: { 'Pizza': 0, 'Churrasco': 0, 'Massa da Carol': 0 }
  });
  const [voted, setVoted] = useState({ movie: false, food: false });

  // Somente a família nuclear tem acesso ao Cálice
  const isFamily = (profile?.username?.toLowerCase() || '').includes('yasmin') || 
                   (profile?.username?.toLowerCase() || '').includes('carol') || 
                   profile?.username === 'morpheus';

  const handleVote = (category: 'movie' | 'food', option: string) => {
    if (voted[category]) {
      toast.error("Você já lançou seu voto neste pergaminho!");
      return;
    }

    setVotes(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [option]: prev[category][option as keyof typeof prev.movie] + 1
      }
    }));
    setVoted(prev => ({ ...prev, [category]: true }));
    toast.success(`Voto para "${option}" registrado no Cálice! ✨`);
  };

  if (!isFamily) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="glass p-10 rounded-[2rem] border-2 border-amber-600/30 max-w-md animate-pulse">
          <Trophy className="text-amber-600 mx-auto mb-4" size={40} />
          <h1 className="font-heading text-3xl text-amber-600 mb-2">CÁLICE PROTEGIDO</h1>
          <p className="text-muted-foreground font-serif italic text-sm">
            "Apenas os membros da Família Real podem participar das grandes decisões."
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header do Cálice */}
      <div className="glass rounded-[2.5rem] p-10 text-center relative overflow-hidden border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-black">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2070')] bg-cover bg-center opacity-10 mix-blend-overlay animate-pulse-slow"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex justify-center mb-2">
             <div className="relative">
                <div className="absolute inset-[-20px] bg-amber-500/20 rounded-full blur-[40px] animate-pulse" />
                <Trophy size={60} className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
             </div>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-gold-gradient drop-shadow-lg">Cálice das Decisões</h1>
          <p className="text-amber-200/60 max-w-xl mx-auto font-serif italic">
            "Três chamas, um destino. Que a vontade da família prevaleça."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Votação de Filme */}
        <DecisionCard 
          title="Filme da Semana" 
          icon={<Film className="text-blue-400" />} 
          options={Object.keys(votes.movie)}
          voteCounts={votes.movie}
          hasVoted={voted.movie}
          onVote={(opt) => handleVote('movie', opt)}
          color="blue"
        />

        {/* Votação de Comida */}
        <DecisionCard 
          title="Cardápio de Domingo" 
          icon={<Utensils className="text-red-400" />} 
          options={Object.keys(votes.food)}
          voteCounts={votes.food}
          hasVoted={voted.food}
          onVote={(opt) => handleVote('food', opt)}
          color="red"
        />
      </div>

      {/* Decretos de União (Metas) */}
      <div className="glass rounded-[2rem] border-purple-500/20 p-8 bg-purple-950/5">
        <h2 className="font-heading text-2xl text-purple-400 mb-6 flex items-center gap-3">
          <Sparkles size={24} /> Decretos de União
        </h2>
        <div className="space-y-4">
          {[
            { goal: "Viagem de Férias 2026", progress: 40, status: "Economizando galeões" },
            { goal: "Noite de Jogos da Família", progress: 100, status: "Confirmado para Sábado" },
            { goal: "Reforma do Mundo BFF", progress: 75, status: "Quase pronto!" },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-black/40 border border-purple-900/20 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-heading text-purple-200">{item.goal}</span>
                <span className="text-[10px] text-purple-400 font-bold uppercase">{item.status}</span>
              </div>
              <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-purple-900/20">
                <div 
                  className="h-full bg-gradient-to-r from-purple-900 to-purple-400" 
                  style={{ width: `${item.progress}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Sugestão das Assistentes */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 glass p-6 rounded-2xl border-pink-500/20 bg-pink-950/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-pink-500 overflow-hidden shrink-0">
               <img src="/emma_portrait_bff_1776883285893.png" className="w-full h-full object-cover" alt="Emma" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">Sugestão da Emma</p>
               <p className="text-xs text-pink-200/70 italic">"Yasmin quer muito ver o Harry Potter de novo!"</p>
            </div>
         </div>
         <div className="flex-1 glass p-6 rounded-2xl border-amber-500/20 bg-amber-950/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500 overflow-hidden shrink-0">
               <img src="/helo_portrait_friend_1776883301801.png" className="w-full h-full object-cover" alt="Helô" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Sugestão da Helô</p>
               <p className="text-xs text-amber-200/70 italic">"Carol está com vontade de uma massa caprichada!"</p>
            </div>
         </div>
      </div>
    </div>
  );
};

const DecisionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  options: string[];
  voteCounts: Record<string, number>;
  hasVoted: boolean;
  onVote: (opt: string) => void;
  color: 'blue' | 'red';
}> = ({ title, icon, options, voteCounts, hasVoted, onVote, color }) => {
  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
  
  return (
    <div className={`glass rounded-[2rem] p-8 border-${color}-500/20 bg-${color}-950/5 flex flex-col gap-6`}>
      <h2 className={`font-heading text-2xl text-${color}-400 flex items-center gap-3`}>
        {icon} {title}
      </h2>
      <div className="space-y-4">
        {options.map((opt) => {
          const count = voteCounts[opt];
          const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          
          return (
            <button
              key={opt}
              disabled={hasVoted}
              onClick={() => onVote(opt)}
              className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                hasVoted 
                  ? "bg-black/40 border-white/5 cursor-default" 
                  : `bg-black/60 border-${color}-900/30 hover:border-${color}-500/50 hover:scale-[1.02]`
              }`}
            >
              {hasVoted && (
                <div 
                  className={`absolute inset-0 bg-${color}-500/10 transition-all duration-1000`} 
                  style={{ width: `${percent}%` }}
                />
              )}
              <div className="relative z-10 flex justify-between items-center">
                <span className={`font-heading text-sm ${hasVoted ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                  {opt}
                </span>
                {hasVoted && (
                  <span className={`text-[10px] font-bold text-${color}-400`}>
                    {percent.toFixed(0)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {!hasVoted && (
        <p className="text-[10px] text-muted-foreground text-center italic">
          "Escolha com sabedoria, seu voto brilha no cálice."
        </p>
      )}
    </div>
  );
};

export default FamilyDecisions;
