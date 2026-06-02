import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface Prophecy { id:string; title:string; body:string; condition_hint:string|null; fulfilled:boolean; fulfilled_at:string|null; created_at:string; }

export default function LegendaryProphecies() {
  const [list, setList] = useState<Prophecy[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("legendary_prophecies")
      .select("*")
      .eq("user_id", u.user.id)
      .order("created_at", { ascending: false });
    setList((data as Prophecy[]) || []);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Faça login");
      const { data: prof } = await supabase.from("profiles").select("full_name, house, level").eq("user_id", u.user.id).maybeSingle();
      const ctx = `Bruxo: ${prof?.full_name || "Anônimo"}, Casa: ${prof?.house || "Indefinida"}, Nível: ${prof?.level || 1}`;
      const { data, error } = await supabase.functions.invoke("magical-ai", {
        body: { mode: "prophecy", messages: [{ role: "user", content: `Gere uma profecia épica e enigmática para este bruxo. ${ctx}. Responda com JSON: {"title":"...","body":"...","condition":"pista do que precisa acontecer para ser cumprida"}` }] },
      });
      if (error) throw error;
      let parsed: any = {};
      try {
        const raw = String(data?.content || "").replace(/```json|```/g, "").trim();
        parsed = JSON.parse(raw);
      } catch {
        parsed = { title: "Profecia Lendária", body: data?.content || "", condition: null };
      }
      const { error: insErr } = await supabase.from("legendary_prophecies").insert({
        user_id: u.user.id,
        title: parsed.title || "Profecia Lendária",
        body: parsed.body || String(data?.content || ""),
        condition_hint: parsed.condition || null,
      });
      if (insErr) throw insErr;
      toast.success("Uma nova profecia foi revelada...");
      load();
    } catch (e: any) {
      toast.error(e.message || "Falha ao consultar o oráculo");
    } finally {
      setBusy(false);
    }
  };

  const fulfill = async (id: string) => {
    const { error } = await supabase.from("legendary_prophecies").update({ fulfilled: true, fulfilled_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profecia cumprida!");
    load();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl">Profecias Lendárias</h1>
            <p className="text-sm text-foreground/60">O oráculo revela seu destino épico.</p>
          </div>
        </div>
        <Button onClick={generate} disabled={busy} className="w-full sm:w-auto">{busy ? "Consultando o véu..." : "Invocar Profecia"}</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {list.map((p) => (
          <Card key={p.id} className={`border ${p.fulfilled ? "border-primary/60" : "border-border/50"} bg-card/60`}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <CardTitle className="font-heading text-lg">{p.title}</CardTitle>
              {p.fulfilled && <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />Cumprida</Badge>}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="italic text-foreground/80 whitespace-pre-line">{p.body}</p>
              {p.condition_hint && <p className="text-xs text-foreground/60">🔮 {p.condition_hint}</p>}
              {!p.fulfilled && <Button size="sm" variant="outline" onClick={() => fulfill(p.id)}>Marcar como cumprida</Button>}
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && <p className="text-foreground/60">O véu do destino ainda não foi rasgado para você. Invoque sua primeira profecia.</p>}
      </div>
    </div>
  );
}