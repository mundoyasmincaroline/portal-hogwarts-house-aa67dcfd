import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import { useImmersion } from "@/hooks/core/useImmersion";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const { cast } = useImmersion();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };

    fetchNotifs();

    const channelId = `notifications:${user.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const sub = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev.slice(0, 19)]); // Limit locally too
        const title = (payload.new as any).title?.toLowerCase() || "";
        if (title.includes("medalha") || title.includes("desafio") || title.includes("nível") || title.includes("vip")) {
          cast('levelUp');
        } else {
          cast('owlHoot');
        }
        const n = payload.new as any;
        toast.info(`🦉 ${n.title ?? "Nova notificação"}${n.message ? `: ${n.message}` : ""}`, { duration: 4000 });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user?.id).eq("read", false);
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => {
          setOpen(!open);
          if (!open) cast('whoosh', { volume: 0.2 });
        }}
        className="relative touch-target w-10 h-10 text-foreground/85 hover:text-primary transition-all duration-300 rounded-xl hover:bg-primary/15 active:scale-90 group"
        aria-label="Notificações"
      >
        <div className="relative z-10 text-xl group-hover:rotate-12 transition-transform"><EmojiIcon e="🦉" /></div>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold shadow-[0_0_10px_hsl(var(--primary)/0.5)] border-2 border-background animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-[5rem] left-4 right-4 md:absolute md:bottom-14 md:left-0 md:right-auto md:w-96 bg-card border border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-[2rem] overflow-hidden z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-2xl">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-primary/5">
            <h3 className="font-heading text-sm text-foreground uppercase tracking-widest">Corujal</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] text-primary hover:text-primary/80 transition-colors uppercase font-bold tracking-tighter">Limpar pergaminhos</button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="text-4xl opacity-20 grayscale"><EmojiIcon e="🦉" /></div>
                <p className="text-xs text-foreground/70 italic font-serif">O corujal está silencioso hoje.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 hover:bg-white/5 transition-all duration-300 cursor-pointer group ${!n.read ? "bg-primary/5" : ""}`}
                    onClick={() => { if (!n.read) markAsRead(n.id); }}
                  >
                    <div className="flex gap-4">
                      <div className="text-2xl mt-1 group-hover:scale-110 transition-transform duration-500"><EmojiIcon e="🦉" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-sm leading-tight mb-1 ${!n.read ? "font-bold text-foreground" : "font-medium text-foreground/70"}`}>
                            {n.title === 'mention' ? '🦉 Menção' : n.title === 'system' ? '📜 Aviso' : n.title}
                          </h4>
                          <span className="text-[9px] text-foreground/55 font-mono shrink-0 whitespace-nowrap">
                             {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/75 leading-relaxed italic font-serif">{n.message}</p>
                        
                        {n.link && (
                          <Link 
                            to={n.link} 
                            onClick={() => setOpen(false)}
                            className="text-[10px] font-heading text-primary mt-2 inline-flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-widest"
                          >
                            Investigar →
                          </Link>
                        )}
                        <p className="text-[9px] text-muted-foreground/40 mt-2 uppercase tracking-tighter font-mono">
                          {new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shadow-[0_0_8px_rgba(212,175,55,0.5)]" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
