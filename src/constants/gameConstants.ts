export const RARITY_COST = { bronze: 20, silver: 50, gold: 100 } as const;
export const PACK_COST = 80;
export const ALBUM_COMPLETE_REWARD = 500;

export const CATEGORY_LABELS: Record<string, string> = {
  olivaras_wand: "🪄 Olivaras (Varinhas)",
  malkin_clothing: "👗 Madame Malkin (Vestes)",
  floreios_books: "📚 Floreios e Borrões (Livros)",
  weasley_jokes: "🎆 Sortilégios Weasley",
  borgin_rarities: "💀 Borgin & Burkes (Raridades)",
  potion: "🧪 Poções",
  pack: "📦 Pacotes",
  spell: "📜 Feitiços",
  upgrade: "⚡ Upgrades"
};

export const RARITY_LABELS: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  legendary: "Lendário"
};
