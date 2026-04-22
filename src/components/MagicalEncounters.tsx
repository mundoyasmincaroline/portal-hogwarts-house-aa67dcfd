import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Shield, Zap, Sparkles, Sword, Flame, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MagicalEmoji from "./MagicalEmoji";

type EncounterType = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  options: {
    label: string;
    action: string;
    successRate: number;
    rewards: { xp: number; galeons: number };
    failurePenalty: { xp: number; galeons: number };
    successMsg: string;
    failureMsg: string;
  }[];
};

const ENCOUNTERS: EncounterType[] = [
  {
    id: "dementor",
    name: "Dementador nas Proximidades!",
    description: "Um frio terrível toma conta do ar. Um Dementador está se aproximando do seu dormitório!",
    emoji: "🌑",
    options: [
      {
        label: "Expecto Patronum!",
        action: "patronus",
        successRate: 0.7,
        rewards: { xp: 150, galeons: 0 },
        failurePenalty: { xp: -50, galeons: 0 },
        successMsg: "Um brilho prateado explode da sua varinha! O Dementador recua para as sombras.",
        failureMsg: "Você não conseguiu manter o pensamento feliz... O frio te consome. -50 XP."
      },
      {
        label: "Correr para o Salão Comunal",
        action: "run",
        successRate: 0.9,
        rewards: { xp: 10, galeons: 0 },
        failurePenalty: { xp: -20, galeons: 0 },
        successMsg: "Você escapou por pouco! A segurança do Salão Comunal te protege.",
        failureMsg: "Você tropeçou no caminho! O medo te paralisou por um momento. -20 XP."
      }
    ]
  },
  {
    id: "troll",
    name: "Troll de Montanha Solto!",
    description: "Você ouve passos pesados e um cheiro terrível. Um Troll de Montanha bloqueia a passagem!",
    emoji: "🧌",
    options: [
      {
        label: "Wingardium Leviosa (No Porrete)",
        action: "spell",
        successRate: 0.6,
        rewards: { xp: 200, galeons: 20 },
        failurePenalty: { xp: -30, galeons: -10 },
        successMsg: "O porrete sobe e cai na cabeça do Troll! Ele desmaia ruidosamente. +200 XP e +20 Galeões!",
        failureMsg: "O Troll é mais rápido! Ele te joga longe antes que você complete o feitiço. -30 XP."
      },
      {
        label: "Lançar Estalinhos de fumaça",
        action: "distract",
        successRate: 0.8,
        rewards: { xp: 50, galeons: 0 },
        failurePenalty: { xp: -10, galeons: 0 },
        successMsg: "A fumaça confunde o Troll, permitindo que você passe despercebido.",
        failureMsg: "O Troll não se distraiu com os estalinhos. Que azar! -10 XP."
      }
    ]
  },
  {
    id: "niffler",
    name: "Um Pelúcio Travesso!",
    description: "Você vê algo brilhante se movendo rápido. É um Pelúcio carregando uma sacola de galeões!",
    emoji: "🐾",
    options: [
      {
        label: "Capturar com Cuidado",
        action: "catch",
        successRate: 0.5,
        rewards: { xp: 100, galeons: 50 },
        failurePenalty: { xp: 10, galeons: 0 },
        successMsg: "Você capturou o bichinho e recuperou alguns galeões perdidos! +50 Galeões!",
        failureMsg: "Ele é rápido demais! O Pelúcio sumiu por um buraco na parede."
      }
    ]
  }
];

export default function MagicalEncounters() {
  const { user, profile, fetchProfile } = useAuth();
  const [activeEncounter, setActiveEncounter] = useState<EncounterType | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Trigger random encounter (e.g. 5% chance every time the component mounts/user moves)
    const checkEncounter = () => {
      const lastCheck = sessionStorage.getItem(`last_encounter_check_${user.id}`);
      const now = Date.now();
      
      if (lastCheck && now - parseInt(lastCheck) < 300000) return; // Wait 5 mins between checks
      sessionStorage.setItem(`last_encounter_check_${user.id}`, String(now));

      if (Math.random() < 0.15) { // 15% chance
        const randomEnc = ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
        setActiveEncounter(randomEnc);
      }
    };

    const timer = setTimeout(checkEncounter, 5000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleAction = async (option: typeof ENCOUNTERS[0]['options'][0]) => {
    if (!user || resolving) return;
    setResolving(true);

    const success = Math.random() < option.successRate;
    const reward = success ? option.rewards : option.failurePenalty;
    const msg = success ? option.successMsg : option.failureMsg;

    try {
      if (reward.xp !== 0) {
        await supabase.rpc("award_xp_action", { 
          _action: "magical_encounter", 
          _user_id: user.id, 
          _xp: reward.xp 
        });
      }

      if (reward.galeons !== 0) {
        const currentGaleons = (profile?.galeons || 0);
        await supabase.from("profiles").update({ 
          galeons: Math.max(0, currentGaleons + reward.galeons) 
        } as never).eq("user_id", user.id);
      }

      if (success) {
        toast.success("✨ Sucesso Mágico!", { description: msg });
      } else {
        toast.error("❌ Falha no Encontro", { description: msg });
      }

      fetchProfile(user.id);
      setActiveEncounter(null);
    } catch (error) {
      console.error("Erro no encontro:", error);
    } finally {
      setResolving(false);
    }
  };

  if (!activeEncounter) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="glass w-full max-w-lg rounded-[3rem] p-10 border-2 border-primary/40 relative overflow-hidden text-center shadow-[0_0_100px_rgba(212,175,55,0.2)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
            <div className="flex justify-center mb-4">
              <MagicalEmoji emoji={activeEncounter.emoji} size="2xl" />
            </div>
            
            <h2 className="text-3xl font-heading text-gold-gradient">{activeEncounter.name}</h2>
            <p className="text-muted-foreground font-serif leading-relaxed italic">"{activeEncounter.description}"</p>

            <div className="grid gap-3 pt-4">
                {activeEncounter.options.map((opt, i) => (
                    <Button 
                        key={i}
                        onClick={() => handleAction(opt)}
                        disabled={resolving}
                        variant={i === 0 ? "magical" : "outline"}
                        className="h-14 rounded-2xl text-sm font-heading tracking-widest uppercase transition-all hover:scale-[1.02]"
                    >
                        {opt.label}
                    </Button>
                ))}
            </div>

            <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">Escolha sabiamente, bruxo(a).</p>
        </div>
      </div>
    </div>
  );
}
