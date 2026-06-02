export const RARITY_COST = { bronze: 20, silver: 50, gold: 100 } as const;
export const PACK_COST = 80;
export const ALBUM_COMPLETE_REWARD = 500;

export const CATEGORY_LABELS: Record<string, string> = {
  wand: "🪄 Varinhas",
  pet: "🐾 Pets Mágicos",
  potion: "🧪 Poções",
  clothing: "👗 Vestes & Capas",
  accessory: "✨ Acessórios",
  upgrade: "⚡ Upgrades & Vassouras",
  spell: "📜 Feitiços",
  pack: "📦 Pacotes",
  floreios_books: "📚 Livros"
};

export const RARITY_LABELS: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  legendary: "Lendário"
};
