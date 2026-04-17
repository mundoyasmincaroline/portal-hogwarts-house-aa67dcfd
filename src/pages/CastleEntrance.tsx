import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function CastleEntrance() {
  const [step, setStep] = useState(0);
  const { user, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const handleFinish = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ has_seen_intro: true }).eq("user_id", user.id);
    await fetchProfile(user.id);
    navigate("/");
  };

  const steps = [
    {
      text: "As pesadas portas de carvalho do castelo se abrem lentamente, revelando o imponente Grande Salão iluminado por milhares de velas flutuantes.",
      options: [{ text: "Entrar com cautela", next: 1 }, { text: "Correr para dentro", next: 1 }],
    },
    {
      text: "De repente, um murmúrio ecoa pelos corredores. O Chapéu Seletor repousa sobre um banquinho à frente, e algo estranho acontece... Ele parece chamar seu nome.",
      options: [
        { text: "Aproximar-se do Chapéu", next: 2 },
        { text: "Ignorar e ir para a mesa da sua Casa", next: 2 }
      ],
    },
    {
      text: `"Ah... uma mente curiosa. Bem-vindo de volta! A magia em Hogwarts está mudando, e precisaremos de toda a sua força neste ano."`,
      options: [
        { text: "Aceitar o chamado e iniciar a jornada", next: -1 }
      ],
    }
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-secondary/80 border border-primary/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-700">
        <div className="absolute inset-0 bg-[url('/hogwarts-stars.png')] opacity-20 pointer-events-none mix-blend-screen"></div>
        
        <div className="relative z-10 space-y-8 text-center">
          <h1 className="font-heading text-3xl text-gold-gradient mb-6">O Retorno a Hogwarts</h1>
          
          <p className="text-lg md:text-xl text-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {current.text}
          </p>

          <div className="flex flex-col gap-3 mt-8 pt-4">
            {current.options.map((opt, i) => (
              <Button 
                key={i} 
                variant="magical" 
                size="lg" 
                className="w-full text-md font-heading animate-in fade-in duration-500 delay-500"
                onClick={() => opt.next === -1 ? handleFinish() : setStep(opt.next)}
              >
                {opt.text}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
