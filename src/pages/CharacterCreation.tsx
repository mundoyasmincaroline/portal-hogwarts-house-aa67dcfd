import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Search, ChevronLeft } from "lucide-react";
import MagicalParticles from "@/components/MagicalParticles";

interface Props { onComplete: () => void; onCancel?: () => void; canCancel?: boolean; }

const FIELD = ({ label, name, value, onChange, placeholder, type = "text", rows }: any) => (
  <div>
    <label className="text-xs font-heading text-muted-foreground block mb-1">{label}</label>
    {rows ? (
      <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none resize-none border border-border focus:border-primary/50 transition-colors" />
    ) : (
      <Input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className="bg-secondary/50" />
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
  personality:"", strength:"", weakness:"", fears:"", dreams:"", quote:"", instagram:"",
  background:"", physical_description:"", canon_era:"", canon_portrayed_by:"", canon_notes:"",
  family_name:"", family_allow_siblings:true, family_allow_extended:true };

export default function CharacterCreation({ onComplete, onCancel, canCancel }: Props) {
  const { user } = useAuth();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

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

  const handleSubmit = async (type: "oc"|"canon") => {
    if (!user) return;
    if (!form.full_name || !form.house) {
      toast.error("Por favor, preencha o nome e selecione uma Casa.");
      return;
    }
    if (!form.full_name || !form.avatar_url && !avatarFile || !form.blood_status || !form.wand || !form.patronus || !form.personality || !form.strength || !form.weakness || !form.fears || !form.dreams) {
      toast.error("Preencha todos os campos obrigatórios da ficha!");
      return;
    }
    if (type === "canon" && !form.canon_portrayed_by) {
      toast.error("Informe o ator/atriz original do personagem Canon!");
      return;
    }
    setLoading(true);
    try {
      const { count } = await supabase.from("characters").select("*", { count:"exact", head:true }).eq("user_id", user.id);
      if ((count ?? 0) >= 2) { toast.error("Limite de 2 personagens por conta atingido!"); setLoading(false); return; }

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
        blood_status: form.blood_status,
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
        quote: form.quote,
        instagram: form.instagram,
        background: form.background,
        physical_description: form.physical_description,
        canon_era: type === "canon" ? form.canon_era : null,
        canon_portrayed_by: type === "canon" ? form.canon_portrayed_by : null,
        pair_character_id: pairId,
        relationship_status: pairId ? "paired" : "single",
        family_name: form.family_name,
        family_allow_siblings: form.family_allow_siblings,
        family_allow_extended: form.family_allow_extended,
      } as any).select("id").single();

      if (error) throw error;

      if (type === "canon") {
        await supabase.from("canon_claims").insert({ canon_name: form.full_name, user_id: user.id } as never).select();
      }

      await supabase.from("profiles").update({ active_character_id: char!.id } as never).eq("user_id", user.id);
      toast.success(`Ficha ${type === "oc" ? "OC" : "Canon"} criada com sucesso! ✨`);
      onComplete();
    } catch (e: any) {
      toast.error("Erro ao salvar ficha: " + (e.message || "Tente novamente"));
    } finally { setLoading(false); }
  };

  // ---------- TELA DE SELEÇÃO ----------
  if (step === "select") {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
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
              className="glass rounded-3xl p-8 border border-yellow-500/30 hover:border-yellow-400/70 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(234,179,8,0.2)] transition-all text-left group">
              <div className="text-5xl mb-4">⭐</div>
              <h2 className="font-heading text-2xl text-yellow-400 mb-2">Personagem OC</h2>
              <p className="text-sm text-muted-foreground mb-4">
                <strong className="text-foreground">Original Character</strong> — um personagem criado por você! Nome, história, personalidade e aparência são completamente da sua imaginação.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 mb-6">
                <li>✦ Nome e história originais</li>
                <li>✦ Livre para criar do zero</li>
                <li>✦ Personalidade única</li>
                <li>✦ Sem restrição de personagem</li>
              </ul>
              <span className="font-heading text-yellow-400 text-sm group-hover:underline">Criar ficha OC →</span>
            </button>
            {/* Canon */}
            <button onClick={() => setStep("canon")}
              className="glass rounded-3xl p-8 border border-purple-500/30 hover:border-purple-400/70 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(168,85,247,0.2)] transition-all text-left group">
              <div className="text-5xl mb-4">📖</div>
              <h2 className="font-heading text-2xl text-purple-400 mb-2">Personagem Canon</h2>
              <p className="text-sm text-muted-foreground mb-4">
                <strong className="text-foreground">Personagem Canônico</strong> — um personagem oficial da saga Harry Potter que você irá interpretar no portal (ex: Hermione, Draco, Luna…).
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 mb-6">
                <li>✦ Personagem da saga oficial</li>
                <li>✦ 1 Canon por usuário no portal</li>
                <li>✦ Baseado nos livros/filmes</li>
                <li>✦ Campos extras de referência</li>
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
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full border-2 border-border overflow-hidden flex-shrink-0 bg-secondary flex items-center justify-center">
                {avatarPreview || form.avatar_url
                  ? <img src={avatarPreview || form.avatar_url} className="w-full h-full object-cover" />
                  : <span className="text-3xl">🧙</span>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors text-sm font-heading text-primary">
                  📁 Upload de foto
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

            <div className="grid grid-cols-2 gap-3">
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
                  <option value="gryffindor">🦁 Grifinória</option>
                  <option value="slytherin">🐍 Sonserina</option>
                  <option value="ravenclaw">🦅 Corvinal</option>
                  <option value="hufflepuff">🦡 Lufa-Lufa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FIELD label="Idade *" name="age" value={form.age} onChange={handleChange} placeholder="Ex: 17" type="number" />
              <div>
                <label className="text-xs font-heading text-muted-foreground block mb-1">Status de Sangue *</label>
                <select name="blood_status" value={form.blood_status} onChange={handleChange}
                  className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground border border-border focus:border-primary/50 focus:outline-none">
                  <option value="">Selecione...</option>
                  <option value="puro-sangue">Puro-Sangue</option>
                  <option value="mestiço">Mestiço</option>
                  <option value="trouxa-nato">Trouxa-Nato</option>
                  <option value="trouxa">Trouxa</option>
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
            <FIELD label="Frase / Quote do personagem" name="quote" value={form.quote} onChange={handleChange}
              placeholder="Uma frase que representa este personagem..." />
            <FIELD label="Instagram do Personagem (@ opcional)" name="instagram" value={form.instagram} onChange={handleChange}
              placeholder="@nome_do_personagem" />
          </SECTION>

          {/* FAMÍLIA E GENEALOGIA */}
          <SECTION title="Família e Genealogia" icon="🌳">
            <FIELD label="Sobrenome de Família (ou Clã)" name="family_name" value={form.family_name} onChange={handleChange} 
              placeholder="Ex: Black, Potter, Malfoy, Weasley..." />
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border">
                <div>
                  <p className="text-xs font-heading">Permitir Irmãos(ãs)?</p>
                  <p className="text-[10px] text-muted-foreground">Outros membros podem entrar na família como seus irmãos.</p>
                </div>
                <button type="button" 
                  onClick={() => setForm(f => ({ ...f, family_allow_siblings: !f.family_allow_siblings }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${form.family_allow_siblings ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.family_allow_siblings ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border">
                <div>
                  <p className="text-xs font-heading">Permitir Parentes Estendidos?</p>
                  <p className="text-[10px] text-muted-foreground">Tios, primos e outros podem entrar na sua linhagem.</p>
                </div>
                <button type="button" 
                  onClick={() => setForm(f => ({ ...f, family_allow_extended: !f.family_allow_extended }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${form.family_allow_extended ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.family_allow_extended ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-muted-foreground italic bg-primary/5 p-3 rounded-lg border border-primary/10">
              <Sparkles size={10} className="inline mr-1 text-primary" />
              <strong>Nota do Sistema:</strong> As decisões da sua ficha são respeitadas automaticamente. Se você não permitir irmãos, ninguém poderá entrar no portal como seu parente direto nesta família.
            </p>
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
