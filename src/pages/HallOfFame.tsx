import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Crown, Sparkles } from "lucide-react";

interface HallRow {
  id: string;
  user_id: string;
  title: string;
  category: string;
  season: number;
  score: number;
  awarded_at: string;
  full_name?: string;
}

const categories = [
  { key: "all", label: "Todos" },
  { key: "triwizard", label: "Tribruxo" },
  { key: "duels", label: "Duelos" },
  { key: "global", label: "Glória Global" },
];

export default function HallOfFame() {
  const [rows, setRows] = useState<HallRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("hall_of_fame")
        .select("*")
        .order("awarded_at", { ascending: false })
        .limit(100);
      const hall = (data as HallRow[]) || [];
      if (hall.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", hall.map((h) => h.user_id));
        const map = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
        setRows(hall.map((h) => ({ ...h, full_name: map.get(h.user_id) || "Bruxo Lendário" })));
      }
      setLoading(false);
    })();
  }, []);

  const filtered = (cat: string) => cat === "all" ? rows : rows.filter((r) => r.category === cat);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl">Hall da Fama</h1>
          <p className="text-sm text-foreground/60">Os campeões cujos nomes foram gravados em ouro.</p>
        </div>
      </div>
      <Tabs defaultValue="all">
        <TabsList>
          {categories.map((c) => <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>)}
        </TabsList>
        {categories.map((c) => (
          <TabsContent key={c.key} value={c.key} className="mt-4">
            {loading ? (
              <p className="text-foreground/60">Polindo as placas...</p>
            ) : filtered(c.key).length === 0 ? (
              <Card className="border-dashed border-primary/30 bg-card/40">
                <CardContent className="flex flex-col items-center gap-2 py-12">
                  <Sparkles className="h-10 w-10 text-primary/60" />
                  <p className="text-foreground/60">Nenhum campeão coroado nesta categoria ainda.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filtered(c.key).map((r, idx) => (
                  <Card key={r.id} className={`border-primary/30 bg-card/60 relative overflow-hidden ${
                    idx === 0 ? "border-yellow-500/50 bg-yellow-500/5" : 
                    idx === 1 ? "border-gray-400/50 bg-gray-400/5" :
                    idx === 2 ? "border-amber-700/50 bg-amber-700/5" : ""
                  }`}>
                    {idx < 3 && (
                      <div className={`absolute top-0 right-0 p-2 ${
                        idx === 0 ? "text-yellow-500" :
                        idx === 1 ? "text-gray-400" :
                        "text-amber-700"
                      }`}>
                        <Crown className="w-4 h-4" />
                      </div>
                    )}
                    <CardHeader className="flex flex-row items-center gap-3">
                      <Award className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="font-heading text-lg">{r.title}</CardTitle>
                        <p className="text-xs text-foreground/60">{r.full_name} · Temporada {r.season}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="flex justify-between text-sm">
                      <span className="text-foreground/70">{new Date(r.awarded_at).toLocaleDateString("pt-BR")}</span>
                      <Badge>{r.score} pts</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}