import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy, Mail, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import EmojiIcon from "@/components/shared/EmojiIcon";


interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
  user_id: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  aberto: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  em_andamento: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  resolvido: "bg-green-500/20 text-green-400 border-green-500/40",
  fechado: "bg-muted text-muted-foreground border-border",
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [responses, setResponses] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    setTickets((data ?? []) as Ticket[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status } as any)
      .eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success("Status atualizado");
    load();
  };

  const deleteTicket = async (id: string) => {
    if (!confirm("Excluir este chamado?")) return;
    const { error } = await supabase.from("support_tickets").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Chamado excluído");
    load();
  };

  const markAsSpam = async (id: string) => {
    const { error } = await supabase.from("support_tickets").update({ status: "fechado", priority: "low" } as any).eq("id", id);
    if (error) return toast.error("Erro ao marcar como spam");
    toast.success("Marcado como spam");
    load();
  };

  const sendResponse = async (ticket: Ticket) => {

    const text = (responses[ticket.id] ?? "").trim();
    if (text.length < 5) return toast.error("Resposta muito curta");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("support_tickets")
      .update({
        admin_response: text,
        responded_at: new Date().toISOString(),
        responded_by: user?.id,
        status: "resolvido",
      } as any)
      .eq("id", ticket.id);
    if (error) return toast.error("Erro ao enviar resposta");
    toast.success("Resposta enviada!");
    setResponses(r => ({ ...r, [ticket.id]: "" }));
    load();
  };

  const filtered = filter === "todos" ? tickets : tickets.filter(t => t.status === filter);

  const stats = {
    aberto: tickets.filter(t => t.status === "aberto").length,
    em_andamento: tickets.filter(t => t.status === "em_andamento").length,
    resolvido: tickets.filter(t => t.status === "resolvido").length,
    total: tickets.length,
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <LifeBuoy className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-gold-gradient">Central de Suporte</h1>
          <p className="text-sm text-muted-foreground">Gerencie chamados dos usuários</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Abertos", value: stats.aberto, icon: Clock, color: "text-yellow-400" },
          { label: "Em andamento", value: stats.em_andamento, icon: MessageSquare, color: "text-blue-400" },
          { label: "Resolvidos", value: stats.resolvido, icon: CheckCircle2, color: "text-green-400" },
          { label: "Total", value: stats.total, icon: Mail, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="glass-premium rounded-xl p-4 border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} className={s.color} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-heading text-gold-gradient">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="aberto">Abertos</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="resolvido">Resolvidos</SelectItem>
            <SelectItem value="fechado">Fechados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-10">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-premium rounded-2xl">
          <LifeBuoy className="mx-auto text-muted-foreground mb-3" size={40} />
          <p className="text-muted-foreground">Nenhum chamado encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(t => (
            <div key={t.id} className="glass-premium rounded-2xl p-5 border-border/50">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-heading text-lg text-foreground">{t.subject}</h3>
                    <Badge className={STATUS_COLORS[t.status]}>{t.status.replace("_", " ")}</Badge>
                    <Badge variant="outline">{t.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.name} · <a href={`mailto:${t.email}`} className="hover:text-primary">{t.email}</a> · {new Date(t.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                  <div className="flex gap-2">
                    <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberto">Aberto</SelectItem>
                        <SelectItem value="em_andamento">Em andamento</SelectItem>
                        <SelectItem value="resolvido">Resolvido</SelectItem>
                        <SelectItem value="fechado">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteTicket(t.id)}>
                      <EmojiIcon e="🗑️" />
                    </Button>
                  </div>

              </div>

              <div className="bg-secondary/30 rounded-lg p-3 text-sm text-foreground/90 whitespace-pre-wrap mb-3">
                {t.message}
              </div>

              {t.admin_response ? (
                <div className="bg-primary/5 border-l-2 border-primary rounded-r-lg p-3 text-sm">
                  <p className="text-xs text-primary font-heading mb-1">Resposta enviada:</p>
                  <p className="text-foreground/90 whitespace-pre-wrap">{t.admin_response}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t.responded_at && new Date(t.responded_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    value={responses[t.id] ?? ""}
                    onChange={(e) => setResponses(r => ({ ...r, [t.id]: e.target.value }))}
                    placeholder="Escreva uma resposta para o usuário..."
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="magical" onClick={() => sendResponse(t)}>
                      Enviar resposta & marcar como resolvido
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => markAsSpam(t.id)}>
                      Marcar como Spam
                    </Button>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}