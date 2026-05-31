import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { useRealtime } from "@/hooks/core/useRealtime";
import HouseCrest from "@/components/rpg/HouseCrest";
import { House } from "@/types";

interface HouseScore {
  house: House;
  points: number;
  percentage: number;
  color: string;
  glow: string;
  icon: string;
  label: string;
}

const BASE_SCORES: HouseScore[] = [
  { house: 'gryffindor', points: 0, percentage: 0, color: 'bg-red-600', glow: 'shadow-[0_0_20px_rgba(220,38,38,0.4)]', icon: '🦁', label: 'Grifinória' },
  { house: 'slytherin',  points: 0, percentage: 0, color: 'bg-emerald-600', glow: 'shadow-[0_0_20px_rgba(5,150,105,0.4)]', icon: '🐍', label: 'Sonserina' },
  { house: 'ravenclaw',  points: 0, percentage: 0, color: 'bg-blue-600', glow: 'shadow-[0_0_20px_rgba(37,99,235,0.4)]', icon: '🦅', label: 'Corvinal' },
  { house: 'hufflepuff', points: 0, percentage: 0, color: 'bg-yellow-600', glow: 'shadow-[0_0_20px_rgba(202,138,4,0.4)]', icon: '🦡', label: 'Lufa-Lufa' },
];

export default function HouseCupWidget({ isLanding = false }: { isLanding?: boolean }) {
  const [scores, setScores] = useState<HouseScore[]>(BASE_SCORES);
  const [loading, setLoading] = useState(true);
  const [leader, setLeader] = useState<HouseScore | null>(null);

  const fetchScores = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('house, xp');
      if (error) throw error;

      const totals = data.reduce((acc: any, p) => {
        if (p.house) acc[p.house] = (acc[p.house] || 0) + (p.xp || 0);
        return acc;
      }, { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 });

      const allZeros = Object.values(totals).every(v => v === 0);
      
      if (allZeros) {
        const simulatedPoints = {
          gryffindor: 12450,
          slytherin: 11820,
          ravenclaw: 10950,
          hufflepuff: 9840
        };
        const maxSim = 12450;
        const simScores = BASE_SCORES.map(s => ({
          ...s,
          points: simulatedPoints[s.house as keyof typeof simulatedPoints],
          percentage: Math.round((simulatedPoints[s.house as keyof typeof simulatedPoints] / maxSim) * 100)
        }));
        setScores(simScores);
        setLeader(simScores[0]);
        setLoading(false);
        return;
      }

      const maxPoints = Math.max(...Object.values(totals) as number[]) || 1000;
      const newScores = BASE_SCORES.map(s => {
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
      setScores(BASE_SCORES.map(s => ({ ...s, points: 100, percentage: 30 })));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  useRealtime('profiles', '*', fetchScores);

  const leaderColor = leader?.house === 'slytherin' ? 'rgba(16, 185, 129, 0.4)' : leader?.house === 'gryffindor' ? 'rgba(220, 38, 38, 0.4)' : leader?.house === 'ravenclaw' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(217, 119, 6, 0.4)';

  return (
    <div className={`relative group ${isLanding ? 'max-w-4xl mx-auto' : 'w-full px-1 sm:px-2 py-2'}`}>
      {/* ── CINEMATIC AURA (THE "FACE" OF THE HOUSE) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] blur-[100px] opacity-15 transition-all duration-1000 animate-pulse-glow"
          style={{ backgroundColor: leaderColor }}
        />
      </div>

      {/* ── COMPACT MODE (default everywhere) ── */}
      <div className="relative z-10 glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-white/10 bg-gradient-to-br from-black/80 via-zinc-900/30 to-white/[0.03] shadow-[0_10px_30px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Leader badge */}
          <div className="shrink-0 flex items-center gap-2 sm:gap-3 pr-3 sm:pr-5 border-r border-white/10">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ backgroundColor: leaderColor }} />
              <div className="relative scale-75 sm:scale-90 origin-center">
                <HouseCrest house={leader?.house || 'gryffindor'} size="sm" />
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-[8px] font-heading text-yellow-500/80 uppercase tracking-[0.3em] font-bold leading-none mb-1">Liderando</p>
              <p className={`text-xs font-heading uppercase tracking-tight ${leader?.color.replace('bg-', 'text-')} font-bold leading-none`}>
                {leader?.label}
              </p>
            </div>
          </div>

          {/* Mini bars */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 min-w-0">
            {scores.map((s) => (
              <div key={s.house} className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm shrink-0" aria-hidden>{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-[9px] font-heading uppercase tracking-wider ${s.color.replace('bg-', 'text-')} font-bold truncate`}>{s.label.slice(0,3)}</span>
                    <span className="text-[9px] font-mono text-white/50 shrink-0">{s.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full ${s.color} transition-all duration-[2000ms] ease-out rounded-full`}
                      style={{ width: `${loading ? 0 : s.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trophy */}
          <div className="hidden md:flex shrink-0 w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/30 items-center justify-center">
            <Trophy size={14} className="text-yellow-400" />
          </div>
        </div>
      </div>

    </div>
  );
}
