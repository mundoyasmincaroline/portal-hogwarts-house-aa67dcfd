import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import HouseCrest from "@/components/rpg/HouseCrest";
import { House } from "@/types";
import { addXP } from "@/services/core/xpService";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap, Flame, Sparkles, MessageCircle, Users } from "lucide-react";
import MagicalEmoji from "@/components/shared/MagicalEmoji";

import EmojiIcon from "@/components/shared/EmojiIcon";
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
    vip_plan: string | null;
  };
  characters?: {
    full_name: string;
    house: House;
    avatar_url: string | null;
    vip_plan: string | null;
  };
}

export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, profile } = useAuth();
  
  const [channel, setChannel] = useState<any>(null);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
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
    const parts = processedText.split(/(\*[^*]+\*|\([^)]+\)|"[^"]+"|@[\w.]+|\{[^}]+\}|~[^~]+~)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span key={i} className="font-bold text-yellow-400 bg-yellow-400/10 rounded px-0.5 cursor-pointer hover:underline">
            {part}
          </span>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <span key={i} className="italic text-primary/80 font-serif">{part.slice(1, -1)}</span>;
      }
      if (part.startsWith('(') && part.endsWith(')')) {
        return <span key={i} className="italic text-muted-foreground/60 text-[13px]">{part}</span>;
      }
      if (part.startsWith('{') && part.endsWith('}')) {
        return <span key={i} className="text-primary/85 italic font-serif text-[13px]">[{part.slice(1, -1)}]</span>;
      }
      if (part.startsWith('~') && part.endsWith('~')) {
        return <span key={i} className="text-foreground/55 italic text-[12px] tracking-widest">{part}</span>;
      }
      if (part.startsWith('"') && part.endsWith('"')) {
        return <span key={i} className="font-semibold text-foreground/90 border-l-2 border-primary/20 pl-2 ml-1">{part}</span>;
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
    if ((data as any).pinned_message_id) {
      const { data: pm } = await supabase.from("messages").select("*, characters(full_name, house, avatar_url)").eq("id", (data as any).pinned_message_id).single();
      if (pm) {
        // Fetch profile for pinned message too
        const { data: p } = await supabase.from("profiles").select("user_id, full_name, username, house, avatar_url").eq("user_id", pm.user_id).single();
        if (p) setPinnedMessage({ ...pm, profiles: p } as unknown as Message);
      }
    }
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
        supabase.from("profiles").select("user_id, full_name, username, house, avatar_url, vip_plan").in("user_id", userIds),
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
    
    const channelId = `messages:${channel.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const subscription = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channel.id}` }, async (payload) => {
        // Só adiciona ao vivo se a data selecionada for hoje
        const todayStr = new Date().toLocaleDateString('en-CA');
        if (selectedDate !== todayStr) return;

        try {
          const [{ data: userData }, { data: charData }, { data: roleData }] = await Promise.all([
            supabase.from("profiles").select("full_name, username, house, avatar_url, vip_plan").eq("user_id", payload.new.user_id).maybeSingle(),
            payload.new.character_id ? supabase.from("characters").select("full_name, house, avatar_url").eq("id", payload.new.character_id).maybeSingle() : Promise.resolve({ data: null }),
            supabase.from("user_roles").select("role").eq("user_id", payload.new.user_id).maybeSingle()
          ]);
          
          const profileData = userData || { 
            full_name: "Bruxo Desconhecido", 
            username: "bruxo", 
            house: "gryffindor", 
            avatar_url: null,
            vip_plan: null
          };

          setMessages(prev => [...prev, { 
            ...payload.new, 
            profiles: profileData, 
            characters: charData, 
            user_role: roleData?.role 
          } as unknown as Message]);
        } catch (err) {
          console.error("Error processing realtime message:", err);
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
    if (!input.trim() || !channel || !user || cooldown > 0 || isSending) return;
    setIsSending(true);
    try {
    const content = input;

    // ── RPG Command: /dado ──
    if (content.startsWith('/dado')) {
      const parts = content.split(' ');
      const sides = parseInt(parts[1]) || 20;
      const roll = Math.floor(Math.random() * sides) + 1;
      const rollContent = `🎲 *Rolou um dado de ${sides} lados e tirou: ${roll}*`;
      
      const { error: rollErr } = await supabase.from("messages").insert({
        channel_id: channel.id,
        user_id: user.id,
        character_id: profile?.active_character_id ?? null,
        content: rollContent
      });
      if (!rollErr) {
        setInput("");
        return;
      }
    }

    
    // Verificações rigorosas de moderação (Filch - O VIGIA)
    const lowerContent = content.toLowerCase();
    const hasBannedWord = bannedWords.some(word => lowerContent.includes(word));
    
    // Filtro de Segurança Reforçado (Vigia)
    const dangerousPatterns = [
      /sexo|pau|buceta|safad|novinh|whats|tel|contato|pqp|fdp|porra/i,
      /\d{8,}/, // Bloqueia sequencias de números que pareçam telefone
      /(.)\1{5,}/ // Bloqueia spam de caracteres repetidos
    ];
    const hasDangerousPattern = dangerousPatterns.some(regex => regex.test(content));
    
    const isAllCaps = content.length > 20 && content === content.toUpperCase();
    
    if (hasBannedWord || hasDangerousPattern || isAllCaps) {
      let reason = hasBannedWord ? "Palavra proibida" : isAllCaps ? "Gritaria (CAPS LOCK)" : "Conteúdo Inapropriado ou Spam";

      toast.error(
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full border border-red-500 bg-gradient-to-br from-red-950 to-black flex items-center justify-center text-lg shrink-0">🗝️</div>
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
      setIsSending(false);
      return;
    }

    setInput("");
    setShowMentionMenu(false);
    setCooldown(2); // Reduced from 30 to 2 for better UX, but keeping a small buffer
    // Note: Database triggers/RLS might handle the real anti-spam logic

    const { error } = await supabase.from("messages").insert({
      channel_id: channel.id,
      user_id: user.id,
      character_id: profile?.active_character_id || null,
      content: content.trim()
    });

    if (error) {
      toast.error("Erro ao enviar mensagem.");
      setInput(content);
    } else {
      // Global @todos / @everyone notification
      if (isAdmin && (content.includes("@todos") || content.includes("@everyone"))) {
        const { data: allMembers } = await supabase.from("profiles").select("user_id").eq("approved", true);
        if (allMembers) {
          const senderName = profile?.full_name || 'Admin';
          const notifs = allMembers
            .filter(p => p.user_id !== user.id)
            .map(p => ({ user_id: p.user_id, title: 'system', message: `📣 @TODOS: ${senderName} enviou uma mensagem importante no chat "${channel.name}"`, read: false
             }));
          await supabase.from("notifications").insert(notifs);
          toast.success("📣 Chamado Geral enviado para todos os bruxos!");
        }
      }

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
            .map(p => ({ user_id: p.user_id, title: 'mention', message: `@${senderName} mencionou você no chat "${channel.name}"`, read: false
             }));
          if (notifs.length > 0) {
            await supabase.from('notifications').insert(notifs);
          }
        }
      }
    }
    setIsSending(false);
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!isAdmin) return;
    try {
      const { error } = await supabase.from("messages").delete().eq("id", messageId);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Mensagem banida para a Seção Reservada! 📚");
    } catch (err: any) {
      toast.error("Erro ao deletar: " + err.message);
    }
  };

  const pinMessage = async (msg: Message) => {
    if (!isAdmin) return;
    try {
      const { error } = await supabase.from("channels").update({ pinned_message_id: msg.id } as never).eq("id", roomId);
      if (error) throw error;
      setPinnedMessage(msg);
      toast.success("Mensagem fixada no topo do Salão! 📌");
    } catch (err: any) {
      toast.error("Erro ao fixar: " + err.message);
    }
  };

  const unpinMessage = async () => {
    if (!isAdmin) return;
    try {
      const { error } = await supabase.from("channels").update({ pinned_message_id: null } as never).eq("id", roomId);
      if (error) throw error;
      setPinnedMessage(null);
      toast.success("Mensagem desafixada.");
    } catch (err: any) {
      toast.error("Erro ao desafixar: " + err.message);
    }
  };

  if (loading || !channel) return (
    <div className="h-dvh flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mx-auto" />
        <p className="font-heading text-xl text-yellow-500/60 animate-pulse">Abrindo os portais do Salão Comunal...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto h-[calc(100dvh-130px)] md:h-[calc(100vh-120px)] flex flex-col glass rounded-xl sm:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative mb-4">
      {/* ── BACKGROUND DE IMERSÃO ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none" />
      
      {/* ── HEADER MONSTER QUALITY ── */}
      <div className="relative z-10 p-4 sm:p-6 border-b border-white/5 bg-white/5 backdrop-blur-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 sm:gap-5">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/chats")} className="shrink-0 hover:bg-white/5 rounded-xl sm:rounded-2xl w-10 h-10 sm:w-12 sm:h-12">
            <ExternalLink size={18} className="rotate-180 sm:w-5 sm:h-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="font-heading text-lg sm:text-2xl text-foreground flex items-center gap-2 tracking-tight truncate">
                {channel.name}
              </h2>
              {channel.is_premium && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 animate-pulse-glow text-[8px] sm:text-xs">PREMIUM ⭐</Badge>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-serif italic mt-0.5 truncate">{channel.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Penseira de Hogwarts</span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-black/40 text-xs text-white/80 px-4 py-2 rounded-xl border border-white/10 focus:border-yellow-500/50 focus:outline-none transition-all cursor-pointer"
            />
          </div>
          <div className="h-10 w-[1px] bg-white/10 mx-2 hidden md:block" />
          <div className="flex -space-x-3">
             {/* Simulação de membros online */}
             <div className="w-8 h-8 rounded-full border-2 border-black bg-yellow-500/20 flex items-center justify-center text-[10px] font-bold text-yellow-400"><EmojiIcon e="⚡" /></div>
             <div className="w-8 h-8 rounded-full border-2 border-black bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400"><EmojiIcon e="🛡️" /></div>
          </div>
        </div>
      </div>

      {/* ── PINNED MESSAGE ── */}
      {pinnedMessage && (
        <div className="relative z-20 bg-primary/10 border-b border-primary/20 p-3 flex items-center justify-between animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary"><EmojiIcon e="📌" /></div>
             <div>
               <p className="text-[10px] text-primary font-heading uppercase tracking-widest">Fixado por {pinnedMessage.profiles.full_name}</p>
               <p className="text-xs text-foreground/80 line-clamp-1">{pinnedMessage.content}</p>
             </div>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={unpinMessage} className="text-[10px] h-8 rounded-lg hover:bg-red-500/10 text-red-400">
              Desafixar
            </Button>
          )}
        </div>
      )}

      {/* ── ÁREA DE VÍDEO (CASO EXISTA) ── */}
      {channel.meet_link && (
        <div className="relative z-10 bg-black/95 border-b border-white/5 h-[280px] sm:h-[450px] shrink-0 group">
          <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" onClick={() => window.open(channel.meet_link, "_blank")} className="bg-black/60 backdrop-blur-md border-white/20 text-xs rounded-xl hover:bg-white/10">
              Ver em Tela Cheia <EmojiIcon e="🔗" />
            </Button>
          </div>
          <iframe 
            src={channel.meet_link.includes('meet.google') ? undefined : channel.meet_link} 
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full border-0"
          />
          {channel.meet_link.includes('meet.google') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-t from-black via-transparent to-black/40">
              <MagicalEmoji emoji="🎥" size="lg" glowColor="rgba(234, 179, 8, 0.4)" className="mb-6 animate-pulse" />
              <h3 className="font-heading text-2xl text-white mb-2">Transmissão em Andamento</h3>
              <p className="text-sm text-white/50 max-w-sm mb-8 font-serif italic">"O Google Meet protege a privacidade de seus alunos. Clique abaixo para conjurar sua presença na sala."</p>
              <Button variant="magical" size="lg" className="rounded-2xl min-h-14 h-auto px-5 sm:px-10 shadow-2xl" onClick={() => window.open(channel.meet_link, "_blank")}>
                Participar da Aula <EmojiIcon e="📞" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── MENSAGENS MONSTER QUALITY ── */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
        <ErrorBoundary fallback={<div className="text-center py-20 text-red-500/50 font-serif">A magia deste salão foi perturbada...</div>}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-6 max-w-xs animate-in fade-in zoom-in duration-1000">
                <MagicalEmoji emoji="🕯️" size="lg" glowColor="rgba(255, 255, 255, 0.1)" className="mx-auto grayscale opacity-40" />
                <div className="space-y-2">
                  <p className="text-foreground/55 text-lg font-serif italic">"O silêncio é a primeira página de um grande livro."</p>
                  <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Seja o primeiro a escrever</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((m) => {
                const profileData: any = m.characters || m.profiles || { full_name: "Bruxo Desconhecido", username: "desconhecido", house: "gryffindor", avatar_url: null };
                const profileName = profileData.full_name || "Desconhecido";
                const profileUser = profileData.username || "desconhecido";
                const isMe = m.user_id === user?.id;
                
                const isMorpheus = profileName.toLowerCase().includes('morpheus') || profileUser.toLowerCase().includes('morpheus');
                const isYasmin = profileName.toLowerCase().includes('yasmin') || profileUser.toLowerCase().includes('mundoyasmincaroline');
                const isCarolina = profileName.toLowerCase().includes('carolina') || profileUser.toLowerCase().includes('carolinaas.assis');

                let houseColor = "border-white/10 bg-white/5";
                let nameColor = "text-foreground";
                let glowColor = "shadow-none";

                if (profileData.house === 'gryffindor') { houseColor = "border-red-900/30 bg-red-950/10"; nameColor = "text-red-400"; glowColor = "group-hover:shadow-[0_0_20px_rgba(153,27,27,0.1)]"; }
                if (profileData.house === 'slytherin') { houseColor = "border-emerald-900/30 bg-emerald-950/10"; nameColor = "text-emerald-400"; glowColor = "group-hover:shadow-[0_0_20px_rgba(6,78,59,0.1)]"; }
                if (profileData.house === 'ravenclaw') { houseColor = "border-blue-900/30 bg-blue-950/10"; nameColor = "text-blue-400"; glowColor = "group-hover:shadow-[0_0_20px_rgba(30,58,138,0.1)]"; }
                if (profileData.house === 'hufflepuff') { houseColor = "border-amber-900/30 bg-amber-950/10"; nameColor = "text-amber-400"; glowColor = "group-hover:shadow-[0_0_20px_rgba(146,64,14,0.1)]"; }

                if (isMorpheus) { houseColor = "border-green-500/30 bg-black/40"; nameColor = "text-green-500"; glowColor = "shadow-[0_0_30px_rgba(34,197,94,0.15)]"; }
                if (isYasmin) { houseColor = "border-yellow-500/30 bg-yellow-950/10"; nameColor = "text-yellow-400"; glowColor = "shadow-[0_0_30px_rgba(234,179,8,0.15)]"; }
                if (isCarolina) { houseColor = "border-blue-500/30 bg-blue-950/10"; nameColor = "text-blue-400"; glowColor = "shadow-[0_0_30px_rgba(59,130,246,0.15)]"; }

                return (
                  <div key={m.id} className={`flex gap-4 group ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="shrink-0 relative">
                      <Link to={`/dashboard/profile/${m.user_id}`} className={`block w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-500 hover:scale-110 shadow-xl ${
                        isMorpheus ? 'border-green-500/50 rounded-lg animate-pulse' 
                        : isYasmin ? 'border-yellow-500/50 shadow-yellow-500/20' 
                        : isCarolina ? 'border-blue-500/50 shadow-blue-500/20'
                        : `border-${profileData.house === 'hufflepuff' ? 'amber' : profileData.house === 'ravenclaw' ? 'blue' : profileData.house === 'slytherin' ? 'emerald' : 'red'}-500/30`
                      }`}>
                        {profileData.avatar_url ? (
                          <img src={profileData.avatar_url} alt={profileName} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center font-heading text-lg ${nameColor} bg-secondary/50`}>
                            {profileName.charAt(0)}
                          </div>
                        )}
                      </Link>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center bg-black/80 shadow-lg`}>
                         <HouseCrest house={profileData.house} size="xs" />
                      </div>
                    </div>

                    {/* Conteúdo da Mensagem */}
                    <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                      <div className={`flex items-center gap-3 mb-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] sm:text-[11px] font-heading font-bold uppercase tracking-wider ${nameColor}`}>
                            {isMorpheus ? "MORPHEUS [ARQUITETO]" : isYasmin ? "YASMIN [FUNDADORA]" : isCarolina ? "CAROLINA [GUARDIÃ]" : profileName}
                          </span>
                          {m.profiles?.vip_plan === "founder" && <span className="text-[7px] text-yellow-500 font-bold bg-yellow-500/10 px-1 rounded-sm border border-yellow-500/20"><EmojiIcon e="👑" /></span>}
                          {m.profiles?.vip_plan === "vip" && <span className="text-[7px] text-purple-400 font-bold bg-purple-500/10 px-1 rounded-sm border border-purple-500/20"><EmojiIcon e="💜" /></span>}
                        </div>
                        <span className="text-[8px] text-white/20 font-serif italic">{formatDate(m.created_at)}</span>
                        {isAdmin && !isMe && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all ml-2">
                            <button onClick={() => pinMessage(m)} className="text-primary hover:text-primary/80 text-[10px] font-bold uppercase" title="Fixar">
                               <EmojiIcon e="📌" />
                            </button>
                            <button onClick={() => deleteMessage(m.id)} className="text-red-500 hover:text-red-400 text-[10px] font-bold uppercase" title="Remover">
                               <EmojiIcon e="🚫" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className={`relative px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-[1.4rem] sm:rounded-[1.8rem] border backdrop-blur-xl transition-all duration-500 ${houseColor} ${glowColor} ${
                        isMe ? 'rounded-tr-none' : 'rounded-tl-none'
                      }`}>
                        {/* Hero Effects */}
                        {(isYasmin || isMorpheus || isCarolina) && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none rounded-[1.8rem]" />
                        )}
                        
                        <div className={`text-[14px] leading-relaxed break-words ${
                           isMorpheus ? 'font-mono text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-glitch'
                           : isYasmin ? 'text-yellow-50 drop-shadow-[0_0_5px_rgba(250,204,21,0.2)]'
                           : 'text-foreground/90'
                        }`}>
                          {renderRPGText(m.content)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ErrorBoundary>
      </div>

      {/* ── INPUT MONSTER QUALITY ── */}
      <div className="relative z-10 p-3 sm:p-5 bg-black/40 backdrop-blur-3xl border-t border-white/5">
        {/* RP TOOLBAR - MONSTER QUALITY */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 scrollbar-hide overflow-x-auto pb-1">
          <Button size="sm" variant="outline" className="text-[9px] h-7 bg-primary/5 border-primary/20 rounded-xl hover:bg-primary/10" onClick={() => setInput(input + "*ação*")}>
            <EmojiIcon e="⚔️" /> Ação
          </Button>
          <Button size="sm" variant="outline" className="text-[9px] h-7 bg-blue-500/5 border-blue-500/20 rounded-xl hover:bg-blue-500/10" onClick={() => setInput(input + "(pensamento)")}>
            <EmojiIcon e="🧠" /> Pensamento
          </Button>
          <Button size="sm" variant="outline" className="text-[9px] h-7 bg-pink-500/5 border-pink-500/20 rounded-xl hover:bg-pink-500/10" onClick={() => setInput(input + "{sentimento}")}>
            <EmojiIcon e="❤️" /> Sentimento
          </Button>
          <Button size="sm" variant="outline" className="text-[9px] h-7 bg-white/5 border-white/10 rounded-xl hover:bg-white/10" onClick={() => setInput(input + "~sussurro~")}>
            <EmojiIcon e="💨" /> Sussurro
          </Button>
          <Button size="sm" variant="outline" className="text-[9px] h-7 bg-white/5 border-white/10 rounded-xl hover:bg-white/10" onClick={() => setInput(input + "\"fala\"")}>
            <EmojiIcon e="💬" /> Fala
          </Button>
          <div className="h-4 w-[1px] bg-white/10 mx-1 self-center" />
          {isAdmin && (channel?.name?.includes("Fichas") || channel?.name?.includes("𝐅𝐢𝐜𝐡𝐚𝐬")) && (
            <>
              <Button size="sm" variant="outline" className="text-[9px] h-7 bg-yellow-500/5 border-yellow-500/20 rounded-xl" onClick={() => setInput("✨ ~ 𝐅𝐢𝐜𝐡𝐚 𝐏𝐞𝐬𝐬𝐨𝐚𝐥 ~ ✨\n\n📸 𝐅𝐨𝐭𝐨:\n👤 𝐍𝐨𝐦𝐞:\n⏳ 𝐈𝐝𝐚𝐝𝐞:\n🏰 𝐂𝐚𝐬𝐚:\n🌀 𝐏𝐚𝐭𝐫𝐨𝐧𝐨:\n💫 𝐅𝐞𝐢𝐭𝐢ç𝐨 𝐅𝐚𝐯𝐨𝐫𝐢𝐭𝐨:")}>
                <EmojiIcon e="📋" /> Modelo Pessoal
              </Button>
              <Button size="sm" variant="outline" className="text-[9px] h-7 bg-yellow-500/5 border-yellow-500/20 rounded-xl" onClick={() => setInput("𝐅𝐈𝐂𝐇𝐀 𝐀𝐋𝐔𝐍𝐎(𝐀) \n\n⚡ ~ 𝐅𝐢𝐜𝐡𝐚 𝐝𝐨 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐦 ~ ⚡\n\n📜 𝐍𝐨𝐦𝐞:\n⏳ 𝐈𝐝𝐚𝐝𝐞:\n🏰 𝐂𝐚𝐬𝐚:\n📚 𝐇𝐢𝐬𝐭ó𝐫𝐢𝐚:\n✨ 𝐕𝐚𝐫𝐢𝐧𝐡𝐚:\n🩸 𝐒𝐚𝐧𝐠𝐮𝐞:")}>
                <EmojiIcon e="🏰" /> Ficha Aluno
              </Button>
            </>
          )}
        </div>


        <div className="relative group">
          {showMentionMenu && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-4 bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
              <div className="p-3 text-[9px] text-yellow-500/60 font-bold uppercase tracking-widest px-4 border-b border-white/5">Invocando Membros... <EmojiIcon e="🔮" /></div>
              <div className="max-h-[250px] overflow-y-auto">
                {mentionSuggestions.map(member => (
                  <button
                    key={member.user_id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectMention(member); }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-white/5 transition-all text-left border-b border-white/5 last:border-0"
                  >
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10">
                       {member.avatar_url ? <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-secondary/50 flex items-center justify-center font-heading text-primary">{member.username.charAt(0)}</div>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90 leading-none mb-1">{member.full_name}</p>
                      <p className="text-[10px] text-white/30 font-mono tracking-tight">@{member.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={sendMessage} className="flex gap-3 items-center">
            <div className="relative flex-1">
               <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Escape') setShowMentionMenu(false); }}
                placeholder={cooldown > 0 ? `Silêncio! Aguarde ${cooldown}s...` : `Escreva sua mensagem... (use @ para mencionar)`}
                className="w-full h-14 bg-black/40 border-white/10 rounded-2xl px-6 focus:ring-2 focus:ring-primary/20 transition-all text-sm font-serif italic shadow-2xl"
                disabled={cooldown > 0}
                autoComplete="off"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                 <span className="text-white/10 hover:text-white/30 transition-colors cursor-pointer text-xl"><EmojiIcon e="📸" /></span>
              </div>
            </div>
            
            <Button type="submit" variant="plaque" size="icon" className="w-14 h-14 rounded-2xl shadow-xl shadow-primary/10 active:scale-95 transition-transform" disabled={!input.trim() || cooldown > 0}>
              {cooldown > 0 ? (
                <span className="text-xs font-bold text-foreground/55">{cooldown}</span>
              ) : (
                <Zap size={22} className="text-white animate-pulse" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
