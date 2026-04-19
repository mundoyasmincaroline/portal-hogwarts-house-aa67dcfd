import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  onComplete: () => void;
  onCancel?: () => void;
  canCancel?: boolean;
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
  
  const [formData, setFormData] = useState({
    full_name: "",
    avatar_url: "",
    age: "",
    blood_status: "",
    wand: "",
    patronus: "",
    pet: "",
    pet_name: "",
    pet_avatar: "",
    favorite_class: "",
    favorite_spell: "",
    personality: "",
    weakness: "",
    strength: "",
    secrets: "",
    fears: "",
    dreams: "",
    quotes: "",
    instagram: "",
    actor_faceclaim: "",
    family_mother: "",
    family_father: "",
    family_siblings: "",
    family_relatives: "",
    adult_job: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;
    
    // Validar limite de personagens direto no banco para evitar cliques duplos
    const { count } = await supabase.from("characters").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
    if (count && count >= 2) {
      toast.error("Você já atingiu o limite máximo de 2 personagens por conta (Ex: 1 OC e 1 Canon)!");
      return;
    }

    const requiredFields = [
      'full_name', 'avatar_url', 'age', 'blood_status', 
      'actor_faceclaim', 'wand', 'patronus', 'personality', 
      'strength', 'weakness', 'fears', 'dreams'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`A ficha está incompleta! Preencha todos os campos mágicos.`);
        return;
      }
    }

    setLoading(true);

    try {
      // 0. Upload avatar if file was chosen
      let finalAvatarUrl = formData.avatar_url;
      if (avatarFile && user) {
        const ext = avatarFile.name.split(".").pop();
        const path = `characters/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
          finalAvatarUrl = publicUrl;
        }
      }
      // 1. Check if Canon is already claimed
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

      // 2. Create character
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
          age: formData.age ? parseInt(formData.age) : null
        })
        .select("id")
        .single();

      if (charError) throw charError;

      // 3. Register Canon Claim if canon
      if (type === "canon" && charData) {
        await supabase.from("canon_claims").insert({
          canon_name: formData.full_name,
          claimed_by: user.id
        });
      }

      toast.success("Personagem criado com sucesso!");
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
          <p className="text-muted-foreground text-sm">
            Preencha os dados do seu personagem. Escolha sabiamente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipos Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Tipo de Personagem</label>
              <Select value={type} onValueChange={(v: "oc" | "canon") => setType(v)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oc">Original (OC)</SelectItem>
                  <SelectItem value="canon">Saga (Canon Oficial)</SelectItem>
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
              <label className="text-sm text-muted-foreground">Gênero</label>
              <Select value={gender} onValueChange={(v: "female" | "male") => setGender(v)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
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
                  <SelectItem value="gryffindor">Gryffindor</SelectItem>
                  <SelectItem value="slytherin">Slytherin</SelectItem>
                  <SelectItem value="ravenclaw">Ravenclaw</SelectItem>
                  <SelectItem value="hufflepuff">Hufflepuff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-px w-full bg-border/50 my-6" />

          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl text-primary mb-4">Dados Básicos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="full_name" placeholder="Nome Completo *" value={formData.full_name} onChange={handleChange} required className="bg-secondary/50" />
              <Input name="age" type="number" placeholder="Idade (Anos)" value={formData.age} onChange={handleChange} className="bg-secondary/50" />
              {/* Avatar upload + URL */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-sm text-muted-foreground block">📷 Foto do Personagem *</label>
                {/* Big upload button */}
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
                {/* Fallback: paste URL */}
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

          <div className="flex gap-4 mt-8 pt-4 border-t border-border/50">
            {canCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="magical" className="flex-1" disabled={loading}>
              {loading ? "Registrando Ficha..." : "Concluir Ficha Mágica"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
