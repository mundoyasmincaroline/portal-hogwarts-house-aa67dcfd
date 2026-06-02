import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { toast } from "sonner";

interface DM {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export default function DMChat() {
  const { userId: partnerId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<DM[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load partner profile
  useEffect(() => {
    if (!partnerId) return;
    supabase.from("profiles").select("*").eq("user_id", partnerId).single()
      .then(({ data }) => { if (data) setPartner(data); });
  }, [partnerId]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!user || !partnerId) return;
    const { data } = await supabase
      .from("dm_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
    setLoading(false);

    // Mark unread as read
    await supabase
      .from("dm_messages")
      .update({ read: true } as never)
      .eq("sender_id", partnerId!)
      .eq("receiver_id", user.id)
      .eq("read", false);
  }, [user, partnerId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !partnerId) return;
    const channelId = `dm_${[user.id, partnerId].sort().join("_")}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "dm_messages",
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new as DM;
        if (msg.sender_id !== partnerId) return;
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        if (!msg.read) {
          supabase.from("dm_messages").update({ read: true } as never).eq("id", msg.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, partnerId]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !user || !partnerId || sending) return;
    setSending(true);
    const { error } = await supabase.from("dm_messages").insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: text.trim(),
    } as never);
    setSending(false);
    if (error) { toast.error("Erro ao enviar mensagem"); return; }
    setText("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const groupedByDate = messages.reduce((acc, m) => {
    const date = new Date(m.created_at).toLocaleDateString("pt-BR");
    if (!acc[date]) acc[date] = [];
    acc[date].push(m);
    return acc;
  }, {} as Record<string, DM[]>);

  return (
    <div
      className="flex flex-col max-w-xl mx-auto px-1 sm:px-0"
      style={{
        height: 'calc(100dvh - 80px)',
        paddingBottom: 'max(80px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Header */}
      <div className="glass rounded-[1.5rem] sm:rounded-2xl p-2 sm:p-4 mb-3 flex items-center gap-3 shrink-0 border-white/5">
        <button onClick={() => navigate("/dashboard/dm")} className="touch-target w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-muted-foreground hover:text-primary transition-all">
          <ArrowLeft size={20} />
        </button>
        {partner && (
          <>
            <SafeImage
              src={partner.avatar_url}
              alt={partner.full_name}
              fallbackText={partner.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-heading text-sm text-foreground">{partner.full_name}</p>
              <p className="text-xs text-muted-foreground">@{partner.username}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 px-1 pb-2">
        {loading ? (
          <p className="text-center text-muted-foreground py-10 text-sm">Buscando penas e pergaminhos...</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🦉</div>
            <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda.<br />Seja o primeiro a escrever!</p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[10px] text-muted-foreground px-2">{date}</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              {msgs.map(m => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "glass rounded-bl-sm text-foreground"
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap">{m.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {isMe && <span className="ml-1">{m.read ? " ✓✓" : " ✓"}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass rounded-[1.5rem] sm:rounded-2xl p-2 sm:p-3 flex items-end gap-2 shrink-0 mt-1 mb-2 border-white/10 shadow-2xl">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escreva uma mensagem..."
          rows={1}
          className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none max-h-32 leading-relaxed py-1"
          style={{ minHeight: "36px", maxHeight: "120px" }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
