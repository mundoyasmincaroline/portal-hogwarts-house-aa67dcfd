import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import { House } from "@/lib/store";
import { addXP } from "@/lib/xpSystem";

interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  character_id: string | null;
  content: string;
  created_at: string;
  user_role?: string;
  profiles: {
    full_name: string;
    username: string;
    house: House;
    avatar_url: string | null;
  };
  characters?: {
    full_name: string;
    house: House;
    avatar_url: string | null;
  };
}

export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const renderRPGText = (text: string) => {
    // Se a mensagem inteira comecar com /acao
    let processedText = text;
    if (processedText.startsWith('/acao ')) {
      return <span className="italic text-primary/80">{processedText.replace('/acao ', '')}</span>;
    }

    const parts = processedText.split(/(\*[^*]+\*|\([^)]+\)|"[^"]+")/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <span key={i} className="italic text-primary/80">{part.slice(1, -1)}</span>;
      }
      if (part.startsWith('(') && part.endsWith(')')) {
        return <span key={i} className="italic text-muted-foreground">{part}</span>;
      }
      if (part.startsWith('"') && part.endsWith('"')) {
        return <span key={i} className="font-semibold text-foreground/90">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

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
      .select("*, profiles(full_name, username, house, avatar_url), characters(full_name, house, avatar_url)")
      .eq("channel_id", id)
      .order("created_at", { ascending: true })
      .limit(100);
    
    if (data) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: rolesData } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
      const roleMap = rolesData?.reduce((acc: any, curr) => ({ ...acc, [curr.user_id]: curr.role }), {}) || {};
      
      const msgs = data.map(m => ({
        ...m,
        user_role: roleMap[m.user_id]
      }));
      setMessages(msgs as unknown as Message[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!channel?.id) return;
    
    const subscription = supabase
      .channel(`messages:${channel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channel.id}` }, async (payload) => {
        const { data: userData } = await supabase.from("profiles").select("full_name, username, house, avatar_url").eq("user_id", payload.new.user_id).single();
        const { data: charData } = payload.new.character_id ? await supabase.from("characters").select("full_name, house, avatar_url").eq("id", payload.new.character_id).single() : { data: null };
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", payload.new.user_id).maybeSingle();
        if (userData) {
          setMessages(prev => [...prev, { ...payload.new, profiles: userData, characters: charData, user_role: roleData?.role } as unknown as Message]);
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
    if (!input.trim() || !channel || !user || cooldown > 0) return;
    
    const content = input;
    
    // Verificação de moderação
    const lowerContent = content.toLowerCase();
    const hasBannedWord = bannedWords.some(word => lowerContent.includes(word));
    if (hasBannedWord) {
      toast.error("Sua mensagem contém palavras inapropriadas pelas leis de magia e foi bloqueada!");
      return;
    }

    setInput("");
    setCooldown(30); // 30 segundos de Anti-Spam

    const { error } = await supabase.from("messages").insert({
      channel_id: channel.id,
      user_id: user.id,
      character_id: useAuth.getState().profile?.active_character_id,
      content
    });

    if (error) {
      toast.error("Erro ao enviar mensagem.");
      setInput(content);
    } else {
      const xpRes = await addXP(user.id, 5, 'message');
      if (xpRes.success) {
        toast.success("+5 XP! ⚡");
      } else if (xpRes.message) {
        toast.info(xpRes.message);
      }
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
                    {(m.characters || m.profiles).avatar_url ? (
                      <img src={(m.characters || m.profiles).avatar_url!} alt={(m.characters || m.profiles).full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-sm font-heading text-primary">
                        {(m.characters || m.profiles).full_name[0]}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-10 shrink-0" />
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  {showHeader && (
                    <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="font-heading text-xs text-foreground/80">{(m.characters || m.profiles).full_name}</span>
                      
                      {m.user_role === 'admin' && (
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded flex items-center gap-1" title="Administrador Master">
                          👑 Admin
                        </span>
                      )}
                      {m.user_role === 'moderator' && (
                        <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1" title="Moderador Ativo">
                          🛡️ Mod
                        </span>
                      )}

                      <HouseCrest house={(m.characters || m.profiles).house} size="sm" />
                      <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  )}
                  <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary/20 text-foreground rounded-tr-sm' : 'bg-secondary text-foreground rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{renderRPGText(m.content)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-card/50 border-t border-border flex flex-col gap-2">
        {isAdmin && channel?.name === "𝐅𝐢𝐜𝐡𝐚𝐬 𝐏𝐞𝐬𝐬𝐨𝐚𝐢𝐬 ₊ ෆ ˚" && (
          <div className="flex gap-2 pb-2">
            <Button size="sm" variant="outline" className="text-[10px] h-6" onClick={() => setInput("✨ ~ 𝐅𝐢𝐜𝐡𝐚 𝐏𝐞𝐬𝐬𝐨𝐚𝐥 ~ ✨\n\n📸 𝐅𝐨𝐭𝐨:\n👤 𝐍𝐨𝐦𝐞 𝐜𝐨𝐦𝐩𝐥𝐞𝐭𝐨:\n🏷️ 𝐀𝐩𝐞𝐥𝐢𝐝𝐨 / 𝐜𝐨𝐦𝐨 𝐠𝐨𝐬𝐭𝐚 𝐝𝐞 𝐬𝐞𝐫 𝐜𝐡𝐚𝐦𝐚𝐝𝐨(𝐚): \n⏳  𝐈𝐝𝐚𝐝𝐞: \n🎉 𝐀𝐧𝐢𝐯𝐞𝐫𝐬𝐚́𝐫𝐢𝐨:\n🕊️ 𝐑𝐞𝐥𝐢𝐠𝐢ã𝐨: \n📍 𝐄𝐬𝐭𝐚𝐝𝐨:\n🏰 𝐂𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬 (𝐩𝐫𝐢𝐧𝐜𝐢𝐩𝐚𝐥):\n🏰 𝐒𝐞𝐠𝐮𝐧𝐝𝐚 𝐜𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬:\n 🌀 𝐏𝐚𝐭𝐫𝐨𝐧𝐨:\n🎭 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐧𝐬 𝐪𝐮𝐞 𝐯𝐨𝐜ê 𝐪𝐮𝐞𝐫 𝐢𝐧𝐭𝐞𝐫𝐩𝐫𝐞𝐭𝐚𝐫 𝐧𝐚 𝐡𝐨𝐮𝐬𝐞:\n⭐ 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 𝐟𝐚𝐯𝐨𝐫𝐢𝐭𝐨:\n🎥 𝐅𝐢𝐥𝐦𝐞 𝐟𝐚𝐯𝐨𝐫𝐢𝐭𝐨 𝐝𝐚 𝐬𝐚𝐠𝐚:\n📚 𝐋𝐢𝐯𝐫𝐨 𝐟𝐚𝐯𝐨𝐫𝐢𝐭𝐨 𝐝𝐚 𝐬𝐚𝐠𝐚:")}>
              📋 Enviar Modelo Pessoal
            </Button>
          </div>
        )}
        {isAdmin && channel?.name === "𝐅𝐢𝐜𝐡𝐚𝐬 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐧𝐬 ₊ ෆ ˚" && (
          <div className="flex flex-wrap gap-2 pb-2">
            <Button size="sm" variant="outline" className="text-[10px] h-6" onClick={() => setInput("𝐅𝐈𝐂𝐇𝐀 𝐅𝐄𝐌𝐈𝐍𝐈𝐍𝐀 - 𝐀𝐋𝐔𝐍𝐀𝐒 \n\n⚡ ~ 𝐅𝐢𝐜𝐡𝐚 𝐝𝐚 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~ ⚡\n\n(𝐯𝐞𝐫𝐬ã𝐨 𝐟𝐞𝐦𝐢𝐧𝐢𝐧𝐚 𝐩𝐚𝐫𝐚 𝐚𝐥𝐮𝐧𝐚𝐬 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬! 🏰)\n\n📷 𝐅𝐨𝐭𝐨 (𝐞𝐧𝐯𝐢𝐚𝐫 𝐚𝐜𝐢𝐦𝐚!):\n📜 𝐍𝐨𝐦𝐞:\n⏳ 𝐈𝐝𝐚𝐝𝐞:\n🏰 𝐂𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬 (𝐩𝐫𝐢𝐧𝐜𝐢𝐩𝐚𝐥):\n🏰 𝐒𝐞𝐠𝐮𝐧𝐝𝐚 𝐜𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬:\n📚 𝐇𝐢𝐬𝐭ó𝐫𝐢𝐚:\n✨ 𝐕𝐚𝐫𝐢𝐧𝐡𝐚:\n🌀 𝐏𝐚𝐭𝐫𝐨𝐧𝐨: \n🐾 𝐀𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚𝐜̧𝐚̃𝐨:\n💗 𝐍𝐨𝐦𝐞 𝐝𝐨 𝐚𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚çã𝐨:\n📷 𝐅𝐨𝐭𝐨 𝐝𝐨 𝐚𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚çã𝐨 (𝐞𝐧𝐯𝐢𝐚𝐫 𝐚𝐜𝐢𝐦𝐚!):\n🩸 𝐒𝐚𝐧𝐠𝐮𝐞:\n🎓 𝐀𝐧𝐨 𝐞𝐦 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬:\n📚 𝐌𝐚𝐭𝐞́𝐫𝐢𝐚 𝐟𝐚𝐯𝐨𝐫𝐢𝐭𝐚:\n💫 𝐅𝐞𝐢𝐭𝐢ç𝐨 𝐟𝐚𝐯𝐨𝐫𝐢𝐭𝐨:\n🧠 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐥𝐢𝐝𝐚𝐝𝐞:\n💘 𝐏𝐚𝐫:\n😔 𝐏𝐨𝐧𝐭𝐨 𝐟𝐫𝐚𝐜𝐨:\n💪 𝐏𝐨𝐧𝐭𝐨 𝐟𝐨𝐫𝐭𝐞:\n🔒 𝐒𝐞𝐠𝐫𝐞𝐝𝐨𝐬:\n😱 𝐌𝐞𝐝𝐨𝐬: \n✨ 𝐒𝐨𝐧𝐡𝐨𝐬:\n🧩 𝐌𝐚𝐧𝐢𝐚𝐬:\n💬 𝐅𝐫𝐚𝐬𝐞𝐬 𝐦𝐚𝐫𝐜𝐚𝐧𝐭𝐞𝐬:\n📸 𝐂𝐨𝐧𝐭𝐚𝐬 𝐧𝐨 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦:\n🎭 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 𝐢𝐧𝐭𝐞𝐫𝐩𝐫𝐞𝐭𝐚𝐝𝐨 𝐩𝐨𝐫:\n\n 💗 ~ 𝐅𝐚𝐦í𝐥𝐢𝐚 𝐝𝐚 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~💗\n\n❤️ 𝐌ã𝐞:\n💙 𝐏𝐚𝐢:\n👨👩👧👦 𝐈𝐫𝐦ã𝐨𝐬(𝐚𝐬):\n👥 𝐏𝐚𝐫𝐞𝐧𝐭𝐞𝐬 𝐢𝐦𝐩𝐨𝐫𝐭𝐚𝐧𝐭𝐞𝐬:")}>
              👧 Alunas
            </Button>
            <Button size="sm" variant="outline" className="text-[10px] h-6" onClick={() => setInput("𝐅𝐈𝐂𝐇𝐀 𝐌𝐀𝐒𝐂𝐔𝐋𝐈𝐍𝐀 - 𝐀𝐋𝐔𝐍𝐎𝐒 \n\n⚡ ~ 𝐅𝐢𝐜𝐡𝐚 𝐝𝐨 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~ ⚡\n\n(𝐯𝐞𝐫𝐬ã𝐨 𝐦𝐚𝐬𝐜𝐮𝐥𝐢𝐧𝐚 𝐩𝐚𝐫𝐚 𝐚𝐥𝐮𝐧𝐨𝐬 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬! 🏰)\n\n📷 𝐅𝐨𝐭𝐨 (𝐞𝐧𝐯𝐢𝐚𝐫 𝐚𝐜𝐢𝐦𝐚!):\n📜 𝐍𝐨𝐦𝐞:\n⏳ 𝐈𝐝𝐚𝐝𝐞:\n🏰 𝐂𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬 (𝐩𝐫𝐢𝐧𝐜𝐢𝐩𝐚𝐥):\n🏰 𝐒𝐞𝐠𝐮𝐧𝐝𝐚 𝐜𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬:\n📚 𝐇𝐢𝐬𝐭ó𝐫𝐢𝐚:\n✨ 𝐕𝐚𝐫𝐢𝐧𝐡𝐚:\n🌀 𝐏𝐚𝐭𝐫𝐨𝐧𝐨: \n🐾 𝐀𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚𝐜̧𝐚̃𝐨:\n💗 𝐍𝐨𝐦𝐞 𝐝𝐨 𝐚𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚çã𝐨:\n📷 𝐅𝐨𝐭𝐨 𝐝𝐨 𝐚𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚çã𝐨 (𝐞𝐧𝐯𝐢𝐚𝐫 𝐚𝐜𝐢𝐦𝐚!):\n🩸 𝐒𝐚𝐧𝐠𝐮𝐞:\n🎓 𝐀𝐧𝐨 𝐞𝐦 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬:\n📚 𝐌𝐚𝐭𝐞́𝐫𝐢𝐚 𝐟𝐚𝐯𝐨𝐫𝐢𝐭𝐚:\n💫 𝐅𝐞𝐢𝐭𝐢ç𝐨 𝐟𝐚𝐯𝐨𝐫𝐢𝐭𝐨:\n🧠 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐥𝐢𝐝𝐚𝐝𝐞:\n💘 𝐏𝐚𝐫:\n😔 𝐏𝐨𝐧𝐭𝐨 𝐟𝐫𝐚𝐜𝐨:\n💪 𝐏𝐨𝐧𝐭𝐨 𝐟𝐨𝐫𝐭𝐞:\n🔒 𝐒𝐞𝐠𝐫𝐞𝐝𝐨𝐬:\n😱 𝐌𝐞𝐝𝐨𝐬: \n✨ 𝐒𝐨𝐧𝐡𝐨𝐬:\n🧩 𝐌𝐚𝐧𝐢𝐚𝐬:\n💬 𝐅𝐫𝐚𝐬𝐞𝐬 𝐦𝐚𝐫𝐜𝐚𝐧𝐭𝐞𝐬:\n📸 𝐂𝐨𝐧𝐭𝐚𝐬 𝐧𝐨 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦:\n🎭 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 𝐢𝐧𝐭𝐞𝐫𝐩𝐫𝐞𝐭𝐚𝐝𝐨 𝐩𝐨𝐫:\n\n 💗 ~ 𝐅𝐚𝐦í𝐥𝐢𝐚 𝐝𝐨 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~💗\n\n❤️ 𝐌ã𝐞:\n💙 𝐏𝐚𝐢:\n👨👩👧👦 𝐈𝐫𝐦ã𝐨𝐬(𝐚𝐬):\n👥 𝐏𝐚𝐫𝐞𝐧𝐭𝐞𝐬 𝐢𝐦𝐩𝐨𝐫𝐭𝐚𝐧𝐭𝐞𝐬:")}>
              👦 Alunos
            </Button>
            <Button size="sm" variant="outline" className="text-[10px] h-6" onClick={() => setInput("𝐅𝐈𝐂𝐇𝐀 𝐅𝐄𝐌𝐈𝐍𝐈𝐍𝐀 - 𝐀𝐃𝐔𝐋𝐓𝐀𝐒 \n\n⚡ ~ 𝐅𝐢𝐜𝐡𝐚 𝐝𝐚 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~ ⚡\n\n(𝐯𝐞𝐫𝐬ã𝐨 𝐟𝐞𝐦𝐢𝐧𝐢𝐧𝐚 𝐩𝐚𝐫𝐚 𝐚𝐝𝐮𝐥𝐭𝐚𝐬 𝐝𝐨 𝐦𝐮𝐧𝐝𝐨 𝐛𝐫𝐮𝐱𝐨! 🧙♀️)\n\n📷 𝐅𝐨𝐭𝐨 (𝐞𝐧𝐯𝐢𝐚𝐫 𝐚𝐜𝐢𝐦𝐚!):\n📜 𝐍𝐨𝐦𝐞:\n⏳ 𝐈𝐝𝐚𝐝𝐞:\n🏰 𝐂𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬 (𝐩𝐫𝐢𝐧𝐜𝐢𝐩𝐚𝐥):\n🏰 𝐒𝐞𝐠𝐮𝐧𝐝𝐚 𝐜𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬:\n📚 𝐇𝐢𝐬𝐭ó𝐫𝐢𝐚:\n✨ 𝐕𝐚𝐫𝐢𝐧𝐡𝐚:\n🌀 𝐏𝐚𝐭𝐫𝐨𝐧𝐨: \n🐾 𝐀𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚𝐜̧𝐚̃𝐨:\n💗 𝐍𝐨𝐦𝐞 𝐝𝐨 𝐚𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚çã𝐨:\n📷 𝐅𝐨𝐭𝐨 𝐝𝐨 𝐚𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚çã𝐨 (𝐞𝐧𝐯𝐢𝐚𝐫 𝐚𝐜𝐢𝐦𝐚!):\n🩸 𝐒𝐚𝐧𝐠𝐮𝐞:\n💫 𝐅𝐞𝐢𝐭𝐢ç𝐨 𝐟𝐚𝐯𝐨𝐫𝐢𝐭𝐨:\n🧠 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐥𝐢𝐝𝐚𝐝𝐞:\n💘 𝐏𝐚𝐫:\n😔 𝐏𝐨𝐧𝐭𝐨 𝐟𝐫𝐚𝐜𝐨:\n💪 𝐏𝐨𝐧𝐭𝐨 𝐟𝐨𝐫𝐭𝐞:\n🔒 𝐒𝐞𝐠𝐫𝐞𝐝𝐨𝐬:\n😱 𝐌𝐞𝐝𝐨𝐬: \n✨ 𝐒𝐨𝐧𝐡𝐨𝐬:\n🧩 𝐌𝐚𝐧𝐢𝐚𝐬:\n💬 𝐅𝐫𝐚𝐬𝐞𝐬 𝐦𝐚𝐫𝐜𝐚𝐧𝐭𝐞𝐬:\n📸 𝐂𝐨𝐧𝐭𝐚𝐬 𝐧𝐨 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦:\n💼 𝐓𝐫𝐚𝐛𝐚𝐥𝐡𝐨:\n🎭 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 𝐢𝐧𝐭𝐞𝐫𝐩𝐫𝐞𝐭𝐚𝐝𝐨 𝐩𝐨𝐫:\n\n 💗 ~ 𝐅𝐚𝐦í𝐥𝐢𝐚 𝐝𝐚 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~💗\n\n❤️ 𝐌ã𝐞:\n💙 𝐏𝐚𝐢:\n👨👩👧👦 𝐈𝐫𝐦ã𝐨𝐬(𝐚𝐬):\n👥 𝐏𝐚𝐫𝐞𝐧𝐭𝐞𝐬 𝐢𝐦𝐩𝐨𝐫𝐭𝐚𝐧𝐭𝐞𝐬:")}>
              👩 Adultas
            </Button>
            <Button size="sm" variant="outline" className="text-[10px] h-6" onClick={() => setInput("𝐅𝐈𝐂𝐇𝐀 𝐌𝐀𝐒𝐂𝐔𝐋𝐈𝐍𝐀 - 𝐀𝐃𝐔𝐋𝐓𝐎𝐒 \n\n⚡ ~ 𝐅𝐢𝐜𝐡𝐚 𝐝𝐨 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~ ⚡\n\n(𝐯𝐞𝐫𝐬ã𝐨 𝐦𝐚𝐬𝐜𝐮𝐥𝐢𝐧𝐚 𝐩𝐚𝐫𝐚 𝐚𝐝𝐮𝐥𝐭𝐨𝐬 𝐝𝐨 𝐦𝐮𝐧𝐝𝐨 𝐛𝐫𝐮𝐱𝐨! 🧙)\n\n📷 𝐅𝐨𝐭𝐨 (𝐞𝐧𝐯𝐢𝐚𝐫 𝐚𝐜𝐢𝐦𝐚!):\n📜 𝐍𝐨𝐦𝐞:\n⏳ 𝐈𝐝𝐚𝐝𝐞:\n🏰 𝐂𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬 (𝐩𝐫𝐢𝐧𝐜𝐢𝐩𝐚𝐥):\n🏰 𝐒𝐞𝐠𝐮𝐧𝐝𝐚 𝐜𝐚𝐬𝐚 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬:\n📚 𝐇𝐢𝐬𝐭ó𝐫𝐢𝐚:\n✨ 𝐕𝐚𝐫𝐢𝐧𝐡𝐚:\n🌀 𝐏𝐚𝐭𝐫𝐨𝐧𝐨: \n🐾 𝐀𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚𝐜̧𝐚̃𝐨:\n💗 𝐍𝐨𝐦𝐞 𝐝𝐨 𝐚𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚çã𝐨:\n📷 𝐅𝐨𝐭𝐨 𝐝𝐨 𝐚𝐧𝐢𝐦𝐚𝐥 𝐝𝐞 𝐞𝐬𝐭𝐢𝐦𝐚çã𝐨 (𝐞𝐧𝐯𝐢𝐚𝐫 𝐚𝐜𝐢𝐦𝐚!):\n🩸 𝐒𝐚𝐧𝐠𝐮𝐞:\n💫 𝐅𝐞𝐢𝐭𝐢ç𝐨 𝐟𝐚𝐯𝐨𝐫𝐢𝐭𝐨:\n🧠 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐥𝐢𝐝𝐚𝐝𝐞:\n💘 𝐏𝐚𝐫:\n😔 𝐏𝐨𝐧𝐭𝐨 𝐟𝐫𝐚𝐜𝐨:\n💪 𝐏𝐨𝐧𝐭𝐨 𝐟𝐨𝐫𝐭𝐞:\n🔒 𝐒𝐞𝐠𝐫𝐞𝐝𝐨𝐬:\n😱 𝐌𝐞𝐝𝐨𝐬: \n✨ 𝐒𝐨𝐧𝐡𝐨𝐬:\n🧩 𝐌𝐚𝐧𝐢𝐚𝐬:\n💬 𝐅𝐫𝐚𝐬𝐞𝐬 𝐦𝐚𝐫𝐜𝐚𝐧𝐭𝐞𝐬:\n📸 𝐂𝐨𝐧𝐭𝐚𝐬 𝐧𝐨 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦:\n💼 𝐓𝐫𝐚𝐛𝐚𝐥𝐡𝐨:\n🎭 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 𝐢𝐧𝐭𝐞𝐫𝐩𝐫𝐞𝐭𝐚𝐝𝐨 𝐩𝐨𝐫:\n\n 💗 ~ 𝐅𝐚𝐦í𝐥𝐢𝐚 𝐝𝐨 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~💗\n\n❤️ 𝐌ã𝐞:\n💙 𝐏𝐚𝐢:\n👨👩👧👦 𝐈𝐫𝐦ã𝐨𝐬(𝐚𝐬):\n👥 𝐏𝐚𝐫𝐞𝐧𝐭𝐞𝐬 𝐢𝐦𝐩𝐨𝐫𝐭𝐚𝐧𝐭𝐞𝐬:")}>
              👨 Adultos
            </Button>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={cooldown > 0 ? `Aguarde ${cooldown}s para conjurar novamente...` : `Enviar mensagem em ${channel.name}...`}
            className="flex-1 bg-secondary/50 border-border"
            disabled={cooldown > 0}
          />
          <Button type="submit" variant="magical" size="icon" disabled={!input.trim() || cooldown > 0}>
            {cooldown > 0 ? cooldown : '✨'}
          </Button>
        </form>
      </div>
    </div>
  );
}
