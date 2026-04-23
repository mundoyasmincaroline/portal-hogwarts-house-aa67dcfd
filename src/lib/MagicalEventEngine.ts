/**
 * MagicalEventEngine — O coração dinâmico de Hogwarts
 * Gera plots, aventuras e celebrações baseadas no calendário bruxo e real.
 */

export interface MagicalEvent {
  id: string;
  name: string;
  start: string;
  end: string;
  type: string;
  xp: number;
  galeons: number;
  sicles: number;
  knuts: number;
  audience: "all" | "canons" | "ocs";
  description: string;
  riddles: { q: string; a: string }[];
  isSpecial?: boolean;
}

const SAGA_BIRTHDAYS: Record<string, string> = {
  "01-09": "Severo Snape",
  "30-01": "Lílian Potter",
  "01-03": "Rony Weasley",
  "10-03": "Remo Lupin",
  "27-03": "Tiago Potter",
  "01-04": "Fred e Jorge Weasley",
  "05-06": "Draco Malfoy",
  "23-06": "Duda Dursley",
  "30-07": "Neville Longbottom",
  "31-07": "Harry Potter",
  "11-08": "Gina Weasley",
  "22-08": "Percy Weasley",
  "19-09": "Hermione Granger",
  "04-10": "Minerva McGonagall",
  "30-10": "Molly Weasley",
  "29-11": "Guia Weasley",
  "06-12": "Rubeus Hagrid",
  "12-12": "Charlie Weasley",
  "31-12": "Tom Riddle",
};

const PLOT_THEMES = [
  {
    type: "history",
    titles: ["O Despertar da Fênix", "O Segredo dos Fundadores", "A Herança de Merlin"],
    descriptions: ["Um teste de conhecimento sobre a linhagem sagrada de Hogwarts.", "As paredes do castelo sussurram sobre o passado...", "Encontramos um pergaminho antigo de Camelot!"],
    riddles: [
      { q: "Qual o nome do fantasma da Corvinal?", a: "dama cinzenta" },
      { q: "Quem criou a Câmara Secreta?", a: "salazar" },
      { q: "Qual casa preza pela lealdade?", a: "lufa lufa" }
    ]
  },
  {
    type: "spells",
    titles: ["O Mistério de Gringotts", "Duelo das Varinhas Quebradas", "Caos nas Poções"],
    descriptions: ["Os cofres estão instáveis! Estabilize a magia.", "Um feitiço deu errado no Salão Principal!", "O caldeirão de Neville explodiu de novo..."],
    riddles: [
      { q: "Feitiço para paralisar?", a: "petrificus totalus" },
      { q: "Qual a planta que grita?", a: "mandragora" },
      { q: "Feitiço contra Bicho-Papão?", a: "riddikulus" }
    ]
  },
  {
    type: "dark_arts",
    titles: ["O Enigma da Seção Reservada", "A Sombra de Azkaban", "O Chamado das Trevas"],
    descriptions: ["Segredos que apenas os corajosos podem desvendar.", "Dementores foram vistos perto do Lago Negro!", "Um artefato sombrio foi encontrado no armário."],
    riddles: [
      { q: "Qual a maldição de controle?", a: "imperio" },
      { q: "Quem matou Dumbledore?", a: "snape" },
      { q: "O que é uma Horcrux?", a: "alma" }
    ]
  }
];

export function getEventsForToday(customCelebrations: { name: string; type: string }[] = []): MagicalEvent[] {
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const isSagaBirthday = SAGA_BIRTHDAYS[dateStr];

  // Se houver aniversários de OCs, eles entram como celebrações extras
  const ocCelebration = customCelebrations.length > 0 ? customCelebrations[0] : null;

  const events: MagicalEvent[] = [
    {
      id: "morning",
      name: "Aula Matinal de Defesa",
      start: "09:00",
      end: "09:30",
      type: "history",
      xp: 100,
      galeons: 0,
      sicles: 15,
      knuts: 20,
      audience: "canons",
      description: "Um treino intensivo para começar o dia com a mente afiada. Recompensa em Prata!",
      riddles: getRandomRiddles("history")
    },
    {
      id: "afternoon",
      name: ocCelebration ? `Festa de OC: ${ocCelebration.name}` : (isSagaBirthday ? `Festa de Aniversário: ${isSagaBirthday}` : "O Desafio da Tarde"),
      start: "15:00",
      end: "15:30",
      type: "spells",
      xp: (isSagaBirthday || ocCelebration) ? 300 : 150,
      galeons: (isSagaBirthday || ocCelebration) ? 5 : 0,
      sicles: (isSagaBirthday || ocCelebration) ? 50 : 30,
      knuts: (isSagaBirthday || ocCelebration) ? 100 : 50,
      audience: "all",
      description: ocCelebration 
        ? `Hoje celebramos o personagem de um de nossos membros: ${ocCelebration.name}! Parabéns por sua jornada em Hogwarts.`
        : (isSagaBirthday 
            ? `Hoje celebramos o nascimento de ${isSagaBirthday}! O portal está em festa com recompensas de Gringotts dobradas.`
            : "Os cofres de Gringotts estão abertos para quem provar seu valor."),
      riddles: (isSagaBirthday || ocCelebration) ? [
        { q: "Qual a saudação mágica para o aniversariante?", a: "parabens" },
        { q: "O bolo está pronto? (Diga sim)", a: "sim" }
      ] : getRandomRiddles("spells"),
      isSpecial: !!(isSagaBirthday || ocCelebration)
    },
    {
      id: "night",
      name: "Incursão na Floresta Proibida",
      start: "21:00",
      end: "21:30",
      type: "dark_arts",
      xp: 250,
      galeons: 1,
      sicles: 60,
      knuts: 200,
      audience: "ocs",
      description: "As criaturas da noite estão agitadas. Uma incursão perigosa que garante até um Galeão de ouro!",
      riddles: getRandomRiddles("dark_arts")
    }
  ];

  // Plot Twists baseados no dia da semana
  const day = now.getDay();
  if (day === 0) { // Domingo de Plot Twist
    events[2].name = "A Traição do Mapa";
    events[2].description = "O Mapa do Maroto parou de funcionar e alguém está nos vigiando!";
    events[2].xp += 100;
  }

  return events;
}

function getRandomRiddles(type: string) {
  const theme = PLOT_THEMES.find(t => t.type === type) || PLOT_THEMES[0];
  return theme.riddles.sort(() => Math.random() - 0.5).slice(0, 2);
}
