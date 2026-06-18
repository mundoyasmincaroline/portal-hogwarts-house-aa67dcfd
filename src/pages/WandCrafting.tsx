import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import EmojiIcon from "@/components/shared/EmojiIcon";
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
    if (!profile || profile.galeons < 50) {
      toast.error("Você precisa de 50 Galeões para forjar (ou reforjar) uma varinha!");
      return;
    }
    setBusy(true);
    const { data, error } = await (supabase as any).rpc("craft_wand", { p_wood: wood, p_core: core, p_length: length, p_flex: flex });
    if (error) {
      setBusy(false);
      toast.error(error.message);
    } else { 
      // Gacha reveal animation
      setTimeout(() => {
        setWand(data); 
        setBusy(false);
        const isGodRoll = data.bonus_attack >= 15 || data.bonus_defense >= 15 || data.bonus_speed >= 15;
        if (isGodRoll) toast.success("🌟 STATUS LENDÁRIO! Você forjou uma varinha excepcionalmente poderosa!", { duration: 5000 });
        else toast.success("🪄 Sua varinha foi forjada com sucesso!"); 
      }, 2000); // 2 second suspense
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="🪄" /> Olivaras — Forja de Varinhas</h1>
        <p className="text-foreground/70 font-serif italic">A varinha escolhe o bruxo, mas você pode guiá-la.</p>
      </header>

      <div className="flex justify-center py-8">
        <motion.div 
          animate={{ rotate: busy ? [0, -5, 5, 0] : [0, 2, -2, 0] }}
          transition={{ repeat: Infinity, duration: busy ? 0.2 : 4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 group-hover:bg-primary/30 transition-colors" />
          <div 
            className="h-3 bg-amber-900 rounded-full relative z-10 shadow-2xl overflow-hidden"
            style={{ 
              backgroundColor: wood === 'teixo' ? '#2d2d2d' : wood === 'azevinho' ? '#5d4037' : '#8d6e63',
              width: `${Number(length) * 20}px`,
              filter: busy ? 'brightness(1.5)' : 'none'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          {busy && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: [0, 1, 0] }} 
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="absolute -inset-4 border-2 border-primary/50 rounded-full z-20"
            />
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {wand && !busy && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <Card className="p-4 bg-primary/10 border-primary/40 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-20"><EmojiIcon e="✨" /></div>
              <h2 className="font-heading text-primary text-xl">Sua varinha atual</h2>
              <p className="text-sm capitalize">{wand.length_inches}" de <strong>{wand.wood}</strong> com núcleo de <strong>{wand.core}</strong>, {wand.flexibility}</p>
              <div className="flex gap-3 text-xs flex-wrap mt-2">
                <StatBadge icon="⚔" label="Ataque" val={wand.bonus_attack} color="text-red-400" />
                <StatBadge icon="🛡" label="Defesa" val={wand.bonus_defense} color="text-blue-400" />
                <StatBadge icon="⚡" label="Velocidade" val={wand.bonus_speed} color="text-yellow-400" />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
        <div className="flex justify-center mb-4">
          <div className="bg-amber-900/20 text-amber-500 font-heading text-sm px-4 py-2 rounded-full flex items-center gap-2 border border-amber-500/20">
            Custo da Forja: <strong>50</strong> <EmojiIcon e="🪙" />
          </div>
        </div>

        <Button onClick={craft} disabled={busy} className="w-full relative overflow-hidden group" variant="magical">
          <span className="relative z-10">{wand ? "🔄 Reforjar Atributos (Gacha)" : "🪄 Forjar Varinha"}</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
        </Button>
      </Card>
    </div>
  );
}

function StatBadge({ icon, label, val, color }: any) {
  const isEpic = val >= 15;
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded border ${isEpic ? 'bg-primary/20 border-primary shadow-[0_0_10px_rgba(212,175,55,0.4)] animate-pulse' : 'bg-black/20 border-white/10'}`}>
      <span className={color}>{icon}</span>
      <span className="text-foreground/80">{label}:</span>
      <strong className={isEpic ? 'text-primary text-sm' : 'text-foreground'}>+{val}</strong>
      {isEpic && <span className="text-primary text-[10px] ml-1 uppercase">Épico</span>}
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