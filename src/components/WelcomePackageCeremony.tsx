import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, PackageOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useImmersion } from "@/hooks/core/useImmersion";
import MagicalGaleon from "./shared/MagicalGaleon";
import EmojiIcon from "./shared/EmojiIcon";

interface StarterPackLoot {
  galeons: number;
  xp: number;
  sticker?: {
    id: string;
    character_name: string;
    rarity: string;
    image_url: string;
    house?: string;
  };
}

export default function WelcomePackageCeremony() {
  const { user, profile, fetchProfile } = useAuth();
  const { cast } = useImmersion();
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<"hidden" | "intro" | "opening" | "revealed">("hidden");
  const [loot, setLoot] = useState<StarterPackLoot | null>(null);

  useEffect(() => {
    if (!user || !profile) return;
    const checkStarterPack = async () => {
      const key = `starter_claimed_${user.id}`;
      if (localStorage.getItem(key)) return; // Já pegou no front

      // Check with backend just in case
      try {
        const { data } = await supabase.rpc("claim_starter_pack" as any, { _user_id: user.id });
        const res = data as any;
        if (res?.ok) {
          setLoot({
            galeons: res.galeons,
            xp: res.xp,
            sticker: res.sticker,
          });
          setPhase("intro");
          localStorage.setItem(key, "1");
        } else {
          // If already claimed in backend, just mark local
          localStorage.setItem(key, "1");
        }
      } catch (err) {
        console.error("Erro no starter pack:", err);
      }
    };

    checkStarterPack();
  }, [user, profile]);

  const handleOpen = () => {
    setPhase("opening");
    cast("chime", { volume: 0.6 });
    setTimeout(() => {
      setPhase("revealed");
      cast("levelUp", { volume: 0.5 });
      fetchProfile(user!.id); // Update header balances
    }, 1500);
  };

  const handleClose = () => {
    setPhase("hidden");
  };

  if (phase === "hidden" || !loot) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_70%)]" />
        
        {phase === "intro" && (
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            className="relative z-10 flex flex-col items-center text-center space-y-6"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-8xl filter drop-shadow-[0_0_30px_rgba(212,175,55,0.6)] cursor-pointer"
              onClick={handleOpen}
            >
              <EmojiIcon e="🦉" />
            </motion.div>
            
            <div className="space-y-2">
              <h2 className="font-heading text-3xl sm:text-4xl text-gold-gradient">Uma coruja te encontrou!</h2>
              <p className="text-muted-foreground max-w-sm italic font-serif">
                "Uma encomenda oficial de Hogwarts acaba de chegar para você. Clique na coruja para abrir!"
              </p>
            </div>
            
            <button
              onClick={handleOpen}
              className="px-8 py-3 rounded-full bg-primary/20 border border-primary/50 text-primary font-heading uppercase tracking-widest hover:bg-primary/40 transition-colors shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2"
            >
              <PackageOpen size={18} /> Abrir Pacote
            </button>
          </motion.div>
        )}

        {phase === "opening" && (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 0.8, 1.5], rotate: [0, -10, 10, -5, 5, 0], opacity: [1, 1, 1, 0] }}
            transition={{ duration: 1.5 }}
            className="text-9xl relative z-10"
          >
            <EmojiIcon e="🎁" />
          </motion.div>
        )}

        {phase === "revealed" && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 max-w-md w-full glass rounded-[2rem] border border-primary/30 p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(212,175,55,0.4)]"
          >
            <div className="absolute -top-12 bg-primary/20 p-4 rounded-full border border-primary/50 backdrop-blur-md">
              <Sparkles className="text-primary w-8 h-8" />
            </div>

            <h2 className="font-heading text-3xl text-gold-gradient mt-4 mb-2">Bem-vindo(a)!</h2>
            <p className="text-foreground/80 mb-8 font-serif italic text-sm">
              Sua jornada mágica começa agora. Aqui está o seu pacote de calouro para te ajudar:
            </p>

            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="bg-black/40 border border-yellow-500/30 rounded-xl p-4 flex flex-col items-center"
              >
                <MagicalGaleon size="md" className="mb-2" />
                <span className="font-heading text-xl text-yellow-400">+{loot.galeons}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Galeões</span>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                className="bg-black/40 border border-blue-500/30 rounded-xl p-4 flex flex-col items-center"
              >
                <div className="text-3xl mb-2"><EmojiIcon e="✨" /></div>
                <span className="font-heading text-xl text-blue-400">+{loot.xp}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Experiência</span>
              </motion.div>

              {loot.sticker && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                  className="col-span-2 bg-black/40 border border-purple-500/30 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 border-purple-500/50">
                    {loot.sticker.image_url ? (
                       <img src={loot.sticker.image_url} alt={loot.sticker.character_name} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full bg-secondary flex items-center justify-center text-2xl"><EmojiIcon e="🐸" /></div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-heading uppercase text-purple-400 tracking-widest mb-1">Brinde: 1 Figurinha</p>
                    <p className="font-heading text-lg leading-tight text-foreground">{loot.sticker.character_name}</p>
                    <p className="text-xs text-muted-foreground uppercase">{loot.sticker.rarity}</p>
                  </div>
                </motion.div>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-heading uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Iniciar Jornada
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
