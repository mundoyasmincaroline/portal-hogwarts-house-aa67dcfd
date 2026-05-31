import { Database } from "@/integrations/supabase/types";

export type House = Database["public"]["Enums"]["house_type"];

export interface HouseData {
  name: string;
  id: House;
  points: number;
  motto: string;
  description: string;
  colors: { primary: string; secondary: string };
  traits: string[];
  members: number;
}

export const HOUSES: Record<House, HouseData> = {
  gryffindor: {
    name: "Grifinória",
    id: "gryffindor",
    points: 1250,
    motto: "Coragem acima de tudo",
    description: "A casa dos corajosos e destemidos. Valorizamos a bravura, a determinação e a nobreza de espírito.",
    colors: { primary: "hsl(0, 70%, 45%)", secondary: "hsl(43, 80%, 55%)" },
    traits: ["Coragem", "Bravura", "Determinação", "Nobreza"],
    members: 24,
  },
  slytherin: {
    name: "Sonserina",
    id: "slytherin",
    points: 1180,
    motto: "A grandeza nos espera",
    description: "A casa dos ambiciosos e astutos. Valorizamos a determinação, a leadership e a sagacidade.",
    colors: { primary: "hsl(145, 45%, 30%)", secondary: "hsl(200, 10%, 70%)" },
    traits: ["Ambição", "Astúcia", "Liderança", "Sagacidade"],
    members: 22,
  },
  ravenclaw: {
    name: "Corvinal",
    id: "ravenclaw",
    points: 1320,
    motto: "Sabedoria sem limites é o maior tesouro",
    description: "A casa dos sábios e criativos. Valorizamos o conhecimento, a inteligência e a originalidade.",
    colors: { primary: "hsl(215, 60%, 40%)", secondary: "hsl(30, 50%, 50%)" },
    traits: ["Sabedoria", "Criatividade", "Inteligência", "Originalidade"],
    members: 20,
  },
  hufflepuff: {
    name: "Lufa-Lufa",
    id: "hufflepuff",
    points: 1100,
    motto: "Lealdade e trabalho árduo",
    description: "A casa dos leais e justos. Valorizamos a dedicação, a paciência e a lealdade.",
    colors: { primary: "hsl(48, 80%, 55%)", secondary: "hsl(0, 0%, 15%)" },
    traits: ["Lealdade", "Dedicação", "Paciência", "Justiça"],
    members: 18,
  },
};
