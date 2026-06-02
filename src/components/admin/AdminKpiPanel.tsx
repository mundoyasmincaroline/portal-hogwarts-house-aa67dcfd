import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, UserCheck, Sparkles, AlertTriangle, ShoppingBag, Trophy, Coins } from "lucide-react";

type KPI = {
  total_wizards: number;
  approved_wizards: number;
  new_week: number;
  flags_week: number;
  market_active: number;
  tournaments_active: number;
  revenue_month_brl: number;
};

export default function AdminKpiPanel() {
  const [k, setK] = useState<KPI | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("admin_kpis" as any).select("*").maybeSingle();
      if (data) setK(data as any);
    })();
  }, []);

  if (!k) return null;

  const items = [
    { icon: Users, label: "Bruxos totais", value: k.total_wizards, color: "text-blue-400" },
    { icon: UserCheck, label: "Aprovados", value: k.approved_wizards, color: "text-green-400" },
    { icon: Sparkles, label: "Novos (7d)", value: k.new_week, color: "text-pink-400" },
    { icon: AlertTriangle, label: "Sinalizações (7d)", value: k.flags_week, color: "text-red-400" },
    { icon: ShoppingBag, label: "Mercado ativo", value: k.market_active, color: "text-purple-400" },
    { icon: Trophy, label: "Torneios ativos", value: k.tournaments_active, color: "text-yellow-400" },
    {
      icon: Coins,
      label: "Receita do mês",
      value: `R$ ${Number(k.revenue_month_brl || 0).toFixed(2)}`,
      color: "text-emerald-400",
    },
  ];

  return (
    <Card className="p-4 bg-card/60 border-primary/30">
      <h2 className="font-heading text-sm text-primary mb-3 uppercase tracking-wider">
        Visão do Ministério
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="bg-background/40 rounded p-3 text-center">
              <Icon className={`w-5 h-5 mx-auto ${it.color}`} />
              <p className="text-lg font-bold mt-1">{it.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {it.label}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}