import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const HOUSE_COLORS: Record<string, string> = {
  gryffindor: "#c9302c",
  slytherin: "#1a7a4c",
  ravenclaw: "#2563eb",
  hufflepuff: "#facc15",
};

export default function AdminAnalytics() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [daily, setDaily] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: d }, { data: h }, { data: c }, { data: f }] = await Promise.all([
        supabase.from("analytics_daily_active" as any).select("*"),
        supabase.from("analytics_house_distribution" as any).select("*"),
        supabase.from("analytics_retention_cohorts" as any).select("*"),
        supabase.from("analytics_vip_funnel" as any).select("*").maybeSingle(),
      ]);
      setDaily((d as any) || []);
      setHouses((h as any) || []);
      setCohorts((c as any) || []);
      setFunnel(f);
    })();
  }, [isAdmin]);

  if (isAdmin === false) {
    return (
      <div className="text-center py-24">
        <p className="text-6xl">🚫</p>
        <p className="font-heading text-2xl text-red-400 mt-3">Acesso restrito</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>
          Voltar
        </Button>
      </div>
    );
  }

  const conversionRate = funnel
    ? ((funnel.vip_users / Math.max(1, funnel.total_users)) * 100).toFixed(2)
    : "0";

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header>
        <h1 className="font-heading text-2xl sm:text-3xl text-gold-gradient">📊 Analytics & Insights</h1>
        <p className="text-muted-foreground text-sm">
          Comportamento da geração, retenção e conversão VIP
        </p>
      </header>

      {funnel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Bruxos totais" value={funnel.total_users} />
          <Stat label="VIPs ativos" value={funnel.vip_users} />
          <Stat label="Conversão VIP" value={`${conversionRate}%`} />
          <Stat
            label="Receita lifetime"
            value={`R$ ${Number(funnel.lifetime_revenue_brl || 0).toFixed(2)}`}
          />
        </div>
      )}

      <Card className="p-4 sm:p-6 bg-card/60 border-primary/30">
        <h2 className="font-heading text-lg text-primary mb-3">Atividade diária (30d)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={daily}>
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary)/0.3)" }} />
            <Line type="monotone" dataKey="active_users" stroke="#c9a84c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-6 bg-card/60 border-primary/30">
          <h2 className="font-heading text-lg text-primary mb-3">Distribuição por casa</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={houses}
                dataKey="total"
                nameKey="house"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(e) => e.house}
              >
                {houses.map((h, i) => (
                  <Cell key={i} fill={HOUSE_COLORS[h.house] || "#888"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary)/0.3)" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-6 bg-card/60 border-primary/30">
          <h2 className="font-heading text-lg text-primary mb-3">Cohorts de retenção (semana)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cohorts}>
              <XAxis dataKey="cohort_week" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary)/0.3)" }} />
              <Bar dataKey="signups" fill="hsl(var(--muted))" />
              <Bar dataKey="still_active" fill="#c9a84c" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4 bg-card/60 border-primary/30 text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-primary mt-1">{value}</p>
    </Card>
  );
}