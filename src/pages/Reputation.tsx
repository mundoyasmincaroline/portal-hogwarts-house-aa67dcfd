import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Heart, Skull, Star, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const TIERS = [
  { min: 0, title: 'Iniciante', color: 'bg-muted text-muted-foreground' },
  { min: 30, title: 'Aprendiz', color: 'bg-blue-500/20 text-blue-400' },
  { min: 100, title: 'Conhecido', color: 'bg-green-500/20 text-green-400' },
  { min: 250, title: 'Respeitado', color: 'bg-primary/20 text-primary' },
  { min: 500, title: 'Lenda de Hogwarts', color: 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-400' },
];

export default function Reputation() {
  const { user } = useAuth();
  const [top, setTop] = useState<any[]>([]);
  const [myRep, setMyRep] = useState<any>(null);
  const [given, setGiven] = useState<any[]>([]);
  const [received, setReceived] = useState<any[]>([]);

  const load = async () => {
    const { data: rep } = await supabase.from("reputation").select("*").order("score", { ascending: false }).limit(20);
    setTop(rep ?? []);
    if (user) {
      const { data: my } = await supabase.from("reputation").select("*").eq("user_id", user.id).maybeSingle();
      setMyRep(my);
      const { data: g } = await supabase.from("endorsements").select("*").eq("from_user", user.id).order("created_at", { ascending: false });
      setGiven(g ?? []);
      const { data: r } = await supabase.from("endorsements").select("*").eq("to_user", user.id).order("created_at", { ascending: false });
      setReceived(r ?? []);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const remove = async (id: string) => {
    await supabase.from("endorsements").delete().eq("id", id);
    toast.success("Endosso removido"); load();
  };

  const tier = TIERS.slice().reverse().find(t => (myRep?.score ?? 0) >= t.min)!;
  const nextTier = TIERS.find(t => t.min > (myRep?.score ?? 0));

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-gold-gradient">🌟 Reputação Social</h1>
        <p className="text-sm text-muted-foreground">Sua presença e influência no mundo bruxo</p>
      </div>

      {/* My Reputation */}
      <div className="glass-premium rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Seu Título Atual</p>
            <Badge className={`${tier.color} text-base px-3 py-1 font-heading`}>{myRep?.title ?? tier.title}</Badge>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Pontuação</p>
            <p className="text-3xl font-heading text-gold-gradient">{myRep?.score ?? 0}</p>
          </div>
        </div>
        {nextTier && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Próximo: {nextTier.title}</span>
              <span>{myRep?.score ?? 0} / {nextTier.min}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-yellow-400" style={{ width: `${Math.min(100, ((myRep?.score ?? 0)/nextTier.min)*100)}%` }}/>
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-center"><Heart size={20} className="mx-auto text-blue-400 mb-1"/><p className="text-xl font-heading">{myRep?.respect ?? 0}</p><p className="text-[10px] text-muted-foreground">Respeito</p></div>
          <div className="p-3 rounded-lg bg-yellow-500/10 text-center"><Star size={20} className="mx-auto text-yellow-400 mb-1"/><p className="text-xl font-heading">{myRep?.admiration ?? 0}</p><p className="text-[10px] text-muted-foreground">Admiração</p></div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center"><Skull size={20} className="mx-auto text-red-400 mb-1"/><p className="text-xl font-heading">{myRep?.fear ?? 0}</p><p className="text-[10px] text-muted-foreground">Temor</p></div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Ranking */}
        <div className="glass-premium rounded-2xl p-5">
          <h2 className="font-heading text-lg text-gold-gradient mb-3 flex items-center gap-2"><TrendingUp size={18}/> Hall da Fama</h2>
          <div className="space-y-2">
            {top.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Ranking vazio</p> :
              top.map((r, i) => (
                <div key={r.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                  <span className={`font-heading w-6 ${i<3?'text-yellow-400':'text-muted-foreground'}`}>#{i+1}</span>
                  <Award size={16} className="text-primary"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{r.user_id.slice(0,8)}...</p>
                    <p className="text-[10px] text-primary">{r.title}</p>
                  </div>
                  <span className="text-sm font-heading text-primary">{r.score}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* My Endorsements */}
        <div className="glass-premium rounded-2xl p-5">
          <h2 className="font-heading text-lg text-gold-gradient mb-3">Endossos Recebidos</h2>
          {received.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Você ainda não recebeu endossos</p> :
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {received.map(e => (
                <div key={e.id} className="p-2 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{e.from_user.slice(0,8)}...</span>
                    <Badge variant="outline" className="text-[10px]">{e.type==='respect'?'🫂 Respeito':e.type==='admiration'?'⭐ Admiração':'💀 Temor'}</Badge>
                  </div>
                  {e.note && <p className="text-[11px] text-muted-foreground italic mt-1">"{e.note}"</p>}
                </div>
              ))}
            </div>
          }
          <h2 className="font-heading text-lg text-gold-gradient mb-3 mt-5">Endossos que Concedi</h2>
          {given.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Visite perfis para endossar membros</p> :
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {given.map(e => (
                <div key={e.id} className="p-2 rounded-lg bg-secondary/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs">→ {e.to_user.slice(0,8)}...</span>
                    <Badge variant="outline" className="text-[10px] ml-2">{e.type}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(e.id)}>Remover</Button>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}