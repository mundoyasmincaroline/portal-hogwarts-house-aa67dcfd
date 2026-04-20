import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, X, Search } from "lucide-react";

interface Props {
  onComplete: () => void;
  onCancel?: () => void;
  canCancel?: boolean;
}

// Tooltip explicativo
function TypeInfo({ type }: { type: "oc" | "canon" }) {
  const [show, setShow] = useState(false);
  const info = type === "oc"
    ? {
        title: "⭐ Personagem OC (Original Character)",
        desc: "Um personagem criado inteiramente por você! Você define o nome, a história, a aparência e a personalidade. Ele existe dentro do universo de Harry Potter mas é sua criação original.",
        tip: "Exemplo: 'Lara Moonwhisper', uma bruxa de Slytherin com poderes de Legilimência que nunca apareceu nos livros.",
        color: "border-amber-400/50 bg-amber-900/20",
      }
    : {
        title: "📖 Personagem Canon",
        desc: "Um personagem oficial da saga Harry Potter! Você irá interpretar um personagem que já existe nos livros ou filmes, mantendo sua personalidade original dentro do RPG.",
        tip: "Exemplo: 'Harry Potter', 'Hermione Granger', 'Draco Malfoy'. Apenas um membro pode interpretar cada canon.",
        color: "border-primary/50 bg-primary/10",
      };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="ml-1 text-muted-foreground hover:text-primary transition-colors"
      >
        <Info size={14} />
      </button>
      {show && (
        <div className={`absolute left-6 top-0 z-50 w-72 rounded-xl border p-4 shadow-2xl backdrop-blur-md text-sm ${info.color}`}>
          <p className="font-heading text-foreground mb-1">{info.title}</p>
          <p className="text-muted-foreground text-xs mb-2">{info.desc}</p>
          <p className="text-xs text-primary/80 italic border-t border-border/50 pt-2">{info.tip}</p>
        </div>
      )}
    </div>
  );
}

