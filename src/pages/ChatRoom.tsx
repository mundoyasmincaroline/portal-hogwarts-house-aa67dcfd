import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import { House } from "@/lib/store";
import { addXP } from "@/lib/xpSystem";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface MemberSuggestion {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

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
  const { user, isAdmin, profile } = useAuth();
  
  const [channel, setChannel] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // @mention state
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<MemberSuggestion[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const renderRPGText = (text: string) => {
    if (!text) return null;
    // Se a mensagem inteira comecar com /acao
    let processedText = text;
    if (processedText.startsWith('/acao ')) {
      return <span className="italic text-primary/80">{processedText.replace('/acao ', '')}</span>;
    }

    // Split por formatação RPG + @mentions
    const parts = processedText.split(/(\*[^*]+\*|\([^)]+\)|"[^"]+"|@[\w.]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span key={i} className="font-bold text-yellow-400 bg-yellow-400/10 rounded px-0.5 cursor-pointer hover:underline">
            {part}
          </span>
        );
      }
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

  // Handler para mudanças no input — detecta @mention
  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const cursor = e.target.selectionStart ?? val.length;
    // Encontra o @ mais próximo antes do cursor
    const beforeCursor = val.slice(0, cursor);
    const atIdx = beforeCursor.lastIndexOf('@');

    if (atIdx !== -1) {
      const afterAt = beforeCursor.slice(atIdx + 1);
      // Só mostra se não tem espaço depois do @
      if (!afterAt.includes(' ') && afterAt.length >= 0) {
        setMentionStart(atIdx);
        setMentionQuery(afterAt);
        setShowMentionMenu(true);
        // Busca membros
        const { data } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url')
          .ilike('username', `${afterAt}%`)
          .limit(6);
        setMentionSuggestions(data || []);
        return;
      }
    }
    setShowMentionMenu(false);
    setMentionSuggestions([]);
  }, []);

  const selectMention = useCallback(async (member: MemberSuggestion) => {
    // Substitui o @query pelo @username
    const before = input.slice(0, mentionStart);
    const after = input.slice(mentionStart + 1 + mentionQuery.length);
    const newVal = `${before}@${member.username} ${after}`;
    setInput(newVal);
    setShowMentionMenu(false);
    setMentionSuggestions([]);
    inputRef.current?.focus();
  }, [input, mentionStart, mentionQuery]);

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
  }, [roomId, selectedDate]);

  const fetchChannel = async () => {
    const { data, error } = await supabase.from("channels").select("*").eq("id", roomId).single();
    if (error || !data) {
      toast.error("Sala não encontrada ou você não tem acesso.");
      navigate("/dashboard/chats");
      return;
    }
    setChannel(data);
    fetchMessages(data.id, selectedDate);
  };

  const fetchMessages = async (id: string, dateStr: string) => {
    setLoading(true);
    let query = supabase
      .from("messages")
      .select("*, characters(full_name, house, avatar_url)")
      .eq("channel_id", id)
      .order("created_at", { ascending: false })
      .limit(100);

    const todayStr = new Date().toLocaleDateString('en-CA');
    if (dateStr && dateStr !== todayStr) {
      const startOfDay = new Date(dateStr + 'T00:00:00');
      const endOfDay = new Date(dateStr + 'T23:59:59');
      query = query.gte("created_at", startOfDay.toISOString()).lte("created_at", endOfDay.toISOString());
    }

    const { data, error } = await query;
    if (error) console.error("fetchMessages error:", error);
    
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      
      // Fetch profiles and roles separately to avoid RLS join issues
      const [{ data: profilesData }, { data: rolesData }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, username, house, avatar_url").in("user_id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
      ]);

      const profileMap = (profilesData || []).reduce((acc: any, p) => ({ ...acc, [p.user_id]: p }), {});
      const roleMap = (rolesData || []).reduce((acc: any, r) => ({ ...acc, [r.user_id]: r.role }), {});
      
      const msgs = data.map(m => ({
        ...m,
        profiles: profileMap[m.user_id] || { full_name: "Bruxo", username: "bruxo", house: "gryffindor", avatar_url: null },
        user_role: roleMap[m.user_id]
      }));
      setMessages(msgs.reverse() as unknown as Message[]);
      setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "auto" }); }, 100);
    } else {
      setMessages([]);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    return date.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'}) + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  useEffect(() => {
    if (!channel?.id) return;
    
    const subscription = supabase
      .channel(`messages:${channel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channel.id}` }, async (payload) => {
        // Só adiciona ao vivo se a data selecionada for hoje
        const todayStr = new Date().toLocaleDateString('en-CA');
        if (selectedDate !== todayStr) return;

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
  }, [channel?.id, selectedDate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !channel || !user || cooldown > 0) return;
    
    const content = input;
    
    // Verificações rigorosas de moderação (Filch)
    const lowerContent = content.toLowerCase();
    const hasBannedWord = bannedWords.some(word => lowerContent.includes(word));
    const isAllCaps = content.length > 15 && content === content.toUpperCase();
    const hasSpamChars = /(.)\1{5,}/.test(content); // A mesma letra/símbolo 6+ vezes seguidas
    
    if (hasBannedWord || isAllCaps || hasSpamChars) {
      let reason = hasBannedWord ? "Palavra proibida" : isAllCaps ? "Gritaria (CAPS LOCK)" : "Spam (letras repetidas)";
      toast.error(
        <div className="flex gap-3 items-center">
          <img src="https://i.pinimg.com/736x/8e/31/b0/8e31b0a8801d4a04d55cc3b89b88cfbb.jpg" alt="Filch" className="w-10 h-10 rounded-full border border-red-500 object-cover" />
          <div>
            <p className="font-bold text-red-500">Argus Filch</p>
            <p className="text-sm">O que temos aqui? Arrumando confusão pelos corredores! Sua mensagem foi apreendida por: {reason}</p>
          </div>
        </div>,
        { duration: 8000 }
      );
      // Log to Filch
      await supabase.from("moderation_log").insert({
        user_id: user.id,
        content_type: "chat",
        original_content: content,
        reason: reason,
        action: "block"
      });
      // Punição extra de XP para spam no chat
      await supabase.rpc("award_xp_action", { _action: "spam_penalty", _user_id: user.id, _xp: -10 });
      return;
    }

    setInput("");
    setShowMentionMenu(false);
    setCooldown(30); // 30 segundos de Anti-Spam

    const { error } = await supabase.from("messages").insert({
      channel_id: channel.id,
      user_id: user.id,
      character_id: profile?.active_character_id ?? null,
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

      // Notificar membros mencionados
      const mentionMatches = content.match(/@([\w.]+)/g);
      if (mentionMatches) {
        const usernames = mentionMatches.map(m => m.slice(1));
        const { data: mentionedProfiles } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('username', usernames);
        if (mentionedProfiles && mentionedProfiles.length > 0) {
          const senderName = profile?.username || 'alguém';
          const notifs = mentionedProfiles
            .filter(p => p.user_id !== user.id)
            .map(p => ({
              user_id: p.user_id,
              type: 'mention',
              content: `@${senderName} mencionou você no chat "${channel.name}"`,
              read: false
            }));
          if (notifs.length > 0) {
            await supabase.from('notifications').insert(notifs);
          }
        }
      }
    }
  };

  if (loading || !channel) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-pulse">
       <div className="w-20 h-20 bg-white/5 rounded-full border border-white/5 flex items-center justify-center">
          <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin" />
       </div>
       <p className="text-[10px] font-heading text-white/20 uppercase tracking-[0.5em]">Abrindo os Portais do Castelo...</p>
    </div>
  );

  return (
    <div className={`max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-black/60 backdrop-blur-3xl rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative animate-in fade-in zoom-in duration-1000 group/room`}>
      {/* MONSTER QUALITY HOUSE AURA */}
      <div className={`absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-10 transition-all duration-[2000ms] pointer-events-none ${
        channel?.name.toLowerCase().includes('gryffindor') || channel?.name.toLowerCase().includes('grifinória') ? 'bg-red-600' :
        channel?.name.toLowerCase().includes('slytherin') || channel?.name.toLowerCase().includes('sonserina') ? 'bg-green-600' :
        channel?.name.toLowerCase().includes('ravenclaw') || channel?.name.toLowerCase().includes('corvinal') ? 'bg-blue-600' :
        channel?.name.toLowerCase().includes('hufflepuff') || channel?.name.toLowerCase().includes('lufa-lufa') ? 'bg-yellow-600' : 'bg-primary/5'
      }`} />
      <div className={`absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-10 transition-all duration-[2000ms] pointer-events-none ${
        channel?.name.toLowerCase().includes('gryffindor') || channel?.name.toLowerCase().includes('grifinória') ? 'bg-amber-600' :
        channel?.name.toLowerCase().includes('slytherin') || channel?.name.toLowerCase().includes('sonserina') ? 'bg-emerald-600' :
        channel?.name.toLowerCase().includes('ravenclaw') || channel?.name.toLowerCase().includes('corvinal') ? 'bg-cyan-600' :
        channel?.name.toLowerCase().includes('hufflepuff') || channel?.name.toLowerCase().includes('lufa-lufa') ? 'bg-orange-600' : 'bg-primary/5'
      }`} />

      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      
      {/* Header da Sala - MONSTER QUALITY */}
      <div className="relative z-10 p-6 md:p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate("/dashboard/chats")} 
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-xl group"
          >
            <span className="text-white/40 group-hover:text-white transition-colors">⬅</span>
          </button>
          <div className="space-y-1">
            <h2 className="font-heading text-xl text-white tracking-tight flex items-center gap-3">
              {channel.name} 
              {channel.is_premium && (
                <div className="px-3 py-0.5 rounded-full bg-gradient-to-r from-yellow-600 to-amber-400 text-black font-heading text-[8px] tracking-[0.2em] shadow-lg">PREMIUM</div>
              )}
            </h2>
            <p className="text-[10px] font-heading text-white/20 uppercase tracking-widest hidden sm:block">
               {channel.description || "Conversa mágica nos corredores de Hogwarts"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group/date">
             <div className="absolute -inset-1 bg-primary/20 blur-md opacity-0 group-hover/date:opacity-100 transition-opacity rounded-xl" />
             <input 
               type="date" 
               value={selectedDate} 
               onChange={(e) => setSelectedDate(e.target.value)}
               className="relative z-10 bg-black/40 text-[10px] font-heading text-white/60 uppercase tracking-widest px-4 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-primary/40 transition-all cursor-pointer shadow-inner"
               title="Penseira: Ver mensagens de outro dia"
             />
          </div>
        </div>
      </div>

      {/* Integração Vídeo - MONSTER QUALITY */}
      {channel.meet_link && (
        <div className="relative z-10 h-[250px] md:h-[400px] shrink-0 overflow-hidden border-b border-white/5 group/video">
          <div className="absolute top-4 right-4 z-20 flex gap-2">
             <button 
               onClick={() => window.open(channel.meet_link, "_blank")} 
               className="px-6 py-2.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-[10px] font-heading text-white/60 hover:text-white hover:border-primary/40 transition-all shadow-2xl uppercase tracking-widest"
             >
               Janela Externa 🔗
             </button>
          </div>
          
          <div className="absolute inset-0 bg-black animate-pulse opacity-20" />
          
          <iframe 
            src={channel.meet_link.includes('meet.google') ? undefined : channel.meet_link} 
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full border-0 relative z-10 grayscale hover:grayscale-0 transition-all duration-1000"
          />
          
          {channel.meet_link.includes('meet.google') && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-12 bg-black/80 backdrop-blur-sm">
               <div className="w-24 h-24 bg-primary/20 rounded-[2.5rem] border border-primary/40 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(251,191,36,0.2)] animate-float">
                  <span className="text-4xl">🎥</span>
               </div>
               <h3 className="font-heading text-2xl text-white mb-4 tracking-tight uppercase">Transmissão em Andamento</h3>
               <p className="text-sm text-white/30 mb-8 max-w-md font-serif italic">"O Google Meet requer um portal direto. Clique abaixo para se juntar aos outros bruxos na chamada."</p>
               <button 
                 onClick={() => window.open(channel.meet_link, "_blank")}
                 className="px-10 py-4 bg-primary text-white font-heading text-[10px] tracking-[0.3em] rounded-2xl shadow-[0_15px_30px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 transition-all uppercase"
               >
                 Entrar na Chamada 📞
               </button>
            </div>
          )}
        </div>
      )}

      {/* Área de Mensagens - MONSTER QUALITY */}
      <div className="relative z-10 flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth custom-scrollbar">
        <ErrorBoundary fallback={<div className="text-center py-20 text-red-500 font-heading uppercase tracking-widest opacity-40">O Fluxo Mágico foi interrompido...</div>}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
               <div className="w-24 h-24 bg-white/5 rounded-full border border-white/5 flex items-center justify-center">
                  <span className="text-5xl animate-pulse">🕯️</span>
               </div>
               <div>
                  <p className="text-[10px] font-heading text-white uppercase tracking-[0.5em]">O silêncio ecoa pelo salão...</p>
                  <p className="text-[9px] font-heading text-white/40 uppercase tracking-[0.3em] mt-2">Diga as primeiras palavras e quebre o encanto.</p>
               </div>
            </div>
          ) : (
            messages.map((m, i) => {
              const profileData: any = m.characters || m.profiles || { full_name: "Bruxo Desconhecido", username: "desconhecido", house: "gryffindor", avatar_url: null };
              const profileName = profileData.full_name || "Desconhecido";
              const profileUser = profileData.username || "desconhecido";
              
              const isMorpheus = profileName.toLowerCase().includes('morpheus') || profileUser.toLowerCase().includes('morpheus');
              const isYasmin = profileName.toLowerCase().includes('yasmin') || profileUser.toLowerCase().includes('mundoyasmincaroline');
              const isCarolina = profileName.toLowerCase().includes('carolina') || profileUser.toLowerCase().includes('carolinaas.assis');

              return (
                <div key={m.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`flex gap-6 ${isMorpheus || isYasmin ? 'items-center' : 'items-start'}`}>
                    {/* Avatar Monument */}
                    <div className="relative shrink-0 group/av">
                      <div className={`absolute -inset-1.5 rounded-[1.8rem] blur-lg opacity-20 group-hover/av:opacity-60 transition-opacity duration-500 ${
                         isMorpheus ? 'bg-green-500' :
                         isYasmin ? 'bg-yellow-400' :
                         isCarolina ? 'bg-blue-400' :
                         profileData.house === 'gryffindor' ? 'bg-red-500' :
                         profileData.house === 'slytherin' ? 'bg-green-500' :
                         profileData.house === 'ravenclaw' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`} />
                      
                      <Link to={`/dashboard/profile/${m.user_id}`} className={`relative z-10 w-14 h-14 rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl block group-hover/av:scale-110 transition-transform duration-500 ${
                         isMorpheus ? 'border-green-500/50 flex items-center justify-center font-mono text-green-500 font-bold text-xl' : ''
                      }`}>
                         {isMorpheus ? (
                            <span className="animate-pulse">M</span>
                         ) : profileData.avatar_url ? (
                            <img src={profileData.avatar_url} className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center text-lg font-heading text-primary">
                               {profileName[0]}
                            </div>
                         )}
                      </Link>

                      <div className="absolute -bottom-2 -right-2 z-20 scale-125 drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
                         {!isMorpheus && <HouseCrest house={profileData.house} size="xs" />}
                      </div>
                    </div>

                    {/* Message Bubble */}
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-3">
                          <Link to={`/dashboard/profile/${m.user_id}`} className="group/name">
                             {isMorpheus ? (
                                <span className="font-mono text-[10px] font-bold text-green-500 tracking-[0.3em] uppercase group-hover/name:drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-all">&gt; MORPHEUS [O ARQUITETO]</span>
                             ) : isYasmin ? (
                                <span className="font-heading text-xs font-bold text-yellow-400 tracking-widest uppercase group-hover/name:drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] transition-all">✨ YASMIN [A FUNDADORA]</span>
                             ) : isCarolina ? (
                                <span className="font-heading text-xs font-bold text-blue-400 tracking-widest uppercase group-hover/name:drop-shadow-[0_0_10px_rgba(96,165,250,0.8)] transition-all">🛡️ CAROLINA [A GUARDIÃ]</span>
                             ) : (
                                <span className="font-heading text-sm text-white/90 group-hover/name:text-primary transition-colors tracking-tight">{profileName}</span>
                             )}
                          </Link>

                          <div className="flex items-center gap-2">
                             {m.user_role === 'admin' && !isYasmin && !isMorpheus && (
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[8px] font-heading text-primary uppercase tracking-widest shadow-lg">ADMIN</span>
                             )}
                             {m.user_role === 'moderator' && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[8px] font-heading text-blue-400 uppercase tracking-widest shadow-lg">MOD</span>
                             )}
                          </div>

                          <span className="text-[10px] text-white/10 font-heading uppercase tracking-widest ml-auto">
                             {formatDate(m.created_at)}
                          </span>
                       </div>

                       <div className={`relative overflow-hidden rounded-3xl px-6 py-4 border shadow-2xl transition-all duration-500 group/msg ${
                          isMorpheus ? 'bg-black border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]' :
                          isYasmin ? 'bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_30px_rgba(250,204,21,0.1)]' :
                          isCarolina ? 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_30px_rgba(96,165,250,0.1)]' :
                          'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                       }`}>
                          {/* Inner Shine */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                          
                          <div className={`relative z-10 text-base md:text-lg leading-relaxed ${
                             isMorpheus ? 'font-mono text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]' :
                             isYasmin ? 'font-serif text-yellow-100 italic' :
                             isCarolina ? 'font-serif text-blue-100 italic' :
                             'text-white/80'
                          }`}>
                             <p className="whitespace-pre-wrap">{renderRPGText(m.content)}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </ErrorBoundary>
      </div>

      {/* Input Area - MONSTER QUALITY */}
      <div className="relative z-20 p-8 border-t border-white/5 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Admin Models */}
          {isAdmin && (channel?.name.includes("Fichas") || channel?.name.includes("𝐅𝐢𝐜𝐡𝐚𝐬")) && (
            <div className="flex flex-wrap gap-3 pb-2">
               {[
                 { label: "📋 Modelo Pessoal", color: "primary", template: "✨ ~ 𝐅𝐢𝐜𝐡𝐚 𝐏𝐞𝐬𝐬𝐨𝐚𝐥 ~ ✨\n\n📸 𝐅𝐨𝐭ο:\n👤 𝐍𝐨𝐦𝐞 𝐜𝐨𝐦𝐩𝐥𝐞𝐭𝐨:\n🏷️ 𝐀𝐩𝐞𝐥𝐢𝐝ο..." },
                 { label: "👧 Alunas", color: "blue", template: "𝐅𝐈𝐂𝐇𝐀 𝐅𝐄𝐌𝐈𝐍𝐈𝐍𝐀 - 𝐀𝐋𝐔𝐍𝐀𝐒 \n\n⚡ ~ 𝐅𝐢𝐜𝐡𝐚 𝐝𝐚 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~ ⚡..." },
                 { label: "👦 Alunos", color: "amber", template: "𝐅𝐈𝐂𝐇𝐀 𝐌𝐀𝐒𝐂𝐔𝐋𝐈𝐍𝐀 - 𝐀𝐋𝐔𝐍𝐎𝐒 \n\n⚡ ~ 𝐅𝐢𝐜𝐡𝐚 𝐝𝐨 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~ ⚡..." }
               ].map((btn, idx) => (
                 <button 
                   key={idx}
                   onClick={() => setInput(btn.template)}
                   className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[8px] font-heading text-white/40 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all uppercase tracking-widest shadow-lg"
                 >
                   {btn.label}
                 </button>
               ))}
            </div>
          )}

          <div className="relative">
            {/* Mention Menu - MONSTER QUALITY */}
            {showMentionMenu && mentionSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-6 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                   <p className="text-[9px] font-heading text-primary uppercase tracking-[0.4em]">Invocando Membros...</p>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {mentionSuggestions.map(member => (
                    <button
                      key={member.user_id}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); selectMention(member); }}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all group/member text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 shadow-xl group-hover/member:scale-110 transition-transform">
                         {member.avatar_url ? (
                           <img src={member.avatar_url} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center font-heading text-primary">{member.full_name[0]}</div>
                         )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-heading text-white/90 truncate leading-none mb-1">{member.full_name}</p>
                        <p className="text-[9px] font-heading text-white/20 uppercase tracking-widest">@{member.username}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-primary/20 group-hover/member:bg-primary shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={sendMessage} className="flex gap-4 items-end">
              <div className="flex-1 relative group/input">
                 <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-1000" />
                 <input
                   ref={inputRef}
                   value={input}
                   onChange={handleInputChange}
                   onKeyDown={(e) => { if (e.key === 'Escape') setShowMentionMenu(false); }}
                   placeholder={cooldown > 0 ? `Concentrando energia... (${cooldown}s)` : `Sussurre algo em ${channel.name}...`}
                   className="w-full relative z-10 bg-black/60 backdrop-blur-2xl border border-white/5 focus:border-primary/40 rounded-[2rem] px-8 py-5 text-base text-white placeholder:text-white/20 focus:outline-none transition-all shadow-inner font-serif italic"
                   disabled={cooldown > 0}
                   autoComplete="off"
                 />
              </div>
              <button 
                type="submit" 
                disabled={!input.trim() || cooldown > 0}
                className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center relative z-10 shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 ${
                  cooldown > 0 ? 'bg-white/5 border border-white/10 text-white/20 cursor-wait' : 'bg-primary text-white shadow-[0_15px_30px_rgba(251,191,36,0.3)]'
                }`}
              >
                {cooldown > 0 ? <span className="font-heading text-xs">{cooldown}</span> : <span className="text-2xl drop-shadow-lg">✨</span>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
