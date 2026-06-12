import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Users, Sparkles, Shirt } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [outfitId, setOutfitId] = useState<string>("");
  const [showOutfitPicker, setShowOutfitPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const myRsvp = attendees.find(a => a.user_id === user?.id);

  const load = async () => {
    const { data: e } = await supabase.from("live_events").select("*").eq("id", id).maybeSingle();
    setEvent(e);
    const { data: a } = await supabase.from("event_attendees").select("*").eq("event_id", id);
    setAttendees(a ?? []);
    const { data: m } = await supabase.from("event_chat").select("*").eq("event_id", id).order("created_at");
    setMessages(m ?? []);
    if (user) {
      const { data: inv } = await supabase
        .from("user_inventory")
        .select("id, item_type, item_id, quantity")
        .eq("user_id", user.id);
      setInventory(inv ?? []);
      const existing = (a ?? []).find((x: any) => x.user_id === user.id);
      if (existing?.outfit_item_id) setOutfitId(existing.outfit_item_id);
    }
  };
  useEffect(() => { if (id) load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`event-${id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'event_chat', filter:`event_id=eq.${id}` }, (p:any) => {
        setMessages(m => [...m, p.new]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior:'smooth' }); }, [messages]);

  const send = async () => {
    if (!user || !text.trim()) return;
    if (!myRsvp) return toast.error("Confirme presença antes de conversar");
    const { error } = await supabase.from("event_chat").insert([{ event_id: id, user_id: user.id, message: text.trim() }] as any);
    if (error) return toast.error(error.message);
    setText("");
  };

  const rsvp = async (chosenOutfitId?: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("event_attendees")
      .upsert([{ event_id: id, user_id: user.id, rsvp: 'going', outfit_item_id: chosenOutfitId ?? outfitId ?? null }] as any, { onConflict: 'event_id,user_id' });
    if (error) return toast.error(error.message);
    toast.success(chosenOutfitId || outfitId ? "Presença confirmada — vestido a caráter! 👔✨" : "Presença confirmada ✨");
    setShowOutfitPicker(false);
    load();
  };

  if (!event) return <div className="container mx-auto py-10 text-center text-muted-foreground">Carregando...</div>;

  const going = attendees.filter(a => a.rsvp === 'going');
  const live = new Date(event.starts_at).getTime() <= Date.now() && new Date(event.ends_at).getTime() > Date.now();

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Link to="/dashboard/live-events" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4"><ArrowLeft size={14}/>Todos os eventos</Link>

      <div className="glass-premium rounded-2xl p-6 mb-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="text-6xl">{event.cover_emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-3xl text-gold-gradient">{event.title}</h1>
              {live && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">AO VIVO</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              <Badge variant="outline">{event.location}</Badge>
              <Badge variant="outline">{new Date(event.starts_at).toLocaleString("pt-BR")}</Badge>
              <Badge className="bg-primary/20 text-primary border-primary/30"><Sparkles size={10} className="mr-1"/>+{event.reward_xp} XP</Badge>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">+{event.reward_gold} 🪙</Badge>
            </div>
          </div>
          {!myRsvp && user && (
            <div className="flex flex-col gap-2 items-end">
              {showOutfitPicker && inventory.length > 0 ? (
                <div className="flex gap-2 items-center flex-wrap">
                  <Select value={outfitId} onValueChange={setOutfitId}>
                    <SelectTrigger className="w-56 text-xs">
                      <SelectValue placeholder="Escolher traje do inventário..." />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map((item: any) => (
                        <SelectItem key={item.id} value={item.id}>
                          👔 {item.item_type ?? "Item"} {item.quantity > 1 ? `×${item.quantity}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="magical" onClick={() => rsvp(outfitId)}>Confirmar</Button>
                  <Button variant="ghost" size="sm" onClick={() => rsvp()}>Sem traje</Button>
                </div>
              ) : (
                <Button variant="magical" onClick={() => inventory.length > 0 ? setShowOutfitPicker(true) : rsvp()}>
                  <Shirt size={14} className="mr-2" /> Confirmar Presença
                </Button>
              )}
            </div>
          )}
          {myRsvp && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              ✅ Confirmado{myRsvp.outfit_item_id ? " · 👔 Vestido a caráter" : ""}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-4">
        {/* Chat */}
        <div className="glass-premium rounded-2xl p-4 flex flex-col h-[500px]">
          <h2 className="font-heading text-sm text-gold-gradient mb-2">Chat do Evento {live && '· AO VIVO'}</h2>
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-2">
            {messages.length === 0 ? <p className="text-xs text-muted-foreground text-center py-10">Seja o primeiro a comentar <EmojiIcon e="✨" /></p> :
              messages.map(m => (
                <div key={m.id} className={`p-2 rounded-lg ${m.user_id===user?.id?'bg-primary/10 ml-8':'bg-secondary/30 mr-8'}`}>
                  <p className="text-[10px] text-primary font-heading">{m.user_id.slice(0,8)}</p>
                  <p className="text-sm">{m.message}</p>
                </div>
              ))
            }
          </div>
          {myRsvp ? (
            <div className="flex gap-2 mt-3">
              <Input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Mensagem..." maxLength={300}/>
              <Button onClick={send} size="icon" variant="magical"><Send size={16}/></Button>
            </div>
          ) : <p className="text-xs text-muted-foreground text-center mt-3">Confirme presença para participar do chat</p>}
        </div>

        {/* Attendees */}
        <div className="glass-premium rounded-2xl p-4">
          <h2 className="font-heading text-sm text-gold-gradient mb-3 flex items-center gap-2"><Users size={14}/> {going.length} confirmados</h2>
          <div className="space-y-1 max-h-[440px] overflow-y-auto">
            {going.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded bg-secondary/30">
                <span className="truncate">{a.user_id.slice(0,8)}...</span>
                {a.outfit_item_id && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] px-1.5 shrink-0">
                    👔 Vestido
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}