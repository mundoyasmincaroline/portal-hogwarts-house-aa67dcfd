import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import RecruitmentWidget from "@/components/RecruitmentWidget";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Gift, Sparkles, Crown } from "lucide-react";
import EmojiIcon from "@/components/shared/EmojiIcon";

interface InvitedRow {
  id: string;
  status: string;
  created_at: string;
  invited?: { username: string; full_name: string; level: number; avatar_url: string | null; house: string } | null;
}

export default function Referrals() {
  const { user } = useAuth();
  const [list, setList] = useState<InvitedRow[]>([]);
  const [totals, setTotals] = useState({ invited: 0, approved: 0, galeons: 0, xp: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("referrals")
        .select("id,status,created_at,invited:invited_id(username,full_name,level,avatar_url,house)")
        .eq("inviter_id", user.id)
        .order("created_at", { ascending: false });
      const rows = (data as unknown as InvitedRow[]) || [];
      setList(rows);

      const approved = rows.filter((r) => r.status === "approved" || (r.invited?.level ?? 0) >= 2).length;
      setTotals({
        invited: rows.length,
        approved,
        galeons: approved * 100,
        xp: approved * 50,
      });
    })();
  }, [user?.id]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-2 sm:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900/30 via-background to-black border border-primary/20 p-8 sm:p-12 text-center">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="relative z-10 space-y-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1">
            <Sparkles className="mr-1" size={12} /> Programa de Recrutamento
          </Badge>
          <h1 className="font-heading text-3xl sm:text-5xl text-gold-gradient">Sistema de Indicação</h1>
          <p className="text-muted-foreground italic max-w-2xl mx-auto">
            Convide bruxos para Hogwarts e seja recompensado a cada novo aluno aprovado.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Convidados", value: totals.invited, icon: <Users size={18} />, color: "text-blue-400" },
          { label: "Aprovados", value: totals.approved, icon: <Crown size={18} />, color: "text-emerald-400" },
          { label: "Galeões Ganhos", value: totals.galeons, icon: <EmojiIcon e="🪙" />, color: "text-yellow-400" },
          { label: "XP Ganho", value: totals.xp, icon: <Sparkles size={18} />, color: "text-purple-400" },
        ].map((k, i) => (
          <Card key={i} className="p-4 bg-black/40 border-primary/10">
            <div className={`flex items-center gap-2 ${k.color}`}>
              {k.icon}
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-heading">{k.label}</span>
            </div>
            <p className="text-2xl font-heading mt-1 text-white">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Widget de compartilhamento */}
      <RecruitmentWidget />

      {/* Como funciona */}
      <Card className="p-6 sm:p-8 bg-black/30 border-primary/10 space-y-4">
        <h2 className="font-heading text-xl text-gold-gradient flex items-center gap-2">
          <Gift size={18} /> Como funciona
        </h2>
        <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
          <li>Copie seu link mágico acima e envie para amigos via WhatsApp, Instagram, TikTok ou e-mail.</li>
          <li>Quando o bruxo se matricular, ele já entra com <strong className="text-primary">+500 Galeões</strong> e um Baú Lendário de boas-vindas.</li>
          <li>Assim que ele for aprovado pela diretoria, você recebe <strong className="text-primary">+100 Galeões</strong> e <strong className="text-primary">+50 XP</strong>.</li>
          <li>A cada 5 amigos aprovados, você ganha uma medalha exclusiva no perfil.</li>
        </ol>
      </Card>

      {/* Lista de indicações */}
      <div className="space-y-3">
        <h2 className="font-heading text-xl text-foreground flex items-center gap-2">
          <Users size={18} /> Seus indicados ({list.length})
        </h2>
        {list.length === 0 ? (
          <Card className="p-10 text-center bg-black/20 border-dashed border-primary/20">
            <EmojiIcon e="🦉" />
            <p className="text-sm text-muted-foreground italic mt-3">
              Você ainda não convidou ninguém. Compartilhe seu link e comece a recrutar!
            </p>
          </Card>
        ) : (
          <div className="grid gap-2">
            {list.map((r) => (
              <Card key={r.id} className="p-4 flex items-center justify-between gap-3 bg-black/30 border-primary/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading">
                    {r.invited?.full_name?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-foreground truncate">{r.invited?.full_name || "Bruxo desconhecido"}</p>
                    <p className="text-[11px] text-muted-foreground">@{r.invited?.username || "—"} · Nv {r.invited?.level ?? 1}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    (r.invited?.level ?? 0) >= 2
                      ? "border-emerald-500/30 text-emerald-400"
                      : "border-yellow-500/30 text-yellow-400"
                  }
                >
                  {(r.invited?.level ?? 0) >= 2 ? "Recompensado" : "Aguardando Nv 2"}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}