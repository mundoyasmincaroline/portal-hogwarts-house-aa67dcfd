import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Swords, Heart, Sparkles, Shield, Skull } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Spell = { id: string; code: string; name: string; type: string; damage: number; heal: number; shield: number; mp_cost: number; level_req: number; description: string; icon: string };
type Match = any;
type Action = any;

export default function DuelsPvP() {
  const { user, profile } = useAuth();
  const [spells, setSpells] = useState<Spell[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [pending, setPending] = useState<Match[]>([]);
  const [opponents, setOpponents] = useState<any[]>([]);
  const [casting, setCasting] = useState(false);

  const loadOpponents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("user_id, full_name, house, level, avatar_url").neq("user_id", user.id).limit(20);
    setOpponents(data || []);
  }, [user]);

  const loadActive = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("duel_matches")
      .select("*").or(`player_a.eq.${user.id},player_b.eq.${user.id}`)
      .in("status", ["pending", "active"]).order("created_at", { ascending: false });
    const active = (data || []).find((m: any) => m.status === "active") || (data || [])[0];
    setMatch(active || null);
    setPending((data || []).filter((m: any) => m.status === "pending" && m.player_b === user.id));
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("duel_spells").select("*").order("level_req");
      setSpells(data || []);
    })();
    loadOpponents();
    loadActive();
  }, [loadOpponents, loadActive]);

  // Realtime
  useEffect(() => {
    if (!match?.id) return;
    const ch = supabase.channel(`duel:${match.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "duel_matches", filter: `id=eq.${match.id}` }, (p: any) => setMatch(p.new))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "duel_actions", filter: `match_id=eq.${match.id}` }, (p: any) => setActions(prev => [...prev, p.new]))
      .subscribe();
    (async () => {
      const { data } = await (supabase as any).from("duel_actions").select("*").eq("match_id", match.id).order("turn");
      setActions(data || []);
    })();
    return () => { supabase.removeChannel(ch); };
  }, [match?.id]);

  const challenge = async (opponent: string) => {
    const { error } = await (supabase as any).rpc("create_duel", { p_opponent: opponent });
    if (error) toast.error(error.message); else { toast.success("⚔️ Desafio enviado!"); loadActive(); }
  };

  const accept = async (id: string) => {
    const { error } = await (supabase as any).rpc("accept_duel", { p_match: id });
    if (error) toast.error(error.message); else { toast.success("Duelo iniciado!"); loadActive(); }
  };

  const cast = async (code: string) => {
    if (!match || casting) return;
    setCasting(true);
    const { error } = await (supabase as any).rpc("cast_duel_spell", { p_match: match.id, p_spell_code: code });
    if (error) toast.error(error.message);
    setCasting(false);
  };

  const forfeit = async () => {
    if (!match || !confirm("Desistir do duelo?")) return;
    const { error } = await (supabase as any).rpc("forfeit_duel", { p_match: match.id });
    if (error) toast.error(error.message); else loadActive();
  };

  // ---------- Arena ----------
  if (match && match.status === "active") {
    const isA = match.player_a === user?.id;
    const myHp = isA ? match.hp_a : match.hp_b;
    const oppHp = isA ? match.hp_b : match.hp_a;
    const myMp = isA ? match.mp_a : match.mp_b;
    const myShield = isA ? match.shield_a : match.shield_b;
    const oppShield = isA ? match.shield_b : match.shield_a;
    const myTurn = match.current_turn === user?.id;
    const level = profile?.level ?? 1;

    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl text-primary flex items-center gap-2"><Swords/> Duelo em andamento</h1>
          <Button size="sm" variant="outline" onClick={forfeit}>Desistir</Button>
        </div>

        <Card className="p-4 bg-card/60 border-primary/30 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <PlayerBar label="Você" hp={myHp} mp={myMp} shield={myShield} mine />
            <PlayerBar label="Oponente" hp={oppHp} mp={null} shield={oppShield} />
          </div>
          <div className={`text-center text-sm font-heading ${myTurn ? "text-primary animate-pulse" : "text-foreground/60"}`}>
            {myTurn ? "⚡ Seu turno — escolha um feitiço" : "⏳ Aguardando o oponente…"}
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {spells.filter(s => s.level_req <= level).map(s => {
            const noMana = myMp < s.mp_cost;
            return (
              <button
                key={s.id}
                disabled={!myTurn || casting || noMana}
                onClick={() => cast(s.code)}
                className={`p-3 rounded-xl border text-left transition-all ${myTurn && !noMana ? "bg-card/70 border-primary/40 hover:border-primary hover:bg-primary/15 hover:-translate-y-1" : "bg-card/30 border-border opacity-50"}`}
              >
                <div className="text-2xl">{s.icon}</div>
                <div className="font-heading text-sm text-primary mt-1">{s.name}</div>
                <div className="text-[10px] text-foreground/60">{s.description}</div>
                <div className="flex gap-2 mt-1 text-[10px]">
                  {s.damage > 0 && <span className="text-red-400">⚔ {s.damage}</span>}
                  {s.heal > 0 && <span className="text-green-400">💚 {s.heal}</span>}
                  {s.shield > 0 && <span className="text-blue-400">🛡 {s.shield}</span>}
                  <span className="text-cyan-400 ml-auto">{s.mp_cost} MP</span>
                </div>
              </button>
            );
          })}
        </div>

        <Card className="p-3 bg-card/50 border-primary/20 max-h-48 overflow-y-auto">
          <div className="font-heading text-xs text-primary mb-2 uppercase tracking-widest"><EmojiIcon e="📜" /> Log do Duelo</div>
          {actions.slice().reverse().map(a => (
            <div key={a.id} className="text-xs text-foreground/80 py-0.5">
              <span className="text-primary/70">T{a.turn}</span> · {a.player === user?.id ? "Você" : "Oponente"}: {a.log_text}
            </div>
          ))}
          {actions.length === 0 && <div className="text-xs text-foreground/50">Duelo começou! Lance o primeiro feitiço.</div>}
        </Card>
      </div>
    );
  }

  if (match && match.status === "finished") {
    const won = match.winner === user?.id;
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="text-6xl">{won ? "🏆" : "💀"}</div>
        <h1 className="font-heading text-3xl text-primary">{won ? "Vitória!" : "Derrota"}</h1>
        {won && <p className="text-foreground/80">+{match.xp_reward} XP · +{match.galeon_reward} Galeões</p>}
        <Button onClick={() => setMatch(null)}>Voltar</Button>
      </div>
    );
  }

  // ---------- Lobby ----------
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="font-heading text-2xl sm:text-3xl text-primary flex items-center gap-2 flex-wrap"><Swords/> Duelos PvP</h1>
        <p className="text-foreground/70 font-serif italic">Desafie outros bruxos em um duelo mágico por turnos.</p>
      </header>

      {pending.length > 0 && (
        <Card className="p-4 bg-primary/10 border-primary/40">
          <h2 className="font-heading text-primary mb-3"><EmojiIcon e="⚡" /> Desafios pendentes</h2>
          {pending.map(m => (
            <div key={m.id} className="flex justify-between items-center py-2">
              <span className="text-sm">Desafio recebido</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => accept(m.id)}>Aceitar</Button>
                <Button size="sm" variant="outline" onClick={() => (supabase as any).rpc("forfeit_duel", { p_match: m.id }).then(loadActive)}>Recusar</Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card className="p-4 bg-card/60 border-primary/30">
        <h2 className="font-heading text-primary mb-3"><EmojiIcon e="🎯" /> Escolha um oponente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {opponents.map(o => (
            <button key={o.user_id} onClick={() => challenge(o.user_id)} className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-background/50 hover:border-primary hover:bg-primary/10 transition-all">
              <img src={o.avatar_url || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-full object-cover"/>
              <div className="text-left">
                <div className="font-heading text-sm">{o.full_name || "Bruxo"}</div>
                <div className="text-[10px] text-foreground/60 uppercase">{o.house} · Nv {o.level || 1}</div>
              </div>
              <Swords className="w-4 h-4 ml-auto text-primary"/>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PlayerBar({ label, hp, mp, shield, mine }: { label: string; hp: number; mp: number | null; shield: number; mine?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border ${mine ? "border-primary/40 bg-primary/5" : "border-red-500/30 bg-red-500/5"}`}>
      <div className="font-heading text-sm mb-1">{label}</div>
      <div className="flex items-center gap-2 text-xs mb-1"><Heart className="w-3 h-3 text-red-400"/> {hp}/100</div>
      <Progress value={hp} className="h-2 mb-2"/>
      {mp !== null && (<>
        <div className="flex items-center gap-2 text-xs mb-1"><Sparkles className="w-3 h-3 text-cyan-400"/> {mp}/100</div>
        <Progress value={mp} className="h-1.5 mb-2"/>
      </>)}
      {shield > 0 && <div className="flex items-center gap-1 text-xs text-blue-400"><Shield className="w-3 h-3"/> +{shield}</div>}
    </div>
  );
}