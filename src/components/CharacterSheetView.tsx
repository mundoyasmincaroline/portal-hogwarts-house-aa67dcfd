import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SafeImage from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, Edit2, Save, X } from "lucide-react";

interface Props {
  userId: string;
  isOwner?: boolean;
  userItems?: any[]; // Passado do Profile.tsx
}


const HOUSE_LABELS: Record<string, string> = {
  gryffindor: "🦁 Gryffindor",
  slytherin:  "🐍 Slytherin",
  ravenclaw:  "🦅 Ravenclaw",
  hufflepuff: "🦡 Hufflepuff",
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-heading">{label}</p>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="font-heading text-xs uppercase tracking-widest text-primary border-b border-primary/20 pb-1">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export default function CharacterSheetView({ userId, isOwner, userItems = [] }: Props) {

  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChar, setActiveChar] = useState(0);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tempUrl, setTempUrl] = useState("");

  useEffect(() => {
    supabase
      .from("characters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at")
      .then(({ data }) => {
        if (data) setCharacters(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p className="text-center text-muted-foreground py-8 text-sm">Consultando registros do Ministério...</p>;

  if (characters.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <div className="text-4xl mb-3">📜</div>
        <p className="text-muted-foreground text-sm">
          {isOwner ? "Você ainda não registrou nenhuma ficha de personagem." : "Este membro não registrou fichas ainda."}
        </p>
      </div>
    );
  }

  const char = characters[activeChar];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/characters/${char.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const finalUrl = `${publicUrl}?t=${Date.now()}`;
      
      const { error: updateErr } = await supabase.from("characters").update({ avatar_url: finalUrl } as never).eq("id", char.id);
      if (updateErr) throw updateErr;

      setCharacters(prev => prev.map((c, i) => i === activeChar ? { ...c, avatar_url: finalUrl } : c));
      toast.success("Foto do personagem atualizada! ✨");
      setEditingPhoto(false);
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const saveUrl = async () => {
    if (!tempUrl.trim()) return;
    setUploading(true);
    try {
      const { error } = await supabase.from("characters").update({ avatar_url: tempUrl } as never).eq("id", char.id);
      if (error) throw error;
      setCharacters(prev => prev.map((c, i) => i === activeChar ? { ...c, avatar_url: tempUrl } : c));
      toast.success("URL da foto atualizada! 🪄");
      setEditingPhoto(false);
    } catch (err: any) {
      toast.error("Erro ao salvar URL: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab selector se tiver mais de 1 ficha */}
      {characters.length > 1 && (
        <div className="flex gap-2">
          {characters.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveChar(i)}
              className={`px-4 py-1.5 rounded-full text-xs font-heading transition-colors ${
                i === activeChar
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-secondary border border-transparent"
              }`}
            >
              {c.character_type === "oc" ? "⭐ OC" : "📖 Canon"}: {c.full_name || "—"}
            </button>
          ))}
        </div>
      )}

      {/* Ficha Card */}
      <div className="glass rounded-2xl overflow-hidden border border-border/50">
        {/* Header com foto */}
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/30 p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <div className="shrink-0 group relative">
              <SafeImage
                src={char.avatar_url}
                alt={char.full_name}
                fallbackEmoji="🧙"
                className="w-28 h-28 rounded-2xl object-cover border-2 border-primary/30 shadow-xl"
              />
              {isOwner && (
                <button 
                  onClick={() => { setEditingPhoto(!editingPhoto); setTempUrl(char.avatar_url || ""); }}
                  className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform z-10"
                  title="Editar foto do personagem"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
            
            <div className="text-center sm:text-left flex-1">
              {editingPhoto && isOwner && (
                <div className="mb-4 p-3 bg-card/80 backdrop-blur-md rounded-xl border border-primary/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] font-heading text-primary uppercase tracking-widest">Atualizar Foto do Personagem</p>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors text-xs font-heading text-primary">
                      <Upload size={14} />
                      {uploading ? "Carregando..." : "Upload de Arquivo"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                    <div className="flex gap-2">
                      <Input 
                        value={tempUrl} 
                        onChange={e => setTempUrl(e.target.value)} 
                        placeholder="Ou cole o link da foto aqui..." 
                        className="h-8 text-xs bg-secondary/50"
                      />
                      <Button size="sm" className="h-8" onClick={saveUrl} disabled={uploading || !tempUrl}>
                        <Save size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingPhoto(false)}>
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <span className="text-xs uppercase tracking-widest text-primary/70 font-heading">
                  {char.character_type === "oc" ? "⭐ Personagem Original (OC)" : "📖 Personagem Canon (Saga)"}
                </span>
              </div>
              <h2 className="font-heading text-2xl text-foreground">{char.full_name}</h2>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                {char.house && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    {HOUSE_LABELS[char.house] || char.house}
                  </span>
                )}
                {char.age && (
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border text-foreground">
                    {char.age} anos
                  </span>
                )}
                {char.gender && (
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border text-foreground">
                    {char.gender === "female" ? "Feminino" : "Masculino"}
                  </span>
                )}
                {char.age_category && (
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border text-foreground">
                    {char.age_category === "student" ? "Aluno(a)" : "Adulto(a)"}
                  </span>
                )}
                {char.adult_job && (
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border text-foreground">
                    {char.adult_job}
                  </span>
                )}
              </div>
              <div className="flex gap-4 mt-3 text-sm text-muted-foreground justify-center sm:justify-start">
                <span>Nível <strong className="text-primary">{char.level || 1}</strong></span>
                <span><strong className="text-primary">{char.xp || 0}</strong> XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo da ficha */}
        <div className="p-6 space-y-6">

          {/* Dados Básicos */}
          <Section title="📋 Dados Básicos">
            <Field label="Status Sanguíneo" value={char.blood_status} />
            <Field label="Faceclaim (Ator / Atriz)" value={char.actor_faceclaim} />
            <Field label="Instagram do Personagem" value={char.instagram} />
          </Section>

          {/* Magia */}
          <Section title="🪄 Magia & Habilidades">
            <Field label="Varinha" value={char.wand} />
            <Field label="Patrono" value={char.patronus} />
            <Field label="Feitiço Favorito" value={char.favorite_spell} />
            <Field label="Matéria Favorita" value={char.favorite_class} />
          </Section>

          {/* Personalidade */}
          {char.personality && (
            <div className="space-y-2">
              <h4 className="font-heading text-xs uppercase tracking-widest text-primary border-b border-primary/20 pb-1">🧠 Personalidade</h4>
              <p className="text-sm text-foreground/90 leading-relaxed italic">{char.personality}</p>
            </div>
          )}

          {/* Pontos & Medos */}
          <Section title="⚖️ Pontos Forte, Fraco & Medos">
            <Field label="Ponto Forte" value={char.strength} />
            <Field label="Ponto Fraco" value={char.weakness} />
            <Field label="Medos" value={char.fears} />
            <Field label="Sonhos" value={char.dreams} />
          </Section>

          {/* Segredos & Quotes */}
          {(char.secrets || char.quotes) && (
            <Section title="🔐 Segredos & Citações">
              <div className="sm:col-span-2 space-y-3">
                {char.secrets && (
                  <div className="bg-secondary/40 rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-heading mb-1">Segredos</p>
                    <p className="text-sm text-foreground/90 italic">{char.secrets}</p>
                  </div>
                )}
                {char.quotes && (
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                    <p className="text-[10px] uppercase tracking-widest text-primary/70 font-heading mb-1">Citações</p>
                    <p className="text-sm text-foreground/90 italic">"{char.quotes}"</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Família e Genealogia */}
          <Section title="👨‍👩‍👧 Família e Genealogia">
            <Field label="Família / Clã" value={char.family_name} />
            <Field label="Pai" value={char.family_father} />
            <Field label="Mãe" value={char.family_mother} />
            <Field label="Irmãos" value={char.family_siblings} />
            <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-2 mt-1">
               <div className={`p-2 rounded-lg border text-[10px] font-heading flex flex-col items-center justify-center gap-1 ${char.family_allow_siblings ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-muted/10 border-border text-muted-foreground opacity-50'}`}>
                  <span>{char.family_allow_siblings ? '✅ PERMITE IRMÃOS' : '❌ NÃO PERMITE IRMÃOS'}</span>
               </div>
               <div className={`p-2 rounded-lg border text-[10px] font-heading flex flex-col items-center justify-center gap-1 ${char.family_allow_extended ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-muted/10 border-border text-muted-foreground opacity-50'}`}>
                  <span>{char.family_allow_extended ? '✅ PERMITE PARENTES' : '❌ NÃO PERMITE PARENTES'}</span>
               </div>
            </div>
            {char.family_relatives && <div className="col-span-1 sm:col-span-2"><Field label="Outros Parentes" value={char.family_relatives} /></div>}
          </Section>

          {/* Pet */}
          {(char.pet || char.pet_name) && (
            <Section title="🦉 Pet / Familiar">
              <Field label="Tipo de Pet" value={char.pet} />
              <Field label="Nome do Pet" value={char.pet_name} />
            </Section>
          )}

          {/* Equipamentos e Vestuário - MONSTER QUALITY */}
          <div className="space-y-4 pt-4">
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary border-b border-primary/20 pb-1 flex items-center gap-2">
              <LinkIcon size={14} /> Vestuário & Equipamentos Mágicos
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {userItems.filter(ui => ui.is_equipped).length === 0 ? (
                <div className="col-span-full py-6 bg-black/20 rounded-2xl border border-dashed border-white/10 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Nenhum item equipado</p>
                  <p className="text-[8px] text-muted-foreground/50 mt-1 italic">Visite o Beco Diagonal para adquirir roupas e acessórios.</p>
                </div>
              ) : (
                userItems.filter(ui => ui.is_equipped).map(ui => (
                  <div key={ui.id} className="glass bg-white/5 border-white/10 p-3 rounded-2xl flex flex-col items-center text-center group hover:border-primary/50 transition-all">
                    <div className="w-12 h-12 mb-2 relative">
                      <SafeImage 
                        src={ui.store_items?.image_url} 
                        alt={ui.store_items?.name} 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                    </div>
                    <p className="text-[8px] uppercase font-heading text-primary leading-tight">{ui.store_items?.name}</p>
                    <p className="text-[7px] text-muted-foreground mt-0.5">{ui.store_items?.category === 'robes' ? 'Vestimenta' : 'Acessório'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
