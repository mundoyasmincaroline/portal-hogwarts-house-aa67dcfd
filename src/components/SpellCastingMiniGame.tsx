import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, X, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  spellName?: string | null;
  incantation?: string | null;
  onClose: () => void;
  onComplete: (mastery: number) => void;
}

/**
 * Mini-game de traçado rúnico: o jogador deve "varrer" a varinha
 * por pontos mágicos (runes) na ordem correta dentro do tempo.
 * A maestria (1-5) é calculada pela % de runes atingidas.
 */
export default function SpellCastingMiniGame({ open, spellName, incantation, onClose, onComplete }: Props) {
  const RUNE_COUNT = 6;
  const TIME_LIMIT = 8; // segundos

  const [runes, setRunes] = useState<{ x: number; y: number; hit: boolean }[]>([]);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [phase, setPhase] = useState<"ready" | "casting" | "done">("ready");
  const [resultMastery, setResultMastery] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<number | null>(null);

  // Gera runes em posições aleatórias
  useEffect(() => {
    if (!open) return;
    const generated = Array.from({ length: RUNE_COUNT }, () => ({
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
      hit: false,
    }));
    setRunes(generated);
    setProgress(0);
    setTimeLeft(TIME_LIMIT);
    setPhase("ready");
    setResultMastery(0);
  }, [open]);

  // Timer da fase de casting
  useEffect(() => {
    if (phase !== "casting") return;
    tickRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) {
          finish();
          return 0;
        }
        return +(t - 0.1).toFixed(1);
      });
    }, 100);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const finish = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    const hits = runes.filter((r) => r.hit).length;
    const pct = hits / RUNE_COUNT;
    const mastery = pct >= 0.95 ? 5 : pct >= 0.8 ? 4 : pct >= 0.6 ? 3 : pct >= 0.4 ? 2 : 1;
    setResultMastery(mastery);
    setPhase("done");
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (phase !== "casting") return;
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    let hitCount = 0;
    const updated = runes.map((r) => {
      const dx = r.x - px;
      const dy = r.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hit = r.hit || dist < 7;
      if (hit) hitCount++;
      return { ...r, hit };
    });
    setRunes(updated);
    setProgress(Math.round((hitCount / RUNE_COUNT) * 100));
    if (hitCount === RUNE_COUNT) finish();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl glass rounded-3xl border border-primary/40 p-6 sm:p-8 shadow-[0_0_80px_rgba(212,175,55,0.3)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1 mb-3">
            <Wand2 className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-heading uppercase tracking-widest text-primary">Feitiço</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl text-gold-gradient">{spellName ?? "Praticar Feitiço"}</h2>
          {incantation && (
            <p className="font-serif italic text-primary/80 mt-1 text-sm sm:text-base">"{incantation}"</p>
          )}
        </div>

        {phase === "ready" && (
          <div className="text-center py-8 space-y-4">
            <p className="font-serif text-white/80 leading-relaxed">
              Arraste a varinha por <span className="text-primary font-bold">todos os pontos mágicos</span> antes do tempo
              acabar. Quanto mais runes você tocar, maior sua <span className="text-primary font-bold">maestria</span>.
            </p>
            <Button variant="magical" size="lg" onClick={() => setPhase("casting")}>
              Empunhar Varinha ✦
            </Button>
          </div>
        )}

        {phase === "casting" && (
          <>
            <div className="flex justify-between items-center mb-2 text-xs font-mono text-white/60">
              <span>{progress}% concluído</span>
              <span className={timeLeft < 3 ? "text-red-400 animate-pulse" : "text-primary"}>
                {timeLeft.toFixed(1)}s
              </span>
            </div>
            <div
              ref={boardRef}
              onPointerMove={handlePointerMove}
              className="relative aspect-[16/10] w-full rounded-2xl bg-gradient-to-br from-indigo-950/80 via-black to-amber-950/40 border border-primary/30 cursor-crosshair overflow-hidden touch-none"
              style={{ touchAction: "none" }}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none" />
              {runes.map((r, i) => (
                <div
                  key={i}
                  className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-base font-heading transition-all duration-300 pointer-events-none ${
                    r.hit
                      ? "bg-primary text-black scale-125 shadow-[0_0_25px_rgba(212,175,55,0.9)]"
                      : "bg-white/10 text-white/80 border border-white/30 animate-pulse"
                  }`}
                  style={{ left: `${r.x}%`, top: `${r.y}%` }}
                >
                  {r.hit ? "✦" : "✧"}
                </div>
              ))}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-white/40 pointer-events-none">
                mova a varinha
              </div>
            </div>
          </>
        )}

        {phase === "done" && (
          <div className="text-center py-6 space-y-4">
            <div className="text-6xl animate-float">
              {resultMastery >= 4 ? "✨" : resultMastery >= 2 ? "⭐" : "💫"}
            </div>
            <div>
              <p className="font-heading text-2xl text-gold-gradient">
                Maestria {resultMastery}/5
              </p>
              <p className="text-sm text-muted-foreground font-serif italic mt-1">
                {resultMastery === 5 && "Lançamento perfeito — Madame Hooch ficaria orgulhosa."}
                {resultMastery === 4 && "Excelente! Seu feitiço sai forte e estável."}
                {resultMastery === 3 && "Bom trabalho. A magia respondeu ao seu chamado."}
                {resultMastery === 2 && "Razoável. Continue praticando."}
                {resultMastery === 1 && "Mal acertou as runes — mais foco da próxima vez!"}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest font-heading">
                Recompensas multiplicadas por {resultMastery}
              </span>
            </div>
            <Button variant="magical" size="lg" onClick={() => onComplete(resultMastery)}>
              Reivindicar Recompensas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}