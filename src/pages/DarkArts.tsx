import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Skull, Flame } from "lucide-react";

interface DarkSpell { id:string; slug:string; name:string; description:string|null; corruption_cost:number; xp_reward:number; unforgivable:boolean; level_req:number; }
interface Corruption { user_id:string; corruption:number; alignment:string; }
interface Horcrux { id:string; vessel_name:string; description:string|null; destroyed:boolean; created_at:string; }

export default function DarkArts() {
  const [spells, setSpells] = useState<DarkSpell[]>([]);
  const [corruption, setCorruption] = useState<Corruption | null>(null);
  const [horcruxes, setHorcruxes] = useState<Horcrux[]>([]);
  const [vessel, setVessel] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    const [{ data: s }, { data: c }, { data: h }] = await Promise.all([
      supabase.from("dark_spells").select("*").order("corruption_cost"),
      uid ? supabase.from("user_corruption").select("*").eq("user_id", uid).maybeSingle() : Promise.resolve({ data: null }),
      uid ? supabase.from("horcruxes").select("*").eq("user_id", uid).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    setSpells((s as DarkSpell[]) || []);
    setCorruption((c as Corruption) || { user_id: uid || "", corruption: 0, alignment: "neutro" });
    setHorcruxes((h as Horcrux[]) || []);
  };

  useEffect(() => { load(); }, []);

  const cast = async (slug: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("cast_dark_spell", { p_spell: slug });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("As trevas respondem ao seu chamado...");
    load();
  };

  const createHorcrux = async () => {
    if (!vessel.trim()) { toast.error("Nomeie o receptáculo"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("create_horcrux", { p_vessel: vessel, p_description: desc });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Sua alma foi fragmentada...");
    setVessel(""); setDesc(""); load();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Skull className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl">Artes das Trevas</h1>
          <p className="text-sm text-foreground/60">Praticar essas artes corrompe a alma. RP ficcional, com consequências narrativas.</p>
        </div>
      </div>

      <Card className="border-primary/40 bg-card/60">
        <CardHeader><CardTitle className="font-heading">Nível de Corrupção</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Progress value={corruption?.corruption || 0} className="h-3" />
          <p className="text-sm text-foreground/70">{corruption?.corruption || 0}/100 · Alinhamento: <Badge variant="secondary">{corruption?.alignment || "neutro"}</Badge></p>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-heading text-xl mb-3">Grimório Proibido</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {spells.map((s) => (
            <Card key={s.id} className={`border ${s.unforgivable ? "border-destructive/60" : "border-border/50"} bg-card/60`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <Flame className="h-4 w-4 text-orange-400" /> {s.name}
                  {s.unforgivable && <Badge variant="destructive">Imperdoável</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-foreground/70">{s.description}</p>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">+{s.corruption_cost} corrupção</Badge>
                  <Badge variant="outline">+{s.xp_reward} XP</Badge>
                </div>
                <Button variant="destructive" disabled={busy} className="w-full" onClick={() => cast(s.slug)}>Conjurar</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading text-xl mb-3">Horcruxes (requer corrupção ≥ 30)</h2>
        <Card className="border-destructive/40 bg-card/60">
          <CardContent className="space-y-3 pt-6">
            <Input placeholder="Nome do receptáculo (ex: Diário negro)" value={vessel} onChange={(e) => setVessel(e.target.value)} />
            <Textarea placeholder="Descrição do objeto..." value={desc} onChange={(e) => setDesc(e.target.value)} />
            <Button variant="destructive" disabled={busy} onClick={createHorcrux}>Fragmentar a Alma</Button>
          </CardContent>
        </Card>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {horcruxes.map((h) => (
            <Card key={h.id} className="border-border/50 bg-card/60">
              <CardHeader><CardTitle className="font-heading text-base">{h.vessel_name}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-foreground/60">{h.description}</p>
                {h.destroyed && <Badge variant="destructive" className="mt-2">Destruída</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}