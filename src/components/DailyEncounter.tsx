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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
      <MagicalParticles />
      
      <div className="relative overflow-hidden w-full max-w-xl rounded-[3rem] bg-gradient-to-b from-white/[0.05] to-black/60 backdrop-blur-2xl p-8 md:p-12 border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.9)] text-center animate-in zoom-in-95 duration-500">
        {/* Ambient Magic Glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="relative inline-flex mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-primary/30 to-amber-600/10 rounded-full border border-primary/40 flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(var(--primary),0.3)] animate-float">
                  {encounter.icon}
              </div>
          </div>
          
          {!result ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-heading text-gold-gradient tracking-tight mb-3">{encounter.title}</h2>
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mb-6" />
                <p className="text-muted-foreground leading-relaxed font-serif text-base italic">
                  "{encounter.description}"
                </p>
              </div>

              <div className="space-y-4">
                {encounter.choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => handleChoice(choice)}
                    disabled={resolving}
                    className="w-full relative overflow-hidden group/choice p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-left transition-all duration-300 hover:bg-white/[0.08] hover:border-primary/50 hover:-translate-y-1 active:scale-[0.98]"
                  >
                    {/* Shimmer on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/choice:translate-x-full transition-transform duration-1000" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover/choice:bg-primary group-hover/choice:text-white transition-colors">
                        <span className="text-xs font-bold">{i + 1}</span>
                      </div>
                      <span className="flex-1 font-heading text-sm text-white/80 group-hover/choice:text-white transition-colors">{choice.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="py-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-heading text-primary uppercase tracking-[0.2em] mb-8">
                <Sparkles size={10} /> O Destino foi Selado
              </div>
              <p className="text-xl md:text-2xl text-foreground font-serif italic leading-relaxed mb-10 text-white/90">
                "{result}"
              </p>
              <div className="relative inline-block px-8 py-3 rounded-2xl bg-primary/5 border border-primary/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" />
                <span className="relative z-10 text-[10px] font-heading text-primary uppercase tracking-[0.3em] animate-pulse">Invocando recompensas...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
