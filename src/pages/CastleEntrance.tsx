import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function CastleEntrance() {
  const [step, setStep] = useState(0);
  const { user, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const hour = new Date().getHours();
  let timeOfDay = "night";
  if (hour >= 5 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 18) timeOfDay = "afternoon";

  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Salva no localStorage para não repetir hoje
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`intro_last_seen_${user.id}`, today);

      // Atualiza o perfil caso ainda esteja sendo usado
      await supabase.from("profiles").update({ has_seen_intro: true }).eq("user_id", user.id);
      
      useAuth.setState((state) => ({
        profile: state.profile ? { ...state.profile, has_seen_intro: true } : null
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      window.location.reload(); // Força o recarregamento limpo para o dashboard
    }
  };

  let welcomeText = "As pesadas portas de carvalho do castelo se abrem lentamente, revelando o imponente Grande Salão iluminado por milhares de velas flutuantes.";
  if (timeOfDay === "morning") {
    welcomeText = "Os primeiros raios de sol da manhã iluminam as pesadas portas de carvalho do castelo. O Grande Salão desperta com o cheiro de café da manhã mágico e o voo das corujas.";
  } else if (timeOfDay === "afternoon") {
    welcomeText = "O sol da tarde aquece as pedras milenares de Hogwarts. Pelas janelas do Grande Salão, você pode ver os alunos rindo e praticando feitiços nos jardins iluminados.";
  }

  const steps = [
    {
      text: welcomeText,
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

  let bgUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000"; // Night sky/magic
  if (timeOfDay === "morning") bgUrl = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2000"; // Morning light
  else if (timeOfDay === "afternoon") bgUrl = "https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?q=80&w=2000"; // Afternoon castle

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: `url('${bgUrl}')` }}></div>
      <div className="max-w-2xl w-full bg-secondary/80 border border-primary/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-700">
        
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
                disabled={opt.next === -1 ? loading : false}
              >
                {opt.next === -1 && loading ? "Iniciando..." : opt.text}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
