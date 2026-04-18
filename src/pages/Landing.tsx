import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MagicalParticles from "@/components/MagicalParticles";

export default function Landing() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  const hour = new Date().getHours();
  let timeOfDay = "night";
  if (hour >= 5 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 18) timeOfDay = "afternoon";

  // Usando assets locais gerados pelo Bot
  let bgUrl = new URL('../assets/hogwarts_night.png', import.meta.url).href;
  if (timeOfDay === "morning") bgUrl = new URL('../assets/hogwarts_morning.png', import.meta.url).href;
  else if (timeOfDay === "afternoon") bgUrl = new URL('../assets/hogwarts_afternoon.png', import.meta.url).href;

  let titleText = "O Portal de Hogwarts";
  let subtitleText = "Magia Noturna";
  let descriptionText = "O castelo repousa sob um céu estrelado. Os feitiços brilham mais forte à noite. Entre e descubra os segredos que aguardam na escuridão.";

  if (timeOfDay === "morning") {
    subtitleText = "Amanhecer Mágico";
    descriptionText = "Os primeiros raios de sol da manhã iluminam as pesadas portas de carvalho do castelo. O Grande Salão desperta com o cheiro de café da manhã mágico e o voo das corujas.";
  } else if (timeOfDay === "afternoon") {
    subtitleText = "Tarde em Hogwarts";
    descriptionText = "O sol da tarde aquece as pedras milenares de Hogwarts. Pelas janelas, você pode ver os alunos rindo e praticando feitiços nos jardins iluminados.";
  }

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={bgUrl} alt="Hogwarts Castle" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>

      <MagicalParticles />

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className={`transition-all duration-1000 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Title */}
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-gold-gradient mb-2 tracking-wide">
            Hogwarts House
          </h1>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />

          {/* Dynamic intro */}
          <div className="glass rounded-2xl p-6 md:p-8 max-w-lg mx-auto mb-8">
            <p className="text-primary font-heading text-sm tracking-widest uppercase mb-2">
              {subtitleText}
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground mb-3">
              {titleText}
            </h2>
            <p className="text-muted-foreground font-serif text-sm md:text-base leading-relaxed">
              {descriptionText}
            </p>
          </div>

          {/* House crests */}
          <div className="flex justify-center gap-4 mb-8">
            {["🦁", "🐍", "🦅", "🦡"].map((emoji, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full glass flex items-center justify-center text-xl animate-float"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                {emoji}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="magical" size="lg" onClick={() => navigate("/login")} className="font-heading text-base px-8">
              Entrar no Portal
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/register")} className="font-heading text-base px-8 border-primary/30 hover:border-primary/60">
              Solicitar Vaga
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Portal exclusivo para bruxos de 13 a 17 anos ✨
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-4">
            Grupo Portal Matrix 2026 - Mundo Yasmin Caroline
          </p>
        </div>
      </div>
    </div>
  );
}
