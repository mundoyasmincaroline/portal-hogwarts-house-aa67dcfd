import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Sticker {
  id: string;
  character_name: string;
  rarity: "bronze" | "silver" | "gold";
  image_url: string;
  level_required: number;
}

interface UserSticker {
  sticker_id: string;
  obtained_at: string;
}

const RARITY_COST = {
  bronze: 20,
  silver: 50,
  gold: 100,
};

export default function StickerAlbum() {
  const { profile, user, fetchProfile } = useAuth();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [userStickers, setUserStickers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    loadAlbum();
  }, []);

  const loadAlbum = async () => {
    if (!user) return;
    const { data: allStickers } = await supabase.from("stickers").select("*").order("level_required", { ascending: true });
    const { data: myStickers } = await supabase.from("user_stickers").select("sticker_id").eq("user_id", user.id);
    
    setStickers((allStickers as Sticker[]) || []);
    
    const myMap: Record<string, boolean> = {};
    if (myStickers) {
      myStickers.forEach(s => myMap[s.sticker_id] = true);
    }
    setUserStickers(myMap);
    setLoading(false);
  };

  const buySticker = async (sticker: Sticker) => {
    if (!user || !profile) return;
    
    const cost = RARITY_COST[sticker.rarity];
    if (profile.xp < cost) {
      toast.error(`Você precisa de ${cost} XP para comprar esta figurinha!`);
      return;
    }

    setBuyingId(sticker.id);
    try {
      // Deduzir o XP
      const { error: updateError } = await supabase.from("profiles").update({ xp: profile.xp - cost } as never).eq("user_id", user.id);
      if (updateError) throw updateError;
      
      // Adicionar figurinha
      const { error: insertError } = await supabase.from("user_stickers").insert({ user_id: user.id, sticker_id: sticker.id } as never);
      if (insertError) throw insertError;

      toast.success(`✨ Sucesso! Você comprou a figurinha de ${sticker.character_name}!`);
      setUserStickers(prev => ({ ...prev, [sticker.id]: true }));
      await fetchProfile(user.id);
    } catch (err: any) {
      toast.error("Erro mágico: " + err.message);
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground animate-pulse">Abrindo a vitrine mágica...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="glass rounded-3xl p-8 text-center relative overflow-hidden border border-primary/20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?q=80&w=2070')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <h1 className="font-heading text-4xl md:text-5xl text-gold-gradient mb-3 drop-shadow-lg">Vitrine de Figurinhas Premium</h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed">
            Navegue pela coleção oficial de Bruxos Célebres. Compre figurinhas exclusivas usando o XP conquistado no RPG.
            Figurinhas Ouro e Prata brilham de forma mágica e mostram o seu prestígio!
          </p>
          <div className="mt-8 inline-flex items-center gap-3 bg-secondary/50 backdrop-blur-md px-6 py-3 rounded-xl border border-border/50">
            <span className="text-sm text-muted-foreground uppercase tracking-widest">Saldo Atual:</span>
            <span className="font-heading text-2xl text-primary animate-pulse">{profile?.xp || 0} XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {stickers.map(s => {
          const unlocked = userStickers[s.id];
          const isGold = s.rarity === 'gold';
          const isSilver = s.rarity === 'silver';
          const cost = RARITY_COST[s.rarity];
          const levelOk = profile ? profile.level >= s.level_required : false;
          const xpOk = profile ? profile.xp >= cost : false;
          
          let rarityStyle = "border-amber-700/50 from-amber-900/40 to-background shadow-lg shadow-amber-900/20";
          if (isSilver) rarityStyle = "border-slate-300/80 from-slate-700/40 to-background shadow-xl shadow-white/10";
          if (isGold) rarityStyle = "border-yellow-400 from-yellow-600/40 to-background shadow-2xl shadow-yellow-500/30 ring-1 ring-yellow-400/50";

          return (
            <div 
              key={s.id} 
              className={`relative aspect-[3/4] rounded-2xl flex flex-col overflow-hidden border-2 transition-all duration-500 group ${unlocked ? rarityStyle : 'border-border/50 bg-secondary/10 hover:border-primary/50'}`}
            >
              {/* Imagem */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={s.image_url} 
                  alt={s.character_name} 
                  className={`w-full h-full object-cover transition-all duration-700 ${unlocked ? 'mix-blend-overlay opacity-80 group-hover:scale-105 group-hover:opacity-100' : 'opacity-30 grayscale blur-[2px] group-hover:grayscale-0 group-hover:blur-0'}`} 
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${unlocked ? 'from-background via-background/60 to-transparent' : 'from-background via-background/90 to-background/40'}`} />
              </div>
              
              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-sm ${
                    isGold ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' : 
                    isSilver ? 'bg-slate-300/20 text-slate-300 border border-slate-300/50' : 
                    'bg-amber-700/20 text-amber-600 border border-amber-700/50'
                  }`}>
                    {s.rarity}
                  </span>
                  
                  {unlocked ? (
                    <span className="text-xl drop-shadow-md">✨</span>
                  ) : (
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md ${levelOk ? 'bg-background/80 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                      Nv. {s.level_required}
                    </span>
                  )}
                </div>
                
                <div className="mt-auto space-y-3">
                  <h3 className={`font-heading text-lg leading-tight text-center drop-shadow-md ${unlocked && isGold ? 'text-yellow-400' : unlocked ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground transition-colors'}`}>
                    {s.character_name}
                  </h3>

                  {!unlocked && (
                    <Button 
                      variant="magical" 
                      className="w-full h-9 text-xs font-heading shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                      disabled={!levelOk || !xpOk || buyingId === s.id}
                      onClick={() => buySticker(s)}
                    >
                      {buyingId === s.id ? "Comprando..." : !levelOk ? "Nível Insuficiente" : !xpOk ? "XP Insuficiente" : `Comprar por ${cost} XP`}
                    </Button>
                  )}
                </div>
              </div>
              
              {unlocked && isGold && (
                <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.15),transparent_60%)] animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}