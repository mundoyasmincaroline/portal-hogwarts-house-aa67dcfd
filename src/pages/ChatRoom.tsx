import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import { House } from "@/lib/store";

interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    username: string;
    house: House;
    avatar_url: string | null;
    role: string;
  };
}

export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Buscar palavras proibidas
    supabase.from("banned_words").select("word").then(({ data }) => {
      if (data) setBannedWords(data.map(d => d.word.toLowerCase()));
    });
  }, []);

  useEffect(() => {
    if (!roomId) {
      navigate("/dashboard/chats");
      return;
    }
    fetchChannel();
  }, [roomId]);

  const fetchChannel = async () => {
    const { data, error } = await supabase.from("channels").select("*").eq("id", roomId).single();
    if (error || !data) {
      toast.error("Sala não encontrada ou você não tem acesso.");
      navigate("/dashboard/chats");
      return;
    }
    setChannel(data);
    fetchMessages(data.id);
  };

  const fetchMessages = async (id: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*, profiles(full_name, username, house, avatar_url, role)")
      .eq("channel_id", id)
      .order("created_at", { ascending: true })
      .limit(100);
    
    if (data) setMessages(data as unknown as Message[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!channel?.id) return;
    
    const subscription = supabase
      .channel(`messages:${channel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channel.id}` }, async (payload) => {
        const { data: userData } = await supabase.from("profiles").select("full_name, username, house, avatar_url, role").eq("user_id", payload.new.user_id).single();
        if (userData) {
          setMessages(prev => [...prev, { ...payload.new, profiles: userData } as Message]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !channel || !user) return;
    
    const content = input;
    
    // Verificação de moderação
    const lowerContent = content.toLowerCase();
    const hasBannedWord = bannedWords.some(word => lowerContent.includes(word));
    if (hasBannedWord) {
      toast.error("Sua mensagem contém palavras inapropriadas pelas leis de magia e foi bloqueada!");
      return;
    }

    setInput("");

    const { error } = await supabase.from("messages").insert({
      channel_id: channel.id,
      user_id: user.id,
      content
    });

    if (error) {
      toast.error("Erro ao enviar mensagem.");
      setInput(content);
    }
  };

  if (loading || !channel) return <div className="text-center py-20 text-muted-foreground">Abrindo as portas do salão...</div>;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col glass rounded-2xl overflow-hidden border border-border">
      {/* Header da Sala */}
      <div className="p-4 border-b border-border bg-card/50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/chats")} className="shrink-0">
          ⬅️
        </Button>
        <div>
          <h2 className="font-heading text-xl text-gold-gradient">{channel.name}</h2>
          <p className="text-xs text-muted-foreground">{channel.description}</p>
        </div>
      </div>

      {/* Integração Meet / Jitsi / Vídeo */}
      {channel.meet_link && (
        <div className="bg-black/90 border-b border-border h-[250px] sm:h-[400px] shrink-0 relative flex flex-col">
          <div className="absolute top-2 right-2 z-10">
            <Button variant="outline" size="sm" onClick={() => window.open(channel.meet_link, "_blank")} className="bg-black/50 hover:bg-black text-xs h-7">
              Abrir Externa 🔗
            </Button>
          </div>
          <iframe 
            src={channel.meet_link.includes('meet.google') ? undefined : channel.meet_link} 
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full border-0"
          />
          {channel.meet_link.includes('meet.google') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-secondary/20">
              <span className="text-4xl mb-4">🎥</span>
              <h3 className="font-heading text-lg mb-2">Transmissão Ativa no Google Meet</h3>
              <p className="text-sm text-muted-foreground mb-4">O Google Meet não permite visualização interna. Clique no botão abaixo para participar.</p>
              <Button variant="magical" onClick={() => window.open(channel.meet_link, "_blank")}>Entrar na Chamada 📞</Button>
            </div>
          )}
        </div>
      )}

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-5xl mb-4 opacity-50">🕯️</div>
              <p className="text-muted-foreground text-sm">O silêncio ecoa por este salão.</p>
              <p className="text-xs text-muted-foreground">Seja o primeiro a falar!</p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const showHeader = i === 0 || messages[i-1].user_id !== m.user_id || new Date(m.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 300000;
            const isMe = m.user_id === user?.id;

            return (
              <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${showHeader ? 'mt-6' : 'mt-1'}`}>
                {showHeader ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border">
                    {m.profiles.avatar_url ? (
                      <img src={m.profiles.avatar_url} alt={m.profiles.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-sm font-heading text-primary">
                        {m.profiles.full_name[0]}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-10 shrink-0" />
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  {showHeader && (
                    <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="font-heading text-xs text-foreground/80">{m.profiles.full_name}</span>
                      
                      {m.profiles.role === 'admin' && (
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded flex items-center gap-1" title="Administrador Master">
                          👑 Admin
                        </span>
                      )}
                      {m.profiles.role === 'moderator' && (
                        <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1" title="Moderador Ativo">
                          🛡️ Mod
                        </span>
                      )}

                      <HouseCrest house={m.profiles.house} size="sm" />
                      <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  )}
                  <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary/20 text-foreground rounded-tr-sm' : 'bg-secondary text-foreground rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-card/50 border-t border-border">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Enviar mensagem em ${channel.name}...`}
            className="flex-1 bg-secondary/50 border-border"
          />
          <Button type="submit" variant="magical" size="icon" disabled={!input.trim()}>
            ✨
          </Button>
        </form>
      </div>
    </div>
  );
}
