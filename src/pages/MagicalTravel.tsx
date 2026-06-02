import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Loc = { id: string; name: string; region: string; icon: string; danger_level: number; min_level: number; travel_cost: number };
type Trip = { id: string; location_id: string; method: string; success: boolean; traveled_at: string; notes: string | null };

const METHODS = [
  { value: "floo", label: "Pó de Flu", icon: "🔥", desc: "Lareira a lareira. Pouco risco (8%)." },
  { value: "apparate", label: "Aparatação", icon: "💫", desc: "Instantânea, mas arriscada (15-40%)." },
  { value: "portkey", label: "Chave de Portal", icon: "🗝️", desc: "Objeto encantado. Muito seguro (5%)." },
  { value: "broom", label: "Vassoura", icon: "🧹", desc: "Voar é mágico, mas cansativo." },
  { value: "thestral", label: "Testrálio", icon: "🦄", desc: "Só visto por quem viu a morte." },
];

export default function MagicalTravel() {
  const [params] = useSearchParams();
  const [locs, setLocs] = useState<Loc[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [dest, setDest] = useState<string>(params.get("to") || "");
  const [method, setMethod] = useState<string>("floo");
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data: l } = await supabase.from("world_locations" as any).select("*").eq("discoverable", true).order("min_level");
    setLocs((l as any) || []);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: t } = await supabase.from("user_travels" as any).select("*").eq("user_id", user.id).order("traveled_at", { ascending: false }).limit(15);
      setTrips((t as any) || []);
    }
  }
  useEffect(() => { load(); }, []);

  async function travel() {
    if (!dest) return toast.error("Escolha um destino");
    setLoading(true);
    const { data, error } = await supabase.rpc("travel_to" as any, { p_location_id: dest, p_method: method });
    setLoading(false);
    if (error) return toast.error(error.message);
    const d = data as any;
    if (d?.success) toast.success(`Chegou em ${d.location}! ✨`);
    else toast.error("A viagem falhou! 💥");
    load();
  }

  const selected = locs.find((l) => l.id === dest);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="✈️" /> Viagens Mágicas</h1>
        <p className="text-muted-foreground">Escolha um destino e um método de transporte.</p>
      </div>

      <Card className="p-6 space-y-4 bg-card/60 border-primary/30">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Destino</label>
          <Select value={dest} onValueChange={setDest}>
            <SelectTrigger><SelectValue placeholder="Escolha um local" /></SelectTrigger>
            <SelectContent>
              {locs.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.icon} {l.name} — {l.region} ({l.travel_cost} G)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selected && (
          <div className="flex gap-2 text-xs">
            <Badge variant="outline">Nv. {selected.min_level}+</Badge>
            <Badge variant="outline" className="border-destructive/50">Perigo {selected.danger_level}/5</Badge>
            <Badge variant="outline" className="border-primary/50">Custo {selected.travel_cost} G</Badge>
          </div>
        )}

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Método de Viagem</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`p-3 rounded-lg border-2 transition text-center ${method === m.value ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/40"}`}
              >
                <div className="text-2xl">{m.icon}</div>
                <div className="text-xs font-heading mt-1">{m.label}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{METHODS.find((m) => m.value === method)?.desc}</p>
        </div>

        <Button onClick={travel} disabled={loading || !dest} className="w-full" size="lg">
          <EmojiIcon e="✨" /> Iniciar Viagem
        </Button>
      </Card>

      <Card className="p-4 bg-card/60 border-primary/20">
        <h2 className="font-heading mb-3"><EmojiIcon e="📜" /> Histórico Recente</h2>
        {trips.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma viagem ainda.</p>
        ) : (
          <div className="space-y-2">
            {trips.map((t) => {
              const l = locs.find((x) => x.id === t.location_id);
              const m = METHODS.find((x) => x.value === t.method);
              return (
                <div key={t.id} className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                  <div>
                    <span className="mr-2">{l?.icon || "📍"}</span>
                    <span>{l?.name || "?"}</span>
                    <span className="text-xs text-muted-foreground ml-2">{m?.icon} {m?.label}</span>
                  </div>
                  <div className="text-xs">
                    {t.success ? <span className="text-green-400"><EmojiIcon e="✓" /> Sucesso</span> : <span className="text-destructive"><EmojiIcon e="💥" /> Falhou</span>}
                    <span className="text-muted-foreground ml-2">{new Date(t.traveled_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}