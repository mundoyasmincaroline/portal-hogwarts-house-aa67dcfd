import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Search, ChevronLeft } from "lucide-react";
import MagicalParticles from "@/components/MagicalParticles";
import { reward } from "@/services/core/rewardService";

import EmojiIcon from "@/components/shared/EmojiIcon";
interface Props { onComplete: () => void; onCancel?: () => void; canCancel?: boolean; }

const FIELD = ({ label, name, value, onChange, placeholder, type = "text", rows, required }: any) => (
  <div>
    <label className="text-xs font-heading text-muted-foreground block mb-1">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    {rows ? (
      <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none resize-none border border-border focus:border-primary/50 transition-colors" />
    ) : (
      <Input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className="bg-secondary/50 focus:ring-primary/20" />
    )}
  </div>
);

const SECTION = ({ title, icon, children }: any) => (
  <div className="glass rounded-xl p-5 space-y-4 border border-border/50">
    <h3 className="font-heading text-primary flex items-center gap-2">{icon} {title}</h3>
    {children}
  </div>
);

const EMPTY = { full_name:"", avatar_url:"", age:"", blood_status:"", gender:"male", house:"gryffindor",
  actor_faceclaim:"", wand:"", patronus:"", pet:"", favorite_class:"", favorite_spell:"",
  personality:"", strength:"", weakness:"", fears:"", dreams:"", quotes:"", instagram:"",
  background:"", physical_description:"", canon_era:"", canon_portrayed_by:"", canon_notes:"",
  mother_id: null as string | null, father_id: null as string | null };

