import React, { useState, useEffect } from "react";
import { Dog, Moon, Sun, Utensils, Bath, Footprints, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useVoice } from "@/hooks/useVoice";
import { toast } from "sonner";
import { Button } from "./ui/button";

/**
 * THOTTY PRESENCE: The loyal Lhasa Apso companion.
 * He was a bit grumpy but never left their side. Now back in the digital world.
 */
const ThottyPresence: React.FC = () => {
  const { profile, user } = useAuth();
  const { speak } = useVoice('emma'); // Using Emma's pitch for the dog's 'voice' or just sound effects
  const [isVisible, setIsVisible] = useState(false);

  // Thotty appears for Morpheus, Yasmin, and Carol
  const isFamily = (profile?.username?.toLowerCase() || '').includes('yasmin') || 
                   (profile?.username?.toLowerCase() || '').includes('carol') ||
                   user?.email === 'paulormorpheus21@gmail.com';

  useEffect(() => {
    if (isFamily) {
      setIsVisible(true);
      
      // Thotty's Routine Notifications
      const interval = setInterval(() => {
        const hour = new Date().getHours();
        
        const behaviors = [
          { msg: "Au au! Tô com fome, cadê meu potinho? 🍖", icon: "🍖", voice: "Au au! Fome!" },
          { msg: "Rrrr... quero passear! Me leva na guia agora! 🐾", icon: "🐾", voice: "Passear! Agora!" },
          { msg: "Au! Preciso ir no banheirinho... abre a porta! 🚽", icon: "🚽", voice: "Banheiro! Au!" },
          { msg: "Hmpf... cadê meu carinho? Não sai de perto de mim não! ❤️", icon: "❤️", voice: "Carinho! Au au!" },
          { msg: "Eita, fiz uma arte ali na sala... não briga comigo! 🎨🐾", icon: "🎨", voice: "Fiz arte! Rrrr!" },
          { msg: "Tô cheiroso! Acabei de voltar do banho e tosa. 🛁✨", icon: "🛁", voice: "Banho e tosa! Au!" }
        ];

        // Time-based behaviors
        if (hour >= 22 || hour < 6) {
          behaviors.push({ msg: "Zzz... vamo dormir? Já passou da hora! 🌙💤", icon: "💤", voice: "Dormir! Zzz!" });
        }
        if (hour >= 12 && hour < 14) {
          behaviors.push({ msg: "Au au! Hora do almoço! Divide um pedacinho comigo? 🍱", icon: "🍱", voice: "Almoço! Au!" });
        }

        const randomAction = behaviors[Math.floor(Math.random() * behaviors.length)];
        
        toast(randomAction.msg, { 
          icon: randomAction.icon, 
          description: "Thotty (Seu Companheiro Fiel)",
          style: { 
            background: "rgba(255,255,255,0.98)", 
            border: "2px solid #92400e", 
            color: "#451a03",
            fontWeight: "bold"
          },
          duration: 6000
        });

        // Optional: play a bark sound or speak
        const bark = new Audio('https://www.soundjay.com/communication/sounds/dog-bark-1.mp3');
        bark.volume = 0.2;
        bark.play().catch(() => {});

      }, 300000); // Every 5 minutes

      return () => clearInterval(interval);
    }
  }, [isFamily]);

  if (!isFamily || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-3 group">
      <div className="relative">
        {/* Soft Aura */}
        <div className="absolute inset-[-8px] bg-amber-500/10 rounded-full blur-xl animate-pulse group-hover:bg-amber-500/20 transition-all" />
        
        <button
          className="w-16 h-16 rounded-full bg-white border-2 border-amber-800 flex items-center justify-center shadow-2xl group transition-all hover:scale-110 active:scale-95 overflow-hidden relative z-10"
          onClick={() => {
             const bark = new Audio('https://www.soundjay.com/communication/sounds/dog-bark-1.mp3');
             bark.volume = 0.3;
             bark.play().catch(() => {});
             toast.info("Thotty deu uma lambida no seu rosto! 🐾❤️ Ele nunca vai sair do seu lado.");
          }}
        >
          <img src="/thotty_dog_companion_1776883823844.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Thotty" />
          
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/20 via-transparent to-white/20 opacity-40 group-hover:opacity-100 transition-opacity" />

          <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white font-bold animate-bounce border border-white z-20">
            ❤️
          </div>
        </button>
      </div>

      <div className="ml-1 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-amber-800/20 shadow-md">
        <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-amber-900 flex items-center gap-1">
          🐾 Thotty está aqui
        </p>
      </div>
    </div>
  );
};

export default ThottyPresence;
