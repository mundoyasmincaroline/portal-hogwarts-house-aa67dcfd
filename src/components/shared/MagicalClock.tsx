import React from "react";
import { useAtmosphere } from "@/hooks/core/useAtmosphere";
import { Clock, MapPin, Cloud } from "lucide-react";

export const MagicalClock: React.FC = () => {
  const { displayTime, displayDate, weather, timeOfDay } = useAtmosphere();

  const getWeatherLabel = () => {
    switch (weather) {
      case "rainy": return "Chuva em Hogwarts";
      case "foggy": return "Névoa Proibida";
      case "snowy": return "Neve em Hogsmeade";
      default: return "Céu Limpo";
    }
  };

  const getTimeOfDayLabel = () => {
    switch (timeOfDay) {
      case "dawn": return "Madrugada";
      case "morning": return "Manhã";
      case "afternoon": return "Tarde";
      case "dusk": return "Crepúsculo";
      default: return "Noite";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 py-2 px-4 glass rounded-2xl border-primary/20 bg-black/20 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-primary animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[11px] font-heading leading-none text-primary uppercase tracking-wider">{displayTime}</span>
          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">{displayDate}</span>
        </div>
      </div>
      
      <div className="w-px h-6 bg-border/40 hidden sm:block" />
      
      <div className="flex items-center gap-2">
        <Cloud size={14} className="text-blue-400/80" />
        <div className="flex flex-col">
          <span className="text-[11px] font-heading leading-none text-foreground uppercase tracking-wider">{getWeatherLabel()}</span>
          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">{getTimeOfDayLabel()}</span>
        </div>
      </div>

      <div className="w-px h-6 bg-border/40 hidden sm:block" />

      <div className="flex items-center gap-2">
        <MapPin size={14} className="text-red-400/80" />
        <div className="flex flex-col">
          <span className="text-[11px] font-heading leading-none text-foreground uppercase tracking-wider">Castelo de Hogwarts</span>
          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Terras Altas, Escócia</span>
        </div>
      </div>
    </div>
  );
};
