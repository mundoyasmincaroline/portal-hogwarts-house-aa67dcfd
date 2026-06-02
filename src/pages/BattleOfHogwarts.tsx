import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Swords, Skull } from "lucide-react";

interface Battle { id:string; name:string; status:string; voldemort_max_hp:number; voldemort_hp:number; }
interface Contribution { user_id:string; total_damage:number; attacks:number; full_name?:string; house?:string|null; }

export default function BattleOfHogwarts() {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [board, setBoard] = useState<Contribution[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: b } = await supabase.from("battle_of_hogwarts").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle();
    setBattle(b as Battle | null);
    if (b) {
      const { data: c } = await supabase.from("battle_contributions").select("*").eq("battle_id", (b as Battle).id).order("total_damage", { ascending: false }).limit(20);
      const rows = (c as Contribution[]) || [];
      if (rows.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name, house").in("user_id", rows.map((r) => r.user_id));
        const map = new Map((profs || []).map((p: any) => [p.user_id, p]));
        setBoard(rows.map((r) => ({ ...r, ...(map.get(r.user_id) || {}) })));
      } else { setBoard([]); }
    }
  };

  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id); }, []);

  const attack = async () => {
    if (!battle) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("attack_voldemort", { p_battle: battle.id, p_spell: "stupefy" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const r = data as any;
    toast.success(`Você causou ${r.damage} de dano!`);
    load();
  };

  if (!battle) return <div className="p-8 text-foreground/60">Nenhuma batalha em andamento.</div>;

  const pct = (battle.voldemort_hp / battle.voldemort_max_hp) * 100;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Swords className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl break-words">{battle.name}</h1>
          <p className="text-sm text-foreground/60">Evento global. Cada feitiço conta. Defenda Hogwarts.</p>
        </div>
      </div>

      <Card className="border-destructive/50 bg-card/60">
        <CardHeader className="flex flex-row items-center gap-3 flex-wrap">
          <Skull className="h-8 w-8 text-destructive" />
          <CardTitle className="font-heading flex-1 min-w-0">Lorde Voldemort</CardTitle>
          <Badge variant={battle.status === "active" ? "destructive" : "secondary"}>{battle.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={pct} className="h-4" />
          <p className="text-sm text-foreground/70">{Number(battle.voldemort_hp).toLocaleString()} / {Number(battle.voldemort_max_hp).toLocaleString()} HP</p>
          <Button variant="destructive" size="lg" disabled={busy || battle.status !== "active"} onClick={attack}>
            {battle.status === "active" ? "⚡ Atacar (cooldown 30s)" : "Batalha encerrada"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/40 bg-card/60">
        <CardHeader><CardTitle className="font-heading">Heróis da Batalha</CardTitle></CardHeader>
        <CardContent>
          {board.length === 0 ? (
            <p className="text-foreground/60">Ninguém atacou ainda. Seja o primeiro.</p>
          ) : (
            <ol className="space-y-2">
              {board.map((c, i) => (
                <li key={c.user_id} className="flex items-center gap-3 rounded-md border border-border/50 p-2">
                  <span className="w-8 text-center font-heading text-primary">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium">{c.full_name || "Bruxo Anônimo"}</p>
                    <p className="text-xs text-foreground/60">{c.house || "—"} · {c.attacks} ataques</p>
                  </div>
                  <Badge>{Number(c.total_damage).toLocaleString()} dano</Badge>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}