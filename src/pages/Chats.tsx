import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import { House } from "@/lib/store";

interface Channel {
  id: string;
  name: string;
  description: string;
  category: string;
  allowed_houses: string[] | null;
  is_admin_only: boolean;
}

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
  };
}

export default function Chats() {
  const { user, profile } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChannels();
  }, [user]);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id);
      
      const subscription = supabase
        .channel(`messages:${activeChannel.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${activeChannel.id}` }, async (payload) => {
          // Fetch user info for the new message
          const { data: userData } = await supabase.from("profiles").select("full_name, username, house, avatar_url").eq("user_id", payload.new.user_id).single();
          if (userData) {
            setMessages(prev => [...prev, { ...payload.new, profiles: userData } as Message]);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChannels = async () => {
    const { data, error } = await supabase.from("channels").select("*").order("category").order("name");
    if (data) {
      setChannels(data);
      if (data.length > 0 && !activeChannel) {
        setActiveChannel(data[0]);
      }
    }
    setLoadingChannels(false);
  };

  const fetchMessages = async (channelId: string) => {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles(full_name, username, house, avatar_url)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);
    
    if (data) setMessages(data as unknown as Message[]);
    setLoadingMessages(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChannel || !user) return;
    
    const content = input;
    setInput(""); // Optimistic clear

    const { error } = await supabase.from("messages").insert({
      channel_id: activeChannel.id,
      user_id: user.id,
      content
    });

    if (error) {
      toast.error("Erro ao enviar mensagem: " + error.message);
      setInput(content); // Restore if error
    }
  };

  const categories = Array.from(new Set(channels.map(c => c.category)));

  if (loadingChannels) return <div className="p-10 text-center text-muted-foreground">Conectando à Rede de Flu...</div>;

  return (
    <div className="flex h-[calc(100vh-100px)] glass rounded-2xl overflow-hidden border border-border">
      {/* Sidebar */}
      <div className="w-64 bg-card/50 border-r border-border flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading text-lg text-gold-gradient">Canais de Flu</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="text-xs font-heading text-muted-foreground uppercase tracking-wider px-2 mb-1">{cat}</h3>
              <div className="space-y-0.5">
                {channels.filter(c => c.category === cat).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannel(c)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                      activeChannel?.id === c.id ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    # {c.name.toLowerCase().replace(/\s+/g, '-')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/50">
        {activeChannel ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/30">
              <div>
                <h3 className="font-heading text-lg text-foreground"># {activeChannel.name.toLowerCase().replace(/\s+/g, '-')}</h3>
                <p className="text-xs text-muted-foreground">{activeChannel.description}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="text-center text-xs text-muted-foreground py-10">Lendo as folhas de chá...</div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <div className="text-4xl mb-3 opacity-50">👻</div>
                    <p className="text-muted-foreground text-sm">Este canal está mais vazio que o Ministério no domingo.</p>
                    <p className="text-xs text-muted-foreground">Seja o primeiro a enviar uma mensagem!</p>
                  </div>
                </div>
              ) : (
                messages.map((m, i) => {
                  const showHeader = i === 0 || messages[i-1].user_id !== m.user_id || new Date(m.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 300000;
                  return (
                    <div key={m.id} className={`group flex gap-3 ${showHeader ? 'mt-4' : 'mt-1'}`}>
                      {showHeader ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-border">
                          {m.profiles.avatar_url ? (
                            <img src={m.profiles.avatar_url} alt={m.profiles.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-secondary flex items-center justify-center text-sm font-heading text-primary">
                              {m.profiles.full_name[0]}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-10 flex-shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {showHeader && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm text-foreground">{m.profiles.full_name}</span>
                            <HouseCrest house={m.profiles.house} size="sm" />
                            <span className="text-xs text-muted-foreground ml-1">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        )}
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-card/30 border-t border-border">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Mande uma mensagem em #${activeChannel.name.toLowerCase().replace(/\s+/g, '-')}...`}
                  className="flex-1 bg-secondary/50 border-border"
                />
                <Button type="submit" variant="magical" size="icon" disabled={!input.trim()}>
                  ✨
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Selecione um canal
          </div>
        )}
      </div>
    </div>
  );
}
