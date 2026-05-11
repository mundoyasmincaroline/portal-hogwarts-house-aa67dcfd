import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { RefreshCw, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HOUSES, type House } from "@/lib/store";

interface Character {
  id: string;
  full_name: string;
  avatar_url: string | null;
  house: string | null;
  character_type: string | null;
  level: number | null;
}

export default function TurnSwitcher() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("characters")
      .select("id, full_name, avatar_url, house, character_type, level")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setChars((data as Character[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open, user?.id]);

  const switchTo = async (charId: string) => {
    if (!user || charId === profile?.active_character_id) { setOpen(false); return; }
    setSwitching(charId);
    const { error } = await supabase
      .from("profiles")
      .update({ active_character_id: charId } as never)
      .eq("user_id", user.id);
    setSwitching(null);
    if (error) {
      toast.error("Não foi possível girar o turno.");
      return;
    }
    const target = chars.find(c => c.id === charId);
    useAuth.setState((s) => ({
      profile: s.profile ? {
        ...s.profile,
        active_character_id: charId,
        house: (target?.house as any) ?? s.profile.house,
      } : null
    }));
    toast.success(`✨ Turno: ${target?.full_name}`);
    setOpen(false);
    // suave: força os feeds a relerem dependentes
    setTimeout(() => window.location.reload(), 350);
  };

  const activeId = profile?.active_character_id;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-1.5 text-muted-foreground hover:bg-secondary/80 hover:text-primary rounded-md transition-colors"
          title="Botão de Giro · Trocar turno"
        >
          <RefreshCw size={14} className={switching ? "animate-spin" : ""} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2 bg-card border-primary/20">
        <div className="px-2 py-2 mb-1 border-b border-border/40">
          <p className="text-[10px] font-heading uppercase tracking-[0.2em] text-primary">Botão de Giro</p>
          <p className="text-xs text-muted-foreground italic">Quem você será neste turno?</p>
        </div>

        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Lendo registros…</div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {chars.map((c) => {
              const isActive = c.id === activeId;
              const houseInfo = c.house ? HOUSES[c.house as House] : null;
              return (
                <button
                  key={c.id}
                  onClick={() => switchTo(c.id)}
                  disabled={!!switching}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left ${
                    isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/60 border border-transparent"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary shrink-0 border border-border/40">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt={c.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-base">🧙</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-heading truncate text-foreground">{c.full_name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                      {c.character_type === "canon" ? "Canon" : "OC"} · {houseInfo?.name ?? "Sem Casa"} · Nv {c.level ?? 1}
                    </p>
                  </div>
                  {isActive && <Check size={14} className="text-primary shrink-0" />}
                </button>
              );
            })}

            {chars.length < 2 && (
              <button
                onClick={() => { setOpen(false); navigate("/dashboard/profile"); }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Plus size={14} className="text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-heading text-foreground">Nova Ficha</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Crie outro personagem</p>
                </div>
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}