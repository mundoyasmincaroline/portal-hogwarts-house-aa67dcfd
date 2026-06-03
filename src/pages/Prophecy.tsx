import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import EmojiIcon from "@/components/shared/EmojiIcon";
import { motion, AnimatePresence } from "framer-motion";
interface Prophecy { id: string; prompt: string | null; prophecy_text: string; symbol: string | null; created_at: string; }

export default function ProphecyPage() {
  const { user, profile } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [list, setList] = useState<Prophecy[]>([]);

  useEffect(() => { load(); }, [user?.id]);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("prophecies" as any).select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setList((data as any[]) || []);
  }

  async function generate() {
    if (!user || generating) return;
    setGenerating(true);
    try {
      const ctx = `O bruxo se chama ${profile?.full_name || "Desconhecido"}, da casa ${profile?.house || "?"}, nível ${profile?.level || 1}.${prompt.trim() ? " Pediu insight sobre: " + prompt.trim() : ""}`;
      const { data, error } = await supabase.functions.invoke("magical-ai", {
        body: {
          mode: "prophecy",
          messages: [{ role: "user", content: ctx }],
        },
      });
      if (error) throw error;
      const text = (data as any)?.content || "";
      if (!text) throw new Error("Profecia vazia");
      const symbol = (text.match(/[🔮⚡🌙✨🦉]/u)?.[0]) || "🔮";
      await supabase.from("prophecies" as any).insert({
        user_id: user.id, prompt: prompt.trim() || null, prophecy_text: text, symbol,
      });
      setPrompt("");
      toast.success("Uma nova profecia surgiu...");
      load();
    } catch (e: any) {
      toast.error(e.message || "O Oráculo está em silêncio");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <div className="text-5xl animate-float"><EmojiIcon e="🔮" /></div>
        <h1 className="font-heading text-3xl sm:text-4xl text-gold-gradient">Sala das Profecias</h1>
        <p className="text-muted-foreground text-sm italic">Pergunte ao Oráculo. Mas cuidado — toda profecia tem um preço.</p>
      </header>

      <Card className="p-6 border-primary/30 bg-gradient-to-br from-purple-950/40 via-card to-blue-950/40 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
        <label className="block text-xs uppercase tracking-widest text-primary mb-2 font-heading">Sobre o que deseja saber?</label>
        <Input value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Ex: meu destino no Quadribol, amizades, viagem... (opcional)"
          maxLength={200} disabled={generating}/>
        <Button variant="magical" size="lg" className="w-full mt-4" onClick={generate} disabled={generating}>
          {generating ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="flex items-center"
            >
              <EmojiIcon e="🔮" className="mr-2" /> Consultando esferas...
            </motion.div>
          ) : (
            <><Sparkles className="mr-2" size={18}/> Invocar Profecia</>
          )}
        </Button>
      </Card>

      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex justify-center py-8"
          >
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-spin-slow" />
              <div className="absolute inset-0 flex items-center justify-center text-6xl">🔮</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {list.map(p => (
          <Card key={p.id} className="p-6 border-primary/20 bg-gradient-to-br from-card to-purple-950/10">
            <div className="flex items-start gap-4">
              <div className="text-4xl animate-pulse drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]">{p.symbol || "🔮"}</div>
              <div className="flex-1 min-w-0">
                {p.prompt && <p className="text-xs text-muted-foreground italic mb-2">Sobre: "{p.prompt}"</p>}
                <p className="font-serif text-base text-foreground/95 whitespace-pre-wrap leading-relaxed italic">{p.prophecy_text}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-3 font-mono">
                  {format(new Date(p.created_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </Card>
        ))}
        {list.length === 0 && (
          <div className="text-center py-12 text-muted-foreground italic text-sm">
            Nenhuma profecia ainda. As esferas estão paradas...
          </div>
        )}
      </div>
    </div>
  );
}