import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Smartphone, Sparkles } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Prefs = {
  in_app: boolean;
  daily_digest: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
};

const DEFAULT: Prefs = {
  in_app: true,
  daily_digest: true,
  email_enabled: false,
  push_enabled: false,
  quiet_hours_start: 22,
  quiet_hours_end: 7,
};

export default function NotificationPreferences() {
  const user = useAuth((s) => s.user);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setPrefs(data as Prefs);
      setLoading(false);
    })();
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Preferências salvas! 🦉");
  };

  const update = <K extends keyof Prefs>(k: K, v: Prefs[K]) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <header>
        <h1 className="font-heading text-4xl text-primary flex items-center gap-3">
          <EmojiIcon e="🦉" /> Coruja Postal
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure como o castelo entrega suas mensagens importantes.
        </p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Card className="p-6 bg-card/60 border-primary/30 space-y-5">
          <Row
            icon={<Bell className="w-5 h-5" />}
            title="Notificações no app"
            desc="Sino do topo da tela com novidades em tempo real"
            value={prefs.in_app}
            onChange={(v) => update("in_app", v)}
          />
          <Row
            icon={<Sparkles className="w-5 h-5" />}
            title="Resumo diário"
            desc="Coruja matinal com tudo que aconteceu enquanto você dormia"
            value={prefs.daily_digest}
            onChange={(v) => update("daily_digest", v)}
          />
          <Row
            icon={<Mail className="w-5 h-5" />}
            title="E-mail"
            desc="Recebe avisos críticos (mentoria, torneios, conta) por e-mail"
            value={prefs.email_enabled}
            onChange={(v) => update("email_enabled", v)}
          />
          <Row
            icon={<Smartphone className="w-5 h-5" />}
            title="Notificações push"
            desc="Alertas no navegador mesmo com o portal fechado"
            value={prefs.push_enabled}
            onChange={(v) => update("push_enabled", v)}
          />

          <div className="border-t border-primary/10 pt-4">
            <p className="font-heading text-sm text-primary mb-2">Horário silencioso</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Das</span>
              <input
                type="number"
                min={0}
                max={23}
                className="w-16 bg-background border border-primary/30 rounded px-2 py-1"
                value={prefs.quiet_hours_start}
                onChange={(e) => update("quiet_hours_start", parseInt(e.target.value || "0"))}
              />
              <span className="text-muted-foreground">h até</span>
              <input
                type="number"
                min={0}
                max={23}
                className="w-16 bg-background border border-primary/30 rounded px-2 py-1"
                value={prefs.quiet_hours_end}
                onChange={(e) => update("quiet_hours_end", parseInt(e.target.value || "0"))}
              />
              <span className="text-muted-foreground">h</span>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Salvar preferências"}
          </Button>
        </Card>
      )}
    </div>
  );
}

function Row({
  icon,
  title,
  desc,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="text-primary mt-1">{icon}</div>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}