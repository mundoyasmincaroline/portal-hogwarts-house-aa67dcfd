import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, User, Scroll, Save, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Upload } from "lucide-react";
import SafeImage from "@/components/SafeImage";

interface Props {
  memberId: string; // user_id
  memberName: string;
  onClose: () => void;
  onSaved: () => void;
}

const HOUSES = [
  { value: "gryffindor", label: "🦁 Gryffindor" },
  { value: "slytherin",  label: "🐍 Slytherin" },
  { value: "ravenclaw",  label: "🦅 Ravenclaw" },
  { value: "hufflepuff", label: "🦡 Hufflepuff" },
];

export default function AdminMemberModal({ memberId, memberName, onClose, onSaved }: Props) {
  const [profile, setProfile]     = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [expandedChar, setExpandedChar] = useState<string | null>(null);

  const [uploadingChar, setUploadingChar] = useState<string | null>(null);

  /* ---------- fetch ---------- */
  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", memberId).single(),
        supabase.from("characters").select("*").eq("user_id", memberId).order("created_at"),
      ]);
      if (p) setProfile(p);
      if (c) setCharacters(c);
      setLoading(false);
    };
    load();
  }, [memberId]);

  /* ---------- upload character avatar ---------- */
  const handleCharAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, charId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingChar(charId);
    try {
      const ext = file.name.split(".").pop();
      const path = `characters/${memberId}/${charId}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const finalUrl = `${publicUrl}?t=${Date.now()}`;
      
      cf(charId, "avatar_url", finalUrl);
      toast.success("Foto do personagem carregada! ✨");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setUploadingChar(null);
    }
  };

  /* ---------- save profile ---------- */
  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name:  profile.full_name,
      username:   profile.username,
      house:      profile.house,
      xp:         Number(profile.xp),
      level:      Number(profile.level),
      role:       profile.role,
      approved:   profile.approved,
      bio:        profile.bio || null,
      age:        profile.age ? Number(profile.age) : null,
      birth_date: profile.birth_date || null,
      avatar_url: profile.avatar_url || null,
    } as never).eq("user_id", memberId);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar perfil: " + error.message); return; }
    toast.success("Perfil salvo! ✨");
    onSaved();
  };

  /* ---------- save character ---------- */
  const saveChar = async (char: any) => {
    setSaving(true);
    const { id, user_id, created_at, updated_at, isNew, ...rest } = char;
    
    if (isNew) {
      const { error } = await supabase.from("characters").insert({
        user_id,
        ...rest,
        age: rest.age ? Number(rest.age) : null,
        xp:  rest.xp  ? Number(rest.xp)  : 0,
        level: rest.level ? Number(rest.level) : 1,
      } as never);
      setSaving(false);
      if (error) { toast.error("Erro ao criar ficha: " + error.message); return; }
      toast.success("Ficha criada com sucesso! 📜");
    } else {
      const { error } = await supabase.from("characters").update({
        ...rest,
        age: rest.age ? Number(rest.age) : null,
        xp:  rest.xp  ? Number(rest.xp)  : 0,
        level: rest.level ? Number(rest.level) : 1,
      } as never).eq("id", id);
      setSaving(false);
      if (error) { toast.error("Erro ao salvar ficha: " + error.message); return; }
      toast.success("Ficha salva! 📜");
    }
    onSaved();
    // Refresh characters
    const { data: c } = await supabase.from("characters").select("*").eq("user_id", memberId).order("created_at");
    if (c) setCharacters(c);
  };

  /* ---------- delete character ---------- */
  const deleteChar = async (charId: string) => {
    if (!confirm("Apagar esta ficha permanentemente?")) return;
    await supabase.from("characters").delete().eq("id", charId);
    setCharacters(prev => prev.filter(c => c.id !== charId));
    toast.success("Ficha apagada.");
    onSaved();
  };

  /* ---------- field helpers ---------- */
  const pf = (field: string, value: any) =>
    setProfile((p: any) => ({ ...p, [field]: value }));

  const cf = (charId: string, field: string, value: any) =>
    setCharacters(prev => prev.map(c => c.id === charId ? { ...c, [field]: value } : c));

  /* ---------- render ---------- */
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 glass rounded-2xl border border-border shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-heading text-xl text-gold-gradient">✏️ {memberName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Edição administrativa completa</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Carregando dados...</div>
        ) : (
          <div className="p-6 space-y-8">

            {/* === PERFIL PESSOAL COMPLETO === */}
            <section>
              <h3 className="font-heading text-base text-primary flex items-center gap-2 mb-4">
                <User size={16} /> Perfil Pessoal Completo
              </h3>

              {/* Avatar atual */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-secondary/30 rounded-xl border border-border">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/30" onError={e => (e.currentTarget.style.display = "none")} />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center text-2xl font-heading text-primary">
                    {profile.full_name?.[0] || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Avatar URL</p>
                  <input
                    value={profile.avatar_url || ""}
                    onChange={e => pf("avatar_url", e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Nome completo</label>
                  <Input value={profile.full_name || ""} onChange={e => pf("full_name", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Usuário (@)</label>
                  <Input value={profile.username || ""} onChange={e => pf("username", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Idade</label>
                  <Input type="number" value={profile.age || ""} onChange={e => pf("age", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Data de Nascimento</label>
                  <Input type="date" value={profile.birth_date || ""} onChange={e => pf("birth_date", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Casa</label>
                  <select
                    value={profile.house || ""}
                    onChange={e => pf("house", e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Sem casa</option>
                    {HOUSES.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Cargo (role)</label>
                  <select
                    value={profile.role || "member"}
                    onChange={e => pf("role", e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  >
                    <option value="member">Membro</option>
                    <option value="moderator">Moderador</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">XP total</label>
                  <Input type="number" value={profile.xp ?? 0} onChange={e => pf("xp", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Nível</label>
                  <Input type="number" value={profile.level ?? 1} onChange={e => pf("level", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">Bio / Apresentação</label>
                  <Textarea value={profile.bio || ""} onChange={e => pf("bio", e.target.value)} className="bg-secondary/50 min-h-[80px]" placeholder="Bio do membro..." />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={!!profile.approved}
                      onChange={e => pf("approved", e.target.checked)}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="text-foreground">Membro aprovado</span>
                  </label>
                </div>
              </div>
              <Button onClick={saveProfile} disabled={saving} variant="magical" className="mt-4 w-full">
                <Save size={14} className="mr-2" />
                {saving ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </section>

            {/* === FICHAS / PERSONAGENS === */}
            <section>
              <h3 className="font-heading text-base text-primary flex items-center gap-2 mb-4">
                <Scroll size={16} /> Fichas de Personagem ({characters.length})
              </h3>

              {characters.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <p className="text-muted-foreground text-sm mb-4">Este membro ainda não criou nenhuma ficha.</p>
                  <Button onClick={() => {
                    const newChar = {
                      id: `temp_${Date.now()}`,
                      user_id: memberId,
                      full_name: "Novo Personagem",
                      character_type: "oc",
                      house: "",
                      level: 1,
                      xp: 0,
                      isNew: true
                    };
                    setCharacters([...characters, newChar]);
                    setExpandedChar(newChar.id);
                  }} variant="magical" size="sm">
                    ✨ Criar Primeira Ficha
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end mb-4">
                  <Button onClick={() => {
                    const newChar = {
                      id: `temp_${Date.now()}`,
                      user_id: memberId,
                      full_name: "Novo Personagem",
                      character_type: "oc",
                      house: "",
                      level: 1,
                      xp: 0,
                      isNew: true
                    };
                    setCharacters([newChar, ...characters]);
                    setExpandedChar(newChar.id);
                  }} variant="outline" size="sm">
                    ➕ Nova Ficha
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {characters.map(char => (
                  <div key={char.id} className="glass rounded-xl border border-border/50 overflow-hidden">

                    {/* Char header */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                      onClick={() => setExpandedChar(expandedChar === char.id ? null : char.id)}
                    >
                      <SafeImage
                        src={char.avatar_url}
                        alt={char.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                        fallbackEmoji="🧙"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-foreground text-sm">{char.full_name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">
                          {char.character_type === "oc" ? "Original (OC)" : "Canon"} • {char.house || "Sem casa"} • Nível {char.level} • {char.xp} XP
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); deleteChar(char.id); }}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Apagar ficha"
                        >
                          <Trash2 size={14} />
                        </button>
                        {expandedChar === char.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Char edit form */}
                    {expandedChar === char.id && (
                      <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
                        {/* Basic */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Nome do Personagem</label>
                            <Input value={char.full_name || ""} onChange={e => cf(char.id, "full_name", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Tipo</label>
                            <select value={char.character_type || "oc"} onChange={e => cf(char.id, "character_type", e.target.value)}
                              className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground">
                              <option value="oc">Original (OC)</option>
                              <option value="canon">Canon</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Casa</label>
                            <select value={char.house || ""} onChange={e => cf(char.id, "house", e.target.value)}
                              className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground">
                              <option value="">Sem casa</option>
                              {HOUSES.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Idade</label>
                            <Input type="number" value={char.age || ""} onChange={e => cf(char.id, "age", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">XP do Personagem</label>
                            <Input type="number" value={char.xp ?? 0} onChange={e => cf(char.id, "xp", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Nível</label>
                            <Input type="number" value={char.level ?? 1} onChange={e => cf(char.id, "level", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Status Sanguíneo</label>
                            <Input value={char.blood_status || ""} onChange={e => cf(char.id, "blood_status", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Faceclaim (ator/atriz)</label>
                            <Input value={char.actor_faceclaim || ""} onChange={e => cf(char.id, "actor_faceclaim", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Varinha</label>
                            <Input value={char.wand || ""} onChange={e => cf(char.id, "wand", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Patrono</label>
                            <Input value={char.patronus || ""} onChange={e => cf(char.id, "patronus", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Feitiço Favorito</label>
                            <Input value={char.favorite_spell || ""} onChange={e => cf(char.id, "favorite_spell", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Matéria Favorita</label>
                            <Input value={char.favorite_class || ""} onChange={e => cf(char.id, "favorite_class", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Ponto Forte</label>
                            <Input value={char.strength || ""} onChange={e => cf(char.id, "strength", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Ponto Fraco</label>
                            <Input value={char.weakness || ""} onChange={e => cf(char.id, "weakness", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Medos</label>
                            <Input value={char.fears || ""} onChange={e => cf(char.id, "fears", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Sonhos</label>
                            <Input value={char.dreams || ""} onChange={e => cf(char.id, "dreams", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Segredos</label>
                            <Input value={char.secrets || ""} onChange={e => cf(char.id, "secrets", e.target.value)} className="bg-secondary/50" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Instagram (personagem)</label>
                            <Input value={char.instagram || ""} onChange={e => cf(char.id, "instagram", e.target.value)} className="bg-secondary/50" />
                          </div>
                        </div>

                        {/* Avatar / Foto */}
                        <div className="glass rounded-xl p-4 border border-primary/20 space-y-3">
                          <label className="text-xs font-heading text-primary flex items-center gap-2">
                            <ImageIcon size={14} /> Foto do Personagem (Avatar)
                          </label>
                          <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="w-20 h-20 rounded-xl border-2 border-border overflow-hidden bg-secondary flex items-center justify-center shrink-0 shadow-inner">
                              <SafeImage src={char.avatar_url} alt="Preview" className="w-full h-full object-cover" fallbackEmoji="🧙" />
                            </div>
                            <div className="flex-1 w-full space-y-2">
                              <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors text-sm font-heading text-primary">
                                <Upload size={16} />
                                {uploadingChar === char.id ? "Enviando..." : "Fazer Upload da Foto"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => handleCharAvatarUpload(e, char.id)}
                                  disabled={uploadingChar === char.id}
                                />
                              </label>
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground text-center">ou cole a URL direta abaixo</p>
                                <Input
                                  value={char.avatar_url || ""}
                                  onChange={e => cf(char.id, "avatar_url", e.target.value)}
                                  className="bg-secondary/50 text-xs"
                                  placeholder="https://exemplo.com/foto.jpg"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Personality */}
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Personalidade</label>
                          <Textarea value={char.personality || ""} onChange={e => cf(char.id, "personality", e.target.value)} className="bg-secondary/50 min-h-[80px]" />
                        </div>

                        {/* Quotes */}
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Citações / Quotes</label>
                          <Textarea value={char.quotes || ""} onChange={e => cf(char.id, "quotes", e.target.value)} className="bg-secondary/50 min-h-[60px]" />
                        </div>

                        <Button onClick={() => saveChar(char)} disabled={saving} variant="magical" className="w-full">
                          <Save size={14} className="mr-2" />
                          {saving ? "Salvando..." : "Salvar Ficha"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
