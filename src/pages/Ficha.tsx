import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { HOUSES } from "@/lib/store";

interface Ficha {
  id: string;
  character_name: string;
  age: number;
  primary_house: string;
  secondary_house: string;
  school_year: number;
  history: string;
  patronus: string;
  wand: string;
  blood_status: string;
  pet: string;
  favorite_subject: string;
  status: "pending" | "approved" | "rejected";
}

export default function Ficha() {
  const { user, profile } = useAuth();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    character_name: "",
    age: 11,
    primary_house: profile?.house || "gryffindor",
    secondary_house: "",
    school_year: 1,
    history: "",
    patronus: "",
    wand: "",
    blood_status: "Mestiço",
    pet: "Coruja",
    favorite_subject: "",
  });

  useEffect(() => {
    const fetchFicha = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("fichas")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setFicha(data as Ficha);
        setForm(data as any);
      }
      setLoading(false);
    };
    fetchFicha();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    
    const payload = {
      user_id: user.id,
      ...form,
      status: "pending"
    };

    let error;
    if (ficha?.id) {
      const res = await supabase.from("fichas").update(payload).eq("id", ficha.id);
      error = res.error;
    } else {
      const res = await supabase.from("fichas").insert(payload);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Ficha enviada com sucesso! Aguarde a aprovação da diretoria.");
      setFicha({ ...payload, id: ficha?.id || "temp-id" } as Ficha);
    }
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground">Procurando nos arquivos do Ministério...</div>;

  const isReadOnly = ficha?.status === "pending" || ficha?.status === "approved";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
        <h1 className="font-heading text-3xl text-gold-gradient mb-2">Ficha de Bruxo</h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Preencha sua ficha para participar do RPG. Cada detalhe importa na sua jornada mágica.
        </p>
      </div>

      {ficha && (
        <div className={`p-4 rounded-xl text-center text-sm font-heading ${
          ficha.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
          ficha.status === 'approved' ? 'bg-green-500/20 text-green-500' :
          'bg-destructive/20 text-destructive'
        }`}>
          Status da Ficha: {
            ficha.status === 'pending' ? '⏳ Em Análise pelo Ministério' :
            ficha.status === 'approved' ? '✅ Aprovada Oficialmente' :
            '❌ Rejeitada (Por favor, corrija os dados e reenvie)'
          }
        </div>
      )}

      <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-heading text-primary">Nome Completo do Personagem</label>
            <Input 
              placeholder="Ex: Harry Potter" 
              value={form.character_name} 
              onChange={(e) => setForm({...form, character_name: e.target.value})} 
              disabled={isReadOnly}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-heading text-primary">Idade</label>
            <Input 
              type="number" 
              min={11} max={100}
              value={form.age} 
              onChange={(e) => setForm({...form, age: parseInt(e.target.value) || 11})} 
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading text-primary">Casa Principal</label>
            <select 
              className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none border border-border disabled:opacity-50"
              value={form.primary_house}
              onChange={(e) => setForm({...form, primary_house: e.target.value})}
              disabled={isReadOnly}
            >
              {Object.values(HOUSES).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading text-primary">Casa Secundária (Opcional)</label>
            <select 
              className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none border border-border disabled:opacity-50"
              value={form.secondary_house}
              onChange={(e) => setForm({...form, secondary_house: e.target.value})}
              disabled={isReadOnly}
            >
              <option value="">Nenhuma</option>
              {Object.values(HOUSES).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading text-primary">Ano em Hogwarts (1º ao 7º)</label>
            <Input 
              type="number" 
              min={1} max={7}
              value={form.school_year} 
              onChange={(e) => setForm({...form, school_year: parseInt(e.target.value) || 1})} 
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading text-primary">Status Sanguíneo</label>
            <select 
              className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none border border-border disabled:opacity-50"
              value={form.blood_status}
              onChange={(e) => setForm({...form, blood_status: e.target.value})}
              disabled={isReadOnly}
            >
              <option value="Puro-Sangue">Puro-Sangue</option>
              <option value="Mestiço">Mestiço</option>
              <option value="Nascido-Trouxa">Nascido-Trouxa</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading text-primary">Varinha (Madeira, Núcleo e Tamanho)</label>
            <Input 
              placeholder="Ex: Azevinho, Pena de Fênix, 28cm" 
              value={form.wand} 
              onChange={(e) => setForm({...form, wand: e.target.value})} 
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading text-primary">Patrono</label>
            <Input 
              placeholder="Ex: Cervo" 
              value={form.patronus} 
              onChange={(e) => setForm({...form, patronus: e.target.value})} 
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading text-primary">Pet / Familiar</label>
            <select 
              className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none border border-border disabled:opacity-50"
              value={form.pet}
              onChange={(e) => setForm({...form, pet: e.target.value})}
              disabled={isReadOnly}
            >
              <option value="Coruja">Coruja</option>
              <option value="Gato">Gato</option>
              <option value="Sapo">Sapo</option>
              <option value="Rato">Rato</option>
              <option value="Nenhum">Nenhum</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading text-primary">Matéria Favorita</label>
            <Input 
              placeholder="Ex: Defesa Contra as Artes das Trevas" 
              value={form.favorite_subject} 
              onChange={(e) => setForm({...form, favorite_subject: e.target.value})} 
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-heading text-primary">História do Personagem</label>
          <textarea
            className="w-full bg-secondary/50 rounded-md px-3 py-3 text-sm text-foreground focus:outline-none border border-border min-h-[150px] resize-y disabled:opacity-50"
            placeholder="Conte um pouco sobre sua origem, personalidade e ambições..."
            value={form.history}
            onChange={(e) => setForm({...form, history: e.target.value})}
            disabled={isReadOnly}
          />
        </div>

        {!isReadOnly && (
          <div className="pt-4 flex justify-end">
            <Button 
              variant="magical" 
              className="font-heading px-8"
              onClick={handleSubmit}
              disabled={saving || !form.character_name || !form.wand}
            >
              {saving ? "Enviando..." : "Assinar Pergaminho ✨"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
