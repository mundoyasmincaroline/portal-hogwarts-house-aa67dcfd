import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * AnitaPresence: Monitora a atividade da Anita Potter e notifica a Yasmin.
 * Parte do Protocolo Amizade Real.
 */
export default function AnitaPresence() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isAnitaOnline, setIsAnitaOnline] = useState(false);

  // Apenas Yasmin (ou Morpheus para testes) recebe essas notificações
  const isYasmin = (profile?.username?.toLowerCase() || '').includes('yasmin') || profile?.username === 'morpheus';

  useEffect(() => {
    if (!user || !isYasmin) return;

    // Monitorar status da Anita
    const checkAnita = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("online, last_seen")
        .eq("username", "anitapotter")
        .maybeSingle();
      
      if (data) {
        const wasOnline = isAnitaOnline;
        const nowOnline = !!data.online;
        
        if (nowOnline && !wasOnline) {
          toast(
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard/bff-world")}>
              <div className="bg-pink-500/20 p-2 rounded-full text-pink-500 animate-pulse">
                <Heart size={20} fill="currentColor" />
              </div>
              <div>
                <p className="font-heading text-sm text-pink-400">Anita Potter está no portal!</p>
                <p className="text-[10px] text-muted-foreground italic">Sua BFF acabou de entrar. Vá dar um oi!</p>
              </div>
            </div>,
            { duration: 6000 }
          );
        }
        setIsAnitaOnline(nowOnline);
      }
    };

    checkAnita();
    const interval = setInterval(checkAnita, 60000); // Checa a cada minuto

    return () => clearInterval(interval);
  }, [user, isYasmin, isAnitaOnline]);

  return null; // Componente lógico, não renderiza nada visual fixo
}
