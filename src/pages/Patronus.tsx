import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import EmojiIcon from "@/components/shared/EmojiIcon";
const ANIMALS = ["Cervo", "Lebre", "Lontra", "Raposa", "Lobo", "Coruja", "Lince", "Pantera", "Águia", "Cisne", "Cavalo", "Golfinho"];

export default function Patronus() {
  const { user } = useAuth();
  const [pat, setPat] = useState<any>(null);
  const [discovering, setDiscovering] = useState(false);
  const [chosenAnimal, setChosenAnimal] = useState(ANIMALS[0]);
  const [bar, setBar] = useState(0);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const dirRef = useRef(1);
  const rafRef = useRef<number | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("patronuses").select("*").eq("user_id", user.id).maybeSingle();
    setPat(data);
    const { data: h } = await (supabase as any).from("patronus_invocations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    setHistory(h || []);
  };
  useEffect(() => { load(); }, [user?.id]);

  const discover = async () => {
    if (!user) return;
    setDiscovering(true);
    const { error } = await (supabase as any).from("patronuses").insert({ user_id: user.id, animal: chosenAnimal });
    setDiscovering(false);
    if (error) toast.error(error.message); else { toast.success(`🦌 Seu patrono é ${chosenAnimal}!`); load(); }
  };

  const startMiniGame = () => {
    setRunning(true);
    setBar(0);
    dirRef.current = 1;
    const tick = () => {
      setBar(prev => {
        let v = prev + dirRef.current * 2;
        if (v >= 100) { v = 100; dirRef.current = -1; }
        else if (v <= 0) { v = 0; dirRef.current = 1; }
        return v;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopAndInvoke = async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRunning(false);
    // Convert distance from target (sweet spot 70-90) into focus score
    const focus = bar >= 65 && bar <= 95 ? Math.round(60 + (bar - 65) * 1.3) : Math.max(10, 60 - Math.abs(80 - bar));
    const { data, error } = await (supabase as any).rpc("invoke_patronus", { p_focus: focus });
    if (error) toast.error(error.message);
    else {
      if (data?.success) toast.success(`✨ Expecto Patronum! Força corpórea: ${data.strength}`);
      else toast.error("O patrono falhou em se materializar… concentre-se mais!");
      load();
    }
  };

  if (!pat) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-6">
        <header className="text-center">
          <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="✨" /> Descubra seu Patrono</h1>
          <p className="text-foreground/70 font-serif italic mt-2">Pense em sua memória mais feliz…</p>
        </header>
        <Card className="p-4 bg-card/60 border-primary/30 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {ANIMALS.map(a => (
              <button key={a} onClick={() => setChosenAnimal(a)} className={`p-3 rounded-xl border text-sm ${chosenAnimal === a ? "bg-primary/20 border-primary text-primary" : "bg-background/60 border-primary/20 hover:border-primary/50"}`}>{a}</button>
            ))}
          </div>
          <Button onClick={discover} disabled={discovering} className="w-full" variant="magical">Expecto Patronum!</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent opacity-30" />
      </div>

      <header className="relative z-10">
        <h1 className="font-heading text-3xl text-primary flex items-center gap-2">
          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 3 }}>✨</motion.span>
          Seu Patrono: {pat.animal}
        </h1>
        <p className="text-foreground/70 font-serif italic">Maestria nv {pat.mastery_level} · Força corpórea {pat.form_strength}/100</p>
      </header>

      <Card className="p-5 bg-card/60 border-primary/30 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary mb-1">Força corpórea</div>
          <Progress value={pat.form_strength} />
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-widest text-primary">Mini-game: pare a barra na zona dourada (65-95)</div>
          <div className="relative h-8 bg-background/50 rounded-full overflow-hidden border border-primary/30">
            <div className="absolute top-0 bottom-0 bg-yellow-400/30 border-x border-yellow-400/60" style={{ left: "65%", width: "30%" }} />
            <div className="absolute top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(212,175,55,0.8)] transition-none" style={{ left: `${bar}%` }} />
          </div>
          {!running ? (
            <Button onClick={startMiniGame} className="w-full" variant="magical"><EmojiIcon e="🪄" /> Iniciar invocação</Button>
          ) : (
            <Button onClick={stopAndInvoke} className="w-full" variant="default"><EmojiIcon e="⚡" /> Parar agora!</Button>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-primary/20">
        <h3 className="font-heading text-primary text-sm uppercase tracking-widest mb-2">Histórico</h3>
        <ul className="space-y-1 text-sm">
          {history.map(h => (
            <li key={h.id} className="flex justify-between">
              <span className={h.success ? "text-green-400" : "text-red-400"}>{h.success ? "✓ Sucesso" : "✗ Falhou"}</span>
              <span className="text-foreground/60 text-xs">{new Date(h.created_at).toLocaleString("pt-BR")} · {h.strength}</span>
            </li>
          ))}
          {history.length === 0 && <li className="text-foreground/50 text-xs">Nenhuma invocação ainda.</li>}
        </ul>
      </Card>
    </div>
  );
}