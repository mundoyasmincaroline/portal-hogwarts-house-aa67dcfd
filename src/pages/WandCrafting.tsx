import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const WOODS = [
  { id: "azevinho", desc: "Madeira nobre — ataque equilibrado" },
  { id: "teixo", desc: "Madeira sombria — ataque devastador" },
  { id: "carvalho", desc: "Robusta e confiável" },
  { id: "salgueiro", desc: "Flexível, para magia curativa" },
  { id: "videira", desc: "Para bruxos de propósito elevado" },
];
const CORES = [
  { id: "pena de fênix", desc: "Rara, equilíbrio entre ataque e defesa" },
  { id: "pelo de unicórnio", desc: "Pura, alta defesa" },
  { id: "corda de coração de dragão", desc: "Poderosa, máximo ataque" },
  { id: "crina de thestral", desc: "Sombria, agilidade e mistério" },
];
const FLEXES = ["rígida", "flexível", "balanceada"];

export default function WandCrafting() {
  const { user } = useAuth();
  const [wand, setWand] = useState<any>(null);
  const [wood, setWood] = useState(WOODS[0].id);
  const [core, setCore] = useState(CORES[0].id);
  const [length, setLength] = useState(11);
  const [flex, setFlex] = useState("flexível");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("wands").select("*").eq("user_id", user.id).maybeSingle();
    if (data) {
      setWand(data);
      setWood(data.wood); setCore(data.core); setLength(Number(data.length_inches)); setFlex(data.flexibility);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const craft = async () => {
    setBusy(true);
    const { data, error } = await (supabase as any).rpc("craft_wand", { p_wood: wood, p_core: core, p_length: length, p_flex: flex });
    setBusy(false);
    if (error) toast.error(error.message);
    else { setWand(data); toast.success("🪄 Sua varinha foi forjada!"); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="font-heading text-3xl text-primary">🪄 Olivaras — Forja de Varinhas</h1>
        <p className="text-foreground/70 font-serif italic">A varinha escolhe o bruxo, mas você pode guiá-la.</p>
      </header>

      {wand && (
        <Card className="p-4 bg-primary/10 border-primary/40 space-y-2">
          <h2 className="font-heading text-primary text-xl">Sua varinha atual</h2>
          <p className="text-sm">{wand.length_inches}" de <strong>{wand.wood}</strong> com núcleo de <strong>{wand.core}</strong>, {wand.flexibility}</p>
          <div className="flex gap-3 text-xs flex-wrap">
            <span className="text-red-400">⚔ +{wand.bonus_attack} Ataque</span>
            <span className="text-blue-400">🛡 +{wand.bonus_defense} Defesa</span>
            <span className="text-yellow-400">⚡ +{wand.bonus_speed} Velocidade</span>
          </div>
        </Card>
      )}

      <Card className="p-4 bg-card/60 border-primary/30 space-y-4">
        <Section label="Madeira">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {WOODS.map(w => (
              <Option key={w.id} active={wood === w.id} onClick={() => setWood(w.id)} title={w.id} desc={w.desc} />
            ))}
          </div>
        </Section>
        <Section label="Núcleo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CORES.map(c => (
              <Option key={c.id} active={core === c.id} onClick={() => setCore(c.id)} title={c.id} desc={c.desc} />
            ))}
          </div>
        </Section>
        <Section label={`Comprimento: ${length}"`}>
          <input type="range" min={9} max={15} step={0.5} value={length} onChange={e => setLength(Number(e.target.value))} className="w-full accent-primary" />
          <div className="text-xs text-foreground/60">Mais curtas = mais ágeis · Mais longas = mais imponentes</div>
        </Section>
        <Section label="Flexibilidade">
          <div className="flex gap-2 flex-wrap">
            {FLEXES.map(f => (
              <button key={f} onClick={() => setFlex(f)} className={`px-3 py-2 rounded-full text-xs border ${flex === f ? "bg-primary/20 border-primary text-primary" : "bg-background/70 border-primary/30 text-foreground"}`}>{f}</button>
            ))}
          </div>
        </Section>
        <Button onClick={craft} disabled={busy} className="w-full" variant="magical">
          {wand ? "🔄 Reforjar Varinha" : "🪄 Forjar Varinha"}
        </Button>
      </Card>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-heading text-xs uppercase tracking-widest text-primary mb-2">{label}</div>
      {children}
    </div>
  );
}

function Option({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-xl border text-left transition-all ${active ? "bg-primary/15 border-primary" : "bg-background/60 border-primary/20 hover:border-primary/50"}`}>
      <div className="font-heading text-sm capitalize">{title}</div>
      <div className="text-[10px] text-foreground/60">{desc}</div>
    </button>
  );
}