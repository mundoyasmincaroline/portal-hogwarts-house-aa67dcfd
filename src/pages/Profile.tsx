import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { HOUSES, getLevelFromXP } from "@/lib/store";
import HouseCrest from "@/components/HouseCrest";
import XPBar from "@/components/XPBar";
import MedalBadge, { getMedalForXP } from "@/components/MedalBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Profile() {
  const { profile, user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    age: profile?.age || 11,
  });
  const [uploading, setUploading] = useState(false);

  if (!profile) return null;
  const house = HOUSES[profile.house];
  const levelInfo = getLevelFromXP(profile.xp);

  const startEdit = () => {
    setForm({ full_name: profile.full_name, username: profile.username, bio: profile.bio || "", age: profile.age || 11 });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const result = await updateProfile(form);
    setSaving(false);
    if (result.success) {
      toast.success("Perfil atualizado! ✨");
      setEditing(false);
    } else {
      toast.error(result.error || "Erro ao salvar");
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await updateProfile({ avatar_url: publicUrl });
    setUploading(false);
    toast.success("Foto atualizada!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-8 text-center">
        <div className="relative inline-block mb-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-24 h-24 rounded-full object-cover animate-pulse-glow" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary flex items-center justify-center text-4xl font-heading text-primary animate-pulse-glow">
              {profile.full_name[0]}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1">
            <HouseCrest house={profile.house} size="sm" />
          </div>
          <label className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" title="Trocar foto">
            📷
            <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
          </label>
        </div>

        {!editing ? (
          <>
            <h1 className="font-heading text-2xl text-foreground flex items-center justify-center gap-2">
              {profile.full_name}
              <MedalBadge xp={profile.xp} />
            </h1>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
            <p className="text-sm text-muted-foreground mt-3 font-serif italic">{profile.bio || "Sem bio ainda..."}</p>
            <Button variant="magical" size="sm" className="mt-4 font-heading text-xs" onClick={startEdit}>
              ✏️ Editar perfil
            </Button>
          </>
        ) : (
          <div className="space-y-3 text-left">
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">Nome completo</label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">@Username</label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })} />
            </div>
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">Idade</label>
              <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 11 })} />
            </div>
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">Bio</label>
              <textarea
                value={form.bio}
                maxLength={200}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none min-h-[80px]"
              />
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button variant="magical" size="sm" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-primary">{profile.xp}</p>
          <p className="text-xs text-muted-foreground">XP Total</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{levelInfo.level}</p>
          <p className="text-xs text-muted-foreground">Nível</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{getMedalForXP(profile.xp) ? 1 : 0}</p>
          <p className="text-xs text-muted-foreground">Badges</p>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-3">Progresso</h3>
        <XPBar xp={profile.xp} />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {levelInfo.name} → Faltam {levelInfo.next - profile.xp} XP para o próximo nível
        </p>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-3">
          <HouseCrest house={profile.house} size="md" />
          <div>
            <h3 className="font-heading text-foreground">{house.name}</h3>
            <p className="text-xs text-muted-foreground italic font-serif">"{house.motto}"</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-3">Informações</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Idade</span>
            <span className="text-foreground">{profile.age} anos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Membro desde</span>
            <span className="text-foreground">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="text-foreground">{profile.online ? "🟢 Online" : "⚫ Offline"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
