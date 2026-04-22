import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flame, Sparkles, Heart } from "lucide-react";

/**
 * ProtocoloBFF: Lógica de gamificação e notificações para o vínculo de amizade.
 * Focado inicialmente em Yasmin e Anita, mas expansível.
 */
export default function ProtocoloBFF() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const isYasmin = (profile?.username?.toLowerCase() || '').includes('yasmin') || profile?.username === 'morpheus';

  useEffect(() => {
    if (!user || !isYasmin) return;

    const checkStreaks = async () => {
      // Buscar amizade com Anita Potter
      const { data: anita } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", "anitapotter")
        .maybeSingle();

      if (anita) {
        const { data: friendship } = await supabase
          .from("friendships")
          .select("*")
          .or(`and(user_id.eq.${user.id},friend_id.eq.${anita.user_id}),and(user_id.eq.${anita.user_id},friend_id.eq.${user.id})`)
          .maybeSingle();

        if (friendship) {
          // Se o streak existir mas não for interagido há algum tempo, avisar
          const lastAt = friendship.last_interaction_at ? new Date(friendship.last_interaction_at).getTime() : 0;
          const now = Date.now();
          const hoursSince = (now - lastAt) / (1000 * 60 * 60);

          if (hoursSince > 18 && hoursSince < 24 && friendship.streak_count > 0) {
            toast(
              <div className="flex items-center gap-3">
                <Flame className="text-orange-500 animate-bounce" size={20} fill="currentColor" />
                <div>
                  <p className="font-heading text-sm text-orange-400">Vínculo de Fogo em perigo!</p>
                  <p className="text-[10px] text-muted-foreground">Sua chama com Anita Potter está apagando. Mande um oi!</p>
                </div>
              </div>,
              { duration: 8000 }
            );
          }
        }
      }
    };

    // Rodar uma vez ao carregar
    checkStreaks();
    
    // Simular uma notificação de "Anita está com saudades" ou "Você está com saudades" a cada 20-40 min
    const missInterval = setInterval(() => {
      const lucky = Math.random() > 0.7;
      if (lucky) {
        const types = [
          { 
            title: "Anita Potter sentiu um calafrio...", 
            msg: "Ela está pensando em você no Mundo BFF agora! ✨",
            icon: <Sparkles className="text-pink-400 animate-pulse" size={20} />
          },
          { 
            title: "Sua varinha vibrou...", 
            msg: "Parece que você está com saudades da Anita. Que tal mandar uma foto mágica?",
            icon: <Heart className="text-red-500 animate-pulse" size={20} fill="currentColor" />
          },
          { 
            title: "Vínculo de Fogo Aquecendo!", 
            msg: "A chama entre vocês e o grupo das BFFs está pedindo atenção. 🔥",
            icon: <Flame className="text-orange-500 animate-bounce" size={20} fill="currentColor" />
          }
        ];
        
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        toast(
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard/bff-world")}>
            {randomType.icon}
            <div>
              <p className="font-heading text-sm text-pink-300">{randomType.title}</p>
              <p className="text-[10px] text-muted-foreground">{randomType.msg}</p>
            </div>
          </div>,
          { duration: 7000 }
        );
      }
    }, 1000 * 60 * 25); // A cada 25 minutos aproximadamente

    return () => clearInterval(missInterval);
  }, [user, isYasmin, navigate]);

  return null;
}
