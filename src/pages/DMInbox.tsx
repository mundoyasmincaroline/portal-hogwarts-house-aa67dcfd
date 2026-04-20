import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { toast } from "sonner";

interface DMThread {
  partner_id: string;
  partner_name: string;
  partner_username: string;
  partner_avatar: string | null;
  last_message: string;
  last_at: string;
  unread: number;
}

export default function DMInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<DMThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadThreads();

    // Realtime: refresh inbox when new DM arrives
    const channel = supabase
      .channel("dm_inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages" }, () => loadThreads())
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

    if (!msgs) { setLoading(false); return; }

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
      };
    }).sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

    setThreads(result);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="glass rounded-2xl p-6 flex items-center gap-3">
        <MessageCircle size={24} className="text-primary" />
        <div>
          <h1 className="font-heading text-xl text-gold-gradient">Corujoteca — Mensagens Diretas</h1>
          <p className="text-xs text-muted-foreground">Suas conversas privadas mágicas</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-10">Acordando as corujas...</p>
      ) : threads.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">🦉</div>
          <p className="text-muted-foreground text-sm">Nenhuma conversa ainda.<br />Visite o perfil de um membro e clique em "💬 Mensagem".</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map(t => (
            <div
              key={t.partner_id}
              onClick={() => navigate(`/dashboard/dm/${t.partner_id}`)}
              className="glass rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-primary/40 border border-transparent transition-colors"
            >
              <div className="relative shrink-0">
                <SafeImage
                  src={t.partner_avatar}
                  alt={t.partner_name}
                  fallbackText={t.partner_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {t.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
                    {t.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-heading text-sm text-foreground truncate">{t.partner_name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {new Date(t.last_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className={`text-xs truncate ${t.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {t.last_message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
