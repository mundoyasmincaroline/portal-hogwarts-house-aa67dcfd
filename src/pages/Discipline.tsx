import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Scale, Trophy, AlertTriangle } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function Discipline() {
  const { user } = useAuth();
  const [detentions, setDetentions] = useState<any[]>([]);
  const [merits, setMerits] = useState<any[]>([]);
  const [allMerits, setAllMerits] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const [d, m, am] = await Promise.all([
      supabase.from("detentions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("merits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("merits").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setDetentions(d.data ?? []); setMerits(m.data ?? []); setAllMerits(am.data ?? []);
  };
  useEffect(() => { load(); }, [user?.id]);

  const complete = async (id: string) => {
    const { error } = await supabase.rpc("complete_detention", { p_detention_id: id });
    if (error) return toast.error(error.message);
    toast.success("🧹 Detenção cumprida!"); load();
  };

  const pendingDet = detentions.filter(d => d.status === 'pending');
  const totalPoints = merits.reduce((s, m) => s + m.points, 0);
  const totalPunish = detentions.reduce((s, d) => s + d.points_deducted, 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-gold-gradient flex items-center gap-2"><Scale/> Histórico Disciplinar</h1>
        <p className="text-sm text-muted-foreground">Méritos e detenções do bruxo</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-premium rounded-2xl p-4 text-center">
          <Trophy className="mx-auto text-yellow-400 mb-1" size={24}/>
          <p className="text-2xl font-heading text-gold-gradient">{merits.length}</p>
          <p className="text-[10px] text-muted-foreground">Méritos · +{totalPoints} pts</p>
        </div>
        <div className="glass-premium rounded-2xl p-4 text-center">
          <AlertTriangle className="mx-auto text-red-400 mb-1" size={24}/>
          <p className="text-2xl font-heading text-red-400">{detentions.length}</p>
          <p className="text-[10px] text-muted-foreground">Detenções · -{totalPunish} pts</p>
        </div>
        <div className="glass-premium rounded-2xl p-4 text-center">
          <Scale className="mx-auto text-primary mb-1" size={24}/>
          <p className={`text-2xl font-heading ${totalPoints - totalPunish >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPoints - totalPunish >= 0 ? '+' : ''}{totalPoints - totalPunish}
          </p>
          <p className="text-[10px] text-muted-foreground">Saldo</p>
        </div>
      </div>

      <Tabs defaultValue="detentions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detentions">🧹 Detenções {pendingDet.length > 0 && <Badge variant="destructive" className="ml-1 text-[9px]">{pendingDet.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="merits"><EmojiIcon e="🏆" /> Meus Méritos</TabsTrigger>
          <TabsTrigger value="hall"><EmojiIcon e="📜" /> Hall de Honra</TabsTrigger>
        </TabsList>

        <TabsContent value="detentions" className="mt-4 space-y-2">
          {detentions.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma detenção. Continue assim! <EmojiIcon e="✨" /></p> :
            detentions.map(d => (
              <div key={d.id} className="glass-premium rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="font-heading text-sm">{d.reason}</p>
                    {d.task_description && <p className="text-xs text-muted-foreground italic mt-1">"{d.task_description}"</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{d.hours}h · -{d.points_deducted} pts · {new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge className={d.status==='pending'?'bg-yellow-500/20 text-yellow-400':d.status==='completed'?'bg-green-500/20 text-green-400':'bg-muted'}>
                    {d.status==='pending'?'Pendente':d.status==='completed'?'Cumprida':'Perdoada'}
                  </Badge>
                </div>
                {d.status === 'pending' && (
                  <Button size="sm" className="w-full mt-2" onClick={() => complete(d.id)}>Cumprir detenção</Button>
                )}
              </div>
            ))
          }
        </TabsContent>

        <TabsContent value="merits" className="mt-4 space-y-2">
          {merits.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhum mérito ainda.</p> :
            merits.map(m => (
              <div key={m.id} className="glass-premium rounded-xl p-3 flex items-center gap-3">
                <Trophy className="text-yellow-400" size={20}/>
                <div className="flex-1">
                  <p className="text-sm">{m.reason}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge className="bg-primary/20 text-primary">+{m.points}</Badge>
              </div>
            ))
          }
        </TabsContent>

        <TabsContent value="hall" className="mt-4 space-y-2">
          {allMerits.map((m: any) => (
            <div key={m.id} className="glass-premium rounded-xl p-3 flex items-center gap-3">
              <Trophy className="text-yellow-400" size={18}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">Bruxo {m.user_id.slice(0,8)}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{m.reason}</p>
              </div>
              <Badge className="bg-primary/20 text-primary">+{m.points}</Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}