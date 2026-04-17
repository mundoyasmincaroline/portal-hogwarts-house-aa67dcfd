import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";

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

    const sub = supabase
      .channel(`notifications:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
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

  const unreadCount = notifications.filter(n => !n.read).length;

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
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-secondary"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-12 left-0 w-80 bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-3 border-b border-border flex justify-between items-center bg-secondary/30">
            <h3 className="font-heading text-sm text-foreground">Notificações</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] text-primary hover:underline">Marcar tudo como lido</button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Nenhuma coruja chegou ainda.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 border-b border-border/50 hover:bg-secondary/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                  onClick={() => { if (!n.read) markAsRead(n.id); }}
                >
                  <div className="flex gap-3">
                    <div className="text-xl mt-0.5">🦉</div>
                    <div>
                      <h4 className={`text-sm ${!n.read ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                        {n.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      
                      {n.link && (
                        <Link 
                          to={n.link} 
                          onClick={() => setOpen(false)}
                          className="text-[11px] font-heading text-primary mt-1 inline-block hover:underline"
                        >
                          Ver detalhes →
                        </Link>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleDateString()} às {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
