import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, FileText, ClipboardList } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Position = { id: string; name: string; department: string; description: string | null; min_level: number; salary_galeons: number; icon: string };
type Law = { id: string; code: string; title: string; description: string; penalty: string | null };
type Mission = { id: string; title: string; description: string; department: string; difficulty: number; xp_reward: number; galeon_reward: number };

const DEPT_LABEL: Record<string, string> = {
  aurores: "Quartel-General dos Aurores",
  misterios: "Departamento de Mistérios",
  cooperacao: "Cooperação Mágica Internacional",
  transportes: "Transportes Mágicos",
  jogos: "Jogos e Esportes",
  controle_criaturas: "Controle de Criaturas Mágicas",
  justica: "Lei e Justiça Mágica",
};

export default function Ministry() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [laws, setLaws] = useState<Law[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [myJobs, setMyJobs] = useState<Set<string>>(new Set());
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  async function load() {
    const [{ data: p }, { data: l }, { data: m }, { data: { user } }] = await Promise.all([
      supabase.from("ministry_positions" as any).select("*").eq("active", true).order("min_level"),
      supabase.from("ministry_laws" as any).select("*").order("code"),
      supabase.from("ministry_missions" as any).select("*").eq("active", true).order("difficulty"),
      supabase.auth.getUser(),
    ]);
    setPositions((p as any) || []);
    setLaws((l as any) || []);
    setMissions((m as any) || []);
    if (user) {
      const { data: e } = await supabase.from("ministry_employees" as any).select("position_id").eq("user_id", user.id).eq("active", true);
      setMyJobs(new Set(((e as any) || []).map((x: any) => x.position_id)));
    }
  }
  useEffect(() => { load(); }, []);

  async function apply(id: string) {
    setLoading(true);
    const { error } = await supabase.rpc("apply_ministry_position" as any, { p_position_id: id });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Contratado! 🏛️");
    load();
  }

  async function doMission(id: string) {
    if (cooldowns[id] && Date.now() < cooldowns[id]) {
      return toast.error("Aguarde o tempo de cooldown para esta missão!");
    }
    
    setLoading(true);
    const { error } = await supabase.rpc("complete_ministry_mission" as any, { p_mission_id: id });
    setLoading(false);
    
    if (error) return toast.error(error.message);
    
    // Set 5 minute cooldown
    setCooldowns(prev => ({ ...prev, [id]: Date.now() + 5 * 60 * 1000 }));
    toast.success("Missão cumprida! ⚖️");
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="🏛️" /> Ministério da Magia</h1>
        <p className="text-muted-foreground">Sede do governo bruxo britânico. Sirva, legisle e proteja o mundo mágico.</p>
      </div>

      <Tabs defaultValue="cargos">
        <TabsList>
          <TabsTrigger value="cargos">Cargos</TabsTrigger>
          <TabsTrigger value="missoes">Missões</TabsTrigger>
          <TabsTrigger value="leis">Leis Bruxas</TabsTrigger>
        </TabsList>

        <TabsContent value="cargos" className="grid gap-4 md:grid-cols-2 mt-4">
          {positions.map((p) => (
            <Card key={p.id} className="p-4 bg-card/60 border-primary/20 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{p.icon}</div>
                  <div>
                    <h3 className="font-heading">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{DEPT_LABEL[p.department]}</p>
                  </div>
                </div>
                <Badge variant="outline">Nv. {p.min_level}+</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-primary">Salário: {p.salary_galeons} G/dia</span>
                {myJobs.has(p.id) ? (
                  <Badge className="bg-green-500/20 text-green-300">Contratado</Badge>
                ) : (
                  <Button size="sm" disabled={loading} onClick={() => apply(p.id)}>Candidatar-se</Button>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="missoes" className="grid gap-4 md:grid-cols-2 mt-4">
          {missions.map((m) => (
            <Card key={m.id} className="p-4 bg-card/60 border-primary/20 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading">{m.title}</h3>
                  <p className="text-xs text-muted-foreground">{DEPT_LABEL[m.department]}</p>
                </div>
                <Badge variant="outline">{"⭐".repeat(m.difficulty)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{m.description}</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-primary">+{m.xp_reward} XP · +{m.galeon_reward} G</span>
                <Button 
                  size="sm" 
                  disabled={loading} 
                  onClick={() => doMission(m.id)}
                  className="bg-primary/80 hover:bg-primary"
                >
                  {loading ? "Processando..." : "Cumprir Missão"}
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="leis" className="space-y-3 mt-4">
          {laws.map((l) => (
            <Card key={l.id} className="p-4 bg-card/60 border-primary/20">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge variant="outline" className="mb-1">{l.code}</Badge>
                  <h3 className="font-heading">{l.title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{l.description}</p>
              {l.penalty && <p className="text-xs text-destructive">⚖️ Pena: {l.penalty}</p>}
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}