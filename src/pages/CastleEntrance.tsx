import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Sparkles, RefreshCw } from "lucide-react";

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
      // Não recarrega em caso de erro para evitar loop infinito de reload
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }
    // Recarrega o perfil em memória e navega sem hard-reload (sem flash branco)
    try { if (user?.id) await fetchProfile(user.id); } catch (_) { /* noop */ }
    navigate("/dashboard", { replace: true });
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
    <div className="fixed inset-0 bg-background/98 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={bgUrl} alt="" aria-hidden="true" className="w-full h-full object-cover opacity-40 mix-blend-overlay animate-float" style={{ animationDuration: '30s' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-background/20 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1),transparent_70%)]" />
      </div>
      
      <div className="max-w-2xl w-full glass border-primary/20 rounded-[3rem] p-8 sm:p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-1000">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 space-y-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-2">
            <Sparkles size={14} className="text-primary animate-pulse" />
            <span className="text-[10px] font-heading uppercase tracking-[0.3em] text-primary">Iniciando Jornada</span>
          </div>
          
          <h1 className="font-heading text-4xl sm:text-6xl text-gold-gradient drop-shadow-2xl leading-none">
            Hogwarts House
          </h1>
          
          <div className="min-h-[120px] flex items-center justify-center">
            <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-serif italic animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              "{current.text}"
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            {current.options.map((opt, i) => (
              <Button 
                key={i} 
                variant="magical" 
                size="lg" 
                className="w-full min-h-16 h-auto text-base sm:text-lg font-heading rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 px-4"
                style={{ animationDelay: `${500 + i * 200}ms` }}
                onClick={() => opt.next === -1 ? handleFinish() : setStep(opt.next)}
                disabled={opt.next === -1 ? loading : false}
              >
                {opt.next === -1 && loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="animate-spin" size={18} /> Transgredindo Espaço...
                  </span>
                ) : opt.text}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
