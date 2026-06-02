import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserPlus, Check, X, Ban, Trash2, Users } from "lucide-react";

interface FriendRow {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  other?: {
    user_id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    house: string;
    level: number;
  } | null;
}

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (!data) { setRows([]); setLoading(false); return; }

    const otherIds = Array.from(new Set(
      data.map((r: any) => (r.user_id === user.id ? r.friend_id : r.user_id))
    ));
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, avatar_url, house, level")
      .in("user_id", otherIds);

    const map = new Map((profs || []).map((p: any) => [p.user_id, p]));
    setRows(
      (data as any[]).map((r) => ({
        ...r,
        other: map.get(r.user_id === user.id ? r.friend_id : r.user_id) || null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const accept = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    setProcessingId(null);
    if (error) return toast.error("Erro ao aceitar.");
    toast.success("Pedido aceito! ✨");
    load();
  };

  const reject = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    setProcessingId(null);
    if (error) return toast.error("Erro ao recusar.");
    toast.success("Pedido recusado.");
    load();
  };

  const remove = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    setProcessingId(null);
    if (error) return toast.error("Erro ao remover.");
    toast.success("Removido.");
    load();
  };

  const block = async (otherUserId: string, existingId?: string) => {
    if (!user) return;
    if (existingId) {
      await supabase.from("friendships").delete().eq("id", existingId);
    }
    const { error } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: otherUserId,
      status: "blocked",
    });
    if (error) return toast.error("Erro ao bloquear.");
    toast.success("Usuário bloqueado. 🚫");
    load();
  };

  const unblock = async (id: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) return toast.error("Erro ao desbloquear.");
    toast.success("Desbloqueado.");
    load();
  };

  if (!user) return null;

  const friends = rows.filter((r) => r.status === "accepted");
  const incoming = rows.filter((r) => r.status === "pending" && r.friend_id === user.id);
  const outgoing = rows.filter((r) => r.status === "pending" && r.user_id === user.id);
  const blocked = rows.filter((r) => r.status === "blocked" && r.user_id === user.id);

  const Card = ({ row, actions }: { row: FriendRow; actions: React.ReactNode }) => (
    <div className="glass rounded-xl p-4 flex items-center gap-3 border border-border/50">
      <button
        onClick={() => row.other && navigate(`/dashboard/profile/${row.other.user_id}`)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        {row.other?.avatar_url ? (
          <img src={row.other.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-heading text-lg">
            {row.other?.full_name?.[0] || "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm truncate">{row.other?.full_name || "Bruxo desconhecido"}</p>
          <p className="text-xs text-muted-foreground truncate">
            @{row.other?.username} • Nv. {row.other?.level} • {row.other?.house}
          </p>
        </div>
      </button>
      <div className="flex gap-2 shrink-0">{actions}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 px-2 sm:px-0">
      <div className="glass rounded-2xl p-5 sm:p-6 border border-primary/20">
        <h1 className="font-heading text-2xl sm:text-3xl text-gold-gradient flex items-center gap-3">
          <Users /> Meus Amigos
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Gerencie seus pedidos, amigos e bloqueios.
        </p>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="friends" className="text-[10px] sm:text-sm px-1">Amigos ({friends.length})</TabsTrigger>
          <TabsTrigger value="incoming" className="text-[10px] sm:text-sm px-1">Pedidos ({incoming.length})</TabsTrigger>
          <TabsTrigger value="outgoing" className="text-[10px] sm:text-sm px-1">Enviados ({outgoing.length})</TabsTrigger>
          <TabsTrigger value="blocked" className="text-[10px] sm:text-sm px-1">Bloqueados ({blocked.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-2 mt-4">
          {loading && <p className="text-center text-muted-foreground">Carregando...</p>}
          {!loading && friends.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum amigo ainda.</p>}
          {friends.map((r) => (
            <Card key={r.id} row={r} actions={
              <>
                <Button size="sm" variant="outline" onClick={() => { if (confirm("Remover amizade?")) remove(r.id); }}>
                  <Trash2 size={14} />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => { if (r.other && confirm("Bloquear este usuário?")) block(r.other.user_id, r.id); }}>
                  <Ban size={14} />
                </Button>
              </>
            } />
          ))}
        </TabsContent>

        <TabsContent value="incoming" className="space-y-2 mt-4">
          {!loading && incoming.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum pedido recebido.</p>}
          {incoming.map((r) => (
            <Card key={r.id} row={r} actions={
              <>
                <Button size="sm" variant="magical" onClick={() => accept(r.id)}>
                  <Check size={14} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => reject(r.id)}>
                  <X size={14} />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => r.other && block(r.other.user_id, r.id)}>
                  <Ban size={14} />
                </Button>
              </>
            } />
          ))}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-2 mt-4">
          {!loading && outgoing.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum pedido enviado.</p>}
          {outgoing.map((r) => (
            <Card key={r.id} row={r} actions={
              <Button size="sm" variant="outline" onClick={() => remove(r.id)}>
                Cancelar
              </Button>
            } />
          ))}
        </TabsContent>

        <TabsContent value="blocked" className="space-y-2 mt-4">
          {!loading && blocked.length === 0 && <p className="text-center text-muted-foreground py-8">Ninguém bloqueado.</p>}
          {blocked.map((r) => (
            <Card key={r.id} row={r} actions={
              <Button size="sm" variant="outline" onClick={() => unblock(r.id)}>
                Desbloquear
              </Button>
            } />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
