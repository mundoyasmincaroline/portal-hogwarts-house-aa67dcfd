import React from "react";
import { useAtmosphere, TimeOfDay } from "@/hooks/core/useAtmosphere";
import { motion, AnimatePresence } from "framer-motion";

export const AtmosphericBackground: React.FC = () => {
  const { timeOfDay, weather } = useAtmosphere();

  const getGradient = (time: TimeOfDay) => {
    switch (time) {
      case "dawn":
        return "from-indigo-950 via-purple-900/40 to-orange-900/20";
      case "morning":
        return "from-blue-900/30 via-sky-900/20 to-transparent";
      case "afternoon":
        return "from-amber-900/10 via-transparent to-transparent";
      case "dusk":
        return "from-orange-950/40 via-purple-950/40 to-indigo-950/40";
      case "night":
      default:
        return "from-slate-950 via-blue-950/20 to-slate-950";
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={timeOfDay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className={`absolute inset-0 bg-gradient-to-br ${getGradient(timeOfDay)}`}
        />
      </AnimatePresence>
      
      {/* Dynamic Overlay Textures */}
      <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      
      {/* Weather Effects */}
      {weather === "rainy" && (
        <div className="absolute inset-0 opacity-20 pointer-events-none animate-pulse">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/10 to-transparent translate-y-full animate-[slideDown_1s_linear_infinite]" />
        </div>
      )}
      
      {weather === "foggy" && (
        <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent blur-3xl animate-pulse" />
      )}
    </div>
  );
};
