import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, Trophy, Zap, Crown, Sparkles, Heart } from "lucide-react";


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
            item: payload.new.item_id.replace('mq_', '').replace('3d_', '').replace(/_/g, ' '),
            type: 'purchase'
          };
          setLastActivity(activity);
          
          toast(`🔥 ${activity.user} de ${activity.house} adquiriu: ${activity.item}`, {
            icon: <ShoppingBag className="text-yellow-500" size={16} />,
            duration: 5000,
            className: "glass border-yellow-500/30 bg-black/80 text-white font-heading text-xs tracking-tight",
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', table: 'profiles' }, (payload) => {
        // Detectar novo Fundador ou VIP
        const oldVip = (payload.old as any).vip_plan;
        const newVip = (payload.new as any).vip_plan;
        const username = (payload.new as any).username;

        if (oldVip !== newVip && newVip) {
          const type = newVip === 'founder' ? 'FUNDADOR 👑' : newVip === 'vip' ? 'VIP 💜' : 'PREMIUM ⭐';
          const icon = newVip === 'founder' ? <Crown className="text-yellow-400" size={20} /> : <Zap className="text-purple-400" size={20} />;
          
          toast(`✨ NOVO ${type}: @${username} acaba de ascender na hierarquia mágica!`, {
            icon,
            duration: 8000,
            className: "glass border-primary/50 bg-primary/10 text-white font-heading font-bold shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]",
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <>
      {lastActivity && (
        <div 
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] md:w-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="bg-black/90 backdrop-blur-xl border border-yellow-500/40 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_#eab308]" />
            <span className="text-[10px] font-heading text-white/90 uppercase tracking-[0.2em] whitespace-nowrap">
              <span className="text-yellow-400 font-bold">{lastActivity.user}</span> de {lastActivity.house} adquiriu <span className="text-white italic">{lastActivity.item}</span>
            </span>
          </div>
        </div>
      )}
    </>
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
