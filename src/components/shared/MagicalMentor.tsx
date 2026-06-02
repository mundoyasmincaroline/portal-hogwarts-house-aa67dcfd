import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Map as MapIcon, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Lightbulb,
  Gamepad2,
  Users,
  ShoppingBag,
  Zap,
  Swords,
  ScrollText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { HOUSES } from "@/types/house";
import { type House } from "@/types";
import EmojiIcon from "@/components/shared/EmojiIcon";
import { Link } from "react-router-dom";
import HouseCrest from "@/components/rpg/HouseCrest";


interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path?: string;
  actionLabel?: string;
  tip?: string;
}

const GENERAL_STEPS: GuideStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo a Hogwarts",
    description: "Você agora faz parte da mais renomada escola de magia e bruxaria. Este guia irá ajudá-lo a dar seus primeiros passos no castelo.",
    icon: <EmojiIcon e="🏰" size={32} />,
    tip: "Fique de olho no seu nível de XP, ele desbloqueia novas áreas!"
  },
  {
    id: "chat",
    title: "Interação & RPG",
    description: "O coração de Hogwarts são os Chats de RPG. Vá em 'Chats' para interpretar seu personagem com outros bruxos em tempo real.",
    icon: <EmojiIcon e="💬" size={32} />,
    path: "/dashboard/chats",
    actionLabel: "Ver Salas de Chat",
    tip: "Use * para ações e ( ) para pensamentos no chat."
  },
  {
    id: "challenges",
    title: "Desafios & XP",
    description: "Complete missões diárias e enigmas para ganhar XP e Galeões. É a melhor forma de subir de nível e ganhar prestígio para sua casa.",
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    path: "/dashboard/challenges",
    actionLabel: "Explorar Desafios",
    tip: "Algumas missões são automáticas, outras precisam de envio manual!"
  },
  {
    id: "economy",
    title: "Economia Mágica",
    description: "Galeões são usados na Loja Gringotts e no Mercado do Beco. Você pode comprar varinhas, roupas e até figurinhas raras.",
    icon: <EmojiIcon e="🪙" size={32} />,
    path: "/dashboard/store",
    actionLabel: "Ir à Loja",
    tip: "Você ganha Galeões em eventos ou através de pacotes no Gringotts."
  },
  {
    id: "social",
    title: "InstaHogwarts",
    description: "Compartilhe seus momentos, fotos e conquistas. Siga outros bruxos e curta suas postagens para ganhar pontos de reputação.",
    icon: <EmojiIcon e="📸" size={32} />,
    path: "/dashboard/instahogwarts",
    actionLabel: "Abrir Feed",
    tip: "Postagens com trilha sonora do Spotify chamam mais atenção!"
  }
];

const HOUSE_GUIDES: Record<House, { intro: string; goal: string }> = {
  gryffindor: {
    intro: "Bravo Grifinório! Sua coragem é sua maior arma. Mostre sua fibra nos duelos e proteja os mais fracos.",
    goal: "Sua missão é liderar pelo exemplo. Ganhe pontos de casa através de atos de bravura e duelos honrados."
  },
  slytherin: {
    intro: "Astuto Sonserino! A ambição corre em suas veias. Use sua inteligência para alcançar o topo da hierarquia.",
    goal: "Foque em dominar o Mercado e acumular Galeões. O poder econômico é o caminho para a grandeza."
  },
  ravenclaw: {
    intro: "Sábio Corvinal! Sua mente é um tesouro. Busque o conhecimento escondido em cada canto da biblioteca.",
    goal: "Resolva os enigmas mais complexos e participe das aulas canon. A sabedoria é a chave para o progresso."
  },
  hufflepuff: {
    intro: "Leal Lufa-Lufa! Sua dedicação é inspiradora. O trabalho árduo e a amizade são seus pilares.",
    goal: "Fortaleça sua rede de amigos e participe de missões coletivas. A união faz a força da sua casa."
  }
};

