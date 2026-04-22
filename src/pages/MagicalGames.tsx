import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Swords, Trophy, Zap, Shield, Flame, Ghost, Lock, Coins, Crown, Eye, Heart, Moon, Sun, Star } from "lucide-react";
import { toast } from "sonner";
import MagicalGaleon from "@/components/MagicalGaleon";
import MagicalIcon from "@/components/MagicalIcon";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type GameState = "menu" | "playing" | "result" | "divination";
type Move = "spell" | "defend" | "curse";

interface CardType {
  id: string;
  name: string;
  icon: any;
  color: string;
  prediction: string;
  reward?: { galeons?: number; xp?: number; item_id?: string };
}

const DIVINATION_CARDS: CardType[] = [
  { id: "moon", name: "A Lua", icon: Moon, color: "text-indigo-400", prediction: "Segredos serão revelados na calada da noite.", reward: { xp: 100 } },
  { id: "sun", name: "O Sol", icon: Sun, color: "text-yellow-400", prediction: "Sua glória brilhará no Grande Salão.", reward: { galeons: 50 } },
  { id: "star", name: "A Estrela", icon: Star, color: "text-blue-400", prediction: "A sorte guiará sua varinha hoje.", reward: { galeons: 100 } },
  { id: "eye", name: "O Olho", icon: Eye, color: "text-purple-400", prediction: "Você vê além do véu da realidade.", reward: { xp: 250 } },
  { id: "heart", name: "O Coração", icon: Heart, color: "text-red-400", prediction: "Amizades antigas trarão novos poderes.", reward: { galeons: 20 } },
];

