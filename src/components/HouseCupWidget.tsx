import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Shield, Zap, Star, Sparkles } from "lucide-react";
import HouseCrest from "./HouseCrest";
import MagicalEmoji from "./MagicalEmoji";
import { House } from "@/lib/store";

interface HouseScore {
  house: House;
  points: number;
  percentage: number;
  color: string;
  glow: string;
  icon: string;
  label: string;
}

export default function HouseCupWidget({ isLanding = false }: { isLanding?: boolean }) {
  const [scores, setScores] = useState<HouseScore[]>([
    { house: 'gryffindor', points: 0, percentage: 0, color: 'bg-red-600', glow: 'shadow-[0_0_20px_rgba(220,38,38,0.4)]', icon: '🦁', label: 'Grifinória' },
    { house: 'slytherin',  points: 0, percentage: 0, color: 'bg-emerald-600', glow: 'shadow-[0_0_20px_rgba(5,150,105,0.4)]', icon: '🐍', label: 'Sonserina' },
    { house: 'ravenclaw',  points: 0, percentage: 0, color: 'bg-blue-600', glow: 'shadow-[0_0_20px_rgba(37,99,235,0.4)]', icon: '🦅', label: 'Corvinal' },
    { house: 'hufflepuff', points: 0, percentage: 0, color: 'bg-yellow-600', glow: 'shadow-[0_0_20px_rgba(202,138,4,0.4)]', icon: '🦡', label: 'Lufa-Lufa' },
  ]);
  const [loading, setLoading] = useState(true);
  const [leader, setLeader] = useState<HouseScore | null>(null);

  useEffect(() => {
    fetchScores();
    const sub = supabase.channel('house_points_updates')
      .on('postgres_changes', { event: '*', table: 'profiles' }, () => fetchScores())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchScores = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('house, xp');
      if (error) throw error;

      const totals = data.reduce((acc: any, p) => {
        if (p.house) acc[p.house] = (acc[p.house] || 0) + (p.xp || 0);
        return acc;
      }, { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 });

      const maxPoints = Math.max(...Object.values(totals) as number[]) || 1000;
      const newScores = scores.map(s => {
        const points = totals[s.house] || 0;
        return {
          ...s,
          points,
          percentage: Math.min(100, Math.round((points / maxPoints) * 100))
        };
      });

      setScores(newScores);
      const win = [...newScores].sort((a, b) => b.points - a.points)[0];
      setLeader(win);
      setLoading(false);
    } catch (e) {
      console.warn("Erro ao buscar pontos das casas:", e);
      // Fallback para simulação premium se falhar
      const sim = scores.map(s => ({ ...s, percentage: Math.floor(Math.random() * 40) + 30 }));
      setScores(sim);
      setLoading(false);
    }
  };

  const leaderColor = leader?.house === 'slytherin' ? 'rgba(16, 185, 129, 0.4)' : leader?.house === 'gryffindor' ? 'rgba(220, 38, 38, 0.4)' : leader?.house === 'ravenclaw' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(217, 119, 6, 0.4)';

  return (
    <div className={`relative group ${isLanding ? 'max-w-6xl mx-auto py-16' : 'w-full px-2 py-4'}`}>
      {/* ── CINEMATIC AURA (THE "FACE" OF THE HOUSE) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] blur-[120px] opacity-20 transition-all duration-1000 animate-pulse-glow"
          style={{ backgroundColor: leaderColor }}
        />
      </div>

      <div className={`relative z-10 glass rounded-[3rem] p-8 md:p-12 border border-white/10 bg-gradient-to-br from-black/90 via-zinc-900/40 to-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-700 ${isLanding ? 'hover:scale-[1.01]' : ''}`}>
        {/* Background Textures */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          
          {/* ── WINNING HOUSE SHOWCASE ── */}
          <div className="shrink-0 flex flex-col items-center gap-6 group/winner relative">
             {/* Intense Aura Circle */}
             <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl animate-pulse scale-150 opacity-50" style={{ backgroundColor: leaderColor }} />
                <div className="relative p-2 bg-gradient-to-br from-white/10 to-transparent rounded-[2.5rem] border border-white/20 shadow-2xl backdrop-blur-xl transition-transform duration-700 group-hover/winner:scale-110">
                  <HouseCrest house={leader?.house || 'gryffindor'} size="lg" />
                </div>
                {/* Floating Trophy Icon */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-zinc-900 border border-yellow-500/50 rounded-2xl flex items-center justify-center shadow-2xl animate-float-slow">
                  <Trophy size={20} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                </div>
             </div>

             <div className="text-center space-y-1">
                <p className="text-[10px] font-heading text-yellow-500 uppercase tracking-[0.4em] font-bold">Casa da Semana</p>
                <h3 className={`text-3xl font-heading uppercase tracking-tighter ${leader?.color.replace('bg-', 'text-')} drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]`}>
                  {leader?.label}
                </h3>
                <div className="flex flex-col items-center">
                  <p className="text-4xl font-heading text-white tracking-tighter">{leader?.points.toLocaleString('pt-BR')}</p>
                  <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest -mt-1">Pontos de Experiência</p>
                </div>
             </div>
          </div>

          {/* ── COMPETITION BARS ── */}
          <div className="flex-1 w-full space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scores.map((s) => (
                <div key={s.house} className="group/bar relative space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-4">
                      <MagicalEmoji icon={Shield} size="xs" glowColor={s.glow.split('rgba(')[1]?.split(')')[0] ? `rgba(${s.glow.split('rgba(')[1].split(')')[0]})` : undefined} />
                      <span className={`font-heading text-xs uppercase tracking-widest ${s.color.replace('bg-', 'text-')} font-bold`}>{s.label}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-mono text-white/60 block">{s.points.toLocaleString('pt-BR')} PTS</span>
                    </div>
                  </div>
                  
                  <div className="relative h-6 bg-black/60 rounded-xl overflow-hidden border border-white/5 p-[2px] shadow-2xl backdrop-blur-md">
                    <div 
                      className={`h-full ${s.color} transition-all duration-[2500ms] ease-out rounded-lg relative group-hover/bar:brightness-125`}
                      style={{ 
                        width: `${loading ? 0 : s.percentage}%`,
                        boxShadow: `0 0 20px ${s.color.replace('bg-', 'rgba(').replace('600', '0.2)')}` 
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                      
                      {/* Reflection Line */}
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Motivational Footer */}
            <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles size={16} className="text-primary animate-pulse" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-serif italic max-w-sm">
                    "Os pontos são atualizados em tempo real. A cada ação mágica no portal, sua casa se aproxima da glória eterna."
                  </p>
               </div>
               
               {!isLanding && (
                 <div className="flex items-center gap-3 bg-black/40 px-6 py-3 rounded-2xl border border-yellow-500/30 animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                    <Zap size={14} className="text-yellow-500" />
                    <span className="text-[10px] font-heading text-yellow-500 uppercase font-bold tracking-widest">Próximo Torneio em 32m</span>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
