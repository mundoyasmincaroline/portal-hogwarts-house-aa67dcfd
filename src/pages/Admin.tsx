import { useState, useEffect } from "react";
import { useAuth, isUserOnline } from "@/lib/auth";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HouseCrest from "@/components/HouseCrest";
import { toast } from "sonner";

type Tab = "members" | "pending_members" | "challenges" | "houses" | "fichas" | "tasks" | "banned" | "channels" | "monetization" | "moderation" | "filch";

interface MemberProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  age: number;
  house: House;
  level: number;
  xp: number;
  approved: boolean;
  online: boolean;
  last_seen?: string;
}

interface ChallengeRow {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  type: string;
  active: boolean;
  question?: string;
  correct_answer?: string;
}

interface ModLog {
  id: string;
  user_id: string | null;
  content_type: string;
  original_content: string;
  reason: string;
  action: string;
  created_at: string;
}

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [logs, setLogs] = useState<ModLog[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<MemberProfile[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [bannedWords, setBannedWords] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCh, setNewCh] = useState({ title: "", description: "", xp_reward: 50, type: "daily", question: "", correct_answer: "" });
  const [newWord, setNewWord] = useState("");
  const [adForm, setAdForm] = useState({ title: "", link: "", image_url: "" });
  const [adFormType, setAdFormType] = useState("feed");
  const [interstitialConfig, setInterstitialConfig] = useState({ enabled: false, interval_minutes: 5 });

  const fetchAll = async () => {
    const [
      { data: m }, { data: pm }, { data: c }, { data: l }, { data: f },
      { data: pt }, { data: bw }, { data: ch }, { data: adsData }
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("approved", true).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("approved", false).order("created_at", { ascending: false }),
      supabase.from("challenges").select("*").order("created_at", { ascending: false }),
      supabase.from("moderation_log").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("fichas").select("*, profiles(full_name, username)").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("user_challenges").select("*, profiles(full_name, username), challenges(title, xp_reward)").eq("status", "pending").order("completed_at", { ascending: false }),
      supabase.from("banned_words").select("*").order("created_at", { ascending: false }),
      supabase.from("channels").select("*").order("name"),
      supabase.from("ads").select("*").order("created_at", { ascending: false })
    ]);
    if (m) setMembers(m as unknown as MemberProfile[]);
    if (pm) setPendingMembers(pm as unknown as MemberProfile[]);
    if (c) setChallenges(c as ChallengeRow[]);
    if (l) setLogs(l as ModLog[]);
    if (f) setFichas(f);
    if (pt) setPendingTasks(pt);
    if (bw) setBannedWords(bw);
    if (ch) setChannels(ch);
    if (adsData) setAds(adsData);
    const { data: s } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "interstitial_config").single();
    if (s) setInterstitialConfig(s.setting_value as any);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchAll();
    else setLoading(false);
  }, [isAdmin]);

  const createChallenge = async () => {
    if (!newCh.title.trim() || !user) return;
    const { error } = await supabase.from("challenges").insert({
      title: newCh.title,
      description: newCh.description,
      xp_reward: newCh.xp_reward,
      type: newCh.type,
      question: newCh.question,
      correct_answer: newCh.correct_answer,
      created_by: user.id,
      active: true,
    } as never);
    if (error) { toast.error(error.message); return; }
    toast.success("Desafio criado!");
    setNewCh({ title: "", description: "", xp_reward: 50, type: "daily", question: "", correct_answer: "" });
    fetchAll();
  };

  const toggleChallenge = async (c: ChallengeRow) => {
    await supabase.from("challenges").update({ active: !c.active } as never).eq("id", c.id);
    fetchAll();
  };

  const updateInterstitialConfig = async (updates: any) => {
    const newConfig = { ...interstitialConfig, ...updates };
    setInterstitialConfig(newConfig);
    await supabase.from("site_settings").upsert({ setting_key: "interstitial_config", setting_value: newConfig } as never);
    toast.success("Configurações atualizadas!");
  };

  const createAd = async () => {
    if (!adForm.title || !adForm.link) return;
    const { error } = await supabase.from("ads").insert([adForm]);
    if (!error) {
      toast.success("Anúncio criado com sucesso!");
      setAdForm({ title: "", link: "", image_url: "" });
    setAdFormType("feed");
      fetchAll();
    } else {
      toast.error(error.message);
    }
  };

  const toggleAd = async (id: string, active: boolean) => {
    await supabase.from("ads").update({ active: !active }).eq("id", id);
    fetchAll();
  };

  const deleteAd = async (id: string) => {
    await supabase.from("ads").delete().eq("id", id);
    fetchAll();
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="font-heading text-xl text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground text-sm">Apenas administradores podem acessar esta área.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "members", label: "Membros", icon: "👥" },
    { id: "pending_members", label: "Novos Membros", icon: "⏳" },
    { id: "challenges", label: "Desafios", icon: "⚔️" },
    { id: "houses", label: "Casas", icon: "🏰" },
    { id: "tasks", label: "Tarefas", icon: "✅" },
    { id: "banned", label: "Filtro Chat", icon: "🚫" },
    { id: "channels", label: "Salas/Meet", icon: "📹" },
    { id: "monetization", label: "Monetização", icon: "💰" },
    { id: "moderation", label: "Moderação", icon: "👁️" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6">
        <h1 className="font-heading text-2xl text-gold-gradient mb-1">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm">Gerencie o Portal Hogwarts House</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-primary">{members.length}</p>
          <p className="text-xs text-muted-foreground">Membros</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <h3 className="text-muted-foreground text-sm font-heading mb-2">Usuários Online</h3>
          <p className="text-2xl font-heading text-foreground">{members.filter((m) => isUserOnline(m)).length}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{challenges.filter((c) => c.active).length}</p>
          <p className="text-xs text-muted-foreground">Desafios ativos</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{logs.length}</p>
          <p className="text-xs text-muted-foreground">Bloqueios Filch</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-10">Carregando...</p>
      ) : (
        <>
          {tab === "members" && (
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="glass rounded-xl p-4 flex items-center gap-4">
                  <div className="relative">
                    <HouseCrest house={m.house} size="sm" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${isUserOnline(m) ? "bg-green-500" : "bg-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-heading text-foreground">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{m.username} • {m.age} anos • {m.xp} XP</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isUserOnline(m) ? (
                      <span className="text-xs text-green-500 font-medium">🟢 Online</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">⚪ Offline</span>
                    )}
                    {m.last_seen ? (
                      <span className="text-[10px] text-muted-foreground/70">
                        Último login: {new Date(m.last_seen).toLocaleString('pt-BR')}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">
                        Nunca acessou
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "pending_members" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4">
                <h3 className="font-heading text-sm text-primary mb-1">⏳ Novos Membros Pendentes</h3>
                <p className="text-xs text-muted-foreground">Aprove a entrada dos novos bruxos no portal.</p>
              </div>
              {pendingMembers.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <p className="text-muted-foreground text-sm">Nenhum membro aguardando aprovação.</p>
                </div>
              ) : (
                pendingMembers.map((m) => (
                  <div key={m.id} className="glass rounded-xl p-4 flex items-center gap-4">
                    <div className="relative">
                      <HouseCrest house={m.house} size="sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-heading text-foreground">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{m.username} • {m.age} anos</p>
                    </div>@{m.username} â€¢ {m.age} anos</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-destructive border-destructive" onClick={async () => {
                        await supabase.from("profiles").delete().eq("user_id", m.user_id);
                        toast.success("Membro rejeitado.");
                        fetchAll();
                      }}>Rejeitar</Button>
                      <Button variant="magical" size="sm" onClick={async () => {
                        await supabase.from("profiles").update({ approved: true }).eq("user_id", m.user_id);
                        toast.success("Membro aprovado!");
                        fetchAll();
                      }}>Aprovar âœ…</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "challenges" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4 space-y-3">
                <h3 className="font-heading text-sm text-primary">➕ Criar novo desafio</h3>
                <Input placeholder="Título" value={newCh.title} onChange={(e) => setNewCh({ ...newCh, title: e.target.value })} />
                <Input placeholder="Descrição" value={newCh.description} onChange={(e) => setNewCh({ ...newCh, description: e.target.value })} />
                <Input placeholder="Pergunta do Quiz (Opcional)" value={newCh.question} onChange={(e) => setNewCh({ ...newCh, question: e.target.value })} />
                <Input placeholder="Resposta Correta (Opcional)" value={newCh.correct_answer} onChange={(e) => setNewCh({ ...newCh, correct_answer: e.target.value })} />
                <div className="flex gap-2">
                  <Input type="number" placeholder="XP" value={newCh.xp_reward} onChange={(e) => setNewCh({ ...newCh, xp_reward: parseInt(e.target.value) || 0 })} />
                  <select value={newCh.type} onChange={(e) => setNewCh({ ...newCh, type: e.target.value })} className="bg-secondary/50 rounded-md px-3 text-sm text-foreground border border-border">
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="special">Especial</option>
                  </select>
                  <Button variant="magical" size="sm" onClick={createChallenge}>Criar</Button>
                </div>
              </div>
              {challenges.map((c) => (
                <div key={c.id} className="glass rounded-xl p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-heading text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.xp_reward} XP • {c.type} • {c.active ? "Ativo" : "Inativo"}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggleChallenge(c)}>
                    {c.active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {tab === "houses" && (
            <div className="grid md:grid-cols-2 gap-4">
              {Object.values(HOUSES).map((h) => {
                const count = members.filter((m) => m.house === h.id).length;
                return (
                  <div key={h.id} className="glass rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <HouseCrest house={h.id as House} size="md" />
                      <div>
                        <p className="font-heading text-foreground">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{count} membros</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "filch" && (
            <div className="space-y-3">
              <div className="glass rounded-xl p-4">
                <h3 className="font-heading text-sm text-primary mb-1">🧹 Filch, o Zelador</h3>
                <p className="text-xs text-muted-foreground">Bot de moderação que bloqueia automaticamente palavras impróprias em posts e comentários.</p>
              </div>
              {logs.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl mb-3">✨</div>
                  <p className="text-muted-foreground text-sm">Nenhum bloqueio registrado. O castelo está em paz!</p>
                </div>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="glass rounded-xl p-4 border-l-2 border-destructive">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-heading text-destructive">{l.action.toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{l.reason}</p>
                    <p className="text-xs text-foreground italic">"{l.original_content}"</p>
                    <p className="text-xs text-muted-foreground mt-1">Tipo: {l.content_type}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "fichas" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4">
                <h3 className="font-heading text-sm text-primary mb-1">📜 Fichas Pendentes</h3>
                <p className="text-xs text-muted-foreground">Analise as fichas de RPG submetidas pelos membros.</p>
              </div>
              {fichas.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl mb-3">✨</div>
                  <p className="text-muted-foreground text-sm">Nenhuma ficha pendente de aprovação.</p>
                </div>
              ) : (
                fichas.map((f) => (
                  <div key={f.id} className="glass rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-start border-b border-border pb-3">
                      <div>
                        <h4 className="font-heading text-lg text-foreground">{f.character_name}</h4>
                        <p className="text-xs text-muted-foreground">Submetido por @{f.profiles?.username} ({f.profiles?.full_name})</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={async () => {
                          await supabase.from("fichas").update({ status: "rejected" }).eq("id", f.id);
                          toast.success("Ficha rejeitada.");
                          fetchAll();
                        }}>Rejeitar</Button>
                        <Button variant="magical" size="sm" onClick={async () => {
                          await supabase.from("fichas").update({ status: "approved" }).eq("id", f.id);
                          toast.success("Ficha aprovada!");
                          fetchAll();
                        }}>Aprovar ✅</Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><span className="text-muted-foreground">Idade:</span> {f.age}</p>
                      <p><span className="text-muted-foreground">Ano:</span> {f.school_year}º</p>
                      <p><span className="text-muted-foreground">Casa:</span> {HOUSES[f.primary_house as House]?.name}</p>
                      <p><span className="text-muted-foreground">Status Sanguíneo:</span> {f.blood_status}</p>
                      <p><span className="text-muted-foreground">Varinha:</span> {f.wand}</p>
                      <p><span className="text-muted-foreground">Patrono:</span> {f.patronus}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs font-heading text-muted-foreground">História:</span>
                      <p className="text-sm bg-secondary/30 p-3 rounded-md mt-1 italic text-foreground/80">{f.history}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "tasks" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4">
                <h3 className="font-heading text-sm text-primary mb-1">✅ Aprovação de Tarefas</h3>
                <p className="text-xs text-muted-foreground">Avalie as comprovações enviadas pelos membros e libere o XP.</p>
              </div>
              {pendingTasks.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <p className="text-muted-foreground text-sm">Nenhuma tarefa pendente de aprovação.</p>
                </div>
              ) : (
                pendingTasks.map((t) => (
                  <div key={`${t.user_id}-${t.challenge_id}`} className="glass rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-start border-b border-border pb-3">
                      <div>
                        <h4 className="font-heading text-lg text-foreground">{t.challenges?.title}</h4>
                        <p className="text-xs text-muted-foreground">Enviado por @{t.profiles?.username} • <span className="text-primary">{t.challenges?.xp_reward} XP</span></p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-destructive border-destructive" onClick={async () => {
                          await supabase.from("user_challenges").update({ status: "rejected" }).eq("user_id", t.user_id).eq("challenge_id", t.challenge_id);
                          toast.success("Tarefa rejeitada.");
                          fetchAll();
                        }}>Rejeitar</Button>
                        <Button variant="magical" size="sm" onClick={async () => {
                          await supabase.from("user_challenges").update({ status: "approved", completed: true }).eq("user_id", t.user_id).eq("challenge_id", t.challenge_id);
                          // Give XP
                          const { data: prof } = await supabase.from("profiles").select("xp, house").eq("user_id", t.user_id).single();
                          if (prof) {
                            await supabase.from("profiles").update({ xp: prof.xp + t.challenges.xp_reward }).eq("user_id", t.user_id);
                            await supabase.from("house_points").insert({ house: prof.house, points: t.challenges.xp_reward, reason: `Tarefa aprovada: ${t.challenges.title}`, awarded_by: user?.id } as never);
                          }
                          toast.success("Tarefa aprovada!");
                          fetchAll();
                        }}>Aprovar ✅</Button>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-heading text-muted-foreground">Comprovação:</span>
                      <div className="text-sm bg-secondary/30 p-3 rounded-md mt-1 italic text-foreground/80 break-words whitespace-pre-wrap">
                        {t.proof?.includes("http") ? <a href={t.proof} target="_blank" className="text-primary hover:underline">{t.proof}</a> : t.proof}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "banned" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4 flex gap-2">
                <Input placeholder="Nova palavra proibida" value={newWord} onChange={(e) => setNewWord(e.target.value)} />
                <Button variant="magical" onClick={async () => {
                  if (!newWord.trim()) return;
                  await supabase.from("banned_words").insert({ word: newWord.toLowerCase().trim() });
                  setNewWord("");
                  fetchAll();
                  toast.success("Palavra adicionada!");
                }}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {bannedWords.map(bw => (
                  <div key={bw.id} className="bg-secondary px-3 py-1.5 rounded-full flex items-center gap-2 text-sm border border-border">
                    <span className="text-destructive font-mono">{bw.word}</span>
                    <button onClick={async () => {
                      await supabase.from("banned_words").delete().eq("id", bw.id);
                      fetchAll();
                    }} className="text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                ))}
                {bannedWords.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma palavra cadastrada.</p>}
              </div>
            </div>
          )}

          {tab === "channels" && (
            <div className="space-y-4">
              {channels.map((c) => (
                <div key={c.id} className="glass rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-heading text-lg text-foreground flex items-center gap-2">
                        {c.name} {c.is_premium && <span className="text-xl">✨</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-heading">
                      <input type="checkbox" checked={c.is_premium} onChange={async (e) => {
                        await supabase.from("channels").update({ is_premium: e.target.checked }).eq("id", c.id);
                        fetchAll();
                        toast.success("Status premium atualizado!");
                      }} className="accent-primary" />
                      Premium / Brilho
                    </label>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">Link do Meet / Jitsi (Transmissão)</span>
                    <div className="flex gap-2">
                      <Input defaultValue={c.meet_link || ""} placeholder="https://meet.jit.si/HogwartsRoom" onBlur={async (e) => {
                        if (e.target.value === c.meet_link) return;
                        await supabase.from("channels").update({ meet_link: e.target.value || null }).eq("id", c.id);
                        toast.success("Link do Meet salvo!");
                        fetchAll();
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "monetization" && (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h2 className="font-heading text-xl text-primary mb-4">Adicionar Oferta (TikTok Shop)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Título (Ex: Pelúcia Harry Potter)"
                    value={adForm.title}
                    onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                  />
                  <Input
                    placeholder="Link de Afiliado do TikTok"
                    value={adForm.link}
                    onChange={(e) => setAdForm({ ...adForm, link: e.target.value })}
                  />
                  <Input
                    placeholder="URL da Imagem (Link da foto)"
                    value={adForm.image_url}
                    onChange={(e) => setAdForm({ ...adForm, image_url: e.target.value })}
                  />
                </div>
                <Button onClick={createAd} variant="magical" className="mt-4 w-full">
                  Publicar Anúncio Mágico
                </Button>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="font-heading text-xl text-foreground mb-4">Anúncios Ativos</h2>
                <div className="space-y-4">
                  {ads.map((ad) => (
                    <div key={ad.id} className="bg-card/50 rounded-xl p-4 flex items-center justify-between gap-4 border border-border">
                      {ad.image_url && <img src={ad.image_url} alt="Ad" className="w-12 h-12 object-cover rounded-md" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{ad.title}</p>
<span className="text-[10px] uppercase bg-secondary px-2 py-0.5 rounded text-muted-foreground">{ad.ad_type}</span>
                        <a href={ad.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate block">{ad.link}</a>
                      </div>
                      <div className="flex gap-2">
                        <Button variant={ad.active ? "default" : "secondary"} size="sm" onClick={() => toggleAd(ad.id, ad.active)}>
                          {ad.active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteAd(ad.id)}>
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                  {ads.length === 0 && <p className="text-muted-foreground text-sm text-center">Nenhum anúncio cadastrado ainda.</p>}
                </div>
              </div>
            </div>
          )}

          {tab === "moderation" && (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-heading text-xl text-destructive mb-4">Moderação de Stories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stories.map(story => (
                  <div key={story.id} className="bg-card/50 rounded-xl p-4 border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-foreground">{story.profiles?.full_name}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(story.created_at).toLocaleString()}</span>
                    </div>
                    {story.media_url && (
                      <img src={story.media_url} alt="Story" className="w-full h-32 object-cover rounded-md mb-2" />
                    )}
                    {story.content && <p className="text-sm text-foreground mb-4">{story.content}</p>}
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full"
                      onClick={async () => {
                        await supabase.from("stories").delete().eq("id", story.id);
                        fetchAll();
                      }}
                    >
                      Excluir Story
                    </Button>
                  </div>
                ))}
                {stories.length === 0 && <p className="text-muted-foreground text-sm col-span-3">Nenhum story ativo no momento.</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


