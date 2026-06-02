import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Newspaper, RefreshCw } from "lucide-react";

type Article = {
  id: string;
  title: string;
  content: string;
  category: string;
  generated_at: string;
};

export default function ProphetDaily() {
  const { isAdmin } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("prophet_articles")
      .select("*")
      .eq("published", true)
      .order("generated_at", { ascending: false })
      .limit(20);
    setArticles((data || []) as Article[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("magical-ai", {
      body: {
        mode: "prophet",
        messages: [
          {
            role: "user",
            content:
              "Gere a manchete de hoje sobre algo acontecendo em Hogwarts neste momento. Devolva APENAS JSON válido, sem markdown.",
          },
        ],
      },
    });
    if (error || (data as any)?.error) {
      setGenerating(false);
      toast.error((data as any)?.error || error?.message || "Falha");
      return;
    }
    try {
      const raw = (data as any).content as string;
      const json = JSON.parse(raw.replace(/^```json\s*/, "").replace(/```$/, "").trim());
      const { error: insErr } = await supabase.from("prophet_articles").insert({
        title: json.title,
        content: json.content,
        category: json.category || "geral",
      });
      if (insErr) throw insErr;
      toast.success("Edição extra publicada!");
      load();
    } catch (e: any) {
      toast.error("Erro ao publicar: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-4xl text-primary flex items-center gap-3">
            <Newspaper className="w-9 h-9" /> O Profeta Diário
          </h1>
          <p className="text-muted-foreground mt-1 italic">"Onde a verdade encontra a magia"</p>
        </div>
        {isAdmin && (
          <Button onClick={generate} disabled={generating}>
            <RefreshCw className={`w-4 h-4 mr-1 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Gerando..." : "Nova edição IA"}
          </Button>
        )}
      </header>

      {loading && <p className="text-center text-muted-foreground">Carregando...</p>}
      {!loading && articles.length === 0 && (
        <Card className="p-8 text-center bg-card/40">
          <p className="text-muted-foreground">Sem edições publicadas ainda.</p>
        </Card>
      )}

      <div className="space-y-4">
        {articles.map((a) => (
          <Card key={a.id} className="p-6 bg-card/60 border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {a.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(a.generated_at).toLocaleString("pt-BR")}
              </span>
            </div>
            <h2 className="font-heading text-2xl text-primary mb-3">{a.title}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">{a.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}