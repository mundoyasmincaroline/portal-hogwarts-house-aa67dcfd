import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import SafeImage from "@/components/SafeImage";

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

    // Fetch partner profiles with HOUSE info
    const ids = Array.from(partnerMap.keys());
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, username, avatar_url, house").in("user_id", ids);

    const result: DMThread[] = ids.map(pid => {
      const prof = profiles?.find(p => p.user_id === pid);
      const info = partnerMap.get(pid)!;
      return {
        partner_id: pid,
        partner_name: prof?.full_name || "Bruxo desconhecido",
        partner_username: prof?.username || "",
        partner_avatar: prof?.avatar_url || null,
        partner_house: prof?.house as any,
        last_message: info.lastMsg.content,
        last_at: info.lastMsg.created_at,
        unread: info.unread,
      };
    }).sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

    setThreads(result);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
      {/* Hero Header - MONSTER QUALITY */}
      <div className="relative group overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] p-12 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
           <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-700 animate-float">
              <MessageCircle size={40} className="text-primary drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
           </div>
           <div>
              <h1 className="font-heading text-4xl text-white tracking-tighter mb-4">Corujoteca Real</h1>
              <p className="text-[10px] font-heading text-white/20 uppercase tracking-[0.5em]">Onde as mensagens voam em silêncio</p>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6 opacity-20">
           <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin" />
           <p className="text-[10px] font-heading text-white uppercase tracking-[0.4em]">Invocando Mensagens...</p>
        </div>
      ) : threads.length === 0 ? (
        <div className="bg-black/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-20 text-center space-y-8">
          <div className="text-6xl animate-pulse grayscale opacity-30">🦉</div>
          <div className="space-y-2">
            <p className="text-sm text-white/40 font-serif italic">"Nenhuma coruja cruzou o seu caminho ainda."</p>
            <p className="text-[10px] font-heading text-white/20 uppercase tracking-widest leading-loose">
               Visite o perfil de um bruxo e inicie uma conexão mágica.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {threads.map(t => (
            <div
              key={t.partner_id}
              onClick={() => navigate(`/dashboard/dm/${t.partner_id}`)}
              className="group relative bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6 flex items-center gap-6 cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all duration-500 shadow-xl overflow-hidden"
            >
              {/* House Aura Background */}
              <div className={`absolute -inset-1.5 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 ${
                 (t as any).partner_house === 'gryffindor' ? 'bg-red-500' :
                 (t as any).partner_house === 'slytherin' ? 'bg-green-500' :
                 (t as any).partner_house === 'ravenclaw' ? 'bg-blue-500' : 'bg-yellow-500'
              }`} />
              
              <div className="relative shrink-0">
                 <div className="w-16 h-16 rounded-2xl border border-white/10 overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                    <SafeImage
                      src={t.partner_avatar}
                      alt={t.partner_name}
                      fallbackText={t.partner_name}
                      className="w-full h-full object-cover"
                    />
                 </div>
                 {t.unread > 0 && (
                   <span className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-white rounded-xl text-[10px] flex items-center justify-center font-heading shadow-[0_10px_20px_rgba(251,191,36,0.4)] animate-bounce">
                     {t.unread}
                   </span>
                 )}
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-heading text-lg text-white group-hover:text-primary transition-colors truncate tracking-tight">{t.partner_name}</p>
                  <span className="text-[9px] font-heading text-white/20 uppercase tracking-widest shrink-0 ml-4">
                    {new Date(t.last_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                   <p className={`text-sm truncate font-serif italic ${t.unread > 0 ? "text-white font-medium" : "text-white/30"}`}>
                     {t.last_message}
                   </p>
                </div>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-500">
                 <span className="text-white/40 text-xs">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
