import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Newspaper, RefreshCw, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiIcon from "@/components/shared/EmojiIcon";

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

      <div className="overflow-hidden mb-6 relative group">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="w-full h-48 sm:h-64 bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center border border-primary/20"
        >
          <div className="text-center p-4">
            <Newspaper className="w-12 h-12 text-primary/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-serif">A imagem parece se mover levemente...</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-primary/5 border-y border-primary/20 py-2 overflow-hidden mb-6">
        <motion.div 
          animate={{ x: ["100%", "-100%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="whitespace-nowrap font-heading text-xs text-primary uppercase tracking-widest"
        >
          +++ URGENTE: AVISTAMENTOS DE TESTRÁLIOS NOS CAMPOS DE HOGWARTS +++ MINISTÉRIO DA MAGIA ALERTA PARA POSSÍVEIS ATAQUES DE COMERÇAIS DA MORTE +++
        </motion.div>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {articles.map((a, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={a.id} 
              className="p-8 rounded-[2rem] bg-[#f4ebd0] border-2 border-amber-900/10 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-mathematics.png')] opacity-10 pointer-events-none" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <Badge variant="outline" className="bg-amber-900/5 text-amber-900 border-amber-900/20 px-3 py-1 font-heading text-[10px] uppercase tracking-widest">
                  {a.category}
                </Badge>
                <span className="text-[10px] font-mono text-amber-900/60 uppercase tracking-tighter">
                  {new Date(a.generated_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <h2 className="font-heading text-3xl text-amber-950 mb-4 tracking-tighter leading-tight relative z-10 group-hover:text-amber-800 transition-colors">{a.title}</h2>
              <div className="h-px w-full bg-amber-900/10 mb-6 relative z-10" />
              <p className="whitespace-pre-line text-sm leading-relaxed text-amber-900/80 font-serif italic relative z-10">{a.content}</p>
              
              <div className="mt-8 flex justify-between items-center relative z-10">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-amber-900/60 hover:text-amber-900">
                    <Sparkles className="w-3 h-3 mr-1" /> Encantar
                  </Button>
                </div>
                <div className="text-[8px] font-heading text-amber-900/40 uppercase tracking-[0.3em]">Hogwarts House Press</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}