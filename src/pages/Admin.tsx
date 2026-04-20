import { useState, useEffect } from "react";
import { useAuth, isUserOnline } from "@/lib/auth";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HouseCrest from "@/components/HouseCrest";
import { toast } from "sonner";
import AdminMemberModal from "@/components/AdminMemberModal";

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

// ─────────────────────────────────────────────────────────────
// Sub-componente: Aba de Monetização completa
// ─────────────────────────────────────────────────────────────
function MonetizationTab({ members, fetchAll, adForm, setAdForm, ads, createAd, toggleAd, deleteAd }: {
  members: any[];
  fetchAll: () => void;
  adForm: any;
  setAdForm: (v: any) => void;
  ads: any[];
  createAd: () => void;
  toggleAd: (id: string, active: boolean) => void;
  deleteAd: (id: string) => void;
}) {
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [galeonTarget, setGaleonTarget] = useState("");
  const [galeonAmount, setGaleonAmount] = useState(0);
  const [crediting, setCrediting] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "", description: "", category: "clothing", price_galeons: 100,
    rarity: "common", image_url: "", is_featured: false
  });
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    loadStoreItems();
  }, []);

  const loadStoreItems = async () => {
    setLoadingItems(true);
    const { data } = await supabase.from("store_items").select("*").order("category").order("price_galeons");
    setStoreItems(data || []);
    setLoadingItems(false);
  };

  const creditGaleons = async () => {
    if (!galeonTarget || galeonAmount <= 0) return toast.error("Selecione um membro e um valor válido.");
    setCrediting(true);
    const member = members.find(m => m.user_id === galeonTarget);
    if (!member) { toast.error("Membro não encontrado."); setCrediting(false); return; }
    const current = (member as any).galeons || 0;
    const { error } = await supabase.from("profiles").update({ galeons: current + galeonAmount } as never).eq("user_id", galeonTarget);
    if (error) { toast.error("Erro ao creditar Galeões."); }
    else { toast.success(`🪙 ${galeonAmount} Galeões creditados para ${member.full_name}!`); }
    setCrediting(false);
    fetchAll();
  };

  const addStoreItem = async () => {
    if (!newItem.name || !newItem.price_galeons) return toast.error("Preencha nome e preço.");
    setAddingItem(true);
    const { error } = await supabase.from("store_items").insert({ ...newItem, is_active: true } as never);
    if (error) toast.error(error.message);
    else { toast.success("✅ Item adicionado à loja!"); setNewItem({ name: "", description: "", category: "clothing", price_galeons: 100, rarity: "common", image_url: "", is_featured: false }); loadStoreItems(); }
    setAddingItem(false);
  };

  const toggleItem = async (item: any) => {
    await supabase.from("store_items").update({ is_active: !item.is_active } as never).eq("id", item.id);
    loadStoreItems();
    toast.success(item.is_active ? "Item desativado." : "Item ativado.");
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Tem certeza? Esta ação não pode ser desfeita.")) return;
    await supabase.from("store_items").delete().eq("id", id);
    loadStoreItems();
    toast.success("Item removido da loja.");
  };

  const CATEGORY_LABELS: Record<string, string> = {
    clothing: "👗 Roupas", wand: "🪄 Varinhas", accessory: "💎 Acessórios",
    skin: "🎨 Skins", decoration: "🏠 Decorações", pack: "📦 Pacotes"
  };
  const RARITY_LABELS: Record<string, string> = { common: "Comum", rare: "Raro", legendary: "Lendário" };

  return (
    <div className="space-y-6">
      {/* ─── 1. Crédito Manual de Galeões ─── */}
      <div className="glass rounded-2xl p-6 border border-yellow-500/30">
        <h2 className="font-heading text-xl text-yellow-400 mb-1">🪙 Creditar Galeões Manualmente</h2>
        <p className="text-xs text-muted-foreground mb-4">Use para premiar membros, corrigir erros ou conceder bônus especiais.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={galeonTarget}
            onChange={e => setGaleonTarget(e.target.value)}
            className="bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground border border-border col-span-1 md:col-span-1"
          >
            <option value="">— Selecionar membro —</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name} (@{m.username}) — 🪙 {(m as any).galeons || 0}
              </option>
            ))}
          </select>
          <Input
            type="number" min={1} placeholder="Quantidade de Galeões"
            value={galeonAmount || ""}
            onChange={e => setGaleonAmount(parseInt(e.target.value) || 0)}
          />
          <Button variant="magical" onClick={creditGaleons} disabled={crediting}>
            {crediting ? "Creditando..." : "🪙 Creditar"}
          </Button>
        </div>
      </div>

      {/* ─── 2. Gerenciar Itens da Loja ─── */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-heading text-xl text-primary mb-4">🏪 Gerenciar Loja Gringotts</h2>

        {/* Adicionar item */}
        <div className="glass rounded-xl p-4 mb-6 border border-primary/20 space-y-3">
          <h3 className="font-heading text-sm text-primary">➕ Adicionar Novo Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Nome do item *" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            <Input placeholder="Descrição" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
            <Input placeholder="URL da imagem" value={newItem.image_url} onChange={e => setNewItem({ ...newItem, image_url: e.target.value })} />
            <Input type="number" placeholder="Preço em Galeões *" value={newItem.price_galeons || ""} onChange={e => setNewItem({ ...newItem, price_galeons: parseInt(e.target.value) || 0 })} />
            <select
              value={newItem.category}
              onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              className="bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground border border-border"
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={newItem.rarity}
              onChange={e => setNewItem({ ...newItem, rarity: e.target.value })}
              className="bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground border border-border"
            >
              <option value="common">⚪ Comum</option>
              <option value="rare">🔵 Raro</option>
              <option value="legendary">⭐ Lendário</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={newItem.is_featured} onChange={e => setNewItem({ ...newItem, is_featured: e.target.checked })} className="accent-primary" />
            ⭐ Destacar na vitrine (Featured)
          </label>
          <Button variant="magical" className="w-full" onClick={addStoreItem} disabled={addingItem}>
            {addingItem ? "Salvando..." : "Adicionar à Loja"}
          </Button>
        </div>

        {/* Lista de itens */}
        {loadingItems ? (
          <p className="text-center text-muted-foreground animate-pulse">Carregando itens...</p>
        ) : storeItems.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">Nenhum item na loja ainda.</p>
        ) : (
          <div className="space-y-2">
            {storeItems.map(item => (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${item.is_active ? "border-border/50 bg-card/30" : "border-border/20 bg-secondary/10 opacity-50"}`}>
                {item.image_url && <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading text-foreground truncate">{item.name} {item.is_featured && "⭐"}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[item.category]} • {RARITY_LABELS[item.rarity]} • 🪙 {item.price_galeons}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => toggleItem(item)}>
                    {item.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>🗑️</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 3. Anúncios TikTok ─── */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-heading text-xl text-primary mb-4">📦 Adicionar Oferta (TikTok Shop)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Título (Ex: Pelúcia Harry Potter)" value={adForm.title} onChange={e => setAdForm({ ...adForm, title: e.target.value })} />
          <Input placeholder="Link de Afiliado do TikTok" value={adForm.link} onChange={e => setAdForm({ ...adForm, link: e.target.value })} />
          <Input placeholder="URL da Imagem" value={adForm.image_url} onChange={e => setAdForm({ ...adForm, image_url: e.target.value })} />
        </div>
        <Button onClick={createAd} variant="magical" className="mt-4 w-full">Publicar Anúncio Mágico</Button>
        <div className="mt-4 space-y-3">
          {ads.map(ad => (
            <div key={ad.id} className="bg-card/50 rounded-xl p-3 flex items-center gap-3 border border-border">
              {ad.image_url && <img src={ad.image_url} alt="Ad" className="w-10 h-10 rounded-md object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading text-foreground truncate">{ad.title}</p>
                <a href={ad.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate block">{ad.link}</a>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant={ad.active ? "default" : "secondary"} onClick={() => toggleAd(ad.id, ad.active)}>{ad.active ? "Desativar" : "Ativar"}</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteAd(ad.id)}>🗑️</Button>
              </div>
            </div>
          ))}
          {ads.length === 0 && <p className="text-muted-foreground text-sm text-center">Nenhum anúncio ainda.</p>}
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────

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
  const [pendingChars, setPendingChars] = useState<Record<string, any[]>>({});
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
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
    if (pm) {
      setPendingMembers(pm as unknown as MemberProfile[]);
      // load characters for each pending member
      if (pm.length > 0) {
        const ids = pm.map((p: any) => p.user_id);
        const { data: chars } = await supabase.from("characters").select("*").in("user_id", ids);
        if (chars) {
          const map: Record<string, any[]> = {};
          chars.forEach((ch: any) => {
            if (!map[ch.user_id]) map[ch.user_id] = [];
            map[ch.user_id].push(ch);
          });
          setPendingChars(map);
        }
      }
    }
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
    toast.success("ConfiguraÃ§Ãµes atualizadas!");
  };

  const createAd = async () => {
    if (!adForm.title || !adForm.link) return;
    const { error } = await supabase.from("ads").insert([adForm]);
    if (!error) {
      toast.success("AnÃºncio criado com sucesso!");
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
        <p className="text-muted-foreground text-sm">Apenas administradores podem acessar esta Ã¡rea.</p>
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
                <div
                  key={m.id}
                  className="glass rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 border border-transparent transition-colors"
                  onClick={() => setSelectedMember({ id: m.user_id, name: m.full_name })}
                >
                  <div className="relative">
                    <HouseCrest house={m.house} size="sm" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${isUserOnline(m) ? "bg-green-500" : "bg-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-heading text-foreground">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{m.username} • {m.age} anos • Nível {m.level} • {m.xp} XP</p>
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
                      <span className="text-[10px] text-muted-foreground/40">Nunca acessou</span>
                    )}
                    <span className="text-[10px] text-primary/60 font-heading">✏️ clique para editar</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "pending_members" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4">
                <h3 className="font-heading text-sm text-primary mb-1">⏳ Novos Membros Pendentes</h3>
                <p className="text-xs text-muted-foreground">Aprove os novos bruxos e revise as fichas de personagem antes de liberar acesso.</p>
              </div>
              {pendingMembers.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <p className="text-muted-foreground text-sm">Nenhum membro aguardando aprovação.</p>
                </div>
              ) : (
                pendingMembers.map((m) => {
                  const chars = pendingChars[m.user_id] || [];
                  return (
                    <div key={m.id} className="glass rounded-xl overflow-hidden border border-border/50">
                      {/* member row */}
                      <div className="p-4 flex items-center gap-4">
                        <div className="relative">
                          <HouseCrest house={m.house} size="sm" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-heading text-foreground">{m.full_name}</p>
                          <p className="text-xs text-muted-foreground">@{m.username} • {m.age} anos</p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button variant="outline" size="sm" className="text-destructive border-destructive" onClick={async () => {
                            await supabase.from("profiles").delete().eq("user_id", m.user_id);
                            toast.success("Membro rejeitado.");
                            fetchAll();
                          }}>Rejeitar</Button>
                          <Button variant="magical" size="sm" onClick={async () => {
                            await supabase.from("profiles").update({ approved: true }).eq("user_id", m.user_id);
                            toast.success("Membro aprovado!");
                            fetchAll();
                          }}>Aprovar ✅</Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedMember({ id: m.user_id, name: m.full_name })}>
                            ✏️ Editar
                          </Button>
                        </div>
                      </div>

                      {/* fichas de personagem inline */}
                      {chars.length > 0 && (
                        <div className="border-t border-border/50 bg-secondary/20 px-4 py-3 space-y-3">
                          <p className="text-xs font-heading text-primary">📜 Fichas de Personagem ({chars.length})</p>
                          {chars.map((char: any) => (
                            <div key={char.id} className="bg-card/60 rounded-xl p-3 flex gap-3">
                              {char.avatar_url && (
                                <img src={char.avatar_url} alt={char.full_name} className="w-12 h-12 rounded-full object-cover border border-border shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-heading text-sm text-foreground">{char.full_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {char.character_type === "oc" ? "OC" : "Canon"} • {char.house || "Sem casa"} • {char.blood_status || "—"}
                                </p>
                                {char.wand && <p className="text-xs text-muted-foreground">🪄 {char.wand}</p>}
                                {char.patronus && <p className="text-xs text-muted-foreground">✨ Patrono: {char.patronus}</p>}
                                {char.personality && (
                                  <p className="text-xs text-foreground/70 italic mt-1 line-clamp-2">{char.personality}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {chars.length === 0 && (
                        <div className="border-t border-border/50 bg-secondary/10 px-4 py-2">
                          <p className="text-xs text-muted-foreground italic">📝 Ainda não criou fichas de personagem.</p>
                        </div>
                      )}
                    </div>
                  );
                })
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
                    <option value="daily">DiÃ¡rio</option>
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
                <h3 className="font-heading text-sm text-primary mb-1">ðŸ§¹ Filch, o Zelador</h3>
                <p className="text-xs text-muted-foreground">Bot de moderaÃ§Ã£o que bloqueia automaticamente palavras imprÃ³prias em posts e comentÃ¡rios.</p>
              </div>
              {logs.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl mb-3">âœ¨</div>
                  <p className="text-muted-foreground text-sm">Nenhum bloqueio registrado. O castelo estÃ¡ em paz!</p>
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
                <h3 className="font-heading text-sm text-primary mb-1">ðŸ“œ Fichas Pendentes</h3>
                <p className="text-xs text-muted-foreground">Analise as fichas de RPG submetidas pelos membros.</p>
              </div>
              {fichas.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl mb-3">âœ¨</div>
                  <p className="text-muted-foreground text-sm">Nenhuma ficha pendente de aprovaÃ§Ã£o.</p>
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
                <div className="glass rounded-xl p-4 text-center">
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
                    }} className="text-muted-foreground hover:text-foreground">✖</button>
                  </div>
                ))}
                {bannedWords.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma palavra cadastrada.</p>}
              </div>
            </div>
          )}

          {tab === "channels" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  ✅ <strong>Ativar/Desativar sala</strong> — salas desativadas ficam bloqueadas para membros comuns (aparecem com cadeado).<br/>
                  ✨ <strong>Premium</strong> — adiciona brilho dourado ao card da sala.
                </p>
              </div>
              {channels.map((c) => (
                <div key={c.id} className={`glass rounded-xl p-4 space-y-3 border ${c.is_disabled ? "border-destructive/30 bg-destructive/5" : "border-border/50"}`}>
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h4 className="font-heading text-lg text-foreground flex items-center gap-2">
                        {c.name} {c.is_premium && <span className="text-xl">✨</span>}
                        {c.is_disabled && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">🔒 Fechada</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-heading">
                        <input type="checkbox" checked={c.is_premium} onChange={async (e) => {
                          await supabase.from("channels").update({ is_premium: e.target.checked }).eq("id", c.id);
                          fetchAll();
                          toast.success("Status premium atualizado!");
                        }} className="accent-primary" />
                        ✨ Premium
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-heading">
                        <input type="checkbox" checked={!!c.is_disabled} onChange={async (e) => {
                          await supabase.from("channels").update({ is_disabled: e.target.checked } as never).eq("id", c.id);
                          fetchAll();
                          toast.success(e.target.checked ? "Sala fechada para membros!" : "Sala reaberta!");
                        }} className="accent-destructive" />
                        🔒 Desativar Sala
                      </label>
                    </div>
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
            <MonetizationTab members={members} fetchAll={fetchAll} adForm={adForm} setAdForm={setAdForm} ads={ads} createAd={createAd} toggleAd={toggleAd} deleteAd={deleteAd} />
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

      {/* Member edit modal */}
      {selectedMember && (
        <AdminMemberModal
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          onClose={() => setSelectedMember(null)}
          onSaved={() => { fetchAll(); }}
        />
      )}
    </div>
  );
}




