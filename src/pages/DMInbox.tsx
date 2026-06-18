import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MessageCircle, MailWarning } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SafeImage from "@/components/SafeImage";

import EmojiIcon from "@/components/shared/EmojiIcon";

interface DMThread {
  partner_id: string;
  partner_name: string;
  partner_username: string;
  partner_avatar: string | null;
  last_message: string;
  last_at: string;
  unread: number;
  friendship_status: string; // 'accepted', 'pending', 'blocked', 'none'
}

export default function DMInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<DMThread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadThreads();

    // Realtime: refresh inbox when new DM arrives or status changes
    const channelId = `dm_inbox:${user.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "dm_messages",
      }, () => loadThreads())
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "friendships"
      }, () => loadThreads())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadThreads = async () => {
    if (!user) return;

    // Get all messages involving current user
    const { data: msgs } = await supabase
      .from("dm_messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    // Get all friendships involving current user
    const { data: fData } = await supabase
      .from("friendships")
      .select("user_id, friend_id, status")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    const friendshipMap = new Map<string, string>();
    if (fData) {
      fData.forEach(f => {
        const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
        friendshipMap.set(otherId, f.status);
      });
    }

    if (!msgs || msgs.length === 0) { setLoading(false); setThreads([]); return; }

    // Build unique partner list
    const partnerMap = new Map<string, { lastMsg: any; unread: number }>();
    msgs.forEach(m => {
      const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, { lastMsg: m, unread: 0 });
      }
      if (m.receiver_id === user.id && !m.read) {
        partnerMap.get(partnerId)!.unread++;
      }
    });

    if (partnerMap.size === 0) { setThreads([]); setLoading(false); return; }

    // Fetch partner profiles
    const ids = Array.from(partnerMap.keys());
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, username, avatar_url").in("user_id", ids);

    const result: DMThread[] = ids.map(pid => {
      const prof = profiles?.find(p => p.user_id === pid);
      const info = partnerMap.get(pid)!;
      return {
        partner_id: pid,
        partner_name: prof?.full_name || "Bruxo desconhecido",
        partner_username: prof?.username || "",
        partner_avatar: prof?.avatar_url || null,
        last_message: info.lastMsg.content,
        last_at: info.lastMsg.created_at,
        unread: info.unread,
        friendship_status: friendshipMap.get(pid) || "none"
      };
    }).sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
    
    // Filtramos threads de pessoas bloqueadas
    setThreads(result.filter(t => t.friendship_status !== "blocked"));
    setLoading(false);
  };

  const friendsThreads = threads.filter(t => t.friendship_status === "accepted" && (
    t.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.partner_username.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const pendingThreads = threads.filter(t => t.friendship_status !== "accepted" && (
    t.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.partner_username.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const unreadPending = pendingThreads.reduce((acc, t) => acc + t.unread, 0);

  const renderThreadList = (list: DMThread[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="glass rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3 opacity-50"><EmojiIcon e="🦉" /></div>
          <p className="text-muted-foreground text-sm">
            {searchQuery ? "Nenhum bruxo encontrado com esse nome." : emptyMessage}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {list.map(t => (
          <div
            key={t.partner_id}
            onClick={() => navigate(`/dashboard/dm/${t.partner_id}`)}
            className="glass rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-primary/40 border border-transparent transition-colors group"
          >
            <div className="relative shrink-0 transition-transform group-hover:scale-105">
              <SafeImage
                src={t.partner_avatar}
                alt={t.partner_name}
                fallbackText={t.partner_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {t.unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold shadow-[0_0_10px_rgba(212,175,55,0.6)]">
                  {t.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-heading text-sm text-foreground truncate">{t.partner_name}</p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                  {new Date(t.last_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className={`text-xs truncate ${t.unread > 0 ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                {t.last_message}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 px-2 sm:px-0">
      <div className="glass rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <MessageCircle size={24} className="text-primary" />
          <div>
            <h1 className="font-heading text-xl text-gold-gradient">Corujoteca — Mensagens Diretas</h1>
            <p className="text-xs text-muted-foreground">Suas conversas privadas mágicas</p>
          </div>
        </div>
        
        <Input 
          placeholder="Procurar bruxo ou conversa..."
          className="bg-background/50 border-primary/30"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-10 animate-pulse">Acordando as corujas...</p>
      ) : (
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-black/40 border border-primary/10 rounded-xl mb-4">
            <TabsTrigger value="friends" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">
              Amigos
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg relative">
              Solicitações
              {unreadPending > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="mt-0">
            {renderThreadList(friendsThreads, "Nenhuma conversa com amigos ainda.")}
          </TabsContent>
          
          <TabsContent value="requests" className="mt-0">
            <div className="mb-3 px-2 flex items-center gap-2 text-xs text-muted-foreground/80 italic font-serif">
              <MailWarning size={14} />
              <p>Mensagens de bruxos que não são seus amigos aparecem aqui. Eles só saberão que você leu se você aceitar.</p>
            </div>
            {renderThreadList(pendingThreads, "O corujal está limpo. Nenhuma solicitação pendente.")}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
