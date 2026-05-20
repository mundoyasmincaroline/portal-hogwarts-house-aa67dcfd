import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Swords, Shield, Zap, Sparkles, User } from "lucide-react";
import MagicalEmoji from "@/components/MagicalEmoji";
import HouseCrest from "@/components/HouseCrest";
import { motion } from "framer-motion";

interface Spell {
  id: string;
  name: string;
  incantation: string;
  category: string;
  description: string;
  base_damage: number;
  base_defense: number;
  icon: string;
}

interface Duel {
  id: string;
  challenger_user_id: string;
  opponent_user_id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  challenger_hp: number;
  opponent_hp: number;
  current_turn: string; // 'challenger' | 'opponent'
  winner: string | null;
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
    const { data } = await supabase.from("spells").select("*").lte("min_year", 1);
    setUserSpells(data || []);
  };

  const checkActiveDuel = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("duels")
      .select("*")
      .or(`challenger_user_id.eq.${user.id},opponent_user_id.eq.${user.id}`)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) setActiveDuel(data as any);
    setLoading(false);
  };

  const subscribeToDuels = () => {
    const channelId = `active_duels_page:${user?.id ?? "guest"}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duels" },
        (payload) => {
          const updatedDuel = payload.new as Duel;
          if (updatedDuel.challenger_user_id === user?.id || updatedDuel.opponent_user_id === user?.id) {
            setActiveDuel(updatedDuel);
            if (updatedDuel.status === 'completed') {
               const win = (updatedDuel.winner === 'challenger' && updatedDuel.challenger_user_id === user?.id) || 
                           (updatedDuel.winner === 'opponent' && updatedDuel.opponent_user_id === user?.id);
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
    const { data: opponent } = await supabase
      .from("profiles")
      .select("user_id, active_character_id")
      .neq("user_id", user?.id)
      .eq("approved", true)
      .limit(1)
      .maybeSingle();

    if (!opponent) {
      toast.error("Nenhum oponente disponível no momento.");
      setSearching(false);
      return;
    }

    const { data: newDuel, error } = await supabase
      .from("duels")
      .insert({
        challenger_user_id: user?.id,
        challenger_character_id: profile?.active_character_id,
        opponent_user_id: opponent.user_id,
        opponent_character_id: opponent.active_character_id,
        opponent_type: 'player',
        status: 'active',
        current_turn: 'challenger',
        challenger_hp: 100,
        opponent_hp: 100
      } as never)
      .select()
      .single();

    if (error) {
      toast.error("Erro ao iniciar duelo.");
    } else {
      setActiveDuel(newDuel as any);
      toast.success("Duelo iniciado!");
    }
    setSearching(false);
  };

  const castSpell = async (spell: Spell) => {
    if (!activeDuel || !user || !profile) return;
    
    const isChallenger = activeDuel.challenger_user_id === user.id;
    const isMyTurn = (isChallenger && activeDuel.current_turn === 'challenger') || 
                     (!isChallenger && activeDuel.current_turn === 'opponent');

    if (!isMyTurn) return;

    let newOpponentHp = isChallenger ? activeDuel.opponent_hp : activeDuel.challenger_hp;
    let newMyHp = isChallenger ? activeDuel.challenger_hp : activeDuel.opponent_hp;

    // Simplified logic: damage category or defense
    if (spell.category === 'damage' || spell.base_damage > 0) {
      newOpponentHp = Math.max(0, newOpponentHp - (spell.base_damage || 15));
    } else if (spell.category === 'defense' || spell.base_defense > 0) {
      newMyHp = Math.min(100, newMyHp + (spell.base_defense || 10));
    }

    const nextTurn = isChallenger ? 'opponent' : 'challenger';
    const isGameOver = newOpponentHp <= 0;

    const updates: any = {
      current_turn: nextTurn,
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
      updates.winner = isChallenger ? 'challenger' : 'opponent';
      await supabase.rpc("award_xp_action", { _action: "duel_win", _user_id: user.id, _xp: 50 });
    }

    await supabase.from("duels").update(updates as never).eq("id", activeDuel.id);
    
    await supabase.from("duel_turns").insert({
      duel_id: activeDuel.id,
      actor: isChallenger ? 'challenger' : 'opponent',
      spell_id: spell.id,
      spell_name: spell.name,
      damage: spell.base_damage || 0,
      hit: true,
      narrative: `${profile.full_name} lançou ${spell.name}!`
    } as never);
  };

  const myTurn = activeDuel && (
    (activeDuel.challenger_user_id === user?.id && activeDuel.current_turn === 'challenger') ||
    (activeDuel.opponent_user_id === user?.id && activeDuel.current_turn === 'opponent')
  );

  if (loading) return <div className="text-center py-20 text-muted-foreground">Convocando juízes...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 text-center">
        <h1 className="font-heading text-2xl text-gold-gradient mb-2">Clube de Duelos</h1>
        <p className="text-muted-foreground text-sm">Honra e coragem</p>
      </div>

      {!activeDuel || activeDuel.status === 'completed' ? (
        <div className="glass rounded-[3rem] p-12 text-center space-y-6 border border-white/5">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <Swords size={40} className="text-primary animate-float" />
          </div>
          <h2 className="font-heading text-2xl">Pronto para o Desafio?</h2>
          <Button variant="magical" size="lg" onClick={findOpponent} disabled={searching} className="px-10 py-6 h-auto text-lg rounded-2xl">
            {searching ? "Procurando..." : "Buscar Oponente ⚔️"}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center font-heading text-xl text-primary shadow-2xl">VS</div>
             </div>

             <div className={`glass rounded-3xl p-6 border-2 transition-all ${activeDuel.challenger_user_id === user?.id ? (myTurn ? 'border-primary shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/5') : (!myTurn ? 'border-primary shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/5')}`}>
                <div className="flex flex-col items-center gap-4 text-center">
                   <HouseCrest house={profile?.house || 'gryffindor'} size="lg" />
                   <h3 className="font-heading truncate w-full">Você</h3>
                   <div className="w-full space-y-1">
                      <div className="h-2 bg-black/60 rounded-full overflow-hidden">
                         <motion.div animate={{ width: `${activeDuel.challenger_user_id === user?.id ? activeDuel.challenger_hp : activeDuel.opponent_hp}%` }} className="h-full bg-red-600" />
                      </div>
                   </div>
                </div>
             </div>

             <div className={`glass rounded-3xl p-6 border-2 transition-all ${activeDuel.opponent_user_id === user?.id ? (myTurn ? 'border-primary shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/5') : (!myTurn ? 'border-primary shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/5')}`}>
                <div className="flex flex-col items-center gap-4 text-center">
                   <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10"><User size={32} /></div>
                   <h3 className="font-heading truncate w-full">Oponente</h3>
                   <div className="w-full space-y-1">
                      <div className="h-2 bg-black/60 rounded-full overflow-hidden">
                         <motion.div animate={{ width: `${activeDuel.opponent_user_id === user?.id ? activeDuel.opponent_hp : activeDuel.challenger_hp}%` }} className="h-full bg-red-600" />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="glass rounded-[2.5rem] p-8">
             <div className="flex items-center gap-3 mb-6">
                <Sparkles size={20} className="text-primary" />
                <h2 className="font-heading text-xl">Seu Livro de Feitiços</h2>
                {myTurn && <div className="ml-auto bg-primary/20 px-4 py-1.5 rounded-full border border-primary/30 text-[10px] font-heading uppercase text-primary animate-pulse">Seu Turno</div>}
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {userSpells.map((s) => (
                   <button key={s.id} disabled={!myTurn} onClick={() => castSpell(s)} className={`p-4 rounded-2xl border transition-all ${myTurn ? 'border-white/10 bg-white/5 hover:border-primary/50 hover:-translate-y-1' : 'opacity-40 border-white/5'}`}>
                      <div className="text-xl mb-1">{s.icon || '🪄'}</div>
                      <p className="text-[11px] font-heading truncate">{s.name}</p>
                      <p className="text-[9px] text-muted-foreground italic">"{s.incantation}"</p>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
