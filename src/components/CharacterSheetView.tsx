import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SafeImage from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, Edit2, Save, X } from "lucide-react";

interface Props {
  userId: string;
  isOwner?: boolean; // true = o próprio membro vendo sua ficha
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

export default function CharacterSheetView({ userId, isOwner }: Props) {
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
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {characters.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveChar(i)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-heading tracking-widest uppercase transition-all duration-500 shrink-0 border ${
                i === activeChar
                  ? "bg-primary text-white border-primary shadow-[0_10px_20px_rgba(251,191,36,0.3)] scale-105"
                  : "bg-white/5 text-white/40 border-white/5 hover:text-white hover:bg-white/10"
              }`}
            >
              {c.character_type === "oc" ? "⭐ OC" : "📖 Canon"}: {c.full_name || "—"}
            </button>
          ))}
        </div>
      )}

      {/* Ficha Card - Monster Quality */}
      <div className="relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        
        {/* Header com foto Pedestal 3D */}
        <div className="relative p-8 md:p-12 bg-gradient-to-br from-white/5 via-transparent to-transparent">
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
            <div className="shrink-0 relative">
              {/* Pedestal Shadow */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/60 blur-xl rounded-full" />
              
              <div className="relative z-10 w-40 h-40 md:w-48 md:h-48 rounded-[2rem] bg-gradient-to-br from-white/20 to-transparent p-1.5 shadow-2xl group-hover:scale-105 transition-transform duration-700">
                <SafeImage
                  src={char.avatar_url}
                  alt={char.full_name}
                  fallbackEmoji="🧙"
                  className="w-full h-full rounded-[1.8rem] object-cover border border-white/10 shadow-inner"
                />
                {isOwner && (
                  <button 
                    onClick={() => { setEditingPhoto(!editingPhoto); setTempUrl(char.avatar_url || ""); }}
                    className="absolute -bottom-3 -right-3 bg-primary text-white p-3 rounded-2xl shadow-2xl hover:scale-110 active:scale-90 transition-all border border-white/20 z-20"
                    title="Editar foto do personagem"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>

              {/* Aura dynamic by type */}
              <div className={`absolute inset-0 blur-3xl opacity-20 animate-pulse-slow ${char.character_type === 'oc' ? 'bg-primary' : 'bg-blue-500'}`} />
            </div>
            
            <div className="flex-1 space-y-4 pt-4">
              {editingPhoto && isOwner && (
                <div className="mb-6 p-6 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-primary/30 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <p className="text-[10px] font-heading text-primary uppercase tracking-[0.3em]">Registro de Identidade Bruxa</p>
                  <div className="space-y-4">
                    <label className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all text-[10px] font-heading text-primary tracking-widest uppercase">
                      <Upload size={18} />
                      {uploading ? "TRANSFERINDO..." : "CLIQUE PARA UPLOAD"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                    <div className="flex gap-2">
                      <Input 
                        value={tempUrl} 
                        onChange={e => setTempUrl(e.target.value)} 
                        placeholder="Ou cole o link direto..." 
                        className="h-12 bg-black/40 border-white/10 rounded-xl text-xs"
                      />
                      <button onClick={saveUrl} disabled={uploading || !tempUrl} className="p-3 bg-primary rounded-xl text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                        <Save size={20} />
                      </button>
                      <button onClick={() => setEditingPhoto(false)} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${char.character_type === 'oc' ? 'bg-primary shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]'}`} />
                  <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-heading">
                    {char.character_type === "oc" ? "Personagem Original" : "Personagem Canon"}
                  </span>
                </div>
                <h2 className="font-heading text-4xl md:text-6xl text-white tracking-tighter drop-shadow-2xl">{char.full_name}</h2>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                {char.house && (
                  <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/30 text-[10px] font-heading tracking-widest uppercase">
                    {HOUSE_LABELS[char.house] || char.house}
                  </div>
                )}
                <div className="px-4 py-1.5 bg-white/5 text-white/60 rounded-full border border-white/10 text-[10px] font-heading tracking-widest uppercase">
                  {char.age} ANOS
                </div>
                <div className="px-4 py-1.5 bg-white/5 text-white/60 rounded-full border border-white/10 text-[10px] font-heading tracking-widest uppercase">
                  {char.gender === "female" ? "FEMININO" : "MASCULINO"}
                </div>
              </div>

              <div className="flex gap-8 pt-6 border-t border-white/5 justify-center md:justify-start">
                <div className="space-y-1">
                   <p className="text-[10px] text-white/20 uppercase tracking-widest font-heading text-center md:text-left">Nível de Maestria</p>
                   <p className="text-2xl font-heading text-primary tracking-tighter text-center md:text-left">{char.level || 1}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] text-white/20 uppercase tracking-widest font-heading text-center md:text-left">XP Acumulado</p>
                   <p className="text-2xl font-heading text-white tracking-tighter text-center md:text-left">{char.xp || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo da ficha - Seções 3D */}
        <div className="p-8 md:p-12 space-y-12 bg-gradient-to-b from-transparent to-black/40">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Dados Básicos */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                 <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/40 shadow-inner">
                    <span className="text-sm">📋</span>
                 </div>
                 <h4 className="font-heading text-xs uppercase tracking-[0.3em] text-white/60">Registros Civis</h4>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <Field label="Status Sanguíneo" value={char.blood_status} />
                <Field label="Faceclaim Oficial" value={char.actor_faceclaim} />
                <Field label="Instagram Bruxo" value={char.instagram} />
              </div>
            </div>

