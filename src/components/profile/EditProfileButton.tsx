import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

export default function EditProfileButton({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(profile.bio || "");
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [saving, setSaving] = useState(false);
  const { fetchProfile, user } = useAuth() as any;

  const save = async () => {
    if (!fullName.trim()) { toast.error("Nome não pode ficar vazio."); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ bio: bio.trim(), full_name: fullName.trim() } as any)
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Perfil atualizado!");
    setOpen(false);
    if (user?.id && fetchProfile) await fetchProfile(user.id);
    onSaved();
  };

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="mt-4 gap-2 border-white/10 glass"
        onClick={() => setOpen(true)}
      >
        <Pencil size={14} /> Editar Perfil
      </Button>
    );
  }

  return (
    <div className="mt-5 space-y-3 max-w-sm mx-auto text-left">
      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nome</label>
        <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nome" maxLength={60} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Bio</label>
        <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Conte algo sobre você…" rows={3} maxLength={280} />
        <p className="text-[10px] text-muted-foreground/60 text-right mt-1">{bio.length}/280</p>
      </div>
      <div className="flex gap-2 justify-center">
        <Button size="sm" variant="magical" onClick={save} disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}