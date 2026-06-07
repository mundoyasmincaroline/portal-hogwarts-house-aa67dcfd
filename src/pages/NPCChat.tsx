import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Msg { role: "user" | "assistant"; content: string; }
interface NPC { id: string; slug: string; name: string; avatar_emoji: string | null; system_prompt: string; role: string; }

export default function NPCChat() {
  const { slug } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [npc, setNpc] = useState<NPC | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, [slug, user?.id]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function load() {
    if (!slug || !user) return;
    const { data: npcData } = await supabase.from("npcs" as any).select("*").eq("slug", slug).maybeSingle();
    if (!npcData) { toast.error("Personagem não encontrado"); nav("/dashboard/npcs"); return; }
    setNpc(npcData as any);
    const { data: conv } = await supabase.from("npc_conversations" as any)
      .select("messages").eq("user_id", user.id).eq("npc_id", (npcData as any).id).maybeSingle();
    setMessages(((conv as any)?.messages as Msg[]) || []);
  }

  async function send(messageOverride?: string) {
    const content = (messageOverride ?? input).trim();
    if (!content || !npc || !user || sending) return;
    const userMsg: Msg = { role: "user", content };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setShowStarters(false);
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("magical-ai", {
        body: {
          mode: "npc_custom",
          systemPrompt: npc.system_prompt,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "Falha ao falar com a IA");
      const reply = (data as any)?.content || "...";
      const final = [...newMsgs, { role: "assistant" as const, content: reply }];
      setMessages(final);
      await supabase.from("npc_conversations" as any).upsert({
        user_id: user.id, npc_id: npc.id, messages: final,
      }, { onConflict: "user_id,npc_id" });
    } catch (e: any) {
      toast.error(e.message || "Falha ao falar com a IA");
      setMessages(messages);
    } finally {
      setSending(false);
    }
  }

  if (!npc) return <div className="text-center p-12">Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100dvh-14rem)] sm:h-[calc(100dvh-12rem)] flex flex-col">
      <Card className="p-4 mb-3 flex items-center gap-3 border-primary/30">
        <Button variant="ghost" size="icon" onClick={() => nav("/dashboard/npcs")}><ArrowLeft size={18}/></Button>
        <div className="text-4xl">{npc.avatar_emoji || "🧙"}</div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-lg text-foreground leading-tight">{npc.name}</h2>
          <p className="text-[11px] text-primary/70 uppercase tracking-wider">{npc.role}</p>
        </div>
      </Card>

      <Card className="flex-1 p-4 overflow-y-auto border-primary/20" ref={scrollRef as any}>
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground italic text-sm">
            {npc.avatar_emoji} olha para você, esperando sua primeira palavra.
          </div>
        )}
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-primary/20 text-foreground border border-primary/30"
                  : "bg-card/80 text-foreground/90 border border-border"
              }`}>
                {m.role === "assistant" && <div className="text-xs text-primary mb-1 font-heading">{npc.avatar_emoji} {npc.name}</div>}
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-card/80 border border-border rounded-2xl px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="animate-spin" size={14}/> pensando...
              </div>
            </div>
          )}
        </div>
      </Card>

      {showStarters && messages.length === 0 && npc && (
        <div className="flex flex-wrap gap-2 mb-3">
          {["Olá!", "Quem é você?", "Me conte um segredo.", "Como está o castelo?"].map((s) => (
            <Button key={s} variant="outline" size="sm" className="text-[10px] rounded-full h-7 px-3" onClick={() => send(s)} disabled={sending}>
              {s}
            </Button>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={`Diga algo para ${npc.name}...`}
          disabled={sending}/>
        <Button onClick={send} disabled={sending || !input.trim()} variant="magical"><Send size={16}/></Button>
      </div>
    </div>
  );
}