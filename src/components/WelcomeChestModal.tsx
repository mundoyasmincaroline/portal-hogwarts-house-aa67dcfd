import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Share2, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import MagicalGaleon from "./MagicalGaleon";
import MagicalEmoji from "./MagicalEmoji";

interface WelcomeChestModalProps {
  onClose: () => void;
}

const WelcomeChestModal: React.FC<WelcomeChestModalProps> = ({ onClose }) => {
  const { user, profile, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleOpenChest = async () => {
    if (!user) return;
    setIsOpening(true);

    // Simulated delay for animation
    setTimeout(async () => {
      try {
        // Award rewards
        const { error: galeonError } = await supabase.rpc("award_galeons", {
          _user_id: user.id,
          _amount: 500,
          _reason: "welcome_chest"
        });

        const { error: xpError } = await supabase.rpc("award_xp_action", {
          _action: "welcome_chest",
          _user_id: user.id,
          _xp: 100
        });

        // Mark as seen
        await updateProfile({ has_seen_intro: true });

        setHasOpened(true);
        setIsOpening(false);
        toast.success("✨ Baú de Boas-Vindas aberto com sucesso!");
      } catch (err) {
        console.error("Erro ao abrir baú:", err);
        setIsOpening(false);
        toast.error("Erro ao processar sua recompensa mágica.");
      }
    }, 2000);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${user?.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de recrutamento copiado! Compartilhe no TikTok/Insta! 🚀");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/90 backdrop-blur-xl"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
          </div>

          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative max-w-lg w-full glass rounded-[3.5rem] p-8 md:p-12 border-2 border-white/10 shadow-[0_0_100px_rgba(212,175,55,0.2)] overflow-hidden text-center"
          >
            {!hasOpened ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1 text-[10px] font-heading text-primary uppercase tracking-widest font-bold">
                    <Trophy size={12} /> Presente de Boas-Vindas
                  </div>
                  <h2 className="text-4xl md:text-5xl font-heading text-white tracking-tight">O Baú de <br /><span className="text-primary italic">Lendas</span></h2>
                  <p className="text-muted-foreground font-serif italic text-sm">
                    "O Ministério da Magia reservou este baú para os novos bruxos de Hogwarts. O que haverá dentro?"
                  </p>
                </div>

                <div className="relative group cursor-pointer" onClick={!isOpening ? handleOpenChest : undefined}>
                  <div className={`absolute inset-0 bg-primary/20 blur-3xl transition-all duration-1000 ${isOpening ? "scale-150 opacity-100" : "scale-100 opacity-50"}`} />
                  <motion.img
                    src="https://portal-hogwarts.lovable.app/legendary_chest_3d_1776816744823.png"
                    alt="Magic Chest"
                    animate={isOpening ? {
                      rotate: [0, -5, 5, -5, 5, 0],
                      scale: [1, 1.1, 1.1, 1.1, 1.1, 1.2],
                    } : {
                      y: [0, -15, 0],
                    }}
                    transition={{
                      duration: isOpening ? 0.5 : 3,
                      repeat: isOpening ? Infinity : Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-64 h-64 mx-auto object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                  />
                  {isOpening && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                       <Sparkles size={60} className="text-primary animate-spin" />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleOpenChest}
                  disabled={isOpening}
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary via-amber-400 to-primary text-black font-bold text-xl shadow-[0_10px_30px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  {isOpening ? "DESBLOQUEANDO..." : "ABRIR MEU BAÚ ✨"}
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 py-4"
              >
                <div className="space-y-2">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                    <Sparkles size={40} className="text-green-400" />
                  </div>
                  <h2 className="text-4xl font-heading text-white">RECOMPENSA ÉPICA!</h2>
                  <p className="text-muted-foreground text-sm font-serif">Sua jornada em Hogwarts começou com o pé direito.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-2">
                    <MagicalGaleon size="md" />
                    <p className="text-3xl font-heading text-yellow-400">+500</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Galeões</p>
                  </div>
                  <div className="glass bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/30">
                      <Trophy size={20} />
                    </div>
                    <p className="text-3xl font-heading text-primary">+100</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Pontos XP</p>
                  </div>
                </div>

                <div className="glass p-6 rounded-[2rem] border border-primary/30 bg-primary/5 space-y-4">
                  <p className="text-xs text-primary font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <Share2 size={14} /> Quer ganhar mais?
                  </p>
                  <p className="text-sm text-white/80 font-serif leading-relaxed">
                    Recrute novos bruxos para o castelo e ganhe <span className="text-yellow-400 font-bold">50 Galeões</span> por cada indicação completada!
                  </p>
                  <div className="flex gap-2">
                    <Button variant="magical" onClick={copyReferralLink} className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                       Copiar Link Viral 🔗
                    </Button>
                  </div>
                </div>

                <Button variant="ghost" onClick={onClose} className="text-white/40 hover:text-white text-xs uppercase tracking-widest font-bold">
                   Entrar no Castelo <ChevronRight size={14} className="ml-1" />
                </Button>
              </motion.div>
            )}

            {/* Close Button (only if opened or for emergencies) */}
            {hasOpened && (
              <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
                <X size={24} />
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeChestModal;
