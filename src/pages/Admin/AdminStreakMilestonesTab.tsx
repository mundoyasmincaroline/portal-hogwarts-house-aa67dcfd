import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Milestone = {
  id: string;
  days_required: number;
  xp_bonus: number;
  galeons_bonus: number;
  label: string;
  active: boolean;
};

export function AdminStreakMilestonesTab() {
  const [items, setItems] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [novo, setNovo] = useState({ days_required: 0, xp_bonus: 0, galeons_bonus: 0, label: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("rp_streak_milestones")
      .select("*")
      .order("days_required", { ascending: true });
    setItems((data as Milestone[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (m: Milestone) => {
    const { error } = await (supabase as any)
      .from("rp_streak_milestones")
      .update({
        days_required: m.days_required,
        xp_bonus: m.xp_bonus,
        galeons_bonus: m.galeons_bonus,
        label: m.label,
        active: m.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", m.id);
    if (error) toast.error(error.message);
    else { toast.success("Marco atualizado ✨"); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este marco?")) return;
    const { error } = await (supabase as any).from("rp_streak_milestones").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Marco removido."); load(); }
  };

  const create = async () => {
    if (!novo.days_required || novo.days_required <= 0) return toast.error("Informe o número de dias.");
    const { error } = await (supabase as any).from("rp_streak_milestones").insert({
      days_required: novo.days_required,
      xp_bonus: novo.xp_bonus,
      galeons_bonus: novo.galeons_bonus,
      label: novo.label || `Marco de ${novo.days_required} dias`,
      active: true,
    });
    if (error) toast.error(error.message);
    else { toast.success("Marco criado ✨"); setNovo({ days_required: 0, xp_bonus: 0, galeons_bonus: 0, label: "" }); load(); }
  };

  const updateField = (id: string, field: keyof Milestone, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h2 className="font-heading text-xl text-primary mb-4">🔥 Marcos de Sequência (Streak)</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Configure os dias necessários para cada marco e os bônus de XP/Galeões. Base diária fixa: <b>+10 XP / +2 🪙</b>.
        </p>

        {loading ? (
          <p className="text-center text-muted-foreground animate-pulse">Carregando marcos...</p>
        ) : (
          <div className="space-y-3">
            {items.map(m => (
              <div key={m.id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl border border-border/50 bg-card/30">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase text-muted-foreground">Dias</label>
                  <Input type="number" value={m.days_required}
                    onChange={e => updateField(m.id, "days_required", parseInt(e.target.value) || 0)} />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] uppercase text-muted-foreground">XP</label>
                  <Input type="number" value={m.xp_bonus}
                    onChange={e => updateField(m.id, "xp_bonus", parseInt(e.target.value) || 0)} />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] uppercase text-muted-foreground">Galeões</label>
                  <Input type="number" value={m.galeons_bonus}
                    onChange={e => updateField(m.id, "galeons_bonus", parseInt(e.target.value) || 0)} />
                </div>
                <div className="col-span-4">
                  <label className="text-[10px] uppercase text-muted-foreground">Rótulo</label>
                  <Input value={m.label} onChange={e => updateField(m.id, "label", e.target.value)} />
                </div>
                <div className="col-span-2 flex flex-col gap-1 pt-4">
                  <Button size="sm" variant="magical" onClick={() => save(m)}>Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => { updateField(m.id, "active", !m.active); save({ ...m, active: !m.active }); }}>
                    {m.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(m.id)}>🗑️</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <h3 className="font-heading text-sm text-primary">➕ Adicionar novo marco</h3>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-2"><Input type="number" placeholder="Dias" value={novo.days_required || ""} onChange={e => setNovo({ ...novo, days_required: parseInt(e.target.value) || 0 })} /></div>
            <div className="col-span-2"><Input type="number" placeholder="XP" value={novo.xp_bonus || ""} onChange={e => setNovo({ ...novo, xp_bonus: parseInt(e.target.value) || 0 })} /></div>
            <div className="col-span-2"><Input type="number" placeholder="Galeões" value={novo.galeons_bonus || ""} onChange={e => setNovo({ ...novo, galeons_bonus: parseInt(e.target.value) || 0 })} /></div>
            <div className="col-span-4"><Input placeholder="Rótulo (ex: Semana mágica)" value={novo.label} onChange={e => setNovo({ ...novo, label: e.target.value })} /></div>
            <div className="col-span-2"><Button variant="magical" className="w-full" onClick={create}>Criar</Button></div>
          </div>
        </div>
      </div>
    </div>
  );
}