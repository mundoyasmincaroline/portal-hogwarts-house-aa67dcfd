import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Skull } from "lucide-react";

interface Faction { id:string; slug:string; name:string; alignment:string; description:string|null; motto:string|null; hq_name:string|null; }
interface UserFaction { user_id:string; faction_id:string; rank:string; loyalty:number; }
interface Mission { id:string; faction_id:string; name:string; briefing:string|null; difficulty:number; xp_reward:number; galleon_reward:number; loyalty_reward:number; }

export default function Factions() {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [membership, setMembership] = useState<UserFaction | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    const [{ data: f }, { data: m }] = await Promise.all([
      supabase.from("factions").select("*").order("alignment"),
      uid ? supabase.from("user_factions").select("*").eq("user_id", uid).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setFactions((f as Faction[]) || []);
    setMembership((m as UserFaction) || null);
    if (m && uid) {
      const { data: ms } = await supabase.from("faction_missions").select("*").eq("faction_id", (m as UserFaction).faction_id).order("difficulty");
      setMissions((ms as Mission[]) || []);
      const { data: done } = await supabase.from("user_faction_missions").select("mission_id").eq("user_id", uid);
      setCompleted(new Set((done || []).map((x: any) => x.mission_id)));
    } else {
      setMissions([]);
    }
  };

  useEffect(() => { load(); }, []);

  const join = async (slug: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("join_faction", { p_faction: slug });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Você jurou lealdade.");
    load();
  };

  const complete = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("complete_mission", { p_mission: id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Missão cumprida!");
    load();
  };

  const currentFaction = factions.find((f) => f.id === membership?.faction_id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Facções da Guerra Bruxa</h1>
        <p className="text-sm text-foreground/60">Escolha um lado. Sua lealdade definirá seu destino.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {factions.map((f) => {
          const isMine = membership?.faction_id === f.id;
          const dark = f.alignment === "dark";
          return (
            <Card key={f.id} className={`border-2 ${dark ? "border-destructive/50" : "border-primary/50"} bg-card/60`}>
              <CardHeader className="flex flex-row items-center gap-3">
                {dark ? <Skull className="h-8 w-8 text-destructive" /> : <Shield className="h-8 w-8 text-primary" />}
                <div>
                  <CardTitle className="font-heading">{f.name}</CardTitle>
                  <p className="text-xs italic text-foreground/60">"{f.motto}"</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground/70">{f.description}</p>
                <p className="text-xs text-foreground/60">QG: {f.hq_name}</p>
                {isMine ? (
                  <Badge variant="secondary">Membro · {membership?.rank} · {membership?.loyalty} lealdade</Badge>
                ) : (
                  <Button disabled={busy} variant={dark ? "destructive" : "default"} onClick={() => join(f.slug)}>
                    {membership ? "Trocar de Facção" : "Juntar-se"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {currentFaction && (
        <div>
          <h2 className="font-heading text-xl mb-3">Quartel-General · {currentFaction.hq_name}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {missions.map((m) => {
              const done = completed.has(m.id);
              return (
                <Card key={m.id} className="border-border/50 bg-card/60">
                  <CardHeader><CardTitle className="font-heading text-base">{m.name}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-foreground/70">{m.briefing}</p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <Badge variant="outline">Dif. {m.difficulty}</Badge>
                      <Badge variant="outline">+{m.xp_reward} XP</Badge>
                      <Badge variant="outline">+{m.galleon_reward}G</Badge>
                      <Badge variant="outline">+{m.loyalty_reward} lealdade</Badge>
                    </div>
                    <Button disabled={busy || done} size="sm" className="w-full" onClick={() => complete(m.id)}>
                      {done ? "Concluída" : "Executar Missão"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}