export default function MagicalMentor() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showHouseGuide, setShowHouseGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  const houseId = (profile?.house as House) || "gryffindor";
  const house = HOUSES[houseId];
  const houseGuide = HOUSE_GUIDES[houseId];

  const storageKey = profile?.user_id ? `mentor_state_${profile.user_id}` : null;
  const readState = () => {
    if (!storageKey) return {} as any;
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
  };
  const writeState = (patch: Record<string, any>) => {
    if (!storageKey) return;
    const next = { ...readState(), ...patch };
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  // Lógica de visibilidade e persistência do mentor
  useEffect(() => {
    if (!profile?.user_id) return;

    const mentorData = readState();

    // "Juro solenemente que já sei o caminho" — usuário pediu para nunca mais ver
    if (mentorData.dismissed_forever) {
      setDismissed(true);
      return;
    }

    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    // Se já passou o período de treinamento (7 dias) e já viu o guia, oculta o mentor
    const isTrainingOver = mentorData.started_at && (now - mentorData.started_at > SEVEN_DAYS);
    if (isTrainingOver && mentorData.has_seen_initial_guide) {
      setDismissed(true);
      return;
    }

    if (!mentorData.has_seen_initial_guide) {
      // Primeira vez: inicia contador e abre guia
      writeState({
        started_at: mentorData.started_at || now,
        has_seen_initial_guide: false,
      });
      setTimeout(() => setIsOpen(true), 2500);
    }
    // Após ver o guia inicial: NÃO reabre sozinho. Usuário decide quando consultar.
  }, [profile?.user_id]);

  const handleClose = () => {
    writeState({ has_seen_initial_guide: true });
    setIsOpen(false);
  };

  const handleDismissForever = () => {
    writeState({ has_seen_initial_guide: true, dismissed_forever: true });
    setIsOpen(false);
    setDismissed(true);
  };

  const nextStep = () => {
    if (stepIndex < GENERAL_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setShowHouseGuide(true);
    }
  };

  const prevStep = () => {
    if (showHouseGuide) {
      setShowHouseGuide(false);
    } else {
      setStepIndex(Math.max(0, stepIndex - 1));
    }
  };

  const currentStep = GENERAL_STEPS[stepIndex];

  if (dismissed) return null;

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-primary via-amber-600 to-primary-foreground shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center text-white border-2 border-primary/50 group"
      >
        <BookOpen className="w-6 h-6 group-hover:animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] items-center justify-center font-bold">!</span>
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-card overflow-hidden border-primary/30 shadow-[0_0_50px_rgba(212,175,55,0.2)]"
            >
              {/* Header with House Colors */}
              <div className={`h-2 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50`} />
              
              <div className="p-6 sm:p-8">
                <button 
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 text-foreground/40 hover:text-primary transition-colors"
                >
                  <X size={20} />
                </button>

                {!showHouseGuide ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                        {currentStep.icon}
                      </div>
                      <div>
                        <h2 className="font-heading text-2xl text-gold-gradient leading-tight">{currentStep.title}</h2>
                        <p className="text-[10px] font-heading uppercase tracking-widest text-primary/60">Guia de Iniciação • {stepIndex + 1}/{GENERAL_STEPS.length}</p>
                      </div>
                    </div>

                    <div className="space-y-4 min-h-[120px]">
                      <p className="text-foreground/80 leading-relaxed font-serif">
                        {currentStep.description}
                      </p>
                      
                      {currentStep.tip && (
                        <div className="flex gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <Lightbulb className="w-5 h-5 text-primary shrink-0" />
                          <p className="text-xs text-primary/80 italic">"{currentStep.tip}"</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={prevStep}
                        disabled={stepIndex === 0}
                        className="font-heading text-xs uppercase tracking-tighter"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                      </Button>
                      
                      <div className="flex gap-2">
                        {currentStep.path && (
                          <Link to={currentStep.path} onClick={handleClose}>
                            <Button variant="outline" size="sm" className="font-heading text-xs uppercase tracking-tighter border-primary/30 text-primary hover:bg-primary/10">
                              {currentStep.actionLabel}
                            </Button>
                          </Link>
                        )}
                        <Button 
                          variant="magical" 
                          size="sm" 
                          onClick={nextStep}
                          className="font-heading text-xs uppercase tracking-tighter"
                        >
                          {stepIndex === GENERAL_STEPS.length - 1 ? "Ver Guia da Casa" : "Próximo"} <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-primary/10">
                      <button
                        onClick={handleDismissForever}
                        className="w-full text-[10px] font-heading uppercase tracking-widest text-foreground/40 hover:text-primary/80 transition-colors py-1 flex items-center justify-center gap-1.5"
                        title="O mentor não aparecerá mais. Você sempre pode reativá-lo limpando os dados do navegador."
                      >
                        <ScrollText className="w-3 h-3" />
                        Juro solenemente que já sei o caminho
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center space-y-4">
                      <div className="inline-block relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 4 }}
                        >
                          <HouseCrest house={houseId} size="lg" />
                        </motion.div>
                      </div>

                      
                      <h2 className="font-heading text-3xl text-gold-gradient">{house.name}</h2>
                      <p className="text-sm font-serif italic text-muted-foreground">"{house.motto}"</p>
                    </div>

                    <div className="space-y-4 bg-background/40 p-5 rounded-2xl border border-primary/20">
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {houseGuide.intro}
                      </p>
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                      <p className="text-sm leading-relaxed font-bold text-primary">
                        {houseGuide.goal}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button 
                        variant="magical" 
                        className="w-full font-heading"
                        onClick={handleDismissForever}
                      >
                        Malfeito, Feito! Entrar no Castelo
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs opacity-60"
                        onClick={prevStep}
                      >
                        Voltar ao guia geral
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