export default function MagicalGames() {
  const { profile, user } = useAuth();
  const [gameState, setGameState] = useState<GameState>("menu");
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [opponentMove, setOpponentMove] = useState<Move | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [playerHP, setPlayerHP] = useState(100);
  const [opponentHP, setOpponentHP] = useState(100);

  // Divination State
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [divinationRevealed, setDivinationRevealed] = useState(false);
  const [loadingDivination, setLoadingDivination] = useState(false);

  const isFounder = profile?.vip_plan === "founder";
  const isVip = profile?.vip_plan === "vip";
  const canPlayDivination = isFounder || isVip || (profile?.level ?? 0) >= 10;

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

  const handleDivination = async (card: CardType) => {
    if (!user || !profile) return;
    if (profile.galeons < 20) return toast.error("Galeões insuficientes (20 requisitados)");
    
    setLoadingDivination(true);
    setSelectedCard(card);

    // Deduct galeons
    const { error: deductErr } = await supabase.rpc("award_galeons", { 
      _user_id: user.id, 
      _amount: -20, 
      _reason: "divination_play" 
    });

    if (deductErr) {
      toast.error("Erro ao iniciar jogo.");
      setLoadingDivination(false);
      return;
    }

    // Delay for effect
    setTimeout(async () => {
      setDivinationRevealed(true);
      setLoadingDivination(false);

      // Award prizes
      if (card.reward?.galeons) {
        await supabase.rpc("award_galeons", { _user_id: user.id, _amount: card.reward.galeons, _reason: "divination_win" });
        toast.success(`🔮 Destino Próspero! Você ganhou ${card.reward.galeons} Galeões.`);
      }
      if (card.reward?.xp) {
        await supabase.rpc("award_xp_action", { _action: "divination", _user_id: user.id, _xp: card.reward.xp });
        toast.success(`🔮 Conhecimento Oculto! +${card.reward.xp} XP adquirido.`);
      }
    }, 2000);
  };

  const resetGame = () => {
    setGameState("menu");
    setPlayerHP(100);
    setOpponentHP(100);
    setResult(null);
    setSelectedCard(null);
    setDivinationRevealed(false);
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
        <Card className={`glass rounded-[3rem] p-1 border-white/10 overflow-hidden group hover:border-primary/40 transition-all duration-500 shadow-2xl hover:shadow-primary/20 ${gameState === 'divination' ? 'opacity-20 pointer-events-none' : ''}`}>
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
            
            {(gameState === "menu" || gameState === "divination") ? (
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

        {/* GAME 2: ADIVINHAÇÃO (VIP) */}
        <Card className={`glass rounded-[3rem] p-1 border-white/10 overflow-hidden relative group transition-all duration-500 ${gameState === 'playing' || gameState === 'result' ? 'opacity-20 pointer-events-none' : ''}`}>
          {!canPlayDivination && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-8 text-center">
               <div className="w-20 h-20 bg-purple-500/20 rounded-3xl flex items-center justify-center border border-purple-500/30 shadow-inner mb-6 animate-float">
                  <Lock size={32} className="text-purple-400" />
               </div>
               <h3 className="text-2xl font-heading text-white mb-2">Adivinhação Proibida</h3>
               <p className="text-xs text-white/50 font-serif italic mb-6">"Preveja o futuro e ganhe prêmios lendários. Requer nível 10 ou VIP Founders."</p>
               <Button onClick={() => window.location.href = '/dashboard/store?tab=vip'} variant="outline" className="glass border-purple-500/30 text-purple-400 gap-2 h-12 rounded-xl">
                 <Crown size={14} /> TORNE-SE VIP
               </Button>
            </div>
          )}

          <div className="relative h-64 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute top-6 right-6 bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">VIP / LEVEL 10</div>
            <div className="absolute bottom-6 left-8">
               <h3 className="text-3xl font-heading text-white">Cartas do Destino</h3>
               <p className="text-xs text-white/60 font-serif italic">Desvende o véu do amanhã</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><MagicalGaleon size="xs" /> Custo: 20 Galeões</span>
              <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-purple-400" /> Prêmios Raros</span>
            </div>

            {gameState !== "divination" ? (
              <Button onClick={() => setGameState("divination")} variant="magical" className="w-full h-14 rounded-2xl text-lg bg-gradient-to-r from-purple-600 to-indigo-600 border-none shadow-[0_10px_25px_rgba(124,58,237,0.3)]">
                LANÇAR AS CARTAS <Sparkles className="ml-2 animate-pulse" />
              </Button>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                {!selectedCard ? (
                  <div className="grid grid-cols-5 gap-2">
                    {DIVINATION_CARDS.map(card => (
                      <button 
                        key={card.id} 
                        onClick={() => handleDivination(card)}
                        className="glass bg-white/5 border border-white/10 aspect-[2/3] rounded-xl flex items-center justify-center hover:bg-purple-500/20 hover:border-purple-500/40 transition-all group/card active:scale-90"
                      >
                        <Eye size={20} className="text-purple-500/40 group-hover/card:text-purple-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className={`relative glass bg-black/40 border-2 border-purple-500/30 rounded-3xl p-8 overflow-hidden ${loadingDivination ? 'animate-pulse' : ''}`}>
                      {loadingDivination ? (
                        <div className="space-y-4">
                           <Sparkles size={48} className="mx-auto text-purple-400 animate-spin-slow" />
                           <p className="font-heading text-purple-200 tracking-widest uppercase text-xs animate-pulse">Lendo as estrelas...</p>
                        </div>
                      ) : (
                        <div className="animate-in zoom-in duration-700">
                          <selectedCard.icon size={56} className={`mx-auto mb-4 ${selectedCard.color} drop-shadow-[0_0_15px_currentColor]`} />
                          <h4 className="font-heading text-2xl text-white mb-2">{selectedCard.name}</h4>
                          <p className="text-sm text-purple-200/60 font-serif italic mb-6">"{selectedCard.prediction}"</p>
                          <Button onClick={resetGame} variant="outline" className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5">VOLTAR</Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* GAME 3: COPA DE QUADRIBOL (EM BREVE) */}
        <Card className="glass rounded-[3rem] p-8 border-white/10 border-dashed flex flex-col items-center justify-center text-center space-y-6 opacity-60">
           <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <Ghost size={32} className="text-white/20" />
           </div>
           <div>
              <h3 className="text-2xl font-heading text-white/40 tracking-tight">Copa de Quadribol</h3>
              <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Módulo em Desenvolvimento</p>
           </div>
           <p className="text-xs text-white/30 font-serif italic">
             "O Professor Binns está preparando as questões mais difíceis de Hogwarts."
           </p>
        </Card>

      </div>
    </div>
  );
}
