import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Msg = { role: "user" | "assistant"; content: string };

export default function SortingHatAI() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hmm... interessante. Aproxima-te, jovem bruxo. Antes que eu te coloque numa casa, conta-me: o que mais te move — coragem, lealdade, sabedoria ou ambição? E por quê?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("magical-ai", {
      body: { mode: "sorting_hat", messages: next },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Falha mágica");
      return;
    }
    setMessages([...next, { role: "assistant", content: (data as any).content }]);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4 relative overflow-hidden">
      <header className="text-center relative z-10">
        <motion.div 
          animate={{ 
            rotate: [0, -5, 5, 0],
            y: [0, -10, 0]
          }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="inline-block mb-4"
        >
          <EmojiIcon e="🎩" />
        </motion.div>
        <h1 className="font-heading text-4xl text-primary">Chapéu Seletor</h1>
        <p className="text-muted-foreground mt-2 italic">
          "Não há nada escondido em sua cabeça que eu não veja..."
        </p>
      </header>

      <Card className="p-6 bg-black/40 backdrop-blur-xl border-primary/20 space-y-4 h-[65vh] overflow-y-auto custom-scrollbar relative shadow-2xl rounded-[2.5rem]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
        <AnimatePresence mode="popLayout">
          {messages.map((m, i) => (
            <motion.div
              initial={{ opacity: 0, x: m.role === "user" ? 20 : -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} relative z-10`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-xl ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground font-heading text-sm"
                    : "bg-[#1a1a1a] border border-primary/20 italic font-serif text-foreground/90 leading-relaxed text-base"
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-primary/60 italic text-xs animate-pulse flex items-center gap-2 font-heading tracking-widest pl-2"
          >
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
            O Chapéu murmura pensamentos...
          </motion.div>
        )}
        <div ref={endRef} />
      </Card>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Responda ao Chapéu..."
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()}>
          Enviar
        </Button>
      </div>
    </div>
  );
}