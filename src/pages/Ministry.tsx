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
  const [searchQuery, setSearchQuery] = useState("");
  const [reportStatus, setReportStatus] = useState<any[]>([]);

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
      
      const { data: reports } = await supabase.from("support_tickets" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setReportStatus(reports || []);
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
    load();
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="🏛️" /> Ministério da Magia</h1>
        <p className="text-muted-foreground">Sede do governo bruxo britânico. Sirva, legisle e proteja o mundo mágico.</p>
      </div>

      <Tabs defaultValue="cargos">
        <TabsList className="bg-background/40 border border-primary/20">
          <TabsTrigger value="cargos">Cargos</TabsTrigger>
          <TabsTrigger value="missoes">Missões</TabsTrigger>
          <TabsTrigger value="leis">Decretos e Leis</TabsTrigger>
          <TabsTrigger value="status">Status de Solicitações</TabsTrigger>
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

        <TabsContent value="leis" className="space-y-4 mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar Decretos e Leis..." 
              className="pl-10 bg-background/50 border-primary/20 focus:border-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="space-y-3">
            {laws
              .filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.code.toLowerCase().includes(searchQuery.toLowerCase()) || l.description.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((l) => (
              <Card key={l.id} className="p-4 bg-card/60 border-primary/20 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    <div>
                      <Badge variant="outline" className="mb-1 text-[10px]">{l.code}</Badge>
                      <h3 className="font-heading">{l.title}</h3>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{l.description}</p>
                {l.penalty && <p className="text-xs text-destructive border-t border-destructive/10 pt-2 mt-2 font-serif italic">Pena: {l.penalty}</p>}
              </Card>
            ))}
            {laws.length === 0 && <p className="text-center text-muted-foreground italic">Nenhuma lei registrada.</p>}
          </div>
        </TabsContent>

        <TabsContent value="status" className="mt-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={20} className="text-primary" />
            <h2 className="font-heading text-xl">Acompanhamento de Solicitações</h2>
          </div>
          <p className="text-sm text-muted-foreground">Veja o status de seus requerimentos, denúncias e solicitações ao Ministério.</p>
          
          <div className="space-y-3">
            {reportStatus.map((r) => (
              <Card key={r.id} className="p-4 bg-card/40 border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === 'open' ? 'destructive' : r.status === 'in_progress' ? 'secondary' : 'default'}>
                      {r.status === 'open' ? 'Pendente' : r.status === 'in_progress' ? 'Em Análise' : 'Concluído'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Protocolo: #{r.id.slice(0, 8)}</span>
                  </div>
                  <h4 className="font-heading text-sm">{r.subject}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] hover:bg-primary/10" disabled title="Em breve">Ver Detalhes</Button>
                </div>
              </Card>
            ))}
            {reportStatus.length === 0 && (
              <div className="text-center py-10 glass rounded-xl border-dashed border-white/10">
                <p className="text-muted-foreground text-sm italic">Você não possui solicitações pendentes.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}