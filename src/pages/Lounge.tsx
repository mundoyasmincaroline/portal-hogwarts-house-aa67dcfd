import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Send, Users, Trash2 } from "lucide-react";

type Scope = "club" | "room";

interface Msg {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}
interface Profile { user_id: string; username: string | null; full_name: string | null; avatar_url: string | null; house: string | null; }

export default function Lounge({ scope }: { scope: Scope }) {
  const params = useParams();
  const id = params.id as string;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [entity, setEntity] = useState<any>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const entityTable = scope === "club" ? "clubs" : "room_of_requirement";
  const membersTable = scope === "club" ? "club_members" : "room_members";
  const fkColumn = scope === "club" ? "club_id" : "room_id";

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: ent }, { data: mems }, { data: msgs }] = await Promise.all([
      (supabase as any).from(entityTable).select("*").eq("id", id).maybeSingle(),
      (supabase as any).from(membersTable).select("user_id").eq(fkColumn, id),
      (supabase as any).from("lounge_messages").select("*").eq("scope", scope).eq("scope_id", id).order("created_at", { ascending: true }).limit(200),
    ]);
    setEntity(ent);
    const memberIds = (mems ?? []).map((m: any) => m.user_id);
    setIsMember(memberIds.includes(user?.id ?? ""));
    const allIds = Array.from(new Set([...memberIds, ...((msgs ?? []).map((m: any) => m.user_id))]));
    if (allIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id,username,full_name,avatar_url,house").in("user_id", allIds);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p; });
      setProfilesById(map);
      setMembers(memberIds.map((uid: string) => map[uid]).filter(Boolean));
    } else {
      setMembers([]);
      setProfilesById({});
    }
    setMessages((msgs ?? []) as Msg[]);
  }, [id, scope, entityTable, membersTable, fkColumn, user?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`lounge_${scope}_${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lounge_messages", filter: `scope_id=eq.${id}` }, (payload) => {
        const m = payload.new as Msg;
        if ((m as any).scope !== scope) return;
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        if (!profilesById[m.user_id]) {
          supabase.from("profiles").select("user_id,username,full_name,avatar_url,house").eq("user_id", m.user_id).maybeSingle().then(({ data }) => {
            if (data) setProfilesById((p) => ({ ...p, [data.user_id]: data as Profile }));
          });
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "lounge_messages" }, (payload) => {
        setMessages((prev) => prev.filter((x) => x.id !== (payload.old as any).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, scope, profilesById]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || !user || !isMember) return;
    setSending(true);
    const { error } = await (supabase as any).from("lounge_messages").insert({ scope, scope_id: id, user_id: user.id, content: text });
    if (error) toast.error(error.message);
    else setInput("");
    setSending(false);
  };

  const removeMsg = async (mid: string) => {
    await (supabase as any).from("lounge_messages").delete().eq("id", mid);
  };

  const join = async () => {
    if (!user) return;
    if (scope === "club") {
      const { error } = await supabase.rpc("join_club", { p_club_id: id });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await (supabase as any).from("room_members").insert({ room_id: id, user_id: user.id });
      if (error) return toast.error(error.message);
    }
    toast.success("Você entrou!");
    load();
  };

  if (!entity) {
    return <div className="p-8 text-center text-foreground/60">Carregando…</div>;
  }

  const title = entity.name;
  const subtitle = scope === "club" ? entity.description : entity.description ?? "Sala precisa";
  const emblem = scope === "club" ? (entity.emblem ?? "🎩") : "🚪";

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(scope === "club" ? "/dashboard/clubs" : "/dashboard/room")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      </header>

      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-background to-card p-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{emblem}</div>
          <div className="flex-1">
            <h1 className="font-heading text-2xl text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-foreground/70 mt-1">{subtitle}</p>}
          </div>
          {!isMember && (
            <Button onClick={join}>Entrar</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
        <div className="rounded-2xl border border-border bg-card/60 flex flex-col h-[60vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-foreground/50 text-sm py-8">
                {isMember ? "Inicie a conversa! ✨" : "Entre para participar da conversa."}
              </p>
            )}
            {messages.map((m) => {
              const p = profilesById[m.user_id];
              const mine = m.user_id === user?.id;
              return (
                <div key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                  <img src={p?.avatar_url ?? "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full border border-primary/30 object-cover shrink-0" />
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? "bg-primary/20 border border-primary/30" : "bg-background/60 border border-border"}`}>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-foreground/50">
                      <span>{p?.full_name ?? p?.username ?? "Bruxo"}</span>
                      <span>·</span>
                      <span>{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      {mine && (
                        <button onClick={() => removeMsg(m.id)} className="ml-1 text-foreground/40 hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-foreground/90 whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-border p-3 flex gap-2"
          >
            <Input
              placeholder={isMember ? "Escreva uma mensagem mágica…" : "Entre para conversar"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!isMember || sending}
              maxLength={500}
            />
            <Button type="submit" disabled={!isMember || sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <aside className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/60 mb-3">
            <Users className="h-4 w-4" /> Membros ({members.length})
          </div>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {members.map((p) => (
              <div key={p.user_id} className="flex items-center gap-2 text-sm">
                <img src={p.avatar_url ?? "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full border border-primary/20 object-cover" />
                <div className="min-w-0">
                  <div className="truncate text-foreground/90">{p.full_name ?? p.username ?? "Bruxo"}</div>
                  {p.house && <div className="text-[10px] text-foreground/50 capitalize">{p.house}</div>}
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-xs text-foreground/50">Sem membros ainda.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}