import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Flame, Sparkles } from "lucide-react";

/**
 * AnitaPresence: Monitor de Conexão com a BFF Real (Anita Potter).
 * Focada em notificar a Yasmin com efeitos AAA quando sua melhor amiga entra no portal.
 */
export default function AnitaPresence() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isAnitaOnline, setIsAnitaOnline] = useState(false);
  const [anitaProfile, setAnitaProfile] = useState<any>(null);

  // Apenas Yasmin (ou Arquiteto) recebe essas notificações de elite
  const username = profile?.username?.toLowerCase() || '';
  const isYasmin = username.includes('yasmin') || username === 'morpheus';

  useEffect(() => {
    if (!isYasmin) return;

    // Monitorar status da Anita via Realtime
    const fetchAnita = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("online, last_seen, avatar_url, full_name")
        .eq("username", "anitapotter")
        .maybeSingle();
      
      if (data) {
        setAnitaProfile(data);
        const wasOnline = isAnitaOnline;
        const nowOnline = !!data.online;
        
        if (nowOnline && !wasOnline) {
          toast(
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate("/dashboard/bff-world")}>
              <div className="relative">
                 <div className="absolute -inset-2 bg-pink-500 rounded-full blur opacity-40 animate-pulse" />
                 <div className="relative w-14 h-14 rounded-full border-2 border-pink-500 overflow-hidden shadow-[0_0_20px_rgba(236,72,153,0.5)]">
                    <img src={data.avatar_url || "/default_avatar.png"} className="w-full h-full object-cover" alt="Anita" />
                 </div>
                 <div className="absolute -bottom-1 -right-1 bg-pink-500 text-white p-1 rounded-full border border-black animate-bounce">
                    <Heart size={10} fill="currentColor" />
                 </div>
              </div>
              <div>
                <p className="font-heading text-xs text-pink-400 font-bold uppercase tracking-widest">Anita Potter está Online!</p>
                <p className="text-[10px] text-white/70 italic leading-tight mt-1">Sua BFF acabou de entrar no Mundo Yasmin. Vá manter o Vínculo de Fogo!</p>
              </div>
            </div>,
            { duration: 10000, position: 'top-center' }
          );
        }
        setIsAnitaOnline(nowOnline);
      }
    };

    fetchAnita();
    const interval = setInterval(fetchAnita, 30000); // Checa a cada 30 segundos

    return () => clearInterval(interval);
  }, [isYasmin, isAnitaOnline, navigate]);

  if (!isYasmin || !isAnitaOnline) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 glass bg-pink-500/10 border-pink-500/20 px-4 py-2 rounded-full shadow-[0_0_30px_rgba(236,72,153,0.2)] animate-in fade-in slide-in-from-top-10 duration-1000 cursor-pointer hover:bg-pink-500/20 transition-all" onClick={() => navigate("/dashboard/bff-world")}>
       <div className="w-2 h-2 bg-pink-500 rounded-full animate-ping shadow-[0_0_10px_#ec4899]" />
       <span className="text-[10px] font-heading font-bold text-pink-400 tracking-widest uppercase">Anita está no Portal</span>
       <div className="flex gap-1">
          <Flame size={12} className="text-orange-500 animate-bounce" />
          <Sparkles size={12} className="text-yellow-400 animate-pulse" />
       </div>
    </div>
  );
}
