import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Sword, Trophy } from "lucide-react";
import { toast } from "sonner";

const EMBLEMS = ["⚔️","🛡️","🦁","🐍","🦅","🦡","🐺","🦊","🐉","🦄","⚡","✨","🌙","☀️","🔥"];

export default function RPTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", motto: "", description: "", emblem: "⚔️" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("rp_teams").select("*").order("xp", { ascending: false });
    setTeams(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (form.name.trim().length < 3) return toast.error("Nome muito curto");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Faça login");
    const { error } = await supabase.from("rp_teams").insert([{ ...form, leader_id: user.id }] as any);
    if (error) return toast.error(error.message);
    toast.success("Equipe forjada! ⚔️");
    setForm({ name: "", motto: "", description: "", emblem: "⚔️" });
    setOpen(false); load();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl text-gold-gradient">⚔️ Equipes de RP</h1>
          <p className="text-sm text-muted-foreground">Forme alianças, cumpra missões coletivas, suba no ranking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="magical"><Plus size={16} className="mr-2"/> Criar Equipe</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading text-gold-gradient">Forjar Nova Equipe</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Brasão</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {EMBLEMS.map(e => (
                    <button key={e} onClick={() => setForm({...form, emblem: e})}
                      className={`text-2xl w-10 h-10 rounded-lg border ${form.emblem===e ? 'border-primary bg-primary/20' : 'border-border'}`}>{e}</button>
                  ))}
                </div>
              </div>
              <Input placeholder="Nome da equipe" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} maxLength={50}/>
              <Input placeholder="Lema (opcional)" value={form.motto} onChange={e=>setForm({...form, motto: e.target.value})} maxLength={100}/>
              <Textarea placeholder="Descrição da equipe..." value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={3} maxLength={500}/>
              <Button variant="magical" className="w-full" onClick={create}>Forjar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p className="text-center text-muted-foreground py-10">Carregando...</p> :
      teams.length === 0 ? (
        <div className="text-center py-20 glass-premium rounded-2xl">
          <Sword className="mx-auto text-muted-foreground mb-3" size={40} />
          <p className="text-muted-foreground">Nenhuma equipe ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t, i) => (
            <Link key={t.id} to={`/dashboard/rp-teams/${t.id}`} className="glass-premium rounded-2xl p-5 border-border/50 hover:border-primary/50 transition-all hover:scale-[1.02]">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-4xl">{t.emblem}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-lg text-foreground truncate">{t.name}</h3>
                  {t.motto && <p className="text-xs italic text-primary/80 truncate">"{t.motto}"</p>}
                </div>
                {i < 3 && <Trophy size={20} className={i===0?'text-yellow-400':i===1?'text-gray-300':'text-orange-400'}/>}
              </div>
              {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.description}</p>}
              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className="gap-1"><Users size={12}/> {t.member_count}/{t.max_members}</Badge>
                <span className="text-primary font-heading">Nv. {t.level} · {t.xp} XP</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}