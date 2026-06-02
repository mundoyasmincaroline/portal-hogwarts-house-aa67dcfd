import { useState, useEffect } from "react";
import { type House } from "@/types";
import { HOUSES } from "@/types/house";
import { supabase } from "@/integrations/supabase/client";
import HouseCrest from "@/components/rpg/HouseCrest";
import { Shield } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
const HOUSE_GRADIENTS: Record<string, { bg: string; border: string; bar: string }> = {
  gryffindor: { bg: "from-red-900/20 to-transparent",    border: "border-red-500/30",    bar: "bg-red-500" },
  slytherin:  { bg: "from-green-900/20 to-transparent",  border: "border-green-500/30",  bar: "bg-green-500" },
  ravenclaw:  { bg: "from-blue-900/20 to-transparent",   border: "border-blue-500/30",   bar: "bg-blue-500" },
  hufflepuff: { bg: "from-yellow-900/20 to-transparent", border: "border-yellow-500/30", bar: "bg-yellow-500" },
};

export default function Houses() {
  const [housePoints, setHousePoints] = useState<Record<string, number>>({});
  const [houseMemberCount, setHouseMemberCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Pontos das casas
    const { data: pts } = await supabase
      .from("house_points")
      .select("house, points");

    if (pts) {
      const totals: Record<string, number> = {};
      pts.forEach((row: any) => {
        totals[row.house] = (totals[row.house] || 0) + (row.points || 0);
      });
      setHousePoints(totals);
    }

    // Membros por casa
    const { data: members } = await supabase
      .from("profiles")
      .select("house")
      .eq("approved", true);

    if (members) {
      const counts: Record<string, number> = {};
      members.forEach((m: any) => {
        counts[m.house] = (counts[m.house] || 0) + 1;
      });
      setHouseMemberCount(counts);
    }

    setLoading(false);
  };

  const sortedHouses = Object.values(HOUSES).sort(
    (a, b) => (housePoints[b.id] || 0) - (housePoints[a.id] || 0)
  );
  const topHouse = sortedHouses[0];
  const maxPoints = Math.max(...sortedHouses.map(h => housePoints[h.id] || 0), 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-0">
      <div className="glass rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 text-center relative overflow-hidden group border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-50" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-full px-5 py-1.5 mb-2">
            <Shield size={14} className="text-primary animate-pulse" />
            <span className="text-[10px] font-heading uppercase tracking-[0.2em] text-primary">Ancestralidade & Glória</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-6xl text-gold-gradient tracking-tighter drop-shadow-lg">As Quatro Casas</h1>
          <p className="text-base sm:text-lg text-muted-foreground/80 font-serif italic max-w-xl mx-auto leading-relaxed">
            "Não é o que você escolhe, mas o que você é. Descubra o poder que reside na união com seus semelhantes."
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-3xl animate-bounce mb-3"><EmojiIcon e="🏰" /></div>
          <p className="text-muted-foreground animate-pulse">Consultando o Livro das Casas...</p>
        </div>
      ) : (
        <>
          {/* Casa líder */}
          {topHouse && (
            <div className={`glass rounded-2xl p-6 sm:p-8 text-center animate-pulse-glow border bg-gradient-to-br ${HOUSE_GRADIENTS[topHouse.id]?.bg} ${HOUSE_GRADIENTS[topHouse.id]?.border}`}>
              <p className="text-xs font-heading text-primary tracking-widest uppercase mb-3"><EmojiIcon e="🏆" /> Casa da Semana</p>
              <HouseCrest house={topHouse.id as House} size="lg" />
              <h2 className="font-heading text-2xl text-foreground mt-4">{topHouse.name}</h2>
              <p className="text-xs text-muted-foreground italic font-serif mt-1">"{topHouse.motto}"</p>
              <p className="font-heading text-3xl text-primary mt-3">
                {(housePoints[topHouse.id] || 0).toLocaleString("pt-BR")}
                <span className="text-sm text-muted-foreground ml-1">pontos</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{houseMemberCount[topHouse.id] || 0} membros</p>
            </div>
          )}

          {/* Todas as casas */}
          <div className="grid md:grid-cols-2 gap-4">
            {sortedHouses.map((house, i) => {
              const pts = housePoints[house.id] || 0;
              const count = houseMemberCount[house.id] || 0;
              const pct = Math.round((pts / maxPoints) * 100);
              const grad = HOUSE_GRADIENTS[house.id] || HOUSE_GRADIENTS.gryffindor;
              return (
                <div key={house.id}
                  className={`glass rounded-2xl p-5 sm:p-6 hover:scale-[1.01] transition-transform border bg-gradient-to-br ${grad.bg} ${grad.border}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <HouseCrest house={house.id as House} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg text-foreground">{house.name}</h3>
                        <span className="ml-auto text-xl font-heading text-primary">#{i + 1}</span>
                      </div>
                      <p className="text-xs text-muted-foreground italic font-serif">"{house.motto}"</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{house.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {house.traits.map((t) => (
                      <span key={t} className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">{t}</span>
                    ))}
                  </div>

                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{count} membros</span>
                    <span className="font-heading text-primary">{pts.toLocaleString("pt-BR")} pts</span>
                  </div>

                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${grad.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
