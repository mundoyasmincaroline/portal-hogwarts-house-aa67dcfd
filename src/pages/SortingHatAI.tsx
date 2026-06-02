import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
      <header className="text-center">
        <h1 className="font-heading text-4xl text-primary">🎩 Chapéu Seletor</h1>
        <p className="text-muted-foreground mt-2 italic">
          "Não há nada escondido em sua cabeça que eu não veja..."
        </p>
      </header>

      <Card className="p-4 bg-card/60 border-primary/30 space-y-3 h-[60vh] overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/60 border border-primary/20 italic"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-muted-foreground italic text-sm animate-pulse">
            O Chapéu murmura...
          </div>
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