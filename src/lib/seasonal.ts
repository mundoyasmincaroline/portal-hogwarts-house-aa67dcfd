export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  particleTheme: "magic" | "snow" | "leaves" | "sparks" | "hearts";
  bannerColor: string;
  icon: string;
}

export const getSeasonalEvent = (): SeasonalEvent | null => {
  const month = new Date().getMonth() + 1; // 1-12
  
  switch(month) {
    case 2: // Fevereiro
      return {
        id: "valentines",
        name: "Dia de São Valentim",
        description: "O amor está no ar de Hogwarts. Envie correios-coruja para os amigos!",
        particleTheme: "hearts",
        bannerColor: "from-pink-500/80 to-rose-400/80",
        icon: "💌"
      };
    case 7: // Julho
      return {
        id: "summer_camp",
        name: "Colônia de Férias de Hogwarts",
        description: "Aproveite o sol e o calor! Atividades ao ar livre e muita diversão mágica.",
        particleTheme: "sparks",
        bannerColor: "from-orange-500/80 to-yellow-500/80",
        icon: "⛺"
      };
    case 10: // Outubro
      return {
        id: "halloween",
        name: "Festival de Halloween",
        description: "O castelo está assombrado! Cuidado com os morcegos nos corredores.",
        particleTheme: "leaves",
        bannerColor: "from-orange-900/90 to-purple-900/90",
        icon: "🎃"
      };
    case 12: // Dezembro
      return {
        id: "yule_ball",
        name: "Baile de Inverno",
        description: "A magia natalina cobriu Hogwarts de neve. Prepare suas vestes a rigor!",
        particleTheme: "snow",
        bannerColor: "from-blue-600/80 to-cyan-400/80",
        icon: "❄️"
      };
    default:
      return null;
  }
};
