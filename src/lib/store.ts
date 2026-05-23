import { House, HOUSES, getLevelFromXP, UserProfile, HouseData } from "@/types";

export { HOUSES, getLevelFromXP };
export type { UserProfile, HouseData };

export interface Post {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  reactions: { emoji: string; count: number; users: string[] }[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: "daily" | "weekly" | "special";
  active: boolean;
  createdAt: string;
}

export const MOCK_USER: UserProfile = {
  id: "1",
  fullName: "Yasmin Caroline",
  username: "mundoyasmincaroline",
  age: 16,
  house: "gryffindor",
  level: 7,
  xp: 3200,
  xpToNext: 4000,
  bio: "Administradora do Portal Hogwarts House ✨",
  avatar: null,
  role: "admin",
  badges: ["founder", "admin", "first-spell", "house-champion"],
  joinedAt: "2024-01-01",
  approved: true,
  online: true,
};

export const MOCK_MEMBERS: UserProfile[] = [
  MOCK_USER,
  { id: "2", fullName: "Luna Silva", username: "lunastars", age: 15, house: "ravenclaw", level: 5, xp: 1600, xpToNext: 2200, bio: "Amante de enigmas 🦅", avatar: null, role: "member", badges: ["riddle-master"], joinedAt: "2024-02-15", approved: true, online: true },
  { id: "3", fullName: "Pedro Alves", username: "pedro_snake", age: 14, house: "slytherin", level: 4, xp: 1100, xpToNext: 1500, bio: "Ambicioso por natureza 🐍", avatar: null, role: "member", badges: ["potion-master"], joinedAt: "2024-03-01", approved: true, online: false },
  { id: "4", fullName: "Maria Clara", username: "clarabadger", age: 16, house: "hufflepuff", level: 6, xp: 2400, xpToNext: 3000, bio: "Lealdade acima de tudo 🦡", avatar: null, role: "moderator", badges: ["loyal-heart", "helper"], joinedAt: "2024-01-20", approved: true, online: true },
  { id: "5", fullName: "João Victor", username: "jvlion", age: 13, house: "gryffindor", level: 3, xp: 700, xpToNext: 1000, bio: "Coragem é meu nome! 🦁", avatar: null, role: "member", badges: ["brave-heart"], joinedAt: "2024-04-10", approved: true, online: false },
];

export const MOCK_CHALLENGES: Challenge[] = [
  { id: "1", title: "Enigma do Dia", description: "Resolva o enigma da Esfinge e ganhe XP!", xpReward: 50, type: "daily", active: true, createdAt: "2024-04-15" },
  { id: "2", title: "Duelo de Feitiços", description: "Participe do duelo semanal entre casas!", xpReward: 200, type: "weekly", active: true, createdAt: "2024-04-14" },
  { id: "3", title: "Caça ao Pomo", description: "Encontre o pomo de ouro escondido no portal.", xpReward: 100, type: "daily", active: true, createdAt: "2024-04-15" },
];

export const WEEKLY_INTROS = [
  { title: "A Profecia Esquecida", subtitle: "Uma nova era se inicia em Hogwarts...", description: "Algo se move nas sombras do castelo. Uma profecia esquecida ressurge, e apenas os mais corajosos poderão desvendar seus segredos." },
  { title: "O Torneio das Casas", subtitle: "Quem será coroado campeão?", description: "As quatro casas se preparam para o maior torneio do ano. Mostre do que você é capaz e traga glória para sua casa!" },
  { title: "Noite de Lua Cheia", subtitle: "Os mistérios da Floresta Proibida", description: "Criaturas mágicas se agitam sob a luz da lua. Aventure-se na Floresta Proibida e descubra tesouros escondidos." },
  { title: "O Baile de Inverno", subtitle: "Uma noite encantada espera por você", description: "O Grande Salão se transforma para a noite mais mágica do ano. Prepare-se para uma celebração inesquecível." },
  { title: "A Câmara Secreta", subtitle: "O segredo foi revelado...", description: "Passagens secretas foram encontradas. Desafios antigos aguardam aqueles que ousam explorar os corredores ocultos do castelo." },
];
