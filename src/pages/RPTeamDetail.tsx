import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Target, ArrowLeft, Crown, Coins, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function RPTeamDetail() {
  const { id } = useParams();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [newMission, setNewMission] = useState({ title: "", description: "", reward_xp: 100, reward_gold: 50 });
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user?.id ?? null);
    const { data: t } = await supabase.from("rp_teams").select("*").eq("id", id).maybeSingle();
    setTeam(t);
    const { data: m } = await supabase.from("rp_team_members").select("*").eq("team_id", id);
    setMembers(m ?? []);
    const { data: ms } = await supabase.from("rp_team_missions").select("*").eq("team_id", id).order("created_at", { ascending: false });
    setMissions(ms ?? []);
  };
  useEffect(() => { if (id) load(); }, [id]);

  const isMember = members.some(m => m.user_id === me);
  const isLeader = team?.leader_id === me;

  const join = async () => {
    if (!me) return toast.error("Faça login");
    const { error } = await supabase.from("rp_team_members").insert([{ team_id: id, user_id: me }] as any);
    if (error) return toast.error(error.message);
    toast.success("Você entrou para a equipe! ⚔️"); load();
  };
  const leave = async () => {
    if (!me) return;
    await supabase.from("rp_team_members").delete().eq("team_id", id!).eq("user_id", me);
    toast.success("Você deixou a equipe"); load();
  };
  const createMission = async () => {
    if (newMission.title.length < 3) return toast.error("Título muito curto");
    const { error } = await supabase.from("rp_team_missions").insert([{ ...newMission, team_id: id }] as any);
    if (error) return toast.error(error.message);
    setNewMission({ title: "", description: "", reward_xp: 100, reward_gold: 50 });
    setShowForm(false); toast.success("Missão criada!"); load();
  };
  const completeMission = async (m: any) => {
    if (!me) return;
    await supabase.from("rp_team_missions").update({ status: 'completed', completed_by: me, completed_at: new Date().toISOString() } as any).eq("id", m.id);
    await supabase.from("rp_teams").update({ xp: (team.xp || 0) + m.reward_xp, treasury: (team.treasury || 0) + m.reward_gold } as any).eq("id", id!);
    toast.success(`+${m.reward_xp} XP · +${m.reward_gold} 🪙`); load();
  };

  if (!team) return <div className="container mx-auto py-10 text-center text-muted-foreground">Carregando equipe...</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Link to="/dashboard/rp-teams" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4"><ArrowLeft size={14}/>Todas as equipes</Link>

      <div className="glass-premium rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="text-6xl">{team.emblem}</div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-3xl text-gold-gradient">{team.name}</h1>
            {team.motto && <p className="italic text-primary/80">"{team.motto}"</p>}
            <p className="text-sm text-muted-foreground mt-2">{team.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="gap-1"><Users size={12}/> {team.member_count}/{team.max_members}</Badge>
              <Badge variant="outline">Nv. {team.level}</Badge>
              <Badge className="bg-primary/20 text-primary border-primary/30">{team.xp} XP</Badge>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1"><Coins size={12}/> {team.treasury}</Badge>
            </div>
          </div>
          {me && !isMember && team.member_count < team.max_members && (
            <Button variant="magical" onClick={join}>Entrar na equipe</Button>
          )}
          {me && isMember && !isLeader && (
            <Button variant="outline" onClick={leave}>Sair</Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Members */}
        <div className="glass-premium rounded-2xl p-5">
          <h2 className="font-heading text-lg text-gold-gradient mb-3 flex items-center gap-2"><Users size={18}/> Membros</h2>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                {m.role === 'leader' && <Crown size={14} className="text-yellow-400"/>}
                <span className="text-sm">{m.user_id.slice(0,8)}...</span>
                <Badge variant="outline" className="ml-auto text-[10px]">{m.role}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Missions */}
        <div className="glass-premium rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg text-gold-gradient flex items-center gap-2"><Target size={18}/> Missões</h2>
            {isMember && <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}><Plus size={14}/></Button>}
          </div>
          {showForm && isMember && (
            <div className="space-y-2 mb-4 p-3 rounded-lg bg-secondary/20">
              <Input placeholder="Título" value={newMission.title} onChange={e=>setNewMission({...newMission, title: e.target.value})} maxLength={100}/>
              <Textarea placeholder="Descrição..." value={newMission.description} onChange={e=>setNewMission({...newMission, description: e.target.value})} rows={2}/>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="XP" value={newMission.reward_xp} onChange={e=>setNewMission({...newMission, reward_xp: +e.target.value})}/>
                <Input type="number" placeholder="🪙" value={newMission.reward_gold} onChange={e=>setNewMission({...newMission, reward_gold: +e.target.value})}/>
              </div>
              <Button size="sm" variant="magical" className="w-full" onClick={createMission}>Criar Missão</Button>
            </div>
          )}
          {missions.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Sem missões ativas</p> :
            <div className="space-y-2">
              {missions.map(m => (
                <div key={m.id} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-heading flex-1">{m.title}</h3>
                    {m.status === 'completed' ? <CheckCircle2 size={16} className="text-green-400"/> :
                     isMember && <Button size="sm" variant="ghost" onClick={() => completeMission(m)}>Concluir</Button>}
                  </div>
                  {m.description && <p className="text-xs text-muted-foreground mb-2">{m.description}</p>}
                  <div className="flex gap-2 text-[10px]">
                    <Badge variant="outline">+{m.reward_xp} XP</Badge>
                    <Badge variant="outline">+{m.reward_gold} 🪙</Badge>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}