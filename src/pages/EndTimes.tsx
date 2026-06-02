import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Crown, Star } from "lucide-react";

interface Legend { user_id:string; prestige:number; legend_title:string; ascensions:number; bonus_xp_multiplier:number; last_ascended_at:string|null; }

export default function EndTimes() {
  const [legend, setLegend] = useState<Legend | null>(null);
  const [level, setLevel] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [{ data: l }, { data: p }] = await Promise.all([
      supabase.from("user_legend").select("*").eq("user_id", u.user.id).maybeSingle(),
      supabase.from("profiles").select("level").eq("user_id", u.user.id).maybeSingle(),
    ]);
    setLegend((l as Legend) || null);
    setLevel((p as any)?.level || 0);
  };
  useEffect(() => { load(); }, []);

  const ascend = async () => {
    if (!confirm("Ascender resetará seu nível para 1 mas multiplicará seu XP futuro. Continuar?")) return;
    setBusy(true);
    const { error } = await supabase.rpc("ascend_to_legend");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Você ascendeu! Seu nome viverá para sempre.");
    load();
  };

  const canAscend = level >= 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl">Final dos Tempos</h1>
          <p className="text-sm text-foreground/60">Ao atingir o nível 100, ascenda como Lenda e recomece com glória.</p>
        </div>
      </div>

      <Card className="border-primary/50 bg-card/60">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            {legend?.legend_title || "Bruxo Comum"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Badge variant="secondary">Prestígio: {legend?.prestige || 0}</Badge>
            <Badge variant="secondary">Ascensões: {legend?.ascensions || 0}</Badge>
            <Badge>XP × {Number(legend?.bonus_xp_multiplier || 1).toFixed(2)}</Badge>
          </div>
          <div>
            <p className="text-sm text-foreground/70 mb-1">Progresso até a próxima ascensão (Nv. {level}/100)</p>
            <Progress value={Math.min(100, level)} className="h-3" />
          </div>
          <Button size="lg" disabled={!canAscend || busy} onClick={ascend} className="w-full">
            {canAscend ? "🌟 Ascender ao Panteão das Lendas" : `Atinja o nível 100 (faltam ${100 - level})`}
          </Button>
          {legend?.last_ascended_at && (
            <p className="text-xs text-foreground/60">Última ascensão: {new Date(legend.last_ascended_at).toLocaleString("pt-BR")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/40">
        <CardHeader><CardTitle className="font-heading text-lg">O que você ganha ao ascender?</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground/70">
          <p>✨ +10% de XP permanente por ascensão (acumulativo)</p>
          <p>👑 Título de Lenda visível em toda a comunidade</p>
          <p>🏆 Lugar eterno na história de Hogwarts</p>
          <p className="text-destructive">⚠ Seu nível e XP serão resetados — mas seu prestígio permanece para sempre.</p>
        </CardContent>
      </Card>
    </div>
  );
}