export default function CharacterCreation({ onComplete, onCancel, canCancel }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [type, setType] = useState<"oc" | "canon">("oc");
  const [ageCategory, setAgeCategory] = useState<"student" | "adult">("student");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [house, setHouse] = useState<string>("");

  // Par romântico
  const [pairSearch, setPairSearch] = useState("");
  const [pairResults, setPairResults] = useState<any[]>([]);
  const [selectedPair, setSelectedPair] = useState<any | null>(null);
  const [relationshipStatus, setRelationshipStatus] = useState<"single" | "paired">("single");
  const [searchingPair, setSearchingPair] = useState(false);

  const DRAFT_KEY = `char_draft_${user?.id}`;

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(`char_draft_${user?.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      full_name: "", avatar_url: "", age: "", blood_status: "",
      wand: "", patronus: "", pet: "", pet_name: "", pet_avatar: "",
      favorite_class: "", favorite_spell: "", personality: "",
      weakness: "", strength: "", secrets: "", fears: "", dreams: "",
      quotes: "", instagram: "", actor_faceclaim: "",
      family_mother: "", family_father: "", family_siblings: "",
      family_relatives: "", adult_job: "",
      // Canon-specific
      canon_name: "", canon_portrayed_by: "", canon_era: "",
    };
  });

  // Auto-save draft
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(formData)); } catch {}
  }, [formData, DRAFT_KEY]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Buscar personagens para par (gênero oposto)
  const searchPairs = async (query: string) => {
    if (query.length < 2) { setPairResults([]); return; }
    setSearchingPair(true);
    const oppositeGender = gender === "female" ? "male" : "female";
    const { data } = await supabase
      .from("characters")
      .select("id, full_name, avatar_url, house, character_type, gender")
      .ilike("full_name", `%${query}%`)
      .eq("gender", oppositeGender)
      .limit(8);
    setPairResults(data || []);
    setSearchingPair(false);
  };

  useEffect(() => {
    const t = setTimeout(() => searchPairs(pairSearch), 400);
    return () => clearTimeout(t);
  }, [pairSearch, gender]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    // Limite de personagens
    const { count } = await supabase.from("characters").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
    if (count && count >= 2) {
      toast.error("Você já atingiu o limite máximo de 2 personagens por conta (Ex: 1 OC e 1 Canon)!");
      return;
    }

    const requiredFields = ['full_name', 'avatar_url', 'age', 'blood_status', 'actor_faceclaim', 'wand', 'patronus', 'personality', 'strength', 'weakness', 'fears', 'dreams'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`A ficha está incompleta! Preencha todos os campos mágicos.`);
        return;
      }
    }

    setLoading(true);

    try {
      let finalAvatarUrl = formData.avatar_url;
      if (avatarFile && user) {
        const ext = avatarFile.name.split(".").pop();
        const path = `characters/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
          finalAvatarUrl = `${publicUrl}?t=${Date.now()}`;
        }
      }

      if (type === "canon") {
        const { data: existingCanon } = await supabase
          .from("canon_claims")
          .select("id")
          .ilike("canon_name", formData.full_name)
          .maybeSingle();
        if (existingCanon) {
          toast.error("Este personagem Canon já está sendo interpretado por outro aluno!");
          setLoading(false);
          return;
        }
      }

      const pairId = relationshipStatus === "paired" ? (selectedPair?.id || null) : null;

      const { data: charData, error: charError } = await supabase
        .from("characters")
        .insert({
          user_id: user.id,
          character_type: type,
          age_category: ageCategory,
          gender: gender,
          house: house || null,
          ...formData,
          avatar_url: finalAvatarUrl,
          age: formData.age ? parseInt(formData.age) : null,
          pair_character_id: pairId,
          relationship_status: pairId ? "paired" : "single",
        } as never)
        .select("id")
        .single();

      if (charError) throw charError;

      // Atualizar par com referência mútua
      if (selectedPair && charData) {
        await supabase.from("characters").update({ pair_character_id: charData.id } as never).eq("id", selectedPair.id);
      }

      if (type === "canon" && charData) {
        await supabase.from("canon_claims").insert({ canon_name: formData.full_name, claimed_by: user.id });
      }

      toast.success("Personagem criado com sucesso! ✨");
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      onComplete();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao criar personagem: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen p-4 flex flex-col items-center py-12">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0" />

      <div className="relative z-10 max-w-3xl w-full glass p-8 rounded-2xl border border-border/50 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block">📜</span>
          <h1 className="font-heading text-3xl text-gold-gradient mb-2">Registro de Ficha Oficial</h1>
          <p className="text-muted-foreground text-sm">Preencha os dados do seu personagem. Escolha sabiamente.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TIPO E GÊNERO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-1">
                Tipo de Personagem
                <TypeInfo type={type} />
              </label>
              <Select value={type} onValueChange={(v: "oc" | "canon") => setType(v)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oc">⭐ Original (OC) — Criado por você</SelectItem>
                  <SelectItem value="canon">📖 Canon — Personagem da Saga</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Gênero</label>
              <Select value={gender} onValueChange={(v: "female" | "male") => { setGender(v); setSelectedPair(null); setPairSearch(""); }}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">♀️ Feminino</SelectItem>
                  <SelectItem value="male">♂️ Masculino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Idade/Fase</label>
              <Select value={ageCategory} onValueChange={(v: "student" | "adult") => setAgeCategory(v)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Aluno(a)</SelectItem>
                  <SelectItem value="adult">Adulto(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Casa Principal</label>
              <Select value={house} onValueChange={setHouse}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecione a Casa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gryffindor">🦁 Gryffindor</SelectItem>
                  <SelectItem value="slytherin">🐍 Slytherin</SelectItem>
                  <SelectItem value="ravenclaw">🦅 Ravenclaw</SelectItem>
                  <SelectItem value="hufflepuff">🦡 Hufflepuff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Explicação interativa do tipo escolhido */}
          <div className={`rounded-xl p-4 border text-sm transition-all ${type === "oc" ? "border-amber-400/30 bg-amber-900/10" : "border-primary/30 bg-primary/5"}`}>
            {type === "oc" ? (
              <div className="flex gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="font-heading text-foreground mb-1">Personagem Original (OC)</p>
                  <p className="text-muted-foreground text-xs">Você irá criar um personagem completamente novo! Defina a história, personalidade e visual. Ele(a) existe no universo de Hogwarts mas é sua criação única.</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <span className="text-2xl">📖</span>
                <div>
                  <p className="font-heading text-foreground mb-1">Personagem Canon</p>
                  <p className="text-muted-foreground text-xs">Você irá interpretar um personagem oficial da saga! Mantenha a personalidade original e dê vida ao seu favorito dentro do portal. Cada canon só pode ser reivindicado por um membro.</p>
                </div>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-border/50 my-6" />

          {/* Campos específicos do Canon */}
          {type === "canon" && (
            <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <h3 className="font-heading text-lg text-primary flex items-center gap-2">📖 Dados do Personagem Canon</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="canon_era" placeholder="Era (Ex: Era Dourada, Próxima Geração)" value={formData.canon_era} onChange={handleChange} className="bg-secondary/50" />
                <Input name="canon_portrayed_by" placeholder="Ator/Atriz do Filme (opcional)" value={formData.canon_portrayed_by} onChange={handleChange} className="bg-secondary/50" />
              </div>
              <p className="text-xs text-muted-foreground">💡 O "Nome Completo" abaixo deve ser o nome exato do personagem canon (Ex: "Harry James Potter").</p>
            </div>
          )}

          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl text-primary mb-4">Dados Básicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="full_name" placeholder={type === "canon" ? "Nome Canon Exato *" : "Nome Completo do OC *"} value={formData.full_name} onChange={handleChange} required className="bg-secondary/50" />
              <Input name="age" type="number" placeholder="Idade (Anos)" value={formData.age} onChange={handleChange} className="bg-secondary/50" />
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-sm text-muted-foreground block">📷 Foto do Personagem *</label>
                <label className="flex flex-col items-center justify-center gap-2 w-full py-5 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary/50" />
                  ) : (
                    <span className="text-4xl">📁</span>
                  )}
                  <span className="text-sm font-heading text-primary">
                    {loading ? "Aguarde..." : avatarPreview ? "✅ Foto selecionada! (clique para trocar)" : "Clique aqui para fazer upload da foto"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">PNG, JPG ou WEBP — máx. 5MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                      setFormData(f => ({ ...f, avatar_url: "" }));
                    }}
                  />
                </label>
                <p className="text-[11px] text-muted-foreground text-center">— ou cole um link direto abaixo —</p>
                <Input
                  name="avatar_url"
                  placeholder="https://link-da-imagem.com/foto.jpg"
                  value={formData.avatar_url}
                  onChange={(e) => {
                    handleChange(e);
                    setAvatarPreview(e.target.value);
                    setAvatarFile(null);
                  }}
                  className="bg-secondary/50"
                />
              </div>
              <Input name="blood_status" placeholder="Status Sanguíneo (Ex: Puro, Trouxa)" value={formData.blood_status} onChange={handleChange} className="bg-secondary/50" />
              <Input name="actor_faceclaim" placeholder="Faceclaim (Ator/Atriz que representa)" value={formData.actor_faceclaim} onChange={handleChange} className="bg-secondary/50" />
              {ageCategory === "adult" && (
                <Input name="adult_job" placeholder="Profissão / Cargo" value={formData.adult_job} onChange={handleChange} className="bg-secondary/50" />
              )}
            </div>
          </div>

          <div className="h-px w-full bg-border/50 my-6" />

          {/* Magia */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl text-primary mb-4">Magia & Personalidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="wand" placeholder="Varinha (Madeira, Núcleo, Tamanho)" value={formData.wand} onChange={handleChange} className="bg-secondary/50" />
              <Input name="patronus" placeholder="Patrono" value={formData.patronus} onChange={handleChange} className="bg-secondary/50" />
              <Input name="favorite_spell" placeholder="Feitiço Favorito" value={formData.favorite_spell} onChange={handleChange} className="bg-secondary/50" />
              <Input name="favorite_class" placeholder="Matéria Favorita" value={formData.favorite_class} onChange={handleChange} className="bg-secondary/50" />
            </div>
            <Textarea name="personality" placeholder="Personalidade (Descreva em detalhes)" value={formData.personality} onChange={handleChange} className="bg-secondary/50 min-h-[100px]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="strength" placeholder="Ponto Forte" value={formData.strength} onChange={handleChange} className="bg-secondary/50" />
              <Input name="weakness" placeholder="Ponto Fraco" value={formData.weakness} onChange={handleChange} className="bg-secondary/50" />
              <Input name="fears" placeholder="Medos" value={formData.fears} onChange={handleChange} className="bg-secondary/50" />
              <Input name="dreams" placeholder="Sonhos" value={formData.dreams} onChange={handleChange} className="bg-secondary/50" />
            </div>
          </div>

          <div className="h-px w-full bg-border/50 my-6" />

          {/* PAR ROMÂNTICO */}
          <div className="space-y-3 rounded-xl border border-rose-500/30 bg-rose-900/10 p-4">
            <h3 className="font-heading text-lg text-rose-400 flex items-center gap-2">
              💕 Par Romântico
              <span className="text-xs font-sans font-normal text-muted-foreground">(opcional)</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Busque um personagem de gênero oposto para ser o par do seu {gender === "female" ? "personagem feminino" : "personagem masculino"}.
              {gender === "female" ? " Apenas personagens masculinos serão exibidos." : " Apenas personagens femininos serão exibidos."}
            </p>

            {/* Opção Solteiro(a) */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setRelationshipStatus("single"); setSelectedPair(null); setPairSearch(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-heading transition-all ${
                  relationshipStatus === "single"
                    ? "border-rose-400/60 bg-rose-900/20 text-rose-300"
                    : "border-border text-muted-foreground hover:border-rose-400/40"
                }`}
              >
                💔 Solteiro(a)
              </button>
              <button
                type="button"
                onClick={() => setRelationshipStatus("paired")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-heading transition-all ${
                  relationshipStatus === "paired"
                    ? "border-rose-400/60 bg-rose-900/20 text-rose-300"
                    : "border-border text-muted-foreground hover:border-rose-400/40"
                }`}
              >
                💕 Tem um par
              </button>
            </div>

            {relationshipStatus === "single" && (
              <p className="text-xs text-muted-foreground italic text-center">
                💔 Solteiro(a) por enquanto — você pode escolher um par a qualquer momento no seu perfil.
              </p>
            )}

            {relationshipStatus === "paired" && (
              selectedPair ? (
                <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3 border border-rose-500/30">
                  {selectedPair.avatar_url && (
                    <img src={selectedPair.avatar_url} alt={selectedPair.full_name} className="w-10 h-10 rounded-full object-cover border border-rose-400/50" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm text-foreground">{selectedPair.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedPair.character_type === "oc" ? "⭐ OC" : "📖 Canon"} · {selectedPair.house}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedPair(null); setPairSearch(""); }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={`Buscar personagem ${gender === "female" ? "masculino" : "feminino"}...`}
                      value={pairSearch}
                      onChange={e => setPairSearch(e.target.value)}
                      className="bg-secondary/50 pl-9"
                    />
                  </div>
                  {(pairResults.length > 0 || searchingPair) && (
                    <div className="absolute z-30 w-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                      {searchingPair && <p className="text-xs text-center py-2 text-muted-foreground">Buscando...</p>}
                      {pairResults.map(char => (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => { setSelectedPair(char); setPairSearch(""); setPairResults([]); }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-colors text-left"
                        >
                          {char.avatar_url && (
                            <img src={char.avatar_url} alt={char.full_name} className="w-8 h-8 rounded-full object-cover" />
                          )}
                          <div>
                            <p className="font-heading text-sm text-foreground">{char.full_name}</p>
                            <p className="text-xs text-muted-foreground">{char.character_type === "oc" ? "⭐ OC" : "📖 Canon"} · {char.house}</p>
                          </div>
                        </button>
                      ))}
                      {!searchingPair && pairResults.length === 0 && pairSearch.length >= 2 && (
                        <div className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">Nenhum personagem encontrado.</p>
                          <button
                            type="button"
                            onClick={() => { setRelationshipStatus("single"); setPairSearch(""); }}
                            className="text-xs text-rose-400 mt-1 hover:underline"
                          >
                            Ficar solteiro(a) por enquanto
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          <div className="flex gap-4 mt-8 pt-4 border-t border-border/50">
            {canCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="magical" className="flex-1" disabled={loading}>
              {loading ? "Registrando Ficha..." : "Concluir Ficha Mágica ✨"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
