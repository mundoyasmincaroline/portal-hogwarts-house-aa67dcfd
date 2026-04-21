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
    const channel = supabase
      .channel(`dm_${[user.id, partnerId].sort().join("_")}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "dm_messages",
      }, (payload) => {
        const msg = payload.new as DM;
        const relevant =
          (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
          (msg.sender_id === partnerId && msg.receiver_id === user.id);
        if (relevant) {
          setMessages(prev => [...prev, msg]);
          // mark as read if we received it
          if (msg.receiver_id === user.id) {
            supabase.from("dm_messages").update({ read: true } as never).eq("id", msg.id);
          }
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
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto bg-black/40 backdrop-blur-3xl rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative animate-in fade-in zoom-in duration-1000">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      
      {/* Header - MONSTER QUALITY */}
      <div className="relative z-10 p-6 md:p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate("/dashboard/dm")} 
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-xl group"
          >
            <ArrowLeft size={18} className="text-white/40 group-hover:text-white transition-colors" />
          </button>
          
          {partner && (
            <div className="flex items-center gap-5">
              <div className="relative group/av">
                <div className="absolute -inset-1 rounded-full bg-primary/20 blur-md opacity-0 group-hover/av:opacity-100 transition-opacity" />
                <div className="relative z-10 w-14 h-14 rounded-full border border-white/10 overflow-hidden shadow-2xl">
                  <SafeImage
                    src={partner.avatar_url}
                    alt={partner.full_name}
                    fallbackText={partner.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full z-20 shadow-lg" />
              </div>
              <div>
                <h2 className="font-heading text-lg text-white tracking-tight leading-none mb-1">{partner.full_name}</h2>
                <p className="text-[10px] font-heading text-white/20 uppercase tracking-[0.2em]">Bruxo Ativo • @{partner.username}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages - MONSTER QUALITY */}
      <div className="relative z-10 flex-1 overflow-y-auto px-8 py-8 space-y-6 scroll-smooth custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
             <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin" />
             <p className="text-[10px] font-heading text-white uppercase tracking-[0.5em]">Buscando Pergaminhos...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
             <div className="w-24 h-24 bg-white/5 rounded-full border border-white/5 flex items-center justify-center">
                <span className="text-5xl animate-float">🦉</span>
             </div>
             <div>
                <p className="text-[10px] font-heading text-white uppercase tracking-[0.5em]">O silêncio do Corujal...</p>
                <p className="text-[9px] font-heading text-white/40 uppercase tracking-[0.3em] mt-2">Envie uma coruja e comece a conversa.</p>
             </div>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, msgs]) => (
            <div key={date} className="space-y-6">
              <div className="flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] font-heading text-white/20 uppercase tracking-[0.4em]">{date}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              
              {msgs.map(m => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                    <div
                      className={`relative group max-w-[80%] md:max-w-[70%] px-6 py-4 rounded-[2rem] shadow-2xl transition-all duration-500 ${
                        isMe
                          ? "bg-primary text-white rounded-br-lg shadow-[0_15px_30px_rgba(251,191,36,0.2)]"
                          : "bg-white/[0.03] border border-white/5 text-white/90 rounded-bl-lg hover:bg-white/[0.05] hover:border-white/10"
                      }`}
                    >
                      {/* Inner Shine */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none rounded-[2rem]" />
                      
                      <p className="relative z-10 text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap font-serif italic">
                        {m.content}
                      </p>
                      
                      <div className={`relative z-10 flex items-center justify-end gap-2 mt-2 opacity-40 group-hover:opacity-100 transition-opacity`}>
                        <span className="text-[9px] font-heading uppercase tracking-widest">
                          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-bold">
                            {m.read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input - MONSTER QUALITY */}
      <div className="relative z-20 p-8 border-t border-white/5 bg-gradient-to-t from-black/80 to-transparent shrink-0">
        <div className="max-w-2xl mx-auto flex gap-4 items-end">
          <div className="flex-1 relative group/input">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-1000" />
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Sussurre seu segredo..."
              rows={1}
              className="w-full relative z-10 bg-black/60 backdrop-blur-2xl border border-white/5 focus:border-primary/40 rounded-[2rem] px-8 py-5 text-base text-white placeholder:text-white/20 focus:outline-none transition-all shadow-inner font-serif italic resize-none max-h-32 leading-relaxed"
              style={{ minHeight: "64px" }}
              disabled={sending}
            />
          </div>
          
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center relative z-10 shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 shrink-0 ${
              !text.trim() || sending ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed' : 'bg-primary text-white shadow-[0_15px_30px_rgba(251,191,36,0.3)]'
            }`}
          >
            {sending ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={24} className="drop-shadow-lg" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