export default function CharacterCreation({ onComplete, onCancel, canCancel }: Props) {
  const { user, profile } = useAuth();
  // Step: "select" | "oc" | "canon"
  const [step, setStep] = useState<"select"|"oc"|"canon">("select");
  const [form, setForm] = useState({ ...EMPTY });
  const [avatarFile, setAvatarFile] = useState<File|null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [pairSearch, setPairSearch] = useState("");
  const [pairResults, setPairResults] = useState<any[]>([]);
  const [selectedPair, setSelectedPair] = useState<any|null>(null);
  const [relationshipStatus, setRelationshipStatus] = useState<"single"|"paired">("single");
  const [searchingPair, setSearchingPair] = useState(false);
  const [parentSearch, setParentSearch] = useState({ mother: "", father: "" });
  const [parentResults, setParentResults] = useState<{ mother: any[], father: any[] }>({ mother: [], father: [] });
  const [searchingParent, setSearchingParent] = useState({ mother: false, father: false });

  // Carrega rascunho do Cadastro-Rito (Register.tsx) na primeira ficha
  useEffect(() => {
    const raw = localStorage.getItem("pending_character_draft");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      const wandWood = draft.wand_wood ? String(draft.wand_wood) : "";
      const wandCore = draft.wand_core ? String(draft.wand_core) : "";
      const wand = [wandWood, wandCore].filter(Boolean).join(" + ");
      
      setForm((f) => ({
        ...f,
        full_name: profile?.full_name || f.full_name,
        blood_status: draft.blood_status || f.blood_status,
        house: draft.house || f.house,
        wand: wand || f.wand,
        avatar_url: profile?.avatar_url || f.avatar_url,
      }));
      // Removemos o removeItem daqui para garantir que os dados persistam se a página for recarregada antes de salvar
    } catch { /* ignore */ }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (pairSearch.length < 2) { setPairResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingPair(true);
      const opp = form.gender === "female" ? "male" : "female";
      const { data } = await supabase.from("characters")
        .select("id, full_name, avatar_url, house, character_type")
        .ilike("full_name", `%${pairSearch}%`)
        .eq("gender", opp).limit(6);
      setPairResults(data || []);
      setSearchingPair(false);
    }, 400);
    return () => clearTimeout(t);
  }, [pairSearch, form.gender]);

  useEffect(() => {
    const searchParent = async (type: "mother" | "father", query: string) => {
      if (query.length < 2) {
        setParentResults(prev => ({ ...prev, [type]: [] }));
        return;
      }
      setSearchingParent(prev => ({ ...prev, [type]: true }));
      const genderReq = type === "mother" ? "female" : "male";
      const { data } = await supabase.from("characters")
        .select("id, full_name, avatar_url, house, blood_status")
        .ilike("full_name", `%${query}%`)
        .eq("gender", genderReq)
        .limit(5);
      setParentResults(prev => ({ ...prev, [type]: data || [] }));
      setSearchingParent(prev => ({ ...prev, [type]: false }));
    };

    const tMother = setTimeout(() => searchParent("mother", parentSearch.mother), 400);
    const tFather = setTimeout(() => searchParent("father", parentSearch.father), 400);
    return () => {
      clearTimeout(tMother);
      clearTimeout(tFather);
    };
  }, [parentSearch.mother, parentSearch.father]);

  const handleSubmit = async (type: "oc"|"canon") => {
    if (!user) return;
    if (!form.full_name || !form.house) {
      toast.error("Por favor, preencha o nome e selecione uma Casa.");
      return;
    }

    if (type === "canon" && !form.canon_portrayed_by) {
      toast.error("Informe o ator/atriz original do personagem Canon!");
      return;
    }
    setLoading(true);
    try {
      const { count, data: charList } = await supabase.from("characters").select("*", { count:"exact" }).eq("user_id", user.id);
      if ((count ?? 0) >= 2) { toast.error("Limite de 2 personagens por conta atingido!"); setLoading(false); return; }

      // Se for a primeira ficha, vamos dar uma recompensa especial
      const isFirstChar = (count ?? 0) === 0;


      let avatarUrl = form.avatar_url;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/characters/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = `${publicUrl}?t=${Date.now()}`;
        }
      }

      if (type === "canon") {
        const { data: ex } = await supabase.from("canon_claims").select("id").ilike("canon_name", form.full_name).maybeSingle();
        if (ex) { toast.error("Este personagem Canon já está sendo interpretado!"); setLoading(false); return; }
      }

      const pairId = relationshipStatus === "paired" ? (selectedPair?.id || null) : null;

      const { data: char, error } = await supabase.from("characters").insert({
        user_id: user.id,
        character_type: type,
        gender: form.gender,
        house: form.house,
        full_name: form.full_name,
        avatar_url: avatarUrl,
        age: form.age ? parseInt(form.age) : null,
        blood_status: (profile?.blood_locked && profile?.blood_status) ? profile.blood_status : form.blood_status,
        actor_faceclaim: form.actor_faceclaim,
        wand: form.wand,
        patronus: form.patronus,
        pet: form.pet,
        favorite_class: form.favorite_class,
        favorite_spell: form.favorite_spell,
        personality: form.personality,
        strength: form.strength,
        weakness: form.weakness,
        fears: form.fears,
        dreams: form.dreams,
        quotes: form.quotes,
        instagram: form.instagram,
        background: form.background,
        physical_description: form.physical_description,
        canon_era: type === "canon" ? form.canon_era : null,
        canon_portrayed_by: type === "canon" ? form.canon_portrayed_by : null,
        pair_character_id: pairId,
        relationship_status: pairId ? "paired" : "single",
        mother_id: form.mother_id,
        father_id: form.father_id,
      } as any).select("id").single();

      if (error) throw error;

      if (type === "canon") {
        await supabase.from("canon_claims").insert({ canon_name: form.full_name, user_id: user.id, claimed_by: user.id } as never).select();
      }

      await supabase.from("profiles").update({ active_character_id: char!.id, has_seen_intro: false } as any).eq("user_id", user.id);
      localStorage.removeItem("pending_character_draft"); 

      // Atualiza o estado local imediatamente para evitar loop na tela de seleção
      useAuth.setState((state) => ({
        profile: state.profile ? { ...state.profile, active_character_id: char!.id, house: form.house as any } : null
      }));
      // Sincroniza demais campos derivados (house, blood_status pelo trigger)
      try { await useAuth.getState().fetchProfile(user.id); } catch { /* ignore */ }

      if (isFirstChar) {
        await reward(user.id, 'first_character');
      } else {
        toast.success(`Ficha ${type === "oc" ? "OC" : "Canon"} criada com sucesso! ✨`);
      }
      onComplete();

    } catch (e: any) {
      console.error("Erro na criação:", e);
      toast.error("Erro ao salvar ficha: " + (e.message || "Tente novamente"));
    } finally { setLoading(false); }
  };

  const handleBack = () => {
    if (step !== "select") setStep("select");
    else if (onCancel) onCancel();
  };

  // ---------- TELA DE SELEÇÃO ----------
  if (step === "select") {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0" />
        <MagicalParticles />
        <div className="relative z-10 max-w-3xl w-full">
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl text-gold-gradient mb-3">Criar Ficha de Personagem</h1>
            <p className="text-muted-foreground">Escolha o tipo de personagem que deseja registrar no portal.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OC */}
            <button onClick={() => setStep("oc")}
              className="glass rounded-[2rem] sm:rounded-3xl p-6 sm:p-8 border border-yellow-500/30 hover:border-yellow-400/70 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(234,179,8,0.2)] transition-all text-left group">
              <div className="text-5xl mb-4">⭐</div>
              <h2 className="font-heading text-2xl text-yellow-400 mb-2">Personagem OC</h2>
              <p className="text-sm text-muted-foreground mb-4">
                <strong className="text-foreground">Original Character</strong> — um personagem criado por você! Nome, história, personalidade e aparência são completamente da sua imaginação.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 mb-6">
                <li><EmojiIcon e="✦" /> Nome e história originais</li>
                <li><EmojiIcon e="✦" /> Livre para criar do zero</li>
                <li><EmojiIcon e="✦" /> Personalidade única</li>
                <li><EmojiIcon e="✦" /> Sem restrição de personagem</li>
              </ul>
              <span className="font-heading text-yellow-400 text-sm group-hover:underline">Criar ficha OC →</span>
            </button>
            {/* Canon */}
            <button onClick={() => setStep("canon")}
              className="glass rounded-[2rem] sm:rounded-3xl p-6 sm:p-8 border border-purple-500/30 hover:border-purple-400/70 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(168,85,247,0.2)] transition-all text-left group">
              <div className="text-5xl mb-4"><EmojiIcon e="📖" /></div>
              <h2 className="font-heading text-2xl text-purple-400 mb-2">Personagem Canon</h2>
              <p className="text-sm text-muted-foreground mb-4">
                <strong className="text-foreground">Personagem Canônico</strong> — um personagem oficial da saga Harry Potter que você irá interpretar no portal (ex: Hermione, Draco, Luna…).
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 mb-6">
                <li><EmojiIcon e="✦" /> Personagem da saga oficial</li>
                <li><EmojiIcon e="✦" /> 1 Canon por usuário no portal</li>
                <li><EmojiIcon e="✦" /> Baseado nos livros/filmes</li>
                <li><EmojiIcon e="✦" /> Campos extras de referência</li>
              </ul>
              <span className="font-heading text-purple-400 text-sm group-hover:underline">Criar ficha Canon →</span>
            </button>
          </div>
          {canCancel && onCancel && (
            <div className="text-center mt-8">
              <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">Cancelar</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- FORMULÁRIOS ----------
  const isOC = step === "oc";
  const accent = isOC ? "yellow" : "purple";
  const accentClass = isOC ? "text-yellow-400 border-yellow-500/30" : "text-purple-400 border-purple-500/30";

  return (
    <div className="relative min-h-screen p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0" />
      <MagicalParticles />
      <div className="relative z-10 max-w-2xl mx-auto py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setStep("select")} className="p-2 rounded-xl glass border border-border hover:border-primary/50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className={`font-heading text-3xl ${accentClass.split(" ")[0]}`}>
              {isOC ? "⭐ Ficha de Personagem OC" : "📖 Ficha de Personagem Canon"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isOC ? "Crie seu personagem original e único" : "Registre seu personagem canônico da saga"}
            </p>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleSubmit(step); }} className="space-y-5">

          {/* FOTO */}
          <SECTION title="Foto do Personagem" icon="📷">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 rounded-full border-2 border-border overflow-hidden flex-shrink-0 bg-secondary flex items-center justify-center">
                {avatarPreview || form.avatar_url
                  ? <img src={avatarPreview || form.avatar_url} className="w-full h-full object-cover" />
                  : <span className="text-3xl"><EmojiIcon e="🧙" /></span>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors text-sm font-heading text-primary">
                  <EmojiIcon e="📁" /> Upload de foto
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                </label>
                <p className="text-[10px] text-muted-foreground text-center">ou cole o link abaixo</p>
                <Input name="avatar_url" value={form.avatar_url} onChange={handleChange} placeholder="https://link-da-imagem.jpg" className="bg-secondary/50 text-xs" />
              </div>
            </div>
          </SECTION>

          {/* IDENTIDADE */}
          <SECTION title={isOC ? "Identidade do Personagem OC" : "Identidade do Personagem Canon"} icon={isOC ? "⭐" : "📖"}>
            <FIELD label="Nome completo *" name="full_name" value={form.full_name} onChange={handleChange}
              placeholder={isOC ? "Nome inventado do seu OC" : "Nome exato do personagem Canon (ex: Hermione Granger)"} />

            {!isOC && (
              <>
                <FIELD label="Era / Geração *" name="canon_era" value={form.canon_era} onChange={handleChange}
                  placeholder="Ex: Era de Ouro, Next Gen, Marauders Era..." />
                <FIELD label="Ator/Atriz Original no Filme *" name="canon_portrayed_by" value={form.canon_portrayed_by} onChange={handleChange}
                  placeholder="Ex: Emma Watson, Tom Felton..." />
                <FIELD label="Notas de interpretação (como você vai jogar este personagem)" name="canon_notes" value={form.canon_notes || ""} onChange={handleChange}
                  placeholder="Descreva como pretende interpretar este Canon no portal..." rows={3} />
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-heading text-muted-foreground block mb-1">Gênero *</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground border border-border focus:border-primary/50 focus:outline-none">
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-heading text-muted-foreground block mb-1">Casa de Hogwarts *</label>
                <select name="house" value={form.house} onChange={handleChange}
                  className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground border border-border focus:border-primary/50 focus:outline-none">
                  <option value="gryffindor"><EmojiIcon e="🦁" /> Grifinória</option>
                  <option value="slytherin"><EmojiIcon e="🐍" /> Sonserina</option>
                  <option value="ravenclaw"><EmojiIcon e="🦅" /> Corvinal</option>
                  <option value="hufflepuff"><EmojiIcon e="🦡" /> Lufa-Lufa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FIELD label="Idade *" name="age" value={form.age} onChange={handleChange} placeholder="Ex: 17" type="number" />
              <div>
                <label className="text-xs font-heading text-muted-foreground block mb-1">Status de Sangue *</label>
                <select 
                  name="blood_status" 
                  value={form.blood_status} 
                  onChange={handleChange}
                  disabled={!!(form.mother_id || form.father_id || profile?.blood_locked)}
                  className={`w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground border border-border focus:border-primary/50 focus:outline-none ${ (form.mother_id || form.father_id || profile?.blood_locked) ? "opacity-50 cursor-not-allowed" : "" }`}
                >
                  <option value="">Selecione...</option>
                  <option value="pure-blood">Puro-Sangue</option>
                  <option value="half-blood">Mestiço(a)</option>
                  <option value="muggle-born">Nascido(a)-Trouxa</option>
                  <option value="muggle">Trouxa</option>
                </select>
              </div>
            </div>

            {isOC && (
              <FIELD label="Face Claim (ator/atriz/modelo que representa seu OC)" name="actor_faceclaim" value={form.actor_faceclaim} onChange={handleChange}
                placeholder="Ex: Timothée Chalamet" />
            )}
          </SECTION>

          {/* MAGIA */}
          <SECTION title="Magia e Atributos" icon="🪄">
            <div className="grid grid-cols-2 gap-3">
              <FIELD label="Varinha *" name="wand" value={form.wand} onChange={handleChange} placeholder="Ex: Carvalho, 11 pol, cabelo de unicórnio" />
              <FIELD label="Patrono *" name="patronus" value={form.patronus} onChange={handleChange} placeholder="Ex: Cervo, Lontra..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FIELD label="Animal de Estimação" name="pet" value={form.pet} onChange={handleChange} placeholder="Ex: Coruja, sapo..." />
              <FIELD label="Aula Favorita" name="favorite_class" value={form.favorite_class} onChange={handleChange} placeholder="Ex: Defesa Contra as Artes das Trevas" />
            </div>
            <FIELD label="Feitiço Favorito" name="favorite_spell" value={form.favorite_spell} onChange={handleChange} placeholder="Ex: Expecto Patronum" />
          </SECTION>

          {/* PERSONALIDADE */}
          <SECTION title="Personalidade" icon="🧠">
            <FIELD label="Personalidade *" name="personality" value={form.personality} onChange={handleChange}
              placeholder={isOC ? "Descreva como é o seu OC..." : "Como este personagem Canon se comporta na sua interpretação..."} rows={3} />
            <div className="grid grid-cols-2 gap-3">
              <FIELD label="Virtude / Força *" name="strength" value={form.strength} onChange={handleChange} placeholder="Ex: Lealdade, inteligência..." />
              <FIELD label="Fraqueza *" name="weakness" value={form.weakness} onChange={handleChange} placeholder="Ex: Impulsividade, ciúme..." />
            </div>
            <FIELD label="Medos *" name="fears" value={form.fears} onChange={handleChange} placeholder="Ex: Perder os amigos, o escuro..." />
            <FIELD label="Sonhos e Objetivos *" name="dreams" value={form.dreams} onChange={handleChange} placeholder="Ex: Se tornar Auror, proteger a família..." />
          </SECTION>

          {/* EXTRAS */}
          <SECTION title="Extras" icon="✨">
            {isOC && (
              <FIELD label="Origem / História de Fundo" name="background" value={form.background} onChange={handleChange}
                placeholder="De onde vem seu OC? Qual sua história de vida?" rows={3} />
            )}
            <FIELD label="Descrição Física" name="physical_description" value={form.physical_description} onChange={handleChange}
              placeholder="Cor dos olhos, cabelo, altura, traços marcantes..." rows={2} />
            <FIELD label="Frase / Quote do personagem" name="quotes" value={form.quotes} onChange={handleChange}
              placeholder="Uma frase que representa este personagem..." />
            <FIELD label="Instagram do Personagem (@ opcional)" name="instagram" value={form.instagram} onChange={handleChange}
              placeholder="@nome_do_personagem" />
          </SECTION>

          {/* GENEALOGIA */}
          <SECTION title="Genealogia (Pais)" icon="👪">
            <p className="text-[10px] text-muted-foreground mb-2">
              Selecione os pais do personagem para cálculo automático de sangue.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MÃE */}
              <div className="space-y-2">
                <label className="text-xs font-heading text-muted-foreground block">Mãe</label>
                {form.mother_id ? (
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-2 border border-border">
                    {parentResults.mother.find(m => m.id === form.mother_id)?.avatar_url && (
                      <img src={parentResults.mother.find(m => m.id === form.mother_id)?.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="font-heading text-xs truncate">{parentResults.mother.find(m => m.id === form.mother_id)?.full_name || "Mãe Selecionada"}</p>
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, mother_id: null }))}>
                      <X size={14} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      value={parentSearch.mother} 
                      onChange={e => setParentSearch(p => ({ ...p, mother: e.target.value }))}
                      placeholder="Buscar mãe..."
                      className="bg-secondary/50 pl-7 h-8 text-xs"
                    />
                    {parentResults.mother.length > 0 && (
                      <div className="absolute z-40 w-full mt-1 bg-card border border-border rounded-lg overflow-hidden shadow-xl">
                        {parentResults.mother.map(m_item => (
                          <button key={m_item.id} type="button" onClick={() => { setForm(f => ({ ...f, mother_id: m_item.id })); setParentSearch(p => ({ ...p, mother: "" })); }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-secondary/50 transition-colors text-left">
                            <img src={m_item.avatar_url || "/placeholder.svg"} className="w-6 h-6 rounded-full object-cover" />
                            <div className="overflow-hidden">
                              <p className="font-heading text-[10px] truncate">{m_item.full_name}</p>
                              <p className="text-[8px] text-muted-foreground">{m_item.blood_status}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PAI */}
              <div className="space-y-2">
                <label className="text-xs font-heading text-muted-foreground block">Pai</label>
                {form.father_id ? (
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-2 border border-border">
                    {parentResults.father.find(f => f.id === form.father_id)?.avatar_url && (
                      <img src={parentResults.father.find(f => f.id === form.father_id)?.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="font-heading text-xs truncate">{parentResults.father.find(f => f.id === form.father_id)?.full_name || "Pai Selecionado"}</p>
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, father_id: null }))}>
                      <X size={14} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      value={parentSearch.father} 
                      onChange={e => setParentSearch(p => ({ ...p, father: e.target.value }))}
                      placeholder="Buscar pai..."
                      className="bg-secondary/50 pl-7 h-8 text-xs"
                    />
                    {parentResults.father.length > 0 && (
                      <div className="absolute z-40 w-full mt-1 bg-card border border-border rounded-lg overflow-hidden shadow-xl">
                        {parentResults.father.map(f_item => (
                          <button key={f_item.id} type="button" onClick={() => { setForm(f => ({ ...f, father_id: f_item.id })); setParentSearch(p => ({ ...p, father: "" })); }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-secondary/50 transition-colors text-left">
                             <img src={f_item.avatar_url || "/placeholder.svg"} className="w-6 h-6 rounded-full object-cover" />
                            <div className="overflow-hidden">
                              <p className="font-heading text-[10px] truncate">{f_item.full_name}</p>
                              <p className="text-[8px] text-muted-foreground">{f_item.blood_status}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            { (form.mother_id || form.father_id) && (
              <p className="text-[10px] text-primary/70 italic mt-2">
                <EmojiIcon e="✨" /> O status de sangue será bloqueado para edição manual se os pais forem definidos.
              </p>
            )}
          </SECTION>

          {/* PAR ROMÂNTICO */}
          <SECTION title="Par Romântico" icon="💕">
            <p className="text-xs text-muted-foreground">
              {form.gender === "female" ? "Apenas personagens masculinos serão exibidos." : "Apenas personagens femininos serão exibidos."}
            </p>
            <div className="flex gap-2">
              {(["single","paired"] as const).map(s => (
                <button key={s} type="button"
                  onClick={() => { setRelationshipStatus(s); if (s === "single") { setSelectedPair(null); setPairSearch(""); } }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-sm font-heading transition-all ${
                    relationshipStatus === s ? "border-rose-400/60 bg-rose-900/20 text-rose-300" : "border-border text-muted-foreground hover:border-rose-400/40"
                  }`}>
                  {s === "single" ? "💔 Solteiro(a)" : "💕 Tem um par"}
                </button>
              ))}
            </div>

            {relationshipStatus === "single" && (
              <p className="text-xs text-muted-foreground italic text-center">Solteiro(a) por enquanto — você pode escolher um par depois no perfil.</p>
            )}

            {relationshipStatus === "paired" && (
              selectedPair ? (
                <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3 border border-rose-500/30">
                  {selectedPair.avatar_url && <img src={selectedPair.avatar_url} className="w-10 h-10 rounded-full object-cover" />}
                  <div className="flex-1">
                    <p className="font-heading text-sm">{selectedPair.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedPair.house}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedPair(null); setPairSearch(""); }}>
                    <X size={16} className="text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={pairSearch} onChange={e => setPairSearch(e.target.value)}
                      placeholder={`Buscar personagem ${form.gender === "female" ? "masculino" : "feminino"}...`}
                      className="bg-secondary/50 pl-9" />
                  </div>
                  {(pairResults.length > 0 || searchingPair) && (
                    <div className="absolute z-30 w-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                      {searchingPair && <p className="text-xs text-center py-2 text-muted-foreground">Buscando...</p>}
                      {pairResults.map(c => (
                        <button key={c.id} type="button" onClick={() => { setSelectedPair(c); setPairSearch(""); setPairResults([]); }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-colors text-left">
                          {c.avatar_url && <img src={c.avatar_url} className="w-8 h-8 rounded-full object-cover" />}
                          <div>
                            <p className="font-heading text-sm">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground">{c.character_type === "oc" ? "⭐ OC" : "📖 Canon"} · {c.house}</p>
                          </div>
                        </button>
                      ))}
                      {!searchingPair && pairResults.length === 0 && pairSearch.length >= 2 && (
                        <div className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">Nenhum personagem disponível.</p>
                          <button type="button" onClick={() => { setRelationshipStatus("single"); setPairSearch(""); }}
                            className="text-xs text-rose-400 mt-1 hover:underline">Ficar solteiro(a) por enquanto</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </SECTION>

          {/* SUBMIT */}
          <div className="flex gap-3 pt-2">
            {canCancel && onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
            )}
            <Button type="submit" variant="magical" disabled={loading} className="flex-1">
              {loading ? "Salvando ficha..." : `✨ Registrar Ficha ${isOC ? "OC" : "Canon"}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
