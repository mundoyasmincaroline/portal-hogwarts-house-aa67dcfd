import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ShoppingBag, Sparkles, Star, Crown, Gem } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_required: number;
  rarity?: "common" | "rare" | "legendary";
}

const RARITY_CONFIG = {
  common: { label: "Comum", color: "text-slate-300", bg: "border-slate-400/30 bg-slate-800/20", icon: <Star size={12} /> },
  rare: { label: "Raro", color: "text-blue-400", bg: "border-blue-400/40 bg-blue-900/20", icon: <Gem size={12} /> },
  legendary: { label: "Lendário", color: "text-yellow-400", bg: "border-yellow-400/50 bg-yellow-900/20", icon: <Crown size={12} /> },
};

export default function EmojiShop() {
  const { user, profile, fetchProfile } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "common" | "rare" | "legendary">("all");

  useEffect(() => {
    const loadBadges = async () => {
      const { data: bData } = await supabase.from('badges').select('*').order('xp_required', { ascending: true });
      if (bData) setBadges(bData as Badge[]);

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
      toast.error(`XP insuficiente! Você precisa de ${badge.xp_required} XP. Você tem ${profile.xp} XP.`);
      return;
    }
    if (userBadges.has(badge.id)) {
      toast.error("Você já possui esta insígnia!");
      return;
    }

    setBuyingId(badge.id);
    try {
      const newXp = profile.xp - badge.xp_required;
      const { error: xpErr } = await supabase.from('profiles').update({ xp: newXp }).eq('user_id', user.id);
      if (xpErr) throw xpErr;

      const { error: badgeErr } = await supabase.from('user_badges').insert({ user_id: user.id, badge_id: badge.id });
      if (badgeErr) throw badgeErr;

      setUserBadges(prev => new Set([...prev, badge.id]));
      await fetchProfile(user.id);

      toast.success(`✨ Insígnia ${badge.icon} ${badge.name} adquirida! -${badge.xp_required} XP`);
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao processar a compra: " + (error.message || "Tente novamente."));
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) return (
    <div className="text-center py-20 text-muted-foreground animate-pulse">
      Abrindo o cofre de Borgin & Burkes...
    </div>
  );

  const owned = userBadges.size;
  const total = badges.length;

  // Assign rarity based on xp_required if not set
  const badgesWithRarity = badges.map(b => ({
    ...b,
    rarity: b.rarity || (b.xp_required >= 500 ? "legendary" : b.xp_required >= 200 ? "rare" : "common") as "common" | "rare" | "legendary",
  }));

  const filtered = activeFilter === "all" ? badgesWithRarity : badgesWithRarity.filter(b => b.rarity === activeFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="glass rounded-3xl p-8 text-center relative overflow-hidden border border-primary/20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=2070')] bg-cover bg-center opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="text-primary" size={32} />
            <h1 className="font-heading text-4xl md:text-5xl text-gold-gradient">Borgin & Burkes</h1>
            <Sparkles className="text-primary" size={32} />
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Emojis e insígnias raras para exibir no seu perfil. Troque seu XP acumulado por itens exclusivos.
          </p>
          <p className="text-xs text-amber-400 mt-1">⚠️ Atenção: Gastar XP reduzirá seu total e pode atrasar sua evolução de nível!</p>

          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="inline-flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-xl border border-border/50">
              <ShoppingBag size={16} className="text-primary" />
              <span className="font-heading text-lg text-primary">{profile?.xp || 0} XP</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-xl border border-border/50">
              <span className="text-sm text-muted-foreground">Coleção: </span>
              <span className="font-heading text-lg text-foreground">{owned}/{total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {(["all", "common", "rare", "legendary"] as const).map(f => {
          const cfg = f === "all" ? null : RARITY_CONFIG[f];
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-heading transition-all border flex items-center gap-1.5 ${
                activeFilter === f
                  ? f === "legendary" ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
                    : f === "rare" ? "bg-blue-400/20 border-blue-400 text-blue-400"
                    : f === "common" ? "bg-slate-300/20 border-slate-300 text-slate-300"
                    : "bg-primary/20 border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {cfg?.icon}
              {f === "all" ? "✨ Todos" : cfg?.label}
              <span className="text-xs opacity-60">
                ({f === "all" ? total : badgesWithRarity.filter(b => b.rarity === f).length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          <p className="text-4xl mb-3">🪄</p>
          <p>Nenhuma insígnia nesta categoria ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(badge => {
            const isOwned = userBadges.has(badge.id);
            const canAfford = (profile?.xp || 0) >= badge.xp_required;
            const rarityConf = RARITY_CONFIG[badge.rarity];

            return (
              <div
                key={badge.id}
                className={`relative rounded-2xl p-5 text-center border transition-all group ${
                  isOwned
                    ? `${rarityConf.bg} opacity-80`
                    : `border-border/50 bg-secondary/20 hover:border-primary/40 hover:-translate-y-1`
                }`}
              >
                {/* Rarity badge */}
                <div className={`absolute top-2 right-2 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${rarityConf.bg} ${rarityConf.color}`}>
                  {rarityConf.icon}
                  {rarityConf.label}
                </div>

                {/* Owned checkmark */}
                {isOwned && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-primary/20 border border-primary/50 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-primary">✓</span>
                  </div>
                )}

                {/* Icon/Image */}
                <div className={`w-24 h-24 mx-auto mb-3 mt-2 flex items-center justify-center transition-transform group-hover:scale-110 ${badge.rarity === "legendary" ? "filter drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" : ""}`}>
                  {badge.image_url ? (
                    <img src={badge.image_url} alt={badge.name} className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <span className="text-5xl">{badge.icon}</span>
                  )}
                </div>

                <h3 className="font-heading text-sm text-foreground mb-1">{badge.name}</h3>
                <p className="text-[11px] text-muted-foreground mb-3 min-h-[32px] flex items-center justify-center">{badge.description}</p>

                <Button
                  variant={isOwned ? "outline" : canAfford ? "magical" : "secondary"}
                  size="sm"
                  className="w-full text-xs"
                  disabled={isOwned || !canAfford || buyingId === badge.id}
                  onClick={() => buyBadge(badge)}
                >
                  {buyingId === badge.id ? "Comprando..." : isOwned ? "✅ Adquirido" : canAfford ? `${badge.xp_required} XP` : `Precisa de ${badge.xp_required} XP`}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