            {/* Magia */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                 <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/40 shadow-inner">
                    <span className="text-sm">🪄</span>
                 </div>
                 <h4 className="font-heading text-xs uppercase tracking-[0.3em] text-white/60">Artes Mágicas</h4>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <Field label="Varinha" value={char.wand} />
                <Field label="Forma do Patrono" value={char.patronus} />
                <Field label="Feitiço Assinatura" value={char.favorite_spell} />
                <Field label="Matéria de Estudo" value={char.favorite_class} />
              </div>
            </div>
          </div>

          {/* Personalidade Hero Section */}
          {char.personality && (
            <div className="relative p-10 bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden group/personality">
              <div className="absolute top-0 right-0 p-8 text-6xl opacity-5 group-hover/personality:rotate-12 transition-transform duration-1000 select-none">🧠</div>
              <h4 className="font-heading text-[10px] uppercase tracking-[0.4em] text-primary mb-6">Essência e Comportamento</h4>
              <p className="text-xl text-white/80 leading-relaxed font-serif italic relative z-10">
                "{char.personality}"
              </p>
            </div>
          )}

          {/* Atributos Psicológicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                 <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/40 shadow-inner">
                    <span className="text-sm">⚔️</span>
                 </div>
                 <h4 className="font-heading text-xs uppercase tracking-[0.3em] text-white/60">Equilíbrio Bruxo</h4>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <Field label="Virtude Suprema" value={char.strength} />
                <Field label="Fraqueza Fatal" value={char.weakness} />
                <Field label="Medos Profundos" value={char.fears} />
                <Field label="Grandes Sonhos" value={char.dreams} />
              </div>
            </div>

            {/* Família & Pets */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                 <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/40 shadow-inner">
                    <span className="text-sm">👨‍👩‍👧</span>
                 </div>
                 <h4 className="font-heading text-xs uppercase tracking-[0.3em] text-white/60">Linhagem & Companhia</h4>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <Field label="Pai & Mãe" value={`${char.family_father || '-'} / ${char.family_mother || '-'}`} />
                <Field label="Pet / Familiar" value={`${char.pet || '-'} (${char.pet_name || 'Sem nome'})`} />
                <Field label="Citações" value={char.quotes} />
              </div>
            </div>
          </div>

          {/* Segredos (Se for o dono ou admin) */}
          {(char.secrets) && (
            <div className="p-8 bg-red-950/20 rounded-[2rem] border border-red-500/20 text-center relative overflow-hidden group/secrets">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 opacity-0 group-hover/secrets:opacity-100 transition-opacity" />
              <h4 className="font-heading text-[10px] uppercase tracking-[0.5em] text-red-500/60 mb-4 flex items-center justify-center gap-3">
                 <Lock size={12} /> ARQUIVO RESTRITO
              </h4>
              <p className="text-sm text-red-400/80 italic font-mono relative z-10">{char.secrets}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
