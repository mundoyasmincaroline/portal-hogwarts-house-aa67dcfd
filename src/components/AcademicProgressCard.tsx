import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { GraduationCap, Sparkles } from "lucide-react";

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  charm: { label: "Feitiços", icon: "✨" },
  transfiguration: { label: "Transfiguração", icon: "🦊" },
  curse: { label: "Maldições", icon: "💀" },
  jinx: { label: "Azarações", icon: "⚡" },
  hex: { label: "Bruxarias", icon: "🌀" },
  defense: { label: "Defesa", icon: "🛡️" },
  healing: { label: "Curas", icon: "💚" },
  potion: { label: "Poções", icon: "🧪" },
};

const NOM_GRADE = (avg: number) => {
  if (avg >= 4.5) return { letter: "O", label: "Ótimo", color: "text-emerald-400" };
  if (avg >= 3.5) return { letter: "E", label: "Excede Expectativas", color: "text-primary" };
  if (avg >= 2.5) return { letter: "A", label: "Aceitável", color: "text-blue-400" };
  if (avg >= 1.5) return { letter: "P", label: "Péssimo", color: "text-orange-400" };
  return { letter: "T", label: "Trasgo", color: "text-red-400" };
};

interface Row {
  category: string;
  count: number;
  avgMastery: number;
}

export default function AcademicProgressCard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_spells")
        .select("mastery_level, spell:spells(category)")
        .eq("user_id", user.id);
      const grouped: Record<string, { count: number; sum: number }> = {};
      let totalCount = 0;
      (data ?? []).forEach((row: any) => {
        const cat = row.spell?.category ?? "charm";
        if (!grouped[cat]) grouped[cat] = { count: 0, sum: 0 };
        grouped[cat].count += 1;
        grouped[cat].sum += row.mastery_level ?? 1;
        totalCount += 1;
      });
      const arr: Row[] = Object.entries(grouped).map(([category, v]) => ({
        category,
        count: v.count,
        avgMastery: v.sum / v.count,
      }));
      arr.sort((a, b) => b.avgMastery - a.avgMastery);
      setRows(arr);
      setTotal(totalCount);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/10 text-center text-xs text-muted-foreground">
        Consultando seu boletim N.O.M's…
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl sm:rounded-[2rem] p-6 border border-primary/20 bg-gradient-to-br from-amber-950/10 via-black to-black space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg text-gold-gradient leading-tight">Boletim N.O.M's</h3>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {total} feitiço{total === 1 ? "" : "s"} aprendido{total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-6 text-sm font-serif italic text-muted-foreground">
          Sua ficha acadêmica está em branco. Participe de uma aula canon para aprender seu primeiro feitiço.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const grade = NOM_GRADE(r.avgMastery);
            const meta = CATEGORY_LABELS[r.category] ?? { label: r.category, icon: "📖" };
            return (
              <li
                key={r.category}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:border-primary/30 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">{meta.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-heading text-white truncate">{meta.label}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {r.count} feitiço{r.count === 1 ? "" : "s"} · maestria {r.avgMastery.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className={`text-right ${grade.color}`}>
                  <p className="font-heading text-2xl leading-none">{grade.letter}</p>
                  <p className="text-[8px] uppercase tracking-widest opacity-70">{grade.label}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground border-t border-white/5 pt-3">
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="italic">Ganhe maestria participando das aulas canon.</span>
      </div>
    </div>
  );
}