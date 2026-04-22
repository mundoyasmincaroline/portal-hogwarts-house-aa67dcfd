import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Swords, Trophy, Zap, Shield, Flame, Ghost, Lock, Coins } from "lucide-react";
import { toast } from "sonner";
import MagicalGaleon from "@/components/MagicalGaleon";
import MagicalIcon from "@/components/MagicalIcon";

type GameState = "menu" | "playing" | "result";
type Move = "spell" | "defend" | "curse";

export default function MagicalGames() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [opponentMove, setOpponentMove] = useState<Move | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [playerHP, setPlayerHP] = useState(100);
  const [opponentHP, setOpponentHP] = useState(100);

  const moves: { id: Move; label: string; icon: any; color: string; strength: string }[] = [
    { id: "spell",  label: "Expelliarmus", icon: Zap,    color: "bg-blue-500",   strength: "Vence Maldição" },
    { id: "defend", label: "Protego",      icon: Shield, color: "bg-green-500",  strength: "Vence Feitiço" },
    { id: "curse",  label: "Sectumsempra", icon: Flame,  color: "bg-red-500",    strength: "Vence Defesa" },
  ];

  const handlePlay = (move: Move) => {
    const oppMove = moves[Math.floor(Math.random() * moves.length)].id;
    setPlayerMove(move);
    setOpponentMove(oppMove);

    let res: "win" | "lose" | "draw" = "draw";
    if (move === oppMove) res = "draw";
    else if (
      (move === "spell" && oppMove === "curse") ||
      (move === "defend" && oppMove === "spell") ||
      (move === "curse" && oppMove === "defend")
    ) {
      res = "win";
      setOpponentHP(prev => Math.max(0, prev - 25));
    } else {
      res = "lose";
      setPlayerHP(prev => Math.max(0, prev - 25));
    }

    setResult(res);
    setGameState("result");
    
    if (res === "win") toast.success("✨ Feitiço certeiro! Você venceu o turno.");
    if (res === "lose") toast.error("🌑 O oponente foi mais rápido...");
  };

  const resetGame = () => {
    setGameState("menu");
    setPlayerHP(100);
    setOpponentHP(100);
    setResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
      {/* ── HEADER ── */}
      <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-10 duration-1000">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-2">
          <Swords size={16} className="text-primary" />
          <span className="text-[10px] font-heading text-primary uppercase tracking-[0.2em] font-bold">Arena de Jogos Mágicos</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-heading text-gold-gradient tracking-tighter">O Grande Salão</h1>
        <p className="text-muted-foreground font-serif italic text-lg max-w-2xl mx-auto">
          "Prove sua habilidade em duelos lendários e jogos de inteligência para ganhar galeões e prestígio."
        </p>
      </div>

      {/* ── GAME SELECTION ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* GAME 1: DUELO DE FEITIÇOS */}
        <Card className="glass rounded-[3rem] p-1 border-white/10 overflow-hidden group hover:border-primary/40 transition-all duration-500 shadow-2xl hover:shadow-primary/20">
          <div className="relative h-64 bg-[url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute top-6 right-6 bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">GRATUITO</div>
            <div className="absolute bottom-6 left-8">
               <h3 className="text-3xl font-heading text-white">Duelo de Feitiços</h3>
               <p className="text-xs text-white/60 font-serif italic">Teste seus reflexos mágicos</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500" /> +50 XP</span>
              <span className="flex items-center gap-1.5"><MagicalGaleon size="xs" /> +5 Galeões</span>
            </div>
            
            {gameState === "menu" ? (
              <Button onClick={() => setGameState("playing")} variant="magical" className="w-full h-14 rounded-2xl text-lg group-hover:scale-105 transition-transform">
                DESAFIAR OPONENTE <Swords className="ml-2" />
              </Button>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Health Bars */}
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-blue-400"><span>VOCÊ</span> <span>{playerHP}%</span></div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${playerHP}%` }} /></div>
                  </div>
                  <div className="text-xl font-heading text-white/20 italic">VS</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-red-400"><span>BRUXO DAS SOMBRAS</span> <span>{opponentHP}%</span></div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${opponentHP}%` }} /></div>
                  </div>
                </div>

                {gameState === "playing" ? (
                  <div className="grid grid-cols-3 gap-3">
                    {moves.map(m => (
                      <button 
                        key={m.id} 
                        onClick={() => handlePlay(m.id)}
                        className="glass bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-primary/20 hover:border-primary/40 transition-all group/move active:scale-90"
                      >
                        <m.icon size={24} className="text-primary group-hover/move:animate-bounce" />
                        <span className="text-[8px] font-bold uppercase tracking-tight text-white/80">{m.label}</span>
                        <span className="text-[6px] text-white/30 uppercase">{m.strength}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="glass bg-white/5 p-6 rounded-3xl border-2 border-primary/30 animate-pulse-glow">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Turno encerrado</p>
                      <div className="flex justify-center items-center gap-10">
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] mb-2 opacity-50">VOCÊ</span>
                          {playerMove && <MagicalIcon icon={moves.find(m => m.id === playerMove)!.icon} size="sm" />}
                        </div>
                        <div className="text-2xl font-heading text-primary">
                          {result === "win" ? "VITÓRIA!" : result === "lose" ? "DERROTA" : "EMPATE"}
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] mb-2 opacity-50">OPONENTE</span>
                          {opponentMove && <MagicalIcon icon={moves.find(m => m.id === opponentMove)!.icon} size="sm" />}
                        </div>
                      </div>
                    </div>
                    
                    {(playerHP <= 0 || opponentHP <= 0) ? (
                      <div className="space-y-4">
                        <h4 className="text-xl font-heading text-gold-gradient">
                          {playerHP > 0 ? "O GRANDE CAMPEÃO!" : "DERROTADO EM COMBATE"}
                        </h4>
                        <Button onClick={resetGame} variant="outline" className="w-full h-12 rounded-xl">SAIR DO SALÃO</Button>
                      </div>
                    ) : (
                      <Button onClick={() => setGameState("playing")} variant="magical" className="w-full h-12 rounded-xl">PRÓXIMO TURNO</Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* GAME 2: ADIVINHAÇÃO (BLOQUEADO/VIP) */}
        <Card className="glass rounded-[3rem] p-1 border-white/10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-8 text-center">
             <div className="w-20 h-20 bg-purple-500/20 rounded-3xl flex items-center justify-center border border-purple-500/30 shadow-inner mb-6 animate-float">
                <Lock size={32} className="text-purple-400" />
             </div>
             <h3 className="text-2xl font-heading text-white mb-2">Adivinhação Proibida</h3>
             <p className="text-xs text-white/50 font-serif italic mb-6">"Preveja o futuro e ganhe prêmios lendários. Requer nível 10 ou VIP Founders."</p>
             <Button variant="outline" className="glass border-purple-500/30 text-purple-400 gap-2 h-12 rounded-xl">
               <Crown size={14} /> TORNE-SE VIP
             </Button>
          </div>
          <div className="h-64 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800')] bg-cover bg-center" />
          <div className="p-8 opacity-20">
             <h3 className="text-3xl font-heading text-white">Cartas do Destino</h3>
             <div className="mt-4 flex items-center gap-2">
                <MagicalGaleon size="xs" /> <span className="text-sm font-bold">20 GALEÕES / JOGO</span>
             </div>
          </div>
        </Card>

        {/* GAME 3: QUIZ DE HISTÓRIA MÁGICA (EM BREVE) */}
        <Card className="glass rounded-[3rem] p-8 border-white/10 border-dashed flex flex-col items-center justify-center text-center space-y-6 opacity-60">
           <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <Ghost size={32} className="text-white/20" />
           </div>
           <div>
              <h3 className="text-2xl font-heading text-white/40 tracking-tight">Copa de Quadribol</h3>
              <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Módulo em Desenvolvimento</p>
           </div>
           <p className="text-xs text-white/30 font-serif italic italic italic">
             "O Professor Binns está preparando as questões mais difíceis de Hogwarts."
           </p>
        </Card>

      </div>
    </div>
  );
}
