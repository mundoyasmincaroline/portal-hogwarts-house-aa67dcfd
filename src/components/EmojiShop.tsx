import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_required: number; // Cost in XP
}

export default function EmojiShop() {
  const { user, profile, fetchProfile } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      // Fetch available badges (store)
      const { data: bData } = await supabase.from('badges').select('*').order('xp_required', { ascending: true });
      if (bData) setBadges(bData);

      if (user) {
        const { data: ubData } = await supabase.from('user_badges').select('badge_id').eq('user_id', user.id);
        const owned = new Set<string>();
        ubData?.forEach(b => owned.add(b.badge_id));
        setUserBadges(owned);
      }
      setLoading(false);
    };
    loadBadges();
  }, [user]);

  const buyBadge = async (badge: Badge) => {
    if (!user || !profile) return;
    if (profile.xp < badge.xp_required) {
      toast.error("XP insuficiente!");
      return;
    }
    if (userBadges.has(badge.id)) {
      toast.error("Você já possui esta insígnia!");
      return;
    }

    try {
      // Deduct XP
      const newXp = profile.xp - badge.xp_required;
      await supabase.from('profiles').update({ xp: newXp }).eq('user_id', user.id);
      
      // Award Badge
      await supabase.from('user_badges').insert({ user_id: user.id, badge_id: badge.id });
      
      setUserBadges(prev => new Set([...prev, badge.id]));
      await fetchProfile(user.id);
      
      toast.success(`Parabéns! Você adquiriu a insígnia ${badge.icon} ${badge.name}!`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar a compra.");
    }
  };

  if (loading) return null;

  return (
    <div className="glass rounded-2xl p-6 my-6">
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl text-gold-gradient mb-2">Borgin & Burkes - Emojis Raros</h2>
        <p className="text-muted-foreground text-sm">Troque seu XP acumulado por insígnias e emojis exclusivos.</p>
        <p className="text-xs text-primary mt-1">Aviso: Gastar XP reduzirá seu total e pode atrasar sua evolução de nível!</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map(badge => {
          const owned = userBadges.has(badge.id);
          const canAfford = (profile?.xp || 0) >= badge.xp_required;
          return (
            <div key={badge.id} className={`bg-secondary/50 rounded-xl p-4 text-center border transition-all ${owned ? 'border-primary/50 opacity-70' : 'border-border hover:border-primary/50'}`}>
              <div className="text-4xl mb-2 drop-shadow-lg">{badge.icon}</div>
              <h3 className="font-bold text-sm text-foreground">{badge.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 h-8 flex items-center justify-center">{badge.description}</p>
              
              <Button 
                variant={owned ? "outline" : (canAfford ? "magical" : "secondary")}
                size="sm"
                className="w-full text-xs"
                disabled={owned || !canAfford}
                onClick={() => buyBadge(badge)}
              >
                {owned ? "Adquirido" : `${badge.xp_required} XP`}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
