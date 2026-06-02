import MagicalEmoji from "@/components/shared/MagicalEmoji";
import { useNavigate } from "react-router-dom";

interface ChallengesSidebarProps {
  activeChallenges: any[];
}

export function ChallengesSidebar({ activeChallenges }: ChallengesSidebarProps) {
  const navigate = useNavigate();
  return (
    <div className="glass rounded-[2rem] p-7 border-white/5 bg-gradient-to-tr from-primary/10 via-transparent to-transparent shadow-2xl overflow-hidden relative group/challenges">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] group-hover/challenges:bg-primary/10 transition-colors" />
      <h3 className="font-heading text-xs uppercase tracking-[0.3em] text-primary/60 mb-6 flex items-center gap-3 relative z-10">
        <span className="w-8 h-[1px] bg-primary/20" />
        Desafios Ativos
      </h3>
      <div className="space-y-4 relative z-10 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {activeChallenges.length === 0 && (
          <p className="text-[10px] text-muted-foreground uppercase text-center py-6 tracking-[0.4em] opacity-30">Vazio por enquanto</p>
        )}
        {activeChallenges.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate("/dashboard/challenges")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") navigate("/dashboard/challenges"); }}
            className="group/item relative glass rounded-2xl p-5 border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer overflow-hidden hover:-translate-y-1"
          >
            <div className="absolute inset-y-0 left-0 w-[2px] bg-primary opacity-0 group-hover/item:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform">
                 <MagicalEmoji emoji={c.type === 'daily' ? '⚡' : '🔥'} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">{c.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.type === "daily" ? "Diário" : "Semanal"}</span>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] text-primary font-bold">{c.xp_reward} XP</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
