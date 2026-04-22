import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Image as ImageIcon, 
  Mic, 
  MoreVertical,
  MessageCircle,
  ArrowLeft,
  Flame,
  Heart,
  Sparkles,
  Camera
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SafeImage from "@/components/SafeImage";

/**
 * BFFChat: O "WhatsApp" exclusivo das BFFs dentro do portal.
 * Design premium, focado em Yasmin e Anita.
 */
const BFFChat: React.FC = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBFF = (profile?.username?.toLowerCase() || '').includes('yasmin') || 
                (profile?.username?.toLowerCase() || '').includes('anita') || 
                profile?.username === 'morpheus';

  useEffect(() => {
    if (!user || !isBFF) return;

    // Carregar mensagens do grupo BFF (simulado via canal de tempo real ou tabela dedicada)
    fetchMessages();

    const channel = supabase
      .channel('bff-group-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages' }, (payload) => {
        // No futuro, filtrar por group_id. Por enquanto, simulamos o grupo.
        if (payload.new.receiver_id === 'BFF_GROUP_ID') {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isBFF]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    // Busca mensagens enviadas para o ID especial do grupo
    const { data } = await supabase
      .from("dm_messages")
      .select("*, profiles:sender_id(full_name, avatar_url, username)")
      .eq("receiver_id", "BFF_GROUP_ID")
      .order("created_at", { ascending: true });
    
    if (data) setMessages(data);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    const { error } = await supabase.from("dm_messages").insert({
      sender_id: user.id,
      receiver_id: "BFF_GROUP_ID",
      content: newMessage,
      read: false
    });

    if (error) {
      toast.error("Erro ao enviar mensagem mágica.");
    } else {
      setNewMessage("");
      fetchMessages();
      // Incrementar streak se for a primeira do dia
      updateBFFStreak();
    }
    setLoading(false);
  };

  const updateBFFStreak = async () => {
    // Lógica para atualizar o Vínculo de Fogo do grupo
    // No futuro, isso afetaria uma tabela de 'group_friendships'
  };

  if (!isBFF) return null;

  return (
    <div className="flex flex-col h-[600px] md:h-[700px] bg-pink-950/5 backdrop-blur-xl border border-pink-500/20 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      {/* Header Estilo WhatsApp Premium */}
      <div className="p-6 bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-b border-pink-500/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
             <div className="w-12 h-12 rounded-full border-2 border-pink-500 p-0.5">
                <div className="w-full h-full rounded-full bg-pink-500/20 flex items-center justify-center overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400" className="w-full h-full object-cover" alt="BFF Group" />
                </div>
             </div>
             <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Heart size={10} className="text-white" fill="currentColor" />
             </div>
          </div>
          <div>
            <h3 className="font-heading text-lg text-pink-500 tracking-tight flex items-center gap-2">
              Grupo das BFFs <Sparkles size={14} />
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-pink-500/60 font-bold">Yasmin, Anita & Você</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              <Flame size={14} className="text-orange-500" fill="currentColor" />
              <span className="text-xs font-bold text-orange-500">12</span>
           </div>
           <Button variant="ghost" size="icon" className="text-pink-500 hover:bg-pink-500/10 rounded-full">
              <MoreVertical size={20} />
           </Button>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
             <div className="p-6 rounded-full bg-pink-500/10">
                <MessageCircle size={40} className="text-pink-500" />
             </div>
             <p className="text-sm text-pink-300 font-serif italic">"Onde os segredos mais mágicos são compartilhados..."</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex flex-col gap-1 max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="text-[10px] font-bold text-pink-500/60 ml-2 uppercase tracking-widest">
                      {msg.profiles?.full_name?.split(" ")[0]}
                    </span>
                  )}
                  <div className={`
                    p-4 rounded-2xl text-sm relative shadow-md
                    ${isMe 
                      ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-tr-none" 
                      : "bg-white/10 backdrop-blur-md text-pink-100 border border-pink-500/20 rounded-tl-none"}
                  `}>
                    {msg.content}
                    <span className={`text-[8px] opacity-50 block mt-2 ${isMe ? "text-right" : "text-left"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Barra de Entrada Estilo WhatsApp */}
      <div className="p-6 bg-pink-950/20 border-t border-pink-500/10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-white/5 p-2 rounded-3xl border border-pink-500/20 focus-within:border-pink-500/50 transition-all">
          <Button type="button" variant="ghost" size="icon" className="text-pink-400 hover:bg-pink-500/10 rounded-full shrink-0">
             <Camera size={20} />
          </Button>
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mande uma magia..."
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-pink-300/30"
          />
          <Button type="button" variant="ghost" size="icon" className="text-pink-400 hover:bg-pink-500/10 rounded-full shrink-0">
             <Mic size={20} />
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !newMessage.trim()}
            className="bg-pink-600 hover:bg-pink-500 text-white rounded-full w-10 h-10 p-0 shrink-0 shadow-lg shadow-pink-600/20"
          >
             <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BFFChat;
