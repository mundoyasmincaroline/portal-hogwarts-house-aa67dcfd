import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, GraduationCap, Sparkles, Check, X, LogOut } from "lucide-react";

interface Club {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  emblem: string | null;
  color: string | null;
  meeting_day: string | null;
  founded_by: string | null;
}

interface Membership { id: string; club_id: string; user_id: string; }

interface Mentor {
  user_id: string;
  username: string | null;
  full_name: string | null;
  level: number | null;
  house: string | null;
  avatar_url: string | null;
}

interface Mentorship {
  id: string;
  mentor_id: string;
  apprentice_id: string;
  status: string;
  started_at: string | null;
  apprentice_levels_gained: number;
  total_bonus_xp: number;
  mentor?: { username: string | null; full_name: string | null; level: number | null };
  apprentice?: { username: string | null; full_name: string | null; level: number | null };
}

export default function Clubs() {
  const { user, profile } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myMemberships, setMyMemberships] = useState<Membership[]>([]);
  const [allMembers, setAllMembers] = useState<Membership[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [myMentorships, setMyMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: mems }, { data: ments }] = await Promise.all([
      supabase.from("clubs").select("*").eq("active", true).order("name"),
      supabase.from("club_members").select("id,club_id,user_id"),
      supabase
        .from("mentorships")
        .select("id,mentor_id,apprentice_id,status,started_at,apprentice_levels_gained,total_bonus_xp")
        .or(`mentor_id.eq.${user?.id},apprentice_id.eq.${user?.id}`),
    ]);
    setClubs((c as any) ?? []);
    setAllMembers((mems as any) ?? []);
    setMyMemberships(((mems as any) ?? []).filter((m: Membership) => m.user_id === user?.id));

    if (ments && ments.length) {
      const ids = Array.from(new Set(ments.flatMap((m: any) => [m.mentor_id, m.apprentice_id])));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,username,full_name,level")
        .in("user_id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      setMyMentorships(
        ments.map((m: any) => ({
          ...m,
          mentor: map.get(m.mentor_id),
          apprentice: map.get(m.apprentice_id),
        }))
      );
    } else {
      setMyMentorships([]);
    }

    // Buscar mentores disponíveis (nível >= 10) só se eu sou aprendiz potencial (nível <= 5)
    if ((profile?.level ?? 1) <= 5) {
      const { data: m } = await supabase
        .from("profiles")
        .select("user_id,username,full_name,level,house,avatar_url")
        .gte("level", 10)
        .neq("user_id", user?.id ?? "")
        .limit(12);
      setMentors((m as any) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id]);

  const inClub = (clubId: string) => myMemberships.some((m) => m.club_id === clubId);
  const clubMemberCount = (clubId: string) =>
    allMembers.filter((m) => m.club_id === clubId).length;

  const handleJoin = async (clubId: string) => {
    setBusy(clubId);
    const { error } = await supabase.rpc("join_club", { p_club_id: clubId });
    if (error) toast.error(error.message);
    else { toast.success("Você entrou no clube! 🎓"); await load(); }
    setBusy(null);
  };

  const handleLeave = async (clubId: string) => {
    setBusy(clubId);
    const { error } = await supabase
      .from("club_members")
      .delete()
      .eq("club_id", clubId)
      .eq("user_id", user?.id ?? "");
    if (error) toast.error(error.message);
    else { toast.success("Você saiu do clube."); await load(); }
    setBusy(null);
  };

  const handleRequestMentor = async (mentorId: string) => {
    setBusy(mentorId);
    const { error } = await supabase.rpc("request_mentorship", { p_mentor_id: mentorId });
    if (error) toast.error(error.message);
    else { toast.success("Pedido de mentoria enviado! 🦉"); await load(); }
    setBusy(null);
  };

  const handleRespond = async (mentorshipId: string, accept: boolean) => {
    setBusy(mentorshipId);
    const { error } = await supabase.rpc("respond_mentorship", {
      p_mentorship_id: mentorshipId,
      p_accept: accept,
    });
    if (error) toast.error(error.message);
    else { toast.success(accept ? "Mentoria aceita!" : "Pedido recusado."); await load(); }
    setBusy(null);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-foreground/60">
        <Sparkles className="mr-2 h-5 w-5 animate-pulse" /> Carregando clubes…
      </div>
    );
  }

  const myLevel = profile?.level ?? 1;
  const pendingForMe = myMentorships.filter(
    (m) => m.mentor_id === user?.id && m.status === "pending"
  );
  const activeMentorship = myMentorships.find(
    (m) => m.status === "active" && (m.mentor_id === user?.id || m.apprentice_id === user?.id)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      {/* HERO */}
      <header className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-background to-card p-8 shadow-[0_0_60px_-15px_hsl(var(--primary)/0.4)]">
        <div className="flex flex-wrap items-center gap-3">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="font-heading text-3xl text-foreground">Clubes Estudantis</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          Una-se a outros bruxos com interesses em comum. Participe de até{" "}
          <strong className="text-primary">2 clubes</strong> simultaneamente e ganhe XP em atividades coletivas.
        </p>
      </header>

      {/* CLUBES */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-heading text-2xl text-foreground">Clubes disponíveis</h2>
          <span className="text-xs uppercase tracking-widest text-foreground/50">
            Você está em {myMemberships.length}/2
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const joined = inClub(club.id);
            const full = myMemberships.length >= 2 && !joined;
            return (
              <motion.article
                key={club.id}
                whileHover={{ scale: 1.02, y: -4 }}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-5 transition-all hover:border-primary/60 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]"
                style={{ borderTopColor: club.color ?? undefined, borderTopWidth: 4 }}
              >
                <div className="flex items-start justify-between">
                  <div className="text-4xl">{club.emblem ?? "🎩"}</div>
                  <span className="text-xs text-foreground/50">
                    {clubMemberCount(club.id)} membros
                  </span>
                </div>
                <h3 className="mt-3 font-heading text-lg text-foreground">{club.name}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-foreground/70">{club.description}</p>
                <div className="mt-3 space-y-1 text-xs text-foreground/50">
                  {club.meeting_day && <div>📅 {club.meeting_day}</div>}
                  {club.founded_by && <div>👤 {club.founded_by}</div>}
                </div>
                <div className="mt-4">
                  {joined ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleLeave(club.id)}
                      disabled={busy === club.id}
                    >
                      <LogOut className="mr-1 h-3 w-3" /> Sair do clube
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleJoin(club.id)}
                      disabled={busy === club.id || full}
                    >
                      {full ? "Limite atingido" : "Ingressar"}
                    </Button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* MENTORIA */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h2 className="font-heading text-2xl text-foreground">Mentoria Bruxa</h2>
        </div>
        <p className="text-sm text-foreground/70">
          Bruxos veteranos (nível 10+) podem apadrinhar aprendizes (nível ≤5). Quando o aprendiz
          sobe de nível, <strong className="text-primary">ambos ganham +25 XP de bônus</strong>.
        </p>

        {/* Mentoria ativa */}
        {activeMentorship && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-5 relative overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
            <div className="text-xs uppercase tracking-widest text-primary">
              {activeMentorship.mentor_id === user?.id ? "Você é mentor de" : "Seu mentor"}
            </div>
            <div className="mt-1 font-heading text-lg">
              {activeMentorship.mentor_id === user?.id
                ? activeMentorship.apprentice?.full_name ?? activeMentorship.apprentice?.username
                : activeMentorship.mentor?.full_name ?? activeMentorship.mentor?.username}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-background/50 p-3">
                <div className="text-xs text-foreground/60">Níveis evoluídos</div>
                <div className="font-heading text-xl text-primary">
                  {activeMentorship.apprentice_levels_gained}
                </div>
              </div>
              <div className="rounded-lg bg-background/50 p-3 border border-primary/10 group-hover:border-primary/30 transition-colors">
                <div className="text-[10px] uppercase tracking-wider text-foreground/40 mb-1">XP bônus total</div>
                <div className="font-heading text-2xl text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]">
                  +{activeMentorship.total_bonus_xp}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pedidos pendentes para mim como mentor */}
        {pendingForMe.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-heading text-sm uppercase tracking-widest text-foreground/60">
              Pedidos recebidos
            </h3>
            {pendingForMe.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <div className="font-heading">
                    {m.apprentice?.full_name ?? m.apprentice?.username ?? "Aprendiz"}
                  </div>
                  <div className="text-xs text-foreground/60">Nível {m.apprentice?.level ?? 1}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRespond(m.id, true)}
                    disabled={busy === m.id}
                  >
                    <Check className="mr-1 h-3 w-3" /> Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(m.id, false)}
                    disabled={busy === m.id}
                  >
                    <X className="mr-1 h-3 w-3" /> Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de mentores para aprendizes */}
        {myLevel <= 5 && !activeMentorship && (
          <div className="space-y-3">
            <h3 className="font-heading text-sm uppercase tracking-widest text-foreground/60">
              Mentores disponíveis
            </h3>
            {mentors.length === 0 ? (
              <p className="text-sm text-foreground/60">
                Nenhum mentor de nível 10+ disponível no momento.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {mentors.map((m) => {
                  const alreadyRequested = myMentorships.some(
                    (x) => x.mentor_id === m.user_id && x.status === "pending"
                  );
                  return (
                    <div
                      key={m.user_id}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={m.avatar_url ?? "/placeholder.svg"}
                          alt=""
                          className="h-12 w-12 rounded-full border border-primary/40 object-cover"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-heading">
                            {m.full_name ?? m.username}
                          </div>
                          <div className="text-xs text-foreground/60">
                            Nível {m.level} · {m.house}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="mt-3 w-full bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30"
                        onClick={() => handleRequestMentor(m.user_id)}
                        disabled={busy === m.user_id || alreadyRequested}
                      >
                        {alreadyRequested ? "Pedido enviado" : "Pedir mentoria"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {myLevel > 5 && !activeMentorship && pendingForMe.length === 0 && (
          <p className="rounded-lg border border-border bg-card/50 p-4 text-sm text-foreground/60">
            Como bruxo experiente, você pode aguardar pedidos de aprendizes ou seguir crescendo.
          </p>
        )}
      </section>
    </div>
  );
}