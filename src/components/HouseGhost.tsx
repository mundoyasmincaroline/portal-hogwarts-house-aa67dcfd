import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { X } from "lucide-react";
import { cn } from "@/lib/core-utils";

type GhostData = {
  emoji: string;
  name: string;
  tips: string[];
};

const GHOSTS: Record<string, GhostData> = {
  gryffindor: {
    emoji: "🦁",
    name: "Sir Nicholas",
    tips: [
      "Coragem, jovem leão! Faça check-in diário para aumentar sua sequência.",
      "Desafios diários valem XP extra — não tenha medo de tentar.",
      "A Torre da Grifinória honra quem participa do Feed com regularidade.",
    ],
  },
  slytherin: {
    emoji: "🐍",
    name: "Barão Sangrento",
    tips: [
      "Ambicioso... acumule Galeões na Loja de Gringotes.",
      "Duelos rendem prestígio. Estude bem seus feitiços antes.",
      "Sequências longas valem recompensas raras. Não as quebre.",
    ],
  },
  ravenclaw: {
    emoji: "🦅",
    name: "Dama Cinzenta",
    tips: [
      "Sabedoria começa nas aulas canônicas. Participe.",
      "Cada figurinha colecionada conta uma história.",
      "Leia o Profeta Diário no Feed antes de duelar.",
    ],
  },
  hufflepuff: {
    emoji: "🦡",
    name: "Frei Gorducho",
    tips: [
      "Lealdade vem com a presença. Mantenha sua sequência viva!",
      "Faça amigos no Chat — todos somos uma família.",
      "Compartilhe figurinhas duplicadas. Bondade rende karma.",
    ],
  },
};

const SEEN_KEY = "house-ghost-dismissed-v1";
const ROTATE_KEY = "house-ghost-tip-idx";

/**
 * Fantasma guia da casa — companheiro contextual no canto do dashboard.
 * Aparece após 8s, rotaciona dicas, pode ser dispensado por sessão.
 */
export default function HouseGhost() {
  const { profile } = useAuth();
  const [visible, setVisible] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    if (!profile?.house) return;
    if (sessionStorage.getItem(SEEN_KEY)) return;
    const t = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(t);
  }, [profile?.house]);

  useEffect(() => {
    const saved = Number(localStorage.getItem(ROTATE_KEY) || "0");
    setTipIdx(saved);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  };

  const nextTip = () => {
    const next = (tipIdx + 1) % 3;
    setTipIdx(next);
    localStorage.setItem(ROTATE_KEY, String(next));
  };

  if (!visible || !profile?.house) return null;
  const ghost = GHOSTS[profile.house];
  if (!ghost) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 max-w-xs",
        "animate-fade-in"
      )}
    >
      <div className="relative glass border border-primary/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <button
          onClick={dismiss}
          aria-label="Dispensar fantasma"
          className="absolute top-2 right-2 text-foreground/50 hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>
        <div className="flex items-start gap-3">
          <div className="text-4xl animate-float drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] opacity-90">
            {ghost.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-sm text-gold-gradient mb-1">
              {ghost.name}
            </p>
            <p className="text-xs text-foreground/85 leading-relaxed italic">
              "{ghost.tips[tipIdx]}"
            </p>
            <button
              onClick={nextTip}
              className="text-[10px] uppercase tracking-widest text-primary/80 hover:text-primary mt-2 transition-colors"
            >
              Outro conselho →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}