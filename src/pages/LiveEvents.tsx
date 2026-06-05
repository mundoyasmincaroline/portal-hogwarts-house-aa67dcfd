import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

import EmojiIcon from "@/components/shared/EmojiIcon";
function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const diff = new Date(to).getTime() - now;
  if (diff <= 0) return <span className="text-green-400 font-heading text-sm">AO VIVO AGORA <EmojiIcon e="✦" /></span>;
  const d = Math.floor(diff / 86400000), h = Math.floor((diff%86400000)/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
  return <span className="text-primary font-mono text-sm">{d>0?`${d}d `:''}{h}h {m}m {s}s</span>;
}

export default function LiveEvents() {
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<Record<string,string>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title:"", description:"", type:"baile", cover_emoji:"🎭", location:"Salão Principal", starts_at:"", ends_at:"", reward_xp:50, reward_gold:25 });

  const load = async () => {
    const { data } = await supabase.from("live_events").select("*").order("starts_at", { ascending: true });
    setEvents(data ?? []);
    if (user) {
      const { data: a } = await supabase.from("event_attendees").select("event_id, rsvp").eq("user_id", user.id);
      const map: Record<string,string> = {};
      (a ?? []).forEach((x:any) => { map[x.event_id] = x.rsvp; });
      setRsvps(map);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const rsvp = async (eventId: string, choice: string) => {
    if (!user) return toast.error("Faça login");
    const existing = rsvps[eventId];
    if (existing) {
      await supabase.from("event_attendees").update({ rsvp: choice } as any).eq("event_id", eventId).eq("user_id", user.id);
    } else {
      await supabase.from("event_attendees").insert([{ event_id: eventId, user_id: user.id, rsvp: choice }] as any);
    }
    toast.success("RSVP confirmado ✨"); load();
  };

  const createEvent = async () => {
    if (!user) return;
    if (!form.title || !form.starts_at || !form.ends_at) return toast.error("Preencha título e horários");
    const { error } = await supabase.from("live_events").insert([{ ...form, created_by: user.id }] as any);
    if (error) return toast.error(error.message);
    toast.success("Evento agendado! 🎭"); setOpen(false); load();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl text-gold-gradient"><EmojiIcon e="🎭" /> Eventos ao Vivo</h1>
          <p className="text-sm text-muted-foreground">Bailes, banquetes, torneios — confirme presença e ganhe recompensas</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="magical"><Plus size={16} className="mr-2"/> Agendar Evento</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading text-gold-gradient">Novo Evento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <Input value={form.cover_emoji} onChange={e=>setForm({...form,cover_emoji:e.target.value})} className="text-2xl text-center"/>
                  <Input placeholder="Título" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
                </div>
                <Textarea placeholder="Descrição" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3}/>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={form.type} onValueChange={v=>setForm({...form,type:v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baile">Baile</SelectItem>
                      <SelectItem value="banquete">Banquete</SelectItem>
                      <SelectItem value="torneio">Torneio</SelectItem>
                      <SelectItem value="aula">Aula Especial</SelectItem>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Local" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-muted-foreground">Início</label><Input type="datetime-local" value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})}/></div>
                  <div><label className="text-xs text-muted-foreground">Fim</label><Input type="datetime-local" value={form.ends_at} onChange={e=>setForm({...form,ends_at:e.target.value})}/></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-muted-foreground">XP</label><Input type="number" value={form.reward_xp} onChange={e=>setForm({...form,reward_xp:+e.target.value})}/></div>
                  <div><label className="text-xs text-muted-foreground">Galeões</label><Input type="number" value={form.reward_gold} onChange={e=>setForm({...form,reward_gold:+e.target.value})}/></div>
                </div>
                <Button variant="magical" className="w-full" onClick={createEvent}>Agendar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 glass-premium rounded-2xl">
          <Calendar className="mx-auto text-muted-foreground mb-3" size={40}/>
          <p className="text-muted-foreground">Nenhum evento agendado ainda</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {events.map(e => {
            const live = new Date(e.starts_at).getTime() <= Date.now() && new Date(e.ends_at).getTime() > Date.now();
            return (
              <div key={e.id} className="glass-premium rounded-2xl p-5 border-border/50 hover:border-primary/50 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-4xl">{e.cover_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg truncate">{e.title}</h3>
                    <Badge variant="outline" className="text-[10px]">{e.type}</Badge>
                  </div>
                  {live && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">AO VIVO</Badge>}
                </div>
                {e.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{e.description}</p>}
                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  <p className="flex items-center gap-2"><MapPin size={12}/> {e.location}</p>
                  <p className="flex items-center gap-2"><Clock size={12}/> {new Date(e.starts_at).toLocaleString("pt-BR")}</p>
                  <p className="flex items-center gap-2"><Sparkles size={12}/> +{e.reward_xp} XP · +{e.reward_gold} 🪙</p>
                </div>
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
                  <Countdown to={e.starts_at}/>
                  <Link to={`/dashboard/events/${e.id}`}><Button size="sm" variant="outline">Detalhes</Button></Link>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-3">
                  {['going','maybe','no'].map(c => (
                    <Button key={c} size="sm" variant={rsvps[e.id]===c?'magical':'outline'} onClick={() => rsvp(e.id, c)}>
                      {c==='going'?'Vou ✓':c==='maybe'?'Talvez':'Não vou'}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}