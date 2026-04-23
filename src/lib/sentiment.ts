import { supabase } from "./supabase/client";

export type Emotion = "alegre" | "triste" | "raiva" | "neutro";

export interface SentimentState {
  emotion: Emotion;
  power: number; // 0 a 100
  last_update: string;
}

export const updateSentiment = async (userId: string, emotion: Emotion, intensity: number = 10) => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("mood, mood_power")
    .eq("user_id", userId)
    .single();

  let newPower = (profile?.mood_power || 50);
  
  if (profile?.mood === emotion) {
    newPower = Math.min(100, newPower + intensity);
  } else {
    newPower = intensity; // Muda o sentimento e reseta a intensidade base
  }

  const { error } = await supabase
    .from("profiles")
    .update({ 
      mood: emotion, 
      mood_power: newPower,
      last_mood_update: new Date().toISOString()
    } as any)
    .eq("user_id", userId);

  return { error, emotion, power: newPower };
};

export const getEmotionColor = (emotion: Emotion) => {
  switch (emotion) {
    case "alegre": return "text-yellow-400";
    case "triste": return "text-blue-400";
    case "raiva": return "text-red-500";
    default: return "text-zinc-400";
  }
};

export const getEmotionIcon = (emotion: Emotion) => {
  switch (emotion) {
    case "alegre": return "✨";
    case "triste": return "🌧️";
    case "raiva": return "🔥";
    default: return "😐";
  }
};
