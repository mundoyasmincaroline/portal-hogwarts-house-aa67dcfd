import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Search, ChevronLeft, Upload, Loader2, Sparkles } from "lucide-react";
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
  const [step, setStep] = useState<"select"|"oc"|"canon">("select");
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY });
  const [avatarFile, setAvatarFile] = useState<File|null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pairSearch, setPairSearch] = useState("");
  const [pairResults, setPairResults] = useState<any[]>([]);
  const [selectedPair, setSelectedPair] = useState<any|null>(null);
  const [relationshipStatus, setRelationshipStatus] = useState<"single"|"paired">("single");
  const [searchingPair, setSearchingPair] = useState(false);
  const [parentSearch, setParentSearch] = useState({ mother: "", father: "" });
  const [parentResults, setParentResults] = useState<{ mother: any[], father: any[] }>({ mother: [], father: [] });
  const [searchingParent, setSearchingParent] = useState({ mother: false, father: false });

  useEffect(() => {
    const raw = localStorage.getItem("pending_character_draft");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      const wand = [draft.wand_wood, draft.wand_core].filter(Boolean).join(" + ");
      setForm((f) => ({
        ...f,
        full_name: profile?.full_name || f.full_name,
        blood_status: draft.blood_status || f.blood_status,
        house: draft.house || f.house,
        wand: wand || f.wand,
        avatar_url: profile?.avatar_url || f.avatar_url,
      }));
    } catch { /* ignore */ }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setForm(f => ({ ...f, avatar_url: "" }));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    setForm(f => ({ ...f, avatar_url: "" }));
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

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.full_name || !form.house) {
      toast.error("Por favor, preencha o nome e selecione uma Casa.");
      return;
    }
    setLoading(true);
    try {
      // Check for unique name
      const { data: existing } = await supabase.from("characters")
        .select("id")
        .ilike("full_name", form.full_name.trim())
        .maybeSingle();

      if (existing) {
        toast.error("Este nome de personagem já está em uso!");
        setLoading(false);
        return;
      }

      const { count } = await supabase.from("characters").select("*", { count:"exact", head: true }).eq("user_id", user.id);
      if ((count ?? 0) >= 2) { toast.error("Limite de 2 personagens atingido!"); setLoading(false); return; }

      let avatarUrl = form.avatar_url;
      if (avatarFile) {
        setUploadingAvatar(true);
        const path = `${user.id}/characters/${Date.now()}.jpg`;
        await supabase.storage.from("avatars").upload(path, avatarFile);
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = publicUrl;
        setUploadingAvatar(false);
      }

      const pairId = relationshipStatus === "paired" ? (selectedPair?.id || null) : null;
      const { data: char, error } = await supabase.from("characters").insert({
        user_id: user.id,
        character_type: step,
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
        quotes: form.quotes,
        instagram: form.instagram,
        background: form.background,
        physical_description: form.physical_description,
        canon_era: step === "canon" ? form.canon_era : null,
        canon_portrayed_by: step === "canon" ? form.canon_portrayed_by : null,
        pair_character_id: pairId,
        relationship_status: pairId ? "paired" : "single",
      } as any).select("id").single();

      if (error) throw error;
      await supabase.from("profiles").update({ active_character_id: char!.id, has_seen_intro: false } as any).eq("user_id", user.id);
      if ((count ?? 0) === 0) await reward(user.id, 'first_character');
      onComplete();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar ficha");
    } finally { setLoading(false); }
  };

  const isOC = step === "oc";
  const accentClass = isOC ? "text-yellow-400 border-yellow-500/30" : "text-purple-400 border-purple-500/30";

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
            <button onClick={() => setStep("oc")} className="glass rounded-3xl p-8 border border-yellow-500/30 hover:-translate-y-2 transition-all text-left group">
              <div className="text-5xl mb-4">⭐</div>
              <h2 className="font-heading text-2xl text-yellow-400 mb-2">Personagem OC</h2>
              <p className="text-sm text-muted-foreground mb-4">Original Character — um personagem criado por você!</p>
              <span className="font-heading text-yellow-400 text-sm group-hover:underline">Criar ficha OC →</span>
            </button>
            <button onClick={() => setStep("canon")} className="glass rounded-3xl p-8 border border-purple-500/30 hover:-translate-y-2 transition-all text-left group">
              <div className="text-5xl mb-4"><EmojiIcon e="📖" /></div>
              <h2 className="font-heading text-2xl text-purple-400 mb-2">Personagem Canon</h2>
              <p className="text-sm text-muted-foreground mb-4">Personagem Canônico — um personagem oficial da saga Harry Potter.</p>
              <span className="font-heading text-purple-400 text-sm group-hover:underline">Criar ficha Canon →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0" />
      <MagicalParticles />
      <div className="relative z-10 max-w-2xl mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => { if(formStep > 1) setFormStep(formStep - 1); else setStep("select"); }} className="p-2 rounded-xl glass border border-border">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className={`font-heading text-2xl ${accentClass.split(" ")[0]}`}>
              {isOC ? "⭐ Personagem OC" : "📖 Personagem Canon"} — Passo {formStep}/3
            </h1>
            <div className="h-1 bg-border rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(formStep/3)*100}%` }} />
            </div>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); if(formStep < 3) setFormStep(formStep + 1); else handleSubmit(); }} className="space-y-5">
          {formStep === 1 && (
            <>
              <SECTION title="Foto" icon="📷">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-2 border-border overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                    {avatarPreview || form.avatar_url ? <img src={avatarPreview || form.avatar_url} className="w-full h-full object-cover" /> : <EmojiIcon e="🧙" size={32} />}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 cursor-pointer text-xs font-heading">
                      <Upload size={14} /> <span>{avatarFile ? "Arquivo Selecionado" : "Subir Foto"}</span>
                      <input type="file" className="hidden" onChange={handleAvatar} />
                    </label>
                    <Input name="avatar_url" value={form.avatar_url} onChange={handleChange} placeholder="Ou link da imagem" className="mt-2 h-8 text-xs" />
                  </div>
                </div>
              </SECTION>
              <SECTION title="Identidade" icon="👤">
                <FIELD label="Nome *" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Nome do personagem" />
                <div className="grid grid-cols-2 gap-3">
                  <FIELD label="Idade *" name="age" value={form.age} onChange={handleChange} type="number" />
                  <div className="space-y-1">
                    <label className="text-xs font-heading text-muted-foreground">Casa *</label>
                    <select name="house" value={form.house} onChange={handleChange} className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm border border-border">
                      <option value="gryffindor">Grifinória</option>
                      <option value="slytherin">Sonserina</option>
                      <option value="ravenclaw">Corvinal</option>
                      <option value="hufflepuff">Lufa-Lufa</option>
                    </select>
                  </div>
                </div>
                {!isOC && (
                  <>
                    <FIELD label="Era *" name="canon_era" value={form.canon_era} onChange={handleChange} />
                    <FIELD label="Ator/Atriz *" name="canon_portrayed_by" value={form.canon_portrayed_by} onChange={handleChange} />
                  </>
                )}
              </SECTION>
            </>
          )}

          {formStep === 2 && (
            <SECTION title="Magia" icon="🪄">
              <FIELD label="Varinha *" name="wand" value={form.wand} onChange={handleChange} />
              <FIELD label="Patrono *" name="patronus" value={form.patronus} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-3">
                <FIELD label="Animal" name="pet" value={form.pet} onChange={handleChange} />
                <FIELD label="Aula Favorita" name="favorite_class" value={form.favorite_class} onChange={handleChange} />
              </div>
            </SECTION>
          )}

          {formStep === 3 && (
            <>
              <SECTION title="Personalidade" icon="🧠">
                <FIELD label="Personalidade *" name="personality" value={form.personality} onChange={handleChange} rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <FIELD label="Força *" name="strength" value={form.strength} onChange={handleChange} />
                  <FIELD label="Fraqueza *" name="weakness" value={form.weakness} onChange={handleChange} />
                </div>
              </SECTION>
              <SECTION title="Bio & Extras" icon="📜">
                <FIELD label="História" name="background" value={form.background} onChange={handleChange} rows={3} />
                <FIELD label="Descrição Física" name="physical_description" value={form.physical_description} onChange={handleChange} rows={2} />
              </SECTION>
            </>
          )}

          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={loading} className="w-full" variant="magical">
              {loading ? <Loader2 className="animate-spin" /> : (formStep < 3 ? "Próximo Passo" : "Finalizar Cadastro")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}