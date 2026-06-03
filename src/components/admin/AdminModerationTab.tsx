import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import EmojiIcon from "@/components/shared/EmojiIcon";

export function AdminModerationTab() {
  const [bannedWords, setBannedWords] = useState<any[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchWords = async () => {
    setLoading(true);
    const { data } = await supabase.from("banned_words").select("*").order("word", { ascending: true });
    setBannedWords(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchWords(); }, []);

  const addWord = async () => {
    if (!newWord.trim()) return;
    const { error } = await supabase.from("banned_words").insert({ word: newWord.trim().toLowerCase() } as any);
    if (error) {
      if (error.code === "23505") toast.error("Palavra já existe");
      else toast.error("Erro ao adicionar");
      return;
    }
    setNewWord("");
    toast.success("Palavra adicionada");
    fetchWords();
  };

  const removeWord = async (id: string) => {
    const { error } = await supabase.from("banned_words").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    toast.success("Removida");
    fetchWords();
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-2xl border-white/5">
        <h3 className="font-heading text-lg mb-4 text-gold-gradient">Filtro de Linguagem (Censor do Filch)</h3>
        <p className="text-sm text-muted-foreground mb-6">Palavras adicionadas aqui serão automaticamente bloqueadas em posts e comentários no Salão Principal.</p>
        
        <div className="flex gap-2 mb-8">
          <Input 
            value={newWord} 
            onChange={e => setNewWord(e.target.value)} 
            placeholder="Nova palavra proibida..." 
            className="bg-background/50"
            onKeyDown={e => e.key === "Enter" && addWord()}
          />
          <Button variant="magical" onClick={addWord}>Adicionar</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {loading ? (
            <p className="col-span-full text-center py-10 text-muted-foreground">Carregando dicionário...</p>
          ) : bannedWords.length === 0 ? (
            <p className="col-span-full text-center py-10 text-muted-foreground italic">Nenhuma palavra bloqueada ainda.</p>
          ) : (
            bannedWords.map(w => (
              <div key={w.id} className="bg-secondary/30 rounded-lg px-3 py-2 flex items-center justify-between border border-white/5">
                <span className="text-sm">{w.word}</span>
                <button onClick={() => removeWord(w.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <EmojiIcon e="×" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border-white/5">
        <h3 className="font-heading text-lg mb-4 text-gold-gradient">Regras de Moderação Automática</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl">
            <div>
              <p className="text-sm font-heading">Anti-Capslock</p>
              <p className="text-xs text-muted-foreground">Bloqueia mensagens curtas inteiramente em maiúsculas.</p>
            </div>
            <span className="text-xs font-bold text-green-500">ATIVO</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl">
            <div>
              <p className="text-sm font-heading">Anti-Spam (Caracteres Repetidos)</p>
              <p className="text-xs text-muted-foreground">Bloqueia repetição excessiva de letras (ex: "aaaaaa").</p>
            </div>
            <span className="text-xs font-bold text-green-500">ATIVO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
