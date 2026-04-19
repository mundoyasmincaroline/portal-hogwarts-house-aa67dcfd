import { useState } from "react";
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
    if (!user) return;
    
    if (!formData.full_name) {
      toast.error("O nome do personagem é obrigatório!");
      return;
    }

    setLoading(true);

    try {
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
              <Input name="avatar_url" placeholder="URL da Foto do Personagem (Link)" value={formData.avatar_url} onChange={handleChange} className="bg-secondary/50" />
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
