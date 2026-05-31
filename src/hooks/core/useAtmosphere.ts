import { useState, useEffect } from "react";

export type TimeOfDay = "dawn" | "morning" | "afternoon" | "dusk" | "night";
export type WeatherCondition = "clear" | "rainy" | "foggy" | "snowy";

interface Atmosphere {
  timeOfDay: TimeOfDay;
  weather: WeatherCondition;
  isDark: boolean;
  displayTime: string;
  displayDate: string;
}

export function useAtmosphere() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherCondition>("clear");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    
    // Simulate weather changes every 30 minutes
    const weatherTimer = setInterval(() => {
      const rand = Math.random();
      if (rand > 0.8) setWeather("rainy");
      else if (rand > 0.7) setWeather("foggy");
      else setWeather("clear");
    }, 1800000);

    return () => {
      clearInterval(timer);
      clearInterval(weatherTimer);
    };
  }, []);

  const hour = now.getHours();
  
  let timeOfDay: TimeOfDay = "night";
  if (hour >= 5 && hour < 7) timeOfDay = "dawn";
  else if (hour >= 7 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
  else if (hour >= 17 && hour < 19) timeOfDay = "dusk";
  else timeOfDay = "night";

  const isDark = timeOfDay === "night" || timeOfDay === "dawn" || timeOfDay === "dusk";

  return {
    timeOfDay,
    weather,
    isDark,
    displayTime: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    displayDate: now.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }),
    now
  };
}
