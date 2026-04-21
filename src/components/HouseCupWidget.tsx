import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Shield, Zap, Star, Sparkles } from "lucide-react";
import HouseCrest from "./HouseCrest";
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

  return (
    <div className={`relative group ${isLanding ? 'max-w-5xl mx-auto py-10' : 'w-full'}`}>
      {/* Container Principal Cinematic */}
      <div className={`glass rounded-[2.5rem] p-6 md:p-8 border border-white/10 bg-gradient-to-br from-black/80 via-black/40 to-amber-900/10 shadow-2xl relative overflow-hidden transition-all duration-700 ${isLanding ? 'hover:scale-[1.02]' : ''}`}>
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
          
          {/* Título e Ícone */}
          <div className="flex flex-col items-center lg:items-start gap-2 shrink-0 group/trophy">
            <div className="relative">
                <Trophy size={48} className="text-yellow-500 animate-float drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-transform group-hover/trophy:scale-110" />
                <Sparkles className="absolute -top-1 -right-1 text-white animate-pulse" size={16} />
            </div>
            <div className="text-center lg:text-left">
                <h2 className="font-heading text-2xl text-gold-gradient uppercase tracking-widest leading-none">Taça das Casas</h2>
                <p className="text-[10px] text-muted-foreground font-bold tracking-[0.3em] uppercase mt-1">Torneio de Hogwarts</p>
            </div>
          </div>

          {/* Barras 3D Impactantes */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-6">
            {scores.map((s) => (
              <div key={s.house} className="flex flex-col gap-2 group/bar">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{s.icon}</span>
                    <span className={`font-heading text-[10px] uppercase tracking-wider ${s.color.replace('bg-', 'text-')}`}>{s.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">{s.points} pts</span>
                </div>
                
                {/* Progress Bar 3D */}
                <div className="relative h-4 bg-black/60 rounded-full overflow-hidden border border-white/5 p-[2px] shadow-inner">
                  <div 
                    className={`h-full ${s.color} ${s.glow} transition-all duration-[2000ms] ease-out rounded-full relative overflow-hidden`}
                    style={{ width: `${loading ? 0 : s.percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    
                    {/* Glowing Tip */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white blur-sm opacity-50" />
                  </div>
                </div>
                
                {/* XP Animation on Hover */}
                <div className="h-0 group-hover/bar:h-4 overflow-hidden transition-all duration-300 opacity-0 group-hover/bar:opacity-100 flex justify-center">
                    <span className={`text-[9px] font-bold ${s.color.replace('bg-', 'text-')} animate-bounce`}>+ ATUALIZANDO</span>
                </div>
              </div>
            ))}
          </div>

          {/* Líder Atual Cinematic */}
          <div className="shrink-0 flex flex-col items-center lg:items-end text-center lg:text-right gap-3 pl-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0">
            <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block mb-1">Destaque do Castelo</span>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`absolute inset-0 blur-xl ${leader?.glow.replace('shadow-', 'bg-')} opacity-20`} />
                        <span className="text-3xl relative">{leader?.icon}</span>
                    </div>
                    <div>
                        <p className={`font-heading text-lg ${leader?.color.replace('bg-', 'text-')} animate-pulse`}>{leader?.label}</p>
                        <p className="text-[9px] text-white/40 font-mono">Liderando com {leader?.points} pontos</p>
                    </div>
                </div>
            </div>
            
            {!isLanding && (
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 animate-in fade-in slide-in-from-right-4 duration-1000 delay-500">
                    <Zap size={10} className="text-yellow-500" />
                    <span className="text-[9px] font-bold text-white/60 uppercase">Próximo Evento em 32:45</span>
                </div>
            )}
          </div>
        </div>

        {/* Floating Particles Decoration */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
}
