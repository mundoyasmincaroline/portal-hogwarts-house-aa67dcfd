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

export default function StickerAlbum() {
  const { profile, user } = useAuth();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [userStickers, setUserStickers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

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

  const buyPack = async () => {
    if (!user || !profile) return;
    const packCost = 50;
    if (profile.xp < packCost) {
      toast.error("Você precisa de pelo menos 50 XP para comprar um pacotinho mágico!");
      return;
    }

    setOpening(true);
    // Deduct XP
    await supabase.from("profiles").update({ xp: profile.xp - packCost } as never).eq("user_id", user.id);
    
    // Pick a random sticker available for their level
    const available = stickers.filter(s => s.level_required <= profile.level);
    if (available.length === 0) {
      toast.error("Nenhuma figurinha disponível para o seu nível ainda!");
      setOpening(false);
      return;
    }

    // Weighted random (Bronze 70%, Silver 25%, Gold 5%)
    const roll = Math.random() * 100;
    let targetRarity = "bronze";
    if (roll > 95) targetRarity = "gold";
    else if (roll > 70) targetRarity = "silver";

    let possible = available.filter(s => s.rarity === targetRarity);
    if (possible.length === 0) possible = available; // fallback

    const won = possible[Math.floor(Math.random() * possible.length)];

    // Check if already has
    if (userStickers[won.id]) {
      toast.success(\Você abriu o pacote e encontrou \ (\), mas já tinha essa!\);
    } else {
      await supabase.from("user_stickers").insert({ user_id: user.id, sticker_id: won.id } as never);
      toast.success(\? INCRÍVEL! Você ganhou a figurinha de \ (\)!\);
      setUserStickers(prev => ({ ...prev, [won.id]: true }));
    }
    setOpening(false);
  };

  if (loading) return <div className="text-center py-10">Abrindo o álbum...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 text-center">
        <h1 className="font-heading text-3xl text-gold-gradient mb-2">Álbum de Bruxos Célebres</h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Colecione figurinhas dos maiores bruxos e bruxas da história. Compre pacotinhos usando seu XP. 
          Figurinhas Ouro e Prata só podem ser encontradas por bruxos de nível alto!
        </p>
        <div className="mt-6 flex justify-center gap-4 items-center">
          <div className="glass px-4 py-2 rounded-lg">
            <span className="text-sm text-muted-foreground">Seu XP: </span>
            <span className="font-heading text-primary">{profile?.xp || 0}</span>
          </div>
          <Button variant="magical" onClick={buyPack} disabled={opening}>
            {opening ? "Abrindo Pacote..." : "Comprar Pacote (50 XP)"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {stickers.map(s => {
          const unlocked = userStickers[s.id];
          const isGold = s.rarity === 'gold';
          const isSilver = s.rarity === 'silver';
          
          let rarityStyle = "border-amber-700/50 from-amber-900/40 to-background"; // Bronze
          if (isSilver) rarityStyle = "border-slate-300/80 from-slate-700/40 to-background shadow-white/10";
          if (isGold) rarityStyle = "border-yellow-400 from-yellow-600/40 to-background shadow-yellow-500/20";

          return (
            <div 
              key={s.id} 
              className={\elative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-500 \\}
            >
              {unlocked && (
                <div className="absolute inset-0 z-0">
                  <img src={s.image_url} alt={s.character_name} className="w-full h-full object-cover mix-blend-overlay opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>
              )}
              
              <div className="relative z-10 h-full flex flex-col justify-end p-3">
                <div className="mb-auto flex justify-between items-start">
                  <span className={\	ext-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full \\}>
                    {s.rarity}
                  </span>
                  {!unlocked && (
                    <span className="text-xs text-muted-foreground/60 bg-background/80 px-2 py-1 rounded-md">
                      Nv. {s.level_required}
                    </span>
                  )}
                </div>
                {unlocked ? (
                  <h3 className={\ont-heading text-sm leading-tight \\}>
                    {s.character_name}
                  </h3>
                ) : (
                  <h3 className="font-heading text-sm text-muted-foreground/40">Desconhecido</h3>
                )}
              </div>
              
              {unlocked && isGold && (
                <div className="absolute inset-0 z-20 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.2),transparent_70%)] animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
