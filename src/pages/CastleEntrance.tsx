import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Sparkles, ChevronRight } from "lucide-react";

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-1000">
      {/* Background Magic Layer */}
      <div className="absolute inset-0 z-0">
          <img src={bgUrl} alt="Hogwarts Background" className="w-full h-full object-cover opacity-40 scale-110 animate-pulse-slow" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
      </div>

      <div className="relative overflow-hidden w-full max-w-2xl rounded-[3rem] bg-gradient-to-b from-white/[0.08] to-black/60 backdrop-blur-3xl p-8 md:p-14 border border-white/10 shadow-[0_50px_150px_rgba(0,0,0,1)] text-center animate-in zoom-in-95 duration-700">
        {/* Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-heading text-primary uppercase tracking-[0.3em] mb-4">
              <Sparkles size={10} className="animate-spin-slow" /> O Portal se Abre
            </div>
            <h1 className="text-4xl md:text-5xl font-heading text-gold-gradient tracking-tight drop-shadow-2xl">O Retorno a Hogwarts</h1>
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mt-4" />
          </div>
          
          <div className="relative min-h-[160px] flex items-center justify-center">
            <p className="text-lg md:text-2xl text-white/90 leading-relaxed font-serif italic drop-shadow-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
              "{current.text}"
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-12">
            {current.options.map((opt, i) => (
              <button 
                key={i} 
                disabled={opt.next === -1 ? loading : false}
                onClick={() => opt.next === -1 ? handleFinish() : setStep(opt.next)}
                className="group relative w-full overflow-hidden p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-heading text-lg tracking-widest transition-all duration-300 hover:bg-white/[0.08] hover:border-primary/50 hover:-translate-y-1 active:scale-[0.98] shadow-2xl"
              >
                {/* Internal Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover/choice:translate-x-full transition-transform duration-1000" />
                
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {opt.next === -1 && loading ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
                  )}
                  {opt.next === -1 && loading ? "CONECTANDO..." : opt.text.toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          <p className="text-[10px] font-heading text-white/20 uppercase tracking-[0.2em]">Sua história em Hogwarts continua agora</p>
        </div>
      </div>
    </div>
  );
}
