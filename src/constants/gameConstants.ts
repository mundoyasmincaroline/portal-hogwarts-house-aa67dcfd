// Custos em GALEÕES (moeda principal do portal)
export const RARITY_COST = { bronze: 25, silver: 60, gold: 150 } as const;
export const PACK_COST = 120;
export const ALBUM_COMPLETE_REWARD = 1500;

export const RARITY_LABELS_PT: Record<string, string> = {
  gold: "Lendária",
  silver: "Incomum",
  bronze: "Comum",
};

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
