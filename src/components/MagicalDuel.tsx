import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Swords, Shield, Zap, Flame, Snowflake, Sparkles } from "lucide-react";
import { toast } from "sonner";
import SafeImage from "./SafeImage";

const SPELLS = [
  { name: "Expelliarmus", type: "attack", power: 20, cost: 10, icon: <Zap /> },
  { name: "Stupefy", type: "attack", power: 15, cost: 5, icon: <Flame /> },
  { name: "Protego", type: "defense", power: 10, cost: 5, icon: <Shield /> },
  { name: "Glacius", type: "attack", power: 10, cost: 5, icon: <Snowflake /> },
];

export default function MagicalDuel({ opponent, playerStats, onFinish }: { 
    opponent: any; 
    playerStats: { atk: number; def: number; hp: number; mana: number };
    onFinish: (winner: boolean) => void 
}) {
  const [playerHP, setPlayerHP] = useState(playerStats.hp);
  const [opponentHP, setOpponentHP] = useState(100);
  const [playerMana, setPlayerMana] = useState(playerStats.mana);
  const [turn, setTurn] = useState<"player" | "opponent">("player");
  const [log, setLog] = useState<string[]>(["O duelo começou! 🪄"]);
  
  const [isShaking, setIsShaking] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const triggerEffect = (color: string) => {
    setIsShaking(true);
    setFlash(color);
    setTimeout(() => { setIsShaking(false); setFlash(null); }, 300);
  };

  const handleSpell = (spell: typeof SPELLS[0]) => {
    if (turn !== "player" || playerMana < spell.cost) return;

    setPlayerMana(prev => prev - spell.cost);
    triggerEffect("rgba(var(--primary-rgb), 0.2)");
    
    if (spell.type === "attack") {
        const damage = Math.floor(spell.power * (1 + (playerStats.atk / 50)));
        setOpponentHP(prev => Math.max(0, prev - damage));
        setLog(prev => [`Você lançou ${spell.name}! (-${damage} HP no oponente)`, ...prev]);
    } else {
        const heal = Math.floor(spell.power * (1 + (playerStats.def / 50)));
        setPlayerHP(prev => Math.min(playerStats.hp, prev + heal));
        setLog(prev => [`Você usou ${spell.name}! (+${heal} HP)`, ...prev]);
    }

    setTurn("opponent");
  };

  useEffect(() => {
    if (turn === "opponent" && opponentHP > 0) {
        setTimeout(() => {
            const spell = SPELLS[Math.floor(Math.random() * SPELLS.length)];
            if (spell.type === "attack") {
                const damage = Math.max(5, Math.floor(spell.power * (1 - (playerStats.def / 100))));
                triggerEffect("rgba(239, 68, 68, 0.3)");
                setPlayerHP(prev => Math.max(0, prev - damage));
                setLog(prev => [`${opponent.name} lançou ${spell.name}! (-${damage} HP)`, ...prev]);
            } else {
                setOpponentHP(prev => Math.min(100, prev + spell.power));
                setLog(prev => [`${opponent.name} usou ${spell.name}! (+${spell.power} HP)`, ...prev]);
            }
            setTurn("player");
        }, 1500);
    }
  }, [turn, opponentHP, opponent.name, playerStats.def]);

  useEffect(() => {
    if (opponentHP <= 0) {
        toast.success("Vitória! Você venceu o duelo.");
        onFinish(true);
    } else if (playerHP <= 0) {
        toast.error("Derrota... Você foi desarmado.");
        onFinish(false);
    }
  }, [opponentHP, playerHP, onFinish]);

  return (
    <div className={`glass rounded-[3rem] p-8 border border-primary/30 w-full max-w-4xl mx-auto overflow-hidden transition-all duration-300 ${isShaking ? "animate-shake" : ""}`}
         style={{ backgroundColor: flash || "transparent" }}>
        <div className="flex justify-between items-center mb-10">
            {/* Player */}
            <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto border-2 border-primary overflow-hidden">
                    <SafeImage src={null} fallbackEmoji="🧙‍♂️" />
                </div>
                <h4 className="font-heading">Você</h4>
                <div className="w-32 h-3 bg-secondary rounded-full overflow-hidden border border-border">
                    <div className="h-full bg-red-500 transition-all" style={{ width: `${(playerHP / playerStats.hp) * 100}%` }} />
                </div>
                <div className="flex gap-1 justify-center">
                    {[...Array(Math.max(0, Math.floor(playerMana/10)))].map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    ))}
                </div>
            </div>

            <div className="text-4xl animate-pulse text-primary font-heading">VS</div>

            {/* Opponent */}
            <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-destructive/20 rounded-full mx-auto border-2 border-destructive overflow-hidden">
                    <SafeImage src={opponent.avatar_url} fallbackEmoji="👹" />
                </div>
                <h4 className="font-heading">{opponent.name}</h4>
                <div className="w-32 h-3 bg-secondary rounded-full overflow-y-hidden border border-border">
                    <div className="h-full bg-red-500 transition-all" style={{ width: `${opponentHP}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">Adversário</div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Spells */}
            <div className="space-y-4">
                <p className="text-xs font-heading text-primary uppercase tracking-widest">Sua Vez de Atacar:</p>
                <div className="grid grid-cols-2 gap-3">
                    {SPELLS.map((spell) => (
                        <Button 
                            key={spell.name} 
                            variant="outline" 
                            disabled={turn !== "player" || playerMana < spell.cost}
                            onClick={() => handleSpell(spell)}
                            className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-primary transition-all"
                        >
                            <span className="text-primary">{spell.icon}</span>
                            <span className="text-[10px] font-heading">{spell.name}</span>
                            <span className="text-[8px] opacity-50">{spell.cost} Mana</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Duel Log */}
            <div className="bg-black/40 rounded-3xl p-6 border border-white/5 h-48 overflow-y-auto font-mono text-[11px] space-y-2">
                {log.map((line, i) => (
                    <p key={i} className={line.includes("Você") ? "text-primary" : "text-destructive"}>
                        {line}
                    </p>
                ))}
            </div>
        </div>

        <style>{`
            @keyframes shake {
                0% { transform: translate(1px, 1px) rotate(0deg); }
                10% { transform: translate(-1px, -2px) rotate(-1deg); }
                20% { transform: translate(-3px, 0px) rotate(1deg); }
                30% { transform: translate(3px, 2px) rotate(0deg); }
                40% { transform: translate(1px, -1px) rotate(1deg); }
                50% { transform: translate(-1px, 2px) rotate(-1deg); }
                60% { transform: translate(-3px, 1px) rotate(0deg); }
                70% { transform: translate(3px, 1px) rotate(-1deg); }
                80% { transform: translate(-1px, -1px) rotate(1deg); }
                90% { transform: translate(1px, 2px) rotate(0deg); }
                100% { transform: translate(1px, -2px) rotate(-1deg); }
            }
            .animate-shake {
                animation: shake 0.3s;
            }
        `}</style>
    </div>
  );
}
