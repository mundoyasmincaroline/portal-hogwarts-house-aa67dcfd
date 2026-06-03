// Lazy route prefetch map — chamado no mouseenter/touchstart dos itens de navegação.
// Cada entrada dispara o mesmo dynamic import() usado em App.tsx, fazendo o Vite
// pré-carregar o chunk antes do clique. O navegador deduplica imports idênticos.
const loaders: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("@/pages/Feed"),
  "/dashboard/castle-map": () => import("@/pages/CastleMap"),
  "/dashboard/chapters": () => import("@/pages/Chapters"),
  "/dashboard/npcs": () => import("@/pages/NPCs"),
  "/dashboard/diary": () => import("@/pages/Diary"),
  "/dashboard/prophecy": () => import("@/pages/Prophecy"),
  "/dashboard/guide": () => import("@/pages/MaraudersGuide"),
  "/dashboard/friends": () => import("@/pages/Friends"),
  "/dashboard/clubs": () => import("@/pages/Clubs"),
  "/dashboard/members": () => import("@/pages/Members"),
  "/dashboard/duels": () => import("@/pages/Duels"),
  "/dashboard/duels-pvp": () => import("@/pages/DuelsPvP"),
  "/dashboard/quidditch": () => import("@/pages/Quidditch"),
  "/dashboard/room": () => import("@/pages/RoomOfRequirement"),
  "/dashboard/wand": () => import("@/pages/WandCrafting"),
  "/dashboard/patronus": () => import("@/pages/Patronus"),
  "/dashboard/chats": () => import("@/pages/Chats"),
  "/dashboard/instahogwarts": () => import("@/pages/InstaHogwarts"),
  "/dashboard/challenges": () => import("@/pages/Challenges"),
  "/dashboard/events": () => import("@/pages/Events"),
  "/dashboard/tournaments": () => import("@/pages/Tournaments"),
  "/dashboard/ranked": () => import("@/pages/RankedLadder"),
  "/dashboard/raid": () => import("@/pages/RaidBoss"),
  "/dashboard/guilds": () => import("@/pages/Guilds"),
  "/dashboard/rp-teams": () => import("@/pages/RPTeams"),
  "/dashboard/live-events": () => import("@/pages/LiveEvents"),
  "/dashboard/reputation": () => import("@/pages/Reputation"),
  "/dashboard/quests": () => import("@/pages/Quests"),
  "/dashboard/world-editor": () => import("@/pages/WorldEditor"),
  "/dashboard/sorting-hat": () => import("@/pages/SortingHatAI"),
  "/dashboard/prophet": () => import("@/pages/ProphetDaily"),
  "/dashboard/classes": () => import("@/pages/Classes"),
  "/dashboard/canon-lessons": () => import("@/pages/CanonLessons"),
  "/dashboard/grimoire": () => import("@/pages/Grimoire"),
  "/dashboard/exams": () => import("@/pages/Exams"),
  "/dashboard/discipline": () => import("@/pages/Discipline"),
  "/dashboard/creatures": () => import("@/pages/Creatures"),
  "/dashboard/greenhouse": () => import("@/pages/Greenhouse"),
  "/dashboard/potions": () => import("@/pages/PotionsLab"),
  "/dashboard/world-map": () => import("@/pages/WorldMap"),
  "/dashboard/travel": () => import("@/pages/MagicalTravel"),
  "/dashboard/journal": () => import("@/pages/TravelJournal"),
  "/dashboard/triwizard": () => import("@/pages/TriwizardTournament"),
  "/dashboard/duel-ladder": () => import("@/pages/DuelLadder"),
  "/dashboard/hall-of-fame": () => import("@/pages/HallOfFame"),
  "/dashboard/dark-arts": () => import("@/pages/DarkArts"),
  "/dashboard/factions": () => import("@/pages/Factions"),
  "/dashboard/legendary-prophecies": () => import("@/pages/LegendaryProphecies"),
  "/dashboard/battle-of-hogwarts": () => import("@/pages/BattleOfHogwarts"),
  "/dashboard/end-times": () => import("@/pages/EndTimes"),
  "/dashboard/lineages": () => import("@/pages/Lineages"),
  "/dashboard/album": () => import("@/pages/StickerAlbum"),
  "/dashboard/store": () => import("@/pages/GringottsStore"),
  "/dashboard/hogsmeade": () => import("@/pages/Hogsmeade"),
  "/dashboard/diagon": () => import("@/pages/DiagonAlley"),
  "/dashboard/inventory": () => import("@/pages/Inventory"),
  "/dashboard/item-trades": () => import("@/pages/ItemTrades"),
  "/dashboard/marketplace": () => import("@/pages/Marketplace"),
  "/dashboard/auctions": () => import("@/pages/Auctions"),
  "/dashboard/gringotts": () => import("@/pages/Gringotts"),
  "/dashboard/vault": () => import("@/pages/GringottsVault"),
  "/dashboard/wallet": () => import("@/pages/Wallet"),
  "/dashboard/battle-pass": () => import("@/pages/BattlePass"),
  "/dashboard/ranking": () => import("@/pages/Ranking"),
  "/dashboard/houses": () => import("@/pages/Houses"),
  "/dashboard/rules": () => import("@/pages/Rules"),
  "/dashboard/azkaban": () => import("@/pages/Azkaban"),
  "/dashboard/settings/notifications": () => import("@/pages/NotificationPreferences"),
  "/dashboard/ministry": () => import("@/pages/Ministry"),
  "/dashboard/admin": () => import("@/pages/Admin"),
  "/dashboard/admin/characters": () => import("@/pages/AdminCharacters"),
  "/dashboard/admin/finance": () => import("@/pages/AdminFinance"),
  "/dashboard/admin/analytics": () => import("@/pages/AdminAnalytics"),
  "/dashboard/admin/support": () => import("@/pages/AdminSupport"),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = loaders[path];
  if (!loader) return;
  prefetched.add(path);
  // Em conexões fracas, evita gastar dados pré-carregando rotas
  const conn = (navigator as any).connection;
  if (conn?.saveData || (conn?.effectiveType && /(^|-)(2g|slow-2g)$/.test(conn.effectiveType))) return;
  const run = () => { loader().catch(() => prefetched.delete(path)); };
  if (typeof (window as any).requestIdleCallback === "function") {
    (window as any).requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 80);
  }
}