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
        className={`relative p-2.5 transition-all duration-300 rounded-2xl flex items-center justify-center group ${open ? "bg-white/10 text-white shadow-xl" : "text-white/40 hover:text-white hover:bg-white/5"}`}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-xl relative z-10 drop-shadow-lg">🔔</span>
        </div>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white rounded-full text-[9px] flex items-center justify-center font-heading font-bold shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-16 left-0 w-[22rem] bg-black/80 backdrop-blur-3xl border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-inner">
                  <span className="text-sm">📨</span>
               </div>
               <h3 className="font-heading text-xs text-white tracking-[0.2em] uppercase">Mensagens da Coruja</h3>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] text-primary hover:text-primary/80 font-heading tracking-widest uppercase transition-colors">LIMPAR TUDO</button>
            )}
          </div>
          
          <div className="max-h-[30rem] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                   <span className="text-3xl grayscale opacity-20">🦉</span>
                </div>
                <p className="text-[10px] font-heading text-white/20 uppercase tracking-[0.3em]">Nenhuma coruja à vista</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isMorpheus = n.title.toLowerCase().includes("morpheus") || n.message.toLowerCase().includes("security") || n.title.toLowerCase().includes("sistema");
                
                return (
                  <div 
                    key={n.id} 
                    className={`relative p-6 border-b border-white/5 transition-all duration-500 cursor-pointer group/notif hover:bg-white/[0.03] ${!n.read ? "bg-white/[0.02]" : ""}`}
                    onClick={() => { if (!n.read) markAsRead(n.id); }}
                  >
                    {!n.read && (
                       <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                    )}

                    <div className="flex gap-4">
                      <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                        isMorpheus 
                          ? "bg-green-500/10 border-green-500/30 text-green-500 group-hover/notif:shadow-[0_0_20px_rgba(34,197,94,0.3)]" 
                          : "bg-white/5 border-white/10 text-white/60 group-hover/notif:scale-110"
                      }`}>
                        <span className="text-xl">{isMorpheus ? "💻" : "🦉"}</span>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                           <h4 className={`text-xs tracking-tight leading-tight ${isMorpheus ? "font-mono text-green-400" : !n.read ? "font-heading text-white" : "font-medium text-white/60"}`}>
                             {n.title.toUpperCase()}
                           </h4>
                           <span className="text-[8px] text-white/20 font-heading shrink-0">
                              {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                        
                        <p className={`text-[10px] leading-relaxed ${isMorpheus ? "font-mono text-green-500/60" : "text-white/40"}`}>{n.message}</p>
                        
                        {n.link && (
                          <Link 
                            to={n.link} 
                            onClick={() => setOpen(false)}
                            className={`text-[9px] font-heading tracking-widest uppercase mt-3 inline-flex items-center gap-2 transition-all ${
                               isMorpheus ? "text-green-500 hover:text-green-400" : "text-primary hover:text-primary/80"
                            }`}
                          >
                            ACESSAR AGORA <span className="text-xs">→</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-4 bg-white/[0.02] text-center border-t border-white/5">
             <p className="text-[8px] font-heading text-white/10 uppercase tracking-[0.4em]">Protocolo Morpheus Ativo</p>
          </div>
        </div>
      )}
    </div>
  );
}
