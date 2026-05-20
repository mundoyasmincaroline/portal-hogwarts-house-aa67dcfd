export const RARITY_COST = { bronze: 20, silver: 50, gold: 100 } as const;
export const PACK_COST = 80;
export const ALBUM_COMPLETE_REWARD = 500;

export const CATEGORY_LABELS: Record<string, string> = {
  clothing: "👗 Roupas",
  wand: "🪄 Varinhas",
  accessory: "💎 Acessórios",
  skin: "🎨 Skins",
  decoration: "🏠 Decorações",
  pack: "📦 Pacotes",
  spell: "📜 Feitiços",
  potion: "🧪 Poções",
  upgrade: "⚡ Upgrades"
};

export const RARITY_LABELS: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  legendary: "Lendário"
};
