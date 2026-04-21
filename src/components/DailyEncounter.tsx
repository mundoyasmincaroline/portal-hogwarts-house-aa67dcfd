import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import MagicalParticles from "@/components/MagicalParticles";
import { toast } from "sonner";

interface Choice {
  label: string;
  xpReward: number;
  response: string;
  actionType: "bravery" | "cunning" | "wisdom" | "loyalty";
}

interface Encounter {
  id: string;
  title: string;
  description: string;
  icon: string;
  choices: Choice[];
}

const ENCOUNTERS: Encounter[] = [
  {
    id: "peeves_bomb",
    title: "O Ataque de Pirraça",
    description: "Enquanto você caminha pelos corredores do terceiro andar, Pirraça surge do teto carregando um balde cheio de bombas de bosta, mirando exatamente em você!",
    icon: "👻",
    choices: [
      { label: "Lançar o feitiço Protego rapidamente!", xpReward: 15, response: "O escudo mágico reflete as bombas de volta para Pirraça, que foge xingando. Boa defesa!", actionType: "wisdom" },
      { label: "Correr para o outro lado do corredor.", xpReward: 5, response: "Você desvia por pouco, mas o cheiro ainda fica grudado nas suas vestes.", actionType: "cunning" },
      { label: "Gritar pelo Barão Sangrento.", xpReward: 10, response: "Apenas ouvir o nome do Barão faz Pirraça soltar o balde no próprio pé e sumir através da parede.", actionType: "bravery" }
    ]
  },
  {
    id: "lost_first_year",
    title: "O Primeiroanista Perdido",
    description: "Perto das masmorras, você encontra um aluno do primeiro ano chorando, completamente perdido e atrasado para a aula de Poções do Professor Snape.",
    icon: "😢",
    choices: [
      { label: "Acompanhá-lo até a sala de Poções.", xpReward: 20, response: "Você perde um pouco do seu tempo, mas o sorriso de alívio dele vale a pena. +20 XP por lealdade!", actionType: "loyalty" },
      { label: "Apenas apontar a direção correta.", xpReward: 10, response: "Você dá as instruções. Ele ainda parece assustado, mas agradece.", actionType: "wisdom" },
      { label: "Dizer a ele que Snape vai transformá-lo num sapo.", xpReward: 5, response: "O garoto sai correndo em pânico. Não foi muito legal, mas você riu.", actionType: "cunning" }
    ]
  },
  {
    id: "shiny_galleon",
    title: "O Galeão Brilhante",
    description: "No chão de pedra do Pátio Transfiguração, um Galeão de ouro brilha à luz do sol, aparentemente esquecido por alguém.",
    icon: "🪙",
    choices: [
      { label: "Entregar para a Professora McGonagall.", xpReward: 15, response: "Ela agradece sua honestidade e diz que vai procurar o dono.", actionType: "loyalty" },
      { label: "Guardar no bolso rapidamente.", xpReward: 10, response: "Achado não é roubado... certo? Ouro extra para Hogsmeade!", actionType: "cunning" },
      { label: "Lançar um feitiço revelador para checar se é uma armadilha.", xpReward: 20, response: "Sábia decisão! Era um feitiço de Gêmeos Weasley. Se tivesse tocado, seu nariz teria crescido.", actionType: "wisdom" }
    ]
  }
];

export default function DailyEncounter({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [resolving, setResolving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // Escolhe um encontro aleatório
    const random = ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
    setEncounter(random);
  }, []);

  const handleChoice = async (choice: Choice) => {
    if (!user || resolving) return;
    setResolving(true);
    setResult(choice.response);

    try {
      const { error } = await supabase.rpc("award_xp_action", {
        _action: `encounter_${choice.actionType}`,
        _user_id: user.id,
        _xp: choice.xpReward
      });

      if (!error) {
        toast.success(`Você ganhou +${choice.xpReward} XP pela sua ação! ✨`);
      }
    } catch (e) {
      console.error(e);
    }

    // Espera 4 segundos para a pessoa ler o resultado e fecha
    setTimeout(() => {
      onComplete();
    }, 4000);
  };

  if (!encounter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
      <MagicalParticles />

      <div className="relative z-10 glass max-w-lg w-full p-8 rounded-2xl border border-primary/20 shadow-2xl text-center animate-scale-in">
        <div className="text-6xl mb-6 animate-bounce">{encounter.icon}</div>
        
        {!result ? (
          <>
            <h2 className="font-heading text-2xl text-gold-gradient mb-4">{encounter.title}</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {encounter.description}
            </p>

            <div className="space-y-3">
              {encounter.choices.map((choice, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full h-auto py-4 px-6 text-left flex justify-start items-center gap-4 hover:border-primary/50 hover:bg-primary/10 transition-all whitespace-normal"
                  onClick={() => handleChoice(choice)}
                  disabled={resolving}
                >
                  <span className="text-primary/60">✦</span>
                  <span className="flex-1 font-serif text-sm">{choice.label}</span>
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="animate-fade-in-up py-8">
            <h2 className="font-heading text-2xl text-primary mb-6">O Destino foi Selado!</h2>
            <p className="text-foreground/90 font-serif text-lg leading-relaxed mb-8">
              "{result}"
            </p>
            <div className="inline-block px-4 py-2 rounded-full glass border border-primary/30 text-primary font-heading animate-pulse">
              Preparando seu turno...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
