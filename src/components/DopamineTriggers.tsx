import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, ShoppingBag, Trophy, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DopamineTriggers() {
  const [lastActivity, setLastActivity] = useState<any>(null);

  useEffect(() => {
    // ─── Trigger Inveja/Desejo: Ver o que os outros compram ───
    const channel = supabase
      .channel('public_activity')
      .on('postgres_changes', { event: 'INSERT', table: 'user_items' }, async (payload) => {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name, house')
          .eq('user_id', payload.new.user_id)
          .single();
        
        if (prof) {
          const activity = {
            user: prof.full_name.split(' ')[0],
            house: prof.house,
            item: payload.new.item_id.replace('mq_', '').replace('_', ' '),
            type: 'purchase'
          };
          setLastActivity(activity);
          
          // Toast de Dopamine Social
          toast(`🔥 ${activity.user} de ${activity.house} acabou de adquirir: ${activity.item}`, {
            icon: <ShoppingBag className="text-yellow-500" size={16} />,
            duration: 5000,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AnimatePresence>
      {lastActivity && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 md:top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] md:w-auto"
        >

          <div className="bg-black/80 backdrop-blur-md border border-primary/40 rounded-full px-6 py-2 flex items-center gap-3 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-heading text-white/90 uppercase tracking-widest whitespace-nowrap">
              ATIVIDADE GLOBAL: <span className="text-primary">{lastActivity.user}</span> de {lastActivity.house} adquiriu {lastActivity.item}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LevelUpManager({ xp, level }: { xp: number, level: number }) {
  // Hook para detectar mudança de nível e disparar fogos/dopamina
  useEffect(() => {
     if (level > 1) {
       toast.success(`🔮 VOCÊ SUBIU DE NÍVEL! Agora você é Nível ${level}!`, {
         icon: <Trophy className="text-yellow-500" size={20} />,
         duration: 8000,
       });
       // Aqui poderia disparar o componente de confetes/fogos
     }
  }, [level]);
  
  return null;
}
