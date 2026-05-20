import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Swords, Shield, Heart, Zap, Sparkles, User, Trophy } from "lucide-react";
import MagicalEmoji from "@/components/MagicalEmoji";
import HouseCrest from "@/components/HouseCrest";
import { motion, AnimatePresence } from "framer-motion";

interface Spell {
  id: string;
  name: string;
  description: string;
  mana_cost: number;
  power: number;
  type: 'damage' | 'heal' | 'shield' | 'debuff' | 'stun';
}

interface Duel {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  challenger_hp: number;
  opponent_hp: number;
  current_turn_user_id: string;
  winner_id: string | null;
}

export default function Duels() {
  const { user, profile } = useAuth();
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null);
  const [userSpells, setUserSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserSpells();
      subscribeToDuels();
      checkActiveDuel();
    }
  }, [user]);

  const loadUserSpells = async () => {
    // In a real scenario, we'd fetch from user_spells joined with spells
    // For now, let's fetch all level 1 spells as "starter" spells
    const { data } = await supabase.from("spells").select("*").lte("required_level", profile?.level || 1);
    setUserSpells(data || []);
  };

  const checkActiveDuel = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("duels")
      .select("*")
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) setActiveDuel(data);
    setLoading(false);
  };

  const subscribeToDuels = () => {
    const channel = supabase
      .channel("active_duels")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duels" },
        (payload) => {
          const updatedDuel = payload.new as Duel;
          if (updatedDuel.challenger_id === user?.id || updatedDuel.opponent_id === user?.id) {
            setActiveDuel(updatedDuel);
            if (updatedDuel.status === 'completed') {
               const win = updatedDuel.winner_id === user?.id;
               toast[win ? 'success' : 'error'](win ? "Vitória! Você venceu o duelo!" : "Derrota! Você foi nocauteado.");
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const findOpponent = async () => {
    setSearching(true);
    // Real logic would search for online users not in duels
    // For this implementation, let's create a simulated duel or look for any other approved profile
    const { data: opponent } = await supabase
      .from("profiles")
      .select("user_id")
      .neq("user_id", user?.id)
      .eq("approved", true)
      .limit(1)
      .maybeSingle();

    if (!opponent) {
      toast.error("Nenhum oponente disponível no momento. Tente novamente em breve!");
      setSearching(false);
      return;
    }

    const { data: newDuel, error } = await supabase
      .from("duels")
      .insert({
        challenger_id: user?.id,
        opponent_id: opponent.user_id,
        status: 'active',
        current_turn_user_id: user?.id,
        challenger_hp: 100,
        opponent_hp: 100
      } as never)
      .select()
      .single();

    if (error) {
      toast.error("Erro ao iniciar duelo.");
    } else {
      setActiveDuel(newDuel);
      toast.success("Duelo iniciado! Prepare sua varinha!");
    }
    setSearching(false);
  };

  const castSpell = async (spell: Spell) => {
    if (!activeDuel || activeDuel.current_turn_user_id !== user?.id) return;

    const isChallenger = activeDuel.challenger_id === user?.id;
    let newOpponentHp = isChallenger ? activeDuel.opponent_hp : activeDuel.challenger_hp;
    let newMyHp = isChallenger ? activeDuel.challenger_hp : activeDuel.opponent_hp;

    if (spell.type === 'damage') {
      newOpponentHp = Math.max(0, newOpponentHp - spell.power);
    } else if (spell.type === 'heal') {
      newMyHp = Math.min(100, newMyHp + spell.power);
    }

    const nextTurnUserId = isChallenger ? activeDuel.opponent_id : activeDuel.challenger_id;
    const isGameOver = newOpponentHp <= 0;

    const updates: any = {
      current_turn_user_id: nextTurnUserId,
      updated_at: new Date().toISOString()
    };

    if (isChallenger) {
      updates.opponent_hp = newOpponentHp;
      updates.challenger_hp = newMyHp;
    } else {
      updates.challenger_hp = newOpponentHp;
      updates.opponent_hp = newMyHp;
    }

    if (isGameOver) {
      updates.status = 'completed';
      updates.winner_id = user?.id;
      // Award XP
      await supabase.rpc("award_xp_action", { _action: "duel_win", _user_id: user?.id, _xp: 50 });
    }

    await supabase.from("duels").update(updates as never).eq("id", activeDuel.id);
    
    // Add to duel_turns
    await supabase.from("duel_turns").insert({
      duel_id: activeDuel.id,
      user_id: user?.id,
      spell_id: spell.id,
      action_type: 'spell',
      damage_dealt: spell.type === 'damage' ? spell.power : 0,
      healing_done: spell.type === 'heal' ? spell.power : 0
    } as never);
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground">Convocando juízes...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 text-center">
        <h1 className="font-heading text-2xl text-gold-gradient mb-2">Clube de Duelos</h1>
        <p className="text-muted-foreground text-sm">Honra, coragem e varinhas em punho</p>
      </div>

      {!activeDuel || activeDuel.status === 'completed' ? (
        <div className="glass rounded-[3rem] p-12 text-center space-y-6 border border-white/5">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <Swords size={40} className="text-primary animate-float" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-2xl">Pronto para o Desafio?</h2>
            <p className="text-muted-foreground max-w-sm mx-auto font-serif italic">
              "Encontre um bruxo à sua altura e dispute pontos para sua casa nos terrenos de Hogwarts."
            </p>
          </div>
          <Button 
            variant="magical" 
            size="lg" 
            onClick={findOpponent} 
            disabled={searching}
            className="px-10 py-6 h-auto text-lg rounded-2xl"
          >
            {searching ? "Procurando Oponente..." : "Buscar Oponente ⚔️"}
          </Button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="grid grid-cols-2 gap-4 md:gap-12 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center font-heading text-xl text-primary shadow-2xl">VS</div>
             </div>

             {/* Challenger */}
             <div className={`glass rounded-3xl p-6 border-2 transition-all ${activeDuel.current_turn_user_id === activeDuel.challenger_id ? 'border-primary shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/5 opacity-80'}`}>
                <div className="flex flex-col items-center gap-4">
                   <div className="relative">
                      <HouseCrest house={profile?.house || 'gryffindor'} size="lg" />
                      {activeDuel.current_turn_user_id === activeDuel.challenger_id && (
                        <div className="absolute -top-2 -right-2 bg-primary text-black p-1 rounded-full animate-bounce">
                           <Zap size={14} />
                        </div>
                      )}
                   </div>
                   <h3 className="font-heading truncate w-full text-center">Você</h3>
                   <div className="w-full space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-red-500">
                         <span>Energia Vital</span>
                         <span>{activeDuel.challenger_hp}%</span>
                      </div>
                      <div className="h-3 bg-black/60 rounded-full overflow-hidden border border-white/5">
                         <motion.div 
                           initial={{ width: '100%' }}
                           animate={{ width: `${activeDuel.challenger_hp}%` }}
                           className="h-full bg-red-600" 
                         />
                      </div>
                   </div>
                </div>
             </div>

             {/* Opponent */}
             <div className={`glass rounded-3xl p-6 border-2 transition-all ${activeDuel.current_turn_user_id === activeDuel.opponent_id ? 'border-primary shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/5 opacity-80'}`}>
                <div className="flex flex-col items-center gap-4">
                   <div className="relative">
                      <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10">
                         <User size={32} className="text-muted-foreground" />
                      </div>
                      {activeDuel.current_turn_user_id === activeDuel.opponent_id && (
                        <div className="absolute -top-2 -right-2 bg-primary text-black p-1 rounded-full animate-bounce">
                           <Zap size={14} />
                        </div>
                      )}
                   </div>
                   <h3 className="font-heading truncate w-full text-center">Oponente</h3>
                   <div className="w-full space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-red-500">
                         <span>Energia Vital</span>
                         <span>{activeDuel.opponent_hp}%</span>
                      </div>
                      <div className="h-3 bg-black/60 rounded-full overflow-hidden border border-white/5">
                         <motion.div 
                           initial={{ width: '100%' }}
                           animate={{ width: `${activeDuel.opponent_hp}%` }}
                           className="h-full bg-red-600" 
                         />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Spell Deck */}
          <div className="glass rounded-[2.5rem] p-8 border border-white/5">
             <div className="flex items-center gap-3 mb-6">
                <Sparkles size={20} className="text-primary" />
                <h2 className="font-heading text-xl">Seu Livro de Feitiços</h2>
                <div className="ml-auto flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-white/10">
                   <Zap size={12} className="text-primary" />
                   <span className="text-[10px] font-heading uppercase tracking-widest">Seu Turno</span>
                </div>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {userSpells.map((s) => (
                   <button
                     key={s.id}
                     disabled={activeDuel.current_turn_user_id !== user?.id}
                     onClick={() => castSpell(s)}
                     className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                        activeDuel.current_turn_user_id === user?.id 
                          ? 'border-white/10 bg-white/5 hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-1' 
                          : 'opacity-40 grayscale border-white/5'
                     }`}
                   >
                      <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-white/10 group-hover:border-primary/40">
                         {s.type === 'damage' ? <Swords size={18} className="text-red-400" /> : 
                          s.type === 'heal' ? <Heart size={18} className="text-green-400" /> : 
                          <Shield size={18} className="text-blue-400" />}
                      </div>
                      <div className="text-center">
                         <p className="text-[11px] font-heading text-foreground truncate w-full">{s.name}</p>
                         <p className="text-[9px] text-primary font-bold">{s.mana_cost} MANA</p>
                      </div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
