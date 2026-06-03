import React from "react";
import { useAtmosphere, TimeOfDay } from "@/hooks/core/useAtmosphere";
import { motion, AnimatePresence } from "framer-motion";
import dawnImg from "@/assets/hogwarts_dawn.webp";
import morningImg from "@/assets/hogwarts_morning.webp";
import afternoonImg from "@/assets/hogwarts_afternoon.webp";
import duskImg from "@/assets/hogwarts_dusk.webp";
import nightImg from "@/assets/hogwarts_night.webp";

const WeatherParticles: React.FC<{ weather: string }> = ({ weather }) => {
  if (weather === "clear") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(1px_1px_at_20%_30%,_#d4af37,_transparent),_radial-gradient(1px_1px_at_70%_60%,_#d4af37,_transparent)] opacity-20 animate-pulse" />
      </div>
    );
  }
  return null;
};

export const AtmosphericBackground: React.FC = () => {
  const { timeOfDay, weather } = useAtmosphere();

  const scenes: Record<TimeOfDay, { img: string; overlay: string; tint: string }> = {
    dawn:      { img: dawnImg,      overlay: "from-indigo-950/70 via-purple-900/40 to-rose-900/30", tint: "hue-rotate-[-5deg]" },
    morning:   { img: morningImg,   overlay: "from-sky-950/60 via-blue-900/30 to-amber-900/20",    tint: "" },
    afternoon: { img: afternoonImg, overlay: "from-amber-900/30 via-orange-900/20 to-yellow-900/10", tint: "" },
    dusk:      { img: duskImg,      overlay: "from-orange-950/60 via-rose-950/50 to-indigo-950/60", tint: "" },
    night:     { img: nightImg,     overlay: "from-slate-950/80 via-indigo-950/60 to-slate-950/90", tint: "" },
  };

  const scene = scenes[timeOfDay];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={timeOfDay}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Hogwarts scene image */}
          <div
            className={`absolute inset-0 bg-cover bg-center ${scene.tint}`}
            style={{ backgroundImage: `url(${scene.img})` }}
          />
          {/* Atmospheric color wash — leve, mantém o cenário vivo */}
          <div className={`absolute inset-0 bg-gradient-to-b ${scene.overlay} opacity-70`} />

          {/* Glow dourado quente de Hogwarts (velas/lareira) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-700/25 via-transparent to-amber-900/10 mix-blend-soft-light" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.22),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(180,90,30,0.18),_transparent_55%)]" />

          {/* Vinheta dourada — escurece bordas sem chumbar o azul/cinza */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(20,12,5,0.7)_100%)]" />
          
          {/* Weather Particles Layer */}
          <WeatherParticles weather={weather} />
        </motion.div>
      </AnimatePresence>


      {/* Starfield only at night/dawn — local CSS, no network */}
      {(timeOfDay === "night" || timeOfDay === "dawn") && (
        <div className="absolute inset-0 opacity-50 mix-blend-screen bg-[radial-gradient(1px_1px_at_15%_22%,#fff,transparent),radial-gradient(1px_1px_at_42%_67%,#fff,transparent),radial-gradient(1px_1px_at_78%_31%,#fff,transparent),radial-gradient(1px_1px_at_88%_85%,#fff,transparent),radial-gradient(1px_1px_at_27%_88%,#fff,transparent)] animate-pulse" />
      )}

      {/* Weather Effects */}
      {weather === "rainy" && (
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-300/10 to-transparent animate-[slideDown_1.2s_linear_infinite]" />
          <div className="absolute inset-0 bg-slate-900/20" />
        </div>
      )}
      {weather === "foggy" && (
        <div className="absolute inset-0 opacity-60 bg-gradient-to-t from-slate-800/70 via-slate-700/20 to-transparent blur-2xl animate-pulse" />
      )}
      {weather === "snowy" && (
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(1px_1px_at_20%_30%,#fff,transparent),radial-gradient(1px_1px_at_60%_70%,#fff,transparent),radial-gradient(1px_1px_at_80%_20%,#fff,transparent)] mix-blend-screen" />
      )}
    </div>
  );
};
