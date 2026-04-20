import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Swords, Trophy, Users, Timer, Sparkles, Star, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import SafeImage from "./SafeImage";
import MagicalDuel from "./MagicalDuel";

export default function MagicalTournaments() {
  const { user, profile } = useAuth();
  const [activeTournament, setActiveTournament] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showDuel, setShowDuel] = useState(false);
  const [playerStats, setPlayerStats] = useState({ atk: 10, def: 10, hp: 100, mana: 50 });

  useEffect(() => {
    // Mock de Torneio Ativo (Estilo LOL)
    setActiveTournament({
        id: "winter_saga_2024",
        title: "A Saga do Inverno: Torneio dos Três Bruxos",
        description: "Inscrições abertas para a primeira fase. Apenas os 16 bruxos com maior poder de combate avançarão para as quartas de final.",
        prize_pool: "5.000 Galeões + Badge Lendário",
        starts_in: "2d 14h",
        min_level: 5,
        fee: 50,
        participants: 12,
        max_participants: 32
    });

    if (user) checkRegistration();
  }, [user]);

  const checkRegistration = async () => {
    const { data } = await supabase.from("user_challenges").select("*").eq("user_id", user?.id).eq("challenge_id", "winter_saga_2024").single();
    if (data) setIsRegistered(true);

    // Calcular Atributos Reais (Base + Itens Equipados)
    const { data: equipped } = await supabase.from("user_items").select("store_items(*)").eq("user_id", user?.id).eq("is_equipped", true);
    
    let bonusAtk = 0, bonusDef = 0, bonusHP = 0, bonusMana = 0;
    (equipped || []).forEach((e: any) => {
        const s = e.store_items?.stats;
        if (s) {
            bonusAtk += s.atk || 0;
            bonusDef += s.def || 0;
            bonusHP += s.hp || 0;
            bonusMana += s.mana || 0;
        }
    });

    setPlayerStats({
        atk: 10 + bonusAtk,
        def: 10 + bonusDef,
        hp: 100 + bonusHP,
        mana: 50 + bonusMana
    });
  };

  const register = async () => {
    if ((profile as any).galeons < activeTournament.fee) return toast.error("Galeões insuficientes para a inscrição!");
    
    const { error } = await supabase.from("user_challenges").insert({
        user_id: user?.id,
        challenge_id: activeTournament.id,
        status: "completed" // Registrado
    } as never);

    if (!error) {
        await supabase.rpc("award_galeons", { _user_id: user?.id, _amount: -activeTournament.fee, _reason: "tournament_reg" });
        setIsRegistered(true);
        toast.success("✨ Inscrição confirmada! Prepare seus feitiços.");
    }
  };

  if (showDuel) {
    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => setShowDuel(false)}>← Voltar para a Saga</Button>
            <MagicalDuel 
                opponent={{ name: "Draco Malfoy (Elite)", avatar_url: "https://i.pinimg.com/originals/94/d6/3b/94d63b05423f1011867c293675e4683c.jpg" }} 
                onFinish={(won) => {
                    setShowDuel(false);
                    if (won) toast.success("Você avançou para a próxima fase!");
                }} 
            />
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-purple-950 via-background to-black border border-purple-500/30 p-12">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000')] opacity-10 mix-blend-overlay" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="w-40 h-40 bg-purple-500/20 rounded-full flex items-center justify-center animate-pulse-glow shrink-0 border border-purple-500/40">
                    <Trophy size={80} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                </div>
                <div className="space-y-4 text-center md:text-left">
                    <Badge variant="magical" className="bg-purple-500/20 text-purple-300 border-purple-500/30">Temporada 2024 • Saga I</Badge>
                    <h1 className="text-5xl font-heading text-white">{activeTournament?.title}</h1>
                    <p className="text-muted-foreground max-w-xl">{activeTournament?.description}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status do Personagem */}
            <div className="lg:col-span-1 space-y-6">
                <div className="glass rounded-[2.5rem] p-8 border border-primary/20 bg-primary/5">
                    <h3 className="font-heading text-xl mb-6 flex items-center gap-2">
                        <Sparkles className="text-primary" size={20} /> Seu Poder
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-xs text-muted-foreground uppercase flex items-center gap-2"><Swords size={14} className="text-red-400" /> Ataque</span>
                            <span className="font-heading text-lg text-red-400">{playerStats.atk}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-xs text-muted-foreground uppercase flex items-center gap-2"><Shield size={14} className="text-blue-400" /> Defesa</span>
                            <span className="font-heading text-lg text-blue-400">{playerStats.def}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-xs text-muted-foreground uppercase flex items-center gap-2"><Flame size={14} className="text-green-400" /> Vida (HP)</span>
                            <span className="font-heading text-lg text-green-400">{playerStats.hp}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-xs text-muted-foreground uppercase flex items-center gap-2"><Zap size={14} className="text-indigo-400" /> Mana</span>
                            <span className="font-heading text-lg text-indigo-400">{playerStats.mana}</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-6 text-center italic">
                        "Equipe varinhas, poções e acessórios na sua aba de Inventário para aumentar seus atributos."
                    </p>
                </div>
            </div>

            {/* Info do Torneio */}
            <div className="lg:col-span-2 space-y-8">
                <div className="glass rounded-[2.5rem] p-10 border border-purple-500/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Prêmio Total</p>
                            <p className="font-heading text-yellow-400">🪙 5.000</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Participantes</p>
                            <p className="font-heading text-white">{activeTournament?.participants}/{activeTournament?.max_participants}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Início em</p>
                            <p className="font-heading text-primary">{activeTournament?.starts_in}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Custo Inscrição</p>
                            <p className="font-heading text-yellow-500">🪙 {activeTournament?.fee}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {!isRegistered ? (
                            <Button variant="magical" className="w-full py-8 text-xl rounded-2xl shadow-xl" onClick={register}>
                                Inscrever-se na Saga ✨
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
                                    <p className="text-green-500 font-bold flex items-center justify-center gap-2">
                                        <Star size={18} /> INSCRIÇÃO ATIVA
                                    </p>
                                    <p className="text-xs text-green-500/70">Você está pronto para a batalha. Aguarde a convocação.</p>
                                </div>
                                <Button variant="outline" className="w-full py-8 text-xl rounded-2xl border-purple-500/30 hover:bg-purple-500/10 text-purple-300" onClick={() => setShowDuel(true)}>
                                    Treinar Duelo (Modo Simulação) ⚔️
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Brackets (Visual Mock) */}
                <div className="space-y-4">
                    <h3 className="font-heading text-xl flex items-center gap-2"><Users size={20} /> Chaveamento do Torneio</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass min-w-[250px] p-4 rounded-2xl border border-white/10 space-y-3">
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b border-white/5 pb-2">
                                    <span>Partida #{i}</span>
                                    <span className="text-primary font-bold">LIVE</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-heading">Bruxo_{i}92</span>
                                        <span className="text-xs text-green-500">2</span>
                                    </div>
                                    <div className="flex items-center justify-between opacity-50">
                                        <span className="text-sm font-heading">Oponente_{i}</span>
                                        <span className="text-xs">0</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
